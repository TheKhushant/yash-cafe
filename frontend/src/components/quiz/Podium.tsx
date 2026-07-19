import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd — classic podium layout
const HEIGHT = ["h-28", "h-36", "h-20"];
const TONE = [
  "bg-slate-200 text-slate-700",
  "bg-amber-400/90 text-amber-950",
  "bg-orange-300/80 text-orange-950",
];

export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) {
    return <p className="text-sm text-muted-foreground">No players have scored yet.</p>;
  }

  return (
    <div className="flex items-end justify-center gap-4 py-4">
      {PODIUM_ORDER.map((position, slot) => {
        const entry = top3[position];
        if (!entry) return <div key={slot} className="w-24" />;
        return (
          <div key={entry.playerId} className="flex w-24 flex-col items-center gap-2">
            {position === 0 && <Crown className="size-6 text-amber-500" />}
            <p className="max-w-24 truncate text-sm font-semibold text-foreground">{entry.playerName}</p>
            <p className="text-xs text-muted-foreground">{entry.score.toLocaleString()} pts</p>
            <div
              className={cn(
                "flex w-full items-start justify-center rounded-t-xl pt-2 text-lg font-bold",
                HEIGHT[position],
                TONE[position],
              )}
            >
              #{position + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}