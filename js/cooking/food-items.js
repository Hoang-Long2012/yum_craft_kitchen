const CRISPY_INGREDIENT_IDS = new Set([
  "instant_ramen", "roasted_peanuts", "taco_shell", "banh_mi_vn",
  "croissant", "oreo", "cucumber", "guava", "june_plum",
  "fried_shallots", "lotus_root", "panko_breadcrumbs", "scorched_rice",
  "crispy_bacon", "cashew_nuts", "fresh_octopus", "fish_paste",
  "beef_meatballs", "carrot", "cabbage", "broccoli", "asparagus",
  "king_oyster_mushroom", "bitter_melon", "pineapple", "watermelon",
  "crispy_apple", "water_spinach", "parmesan_cheese", "abalone",
  "salami", "fresh_bamboo_shoot", "daikon_radish", "bok_choy",
  "wood_ear_mushroom", "kimchi", "pickled_eggplant", "peach_slices",
  "kiwi_fruit", "grapes", "pork_trotter", "snow_fungus", "blueberries",
  "pomelo", "sea_grapes", "lotus_stem_pickled", "rice_cake_puff",
  "pork_ribs", "duck_breast", "lamb_chops", "crispy_bacon", "crab_meat",
  "fresh_clams", "fresh_oyster", "tuna_fillet", "fish_tofu", "pigeon_meat",
  "salad", "chestnut", "green_beans", "quail_egg", "fresh_bamboo_shoot",
  "eggplant", "daikon_radish", "bok_choy", "wood_ear_mushroom", "olives",
  "pickled_eggplant", "kiwi_fruit", "grapes", "crisped_rice"
]);

const DEFAULT_DRINK_IDS = new Set([
  "milk", "ice_cubes", "pure_water", "brewed_coffee", "espresso"
]);

/** Infer the sensory texture from the game's existing ingredient metadata. */
export function determineDefaultTexture(ingredient) {
  if (ingredient?.texture) return ingredient.texture;
  if (DEFAULT_DRINK_IDS.has(ingredient?.id)) return "drink";
  return CRISPY_INGREDIENT_IDS.has(ingredient?.id) || (ingredient?.flavors?.crunch ?? 0) >= 2.5
    ? "crispy"
    : "soft";
}

/** Check ice recursively, including wrapped/stuffed and beverage composites. */
export function itemContainsIce(item) {
  if (!item) return false;
  if (item.hasIce || item.id === "ice_cubes" || item.baseId === "ice_cubes") return true;
  if (item.subItems?.some(itemContainsIce)) return true;
  if (item.innerItems?.some(itemContainsIce)) return true;
  return false;
}

/** Build the mutable gameplay item from a catalog ingredient definition. */
export function createFoodItem(ingredient, uid) {
  if (!ingredient || typeof ingredient !== "object") {
    throw new TypeError("An ingredient definition is required.");
  }
  if (uid === undefined || uid === null) {
    throw new TypeError("A unique item uid is required.");
  }

  return {
    uid,
    kind: "single",
    baseId: ingredient.id,
    name: ingredient.name,
    emoji: ingredient.emoji,
    category: ingredient.category,
    color: ingredient.color,
    cookedColor: ingredient.cookedColor,
    needsCooking: ingredient.needsCooking,
    isFreshBalancer: !!ingredient.isFreshBalancer,
    cutState: "whole",
    cookLevel: 0,
    cookMethod: "none",
    actionHistory: [],
    lastStationId: null,
    batchId: null,
    returnedFromStaging: false,
    texture: determineDefaultTexture(ingredient),
    hasIce: ingredient.id === "ice_cubes",
    outerTexture: null,
    spicesApplied: [],
    subItems: [],
    outerItem: null,
    flavors: { ...ingredient.flavors }
  };
}
