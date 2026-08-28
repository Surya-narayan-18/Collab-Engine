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
    try {
      const ws = await createWorkspace(newName);
      setNewName("");
      setShowCreate(false);
      navigate(`/workspaces/${ws.id}`);
    } catch (err) {
      setCreateError(err.message);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-ce-bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 glass-card border-b"
              style={{ borderColor: 'var(--color-ce-border-subtle)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-md shadow-ce-accent/15">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-ce-text-primary">Collab</span>
              <span className="text-gradient">Engine</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full avatar-gradient-${avatarIndex(user?.username)} flex items-center justify-center text-white text-sm font-semibold shadow-md`}>
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
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-brand text-white text-sm font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-ce-accent/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
          <div className="mb-8 glass-card-elevated rounded-xl p-5 animate-fade-in-up">
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
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl text-ce-text-primary placeholder-ce-text-muted focus:outline-none input-glow transition-all duration-200"
                  style={{ background: 'var(--color-ce-bg-tertiary)', border: '1px solid var(--color-ce-border)' }}
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-brand text-white text-sm font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-ce-accent/20 cursor-pointer"
              >
                Create
              </button>
            </form>
            {createError && (
              <p className="text-ce-danger text-sm mt-3 ml-1">{createError}</p>
            )}
          </div>
        )}

        {/* Workspace list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-ce-accent border-t-transparent animate-spin" />
              <p className="text-sm text-ce-text-tertiary">Loading workspaces...</p>
            </div>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-24 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-brand opacity-20 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <p className="text-ce-text-secondary text-lg font-medium mb-2">No workspaces yet</p>
            <p className="text-ce-text-muted text-sm">Create your first workspace to start collaborating</p>
          </div>
        ) : (
          <div className="grid gap-3 stagger-children">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => navigate(`/workspaces/${ws.id}`)}
                className="workspace-card glass-card rounded-xl p-5 text-left cursor-pointer group animate-fade-in-up relative overflow-hidden"
              >
                {/* Left gradient accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-brand rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl avatar-gradient-${avatarIndex(ws.name)} flex items-center justify-center text-white text-lg font-bold shadow-md flex-shrink-0`}>
                      {ws.name?.[0]?.toUpperCase() || "W"}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-ce-text-primary group-hover:text-gradient transition-colors duration-200">
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
