# Feature Specification: Refactor Kiến Trúc Frontend Sang ES Modules & Gia Cố Ổn Định (Issue #5)

**Feature Branch**: `004-frontend-modular-refactor`  
**Created**: 2026-11-15  
**Status**: Approved for Implementation  
**Input**: Triển khai đề xuất refactor kiến trúc frontend từ GitHub Issue `yum_craft_kitchen#5` theo lộ trình 5 Phase (Vanilla JS + ES Modules không build step), tách toàn bộ dữ liệu game, trạng thái, âm thanh, trợ năng, logic nấu ăn/hóa học vị giác, giao diện và dịch vụ ra khỏi `index.html`, đồng thời xử lý các điểm gây mất ổn định đã kiểm toán.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tách Toàn Bộ Game Data & Logic Khỏi `index.html` Sang ES Modules (Priority: P1)

Toàn bộ dữ liệu tĩnh (`CHARACTERS`, `FRIDGE_CATEGORIES`, `INGREDIENTS`, `STATIONS`, `SPICES`, `GARNISH_OPTIONS`, `FLAVOR_DIMENSIONS`), trạng thái lõi (`state`, `settings`), hệ thống âm thanh (`sound-engine`), trợ năng (`nvda-announcer`, `dialog-manager`, `roving-navigation`), nghiệp vụ nấu ăn/cảm quan (`cooking/`), và lớp giao diện (`ui/`) được tổ chức thành các ES modules có trách nhiệm đơn lẻ trong thư mục `js/`. `index.html` chỉ giữ HTML markup và CSS, nạp module qua `<script type="module">`.

**Why this priority**: Giảm quy mô `index.html` từ >10.000 dòng xuống chỉ còn phần markup (~2.100 dòng), giúp bảo trì, review PR và kiểm thử độc lập từng module mà không phụ thuộc DOM hay regex trích `<script>`.

**Independent Test**:
- Chạy `node tests/test_mixing_table_and_a11y.js` và bộ unit test module thuần `node tests/test_unit_modules.js` đạt 100% PASS.
- Chạy `node server.js` và kiểm tra trình duyệt (qua HTTP) tải đầy đủ mọi ES module không lỗi `404`, `SyntaxError` hay `ReferenceError`.

### User Story 2 - Loại Bỏ Coupling Ẩn `window.*` & Gia Cố Các Điểm Mất Ổn Định (Priority: P1)

Xóa bỏ các cầu nối toàn cục mong manh giữa `index.html` và `js/main-menu.js`, đồng nhất luồng cấu hình, thông báo NVDA, hộp thoại xác nhận, và bảo vệ render HTML khỏi XSS:
- Dùng chung `js/core/state.js` và `js/core/settings.js` (thay cho việc `index.html` và `js/main-menu.js` đọc/ghi `localStorage` riêng và sửa `window.state`).
- Gộp `announceNVDA()` và `announceToScreenReader()` về một module `js/accessibility/nvda-announcer.js` duy nhất có `clearTimeout` chống xung đột buffer.
- Chia nhỏ `performStationAction` (~833 dòng) thành bảng handler theo loại dụng cụ (`js/cooking/station-actions.js`) với helper làm phẳng `subItems` và bảo toàn gia vị/lịch sử dùng chung.
- Thay thế `window.confirm()`, `window.prompt()`, `alert()` trong `js/main-menu.js` bằng `<dialog>` xác nhận/nhập liệu hỗ trợ bàn phím & NVDA (`js/ui/confirm-dialog.js`).
- Gom `getMockUsers`/`saveMockUsers` trùng lặp giữa 3 file service về `js/services/mock-storage.js`.
- Chuẩn hóa tạo DOM an toàn (ưu tiên `textContent` / escape HTML) cho dữ liệu động do người chơi nhập hoặc từ cộng đồng.
- Dọn `role="dialog"` / `aria-modal="true"` dư thừa trên các `<dialog>` Admin/Community, đồng bộ thuộc tính `hidden` cho các màn hình ẩn để tại một thời điểm chỉ có 1 `<main>` và 1 `<h1>` hiển thị trong accessibility tree, và hoàn thiện các sửa lỗi khả năng dùng bàn phím/screen reader tương thích bộ test hiện có.

### Edge Cases

- Trộn hoặc xay 4–20+ nguyên liệu liên tiếp vẫn phải hiển thị đầy đủ 100% tên nguyên liệu, không cắt `(+N)`, không có công thức cứng (Zero Hardcoded Recipes).
- Các hành vi NVDA, phím tắt `Alt+1..5` và phím tắt đơn ký tự (tuân thủ `singleKeyShortcutsEnabled`), khôi phục focus khi đóng `<dialog>` bằng `Esc` hoặc nút đóng phải giữ nguyên 100%.
- Không sử dụng bất kỳ bundler/framework ngoài nào; chạy trực tiếp trên `node server.js` (`Chay_Game.bat`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Tách toàn bộ 7 bộ dữ liệu game vào `js/data/` với barrel export `js/data/index.js`.
- **FR-002**: Tách `js/core/state.js`, `js/core/settings.js`, `js/audio/sound-engine.js`, `js/accessibility/*`.
- **FR-003**: Tách nghiệp vụ nấu ăn và hóa học vị giác vào `js/cooking/` hoàn toàn độc lập với DOM (`document`/`window`), chia nhỏ `performStationAction` theo handler map.
- **FR-004**: Tách toàn bộ UI rendering, canvas animation, event binding và keyboard shortcuts vào `js/ui/` và `js/app.js`; loại bỏ inline `<script>` khỏi `index.html`.
- **FR-005**: Gom `js/services/mock-storage.js`, thay `confirm`/`prompt`/`alert` đồng bộ bằng `<dialog>` truy cập được, sửa `<dialog>` & landmark `<main>`/`<h1>` trong `index.html`.
- **FR-006**: Cập nhật `tests/test_mixing_table_and_a11y.js` và bổ sung `tests/test_unit_modules.js` kiểm thử trực tiếp các ES module không cần giả lập VM trích regex `<script>`.

## Success Criteria *(mandatory)*

- **SC-001**: `index.html` không còn inline `<script>` nghiệp vụ; toàn bộ logic nằm trong các module có trách nhiệm rõ ràng dưới `js/`.
- **SC-002**: 100% bài test trong `tests/test_unit_modules.js` và `tests/test_mixing_table_and_a11y.js` PASS sau từng Phase và ở bản cuối cùng.
- **SC-003**: Toàn bộ route/module JS được phục vụ hợp lệ bởi `server.js` (HTTP 200), không có lỗi cú pháp hay vòng lặp phụ thuộc (circular dependency crash).
