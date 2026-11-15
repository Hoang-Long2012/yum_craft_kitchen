# Feature Specification: Sửa lỗi ghép danh sách nguyên liệu, nhãn dụng cụ và nút Khay Tạm

**Feature Branch**: `005-fix-mixing-list-station-staging-a11y`

**Created**: 2026-11-15

**Status**: Approved

**Input**: User description: "Sửa 3 lỗi: (1) Bàn trộn và các tên ghép nguyên liệu không dùng dấu '&' lặp chữ 'và' mà phân tách bằng dấu phẩy và đặt 'và' trước nguyên liệu cuối cùng; kiểm tra trùng lặp từ 'và'. (2) Tên các dụng cụ ở Bàn Chế Biến đọc theo dạng '<tên ngắn>: <tên đầy đủ>. <mô tả>' (không lặp tên trùng và không bỏ sót mô tả cho trình đọc màn hình). (3) Nút thao tác trong Khay Tạm (và Bếp) không lặp tiền tố 'Vào bếp:' / 'Ra khay:' gây đọc lặp từ."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tên hỗn hợp tại Bàn Trộn và các trạm ghép món đọc tự nhiên tiếng Việt (Priority: P1)

Khi người chơi kết hợp nhiều nguyên liệu tại Bàn Trộn Đa Năng (hoặc Máy Xay Sinh Tố, Trạm Pha Chế, Bàn Cuốn, Trạm Nhồi, gợi ý tên món), tên món ăn được ghép theo quy tắc liệt kê tự nhiên tiếng Việt: các nguyên liệu trước phân tách bằng dấu phẩy `,` và chữ `"và"` chỉ đứng trước nguyên liệu cuối cùng (với 2 nguyên liệu thì nối bằng `"và"`), không chứa ký tự `&` giữa các nguyên liệu để trình đọc màn hình không đọc lặp chữ `"và"` ở mọi phần tử.

**Why this priority**: Người chơi khiếm thị dùng NVDA nghe tên món ở Bàn Trộn và nhiều trạm ghép món rất thường xuyên; việc lặp chữ `"và"` liên tục giữa 4–20 nguyên liệu gây khó chịu và dài dòng.

**Independent Test**: Bỏ 6 nguyên liệu vào Bàn Trộn Đa Năng, thực hiện trộn đều, kiểm tra tên hỗn hợp và thông báo trả về có đúng dạng `"A, B, C, D, E và F (trộn đều)"` và không chứa `" & "` hay `"và và"`.

**Acceptance Scenarios**:

1. **Given** người chơi có 6 nguyên liệu trong Bàn Trộn Đa Năng (`Sữa tươi thanh trùng`, `Thanh Sô-cô-la Đen`, `Bánh quy Oreo kẹp kem`, `Bột Ca-cao nguyên chất`, `Kẹo Marshmallow xốp dẻo`, `Sữa đặc có đường`), **When** bấm `Trộn Đều Hỗn Hợp (C)`, **Then** tên món tạo thành là `"Sữa tươi thanh trùng, Thanh Sô-cô-la Đen, Bánh quy Oreo kẹp kem, Bột Ca-cao nguyên chất, Kẹo Marshmallow xốp dẻo và Sữa đặc có đường (trộn đều)"`.
2. **Given** người chơi có 2 nguyên liệu trong Bàn Trộn, Máy Xay, Trạm Pha Chế, Bàn Cuốn hoặc Trạm Nhồi, **When** thực hiện thao tác ghép/xay/pha/cuộn/nhồi, **Then** hai nguyên liệu được nối bằng `" và "` (không dùng `" & "`).
3. **Given** người chơi có từ 3 nguyên liệu trở lên ở các trạm nói trên hoặc dùng chức năng Gợi Ý Tên Món, **When** hệ thống tạo tên ghép, **Then** các phần tử đầu phân tách bằng `", "` và phần tử cuối nối bằng `" và "`, không có ký tự `" & "` hay lặp `"và và"`.

---

### User Story 2 - Nhãn và mô tả 18 dụng cụ tại Bàn Chế Biến đầy đủ, rõ ràng (Priority: P1)

Khi người chơi di chuyển qua danh sách 18 dụng cụ chế biến, trình đọc màn hình đọc đầy đủ tên ngắn, tên đầy đủ (khi khác tên ngắn) theo định dạng `<tên ngắn>: <tên đầy đủ>. <mô tả>` và kèm phần mô tả công dụng ở phía sau; với các dụng cụ mà tên ngắn trùng hoàn toàn với tên đầy đủ (số 14–17), không đọc lặp tên hai lần.

**Why this priority**: Sau khi cấu trúc lại mã nguồn, phần mô tả công dụng bị đẩy sang `title` khiến NVDA không đọc kèm khi duyệt nút dụng cụ, còn dấu `-` và tên trùng khiến trải nghiệm nghe bị thay đổi.

**Independent Test**: Render 18 nút dụng cụ trong Bàn Chế Biến và kiểm tra thuộc tính tên trợ năng (`aria-label`) của từng nút chứa tên hiển thị ở đầu (WCAG 2.5.3), dấu `:` giữa tên ngắn và tên đầy đủ (trừ mục trùng tên), và kết thúc bằng mô tả của dụng cụ đó.

**Acceptance Scenarios**:

