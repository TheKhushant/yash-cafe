import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function CheckboxGroup<T extends string>({
  options,
  selected,
  onChange,
  columns = 2,
}: {
  options: readonly T[];
  selected: T[];
  onChange: (next: T[]) => void;
  columns?: 2 | 3 | 4;
}) {
  function toggle(opt: T) {
    onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]);
  }

  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 3 && "sm:grid-cols-3",
        columns === 4 && "sm:grid-cols-4",
        columns === 2 && "sm:grid-cols-2",
      )}
    >
      {options.map((opt) => (
        <label
          key={opt}
          className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50"
        >
          <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} />
          {opt}
        </label>
      ))}
    </div>
  );
}