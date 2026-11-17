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
import { toggleMember, getFollowingIds, getFollowedFeed, isPresenceFresh, getConversationId, normalizeChatMessage, isChefBlocked, toggleBlockedChef, filterBlockedChefs } from '../js/social-data.js';
import { normalizeProfileGender, getProfileGenderLabel } from '../js/profile-data.js';
import { createFoodItem, describeItemStateShort, itemContainsIce, formatNaturalList } from '../js/cooking/food-item.js';
import { analyzeCulinaryChemistry, combineFlavorProfiles, generateSmartDishTitle } from '../js/cooking/chemistry.js';
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
  const socialServiceJs = fs.readFileSync(path.join(rootDir, 'js', 'social-service.js'), 'utf8');

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
  assert.ok(html.includes('id="blocked-chefs-list"'), 'Settings should expose a way to review and unblock chefs');
  assert.ok(html.includes('setting-privacy-kitchen-invites'));
  assert.ok(html.includes('setting-privacy-direct-messages'));
  assert.ok(mainMenuJs.includes('blockChef(chef.uid)'), 'Online chef lists should provide a block action');
  assert.ok(mainMenuJs.includes('unblockChef(chef.uid)'), 'Blocked chef settings should provide an unblock action');
  assert.ok(socialServiceJs.includes('export async function blockChef'));
  assert.ok(socialServiceJs.includes('export async function unblockChef'));

  // Zero native browser confirm/prompt/alert left in main-menu.js
  assert.strictEqual(/\b(?:window\.)?(?:confirm|prompt|alert)\s*\(/.test(mainMenuJs), false, 'main-menu.js should use accessible custom dialogs');

  // Services share mock-storage helper without duplicated definitions
  [authServiceJs, communityServiceJs, adminServiceJs].forEach((src) => {
    assert.ok(src.includes('./services/mock-storage.js'));
    assert.strictEqual(src.includes('function getMockUsers'), false);
    assert.strictEqual(src.includes('function saveMockUsers'), false);
  });
});

await test('U8: Natural Vietnamese list formatting across mixing, blending, beverage, rolling, stuffing & dish titles', async () => {
  assert.strictEqual(formatNaturalList(['A']), 'A');
  assert.strictEqual(formatNaturalList(['A', 'B']), 'A và B');
  assert.strictEqual(formatNaturalList(['A', 'B', 'C']), 'A, B và C');

  resetPureState();
  state.activeStationId = 'mixing_table';
  ['milk', 'chocolate', 'oreo', 'cocoa', 'marshmallow', 'condensed_milk'].forEach((id) => addIngredientToState(id));
  await performStationAction('mix_toss');
  assert.strictEqual(
    state.stationItems[0].name,
    'Sữa tươi thanh trùng, Thanh Sô-cô-la Đen, Bánh quy Oreo kẹp kem, Bột Ca-cao nguyên chất, Kẹo Marshmallow xốp dẻo và Sữa đặc có đường (trộn đều)'
  );
  assert.strictEqual(state.stationItems[0].name.includes(' & '), false);

  resetPureState();
  state.activeStationId = 'blender';
  ['milk', 'chocolate', 'oreo'].forEach((id) => addIngredientToState(id));
  await performStationAction('blend_smooth');
  assert.strictEqual(state.stationItems[0].name, 'Sữa tươi thanh trùng, Thanh Sô-cô-la Đen và Bánh quy Oreo kẹp kem (xay nhuyễn)');

  resetPureState();
  state.activeStationId = 'beverage_station';
  ['milk', 'brewed_coffee', 'condensed_milk'].forEach((id) => addIngredientToState(id));
  await performStationAction('stir_pour');
  assert.strictEqual(state.stationItems[0].name, 'Sữa tươi thanh trùng, Cà phê phin truyền thống nguyên chất và Sữa đặc có đường (khuấy ly)');

  resetPureState();
  state.activeStationId = 'rolling_mat';
  ['rice_paper', 'beef', 'carrot', 'cucumber'].forEach((id) => addIngredientToState(id));
  await performStationAction('roll_tight');
  assert.strictEqual(state.stationItems[0].name.includes(' & '), false);
  assert.ok(state.stationItems[0].name.includes('Thịt bò thăn tươi, Cà Rốt Tươi Giòn Ngọt Đỏ Cam và Dưa leo giòn'));

  resetPureState();
  state.activeStationId = 'stuffing_station';
  ['banh_mi_vn', 'beef', 'cheese_slice', 'cucumber'].forEach((id) => addIngredientToState(id));
  await performStationAction('stuff_pack');
  assert.strictEqual(state.stationItems[0].name.includes(' & '), false);
  assert.ok(state.stationItems[0].name.includes('Thịt bò thăn tươi, Phô mai Cheddar lát và Dưa leo giòn'));

  const title = generateSmartDishTitle(
    ['milk', 'chocolate', 'oreo'].map((id) => createFoodItem(INGREDIENTS.find((i) => i.id === id))),
    { sour: 0, sweet: 0, spicy: 0, fatty: 0, umami: 0 }
  );
  assert.strictEqual(title, 'Sữa tươi thanh trùng, Thanh Sô-cô-la Đen và Bánh quy Oreo kẹp kem');

  const title4 = generateSmartDishTitle(
    ['milk', 'chocolate', 'oreo', 'cocoa'].map((id) => createFoodItem(INGREDIENTS.find((i) => i.id === id))),
    { sour: 0, sweet: 0, spicy: 0, fatty: 0, umami: 0 }
  );
  assert.strictEqual(title4, 'Sữa tươi thanh trùng, Thanh Sô-cô-la Đen, Bánh quy Oreo kẹp kem và 1 món khác');
});

