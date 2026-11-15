# Implementation Plan: Refactor Kiến Trúc Frontend Sang ES Modules (Issue #5)

**Branch**: `004-frontend-modular-refactor` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

## Summary

Tái cấu trúc toàn bộ frontend của YumCraft Kitchen từ một inline `<script>` ~7.877 dòng trong `index.html` sang kiến trúc Vanilla ES Modules phân lớp rõ ràng (`data/`, `core/`, `audio/`, `accessibility/`, `cooking/`, `ui/`, `services/`), kết hợp gia cố 7 điểm bất ổn đã kiểm toán và giữ nguyên 100% tính năng, triết lý Zero Hardcoded Recipes và chuẩn trợ năng NVDA/WCAG 2.2.

## Technical Context

- **Language/Version**: HTML5, Vanilla JavaScript (ES Modules), Tailwind CSS
- **Runtime**: Trình duyệt hiện đại phục vụ qua `server.js` (không build step); kiểm thử bằng Node.js `v25.7.0` native ESM
- **Constraints**:
  - Giữ nguyên toàn bộ hành vi hiện tại của game, phím tắt, âm thanh, NVDA announcements và Zero Hardcoded Recipes.
  - Không làm hỏng bất kỳ bài test nào từ các phiên trước (`test_mixing_table_and_a11y.js` 15/15).
  - Các module trong `js/data/` và `js/cooking/` không được phụ thuộc vào `document` hay `window`.

## Execution Phases

1. **Phase 1 — Data Extraction (`js/data/`)**:
   - Tạo `characters.js`, `fridge-categories.js`, `ingredients.js`, `stations.js`, `spices.js`, `garnishes.js`, `flavor-dimensions.js`, `index.js`.
   - Di chuyển inline `<script>` sang `js/app.js` (dùng `<script type="module" src="js/app.js"></script>`), giữ `index.html` gọn sạch phần markup và kiểm chứng test pass.
2. **Phase 2 — Core State, Settings, Audio & Accessibility (`js/core/`, `js/audio/`, `js/accessibility/`)**:
   - Tạo `core/state.js`, `core/settings.js` (dùng chung cho cả `app.js` và `main-menu.js`, bỏ đọc trùng `localStorage` và giảm phụ thuộc `window.state`).
   - Tạo `audio/sound-engine.js`, `accessibility/nvda-announcer.js` (gộp `announceNVDA` & `announceToScreenReader`), `accessibility/dialog-manager.js`, `accessibility/roving-navigation.js`.
3. **Phase 3 — Pure Cooking & Culinary Chemistry (`js/cooking/`)**:
   - Tạo `cooking/food-item.js`, `cooking/chemistry.js`, `cooking/tasting-review.js`, `cooking/plating.js`, `cooking/station-actions.js` (chia nhỏ `performStationAction` thành handler map sạch sẽ, loại bỏ code trùng lặp).
   - Bổ sung `tests/test_unit_modules.js` kiểm thử trực tiếp các module `data/` và `cooking/` trong Node.js thuần không cần DOM.
4. **Phase 4 — UI Rendering, Canvas & Events (`js/ui/`)**:
   - Tách `ui/dom-helpers.js` (tạo node an toàn, chống XSS), `ui/fridge-view.js`, `ui/workbench-view.js`, `ui/staging-view.js`, `ui/spices-view.js`, `ui/dining-view.js`, `ui/canvas-renderer.js`, `ui/kitchen-modals.js`, `ui/keyboard-shortcuts.js`.
   - `js/app.js` trở thành entry point gọn nhẹ kết nối các module.
5. **Phase 5 — Services Cleanup, Native Dialogs & A11y Polish (`js/services/`, `js/ui/confirm-dialog.js`, `index.html`, `js/main-menu.js`)**:
   - Tạo `js/services/mock-storage.js` dùng chung cho `auth-service.js`, `community-service.js`, `admin-service.js` (giữ file cũ ở `js/` hoặc tổ chức rõ ràng, cập nhật import).
   - Thay `window.confirm` / `window.prompt` / `alert` trong `js/main-menu.js` bằng `ui/confirm-dialog.js` dùng `<dialog>`.
   - Xóa `role="dialog" aria-modal="true"` dư thừa trên 13 `<dialog>` Admin/Community/MOTD trong `index.html`; đồng bộ thuộc tính `hidden` khi chuyển giữa 4 màn hình để mỗi lúc chỉ có 1 `<main>` hiển thị trong accessibility tree; rà soát lại các tiêu chí trong `WEB-ACCESSIBILITY-AUDIT.md`.
   - Chạy toàn bộ test suite (`test_unit_modules.js`, `test_mixing_table_and_a11y.js`, `test_thanh_hoa_and_offal_ingredients.js` nếu có, và kiểm tra HTTP qua `server.js`).
