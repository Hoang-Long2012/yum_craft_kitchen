# Implementation Plan: Sửa lỗi ghép danh sách nguyên liệu, nhãn dụng cụ và nút Khay Tạm

**Branch**: `005-fix-mixing-list-station-staging-a11y` | **Date**: 2026-11-15 | **Spec**: [spec.md](file:///C:/Users/LCBoy/Desktop/data/web/yum_craft_kitchen/specs/005-fix-mixing-list-station-staging-a11y/spec.md)

## Summary

Chuẩn hóa định dạng liệt kê danh sách nguyên liệu tiếng Việt (`"A, B và C"`) trên toàn bộ hệ thống chế biến món ăn (`station-actions.js`, `chemistry.js`, `food-item.js`, `tasting-review.js`) và chỉnh sửa `aria-label` cho 18 nút dụng cụ (`workbench-view.js`) cùng nút `Vào bếp` / `Ra khay` (`staging-view.js`, `workbench-view.js`) để NVDA đọc tự nhiên, đầy đủ mô tả mà vẫn tuân thủ WCAG 2.5.3 (Label in Name).

## Technical Context

- **Runtime**: Vanilla JS ES Modules (không bundler), Node.js test harness (`tests/test_unit_modules.js`, `tests/test_mixing_table_and_a11y.js`).
- **Accessibility Guidance**: Áp dụng `modern-web-guidance` (`accessibility`: WCAG 2.5.3 Label in Name, Accessible Names & Descriptions) và `accessibility-lead` specialist verification.

## Implementation Design

1. **Shared Vietnamese List Formatter (`js/cooking/food-item.js` & `js/cooking/tasting-review.js`)**:
   - Đặt hàm `formatNaturalList(items, conjunction = 'và')` trong `js/cooking/food-item.js` (nơi mọi module nấu ăn đều import, tránh phụ thuộc vòng) và re-export lại từ `js/cooking/tasting-review.js` để bảo toàn API hiện có.
   - Thay toàn bộ `.join(' & ')` trong `js/cooking/station-actions.js` (`handleRollAction`, `handleStuffAction`, `handleBlendAction`, `handleBeverageAction`, `handleMixAction`) và `js/cooking/chemistry.js` (`generateSmartDishTitle`) sang `formatNaturalList(..., 'và')` (riêng `methodLabel` đa bước của Trạm Pha Chế dùng `' ➔ '` đồng bộ với Bàn Trộn).
2. **Station Accessible Names (`js/ui/workbench-view.js`)**:
   - Tạo helper `formatStationAriaLabel(st)` gọn rõ: tách phần tên sau số thứ tự (`st.shortName.replace(/^\d+\.\s*/, '')`), nếu giống `st.name` thì trả về `` `${st.shortName}. ${st.desc}` ``, ngược lại trả về `` `${st.shortName}: ${st.name}. ${st.desc}` ``.
3. **Staging & Station Transfer Buttons (`js/ui/staging-view.js` & `js/ui/workbench-view.js`)**:
   - Đổi `aria-label` của nút `Vào bếp` thành `` `Đưa ${escapeHtml(it.name)} vào bếp hiện tại` ``.
   - Đổi `aria-label` của nút `Ra khay` thành `` `Cất ${escapeHtml(it.name)} ra khay tạm` ``.
4. **Tests (`tests/test_mixing_table_and_a11y.js`, `tests/test_unit_modules.js`)**:
   - Cập nhật T14 theo nhãn mới (vẫn kiểm chứng WCAG 2.5.3 chứa `"ra khay"` / `"vào bếp"` và 18 nút dụng cụ chứa mô tả + dấu `:`).
   - Bổ sung kiểm thử 2, 3, 6 nguyên liệu cho `mixing_table`, `blend_smooth`, `beverage_station`, `rolling_mat`, `stuffing_station`, và `generateSmartDishTitle`.
