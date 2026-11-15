const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const htmlPath = path.join(ROOT_DIR, 'index.html');
const mainMenuPath = path.join(ROOT_DIR, 'js', 'main-menu.js');
const appJsPath = path.join(ROOT_DIR, 'js', 'app.js');
const html = fs.readFileSync(htmlPath, 'utf8');
const mainMenuJs = fs.readFileSync(mainMenuPath, 'utf8');
const appJsSource = fs.readFileSync(appJsPath, 'utf8');

// Minimal DOM & Web APIs Mock for Node VM execution
function createMockElement(tagName, id = '') {
  const attrs = {};
  const classes = new Set();
  const listeners = {};
  const el = {
    tagName: tagName.toUpperCase(),
    id,
    dataset: {},
    style: {},
    value: '',
    checked: false,
    disabled: false,
    open: false,
    children: [],
    parentNode: null,
    offsetParent: {},
    isConnected: true,
    _innerHTML: '',
    _textContent: '',
    classList: {
      add: (...c) => c.forEach(x => classes.add(x)),
      remove: (...c) => c.forEach(x => classes.delete(x)),
      contains: (c) => classes.has(c),
      toggle: (c) => (classes.has(c) ? classes.delete(c) : classes.add(c))
    },
    set className(val) {
      classes.clear();
      String(val || '').split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
    },
    get className() {
      return Array.from(classes).join(' ');
    },
    set textContent(v) {
      this._textContent = String(v ?? '');
    },
    get textContent() {
      return this._textContent;
    },
    set innerHTML(v) {
      this._innerHTML = String(v ?? '');
      if (this._innerHTML === '') {
        this.children = [];
      } else {
        // Basic listitem detection for empty placeholders
        if (this._innerHTML.includes('role="listitem"')) {
          const ph = createMockElement('div');
          ph.setAttribute('role', 'listitem');
          this.children = [ph];
        }
      }
    },
    get innerHTML() {
      return this._innerHTML;
    },
    setAttribute(k, v) {
      attrs[k] = String(v);
      if (k === 'id') this.id = String(v);
    },
    getAttribute(k) {
      return Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null;
    },
    removeAttribute(k) {
      delete attrs[k];
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    contains(target) {
      if (!target) return false;
      if (target === this) return true;
      return this.children.some(c => c.contains && c.contains(target));
    },
    addEventListener(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    removeEventListener(type, fn) {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter(f => f !== fn);
    },
    dispatchEvent(evt) {
      const e = evt || {};
      if (!e.preventDefault) e.preventDefault = () => {};
      if (!e.stopPropagation) e.stopPropagation = () => {};
      if (!e.target) e.target = this;
      e.currentTarget = this;
      (listeners[e.type] || []).forEach(fn => fn(e));
    },
    click() {
      this.dispatchEvent({ type: 'click', target: this });
    },
    focus() {
      mockDoc.activeElement = this;
    },
    select() {},
    showModal() {
      this.open = true;
    },
    close() {
      this.open = false;
      this.dispatchEvent({ type: 'close', target: this });
    },
    getContext() {
      return new Proxy({}, { get: () => () => {} });
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    querySelectorAll(selector) {
      const results = [];
      const match = (node) => {
        if (!node || !node.getAttribute) return false;
        if (selector === 'button') return node.tagName === 'BUTTON';
        const roleMatch = selector.match(/^\[role="([^"]+)"\]$/);
        if (roleMatch) return node.getAttribute('role') === roleMatch[1];
        const dataMatch = selector.match(/^\[data-([a-z0-9-]+)="([^"]+)"\]$/);
        if (dataMatch) {
          const camel = dataMatch[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          return String(node.dataset[camel]) === dataMatch[2] || node._htmlData?.[dataMatch[1]] === dataMatch[2];
        }
        return false;
      };
      const walk = (node) => {
        (node.children || []).forEach(ch => {
          if (match(ch)) results.push(ch);
          walk(ch);
        });
      };
      // Parse innerHTML query selectors on `this` and descendants for data-del-st / data-to-staging / etc.
      const dataAttrMatch = selector.match(/^\[data-([a-z0-9-]+)="([^"]+)"\]$/);
      if (dataAttrMatch && results.length === 0) {
        const attrStr = `data-${dataAttrMatch[1]}="${dataAttrMatch[2]}"`;
        const findInNode = (node) => {
          if (node._innerHTML && node._innerHTML.includes(attrStr)) {
            node._virtualButtons = node._virtualButtons || {};
            if (!node._virtualButtons[attrStr]) {
              node._virtualButtons[attrStr] = createMockElement('button');
            }
            results.push(node._virtualButtons[attrStr]);
          }
          (node.children || []).forEach(ch => findInNode(ch));
        };
        findInNode(this);
      }
      walk(this);
      return results;
    }
  };
  return el;
}

const elementsById = new Map();
const trackedIds = [
  'btn-start-kitchen', 'screen-character-select', 'screen-kitchen',
  'kitchen-char-avatar', 'kitchen-char-title', 'kitchen-char-craving-snippet',
  'start-btn-toggle-sfx', 'start-btn-toggle-tts', 'start-btn-help', 'footer-btn-help',
  'modal-help', 'btn-close-help', 'kitchen-btn-sfx', 'kitchen-btn-tts',
  'k-icon-sfx', 'k-label-sfx', 'k-icon-tts', 'k-label-tts',
  'modal-confirm-back-to-menu', 'btn-kitchen-back-to-mainmenu', 'btn-cancel-back-to-menu', 'btn-do-back-to-mainmenu',
  'modal-confirm-back', 'btn-back-to-select', 'btn-cancel-back', 'btn-do-reset-and-back',
  'btn-char-hint', 'dining-speech-bubble', 'dining-mood-tag',
  'tab-fridge', 'tab-workbench', 'tab-staging', 'tab-spices', 'tab-dining',
  'panel-fridge', 'panel-workbench', 'panel-staging', 'panel-spices', 'panel-dining',
  'dest-btn-station', 'dest-btn-staging', 'fridge-category-tabs', 'fridge-search-input', 'fridge-items-grid', 'fridge-total-count-badge',
  'station-selector-grid', 'active-station-badge', 'canvas-overlay-station-name', 'canvas-overlay-temp',
  'station-desc-sub', 'station-items-count-label', 'heading-station-actions', 'heading-station-items',
  'station-wrapper-vessel-selector', 'wrap-vessel-selector-title', 'wrap-vessel-selected-label', 'wrap-vessel-selector-hint', 'wrap-vessel-options-container',
  'workbench-canvas', 'station-action-buttons', 'station-items-list', 'btn-station-to-staging', 'btn-clear-station-items',
  'staging-count-badge', 'btn-staging-to-station', 'staging-items-list',
  'spice-target-station', 'spice-target-staging', 'spices-grid',
  'plate-items-count-badge', 'plate-dish-title', 'plate-components-summary', 'plate-harmony-score', 'plate-garnish-badge',
  'flavor-bars-list', 'synergy-tags-container', 'plate-items-list', 'btn-clear-plate-items',
  'btn-give-water', 'btn-master-finish-dish', 'btn-master-feed', 'master-feed-label', 'dock-btn-read-dish',
  'modal-finish-dish', 'btn-close-finish-modal', 'btn-cancel-finish', 'btn-confirm-plate-dish', 'btn-suggest-dish-name',
  'finish-modal-ingredients-summary', 'input-custom-dish-name', 'finish-garnish-list',
  'modal-settings', 'nvda-live-assertive-a', 'nvda-live-assertive-b', 'nvda-live-polite-a', 'nvda-live-polite-b',
  'start-char-cards', 'share-community-container'
];
trackedIds.forEach(id => elementsById.set(id, createMockElement('div', id)));
['btn-start-kitchen', 'tab-fridge', 'tab-workbench', 'tab-staging', 'tab-spices', 'tab-dining', 'dest-btn-station', 'dest-btn-staging', 'spice-target-station', 'spice-target-staging', 'btn-close-help', 'btn-master-feed'].forEach(id => {
  elementsById.get(id).tagName = 'BUTTON';
});
['modal-help', 'modal-finish-dish', 'modal-confirm-back', 'modal-confirm-back-to-menu', 'modal-settings'].forEach(id => {
  elementsById.get(id).tagName = 'DIALOG';
});

const windowListeners = {};
const playedExternalAudios = [];
const timersScheduled = [];
const timersCleared = [];
let nextTimerId = 1;

const mockDoc = {
  activeElement: null,
  body: createMockElement('body', 'body'),
  getElementById(id) {
    if (!elementsById.has(id)) {
      const el = createMockElement('div', id);
      elementsById.set(id, el);
    }
    return elementsById.get(id);
  },
  createElement(tag) {
    return createMockElement(tag);
  }
};

class MockAudio {
  constructor(src) {
    this.src = src;
    this.volume = 1;
    this._listeners = {};
    playedExternalAudios.push(src);
  }
  addEventListener(ev, fn) {
    if (!this._listeners[ev]) this._listeners[ev] = [];
    this._listeners[ev].push(fn);
  }
  removeEventListener(ev, fn) {
    if (!this._listeners[ev]) return;
    this._listeners[ev] = this._listeners[ev].filter(f => f !== fn);
  }
  play() {
    // Emit ended immediately on microtask so await playExternalAudio resolves cleanly
    queueMicrotask(() => {
      (this._listeners.ended || []).forEach(fn => fn());
    });
    return Promise.resolve();
  }
}

const mockLocalStorage = {
  _store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._store, k) ? this._store[k] : null; },
  setItem(k, v) { this._store[k] = String(v); }
};

const mockWindow = {
  AudioContext: null,
  webkitAudioContext: null,
  addEventListener(ev, fn) {
    if (!windowListeners[ev]) windowListeners[ev] = [];
    windowListeners[ev].push(fn);
  },
  dispatchEvent(evt) {
    const e = evt || {};
    if (!e.preventDefault) e.preventDefault = () => {};
    (windowListeners[e.type] || []).forEach(fn => fn(e));
  },
  speechSynthesis: null,
  showScreen: () => {}
};

globalThis.Audio = MockAudio;
globalThis.document = mockDoc;
globalThis.localStorage = mockLocalStorage;
globalThis.window = mockWindow;
globalThis.requestAnimationFrame = () => {};
const realSetTimeout = globalThis.setTimeout;
const realClearTimeout = globalThis.clearTimeout;
globalThis.setTimeout = function (fn, ms) {
  const id = nextTimerId++;
  timersScheduled.push(ms);
  if (ms <= 100 && ms >= 20) fn();
  else if (ms < 20) return realSetTimeout(fn, ms);
  return id;
};
globalThis.clearTimeout = function (id) {
  if (id !== null && id !== undefined) timersCleared.push(id);
  return realClearTimeout(id);
};

let api = null;

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

function makeItem(id) {
  const ing = api.INGREDIENTS.find(i => i.id === id);
  if (!ing) throw new Error(`Ingredient not found: ${id}`);
  return api.createFoodItem(ing);
}

function resetStation() {
  api.state.stationItems = [];
  api.state.stagingItems = [];
  api.state.plateItems = [];
  api.state.servedDishes = [];
  api.state.isCookingBusy = false;
  api.state.singleKeyShortcutsEnabled = true;
  playedExternalAudios.length = 0;
}

(async () => {
  const appModule = await import(pathToFileURL(appJsPath).href);
  api = appModule.__TEST_API__;

  await test('T1: STATIONS co 18 dung cu & dung cu 18 la mixing_table voi 3 thao tac', () => {
    assert.strictEqual(api.STATIONS.length, 18);
    assert.strictEqual(api.STATIONS[9].id, 'beverage_station');
    assert.strictEqual(api.STATIONS[9].shortName, '10. Pha Chế');
    const mixSt = api.STATIONS[17];
    assert.strictEqual(mixSt.id, 'mixing_table');
    assert.strictEqual(mixSt.shortName, '18. Bàn Trộn');
    assert.strictEqual(mixSt.isMixingStation, true);
    assert.deepStrictEqual(Array.from(mixSt.actions.map(a => a.id)), ['mix_toss', 'knead_dough', 'whisk_batter']);
  });

  await test('T2: 3 file am thanh Ban Tron ton tai trong sounds/', () => {
    ['mix_bowl.ogg', 'knead_dough.ogg', 'whisk_batter.ogg'].forEach(f => {
      const fp = path.join(ROOT_DIR, 'sounds', f);
      assert.ok(fs.existsSync(fp), `Missing sound file ${f}`);
      assert.ok(fs.statSync(fp).size > 1000, `Sound file ${f} too small`);
    });
  });

  await test('T3: Tron bot mi + bot nang + bot gao tren Ban Tron tao kind=mixed, KHONG thanh do uong', async () => {
    resetStation();
    api.state.activeStationId = 'mixing_table';
    api.state.stationItems.push(
      makeItem('wheat_flour'),
      makeItem('tapioca_starch'),
      makeItem('rice_flour')
    );

    await api.performStationAction('mix_toss');

    assert.ok(playedExternalAudios.includes('sounds/mix_bowl.ogg'), 'Phai phat mix_bowl.ogg');
    assert.strictEqual(api.state.stationItems.length, 1);
    const mixed = api.state.stationItems[0];
    assert.strictEqual(mixed.kind, 'mixed');
    assert.notStrictEqual(mixed.texture, 'drink');
    assert.strictEqual(mixed.cookMethod, 'mixed');
    assert.deepStrictEqual(Array.from(mixed.actionHistory), ['mixed']);
    assert.strictEqual(mixed.needsCooking, true);
    assert.strictEqual(mixed.cookLevel, 0);
    assert.strictEqual(mixed.subItems.length, 3);
    assert.ok(api.describeItemStateShort(mixed).includes('trộn đều hỗn hợp'));

    const rawCheck = api.analyzeCulinaryChemistry([mixed]);
    assert.strictEqual(rawCheck.hasRawMeat, true, 'Bot song chua nau phai bao chua chin khi don song');
  });

  await test('T4: Danh bot + trung + sua + duong (W), sau do chien chao -> chin toi (cookLevel=1), mon an khong phai thuc uong', async () => {
    resetStation();
    api.state.activeStationId = 'mixing_table';
    api.state.stationItems.push(
      makeItem('wheat_flour'),
      makeItem('egg'),
      makeItem('milk'),
      makeItem('white_sugar')
    );

    await api.performStationAction('whisk_batter');
    assert.ok(playedExternalAudios.includes('sounds/whisk_batter.ogg'), 'Phai phat whisk_batter.ogg');
    const batter = api.state.stationItems[0];
    assert.strictEqual(batter.kind, 'mixed');
    assert.strictEqual(batter.cookMethod, 'whisked');
    assert.strictEqual(batter.texture, 'soft');
    assert.deepStrictEqual(Array.from(batter.actionHistory), ['whisked']);

    // Bring batter to frying pan
    api.state.activeStationId = 'frying_pan';
    await api.performStationAction('fry_step');

    const cooked = api.state.stationItems[0];
    assert.strictEqual(cooked.cookLevel, 1, 'Nau nhiet lan dau phai la cookLevel=1 (khong nham voi chin qua)');
    assert.strictEqual(cooked.needsCooking, false);
    assert.strictEqual(cooked.cookMethod, 'fried');
    assert.deepStrictEqual(Array.from(cooked.actionHistory), ['whisked', 'fried']);
    assert.ok(cooked.subItems.every(s => s.cookLevel === 1 && s.needsCooking === false));

    const analysis = api.analyzeCulinaryChemistry([cooked]);
    assert.strictEqual(analysis.hasRawMeat, false);
    const review = api.generateSensoryTastingReview([cooked], analysis, api.CHARACTERS[0], 'Bánh Rán Ngọt');
    assert.ok(review.sensorySentence.startsWith("Món 'Bánh Rán Ngọt'"), 'Phai nhan xet la Mon an, khong phai Thuc uong');
    assert.ok(review.sensorySentence.includes('đánh bông sánh mịn'), 'Phai ghi nhan buoc danh bong trong lich su');
    assert.ok(review.sensorySentence.includes('áp chảo'), 'Phai ghi nhan buoc ap chao trong lich su');
    assert.notStrictEqual(api.getEatingSoundForItem(cooked), 'drink.ogg');
  });

  await test('T5: Nhao nan bot (K) cho phep lam vo cuon & phat knead_dough.ogg', async () => {
    resetStation();
    api.state.activeStationId = 'mixing_table';
    api.state.stationItems.push(
      makeItem('wheat_flour'),
      makeItem('pure_water')
    );

    await api.performStationAction('knead_dough');
    assert.ok(playedExternalAudios.includes('sounds/knead_dough.ogg'), 'Phai phat knead_dough.ogg');
    const dough = api.state.stationItems[0];
    assert.strictEqual(dough.cookMethod, 'kneaded');
    assert.strictEqual(dough.canBeWrapper, true);
    assert.deepStrictEqual(Array.from(dough.actionHistory), ['kneaded']);

    // Use dough as wrapper in rolling mat
    api.state.activeStationId = 'rolling_mat';
    api.state.stationItems.push(makeItem('pate'));
    api.state.selectedWrapperUid = dough.uid;
    await api.performStationAction('roll_tight');
    assert.strictEqual(api.state.stationItems[0].kind, 'rolled');
    assert.strictEqual(api.state.stationItems[0].outerItem.uid, dough.uid);
  });

  await test('T6: Tron mon gion san sang an (mix_toss) bao toan do gion va am thanh nhai gion', async () => {
    resetStation();
    api.state.activeStationId = 'mixing_table';
    api.state.stationItems.push(
      makeItem('banh_da_thanh_hoa'),
      makeItem('roasted_rice_powder'),
      makeItem('rau_ma_thanh_hoa')
    );

    await api.performStationAction('mix_toss');
    const crispyMix = api.state.stationItems[0];
    assert.strictEqual(crispyMix.needsCooking, false);
    assert.strictEqual(crispyMix.texture, 'crispy');
    assert.ok(crispyMix.flavors.crunch >= 2.0);
    assert.strictEqual(api.getEatingSoundForItem(crispyMix), 'eat_crispy_food.ogg');
  });

  await test('T7: Tron lien tiep nhieu buoc (mix_toss -> knead_dough -> bake_step) lam phang subItems & luu lich su day du', async () => {
    resetStation();
    api.state.activeStationId = 'mixing_table';
    api.state.stationItems.push(makeItem('wheat_flour'), makeItem('egg'));
    await api.performStationAction('mix_toss');
    api.state.stationItems.push(makeItem('white_sugar'));
    await api.performStationAction('knead_dough');
    api.state.activeStationId = 'oven';
    await api.performStationAction('bake_step');

    const finalItem = api.state.stationItems[0];
    assert.strictEqual(finalItem.subItems.length, 3, 'Khong duoc long item mix cu vao subItems');
    assert.deepStrictEqual(Array.from(finalItem.actionHistory), ['mixed', 'kneaded', 'baked']);
    const shortDesc = api.describeItemStateShort(finalItem);
    assert.ok(shortDesc.includes('trộn đều hỗn hợp ➔ nhào nặn dẻo quánh ➔ đút lò nướng'), `Unexpected shortDesc: ${shortDesc}`);
    const chain = api.formatActionHistoryChain(finalItem.actionHistory, finalItem.cookLevel, false, false, false);
    assert.ok(chain.includes('trộn đều') && chain.includes('nhào nặn dẻo quánh') && chain.includes('đút lò nướng'), `Unexpected chain: ${chain}`);
  });

  await test('T8: Bao toan 100% Tram Pha Che so 10 (beverage_station van thanh do uong)', async () => {
    resetStation();
    api.state.activeStationId = 'beverage_station';
    api.state.stationItems.push(
      makeItem('espresso'),
      makeItem('milk'),
      makeItem('ice_cubes')
    );

    await api.performStationAction('stir_pour');
    const bev = api.state.stationItems[0];
    assert.strictEqual(bev.kind, 'beverage');
    assert.strictEqual(bev.texture, 'drink');
    assert.strictEqual(bev.cookMethod, 'stirred');
    assert.strictEqual(api.getEatingSoundForItem(bev), 'drink_with_ice.ogg');
    const review = api.generateSensoryTastingReview([bev], api.analyzeCulinaryChemistry([bev]), api.CHARACTERS[0], 'Bạc Xỉu');
    assert.ok(review.sensorySentence.startsWith("Thức uống 'Bạc Xỉu'"));
  });

  await test('T9: Phi cong thuc cung (Zero Hardcoded Recipes) & bao toan gia vi khi tron', async () => {
    resetStation();
    api.state.activeStationId = 'mixing_table';
    api.state.stationItems.push(
      makeItem('pork_skin'),
      makeItem('chocolate'),
      makeItem('tomato')
    );
    api.applySpice('chili');
    await api.performStationAction('mix_toss');
    const oddMix = api.state.stationItems[0];
    assert.strictEqual(oddMix.kind, 'mixed');
    assert.strictEqual(oddMix.spicesApplied.length, 3);
    assert.ok(oddMix.flavors.spicy > 2.0);
  });

  await test('T10: Kiem tra HTML & WAI-ARIA (18 Dung Cu, landmark sach, dialog, settings toggle, roving tabindex, focus)', async () => {
    assert.ok(html.includes('Bàn Chế Biến &amp; 18 Dụng Cụ'));
    assert.ok(html.includes('1. Chọn Dụng Cụ Nấu (18 Dụng Cụ)'));
    assert.ok(html.includes('setting-single-key-shortcuts'));
    assert.ok(mainMenuJs.includes('singleKeyShortcutsEnabled'));
    // Ensure no nested <section> inside #panel-workbench
    const wbStart = html.indexOf('id="panel-workbench"');
    const wbEnd = html.indexOf('id="panel-staging"');
    const wbSlice = html.slice(wbStart, wbEnd);
    assert.ok(!wbSlice.includes('<section'), 'Khong duoc con <section> long ben trong #panel-workbench');
    assert.ok(!html.includes('id="fridge-items-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[500px] overflow-y-auto custom-scroll pr-1.5" role="region"'));
    assert.ok(html.includes('id="wrap-vessel-options-container" class="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-labelledby="wrap-vessel-selector-title"'));

    // Bind events & render workbench
    api.bindEvents();
    api.renderAll ? api.renderAll() : null;
    api.renderWorkbench();
    api.renderFridge();

    // Check roving tabindex on station-selector-grid
    const stGrid = mockDoc.getElementById('station-selector-grid');
    assert.strictEqual(stGrid.children.length, 18);
    const activeButtons = stGrid.children.filter(b => b.getAttribute('tabindex') === '0');
    assert.strictEqual(activeButtons.length, 1, 'Chi co dung 1 dung cu co tabindex=0');
    assert.strictEqual(stGrid.children[17].dataset.stationId, 'mixing_table');

    // Focus preservation when clicking station button & moving with ArrowRight
    stGrid.children[16].focus();
    stGrid.dispatchEvent({ type: 'keydown', key: 'ArrowRight' });
    assert.strictEqual(api.state.activeStationId, 'mixing_table');
    assert.strictEqual(mockDoc.activeElement.dataset.stationId, 'mixing_table', 'Focus phai giu tren mixing_table sau khi nhan ArrowRight');

    // Check in-place update & aria-busy container on #station-action-buttons
    const actContainer = mockDoc.getElementById('station-action-buttons');
    assert.strictEqual(actContainer.children.length, 3);
    const firstActionBtnRef = actContainer.children[0];
    firstActionBtnRef.focus();
    api.state.isCookingBusy = true;
    api.renderWorkbench();
    assert.strictEqual(actContainer.getAttribute('aria-busy'), 'true');
    assert.strictEqual(actContainer.children[0], firstActionBtnRef, 'Nut thao tac phai duoc cap nhat in-place, khong huy DOM mat focus');
    assert.strictEqual(firstActionBtnRef.disabled, false, 'Khong dat .disabled=true de tranh rot focus');
    assert.strictEqual(firstActionBtnRef.getAttribute('aria-disabled'), 'true');
    api.state.isCookingBusy = false;
    api.renderWorkbench();

    // Check aria-pressed sync on dest-btn & spice-target
    const destStaging = mockDoc.getElementById('dest-btn-staging');
    const destStation = mockDoc.getElementById('dest-btn-station');
    destStaging.click();
    assert.strictEqual(destStaging.getAttribute('aria-pressed'), 'true');
    assert.strictEqual(destStation.getAttribute('aria-pressed'), 'false');

    const spStaging = mockDoc.getElementById('spice-target-staging');
    const spStation = mockDoc.getElementById('spice-target-station');
    spStaging.click();
    assert.strictEqual(spStaging.getAttribute('aria-pressed'), 'true');
    assert.strictEqual(spStation.getAttribute('aria-pressed'), 'false');

    // Check empty list placeholder has role="listitem"
    api.state.stationItems = [];
    api.renderWorkbench();
    assert.strictEqual(mockDoc.getElementById('station-items-list').children[0].getAttribute('role'), 'listitem');

    // Check announceNVDA uses 60ms delay and skips live-status-text
    timersScheduled.length = 0;
    api.announceNVDA('Thử nghiệm NVDA live region', 'polite');
    assert.ok(timersScheduled.includes(60), 'announceNVDA phai dung 60ms delay');

    // Check keyboard shortcuts K, W, Ctrl+C guard & singleKeyShortcutsEnabled toggle (WCAG 2.1.4)
    api.state.currentScreen = 'kitchen';
    api.state.activeStationId = 'mixing_table';
    api.state.stationItems = [makeItem('wheat_flour'), makeItem('pure_water')];
    api.state.singleKeyShortcutsEnabled = false;
    mockWindow.dispatchEvent({ type: 'keydown', key: 'k', target: mockDoc.body });
    assert.strictEqual(api.state.stationItems.length, 2, 'Khi tat phim tat don ky tu, phim K khong duoc kich hoat');

    // Ctrl+K should NOT trigger game shortcut
    api.state.singleKeyShortcutsEnabled = true;
    mockWindow.dispatchEvent({ type: 'keydown', key: 'k', ctrlKey: true, target: mockDoc.body });
    assert.strictEqual(api.state.stationItems.length, 2, 'To hop Ctrl+K khong duoc kich hoat phim tat trong bep');

    // Active K shortcut triggers knead_dough
    mockWindow.dispatchEvent({ type: 'keydown', key: 'k', target: mockDoc.body });
    await new Promise(r => realSetTimeout(r, 15));
    assert.strictEqual(api.state.stationItems.length, 1);
    assert.strictEqual(api.state.stationItems[0].cookMethod, 'kneaded');

    // Active W shortcut triggers whisk_batter
    api.state.stationItems.push(makeItem('egg'));
    mockWindow.dispatchEvent({ type: 'keydown', key: 'w', target: mockDoc.body });
    await new Promise(r => realSetTimeout(r, 15));
    assert.strictEqual(api.state.stationItems.length, 1);
    assert.strictEqual(api.state.stationItems[0].cookMethod, 'whisked');
    assert.deepStrictEqual(Array.from(api.state.stationItems[0].actionHistory), ['kneaded', 'whisked']);
  });

  function getLiveText(priority = 'polite') {
    const a = mockDoc.getElementById(`nvda-live-${priority}-a`).textContent;
    const b = mockDoc.getElementById(`nvda-live-${priority}-b`).textContent;
    return a || b || '';
  }

  await test('T11: Hien day du 4 nguyen lieu tren Ban Tron (so-co-la, ca phe, trung, sua tuoi) qua mix/knead/whisk + nuong chin, KHONG co (+1)', async () => {
    const fourIds = ['chocolate', 'brewed_coffee', 'egg', 'milk'];
    const fourNames = fourIds.map(id => makeItem(id).name);

    for (const [actId, suffix] of [['mix_toss', 'trộn đều'], ['knead_dough', 'nhào dẻo'], ['whisk_batter', 'đánh mịn']]) {
      resetStation();
      api.state.activeStationId = 'mixing_table';
      fourIds.forEach(id => api.state.stationItems.push(makeItem(id)));

      await api.performStationAction(actId);
      assert.strictEqual(api.state.stationItems.length, 1);
      const item = api.state.stationItems[0];
      assert.strictEqual(item.kind, 'mixed');
      assert.ok(!item.name.includes('(+'), `Khong duoc cat gon ten mon voi (+N): ${item.name}`);
      assert.ok(item.name.endsWith(`(${suffix})`), `Ten mon phai ket thuc bang (${suffix}): ${item.name}`);
      fourNames.forEach(n => {
        assert.ok(item.name.includes(n), `Thieu ten nguyen lieu "${n}" trong "${item.name}"`);
      });

      const live = getLiveText('polite');
      assert.ok(!live.includes('(+'), `Thong bao NVDA khong duoc chua (+N): ${live}`);
      fourNames.forEach(n => {
        assert.ok(live.includes(n), `Thong bao NVDA thieu ten "${n}": ${live}`);
      });
      assert.ok(live.includes('cần làm chín'), 'Vi co Trung ga ta nen phai nhac can lam chin');
    }

    // Mang hon hop 4 nguyen lieu sang Lo Nuong -> van giu du 4 ten, khong (+1)
    resetStation();
    api.state.activeStationId = 'mixing_table';
    fourIds.forEach(id => api.state.stationItems.push(makeItem(id)));
    await api.performStationAction('mix_toss');
    api.state.activeStationId = 'oven';
    await api.performStationAction('bake_step');
    const baked = api.state.stationItems[0];
    assert.ok(!baked.name.includes('(+'), `Ten mon sau khi nuong khong duoc chua (+N): ${baked.name}`);
    fourNames.forEach(n => {
      assert.ok(baked.name.includes(n), `Ten mon sau khi nuong thieu "${n}": ${baked.name}`);
    });
  });

  await test('T12: Kiem thu mo rong 5, 6, 10, 20 nguyen lieu tren Ban Tron & tron nhieu buoc lien tiep', async () => {
    const actions = ['mix_toss', 'knead_dough', 'whisk_batter'];
    for (const [idx, count] of [5, 6, 10, 20].entries()) {
      resetStation();
      api.state.activeStationId = 'mixing_table';
      const batch = api.INGREDIENTS.slice(0, count).map(ing => api.createFoodItem(ing));
      const expectedNames = batch.map(i => i.name);
      api.state.stationItems.push(...batch);

      await api.performStationAction(actions[idx % actions.length]);
      assert.strictEqual(api.state.stationItems.length, 1);
      const res = api.state.stationItems[0];
      assert.strictEqual(res.subItems.length, count);
      assert.ok(!res.name.includes('(+'), `Ban Tron ${count} nguyen lieu khong duoc co (+N): ${res.name}`);
      expectedNames.forEach(n => {
        assert.ok(res.name.includes(n), `Ban Tron ${count} nguyen lieu bi thieu "${n}"`);
      });
      const live = getLiveText('polite');
      expectedNames.forEach(n => {
        assert.ok(live.includes(n), `NVDA Ban Tron ${count} nguyen lieu bi thieu "${n}"`);
      });
    }

    // Sequential multi-step: 6 -> +4 (knead = 10) -> +10 (whisk = 20)
    resetStation();
    api.state.activeStationId = 'mixing_table';
    const first6 = api.INGREDIENTS.slice(0, 6);
    const next4 = api.INGREDIENTS.slice(6, 10);
    const last10 = api.INGREDIENTS.slice(10, 20);
    first6.forEach(ing => api.state.stationItems.push(api.createFoodItem(ing)));
    await api.performStationAction('mix_toss');

    next4.forEach(ing => api.state.stationItems.push(api.createFoodItem(ing)));
    await api.performStationAction('knead_dough');

    last10.forEach(ing => api.state.stationItems.push(api.createFoodItem(ing)));
    await api.performStationAction('whisk_batter');

    const final20 = api.state.stationItems[0];
    assert.strictEqual(final20.subItems.length, 20);
    assert.deepStrictEqual(Array.from(final20.actionHistory), ['mixed', 'kneaded', 'whisked']);
    assert.ok(!final20.name.includes('(+'));
    api.INGREDIENTS.slice(0, 20).forEach(ing => {
      assert.ok(final20.name.includes(ing.name), `Tron 20 nguyen lieu nhieu buoc bi thieu "${ing.name}"`);
    });
  });

  await test('T13: May Xay Sinh To (blend_smooth) hien day du 4, 5, 6, 10, 20 nguyen lieu & xay noi tiep, KHONG co (+N)', async () => {
    for (const count of [4, 5, 6, 10, 20]) {
      resetStation();
      api.state.activeStationId = 'blender';
      const batch = api.INGREDIENTS.slice(0, count).map(ing => api.createFoodItem(ing));
      const expectedNames = batch.map(i => i.name);
      api.state.stationItems.push(...batch);

      await api.performStationAction('blend_smooth');
      assert.strictEqual(api.state.stationItems.length, 1);
      const res = api.state.stationItems[0];
      assert.strictEqual(res.kind, 'blended');
      assert.strictEqual(res.subItems.length, count);
      assert.ok(res.name.endsWith('(xay nhuyễn)'));
      assert.ok(!res.name.includes('(+'), `May xay ${count} nguyen lieu khong duoc co (+N): ${res.name}`);
      expectedNames.forEach(n => {
        assert.ok(res.name.includes(n), `May xay ${count} nguyen lieu bi thieu "${n}"`);
      });
      const live = getLiveText('polite');
      expectedNames.forEach(n => {
        assert.ok(live.includes(n), `NVDA May xay ${count} nguyen lieu bi thieu "${n}"`);
      });
    }

    // Sequential blend: 4 blended + 6 new -> 10 flattened subItems
    resetStation();
    api.state.activeStationId = 'blender';
    api.INGREDIENTS.slice(0, 4).forEach(ing => api.state.stationItems.push(api.createFoodItem(ing)));
    await api.performStationAction('blend_smooth');
    api.INGREDIENTS.slice(4, 10).forEach(ing => api.state.stationItems.push(api.createFoodItem(ing)));
    await api.performStationAction('blend_smooth');
    const blended10 = api.state.stationItems[0];
    assert.strictEqual(blended10.subItems.length, 10);
    assert.ok(!blended10.name.includes('(+'));
    api.INGREDIENTS.slice(0, 10).forEach(ing => {
      assert.ok(blended10.name.includes(ing.name), `Xay noi tiep 10 nguyen lieu bi thieu "${ing.name}"`);
    });
  });

  await test('T14: Kiem tra giao dien & tro nang (khong cat ten truncate, maxlength=2000, WCAG 2.5.3, group actions, sr-only alert)', async () => {
    assert.ok(html.includes('id="input-custom-dish-name" type="text" maxlength="2000"'));
    assert.ok(html.includes('id="login-alert-box" role="alert" aria-live="assertive" class="sr-only'));
    assert.ok(html.includes('id="reg-alert-box" role="alert" aria-live="assertive" class="sr-only'));
    assert.ok(html.includes('id="station-action-buttons" class="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-labelledby="heading-station-actions"'));
    assert.ok(html.includes('id="station-items-list" tabindex="0"'));
    assert.ok(html.includes('<span aria-hidden="true">📦</span>\r\n                <span>Cất ra Khay Tạm (T)</span>') || html.includes('<span aria-hidden="true">📦</span>\n                <span>Cất ra Khay Tạm (T)</span>'));

    resetStation();
    api.state.activeStationId = 'mixing_table';
    ['chocolate', 'brewed_coffee', 'egg', 'milk'].forEach(id => api.state.stationItems.push(makeItem(id)));
    await api.performStationAction('mix_toss');
    api.renderWorkbench();

    // WCAG 2.5.3: station button aria-label starts with visible shortName, uses ': <name>. <desc>' without duplicating identical names
    const stGrid = mockDoc.getElementById('station-selector-grid');
    assert.strictEqual(
      stGrid.children[4].getAttribute('aria-label'),
      `5. Nồi Luộc: Nồi Luộc & Hầm. ${api.STATIONS[4].desc}`
    );
    assert.strictEqual(
      stGrid.children[13].getAttribute('aria-label'),
      `14. Nồi Áp Suất. ${api.STATIONS[13].desc}`
    );
    assert.strictEqual(
      stGrid.children[17].getAttribute('aria-label'),
      `18. Bàn Trộn: Bàn Trộn Đa Năng. ${api.STATIONS[17].desc}`
    );
    assert.strictEqual(Boolean(stGrid.children[17].title), false);

    // Station items list wraps long text cleanly without .truncate & matches button aria-labels (WCAG 2.5.3 without duplicate prefix)
    const stListHtml = mockDoc.getElementById('station-items-list').children[0].innerHTML;
    assert.ok(stListHtml.includes('break-words leading-snug'));
    assert.ok(!stListHtml.includes('truncate'));
    assert.ok(stListHtml.includes('Thanh Sô-cô-la Đen') && stListHtml.includes('Sữa tươi thanh trùng'));
    assert.ok(stListHtml.includes('aria-label="Cất ') && stListHtml.includes('ra khay tạm"'));
    assert.strictEqual(stListHtml.includes('aria-label="Ra khay:'), false);
    assert.ok(stListHtml.includes('aria-label="Xóa '));

    // Action button busy/ready WCAG 2.5.3 labels
    const actContainer = mockDoc.getElementById('station-action-buttons');
    assert.strictEqual(actContainer.children[0].getAttribute('aria-label'), api.STATIONS[17].actions[0].label);
    api.state.isCookingBusy = true;
    api.renderWorkbench();
    assert.ok(actContainer.children[0].getAttribute('aria-label').startsWith('Đang chế biến: '));
    api.state.isCookingBusy = false;

    // Staging & Plate list rendering without truncate or hidden sm:inline (WCAG 2.5.3 without duplicate "Vào bếp:" prefix)
    api.state.stagingItems.push(api.state.stationItems[0]);
    api.renderStagingTray();
    const stagingHtml = mockDoc.getElementById('staging-items-list').children[0].innerHTML;
    assert.ok(stagingHtml.includes('break-words leading-snug') && !stagingHtml.includes('truncate'));
    assert.ok(stagingHtml.includes('aria-label="Đưa ') && stagingHtml.includes('vào bếp hiện tại"'));
    assert.strictEqual(stagingHtml.includes('aria-label="Vào bếp:'), false);

    api.state.plateItems.push(api.state.stationItems[0]);
    api.renderServingPlate();
    const plateHtml = mockDoc.getElementById('plate-items-list').children[0].innerHTML;
    assert.ok(plateHtml.includes('break-words leading-snug') && !plateHtml.includes('truncate'));
    assert.ok(!plateHtml.includes('hidden sm:inline'));
    assert.ok(plateHtml.includes('aria-label="Xóa món '));
  });

  await test('T15: Kiem tra clearTimeout trong announceNVDA, feedCharacter dung polite, & restore focus dialog', async () => {
    timersCleared.length = 0;
    api.announceNVDA('Thong bao thu nhat', 'polite');
    api.announceNVDA('Thong bao thu hai', 'polite');
    assert.ok(timersCleared.length >= 1, 'announceNVDA goi lien tiep phai clearTimeout timer truoc do');

    // Clear assertive & polite live boxes before feedCharacter
    ['nvda-live-assertive-a', 'nvda-live-assertive-b', 'nvda-live-polite-a', 'nvda-live-polite-b'].forEach(id => {
      mockDoc.getElementById(id).textContent = '';
    });
    resetStation();
    const cookie = makeItem('chocolate');
    api.state.plateItems.push(cookie);
    api.state.servedDishes.push({
      id: 'dish-1',
      name: cookie.name,
      items: [cookie],
      analysis: api.analyzeCulinaryChemistry([cookie]),
      garnish: null
    });
    await api.feedCharacter();
    const politeAfterFeed = getLiveText('polite');
    const assertiveAfterFeed = getLiveText('assertive');
    assert.ok(politeAfterFeed.includes('Nhận xét:'), `feedCharacter phai phat nhan xet qua kenh polite: ${politeAfterFeed}`);
    assert.strictEqual(assertiveAfterFeed, '', 'feedCharacter khong duoc chen ngang kenh assertive');

    // Focus restore & sr-only alert checks
    assert.ok(appJsSource.includes('bindDialogFocusRestore(modalSettings)') || fs.existsSync(path.join(ROOT_DIR, 'js', 'ui', 'kitchen-modals.js')));
    assert.ok(mainMenuJs.includes('box.classList.remove("hidden", "sr-only")'));
    assert.ok(mainMenuJs.includes('modalSettings._returnFocusEl'));
    assert.ok(mainMenuJs.includes('modalHelp._returnFocusEl'));
  });

  await test('T16: feedCharacter mon man/cay/chay (dau hu+dau phong+he+rau muong) phat react SFX, giu focus, & khong ket nut', async () => {
    resetStation();
    api.state.currentScreen = 'kitchen';
    api.state.activeKitchenTab = 'workbench';
    api.state.activeStationId = 'mixing_table';
    ['tofu', 'roasted_peanuts', 'garlic_chives', 'water_spinach'].forEach(id => {
      api.state.stationItems.push(makeItem(id));
    });
    await api.performStationAction('mix_toss');
    for (let i = 0; i < 6; i++) api.applySpice('salt');
    api.state.activeStationId = 'pan';
    await api.performStationAction('fry_step');

    const platedItem = api.state.stationItems[0];
    api.state.stationItems = [];
    api.state.plateItems = [platedItem];
    const analysis = api.analyzeCulinaryChemistry(api.state.plateItems);
    api.state.servedDishes = [{
      id: 'dish-user-repro',
      name: analysis.autoTitle,
      items: [...api.state.plateItems],
      analysis,
      garnish: api.GARNISH_OPTIONS[0]
    }];

    const feedBtn = mockDoc.getElementById('btn-master-feed');
    const feedLbl = mockDoc.getElementById('master-feed-label');
    const speechEl = mockDoc.getElementById('dining-speech-bubble');
    feedBtn.focus();
    speechEl.textContent = 'OLD SPEECH';

    ['nvda-live-assertive-a', 'nvda-live-assertive-b', 'nvda-live-polite-a', 'nvda-live-polite-b'].forEach(id => {
      mockDoc.getElementById(id).textContent = '';
    });

    await api.feedCharacter();

    assert.strictEqual(api.state.isFeedingBusy, false, 'feedCharacter phai giai phong isFeedingBusy trong finally');
    assert.strictEqual(feedBtn.disabled, false, 'Khong duoc dat feedBtn.disabled=true lam rot focus NVDA');
    assert.strictEqual(feedBtn.getAttribute('aria-disabled'), null, 'Phai go aria-disabled sau khi an xong');
    assert.strictEqual(feedBtn.getAttribute('aria-busy'), null, 'Khong giu aria-busy=true sau khi an xong');
    assert.strictEqual(mockDoc.activeElement, feedBtn, 'Focus phai duoc giu nguyen tren nut dut an');
    assert.ok(feedLbl.textContent.includes('ĐÚT CHO') && feedLbl.textContent.includes('(F)'), `Nhan nut phai khoi phuc: ${feedLbl.textContent}`);
    assert.notStrictEqual(speechEl.textContent, 'OLD SPEECH', 'Nhan xet moi phai cap nhat len #dining-speech-bubble');
    assert.ok(getLiveText('polite').includes('Nhận xét:'), 'NVDA phai nhan duoc thong bao nhan xet sau khi renderAll');

    // Verify F shortcut switches tab to dining when pressed from another tab
    api.state.activeKitchenTab = 'fridge';
    api.state.plateItems = [];
    api.state.singleKeyShortcutsEnabled = true;
    mockWindow.dispatchEvent({ type: 'keydown', key: 'f', target: mockDoc.body });
    assert.strictEqual(api.state.activeKitchenTab, 'dining', 'Phim F tu tab khac phai chuyen sang tab dining');

    // Verify independent live-region timers: assertive does not clear pending polite timer
    timersCleared.length = 0;
    const origSetTimeout = globalThis.setTimeout;
    let fakeId = 900;
    globalThis.setTimeout = () => ++fakeId;
    api.state.liveRegionTimers = { polite: null, assertive: null };
    api.announceNVDA('Thong bao polite', 'polite');
    api.announceNVDA('Thong bao assertive', 'assertive');
    globalThis.setTimeout = origSetTimeout;
    assert.strictEqual(timersCleared.length, 0, 'Kenh assertive khong duoc huy timer cua kenh polite');

    // HTML WCAG 2.2 checks for dining & live regions
    assert.ok(html.includes('<output id="dining-last-score"'), '#dining-last-score phai dung the <output>');
    assert.ok(html.includes('id="plate-items-list" tabindex="0"'), '#plate-items-list phai co tabindex="0"');
    assert.strictEqual(html.includes('id="nvda-live-polite-a" class="sr-only-live" role="status"'), false, 'Bo role="status" du thua tren live region');
    assert.strictEqual(html.includes('id="nvda-live-assertive-a" class="sr-only-live" role="alert"'), false, 'Bo role="alert" du thua tren live region');
  });

  console.log(`\nSUMMARY: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
})();
