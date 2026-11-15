# Tasks: Refactor Kiến Trúc Frontend Sang ES Modules (Issue #5)

**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Step 0: Specify
- [x] T001: Tạo hồ sơ Specify `specs/004-frontend-modular-refactor/` (`spec.md`, `plan.md`, `tasks.md`) và cập nhật `.specify/feature.json`

## Phase 1: Tách Game Data (`js/data/`) & Chuyển Entry Point `js/app.js`
- [x] T002: Tách 7 bộ dữ liệu từ `index.html` sang `js/data/{characters,fridge-categories,ingredients,stations,spices,garnishes,flavor-dimensions,index}.js`
- [x] T003: Chuyển phần script gameplay trong `index.html` sang `<script type="module" src="js/app.js"></script>`, cập nhật `tests/test_mixing_table_and_a11y.js` tương thích ES modules và kiểm thử PASS

## Phase 2: Tách Core State, Settings, Audio & Accessibility
- [x] T004: Tạo `js/core/state.js` và `js/core/settings.js`; kết nối `js/main-menu.js` và `js/app.js` dùng chung state/settings chuẩn
- [x] T005: Tạo `js/audio/sound-engine.js` và `js/accessibility/{nvda-announcer,dialog-manager,roving-navigation}.js` (gộp 2 hàm live region thành một)
- [x] T006: Kiểm thử sau Phase 2 (đảm bảo toàn bộ tests PASS)

## Phase 3: Tách Logic Nấu Ăn & Hóa Học Vị Giác (`js/cooking/`)
- [x] T007: Tách `js/cooking/{food-item,chemistry,tasting-review,plating}.js` hoàn toàn thuần logic không phụ thuộc DOM
- [x] T008: Tái cấu trúc `performStationAction` thành `js/cooking/station-actions.js` theo mô hình handler map + helper dùng chung
- [x] T009: Tạo `tests/test_unit_modules.js` kiểm thử trực tiếp các module thuần trong Node và chạy kiểm tra PASS 100%

## Phase 4: Tách UI Rendering, Canvas & Shortcuts (`js/ui/`)
- [x] T010: Tạo `js/ui/{dom-helpers,render-coordinator,kitchen-tabs,start-screen,fridge-view,workbench-view,staging-view,spices-view,dining-view,canvas-renderer,kitchen-modals,keyboard-shortcuts}.js`
- [x] T011: Thu gọn `js/app.js` thành file điều phối khởi tạo sạch sẽ và kiểm thử sau Phase 4

## Phase 5: Gia Cố Services, Native Dialogs, A11y & Hoàn Tất
- [x] T012: Gom helper dùng chung `js/services/mock-storage.js` cho `auth-service.js`, `community-service.js`, `admin-service.js`
- [x] T013: Tạo `js/ui/confirm-dialog.js` thay thế toàn bộ `window.confirm`/`window.prompt`/`alert` trong `js/main-menu.js`
- [x] T014: Dọn `role="dialog" aria-modal="true"` thừa trên 13 dialog Admin/Community, đồng bộ `hidden` trên các màn hình ẩn ở `index.html`/`main-menu.js`, kiểm tra các lỗi A11y còn lại
- [x] T015: Chạy lại toàn bộ test suites + kiểm tra tải ES modules qua `server.js`, cập nhật `GEMINI.md`
