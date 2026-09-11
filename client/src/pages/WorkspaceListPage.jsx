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
  const cls =
    role === "OWNER" ? "role-badge-owner" :
    role === "ADMIN" ? "role-badge-admin" :
    "role-badge-member";
  return (
    <span className={`${cls} text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider`}>
      {role}
    </span>
  );
}

export default function WorkspaceListPage() {
  const { user, logout } = useAuth();
  const { workspaces, fetchWorkspaces, createWorkspace, fetchInvitations, loading } = useWorkspace();
  const { onInvitation } = useSocket();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
    fetchInvitations();
  }, [fetchWorkspaces, fetchInvitations]);

  // Listen for real-time invitation notifications
  useEffect(() => {
    const unsub = onInvitation(() => {
      fetchInvitations();
    });
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-ce-bg-secondary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white"
              style={{ borderBottom: '1px solid var(--color-ce-border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                 style={{ background: 'var(--color-ce-accent)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ce-text-primary">
              Collab<span style={{ color: 'var(--color-ce-accent)' }}>Engine</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full avatar-color-${avatarIndex(user?.username)} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}>
                {user?.username?.[0]?.toUpperCase() || "?"}
              </div>
              <span className="text-sm text-ce-text-secondary font-medium hidden sm:block">
                {user?.username}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-ce-text-tertiary hover:text-ce-text-primary transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-ce-bg-hover"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10 animate-fade-in">
        {/* Pending invitations */}
        <InvitationBanner />

        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-ce-text-primary mb-1">Your Workspaces</h2>
            <p className="text-sm text-ce-text-tertiary">
              {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-md active:scale-[0.98] cursor-pointer"
            style={{ background: 'var(--color-ce-accent)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent)'; }}
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
          <div className="mb-8 card-elevated rounded-xl p-5 animate-fade-in-up">
            <form onSubmit={handleCreate} className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ce-text-muted pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter workspace name..."
                  required
                  disabled={createLoading}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl text-ce-text-primary placeholder-ce-text-muted focus:outline-none input-focus transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'var(--color-ce-bg-secondary)', border: '1px solid var(--color-ce-border)' }}
                />
              </div>
              <button
                type="submit"
                disabled={createLoading}
                className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                style={{ background: 'var(--color-ce-accent)' }}
                onMouseEnter={(e) => { if (!createLoading) e.currentTarget.style.background = 'var(--color-ce-accent-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent)'; }}
              >
                {createLoading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : "Create"}
              </button>
            </form>
            {createError && (
              <div className="error-alert mt-3 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{createError}</span>
              </div>
            )}
          </div>
        )}

        {/* Workspace list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 animate-spin"
                   style={{ borderColor: 'var(--color-ce-accent)', borderTopColor: 'transparent' }} />
              <p className="text-sm text-ce-text-tertiary">Loading workspaces...</p>
            </div>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="empty-state animate-fade-in-up">
            <div className="empty-state-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2F6FED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <p className="empty-state-title">No workspaces yet</p>
            <p className="empty-state-message">Create your first workspace to start collaborating</p>
          </div>
        ) : (
          <div className="grid gap-3 stagger-children">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => navigate(`/workspaces/${ws.id}`)}
                className="workspace-card card rounded-xl p-5 text-left cursor-pointer group animate-fade-in-up relative overflow-hidden"
              >
                {/* Left accent bar on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                     style={{ background: 'var(--color-ce-accent)' }} />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl avatar-color-${avatarIndex(ws.name)} flex items-center justify-center text-white text-lg font-bold shadow-sm flex-shrink-0`}>
                      {ws.name?.[0]?.toUpperCase() || "W"}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-ce-text-primary transition-colors duration-200"
                          style={{ color: 'var(--color-ce-text-primary)' }}>
                        {ws.name}
                      </h3>
                      <p className="text-sm text-ce-text-tertiary mt-0.5 flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          {ws._count?.members || 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 9h16" />
                            <path d="M4 15h16" />
                            <path d="M10 3L8 21" />
                            <path d="M16 3l-2 18" />
                          </svg>
                          {ws._count?.channels || 0}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RoleBadge role={ws.role} />
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ce-text-muted group-hover:text-ce-accent transition-colors">
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
