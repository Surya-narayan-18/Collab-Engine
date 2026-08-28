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
      style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-card-elevated rounded-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-in"
        style={{
          borderTop: "2px solid transparent",
          borderImage: "linear-gradient(90deg, var(--color-ce-gradient-start), var(--color-ce-gradient-mid), var(--color-ce-gradient-end)) 1",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--color-ce-border-subtle)" }}
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
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ce-text-muted hover:text-ce-text-primary transition-all cursor-pointer"
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-ce-bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
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
                <div className="w-7 h-7 rounded-full border-2 border-ce-accent border-t-transparent animate-spin" />
                <p className="text-xs text-ce-text-muted">Loading members...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 px-3 py-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-ce-danger text-xs">{error}</p>
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
                          <div className={`w-8 h-8 rounded-full avatar-gradient-${avatarIndex(m.user?.username)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
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
                              style={{ color: 'var(--color-ce-success)', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
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
                        className="flex items-center justify-between py-2 px-3 rounded-xl transition-colors"
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-ce-bg-hover)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full avatar-gradient-${avatarIndex(m.user?.username)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
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
                              style={{ background: 'var(--color-ce-bg-tertiary)', border: '1px solid var(--color-ce-border-subtle)' }}>
                          Not joined
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inChannel.length === 0 && notInChannel.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-ce-text-muted">No workspace members found.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex justify-end"
             style={{ borderTop: "1px solid var(--color-ce-border-subtle)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ce-text-secondary rounded-lg transition-all cursor-pointer"
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-ce-bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
