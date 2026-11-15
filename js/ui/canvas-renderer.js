import { CHARACTERS } from '../data/index.js';
import { state } from '../core/state.js';
import { itemContainsIce } from '../cooking/food-item.js';

/**
 * Draw the active cooking station and its ingredients onto the workbench canvas.
 */
export function drawWorkbenchCanvas() {
  const canvas = document.getElementById('workbench-canvas');
  if (!canvas || canvas.offsetParent === null) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
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
    ctx.fillStyle = '#291811';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.roundRect(40, 26, W - 80, H - 48, 14);
    ctx.fill();
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 3;
    ctx.stroke();

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

    if (state.stationItems.length > 0) {
      const topCol = state.stationItems[0].color || '#d97706';
      ctx.fillStyle = topCol;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.roundRect(gx + 6, gy + gh * 0.35, gw - 12, gh * 0.65 - 6, [0, 0, 12, 12]);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

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
  } else if (stId === 'mixing_table') {
    ctx.fillStyle = '#44403c';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f5f5f4';
    ctx.beginPath();
    ctx.roundRect(40, 24, W - 80, H - 46, 16);
    ctx.fill();

    ctx.fillStyle = '#e7e5e4';
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2 + 6, 86, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fafaf9';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2 + 6, 74, 0, Math.PI * 2);
    ctx.fill();

    if (state.stationActionFlash > 0) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const startAng = state.animTick * 0.2;
      ctx.arc(W / 2, H / 2 + 6, 52, startAng, startAng + Math.PI * 1.3);
      ctx.stroke();
    }
  }

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

/**
 * Draw the active dining character and animated facial expression.
 */
export function drawDiningCharacterCanvas() {
  const canvas = document.getElementById('dining-character-canvas');
  if (!canvas || canvas.offsetParent === null) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
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

  ctx.font = '26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(char.emoji, cx, cy - 44);
  ctx.restore();
}

/**
 * Start the requestAnimationFrame loop for workbench and dining canvases.
 */
export function startAnimationLoop() {
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
