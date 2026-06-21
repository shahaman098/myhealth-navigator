import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Radio, FileText, ShieldCheck, Languages, ArrowRight, Headphones,
  Volume2, Stethoscope, Activity, ChevronRight, ArrowLeftRight,
} from "lucide-react";

const features = [
  {
    icon: Headphones,
    title: "Listens to both sides",
    text: "Captures clinician and patient speech in whatever language is spoken.",
  },
  {
    icon: Languages,
    title: "Translates instantly",
    text: "Auto-detects language and translates each turn for the other person.",
  },
  {
    icon: FileText,
    title: "Saves a bilingual record",
    text: "Each turn is auto-saved with original speech, translation, and timestamps.",
  },
  {
    icon: ShieldCheck,
    title: "Clinician approves everything",
    text: "Summary, key concerns, and next steps are drafts — never decisions.",
  },
];

const steps = [
  { n: "01", label: "Doctor speaks",                icon: Stethoscope },
  { n: "02", label: "AI transcribes & translates",  icon: ArrowLeftRight },
  { n: "03", label: "Patient hears & replies",      icon: Volume2 },
  { n: "04", label: "Clinician reviews record",     icon: ShieldCheck },
];

const Home = () => {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 lg:px-6 py-12 lg:py-16 space-y-12">
      {/* Hero */}
      <section className="space-y-5">
        <div className="inline-flex items-center gap-1.5 px-2 h-6 rounded-md text-[11px] font-medium bg-[hsl(var(--surface-2))] border hairline text-muted-foreground">
          <span className="dot text-primary animate-pulse-dot" />
          Synthetic demo · v0.2
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.08] max-w-3xl">
          Real-time AI interpreter for safer{" "}
          <span className="text-muted-foreground">bedside conversations.</span>
        </h1>

        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          FlowClear Live sits between the clinician and the patient — translating every turn,
          transcribing the conversation in both languages, and producing a clinician-approved
          summary, key concerns, and agreed next steps.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild size="default" className="gap-2 h-10 px-4 text-sm font-medium">
            <Link to="/live">
              <Radio className="h-4 w-4" />
              Open live room
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild size="default" variant="outline" className="gap-2 h-10 px-4 text-sm font-medium">
            <Link to="/transcript">
              <FileText className="h-4 w-4" />
              View transcript
            </Link>
          </Button>
        </div>
      </section>

      {/* Steps */}
      <section className="surface p-5 lg:p-6">
        <div className="eyebrow text-[10px] mb-4">How a conversation flows</div>
        <ol className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li
                key={s.n}
                className="surface-inset p-3 flex flex-col gap-1.5 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono tabular text-[10px] text-muted-foreground/60">{s.n}</span>
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-[13px] font-medium text-foreground leading-snug">{s.label}</span>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Feature grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="surface p-4 transition-colors hover:border-[hsl(var(--primary))]/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 bg-[hsl(var(--surface-3))] border hairline text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-foreground">{f.title}</div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed mt-1">{f.text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Quick links */}
      <section>
        <div className="eyebrow text-[10px] mb-3">Jump in</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { to: "/live",       label: "Live room",  icon: Radio },
            { to: "/transcript", label: "Transcript", icon: FileText },
            { to: "/review",     label: "Review",     icon: ShieldCheck },
            { to: "/audit",      label: "Audit log",  icon: Activity },
          ].map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                className="group surface flex items-center gap-2 p-3 hover:border-[hsl(var(--primary))]/30 transition-colors text-[13px] font-medium"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {l.label}
                <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </Link>
            );
          })}
        </div>
      </section>

      <p className="text-[11px] text-muted-foreground/60">
        Synthetic demo · no real patient data · not a clinical decision tool
      </p>
    </div>
  );
};

export default Home;
