import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  HeartPulse,
  Languages,
  Radio,
  ShieldCheck,
  MonitorPlay,
} from "lucide-react";

/**
 * One-screen animated landing page served at /demo.
 * Fits in a single viewport (accounts for Layout header+safety bar = 6.5rem).
 * Pure Tailwind + scoped @keyframes, no extra dependencies.
 */
const DemoConversation = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Lingo";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="relative h-[calc(100vh-6.5rem)] w-full overflow-hidden bg-background text-foreground">
      {/* Scoped keyframes */}
      <style>{`
        @keyframes dc-float       { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-14px) translateX(6px); } }
        @keyframes dc-float-slow  { 0%,100% { transform: translateY(0) translateX(0); } 50% { transform: translateY(18px) translateX(-10px); } }
        @keyframes dc-pulse-ring  { 0% { transform: scale(0.85); opacity: 0.55; } 80% { transform: scale(1.6); opacity: 0; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes dc-fade-up     { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes dc-shimmer     { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes dc-wave        { 0%,100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
        @keyframes dc-orbit       { 0% { transform: rotate(0deg) translateX(150px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(150px) rotate(-360deg); } }
        @keyframes dc-orbit-rev   { 0% { transform: rotate(0deg) translateX(210px) rotate(0deg); } 100% { transform: rotate(-360deg) translateX(210px) rotate(360deg); } }
        @keyframes dc-grid-drift  { 0% { background-position: 0 0; } 100% { background-position: 60px 60px; } }
        @keyframes dc-blob        { 0%,100% { border-radius: 42% 58% 56% 44% / 48% 52% 48% 52%; } 50% { border-radius: 58% 42% 44% 56% / 52% 48% 52% 48%; } }
        @keyframes dc-tilt        { 0%,100% { transform: rotate(-1deg); } 50% { transform: rotate(1.5deg); } }

        .dc-fade        { animation: dc-fade-up .8s cubic-bezier(.2,.7,.2,1) both; }
        .dc-float       { animation: dc-float 6s ease-in-out infinite; }
        .dc-float-slow  { animation: dc-float-slow 9s ease-in-out infinite; }
        .dc-ring        { animation: dc-pulse-ring 2.6s ease-out infinite; }
        .dc-orbit       { animation: dc-orbit 18s linear infinite; }
        .dc-orbit-rev   { animation: dc-orbit-rev 26s linear infinite; }
        .dc-grid {
          background-image:
            linear-gradient(hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: dc-grid-drift 30s linear infinite;
        }
        .dc-shimmer {
          background: linear-gradient(90deg,
            hsl(var(--foreground)) 0%,
            hsl(var(--muted-foreground)) 45%,
            hsl(var(--foreground)) 55%,
            hsl(var(--muted-foreground)) 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: dc-shimmer 6s linear infinite;
        }
        .dc-wave        { animation: dc-wave 1.1s ease-in-out infinite; transform-origin: center; }
        .dc-blob        { animation: dc-blob 12s ease-in-out infinite, dc-tilt 14s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .dc-fade, .dc-float, .dc-float-slow, .dc-ring, .dc-orbit, .dc-orbit-rev,
          .dc-grid, .dc-shimmer, .dc-wave, .dc-blob { animation: none !important; }
        }
      `}</style>

      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 dc-grid opacity-[0.22]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_75%)]" />
      <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl dc-float-slow" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[560px] w-[560px] rounded-full bg-primary/10 blur-3xl dc-float" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-72 w-72 bg-primary/10 blur-2xl dc-blob" />

      {/* Content */}
      <div className="relative z-10 grid h-full grid-cols-1 lg:grid-cols-[1.05fr_1fr] items-center gap-6 px-6 lg:px-16 py-8">
        {/* Left: copy */}
        <div className="max-w-xl">
          <div
            className="inline-flex items-center gap-2 h-7 px-3 rounded-full border bg-background/60 backdrop-blur text-[11px] font-medium text-muted-foreground dc-fade"
            style={{ animationDelay: "40ms" }}
          >
            <MonitorPlay className="h-3.5 w-3.5 text-primary" />
            Demo · Real-time English ↔ Punjabi interpretation
          </div>

          <h1
            className="mt-4 text-4xl md:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.05] dc-fade"
            style={{ animationDelay: "140ms" }}
          >
            Every word{" "}
            <span className="dc-shimmer">understood.</span>
            <br />
            Every patient{" "}
            <span className="dc-shimmer">heard.</span>
          </h1>

          <p
            className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed dc-fade"
            style={{ animationDelay: "240ms" }}
          >
            An AI interpreter that sits between clinician and patient — transcribing,
            translating, and producing a clinician-approved record of every conversation.
          </p>

          <div
            className="mt-6 flex flex-wrap gap-3 dc-fade"
            style={{ animationDelay: "340ms" }}
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
              to="/transcript"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-lg border bg-background/60 backdrop-blur text-sm font-semibold transition-colors hover:border-primary/40"
            >
              View transcript
            </Link>
          </div>

          <div
            className="mt-6 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground dc-fade"
            style={{ animationDelay: "440ms" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5 text-primary" />
              MyHealth Navigator
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Clinician-reviewed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5 text-primary" />
              Bilingual transcript
            </span>
          </div>
        </div>

        {/* Right: animated orb */}
        <div className="relative hidden lg:flex items-center justify-center h-full">
          <div className="relative h-[440px] w-[440px]">
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full border border-primary/30 dc-ring" />
            <div
              className="absolute inset-0 rounded-full border border-primary/20 dc-ring"
              style={{ animationDelay: "0.9s" }}
            />
            <div
              className="absolute inset-0 rounded-full border border-primary/10 dc-ring"
              style={{ animationDelay: "1.8s" }}
            />

            {/* Core */}
            <div className="absolute inset-16 rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-transparent backdrop-blur-sm border border-primary/30 flex items-center justify-center shadow-2xl">
              <div className="flex items-end gap-1.5 h-16">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <span
                    key={i}
                    className="dc-wave w-1.5 rounded-full bg-primary"
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
              <div className="dc-orbit">
                <div className="rounded-xl border bg-background/80 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-lg whitespace-nowrap">
                  <span className="text-muted-foreground mr-1">EN</span>
                  "Take twice daily"
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="dc-orbit" style={{ animationDelay: "-6s" }}>
                <div className="rounded-xl border bg-background/80 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-lg whitespace-nowrap">
                  <span className="text-muted-foreground mr-1">ਪੰ</span>
                  "ਦਿਨ ਵਿੱਚ ਦੋ ਵਾਰ"
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="dc-orbit-rev">
                <div className="rounded-xl border bg-background/80 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-lg whitespace-nowrap">
                  <span className="text-muted-foreground mr-1">EN</span>
                  "Any allergies?"
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="dc-orbit-rev" style={{ animationDelay: "-13s" }}>
                <div className="rounded-xl border bg-background/80 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-lg whitespace-nowrap">
                  <span className="text-muted-foreground mr-1">ਪੰ</span>
                  "ਕੋਈ ਐਲਰਜੀ?"
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div className="absolute bottom-2 left-0 right-0 z-10 text-center text-[11px] text-muted-foreground/60">
        Synthetic demo · no real patient data · not a clinical decision tool
      </div>
    </div>
  );
};

export default DemoConversation;
