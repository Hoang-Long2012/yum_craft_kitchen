import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeCulinaryChemistry,
  describeItemStateShort,
  generateSmartDishTitle
} from "../js/cooking/culinary-chemistry.js";

test("empty plate analysis returns the established empty state", () => {
  const result = analyzeCulinaryChemistry([]);

  assert.equal(result.autoTitle, "Đĩa đang trống");
  assert.equal(result.structureSummary, "Chưa có thành phần nào.");
  assert.equal(result.harmonyScore, 0);
  assert.deepEqual(result.synergies, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.hasRawMeat, false);
  assert.equal(result.hasBurnt, false);
});

test("dish titles retain the existing single and multi-item formats", () => {
  assert.equal(
    generateSmartDishTitle([{ name: "Mango" }], { sweet: 4, fatty: 2, sour: 0, spicy: 0, umami: 0 }),
    "Mango Béo Ngọt Đậm Đà"
  );
  assert.equal(
    generateSmartDishTitle([{ name: "Rice" }, { name: "Beef" }, { name: "Onion" }, { name: "Carrot" }], {}),
    "Rice & Beef & Onion (+1 món)"
  );
});

test("item descriptions preserve cooking and preparation details", () => {
  const item = {
    kind: "single",
    actionHistory: [],
    cutState: "sliced",
    cookMethod: "none",
    cookLevel: 0,
    needsCooking: false,
    spicesApplied: []
  };

  assert.equal(describeItemStateShort(item), "thái lát, tươi ngon");
});

test("raw ingredients still produce the established safety warning", () => {
  const item = {
    kind: "single",
    id: "beef",
    baseId: "beef",
    name: "Beef",
    category: "meat",
    needsCooking: true,
    cookLevel: 0,
    cookMethod: "none",
    cutState: "whole",
    actionHistory: [],
    spicesApplied: [],
    subItems: [],
    flavors: { umami: 2, salty: 0, sweet: 0, sour: 0, spicy: 0, fatty: 0, bitter: 0, aroma: 1 }
  };
  const result = analyzeCulinaryChemistry([item]);

  assert.equal(result.hasRawMeat, true);
  assert.ok(result.warnings.includes("🤢 Có thịt/hải sản/trứng sống chưa nấu chín!"));
});
