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
import { toggleMember, getFollowingIds, getFollowedFeed, isPresenceFresh, getConversationId, normalizeChatMessage, isChefBlocked, toggleBlockedChef, filterBlockedChefs, filterOnlineChefs, normalizePrivacySettings, canViewChefProfile, canReceiveKitchenInvites, canReceiveDirectMessages, getChefRecipes, filterBlockedRecipes, getPostLikeState, getStoredChatMessages, getLocalConversationSummary, matchesOnlineChefSearch, matchesCommunityRecipeSearch } from '../js/social-data.js';
import { PROFILE_GENDERS, normalizeProfileGender, getProfileGenderLabel } from '../js/profile-data.js';
import { validatePassword, validateDisplayName, validateKitchenName, validateProfileBio } from '../js/auth-data.js';
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
  assert.ok(html.includes('id="community-online-chefs-list"'));
  assert.ok(html.includes('id="community-kitchen-invites-list"'));
  assert.ok(html.includes('id="modal-community-online-chefs"') && html.includes('id="modal-community-kitchen-invites"'));
  assert.ok(html.includes('id="btn-community-online-chefs"') && html.includes('aria-haspopup="dialog"'));
  assert.ok(html.includes('id="community-online-chefs-search"') && html.includes('id="community-search-input"'));
  assert.ok(html.includes('id="btn-close-community-online-chefs"') && html.includes('id="btn-close-community-kitchen-invites"'));
  assert.ok(html.includes('id="direct-chat-messages"') && html.includes('id="form-direct-chat"'));
  assert.ok(html.includes('id="modal-kitchen-social"') && html.includes('id="kitchen-chats-list"'));
  assert.ok(html.includes('id="kitchen-online-search"'));
  assert.ok(html.includes('id="chef-public-profile-recipe-count"') && html.includes('id="btn-view-chef-recipes"'));
  assert.strictEqual(html.includes('id="modal-chef-recipes"'), false, 'Chef recipes should use the searchable community page rather than a separate dialog');
  assert.ok(html.includes('id="chef-public-profile-details-heading"') && html.includes('id="chef-public-profile-stats-heading"'));
  assert.strictEqual(html.includes('aria-expanded="false"'), false, 'Social list controls should open dialogs rather than expand inline content');
  assert.ok(html.includes('id="community-detail-like-count"') && html.includes('id="btn-community-detail-like"'));
  assert.ok(html.includes('id="btn-kitchen-social"') && html.includes('id="kitchen-invites-list"'));
  assert.ok(html.includes('id="btn-menu-edit-profile"') && html.includes('id="form-edit-profile"') && html.includes('id="profile-gender"'));
  assert.ok(html.includes('id="profile-current-password"') && html.includes('id="profile-new-password"'));
  assert.ok(mainMenuJs.includes('blockChef(chef.uid)'), 'Online chef lists should provide a block action');
  assert.ok(mainMenuJs.includes('unblockChef(chef.uid)'), 'Blocked chef settings should provide an unblock action');
  assert.ok(socialServiceJs.includes('export async function blockChef'));
  assert.ok(socialServiceJs.includes('export async function unblockChef'));
  assert.ok(socialServiceJs.includes('export async function sendKitchenInvite'));
  assert.ok(socialServiceJs.includes('export async function sendDirectMessage'));
  assert.ok(authServiceJs.includes('updateCurrentUserPrivacySettings'));
  assert.ok(authServiceJs.includes('changeCurrentUserPassword'));

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

await test('U11: Chef blocking is mutual, deduplicated, reversible, and filters social lists', () => {
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
  assert.deepStrictEqual(filterBlockedRecipes([
    { id: 'r1', chefUid: 'chef_b' }, { id: 'r2', chefUid: 'chef_c' }, { id: 'r3' }
  ], ['chef_b']).map((post) => post.id), ['r2', 'r3'], 'Hide recipes from chefs the current player blocked');
});

