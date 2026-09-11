import { useState, useEffect } from "react";
import { get } from "../lib/api";
import { useWorkspace } from "../context/WorkspaceContext";

// Deterministic avatar color
function avatarIndex(str) {
  let hash = 0;
  for (let i = 0; i < (str || "").length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 8;
}

export default function AddChannelMemberModal({ workspaceId, channel, onClose }) {
  const { currentWorkspace } = useWorkspace();
  const [channelMembers, setChannelMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch channel details to get current channel members
  useEffect(() => {
    if (!channel) return;
    setLoading(true);
    setError("");

    get(`/workspaces/${workspaceId}/channels/${channel.id}`)
      .then((res) => {
        const members = res.data.channel.members || [];
        // Extract user IDs of channel members
        setChannelMembers(members.map((m) => m.user?.id).filter(Boolean));
      })
      .catch((err) => {
        setError(err.message || "Failed to load channel members");
      })
      .finally(() => setLoading(false));
  }, [workspaceId, channel]);

  const workspaceMembers = currentWorkspace?.members || [];

  // Split into "in channel" and "not in channel"
  const inChannel = workspaceMembers.filter((m) => channelMembers.includes(m.user?.id));
  const notInChannel = workspaceMembers.filter((m) => !channelMembers.includes(m.user?.id));

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in"
      style={{ background: "rgba(0, 0, 0, 0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card-elevated rounded-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-in"
        style={{ borderTop: "3px solid var(--color-ce-accent)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--color-ce-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ce-text-secondary">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <div>
              <h3 className="text-base font-semibold text-ce-text-primary">Channel Members</h3>
              <p className="text-[11px] text-ce-text-muted">#{channel?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ce-text-muted hover:text-ce-text-primary hover:bg-ce-bg-hover transition-all cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <div className="w-7 h-7 rounded-full border-2 animate-spin"
                     style={{ borderColor: 'var(--color-ce-accent)', borderTopColor: 'transparent' }} />
                <p className="text-xs text-ce-text-muted">Loading members...</p>
              </div>
            </div>
          ) : error ? (
            /* Error state — failed to load channel members */
            <div className="error-state animate-fade-in-up py-6">
              <div className="error-state-icon" style={{ width: '48px', height: '48px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="error-state-title" style={{ fontSize: '14px' }}>Failed to load members</p>
              <p className="error-state-message" style={{ fontSize: '13px' }}>{error}</p>
              <button
                onClick={() => {
                  setError("");
                  setLoading(true);
                  get(`/workspaces/${workspaceId}/channels/${channel.id}`)
                    .then((res) => {
                      const members = res.data.channel.members || [];
                      setChannelMembers(members.map((m) => m.user?.id).filter(Boolean));
                    })
                    .catch((err) => setError(err.message || "Failed to load channel members"))
                    .finally(() => setLoading(false));
                }}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer"
                style={{ color: 'var(--color-ce-accent)', background: 'var(--color-ce-accent-soft)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent-glow)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent-soft)'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23,4 23,10 17,10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Members in channel */}
              {inChannel.length > 0 && (
                <div className="mb-3">
                  <p className="text-[11px] font-semibold text-ce-text-muted uppercase tracking-widest px-3 mb-2">
                    In Channel ({inChannel.length})
                  </p>
                  <div className="space-y-0.5">
                    {inChannel.map((m) => (
                      <div
                        key={m.user?.id || m.id}
                        className="flex items-center justify-between py-2 px-3 rounded-xl"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full avatar-color-${avatarIndex(m.user?.username)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                            {m.user?.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-ce-text-primary font-medium truncate leading-tight">
                              {m.user?.username}
                            </p>
                            <p className="text-[11px] text-ce-text-muted truncate">{m.user?.email}</p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-medium flex-shrink-0 px-2 py-1 rounded-full"
                              style={{ color: 'var(--color-ce-success)', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                          Joined
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members not in channel */}
              {notInChannel.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-ce-text-muted uppercase tracking-widest px-3 mb-2">
                    Not in Channel ({notInChannel.length})
                  </p>
                  <div className="space-y-0.5">
                    {notInChannel.map((m) => (
                      <div
                        key={m.user?.id || m.id}
                        className="flex items-center justify-between py-2 px-3 rounded-xl transition-colors hover:bg-ce-bg-hover"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full avatar-color-${avatarIndex(m.user?.username)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                            {m.user?.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-ce-text-primary font-medium truncate leading-tight">
                              {m.user?.username}
                            </p>
                            <p className="text-[11px] text-ce-text-muted truncate">{m.user?.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-ce-text-muted flex-shrink-0 px-2 py-1 rounded-full"
                              style={{ background: 'var(--color-ce-bg-tertiary)', border: '1px solid var(--color-ce-border)' }}>
                          Not joined
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inChannel.length === 0 && notInChannel.length === 0 && (
                <div className="empty-state py-8">
                  <div className="empty-state-icon" style={{ width: '48px', height: '48px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2F6FED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <p className="empty-state-title" style={{ fontSize: '14px' }}>No workspace members found</p>
                  <p className="empty-state-message" style={{ fontSize: '13px' }}>Invite members to the workspace first.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex justify-end"
             style={{ borderTop: "1px solid var(--color-ce-border)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ce-text-secondary rounded-lg transition-all cursor-pointer hover:bg-ce-bg-hover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
