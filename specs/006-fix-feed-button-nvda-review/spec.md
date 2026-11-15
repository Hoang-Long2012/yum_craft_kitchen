# Feature Specification: Khắc phục kẹt nút đút ăn, mất âm thanh cảm xúc & lỗi đọc đánh giá NVDA sau tách ES Modules

**Feature Branch**: `006-fix-feed-button-nvda-review`

**Created**: 2026-11-16

**Status**: Approved

**Input**: Người dùng báo cáo sau các commit tách ES Modules (`ca457d6`) và sửa ghép danh sách nguyên liệu (`27cd27c`), khi cho thực khách ăn một số món (ví dụ đậu hủ, đậu phộng, hẹ, rau muống trộn đều, nêm gia vị rồi nấu), tiếng nhai phát xong thì im bặt: không phát âm thanh cảm xúc nhân vật, không đọc đánh giá qua NVDA, và nút đút ăn kẹt mãi ở trạng thái `"ĐANG THƯỞNG THỨC MÓN ĂN... 😋"`; trong khi các món đơn giản/cân bằng hơn vẫn hoạt động bình thường.

## Root Cause Summary

1. **Lỗi `ReferenceError` tại `js/cooking/tasting-review.js`**:
   - Khi tách từ `index.html` sang ES Module ở commit `ca457d6`, 8 lệnh gọi `playSoundEffect('react_bad')` (tại các nhánh thịt sống, cháy khét, mặn chát `> 6.0`, cay vượt ngưỡng `maxSpiceTolerance` của cả đánh giá 1 món lẫn thực đơn nhiều món) và 1 lần đọc `state.customDishName` (dòng `336`) vẫn sót lại mà không import `playSoundEffect` hay `state`.
   - Khi món ăn rơi vào một trong các nhánh phản ứng cực đoan nói trên (hoặc không có `dishNameOverride`), `generateSensoryTastingReview` / `generateMultiDishTastingReview` ném `ReferenceError` ngay sau khi `feedCharacter()` phát xong tiếng nhai (`playExternalAudio`).
   - Hệ quả: `feedCharacter()` bị ngắt giữa chừng trước khi phát âm thanh cảm xúc (`react_*`), trước khi khôi phục `state.isFeedingBusy` và nút `#btn-master-feed`, và trước khi gọi `announceNVDA`.
2. **Thiếu bảo vệ phục hồi & rào cản trợ năng WCAG 2.2 ở `dining-view.js`, `nvda-announcer.js`, `sound-engine.js`, `keyboard-shortcuts.js`, `index.html`**:
   - `feedCharacter()` thiếu khối `try ... catch ... finally`.
   - `feedBtn.disabled = true` và `aria-busy="true"` làm mất focus bàn phím/NVDA khi đang đút ăn; `renderServingPlate()` ghi đè `#master-feed-label` vô điều kiện kể cả khi `state.isFeedingBusy === true`; `announceNVDA()` chạy trước `renderAll()`.
   - `nvda-announcer.js` dùng chung một `state.liveRegionTimer` cho cả 2 kênh `polite` và `assertive`; các vùng `#nvda-live-*` dùng thừa `role="alert"/"status"` đè `aria-live`.
   - `AudioContext.resume()` chưa được kích hoạt sớm trong gesture người dùng của `feedCharacter()`.
   - `Enter` trong `#modal-finish-dish` cướp sự kiện nút Hủy/Đóng; phím nóng nền chưa chặn khi `<dialog open>` mở; phím `F` chưa chuyển tab `dining` khi nhấn từ tab khác; `#dining-last-score` là `<strong>` thay vì `<output>`; `#plate-items-list` thiếu `tabindex="0"`.

## User Scenarios & Testing

### User Story 1 - Mọi món ăn (kể cả mặn, cay, cháy, sống hoặc nhiều nguyên liệu) đều đánh giá & phát âm thanh cảm xúc đầy đủ (Priority: P1)

Khi người chơi chế biến bất kỳ tổ hợp nguyên liệu/gia vị/dụng cụ nào (Zero Hardcoded Recipes) và đút cho thực khách ăn, sau khi tiếng nhai kết thúc, hệ thống luôn tính toán nhận xét, phát đúng âm thanh cảm xúc (`react_love` / `react_good` / `react_bad`), hiển thị nhận xét và khôi phục nút đút ăn hoàn chỉnh.

**Acceptance Scenarios**:
1. **Given** đĩa có món mặn chát (`f.salty > 6.0`), cay vượt ngưỡng (`f.spicy > maxSpiceTolerance`), cháy (`hasBurnt`), thịt sống (`hasRawMeat`), hoặc tổ hợp `đậu hủ + đậu phộng + hẹ + rau muống` trộn đều + nêm gia vị + nấu, **When** gọi `feedCharacter()`, **Then** không phát sinh `ReferenceError`, phát đúng `react_bad`/`react_good`/`react_love`, cập nhật `#dining-speech-bubble`, và khôi phục `state.isFeedingBusy = false` cùng nút `#btn-master-feed`.
2. **Given** phát sinh lỗi bất ngờ trong quá trình đánh giá hoặc phát âm thanh, **When** `feedCharacter()` kết thúc khối `finally`, **Then** `state.isFeedingBusy` trở về `false`, nút `#btn-master-feed` mở khóa lại với nhãn bình thường và NVDA nhận thông báo rõ ràng.

### User Story 2 - Giữ Focus Nút Đút Ăn, Đọc NVDA Kịp Thời & Tuân Thủ WCAG 2.2 (Priority: P1)

Khi người chơi bấm `#btn-master-feed` hoặc nhấn phím `F` từ bất kỳ tab bếp nào, focus không bị rơi khỏi nút, kênh thông báo `polite` không bị `assertive` hủy mất, và modal/landmark giữ nguyên ngữ nghĩa chuẩn.

**Acceptance Scenarios**:
1. **Given** focus đang ở `#btn-master-feed` và người chơi kích hoạt đút ăn, **When** món đang được thưởng thức, **Then** `#btn-master-feed` dùng `aria-disabled="true"` (giữ `disabled = false`, không đặt `aria-busy="true"`), nhãn đổi sang trạng thái đang ăn/uống mà không bị `renderServingPlate()` ghi đè, và vẫn giữ nguyên focus trên `#btn-master-feed`.
2. **Given** `announceNVDA()` được gọi trên kênh `assertive` rồi ngay sau đó trên kênh `polite` (hoặc ngược lại), **When** xử lý timer 60ms, **Then** hai kênh sử dụng timer độc lập nên không hủy nhầm thông báo của nhau.
3. **Given** người chơi ở tab Tủ Lạnh/Bếp/Khay Tạm/Gia Vị và nhấn phím `F` (khi không mở modal), **When** xử lý phím tắt, **Then** chuyển sang tab Bàn Tiệc (`dining`) và thực hiện `feedCharacter()`.
