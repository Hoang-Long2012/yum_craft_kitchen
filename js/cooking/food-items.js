const CRISPY_INGREDIENT_IDS = new Set([
  "instant_ramen", "roasted_peanuts", "taco_shell", "banh_mi_vn", "croissant",
  "oreo", "cucumber", "guava", "june_plum", "fried_shallots", "lotus_root",
  "panko_breadcrumbs", "scorched_rice", "crispy_bacon", "cashew_nuts",
  "fresh_octopus", "fish_paste", "beef_meatballs", "carrot", "cabbage",
  "broccoli", "asparagus", "king_oyster_mushroom", "bitter_melon", "pineapple",
  "watermelon", "crispy_apple", "water_spinach", "parmesan_cheese", "abalone",
  "salami", "fresh_bamboo_shoot", "daikon_radish", "bok_choy",
  "wood_ear_mushroom", "kimchi", "pickled_eggplant", "peach_slices",
  "kiwi_fruit", "grapes", "pork_trotter", "snow_fungus", "blueberries",
  "pomelo", "sea_grapes", "lotus_stem_pickled", "rice_cake_puff"
]);

const DEFAULT_DRINK_IDS = new Set([
  "milk", "ice_cubes", "pure_water", "brewed_coffee", "espresso"
]);

export function determineDefaultTexture(ing) {
  if (ing.texture) return ing.texture;
  if (ing.id === "milk" || ing.id === "ice_cubes" || ing.id === "pure_water" || ing.id === "brewed_coffee" || ing.id === "espresso") return "drink";
  const crispyIds = ["instant_ramen", "roasted_peanuts", "taco_shell", "banh_mi_vn", "croissant", "oreo", "cucumber", "guava", "june_plum", "fried_shallots", "lotus_root", "panko_breadcrumbs", "scorched_rice", "crispy_bacon", "cashew_nuts", "fresh_octopus", "fish_paste", "beef_meatballs", "carrot", "cabbage", "broccoli", "asparagus", "king_oyster_mushroom", "bitter_melon", "pineapple", "watermelon", "crispy_apple", "water_spinach", "parmesan_cheese", "abalone", "salami", "fresh_bamboo_shoot", "daikon_radish", "bok_choy", "wood_ear_mushroom", "kimchi", "pickled_eggplant", "peach_slices", "kiwi_fruit", "grapes", "pork_trotter", "snow_fungus", "blueberries", "pomelo", "sea_grapes", "lotus_stem_pickled", "rice_cake_puff"];
  if (crispyIds.includes(ing.id) || (ing.flavors && ing.flavors.crunch >= 2.5)) {
    return "crispy";
  }
  return "soft";
    }

    export function itemContainsIce(item) {
  if (!item) return false;
  if (item.hasIce) return true;
  if (item.id === "ice_cubes" || item.baseId === "ice_cubes") return true;
  if (item.subItems && item.subItems.some(sub => itemContainsIce(sub))) return true;
  if (item.innerItems && item.innerItems.some(inner => itemContainsIce(inner))) return true;
  return false;
    }

    export function createFoodItem(ing, uid) {
  const defTex = determineDefaultTexture(ing);
  return {
    uid,
    kind: "single", // "single" | "rolled" | "stuffed" | "blended"
    baseId: ing.id,
    name: ing.name,
    emoji: ing.emoji,
    category: ing.category,
    color: ing.color,
    cookedColor: ing.cookedColor,
    needsCooking: ing.needsCooking,
    isFreshBalancer: !!ing.isFreshBalancer,
    cutState: "whole", // "whole" | "sliced" | "diced" | "minced"
    cookLevel: 0, // 0 = raw/fresh, 1 = cooked, 2 = crispy brown, >=3 = burnt
    cookMethod: "none",
    actionHistory: [], // Lưu tuần tự chuỗi phương pháp chế biến vật lý tự do (Toca Kitchen Sandbox)
    lastStationId: null, // Dụng cụ chế biến gần nhất
    batchId: null, // Mã lượt chế biến (nhận diện các nguyên liệu nấu chung một công cụ)
    returnedFromStaging: false,
    texture: defTex, // "soft" | "crispy" | "liquid" | "drink"
    hasIce: ing.id === "ice_cubes",
    outerTexture: null, // used for rolled and stuffed items
    spicesApplied: [],
    subItems: [],
    outerItem: null,
    flavors: { ...ing.flavors }
  };
    }