import { Link } from "react-router";
import { useRef, useEffect, useState } from "react";

/* Scroll-reveal wrapper: children start invisible, animate in when scrolled into view */
function ScrollReveal({ children, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      {children}
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white border border-ce-border rounded-2xl p-7 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-200"
           style={{ background: 'var(--color-ce-accent-soft)' }}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-ce-text-primary mb-2">{title}</h3>
      <p className="text-sm text-ce-text-tertiary leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-3xl sm:text-4xl font-extrabold text-ce-text-primary mb-1">{value}</p>
      <p className="text-sm text-ce-text-tertiary">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-ce-bg-primary)' }}>
      {/* ====== Navbar ====== */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm" style={{ borderBottom: '1px solid var(--color-ce-border)' }}>
        <div className="w-full mx-auto px-8 sm:px-12 lg:px-16 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                 style={{ background: 'var(--color-ce-accent)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-ce-text-primary">
              Collab<span style={{ color: 'var(--color-ce-accent)' }}>Engine</span>
            </span>
          </Link>

          {/* Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-ce-text-secondary hover:text-ce-text-primary transition-colors no-underline">Features</a>
            <a href="#stats" className="text-sm font-medium text-ce-text-secondary hover:text-ce-text-primary transition-colors no-underline">Why CollabEngine</a>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link to="/login"
                  className="text-sm font-medium text-ce-text-secondary hover:text-ce-text-primary transition-colors no-underline px-3 py-2 rounded-lg hover:bg-ce-bg-hover">
              Log in
            </Link>
            <Link to="/register"
                  className="text-sm font-semibold text-white no-underline px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                  style={{ background: 'var(--color-ce-accent)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent)'; }}>
              Sign up free
            </Link>
          </div>
        </div>
      </nav>

      {/* ====== Hero Section ====== */}
      <section className="relative overflow-hidden">
        {/* Subtle decorative shapes */}
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full opacity-[0.035]"
             style={{ background: 'var(--color-ce-accent)' }} />
        <div className="absolute bottom-10 left-5 w-48 h-48 rounded-full opacity-[0.03]"
             style={{ background: 'var(--color-ce-accent)' }} />

        <div className="w-full mx-auto px-8 sm:px-12 lg:px-16 pt-20 pb-32 sm:pt-28 sm:pb-40 min-h-[calc(100vh-64px)] flex items-center">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Copy */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6"
                   style={{ background: 'var(--color-ce-accent-soft)', color: 'var(--color-ce-accent)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-ce-success)' }} />
                Now in beta — free to use
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.1] tracking-tight text-ce-text-primary mb-6">
                Team collaboration,{" "}
                <span style={{ color: 'var(--color-ce-accent)' }}>simplified.</span>
              </h1>
              <p className="text-lg sm:text-xl text-ce-text-tertiary leading-relaxed mb-10 max-w-xl">
                Workspaces, channels, real-time messaging, and presence — everything your team needs to stay connected, in one clean interface.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/register"
                      className="inline-flex items-center gap-2 px-7 py-3.5 text-white text-base font-semibold rounded-xl transition-all duration-200 hover:shadow-lg active:scale-[0.98] no-underline"
                      style={{ background: 'var(--color-ce-accent)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent)'; }}>
                  Get started
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12,5 19,12 12,19" />
                  </svg>
                </Link>
                <Link to="/login"
                      className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 no-underline"
                      style={{ color: 'var(--color-ce-text-secondary)', border: '1px solid var(--color-ce-border)', background: 'white' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ce-bg-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}>
                  Log in to your workspace
                </Link>
              </div>
            </div>

            {/* Right — Product Illustration */}
            <div className="hidden md:block animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                {/* Mock app window */}
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-ce-border)', boxShadow: 'var(--shadow-xl)' }}>
                  {/* Title bar */}
                  <div className="h-10 flex items-center px-4 gap-2" style={{ background: 'var(--color-ce-bg-secondary)', borderBottom: '1px solid var(--color-ce-border)' }}>
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="ml-3 text-[11px] text-ce-text-muted font-medium">CollabEngine</span>
                  </div>
                  {/* Content */}
                  <div className="flex" style={{ height: '340px', background: 'white' }}>
                    {/* Sidebar mock */}
                    <div className="w-[180px] flex-shrink-0 p-3 space-y-3" style={{ background: 'var(--color-ce-bg-secondary)', borderRight: '1px solid var(--color-ce-border)' }}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold" style={{ background: 'var(--color-ce-accent)' }}>D</div>
                        <span className="text-xs font-semibold text-ce-text-primary truncate">Design Team</span>
                      </div>
                      <p className="text-[9px] font-semibold text-ce-text-muted uppercase tracking-widest px-1">Channels</p>
                      <div className="rounded-lg px-2 py-1.5 text-xs font-medium text-ce-accent" style={{ background: 'var(--color-ce-accent-soft)' }}>
                        <span className="opacity-60 mr-1">#</span> general
                      </div>
                      <div className="px-2 py-1.5 text-xs text-ce-text-tertiary">
                        <span className="opacity-60 mr-1">#</span> design
                      </div>
                      <div className="px-2 py-1.5 text-xs text-ce-text-tertiary">
                        <span className="opacity-60 mr-1">#</span> random
                      </div>
                      <p className="text-[9px] font-semibold text-ce-text-muted uppercase tracking-widest px-1 pt-3">Online</p>
                      <div className="flex items-center gap-2 px-1">
                        <div className="relative">
                          <div className="w-5 h-5 rounded-full bg-ce-accent flex items-center justify-center text-white text-[8px] font-bold">A</div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-ce-bg-secondary" style={{ background: 'var(--color-ce-success)' }} />
                        </div>
                        <span className="text-[11px] text-ce-text-secondary">Alice</span>
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <div className="relative">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ background: '#22C55E' }}>B</div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-ce-bg-secondary" style={{ background: 'var(--color-ce-success)' }} />
                        </div>
                        <span className="text-[11px] text-ce-text-secondary">Bob</span>
                      </div>
                    </div>
                    {/* Chat mock */}
                    <div className="flex-1 flex flex-col">
                      <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--color-ce-border)' }}>
                        <span className="text-xs text-ce-text-muted">#</span>
                        <span className="text-xs font-semibold text-ce-text-primary">general</span>
                      </div>
                      <div className="flex-1 p-4 space-y-3 overflow-hidden">
                        <div className="flex justify-start">
                          <div className="max-w-[75%]">
                            <p className="text-[10px] font-semibold text-ce-text-secondary mb-0.5">Alice</p>
                            <div className="rounded-xl rounded-bl-sm px-3 py-2 text-xs text-ce-text-primary" style={{ background: 'var(--color-ce-bg-tertiary)' }}>
                              Hey team! The new design system looks great 🎨
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="max-w-[75%]">
                            <p className="text-[10px] font-semibold text-right mb-0.5" style={{ color: 'var(--color-ce-accent)' }}>You</p>
                            <div className="rounded-xl rounded-br-sm px-3 py-2 text-xs text-ce-text-primary" style={{ background: 'rgba(47, 111, 237, 0.1)' }}>
                              Thanks! Let&apos;s finalize the color tokens today.
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="max-w-[75%]">
                            <p className="text-[10px] font-semibold text-ce-text-secondary mb-0.5">Bob</p>
                            <div className="rounded-xl rounded-bl-sm px-3 py-2 text-xs text-ce-text-primary" style={{ background: 'var(--color-ce-bg-tertiary)' }}>
                              Sounds good! I&apos;ll push the component updates after.
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="typing-dot" style={{ width: '4px', height: '4px' }} />
                          <span className="typing-dot" style={{ width: '4px', height: '4px', animationDelay: '0.2s' }} />
                          <span className="typing-dot" style={{ width: '4px', height: '4px', animationDelay: '0.4s' }} />
                          <span className="text-[10px] text-ce-text-muted ml-0.5">Alice is typing</span>
                        </div>
                      </div>
                      <div className="px-3 pb-3">
                        <div className="rounded-xl px-3 py-2.5 text-xs text-ce-text-muted" style={{ border: '1px solid var(--color-ce-border)', background: 'var(--color-ce-bg-secondary)' }}>
                          Type a message in #general...
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== Features Section ====== */}
      <section id="features" className="py-20 sm:py-28" style={{ background: 'var(--color-ce-bg-secondary)' }}>
        <div className="w-full mx-auto px-8 sm:px-12 lg:px-16">
          <ScrollReveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-ce-accent)' }}>Features</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ce-text-primary mb-4">Everything your team needs</h2>
              <p className="text-base text-ce-text-tertiary max-w-lg mx-auto">Powerful collaboration tools in a clean, focused interface — no distractions, just productivity.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2F6FED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3L8 21"/><path d="M16 3l-2 18"/></svg>}
                title="Channels"
                description="Organized conversations by topic, project, or team — join any channel with one click."
              />
              <FeatureCard
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2F6FED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                title="Real-time Messaging"
                description="Instant delivery with typing indicators, read receipts, and message grouping."
              />
              <FeatureCard
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2F6FED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                title="Workspaces & Teams"
                description="Create workspaces, invite members, manage roles — OWNER, ADMIN, or MEMBER."
              />
              <FeatureCard
                icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2F6FED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
                title="Live Presence"
                description="See who's online right now with real-time presence indicators and status dots."
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ====== Stats / Social Proof Section ====== */}
      <section id="stats" className="py-20 sm:py-24">
        <div className="w-full mx-auto px-8 sm:px-12 lg:px-16">
          <ScrollReveal>
            <div className="card-elevated rounded-2xl p-10 sm:p-14">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-ce-text-primary mb-3">Trusted by growing teams</h2>
                <p className="text-base text-ce-text-tertiary">Fast, reliable, and built for the way modern teams work.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
                <StatCard value="10k+" label="Active teams" />
                <StatCard value="1M+" label="Messages sent" />
                <StatCard value="99.9%" label="Uptime SLA" />
                <StatCard value="<50ms" label="Message latency" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ====== CTA Section ====== */}
      <section className="py-20 sm:py-24" style={{ background: 'var(--color-ce-bg-secondary)' }}>
        <ScrollReveal className="max-w-5xl mx-auto px-8 sm:px-12 lg:px-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ce-text-primary mb-4">
            Ready to streamline your team&apos;s communication?
          </h2>
          <p className="text-base text-ce-text-tertiary mb-8 max-w-lg mx-auto">
            Create a workspace, invite your team, and start collaborating in under a minute.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 text-white text-base font-semibold rounded-xl transition-all duration-200 hover:shadow-lg active:scale-[0.98] no-underline"
                  style={{ background: 'var(--color-ce-accent)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-ce-accent)'; }}>
              Get started for free
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12,5 19,12 12,19" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ====== Footer ====== */}
      <footer style={{ borderTop: '1px solid var(--color-ce-border)' }}>
        <div className="w-full mx-auto px-8 sm:px-12 lg:px-16 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
                 style={{ background: 'var(--color-ce-accent)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-ce-text-primary">
              Collab<span style={{ color: 'var(--color-ce-accent)' }}>Engine</span>
            </span>
          </div>
          <p className="text-xs text-ce-text-muted">© {new Date().getFullYear()} CollabEngine. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
