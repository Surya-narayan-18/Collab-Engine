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

function MemberCard({ member, workspaceId, canManage, isOwner, currentUserId, onClose, onError }) {
  const { removeMember, updateMemberRole } = useWorkspace();
  const [loading, setLoading] = useState(false);

  const u = member.user;
  const isSelf = u?.id === currentUserId;
  const isTargetOwner = member.role === "OWNER";
  const showActions = canManage && !isSelf && !isTargetOwner;

  async function handleRemove() {
    if (!confirm(`Remove ${u?.userName} from this workspace?`)) return;
    setLoading(true);
    try {
      await removeMember(workspaceId, u?.id);
      onClose();
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(newRole) {
    setLoading(true);
    try {
      await updateMemberRole(workspaceId, u?.id, newRole);
      onClose();
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200] animate-fade-in"
         style={{ background: 'rgba(0, 0, 0, 0.5)' }}
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card-elevated rounded-2xl w-full max-w-xs mx-4 animate-scale-in overflow-hidden"
           style={{ border: '1px solid var(--color-ce-border)' }}>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-ce-text-muted hover:text-ce-text-primary hover:bg-ce-bg-hover transition-all cursor-pointer"
          style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* User info */}
        <div className="pt-6 pb-4 px-5 flex flex-col items-center text-center">
          {/* Large avatar */}
          <div className={`w-16 h-16 rounded-full avatar-color-${avatarIndex(u?.userId)} flex items-center justify-center text-white text-2xl font-bold mb-3`}>
            {u?.userName?.[0]?.toUpperCase() || "?"}
          </div>

          {/* Display name */}
          <h4 className="text-base font-semibold text-ce-text-primary leading-tight">
            {u?.userName}
            {isSelf && <span className="text-ce-text-muted text-xs ml-1.5 font-normal">(you)</span>}
          </h4>

          {/* User ID */}
          <p className="text-xs text-ce-text-muted mt-1 font-mono" style={{ color: 'var(--color-ce-accent)', opacity: 0.8 }}>
            @{u?.userId}
          </p>

          {/* Email */}
          <p className="text-xs text-ce-text-muted mt-0.5">{u?.email}</p>

          {/* Role badge */}
          <div className="mt-3">
            <RoleBadge role={member.role} />
          </div>
        </div>

        {/* Actions — visible to OWNER/ADMIN only, not for self or OWNER target */}
        {showActions && (
          <div className="px-4 pb-4 space-y-2"
               style={{ borderTop: '1px solid var(--color-ce-border)', paddingTop: '12px' }}>
            {/* Role change */}
            {isOwner && member.role === "MEMBER" && (
              <button
                onClick={() => handleRoleChange("ADMIN")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer"
                style={{
                  color: 'var(--color-ce-accent)',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {loading ? "Updating..." : "Make Admin"}
              </button>
            )}
            {isOwner && member.role === "ADMIN" && (
              <button
                onClick={() => handleRoleChange("MEMBER")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer"
                style={{
                  color: 'var(--color-ce-text-secondary)',
                  background: 'var(--color-ce-bg-tertiary)',
                  border: '1px solid var(--color-ce-border)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {loading ? "Updating..." : "Demote to Member"}
              </button>
            )}

            {/* Remove */}
            <button
              onClick={handleRemove}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer"
              style={{
                color: 'var(--color-ce-danger)',
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="17" y1="11" x2="22" y2="11" />
              </svg>
              {loading ? "Removing..." : "Remove from Workspace"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MemberPanel({ workspaceId, onClose }) {
  const { user } = useAuth();
  const { currentWorkspace, sendInvitation } = useWorkspace();
  const [inviteMode, setInviteMode] = useState("email"); // "email" or "userId"
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const members = currentWorkspace?.members || [];
  const myMembership = members.find((m) => m.user?.id === user?.id);
  const canManage = myMembership?.role === "OWNER" || myMembership?.role === "ADMIN";
  const isOwner = myMembership?.role === "OWNER";

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const payload = inviteMode === "email" ? { email } : { userId };
      const invitation = await sendInvitation(workspaceId, payload);
      setSuccess(`Invitation sent to ${invitation.invitee?.userName || email || userId}`);
      setEmail("");
      setUserId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

            <div className="flex items-center gap-2">
              {inviteMode === "email" ? (
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-ce-text-primary placeholder-ce-text-muted focus:outline-none input-focus"
                  style={{ background: 'var(--color-ce-bg-secondary)', border: '1px solid var(--color-ce-border)' }}
                  placeholder="colleague@company.com"
                />
              ) : (
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-ce-text-primary placeholder-ce-text-muted focus:outline-none input-focus"
                  style={{ background: 'var(--color-ce-bg-secondary)', border: '1px solid var(--color-ce-border)' }}
                  placeholder="Enter user ID"
                />
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all cursor-pointer disabled:opacity-50"
                style={{ background: 'var(--color-ce-accent)' }}
              >
                {loading ? "..." : "Invite"}
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
              className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors group hover:bg-ce-bg-hover cursor-pointer"
              onClick={() => setSelectedMember(m)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full avatar-color-${avatarIndex(m.user?.userId)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                  {m.user?.userName?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-ce-text-primary font-medium truncate leading-tight">
                    {m.user?.userName}
                    {m.user?.id === user?.id && (
                      <span className="text-ce-text-muted text-xs ml-1.5">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-ce-text-muted truncate">{m.user?.email}</p>
                </div>
              </div>
              <RoleBadge role={m.role} />
            </div>
          ))}
        </div>
      </div>

      {/* Member detail card — appears on top when a member is clicked */}
      {selectedMember && (
        <MemberCard
          member={selectedMember}
          workspaceId={workspaceId}
          canManage={canManage}
          isOwner={isOwner}
          currentUserId={user?.id}
          onClose={() => setSelectedMember(null)}
          onError={setError}
        />
      )}
    </div>
  );
}