await test('U9: Pure sensory & multi-dish review across salty/spicy/burnt/raw-meat dishes without ReferenceError', async () => {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const tastingSrc = fs.readFileSync(path.join(rootDir, 'js', 'cooking', 'tasting-review.js'), 'utf8');
  assert.strictEqual(tastingSrc.includes('playSoundEffect'), false, 'tasting-review.js must remain audio-free and pure');

  const chef = CHARACTERS[0];
  const mildChar = CHARACTERS.find((c) => c.maxSpiceTolerance <= 4) || CHARACTERS[1];

  // Exact user scenario: tofu + roasted_peanuts + garlic_chives + water_spinach -> mix_toss -> heavy spices -> fry
  resetPureState();
  state.activeStationId = 'mixing_table';
  ['tofu', 'roasted_peanuts', 'garlic_chives', 'water_spinach'].forEach((id) => addIngredientToState(id));
  await performStationAction('mix_toss');
  for (let i = 0; i < 6; i++) applySpiceToState('salt');
  state.activeStationId = 'pan';
  await performStationAction('fry_step');
  const saltyPlated = plateCurrentKitchenItems('');
  const saltyReview = generateSensoryTastingReview(saltyPlated.newDish.items, saltyPlated.newDish.analysis, chef, '');
  assert.strictEqual(saltyReview.reactionType, 'bad');
  assert.ok(saltyReview.score <= 35);
  assert.ok(saltyReview.speech.length > 10);

  // Overly spicy dish
  resetPureState();
  state.activeStationId = 'mixing_table';
  ['tofu', 'roasted_peanuts', 'garlic_chives', 'water_spinach'].forEach((id) => addIngredientToState(id));
  await performStationAction('mix_toss');
  for (let i = 0; i < 6; i++) applySpiceToState('chili_powder');
  state.activeStationId = 'pan';
  await performStationAction('fry_step');
  const spicyAnalysis = analyzeCulinaryChemistry(state.stationItems);
  const spicyReview = generateSensoryTastingReview(state.stationItems, spicyAnalysis, mildChar);
  assert.strictEqual(spicyReview.reactionType, 'bad');
  assert.ok(spicyReview.score <= 45);

  // Burnt dish (cookLevel >= 3)
  state.stationItems[0].cookLevel = 3;
  const burntAnalysis = analyzeCulinaryChemistry(state.stationItems);
  const burntReview = generateSensoryTastingReview(state.stationItems, burntAnalysis, chef, 'Món cháy');
  assert.strictEqual(burntReview.reactionType, 'bad');
  assert.ok(burntReview.score <= 22);

  // Raw meat dish
  resetPureState();
  addIngredientToState('beef');
  const rawAnalysis = analyzeCulinaryChemistry(state.stationItems);
  const rawReview = generateSensoryTastingReview(state.stationItems, rawAnalysis, chef, 'Bò sống');
  assert.strictEqual(rawReview.reactionType, 'bad');
  assert.ok(rawReview.score <= 20);

  // Multi-dish combo containing extreme dishes
  const multiReview = generateMultiDishTastingReview([
    { id: 'd1', name: saltyPlated.newDish.name, items: saltyPlated.newDish.items, analysis: saltyPlated.newDish.analysis },
    { id: 'd2', name: 'Món phụ', items: state.stationItems, analysis: rawAnalysis }
  ], chef);
  assert.strictEqual(multiReview.reactionType, 'bad');
  assert.ok(multiReview.speech.length > 10);
});

