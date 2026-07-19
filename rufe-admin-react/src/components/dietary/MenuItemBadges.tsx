import { Clock, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FoodType, MenuItem, SpiceLevel } from "@/types";

const FOOD_TYPE_TONE: Record<FoodType, string> = {
  Veg: "bg-success/15 text-success border-success/30",
  Vegan: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  Jain: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
  Egg: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  Seafood: "bg-cyan-500/15 text-cyan-700 border-cyan-500/30 dark:text-cyan-400",
  "Non Veg": "bg-destructive/15 text-destructive border-destructive/30",
};

const SPICE_TONE: Record<SpiceLevel, string> = {
  "No Spice": "",
  Mild: "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400",
  Medium: "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-400",
  Hot: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400",
  "Extra Hot": "bg-red-600/20 text-red-800 border-red-600/40 dark:text-red-300",
};

export function MenuItemBadges({ item, compact = false }: { item: MenuItem; compact?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {item.foodType.map((t) => (
        <Badge key={t} variant="outline" className={cn("font-normal", FOOD_TYPE_TONE[t])}>{t}</Badge>
      ))}
      {item.spiceLevel !== "No Spice" && (
        <Badge variant="outline" className={cn("font-normal", SPICE_TONE[item.spiceLevel])}>
          🌶 {item.spiceLevel}
        </Badge>
      )}
      {!compact && item.dietaryTags.map((tag) => (
        <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
      ))}
      {!compact && (
        <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
          <Clock className="size-3" /> {item.preparationTime} min
        </Badge>
      )}
      {!compact && item.nutrition?.calories != null && (
        <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
          <Flame className="size-3" /> {item.nutrition.calories} kcal
        </Badge>
      )}
    </div>
  );
}