await test('U12: Privacy defaults, visibility, contact permissions, recipe lists, and likes behave correctly', () => {
  assert.deepStrictEqual(normalizePrivacySettings(), {
    profileVisibility: 'public', showOnlineStatus: true, showGender: true, showBio: true,
    allowKitchenInvites: true, allowDirectMessages: true
  });
  const privateSettings = normalizePrivacySettings({
    profileVisibility: 'private', showOnlineStatus: false, showGender: false, showBio: false,
    allowKitchenInvites: false, allowDirectMessages: false
  });
  assert.deepStrictEqual(privateSettings, {
    profileVisibility: 'private', showOnlineStatus: false, showGender: false, showBio: false,
    allowKitchenInvites: false, allowDirectMessages: false
  });
  assert.strictEqual(canViewChefProfile(privateSettings, 'viewer', 'chef'), false);
  assert.strictEqual(canViewChefProfile(privateSettings, 'chef', 'chef'), true, 'Players can always view their own private profile');
  assert.strictEqual(canViewChefProfile(undefined, 'viewer', 'chef'), true, 'Legacy profiles remain public by default');
  assert.strictEqual(canReceiveKitchenInvites(privateSettings), false);
  assert.strictEqual(canReceiveKitchenInvites(undefined), true);
  assert.strictEqual(canReceiveDirectMessages(privateSettings), false);
  assert.strictEqual(canReceiveDirectMessages(undefined), true);

  const now = Date.parse('2026-11-17T12:00:00.000Z');
  const online = [
    { uid: 'visible', isOnline: true, lastSeenAt: new Date(now - 30_000).toISOString() },
    { uid: 'private', isOnline: true, lastSeenAt: new Date(now - 30_000).toISOString(), privacySettings: { profileVisibility: 'private' } },
    { uid: 'hidden', isOnline: true, lastSeenAt: new Date(now - 30_000).toISOString(), privacySettings: { showOnlineStatus: false } },
    { uid: 'offline', isOnline: false, lastSeenAt: new Date(now - 30_000).toISOString() },
    { uid: 'stale', isOnline: true, lastSeenAt: new Date(now - 300_000).toISOString() },
    { uid: 'banned', isOnline: true, lastSeenAt: new Date(now - 30_000).toISOString(), isBanned: true },
    { uid: 'blocked', isOnline: true, lastSeenAt: new Date(now - 30_000).toISOString() },
    { uid: 'reciprocal-block', isOnline: true, lastSeenAt: new Date(now - 30_000).toISOString(), blockedChefIds: ['viewer'] },
    { uid: 'viewer', isOnline: true, lastSeenAt: new Date(now - 30_000).toISOString() }
  ];
  assert.deepStrictEqual(filterOnlineChefs(online, ['blocked'], 'viewer', now), [online[0]], 'Online results respect freshness, visibility, bans, and mutual blocks');

  const posts = [{ id: 'r1', chefUid: 'chef_a' }, { id: 'r2', chefUid: 'chef_b' }, { id: 'r3', chefUid: 'chef_a' }];
  assert.deepStrictEqual(getChefRecipes(posts, 'chef_a'), [posts[0], posts[2]]);
  assert.deepStrictEqual(getChefRecipes(null, 'chef_a'), []);

  assert.deepStrictEqual(getPostLikeState({ likedBy: ['u1', 'u2'], likeCount: 4 }, 'u2'), { liked: true, likeCount: 4 });
  assert.deepStrictEqual(getPostLikeState({ likedBy: ['u1', 'u1'] }, 'u2'), { liked: false, likeCount: 1 });
  assert.deepStrictEqual(getPostLikeState({ likedBy: ['u1'], likeCount: 0 }, 'u1'), { liked: true, likeCount: 0 });
  assert.deepStrictEqual(getPostLikeState(null, 'u1'), { liked: false, likeCount: 0 });

  const legacyMessages = [
    { senderUid: 'u1', text: 'Xin chào', createdAt: '2026-11-17T10:00:00.000Z' },
    { senderUid: 'u2', senderName: 'Bếp B', text: 'Chào bạn', createdAt: '2026-11-17T10:01:00.000Z' }
  ];
  assert.deepStrictEqual(getStoredChatMessages(legacyMessages, 1), [legacyMessages[1]], 'Legacy array chats still return the most recent messages');
  assert.deepStrictEqual(getStoredChatMessages({ messages: legacyMessages }, 50), legacyMessages, 'Object-format chats remain readable');
  assert.deepStrictEqual(getStoredChatMessages(null), []);
  assert.deepStrictEqual(getLocalConversationSummary('conversation-1', legacyMessages, 'u1', [{ uid: 'u2', username: 'chef_b', displayName: 'Bếp B' }]), {
    uid: 'u2', username: 'chef_b', displayName: 'Bếp B', kitchenName: 'Nhà Bếp Sáng Tạo', allowDirectMessages: true,
    conversationId: 'conversation-1', lastMessage: 'Chào bạn', lastSenderUid: 'u2', updatedAt: '2026-11-17T10:01:00.000Z'
  });
  assert.strictEqual(getLocalConversationSummary('conversation-self', [{ senderUid: 'u1', text: 'Chỉ có mình' }], 'u1'), null, 'Cannot infer a conversation partner from a one-sender legacy thread');
  const objectConversation = getLocalConversationSummary('conversation-2', {
    participants: ['u1', 'u2'], messages: legacyMessages, lastMessage: 'Tin cuối', lastSenderUid: 'u1', updatedAt: '2026-11-17T10:02:00.000Z'
  }, 'u1', [{ uid: 'u2', privacySettings: { allowDirectMessages: false } }]);
  assert.strictEqual(objectConversation.lastMessage, 'Tin cuối');
  assert.strictEqual(objectConversation.allowDirectMessages, false);
});

