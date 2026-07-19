import { CheckboxGroup } from "@/components/shared/CheckboxGroup";
import { TagInput } from "@/components/shared/TagInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { MenuInput } from "@/lib/api/services/menu";
import type { DietaryTag, FoodType, NutritionInfo, ServingSize, SpiceLevel } from "@/types";

const FOOD_TYPES: FoodType[] = ["Veg", "Non Veg", "Vegan", "Jain", "Egg", "Seafood"];
const ALLERGENS_LIST = [
  "Milk", "Egg", "Peanuts", "Tree Nuts", "Soy", "Fish", "Shellfish",
  "Wheat", "Gluten", "Sesame", "Mustard", "Celery", "Lupin", "Sulphites",
] as const;
const DIETARY_TAGS: DietaryTag[] = [
  "High Protein", "Low Carb", "Gluten Free", "Dairy Free", "Nut Free", "Sugar Free",
  "Keto", "Healthy", "Kids Friendly", "Chef Special", "Seasonal", "Popular",
];
const SPICE_LEVELS: SpiceLevel[] = ["No Spice", "Mild", "Medium", "Hot", "Extra Hot"];
const SERVING_SIZES: ServingSize[] = ["1 Person", "2 Persons", "4 Persons"];

const NUTRITION_FIELDS: { key: keyof NutritionInfo; label: string; unit: string }[] = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "carbohydrates", label: "Carbohydrates", unit: "g" },
  { key: "sugar", label: "Sugar", unit: "g" },
  { key: "sodium", label: "Sodium", unit: "mg" },
];

export function MenuItemDietaryFields({
  form,
  onChange,
}: {
  form: MenuInput;
  onChange: (patch: Partial<MenuInput>) => void;
}) {
  const nutrition = form.nutrition ?? {};

  function setNutrition(key: keyof NutritionInfo, raw: string) {
    const value = raw === "" ? undefined : Number(raw);
    onChange({ nutrition: { ...nutrition, [key]: value } });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Food Classification</h3>
        <CheckboxGroup options={FOOD_TYPES} selected={form.foodType} onChange={(v) => onChange({ foodType: v })} columns={3} />
      </div>

      <div className="space-y-2">
        <Label>Ingredients</Label>
        <TagInput value={form.ingredients} onChange={(v) => onChange({ ingredients: v })} placeholder="e.g. Chicken, Butter, Garlic…" />
      </div>

      <div className="space-y-2">
        <Label>Allergens</Label>
        <CheckboxGroup options={ALLERGENS_LIST} selected={form.allergens} onChange={(v) => onChange({ allergens: v })} columns={3} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Spice Level</Label>
          <Select value={form.spiceLevel} onValueChange={(v) => onChange({ spiceLevel: v as SpiceLevel })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SPICE_LEVELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Preparation Time (minutes)</Label>
          <Input
            type="number"
            min={0}
            value={form.preparationTime}
            onChange={(e) => onChange({ preparationTime: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Serving Size</Label>
          <Select value={form.servingSize} onValueChange={(v) => onChange({ servingSize: v as ServingSize })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SERVING_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Nutritional Information (optional)</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {NUTRITION_FIELDS.map(({ key, label, unit }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{label} ({unit})</Label>
              <Input
                type="number"
                min={0}
                value={nutrition[key] ?? ""}
                onChange={(e) => setNutrition(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Dietary Tags</h3>
        <CheckboxGroup options={DIETARY_TAGS} selected={form.dietaryTags} onChange={(v) => onChange({ dietaryTags: v })} columns={3} />
      </div>

      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <Label>Contains Alcohol</Label>
        <Switch checked={form.containsAlcohol} onCheckedChange={(v) => onChange({ containsAlcohol: v })} />
      </div>

      <div className="space-y-2">
        <Label>Chef Notes (optional)</Label>
        <Textarea
          value={form.chefNotes ?? ""}
          onChange={(e) => onChange({ chefNotes: e.target.value || undefined })}
          rows={2}
          placeholder="Anything the kitchen wants front-of-house to know…"
        />
      </div>
    </div>
  );
}