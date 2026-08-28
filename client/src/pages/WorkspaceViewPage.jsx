import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useSocket } from "../context/SocketContext";
import MessageView from "../components/MessageView";
import MemberPanel from "../components/MemberPanel";
import AddChannelMemberModal from "../components/AddChannelMemberModal";

// Deterministic avatar color
function avatarIndex(str) {
  let hash = 0;
  for (let i = 0; i < (str || "").length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 8;
}

export default function WorkspaceViewPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    currentWorkspace,
    channels,
    currentChannel,
    selectWorkspace,
    selectChannel,
    joinChannel,
    loading,
  } = useWorkspace();
  const { joinWorkspace, connected, onlineUsers } = useSocket();

  const [joining, setJoining] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddChannelMember, setShowAddChannelMember] = useState(false);

  useEffect(() => {
    selectWorkspace(workspaceId);
  }, [workspaceId, selectWorkspace]);

  // Join workspace socket room once connected
  useEffect(() => {
    if (connected && workspaceId) {
      joinWorkspace(workspaceId);
    }
  }, [connected, workspaceId, joinWorkspace]);

  // Auto-select first channel the user is a member of
  useEffect(() => {
    if (channels.length > 0 && !currentChannel) {
      const joinedChannel = channels.find((ch) => ch.isMember);
      if (joinedChannel) selectChannel(joinedChannel);
    }
  }, [channels, currentChannel, selectChannel]);

  async function handleJoinChannel(ch) {
    setJoining(ch.id);
    try {
      await joinChannel(workspaceId, ch.id);
      selectChannel({ ...ch, isMember: true });
    } finally {
      setJoining(null);
    }
  }

  if (loading && !currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--color-ce-bg-primary)' }}>
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 rounded-full border-2 border-ce-accent border-t-transparent animate-spin" />
          <p className="text-sm text-ce-text-tertiary">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex" style={{ background: 'var(--color-ce-bg-primary)' }}>
      {/* ====== Sidebar ====== */}
      <aside className="w-[272px] flex-shrink-0 flex flex-col animate-slide-in-left"
             style={{ background: 'var(--color-ce-bg-secondary)', borderRight: '1px solid var(--color-ce-border-subtle)' }}>

        {/* Workspace header */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--color-ce-border-subtle)' }}>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs text-ce-text-muted hover:text-ce-text-secondary mb-3 transition-colors cursor-pointer group"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            All Workspaces
          </button>

          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg avatar-gradient-${avatarIndex(currentWorkspace?.name)} flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0`}>
              {currentWorkspace?.name?.[0]?.toUpperCase() || "W"}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-ce-text-primary font-semibold text-[15px] truncate leading-tight">
                {currentWorkspace?.name}
              </h2>
              <button
                onClick={() => setShowMembers(true)}
                className="flex items-center gap-1.5 text-xs text-ce-text-muted hover:text-ce-accent transition-colors cursor-pointer mt-0.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {currentWorkspace?._count?.members || currentWorkspace?.members?.length || 0} members
              </button>
            </div>
          </div>
        </div>

        {/* Channels section */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-[11px] font-semibold text-ce-text-muted uppercase tracking-widest">
              Channels
            </h3>
            <span className="text-[11px] text-ce-text-muted">
              {channels.length}
            </span>
          </div>

          <div className="space-y-0.5">
            {channels.map((ch) => {
              const isActive = currentChannel?.id === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() =>
                    ch.isMember ? selectChannel(ch) : handleJoinChannel(ch)
                  }
                  disabled={joining === ch.id}
                  className={`w-full text-left px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer relative flex items-center justify-between group ${
                    isActive
                      ? "channel-active text-ce-text-primary"
                      : ch.isMember
                      ? "text-ce-text-secondary hover:text-ce-text-primary"
                      : "text-ce-text-muted hover:text-ce-text-tertiary"
                  }`}
                  style={isActive ? { background: 'var(--color-ce-accent-soft)' } : {}}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--color-ce-bg-hover)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = ''; }}
                >
                  <span className="flex items-center gap-2 truncate">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-60">
                      <path d="M4 9h16" />
                      <path d="M4 15h16" />
                      <path d="M10 3L8 21" />
                      <path d="M16 3l-2 18" />
                    </svg>
                    <span className="truncate">{ch.name}</span>
                  </span>
                  {!ch.isMember && (
                    <span className="text-[10px] font-medium text-ce-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      {joining === ch.id ? "joining..." : "join"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Online users section */}
          {onlineUsers.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-[11px] font-semibold text-ce-text-muted uppercase tracking-widest">
                  Online
                </h3>
                <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-ce-success)' }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--color-ce-success)' }} />
                  {onlineUsers.length}
                </span>
              </div>
              <div className="space-y-0.5">
                {onlineUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2.5 px-3 py-[6px] rounded-lg text-[13px] text-ce-text-secondary hover:text-ce-text-primary transition-colors"
                    style={{ cursor: 'default' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ce-bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-7 h-7 rounded-full avatar-gradient-${avatarIndex(u.username)} flex items-center justify-center text-white text-[11px] font-semibold`}>
                        {u.username?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                            style={{ background: 'var(--color-ce-success)', borderColor: 'var(--color-ce-bg-secondary)' }} />
                    </div>
                    <span className="truncate">{u.username}</span>
                    {u.id === user?.id && (
                      <span className="text-[10px] text-ce-text-muted ml-auto">(you)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User footer */}
        <div className="px-3 py-3 flex items-center justify-between"
             style={{ borderTop: '1px solid var(--color-ce-border-subtle)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className={`w-8 h-8 rounded-full avatar-gradient-${avatarIndex(user?.username)} flex items-center justify-center text-white text-xs font-semibold`}>
                {user?.username?.[0]?.toUpperCase() || "?"}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${connected ? "" : ""}`}
                    style={{
                      background: connected ? 'var(--color-ce-success)' : 'var(--color-ce-text-muted)',
                      borderColor: 'var(--color-ce-bg-secondary)'
                    }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-ce-text-primary font-medium truncate leading-tight">{user?.username}</p>
              <p className="text-[10px] leading-tight" style={{ color: connected ? 'var(--color-ce-success)' : 'var(--color-ce-text-muted)' }}>
                {connected ? "Connected" : "Reconnecting..."}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-ce-text-muted hover:text-ce-text-primary transition-all cursor-pointer flex-shrink-0"
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ce-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
            title="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content — message view */}
      <MessageView workspaceId={workspaceId} channel={currentChannel} onShowAddMember={() => setShowMembers(true)} />

      {/* Member management modal */}
      {showMembers && (
        <MemberPanel
          workspaceId={workspaceId}
          onClose={() => setShowMembers(false)}
        />
      )}

      {/* Add channel member modal */}
      {showAddChannelMember && currentChannel && (
        <AddChannelMemberModal
          workspaceId={workspaceId}
          channel={currentChannel}
          onClose={() => setShowAddChannelMember(false)}
        />
      )}
    </div>
  );
}
