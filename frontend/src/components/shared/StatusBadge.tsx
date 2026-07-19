import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  success: "bg-success/12 text-success ring-success/25",
  warning: "bg-warning/15 text-warning-foreground ring-warning/30",
  danger: "bg-destructive/12 text-destructive ring-destructive/25",
  info: "bg-info/12 text-info ring-info/25",
  primary: "bg-primary/12 text-primary ring-primary/25",
};

const STATUS_TONE: Record<string, Tone> = {
  // Orders
  Pending: "warning",
  Accepted: "info",
  Preparing: "primary",
  Ready: "success",
  Completed: "neutral",
  Cancelled: "danger",
  // Events
  Published: "success",
  Draft: "neutral",
  // Users
  Active: "success",
  Blocked: "danger",
  Suspended: "danger",
  // Bookings
  Confirmed: "info",
  CheckedIn: "success",
  Expired: "neutral",
  PaymentPending: "warning",
  Paid: "success",
  // Assigned offers
  Assigned: "success",
  Used: "info",
};

export function StatusBadge({
  status,
  label,
  tone,
}: {
  status: string;
  label?: string;
  tone?: Tone;
}) {
  const resolved = tone ?? STATUS_TONE[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[resolved],
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {label ?? status}
    </span>
  );
}