import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";

// Deterministic avatar color
function avatarIndex(str) {
  let hash = 0;
  for (let i = 0; i < (str || "").length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 8;
}

function RoleBadge({ role }) {
  const cls =
    role === "OWNER" ? "role-badge-owner" :
    role === "ADMIN" ? "role-badge-admin" :
    "role-badge-member";
  return (
    <span className={`${cls} text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider`}>
      {role}
    </span>
  );
}

export default function MemberPanel({ workspaceId, onClose }) {
  const { user } = useAuth();
  const { currentWorkspace, sendInvitation, removeMember } = useWorkspace();
  const [inviteMode, setInviteMode] = useState("email"); // "email" or "userId"
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const members = currentWorkspace?.members || [];
  const myMembership = members.find((m) => m.user?.id === user?.id);
  const canManage = myMembership?.role === "OWNER" || myMembership?.role === "ADMIN";

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const payload = inviteMode === "email" ? { email } : { userId };
      const invitation = await sendInvitation(workspaceId, payload);
      setSuccess(`Invitation sent to ${invitation.invitee?.username || email || userId}`);
      setEmail("");
      setUserId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(memberUserId, username) {
    if (!confirm(`Remove ${username} from this workspace?`)) return;
    try {
      await removeMember(workspaceId, memberUserId);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in"
         style={{ background: 'rgba(0, 0, 0, 0.4)' }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card-elevated rounded-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-in"
           style={{ borderTop: '3px solid var(--color-ce-accent)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
             style={{ borderBottom: '1px solid var(--color-ce-border)' }}>
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ce-text-secondary">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3 className="text-base font-semibold text-ce-text-primary">Members</h3>
            <span className="text-xs text-ce-text-muted">({members.length})</span>
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

        {/* Add member form (OWNER/ADMIN only) */}
        {canManage && (
          <form onSubmit={handleAdd} className="px-6 py-4"
                style={{ borderBottom: '1px solid var(--color-ce-border)' }}>
            {/* Mode toggle */}
            <div className="flex items-center gap-1 mb-3">
              <button
                type="button"
                onClick={() => setInviteMode("email")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
                style={{
                  background: inviteMode === "email" ? 'var(--color-ce-accent)' : 'var(--color-ce-bg-tertiary)',
                  color: inviteMode === "email" ? '#fff' : 'var(--color-ce-text-secondary)',
                  border: `1px solid ${inviteMode === "email" ? 'var(--color-ce-accent)' : 'var(--color-ce-border)'}`,
                }}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setInviteMode("userId")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
                style={{
                  background: inviteMode === "userId" ? 'var(--color-ce-accent)' : 'var(--color-ce-bg-tertiary)',
                  color: inviteMode === "userId" ? '#fff' : 'var(--color-ce-text-secondary)',
                  border: `1px solid ${inviteMode === "userId" ? 'var(--color-ce-accent)' : 'var(--color-ce-border)'}`,
                }}
              >
                User ID
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ce-text-muted pointer-events-none">
                  {inviteMode === "email" ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  )}
                </div>
                {inviteMode === "email" ? (
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-ce-text-primary placeholder-ce-text-muted focus:outline-none input-focus transition-all duration-200 disabled:opacity-50"
                    style={{ background: 'var(--color-ce-bg-secondary)', border: '1px solid var(--color-ce-border)' }}
                    id="invite-email-input"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Paste user ID (UUID)"
                    pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                    title="Enter a valid UUID"
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-ce-text-primary placeholder-ce-text-muted focus:outline-none input-focus transition-all duration-200 disabled:opacity-50"
                    style={{ background: 'var(--color-ce-bg-secondary)', border: '1px solid var(--color-ce-border)' }}
                    id="invite-userid-input"
                  />
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none cursor-pointer"
                style={{ background: 'var(--color-ce-accent)' }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--color-ce-accent-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent)'; }}
                id="invite-submit-btn"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : "Send Invite"}
              </button>
            </div>
            {error && (
              <div className="error-alert mt-2.5 text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="success-alert mt-2.5 text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                <span>{success}</span>
              </div>
            )}
          </form>
        )}

        {/* Member list */}
        <div className="px-4 py-3 max-h-80 overflow-y-auto space-y-0.5">
          {members.map((m) => (
            <div
              key={m.user?.id || m.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors group hover:bg-ce-bg-hover"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full avatar-color-${avatarIndex(m.user?.username)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                  {m.user?.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-ce-text-primary font-medium truncate leading-tight">
                    {m.user?.username}
                    {m.user?.id === user?.id && (
                      <span className="text-ce-text-muted text-xs ml-1.5">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-ce-text-muted truncate">{m.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 relative">
                <RoleBadge role={m.role} />
                {canManage && m.role !== "OWNER" && m.user?.id !== user?.id && (
                  <button
                    onClick={() => handleRemove(m.user?.id, m.user?.username)}
                    className="absolute -right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-red-50"
                    style={{ transform: 'translate(100%, -50%)' }}
                    title="Remove member"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
