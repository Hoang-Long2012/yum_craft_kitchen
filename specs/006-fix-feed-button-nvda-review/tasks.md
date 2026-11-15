# Tasks: Khắc phục kẹt nút đút ăn, mất âm thanh cảm xúc & lỗi đọc đánh giá NVDA

- [x] T001 Tạo tài liệu Specify (`specs/006-fix-feed-button-nvda-review/{spec.md,plan.md,tasks.md}`)
- [x] T002 Sửa `js/cooking/tasting-review.js`: import `state` và gỡ 8 lệnh gọi `playSoundEffect('react_bad')` thừa
- [x] T003 Tách timer 2 kênh live region trong `js/core/state.js` và `js/accessibility/nvda-announcer.js`
- [x] T004 Gia cố `playSoundEffect` & `ensureAudioContext` khi `AudioContext` ở trạng thái `suspended` trong `js/audio/sound-engine.js`
- [x] T005 Sửa `feedCharacter()` & `renderServingPlate()` trong `js/ui/dining-view.js` (`try/catch/finally`, `aria-disabled`, giữ nhãn khi đang ăn, `renderAll()` trước `announceNVDA()`)
- [x] T006 Sửa `index.html` (`#nvda-live-*`, `<output id="dining-last-score">`, `tabindex="0"` trên `#plate-items-list`) và `js/ui/keyboard-shortcuts.js` (chặn phím khi `<dialog open>`, `Enter` trong modal, phím `F` chuyển tab)
- [x] T007 Bổ sung kiểm thử hồi quy trong `tests/test_unit_modules.js` và `tests/test_mixing_table_and_a11y.js`
- [x] T008 Chạy `node --check`, toàn bộ test suite, HTTP smoke test `server.js`, và ghi nhật ký vào `GEMINI.md`