1. **Given** dụng cụ số 5 (`shortName: "5. Nồi Luộc"`, `name: "Nồi Luộc & Hầm"`), **When** nút dụng cụ được render, **Then** tên trợ năng bắt đầu bằng `"5. Nồi Luộc: Nồi Luộc & Hầm. "` và tiếp nối bởi mô tả của Nồi Luộc.
2. **Given** dụng cụ số 14 (`shortName: "14. Nồi Áp Suất"`, `name: "Nồi Áp Suất"`), **When** nút dụng cụ được render, **Then** tên trợ năng là `"14. Nồi Áp Suất. <mô tả>"`, không lặp `"Nồi Áp Suất"` hai lần.

---

### User Story 3 - Nhãn nút hành động trong Khay Tạm và Bếp không đọc lặp từ (Priority: P1)

Khi người chơi duyệt các món trong Khay Tạm Chờ Sơ Chế hoặc danh sách nguyên liệu trong Bếp, nút đưa món vào bếp đọc gọn là `"Đưa <tên món> vào bếp hiện tại"` (không kéo thêm `"Vào bếp:"` ở đầu), và nút cất ra khay đọc gọn là `"Cất <tên món> ra khay tạm"` (không kéo thêm `"Ra khay:"` ở đầu), vẫn đảm bảo chứa nguyên văn chữ hiển thị trên nút theo WCAG 2.5.3.

**Why this priority**: Tiền tố `"Vào bếp:"` / `"Ra khay:"` khiến trình đọc màn hình đọc lặp cụm từ ở cả đầu và cuối câu trong thao tác diễn ra liên tục khi nấu ăn.

**Independent Test**: Render danh sách món ở Khay Tạm và ở Bếp, kiểm tra `aria-label` của nút `Vào bếp` và nút `Ra khay` không bắt đầu bằng tiền tố lặp lại, đồng thời vẫn chứa cụm `"vào bếp"` và `"ra khay"`.

**Acceptance Scenarios**:

1. **Given** một món có tên `"Trứng gà ta"` nằm trong Khay Tạm, **When** render nút `Vào bếp`, **Then** `aria-label` là `"Đưa Trứng gà ta vào bếp hiện tại"`.
2. **Given** một món có tên `"Trứng gà ta"` nằm trong Bếp, **When** render nút `Ra khay`, **Then** `aria-label` là `"Cất Trứng gà ta ra khay tạm"`.

### Edge Cases

- Trộn nối tiếp nhiều bước (ví dụ 10 hoặc 20 nguyên liệu, hoặc trộn thêm nguyên liệu vào hỗn hợp sẵn có): danh sách được làm phẳng trước khi nối bằng `formatNaturalList`, không tạo ra chuỗi lồng chữ `"và"` thừa.
- Tên món có ký tự đặc biệt HTML (`<`, `>`, `"`, `&`): vẫn được escape an toàn khi đưa vào `aria-label` ở UI.
- Không đưa bất kỳ công thức cố định nào vào mã nguồn (Zero Hardcoded Recipes).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST dùng chung hàm chuẩn hóa liệt kê tiếng Việt `formatNaturalList(items, 'và')` cho mọi nơi tạo tên món ghép nhiều nguyên liệu (Bàn Trộn Đa Năng, Máy Xay Sinh Tố, Trạm Pha Chế, Bàn Cuốn, Trạm Nhồi và Gợi Ý Tên Món).
- **FR-002**: Chuỗi tên món ghép và thông báo liên quan MUST không chứa dấu phân cách `" & "` giữa danh sách nguyên liệu và không sinh chuỗi `"và và"`.
- **FR-003**: Mỗi nút chọn dụng cụ trong Bàn Chế Biến MUST có tên trợ năng bắt đầu bằng `shortName`, nối `: ${name}` khi tên sau số thứ tự khác `name`, và kết thúc bằng `. ${desc}` (vẫn giữ `title = desc` cho người dùng chuột).
- **FR-004**: Nút `Vào bếp` trong Khay Tạm MUST có `aria-label` dạng `"Đưa <tên món> vào bếp hiện tại"` (không có tiền tố `"Vào bếp: "`), và nút `Ra khay` trong Bếp MUST có `aria-label` dạng `"Cất <tên món> ra khay tạm"` (không có tiền tố `"Ra khay: "`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% tên hỗn hợp từ 3 nguyên liệu trở lên tại Bàn Trộn, Máy Xay, Trạm Pha Chế, Bàn Cuốn, Trạm Nhồi và Gợi Ý Tên Món sử dụng dấu `", "` giữa các phần tử đầu và `" và "` trước phần tử cuối, không có `" & "`.
- **SC-002**: 18/18 nút dụng cụ ở Bàn Chế Biến có `aria-label` chứa mô tả đầy đủ ở cuối, khớp chuẩn WCAG 2.5.3 (bắt đầu bằng nhãn hiển thị `shortName`), không lặp tên ở các mục 14–17.
- **SC-003**: 100% nút `Vào bếp` và `Ra khay` không lặp tiền tố và vẫn đạt WCAG 2.5.3; toàn bộ unit test và test trợ năng đạt 100% PASS.

## Assumptions

- Trò chơi giữ nguyên phong cách sandbox tự do không công thức cứng và ưu tiên đọc tự nhiên trên NVDA tiếng Việt.
- Ký tự `&` nằm trong tên gốc của một dụng cụ đơn lẻ (như `Nồi Luộc & Hầm`) được giữ nguyên theo dữ liệu dụng cụ vì chỉ nối 2 vế và NVDA đọc tự nhiên là `"Nồi Luộc và Hầm"`.
