import { useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";

// Deterministic avatar color
function avatarIndex(str) {
  let hash = 0;
  for (let i = 0; i < (str || "").length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 8;
}

export default function InvitationBanner() {
  const { invitations, acceptInvitation, declineInvitation } = useWorkspace();
  const [processingId, setProcessingId] = useState(null);

  if (!invitations || invitations.length === 0) return null;

  async function handleAccept(id) {
    setProcessingId(id);
    try {
      await acceptInvitation(id);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDecline(id) {
    setProcessingId(id);
    try {
      await declineInvitation(id);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="mb-6 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-ce-accent)' }}>
          <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
        </svg>
        <h3 className="text-sm font-semibold text-ce-text-primary">
          Pending Invitations
        </h3>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-ce-accent-soft)', color: 'var(--color-ce-accent)' }}>
          {invitations.length}
        </span>
      </div>

      <div className="space-y-2">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="card rounded-xl p-4 animate-fade-in-up relative overflow-hidden"
          >
            {/* Accent left border */}
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                 style={{ background: 'var(--color-ce-accent)' }} />

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-lg avatar-color-${avatarIndex(inv.workspace?.name)} flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0`}>
                  {inv.workspace?.name?.[0]?.toUpperCase() || "W"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ce-text-primary truncate">
                    {inv.workspace?.name}
                  </p>
                  <p className="text-xs text-ce-text-muted truncate">
                    Invited by <span className="text-ce-text-secondary font-medium">{inv.inviter?.username}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDecline(inv.id)}
                  disabled={processingId === inv.id}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ce-bg-hover"
                  style={{
                    color: 'var(--color-ce-text-secondary)',
                    background: 'white',
                    border: '1px solid var(--color-ce-border)',
                  }}
                >
                  Decline
                </button>
                <button
                  onClick={() => handleAccept(inv.id)}
                  disabled={processingId === inv.id}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  style={{ background: 'var(--color-ce-accent)' }}
                  onMouseEnter={(e) => { if (processingId !== inv.id) e.currentTarget.style.background = 'var(--color-ce-accent-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent)'; }}
                >
                  {processingId === inv.id ? (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : "Accept"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
