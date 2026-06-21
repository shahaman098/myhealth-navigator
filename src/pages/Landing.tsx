import { Link } from "react-router-dom";
import { ArrowRight, HeartPulse, Languages, Radio, ShieldCheck } from "lucide-react";

/**
 * One-screen animated landing page.
 * Self-contained: no Layout chrome, fits in 100vh, animated via Tailwind + inline keyframes.
 */
const Landing = () => {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Inline keyframes (scoped to this page) */}
      <style>{`
        @keyframes ln-float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50%      { transform: translateY(-14px) translateX(6px); }
        }
        @keyframes ln-float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50%      { transform: translateY(18px) translateX(-10px); }
        }
        @keyframes ln-pulse-ring {
          0%   { transform: scale(0.85); opacity: 0.55; }
          80%  { transform: scale(1.6);  opacity: 0;    }
          100% { transform: scale(1.6);  opacity: 0;    }
        }
        @keyframes ln-fade-up {
          0%   { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes ln-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes ln-wave {
          0%, 100% { transform: scaleY(0.4); }
          50%      { transform: scaleY(1); }
        }
        @keyframes ln-orbit {
          0%   { transform: rotate(0deg)   translateX(140px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(140px) rotate(-360deg); }
        }
        @keyframes ln-orbit-rev {
          0%   { transform: rotate(0deg)   translateX(200px) rotate(0deg); }
          100% { transform: rotate(-360deg) translateX(200px) rotate(360deg); }
        }
        @keyframes ln-grid-drift {
          0%   { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        .ln-anim-fade-up { animation: ln-fade-up .8s cubic-bezier(.2,.7,.2,1) both; }
        .ln-anim-float { animation: ln-float 6s ease-in-out infinite; }
        .ln-anim-float-slow { animation: ln-float-slow 9s ease-in-out infinite; }
        .ln-anim-ring { animation: ln-pulse-ring 2.6s ease-out infinite; }
        .ln-anim-orbit { animation: ln-orbit 18s linear infinite; }
        .ln-anim-orbit-rev { animation: ln-orbit-rev 26s linear infinite; }
        .ln-anim-grid {
          background-image:
            linear-gradient(hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: ln-grid-drift 30s linear infinite;
        }
        .ln-shimmer {
          background: linear-gradient(
            90deg,
            hsl(var(--foreground)) 0%,
            hsl(var(--muted-foreground)) 45%,
            hsl(var(--foreground)) 55%,
            hsl(var(--muted-foreground)) 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: ln-shimmer 6s linear infinite;
        }
        .ln-wave-bar { animation: ln-wave 1.1s ease-in-out infinite; transform-origin: center; }
        @media (prefers-reduced-motion: reduce) {
          .ln-anim-fade-up,
          .ln-anim-float,
          .ln-anim-float-slow,
          .ln-anim-ring,
          .ln-anim-orbit,
          .ln-anim-orbit-rev,
          .ln-anim-grid,
          .ln-shimmer,
          .ln-wave-bar { animation: none !important; }
        }
      `}</style>

      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 ln-anim-grid opacity-[0.25]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_75%)]" />
      <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl ln-anim-float-slow" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[560px] w-[560px] rounded-full bg-primary/10 blur-3xl ln-anim-float" />

      {/* Top brand bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5 lg:px-10">
        <div className="flex items-center gap-2.5 ln-anim-fade-up" style={{ animationDelay: "0ms" }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <HeartPulse className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">MyHealth Navigator</div>
            <div className="text-[11px] text-muted-foreground">Clinical interpreter workspace</div>
          </div>
        </div>
        <div className="hidden sm:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium bg-[hsl(var(--surface-2,var(--muted)))] border text-muted-foreground ln-anim-fade-up" style={{ animationDelay: "120ms" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 ln-anim-ring" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Live · synthetic demo
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 grid h-full grid-cols-1 lg:grid-cols-[1.05fr_1fr] items-center gap-8 px-6 lg:px-16 pt-24 pb-10">
        {/* Left: copy */}
        <div className="max-w-xl">
          <div
            className="inline-flex items-center gap-2 h-7 px-3 rounded-full border bg-background/60 backdrop-blur text-[11px] font-medium text-muted-foreground ln-anim-fade-up"
            style={{ animationDelay: "60ms" }}
          >
            <Languages className="h-3.5 w-3.5 text-primary" />
            Real-time multilingual interpretation
          </div>

          <h1
            className="mt-5 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] ln-anim-fade-up"
            style={{ animationDelay: "160ms" }}
          >
            Every word{" "}
            <span className="ln-shimmer">understood.</span>
            <br />
            Every patient{" "}
            <span className="ln-shimmer">heard.</span>
          </h1>

          <p
            className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed ln-anim-fade-up"
            style={{ animationDelay: "260ms" }}
          >
            An AI interpreter that sits between clinician and patient — transcribing,
            translating, and producing a clinician-approved record of every conversation.
          </p>

          <div
            className="mt-7 flex flex-wrap gap-3 ln-anim-fade-up"
            style={{ animationDelay: "360ms" }}
          >
            <Link
              to="/live"
              className="group inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Radio className="h-4 w-4" />
              Open live room
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border bg-background/60 backdrop-blur text-sm font-semibold transition-colors hover:border-primary/40"
            >
              Watch demo
            </Link>
          </div>

          <div
            className="mt-8 flex items-center gap-5 text-[11px] text-muted-foreground ln-anim-fade-up"
            style={{ animationDelay: "460ms" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Clinician-reviewed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
              Bilingual transcript
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
              Audit trail
            </span>
          </div>
        </div>

        {/* Right: animated orb */}
        <div className="relative hidden lg:flex items-center justify-center h-full">
          <div className="relative h-[460px] w-[460px]">
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full border border-primary/30 ln-anim-ring" />
            <div className="absolute inset-0 rounded-full border border-primary/20 ln-anim-ring" style={{ animationDelay: "0.9s" }} />
            <div className="absolute inset-0 rounded-full border border-primary/10 ln-anim-ring" style={{ animationDelay: "1.8s" }} />

            {/* Core */}
            <div className="absolute inset-16 rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-transparent backdrop-blur-sm border border-primary/30 flex items-center justify-center shadow-2xl">
              <div className="flex items-end gap-1.5 h-16">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <span
                    key={i}
                    className="ln-wave-bar w-1.5 rounded-full bg-primary"
                    style={{
                      height: `${30 + (i % 3) * 18}px`,
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Orbiting language bubbles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="ln-anim-orbit">
                <div className="rounded-xl border bg-background/80 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-lg">
                  <span className="text-muted-foreground mr-1">EN</span>
                  "Take twice daily"
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="ln-anim-orbit" style={{ animationDelay: "-6s" }}>
                <div className="rounded-xl border bg-background/80 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-lg">
                  <span className="text-muted-foreground mr-1">AUTO</span>
                  "Detected language"
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="ln-anim-orbit-rev">
                <div className="rounded-xl border bg-background/80 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-lg">
                  <span className="text-muted-foreground mr-1">EN</span>
                  "Any allergies?"
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="ln-anim-orbit-rev" style={{ animationDelay: "-13s" }}>
                <div className="rounded-xl border bg-background/80 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-lg">
                  <span className="text-muted-foreground mr-1">AUTO</span>
                  "Live translation"
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div className="absolute bottom-3 left-0 right-0 z-10 text-center text-[11px] text-muted-foreground/60">
        Synthetic demo · no real patient data · not a clinical decision tool
      </div>
    </div>
  );
};

export default Landing;
