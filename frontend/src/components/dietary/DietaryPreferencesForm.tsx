import { CheckboxGroup } from "@/components/shared/CheckboxGroup";
import { TagInput } from "@/components/shared/TagInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DietaryPreferences, FoodPreference, MedicalRestriction } from "@/types";

const FOOD_PREFERENCES: FoodPreference[] = ["Veg", "Non Veg", "Vegan", "Jain", "Eggitarian", "Pescatarian"];
const ALLERGENS_LIST = [
  "Milk", "Egg", "Peanuts", "Tree Nuts", "Soy", "Fish", "Shellfish",
  "Wheat", "Gluten", "Sesame", "Mustard", "Celery", "Lupin", "Sulphites",
] as const;
const MEDICAL_RESTRICTIONS: MedicalRestriction[] = [
  "Diabetic", "Low Sodium", "Low Sugar", "Low Fat", "Heart Patient", "Kidney Friendly", "Pregnancy Safe",
];
const FAVORITE_CATEGORIES = ["Pizza", "Burger", "Dessert", "Drinks", "Chinese", "Indian", "Mexican", "Italian"];

export function DietaryPreferencesForm({
  value,
  onChange,
}: {
  value: DietaryPreferences;
  onChange: (patch: Partial<DietaryPreferences>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Food Preference</Label>
        <Select
          value={value.foodPreference ?? "__none"}
          onValueChange={(v) => onChange({ foodPreference: v === "__none" ? undefined : (v as FoodPreference) })}
        >
          <SelectTrigger><SelectValue placeholder="Not set" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Not set</SelectItem>
            {FOOD_PREFERENCES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Food Allergies</Label>
        <CheckboxGroup options={ALLERGENS_LIST} selected={value.allergies} onChange={(v) => onChange({ allergies: v })} columns={3} />
      </div>

      <div className="space-y-2">
        <Label>Disliked Ingredients</Label>
        <TagInput
          value={value.dislikedIngredients}
          onChange={(v) => onChange({ dislikedIngredients: v })}
          placeholder="e.g. Onion, Garlic, Mushroom…"
        />
      </div>

      <div className="space-y-2">
        <Label>Medical Restrictions (optional)</Label>
        <CheckboxGroup options={MEDICAL_RESTRICTIONS} selected={value.medicalRestrictions} onChange={(v) => onChange({ medicalRestrictions: v })} columns={2} />
      </div>

      <div className="space-y-2">
        <Label>Favorite Categories</Label>
        <CheckboxGroup options={FAVORITE_CATEGORIES} selected={value.favoriteCategories} onChange={(v) => onChange({ favoriteCategories: v })} columns={4} />
      </div>
    </div>
  );
}