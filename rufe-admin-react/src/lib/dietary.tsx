import type {
  Allergen,
  CompatibilityResult,
  DietaryPreferences,
  FoodPreference,
  FoodType,
  MedicalRestriction,
  MenuItem,
} from "@/types";

/** Medical-restriction nutrition thresholds. Deliberately simple/explainable, not clinical advice. */
const MEDICAL_THRESHOLDS = {
  highSugar: 15, // grams
  highSodium: 600, // mg
  highFat: 20, // grams
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Whether a dish's food type(s) satisfy a customer's stated food preference. */
function foodTypeMismatch(foodPreference: FoodPreference | undefined, foodType: FoodType[]): boolean {
  if (!foodPreference) return false;
  const has = (t: FoodType) => foodType.includes(t);

  switch (foodPreference) {
    case "Non Veg":
      return false; // eats everything
    case "Vegan":
      return !has("Vegan");
    case "Jain":
      return !has("Jain");
    case "Veg":
      return has("Non Veg") || has("Seafood");
    case "Eggitarian":
      // Veg + Egg okay, meat/seafood is not
      return has("Non Veg") || has("Seafood");
    case "Pescatarian":
      // Seafood is fine, land-meat is not
      return has("Non Veg");
    default:
      return false;
  }
}

function detectAllergens(itemAllergens: Allergen[], userAllergies: Allergen[]): Allergen[] {
  if (userAllergies.length === 0) return [];
  const set = new Set(userAllergies);
  return itemAllergens.filter((a) => set.has(a));
}

function detectDislikedIngredients(ingredients: string[], disliked: string[]): string[] {
  if (disliked.length === 0) return [];
  const dislikedSet = new Set(disliked.map(norm));
  return ingredients.filter((ing) => dislikedSet.has(norm(ing)));
}

function detectMedicalWarnings(item: MenuItem, restrictions: MedicalRestriction[]): string[] {
  if (restrictions.length === 0) return [];
  const n = item.nutrition ?? {};
  const warnings: string[] = [];

  for (const r of restrictions) {
    if ((r === "Diabetic" || r === "Low Sugar") && (n.sugar ?? 0) > MEDICAL_THRESHOLDS.highSugar) {
      warnings.push("High Sugar Content");
    }
    if ((r === "Low Sodium" || r === "Kidney Friendly" || r === "Heart Patient") && (n.sodium ?? 0) > MEDICAL_THRESHOLDS.highSodium) {
      warnings.push("High Sodium Content");
    }
    if ((r === "Low Fat" || r === "Heart Patient") && (n.fat ?? 0) > MEDICAL_THRESHOLDS.highFat) {
      warnings.push("High Fat Content");
    }
    if (r === "Pregnancy Safe" && item.containsAlcohol) {
      warnings.push("Contains Alcohol");
    }
  }
  return Array.from(new Set(warnings));
}

/**
 * Core Smart Matching Engine.
 * With no preferences on file, everything reads as a safe default ("Perfect Match") —
 * there is nothing to warn about yet.
 */
export function computeCompatibility(item: MenuItem, prefs: DietaryPreferences | undefined): CompatibilityResult {
  if (!prefs) {
    return {
      score: 100,
      level: "Perfect Match",
      cardTone: "green",
      headline: "No dietary preferences on file",
      details: ["Set up dietary preferences to get personalized recommendations."],
      foodPreferenceMismatch: false,
      allergensDetected: [],
      dislikedIngredientsDetected: [],
      medicalWarnings: [],
      favoriteCategoryMatch: false,
    };
  }

  const foodPreferenceMismatch = foodTypeMismatch(prefs.foodPreference, item.foodType);
  const allergensDetected = detectAllergens(item.allergens, prefs.allergies);
  const dislikedIngredientsDetected = detectDislikedIngredients(item.ingredients, prefs.dislikedIngredients);
  const medicalWarnings = detectMedicalWarnings(item, prefs.medicalRestrictions);
  const favoriteCategoryMatch = prefs.favoriteCategories.some((c) => norm(c) === norm(item.category));

  let score: number;
  const details: string[] = [];

  if (allergensDetected.length > 0) {
    score = 0;
    details.push(`Contains ${allergensDetected.join(", ")}. This may cause an allergic reaction.`);
  } else if (foodPreferenceMismatch) {
    score = 0;
    details.push(`This dish does not match your ${prefs.foodPreference} preference.`);
  } else if (medicalWarnings.length > 0) {
    score = 30;
    details.push(...medicalWarnings.map((w) => `${w} — not recommended for your medical profile.`));
  } else if (dislikedIngredientsDetected.length > 0) {
    score = 60;
    details.push(`Contains ${dislikedIngredientsDetected.join(", ")}, which you usually avoid.`);
  } else if (favoriteCategoryMatch || item.dietaryTags.includes("Healthy") || item.dietaryTags.includes("Chef Special")) {
    score = 100;
    details.push("Matches your taste profile — safe and recommended.");
  } else {
    score = 80;
    details.push("No conflicts found with your dietary profile.");
  }

  const level = scoreToLevel(score);
  const cardTone = levelToTone(level, allergensDetected.length > 0 || foodPreferenceMismatch);
  const headline = levelToHeadline(level);

  return {
    score,
    level,
    cardTone,
    headline,
    details,
    foodPreferenceMismatch,
    allergensDetected,
    dislikedIngredientsDetected,
    medicalWarnings,
    favoriteCategoryMatch,
  };
}

export function scoreToLevel(score: number): CompatibilityResult["level"] {
  if (score >= 100) return "Perfect Match";
  if (score >= 80) return "Recommended";
  if (score >= 60) return "Use Caution";
  if (score >= 30) return "Not Recommended";
  return "Unsafe";
}

function levelToTone(level: CompatibilityResult["level"], isAllergyOrMismatch: boolean): CompatibilityResult["cardTone"] {
  switch (level) {
    case "Perfect Match":
    case "Recommended":
      return "green";
    case "Use Caution":
      return "yellow";
    case "Not Recommended":
      return "orange";
    case "Unsafe":
      return isAllergyOrMismatch ? "red" : "orange";
    default:
      return "green";
  }
}

function levelToHeadline(level: CompatibilityResult["level"]): string {
  switch (level) {
    case "Perfect Match":
      return "✅ Recommended For You";
    case "Recommended":
      return "✅ Recommended For You";
    case "Use Caution":
      return "⚠ Contains ingredients you usually avoid";
    case "Not Recommended":
      return "⚠ Not Recommended";
    case "Unsafe":
      return "🚨 Allergy Alert";
    default:
      return "";
  }
}