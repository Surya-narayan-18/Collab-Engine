import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [handleId, setHandleId] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      await register(email, handleId, userName, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      if (err.details) setFieldErrors(err.details);
    } finally {
      setLoading(false);
    }
  }

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { width: "0%", color: "transparent", label: "" };
    if (password.length < 6) return { width: "25%", color: "var(--color-ce-danger)", label: "Weak" };
    if (password.length < 10) return { width: "50%", color: "var(--color-ce-warning)", label: "Fair" };
    if (password.length < 14) return { width: "75%", color: "var(--color-ce-accent)", label: "Good" };
    return { width: "100%", color: "var(--color-ce-success)", label: "Strong" };
  };
  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'var(--color-ce-bg-secondary)' }}>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Logo & Tagline */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                 style={{ background: 'var(--color-ce-accent)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-ce-text-primary">
              Collab<span style={{ color: 'var(--color-ce-accent)' }}>Engine</span>
            </h1>
          </div>
          <p className="text-ce-text-secondary text-base">Start collaborating in seconds</p>
        </div>

        {/* Register Form */}
        <form
          onSubmit={handleSubmit}
          className="card-elevated rounded-2xl p-8 space-y-5"
        >
          {/* Error alert */}
          {error && (
            <div className="error-alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-ce-text-secondary mb-2">Email address</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ce-text-muted pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-ce-text-primary placeholder-ce-text-muted focus:outline-none input-focus transition-all duration-200"
                style={{ background: 'var(--color-ce-bg-secondary)', border: '1px solid var(--color-ce-border)' }}
                placeholder="name@company.com"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs mt-1.5 ml-1" style={{ color: 'var(--color-ce-danger)' }}>{fieldErrors.email[0]}</p>
            )}
          </div>

          {/* User ID (unique handle) */}
          <div>
            <label className="block text-sm font-medium text-ce-text-secondary mb-2">User ID</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ce-text-muted pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
              <input
                type="text"
                required
                value={handleId}
                onChange={(e) => setHandleId(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-ce-text-primary placeholder-ce-text-muted focus:outline-none input-focus transition-all duration-200"
                style={{ background: 'var(--color-ce-bg-secondary)', border: '1px solid var(--color-ce-border)' }}
                placeholder="e.g. surya_18 (used for login)"
              />
            </div>
            <p className="text-[11px] text-ce-text-muted mt-1 ml-1">Letters, numbers, hyphens, underscores. Used for login &amp; mentions.</p>
            {fieldErrors.userId && (
              <p className="text-xs mt-1.5 ml-1" style={{ color: 'var(--color-ce-danger)' }}>{fieldErrors.userId[0]}</p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-ce-text-secondary mb-2">Display Name</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ce-text-muted pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-ce-text-primary placeholder-ce-text-muted focus:outline-none input-focus transition-all duration-200"
                style={{ background: 'var(--color-ce-bg-secondary)', border: '1px solid var(--color-ce-border)' }}
                placeholder="Your display name"
              />
            </div>
            {fieldErrors.userName && (
              <p className="text-xs mt-1.5 ml-1" style={{ color: 'var(--color-ce-danger)' }}>{fieldErrors.userName[0]}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-ce-text-secondary mb-2">Password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ce-text-muted pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-ce-text-primary placeholder-ce-text-muted focus:outline-none input-focus transition-all duration-200"
                style={{ background: 'var(--color-ce-bg-secondary)', border: '1px solid var(--color-ce-border)' }}
                placeholder="Create a strong password"
              />
            </div>
            {/* Password strength bar */}
            {password && (
              <div className="mt-2 ml-1">
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-ce-bg-tertiary)' }}>
                  <div className="h-full rounded-full transition-all duration-300"
                       style={{ width: strength.width, background: strength.color }} />
                </div>
                <p className="text-xs mt-1" style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}
            {fieldErrors.password && (
              <p className="text-xs mt-1.5 ml-1" style={{ color: 'var(--color-ce-danger)' }}>{fieldErrors.password[0]}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100 cursor-pointer"
            style={{ background: 'var(--color-ce-accent)' }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--color-ce-accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent)'; }}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </span>
            ) : "Create account"}
          </button>

          {/* Link to login */}
          <p className="text-center text-sm text-ce-text-tertiary pt-1">
            Already have an account?{" "}
            <Link to="/login" className="font-medium transition-colors no-underline" style={{ color: 'var(--color-ce-accent)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-ce-accent-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-ce-accent)'; }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
