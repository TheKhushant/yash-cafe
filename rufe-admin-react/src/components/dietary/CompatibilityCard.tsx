import { AlertTriangle, CheckCircle2, ShieldAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompatibilityResult } from "@/types";

const TONE_STYLES: Record<CompatibilityResult["cardTone"], string> = {
  green: "border-success/40 bg-success/10 text-success-foreground",
  yellow: "border-warning/40 bg-warning/10 text-warning-foreground",
  orange: "border-orange-400/50 bg-orange-500/10 text-orange-900 dark:text-orange-300",
  red: "border-destructive/40 bg-destructive/10 text-destructive",
};

const TONE_ICON: Record<CompatibilityResult["cardTone"], typeof CheckCircle2> = {
  green: CheckCircle2,
  yellow: TriangleAlert,
  orange: AlertTriangle,
  red: ShieldAlert,
};

export function CompatibilityCard({ result }: { result: CompatibilityResult }) {
  const Icon = TONE_ICON[result.cardTone];
  return (
    <div className={cn("space-y-2 rounded-lg border p-4", TONE_STYLES[result.cardTone])}>
      <div className="flex items-center gap-2">
        <Icon className="size-5 shrink-0" />
        <p className="font-semibold">{result.headline}</p>
        <span className="ml-auto text-sm font-medium">{result.score}% · {result.level}</span>
      </div>
      {result.details.length > 0 && (
        <ul className="ml-7 list-disc space-y-1 text-sm">
          {result.details.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      )}
    </div>
  );
}