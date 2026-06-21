import { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  FileText,
  HeartPulse,
  MonitorPlay,
  Radio,
  Settings as SettingsIcon,
  ShieldCheck,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useConversation } from "@/store/conversationStore";

interface NavItemDef {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const primaryNav: NavItemDef[] = [
  { to: "/demo", label: "Lingo", icon: MonitorPlay },
  { to: "/live", label: "Live", icon: Radio },
  { to: "/kids", label: "Kids", icon: Smile },
  { to: "/transcript", label: "Transcript", icon: FileText },
  { to: "/review", label: "Review", icon: ShieldCheck },
  { to: "/audit", label: "Audit", icon: Activity },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const PHASE_META: Record<string, { label: string; color: string }> = {
  idle: { label: "Ready", color: "262 12% 43%" },
  listening: { label: "Listening live", color: "266 76% 64%" },
  transcribing: { label: "Transcribing", color: "270 92% 66%" },
  translating: { label: "Translating", color: "288 62% 62%" },
  speaking: { label: "Speaking aloud", color: "278 82% 58%" },
};

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const phase = useConversation((s) => s.phase);
  const isLiveRoute = pathname === "/" || pathname.startsWith("/live");
  const safetyText =
    pathname.startsWith("/demo")
      ? "Synthetic demo data. Use Live for real microphone transcription and translation."
      : isLiveRoute
        ? "Real ElevenLabs live voice mode. Audio streams to the configured ElevenLabs agent for testing."
        : "AI translation requires clinician review before use in notes.";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex h-[4.25rem] w-full max-w-[1500px] items-center gap-4 px-4 lg:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <HeartPulse className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight tracking-tight">
                MyHealth Navigator
              </span>
              <span className="hidden text-xs leading-tight text-muted-foreground sm:block">
                Clinical interpreter workspace
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-0.5 md:flex">
            {primaryNav.map((item) => (
              <NavItem key={item.to} {...item} active={isActive(pathname, item.to, item.end)} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-2">
            <PhaseChip phase={phase} />
            <Button asChild size="sm" className="hidden gap-1.5 shadow-sm sm:inline-flex">
              <Link to="/live">
                <Radio className="h-3.5 w-3.5" />
                Start listening
              </Link>
            </Button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-border bg-card px-3 py-2 md:hidden">
          {primaryNav.map((item) => (
            <NavItem key={item.to} {...item} active={isActive(pathname, item.to, item.end)} mobile />
          ))}
        </nav>

        <div className="border-t border-border bg-warning/8 px-4 py-2 text-xs text-muted-foreground">
          <div className="mx-auto flex max-w-[1500px] items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-warning" />
            <span className="truncate">{safetyText}</span>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-6.5rem)] overflow-x-hidden">{children}</main>
    </div>
  );
}

function isActive(pathname: string, to: string, end?: boolean) {
  if (pathname === "/" && to === "/live") return true;
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(to + "/");
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
  mobile,
}: NavItemDef & { active: boolean; mobile?: boolean }) {
  return (
    <NavLink
      to={to}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        mobile && "min-w-fit flex-1 px-2 text-xs",
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

function PhaseChip({ phase }: { phase: string }) {
  const meta = PHASE_META[phase] ?? PHASE_META.idle;
  const live = phase !== "idle";

  return (
    <span
      className="inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs font-semibold tabular"
      style={{
        background: live ? `hsl(${meta.color} / 0.08)` : "hsl(var(--secondary))",
        borderColor: live ? `hsl(${meta.color} / 0.22)` : "hsl(var(--border))",
        color: live ? `hsl(${meta.color})` : "hsl(var(--muted-foreground))",
      }}
    >
      {live ? (
        <span className="equalizer h-3" style={{ color: `hsl(${meta.color})` }}>
          <span />
          <span />
          <span />
          <span />
        </span>
      ) : (
        <span className="dot" />
      )}
      <span className="hidden sm:inline">{meta.label}</span>
    </span>
  );
}
