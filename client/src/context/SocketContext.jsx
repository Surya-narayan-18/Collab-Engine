import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  // Connect/disconnect socket when auth state changes
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Presence updates
    socket.on("presence:update", (users) => {
      setOnlineUsers(users);
    });

    // Typing indicators
    socket.on("typing:update", ({ userId, username, channelId, isTyping }) => {
      setTypingUsers((prev) => {
        const channelTypers = { ...(prev[channelId] || {}) };
        if (isTyping) {
          channelTypers[userId] = username;
        } else {
          delete channelTypers[userId];
        }
        return { ...prev, [channelId]: channelTypers };
      });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  const joinWorkspace = useCallback((workspaceId) => {
    socketRef.current?.emit("join:workspace", workspaceId);
  }, []);

  const joinChannel = useCallback((channelId) => {
    socketRef.current?.emit("join:channel", channelId);
  }, []);

  const leaveChannel = useCallback((channelId) => {
    socketRef.current?.emit("leave:channel", channelId);
  }, []);

  const sendMessage = useCallback((channelId, content) => {
    socketRef.current?.emit("message:send", { channelId, content });
  }, []);

  const startTyping = useCallback((channelId) => {
    socketRef.current?.emit("typing:start", channelId);
  }, []);

  const stopTyping = useCallback((channelId) => {
    socketRef.current?.emit("typing:stop", channelId);
  }, []);

  const onNewMessage = useCallback((callback) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on("message:new", callback);
    return () => socket.off("message:new", callback);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        connected,
        onlineUsers,
        typingUsers,
        joinWorkspace,
        joinChannel,
        leaveChannel,
        sendMessage,
        startTyping,
        stopTyping,
        onNewMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
