import { cn } from "@/lib/utils";

const COLOURS: Record<string, string> = {
  approved: "hsl(var(--success))",
  rejected: "hsl(var(--destructive))",
  pending: "hsl(var(--warning))",
};

/** Coloured status chip for clinician approval states. */
export function ApprovalBadge({ status, className }: { status: string; className?: string }) {
  const colour = COLOURS[status] ?? "hsl(var(--muted-foreground))";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        className,
      )}
      style={{
        background: `color-mix(in srgb, ${colour} 12%, transparent)`,
        color: colour,
        borderColor: `color-mix(in srgb, ${colour} 30%, transparent)`,
      }}
    >
      {status}
    </span>
  );
}
