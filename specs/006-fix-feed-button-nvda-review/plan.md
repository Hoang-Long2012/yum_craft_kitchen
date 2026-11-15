# Implementation Plan: Khắc phục kẹt nút đút ăn, mất âm thanh cảm xúc & lỗi đọc đánh giá NVDA

**Branch**: `006-fix-feed-button-nvda-review` | **Date**: 2026-11-16 | **Spec**: [spec.md](file:///C:/Users/LCBoy/Desktop/data/web/yum_craft_kitchen/specs/006-fix-feed-button-nvda-review/spec.md)

## Technical Approach

1. **Giữ thuần khiết module đánh giá (`js/cooking/tasting-review.js`)**:
   - Import `{ state } from '../core/state.js'` để fallback `state.customDishName` an toàn khi không truyền `dishNameOverride`.
   - Xóa 8 lời gọi `playSoundEffect('react_bad')` thừa khỏi `tasting-review.js` vì `dining-view.js` đã phát âm thanh cảm xúc thống nhất dựa trên `review.reactionType` / `review.score`.
2. **Bảo toàn trạng thái & Focus của `#btn-master-feed` (`js/ui/dining-view.js`)**:
   - Kích hoạt `ensureAudioContext()` ở đầu `feedCharacter()` trong user gesture.
   - Chuyển sang `aria-disabled="true"` thay cho `disabled = true` và không gắn `aria-busy="true"` lên nút; bảo vệ toàn bộ flow bằng `try ... catch ... finally`.
   - Trong `renderServingPlate()`, chỉ đặt nhãn mặc định cho `#master-feed-label` khi `!state.isFeedingBusy`.
   - Gọi `renderAll()` trước `announceNVDA()` sau khi dọn dĩa xong để DOM đồng bộ trước khi đọc nhận xét.
3. **Độc lập timer Live Region (`js/core/state.js`, `js/accessibility/nvda-announcer.js`)**:
   - Tách timer thành `state.liveRegionTimers = { polite: null, assertive: null }` (vẫn đồng bộ `state.liveRegionTimer` cho tương thích) để hai kênh không hủy nhau.
4. **Âm thanh Web Audio (`js/audio/sound-engine.js`)**:
   - Nếu `audioCtx.state === 'suspended'` khi gọi `playSoundEffect()`, chờ `audioCtx.resume().then(...)` trước khi lập lịch oscillator/noise (tránh mất tiếng cảm xúc khi context đang tạm dừng).
5. **Ngữ nghĩa HTML & Bàn phím (`index.html`, `js/ui/keyboard-shortcuts.js`)**:
   - Gỡ `role="alert"/"status"` thừa trên 4 phần tử `#nvda-live-*`, giữ `aria-live` + `aria-atomic="true"`.
   - Đổi `#dining-last-score` sang `<output>`, thêm `tabindex="0"` trên `#plate-items-list`.
   - Chặn phím nóng nền khi có `<dialog open>`, không cướp phím `Enter` khi focus đang nằm trên button bên trong `#modal-finish-dish`, và tự chuyển sang tab `dining` khi nhấn phím `F`.
