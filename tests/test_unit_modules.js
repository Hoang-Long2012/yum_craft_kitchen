/**
 * Pure Node.js unit tests for YumCraft Kitchen ES modules (ZERO DOM / window mocks).
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHARACTERS,
  FRIDGE_CATEGORIES,
  INGREDIENTS,
  STATIONS,
  SPICES,
  GARNISH_OPTIONS,
  FLAVOR_DIMENSIONS
} from '../js/data/index.js';
import { state, resetKitchenItemsState } from '../js/core/state.js';
import { getMockUsers, saveMockUsers, readStorageJson, writeStorageJson } from '../js/services/mock-storage.js';
import { escapeHtml } from '../js/ui/dom-helpers.js';
import { createFoodItem, describeItemStateShort, itemContainsIce } from '../js/cooking/food-item.js';
import { analyzeCulinaryChemistry, combineFlavorProfiles } from '../js/cooking/chemistry.js';
import {
  describePureFlavorDescriptor,
  generateSensoryTastingReview,
  generateMultiDishTastingReview,
  getEatingSoundForItem,
  buildEatingAudioPlaylist
} from '../js/cooking/tasting-review.js';
import { performStationAction } from '../js/cooking/station-actions.js';
import {
  addIngredientToState,
  applySpiceToState,
  moveStationToStagingState,
  moveStagingToStationState,
  plateCurrentKitchenItems
} from '../js/cooking/plating.js';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL: ${name}\n  -> ${err.stack || err.message}`);
  }
}

function resetPureState() {
  resetKitchenItemsState();
  state.activeStationId = 'cutting_board';
  state.activeCharacterId = 'chef_bear';
  state.fridgeDestination = 'station';
  state.spiceTarget = 'station';
  state.selectedGarnishId = 'rustic';
  state.isCookingBusy = false;
  state.isFeedingBusy = false;
}

await test('U1: Pure data modules export expected counts and schemas without DOM', () => {
  assert.strictEqual(CHARACTERS.length, 6);
  assert.strictEqual(FRIDGE_CATEGORIES.length, 10);
  assert.strictEqual(INGREDIENTS.length, 220);
  assert.strictEqual(STATIONS.length, 18);
  assert.strictEqual(SPICES.length, 29);
  assert.strictEqual(GARNISH_OPTIONS.length, 6);
  assert.strictEqual(FLAVOR_DIMENSIONS.length, 8);
});

await test('U2: Food item creation, texture detection, and ice detection work without DOM', () => {
  const pork = INGREDIENTS.find((i) => i.id === 'pork_belly');
  const ice = INGREDIENTS.find((i) => i.id === 'ice_cubes');
  const porkItem = createFoodItem(pork);
  const iceItem = createFoodItem(ice);

  assert.strictEqual(porkItem.needsCooking, true);
  assert.strictEqual(porkItem.cookLevel, 0);
  assert.strictEqual(itemContainsIce(iceItem), true);
  assert.strictEqual(itemContainsIce(porkItem), false);
});

await test('U3: Pure cooking handler map runs cutting, mixing, rolling, stuffing, and heating without DOM', async () => {
  resetPureState();
  const announcements = [];
  const hooks = {
    announce: (msg) => announcements.push(msg),
    playExternalAudio: async () => {},
    playSoundEffect: () => {},
    renderWorkbench: () => {},
    renderAll: () => {}
  };

  // Cut pork_belly
  addIngredientToState('pork_belly');
  await performStationAction('slice', hooks);
  assert.strictEqual(state.stationItems[0].cutState, 'sliced');

  // Mix with egg and wheat_flour on mixing_table
  state.activeStationId = 'mixing_table';
  addIngredientToState('egg');
  addIngredientToState('wheat_flour');
  await performStationAction('knead_dough', hooks);
  assert.strictEqual(state.stationItems.length, 1);
  assert.strictEqual(state.stationItems[0].kind, 'mixed');
  assert.strictEqual(state.stationItems[0].canBeWrapper, true);
  assert.strictEqual(state.stationItems[0].needsCooking, true);

  // Bake in oven
  state.activeStationId = 'oven';
  await performStationAction('bake_step', hooks);
  assert.strictEqual(state.stationItems[0].cookLevel, 1);
  assert.strictEqual(state.stationItems[0].needsCooking, false);
  assert.deepStrictEqual(state.stationItems[0].actionHistory, ['kneaded', 'baked']);
  assert.ok(announcements.length >= 3);
});

await test('U4: Pure spices, staging transfers, plating, and sensory review generation without DOM', () => {
  resetPureState();
  addIngredientToState('beef');
  const spiceRes = applySpiceToState('black_pepper');
  assert.strictEqual(spiceRes.ok, true);
  assert.strictEqual(state.stationItems[0].spicesApplied.length, 1);

  const toStag = moveStationToStagingState();
  assert.strictEqual(toStag.ok, true);
  assert.strictEqual(state.stationItems.length, 0);
  assert.strictEqual(state.stagingItems.length, 1);

  const toSt = moveStagingToStationState();
  assert.strictEqual(toSt.ok, true);
  assert.strictEqual(state.stationItems.length, 1);
  assert.strictEqual(state.stationItems[0].returnedFromStaging, true);

  // Cook beef so it isn't raw, then plate & review
  state.stationItems[0].cookLevel = 1;
  state.stationItems[0].cookMethod = 'grilled';
  state.stationItems[0].needsCooking = false;
  state.stationItems[0].actionHistory = ['grilled'];

  const plated = plateCurrentKitchenItems('Bò Nướng Tiêu Đen');
  assert.ok(plated && plated.newDish.name === 'Bò Nướng Tiêu Đen');
  assert.strictEqual(state.servedDishes.length, 1);

  const analysis = analyzeCulinaryChemistry(state.plateItems);
  const review = generateSensoryTastingReview(state.plateItems, analysis, CHARACTERS[0], 'Bò Nướng Tiêu Đen');
  assert.ok(review.speech.includes('Bò Nướng Tiêu Đen'));
  assert.ok(review.speech.includes('Tiêu đen xay'));
  assert.ok(review.score >= 0 && review.score <= 100);

  const multi = generateMultiDishTastingReview(state.servedDishes, CHARACTERS[0]);
  assert.ok(multi.speech.includes('Bò Nướng Tiêu Đen'));
});

await test('U5: Eating sound playlist & pure flavor descriptors execute cleanly without DOM', () => {
  const iceCoffee = createFoodItem(INGREDIENTS.find((i) => i.id === 'brewed_coffee'));
  iceCoffee.texture = 'drink';
  iceCoffee.hasIce = true;
  const crispySnack = createFoodItem(INGREDIENTS.find((i) => i.id === 'banh_da_thanh_hoa'));

  assert.strictEqual(getEatingSoundForItem(iceCoffee), 'drink_with_ice.ogg');
  assert.strictEqual(getEatingSoundForItem(crispySnack), 'eat_crispy_food.ogg');
  assert.deepStrictEqual(buildEatingAudioPlaylist([iceCoffee, crispySnack]), ['drink_with_ice.ogg', 'eat_crispy_food.ogg']);
  assert.ok(describePureFlavorDescriptor('sweet', 5.0, 0));
  assert.ok(combineFlavorProfiles([iceCoffee, crispySnack]).aroma > 0);
  assert.ok(describeItemStateShort(crispySnack).length > 0);
});

await test('U6: Consolidated mock-storage & escapeHtml work cleanly without browser DOM', () => {
  const memStore = new Map();
  globalThis.localStorage = {
    getItem: (k) => (memStore.has(k) ? memStore.get(k) : null),
    setItem: (k, v) => memStore.set(k, String(v)),
    removeItem: (k) => memStore.delete(k)
  };
  try {
    assert.deepStrictEqual(getMockUsers(), []);
    saveMockUsers([{ uid: 'u1', username: 'chef_test' }]);
    assert.deepStrictEqual(getMockUsers(), [{ uid: 'u1', username: 'chef_test' }]);
    writeStorageJson('custom_key', { ok: true });
    assert.deepStrictEqual(readStorageJson('custom_key', null), { ok: true });
  } finally {
    delete globalThis.localStorage;
  }

  assert.strictEqual(escapeHtml(`<script>"a"&'b'</script>`), '&lt;script&gt;&quot;a&quot;&amp;&#39;b&#39;&lt;/script&gt;');
  assert.strictEqual(escapeHtml(null), '');
});

await test('U7: Modular refactor & accessibility structural checks (index.html, main-menu.js, services)', () => {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const mainMenuJs = fs.readFileSync(path.join(rootDir, 'js', 'main-menu.js'), 'utf8');
  const authServiceJs = fs.readFileSync(path.join(rootDir, 'js', 'auth-service.js'), 'utf8');
  const communityServiceJs = fs.readFileSync(path.join(rootDir, 'js', 'community-service.js'), 'utf8');
  const adminServiceJs = fs.readFileSync(path.join(rootDir, 'js', 'admin-service.js'), 'utf8');

  // Pure HTML + external ES modules only (except optional Tailwind config or none)
  assert.ok(html.includes('<script type="module" src="js/main-menu.js"></script>'));
  assert.ok(html.includes('<script type="module" src="js/app.js"></script>'));
  assert.strictEqual(html.includes('role="dialog"'), false, 'Native <dialog> must not carry redundant role="dialog"');
  assert.strictEqual(html.includes('aria-modal="true"'), false, 'Native <dialog>.showModal() must not carry redundant aria-modal="true"');
  assert.ok(html.includes('id="modal-app-confirm"'));
  assert.strictEqual((html.match(/<main\b/g) || []).length, 4, 'All 4 top-level screens should have a <main> landmark');
  assert.ok(html.includes('id="screen-main-menu" hidden'));
  assert.ok(html.includes('id="screen-character-select" hidden'));
  assert.ok(html.includes('id="screen-kitchen" hidden'));

  // Zero native browser confirm/prompt/alert left in main-menu.js
  assert.strictEqual(/\b(?:window\.)?(?:confirm|prompt|alert)\s*\(/.test(mainMenuJs), false, 'main-menu.js should use accessible custom dialogs');

  // Services share mock-storage helper without duplicated definitions
  [authServiceJs, communityServiceJs, adminServiceJs].forEach((src) => {
    assert.ok(src.includes('./services/mock-storage.js'));
    assert.strictEqual(src.includes('function getMockUsers'), false);
    assert.strictEqual(src.includes('function saveMockUsers'), false);
  });
});

console.log(`\nUNIT SUMMARY: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
