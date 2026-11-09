import { showScreen } from "./main-menu.js";

    import { analyzeCulinaryChemistry, describeItemStateShort, generateSmartDishTitle } from "./cooking/culinary-chemistry.js";
    import { state } from "./core/state.js";
    import { createFoodItem, determineDefaultTexture, itemContainsIce } from "./cooking/food-items.js";
    import { CHARACTERS } from "./data/characters.js";
    import { FRIDGE_CATEGORIES } from "./data/fridge-categories.js";
    import { INGREDIENTS } from "./data/ingredients.js";
    import { STATIONS } from "./data/stations.js";
    import { SPICES } from "./data/spices.js";
    import { GARNISH_OPTIONS } from "./data/garnish-options.js";
    import { FLAVOR_DIMENSIONS } from "./data/flavor-dimensions.js";

    /*************************************************************************
     * 1. CƠ SỞ DỮ LIỆU THỰC KHÁCH, NGUYÊN LIỆU MỞ RỘNG & DỤNG CỤ
     *************************************************************************/





    // EXPANDED PANTRY WITH 200 INGREDIENTS ACROSS FOOD, DRINKS, FLOURS, WRAPPERS, SNACKS AND PRODUCE


    // 9 COOKING STATIONS (YUMCRAFT KITCHEN COMPLETE SUITE)


    // 29 EXPANDED SPICES






    /*************************************************************************
     * 2. TRẠNG THÁI TRÒ CHƠI TOÀN CỤC (GLOBAL GAME STATE)
     *************************************************************************/


    /*************************************************************************
     * 3. HỆ THỐNG TRỢ NĂNG NVDA & ĐỌC MÀN HÌNH (ARIA LIVE & TTS)
     *************************************************************************/
    function announceNVDA(message, priority = 'polite') {
      if (!message) return;

      const liveTextEl = document.getElementById('live-status-text');
      if (liveTextEl) {
        liveTextEl.textContent = message;
      }

      state.liveToggleBuffer = !state.liveToggleBuffer;
      const suffix = state.liveToggleBuffer ? 'a' : 'b';
      const otherSuffix = state.liveToggleBuffer ? 'b' : 'a';

      const targetId = priority === 'assertive' ? `nvda-live-assertive-${suffix}` : `nvda-live-polite-${suffix}`;
      const clearId = priority === 'assertive' ? `nvda-live-assertive-${otherSuffix}` : `nvda-live-polite-${otherSuffix}`;

      const targetEl = document.getElementById(targetId);
      const clearEl = document.getElementById(clearId);

      if (clearEl) clearEl.textContent = '';
      if (targetEl) {
        targetEl.textContent = '';
        setTimeout(() => {
          targetEl.textContent = message;
        }, 25);
      }

      if (state.ttsEnabled && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(message);
          utter.lang = 'vi-VN';
          utter.rate = 1.08;
          window.speechSynthesis.speak(utter);
        } catch (err) {}
      }
    }

    /*************************************************************************
     * 4. BỘ PHÁT ÂM THANH NGOÀI & TỔNG HỢP SÓNG YUMCRAFT (FOLEY & WEB AUDIO)
     *************************************************************************/
    let audioCtx = null;
    function ensureAudioContext() {
      if (!state.sfxEnabled) return null;
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    // Play external audio file from sounds/ with optional Play Wait Promise
    function playExternalAudio(filename, wait = false) {
      if (!state.sfxEnabled) return Promise.resolve();
      return new Promise((resolve) => {
        try {
          const encodedName = encodeURI(filename);
          const audio = new Audio(`sounds/${encodedName}`);
          audio.volume = 0.9;

          if (!wait) {
            audio.play().catch(e => {
              console.warn('Audio play error (no-wait):', e);
            });
            resolve();
            return;
          }

          let isResolved = false;
          const complete = () => {
            if (!isResolved) {
              isResolved = true;
              audio.removeEventListener('ended', complete);
              audio.removeEventListener('error', onError);
              resolve();
            }
          };

          const onError = (e) => {
            console.warn(`Lỗi tải âm thanh sounds/${filename}:`, e);
            complete();
          };

          audio.addEventListener('ended', complete);
          audio.addEventListener('error', onError);

          // Timeout dự phòng an toàn 12s nếu trình duyệt chặn autoplay hoặc file lỗi
          const safetyTimer = setTimeout(() => {
            complete();
          }, 12000);

          audio.play().catch(err => {
            console.warn(`Lỗi phát âm thanh sounds/${filename}:`, err);
            clearTimeout(safetyTimer);
            complete();
          });
        } catch (err) {
          console.warn('playExternalAudio exception:', err);
          resolve();
        }
      });
    }

    function playSoundEffect(type) {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'pick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'door') {
        // Fridge door sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
      } else if (type === 'chop') {
        [0, 0.11, 0.22].forEach((offset) => {
          const t = now + offset;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(180, t);
          osc.frequency.exponentialRampToValueAtTime(55, t + 0.06);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.08);
        });
      } else if (type === 'roll' || type === 'stuff') {
        const dur = 0.28;
        const bufSize = Math.floor(ctx.sampleRate * dur);
        const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufSize) * Math.PI);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = type === 'stuff' ? 1400 : 2200;
        const nGain = ctx.createGain();
        nGain.gain.value = 0.28;
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(now);

        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const t = now + 0.1 + idx * 0.07;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.18, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.15);
        });
      } else if (type === 'sizzle' || type === 'deep_fry' || type === 'grill') {
        const duration = 0.65;
        const bufSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin(i * 0.03));
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = type === 'deep_fry' ? 2800 : 1900;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.005, now + duration);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (type === 'boil') {
        [0, 0.1, 0.2, 0.32, 0.44].forEach((offset) => {
          const t = now + offset;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const baseFreq = 230 + Math.random() * 160;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(baseFreq, t);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.0, t + 0.07);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.09);
        });
      } else if (type === 'blend') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.linearRampToValueAtTime(260, now + 0.3);
        osc.frequency.linearRampToValueAtTime(140, now + 0.55);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 750;
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.58);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'oven') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.56);
      } else if (type === 'microwave') {
        [0, 0.18].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now + offset);
          gain.gain.setValueAtTime(0.16, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.1);
        });
      } else if (type === 'spice') {
        const bufSize = Math.floor(ctx.sampleRate * 0.07);
        const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3500;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.22, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        noise.connect(filter);
        filter.connect(g);
        g.connect(ctx.destination);
        noise.start(now);
      } else if (type === 'drink') {
        [0, 0.12, 0.24].forEach((offset, idx) => {
          const t = now + offset;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(290 + idx * 60, t);
          osc.frequency.exponentialRampToValueAtTime(540 + idx * 60, t + 0.09);
          g.gain.setValueAtTime(0.2, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.11);
        });
      } else if (type === 'react_love') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const t = now + idx * 0.08;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.22, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.27);
        });
      } else if (type === 'react_good') {
        [440, 554.37, 659.25].forEach((freq, idx) => {
          const t = now + idx * 0.09;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.2, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.21);
        });
      } else if (type === 'react_bad') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);
        g.gain.setValueAtTime(0.22, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.43);
      }
    }

    /*************************************************************************
     * 5. MÔ HÌNH DỮ LIỆU MÓN ĂN & HÒA VỊ THỰC TẾ (CULINARY CHEMISTRY)
     *************************************************************************/
    function switchKitchenTab(tabName, announce = false) {
      state.activeKitchenTab = tabName;
      const tabs = [
        { id: 'fridge', name: '1. Tủ Lạnh & Kho Đồ' },
        { id: 'workbench', name: '2. Bàn Chế Biến' },
        { id: 'staging', name: '3. Khay Tạm' },
        { id: 'spices', name: '4. Gia Vị' },
        { id: 'dining', name: '5. Bàn Tiệc & Thưởng Thức' }
      ];

      tabs.forEach(t => {
        const btn = document.getElementById('tab-' + t.id);
        const panel = document.getElementById('panel-' + t.id);
        const isCurrent = t.id === tabName;

        if (btn) {
          btn.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
          btn.setAttribute('tabindex', isCurrent ? '0' : '-1');
          if (isCurrent) {
            btn.classList.add('tab-btn-active');
            btn.classList.remove('tab-btn-inactive');
          } else {
            btn.classList.remove('tab-btn-active');
            btn.classList.add('tab-btn-inactive');
          }
        }

        if (panel) {
          if (isCurrent) {
            panel.classList.remove('hidden');
          } else {
            panel.classList.add('hidden');
          }
        }
      });

      if (tabName === 'workbench') {
        drawWorkbenchCanvas();
      } else if (tabName === 'dining') {
        drawDiningCharacterCanvas();
      }

      if (announce) {
        const currentTab = tabs.find(t => t.id === tabName);
        if (currentTab) {
          announceNVDA(`Đã mở tab: ${currentTab.name}`, 'polite');
        }
      }
    }

    // ADD FROM FRIDGE (Chỉ đưa vào Bếp hoặc Khay Tạm - không đưa ra dĩa)
    function addIngredientFromFridge(ingId) {
      const ing = INGREDIENTS.find(i => i.id === ingId);
      if (!ing) return;

      const newItem = createFoodItem(ing, state.nextItemUid++);
      playSoundEffect('pick');

      if (state.fridgeDestination === 'staging') {
        state.stagingItems.push(newItem);
        announceNVDA(`Đã lấy ${ing.name} bỏ vào Khay Tạm Chờ Sơ Chế.`, 'polite');
      } else {
        state.stationItems.push(newItem);
        const st = STATIONS.find(s => s.id === state.activeStationId);
        announceNVDA(`Đã bỏ ${ing.name} vào ${st.name}. Hiện có ${state.stationItems.length} nguyên liệu trong dụng cụ.`, 'polite');
      }
      renderAll();
    }

    // SPICES APPLICATION (Chỉ nêm vào Bếp hoặc Khay Tạm - không nêm ra dĩa)
    function applySpice(spiceId) {
      const spice = SPICES.find(s => s.id === spiceId);
      if (!spice) return;

      let targetArray = state.stationItems;
      let targetName = 'Bàn Chế Biến';
      if (state.spiceTarget === 'staging') {
        targetArray = state.stagingItems;
        targetName = 'Khay Tạm Chờ Sơ Chế';
      }

      if (targetArray.length === 0) {
        announceNVDA(`Chưa có thức ăn nào trong ${targetName} để nêm ${spice.name}! Hãy lấy đồ ăn vào trước.`, 'assertive');
        return;
      }

      playSoundEffect('spice');
      const share = 1 / Math.sqrt(targetArray.length);
      targetArray.forEach(it => {
        const spiceRecord = { id: spice.id, name: spice.name, cookedIn: false };
        it.spicesApplied.push(spiceRecord);

        // Nếu là món đã cuốn hoặc nhồi, gia vị này nêm trực tiếp lên lớp vỏ ngoài!
        if (it.kind === 'rolled' || it.kind === 'stuffed') {
          if (!it.outerSpices) it.outerSpices = [];
          it.outerSpices.push({ ...spiceRecord });
          if (it.outerItem) {
            if (!it.outerItem.spicesApplied) it.outerItem.spicesApplied = [];
            it.outerItem.spicesApplied.push({ ...spiceRecord });
          }
        }

        Object.keys(spice.add).forEach(k => {
          it.flavors[k] = Math.max(0, (it.flavors[k] || 0) + spice.add[k] * share);
        });
      });

      state.stationActionFlash = 16;
      state.stationActionType = 'spice';
      if (targetArray.length === 1 && (targetArray[0].kind === 'rolled' || targetArray[0].kind === 'stuffed')) {
        announceNVDA(`Đã nêm ${spice.name} (${spice.desc}) lên lớp vỏ ngoài của món "${targetArray[0].name}".`, 'polite');
      } else {
        announceNVDA(`Đã nêm ${spice.name} (${spice.desc}) vào ${targetName}.`, 'polite');
      }
      renderAll();
    }

    // STATION COOKING / CHOPPING / BLENDING (ASYNC WITH PLAY WAIT)
    async function performStationAction(actionId) {
      if (state.isCookingBusy) return;

      const station = STATIONS.find(s => s.id === state.activeStationId);
      if (!station) return;

      if (state.stationItems.length === 0) {
        announceNVDA(`${station.name} đang trống! Hãy chọn nguyên liệu từ Tủ Lạnh (Alt+1) bỏ vào đây trước.`, 'assertive');
        return;
      }

      state.stationActionFlash = 24;
      state.stationActionType = actionId;

      // 1. Dao thớt (Slice, Dice, Mince) - PHÁT TỨC THÌ BẰNG food_cut.ogg, KHÔNG CẦN PLAY WAIT
      if (actionId === 'slice' || actionId === 'dice' || actionId === 'mince') {
        const currentBatchId = state.nextBatchId++;
        playExternalAudio('food_cut.ogg', false);
        const cutMap = { slice: 'sliced', dice: 'diced', mince: 'minced' };
        const labelMap = { slice: 'thái lát mỏng', dice: 'thái hạt lựu', mince: 'băm nhuyễn' };
        state.stationItems.forEach(item => {
          item.cutState = cutMap[actionId];
          item.lastStationId = state.activeStationId;
          item.batchId = currentBatchId;
          if (!item.actionHistory) item.actionHistory = [];
          if (!item.actionHistory.includes(cutMap[actionId])) {
            item.actionHistory.push(cutMap[actionId]);
          }
          item.flavors.aroma += 0.5;
          item.flavors.umami += 0.2;
        });
        const names = state.stationItems.map(i => i.name).join(', ');
        announceNVDA(`Đã ${labelMap[actionId]} ${names} trên thớt gỗ. Thức ăn dậy mùi và sẵn sàng cuốn/nhồi hoặc nấu!`, 'polite');
        renderAll();
        return;
      }

      // 2. Bàn Cuốn Đa Năng (Rolling Mat) - ROLL WITH ANY INGREDIENT AS WRAPPER!
      if (actionId === 'roll_tight') {
        if (state.stationItems.length < 2) {
          announceNVDA('Để cuốn, bạn cần ít nhất 2 nguyên liệu: 1 nguyên liệu làm lớp vỏ ngoài (như bánh tráng, rong biển, lá lốt hoặc lát thịt bò) và các nguyên liệu làm nhân bên trong!', 'assertive');
          return;
        }

        // Identify which item is outer wrapper
        let wrapperIdx = state.stationItems.findIndex(i => i.uid === state.selectedWrapperUid);
        if (wrapperIdx === -1) {
          const preferred = state.stationItems.findIndex(i => i.canBeWrapper || i.baseId === 'rice_paper' || i.baseId === 'nori_seaweed' || i.baseId === 'betel_leaf' || i.baseId === 'pho_sheet' || i.baseId === 'tortilla_wrap' || i.baseId === 'beef' || i.baseId === 'pork_belly' || i.baseId === 'scallion');
          wrapperIdx = preferred !== -1 ? preferred : 0;
        }

        const [outerWrapper] = state.stationItems.splice(wrapperIdx, 1);
        const innerFillings = [...state.stationItems];
        playSoundEffect('roll');

        const combinedFlavors = { ...outerWrapper.flavors };
        const combinedSpices = [...outerWrapper.spicesApplied];
        const outerSpices = outerWrapper.spicesApplied ? outerWrapper.spicesApplied.map(sp => ({ ...sp })) : [];
        const innerSpices = [];
        let anyNeedsCooking = outerWrapper.needsCooking && outerWrapper.cookLevel === 0;
        let maxCookLevel = outerWrapper.cookLevel;
        const rollFillingShare = 1 / Math.sqrt(Math.max(1, innerFillings.length));

        innerFillings.forEach(f => {
          Object.keys(combinedFlavors).forEach(k => {
            combinedFlavors[k] = (combinedFlavors[k] || 0) + (f.flavors[k] || 0) * 0.85 * rollFillingShare;
          });
          if (f.needsCooking && f.cookLevel === 0) anyNeedsCooking = true;
          if (f.cookLevel > maxCookLevel) maxCookLevel = f.cookLevel;
          (f.spicesApplied || []).forEach(sp => {
            combinedSpices.push({ ...sp });
            innerSpices.push({ ...sp });
          });
        });

        combinedFlavors.aroma += 1.5;
        combinedFlavors.umami += 0.8;

        const fillingNames = innerFillings.map(i => i.name).join(' & ');
        const rolledName = `${outerWrapper.name} cuộn [${fillingNames}]`;

        const outerTexture = outerWrapper.texture === 'crispy' ? 'crispy' : 'soft';

        const inheritedRollActions = [...(outerWrapper.actionHistory || [])];
        if (inheritedRollActions.length === 0 || inheritedRollActions[inheritedRollActions.length - 1] !== 'rolled') {
          inheritedRollActions.push('rolled');
        }

        const currentBatchId = state.nextBatchId++;
        const rolledItem = {
          uid: state.nextItemUid++,
          kind: 'rolled',
          baseId: `roll_${outerWrapper.baseId}`,
          name: rolledName,
          emoji: '🌯',
          category: 'wrappers',
          color: outerWrapper.color,
          cookedColor: '#d97706',
          needsCooking: anyNeedsCooking,
          isFreshBalancer: outerWrapper.isFreshBalancer || innerFillings.some(i => i.isFreshBalancer),
          cutState: 'whole',
          cookLevel: anyNeedsCooking ? 0 : Math.max(1, maxCookLevel),
          cookMethod: outerWrapper.cookMethod !== 'none' ? outerWrapper.cookMethod : 'none',
          actionHistory: inheritedRollActions,
          lastStationId: state.activeStationId,
          batchId: currentBatchId,
          returnedFromStaging: false,
          texture: outerTexture,
          outerTexture: outerTexture,
          hasIce: outerWrapper.hasIce || innerFillings.some(i => i.hasIce),
          spicesApplied: combinedSpices,
          outerSpices: outerSpices,
          innerSpices: innerSpices,
          subItems: [outerWrapper, ...innerFillings],
          innerItems: [...innerFillings],
          outerItem: outerWrapper,
          flavors: combinedFlavors
        };

        state.stationItems = [rolledItem];
        state.selectedWrapperUid = null;

        announceNVDA(`Đã cuộn tròn một lượt thành món "${rolledItem.name}"! Bạn có thể cất ra Khay Tạm (T) hoặc chuyển sang Chảo Chiên / Vỉ Than Nướng để làm chín vàng giòn rụm!`, 'assertive');
        renderAll();
        return;
      }

      // 3. Trạm Kẹp & Nhồi Nhân (Stuffing Station) - STUFF WITH ANY INGREDIENT AS VESSEL!
      if (actionId === 'stuff_pack') {
        if (state.stationItems.length < 2) {
          announceNVDA('Để nhồi, bạn cần ít nhất 2 nguyên liệu: 1 nguyên liệu làm vỏ nhồi (như ổ bánh mì, cây xúc xích, quả ớt chuông, mực, hoặc bánh oreo) và các nguyên liệu làm nhân nhồi vào ruột!', 'assertive');
          return;
        }

        let vesselIdx = state.stationItems.findIndex(i => i.uid === state.selectedVesselUid);
        if (vesselIdx === -1) {
          const primaryVessel = state.stationItems.findIndex(i => i.baseId === 'banh_mi_vn' || i.baseId === 'burger_bun' || i.baseId === 'taco_shell' || i.baseId === 'croissant');
          if (primaryVessel !== -1) {
            vesselIdx = primaryVessel;
          } else {
            const preferred = state.stationItems.findIndex(i => i.canBeVessel || i.baseId === 'bell_pepper' || i.baseId === 'squid' || i.baseId === 'lotus_root' || i.baseId === 'onion' || i.baseId === 'oreo' || i.baseId === 'sausage');
            vesselIdx = preferred !== -1 ? preferred : 0;
          }
        }

        const [outerVessel] = state.stationItems.splice(vesselIdx, 1);
        const innerStuffings = [...state.stationItems];
        playSoundEffect('stuff');

        const combinedFlavors = { ...outerVessel.flavors };
        const combinedSpices = [...outerVessel.spicesApplied];
        const outerSpices = outerVessel.spicesApplied ? outerVessel.spicesApplied.map(sp => ({ ...sp })) : [];
        const innerSpices = [];
        let anyNeedsCooking = outerVessel.needsCooking && outerVessel.cookLevel === 0;
        const stuffFillingShare = 1 / Math.sqrt(Math.max(1, innerStuffings.length));

        innerStuffings.forEach(s => {
          Object.keys(combinedFlavors).forEach(k => {
            combinedFlavors[k] = (combinedFlavors[k] || 0) + (s.flavors[k] || 0) * 0.85 * stuffFillingShare;
          });
          if (s.needsCooking && s.cookLevel === 0) anyNeedsCooking = true;
          (s.spicesApplied || []).forEach(sp => {
            combinedSpices.push({ ...sp });
            innerSpices.push({ ...sp });
          });
        });

        combinedFlavors.aroma += 1.6;
        combinedFlavors.crunch += outerVessel.flavors.crunch ? outerVessel.flavors.crunch * 0.5 : 0;

        const stuffingNames = innerStuffings.map(i => i.name).join(' & ');
        const stuffedName = `${outerVessel.name} nhồi [${stuffingNames}]`;

        const outerTexture = outerVessel.texture === 'crispy' ? 'crispy' : 'soft';

        const inheritedStuffActions = [...(outerVessel.actionHistory || [])];
        if (inheritedStuffActions.length === 0 || inheritedStuffActions[inheritedStuffActions.length - 1] !== 'stuffed') {
          inheritedStuffActions.push('stuffed');
        }

        const currentBatchId = state.nextBatchId++;
        const stuffedItem = {
          uid: state.nextItemUid++,
          kind: 'stuffed',
          baseId: `stuffed_${outerVessel.baseId}`,
          name: stuffedName,
          emoji: outerVessel.emoji,
          category: 'wrappers',
          color: outerVessel.color,
          cookedColor: '#b45309',
          needsCooking: anyNeedsCooking,
          isFreshBalancer: outerVessel.isFreshBalancer || innerStuffings.some(i => i.isFreshBalancer),
          cutState: 'whole',
          cookLevel: anyNeedsCooking ? 0 : 1,
          cookMethod: outerVessel.cookMethod !== 'none' ? outerVessel.cookMethod : 'none',
          actionHistory: inheritedStuffActions,
          lastStationId: state.activeStationId,
          batchId: currentBatchId,
          returnedFromStaging: false,
          texture: outerTexture,
          outerTexture: outerTexture,
          hasIce: outerVessel.hasIce || innerStuffings.some(i => i.hasIce),
          spicesApplied: combinedSpices,
          outerSpices: outerSpices,
          innerSpices: innerSpices,
          subItems: [outerVessel, ...innerStuffings],
          innerItems: [...innerStuffings],
          outerItem: outerVessel,
          flavors: combinedFlavors
        };

        state.stationItems = [stuffedItem];
        state.selectedVesselUid = null;

        announceNVDA(`Đã xẻ ruột và nhồi chặt thành món "${stuffedItem.name}"! Bạn có thể cất ra Khay Tạm (T) hoặc cho vào Lò Nướng / Vỉ Than nướng nóng giòn!`, 'assertive');
        renderAll();
        return;
      }

      // 4. Máy Xay Sinh Tố (Blender) - PLAY WAIT VỚI blender.ogg
      if (actionId === 'blend_smooth') {
        state.isCookingBusy = true;
        state.stationActionFlash = 45;
        state.stationActionType = 'blend_smooth';
        renderWorkbench();

        await playExternalAudio('blender.ogg', true);

        const names = state.stationItems.map(i => i.name);
        const combinedFlavors = { umami: 0, salty: 0, sweet: 0, sour: 0, spicy: 0, fatty: 0, bitter: 0, aroma: 1.0, crunch: 0.0 };
        const combinedSpices = [];
        let anyRaw = false;

        state.stationItems.forEach(item => {
          Object.keys(combinedFlavors).forEach(k => {
            combinedFlavors[k] += (item.flavors[k] || 0) * 0.85;
          });
          if (item.needsCooking && item.cookLevel === 0) anyRaw = true;
          item.spicesApplied.forEach(sp => combinedSpices.push({ ...sp }));
        });

        const isSweetDrink = state.stationItems.every(i => i.category === 'sweets' || i.category === 'veg' || i.baseId === 'milk' || i.baseId === 'chocolate' || i.baseId === 'oreo');
        const defaultBlendName = `${names.slice(0, 3).join(' & ')} (xay nhuyễn)`;

        const hasIceInBlender = state.stationItems.some(i => itemContainsIce(i));

        const inheritedBlendActions = [];
        const nonIceBlendItems = state.stationItems.filter(i => i.id !== 'ice_cubes' && i.baseId !== 'ice_cubes');
        const allShareSameBlendHistory = nonIceBlendItems.length > 0 && nonIceBlendItems.every(
          i => JSON.stringify(i.actionHistory || []) === JSON.stringify(nonIceBlendItems[0].actionHistory || [])
        );
        if (state.stationItems.length === 1 || allShareSameBlendHistory) {
          const refItem = nonIceBlendItems[0] || state.stationItems[0];
          (refItem.actionHistory || []).forEach(act => {
            if (inheritedBlendActions.length === 0 || inheritedBlendActions[inheritedBlendActions.length - 1] !== act) {
              inheritedBlendActions.push(act);
            }
          });
        }
        if (inheritedBlendActions.length === 0 || inheritedBlendActions[inheritedBlendActions.length - 1] !== 'blended') {
          inheritedBlendActions.push('blended');
        }

        const currentBatchId = state.nextBatchId++;
        const blendedItem = {
          uid: state.nextItemUid++,
          kind: 'blended',
          baseId: 'blended_mix',
          name: defaultBlendName,
          emoji: isSweetDrink ? '🥤' : '🥣',
          category: 'sweets',
          color: state.stationItems[0].color,
          cookedColor: state.stationItems[0].cookedColor,
          needsCooking: anyRaw,
          isFreshBalancer: state.stationItems.some(i => i.isFreshBalancer),
          cutState: 'minced',
          cookLevel: anyRaw ? 0 : 1,
          cookMethod: 'blended',
          actionHistory: inheritedBlendActions,
          lastStationId: state.activeStationId,
          batchId: currentBatchId,
          returnedFromStaging: false,
          texture: 'drink',
          hasIce: hasIceInBlender,
          outerTexture: null,
          spicesApplied: combinedSpices,
          subItems: [...state.stationItems],
          outerItem: null,
          flavors: combinedFlavors
        };

        state.stationItems = [blendedItem];
        state.isCookingBusy = false;
        const coldBlendedPhrase = hasIceInBlender ? 'mát lạnh' : 'thơm ngon';
        announceNVDA(`Máy xay đã xay nhuyễn tất cả thành món "${blendedItem.name}" sánh mịn ${coldBlendedPhrase}!`, 'polite');
        renderAll();
        return;
      }

      // 4b. Trạm Pha Chế Đồ Uống (Beverage Station) - PLAY WAIT VỚI 5 ÂM THANH FOLEY TỰ NHIÊN
      if (actionId === 'stir_pour' || actionId === 'shake_shaker' || actionId === 'brew_infuse') {
        state.isCookingBusy = true;
        state.stationActionFlash = 45;
        state.stationActionType = actionId;
        renderWorkbench();

        // Nhận diện đá viên đa tầng (kể cả khi thức uống đã qua khuấy/lắc trước đó)
        const hadIce = state.stationItems.some(i => itemContainsIce(i));
        const isBrewing = actionId === 'brew_infuse';
        // Nước sôi 90-100°C làm tan chảy toàn bộ đá viên!
        const iceMelted = isBrewing && hadIce;
        const hasIce = hadIce && !isBrewing;

        let soundFile = 'stir_liquid.ogg';
        let actionVerb = 'khuấy đều';
        let method = 'stirred';

        if (actionId === 'stir_pour') {
          soundFile = hasIce ? 'stir_ice.ogg' : 'stir_liquid.ogg';
          actionVerb = 'khuấy đều trong ly thủy tinh';
          method = 'stirred';
        } else if (actionId === 'shake_shaker') {
          soundFile = hasIce ? 'shake_ice.ogg' : 'shake_liquid.ogg';
          actionVerb = 'lắc bình shaker sủi bọt';
          method = 'shaken';
        } else if (actionId === 'brew_infuse') {
          soundFile = 'brew_drink.ogg';
          actionVerb = 'hãm nước sôi nóng hổi';
          method = 'brewed';
        }

        await playExternalAudio(soundFile, true);

        // Bảo toàn danh sách nguyên liệu gốc khi thao tác liên tiếp (không lồng thức uống vào thức uống)
        const isContinuousBeverage = state.stationItems.length === 1 && state.stationItems[0].kind === 'beverage';
        const sourceItems = isContinuousBeverage && state.stationItems[0].subItems && state.stationItems[0].subItems.length > 0
          ? state.stationItems[0].subItems
          : state.stationItems;

        const names = sourceItems.map(i => i.name);
        const combinedFlavors = { umami: 0, salty: 0, sweet: 0, sour: 0, spicy: 0, fatty: 0, bitter: 0, aroma: 1.0, crunch: 0.0 };
        const combinedSpices = [];
        let anyRaw = false;

        state.stationItems.forEach(item => {
          Object.keys(combinedFlavors).forEach(k => {
            combinedFlavors[k] += (item.flavors[k] || 0) * 0.9;
          });
          if (item.needsCooking && item.cookLevel === 0 && actionId !== 'brew_infuse') anyRaw = true;
          (item.spicesApplied || []).forEach(sp => combinedSpices.push({ ...sp, cookedIn: true }));
          if (item.subItems) {
            item.subItems.forEach(sub => {
              (sub.spicesApplied || []).forEach(sp => combinedSpices.push({ ...sp, cookedIn: true }));
            });
          }
        });

        // Tác động vật lý cảm quan:
        if (hasIce) {
          combinedFlavors.sweet *= 0.88;
          combinedFlavors.bitter *= 0.88;
          combinedFlavors.sour *= 0.88;
          combinedFlavors.aroma += 0.5;
        } else if (iceMelted) {
          // Đá viên tan chảy làm loãng nhẹ độ đậm đặc nhưng hòa quyện êm dịu
          combinedFlavors.sweet *= 0.92;
          combinedFlavors.bitter *= 0.92;
          combinedFlavors.aroma += 1.2;
        }
        if (actionId === 'brew_infuse') {
          combinedFlavors.aroma += 1.8;
          combinedFlavors.bitter += 0.3;
        }
        if (actionId === 'shake_shaker') {
          combinedFlavors.aroma += 1.2;
          combinedFlavors.fatty *= 1.08;
        }

        // Kế thừa và bảo toàn chuỗi phương pháp chế biến liên tục (Toca Kitchen Sandbox)
        const inheritedBevActions = [];
        const nonIceBevItems = state.stationItems.filter(i => i.id !== 'ice_cubes' && i.baseId !== 'ice_cubes');
        const allShareSameBevHistory = nonIceBevItems.length > 0 && nonIceBevItems.every(
          i => JSON.stringify(i.actionHistory || []) === JSON.stringify(nonIceBevItems[0].actionHistory || [])
        );
        if (state.stationItems.length === 1 || allShareSameBevHistory) {
          const refItem = nonIceBevItems[0] || state.stationItems[0];
          (refItem.actionHistory || []).forEach(act => {
            if (inheritedBevActions.length === 0 || inheritedBevActions[inheritedBevActions.length - 1] !== act) {
              inheritedBevActions.push(act);
            }
          });
        }
        if (inheritedBevActions.length === 0 || inheritedBevActions[inheritedBevActions.length - 1] !== method) {
          inheritedBevActions.push(method);
        }

        const actionShortLabels = {
          stirred: 'khuấy ly',
          shaken: 'lắc shaker',
          brewed: 'hãm nóng',
          blended: 'xay sinh tố',
          air_fried: 'chiên khí nóng',
          rice_cooked: 'nấu bằng nồi cơm điện',
          microwaved: 'làm nóng bằng vi sóng',
          boiled: 'luộc/hầm',
          fried: 'áp chảo',
          deep_fried: 'chiên ngập dầu',
          baked: 'nướng lò',
          grilled: 'nướng than'
        };

        const methodLabel = inheritedBevActions.map(a => actionShortLabels[a] || a).join(' & ');
        const defaultBeverageName = `${names.join(' & ')} (${methodLabel})`;

        // Emoji linh hoạt
        let beverageEmoji = '🍹';
        if (hasIce) beverageEmoji = '🧋';
        else if (actionId === 'brew_infuse') beverageEmoji = '☕';
        else if (state.stationItems.some(i => i.baseId === 'milk' || i.baseId === 'condensed_milk')) beverageEmoji = '🥛';
        else if (state.stationItems.some(i => i.baseId === 'green_tea_leaves' || i.baseId === 'matcha_powder')) beverageEmoji = '🍵';
        else if (state.stationItems.some(i => i.baseId === 'red_wine')) beverageEmoji = '🍷';
        else if (state.stationItems.some(i => i.baseId === 'white_wine')) beverageEmoji = '🥂';
        else if (state.stationItems.some(i => i.baseId === 'craft_beer')) beverageEmoji = '🍺';
        else if (state.stationItems.some(i => i.baseId === 'dark_rum')) beverageEmoji = '🥃';
        else if (state.stationItems.some(i => i.baseId === 'rice_wine_de' || i.baseId === 'purple_rice_wine')) beverageEmoji = '🍶';

        const currentBatchId = state.nextBatchId++;
        const beverageItem = {
          uid: state.nextItemUid++,
          kind: 'beverage',
          baseId: 'beverage_mix',
          name: defaultBeverageName,
          emoji: beverageEmoji,
          category: 'sweets',
          color: state.stationItems[0].color,
          cookedColor: state.stationItems[0].cookedColor,
          needsCooking: anyRaw,
          isFreshBalancer: state.stationItems.some(i => i.isFreshBalancer),
          cutState: 'whole',
          cookLevel: anyRaw ? 0 : 1,
          cookMethod: method,
          actionHistory: [...inheritedBevActions],
          lastStationId: state.activeStationId,
          batchId: currentBatchId,
          returnedFromStaging: false,
          texture: 'drink',
          hasIce: hasIce,
          iceMelted: iceMelted,
          outerTexture: null,
          spicesApplied: combinedSpices,
          subItems: [...sourceItems],
          outerItem: null,
          flavors: combinedFlavors
        };

        state.stationItems = [beverageItem];
        state.isCookingBusy = false;
        let tempPhrase = 'thanh mát';
        if (iceMelted) {
          tempPhrase = 'ấm dịu vừa miệng (do nước sôi đã làm tan chảy toàn bộ đá viên)';
        } else if (hasIce) {
          tempPhrase = 'mát lạnh sảng khoái';
        } else if (isBrewing) {
          tempPhrase = 'nóng hổi bốc khói';
        }

        if (iceMelted) {
          announceNVDA(`Nước sôi nóng hổi đã làm tan chảy toàn bộ đá viên! Hòa quyện thành thức uống "${beverageItem.name}" ấm dịu thanh mát.`, 'polite');
        } else {
          announceNVDA(`Đã ${actionVerb} thành thức uống "${beverageItem.name}" ${tempPhrase}!`, 'polite');
        }
        renderAll();
        return;
      }

      // 5. Heat-based cooking (Fry, Boil, Deep Fry, Bake, Grill) - PLAY WAIT VỚI TỪNG ÂM THANH BẾP RIÊNG BIỆT
      const heatMethods = {
        fry_step: { method: 'fried', soundFile: 'frying_pan.ogg', verb: 'Áp chảo / Xào' },
        boil_step: { method: 'boiled', soundFile: 'pot_of_boiling_water.ogg', verb: 'Luộc / Hầm' },
        deep_fry_step: { method: 'deep_fried', soundFile: 'deep_frying_pan.ogg', verb: 'Chiên ngập dầu' },
        bake_step: { method: 'baked', soundFile: 'oven.ogg', verb: 'Nướng lò' },
        grill_step: { method: 'grilled', soundFile: 'grill rack.ogg', verb: 'Nướng vỉ than hoa' },
        steam_step: { method: 'steamed', soundFile: 'pot_of_boiling_water.ogg', verb: 'Hấp cách thủy' },
        air_fry_step: { method: 'air_fried', soundEffect: 'deep_fry', verb: 'Chiên bằng khí nóng' },
        rice_cook_step: { method: 'rice_cooked', soundEffect: 'boil', verb: 'Nấu bằng nồi cơm điện' },
        microwave_step: { method: 'microwaved', soundEffect: 'microwave', verb: 'Làm nóng bằng vi sóng' }
      };

      const heat = heatMethods[actionId];
      if (heat) {
        const currentBatchId = state.nextBatchId++;
        state.isCookingBusy = true;
        state.stationActionFlash = 50;
        state.stationActionType = actionId;
        renderWorkbench();

        if (heat.soundFile) {
          await playExternalAudio(heat.soundFile, true);
        } else {
          playSoundEffect(heat.soundEffect);
          await new Promise(resolve => setTimeout(resolve, 350));
        }

        const descriptions = [];

        state.stationItems.forEach(item => {
          const nonHeatMethods = ['none', 'stirred', 'shaken', 'brewed', 'blended', 'rolled', 'stuffed'];
          if (nonHeatMethods.includes(item.cookMethod) || item.cookLevel === 0) {
            item.stationCookSteps = 1;
            item.cookLevel = 1;
          } else if (item.cookMethod !== heat.method) {
            item.stationCookSteps = 1;
            item.cookLevel = Math.min(2, item.cookLevel + 1);
          } else {
            item.stationCookSteps = (item.stationCookSteps || item.cookLevel || 1) + 1;
            item.cookLevel = item.stationCookSteps >= 3 ? 3 : 2;
          }
          item.cookMethod = heat.method;
          item.lastStationId = state.activeStationId;
          item.batchId = currentBatchId;
          if (!item.actionHistory) item.actionHistory = [];
          if (item.actionHistory.length === 0 || item.actionHistory[item.actionHistory.length - 1] !== heat.method) {
            item.actionHistory.push(heat.method);
          }
          item.spicesApplied.forEach(sp => { sp.cookedIn = true; });
          if (item.outerSpices) item.outerSpices.forEach(sp => { sp.cookedIn = true; });
          if (item.innerSpices) item.innerSpices.forEach(sp => { sp.cookedIn = true; });

          if (item.subItems && item.subItems.length > 0) {
            item.subItems.forEach(sub => {
              sub.cookLevel = Math.max(sub.cookLevel, item.cookLevel);
              sub.cookMethod = heat.method;
              if (!sub.actionHistory) sub.actionHistory = [];
              if (sub.actionHistory.length === 0 || sub.actionHistory[sub.actionHistory.length - 1] !== heat.method) {
                sub.actionHistory.push(heat.method);
              }
              sub.spicesApplied.forEach(sp => { sp.cookedIn = true; });
              if (item.cookLevel >= 1) sub.needsCooking = false;
            });
          }

          if (item.outerItem) {
            item.outerItem.cookLevel = Math.max(item.outerItem.cookLevel || 0, item.cookLevel);
            item.outerItem.cookMethod = heat.method;
            if (!item.outerItem.actionHistory) item.outerItem.actionHistory = [];
            if (item.outerItem.actionHistory.length === 0 || item.outerItem.actionHistory[item.outerItem.actionHistory.length - 1] !== heat.method) {
              item.outerItem.actionHistory.push(heat.method);
            }
            if (item.cookLevel >= 1) item.outerItem.needsCooking = false;
          }

          if (item.innerItems && item.innerItems.length > 0) {
            item.innerItems.forEach(sub => {
              sub.cookLevel = Math.max(sub.cookLevel || 0, item.cookLevel);
              if (!sub.cookMethod || sub.cookMethod === 'none') {
                sub.cookMethod = heat.method;
              }
              sub.spicesApplied.forEach(sp => { sp.cookedIn = true; });
              if (item.cookLevel >= 1) sub.needsCooking = false;
            });
          }

          // Nhiệt độ cao làm tan chảy đá viên
          item.hasIce = false;

          // Cập nhật thuộc tính texture cảm quan động theo phương pháp nấu nhiệt
          if (heat.method === 'deep_fried' || heat.method === 'air_fried') {
            item.texture = 'crispy';
            if (item.kind === 'rolled' || item.kind === 'stuffed') item.outerTexture = 'crispy';
          } else if (heat.method === 'boiled') {
            item.texture = 'liquid';
            if (item.kind === 'rolled' || item.kind === 'stuffed') item.outerTexture = 'soft';
          } else if (heat.method === 'steamed') {
            item.texture = item.texture === 'crispy' ? 'crispy' : 'soft';
            if (item.kind === 'rolled' || item.kind === 'stuffed') item.outerTexture = 'soft';
          } else if (heat.method === 'rice_cooked' || heat.method === 'microwaved') {
            item.texture = 'soft';
            if (item.kind === 'rolled' || item.kind === 'stuffed') item.outerTexture = 'soft';
          } else if (heat.method === 'fried') {
            item.texture = item.cookLevel >= 2 ? 'crispy' : 'soft';
          } else if (heat.method === 'baked' || heat.method === 'grilled') {
            if (item.cookLevel >= 2) {
              item.texture = 'crispy';
              if (item.kind === 'rolled' || item.kind === 'stuffed') item.outerTexture = 'crispy';
            } else {
              item.texture = 'soft';
            }
          }

          if (item.cookLevel === 1) {
            item.needsCooking = false;
            item.flavors.umami += 0.9;
            item.flavors.aroma += 1.4;
            item.flavors.sweet += (heat.method === 'steamed' ? 0.6 : 0.4);
            if (heat.method === 'steamed') item.flavors.umami += 0.4;
            if (heat.method === 'deep_fried') item.flavors.crunch += 2.0;
            if (heat.method === 'air_fried') item.flavors.crunch += 1.5;
            if (heat.method === 'rice_cooked') {
              item.flavors.sweet += 0.6;
              item.flavors.umami += 0.3;
            }
            if (heat.method === 'microwaved') item.flavors.aroma += 0.3;
            const firstCookDescriptions = {
              steamed: 'hấp chín mọng nước ngọt thanh',
              air_fried: 'chiên khí nóng vàng giòn mà không ngập dầu',
              rice_cooked: 'nấu chín dẻo bằng hơi nước trong nồi cơm điện',
              microwaved: 'làm nóng nhanh bằng vi sóng',
            };
            descriptions.push(`${item.name} đã ${firstCookDescriptions[heat.method] || 'chín tới thơm lừng'}`);
          } else if (item.cookLevel === 2) {
            item.needsCooking = false;
            item.flavors.aroma += 1.5;
            if (['fried', 'deep_fried', 'air_fried', 'baked', 'grilled'].includes(heat.method)) {
              item.flavors.crunch += heat.method === 'air_fried' ? 1.2 : 1.8;
            }
            const secondCookDescriptions = {
              air_fried: 'đã vàng giòn hơn nhờ luồng khí nóng',
              rice_cooked: 'đã nấu mềm kỹ trong nồi cơm điện',
              microwaved: 'đã nóng kỹ bằng vi sóng'
            };
            descriptions.push(`${item.name} ${secondCookDescriptions[heat.method] || 'đã chín vàng giòn rụm'}`);
          } else {
            item.flavors.bitter += 3.6;
            descriptions.push(`CẢNH BÁO: ${item.name} đã bị CHÁY KHÉT ĐEN!`);
          }
        });

        state.isCookingBusy = false;
        announceNVDA(`${heat.verb}: ${descriptions.join('; ')}.`, 'polite');
        renderAll();
      }
    }

    // STAGING TRAY TRANSFERS (KHAY TẠM)
    function moveStationToStaging() {
      if (state.stationItems.length === 0) {
        announceNVDA('Không có thức ăn nào trên bếp để cất vào Khay Tạm!', 'assertive');
        return;
      }
      playSoundEffect('pick');
      const count = state.stationItems.length;
      const names = state.stationItems.map(i => i.name).join(', ');
      state.stagingItems.push(...state.stationItems);
      state.stationItems = [];
      announceNVDA(`Đã cất ${count} món (${names}) ra Khay Tạm Chờ Sơ Chế. Bạn có thể lấy nguyên liệu khác nấu tiếp!`, 'polite');
      renderAll();
    }

    function moveStagingToStation() {
      if (state.stagingItems.length === 0) {
        announceNVDA('Khay tạm đang trống, không có món nào để lấy vào bếp!', 'assertive');
        return;
      }
      playSoundEffect('pick');
      const st = STATIONS.find(s => s.id === state.activeStationId);
      const count = state.stagingItems.length;
      const names = state.stagingItems.map(i => i.name).join(', ');
      state.stagingItems.forEach(it => { it.returnedFromStaging = true; });
      state.stationItems.push(...state.stagingItems);
      state.stagingItems = [];
      announceNVDA(`Đã lấy ${count} món (${names}) từ Khay Tạm vào ${st.name} để chế biến tiếp!`, 'polite');
      renderAll();
    }

    // OPEN FINISH DISH & CUSTOM NAME MODAL
    function openFinishDishModal() {
      const finishingItems = [...state.stagingItems, ...state.stationItems];
      if (finishingItems.length === 0) {
        announceNVDA('Chưa có bất kỳ thức ăn nào trong bếp hay khay tạm để hoàn thành! Hãy chọn nguyên liệu từ Tủ Lạnh (Alt+1) trước.', 'assertive');
        return;
      }

      const analysis = analyzeCulinaryChemistry(finishingItems);

      const modal = document.getElementById('modal-finish-dish');
      const ingredientsSummaryEl = document.getElementById('finish-modal-ingredients-summary');
      const nameInput = document.getElementById('input-custom-dish-name');

      ingredientsSummaryEl.textContent = analysis.structureSummary || 'Các món đã chế biến trong bếp';
      nameInput.value = analysis.autoTitle || 'Món Ăn Thượng Hạng Của Bếp';

      renderFinishModalGarnishes();

      playSoundEffect('pick');
      modal.showModal();
      nameInput.focus();
      nameInput.select();
      announceNVDA('Đã mở bảng Hoàn thành món ăn. Bạn có thể tự do gõ tên món theo ý thích, chọn đồ trang trí rồi bấm Enter để bày dĩa!', 'polite');
    }

    function renderFinishModalGarnishes() {
      const container = document.getElementById('finish-garnish-list');
      if (!container) return;
      container.innerHTML = '';

      GARNISH_OPTIONS.forEach(g => {
        const isSel = g.id === state.selectedGarnishId;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', isSel ? 'true' : 'false');
        btn.className = `p-2 rounded-xl border text-left text-xs transition flex items-center gap-2 ${
          isSel ? 'bg-amber-600 text-white font-bold border-amber-700 shadow-sm' : 'bg-stone-50 hover:bg-amber-100 text-stone-800 border-stone-200'
        }`;
        btn.innerHTML = `<span class="text-lg" aria-hidden="true">${g.emoji}</span><span class="truncate">${g.name}</span>`;
        btn.addEventListener('click', () => {
          state.selectedGarnishId = g.id;
          playSoundEffect('pick');
          renderFinishModalGarnishes();
        });
        container.appendChild(btn);
      });
    }

    function confirmPlatingDish() {
      const nameInput = document.getElementById('input-custom-dish-name');
      const finishingItems = [...state.stagingItems, ...state.stationItems];
      if (finishingItems.length === 0) return;

      const analysis = analyzeCulinaryChemistry(finishingItems);
      const customName = nameInput.value.trim() || analysis.autoTitle || 'Món Ăn Sáng Tạo Đặc Biệt';
      const garnish = GARNISH_OPTIONS.find(g => g.id === state.selectedGarnishId) || GARNISH_OPTIONS[0];

      // Gắn định danh món ăn và tên món vào từng nguyên liệu để quản lý nguồn gốc
      const dishId = `dish_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      finishingItems.forEach(it => {
        it.dishId = dishId;
        it.dishName = customName;
      });

      const newDish = {
        id: dishId,
        name: customName,
        garnish: garnish,
        items: [...finishingItems],
        analysis: analysis
      };

      if (!state.servedDishes) state.servedDishes = [];
      state.servedDishes.push(newDish);

      // Chuyển toàn bộ nguyên liệu vào dĩa ăn
      state.plateItems.push(...finishingItems);
      state.stationItems = [];
      state.stagingItems = [];

      // Cập nhật tên món dĩa ăn
      if (state.servedDishes.length === 1) {
        state.customDishName = newDish.name;
      } else {
        state.customDishName = state.servedDishes.map(d => d.name).join(' kèm ');
      }

      const modal = document.getElementById('modal-finish-dish');
      modal.close();

      const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];

      playSoundEffect('react_good');

      // Tự động chuyển sang Tab 5: Bàn Tiệc & Thưởng Thức
      switchKitchenTab('dining', false);
      renderAll();

      const totalDishes = state.servedDishes.length;
      const countMsg = totalDishes > 1
        ? ` Bàn tiệc hiện có ${totalDishes} món hoàn chỉnh, tổng cộng ${state.plateItems.length} nguyên liệu trên dĩa.`
        : ` (Món ăn kết hợp từ ${finishingItems.length} nguyên liệu).`;
      announceNVDA(`Món "${customName}" đã được hoàn thành và bày biện đẹp mắt lên dĩa với phong cách ${garnish.name}!${countMsg} Đã tự động chuyển sang tab Bàn Tiệc & Thưởng Thức. Giờ đây bạn có thể bấm Phím F để đút cho ${char.name} thưởng thức!`, 'assertive');

      const feedBtn = document.getElementById('btn-master-feed');
      if (feedBtn) feedBtn.focus();
    }

    // PURE SENSORY TASTE LEXICON (VIETNAMESE SENSORY EVALUATION - NO HARDCODED INGREDIENTS/TEMPERATURES)
    function describePureFlavorDescriptor(tasteKey, score, seed = 0) {
      if (!score || score <= 0) return null;
      const pick = (arr) => arr[Math.abs(seed) % arr.length];

      switch (tasteKey) {
        case 'sweet':
          if (score >= 8.6) return pick(['vị ngọt lịm sắc sảo', 'vị ngọt sắc đậm lịm', 'vị ngọt gắt khé cổ']);
          if (score >= 7.1) return pick(['vị ngọt đậm đà', 'vị ngọt đượm sâu lắng', 'vị ngọt lịm rõ nét']);
          if (score >= 4.6) return pick(['vị ngọt đằm', 'vị ngọt ngào êm dịu', 'vị ngọt đượm dịu dàng']);
          if (score >= 2.1) return pick(['vị ngọt thanh', 'vị ngọt dịu dàng', 'vị ngọt thanh thoát']);
          if (score >= 0.8) return pick(['vị ngọt dịu nhẹ', 'chút vị ngọt thoang thoảng']);
          return null;

        case 'umami':
          if (score >= 7.1) return pick(['vị Umami cực kỳ đậm đà và sâu lắng', 'chiều sâu vị giác tròn đầy mạnh mẽ']);
          if (score >= 4.6) return pick(['vị đượm đà sâu lắng', 'chiều sâu tròn vị đậm nét']);
          if (score >= 2.6) return pick(['chiều sâu đượm đà thanh tao', 'vị đượm êm dịu']);
          if (score >= 1.2) return pick(['vị đượm nhẹ nhàng', 'chút vị đượm thoang thoảng']);
          return null;

        case 'fatty':
          if (score >= 7.1) return pick(['độ béo ngậy cực kỳ nồng đậm', 'lớp béo ngậy đậm đặc (khá ngấy)']);
          if (score >= 4.6) return pick(['lớp béo ngậy đậm đà', 'độ béo ngậy rõ nét']);
          if (score >= 2.6) return pick(['vị béo bùi vừa vặn', 'độ ngậy mượt mà']);
          if (score >= 1.2) return pick(['chút béo bùi thoang thoảng', 'độ béo êm dịu']);
          return null;

        case 'salty':
          if (score >= 5.6) return pick(['vị mặn chát gắt', 'vị mặn khé lưỡi']);
          if (score >= 3.9) return pick(['vị mặn đậm đà', 'vị mặn mòi rõ rệt']);
          if (score >= 2.1) return pick(['vị mặn mà vừa vặn', 'vị mặn mòi hài hòa']);
          if (score >= 0.8) return pick(['chút vị mặn nhẹ điểm xuyết', 'vị mặn dịu']);
          return null;

        case 'sour':
          if (score >= 6.6) return pick(['vị chua gắt xộc đầu lưỡi', 'vị chua lòe nhăn mặt']);
          if (score >= 4.1) return pick(['vị chua đậm nét rõ rệt', 'vị chua sắc sảo']);
          if (score >= 2.1) return pick(['vị chua thanh dịu', 'vị chua dịu vừa miệng']);
          if (score >= 0.8) return pick(['chút vị chua rôn rốt', 'chút vị chua dịu nhẹ']);
          return null;

        case 'spicy':
          if (score >= 6.1) return pick(['vị cay xé lưỡi bùng nổ', 'vị cay xộc cực mạnh']);
          if (score >= 3.6) return pick(['vị cay nồng đậm đà', 'vị cay bốc mạnh mẽ']);
          if (score >= 1.9) return pick(['vị cay tê kích thích vừa độ', 'vị cay đượm']);
          if (score >= 0.6) return pick(['chút the cay nhẹ', 'vị cay cay lăn tăn']);
          return null;

        case 'bitter':
          if (score >= 4.6) return pick(['vị đắng ngắt rõ rệt', 'vị đắng gắt khó chịu']);
          if (score >= 2.6) return pick(['vị đắng thanh sâu lắng', 'chút đắng đót tinh tế']);
          if (score >= 1.0) return pick(['chút vị đắng dịu nhẹ', 'vị đắng nhẹ thoang thoảng']);
          return null;

        case 'aroma':
          if (score >= 6.6) return pick(['hương thơm lừng cực kỳ quyến rũ', 'hương thơm nức mũi ngào ngạt']);
          if (score >= 3.6) return pick(['hương thơm nức ngào ngạt', 'hương thơm quyến rũ rõ nét']);
          if (score >= 1.5) return pick(['hương thơm thoang thoảng dịu nhẹ', 'chút hương thơm nhẹ nhàng']);
          return null;

        default:
          return null;
      }
    }

    // HÀM TIỆN ÍCH TRỢ NĂNG: Nối danh sách tự nhiên tiếng Việt (Zero Hardcoded - Liệt kê đầy đủ 100%)
    function formatNaturalList(items, conjunction = 'và') {
      if (!items || items.length === 0) return '';
      if (items.length === 1) return items[0];
      if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
      const allButLast = items.slice(0, -1).join(', ');
      return `${allButLast} ${conjunction} ${items[items.length - 1]}`;
    }

    // FORMAT CHUỖI PHƯƠNG PHÁP CHẾ BIẾN TỰ NHIÊN (TOCA KITCHEN SANDBOX: 1 ĐẾN 7+ BƯỚC)
    function formatActionHistoryChain(actions, cookLevel = 1, hasIce = false, iceMelted = false, needsCooking = false) {
      if (!actions || actions.length === 0) {
        if (cookLevel >= 3) return 'bị quá lửa cháy khét đen';
        if (cookLevel === 0) return needsCooking ? 'còn tươi sống chưa qua chế biến nhiệt' : 'còn tươi nguyên bản';
        return 'được chế biến chín tới thơm ngon';
      }

      // Lọc bỏ các thao tác trùng lặp liền kề
      const cleanActions = [];
      actions.forEach(act => {
        if (cleanActions.length === 0 || cleanActions[cleanActions.length - 1] !== act) {
          cleanActions.push(act);
        }
      });

      const interMap = {
        sliced: 'thái lát',
        diced: 'thái hạt lựu',
        minced: 'băm nhuyễn',
        stirred: 'khuấy đều',
        shaken: 'lắc sủi bọt',
        brewed: 'hãm nóng',
        blended: 'xay nhuyễn sánh mịn',
        rolled: 'cuộn chặt',
        stuffed: 'nhồi nhân',
        boiled: 'luộc chín mềm',
        fried: 'áp chảo',
        deep_fried: 'chiên ngập dầu',
        baked: 'đút lò nướng',
        grilled: 'nướng than hoa',
        air_fried: 'chiên bằng khí nóng',
        rice_cooked: 'nấu bằng nồi cơm điện',
        microwaved: 'làm nóng bằng vi sóng'
      };

      const getFinalActionText = (act) => {
        if (act === 'deep_fried') {
          if (cookLevel >= 3) return 'đem chiên ngập dầu cháy khét';
          if (cookLevel >= 2) return 'đem chiên ngập dầu vàng ươm giòn rụm';
          return 'đem chiên ngập dầu giòn tan';
        }
        if (act === 'grilled') {
          if (cookLevel >= 3) return 'đem nướng than hoa cháy đen';
          if (cookLevel >= 2) return 'đem nướng than hoa xém cạnh thơm phức';
          return 'đem nướng than hoa chín tới thơm lừng';
        }
        if (act === 'fried') {
          if (cookLevel >= 3) return 'đem áp chảo cháy khét';
          if (cookLevel >= 2) return 'đem áp chảo xém cạnh giòn thơm';
          return 'đem áp chảo chín tới vàng ươm';
        }
        if (act === 'baked') {
          if (cookLevel >= 3) return 'đem đút lò nướng cháy đen';
          if (cookLevel >= 2) return 'đem đút lò nướng vàng ươm giòn rụm';
          return 'đem đút lò nướng chín thơm phức';
        }
        if (act === 'boiled') {
          if (cookLevel >= 2) return 'đem ninh hầm nhừ mềm ngọt nước';
          return 'đem luộc chín mềm ngọt nước';
        }
        if (act === 'air_fried') {
          if (cookLevel >= 3) return 'đem chiên khí nóng cháy khét';
          return cookLevel >= 2 ? 'đem chiên khí nóng vàng giòn' : 'đem chiên khí nóng chín tới';
        }
        if (act === 'rice_cooked') {
          return cookLevel >= 3 ? 'nấu nồi cơm điện quá lâu đến khô khét' : 'nấu chín dẻo bằng nồi cơm điện';
        }
        if (act === 'microwaved') {
          return cookLevel >= 3 ? 'quay vi sóng quá lâu đến khô khét' : 'làm nóng nhanh bằng vi sóng';
        }
        if (act === 'blended') {
          return hasIce ? 'xay nhuyễn sánh mịn mát lạnh' : 'xay nhuyễn sánh mịn';
        }
        if (act === 'shaken') {
          return hasIce ? 'lắc bình shaker sủi bọt mát lạnh' : 'lắc bình shaker sủi bọt';
        }
        if (act === 'stirred') {
          return hasIce ? 'pha chế khuấy đều mát lạnh' : 'pha chế khuấy đều';
        }
        if (act === 'brewed') {
          if (iceMelted) return 'hãm nước sôi làm tan chảy hoàn toàn đá viên, tạo nên thức uống ấm dịu thanh mát';
          return 'hãm nóng bốc khói thơm nồng';
        }
        if (act === 'rolled') return 'cuộn trọn chặt tay';
        if (act === 'stuffed') return 'nhồi đầy đặn vào ruột';
        if (act === 'minced') return 'băm nhuyễn';
        if (act === 'diced') return 'thái hạt lựu';
        if (act === 'sliced') return 'thái lát';
        return interMap[act] || act;
      };

      if (cleanActions.length === 1) {
        const act = cleanActions[0];
        return `được ${getFinalActionText(act)}`;
      }

      const lastAct = cleanActions[cleanActions.length - 1];
      const prevActs = cleanActions.slice(0, -1);
      const prevPhrases = prevActs.map(a => interMap[a] || a);
      const finalDesc = getFinalActionText(lastAct);

      if (prevPhrases.length === 1) {
        return `được ${prevPhrases[0]} rồi ${finalDesc}`;
      } else {
        return `được ${prevPhrases.join(', ')} rồi ${finalDesc}`;
      }
    }

    // GOM NHÓM NGUYÊN LIỆU THEO LỊCH SỬ CHẾ BIẾN THỰC TẾ CỦA TỪNG MẺ NẤU (INGREDIENT-AWARE BATCH GROUPING)
    function groupItemsByCookingHistory(items) {
      if (!items || items.length === 0) return [];
      const nonIceItems = items.filter(i => i.id !== 'ice_cubes' && i.baseId !== 'ice_cubes');
      const targetItems = nonIceItems.length > 0 ? nonIceItems : items;
      const anySiblingHasIce = items.some(i => itemContainsIce(i));

      const groups = [];
      const groupMap = new Map();

      targetItems.forEach(it => {
        const cleanActs = [];
        if (it.actionHistory && it.actionHistory.length > 0) {
          it.actionHistory.forEach(a => {
            if (cleanActs.length === 0 || cleanActs[cleanActs.length - 1] !== a) cleanActs.push(a);
          });
        } else if (it.cookMethod && it.cookMethod !== 'none') {
          cleanActs.push(it.cookMethod);
        } else if (it.cutState && it.cutState !== 'whole') {
          cleanActs.push(it.cutState);
        }

        const isDrinkOrBlended = it.kind === 'beverage' || it.kind === 'blended' || ['stirred', 'shaken', 'brewed', 'blended'].includes(it.cookMethod);
        const hasIce = itemContainsIce(it) || (isDrinkOrBlended && anySiblingHasIce);
        const iceMelted = !!it.iceMelted;
        const needsCooking = !!it.needsCooking;
        const cookLevel = it.cookLevel || 0;

        const actionDesc = formatActionHistoryChain(cleanActs, cookLevel, hasIce, iceMelted, needsCooking);
        const groupKey = `${cleanActs.join('>')}||${actionDesc}`;

        let itemNames = [];
        if (it.subItems && it.subItems.length > 0) {
          const subFiltered = it.subItems.filter(s => s.id !== 'ice_cubes' && s.baseId !== 'ice_cubes');
          const subTarget = subFiltered.length > 0 ? subFiltered : it.subItems;
          itemNames = subTarget.map(sub => {
            const subPre = [];
            if (sub.actionHistory && sub.actionHistory.length > 0) {
              sub.actionHistory.forEach(a => {
                if (!cleanActs.includes(a) && (subPre.length === 0 || subPre[subPre.length - 1] !== a)) {
                  subPre.push(a);
                }
              });
            } else if (sub.cookMethod && sub.cookMethod !== 'none' && !cleanActs.includes(sub.cookMethod)) {
              subPre.push(sub.cookMethod);
            }
            if (subPre.length > 0) {
              const subPreDesc = formatActionHistoryChain(subPre, sub.cookLevel || 1, false, false, false);
              return `${sub.name} (${subPreDesc})`;
            }
            return sub.name;
          });
        } else {
          itemNames = [it.name];
        }

        if (!groupMap.has(groupKey)) {
          const newGroup = {
            key: groupKey,
            actions: cleanActs,
            actionDesc,
            names: []
          };
          groupMap.set(groupKey, newGroup);
          groups.push(newGroup);
        }
        const g = groupMap.get(groupKey);
        itemNames.forEach(nm => {
          if (!g.names.includes(nm)) g.names.push(nm);
        });
      });

      return groups;
    }

    // DYNAMIC SENSORY TASTING REVIEW (TOCA KITCHEN STYLE - NO HARDCODED RECIPES)
    function generateSensoryTastingReview(items, analysis, character, dishNameOverride = null) {
      if (!items || items.length === 0) {
        return {
          speech: "Ơ kìa? Dĩa thức ăn đang trống trơn, chưa có gì để ăn cả!",
          moodTag: "Dĩa đang trống! 🍽️",
          reactionType: "neutral",
          score: 0,
          sensorySentence: "Chưa có thức ăn trên dĩa."
        };
      }

      const f = analysis.normalized;
      const finalDishName = dishNameOverride || state.customDishName || analysis.autoTitle || 'Món Ăn Tự Chế';
      let score = analysis.harmonyScore;
      character.likes.forEach(k => { if (f[k] >= 2.0) score += 5; });
      score = Math.max(0, Math.min(100, score));

      // 1. Extreme & Gag Reactions (Toca Kitchen Humor)
      if (analysis.hasRawMeat) {
        let gagSpeech = '';
        if (character.id === 'chef_bear') {
          gagSpeech = `"Ối dồi ôi! Món '${finalDishName}' còn thịt sống tanh lòm chưa nấu chín kìa! Đầu bếp bận gì mà quên áp chảo hay nướng chín cho tôi thế này?!"`;
        } else if (character.id === 'cat_miu') {
          gagSpeech = `"Meo meo... Thịt còn sống tanh lòm thế này Miu không dám cắn đâu, sợ đau bụng lắm!"`;
        } else if (character.id === 'dragon_long') {
          gagSpeech = `"Gừừừ! Thịt còn sống nhăn răng! Đưa đây ta khè một búng lửa nướng chín lại ngay bây giờ!"`;
        } else {
          gagSpeech = `"Kỳ cục quá! Thịt chưa qua xử lý nhiệt chín tới, còn mùi tanh sống thế này thì vi khuẩn sinh sôi, không thể ăn được!"`;
        }
        playSoundEffect('react_bad');
        return {
          speech: gagSpeech,
          moodTag: 'Thịt còn sống tanh! 🤢',
          reactionType: 'bad',
          score: Math.min(score, 20),
          sensorySentence: `Món '${finalDishName}' còn thịt sống tanh chưa qua chế biến nhiệt.`
        };
      }

      if (analysis.hasBurnt) {
        let burntSpeech = '';
        if (character.id === 'chef_bear') {
          burntSpeech = `"Khụ khụ... Món '${finalDishName}' bị nấu quá lửa cháy đen thui rồi đầu bếp ơi! Cắn vào đắng nghét cả họng thế này thì nuốt sao nổi!"`;
        } else if (character.id === 'cat_miu') {
          burntSpeech = `"Khụ... Đắng quá đi mất! Món bị cháy khét đắng ngắt cả lưỡi rồi Miu không thích đâu!"`;
        } else if (character.id === 'dragon_long') {
          burntSpeech = `"Ha ha! Khét lẹt như cục than vậy! Dù ta là rồng lửa nhưng ăn món cháy đen này cũng thấy nghẹn họng!"`;
        } else {
          burntSpeech = `"Đắng ngắt! Quá trình nhiệt phân quá đà làm cháy thành than carbon rồi, mất sạch dinh dưỡng và vị ngon!"`;
        }
        playSoundEffect('react_bad');
        return {
          speech: burntSpeech,
          moodTag: 'Cháy khét đắng nghét! 炭',
          reactionType: 'bad',
          score: Math.min(score, 22),
          sensorySentence: `Món '${finalDishName}' bị quá lửa cháy khét đen đắng nghét.`
        };
      }

      if (f.salty > 7.0) {
        let saltySpeech = '';
        if (character.id === 'chef_bear') {
          saltySpeech = `"Úi chà chà! Tay ai nêm mà món '${finalDishName}' mặn chát cả lưỡi thế này! Cho tôi xin một xô nước lọc gấp kẻo quéo thận mất!"`;
        } else if (character.id === 'cat_miu') {
          saltySpeech = `"Eo ôi mặn quá! Lưỡi Miu tê rần rần rồi, mau cho Miu uống nước lọc với!"`;
        } else if (character.id === 'dragon_long') {
          saltySpeech = `"Mặn như nước biển sâu vậy! Đầu bếp tính ướp muối ta thành xác ướp luôn à?!"`;
        } else {
          saltySpeech = `"Nồng độ muối natri vượt ngưỡng báo động! Vị mặn lấn át toàn bộ hương vị khác, không hề có tính cân bằng!"`;
        }
        playSoundEffect('react_bad');
        return {
          speech: saltySpeech,
          moodTag: 'Mặn chát khát nước! 🧂💦',
          reactionType: 'bad',
          score: Math.min(score, 35),
          sensorySentence: `Món '${finalDishName}' bị nêm quá tay mặn chát khát nước.`
        };
      }

      if (f.spicy > character.maxSpiceTolerance) {
        let spicySpeech = '';
        if (character.id === 'cat_miu') {
          spicySpeech = `"Hàààà! Cay xé họng luôn rồi! Miu bốc khói hai tai rồi nè, cay cấp độ ${f.spicy}/10 Miu không chịu nổi đâu hu hu!"`;
        } else if (character.id === 'owl_prof') {
          spicySpeech = `"Hắt xì... Nồng độ capsaicin cay cấp độ ${f.spicy}/10 vượt xa ngưỡng chịu đựng của tôi rồi, cay cháy cả họng!"`;
        } else {
          spicySpeech = `"Hàààà! Nóng bừng cả mặt! Món '${finalDishName}' cay cấp độ ${f.spicy}/10 xé lưỡi bốc khói, vượt quá giới hạn chịu đựng của tôi rồi!"`;
        }
        playSoundEffect('react_bad');
        return {
          speech: spicySpeech,
          moodTag: 'Cay xè bốc khói! 🔥🌶️',
          reactionType: 'bad',
          score: Math.min(score, 45),
          sensorySentence: `Món '${finalDishName}' cay bùng nổ cấp độ ${f.spicy}/10 vượt quá sức chịu đựng.`
        };
      }

      // 2. Build Rich Sensory Tasting Critique (User's Intuitive Style)
      // A. Structure Description
      let structureDesc = '';
      const rolledItem = items.find(it => it.kind === 'rolled');
      const stuffedItem = items.find(it => it.kind === 'stuffed');
      const blendedItem = items.find(it => it.kind === 'blended' || it.cookMethod === 'blended');
      const beverageItem = items.find(it => it.kind === 'beverage' || it.cookMethod === 'stirred' || it.cookMethod === 'shaken' || it.cookMethod === 'brewed');

      const methodToText = (m, level, needsCooking = false) => {
        if (!level || level === 0 || m === 'none') {
          return needsCooking ? 'còn tươi sống chưa qua nhiệt' : 'tươi nguyên bản';
        }
        if (m === 'deep_fried') {
          return level >= 2 ? 'chiên ngập dầu vàng ươm giòn rụm' : 'chiên ngập dầu giòn tan';
        }
        if (m === 'grilled') {
          return level >= 2 ? 'nướng than hoa xém cạnh thơm phức' : 'nướng than hoa thơm lừng';
        }
        if (m === 'fried') {
          return level >= 2 ? 'áp chảo xém cạnh giòn thơm' : 'áp chảo chín tới vàng ươm';
        }
        if (m === 'baked') {
          return level >= 2 ? 'đút lò nướng vàng ươm giòn rụm' : 'đút lò nướng chín thơm phức';
        }
        if (m === 'boiled') {
          return level >= 2 ? 'ninh hầm nhừ mềm ngọt nước' : 'luộc chín mềm ngọt nước';
        }
        if (m === 'air_fried') {
          return level >= 2 ? 'chiên khí nóng vàng giòn' : 'chiên khí nóng chín tới';
        }
        if (m === 'rice_cooked') {
          return 'nấu chín dẻo bằng nồi cơm điện';
        }
        if (m === 'microwaved') {
          return 'làm nóng nhanh bằng vi sóng';
        }
        return level >= 2 ? 'chế biến chín kỹ thơm lừng' : 'chế biến chín tới thơm ngon';
      };

      const subject = finalDishName ? `Món '${finalDishName}'` : 'Món ăn';
      const getUniqueSpices = (list) => {
        if (!list || list.length === 0) return [];
        const set = new Set();
        list.forEach(sp => { if (sp && sp.name) set.add(sp.name); });
        return Array.from(set);
      };

      if (rolledItem) {
        const outer = rolledItem.outerItem ? rolledItem.outerItem.name : rolledItem.name;
        const outerCook = methodToText(rolledItem.cookMethod, rolledItem.cookLevel, rolledItem.outerItem?.needsCooking);
        const rollVerb = (outerCook.startsWith('còn ') || outerCook.startsWith('tươi ')) ? outerCook : `được ${outerCook}`;
        const innerList = (rolledItem.innerItems && rolledItem.innerItems.length > 0)
          ? rolledItem.innerItems
          : (rolledItem.subItems || []).filter(s => s !== rolledItem.outerItem && s.uid !== rolledItem.outerItem?.uid);
        const innerGroups = groupItemsByCookingHistory(innerList);
        const cookedInnerGroups = innerGroups.filter(g => g.actions.length > 0);
        let inners = 'nhân béo bùi';
        if (innerList.length > 0) {
          if (cookedInnerGroups.length >= 2) {
            inners = innerGroups.map(g => g.actions.length > 0 ? `${formatNaturalList(g.names, 'và')} (${g.actionDesc})` : formatNaturalList(g.names, 'và')).join(' kết hợp cùng ');
          } else {
            inners = formatNaturalList(innerList.map(s => s.name), 'và');
          }
        }

        const outerSpicesList = getUniqueSpices(rolledItem.outerSpices || (rolledItem.outerItem && rolledItem.outerItem.spicesApplied));
        const innerSpicesList = getUniqueSpices(rolledItem.innerSpices || (rolledItem.innerItems && rolledItem.innerItems.flatMap(i => i.spicesApplied || [])));

        const outerSpiceText = outerSpicesList.length > 0 ? `, được nêm ${formatNaturalList(outerSpicesList, 'và')} bên ngoài` : '';
        const innerSpiceText = innerSpicesList.length > 0 ? `. Được nêm với ${formatNaturalList(innerSpicesList, 'và')} bên trong` : '';

        if (outerSpiceText && innerSpiceText) {
          structureDesc = `${subject} với lớp vỏ ${outer} ${rollVerb}${outerSpiceText}, cuộn trọn phần nhân ${inners}${innerSpiceText}`;
        } else if (outerSpiceText) {
          structureDesc = `${subject} với lớp vỏ ${outer} ${rollVerb}${outerSpiceText}, cuộn trọn phần nhân thanh đạm ${inners} bên trong`;
        } else if (innerSpiceText) {
          structureDesc = `${subject} với lớp vỏ ${outer} ${rollVerb} bên ngoài, cuộn trọn phần nhân ${inners}${innerSpiceText}`;
        } else {
          structureDesc = `${subject} với ${outer} ${rollVerb}, cuộn trọn lớp ${inners} ở bên trong`;
        }

        const extraSideItems = items.filter(it => it !== rolledItem);
        if (extraSideItems.length > 0) {
          const sideGroups = groupItemsByCookingHistory(extraSideItems);
          const sidePhrases = sideGroups.map(g => `${formatNaturalList(g.names, 'và')} ${g.actionDesc}`);
          structureDesc += `, ăn kèm ${formatNaturalList(sidePhrases, 'và')}`;
        }
      } else if (stuffedItem) {
        const vessel = stuffedItem.outerItem ? stuffedItem.outerItem.name : stuffedItem.name;
        const vesselCook = methodToText(stuffedItem.cookMethod, stuffedItem.cookLevel, stuffedItem.outerItem?.needsCooking);
        const cookVerb = (vesselCook.startsWith('còn ') || vesselCook.startsWith('tươi ')) ? vesselCook : `được ${vesselCook}`;
        const innerList = (stuffedItem.innerItems && stuffedItem.innerItems.length > 0)
          ? stuffedItem.innerItems
          : (stuffedItem.subItems || []).filter(s => s !== stuffedItem.outerItem && s.uid !== stuffedItem.outerItem?.uid);
        const innerGroups = groupItemsByCookingHistory(innerList);
        const cookedInnerGroups = innerGroups.filter(g => g.actions.length > 0);
        let inners = 'nhân đậm đà';
        if (innerList.length > 0) {
          if (cookedInnerGroups.length >= 2) {
            inners = innerGroups.map(g => g.actions.length > 0 ? `${formatNaturalList(g.names, 'và')} (${g.actionDesc})` : formatNaturalList(g.names, 'và')).join(' kết hợp cùng ');
          } else {
            inners = formatNaturalList(innerList.map(s => s.name), 'và');
          }
        }

        const outerSpicesList = getUniqueSpices(stuffedItem.outerSpices || (stuffedItem.outerItem && stuffedItem.outerItem.spicesApplied));
        const innerSpicesList = getUniqueSpices(stuffedItem.innerSpices || (stuffedItem.innerItems && stuffedItem.innerItems.flatMap(i => i.spicesApplied || [])));

        const outerSpiceText = outerSpicesList.length > 0 ? `, được nêm ${formatNaturalList(outerSpicesList, 'và')} bên ngoài` : '';
        const innerSpiceText = innerSpicesList.length > 0 ? `. Được nêm đậm đà với ${formatNaturalList(innerSpicesList, 'và')} bên trong` : '';

        if (outerSpiceText && innerSpiceText) {
          structureDesc = `${subject} với lớp vỏ ${vessel} ${cookVerb}${outerSpiceText}, nhồi đẫm phần nhân ${inners}${innerSpiceText}`;
        } else if (outerSpiceText) {
          structureDesc = `${subject} với lớp vỏ ${vessel} ${cookVerb}${outerSpiceText}, nhồi phần nhân thanh đạm ${inners} bên trong`;
        } else if (innerSpiceText) {
          structureDesc = `${subject} với lớp vỏ ${vessel} ${cookVerb} bên ngoài, nhồi đẫm phần nhân ${inners}${innerSpiceText}`;
        } else {
          structureDesc = `${subject} với lớp vỏ ${vessel} ${cookVerb} bên ngoài, được nhồi đầy đặn nhân ${inners} bên trong`;
        }

        const extraSideItems = items.filter(it => it !== stuffedItem);
        if (extraSideItems.length > 0) {
          const sideGroups = groupItemsByCookingHistory(extraSideItems);
          const sidePhrases = sideGroups.map(g => `${formatNaturalList(g.names, 'và')} ${g.actionDesc}`);
          structureDesc += `, ăn kèm ${formatNaturalList(sidePhrases, 'và')}`;
        }
      } else {
        // TẤT CẢ CÁC MÓN ĂN & ĐỒ UỐNG TỰ DO (TOCA KITCHEN SANDBOX: GOM NHÓM NGUYÊN LIỆU THEO MẺ NẤU & LỊCH SỬ THAO TÁC 1 ĐẾN 7+ BƯỚC)
        const groups = groupItemsByCookingHistory(items);

        if (groups.length <= 1) {
          const g = groups[0] || { names: [], actions: [], actionDesc: 'tươi nguyên bản' };
          const ingNames = formatNaturalList(g.names, 'và');
          if (g.actions.length === 0) {
            structureDesc = finalDishName ? `Món '${finalDishName}' (${ingNames}) ${g.actionDesc}` : `${ingNames} ${g.actionDesc}`;
          } else {
            structureDesc = `${subject} ${g.actionDesc} từ ${ingNames || 'các nguyên liệu'}`;
          }
        } else {
          const groupPhrases = groups.map(g => {
            const gIngs = formatNaturalList(g.names, 'và');
            return `${gIngs} ${g.actionDesc}`;
          });
          if (groupPhrases.length === 2) {
            structureDesc = `${subject} kết hợp ${groupPhrases[0]}, cùng với ${groupPhrases[1]}`;
          } else {
            structureDesc = `${subject} kết hợp ${groupPhrases.slice(0, -1).join('; ')}, cùng với ${groupPhrases[groupPhrases.length - 1]}`;
          }
        }
      }

      // B. Taste Sensations (Dynamic Pure Sensory Lexicon - Ranked by Dominant Intensity)
      const candidates = [];
      const seed = items.length;
      ['sweet', 'fatty', 'umami', 'salty', 'sour', 'spicy', 'bitter', 'aroma'].forEach((k, idx) => {
        const val = f[k] || 0;
        const desc = describePureFlavorDescriptor(k, val, seed + idx);
        if (desc) {
          candidates.push({ key: k, score: val, desc });
        }
      });

      // Sort by intensity score descending so top dominant flavors are announced first
      candidates.sort((a, b) => b.score - a.score);

      const topTastes = candidates.slice(0, 3).map(c => c.desc);
      const tasteStr = topTastes.length > 0
        ? `có ${topTastes.join(', ')}`
        : 'hương vị thanh đạm mộc mạc';

      // C. Spices Applied for Loose / Unlayered Items (tránh lặp lại gia vị đã mô tả phân tầng ở cuốn/nhồi)
      let spiceStr = '';
      const looseSpiceNames = new Set();
      items.forEach(it => {
        if (it.kind !== 'rolled' && it.kind !== 'stuffed') {
          (it.spicesApplied || []).forEach(sp => looseSpiceNames.add(sp.name));
          if (it.subItems) {
            it.subItems.forEach(sub => {
              if (sub.spicesApplied) sub.spicesApplied.forEach(sp => looseSpiceNames.add(sp.name));
            });
          }
        }
      });
      const looseSpiceArr = Array.from(looseSpiceNames);
      if (looseSpiceArr.length > 0) {
        const allSpicesFormatted = formatNaturalList(looseSpiceArr, 'và');
        spiceStr = `, nêm thêm ${allSpicesFormatted}`;
      }

      // D. Combine Narrative
      const sensorySentence = `${structureDesc}, ${tasteStr}${spiceStr}`;

      // E. Character Tone & Verdict
      let speech = '';
      let moodTag = '';
      let reactionType = 'good';

      if (score >= 82) {
        reactionType = 'love';
        moodTag = 'Tuyệt phẩm 5 Sao! 🤩🌟';
        if (character.id === 'chef_bear') {
          speech = `"Nhoàm nhoàm... ÔI TUYỆT HẢO! ${sensorySentence}, tạo nên một hương vị cực kỳ tuyệt vời! Đúng là tay nghề của một bếp trưởng thực thụ, ăn vào đã cái bụng vô cùng!"`;
        } else if (character.id === 'cat_miu') {
          speech = `"Măm măm... ÔI THÍCH QUÁ! ${sensorySentence}, vị ngon hòa quyện tan ngay trong miệng làm Miu mê tít luôn!"`;
        } else if (character.id === 'dragon_long') {
          speech = `"Khà khà... ĐÃ MIỆNG THẬT! ${sensorySentence}, hương vị đậm đà bùng nổ đúng gu của ta rồi!"`;
        } else {
          speech = `"Chà... XUẤT SẮC! ${sensorySentence}, sự phối hợp ẩm thực này đạt độ hài hòa cân bằng đỉnh cao!"`;
        }
      } else if (score >= 50) {
        reactionType = 'good';
        moodTag = 'Ngon miệng vừa vị! 😋👍';
        speech = `"Măm măm! ${sensorySentence}, ăn rất ngon miệng và vừa vị (Hài hòa: ${score}/100 điểm)!"`;
      } else {
        reactionType = 'good';
        moodTag = 'Vị lạ độc đáo! 🤔';
        speech = `"Hừm... ${sensorySentence}. Món ăn có hương vị khá độc lạ và mới mẻ, lần sau đầu bếp hãy thử nêm nếm thêm xem sao nhé!"`;
      }

      return { speech, moodTag, reactionType, score, sensorySentence };
    }

    // MULTI-DISH SENSORY TASTING CRITIQUE (COMBO & BANQUET SYSTEM FOR 2, 3, 4, 5, 6+ DISHES)
    function generateMultiDishTastingReview(dishes, character) {
      if (!dishes || dishes.length === 0) {
        return {
          speech: "Ơ kìa? Dĩa thức ăn đang trống trơn, chưa có gì để ăn cả!",
          moodTag: "Dĩa đang trống! 🍽️",
          reactionType: "neutral",
          score: 0,
          sensorySentence: "Chưa có thức ăn trên dĩa.",
          dishReviews: []
        };
      }

      if (dishes.length === 1) {
        const d = dishes[0];
        const singleRev = generateSensoryTastingReview(d.items, d.analysis, character, d.name);
        return {
          ...singleRev,
          dishReviews: [{ dish: d, review: singleRev }]
        };
      }

      // 1. Phân tích chi tiết từng món với đầy đủ 4 tầng cảm quan độc lập
      const dishReviews = dishes.map(d => {
        const rev = generateSensoryTastingReview(d.items, d.analysis, character, d.name);
        return {
          dish: d,
          review: rev
        };
      });

      // 2. Kiểm tra phản ứng hài hước & cảnh báo nghiêm trọng (Toca Kitchen Gag)
      const rawDishes = dishReviews.filter(dr => dr.dish.analysis.hasRawMeat);
      const burntDishes = dishReviews.filter(dr => dr.dish.analysis.hasBurnt);
      const superSaltyDishes = dishReviews.filter(dr => dr.dish.analysis.normalized.salty > 7.0);
      const superSpicyDishes = dishReviews.filter(dr => dr.dish.analysis.normalized.spicy > character.maxSpiceTolerance);

      // Có món còn thịt sống tanh
      if (rawDishes.length > 0) {
        const badNames = rawDishes.map(dr => `'${dr.dish.name}'`).join(', ');
        const goodNames = dishReviews.filter(dr => !dr.dish.analysis.hasRawMeat).map(dr => `'${dr.dish.name}'`).join(', ');
        let gagSpeech = '';
        if (character.id === 'chef_bear') {
          gagSpeech = `"Ối dồi ôi! Món ${badNames} còn thịt sống tanh lòm chưa nấu chín kìa! ${goodNames ? `Mấy món như ${goodNames} trông thì rất ngon lành nhưng ` : ''}tôi không dám cắn miếng thịt này đâu, đau bụng chết mất!"`;
        } else if (character.id === 'cat_miu') {
          gagSpeech = `"Meo meo... Món ${badNames} thịt còn sống tanh lòm Miu sợ lắm! ${goodNames ? `Cho Miu ăn ${goodNames} thôi được không?` : ''}"`;
        } else if (character.id === 'dragon_long') {
          gagSpeech = `"Gừừừ! Món ${badNames} thịt sống nhăn răng! Đưa đây ta khè một búng lửa nướng chín lại ngay!"`;
        } else {
          gagSpeech = `"Báo động an toàn thực phẩm! Món ${badNames} chưa qua xử lý nhiệt chín tới, vi khuẩn sinh sôi không thể ăn được!"`;
        }
        playSoundEffect('react_bad');
        return {
          speech: gagSpeech,
          moodTag: 'Có món sống tanh! 🤢',
          reactionType: 'bad',
          score: 20,
          sensorySentence: `Bàn tiệc có món (${badNames}) còn thịt sống tanh chưa qua chế biến nhiệt.`,
          dishReviews
        };
      }

      // Có món bị nấu cháy khét
      if (burntDishes.length > 0) {
        const badNames = burntDishes.map(dr => `'${dr.dish.name}'`).join(', ');
        let burntSpeech = '';
        if (character.id === 'chef_bear') {
          burntSpeech = `"Khụ khụ... Món ${badNames} bị quá lửa cháy đen thui rồi đầu bếp ơi! Cắn vào đắng nghét cả họng thì sao thưởng thức được các món khác nữa!"`;
        } else if (character.id === 'cat_miu') {
          burntSpeech = `"Khụ... Đắng ngắt! Món ${badNames} cháy khét lẹt rồi Miu không thích đâu!"`;
        } else if (character.id === 'dragon_long') {
          burntSpeech = `"Ha ha! Khét như cục than vậy! Món ${badNames} cháy đen rồi, dù là rồng ta ăn cũng nghẹn họng!"`;
        } else {
          burntSpeech = `"Món ${badNames} đã bị than hóa nghiêm trọng, nồng độ hợp chất đắng quá cao làm hỏng cả bàn ăn!"`;
        }
        playSoundEffect('react_bad');
        return {
          speech: burntSpeech,
          moodTag: 'Có món cháy khét! 炭',
          reactionType: 'bad',
          score: 22,
          sensorySentence: `Bàn tiệc có món (${badNames}) bị nấu quá lửa cháy đen đắng nghét.`,
          dishReviews
        };
      }

      // Có món bị nêm mặn chát
      if (superSaltyDishes.length > 0) {
        const badNames = superSaltyDishes.map(dr => `'${dr.dish.name}'`).join(', ');
        const speech = `"Úi chà chà! Món ${badNames} nêm mặn chát cả lưỡi rồi! Mau cho tôi xin xô nước lọc gấp kẻo quéo thận mất!"`;
        playSoundEffect('react_bad');
        return {
          speech,
          moodTag: 'Có món mặn chát! 🧂💦',
          reactionType: 'bad',
          score: 35,
          sensorySentence: `Bàn tiệc có món (${badNames}) bị nêm quá tay mặn chát khát nước.`,
          dishReviews
        };
      }

      // Có món cay xè vượt quá sức chịu đựng
      if (superSpicyDishes.length > 0) {
        const badNames = superSpicyDishes.map(dr => `'${dr.dish.name}'`).join(', ');
        const speech = `"Hàààà! Món ${badNames} cay cấp độ xé lưỡi bốc khói hai tai rồi, cay cháy cả họng!"`;
        playSoundEffect('react_bad');
        return {
          speech,
          moodTag: 'Có món cay xè! 🔥🌶️',
          reactionType: 'bad',
          score: 42,
          sensorySentence: `Bàn tiệc có món (${badNames}) cay xé lưỡi vượt quá sức chịu đựng.`,
          dishReviews
        };
      }

      // 3. Tính điểm trung bình và cộng điểm thưởng phối hợp Thực Đơn Combo
      let totalScore = 0;
      dishReviews.forEach(dr => totalScore += dr.review.score);
      let avgScore = Math.round(totalScore / dishes.length);

      // Thưởng điểm hòa vị khi thực đơn có cả món ăn mặn/chính và đồ uống/tráng miệng ngọt mát
      const hasSavory = dishes.some(d => d.items.some(i => i.category === 'meat' || i.category === 'seafood' || i.category === 'vegetables' || i.category === 'noodles_flour'));
      const hasDrinkOrSweet = dishes.some(d => d.items.some(i => i.texture === 'drink' || i.category === 'sweets' || i.category === 'fruits' || i.id === 'oreo' || i.id === 'milk'));
      if (hasSavory && hasDrinkOrSweet) {
        avgScore = Math.min(100, avgScore + 5);
      }
      if (dishes.length >= 3) {
        avgScore = Math.min(100, avgScore + 3);
      }

      // 4. Trích xuất mô tả cảm quan từng món để tổng hòa thành lời thoại tự nhiên
      const dishDetails = dishReviews.map(dr => {
        let sent = dr.review.sensorySentence;
        sent = sent.replace(/^Món\s+'[^']+'\s+(?:\([^)]+\)\s+)?/, '');
        return {
          name: dr.dish.name,
          desc: sent,
          score: dr.review.score
        };
      });

      let sensorySentence = '';
      let speech = '';
      let moodTag = '';
      let reactionType = avgScore >= 80 ? 'love' : 'good';

      if (dishes.length === 2) {
        const d1 = dishDetails[0];
        const d2 = dishDetails[1];
        sensorySentence = `Món '${d1.name}' (${d1.desc}), dùng kèm món '${d2.name}' (${d2.desc})`;
        moodTag = avgScore >= 80 ? 'Combo 2 Món Đỉnh Cao! 🤩🍽️' : 'Combo 2 Món Vừa Vị! 😋👍';

        if (avgScore >= 80) {
          if (character.id === 'chef_bear') {
            speech = `"Nhoàm nhoàm... ÔI BỮA ĂN THỊNH SOẠN TUYỆT HẢO! Về món '${d1.name}': ${d1.desc}. Kèm thêm món '${d2.name}': ${d2.desc}! Hai món kết hợp với nhau tạo nên một bữa ăn vừa đậm đà vừa đã miệng, đúng là tay nghề bếp trưởng cự phách, ăn vào đã cái bụng vô cùng!"`;
          } else if (character.id === 'cat_miu') {
            speech = `"Măm măm... ÔI THÍCH QUÁ ĐI! Món '${d1.name}' thì ${d1.desc}, lại có thêm '${d2.name}' ${d2.desc}! Vị ngon hòa quyện tan ngay trong miệng làm Miu mê tít luôn!"`;
          } else if (character.id === 'dragon_long') {
            speech = `"Khà khà... ĐÃ MIỆNG VÀ ĐÃ KHÁT THẬT! Món '${d1.name}' ${d1.desc}, rồi lại được nhấp '${d2.name}' ${d2.desc}! Hương vị bùng nổ đúng gu của ta rồi!"`;
          } else {
            speech = `"Chà... XUẤT SẮC! Sự phối hợp giữa món '${d1.name}' (${d1.desc}) và món '${d2.name}' (${d2.desc}) đạt độ cân bằng ẩm thực đỉnh cao!"`;
          }
        } else if (avgScore >= 50) {
          speech = `"Măm măm! Bữa ăn kết hợp giữa món '${d1.name}' (${d1.desc}) và món '${d2.name}' (${d2.desc}) ăn rất ngon miệng và vừa vị (Hài hòa: ${avgScore}/100 điểm)!"`;
        } else {
          speech = `"Hừm... Sự kết hợp giữa '${d1.name}' và '${d2.name}' có hương vị khá độc lạ và mới mẻ. Lần sau đầu bếp thử nêm nếm thêm xem sao nhé!"`;
        }
      } else {
        // Thực đơn đại tiệc từ 3 đến 6+ món
        const itemsSummary = dishDetails.map((d, i) => `Món ${i + 1} '${d.name}': ${d.desc}`).join('; ');
        sensorySentence = `Thực đơn ${dishes.length} món gồm: ${itemsSummary}`;

        if (dishes.length <= 4) {
          moodTag = avgScore >= 80 ? `Đại Tiệc ${dishes.length} Món Thịnh Soạn! 👑🎉` : `Tiệc ${dishes.length} Món Vừa Vị! 😋👍`;
        } else {
          moodTag = avgScore >= 80 ? `Mâm Cỗ Hoàng Gia ${dishes.length} Món! 🏆✨` : `Mâm Cỗ ${dishes.length} Món Đa Sắc! 🍲🌟`;
        }

        const dishListNames = formatNaturalList(dishDetails.map(d => `'${d.name}'`), 'và');

        if (avgScore >= 80) {
          if (character.id === 'chef_bear') {
            speech = `"Nhoàm nhoàm... TRỜI ƠI MỘT MÂM CỖ ĐẠI TIỆC HOÀNG GIA! Tận ${dishes.length} món được chuẩn bị công phu: ${formatNaturalList(dishDetails.map(d => `'${d.name}' (${d.desc})`), 'và')}! Ăn một bữa thịnh soạn no nê ngập tràn hương vị thế này thì sướng nhất trần đời, điểm tuyệt đối cho đầu bếp!"`;
          } else if (character.id === 'cat_miu') {
            speech = `"Măm măm... ÔI MÂM CỖ NHIỀU MÓN QUÁ! Có tận ${dishes.length} món thơm lừng bày đầy trên bàn: ${dishListNames}! Món nào cũng ngon tuyệt làm Miu no căng bụng luôn nè!"`;
          } else if (character.id === 'dragon_long') {
            speech = `"Khà khà... ĐẠI TIỆC VUA CHÚA! ${dishes.length} món phong phú từ ${dishListNames}, ăn uống ngập tràn thế này mới xứng tầm rồng lửa ta chứ!"`;
          } else {
            speech = `"Kinh ngạc thực sự! Một thực đơn ${dishes.length} món được xây dựng công phu và đa dạng: ${dishDetails.map(d => `'${d.name}' (${d.desc})`).join(', ')}! Sự phối hợp ẩm thực này đạt cấp độ đỉnh cao!"`;
          }
        } else if (avgScore >= 50) {
          speech = `"Măm măm! Bàn tiệc ${dishes.length} món (${dishListNames}) ăn rất phong phú và ngon miệng (Hài hòa tổng thể: ${avgScore}/100 điểm)!"`;
        } else {
          speech = `"Hừm... Mâm cỗ ${dishes.length} món này có nhiều hương vị kết hợp khá độc lạ (${dishListNames}). Lần sau đầu bếp chú ý cân bằng hơn nhé!"`;
        }
      }

      return {
        speech,
        moodTag,
        reactionType,
        score: avgScore,
        sensorySentence,
        dishReviews
      };
    }

    // 6. BỘ XÁC ĐỊNH ÂM THANH ĂN UỐNG & PLAYLIST THƯỞNG THỨC ĐA MÓN (SENSORY EATING PLAYLIST)
    function getEatingSoundForItem(item) {
      if (item.texture === 'drink') {
        return item.hasIce ? 'drink_with_ice.ogg' : 'drink.ogg';
      }
      if (item.texture === 'liquid') {
        return 'eat_liquid_food.ogg';
      }
      if (item.texture === 'crispy') {
        return 'eat_crispy_food.ogg';
      }
      return 'eat_soft_food.ogg';
    }

    function buildEatingAudioPlaylist(items) {
      if (!items || items.length === 0) return ['eat_soft_food.ogg'];

      // Thu thập toàn bộ âm thanh theo đúng thứ tự trên dĩa (không lọc trùng, không đảo thứ tự)
      return items.map(item => getEatingSoundForItem(item));
    }

    // FEED CHARACTER (ASYNC WITH SEQUENTIAL PLAY WAIT AUDIO & ARIA BUSY)
    async function feedCharacter() {
      if (state.isFeedingBusy) return;

      const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
      if (state.plateItems.length === 0) {
        announceNVDA(`Dĩa thức ăn đang trống! Hãy chế biến đồ ăn trong bếp (Alt+2), bấm nút Hoàn Thành Món (Phím P) để bày ra dĩa rồi mới đút cho ${char.name} ăn nhé.`, 'assertive');
        return;
      }

      state.isFeedingBusy = true;

      // Cập nhật nút đút ăn trên giao diện sang trạng thái bận
      const feedBtn = document.getElementById('btn-master-feed');
      const feedLbl = document.getElementById('master-feed-label');
      if (feedBtn) {
        feedBtn.disabled = true;
        feedBtn.setAttribute('aria-busy', 'true');
        feedBtn.classList.add('opacity-70', 'cursor-not-allowed');
      }

      // Kích hoạt animation đang nhai/uống
      state.charAnimState = 'eating';
      state.charAnimTimer = 240;

      // Phân tích kết cấu và lập playlist âm thanh ăn uống theo đúng thứ tự dĩa
      const playlist = buildEatingAudioPlaylist(state.plateItems);

      // Chạy tuần tự từng âm thanh ăn uống theo kiểu Play Wait
      for (let i = 0; i < playlist.length; i++) {
        const soundFile = playlist[i];
        if (feedLbl) {
          feedLbl.textContent = 'ĐANG THƯỞNG THỨC MÓN ĂN... 😋';
        }
        await playExternalAudio(soundFile, true);
        if (i < playlist.length - 1) {
          await new Promise(r => setTimeout(r, 150));
        }
      }

      // Sau khi âm thanh ăn uống kết thúc: Phân tích đánh giá và phản hồi
      const dishes = (state.servedDishes && state.servedDishes.length > 0)
        ? state.servedDishes
        : [{
            id: 'legacy',
            name: state.customDishName || 'Món Ăn Tự Chế',
            items: state.plateItems,
            analysis: analyzeCulinaryChemistry(state.plateItems)
          }];

      const review = (dishes.length > 1)
        ? generateMultiDishTastingReview(dishes, char)
        : generateSensoryTastingReview(dishes[0].items, dishes[0].analysis, char, dishes[0].name);

      const finalDishTitle = (dishes.length > 1)
        ? `thực đơn ${dishes.length} món (${dishes.map(d => d.name).join(', ')})`
        : `món "${dishes[0].name}"`;

      // Phát âm thanh sóng cảm xúc tương ứng
      if (review.reactionType === 'love') {
        playSoundEffect('react_love');
      } else if (review.score >= 50) {
        playSoundEffect('react_good');
      } else {
        playSoundEffect('react_bad');
      }

      state.charAnimState = review.reactionType;
      state.charAnimTimer = 120;

      const moodEl = document.getElementById('dining-mood-tag');
      const speechEl = document.getElementById('dining-speech-bubble');
      const scoreEl = document.getElementById('dining-last-score');

      if (moodEl) moodEl.textContent = review.moodTag;
      if (speechEl) speechEl.textContent = review.speech;
      if (scoreEl) scoreEl.textContent = `${review.score} / 100 điểm (${review.moodTag})`;

      // Lưu lại dữ liệu món ăn / bữa ăn vừa thưởng thức để người chơi có thể Đưa Lên Cộng Đồng
      const tastedMealPayload = {
        dishes: dishes.map(d => ({
          name: d.name || 'Món Ăn Tự Chế',
          garnish: d.garnish || { name: 'Mộc', emoji: '🍽️' },
          items: (d.items || []).map(it => ({ name: it.name, emoji: it.emoji })),
          analysis: {
            structureSummary: (d.analysis && d.analysis.structureSummary) ? d.analysis.structureSummary : '',
            harmonyScore: (d.analysis && typeof d.analysis.harmonyScore === 'number') ? d.analysis.harmonyScore : review.score
          }
        })),
        fallbackTitle: state.customDishName || 'Món Ăn Tự Chế',
        customerName: char.name,
        customerEmoji: char.emoji,
        customerSpeech: review.speech,
        customerMoodTag: review.moodTag,
        satisfactionScore: review.score
      };
      state.lastTastedMeal = tastedMealPayload;

      // Hiển thị nút nổi bật "Đưa Lên Cộng Đồng" ngay dưới phần đánh giá
      const shareContainer = document.getElementById('share-community-container');
      if (shareContainer) {
        shareContainer.classList.remove('hidden');
      }

      // Dọn sạch dĩa thức ăn
      state.plateItems = [];
      state.servedDishes = [];
      state.customDishName = '';
      state.isFeedingBusy = false;

      // Khôi phục trạng thái nút đút ăn
      if (feedBtn) {
        feedBtn.disabled = false;
        feedBtn.removeAttribute('aria-busy');
        feedBtn.classList.remove('opacity-70', 'cursor-not-allowed');
      }
      if (feedLbl) {
        feedLbl.textContent = 'ĐÚT CHO THỰC KHÁCH ĂN! (F)';
      }

      // NVDA công bố toàn bộ lời nhận xét của thực khách
      announceNVDA(`${char.name} vừa thưởng thức ${finalDishTitle}. Nhận xét: ${review.speech}`, 'assertive');
      renderAll();
    }

    // READ DISH & FLAVOR SUMMARY (KEY I)
    function readDishSummary() {
      // 1. Khi đang ở dĩa ăn và có từ 2 món hoàn chỉnh trở lên
      if (state.servedDishes && state.servedDishes.length > 1 && state.plateItems.length > 0) {
        const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
        const multiReview = generateMultiDishTastingReview(state.servedDishes, char);
        let msg = `Báo cáo thực đơn trên Đĩa Ăn: Gồm ${state.servedDishes.length} món hoàn chỉnh. `;
        state.servedDishes.forEach((d, idx) => {
          const rev = generateSensoryTastingReview(d.items, d.analysis, char, d.name);
          const f = d.analysis.normalized;
          msg += `Món ${idx + 1}: "${d.name}" - ${rev.sensorySentence}. Điểm hài hòa: ${d.analysis.harmonyScore}/100 (Umami ${f.umami}, Mặn ${f.salty}, Ngọt ${f.sweet}, Béo ${f.fatty}, Thơm ${f.aroma}). `;
        });
        msg += `Tổng thể thực đơn: Điểm trung bình ${multiReview.score}/100 (${multiReview.moodTag}).`;
        announceNVDA(msg, 'assertive');
        return;
      }

      // 2. Món đơn trên dĩa hoặc thức ăn đang sơ chế trong Bếp / Khay Tạm
      const allItems = state.plateItems.length > 0 ? state.plateItems : (state.stationItems.length > 0 ? state.stationItems : state.stagingItems);
      const place = state.plateItems.length > 0 ? 'trên Đĩa Ăn' : (state.stationItems.length > 0 ? 'trong Bếp' : 'trên Khay Tạm');

      if (allItems.length === 0) {
        announceNVDA('Hiện tại không có thức ăn nào trên đĩa, bếp hay khay tạm. Hãy lấy nguyên liệu từ Tủ Lạnh (Alt+1)!', 'assertive');
        return;
      }

      const analysis = analyzeCulinaryChemistry(allItems);
      const f = analysis.normalized;
      const name = (state.servedDishes && state.servedDishes.length === 1 && state.plateItems.length > 0)
        ? state.servedDishes[0].name
        : (state.customDishName || analysis.autoTitle);
      const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
      const review = generateSensoryTastingReview(allItems, analysis, char, name);

      const warnStr = analysis.warnings.length > 0 ? ` Cảnh báo: ${analysis.warnings.join('; ')}.` : '';
      const synStr = analysis.synergies.length > 0 ? ` Phản ứng hòa vị: ${analysis.synergies.join('; ')}.` : '';

      const msg = `Báo cáo món ăn ${place}: Tên món "${name}". Cảm quan món ăn: ${review.sensorySentence}. Điểm hài hòa: ${analysis.harmonyScore}/100. Chi tiết 8 vị: Đậm đà Umami ${f.umami}, Mặn ${f.salty}, Ngọt ${f.sweet}, Béo ${f.fatty}, Thơm ${f.aroma}, Cay ${f.spicy}, Chua ${f.sour}, Đắng ${f.bitter}.${warnStr}${synStr}`;
      announceNVDA(msg, 'assertive');
    }

    // RESET KITCHEN & RETURN TO START SCREEN (YUMCRAFT KITCHEN STYLE)
    function resetKitchenAndGoBack() {
      state.stationItems = [];
      state.stagingItems = [];
      state.plateItems = [];
      state.servedDishes = [];
      state.customDishName = '';
      state.selectedWrapperUid = null;
      state.selectedVesselUid = null;
      state.currentScreen = 'character_select';
      state.lastTastedMeal = null;
      const shareContainer = document.getElementById('share-community-container');
      if (shareContainer) shareContainer.classList.add('hidden');

      const screenSelect = document.getElementById('screen-character-select');
      const screenKitchen = document.getElementById('screen-kitchen');
      screenKitchen.classList.add('hidden');
      screenKitchen.classList.remove('flex');
      screenSelect.classList.remove('hidden');
      screenSelect.classList.add('flex');

      document.getElementById('modal-confirm-back').close();
      playSoundEffect('door');
      announceNVDA('Đã dọn dẹp sạch sẽ nhà bếp và quay lại màn hình chọn thực khách.', 'polite');
      renderStartScreenCharacters();
      document.getElementById('btn-start-kitchen').focus();
    }

    /*************************************************************************
     * 7. RENDER GIAO DIỆN DOM CHI TIẾT
     *************************************************************************/

    // RENDER START SCREEN CHARACTERS
    function renderStartScreenCharacters() {
      const container = document.getElementById('char-cards-list');
      if (!container) return;
      container.innerHTML = '';

      CHARACTERS.forEach(c => {
        const isSel = c.id === state.activeCharacterId;
        const card = document.createElement('div');
        card.setAttribute('role', 'radio');
        card.setAttribute('aria-checked', isSel ? 'true' : 'false');
        card.setAttribute('tabindex', isSel ? '0' : '-1');
        card.className = `p-4 sm:p-5 rounded-3xl border-3 transition cursor-pointer flex flex-col justify-between gap-3 text-left ${
          isSel
            ? 'bg-amber-50 border-orange-500 shadow-xl ring-4 ring-orange-200'
            : 'bg-white border-stone-200 hover:border-amber-400 hover:shadow-md'
        }`;
        card.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="text-4xl" aria-hidden="true">${c.emoji}</span>
            <span class="text-xs font-extrabold px-2.5 py-1 rounded-full ${isSel ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-600'}">
              ${isSel ? 'Đang Chọn' : 'Bấm Chọn'}
            </span>
          </div>
          <div>
            <h3 class="text-base sm:text-lg font-extrabold text-stone-900 font-game">${c.name}</h3>
            <p class="text-xs text-orange-700 font-bold mb-1">${c.title}</p>
            <p class="text-xs text-stone-600 leading-relaxed">${c.desc}</p>
          </div>
          <div class="bg-white/80 p-2.5 rounded-2xl border border-stone-200/80 text-[11px] text-stone-700">
            <strong class="text-amber-900 font-game block mb-0.5">Món khoái khẩu:</strong>
            ${c.cravings[0]}
          </div>
        `;
        card.addEventListener('click', () => {
          state.activeCharacterId = c.id;
          playSoundEffect('pick');
          announceNVDA(`Đã chọn thực khách: ${c.name}. ${c.desc}`, 'polite');
          renderStartScreenCharacters();
          updateStartBtnLabel();
        });
        container.appendChild(card);
      });
      updateStartBtnLabel();
    }

    function updateStartBtnLabel() {
      const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
      const lbl = document.getElementById('start-btn-label');
      if (lbl) lbl.textContent = `VÀO BẾP NẤU CHO ${char.name.toUpperCase()}!`;
    }

    // RENDER FRIDGE COMPARTMENTS & INGREDIENTS
    function renderFridge() {
      const badgeEl = document.getElementById('fridge-total-count-badge');
      if (badgeEl) badgeEl.textContent = `${INGREDIENTS.length} món`;

      const tabsEl = document.getElementById('fridge-category-tabs');
      if (tabsEl) {
        tabsEl.innerHTML = '';
        FRIDGE_CATEGORIES.forEach(cat => {
          const isAct = cat.id === state.activeCategoryId;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.setAttribute('role', 'tab');
          btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
          btn.className = `px-2.5 py-1 rounded-xl text-xs font-bold transition ${
            isAct ? 'bg-orange-600 text-white shadow-sm' : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
          }`;
          const catDisplayName = cat.id === 'all' ? `Tất cả (${INGREDIENTS.length})` : cat.name;
          btn.textContent = catDisplayName;
          btn.addEventListener('click', () => {
            state.activeCategoryId = cat.id;
            playSoundEffect('pick');
            const catAnnounceName = cat.id === 'all' ? `Tất cả ${INGREDIENTS.length} món` : cat.name;
            announceNVDA(`Đã mở ngăn tủ: ${catAnnounceName}`, 'polite');
            renderFridge();
          });
          tabsEl.appendChild(btn);
        });
      }

      const grid = document.getElementById('fridge-items-grid');
      if (!grid) return;
      grid.innerHTML = '';

      const q = state.searchQuery.trim().toLowerCase();
      const filtered = INGREDIENTS.filter(ing => {
        const matchCat = state.activeCategoryId === 'all' || ing.category === state.activeCategoryId;
        const matchQ = !q || ing.name.toLowerCase().includes(q) || ing.flavorDesc.toLowerCase().includes(q);
        return matchCat && matchQ;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-xs text-slate-500 italic p-4 text-center">Không tìm thấy nguyên liệu nào trong ngăn này.</div>`;
        return;
      }

      filtered.forEach(ing => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', `Lấy ${ing.name}. ${ing.flavorDesc}`);
        btn.className = 'game-btn btn-3d-slate p-2 rounded-2xl border border-slate-300 hover:border-orange-400 text-left transition flex flex-col justify-between gap-1 group';
        btn.innerHTML = `
          <div class="flex items-center justify-between w-full">
            <span class="text-2xl group-hover:scale-110 transition-transform" aria-hidden="true">${ing.emoji}</span>
            <span class="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
              ing.needsCooking ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
            }">${ing.needsCooking ? 'Cần nấu' : 'Tươi/Nấu'}</span>
          </div>
          <div class="font-bold text-xs text-slate-900 leading-tight">${ing.name}</div>
          <div class="text-[10px] text-slate-500 line-clamp-1">${ing.flavorDesc}</div>
        `;
        btn.addEventListener('click', () => addIngredientFromFridge(ing.id));
        grid.appendChild(btn);
      });
    }

    // RENDER WORKBENCH STATIONS & CURRENT ITEMS
    function renderWorkbench() {
      const stationGrid = document.getElementById('station-selector-grid');
      const activeSt = STATIONS.find(s => s.id === state.activeStationId) || STATIONS[0];

      if (stationGrid) {
        stationGrid.innerHTML = '';
        STATIONS.forEach(st => {
          const isAct = st.id === state.activeStationId;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.setAttribute('aria-pressed', isAct ? 'true' : 'false');
          btn.setAttribute('aria-label', `${st.name}. ${st.desc}`);
          btn.className = `p-2 rounded-2xl border text-left transition flex items-center gap-1.5 ${
            isAct ? 'station-btn-active font-bold' : 'bg-stone-50 hover:bg-amber-50 border-stone-200 text-stone-800'
          }`;
          btn.innerHTML = `
            <span class="text-xl shrink-0" aria-hidden="true">${st.emoji}</span>
            <span class="text-xs font-extrabold leading-tight truncate font-game">${st.shortName}</span>
          `;
          btn.addEventListener('click', () => {
            state.activeStationId = st.id;
            playSoundEffect('pick');
            announceNVDA(`Đã chuyển sang: ${st.name}. ${st.desc}`, 'polite');
            renderAll();
          });
          stationGrid.appendChild(btn);
        });
      }

      document.getElementById('active-station-badge').textContent = `${activeSt.emoji} ${activeSt.name}`;
      document.getElementById('canvas-overlay-station-name').textContent = `${activeSt.emoji} ${activeSt.name}`;
      document.getElementById('canvas-overlay-temp').textContent = `Nhiệt độ: ${activeSt.temp}`;
      document.getElementById('station-desc-sub').textContent = activeSt.desc;
      document.getElementById('station-items-count-label').textContent = `${state.stationItems.length} nguyên liệu trên bếp`;
      const headingActions = document.getElementById('heading-station-actions');
      if (headingActions) {
        headingActions.innerHTML = '<span aria-hidden="true">' + activeSt.emoji + '</span><span>2. Thao Tác Với ' + activeSt.name + '</span>';
      }
      const headingItems = document.getElementById('heading-station-items');
      if (headingItems) {
        headingItems.innerHTML = '<span aria-hidden="true">🥘</span><span>3. Nguyên Liệu Đang Có Trong ' + activeSt.name + ' (' + state.stationItems.length + ')</span>';
      }

      // Dynamic sub-panel for picking Wrapper (in rolling mat) or Vessel (in stuffing station)
      const wrapperVesselPanel = document.getElementById('station-wrapper-vessel-selector');
      const wvTitle = document.getElementById('wrap-vessel-selector-title');
      const wvSelectedLabel = document.getElementById('wrap-vessel-selected-label');
      const wvHint = document.getElementById('wrap-vessel-selector-hint');
      const wvOptionsList = document.getElementById('wrap-vessel-options-container');

      if ((activeSt.isRollingStation || activeSt.isStuffingStation) && state.stationItems.length > 0) {
        wrapperVesselPanel.classList.remove('hidden');
        wvOptionsList.innerHTML = '';

        if (activeSt.isRollingStation) {
          wvTitle.textContent = '🌯 Chọn 1 Nguyên Liệu Làm Lớp Vỏ Cuốn Ngoài:';
          wvHint.textContent = 'Bấm chọn nguyên liệu làm vỏ ngoài (ví dụ: Bánh tráng, Lá rong biển, hoặc Lát thịt bò...). Các nguyên liệu còn lại sẽ được cuộn vào trong ruột!';

          // Auto-select wrapper if not set
          if (!state.selectedWrapperUid && state.stationItems.length > 0) {
            state.selectedWrapperUid = state.stationItems[0].uid;
          }

          state.stationItems.forEach(it => {
            const isSel = it.uid === state.selectedWrapperUid;
            if (isSel) wvSelectedLabel.textContent = `Vỏ: ${it.name}`;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', isSel ? 'true' : 'false');
            btn.className = `p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 truncate ${
              isSel ? 'bg-orange-600 text-white border-orange-700' : 'bg-white text-stone-800 border-amber-200 hover:bg-orange-50'
            }`;
            btn.innerHTML = `<span aria-hidden="true">${it.emoji}</span><span class="truncate">${it.name}</span>`;
            btn.addEventListener('click', () => {
              state.selectedWrapperUid = it.uid;
              playSoundEffect('pick');
              announceNVDA(`Đã chọn "${it.name}" làm lớp vỏ cuốn ngoài cùng.`, 'polite');
              renderWorkbench();
            });
            wvOptionsList.appendChild(btn);
          });
        } else {
          wvTitle.textContent = '🥖 Chọn 1 Nguyên Liệu Làm Vỏ Nhồi / Bánh Kẹp:';
          wvHint.textContent = 'Bấm chọn nguyên liệu làm vỏ nhồi (ví dụ: Ổ Bánh Mì, Xúc Xích, Ớt Chuông, Quả cà chua, hoặc Bánh Oreo...). Các nguyên liệu còn lại sẽ được nhồi vào ruột!';

          if (!state.selectedVesselUid && state.stationItems.length > 0) {
            state.selectedVesselUid = state.stationItems[0].uid;
          }

          state.stationItems.forEach(it => {
            const isSel = it.uid === state.selectedVesselUid;
            if (isSel) wvSelectedLabel.textContent = `Vỏ: ${it.name}`;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', isSel ? 'true' : 'false');
            btn.className = `p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 truncate ${
              isSel ? 'bg-orange-600 text-white border-orange-700' : 'bg-white text-stone-800 border-amber-200 hover:bg-orange-50'
            }`;
            btn.innerHTML = `<span aria-hidden="true">${it.emoji}</span><span class="truncate">${it.name}</span>`;
            btn.addEventListener('click', () => {
              state.selectedVesselUid = it.uid;
              playSoundEffect('pick');
              announceNVDA(`Đã chọn "${it.name}" làm vỏ nhồi.`, 'polite');
              renderWorkbench();
            });
            wvOptionsList.appendChild(btn);
          });
        }
      } else {
        wrapperVesselPanel.classList.add('hidden');
      }

      // Action Buttons
      const actionsEl = document.getElementById('station-action-buttons');
      if (actionsEl) {
        actionsEl.innerHTML = '';
        activeSt.actions.forEach(act => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.setAttribute('aria-label', `${act.label}. ${act.desc}`);
          btn.className = 'game-btn btn-3d-orange py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-extrabold font-game flex items-center justify-center gap-1.5 col-span-full sm:col-span-1 shadow-md';
          if (state.isCookingBusy) {
            btn.disabled = true;
            btn.setAttribute('aria-busy', 'true');
            btn.className += ' opacity-60 cursor-not-allowed';
            btn.textContent = '⏳ Đang nấu...';
          } else {
            btn.textContent = act.label;
            btn.addEventListener('click', () => performStationAction(act.id));
          }
          actionsEl.appendChild(btn);
        });
      }

      // Station Items List
      const listEl = document.getElementById('station-items-list');
      if (listEl) {
        listEl.innerHTML = '';
        if (state.stationItems.length === 0) {
          listEl.innerHTML = `<div class="p-3 rounded-2xl bg-stone-50 border border-dashed border-stone-300 text-xs text-stone-500 text-center">Bếp đang trống. Hãy lấy nguyên liệu từ Tủ Lạnh (Alt+1) bỏ vào đây!</div>`;
        } else {
          state.stationItems.forEach((it, idx) => {
            const desc = describeItemStateShort(it);
            const row = document.createElement('div');
            row.setAttribute('role', 'listitem');
            row.className = 'p-2 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-2 text-xs';
            row.innerHTML = `
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-xl shrink-0" aria-hidden="true">${it.emoji}</span>
                <div class="min-w-0">
                  <div class="font-bold text-stone-900 truncate">${idx + 1}. ${it.name}</div>
                  <div class="text-[10px] text-stone-600 truncate">${desc}</div>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button type="button" data-to-staging="${idx}" class="px-2 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[10px]" aria-label="Cất ${it.name} ra Khay Tạm">
                  Ra khay
                </button>
                <button type="button" data-del-st="${idx}" class="px-2 py-1 rounded-lg bg-stone-200 hover:bg-red-200 text-stone-700 hover:text-red-900 font-bold text-[10px]" aria-label="Bỏ ${it.name}">
                  Xóa
                </button>
              </div>
            `;
            row.querySelector(`[data-to-staging="${idx}"]`).addEventListener('click', () => {
              const [moved] = state.stationItems.splice(idx, 1);
              state.stagingItems.push(moved);
              playSoundEffect('pick');
              announceNVDA(`Đã cất ${moved.name} ra Khay Tạm.`, 'polite');
              renderAll();
            });
            row.querySelector(`[data-del-st="${idx}"]`).addEventListener('click', () => {
              const [del] = state.stationItems.splice(idx, 1);
              announceNVDA(`Đã bỏ ${del.name} khỏi bếp.`, 'polite');
              renderAll();
            });
            listEl.appendChild(row);
          });
        }
      }
    }

    // RENDER STAGING TRAY (KHAY TẠM)
    function renderStagingTray() {
      const badge = document.getElementById('staging-count-badge');
      if (badge) badge.textContent = `${state.stagingItems.length} món ở khay`;

      const listEl = document.getElementById('staging-items-list');
      if (!listEl) return;
      listEl.innerHTML = '';

      if (state.stagingItems.length === 0) {
        listEl.innerHTML = `<div class="p-2.5 rounded-2xl bg-white/70 border border-dashed border-amber-300 text-xs text-amber-800 text-center">Khay tạm đang trống. Hãy cất các món đã cuốn hoặc nấu dở ra đây để làm tiếp món khác!</div>`;
        return;
      }

      state.stagingItems.forEach((it, idx) => {
        const desc = describeItemStateShort(it);
        const row = document.createElement('div');
        row.setAttribute('role', 'listitem');
        row.className = 'p-2 rounded-2xl bg-white border border-amber-300 flex items-center justify-between gap-2 text-xs shadow-sm';
        row.innerHTML = `
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xl shrink-0" aria-hidden="true">${it.emoji}</span>
            <div class="min-w-0">
              <div class="font-bold text-stone-900 truncate">${idx + 1}. ${it.name}</div>
              <div class="text-[10px] text-stone-600 truncate">${desc}</div>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button type="button" data-to-st="${idx}" class="px-2 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-950 font-bold text-[10px]" aria-label="Đưa ${it.name} vào Bếp hiện tại">
              Vào bếp
            </button>
            <button type="button" data-del-stag="${idx}" class="px-2 py-1 rounded-lg bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-800 font-bold text-[10px]" aria-label="Xóa ${it.name} khỏi khay">
              Xóa
            </button>
          </div>
        `;
        row.querySelector(`[data-to-st="${idx}"]`).addEventListener('click', () => {
          const [moved] = state.stagingItems.splice(idx, 1);
          moved.returnedFromStaging = true;
          state.stationItems.push(moved);
          playSoundEffect('pick');
          announceNVDA(`Đã đưa ${moved.name} từ Khay Tạm vào Bếp.`, 'polite');
          renderAll();
        });
        row.querySelector(`[data-del-stag="${idx}"]`).addEventListener('click', () => {
          const [del] = state.stagingItems.splice(idx, 1);
          announceNVDA(`Đã bỏ ${del.name} khỏi Khay Tạm.`, 'polite');
          renderAll();
        });
        listEl.appendChild(row);
      });
    }

    // RENDER SPICES
    function renderSpices() {
      const grid = document.getElementById('spices-grid');
      if (!grid) return;
      grid.innerHTML = '';

      SPICES.forEach(sp => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', `Nêm ${sp.name}. ${sp.desc}`);
        btn.className = 'p-1.5 sm:p-2 rounded-2xl border border-stone-200 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100 text-center transition flex flex-col items-center gap-0.5 group';
        btn.innerHTML = `
          <span class="text-xl group-hover:scale-110 transition-transform" aria-hidden="true">${sp.emoji}</span>
          <span class="text-[10px] font-bold text-stone-800 truncate w-full">${sp.name}</span>
        `;
        btn.addEventListener('click', () => applySpice(sp.id));
        grid.appendChild(btn);
      });
    }

    // RENDER SERVING PLATE & HARMONY RADAR
    function renderServingPlate() {
      const isMultiDish = state.servedDishes && state.servedDishes.length > 1;
      const badge = document.getElementById('plate-items-count-badge');
      if (badge) {
        if (state.servedDishes && state.servedDishes.length === 1) {
          const singleDish = state.servedDishes[0];
          badge.textContent = `1 món "${singleDish.name}" (${singleDish.items.length} nguyên liệu) trên dĩa`;
        } else if (isMultiDish) {
          badge.textContent = `${state.servedDishes.length} món (${state.plateItems.length} nguyên liệu) trên dĩa`;
        } else if (state.plateItems.length > 0) {
          badge.textContent = `${state.plateItems.length} nguyên liệu trên dĩa`;
        } else {
          badge.textContent = '0 món trên dĩa';
        }
      }

      const allPlateItems = state.plateItems;
      const analysis = analyzeCulinaryChemistry(allPlateItems);

      const dishTitleEl = document.getElementById('plate-dish-title');
      const compSummaryEl = document.getElementById('plate-components-summary');
      const scoreEl = document.getElementById('plate-harmony-score');
      const garnishBadgeEl = document.getElementById('plate-garnish-badge');

      if (isMultiDish) {
        const dishNames = state.servedDishes.map(d => d.name).join(' kèm ');
        if (dishTitleEl) dishTitleEl.textContent = `Thực Đơn ${state.servedDishes.length} Món: ${dishNames}`;
        if (compSummaryEl) compSummaryEl.textContent = state.servedDishes.map((d, i) => `[Món ${i + 1}: ${d.name} (${d.analysis.structureSummary})]`).join(' • ');
        const garnishes = Array.from(new Set(state.servedDishes.map(d => `${d.garnish.emoji} ${d.garnish.name}`)));
        if (garnishBadgeEl) garnishBadgeEl.textContent = garnishes.join(' | ');

        let totalScore = 0;
        state.servedDishes.forEach(d => totalScore += d.analysis.harmonyScore);
        const avgScore = Math.round(totalScore / state.servedDishes.length);
        if (scoreEl) scoreEl.textContent = `Độ hài hòa trung bình: ${avgScore}/100`;
      } else {
        const currentGarnish = (state.servedDishes && state.servedDishes[0])
          ? state.servedDishes[0].garnish
          : (GARNISH_OPTIONS.find(g => g.id === state.selectedGarnishId) || GARNISH_OPTIONS[0]);
        if (garnishBadgeEl) garnishBadgeEl.textContent = `${currentGarnish.emoji} ${currentGarnish.name}`;

        if (dishTitleEl) {
          dishTitleEl.textContent = (state.servedDishes && state.servedDishes[0])
            ? state.servedDishes[0].name
            : (state.customDishName || (allPlateItems.length > 0 ? analysis.autoTitle : 'Dĩa đang trống'));
        }
        if (compSummaryEl) {
          compSummaryEl.textContent = analysis.structureSummary || 'Chưa có thức ăn trên dĩa.';
        }
        if (scoreEl) {
          scoreEl.textContent = allPlateItems.length > 0 ? `Độ hài hòa: ${analysis.harmonyScore}/100` : 'Độ hài hòa: --';
        }
      }

      // Flavor Bars
      const barsContainer = document.getElementById('flavor-bars-list');
      if (barsContainer) {
        barsContainer.innerHTML = '';
        FLAVOR_DIMENSIONS.forEach(dim => {
          const val = analysis.normalized[dim.key] || 0;
          const pct = Math.min(100, Math.round(val * 10));
          const row = document.createElement('div');
          row.className = 'text-[11px]';
          row.innerHTML = `
            <div class="flex items-center justify-between mb-0.5">
              <span class="font-semibold text-stone-700">${dim.label}</span>
              <span class="font-bold text-stone-900">${val.toFixed(1)}/10</span>
            </div>
            <div class="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow="${val}" aria-valuemin="0" aria-valuemax="10">
              <div class="h-full ${dim.bg} flavor-bar-fill rounded-full" style="width: ${pct}%"></div>
            </div>
          `;
          barsContainer.appendChild(row);
        });
      }

      // Synergies
      const synContainer = document.getElementById('synergy-tags-container');
      if (synContainer) {
        synContainer.innerHTML = '';
        if (analysis.synergies.length === 0 && analysis.warnings.length === 0) {
          synContainer.innerHTML = `<span class="text-[11px] text-stone-400 italic">Chưa có phản ứng hương vị</span>`;
        } else {
          analysis.synergies.forEach(s => {
            const sp = document.createElement('span');
            sp.className = 'px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-semibold text-[10px] leading-tight';
            sp.textContent = s;
            synContainer.appendChild(sp);
          });
          analysis.warnings.forEach(w => {
            const sp = document.createElement('span');
            sp.className = 'px-2 py-0.5 rounded-lg bg-red-100 text-red-900 font-semibold text-[10px] leading-tight';
            sp.textContent = w;
            synContainer.appendChild(sp);
          });
        }
      }

      // Plate Items list (Duyệt theo từng Món Ăn đã hoàn thành)
      const listEl = document.getElementById('plate-items-list');
      if (listEl) {
        listEl.innerHTML = '';
        if (state.plateItems.length === 0) {
          listEl.innerHTML = `<div class="p-2 rounded-xl bg-stone-50 border border-dashed border-stone-300 text-xs text-stone-500 text-center">Bấm nút ⭐ HOÀN THÀNH MÓN bên dưới để bày đồ ăn lên dĩa!</div>`;
        } else if (state.servedDishes && state.servedDishes.length > 0) {
          state.servedDishes.forEach((dish, idx) => {
            const row = document.createElement('div');
            row.setAttribute('role', 'listitem');
            row.className = 'p-1.5 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between gap-1 text-xs';
            const iconEmoji = dish.garnish ? dish.garnish.emoji : (dish.items[0] ? dish.items[0].emoji : '🍽️');
            const summaryText = dish.items && dish.items.length > 1
              ? ` (${dish.items.map(i => i.name).join(', ')})`
              : (dish.items[0] && dish.items[0].name !== dish.name ? ` (${dish.items[0].name})` : '');
            row.innerHTML = `
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-lg shrink-0" aria-hidden="true">${iconEmoji}</span>
                <span class="font-bold text-stone-900 truncate" title="${dish.name}${summaryText}">${idx + 1}. ${dish.name}</span>
                <span class="text-[10px] text-stone-500 truncate hidden sm:inline">${summaryText}</span>
              </div>
              <button type="button" data-del-dish="${dish.id}" class="px-2 py-0.5 rounded bg-stone-200 hover:bg-red-200 text-stone-700 hover:text-red-900 font-bold text-[10px]" aria-label="Bỏ món ${dish.name} khỏi dĩa">
                Xóa
              </button>
            `;
            row.querySelector(`[data-del-dish="${dish.id}"]`).addEventListener('click', () => {
              const dishName = dish.name;
              const itemUids = new Set(dish.items.map(i => i.uid));
              state.plateItems = state.plateItems.filter(i => !itemUids.has(i.uid));
              state.servedDishes = state.servedDishes.filter(d => d.id !== dish.id);
              if (state.servedDishes.length === 0) {
                state.customDishName = '';
              } else if (state.servedDishes.length === 1) {
                state.customDishName = state.servedDishes[0].name;
              } else {
                state.customDishName = state.servedDishes.map(d => d.name).join(' kèm ');
              }
              announceNVDA(`Đã bỏ món "${dishName}" khỏi dĩa ăn.`, 'polite');
              renderAll();
            });
            listEl.appendChild(row);
          });
        } else {
          // Fallback nếu có plateItems nhưng không có servedDishes
          state.plateItems.forEach((it, idx) => {
            const row = document.createElement('div');
            row.setAttribute('role', 'listitem');
            row.className = 'p-1.5 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between gap-1 text-xs';
            const displayName = it.dishName || it.name;
            row.innerHTML = `
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-lg shrink-0" aria-hidden="true">${it.emoji}</span>
                <span class="font-bold text-stone-900 truncate">${idx + 1}. ${displayName}</span>
              </div>
              <button type="button" data-del-plate="${idx}" class="px-2 py-0.5 rounded bg-stone-200 hover:bg-red-200 text-stone-700 hover:text-red-900 font-bold text-[10px]" aria-label="Bỏ món ${displayName} khỏi dĩa">
                Xóa
              </button>
            `;
            row.querySelector(`[data-del-plate="${idx}"]`).addEventListener('click', () => {
              const [removed] = state.plateItems.splice(idx, 1);
              announceNVDA(`Đã bỏ món "${displayName}" khỏi dĩa ăn.`, 'polite');
              renderAll();
            });
            listEl.appendChild(row);
          });
        }
      }

      // Update feed button label with active character name
      const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
      const feedLbl = document.getElementById('master-feed-label');
      if (feedLbl) feedLbl.textContent = `ĐÚT CHO ${char.name.toUpperCase()} ĂN! (F)`;
    }

    function renderAll() {
      if (state.currentScreen === 'character_select') {
        renderStartScreenCharacters();
      } else {
        renderFridge();
        renderWorkbench();
        renderStagingTray();
        renderSpices();
        renderServingPlate();

        // Nút HOÀN THÀNH MÓN chỉ hiện khi trong bếp hoặc khay tạm có nguyên liệu
        const finishBtn = document.getElementById('btn-master-finish-dish');
        if (finishBtn) {
          const hasIngredientsToFinish = (state.stationItems.length + state.stagingItems.length) > 0;
          if (hasIngredientsToFinish) {
            finishBtn.classList.remove('hidden');
          } else {
            finishBtn.classList.add('hidden');
          }
        }
      }
    }

    /*************************************************************************
     * 8. HỆ THỐNG ĐỒ HỌA CANVAS ĐỘNG (WORKBENCH & DINING CHARACTER)
     *************************************************************************/
    function drawWorkbenchCanvas() {
      const canvas = document.getElementById('workbench-canvas');
      if (!canvas || canvas.offsetParent === null) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const stId = state.activeStationId;

      if (stId === 'cutting_board') {
        ctx.fillStyle = '#451a03';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.roundRect(35, 26, W - 70, H - 48, 16);
        ctx.fill();
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 4;
        ctx.stroke();
      } else if (stId === 'rolling_mat') {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.roundRect(40, 24, W - 80, H - 44, 12);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        for (let x = 50; x < W - 45; x += 14) {
          ctx.beginPath();
          ctx.moveTo(x, 26);
          ctx.lineTo(x, H - 20);
          ctx.stroke();
        }
      } else if (stId === 'stuffing_station') {
        ctx.fillStyle = '#292524';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.roundRect(40, 26, W - 80, H - 48, 16);
        ctx.fill();
      } else if (stId === 'frying_pan' || stId === 'deep_fryer') {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, W, H);
        const grad = ctx.createRadialGradient(W / 2, H / 2 + 8, 20, W / 2, H / 2 + 8, 115);
        grad.addColorStop(0, '#ea580c');
        grad.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2 + 8, 115, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = stId === 'deep_fryer' ? '#ca8a04' : '#27272a';
        ctx.strokeStyle = '#52525b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2 + 8, 86, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (stId === 'boiling_pot') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2 + 8, 86, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        for (let i = 0; i < 7; i++) {
          const bx = W / 2 + Math.cos(state.animTick * 0.06 + i) * 44;
          const by = H / 2 + 8 + Math.sin(state.animTick * 0.08 + i * 2) * 38;
          ctx.beginPath();
          ctx.arc(bx, by, 4 + (i % 3) * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (stId === 'oven' || stId === 'charcoal_grill') {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = stId === 'charcoal_grill' ? '#7f1d1d' : '#431407';
        ctx.beginPath();
        ctx.roundRect(55, 30, W - 110, H - 52, 14);
        ctx.fill();
        ctx.strokeStyle = '#a8a29e';
        ctx.lineWidth = 3;
        for (let x = 75; x < W - 70; x += 24) {
          ctx.beginPath();
          ctx.moveTo(x, 32);
          ctx.lineTo(x, H - 22);
          ctx.stroke();
        }
      } else if (stId === 'blender') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.25)';
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(W / 2 - 75, 26, 150, H - 46, 18);
        ctx.fill();
        ctx.stroke();
      } else if (stId === 'beverage_station') {
        // Quầy bar gỗ ấm áp & thảm cao su chống trượt
        ctx.fillStyle = '#291811';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.roundRect(40, 26, W - 80, H - 48, 14);
        ctx.fill();
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Ly thủy tinh cao / Bình pha chế ở trung tâm
        const gx = W / 2 - 50;
        const gy = 32;
        const gw = 100;
        const gh = H - 60;
        ctx.fillStyle = 'rgba(240, 249, 255, 0.2)';
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(gx, gy, gw, gh, 16);
        ctx.fill();
        ctx.stroke();

        // Mực nước bên trong ly
        if (state.stationItems.length > 0) {
          const topCol = state.stationItems[0].color || '#d97706';
          ctx.fillStyle = topCol;
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.roundRect(gx + 6, gy + gh * 0.35, gw - 12, gh * 0.65 - 6, [0, 0, 12, 12]);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Đá viên nổi bồng bềnh nếu có đá
        const hasIceInBar = state.stationItems.some(i => itemContainsIce(i));
        if (hasIceInBar) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 3; i++) {
            const ix = W / 2 - 25 + i * 20 + Math.sin(state.animTick * 0.05 + i) * 4;
            const iy = gy + gh * 0.45 + (i % 2) * 22;
            ctx.beginPath();
            ctx.roundRect(ix, iy, 14, 14, 3);
            ctx.fill();
            ctx.stroke();
          }
        }
      }

      // Draw items in station
      const count = state.stationItems.length;
      if (count === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '600 13px Fredoka, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Bếp đang trống — Hãy chọn nguyên liệu từ Tủ Lạnh (Alt+1)', W / 2, H / 2 + 10);
      } else {
        state.stationItems.forEach((item, idx) => {
          const angle = (idx / Math.max(1, count)) * Math.PI * 2 + (state.stationActionFlash > 0 ? state.animTick * 0.15 : 0);
          const radius = count === 1 ? 0 : Math.min(58, 22 + count * 6);
          const cx = W / 2 + Math.cos(angle) * radius;
          const cy = H / 2 + 8 + Math.sin(angle) * (radius * 0.6);

          ctx.save();
          let fillCol = item.cookLevel === 0 ? item.color : item.cookedColor;
          if (item.cookLevel >= 3) fillCol = '#1c1917';
          ctx.fillStyle = fillCol;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;

          ctx.beginPath();
          if (item.kind === 'rolled') ctx.roundRect(cx - 44, cy - 18, 88, 36, 16);
          else if (item.kind === 'stuffed') ctx.ellipse(cx, cy, 48, 24, 0, 0, Math.PI * 2);
          else if (item.kind === 'beverage') ctx.roundRect(cx - 22, cy - 30, 44, 60, 10);
          else ctx.arc(cx, cy, item.cutState === 'minced' ? 16 : 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.font = '22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.emoji, cx, cy - 2);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Fredoka, Inter, sans-serif';
          ctx.fillText(item.name.slice(0, 15), cx, cy + 24);
          ctx.restore();
        });
      }

      // Action sparks / steam
      if (state.stationActionFlash > 0) {
        state.stationActionFlash--;
        ctx.save();
        for (let i = 0; i < 10; i++) {
          const px = W / 2 + (Math.random() - 0.5) * 160;
          const py = H / 2 + (Math.random() - 0.5) * 90;
          ctx.fillStyle = state.stationActionType === 'spice' ? '#fde047' : '#fb923c';
          ctx.beginPath();
          ctx.arc(px, py, 3 + Math.random() * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    function drawDiningCharacterCanvas() {
      const canvas = document.getElementById('dining-character-canvas');
      if (!canvas || canvas.offsetParent === null) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
      if (state.charAnimTimer > 0) {
        state.charAnimTimer--;
      } else if (state.charAnimState !== 'idle') {
        state.charAnimState = 'idle';
      }

      const bounce = Math.sin(state.animTick * 0.08) * 3;
      const cx = W / 2;
      const cy = H / 2 + 8 + bounce;

      ctx.save();
      let auraColor = 'rgba(251, 191, 36, 0.2)';
      if (state.charAnimState === 'love') auraColor = 'rgba(16, 185, 129, 0.35)';
      else if (state.charAnimState === 'bad') auraColor = 'rgba(239, 68, 68, 0.45)';

      ctx.fillStyle = auraColor;
      ctx.beginPath();
      ctx.arc(cx, cy, 64, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = state.charAnimState === 'bad' ? '#ef4444' : char.color;
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 17, cy - 10, 10, 0, Math.PI * 2);
      ctx.arc(cx + 17, cy - 10, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(cx - 17, cy - 10, 5, 0, Math.PI * 2);
      ctx.arc(cx + 17, cy - 10, 5, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      const hasFoodWaiting = state.plateItems.length > 0;
      if (state.charAnimState === 'love' || state.charAnimState === 'good') {
        ctx.fillStyle = '#991b1b';
        ctx.arc(cx, cy + 12, 17, 0, Math.PI);
        ctx.fill();
        ctx.stroke();
      } else if (state.charAnimState === 'bad') {
        ctx.arc(cx, cy + 24, 15, Math.PI, 0);
        ctx.stroke();
      } else if (hasFoodWaiting) {
        ctx.fillStyle = '#7f1d1d';
        ctx.ellipse(cx, cy + 15, 16, 12 + Math.sin(state.animTick * 0.15) * 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.arc(cx, cy + 12, 13, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }

      // Avatar emoji top
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(char.emoji, cx, cy - 44);
      ctx.restore();
    }

    function startAnimationLoop() {
      function frame() {
        state.animTick++;
        if (state.currentScreen === 'kitchen') {
          drawWorkbenchCanvas();
          drawDiningCharacterCanvas();
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    /*************************************************************************
     * 9. RÀNG BUỘC SỰ KIỆN GIAO DIỆN & PHÍM TẮT TOÀN CỤC
     *************************************************************************/
    function bindEvents() {
      // SCREEN 1: START SCREEN ACTIONS
      const btnStart = document.getElementById('btn-start-kitchen');
      btnStart.addEventListener('click', () => {
        state.currentScreen = 'kitchen';
        const screenSelect = document.getElementById('screen-character-select');
        const screenKitchen = document.getElementById('screen-kitchen');
        screenSelect.classList.add('hidden');
        screenSelect.classList.remove('flex');
        screenKitchen.classList.remove('hidden');
        screenKitchen.classList.add('flex');

        const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
        document.getElementById('kitchen-char-avatar').textContent = char.emoji;
        document.getElementById('kitchen-char-title').textContent = `Đang Nấu Cho: ${char.name}`;
        document.getElementById('kitchen-char-craving-snippet').textContent = char.cravings[0];

        playSoundEffect('door');
        announceNVDA(`Chào mừng bạn vào bếp nấu cho ${char.name}! Hãy lấy nguyên liệu từ Tủ Lạnh (Alt+1) để bắt đầu.`, 'assertive');
        renderAll();
      });

      // Sound & TTS Toggles on Start Screen
      document.getElementById('start-btn-toggle-sfx').addEventListener('click', (e) => {
        state.sfxEnabled = !state.sfxEnabled;
        e.currentTarget.setAttribute('aria-pressed', state.sfxEnabled ? 'true' : 'false');
        e.currentTarget.textContent = `🔊 Âm thanh Bếp: ${state.sfxEnabled ? 'BẬT' : 'TẮT'}`;
        syncSoundControls();
      });

      document.getElementById('start-btn-toggle-tts').addEventListener('click', (e) => {
        state.ttsEnabled = !state.ttsEnabled;
        e.currentTarget.setAttribute('aria-pressed', state.ttsEnabled ? 'true' : 'false');
        e.currentTarget.textContent = state.ttsEnabled ? '🗣️ Giọng đọc Web: BẬT' : '🗣️ Giọng đọc Web: TẮT (Dùng NVDA)';
        syncSoundControls();
      });

      // Help Modal Toggles
      const modalHelp = document.getElementById('modal-help');
      const openHelp = () => { modalHelp.showModal(); document.getElementById('btn-close-help').focus(); };
      const closeHelp = () => { modalHelp.close(); };
      const startBtnHelp = document.getElementById('start-btn-help');
      if (startBtnHelp) startBtnHelp.addEventListener('click', openHelp);
      const footerBtnHelp = document.getElementById('footer-btn-help');
      if (footerBtnHelp) footerBtnHelp.addEventListener('click', openHelp);
      const btnCloseHelp = document.getElementById('btn-close-help');
      if (btnCloseHelp) btnCloseHelp.addEventListener('click', closeHelp);

      // Kitchen Header Controls
      document.getElementById('kitchen-btn-sfx').addEventListener('click', () => {
        state.sfxEnabled = !state.sfxEnabled;
        syncSoundControls();
      });
      document.getElementById('kitchen-btn-tts').addEventListener('click', () => {
        state.ttsEnabled = !state.ttsEnabled;
        syncSoundControls();
      });

      function syncSoundControls() {
        const sfxBtn = document.getElementById('kitchen-btn-sfx');
        const ttsBtn = document.getElementById('kitchen-btn-tts');
        const sIcon = document.getElementById('k-icon-sfx');
        const sLbl = document.getElementById('k-label-sfx');
        const tIcon = document.getElementById('k-icon-tts');
        const tLbl = document.getElementById('k-label-tts');

        sfxBtn.setAttribute('aria-pressed', state.sfxEnabled ? 'true' : 'false');
        ttsBtn.setAttribute('aria-pressed', state.ttsEnabled ? 'true' : 'false');
        sIcon.textContent = state.sfxEnabled ? '🔊' : '🔇';
        sLbl.textContent = `Âm thanh: ${state.sfxEnabled ? 'BẬT' : 'TẮT'}`;
        tIcon.textContent = state.ttsEnabled ? '🗣️' : '🔇';
        tLbl.textContent = state.ttsEnabled ? 'Giọng đọc: BẬT' : 'Giọng đọc: TẮT';

        if (state.sfxEnabled) playSoundEffect('pick');
        announceNVDA(`Âm thanh: ${state.sfxEnabled ? 'Bật' : 'Tắt'}. Giọng đọc: ${state.ttsEnabled ? 'Bật' : 'Tắt'}.`, 'polite');
      }

      // Back to Main Menu from Kitchen
      const modalConfirmBackToMenu = document.getElementById('modal-confirm-back-to-menu');
      document.getElementById('btn-kitchen-back-to-mainmenu').addEventListener('click', () => {
        modalConfirmBackToMenu.showModal();
        document.getElementById('btn-cancel-back-to-menu').focus();
      });
      document.getElementById('btn-cancel-back-to-menu').addEventListener('click', () => modalConfirmBackToMenu.close());
      document.getElementById('btn-do-back-to-mainmenu').addEventListener('click', () => {
        // Reset toàn bộ trạng thái bếp
        state.stationItems = [];
        state.stagingItems = [];
        state.plateItems = [];
        state.servedDishes = [];
        state.customDishName = '';
        state.selectedWrapperUid = null;
        state.selectedVesselUid = null;
        state.lastTastedMeal = null;
        const shareContainer = document.getElementById('share-community-container');
        if (shareContainer) shareContainer.classList.add('hidden');
        modalConfirmBackToMenu.close();
        showScreen('main-menu');
        announceNVDA('Đã dọn dẹp sạch sẽ nhà bếp và quay lại Menu Chính.', 'polite');
      });

      // Back to Character Select (Reset Kitchen) Modal
      const modalConfirmBack = document.getElementById('modal-confirm-back');
      document.getElementById('btn-back-to-select').addEventListener('click', () => {
        modalConfirmBack.showModal();
        document.getElementById('btn-cancel-back').focus();
      });
      document.getElementById('btn-cancel-back').addEventListener('click', () => modalConfirmBack.close());
      document.getElementById('btn-do-reset-and-back').addEventListener('click', resetKitchenAndGoBack);

      // Character craving inspiration hint button
      document.getElementById('btn-char-hint').addEventListener('click', () => {
        const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
        const hint = char.cravings[state.cravingIndex % char.cravings.length];
        state.cravingIndex++;
        playSoundEffect('pick');
        document.getElementById('dining-speech-bubble').textContent = `"${hint}"`;
        announceNVDA(`Gợi ý sở thích của ${char.name}: ${hint}`, 'polite');
      });

      // 5-Tab Navigation (WCAG Tablist pattern with Arrow keys and click)
      const tabKeys = ['fridge', 'workbench', 'staging', 'spices', 'dining'];
      tabKeys.forEach((key, idx) => {
        const btn = document.getElementById('tab-' + key);
        if (btn) {
          btn.addEventListener('click', () => {
            playSoundEffect('pick');
            switchKitchenTab(key, false);
          });
          btn.addEventListener('keydown', (e) => {
            let targetIdx = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault();
              targetIdx = (idx + 1) % tabKeys.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault();
              targetIdx = (idx - 1 + tabKeys.length) % tabKeys.length;
            } else if (e.key === 'Home') {
              e.preventDefault();
              targetIdx = 0;
            } else if (e.key === 'End') {
              e.preventDefault();
              targetIdx = tabKeys.length - 1;
            }
            if (targetIdx !== null) {
              const targetKey = tabKeys[targetIdx];
              playSoundEffect('pick');
              switchKitchenTab(targetKey, false);
              const targetBtn = document.getElementById('tab-' + targetKey);
              if (targetBtn) targetBtn.focus();
            }
          });
        }
      });

      // Fridge Destination Selector (Chỉ vào Bếp hoặc Khay Tạm)
      const btnDestStation = document.getElementById('dest-btn-station');
      const btnDestStaging = document.getElementById('dest-btn-staging');

      if (btnDestStation) {
        btnDestStation.addEventListener('click', () => {
          state.fridgeDestination = 'station';
          btnDestStation.className = 'flex-1 py-1.5 px-2 rounded-xl font-bold bg-orange-600 text-white shadow-sm transition text-center text-xs';
          if (btnDestStaging) btnDestStaging.className = 'flex-1 py-1.5 px-2 rounded-xl font-bold bg-transparent text-slate-700 hover:bg-white/60 transition text-center text-xs';
          announceNVDA('Đã chọn: Lấy nguyên liệu từ tủ bỏ vào Bếp Đang Chọn.', 'polite');
        });
      }

      if (btnDestStaging) {
        btnDestStaging.addEventListener('click', () => {
          state.fridgeDestination = 'staging';
          btnDestStaging.className = 'flex-1 py-1.5 px-2 rounded-xl font-bold bg-amber-600 text-white shadow-sm transition text-center text-xs';
          if (btnDestStation) btnDestStation.className = 'flex-1 py-1.5 px-2 rounded-xl font-bold bg-transparent text-slate-700 hover:bg-white/60 transition text-center text-xs';
          announceNVDA('Đã chọn: Lấy nguyên liệu từ tủ bỏ vào Khay Tạm Chờ Sơ Chế.', 'polite');
        });
      }

      // Fridge search input
      document.getElementById('fridge-search-input').addEventListener('input', (e) => {
        state.searchQuery = e.target.value || '';
        renderFridge();
      });

      // Clear station items
      document.getElementById('btn-clear-station-items').addEventListener('click', () => {
        state.stationItems = [];
        announceNVDA('Đã dọn sạch nguyên liệu trên bếp.', 'polite');
        renderAll();
      });

      // Clear plate items
      document.getElementById('btn-clear-plate-items').addEventListener('click', () => {
        state.plateItems = [];
        state.servedDishes = [];
        state.customDishName = '';
        announceNVDA('Đã đổ sạch dĩa thức ăn để làm lại.', 'polite');
        renderAll();
      });

      // Staging Tray Buttons
      const bStToStag = document.getElementById('btn-station-to-staging');
      if (bStToStag) bStToStag.addEventListener('click', moveStationToStaging);
      const bStagToSt = document.getElementById('btn-staging-to-station');
      if (bStagToSt) bStagToSt.addEventListener('click', moveStagingToStation);

      // Spices Target Buttons (Chỉ Bếp hoặc Khay Tạm)
      const spStation = document.getElementById('spice-target-station');
      const spStaging = document.getElementById('spice-target-staging');

      if (spStation) {
        spStation.addEventListener('click', () => {
          state.spiceTarget = 'station';
          spStation.className = 'px-2 py-1 rounded-lg font-bold bg-amber-600 text-white';
          if (spStaging) spStaging.className = 'px-2 py-1 rounded-lg font-bold text-stone-700 hover:bg-white';
          announceNVDA('Đã chọn nêm gia vị vào Bếp Đang Chọn.', 'polite');
        });
      }

      if (spStaging) {
        spStaging.addEventListener('click', () => {
          state.spiceTarget = 'staging';
          spStaging.className = 'px-2 py-1 rounded-lg font-bold bg-amber-600 text-white';
          if (spStation) spStation.className = 'px-2 py-1 rounded-lg font-bold text-stone-700 hover:bg-white';
          announceNVDA('Đã chọn nêm gia vị vào Khay Tạm Chờ Sơ Chế.', 'polite');
        });
      }

      // Give water to character
      document.getElementById('btn-give-water').addEventListener('click', () => {
        const char = CHARACTERS.find(c => c.id === state.activeCharacterId) || CHARACTERS[0];
        playSoundEffect('drink');
        state.charAnimState = 'good';
        state.charAnimTimer = 45;
        const msg = `${char.name} vừa uống ly nước lọc mát lạnh: "Ực ực... Khà! Đã khát quá, hết cay và mặn rồi!"`;
        document.getElementById('dining-mood-tag').textContent = 'Sảng khoái 🥤😋';
        document.getElementById('dining-speech-bubble').textContent = msg;
        announceNVDA(msg, 'polite');
      });

      // Master Action Dock Buttons
      document.getElementById('btn-master-finish-dish').addEventListener('click', openFinishDishModal);
      document.getElementById('btn-master-feed').addEventListener('click', feedCharacter);
      document.getElementById('dock-btn-read-dish').addEventListener('click', readDishSummary);

      // Finish Dish Modal Actions
      const finishModal = document.getElementById('modal-finish-dish');
      document.getElementById('btn-close-finish-modal').addEventListener('click', () => finishModal.close());
      document.getElementById('btn-cancel-finish').addEventListener('click', () => finishModal.close());
      document.getElementById('btn-confirm-plate-dish').addEventListener('click', confirmPlatingDish);

      document.getElementById('btn-suggest-dish-name').addEventListener('click', () => {
        const finishingItems = [...state.stagingItems, ...state.stationItems];
        const analysis = analyzeCulinaryChemistry(finishingItems);
        const nameInput = document.getElementById('input-custom-dish-name');
        nameInput.value = analysis.autoTitle;
        playSoundEffect('pick');
        announceNVDA(`Đã gợi ý tên món: ${analysis.autoTitle}`, 'polite');
      });

      // Global Keyboard Navigation (Screen Reader Friendly)
      window.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        const isTyping = tag === 'input' || tag === 'textarea';

        if (e.key === 'Escape') {
          if (finishModal.open) { finishModal.close(); return; }
          if (modalConfirmBack.open) { modalConfirmBack.close(); return; }
          if (modalHelp.open) { modalHelp.close(); return; }
        }

        // Enter on Start Screen to start
        if (e.key === 'Enter' && state.currentScreen === 'character_select' && !isTyping) {
          e.preventDefault();
          document.getElementById('btn-start-kitchen').click();
          return;
        }

        // Enter on Finish Dish Modal to confirm
        if (e.key === 'Enter' && finishModal.open) {
          e.preventDefault();
          confirmPlatingDish();
          return;
        }

        // Alt+1..5 Quick Tab Switch
        if (e.altKey && !e.ctrlKey && !e.shiftKey && state.currentScreen === 'kitchen') {
          const tabMap = {
            '1': 'fridge',
            '2': 'workbench',
            '3': 'staging',
            '4': 'spices',
            '5': 'dining'
          };
          if (tabMap[e.key]) {
            e.preventDefault();
            const targetKey = tabMap[e.key];
            switchKitchenTab(targetKey, false);
            const targetBtn = document.getElementById('tab-' + targetKey);
            if (targetBtn) targetBtn.focus();
            return;
          }
        }

        if (isTyping) return;

        const k = e.key.toLowerCase();
        if (state.currentScreen === 'kitchen') {
          if (k === 'c') {
            e.preventDefault();
            const st = STATIONS.find(s => s.id === state.activeStationId);
            if (st && st.actions.length > 0) performStationAction(st.actions[0].id);
          } else if (k === 'r') {
            e.preventDefault();
            const st = STATIONS.find(s => s.id === state.activeStationId);
            if (st && st.isRollingStation) performStationAction('roll_tight');
            else if (st && st.isStuffingStation) performStationAction('stuff_pack');
            else announceNVDA('Phím R dùng tại Bàn Cuốn hoặc Trạm Nhồi! Hãy chọn dụng cụ số 2 hoặc số 3.', 'polite');
          } else if (k === 's') {
            e.preventDefault();
            const st = STATIONS.find(s => s.id === state.activeStationId);
            if (st && st.isBeverageStation) performStationAction('shake_shaker');
            else announceNVDA('Phím S dùng để Lắc bình Shaker tại Trạm Pha Chế Đồ Uống (Dụng cụ số 10)!', 'polite');
          } else if (k === 'b') {
            e.preventDefault();
            const st = STATIONS.find(s => s.id === state.activeStationId);
            if (st && st.isBeverageStation) performStationAction('brew_infuse');
            else announceNVDA('Phím B dùng để Hãm trà & cà phê nước nóng tại Trạm Pha Chế Đồ Uống (Dụng cụ số 10)!', 'polite');
          } else if (k === 't') {
            e.preventDefault();
            moveStationToStaging();
          } else if (k === 'p') {
            e.preventDefault();
            const hasIngredients = (state.stationItems.length + state.stagingItems.length) > 0;
            if (hasIngredients) {
              openFinishDishModal();
            } else {
              announceNVDA('Bếp và Khay Tạm đang trống, chưa có nguyên liệu nào để hoàn thành món! Hãy lấy nguyên liệu từ Tủ Lạnh (Alt+1) trước.', 'assertive');
            }
          } else if (k === 'f') {
            e.preventDefault();
            feedCharacter();
          } else if (k === 'i') {
            e.preventDefault();
            readDishSummary();
          } else if (k === 'h') {
            e.preventDefault();
            openHelp();
          }
        }
      });
    }

    // INITIALIZATION
    window.addEventListener('load', () => {
      bindEvents();
      renderAll();
      startAnimationLoop();
    });
  