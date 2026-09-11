import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
          <p className="text-ce-text-secondary text-base">Welcome back — pick up where you left off</p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="card-elevated rounded-2xl p-8 space-y-6"
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

          {/* Identifier (Email or User ID) */}
          <div>
            <label className="block text-sm font-medium text-ce-text-secondary mb-2">Email or user ID</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ce-text-muted pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-ce-text-primary placeholder-ce-text-muted focus:outline-none input-focus transition-all duration-200"
                style={{ background: 'var(--color-ce-bg-secondary)', border: '1px solid var(--color-ce-border)' }}
                placeholder="Email or user ID"
                id="login-identifier"
              />
            </div>
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
                placeholder="Enter your password"
                id="login-password"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100 cursor-pointer"
            style={{ background: loading ? 'var(--color-ce-accent)' : 'var(--color-ce-accent)' }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--color-ce-accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent)'; }}
            id="login-submit"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : "Sign in"}
          </button>

          {/* Link to register */}
          <p className="text-center text-sm text-ce-text-tertiary pt-2">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium transition-colors no-underline" style={{ color: 'var(--color-ce-accent)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-ce-accent-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-ce-accent)'; }}>
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
