import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  change,
  tone = "primary",
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  change?: number;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  hint?: string;
}) {
  const toneBg: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    danger: "bg-destructive/12 text-destructive",
    info: "bg-info/12 text-info",
  };

  const positive = (change ?? 0) >= 0;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", toneBg[tone])}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {typeof change === "number" ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              positive ? "text-success" : "text-destructive",
            )}
          >
            {positive ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {Math.abs(change)}%
          </span>
        ) : null}
        <span className="text-muted-foreground">{hint ?? "vs last period"}</span>
      </div>
    </Card>
  );
}
