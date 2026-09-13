import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useSocket } from "../context/SocketContext";
import InvitationBanner from "../components/InvitationBanner";

// Deterministic avatar color from string
function avatarIndex(str) {
  let hash = 0;
  for (let i = 0; i < (str || "").length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 8;
}

function RoleBadge({ role }) {
  const colors = {
    OWNER: { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
    ADMIN: { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE' },
    MEMBER: { bg: '#D1FAE5', color: '#047857', border: '#A7F3D0' },
  };
  const c = colors[role] || colors.MEMBER;
  return (
    <span
      className="text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider inline-block"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {role}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

/* ─── Delete Confirmation Modal ─── */
function DeleteConfirmModal({ workspace, onConfirm, onCancel, loading }) {
  const [typed, setTyped] = useState("");
  const match = typed === workspace.name;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in"
         style={{ background: 'rgba(0, 0, 0, 0.5)' }}
         onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 animate-scale-in overflow-hidden"
           style={{ border: '1px solid #e5e7eb', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
               style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>
          <h3 className="text-lg font-bold" style={{ color: '#111827' }}>Delete Workspace</h3>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: '#6B7280' }}>
            This will <strong style={{ color: '#DC2626' }}>permanently delete</strong>{" "}
            <strong>{workspace.name}</strong> and all its data.
          </p>
        </div>
        <div className="px-6 pb-4">
          <label className="text-xs font-medium mb-1.5 block" style={{ color: '#374151' }}>
            Type <strong className="font-mono" style={{ color: '#DC2626' }}>{workspace.name}</strong> to confirm
          </label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={workspace.name}
            autoFocus
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
            style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827' }}
          />
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer"
            style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={!match || loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#DC2626' }}>
            {loading ? "Deleting..." : "Delete Workspace"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Dropdown ─── */
function ProfileDropdown({ user, onClose, onLogout }) {
  const [copied, setCopied] = useState(false);

  function copyUserId() {
    navigator.clipboard.writeText(user?.userId || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl overflow-hidden animate-scale-in z-50"
           style={{ border: '1px solid #E5E7EB', boxShadow: '0 20px 40px -8px rgba(0,0,0,0.12)', transformOrigin: 'top right' }}>
        <div className="px-5 pt-5 pb-4 flex flex-col items-center text-center"
             style={{ borderBottom: '1px solid #F3F4F6' }}>
          <div className={`w-14 h-14 rounded-full avatar-color-${avatarIndex(user?.userId)} flex items-center justify-center text-white text-xl font-bold mb-2.5`}>
            {user?.userName?.[0]?.toUpperCase() || "?"}
          </div>
          <p className="text-sm font-semibold" style={{ color: '#111827' }}>{user?.userName}</p>
          <p className="text-xs mt-0.5 font-mono" style={{ color: '#6366F1', opacity: 0.8 }}>@{user?.userId}</p>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{user?.email}</p>
        </div>
        <div className="p-2">
          <button onClick={copyUserId}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer text-left"
            style={{ color: '#374151' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
            {copied ? "User ID copied!" : "Copy User ID"}
          </button>
          <div className="my-1 mx-3" style={{ height: '1px', background: '#F3F4F6' }} />
          <button onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer text-left"
            style={{ color: '#EF4444' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF2F2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Main Page ─── */
export default function WorkspaceListPage() {
  const { user, logout } = useAuth();
  const { workspaces, fetchWorkspaces, createWorkspace, deleteWorkspace, fetchInvitations, loading } = useWorkspace();
  const { onInvitation } = useSocket();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
    fetchInvitations();
  }, [fetchWorkspaces, fetchInvitations]);

  useEffect(() => {
    const unsub = onInvitation(() => { fetchInvitations(); });
    return unsub;
  }, [onInvitation, fetchInvitations]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);
    try {
      const ws = await createWorkspace(newName);
      setNewName("");
      setShowCreate(false);
      navigate(`/workspaces/${ws.id}`);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteWorkspace(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#F0F4FF' }}>
      {/* ── Decorative background shapes ── */}
      <div className="absolute top-32 right-[-60px] w-[300px] h-[300px] rounded-full opacity-[0.07]"
           style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)' }} />
      <div className="absolute bottom-10 left-10 opacity-[0.06]">
        <div className="grid grid-cols-5 gap-2.5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ background: '#6366F1' }} />
          ))}
        </div>
      </div>
      <div className="absolute top-[60%] right-20 w-[200px] h-[200px] opacity-[0.04]"
           style={{ background: 'linear-gradient(45deg, #6366F1, #A5B4FC)', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }} />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-20 bg-white" style={{ borderBottom: '1px solid #E5E7EB' }}>
        <div className="w-full px-8 sm:px-12 h-16 flex items-center justify-between">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: '#4F46E5' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: '#111827' }}>
              Collab<span style={{ color: '#4F46E5' }}>Engine</span>
            </span>
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all"
              style={{ border: '1px solid transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div className={`w-9 h-9 rounded-full avatar-color-${avatarIndex(user?.userId)} flex items-center justify-center text-white text-sm font-bold`}>
                {user?.userName?.[0]?.toUpperCase() || "?"}
              </div>
              <span className="text-sm font-medium hidden sm:inline" style={{ color: '#111827' }}>
                {user?.userName}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            {showProfile && (
              <ProfileDropdown user={user} onClose={() => setShowProfile(false)} onLogout={logout} />
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="relative z-10 w-full px-8 sm:px-12 py-10 animate-fade-in">
        <InvitationBanner />

        {/* Title row */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: '#6366F1' }}>
              Welcome back
            </p>
            <h2 className="text-3xl font-extrabold mb-1.5" style={{ color: '#111827' }}>
              Your <span style={{ color: '#4F46E5' }}>Workspaces</span>
            </h2>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg active:scale-[0.98] cursor-pointer"
            style={{ background: '#4F46E5' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#4338CA'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#4F46E5'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Workspace
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="mb-6 bg-white rounded-xl p-5 animate-fade-in-up"
               style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter workspace name..."
                required
                disabled={createLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none disabled:opacity-50"
                style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827' }}
              />
              <button type="submit" disabled={createLoading}
                className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                style={{ background: '#4F46E5' }}>
                {createLoading ? "Creating..." : "Create"}
              </button>
            </form>
            {createError && (
              <p className="text-xs mt-2 text-red-600">{createError}</p>
            )}
          </div>
        )}

        {/* Workspace list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
                 style={{ borderColor: '#4F46E5', borderTopColor: 'transparent' }} />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center"
               style={{ border: '1px solid #E5E7EB' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                 style={{ background: '#EEF2FF' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <p className="text-lg font-bold mb-1" style={{ color: '#111827' }}>No workspaces yet</p>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Create your first workspace to start collaborating</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="ws-card bg-white rounded-2xl overflow-hidden group relative cursor-pointer animate-fade-in-up"
                style={{ border: '1px solid #E5E7EB' }}
                onClick={() => navigate(`/workspaces/${ws.id}`)}
              >
                {/* Decorative right-side gradient shape */}
                <div className="absolute right-0 top-0 bottom-0 w-[200px] opacity-[0.04] pointer-events-none"
                     style={{ background: 'linear-gradient(135deg, transparent 30%, #6366F1 100%)', borderRadius: '0 16px 16px 0' }} />

                <div className="relative flex items-center px-6 py-5 gap-6">
                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-2xl avatar-color-${avatarIndex(ws.name)} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}
                       style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {ws.name?.[0]?.toUpperCase() || "W"}
                  </div>

                  {/* Name + role */}
                  <div className="min-w-0 mr-auto">
                    <h3 className="text-base font-bold truncate" style={{ color: '#111827' }}>
                      {ws.name}
                    </h3>
                    <div className="mt-1.5">
                      <RoleBadge role={ws.role} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-0 flex-shrink-0">
                    {/* Members */}
                    <div className="flex items-center gap-2 px-5" style={{ borderRight: '1px solid #E5E7EB' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span className="text-sm" style={{ color: '#6B7280' }}>
                        {ws._count?.members || 0} member{(ws._count?.members || 0) !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Channels */}
                    <div className="flex items-center gap-2 px-5" style={{ borderRight: '1px solid #E5E7EB' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 9h16" />
                        <path d="M4 15h16" />
                        <path d="M10 3L8 21" />
                        <path d="M16 3l-2 18" />
                      </svg>
                      <span className="text-sm" style={{ color: '#6B7280' }}>
                        {ws._count?.channels || 0} channel{(ws._count?.channels || 0) !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Joined */}
                    <div className="flex items-center gap-2 px-5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="text-sm" style={{ color: '#6B7280' }}>
                        Joined {formatDate(ws.joinedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Delete button (OWNER) */}
                  {ws.role === "OWNER" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(ws); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100"
                      style={{ color: '#D1D5DB' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#D1D5DB'; e.currentTarget.style.background = 'transparent'; }}
                      title="Delete workspace"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3,6 5,6 21,6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}

                  {/* Chevron */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                       className="flex-shrink-0 group-hover:translate-x-1 transition-transform" style={{ transition: 'transform 0.2s, color 0.2s' }}>
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </div>

                {/* Mobile stats — visible on small screens */}
                <div className="sm:hidden px-6 pb-4 flex flex-wrap gap-4 text-xs" style={{ color: '#9CA3AF' }}>
                  <span className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    {ws._count?.members || 0} members
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3L8 21"/><path d="M16 3l-2 18"/></svg>
                    {ws._count?.channels || 0} channels
                  </span>
                  <span className="flex items-center gap-1.5">
                    Joined {formatDate(ws.joinedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirmModal
          workspace={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
