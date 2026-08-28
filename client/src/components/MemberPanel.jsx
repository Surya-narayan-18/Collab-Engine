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
  const { currentWorkspace, addMember, removeMember } = useWorkspace();
  const [email, setEmail] = useState("");
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
      const member = await addMember(workspaceId, email);
      setSuccess(`Added ${member.user?.username || email}`);
      setEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId, username) {
    if (!confirm(`Remove ${username} from this workspace?`)) return;
    try {
      await removeMember(workspaceId, userId);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in"
         style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-card-elevated rounded-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-in"
           style={{ borderTop: '2px solid transparent', borderImage: 'linear-gradient(90deg, var(--color-ce-gradient-start), var(--color-ce-gradient-mid), var(--color-ce-gradient-end)) 1' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
             style={{ borderBottom: '1px solid var(--color-ce-border-subtle)' }}>
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
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ce-text-muted hover:text-ce-text-primary transition-all cursor-pointer"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ce-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
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
                style={{ borderBottom: '1px solid var(--color-ce-border-subtle)' }}>
            <label className="block text-xs font-medium text-ce-text-muted mb-2 uppercase tracking-wider">
              Invite by email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ce-text-muted pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-ce-text-primary placeholder-ce-text-muted focus:outline-none input-glow transition-all duration-200"
                  style={{ background: 'var(--color-ce-bg-tertiary)', border: '1px solid var(--color-ce-border)' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-brand text-white text-sm font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-ce-accent/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : "Invite"}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-ce-danger text-xs">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 mt-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                <p className="text-xs" style={{ color: 'var(--color-ce-success)' }}>{success}</p>
              </div>
            )}
          </form>
        )}

        {/* Member list */}
        <div className="px-4 py-3 max-h-80 overflow-y-auto space-y-0.5">
          {members.map((m) => (
            <div
              key={m.user?.id || m.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors group"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ce-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full avatar-gradient-${avatarIndex(m.user?.username)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
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
              <div className="flex items-center gap-2 flex-shrink-0">
                <RoleBadge role={m.role} />
                {canManage && m.role !== "OWNER" && m.user?.id !== user?.id && (
                  <button
                    onClick={() => handleRemove(m.user?.id, m.user?.username)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                    title="Remove member"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
