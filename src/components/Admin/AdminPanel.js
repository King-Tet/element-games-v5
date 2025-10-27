import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '@/app/admin/AdminPage.module.css'; // Make sure this path is correct

const AdminPanel = () => {
  const WEBSOCKET_URL = 'wss://admin-client.deno.dev';

  // --- State Management ---
  const [isConnected, setIsConnected] = useState(false);
  const [clients, setClients] = useState(new Map()); // Map<string, { id: string, info: any }>
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [fullscreenImage, setFullscreenImage] = useState(null); // Stores { clientId, clientName, imageData }

  const socketRef = useRef(null);

  // --- Helper Functions ---
  const addLog = useCallback((prefix, message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    // Use functional update for setLogs to avoid needing logs as a dependency elsewhere
    setLogs(prevLogs => [{ timestamp, prefix, message, type }, ...prevLogs].slice(0, 100)); // Keep max 100 logs
  }, []); // Empty dependency array means this function reference is stable

  // --- Message Handling ---
  const handleSocketMessage = useCallback((message) => {
    // Destructure common properties first
    const { type, id, data } = message; // 'id' and 'data' might be undefined for some types

    switch (type) {
      case 'client_list':
        // Safely access data, provide default if missing
        const clientListData = data || [];
        // Use functional update for setClients
        setClients(new Map(clientListData.map(c => [c.id, c.info || { browser: 'N/A', displayName: c.id /* Fallback */ }])));
        addLog('SYSTEM', `Received initial client list with ${clientListData.length} client(s).`, 'info');
        break;
      case 'client_connect':
         // Safely access data, provide default if missing
        if (!data || !data.id) {
            addLog('ERROR', 'Received invalid client_connect message (missing data or id).', 'error');
            return;
        }
        const connectInfo = data.info || { browser: 'N/A', displayName: data.id /* Fallback */};
         // Use functional update for setClients
        setClients(prev => new Map(prev).set(data.id, connectInfo));
        addLog('CLIENT', `Client connected: ${connectInfo.displayName || data.id}`, 'success');
        break;
      case 'client_disconnect':
         // 'id' comes from the top level for disconnect message
        if (!id) {
            addLog('ERROR', 'Received invalid client_disconnect message (missing id).', 'error');
            return;
        }
        // Need current client info for the log message *before* deleting
        let disconnectedClientDisplayName = id; // Fallback to id
        setClients(prev => {
          const info = prev.get(id);
          if (info?.displayName) {
              disconnectedClientDisplayName = info.displayName;
          }
          const newClients = new Map(prev);
          newClients.delete(id);
          return newClients;
        });
        // Use functional update for setSelectedClients
        setSelectedClients(prev => {
            const newSelection = new Set(prev);
            newSelection.delete(id);
            return newSelection;
        });
        addLog('CLIENT', `Client disconnected: ${disconnectedClientDisplayName}`, 'error');
        break;
      case 'screenshot_response':
         // 'id' and 'data' are expected
        if (!id || !data || !data.image) {
             addLog('ERROR', 'Received invalid screenshot_response message.', 'error');
             return;
        }
         // Access clients state via functional update if needed, but here reading might be complex
         // A potential solution is storing name temporarily or using a ref if absolutely needed
         // For simplicity, we'll log based on potentially stale data or just the ID if complex
        let screenshotClientName = id; // Fallback
        setClients(prev => { // Read inside functional update to get latest
            const info = prev.get(id);
            if (info?.displayName) screenshotClientName = info.displayName;
            return prev; // No actual change needed here
        })
        // Use functional update for setScreenshots
        setScreenshots(prev => [...prev, { clientId: id, clientName: screenshotClientName, imageData: data.image }]);
        addLog('RESPONSE', `Screenshot received from ${screenshotClientName}`, 'success');
        break;
      case 'action_confirmation':
         // 'id' and 'data' are expected
         if (!id || !data) {
             addLog('ERROR', 'Received invalid action_confirmation message.', 'error');
             return;
         }
        // Similar challenge as above for getting display name accurately without dependency
        let confirmClientName = id; // Fallback
         setClients(prev => {
             const info = prev.get(id);
             if (info?.displayName) confirmClientName = info.displayName;
             return prev;
         })
        const logType = data.status === 'success' ? 'success' : 'error';
        addLog('CONFIRM', `[${confirmClientName}] ${data.action} -> ${data.details}`, logType);
        break;
      case 'confirm_response':
         // 'id' and 'data' are expected
         if (!id || data?.value === undefined) { // Check for value presence
             addLog('ERROR', 'Received invalid confirm_response message.', 'error');
             return;
         }
         let confirmRespClientName = id; // Fallback
          setClients(prev => {
              const info = prev.get(id);
              if (info?.displayName) confirmRespClientName = info.displayName;
              return prev;
          })
        addLog('RESPONSE', `[${confirmRespClientName}] responded to confirm: ${data.value ? 'OK' : 'Cancel'}`, 'success');
        break;
      case 'prompt_response':
         // 'id' and 'data' are expected
         if (!id || data?.value === undefined) { // Check for value presence (null is valid response)
             addLog('ERROR', 'Received invalid prompt_response message.', 'error');
             return;
         }
         let promptClientName = id; // Fallback
          setClients(prev => {
              const info = prev.get(id);
              if (info?.displayName) promptClientName = info.displayName;
              return prev;
          })
        const responseText = data.value === null ? 'Cancelled' : `"${data.value}"`;
        addLog('RESPONSE', `[${promptClientName}] responded to prompt: ${responseText}`, 'success');
        break;
      case 'server_hello': // Handle welcome message from server
        addLog('SYSTEM', message.message || 'Connected and registered as admin.', 'success');
        break;
      default:
        // Log the raw message if type is unknown
        addLog('UNKNOWN', `Received unknown message type: ${type} with data: ${JSON.stringify(message)}`);
    }
  // *** FIX: Removed 'clients' dependency ***
  }, [addLog]);

  // --- WebSocket Connection Logic ---
  useEffect(() => {
    const connect = () => {
      // Avoid creating multiple connections if already connecting or connected
      if (socketRef.current && (socketRef.current.readyState === WebSocket.CONNECTING || socketRef.current.readyState === WebSocket.OPEN)) {
          console.log(`[AdminPanel] Connection attempt skipped, socket state is ${socketRef.current.readyState}`);
          return;
      }

      console.log("[AdminPanel] Attempting to connect...");
      const socket = new WebSocket(WEBSOCKET_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        // Send admin_hello immediately upon connection to register with the server
        socket.send(JSON.stringify({ type: 'admin_hello' }));
      };

      socket.onclose = (event) => {
        console.log(`[AdminPanel] Disconnected. Code: ${event.code}, Reason: ${event.reason || 'N/A'}`);
        setIsConnected(false);
        setClients(new Map()); // Clear client list on disconnect
        setSelectedClients(new Set());
        setScreenshots([]); // Clear screenshots
        addLog('SYSTEM', 'Disconnected. Retrying connection...', 'error');
        // Schedule reconnection attempt only if closure wasn't intentional and socket ref matches
        // Check if the closing socket is the one we think is active
        if (socketRef.current === socket) {
            // Simple timeout for reconnect
            setTimeout(() => {
                // Check state again before reconnecting, in case cleanup already nulled the ref
                if (socketRef.current === null) { // Check if cleanup already ran
                     connect();
                } else if (socketRef.current !== socket) {
                     console.log("[AdminPanel] Reconnect attempt skipped, a newer socket is already trying/connected.");
                } else {
                     connect(); // Otherwise, proceed with reconnect
                }
            }, 5000); // Attempt to reconnect after 5 seconds
        } else {
             console.log("[AdminPanel] Ignoring onclose for a stale socket instance.");
        }
      };

      socket.onerror = (event) => {
         console.error("[AdminPanel] WebSocket error observed:", event);
        addLog('SYSTEM', 'WebSocket connection error occurred.', 'error');
        // Ensure the socket is properly closed to allow the onclose handler to trigger reconnect.
         if (socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
            socket.close();
         }
      };

      socket.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          handleSocketMessage(messageData); // Process the received message
        } catch (error) {
           // Catch parsing errors specifically
           console.error("[AdminPanel] Failed to parse WebSocket message:", error, "Data:", event.data);
           addLog('ERROR', 'Received unparseable message from server.', 'error');
        }
      };
    };

    connect(); // Initiate the first connection attempt

    // --- Cleanup Function ---
    return () => {
      console.log("[AdminPanel] Cleaning up WebSocket connection.");
      const currentSocket = socketRef.current; // Capture ref before clearing
      if (currentSocket) {
        // Prevent the onclose handler from triggering reconnect logic during cleanup
        currentSocket.onclose = null;
        currentSocket.onerror = null;
        if (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING) {
          currentSocket.close(1000, "Admin panel unmounting"); // Close gracefully
        }
      }
      socketRef.current = null; // Clear the ref explicitly
    };
  // *** FIX: Dependencies are now stable ***
  }, [addLog, handleSocketMessage]); // Dependencies for useEffect


  // --- Client Selection Handlers ---
  const handleClientSelection = (clientId) => {
    setSelectedClients(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(clientId)) {
        newSelection.delete(clientId);
      } else {
        newSelection.add(clientId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    // Use functional update based on current clients state
    setClients(currentClients => {
        setSelectedClients(new Set(currentClients.keys()));
        return currentClients; // No change to clients map itself
    });
  };

  const handleSelectNone = () => {
    setSelectedClients(new Set());
  };

  // --- Action Sending Function ---
  const sendAction = useCallback((actionType, payload = {}) => {
    // Check connection status before sending
    if (!isConnected || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      addLog('SYSTEM', 'Cannot send action: Not connected to the server.', 'error');
      return;
    }

    let targetClientIds = Array.from(selectedClients);
    // Default to ALL connected clients if none are specifically selected
    if (targetClientIds.length === 0) {
        // Read current clients directly inside useCallback is tricky with dependencies removed
        // A slightly less efficient but safer way is to read from the state *at the moment of call*
        const currentClientKeys = Array.from(clients.keys()); // Read current keys here

        targetClientIds = currentClientKeys;
        // If there are truly no clients connected, inform the admin and stop
        if (targetClientIds.length === 0) {
            addLog('SYSTEM', 'No clients are currently connected to send the action to.', 'warning');
            return;
        }
        addLog('SYSTEM', `No specific clients selected. Sending '${actionType}' action to ALL ${targetClientIds.length} connected client(s).`, 'info');
    }

    // Populate payload with values from corresponding input fields
    // Use optional chaining and nullish coalescing for safety
    if (actionType === 'redirect') payload.url = document.getElementById('redirect-url')?.value?.trim() ?? '';
    if (actionType === 'new_tab') payload.url = document.getElementById('newtab-url')?.value?.trim() ?? '';
    if (actionType === 'text_to_speech') payload.text = document.getElementById('tts-input')?.value?.trim() ?? '';
    if (actionType === 'alert') payload.message = document.getElementById('alert-message')?.value?.trim() || 'Alert!'; // Keep default
    if (actionType === 'confirm') payload.message = document.getElementById('confirm-message')?.value?.trim() || 'Please confirm.'; // Keep default
    if (actionType === 'prompt') {
        payload.message = document.getElementById('prompt-message')?.value?.trim() || 'Please enter a value:'; // Keep default
        // Ensure min/max length are valid numbers, default if not
        payload.minLength = parseInt(document.getElementById('prompt-min')?.value || '0', 10);
        payload.maxLength = parseInt(document.getElementById('prompt-max')?.value || '100', 10);
        if (isNaN(payload.minLength) || payload.minLength < 0) payload.minLength = 0;
        if (isNaN(payload.maxLength) || payload.maxLength < payload.minLength) payload.maxLength = 100; // Correct max if less than min
    }

    // --- Input Validation ---
    if ((actionType === 'redirect' || actionType === 'new_tab')) {
        // Basic URL validation (starts with http/https or is relative path starting with /)
        if (!payload.url || (!payload.url.startsWith('/') && !/^(https?:\/\/)/i.test(payload.url))) {
            addLog('SYSTEM', `Cannot send '${actionType}': Invalid or missing URL. Must start with http://, https://, or /.`, 'error');
            return;
        }
    }
    if (actionType === 'text_to_speech' && !payload.text) {
        addLog('SYSTEM', `Cannot send '${actionType}': Text input is required.`, 'error');
        return;
    }

    // Construct the command message
    const message = {
      type: 'command',
      action: actionType,
      targetClientIds,
      payload,
    };

    // Send the command via WebSocket
    try {
        socketRef.current.send(JSON.stringify(message));
        addLog('COMMAND', `Sent '${actionType}' to ${targetClientIds.length} client(s).`, 'info');
    } catch (error) {
        console.error("[AdminPanel] Failed to send command via WebSocket:", error);
        addLog('ERROR', `Failed to send '${actionType}' command: ${error.message || 'Unknown send error'}`, 'error');
         // Attempt to close and reconnect if sending fails (might indicate a broken connection)
         if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
             socketRef.current.close(1001, "Send error detected"); // 1001 = Going Away
         }
    }
  // *** FIX: Removed 'clients' dependency, read clients directly inside ***
  }, [isConnected, selectedClients, addLog]);


  // --- Render Logic ---
  const onlineClientsArray = Array.from(clients.entries()); // Get [id, info] pairs for rendering the list

  return (
    <>
      {/* Fullscreen Image Overlay */}
      {fullscreenImage && (
        <div className="fullscreen-overlay" onClick={() => setFullscreenImage(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fullscreenImage.imageData} alt={`Screenshot from ${fullscreenImage.clientName}`} />
           <p style={{ color: 'white', marginTop: '0.5rem', fontSize: '0.9rem' }}>From: {fullscreenImage.clientName} ({fullscreenImage.clientId})</p>
          <button className={`${styles.btn} ${styles.btnSecondary}`}>Close</button>
        </div>
      )}

      {/* Main Admin Panel Container */}
      <div className={styles.adminPanelContainer}>
        {/* Panel Header */}
        <header className={styles.panelHeader}>
          <div className={styles.headerTitle}>
            {/* Shield Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
            <div><h1>Admin Control Panel</h1><p>Browser Command & Control Center</p></div>
          </div>
          {/* Connection Status Badge */}
          <div className={`${styles.statusBadge} ${isConnected ? styles.statusConnected : styles.statusDisconnected}`}>
             {/* Icon changes based on connection status */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isConnected ? <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/> : <path d="m2 2 20 20M12.41 6.75 13 2l-2.43 2.92M18.57 12.91 21 10h-5.34M8 8.33V7l-3.21 4.39"/>}
            </svg>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </header>

        {/* Main Grid Layout */}
        <div className={styles.mainGrid}>
          {/* Left Column: Action Panels */}
          <div className={styles.mainContent}>
            {/* Navigation & Page Manipulation Actions Grid */}
            <div className={`${styles.section} ${styles.actionsGrid}`}>
              {/* Navigation Card */}
              <div className={styles.card}>
                <h3 className={styles.cardHeader}>Navigation</h3>
                <div className={styles.cardContent}>
                  <label htmlFor="redirect-url" style={{ fontSize: '0.8rem', color: 'var(--text-sec-col)'}}>Redirect Current Tab</label>
                  <input type="text" id="redirect-url" placeholder="Enter full URL (https://...)" className={styles.input} />
                  <button onClick={() => sendAction('redirect')} className={`${styles.btn} ${styles.btnPrimary}`}>Redirect</button>

                  <label htmlFor="newtab-url" style={{ fontSize: '0.8rem', color: 'var(--text-sec-col)', marginTop: '1rem'}}>Open New Tab</label>
                  <input type="text" id="newtab-url" placeholder="Enter full URL (https://...)" className={styles.input} />
                  <button onClick={() => sendAction('new_tab')} className={`${styles.btn} ${styles.btnPrimary}`}>New Tab</button>
                </div>
              </div>
              {/* Page Manipulation Card */}
              <div className={`${styles.card} ${styles.cardColSpan2}`}>
                <h3 className={styles.cardHeader}>Page Manipulation</h3>
                {/* Button groups for better layout */}
                <div className={styles.buttonGroup}>
                  <button onClick={() => sendAction('toggle_edit')} className={`${styles.btn} ${styles.btnSecondary}`}>Toggle Edit Mode</button>
                  <button onClick={() => sendAction('replace_images')} className={`${styles.btn} ${styles.btnSecondary}`}>Replace Images</button>
                  <button onClick={() => sendAction('scramble_content')} className={`${styles.btn} ${styles.btnSecondary}`}>Scramble Text</button>
                  <button onClick={() => sendAction('chaos_mode')} className={`${styles.btn} ${styles.btnSecondary}`}>Chaos Mode</button>
                </div>
                 {/* Destructive actions separated */}
                <div className={styles.buttonGroup} style={{marginTop: '1rem'}}>
                  <button onClick={() => sendAction('fat_cat')} className={`${styles.btn} ${styles.btnWarning}`}>Release The Cat</button>
                  <button onClick={() => sendAction('crash_browser')} className={`${styles.btn} ${styles.btnDanger}`}>Crash Browser (!)</button>
                </div>
              </div>
            </div>

            {/* JavaScript Popups Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionHeader}>JavaScript Popups</h2>
                <div className={styles.advancedActionsGrid}> {/* Reusing grid for layout */}
                    {/* Alert Card */}
                    <div className={styles.cardContent}>
                        <label htmlFor="alert-message">Alert Message</label>
                        <input type="text" id="alert-message" placeholder="Optional alert message..." className={styles.input} />
                        <button onClick={() => sendAction('alert')} className={`${styles.btn} ${styles.btnSecondary}`}>Send Alert</button>
                    </div>
                    {/* Confirm Card */}
                    <div className={styles.cardContent}>
                        <label htmlFor="confirm-message">Confirm Message</label>
                        <input type="text" id="confirm-message" placeholder="Optional confirm question..." className={styles.input} />
                        <button onClick={() => sendAction('confirm')} className={`${styles.btn} ${styles.btnSecondary}`}>Send Confirm</button>
                    </div>
                    {/* Prompt Card - Spanning two columns for more space */}
                    <div className={`${styles.cardContent} ${styles.cardColSpan2}`}>
                        <label htmlFor="prompt-message">Prompt Message & Validation</label>
                        <input type="text" id="prompt-message" placeholder="Optional prompt question..." className={styles.input} />
                        {/* Inputs for min/max length */}
                        <div className={styles.buttonGroup} style={{ marginBottom: '0.5rem', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                             <div>
                                <label htmlFor="prompt-min" style={{ fontSize: '0.8rem', color: 'var(--text-sec-col)'}}>Min Length</label>
                                <input type="number" id="prompt-min" placeholder="e.g., 0" className={styles.input} min="0" defaultValue="0"/>
                             </div>
                             <div>
                                <label htmlFor="prompt-max" style={{ fontSize: '0.8rem', color: 'var(--text-sec-col)'}}>Max Length</label>
                                <input type="number" id="prompt-max" placeholder="e.g., 100" className={styles.input} min="0" defaultValue="100"/>
                             </div>
                        </div>
                        <button onClick={() => sendAction('prompt')} className={`${styles.btn} ${styles.btnSecondary}`}>Send Prompt</button>
                    </div>
                </div>
            </div>

             {/* Advanced Actions Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionHeader}>Advanced Actions</h2>
              <div className={styles.advancedActionsGrid}>
                 {/* Text-to-Speech Card */}
                <div className={styles.cardContent}>
                  <label htmlFor="tts-input">Text-to-Speech</label>
                  <input type="text" id="tts-input" placeholder="Enter text for client to speak..." className={styles.input} />
                  <button onClick={() => sendAction('text_to_speech')} className={`${styles.btn} ${styles.btnPrimary}`}>Speak on Client</button>
                </div>
                 {/* Screenshots Card */}
                <div className={styles.cardContent}>
                  <label>Screenshots</label>
                  {/* Buttons for Request/Clear */}
                  <div className={styles.buttonGroup} style={{ marginBottom: '1rem' }}>
                    <button onClick={() => sendAction('request_screenshot')} className={`${styles.btn} ${styles.btnSecondary}`}>Request Screenshot</button>
                    {screenshots.length > 0 && (
                      <button onClick={() => setScreenshots([])} className={`${styles.btn} ${styles.btnDanger}`}>Clear ({screenshots.length})</button>
                    )}
                  </div>
                  {/* Screenshot Thumbnail List */}
                  {screenshots.length > 0 && (
                    <div className="screenshot-list">
                      {screenshots.map((shot, index) => (
                        <div key={index} className="screenshot-item" onClick={() => setFullscreenImage(shot)} title={`Click to view fullscreen\nFrom: ${shot.clientName} (${shot.clientId})`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={shot.imageData} alt={`Screenshot from ${shot.clientName}`} className="screenshot-thumbnail" />
                           {/* Info overlay */}
                          <div className="screenshot-info">
                            <span>{shot.clientName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {screenshots.length === 0 && (
                      <p style={{fontSize: '0.8rem', color: 'var(--text-sec-col)', textAlign: 'center', marginTop: '1rem'}}>No screenshots received yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div> {/* End Main Content */}

          {/* Right Column: Stats & Client List */}
          <div className={styles.sidebar}>
             {/* Statistics Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionHeader}>Statistics</h2>
              <div className={styles.statBox}>
                  <span>Online Clients:</span>
                  <span className={styles.statValue}>{clients.size}</span>
              </div>
              {/* Can add more stats here later */}
            </div>
             {/* Client List Section */}
            <div className={styles.section}>
              {/* Header with Title and Select Buttons */}
              <div className={styles.clientListHeader}>
                <h2 className={styles.sectionHeader} style={{borderBottom: 'none', marginBottom: 0}}>Clients</h2>
                <div className={styles.clientListControls}>
                  <button onClick={handleSelectAll} title="Select all clients">All</button>
                  <button onClick={handleSelectNone} title="Deselect all clients">None</button>
                </div>
              </div>
              {/* Client List (UL) */}
              <ul className={styles.onlineList}>
                {onlineClientsArray.length > 0 ? (
                  onlineClientsArray.map(([id, info]) => ( // Destructure id and info object
                    <li key={id}>
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        className={styles.clientCheckbox}
                        checked={selectedClients.has(id)}
                        onChange={() => handleClientSelection(id)}
                        id={`client-checkbox-${id}`} // Unique ID for the label to target
                      />
                      {/* Online Indicator */}
                      <span className={styles.onlineIndicator} title="Online">●</span>
                      {/* Client Name Label (clickable to toggle checkbox) */}
                      {/* *** MODIFIED: Display displayName or ID *** */}
                      <label htmlFor={`client-checkbox-${id}`} className={styles.onlineName} title={id}>
                        {info.displayName || id} {/* Show display name, fallback to ID */}
                      </label>
                      {/* Browser Info */}
                      <span className={styles.onlineUsername} title={info.userAgent || 'Unknown User Agent'}>{info.browser || 'N/A'}</span>
                    </li>
                  ))
                ) : (
                  // Message shown when no clients are connected
                  <p className={styles.noItemsText}>No clients connected.</p>
                )}
              </ul>
            </div>
          </div> {/* End Sidebar */}
        </div> {/* End Main Grid */}

        {/* Console Log Section (Full Width Below Grid) */}
        <div className={`${styles.section} ${styles.consoleCard}`}>
          <h2 className={styles.sectionHeader}>Console Log</h2>
          {/* Log Output Area */}
          <div className={`${styles.detailsContent} log-output`}>
            {logs.length === 0 && <div className="log-entry log-info"><span className="log-message">Console log is empty.</span></div>}
            {/* Map through logs array and render each entry */}
            {logs.map((log, index) => (
              <div key={index} className={`log-entry log-${log.type}`}>
                <span className="log-timestamp">{log.timestamp} </span>
                <strong className="log-prefix">{log.prefix}: </strong>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div> {/* End Admin Panel Container */}

      {/* Embedded CSS using JSX Style tag for dynamic elements & log colors */}
      <style jsx>{`
        /* Fullscreen Overlay Styles */
        .fullscreen-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background-color: rgba(0, 0, 0, 0.9); /* Darker overlay */
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          z-index: 1000; padding: 1rem; box-sizing: border-box; cursor: pointer;
        }
        .fullscreen-overlay img {
          max-width: 95%; max-height: 80%; /* Slightly smaller max height */
          object-fit: contain;
          border-radius: 8px; border: 2px solid #4a5568; background-color: #1a202c; /* Dark bg */
          margin-bottom: 0.5rem; /* Space between image and text */
        }
        .fullscreen-overlay button { margin-top: 1rem; cursor: pointer; }

        /* Screenshot Thumbnail List Styles */
        .screenshot-list {
          margin-top: 1rem; max-height: 250px; /* Increased max height */
          overflow-y: auto; overflow-x: hidden; /* Hide horizontal scroll */
          display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); /* Larger min width */
          gap: 1rem; /* Increased gap */
          padding-right: 8px; /* Space for scrollbar */
          padding-bottom: 5px; /* Padding at bottom */
        }
        .screenshot-item {
          position: relative; border-radius: 6px; overflow: hidden;
          border: 1px solid var(--border-col, #4a5568); cursor: pointer;
          aspect-ratio: 16 / 10; /* Maintain aspect ratio */
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
         .screenshot-item:hover {
             transform: scale(1.03);
             box-shadow: 0 4px 10px rgba(0,0,0,0.3);
         }
         /* Screenshot Info Overlay */
        .screenshot-info {
          position: absolute; bottom: 0; left: 0; width: 100%;
          /* Gradient from transparent top to dark bottom */
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%);
          color: white; padding: 10px 8px 6px 8px; /* More padding */
          font-size: 0.8rem; /* Slightly larger font */
          opacity: 0; /* Hidden by default */
          transition: opacity 0.2s ease;
          /* Text handling */
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5); /* Subtle text shadow */
        }
        .screenshot-item:hover .screenshot-info { opacity: 1; } /* Show info on hover */

        /* Thumbnail Image Styling */
        .screenshot-thumbnail {
          display: block; width: 100%; height: 100%; object-fit: cover;
          background-color: #1a202c; /* Dark placeholder color */
        }

        /* Console Log Output Styling */
        .log-output {
            background-color: var(--input-col, #1f2937); padding: 15px;
            border-radius: var(--border-radius, 0.5rem); border: 1px solid var(--border-col, #4b5563);
            font-family: 'SF Mono', Consolas, Menlo, Monaco, 'Courier New', monospace; /* Monospaced font */
            white-space: pre-wrap; word-break: break-word; /* Allow wrapping */
            max-height: 350px; /* Increased max height */
            overflow-y: auto; /* Enable vertical scroll */
            color: var(--text-primary, #e5e7eb);
            font-size: 0.8rem; /* Slightly smaller font */
            line-height: 1.5; /* Improved line spacing */
            scrollbar-width: thin; /* Firefox scrollbar */
            scrollbar-color: var(--hover-col) var(--input-col); /* Firefox scrollbar */
        }
         /* Webkit (Chrome/Safari) scrollbar styling */
        .log-output::-webkit-scrollbar { width: 6px; }
        .log-output::-webkit-scrollbar-track { background: var(--input-col); }
        .log-output::-webkit-scrollbar-thumb { background-color: var(--hover-col); border-radius: 3px; }
        .log-output::-webkit-scrollbar-thumb:hover { background-color: var(--border-col); }

        /* Individual Log Entry Styles */
        .log-entry { margin-bottom: 5px; padding: 2px 4px; border-radius: 3px; }
        .log-timestamp { color: #888; margin-right: 8px; user-select: none; }
        .log-prefix { font-weight: bold; margin-right: 5px; }

        /* Log Type Colors */
        .log-success .log-prefix { color: #34d399; } /* Green */
        .log-error .log-prefix { color: #f87171; } /* Red */
        .log-info .log-prefix { color: #93c5fd; } /* Blue */
        .log-warning .log-prefix { color: #fcd34d; } /* Yellow */
        .log-command .log-prefix { color: #d8b4fe; } /* Purple */
        .log-response .log-prefix { color: #a5f3fc; } /* Cyan */
        .log-system .log-prefix { color: #f9a8d4; } /* Pink */
        .log-client .log-prefix { color: #a7f3d0; } /* Light Green */
        .log-unknown .log-prefix { color: #fca5a5; } /* Light Red for unknown */


        /* Optional: Highlight error/warning entries */
        .log-entry.log-error { background-color: rgba(239, 68, 68, 0.1); border-left: 3px solid #f87171; }
        .log-entry.log-warning { background-color: rgba(252, 211, 77, 0.1); border-left: 3px solid #fcd34d; }

        /* Client Checkbox */
        .clientCheckbox { margin-right: 8px; accent-color: var(--accent-color); cursor: pointer; vertical-align: middle; }
        .onlineList li { cursor: default; display: flex; align-items: center; gap: 8px; /* Added flex and gap */}
        .onlineName { cursor: pointer; flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } /* Make label clickable and handle overflow */
        .onlineIndicator { flex-shrink: 0; }
        .onlineUsername { flex-shrink: 0; }


      `}</style>
    </>
  );
};

export default AdminPanel;