await test('U10: Social membership is idempotent, deduplicated, and followed feed filters by chef', () => {
  const liked = toggleMember(['u1', 'u1', 'u2'], 'u1');
  assert.deepStrictEqual(liked, { members: ['u2'], active: false });
  const added = toggleMember(liked.members, 'u1');
  assert.deepStrictEqual(added, { members: ['u2', 'u1'], active: true });
  assert.deepStrictEqual(getFollowingIds({ u1: true, u2: false, u3: 1 }), ['u1', 'u3']);
  assert.deepStrictEqual(getFollowingIds(['u1', 'u1', null]), ['u1']);
  const posts = [{ id: 'p1', chefUid: 'u1' }, { id: 'p2', chefUid: 'u2' }, { id: 'p3' }];
  assert.deepStrictEqual(getFollowedFeed(posts, ['u2']), [posts[1]]);
  assert.deepStrictEqual(getFollowedFeed(null, ['u1']), []);
  assert.strictEqual(isPresenceFresh('2026-11-17T00:00:00.000Z', Date.parse('2026-11-17T00:01:00.000Z')), true);
  assert.strictEqual(isPresenceFresh('2026-11-16T23:50:00.000Z', Date.parse('2026-11-17T00:00:00.000Z')), false);
  assert.strictEqual(isPresenceFresh('invalid', Date.now()), false);
  assert.strictEqual(normalizeProfileGender('female'), 'female');
  assert.strictEqual(normalizeProfileGender('unexpected'), 'unspecified');
  assert.strictEqual(getProfileGenderLabel('male'), 'Nam');
  assert.strictEqual(getConversationId('chef_a', 'chef_b'), getConversationId('chef_b', 'chef_a'));
  assert.strictEqual(normalizeChatMessage('  Chào bạn  '), 'Chào bạn');
  assert.throws(() => normalizeChatMessage('  '), /không được để trống/);
  assert.throws(() => normalizeChatMessage('x'.repeat(1001)), /1000 ký tự/);
});

await test('U11: Chef blocking is mutual, deduplicated, reversible, and filters online chefs', () => {
  assert.strictEqual(isChefBlocked(['chef_b'], [], 'chef_a', 'chef_b'), true, 'A chef is blocked when the current player blocks them');
  assert.strictEqual(isChefBlocked([], ['chef_a'], 'chef_a', 'chef_b'), true, 'A chef is blocked when they block the current player');
  assert.strictEqual(isChefBlocked([], [], 'chef_a', 'chef_b'), false);
  assert.strictEqual(isChefBlocked(['chef_a'], [], 'chef_a', 'chef_a'), false, 'Self must not count as a blocked chef');

  const blocked = toggleBlockedChef(['chef_b', 'chef_b'], 'chef_b');
  assert.deepStrictEqual(blocked, ['chef_b'], 'Blocking an existing entry should not create duplicates');
  const withAnother = toggleBlockedChef(blocked, 'chef_c');
  assert.deepStrictEqual(withAnother, ['chef_b', 'chef_c']);
  assert.deepStrictEqual(toggleBlockedChef(withAnother, 'chef_b', false), ['chef_c'], 'Unblocking should remove only the selected chef');
  assert.throws(() => toggleBlockedChef([], ''), /Thiếu mã đầu bếp/);

  const online = [
    { uid: 'chef_a' },
    { uid: 'chef_b' },
    { uid: 'chef_c', blockedChefIds: ['chef_a'] },
    { uid: 'chef_d' }
  ];
  assert.deepStrictEqual(filterBlockedChefs(online, ['chef_b'], 'chef_a'), [online[3]], 'Hide self, players blocked by the current user, and players who blocked them');
  assert.deepStrictEqual(filterBlockedChefs(null, [], 'chef_a'), []);
});

console.log(`\nUNIT SUMMARY: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