await test('U13: Profile editing validates display name, kitchen name, bio, and gender choices', () => {
  assert.deepStrictEqual(validateDisplayName('  Bếp A  '), { valid: true, sanitized: 'Bếp A' });
  assert.strictEqual(validateDisplayName('A').valid, false);
  assert.strictEqual(validateDisplayName('N'.repeat(51)).valid, false);
  assert.deepStrictEqual(validateKitchenName('  Bếp nhà  '), { valid: true, sanitized: 'Bếp nhà' });
  assert.strictEqual(validateKitchenName('X').valid, false);
  assert.strictEqual(validateKitchenName('K'.repeat(61)).valid, false);
  assert.deepStrictEqual(validateProfileBio('  Xin chào!  '), { valid: true, sanitized: 'Xin chào!' });
  assert.strictEqual(validateProfileBio('B'.repeat(161)).valid, false);
  assert.strictEqual(validateProfileBio(null).valid, false);
  assert.deepStrictEqual(PROFILE_GENDERS, ['female', 'male', 'other', 'unspecified']);
  assert.strictEqual(normalizeProfileGender('unexpected'), 'unspecified');
});

await test('U14: Password change validation rejects missing, short, and mismatched passwords', () => {
  assert.strictEqual(validatePassword('').valid, false);
  assert.strictEqual(validatePassword('short').valid, false);
  assert.strictEqual(validatePassword('long-enough', 'different').valid, false);
  assert.deepStrictEqual(validatePassword('long-enough', 'long-enough'), { valid: true });
  assert.deepStrictEqual(validatePassword('long-enough'), { valid: true }, 'Sign-in may validate without a confirmation field');
});

await test('U15: Player and recipe search matches usernames, display names, kitchens, and Vietnamese accents', () => {
  const chef = { username: 'chef_daubep', displayName: 'Bếp Đỏ', kitchenName: 'Nhà Bếp Sáng Tạo' };
  assert.strictEqual(matchesOnlineChefSearch(chef, '@CHEF_DA'), true, 'Player lookup accepts @username and ignores case');
  assert.strictEqual(matchesOnlineChefSearch(chef, 'bep do'), true, 'Player lookup ignores Vietnamese accent marks');
  assert.strictEqual(matchesOnlineChefSearch(chef, 'sang tao'), true, 'Player lookup searches kitchen names');
  assert.strictEqual(matchesOnlineChefSearch(chef, 'not-a-chef'), false);

  const recipe = { headingTitle: 'Phở Bò', chefUsername: 'pho_master', chefDisplayName: 'Bếp Phở', kitchenName: 'Bếp Hà Nội' };
  assert.strictEqual(matchesCommunityRecipeSearch(recipe, 'pho bo'), true, 'Recipe lookup searches dish titles without accents');
  assert.strictEqual(matchesCommunityRecipeSearch(recipe, '@PHO_M'), true, 'Recipe lookup searches usernames');
  assert.strictEqual(matchesCommunityRecipeSearch(recipe, 'ha noi'), true, 'Recipe lookup searches kitchen names');
  assert.strictEqual(matchesCommunityRecipeSearch(recipe, 'khong co'), false);
});

console.log(`\nUNIT SUMMARY: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
