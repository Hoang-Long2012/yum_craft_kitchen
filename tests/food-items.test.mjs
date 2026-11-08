import test from "node:test";
import assert from "node:assert/strict";
import { createFoodItem, determineDefaultTexture, itemContainsIce } from "../js/cooking/food-items.js";

test("preserves explicit texture and infers drink, crispy, or soft texture", () => {
  assert.equal(determineDefaultTexture({ id: "custom", texture: "liquid" }), "liquid");
  assert.equal(determineDefaultTexture({ id: "milk" }), "drink");
  assert.equal(determineDefaultTexture({ id: "custom", flavors: { crunch: 2.5 } }), "crispy");
  assert.equal(determineDefaultTexture({ id: "custom", flavors: { crunch: 2.4 } }), "soft");
});

test("recognizes ice recursively in composite food", () => {
  assert.equal(itemContainsIce({ id: "ice_cubes" }), true);
  assert.equal(itemContainsIce({ subItems: [{ innerItems: [{ baseId: "ice_cubes" }] }] }), true);
  assert.equal(itemContainsIce({ subItems: [{ id: "berry" }] }), false);
  assert.equal(itemContainsIce(null), false);
});

test("creates a gameplay item without sharing mutable flavor data", () => {
  const ingredient = {
    id: "mango",
    name: "Mango",
    category: "fruit",
    emoji: "🥭",
    needsCooking: false,
    flavors: { sweet: 3, sour: 1 }
  };
  const item = createFoodItem(ingredient, 42);

  assert.equal(item.uid, 42);
  assert.equal(item.kind, "single");
  assert.equal(item.baseId, "mango");
  assert.equal(item.texture, "soft");
  assert.deepEqual(item.actionHistory, []);
  assert.notEqual(item.flavors, ingredient.flavors);
  item.flavors.sweet += 1;
  assert.equal(ingredient.flavors.sweet, 3);
});

test("requires an ingredient and a unique item id", () => {
  assert.throws(() => createFoodItem(null, 1), /ingredient definition/);
  assert.throws(() => createFoodItem({ id: "rice", name: "Rice" }), /unique item uid/);
});
