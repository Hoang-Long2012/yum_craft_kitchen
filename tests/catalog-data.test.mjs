import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTERS } from "../js/data/characters.js";
import { FRIDGE_CATEGORIES } from "../js/data/fridge-categories.js";
import { INGREDIENTS } from "../js/data/ingredients.js";
import { STATIONS } from "../js/data/stations.js";
import { SPICES } from "../js/data/spices.js";
import { GARNISH_OPTIONS } from "../js/data/garnish-options.js";
import { FLAVOR_DIMENSIONS } from "../js/data/flavor-dimensions.js";

test("catalogs preserve their expected item counts", () => {
  assert.equal(CHARACTERS.length, 6);
  assert.equal(FRIDGE_CATEGORIES.length, 10);
  assert.equal(INGREDIENTS.length, 200);
  assert.equal(STATIONS.length, 9);
  assert.equal(SPICES.length, 29);
  assert.equal(GARNISH_OPTIONS.length, 6);
  assert.equal(FLAVOR_DIMENSIONS.length, 8);
});

test("catalog identifiers are present and unique within each catalog", () => {
  for (const [name, items] of [
    ["characters", CHARACTERS],
    ["fridge categories", FRIDGE_CATEGORIES],
    ["ingredients", INGREDIENTS],
    ["stations", STATIONS],
    ["spices", SPICES],
    ["garnish options", GARNISH_OPTIONS]
  ]) {
    const ids = items.map(item => item.id);
    assert.ok(ids.every(Boolean), `${name} contains an item without an id`);
    assert.equal(new Set(ids).size, ids.length, `${name} contains duplicate ids`);
  }

  const flavorKeys = FLAVOR_DIMENSIONS.map(item => item.key);
  assert.ok(flavorKeys.every(Boolean));
  assert.equal(new Set(flavorKeys).size, flavorKeys.length);
});
