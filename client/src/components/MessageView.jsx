import { useState, useEffect, useRef, useCallback } from "react";
import { get } from "../lib/api";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

export default function MessageView({ workspaceId, channel, onShowAddMember }) {
  const { user } = useAuth();
  const { sendMessage, onNewMessage, joinChannel, leaveChannel, startTyping, stopTyping, typingUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [content, setContent] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevChannelRef = useRef(null);

  // Join/leave channel socket rooms
  useEffect(() => {
    if (prevChannelRef.current) {
      leaveChannel(prevChannelRef.current);
    }
    if (channel) {
      joinChannel(channel.id);
      prevChannelRef.current = channel.id;
    }
    return () => {
      if (channel) leaveChannel(channel.id);
    };
  }, [channel, joinChannel, leaveChannel]);

  // Fetch initial messages when channel changes
  useEffect(() => {
    if (!channel) return;
    setMessages([]);
    setNextCursor(null);
    setLoadingInitial(true);
    setLoadError(null);

    get(`/workspaces/${workspaceId}/channels/${channel.id}/messages?limit=50`)
      .then((res) => {
        setMessages(res.data.messages.reverse());
        setNextCursor(res.data.nextCursor);
      })
      .catch((err) => {
        setLoadError(err.message || "Failed to load messages");
      })
      .finally(() => setLoadingInitial(false));
  }, [workspaceId, channel]);

  // Listen for real-time messages via socket
  useEffect(() => {
    if (!channel) return;
    const unsub = onNewMessage((msg) => {
      if (msg.channelId === channel.id) {
        setMessages((prev) => {
          // Deduplicate by id
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });
    return unsub;
  }, [channel, onNewMessage]);

  // Smart auto-scroll: only scroll if user is near the bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Load older messages
  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await get(
        `/workspaces/${workspaceId}/channels/${channel.id}/messages?limit=50&cursor=${encodeURIComponent(nextCursor)}`
      );
      const olderMessages = res.data.messages.reverse();
      setMessages((prev) => [...olderMessages, ...prev]);
      setNextCursor(res.data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [workspaceId, channel, nextCursor, loadingMore]);

  // Handle typing indicator
  function handleInputChange(e) {
    setContent(e.target.value);
    if (channel) {
      startTyping(channel.id);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(channel.id);
      }, 2000);
    }
  }

  // Send message via socket
  function handleSend(e) {
    e.preventDefault();
    if (!content.trim() || !channel) return;
    sendMessage(channel.id, content.trim());
    setContent("");
    if (channel) {
      clearTimeout(typingTimeoutRef.current);
      stopTyping(channel.id);
    }
  }

  // Handle Enter key to send
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  // Get typing users for this channel (exclude self)
  const channelTypers = channel
    ? Object.entries(typingUsers[channel.id] || {})
        .filter(([id]) => id !== user?.id)
        .map(([, name]) => name)
    : [];

  // Empty state — no channel selected
  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--color-ce-bg-primary)' }}>
        <div className="empty-state animate-fade-in-up">
          <div className="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2F6FED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="empty-state-title">Select a channel</p>
          <p className="empty-state-message">Choose a channel from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  // Determine if a message belongs to the current user
  function isSelf(msg) {
    return msg.user?.id === user?.id;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: 'var(--color-ce-bg-primary)' }}>
      {/* ====== Channel Header ====== */}
      <div className="px-5 py-2.5 flex items-center justify-between flex-shrink-0 hidden md:flex"
           style={{ borderBottom: '1px solid var(--color-ce-border)', background: 'white' }}>
        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ce-text-muted">
            <path d="M4 9h16" />
            <path d="M4 15h16" />
            <path d="M10 3L8 21" />
            <path d="M16 3l-2 18" />
          </svg>
          <h2 className="text-ce-text-primary font-semibold text-[15px]">{channel.name}</h2>
          <div className="w-px h-4 mx-1" style={{ background: 'var(--color-ce-border)' }} />
          <span className="text-xs text-ce-text-muted">Channel</span>
        </div>
        <button
          onClick={onShowAddMember}
          className="channel-header-btn"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Member
        </button>
      </div>

      {/* ====== Messages Area (scrollable) ====== */}
      <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0" ref={messagesContainerRef}>
        {/* Load older */}
        {nextCursor && (
          <div className="text-center py-3">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: 'var(--color-ce-accent)', border: '1px solid var(--color-ce-accent-soft)', background: 'var(--color-ce-accent-soft)' }}
              onMouseEnter={(e) => { if (!loadingMore) e.currentTarget.style.background = 'var(--color-ce-accent-glow)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent-soft)'; }}
            >
              {loadingMore ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18,15 12,9 6,15" />
                  </svg>
                  Load older messages
                </>
              )}
            </button>
          </div>
        )}

        {/* Loading state */}
        {loadingInitial ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4 animate-fade-in">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                   style={{ borderColor: 'var(--color-ce-accent)', borderTopColor: 'transparent' }} />
              <p className="text-sm text-ce-text-muted">Loading messages...</p>
            </div>
          </div>
        ) : loadError ? (
          /* Error state — failed to load messages */
          <div className="flex items-center justify-center h-full">
            <div className="error-state animate-fade-in-up">
              <div className="error-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="error-state-title">Failed to load messages</p>
              <p className="error-state-message">{loadError}</p>
              <button
                onClick={() => {
                  setLoadError(null);
                  setLoadingInitial(true);
                  get(`/workspaces/${workspaceId}/channels/${channel.id}/messages?limit=50`)
                    .then((res) => {
                      setMessages(res.data.messages.reverse());
                      setNextCursor(res.data.nextCursor);
                    })
                    .catch((err) => setLoadError(err.message || "Failed to load messages"))
                    .finally(() => setLoadingInitial(false));
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer"
                style={{ color: 'var(--color-ce-accent)', background: 'var(--color-ce-accent-soft)', border: '1px solid var(--color-ce-accent-soft)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent-glow)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent-soft)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23,4 23,10 17,10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Try again
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Empty channel state */
          <div className="flex items-center justify-center h-full">
            <div className="empty-state animate-fade-in-up">
              <div className="empty-state-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="#2F6FED">
                  <path d="M12 20h9" />
                  <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                </svg>
              </div>
              <p className="empty-state-title">This is the beginning of #{channel.name}</p>
              <p className="empty-state-message">Send the first message to get the conversation started.</p>
            </div>
          </div>
        ) : (
          /* Message list — self right, others left */
          messages.map((msg, i) => {
            const self = isSelf(msg);
            const prevMsg = messages[i - 1];
            const sameAuthorAsPrev = prevMsg && prevMsg.user?.id === msg.user?.id;
            const timeDiff = prevMsg
              ? new Date(msg.createdAt) - new Date(prevMsg.createdAt)
              : Infinity;
            const grouped = sameAuthorAsPrev && timeDiff < 60000;

            const senderName = self ? "Self" : (msg.user?.userName || "Unknown");
            const timestamp = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg.id}
                className={`${self ? "message-row-self" : "message-row-other"}`}
              >
                <div className="message-content-wrap">
                  {/* Show sender name if not grouped */}
                  {!grouped && (
                    <div className={`message-sender-name ${self ? "message-sender-self" : "message-sender-other"}`}>
                      {senderName}
                    </div>
                  )}
                  {/* Message bubble */}
                  <div className={self ? "message-bubble-self" : "message-bubble-other"}>
                    <p className="message-text">{msg.content}</p>
                  </div>
                  {/* Timestamp */}
                  {!grouped && (
                    <div className={`message-timestamp ${self ? "message-timestamp-self" : "message-timestamp-other"}`}>
                      {timestamp}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ====== Typing Indicator ====== */}
      <div className="px-5 h-5 flex items-center flex-shrink-0">
        {channelTypers.length > 0 && (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="flex gap-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
            <span className="text-xs text-ce-text-muted">
              <span className="font-medium text-ce-text-tertiary">{channelTypers.join(", ")}</span>
              {" "}{channelTypers.length === 1 ? "is" : "are"} typing
            </span>
          </div>
        )}
      </div>

      {/* ====== Composer (fixed at bottom) ====== */}
      <div className="px-4 pb-4 pt-1 flex-shrink-0">
        <form
          onSubmit={handleSend}
          className="relative rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--color-ce-border)', background: 'var(--color-ce-bg-secondary)' }}
        >
          <input
            type="text"
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Type a message in #${channel.name}...`}
            className="w-full px-4 py-3 pr-14 text-[14px] text-ce-text-primary placeholder-ce-text-muted focus:outline-none bg-transparent"
            maxLength={4000}
          />
          <button
            type="submit"
            disabled={!content.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: content.trim() ? 'var(--color-ce-accent)' : 'var(--color-ce-bg-hover)',
            }}
            onMouseEnter={(e) => { if (content.trim()) e.currentTarget.style.background = 'var(--color-ce-accent-hover)'; }}
            onMouseLeave={(e) => { if (content.trim()) e.currentTarget.style.background = 'var(--color-ce-accent)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
