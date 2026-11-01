# NGUYÊN TẮC THIẾT KẾ CỐT LÕI — YUMCRAFT KITCHEN

> [!IMPORTANT]
> **TRIẾT LÝ NẤU BẾP TỰ DO (TOCA KITCHEN SANDBOX PHILOSOPHY)**
> 1. **Hoàn Toàn Không Có Công Thức Cố Định (Zero Hardcoded Recipes)**: YumCraft Kitchen là trò chơi nấu ăn mô phỏng tự do theo phong cách Toca Kitchen. Người chơi là bếp trưởng sáng tạo tuyệt đối, được quyền kết hợp bất kỳ nguyên liệu, dụng cụ và gia vị nào với nhau mà không bị trói buộc bởi bất kỳ công thức sách giáo khoa cứng nhắc nào.
> 2. **Hóa Học Vị Giác Cảm Quan Động (Dynamic Sensory Chemistry)**: Hệ thống đánh giá dựa trên các định luật vật lý và hóa học vị giác thực tế (Umami, Mặn, Ngọt, Chua, Cay, Béo, Đắng, Thơm, Giòn), phản ánh trung thực những gì người chơi vừa thực sự chế biến và nêm nếm. Tuyệt đối không gán ghép các nhãn hương vị tĩnh hoặc tự ý suy đoán nguyên liệu không có trong món ăn.
> 3. **Nhận Xét Của Thực Khách Sinh Động & Chân Thực (Living Character Critique)**: Khi thưởng thức, nhân vật sẽ miêu tả chi tiết cảm giác vị giác, kết cấu món ăn (nướng, luộc, chiên, cuộn, nhồi...) và mùi vị của các loại gia vị người chơi đã nêm, phản ánh đúng gu thưởng thức và biểu cảm của từng thực khách.
> 4. **Trợ Năng Toàn Diện Chuẩn Quốc Tế (WCAG AA/AAA & NVDA First)**: Mọi tương tác, cảm giác vị giác và diễn biến nấu nướng đều phải được truyền tải hoàn hảo, tự nhiên và liền mạch đến người chơi khiếm thị thông qua NVDA và bàn phím.
>5 ** không được đưa vào bất kỳ công thức cứng nhắt nào trong code, vì đây là game nấu ăn tự gio, không phải game nấu ăn theo công thức xách giáo khoa
---

# NHẬT KÝ DỰ ÁN — YUMCRAFT KITCHEN

## 1. Thông Tin Phiên Làm Việc Mới Nhất
- **Ngày thực hiện**: 01/11/2026 (Phiên Thiết Kế Lại Hộp Thoại Full Màn Hình, Mở Rộng Bảng Quản Trị & Chuẩn Hóa Nút Quay Lại Góc Trên Bên Trái)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu hoàn thành**:
  1. **Thiết kế Full Màn Hình 100% (`100vw x 100dvh`) cho `🌐 Cộng Đồng Đầu Bếp` (`#modal-community-hub`) và `🏆 Bảng Xếp Hạng` (`#modal-leaderboard`)**:
     - Xây dựng class `.dialog-fullscreen` ghi đè triệt để giới hạn `max-width`/`max-height` mặc định của trình duyệt trên thẻ `<dialog>`, giúp hai hộp thoại bung toàn màn hình 100% từ cạnh tới cạnh.
     - Vùng danh sách bài đăng cộng đồng (`#community-dishes-list`) hiển thị dạng lưới 2 cột rộng rãi trên màn hình lớn (`grid-cols-1 lg:grid-cols-2`), tận dụng tối đa diện tích hiển thị mà vẫn giữ nguyên cấu trúc thẻ `<article>` và Heading `<h3>` chuẩn trợ năng NVDA.
     - Vùng danh sách Top 100 đầu bếp (`#leaderboard-list`) co giãn toàn bộ chiều cao còn lại (`flex-1 overflow-y-auto`), các thẻ xếp hạng được làm lớn, rõ ràng và giữ nguyên 100% định dạng câu đọc chuẩn NVDA trong `<h3>`.
  2. **Chuyển nút `⬅️ Quay lại` lên trên đầu, góc trên bên trái (Top-Left Header)**:
     - Loại bỏ thanh Footer chứa nút Quay lại ở dưới đáy của **Cộng Đồng Đầu Bếp** và **Bảng Xếp Hạng**.
     - Đưa nút **`⬅️ Quay lại Menu Chính`** (`#btn-back-from-community` và `#btn-back-from-leaderboard`) lên **đầu tiên ở góc trên bên trái** trong thanh Header cố định (`<header>`), nằm trước tiêu đề `<h2>` và danh sách nội dung.
     - Khi mở hộp thoại, focus được đặt ngay tại nút Quay lại ở đầu trang, giúp người dùng NVDA không còn bị nhảy xuống đáy hộp thoại mà có thể bấm mũi tên xuống hoặc phím `H`/`3` để duyệt xuôi từ đầu trang xuống danh sách món ăn / bảng xếp hạng một cách tự nhiên.
  3. **Mở rộng kích thước lớn (`.dialog-xl` & `.dialog-lg`) và đồng bộ nút Quay lại Góc Trên Bên Trái cho hệ thống `🛡️ Bảng Quản Trị` & `🔍 Xem Chi Tiết`**:
     - `#modal-admin-panel` (Bảng Quản Trị Máy Chủ): Mở rộng lên `.dialog-xl` (`96vw`, tối đa `1200px`), bố trí 5 chức năng quản trị theo lưới 2 cột (`md:grid-cols-2`) rộng thoáng, nút **`⬅️ Quay Lại Menu Chính`** nằm ở góc trên bên trái.
     - `#modal-admin-users` (Danh sách tài khoản) & `#modal-admin-community` (Quản lý cộng đồng): Mở rộng lên `.dialog-xl` với chiều cao `90vh`, vùng danh sách cuộn tự động co giãn `flex-1`, nút **`⬅️ Quay lại Bảng Quản Trị`** đặt ở góc trên bên trái.
     - `#modal-admin-user-action`, `#modal-admin-motd`, `#modal-motd-broadcast` và `#modal-community-dish-detail` (Xem chi tiết món ăn): Mở rộng lên `.dialog-lg` (`94vw`, tối đa `960px`), đưa nút Quay lại / Đóng lên góc trên bên trái.
  4. **Kiểm thử tự động**:
     - Xác minh toàn bộ 11 tiêu chí cấu trúc DOM, CSS Fullscreen, thứ tự nút Quay lại góc trên bên trái và cú pháp JavaScript đạt **100% PASS**.

---

## 2. Thông Tin Phiên Làm Việc Trước (01/11/2026 - Xây Dựng Cộng Đồng & Bảng Xếp Hạng)
- **Ngày thực hiện**: 01/11/2026 (Phiên Xây Dựng Hệ Thống Cộng Đồng Đầu Bếp, Bảng Xếp Hạng Top 100 & Quản Trị Cộng Đồng / Xếp Hạng)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu hoàn thành**:
  1. **Xây dựng module dịch vụ Cộng Đồng & Bảng Xếp Hạng (`js/community-service.js` & mở rộng `js/admin-service.js`)**:
     - `formatCommunityMealHeading(dishes)`:
       - Nếu chỉ có **1 món ăn**: Hiện thẳng tên món ăn đó lên.
       - Nếu bày **nhiều món ăn** (hiểu là bữa ăn): Hiển thị đầy đủ toàn bộ tên các món ăn trên dĩa dù 2, 10, 20 hay 100 món, ngăn cách bằng dấu phẩy và món cuối cùng nối bằng `, và `: `"Bữa ăn với: tên món 1, tên món 2, tên món 3, tên món 4, và tên món 5"`.
     - `publishMealToCommunity(mealPayload, chefProfile)`:
       - Lưu tác phẩm món ăn / bữa ăn vào Firestore collection `community_dishes` (và đồng bộ LocalStorage).
       - Lấy **Điểm hài lòng (`satisfactionScore`)** cộng dồn vào **Tổng điểm (`totalScore`)** của người chơi trong Firestore `users/{uid}` để hiển thị lên Bảng Xếp Hạng.
     - `getCommunityDishes()`: Tải toàn bộ món ăn và bữa ăn do người chơi làm ra, sắp xếp từ mới nhất.
     - `getLeaderboardTop100()`: Tải danh sách những đầu bếp nấu ăn ngon nhất có điểm `totalScore > 0`, sắp xếp giảm dần theo điểm số (cao nhất đứng đầu), giới hạn **tối đa 100 đầu bếp (`slice(0, 100)`)**. Người đứng top cuối (Hạng 100) nếu bị một người chơi nhiều điểm hơn vượt qua sẽ tự động bị đẩy ra khỏi Bảng Xếp Hạng.
     - `deleteCommunityDish(dishId)`, `deleteAllCommunityDishes()`, `resetLeaderboardScores()`: Các hàm dành cho Quản trị viên xóa 1 bài bất kỳ, xóa tất cả bài trên cộng đồng, và đặt lại Bảng Xếp Hạng về trống.
  2. **Nút nổi bật `🌐 Đưa Lên Cộng Đồng` & Hộp thoại xác nhận tại Bàn Tiệc (`index.html` & `js/main-menu.js`)**:
     - Ngay sau khi thực khách ăn xong và đưa ra đánh giá, nút nổi bật **`🌐 Đưa Lên Cộng Đồng`** (`#btn-share-to-community`) xuất hiện ở ngay dưới khung lời nhận xét & điểm hài lòng.
     - Khi ấn vào, hiển thị hộp thoại xác nhận (`#modal-confirm-share-community`): *"Bạn có muốn đưa lên cộng đồng đầu bếp không?"*.
     - Khi nhấn **Xác nhận**: Đưa món ăn / bữa ăn lên Cộng Đồng Đầu Bếp, cộng điểm hài lòng vào tổng điểm xếp hạng của người chơi, và **nút "Đưa lên cộng đồng" lập tức biến mất (reset)** cho đến khi người chơi bày ra bữa ăn mới và khách ăn xong đánh giá lại.
  3. **Trang `🌐 Cộng Đồng Đầu Bếp` & Hộp thoại `🔍 Xem Chi Tiết` ngoài Menu Chính (`index.html` & `js/main-menu.js`)**:
     - Tích hợp nút **`🌐 Cộng đồng đầu bếp`** (`#btn-menu-community`) trên Menu Chính.
     - Mỗi bài đăng được chia **Heading `<h3>`** chuẩn trợ năng NVDA:
       - Đầu tiên là **Heading tên món ăn** (hoặc `Bữa ăn với: tên món 1, ..., và tên món N`).
       - Ở dưới hiện **Tên người chơi** (`Người chơi: [Tên hiển thị]`).
       - Ở dưới nữa hiện **`Được sản xuất bởi: [Tên nhà bếp]`**.
       - Kèm nút **`🔍 Xem chi tiết`** để mở hộp thoại `#modal-community-dish-detail`.
     - Trong hộp thoại **Xem chi tiết**:
       - Đầu tiên: Hiển thị **Danh sách những món ăn có trên cái dĩa** được người chơi đưa lên cộng đồng.
       - Sau đó: Hiển thị **Đánh giá của khách hàng** và **Điểm hài lòng**.
       - Ấn nút **Đóng (Close)** hoặc phím **Escape** thoát hộp thoại và trả focus chuẩn xác.
  4. **Mục `🏆 Bảng Xếp Hạng` ngoài Menu Chính (`index.html` & `js/main-menu.js`)**:
     - Tích hợp nút **`🏆 Bảng xếp hạng`** (`#btn-menu-leaderboard`) trên Menu Chính.
     - Hiển thị Top những đầu bếp nấu ăn ngon nhất (tối đa 100 người, điểm cao nhất đứng đầu) theo đúng cấu trúc:
       **`Hạng [Số hạng]: [Tên đầu bếp], đến từ: [Tên nhà bếp], có [Số điểm] điểm`**
     - Khi bảng xếp hạng trống (hoặc vừa được Admin đặt lại), hiển thị rõ câu: **`"Chưa có ai trong bảng xếp hạng này."`**
     - Có nút **`⬅️ Quay lại`** (và hỗ trợ Escape) để quay về Menu Chính.
  5. **Tính năng Quản Lý Cộng Đồng & Đặt Lại Bảng Xếp Hạng trong Bảng Quản Trị (`#modal-admin-panel`)**:
     - **`🌐 Quản lý cộng đồng`** (`#modal-admin-community`): Hiển thị toàn bộ những món ăn được đăng lên cộng đồng, có **ô tìm kiếm nhanh** (`#admin-search-community`), ở đầu có nút **`🗑️ Xóa tất cả`**, và ở từng món ăn có nút xóa riêng **`🗑️ Xóa [Tên món ăn]`**.
     - **`🏆 Đặt lại bảng xếp hạng`** (`#btn-admin-reset-leaderboard`): Đưa toàn bộ điểm xếp hạng về 0 để làm trống Bảng Xếp Hạng.
  6. **Kiểm thử tự động toàn diện**:
     - Xây dựng và chạy bộ kiểm thử `tests/test_community_leaderboard.js` đạt kết quả tuyệt đối **10/10 BÀI TEST ĐẠT (100% PASS)**.

---

## 2. Thông Tin Phiên Làm Việc Trước (31/10/2026)
- **Ngày thực hiện**: 31/10/2026 (Phiên Nâng Cấp Hệ Thống Bảng Quản Trị Máy Chủ & Thông Báo Trong Ngày - MOTD)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu hoàn thành**:
  1. **Định danh Root Admin tối cao `lc_boy` (chữ thường 100%, không hoa)**:
     - Khóa cứng chuỗi chính xác tuyệt đối: `ROOT_ADMIN_USERNAME = "lc_boy"`.
     - Cơ chế chống mạo danh: Chặn đứng bất kỳ ai cố tình đăng ký biến thể hoa/thường (`LC_Boy`, `Lc_Boy`, `lc_Boy`, `LC_BOY`...).
     - Bất khả xâm phạm: Không ai (kể cả admin khác) có quyền tước quyền, cấm nick, cấm IP hay xóa tài khoản `lc_boy`.
  2. **Hiển thị có điều kiện nút `🛡️ Bảng Quản Trị` trên Menu Chính**:
     - Tích hợp nút `#btn-menu-admin` vào cột căn giữa của `#screen-main-menu`, có huy hiệu `Admin` sang trọng.
     - Nút chỉ hiển thị khi tài khoản đăng nhập là `lc_boy` hoặc có quyền `isAdmin: true`.
  3. **Xây dựng module dịch vụ Quản trị `js/admin-service.js`**:
     - `getAllUsers()`: Tải danh sách người chơi từ Firestore hoặc Mock DB, tự động ưu tiên Root Admin và Quản trị viên lên đầu danh sách.
     - `toggleAdminRole()`: Thăng chức / Tước quyền Quản trị viên (bảo vệ `lc_boy` tuyệt đối).
     - `banUser()`: Cấm tài khoản với lý do tùy chỉnh (mặc định "Không có lý do" nếu để trống), hỗ trợ cấm địa chỉ IP (`banIp`).
     - `unbanUser()`: Gỡ cấm và mở khóa tài khoản.
     - `adminResetPassword()`: Đổi mật khẩu cho người chơi (kiểm tra tối thiểu 8 ký tự).
     - `deleteUserAccount()`: Xóa vĩnh viễn tài khoản khỏi Firestore và Mock DB (bảo vệ `lc_boy`).
     - `getSystemMotd()`, `setSystemMotd()`, `hasUnreadMotd()`, `markMotdAsRead()`: Hệ thống Thông Báo Trong Ngày (MOTD).
     - `getServerStats()`, `getMaintenanceMode()`, `setMaintenanceMode()`: Thống kê nhanh và Chế độ bảo trì máy chủ.
  4. **Tích hợp kiểm tra bảo mật khi Đăng nhập (`js/auth-service.js`)**:
     - Chặn người chơi bị cấm đăng nhập, hiển thị thông báo lý do chi tiết do Admin cung cấp.
     - Chặn thiết bị có IP bị cấm.
     - Chặn đăng nhập khi Chế độ bảo trì đang bật (chỉ Admin mới được truy cập).
     - Tự động thu hồi phiên và đăng xuất ngay lập tức nếu tài khoản đang online bị Admin cấm.
  5. **Hệ thống 8 Hộp thoại Quản Trị & Thông Báo Chuẩn WCAG 2.2 AAA (`index.html` & `js/main-menu.js`)**:
     - `#modal-admin-panel`: Bảng điều khiển trung tâm với thống kê nhanh và công tắc bảo trì.
     - `#modal-admin-users`: Danh sách tài khoản cuộn accessible với thanh tìm kiếm thời gian thực.
     - `#modal-admin-user-action`: Thẻ chi tiết và bảng nút thao tác cho từng người chơi.
     - `#modal-admin-ban-user`: Form cấm tài khoản, lý do và cấm IP.
     - `#modal-admin-reset-pwd`: Form đổi mật khẩu bảo mật.
     - `#modal-admin-delete-user`: Hộp thoại xác nhận cảnh báo xóa vĩnh viễn.
     - `#modal-admin-motd`: Form soạn thảo thông báo máy chủ mới (ghi đè bản cũ).
     - `#modal-motd-broadcast`: Hộp thoại phát thông báo tự động xuất hiện trước khi người chơi vào Menu Chính khi đăng nhập, có nút "Tôi đã đọc" để đánh dấu và không làm phiền lần đăng nhập sau.
  6. **Kiểm thử tự động toàn diện**:
     - Tạo file `tests/test_admin_system.js` với 10 bài kiểm thử chuyên sâu, đạt kết quả tuyệt đối **10/10 TESTS PASS (100%)**.
  7. **Khắc phục lỗi cú pháp chặn đăng nhập & Kiểm thử trực tiếp trên trình duyệt Edge (`tests/test_browser_edge.js`)**:
     - Phát hiện hàm `checkMockSession` trong `js/auth-service.js` bị thiếu từ khóa `async` khi gọi `await logoutUser()`, dẫn đến lỗi `SyntaxError: Unexpected reserved word` làm crash quá trình parse module của trình duyệt (khiến nút Đăng nhập không nhận sự kiện click).
     - Đã sửa thành `const checkMockSession = async () => { ... }`.
     - Chạy mô phỏng đăng nhập thực tế trên Edge Browser với tài khoản `locvuu2105@gmail.com` và mật khẩu `lll20042004`: Đăng nhập Firebase thành công 100%, chuyển vào Menu Chính, nhận diện đúng `@lc_boy` và nút `🛡️ Bảng Quản Trị` hiển thị rực rỡ!
  8. **Khắc phục lỗi tính năng Đổi Mật Khẩu (Admin Reset Password) & Kiểm thử Trực Tiếp (`tests/test_password_reset_login.js`)**:
     - **Nguyên nhân**: Firebase Client SDK không cho phép tài khoản Admin đổi mật khẩu tài khoản người khác trong Firebase Authentication service. Hàm `adminResetPassword` đã lưu mật khẩu mới vào Firestore, nhưng `loginUser` lại gửi thẳng lên Firebase Auth (nơi vẫn còn giữ mật khẩu cũ), dẫn đến việc mật khẩu mới bị từ chối và mật khẩu cũ vẫn đăng nhập được.
     - **Giải pháp**:
       - Cập nhật `js/admin-service.js`: Ghi nhận `adminPassword: newPassword`, `mockPassword: newPassword` và `passwordResetByAdminAt` khi Admin đổi mật khẩu.
       - Cập nhật `js/auth-service.js` (`loginUser`): Kiểm tra tài khoản trên Firestore trước khi xác thực. Nếu tài khoản đã được Admin đặt lại mật khẩu (`adminPassword`), hệ thống lấy mật khẩu này làm mật khẩu duy nhất hợp lệ, từ chối ngay lập tức nếu nhập sai hoặc nhập mật khẩu cũ, và cho phép đăng nhập thành công khi nhập đúng mật khẩu mới.
       - Cập nhật `initAuthListener`: Tự động duy trì phiên đăng nhập mượt mà cho tài khoản đã được Admin đổi mật khẩu khi người chơi F5 / tải lại trang mà không bị văng ra form đăng nhập.
     - **Kết quả Kiểm thử**:
       - Chạy kiểm thử tự động với trình duyệt Microsoft Edge (`tests/test_password_reset_login.js`):
         - Đăng nhập `anhloc@mata.vn` với mật khẩu sai/cũ: Bị từ chối và hiển thị lỗi chuẩn accessible (`PASS`).
         - Đăng nhập `anhloc@mata.vn` với mật khẩu mới `locloc2004`: Thành công vào Menu Chính (`PASS`).
         - Đăng xuất an toàn: Đưa về màn hình Auth (`PASS`).
         - Đăng nhập bằng Username `halo` với mật khẩu mới `locloc2004`: Thành công vào Menu Chính (`PASS`).
       - Toàn bộ bài kiểm thử đạt kết quả tuyệt đối **4/4 BROWSER TESTS PASS (100%)** và **10/10 ADMIN TESTS PASS (100%)**.
  9. **Khắc phục lỗi Giải Phóng Email Khi Xóa Tài Khoản (Email Recycling & Account Rebirth) & Kiểm thử Trực Tiếp (`tests/test_fresh_register_rebirth.js`)**:
     - **Nguyên nhân**: Firebase Client SDK không cho phép một tài khoản (kể cả Admin) xóa user của người khác trong Firebase Authentication service. Khi Admin xóa tài khoản, hệ thống xóa dữ liệu trong Firestore (`users` và `usernames`), nhưng email vẫn còn kẹt lại trên Firebase Auth. Khi người dùng tạo lại tài khoản với email đó, hàm `createUserWithEmailAndPassword` báo lỗi `auth/email-already-in-use`.
     - **Giải pháp Tự Động Tổng Quát 100% Cho Mọi Người Chơi**:
       - Cập nhật `js/admin-service.js` & `js/main-menu.js`: Khi Quản trị viên xóa tài khoản, ghi nhận mapping giải phóng email vào collection `deleted_users/{email}`.
       - Cập nhật `js/auth-service.js` (`registerUser`): Khi `createUserWithEmailAndPassword` báo lỗi `auth/email-already-in-use`, hệ thống tự động kiểm tra xem email này có người chơi nào đang hoạt động trong game không (`collection("users").where("email", "==", cleanEmail)`):
         - Nếu ĐANG CÓ người chơi sở hữu email: Tiếp tục từ chối và báo lỗi để bảo vệ tài khoản người khác.
         - Nếu KHÔNG CÓ người chơi nào sở hữu (tài khoản cũ đã bị Admin xóa): Kích hoạt cơ chế Tái Sinh Tự Động, khởi tạo hồ sơ mới toanh với toàn bộ thông tin mới: Username mới, Display Name mới, Kitchen Name mới, và Mật khẩu mới (`adminPassword: password`).
         - Tự động đăng nhập và đưa người chơi vào Menu Chính ngay lập tức.
     - **Kết quả Kiểm thử**:
       - Chạy kiểm thử tự động trên trình duyệt Microsoft Edge (`tests/test_fresh_register_rebirth.js`):
         - Xác nhận màn hình ban đầu là Auth Login (`PASS`).
         - Chuyển sang form Đăng Ký (`PASS`).
         - Đăng ký tài khoản mới (`chef_tuyet_dinh`) bằng email đã giải phóng `anhloc@mata.vn` với mật khẩu mới `tuyetdinh2026`: Thành công vào Menu Chính (`PASS`).
         - Đăng xuất an toàn về màn hình Auth (`PASS`).
         - Đăng nhập lại bằng email `anhloc@mata.vn` và mật khẩu mới `tuyetdinh2026`: Thành công vào Menu Chính (`PASS`).
         - Đăng xuất và đăng nhập lại bằng username `chef_tuyet_dinh` và mật khẩu mới `tuyetdinh2026`: Thành công 100% vào Menu Chính (`PASS`).
       - Toàn bộ **6/6 bài test Edge Browser** và **10/10 bài test quản trị** đều đạt kết quả tuyệt đối **100% PASS**. Đã dọn dẹp sạch tài khoản test để email `anhloc@mata.vn` hoàn toàn sẵn sàng cho người dùng tự đăng ký.

---

## 2. Thông Tin Phiên Làm Việc Trước
- **Ngày thực hiện**: 30/10/2026 (Phiên Tích Hợp Firebase Online: Hệ Thống Đăng Ký, Đăng Nhập, Menu Chính Chuẩn Accessible & Bảng Cài Đặt Tập Trung)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu**:
  1. **Chuyển đổi YumCraft Kitchen thành trò chơi Online** với Firebase SDK v10 Modular (`js/firebase-config.js`):
     - Tích hợp Firebase Auth và Cloud Firestore để quản lý hồ sơ Bếp Trưởng, đảm bảo tên người dùng định danh không bị trùng lặp.
     - Hỗ trợ cơ chế linh hoạt kép: Kết nối trực tiếp Firebase Project thực tế qua CDN của Google và tự động kích hoạt **Chế độ Giả lập Cục bộ (Local Mock Mode)** khi chưa điền API Key, giúp việc phát triển và trải nghiệm không bị gián đoạn.
  2. **Xây dựng Màn hình Xác thực Hoàn chỉnh (`#screen-auth`)**:
     - **Form Đăng Nhập (`#view-login`)**:
       - Cho phép đăng nhập bằng **Email HOẶC Tên người dùng (Username)**. Nếu nhập Username, hệ thống tự động tra cứu email liên kết trong Firestore.
       - Ô Mật khẩu có nút bấm Ẩn/Hiện mật khẩu trực quan chuẩn trợ năng.
       - Checkbox "Duy trì đăng nhập cho thiết bị này": Mặc định được **TÍCH CHỌN**, tự động lưu phiên vĩnh viễn (`browserLocalPersistence`) hoặc hủy phiên khi đóng tab (`browserSessionPersistence`).
       - Nút chuyển đổi nhanh sang màn hình Đăng ký.
     - **Form Đăng Ký (`#view-register`)**:
       - Nút Quay lại / Đóng ở góc trên bên trái (`#btn-back-to-login`) đưa về Đăng nhập nhanh chóng.
       - Trường **Tên người dùng (Username)**: Viết liền không dấu, không dấu cách, chỉ gồm chữ, số và ký tự `_ . -` (regex `^[a-zA-Z0-9_.-]+# NGUYÊN TẮC THIẾT KẾ CỐT LÕI — YUMCRAFT KITCHEN

> [!IMPORTANT]
> **TRIẾT LÝ NẤU BẾP TỰ DO (TOCA KITCHEN SANDBOX PHILOSOPHY)**
> 1. **Hoàn Toàn Không Có Công Thức Cố Định (Zero Hardcoded Recipes)**: YumCraft Kitchen là trò chơi nấu ăn mô phỏng tự do theo phong cách Toca Kitchen. Người chơi là bếp trưởng sáng tạo tuyệt đối, được quyền kết hợp bất kỳ nguyên liệu, dụng cụ và gia vị nào với nhau mà không bị trói buộc bởi bất kỳ công thức sách giáo khoa cứng nhắc nào.
> 2. **Hóa Học Vị Giác Cảm Quan Động (Dynamic Sensory Chemistry)**: Hệ thống đánh giá dựa trên các định luật vật lý và hóa học vị giác thực tế (Umami, Mặn, Ngọt, Chua, Cay, Béo, Đắng, Thơm, Giòn), phản ánh trung thực những gì người chơi vừa thực sự chế biến và nêm nếm. Tuyệt đối không gán ghép các nhãn hương vị tĩnh hoặc tự ý suy đoán nguyên liệu không có trong món ăn.
> 3. **Nhận Xét Của Thực Khách Sinh Động & Chân Thực (Living Character Critique)**: Khi thưởng thức, nhân vật sẽ miêu tả chi tiết cảm giác vị giác, kết cấu món ăn (nướng, luộc, chiên, cuộn, nhồi...) và mùi vị của các loại gia vị người chơi đã nêm, phản ánh đúng gu thưởng thức và biểu cảm của từng thực khách.
> 4. **Trợ Năng Toàn Diện Chuẩn Quốc Tế (WCAG AA/AAA & NVDA First)**: Mọi tương tác, cảm giác vị giác và diễn biến nấu nướng đều phải được truyền tải hoàn hảo, tự nhiên và liền mạch đến người chơi khiếm thị thông qua NVDA và bàn phím.
>5 ** không được đưa vào bất kỳ công thức cứng nhắt nào trong code, vì đây là game nấu ăn tự gio, không phải game nấu ăn theo công thức xách giáo khoa
---

), kiểm tra tính duy nhất trên Firestore collection `usernames`.
       - Trường **Tên hiển thị (Display Name)**: Cho phép có dấu tiếng Việt và dấu cách (ví dụ: "Bếp Trưởng Anh Lộc"), hoàn toàn độc lập với username.
       - Trường **Email**: Lưu trữ liên kết để hỗ trợ quản trị viên khôi phục tài khoản khi cần.
       - Hai trường **Mật khẩu** & **Nhập lại mật khẩu**: Kiểm tra tối thiểu 8 ký tự và trùng khớp 100%.
       - Trường **Tên nhà bếp (Kitchen Name)**: Thương hiệu gian bếp của người chơi (ví dụ: "Nhà Bếp Anh Lộc"), sẵn sàng để gắn nhãn nguồn gốc món ăn chia sẻ ra cộng đồng (*Được sản xuất tại: [Tên nhà bếp]*).
       - Checkbox "Duy trì đăng nhập cho thiết bị này" (mặc định tích chọn).
       - Nút Đăng ký: Tự động khởi tạo tài khoản, lưu hồ sơ, đăng nhập và đưa thẳng vào Menu Chính.
  3. **Xây dựng Menu Chính Chuẩn UI/UX Hiện Đại (`#screen-main-menu`)**:
     - Thiết kế theo ý tưởng của anh Lộc: **Các nút căn giữa màn hình, xếp dọc từ trên xuống dưới, không đánh số thứ tự** để tối ưu hóa sự mượt mà và tự nhiên cho trình đọc màn hình NVDA:
       1. 🍳 **Đi vào nhà bếp**: Chuyển vào màn hình Chọn Thực Khách (`screen-character-select`), chọn 1 trong 4 nhân vật rồi vào bếp nấu ăn bình thường với 100% logic gốc.
       2. ⚙️ **Cài đặt**: Mở hộp thoại **Bảng Cài Đặt Tập Trung** (`#modal-settings`) để tinh chỉnh âm thanh hiệu ứng bếp (SFX), thanh trượt âm lượng (Volume Slider), và giọng nói Live Region NVDA; giải phóng không gian nhà bếp khỏi các nút cài đặt rườm rà.
       3. 📖 **Hướng dẫn**: Mở cẩm nang luật chơi tự do và bảng phím tắt (`#modal-help`).
       4. 🚪 **Đăng xuất**: Hộp thoại xác nhận đăng xuất tài khoản an toàn, dọn dẹp phiên và đưa về màn hình Đăng nhập.
     - Thẻ thông tin Bếp Trưởng trên Menu: Hiển thị tên hiển thị, `@username`, gian bếp và trạng thái trực tuyến (Online).
     - Bổ sung nút "⬅️ Quay lại Menu Chính" tại màn hình Chọn Thực Khách, tạo vòng lặp trải nghiệm mượt mà, liền mạch.
  4. **Kiểm thử tự động toàn diện**: 33 bài test cấu trúc giao diện, form đăng nhập, form đăng ký, menu chính và trợ năng WCAG 2.2 AAA đạt kết quả tuyệt đối **33/33 TESTS PASS (100%)**.

---

## 2. Thông Tin Phiên Làm Việc Trước
- **Ngày thực hiện**: 30/10/2026 (Phiên Tích Hợp Firebase Online: Hệ Thống Đăng Ký, Đăng Nhập, Menu Chính Chuẩn Accessible & Bảng Cài Đặt Tập Trung)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu**:
  1. **Chuyển đổi YumCraft Kitchen thành trò chơi Online** với Firebase SDK v10 Modular (`js/firebase-config.js`):
     - Tích hợp Firebase Auth và Cloud Firestore để quản lý hồ sơ Bếp Trưởng, đảm bảo tên người dùng định danh không bị trùng lặp.
     - Hỗ trợ cơ chế linh hoạt kép: Kết nối trực tiếp Firebase Project thực tế qua CDN của Google và tự động kích hoạt **Chế độ Giả lập Cục bộ (Local Mock Mode)** khi chưa điền API Key, giúp việc phát triển và trải nghiệm không bị gián đoạn.
  2. **Xây dựng Màn hình Xác thực Hoàn chỉnh (`#screen-auth`)**:
     - **Form Đăng Nhập (`#view-login`)**:
       - Cho phép đăng nhập bằng **Email HOẶC Tên người dùng (Username)**. Nếu nhập Username, hệ thống tự động tra cứu email liên kết trong Firestore.
       - Ô Mật khẩu có nút bấm Ẩn/Hiện mật khẩu trực quan chuẩn trợ năng.
       - Checkbox "Duy trì đăng nhập cho thiết bị này": Mặc định được **TÍCH CHỌN**, tự động lưu phiên vĩnh viễn (`browserLocalPersistence`) hoặc hủy phiên khi đóng tab (`browserSessionPersistence`).
       - Nút chuyển đổi nhanh sang màn hình Đăng ký.
     - **Form Đăng Ký (`#view-register`)**:
       - Nút Quay lại / Đóng ở góc trên bên trái (`#btn-back-to-login`) đưa về Đăng nhập nhanh chóng.
       - Trường **Tên người dùng (Username)**: Viết liền không dấu, không dấu cách, chỉ gồm chữ, số và ký tự `_ . -` (regex `^[a-zA-Z0-9_.-]+# NGUYÊN TẮC THIẾT KẾ CỐT LÕI — YUMCRAFT KITCHEN

> [!IMPORTANT]
> **TRIẾT LÝ NẤU BẾP TỰ DO (TOCA KITCHEN SANDBOX PHILOSOPHY)**
> 1. **Hoàn Toàn Không Có Công Thức Cố Định (Zero Hardcoded Recipes)**: YumCraft Kitchen là trò chơi nấu ăn mô phỏng tự do theo phong cách Toca Kitchen. Người chơi là bếp trưởng sáng tạo tuyệt đối, được quyền kết hợp bất kỳ nguyên liệu, dụng cụ và gia vị nào với nhau mà không bị trói buộc bởi bất kỳ công thức sách giáo khoa cứng nhắc nào.
> 2. **Hóa Học Vị Giác Cảm Quan Động (Dynamic Sensory Chemistry)**: Hệ thống đánh giá dựa trên các định luật vật lý và hóa học vị giác thực tế (Umami, Mặn, Ngọt, Chua, Cay, Béo, Đắng, Thơm, Giòn), phản ánh trung thực những gì người chơi vừa thực sự chế biến và nêm nếm. Tuyệt đối không gán ghép các nhãn hương vị tĩnh hoặc tự ý suy đoán nguyên liệu không có trong món ăn.
> 3. **Nhận Xét Của Thực Khách Sinh Động & Chân Thực (Living Character Critique)**: Khi thưởng thức, nhân vật sẽ miêu tả chi tiết cảm giác vị giác, kết cấu món ăn (nướng, luộc, chiên, cuộn, nhồi...) và mùi vị của các loại gia vị người chơi đã nêm, phản ánh đúng gu thưởng thức và biểu cảm của từng thực khách.
> 4. **Trợ Năng Toàn Diện Chuẩn Quốc Tế (WCAG AA/AAA & NVDA First)**: Mọi tương tác, cảm giác vị giác và diễn biến nấu nướng đều phải được truyền tải hoàn hảo, tự nhiên và liền mạch đến người chơi khiếm thị thông qua NVDA và bàn phím.
>5 ** không được đưa vào bất kỳ công thức cứng nhắt nào trong code, vì đây là game nấu ăn tự gio, không phải game nấu ăn theo công thức xách giáo khoa
---

), kiểm tra tính duy nhất trên Firestore collection `usernames`.
       - Trường **Tên hiển thị (Display Name)**: Cho phép có dấu tiếng Việt và dấu cách (ví dụ: "Bếp Trưởng Anh Lộc"), hoàn toàn độc lập với username.
       - Trường **Email**: Lưu trữ liên kết để hỗ trợ quản trị viên khôi phục tài khoản khi cần.
       - Hai trường **Mật khẩu** & **Nhập lại mật khẩu**: Kiểm tra tối thiểu 8 ký tự và trùng khớp 100%.
       - Trường **Tên nhà bếp (Kitchen Name)**: Thương hiệu gian bếp của người chơi (ví dụ: "Nhà Bếp Anh Lộc"), sẵn sàng để gắn nhãn nguồn gốc món ăn chia sẻ ra cộng đồng (*Được sản xuất tại: [Tên nhà bếp]*).
       - Checkbox "Duy trì đăng nhập cho thiết bị này" (mặc định tích chọn).
       - Nút Đăng ký: Tự động khởi tạo tài khoản, lưu hồ sơ, đăng nhập và đưa thẳng vào Menu Chính.
  3. **Xây dựng Menu Chính Chuẩn UI/UX Hiện Đại (`#screen-main-menu`)**:
     - Thiết kế theo ý tưởng của anh Lộc: **Các nút căn giữa màn hình, xếp dọc từ trên xuống dưới, không đánh số thứ tự** để tối ưu hóa sự mượt mà và tự nhiên cho trình đọc màn hình NVDA:
       1. 🍳 **Đi vào nhà bếp**: Chuyển vào màn hình Chọn Thực Khách (`screen-character-select`), chọn 1 trong 4 nhân vật rồi vào bếp nấu ăn bình thường với 100% logic gốc.
       2. ⚙️ **Cài đặt**: Mở hộp thoại **Bảng Cài Đặt Tập Trung** (`#modal-settings`) để tinh chỉnh âm thanh hiệu ứng bếp (SFX), thanh trượt âm lượng (Volume Slider), và giọng nói Live Region NVDA; giải phóng không gian nhà bếp khỏi các nút cài đặt rườm rà.
       3. 📖 **Hướng dẫn**: Mở cẩm nang luật chơi tự do và bảng phím tắt (`#modal-help`).
       4. 🚪 **Đăng xuất**: Hộp thoại xác nhận đăng xuất tài khoản an toàn, dọn dẹp phiên và đưa về màn hình Đăng nhập.
     - Thẻ thông tin Bếp Trưởng trên Menu: Hiển thị tên hiển thị, `@username`, gian bếp và trạng thái trực tuyến (Online).
     - Bổ sung nút "⬅️ Quay lại Menu Chính" tại màn hình Chọn Thực Khách, tạo vòng lặp trải nghiệm mượt mà, liền mạch.
  4. **Kiểm thử tự động toàn diện**: 33 bài test cấu trúc giao diện, form đăng nhập, form đăng ký, menu chính và trợ năng WCAG 2.2 AAA đạt kết quả tuyệt đối **33/33 TESTS PASS (100%)**.

---

## 2. Thông Tin Phiên Làm Việc Trước
- **Ngày thực hiện**: 27/10/2026 (Phiên Nâng Cấp Hệ Thống Lịch Sử Nấu Ăn Nhận Diện Theo Từng Nhóm Nguyên Liệu & Tự Động Bảo Toàn Mẻ Nấu)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu**:
  1. Khắc phục triệt để lỗi gộp chung lịch sử chế biến của toàn bộ nguyên liệu: Khi người chơi làm món nhiều thành phần trên nhiều công cụ khác nhau (ví dụ: món "Bò bít tết" với Khoai tây Đà Lạt đem chiên ngập dầu; Thịt bò thăn tươi, Xúc xích hun khói và Pate gan béo thơm đem áp chảo), hệ thống phân tách rõ ràng từng nhóm nguyên liệu với đúng công cụ đã chế biến nhóm đó, tuyệt đối không gán ghép sai thành tất cả nguyên liệu đều bị "chiên ngập dầu rồi đem áp chảo".
  2. Xây dựng Cơ Chế Tự Do Điều Phối Mẻ Nấu (`100% Player-Controlled Batch & Multi-Step Mixing` - Phương án A):
     - Nếu người chơi để nguyên `Khoai tây` đã chiên ngập dầu trên bếp rồi lấy thêm `Thịt bò sống` vào chảo để xào chung: cả hai cùng được áp chảo, trong đó `Khoai tây` mang lịch sử `['deep_fried', 'fried']` (*được chiên ngập dầu rồi đem áp chảo*), còn `Thịt bò` chỉ mang lịch sử `['fried']` (*được đem áp chảo*).
     - Nếu người chơi muốn nấu riêng từng mẻ (bấm Phím `T` cất `Khoai tây` ra Khay Tạm rồi áp chảo `Thịt bò, Xúc xích, Pate`): `Khoai tây` giữ nguyên lịch sử `['deep_fried']`, nhóm thịt giữ nguyên lịch sử `['fried']`.
  3. Xây dựng Động Cơ Gom Nhóm Nguyên Liệu Theo Lịch Sử Chế Biến (`groupItemsByCookingHistory`): Tự động gom các nguyên liệu có chung chuỗi thao tác (`actionHistory`) vào cùng một cụm và tách riêng các nguyên liệu nấu trên dụng cụ khác thành các mệnh đề độc lập, tự nhiên trong `generateSensoryTastingReview`.
  4. Chuẩn hóa `describeItemStateShort` cho NVDA: Bổ sung ánh xạ tiếng Việt cho `sliced` (`thái lát`), `diced` (`thái hạt lựu`), `minced` (`băm nhuyễn`), `rolled` (`cuộn chặt`), `stuffed` (`nhồi nhân`), loại bỏ hoàn toàn hiện tượng lặp từ hoặc lọt chuỗi tiếng Anh.
  5. Kiểm thử tự động toàn diện 14 kịch bản chuyên sâu (`test_batch_cooking_history.js`) đạt kết quả tuyệt đối **14/14 TESTS PASS (100%)**.

---

## 2. Các Tính Năng & Thay Đổi Đã Triển Khai (Phiên 16/10/2026)

### A. Đổi Tên Game Thương Hiệu Mới: YumCraft Kitchen
- Đổi toàn bộ nhận diện thương hiệu từ tiêu đề trang, giao diện giới thiệu, tiêu đề nhà bếp, cẩm nang phím tắt đến code logic thành **YumCraft Kitchen**.
- Loại bỏ 100% mọi tham chiếu tên gọi thương hiệu cũ, đảm bảo không gặp bất kỳ xung đột bản quyền nào.

### B. Bổ Sung Nhóm Nguyên Liệu "🍜 Mì & Bột Làm Bánh"
- Mở rộng kho nguyên liệu tủ lạnh lên **45 nguyên liệu** và thêm danh mục mới `noodles_flour`:
  1. 🍜 **Mì trứng tươi sợi vàng** (`egg_noodles`): Thơm bùi đậm vị trứng, luộc chín mềm trong nồi hoặc xào thịt bò rau củ.
  2. 🍝 **Mì Ý Spaghetti hảo hạng** (`spaghetti`): Sợi dài dai ngon chuẩn Al Dente, sốt cà chua thịt băm hoặc sốt phô mai kem béo.
  3. 🍜 **Mì Udon Nhật Bản sợi to** (`udon_noodles`): Sợi to dày mướt dai mềm, nấu súp hầm ngọt nước hoặc xào cay.
  4. 🥢 **Mì gói tôm chua cay giòn rụm** (`instant_ramen`): Giòn rụm ăn sống cực đã, kẹp bánh mì hoặc nhúng nước sôi / chiên xào.
  5. 🌾 **Bột mì đa dụng cao cấp** (`wheat_flour`): Nhào bột làm bánh nướng lò, pha sốt sánh ngậy hoặc làm vỏ bánh.
  6. 🍚 **Bột gạo tẻ thơm mịn** (`rice_flour`): Dẻo thanh ngọt nhẹ, dùng pha bột đổ bánh xèo, làm bánh bao hấp hoặc bánh cuốn.
  7. 🍤 **Bột chiên giòn Tempura** (`tempura_batter`): Áo lớp bột nhúng tôm, mực, xúc xích rồi chiên ngập dầu giòn tan béo ngậy.

### C. Tái Cấu Trúc Bố Cục Nhà Bếp Thành 5 Tab Chuẩn WCAG
- Chuyển đổi toàn diện từ dạng bố cục 3 cột nhiều heading con sang **Hệ thống 5 Tab (`role="tablist"` / `role="tab"` / `role="tabpanel"`)**:
  - **Tab 1 (`#tab-fridge`)**: 1. Tủ Lạnh & Kho Đồ (`Alt + 1`)
  - **Tab 2 (`#tab-workbench`)**: 2. Bàn Chế Biến (`Alt + 2`)
  - **Tab 3 (`#tab-staging`)**: 3. Khay Tạm (`Alt + 3`)
  - **Tab 4 (`#tab-spices`)**: 4. Gia Vị (`Alt + 4`)
  - **Tab 5 (`#tab-dining`)**: 5. Bàn Tiệc & Thưởng Thức (`Alt + 5`)
- **Khắc phục triệt để lỗi "lòi tab 0 và phím tắt tùm lum" khi duyệt bằng mũi tên NVDA**:
  - Loại bỏ hoàn toàn các thẻ số lượng badge (trước đây đọc ngắt quãng thành dòng số "0" riêng biệt trong buffer của NVDA).
  - Loại bỏ thẻ `sr-only` phím tắt riêng biệt gây tách dòng. Đưa phím tắt vào thuộc tính `title` và tài liệu hướng dẫn phím tắt `modal-help`.
  - Tên mỗi tab giờ đây là một dòng văn bản thuần túy, sạch đẹp, đọc liền mạch và đúng chuẩn: "1. Tủ Lạnh & Kho Đồ", "2. Bàn Chế Biến", "3. Khay Tạm", "4. Gia Vị", "5. Bàn Tiệc & Thưởng Thức".
- Hỗ trợ đầy đủ phím điều hướng tab WCAG:
  - Bấm `ArrowRight` / `ArrowDown`: Chuyển sang tab tiếp theo và cập nhật tiêu điểm (không bị double speech).
  - Bấm `ArrowLeft` / `ArrowUp`: Quay lại tab trước đó.
  - Bấm `Home`: Nhảy nhanh về Tab 1.
  - Bấm `End`: Nhảy nhanh tới Tab 5.
  - `Alt + 1..5`: Nhảy trực tiếp tới bất kỳ tab nào từ bất cứ đâu trong bếp.

### D. Tinh Gọn Cấu Trúc Heading — Khắc Phục Lỗi Bấm Phím H Bị Loạn Trên NVDA
- Trước đây: Mỗi phân khu có nhiều heading h3, h4 lồng ghép, khiến người dùng NVDA khi bấm phím `H` để duyệt tài liệu bị nhảy tán loạn qua hàng chục tiêu đề vụn.
- Hiện tại: Trong mỗi tabpanel chỉ chứa **duy nhất một thẻ semantic `<h2>` đại diện cho phân khu đó**. Các thông tin phụ được chuyển thành cấu trúc trực quan với nhãn aria rõ ràng, giúp phím tắt `H` hoạt động cực kỳ mượt mà, chính xác và không bị rối.

### E. Dọn Dẹp Thông Báo Trình Đọc Màn Hình Trên Đầu Trang
- Đưa toàn bộ các vùng ARIA Live kép (`#nvda-live-assertive-a/b` và `#nvda-live-polite-a/b`) xuống cuối cùng của mã nguồn (ngay trước `</body>`).
- Xóa bỏ hoàn toàn thanh text banner thông báo trực quan ở đỉnh trang, giữ cho đầu trang luôn sạch sẽ, thoáng đãng.

### F. Nút Hướng Dẫn & Phím Tắt (Help) Xuống Chân Trang (Footer)
- Bố trí nút **`⌨️ Hướng Dẫn & Phím Tắt (H)`** nằm riêng biệt, cố định tại thanh chân trang (`<footer>`).
- Khi bấm (hoặc nhấn phím `H`), mở hộp thoại độc lập `<dialog id="modal-help">` hiển thị chi tiết toàn bộ cơ chế game, 5 tab và bảng phím tắt, tự động bẫy tiêu điểm và trả tiêu điểm về nút khi nhấn `Esc`.

### G. Quy Trình Hoàn Thành Món Động & Đưa Ra Dĩa Chuẩn Mực
- **Loại bỏ hoàn toàn cơ chế đưa đồ ra dĩa vụn vặt**:
  - Xóa bỏ nút đưa ra dĩa ở Tủ Lạnh (chỉ lấy vào Bếp hoặc Khay Tạm).
  - Xóa bỏ tùy chọn nêm gia vị ra dĩa ở Khay Gia Vị (chỉ nêm vào Bếp hoặc Khay Tạm).
- **Nút `⭐ HOÀN THÀNH MÓN (Phím P)`**:
  - Là cách thức duy nhất để chuyển đồ ăn lên dĩa.
  - **Trạng thái động**: Chỉ hiển thị khi trong Bếp hoặc Khay Tạm có ít nhất 1 nguyên liệu. Khi cả hai đều trống, nút sẽ tự động ẩn đi.
  - Khi bấm Hoàn Thành Món: Người chơi tự do đặt tên món tùy thích, chọn đồ trang trí rồi bấm Enter.
  - Ngay sau khi xác nhận:
    1. Toàn bộ món ăn được chuyển sạch sẽ lên Dĩa Ăn.
    2. Nút Hoàn Thành Món tự động biến mất.
    3. Giao diện **tự động chuyển sang Tab 5: "🍽️ Bàn Tiệc & Thưởng Thức"**.
    4. Trình duyệt **tự động đặt tiêu điểm (focus) vào nút `🥄 ĐÚT CHO THỰC KHÁCH ĂN! (Phím F)`**.
    5. NVDA đọc thông báo món ăn đã hoàn thành và sẵn sàng cho thực khách ăn.

### H. Tối Ưu Triệt Để Khối Skip Links & Xây Dựng Bộ Máy Đánh Giá Cảm Quan Ẩm Thực Tự Do
- **Xóa bỏ hoàn toàn khối Skip Links dư thừa ở đầu trang nhà bếp**:
  - Loại bỏ khối `<nav aria-label="Liên kết nhảy nhanh nhà bếp cho NVDA">` chứa 6 liên kết anchor trỏ vào panel tab bị ẩn.
  - Khắc phục lỗi bấm vào link không nhảy (do các panel tab khác đang ở trạng thái `hidden`).
  - Tối ưu hóa tuyệt đối cho người dùng NVDA: Người chơi khiếm thị chỉ cần ấn `D` (duyệt landmark) hoặc `Alt + 1..5` để chuyển tab tức thì, không bị chặn bởi các liên kết rườm rà ở đầu trang.
- **Xóa bỏ hoàn toàn nhãn cứng "Sô-cô-la & Sữa" khỏi các món mặn**:
  - Chuyển phản ứng hòa vị béo ngọt thơm (`blended.sweet >= 2.6 && blended.fatty >= 2.0 && blended.aroma >= 1.8`) sang cơ chế động:
    - Nếu có nguyên liệu đồ ngọt thực sự (`sweets` như `chocolate`, `milk`, `oreo`): kích hoạt `🍫🥛 Hòa Quyện Đồ Ngọt Béo Thơm`.
    - Nếu là món thịt/mặn có bơ/mật ong: kích hoạt `🍯🧈 Áo Sốt Béo Ngọt Ngào Ngạt (Hòa quyện béo ngậy caramel hóa quyến rũ)`.
    - Bổ sung phản ứng phô mai tan chảy & đạm béo: `🧀🥩 Phô Mai & Đạm Béo (Ngậy thơm tan chảy quyện vị Umami)`.
- **Xây dựng Bộ Máy Đánh Giá Cảm Quan Ẩm Thực Động (`generateSensoryTastingReview`)**:
  - Dựa trên 100% tinh thần tự do Toca Kitchen: không áp đặt bất kỳ công thức cứng nào.
  - Mô tả sống động 4 tầng cảm quan:
    1. *Cấu trúc & Kỹ thuật*: Phân tích chi tiết vỏ ngoài (nướng than hoa, áp chảo, chiên giòn, xém cạnh...) và lớp nhân cuộn/nhồi bên trong.
    2. *Vị giác chân thực*: Chuyển đổi các con số hóa học thành ngôn từ miêu tả vị đượm đà nước thịt, vị mặn vừa vặn, vị ngọt thanh, lớp béo ngậy tan chảy, the cay ấm nồng...
    3. *Gia vị thực tế*: Nhắc tên chính xác các loại gia vị người chơi vừa nêm nếm.
    4. *Cá tính nhân vật*: Gấu Bự, Mèo Miu, Rồng Lửa, Cú Thông Thái có biểu cảm trầm trồ, khen ngợi hoặc phản ứng hài hước (nếu nấu sống, cháy khét hay mặn chát).
- **Nâng Cấp Báo Cáo Phím `I` (`readDishSummary`) Chuẩn NVDA**:
  - Khi ấn phím `I`, NVDA đọc to câu cảm quan món ăn sống động, điểm hài hòa, chi tiết 8 vị, cảnh báo nguy cơ nếu có (`warnings`) và phản ứng hòa vị (`synergies`).

---

## 3. Cấu Trúc Tệp Tin Dự Án
- `index.html`: Toàn bộ mã nguồn ứng dụng game hoàn chỉnh (HTML5, Tailwind CSS, Web Audio API, Canvas 2D, Vanilla JS).
- `index.html.bak2`: Bản sao lưu trước đợt nâng cấp YumCraft Kitchen.
- `README.md`: Tài liệu hướng dẫn, giới thiệu kiến trúc & cẩm nang phím tắt chuẩn GitHub.
- `LICENSE`: Giấy phép mã nguồn mở GNU General Public License v2.0 (GPL-2.0).
- `GEMINI.md`: Nhật ký phát triển và tài liệu dự án.

---

## 4. Thông Tin Phiên Làm Việc: Phân Tích Mã Nguồn & Xây Dựng README.md Chuẩn GitHub (16/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu**:
  1. Phân tích sâu kiến trúc mã nguồn hơn 4.000 dòng của `index.html`: logic hóa học vị giác 8 trục, hệ thống 9 trạm nấu, 45 nguyên liệu, 18 gia vị, hệ thống trợ năng 5 Tab WCAG 2.2 AAA cho NVDA, bộ tổng hợp âm thanh foley Web Audio API thời gian thực, và bộ đánh giá cảm quan 4 tầng của 4 thực khách.
  2. Xác minh giấy phép từ file `LICENSE`: GNU General Public License v2.0 (GPL-2.0).
  3. Soạn thảo toàn diện tài liệu `README.md` chuẩn GitHub repository đẳng cấp quốc tế:
     - Hệ thống huy hiệu (Badges): License GPL v2, WCAG 2.2 AAA, NVDA Tested, Zero Dependencies, Vanilla JS.
     - Triết lý nấu bếp tự do Toca Kitchen (Zero Hardcoded Recipes).
     - Hướng dẫn chi tiết 9 trạm nấu và sơ đồ quy trình chế biến Mermaid.
     - Cẩm nang phím tắt toàn năng phục vụ người chơi khiếm thị sử dụng bàn phím và NVDA.
     - Hướng dẫn trải nghiệm trực tiếp không cần cài đặt môi trường.
     - Tuyên ngôn bản quyền và thông tin tác giả Vũ Anh Lộc (LC Boy).

---

## 5. Thông Tin Phiên Làm Việc: Chuẩn Hóa Bộ Từ Điển Vị Giác Cảm Quan Tiếng Việt Thuần Túy & Hệ Thống Kiểm Thử Tự Động (16/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu**:
  1. Loại bỏ triệt để lỗi suy đoán nguyên liệu phi lý (ví dụ: gán nhãn "vị ngọt đượm đà tự nhiên của nước thịt" và gợi ý "vắt chanh, thêm dưa leo" vào ly sinh tố ngọt Oreo đá xay).
  2. Tuyệt đối không ví von vị giác với bất kỳ nguyên liệu/món ăn cụ thể nào (như không dùng "chua như chanh", "ngọt của sữa/mật", "mặn mắm", "đạm thịt").
  3. Loại bỏ việc gán ghép cảm giác nhiệt độ vào tính từ vị giác (như "ngọt mát lành" trong khi món có thể được đun sôi/nướng lò nóng).
  4. Ứng dụng kho tàng thuật ngữ chuyên ngành **Khoa học Đánh giá Cảm quan Thực phẩm (Sensory Evaluation)** tiếng Việt: phân cấp vi tế sắc thái vị giác (ngọt dịu, ngọt thanh, ngọt đằm, ngọt đượm, ngọt lịm sắc nét, ngọt gắt; vị đượm đà Umami; béo bùi, béo ngậy; mặn mà, mặn chát; chua thanh, chua rôn rốt, chua gắt; the cay, cay nồng, cay xé lưỡi...).
  5. Phát triển thuật toán **Xếp Hạng Vị Nổi Bật (Dominant Flavor Priority Sorting)**: tự động gom Top 2–3 vị có điểm số thực tế cao nhất đưa lên đầu câu cảm quan món ăn.
  6. Xây dựng và thực thi thành công bộ kiểm thử tự động 21 kịch bản món ăn đa dạng (`test_culinary_engine.js`) đạt kết quả tuyệt đối **21/21 PASS (100%)**.

### Các Cải Tiến Mã Nguồn Chi Tiết
1. **Hàm `describePureFlavorDescriptor(tasteKey, score, seed)`**:
   - Chuyển đổi điểm số 8 trục vị giác (0.0 đến 10.0) thành ngôn từ cảm quan tiếng Việt phong phú, thuần chất mô tả phản ứng của gai vị giác và hậu vị (Aftertaste).
   - Hỗ trợ đa dạng hóa từ ngữ đồng nghĩa (Word Variety) chống lặp từ máy móc.
2. **Thuật toán Dominant Flavor Priority trong `generateSensoryTastingReview`**:
   - Đánh giá tất cả các vị vượt ngưỡng, sắp xếp giảm dần theo điểm số `score`.
   - Với món "Oreo đá xay" (Ngọt 10, Béo 10, Thơm 10): miêu tả lập tức đưa vị ngọt lịm sắc sảo và độ béo ngậy nồng đậm lên hàng đầu, loại bỏ hoàn toàn việc bị vị Umami chèn ép.
3. **Làm sạch phản ứng hòa vị & Cảnh báo & Tiêu đề**:
   - `Muối + Umami`: Đổi thành `🧂✨ Muối Hài Hòa Tôn Vị Umami (Kích hoạt chiều sâu đượm đà)` (loại bỏ mắm/thịt).
   - Cảnh báo béo cao: `⚠️ Món ăn có độ béo khá cao (Gợi ý: điều chỉnh giảm độ béo hoặc bổ sung vị thanh để cân bằng)` (loại bỏ dưa leo/chanh).
   - Tiêu đề tự động: Đổi `Đậm Vị Ngọt Thịt` thành `Đậm Vị Umami` (không tự tiện suy đoán là thịt).
   - Máy xay: Chỉ thông báo `mát lạnh` khi trong công thức thực sự có Đá viên (`ice_cubes`).
4. **Tôn vinh tên món tùy chỉnh & Bóc tách nguyên liệu tự nhiên (Custom Dish Name Priority)**:
   - Loại bỏ hoàn toàn nhãn kỹ thuật `Ly Sinh Tố / Thức Uống` và các tiền tố gượng gạo.
   - Món ăn được xưng danh trực tiếp theo tên người chơi đặt (ví dụ: `Món 'oreo đá say' được xay nhuyễn sánh mịn mát lạnh từ Sữa tươi thanh trùng, Thanh Sô-cô-la Đen và Bánh quy Oreo kẹp kem...`), đảm bảo tôn trọng tuyệt đối quyền tự do sáng tạo và định danh món ăn của người chơi.

---

## 6. Thông Tin Phiên Làm Việc: Mở Rộng Kho Nguyên Liệu Lên 61 Món & Tinh Chỉnh Cảm Quan Trợ Năng (16/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu**:
  1. Phân loại và mở rộng kho nguyên liệu từ 46 lên **61 nguyên liệu (+15 nguyên liệu mới)** mang đậm hương vị nhiệt đới và bản sắc ẩm thực Việt Nam:
     - Tách riêng **Xoài xanh giòn chua** (`green_mango`) cho các món gỏi/nộm và **Xoài chín vàng ngọt** (`ripe_mango`) cho các món tráng miệng/sinh tố.
     - Chuẩn hóa **Khoai lang mật tươi nguyên củ** (`sweet_potato`) và **Khoai môn củ tươi** (`taro`) thành nguyên liệu thô (`needsCooking: true`), người chơi nướng than, hấp luộc hoặc chiên giòn để thưởng thức hương vị dẻo bùi ứa mật.
     - Bổ sung **Đậu phộng rang bùi thơm** (`roasted_peanuts`) và **Mạch nha dẻo quánh** (`malt_syrup`) phục vụ làm kẹo lạc, kẹo cu đơ, rắc nộm gỏi hoặc kẹp bánh tráng nướng.
     - Bổ sung **Cóc non giòn rụm** (`june_plum`), **Ổi giòn ngọt thanh** (`guava`), **Trái bơ sáp dẻo béo** (`avocado`), **Bắp ngô ngọt tươi** (`sweet_corn`), **Nấm kim châm tươi** (`enoki_mushroom`).
     - Bổ sung đạm và phô mai: **Thịt nạc băm tươi** (`minced_meat`), **Đậu hũ non thanh mát** (`tofu`), **Phô mai khối Mozzarella** (`mozzarella`), **Bánh sừng bò Croissant bơ Pháp** (`croissant`, hỗ trợ `canBeVessel: true` để nhồi nhân).
  2. Cập nhật nhãn số lượng ngăn tủ thành `Tất cả (61)` và cập nhật tự động huy hiệu `fridge-total-count-badge`.
  3. Đảm bảo 100% tiêu chuẩn trợ năng **WCAG 2.2 AAA & NVDA First**:
     - Tất cả 15 nguyên liệu mới đều có nhãn `aria-label` tự nhiên, rõ nghĩa kết hợp tên và câu miêu tả cảm quan.
     - Biểu tượng emoji có `aria-hidden="true"`, các thao tác chọn nguyên liệu đều phản hồi tức thì qua Web Audio API và ARIA Live Region.
  4. Thực thi kiểm thử tích hợp động cơ cảm quan ẩm thực thành công 100% với các món ăn kết hợp mới: Gỏi xoài xanh đậu phộng, Kẹo lạc mạch nha, Khoai lang mật nướng, Croissant kẹp phô mai thịt băm.

---

## 7. Thông Tin Phiên Làm Việc: Tích Hợp Hệ Thống Âm Thanh Ngoài (Foley Audio), Cơ Chế Play Wait & Động Cơ Âm Thanh Ăn Uống Đa Tầng (17/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu**:
  1. Thay thế hoàn toàn âm thanh sóng tổng hợp của các dụng cụ bếp bằng 7 tệp âm thanh ngoài chất lượng cao đặt tại thư mục `sounds/`:
     - Thớt cắt: `food_cut.ogg` (phát tức thì khi thái lát, thái hạt lựu, băm nhuyễn).
     - Chảo chiên xào: `frying_pan.ogg` (Play Wait).
     - Chảo chiên ngập dầu: `deep_frying_pan.ogg` (Play Wait).
     - Nồi luộc, hầm: `pot_of_boiling_water.ogg` (Play Wait).
     - Lò nướng đa năng: `oven.ogg` (Play Wait).
     - Vỉ nướng than hoa: `grill rack.ogg` (Play Wait).
     - Máy xay sinh tố: `blender.ogg` (Play Wait).
  2. Xây dựng hàm `playExternalAudio(filename, wait)` bất đồng bộ (Promise-based) hỗ trợ cả 2 chế độ phát tức thì và Play Wait, tích hợp cơ chế timeout an toàn dự phòng (12s) chống treo Promise và tôn trọng cài đặt `state.sfxEnabled`.
  3. Bổ sung các thuộc tính vật lý và kết cấu cảm quan (`texture`, `hasIce`, `outerTexture`) trực tiếp vào mô hình dữ liệu món ăn (`createFoodItem`), tự động chuyển hóa kết cấu khi qua các trạm chế biến (chiên ngập dầu $\rightarrow$ giòn; luộc hầm $\rightarrow$ nước súp; xay nhuyễn $\rightarrow$ đồ uống; nướng chín giòn $\rightarrow$ giòn; cuộn/nhồi $\rightarrow$ kế thừa theo vỏ ngoài).
  4. Giải quyết triệt để các nghịch lý ẩm thực tự do sandbox (học hỏi từ Toca Kitchen & khoa học cảm quan ẩm thực):
     - *Bánh tráng cuộn khoai tây chiên*: Lớp vỏ bánh tráng tươi dẻo mềm cắn chạm đầu tiên quyết định cảm quan $\rightarrow$ phát âm thanh ăn mềm `eat_soft_food.ogg`. Chỉ khi đem chiên ngập dầu hoặc nướng giòn mới phát `eat_crispy_food.ogg`.
     - *Thịt xay nhồi bột mì nướng lò*: Phương pháp nướng nhiệt sau cùng biến món ăn thành bánh nướng, không còn là đồ uống lỏng $\rightarrow$ phát `eat_crispy_food.ogg` hoặc `eat_soft_food.ogg`.
     - *Đồ uống lỏng / Đá xay*: Xay mịn không qua nhiệt khô, nếu có đá viên (`ice_cubes`) $\rightarrow$ phát `drink_with_ice.ogg`; nếu không có đá $\rightarrow$ phát `drink.ogg`.
     - *Món nước hầm*: Nấu trong nồi nước sôi/hầm $\rightarrow$ phát tiếng húp súp `eat_liquid_food.ogg`.
  5. Xây dựng **Động Cơ Âm Thanh Ăn Uống Đa Tầng (Sequential Multi-Course Tasting Engine)**:
     - Khi trên dĩa có nhiều món tách rời (ví dụ: Bít tết áp chảo + Khoai tây chiên giòn + Nước đá xay): Hàm `buildEatingAudioPlaylist` tự động lọc bỏ các âm thanh trùng lặp liên tiếp và sắp xếp logic: món ăn rắn trước, đồ uống sau.
     - Hàm `feedCharacter()` chạy tuần tự từng âm thanh (Play Wait), hiển thị trực quan trạng thái cắn/uống trên nút và kích hoạt hoạt họa nhai của nhân vật.
     - Sau khi chuỗi âm thanh kết thúc: Phát âm thanh sóng cảm xúc (`react_love`, `react_good`, `react_bad`), dọn dĩa và NVDA cất giọng đọc to lời nhận xét của thực khách.
  6. Đảm bảo 100% tiêu chuẩn trợ năng **WCAG 2.2 AAA & NVDA First**:
     - Khóa nút tránh spam click bằng cờ `isCookingBusy` và `isFeedingBusy` cùng thuộc tính `aria-busy="true"`.
     - NVDA không bị đọc đè trong lúc âm thanh nấu/ăn đang phát, chỉ công bố khi sự kiện hoàn thành.
  7. Xây dựng bộ kiểm thử tự động `test_audio_engine.js` đạt kết quả tuyệt đối **7/7 PASS (100%)** và xác minh cú pháp JavaScript của `index.html` hợp lệ 100%.

---

## 8. Thông Tin Phiên Làm Việc: Kiến Trúc Thực Đơn Đa Món (Multi-Course Combo & Banquet Sensory Engine), Đánh Giá Cảm Quan Từng Món & Trợ Năng Báo Cáo Phím I (17/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu**:
  1. **Khắc phục triệt để lỗi mất bản sắc món ăn khi làm nhiều món**:
     - Trước đây: `state.customDishName` là chuỗi đơn duy nhất. Khi người chơi làm món 1 (Thịt bò nướng than hoa), sau đó tiếp tục làm món 2 (Oreo đá say), hàm hoàn thành món ghi đè tên thành "Oreo đá say", làm mất sạch tên và kỹ thuật nướng thịt bò.
     - Hiện tại: Thiết lập cấu trúc `state.servedDishes = []` quản lý các món ăn độc lập (`ServedDish` gồm `id`, `name`, `garnish`, `items`, `analysis`). Mỗi nguyên liệu trên dĩa được gắn nhãn `dishId` và `dishName` đồng bộ.
  2. **Tách biệt quy trình Hoàn Thành Món (`openFinishDishModal` & `confirmPlatingDish`)**:
     - Khi mở modal hoàn thành món: Chỉ phân tích các nguyên liệu đang có trong bếp hoặc khay tạm (`stationItems` & `stagingItems`), không gom các món đã nằm trên dĩa vào để tính toán gợi ý tên.
     - Khi xác nhận bày dĩa: Đóng gói mẻ nấu thành một `ServedDish` mới, đồng thời tự động cập nhật tiêu đề thực đơn (ví dụ: `Thực Đơn 2 Món: Thịt bò nướng than hoa kèm Oreo đá say`).
  3. **Phát triển Động Cơ Đánh Giá Cảm Quan Thực Đơn Đa Món (`generateMultiDishTastingReview`)**:
     - **Không bao giờ nhận xét qua loa**: Giữ nguyên 100% độ sâu sắc của bộ từ điển vị giác cảm quan thuần túy 4 tầng cho từng món một (cấu trúc kỹ thuật, vị giác nổi trội xếp hạng theo cường độ, gia vị thực tế).
     - **Combo 2 Món (Món chính + Thức uống giải khát)**: Thực khách đánh giá chi tiết cả 2 món (ví dụ: Thịt bò nướng than hoa thơm lừng đượm vị Umami dùng kèm ly Oreo đá say sánh mịn béo ngọt mát lạnh).
     - **Đại Tiệc & Mâm Cỗ Hoàng Gia (3, 4, 5, 6+ món)**: Thực khách (Gấu Bự, Mèo Miu, Rồng Lửa, Cú Thông Thái) phân tích tường tận từng món từ món 1 đến món 6, tính điểm thưởng phối hợp thực đơn phong phú (Combo Bonus + Banquet Bonus).
     - **Phản ứng hài hước Toca Kitchen Gag**: Khi có món bị sống tanh hoặc cháy khét, thực khách chỉ đích danh món bị lỗi và khen ngợi các món ngon lành còn lại.
  4. **Nâng Cấp Trợ Năng Báo Cáo Phím `I` (`readDishSummary`) Chuẩn NVDA First**:
     - Khi trên dĩa có $\ge 2$ món: Trình đọc màn hình NVDA đọc rành mạch theo thứ tự từng món (Tên món, Cảm quan chi tiết, Điểm hài hòa, Chi tiết các vị Umami, Mặn, Ngọt, Béo, Thơm) và tổng kết điểm trung bình thực đơn.
  5. **Đồng Bộ Giao Diện & Thao Tác Xóa Món (`renderServingPlate`)**:
     - Thẻ huy hiệu hiển thị rõ số lượng món và số lượng phần (`N món (M phần) trên dĩa`).
     - Từng nguyên liệu hiển thị nhãn tên món tương ứng (`[Thịt bò nướng than hoa]`, `[Oreo đá say]`).
     - Khi xóa một nguyên liệu, hệ thống tự động đồng bộ lại `servedDishes`, cập nhật lại tiêu đề thực đơn và điểm số tức thì.
  6. **Kiểm Thử Toàn Diện Tự Động (`test_multidish_engine.js`)**:
     - Kiểm thử bao phủ toàn bộ 8 kịch bản (1 món, 2 món, 3 món, 4 món, 5 món, 6 món, phản ứng gag, phím I, xóa món, dọn dĩa) đạt kết quả tuyệt đối **41/41 PASS (100%)**.


---

## 9. Thông Tin Phiên Làm Việc: Chuẩn Hóa Nút Xóa Món Trên Dĩa & Động Cơ Âm Thanh Ăn Uống Phát Đúng Thứ Tự Dĩa Đầy Đủ (18/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu & Các Cải Tiến Triển Khai**:
  1. **Khắc Phục Triệt Để Lỗi Nút Bỏ Đồ Ăn Khỏi Dĩa Bị Sai Tên Món**:
     - *Hiện tượng trước đây*: Người chơi chiên Vỏ bánh bao, hoàn thành món và đặt tên là "Bánh bao chiên". Khi đưa lên dĩa, nút xóa lại đọc: `"Bỏ Vỏ Bánh Bao Mềm Trắng khỏi dĩa"` do khai báo nhầm biến `it.name` (tên nguyên liệu thô ban đầu) thay vì tên món đã chế biến.
     - *Giải pháp triển khai*:
       + Tái cấu trúc danh sách `#plate-items-list` trong `renderServingPlate()` sang duyệt trực tiếp theo từng **Món Ăn Hoàn Chỉnh (`state.servedDishes`)**.
       + Hiển thị đúng tên món: Số thứ tự + `dish.name` (ví dụ: `1. Bánh bao chiên`).
       + Gán chuẩn xác thuộc tính trợ năng: `aria-label="Bỏ món ${dish.name} khỏi dĩa"` và nhãn nút trực quan là `Xóa`.
       + Khi bấm Xóa: Xóa sạch toàn bộ món đó và các nguyên liệu thuộc món đó khỏi dĩa ăn; cập nhật lại tiêu đề thực đơn và NVDA đọc thông báo rõ ràng: `"Đã bỏ món [Tên món] khỏi dĩa ăn."`
  2. **Động Cơ Âm Thanh Ăn Uống Phát Đúng Thứ Tự Trên Dĩa & Không Khử Trùng Lặp**:
     - *Hiện tượng trước đây*: Khi có 2 món mềm và 1 món giòn, cơ chế lọc trùng lặp `uniqueSounds` vô tình loại bỏ tiếng nhai mềm thứ 2, và thuật toán `sort` tự ý đảo đồ uống xuống sau cùng.
     - *Giải pháp triển khai*:
       + Hàm `buildEatingAudioPlaylist()`: Loại bỏ hoàn toàn bộ lọc khử trùng lặp và bộ sắp xếp đảo thứ tự.
       + Giữ nguyên **100% số lượng và thứ tự xuất hiện của các món trên dĩa**: Người chơi dọn món nào trước, nhân vật ăn món đó trước (ví dụ: Khoai tây chiên giòn $\rightarrow$ Sinh tố uống $\rightarrow$ Tôm xào mềm $\rightarrow$ Mì nước sôi súp $\rightarrow$ phát đúng tuần tự: Tiếng giòn $\rightarrow$ Tiếng uống $\rightarrow$ Tiếng mềm $\rightarrow$ Tiếng húp súp).
       + Bổ sung khoảng dừng tự nhiên siêu nhỏ ($150\text{ms}$) giữa các món liên tiếp để âm thanh tách bạch, thỏa mãn thính giác.
       + Đơn giản hóa trạng thái nút Đút Ăn: Giữ nguyên dòng trạng thái đồng nhất, gọn gàng: **`ĐANG THƯỞNG THỨC MÓN ĂN... 😋`** trong suốt quá trình phát chuỗi âm thanh.
  3. **Đảm Bảo 100% Chuẩn Trợ Năng WCAG 2.2 AAA & NVDA First**:
     - Nút có `aria-busy="true"` và `disabled="true"` trong suốt thời gian phát chuỗi âm thanh.
     - Trình đọc màn hình NVDA không bị ngắt quãng giữa chừng, chỉ công bố nhận xét toàn diện sau khi nhân vật thưởng thức xong toàn bộ mâm cỗ.
  4. **Kiểm Thử Toàn Diện Tự Động**:
     - Chạy thành công bộ kiểm thử tự động 7 kịch bản (Thứ tự âm thanh theo dĩa, 2 mềm 1 giòn không lọc trùng, thức uống có đá, dĩa rỗng, render nút dĩa với tên món Bánh bao chiên, xóa món dọn sạch dĩa) đạt kết quả tuyệt đối **7/7 PASS (100%)**.


---

## 10. Thông Tin Phiên Làm Việc: Tinh Chỉnh Trợ Năng Thông Báo Dĩa Ăn & Bảo Toàn Kiến Trúc Cảm Quan Món (19/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu & Các Cải Tiến Triển Khai**:
  1. **Bảo Toàn và Tối Ưu Hóa Cơ Chế Gom Món & Chuỗi Âm Thanh Ăn Uống Tuần Tự**:
     - *Bối cảnh*: Người chơi thực hiện một phần ăn gồm nhiều nguyên liệu (mì ý, xúc xích, thịt bò, khoai tây chiên), nấu mì cay và chiên khoai tây để khay tạm, rồi bấm hoàn thành món "mỳ cay".
     - *Phân tích chuyên sâu*:
       + Hệ thống gom toàn bộ nguyên liệu thành 1 món hoàn chỉnh `mỳ cay` trên dĩa với đúng 1 nút xóa cấp món (`Bỏ món "mỳ cay" khỏi dĩa`), loại bỏ hoàn toàn việc xé lẻ gây loãng cây trợ năng NVDA.
       + Chuỗi âm thanh ăn uống giữ nguyên bản sắc kết cấu từng nguyên liệu: phát đúng 3 tiếng nhai mềm (`eat_soft_food.ogg`) của mì, thịt bò, xúc xích và 1 tiếng cắn giòn rụm (`eat_crispy_food.ogg`) của khoai tây chiên.
       + Khẳng định cơ chế này là chuẩn mực lý tưởng kết hợp giữa triết lý tự do Toca Kitchen và WCAG 2.2 AAA / NVDA First, tuyệt đối giữ nguyên.
  2. **Khắc Phục Lỗi Thông Báo Khiến Người Chơi Hiểu Nhầm (NVDA Ambiguity Fix)**:
     - *Hiện tượng*: Trước đây huy hiệu và thông báo đọc cộc lốc `"5 phần trên dĩa"`, khiến người chơi khiếm thị hoang mang tưởng dĩa bị xé lẻ ra 5 món rời rạc.
     - *Giải pháp triển khai*:
       + Cập nhật placeholder HTML ban đầu (`#plate-items-count-badge`): đổi thành `"0 món trên dĩa"`.
       + Nâng cấp logic render huy hiệu trong `renderServingPlate()`:
         - Khi có 1 món: `1 món "${singleDish.name}" (${singleDish.items.length} nguyên liệu) trên dĩa`.
         - Khi có nhiều món: `${state.servedDishes.length} món (${state.plateItems.length} nguyên liệu) trên dĩa`.
         - Khi dĩa trống: `0 món trên dĩa`.
       + Nâng cấp thông báo hoàn thành món `confirmPlatingDish()` qua ARIA Live Region (`announceNVDA`):
         - Đơn món: `"Món '${customName}' đã được hoàn thành và bày biện đẹp mắt lên dĩa với phong cách ${garnish.name}! (Món ăn kết hợp từ ${finishingItems.length} nguyên liệu). Đã tự động chuyển sang tab Bàn Tiệc & Thưởng Thức..."`
         - Bàn tiệc: `"Món '${customName}' đã được hoàn thành... Bàn tiệc hiện có ${totalDishes} món hoàn chỉnh, tổng cộng ${state.plateItems.length} nguyên liệu trên dĩa..."`
  3. **Kiểm Thử & Đảm Bảo 100% Chuẩn Trợ Năng**:
     - Kiểm tra cú pháp JavaScript của `index.html` hợp lệ 100%, không phát sinh lỗi console hay lỗi DOM.


---

## 9. Thông Tin Phiên Làm Việc: Tái Cấu Trúc Bàn Chế Biến 3 Khu Vực Chuẩn Semantic Heading & Mở Rộng 69 Nguyên Liệu (4 Đường & 4 Cà Phê) (21/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu**:
  1. Giải quyết triệt để sự bất tiện khi điều hướng trong Tab 2 (Bàn Chế Biến): Trước đây người chơi dùng NVDA phải bấm `B` hoặc mũi tên qua hàng chục nút công cụ rồi mới chạm tới các nút thao tác chế biến.
  2. Tái cấu trúc Tab 2 thành **3 Khu Vực Ngữ Nghĩa Độc Lập**, mỗi khu có một thẻ Heading cấp 3 (`<h3>`) chuẩn WCAG AA/AAA:
     - **Khu 1 (`<h3 id="heading-station-picker">`)**: `1. Chọn Dụng Cụ Nấu (9 Dụng Cụ)` — thanh toolbar 9 công cụ bếp.
     - **Khu 2 (`<h3 id="heading-station-actions">`)**: `2. Thao Tác Với [Tên Dụng Cụ Đang Chọn]` — tiêu đề tự động mang tên và emoji của công cụ đang chọn (ví dụ: *"2. Thao Tác Với 🔪 Thớt & Dao Sắc"*, *"2. Thao Tác Với 🍳 Chảo Chiên Xào"*, *"2. Thao Tác Với 🌪️ Máy Xay Sinh Tố"...*). Dưới heading này là các nút chế biến chính (áp chảo, đun sôi, chiên giòn, bật lò, cuộn tròn, băm nhuyễn...).
     - **Khu 3 (`<h3 id="heading-station-items">`)**: `3. Nguyên Liệu Đang Có Trong [Tên Dụng Cụ]` — danh sách nguyên liệu trên bếp, trạng thái chín, nhiệt độ và hai nút nhanh *"📦 Cất ra Khay Tạm (Phím T)"* cùng *"🧹 Dọn sạch bếp"*.
     - **Đột phá trợ năng NVDA**: Người chơi chỉ cần nhấn phím `H` hoặc phím số `3` là nhảy tức thì giữa 3 khu vực; sau khi chọn công cụ ở Khu 1, ấn `H` một lần rồi ấn `Tab` là chạm ngay vào các nút chế biến, tiết kiệm hàng chục thao tác phím!
  3. Mở rộng kho nguyên liệu tủ lạnh từ 61 lên **69 nguyên liệu (+8 món mới)**:
     - **4 Loại Đường Mật Tự Nhiên**:
       1. 🍬 **Đường cát trắng tinh luyện** (`white_sugar`): Ngọt sắc sảo, thắng caramel làm kẹo hồ lô (tanghulu), tráng vỏ kẹo giòn hoặc đánh bông kem đường (`canBeWrapper: true`).
       2. 🧊 **Đường phèn kết tinh thanh mát** (`rock_sugar`): Pha lê đường trong veo, vị ngọt thanh tao êm dịu, chuyên chưng yến, hầm lê, nấu chè hạt sen thanh mát.
       3. 🤎 **Đường nâu mật mía tự nhiên** (`brown_sugar`): Hạt đường ẩm mịn thơm nồng mật mía và hương caramel sâu lắng, nấu sốt trân châu đường đen, làm bánh gừng (`canBeWrapper: true`).
       4. 🌴 **Đường thốt nốt thơm bùi An Giang** (`palm_sugar`): Tán đường dẻo mịn thơm ngát hương hoa thốt nốt Nam Bộ, vị ngọt bùi béo sâu sắc, làm bánh bò, chè thốt nốt, thắng sốt nướng (`canBeWrapper: true`).
     - **4 Loại Cà Phê Thượng Hạng**:
       5. ☕ **Cà phê phin truyền thống nguyên chất** (`brewed_coffee`): Cốt cà phê Robusta đen sánh đậm đà nhỏ giọt phin truyền thống, thơm nồng quyến rũ, pha cà phê sữa đá, bạc xỉu, làm Tiramisu (`texture: 'drink'`).
       6. 🫘 **Bột cà phê rang xay thơm lừng** (`coffee_grounds`): Rang mộc xay mịn thơm nức mũi, nhào chung bột mì làm cốt bánh nướng cà phê, áo kẹo.
       7. ⚡ **Cốt Cà phê Espresso đậm đặc** (`espresso`): Chiết xuất áp suất cao với lớp crema vàng óng ả, đắng sâu sắc sảo pha vị chua thanh tinh tế, làm đá xay mát lạnh (`texture: 'drink'`).
       8. 🧋 **Cà phê hòa tan thơm béo** (`instant_coffee`): Bột cà phê tiện lợi, hòa tan tức thì vào sữa, kem béo hoặc bột bánh quy.
  4. Cập nhật nhóm danh mục tủ lạnh:
     - Nhãn tổng số món: `Tất cả (69 món)`.
     - Nhóm đồ ngọt đổi tên thành: `☕🍫 Cà Phê, Đường & Đồ Ngọt`.
  5. Loại Bỏ Triệt Để 100% Công Thức Cứng (Zero Hardcoded Recipes) & Chuẩn Hóa Hóa Học Cảm Quan Thuần Túy:
     - **Phê bình chính xác từ tác giả (LC Boy)**: Việc gán nhãn tĩnh theo tên món như "Cà Phê Sữa Béo Ngậy", "Cà Phê Trứng Hà Nội", "Cà Phê Hương Mật" là vi phạm triết lý tự do sandbox Toca Kitchen, vô tình áp đặt suy đoán của máy móc lên sự sáng tạo của người chơi.
     - **Giải pháp chuyển hóa sang Hóa Học Cảm Quan Thuần Túy (Pure Sensory Chemistry)**:
       + Xóa bỏ 100% các cờ và nhãn tên món cứng.
       + Thay bằng phản ứng trục vị tự nhiên: `✨ Lớp Béo Ngậy Làm Dịu Vị Đắng (Tạo chiều sâu êm mượt và cân bằng hậu vị)` kích hoạt khi bất kỳ món nào có `fatty >= 1.8 && bitter >= 2.0` (đúng cho mọi sự kết hợp nguyên liệu, không áp đặt tên món).
       + Thay bằng phản ứng biến đổi vật lý/nhiệt: `🔥 Tinh Thể Đường Chuyển Hóa Khi Gặp Nhiệt (Dậy hương thơm ngọt đượm và tạo kết cấu bóng bẩy)` khi đường gặp nhiệt độ cao trong chảo hoặc lò.
       + Quyền đặt tên món và định nghĩa món ăn thuộc về 100% quyền tự do của người chơi tại bảng Hoàn Thành Món (Phím P).
  6. Cập nhật cơn thèm (`cravings`) của 4 thực khách và tài liệu hướng dẫn phím tắt modal Help:
     - Hướng dẫn phím `H` / phím số `3` trong NVDA để nhảy qua 3 khu vực Bếp.
     - Thêm mẹo làm kẹo hồ lô bọc đường caramel giòn tan, cà phê sữa đá tuyết, cà phê trứng và chè sen đường phèn.
  7. Xây dựng và thực thi bộ kiểm thử tự động toàn diện (`test_culinary_upgrade.js`) bao phủ 4 nhóm kiểm thử: Semantic Structure 3 Headings, Database 69 nguyên liệu, Dynamic Heading Updates và Sensory Chemistry Synergies $\rightarrow$ Kết quả tuyệt đối **28/28 TESTS PASS (100%)**, bảo đảm 100% không còn bất kỳ công thức cứng nào trong mã nguồn.


---

## 11. Thông Tin Phiên Làm Việc: Khắc Phục Triệt Để Lỗi Mô Tả Món Nhồi/Cuộn & Nâng Cấp Động Cơ Ánh Xạ Phương Pháp Nấu methodToText (21/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu & Các Cải Tiến Triển Khai**:
  1. **Khắc Phục Lỗi Gán Cứng "Nướng Thơm Giòn" Ở Món Nhồi (Fix Hardcoded Stuffed Vessel Cooking)**:
     - *Hiện tượng*: Người chơi xay nhuyễn cà phê và ca-cao, nhồi vào bột mì rồi chiên ngập dầu giòn tan, nhưng khi nếm hoặc bấm phím `I`, NVDA lại đọc *"lớp vỏ Bột mì đa dụng cao cấp nướng thơm giòn bên ngoài"*.
     - *Nguyên nhân*: Tại dòng 3298 trong `generateSensoryTastingReview`, hệ thống đã gán cứng chuỗi `stuffedItem.cookLevel >= 1 ? 'nướng thơm giòn' : 'giòn xốp'`, bỏ qua hoàn toàn phương pháp nấu thực tế `stuffedItem.cookMethod`.
     - *Khắc phục*: Thay thế bằng cơ chế ánh xạ động `methodToText(stuffedItem.cookMethod, stuffedItem.cookLevel, stuffedItem.outerItem?.needsCooking)`. Khi chiên ngập dầu $\rightarrow$ đọc *"được chiên ngập dầu giòn tan"*; khi áp chảo $\rightarrow$ *"được áp chảo chín tới vàng ươm"*; khi đút lò $\rightarrow$ *"được đút lò nướng thơm phức"*; khi nướng than $\rightarrow$ *"được nướng than hoa thơm lừng"*; khi luộc $\rightarrow$ *"được luộc chín mềm"*; khi chưa nấu $\rightarrow$ *"còn tươi sống chưa qua nhiệt"*.
  2. **Khắc Phục Lỗi Vỏ Nhồi / Vỏ Cuộn Bị Lặp Lại Trong Ruột Nhân (Fix Wrapper/Vessel Leaking Into Stuffing)**:
     - *Hiện tượng*: NVDA đọc *"vỏ Bột mì... nhồi đầy đặn nhân Bột mì, Cà phê & Ca-cao"*, vỏ ngoài bị trùng lặp làm một thành phần của nhân.
     - *Nguyên nhân*: Thuộc tính `subItems` chứa cả vỏ ở vị trí đầu tiên `[outerVessel, ...innerStuffings]`, và khi duyệt `.map(s => s.name)` để mô tả nhân đã lấy nhầm cả vỏ ngoài.
     - *Khắc phục*:
       - Bổ sung trường `innerItems: [...innerStuffings]` cho `stuffedItem` và `innerItems: [...innerFillings]` cho `rolledItem`.
       - Trong hàm `generateSensoryTastingReview`, trích xuất ruột nhân từ `innerItems` (hoặc tự động lọc bỏ `outerItem` ra khỏi `subItems`), đảm bảo ruột nhân chỉ chứa các nguyên liệu thực sự được nhồi/cuộn vào trong.
  3. **Khắc Phục Lỗi Bẫy Cấp Độ 2 Trong Hàm Ánh Xạ `methodToText`**:
     - *Hiện tượng*: Dòng `if (level === 2) return 'chiên giòn rụm'` khiến mọi món ăn nấu cấp độ 2 (kể cả nướng lò, nướng than hoa hay luộc hầm) đều bị gán nhãn sai thành "chiên giòn rụm".
     - *Khắc phục*: Phân nhánh chi tiết cấp độ 1 và cấp độ 2 cho từng phương pháp: `deep_fried` (chiên ngập dầu vàng ươm giòn rụm), `grilled` (nướng than hoa xém cạnh thơm phức), `baked` (đút lò nướng vàng ươm giòn rụm), `fried` (áp chảo xém cạnh giòn thơm), `boiled` (ninh hầm nhừ mềm ngọt nước).
  4. **Đồng Bộ Nhiệt Khi Nấu Cho `outerItem` Và `innerItems`**:
     - Khi chế biến nhiệt (chiên, nướng, áp chảo, luộc), đồng bộ `cookLevel`, `cookMethod` và tắt cờ `needsCooking` cho cả `item.outerItem` và `item.innerItems`.
  5. **Kiểm Thử Toàn Diện Tự Động**:
     - Xây dựng và thực thi bộ kiểm thử tự động độc lập mô phỏng đúng kịch bản của người chơi (Cà phê + Ca-cao xay nhuyễn $\rightarrow$ Nhồi vào Bột mì $\rightarrow$ Chiên ngập dầu $\rightarrow$ Báo cáo cảm quan), kết quả:
       - Tuyệt đối không chứa chữ "nướng" (PASS).
       - Nhận diện chính xác "chiên ngập dầu giòn tan" (PASS).
       - Tuyệt đối không lặp lại bột mì trong nhân nhồi (PASS).

---

## 12. Thông Tin Phiên Làm Việc: Bổ Sung 16 Nguyên Liệu Mới (Nhóm Đậu, Hạt Sen, Củ Sen & Nhóm Hành, Mỡ Hành, Hành Phi), Danh Mục Ngăn Tủ '🫘 Đậu, Hạt & Củ Sen' & Tối Ưu Hóa Học Vị Giác (22/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Mục tiêu & Các Cải Tiến Triển Khai**:
  1. **Bổ Sung 16 Nguyên Liệu Mới Đậm Chất Ẩm Thực Việt Nam & Quốc Tế**:
     - **Nhóm Các Loại Đậu, Hạt & Củ Sen (9 nguyên liệu)**:
       - 🟢 **Đậu xanh bở bùi** (`mung_bean`): Nấu chín bở tơi ngọt bùi thanh mát, chuyên nấu chè đường phèn, xôi vò, làm nhân bánh đậu xanh hoặc nhân chả giò.
       - ⚫ **Đậu đen xanh lòng bùi đậm** (`black_bean`): Bùi đậm đà giải nhiệt mùa hè, nấu chè đậu đen ngọt mát, hầm chân giò ngọt nước hoặc nấu xôi béo ngậy.
       - ⚪ **Đậu trắng hạt to dẻo bùi** (`white_bean`): Hạt to mẩy dẻo bùi, nấu chè đậu trắng cốt dừa béo ngậy, hầm bò sốt vang hoặc nấu súp rau củ thanh đạm.
       - 🔴 **Đậu đỏ hạt ngọc bùi ngọt** (`red_bean`): Hạt đỏ thắm ngọt bùi thanh tâm dưỡng nhan, nấu chè đậu đỏ cầu duyên, cháo bổ dưỡng hoặc làm nhân bánh ngọt ngào.
       - 🟡 **Đậu nành hạt vàng giàu đạm** (`soybean`): Hạt vàng óng giàu đạm thực vật, xay sữa đậu nành thanh khiết béo ngậy, nấu súp hầm hoặc rang sấy ăn bùi giòn.
       - 🪷 **Hạt sen tươi bở bùi thanh tao** (`lotus_seed`): Hạt sen bở tơi thanh khiết an thần, chuyên chưng yến, hầm gà bổ dưỡng, nấu chè đường phèn thanh tao hoặc làm nhân bánh trung thu.
       - 🥔 **Củ sen tươi giòn ngọt thanh mát** (`lotus_root`): Giòn ngọt sần sật mọng nước, có các lỗ rỗng hoàn hảo $\rightarrow$ **`canBeVessel: true`** (khoét lỗ nhồi thịt băm tôm xay chiên giòn rụm), bóp gỏi hoặc hầm canh sườn ngọt nước.
       - 🫛 **Đậu que giòn ngọt mọng nước** (`green_beans`): Trái đậu non xanh giòn ngọt nước, xào thịt bò xém cạnh, luộc chín chấm kho quẹt hoặc nướng áp chảo.
       - 🟢 **Đậu Hà Lan ngọt mọng hạt** (`green_peas`): Từng hạt tròn mọng ngọt thanh bùi dẻo, xào cơm chiên Dương Châu, nấu súp kem béo ngậy hoặc xào tôm mực.
       - *Điều chuyển `roasted_peanuts` (Đậu phộng rang)* từ `starch` sang danh mục `beans_seeds` để gom nhóm hạt chuẩn xác.
     - **Nhóm Các Loại Hành, Mỡ Hành & Hành Phi (7 nguyên liệu)**:
       - 🧅 **Củ hành tây giòn mọng nước** (`onion`): Giòn ngọt mọng nước hăng cay dịu, tách bẹ làm khuôn nhồi thịt $\rightarrow$ **`canBeVessel: true`** (nhồi thịt nướng lò caramel hóa ngọt lịm hoặc bóp gỏi gà tái chanh).
       - 🧅 **Hành tím củ giòn thơm nồng** (`shallot`): Thơm nồng ngào ngạt, băm nhuyễn phi thơm, ướp thịt nướng than hoa, bóp gỏi ngó sen tôm thịt hoặc ngâm giấm chua ngọt giòn tan.
       - 🌿 **Hành lá tươi xanh thơm ngát** (`scallion`): Cọng hành tươi xanh thơm mát nức lòng $\rightarrow$ **`canBeWrapper: true`** (chần mềm làm dây buộc túm chả cuốn), rắc lên mọi món súp cháo phở, xào thịt.
       - 🧅 **Hành phi vàng giòn rụm thơm lừng** (`fried_shallots`): Từng lát hành phi vàng ươm giòn rụm béo bùi thơm ngất ngây (kết cấu **`crispy`**), rắc lên xôi xéo, bánh cuốn nóng, hủ tiếu hoặc bánh tráng trộn.
       - 🧈 **Mỡ hành béo ngậy óng ánh** (`scallion_oil`): Hành hoa xối mỡ nóng ngào ngạt béo ngậy óng ả (kết cấu **`soft`**), rưới lên bắp nướng, sò điệp hàu nướng than, cơm tấm sườn hoặc bánh hỏi.
       - 🌿 **Hẹ lá xanh thơm ngọt thanh** (`garlic_chives`): Lá hẹ dẹp thơm dịu ngọt thanh, nấu canh hẹ đậu hũ non thịt băm thanh mát giải nhiệt, xào hến hoặc cuốn gỏi cuốn tôm thịt.
       - 🥬 **Tỏi tây Bo-rô ngọt dày** (`leek`): Thân trắng dày mọng nước ngọt thanh đậm đà, xào thịt bò, nấu súp hầm kem béo kiểu Âu hoặc nướng bơ tỏi thơm nức mũi.
  2. **Tái Cấu Trúc Danh Mục Ngăn Tủ Lạnh & Tự Động Hóa Số Lượng**:
     - Thêm danh mục mới `beans_seeds`: **"🫘 Đậu, Hạt & Củ Sen"**.
     - Cập nhật danh mục rau củ thành `veg`: **"🥬 Rau Củ & Các Loại Hành"**.
     - Cập nhật danh mục tinh bột thành `starch`: **"🍚 Cơm, Khoai & Phô Mai"**.
     - Tổng số lượng nguyên liệu trong tủ tăng từ **69 lên 85 nguyên liệu**.
     - Cập nhật tab `all` tự động hiển thị: `Tất cả (85)` và thông báo NVDA: `Đã mở ngăn tủ: Tất cả 85 món`.
     - Cập nhật badge Tủ Lạnh và placeholder tìm kiếm: `🔍 Tìm nguyên liệu (vd: đậu xanh, củ sen, hành phi, mỡ hành, mì ý, xúc xích...)`.
  3. **Nâng Cấp Động Cơ Hóa Học Vị Giác & Phản Ứng Hòa Vị Thuần Túy (Sensory Synergies - Zero Recipe Assumption)**:
     - `🧅✨ Tinh Dầu Hành & Độ Béo Dậy Hương (Hương thơm bốc tỏa ngào ngạt kích thích gai vị giác)`: Kích hoạt khi có Hành phi hoặc Mỡ hành kết hợp cùng tinh bột hoặc đạm hoặc khi chỉ số thơm béo cao, phản ánh sự khuếch tán tinh dầu thơm hòa tan trong lipid.
     - `🫘✨ Hòa Vị Bùi Ngọt Thanh Khiết (Vị bùi bở của đậu hạt quyện vị ngọt thanh tạo chiều sâu êm dịu)`: Kích hoạt khi đậu hạt được nấu chín kết hợp cùng chất tạo ngọt (đường, mật, sữa), phản ánh tương tác giữa tinh bột bùi bở và vị ngọt dịu, tuyệt đối KHÔNG gán nhãn thành "Chè" hay bất kỳ món cứng nào.
     - `🔥🧅 Vị Ngọt Thực Vật Chuyển Hóa Qua Nhiệt (Vị hăng cay chuyển hóa thành ngọt thanh đượm đà)`: Kích hoạt khi củ hành được nấu qua nhiệt (xào, nướng, áp chảo), phản ánh sự chuyển hóa tự nhiên của đường thực vật và phản ứng Maillard.
  4. **Tối Ưu Trạm Nhồi & Trạm Cuốn Cho Củ Sen, Hành Tây & Hành Lá**:
     - `stuff_pack`: Tự động nhận diện các nguyên liệu có `canBeVessel: true` (bao gồm `lotus_root` Củ sen, `onion` Hành tây, `banh_mi_vn`, `croissant`, `bell_pepper`, `squid`, `oreo`...).
     - `roll_tight`: Tự động nhận diện các nguyên liệu có `canBeWrapper: true` (bao gồm `scallion` Hành lá, `rice_paper`, `nori_seaweed`, `betel_leaf`, `pho_sheet`, `beef`...).
  5. **Kiểm Thử Toàn Diện Tự Động (Automated Test Suite)**:
     - Xây dựng và thực thi thành công bộ kiểm thử kịch bản món ăn `test_new_ingredients_scenarios.js` đạt kết quả tuyệt đối **16/16 PASS (100%)**:
       - 85 nguyên liệu duy nhất, không trùng lặp ID (PASS).
       - Phân loại danh mục chuẩn xác (PASS).
       - Kết cấu `crispy` cho hành phi & củ sen, `soft` cho mỡ hành (PASS).
       - Cờ `canBeVessel` và `canBeWrapper` hoạt động chính xác (PASS).
       - Kích hoạt đúng 3 phản ứng hòa vị mới (Chè hạt sen, Hành phi mỡ hành, Hành tây caramel) (PASS).
       - Nhồi củ sen với thịt nạc băm và chiên ngập dầu giòn tan, thực khách nhận xét đúng 4 tầng cảm quan (PASS).


---

## 10. Thông Tin Phiên Làm Việc: Động Cơ Gia Vị Phân Tầng Cho Món Cuốn & Món Nhồi (Layered Seasoning Engine) & Chuẩn Hóa Cảm Quan NVDA (22/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Vấn đề giải quyết**:
  - Khi người chơi làm món cuốn (Roll) hoặc món nhồi (Stuff) — ví dụ: bánh mì kẹp nhân pate, xúc xích, thịt ba chỉ đã chiên và nêm tương ớt + mayonnaise, sau đó nhồi vào bánh mì rồi rắc muối lên vỏ ngoài — trước đây hệ thống gộp phẳng toàn bộ gia vị vào một mảng duy nhất và đọc ra chung chung: `được nêm với muối, tương ớt, và sốt mayonnaise`. Người chơi không cảm nhận được sự phân tầng thực tế giữa gia vị nêm vỏ ngoài và gia vị nêm nhân bên trong.
- **Các giải pháp & kiến trúc kỹ thuật đã triển khai**:
  1. **Kiến Trúc Mô Hình Dữ Liệu Gia Vị Phân Tầng (`outerSpices` vs `innerSpices`)**:
     - Cập nhật cả 2 trạm chế biến cốt lõi `roll_tight` (Bàn Cuốn Đa Năng) và `stuff_pack` (Trạm Kẹp & Nhồi Nhân) để khởi tạo và lưu giữ độc lập 2 mảng gia vị:
       - `outerSpices`: Lưu giữ các gia vị của lớp vỏ ngoài (kế thừa từ `outerWrapper.spicesApplied` / `outerVessel.spicesApplied` và ghi nhận thêm bất kỳ gia vị nào người chơi nêm sau khi đã cuộn/nhồi).
       - `innerSpices`: Gom toàn bộ gia vị đã được nêm vào các nguyên liệu nhân bên trong trước khi cuộn/nhồi.
       - `spicesApplied`: Tiếp tục duy trì danh sách tổng thể để bảo đảm tính tương thích hóa học vị giác 8 trục.
  2. **Nâng Cấp Hàm Nêm Gia Vị Thông Minh (`applySpice`)**:
     - Khi người chơi chọn nêm bất kỳ gia vị nào (Muối, Tiêu, Bơ, Mật ong...) lên món đã cuộn (`rolled`) hoặc đã nhồi (`stuffed`):
       - Hệ thống tự động ghi nhận gia vị đó vào `it.outerSpices` và đồng bộ vào `it.outerItem.spicesApplied`.
       - ARIA Live Region thông báo đích danh: `Đã nêm [Tên gia vị] lên lớp vỏ ngoài của món "[Tên món]".` giúp người dùng khiếm thị cảm nhận rõ ràng vị trí gia vị bám vào.
  3. **Chuẩn Hóa Thuật Toán Hòa Trộn Hương Vị Cảm Quan (`fillingShare`)**:
     - Áp dụng hệ số thể tích gia quyền `fillingShare = 1 / Math.sqrt(Math.max(1, innerCount))` khi hòa trộn hương vị các nhân trong `roll_tight` và `stuff_pack`.
     - Khắc phục triệt để hiện tượng cộng dồn số học khiến các món kẹp nhiều nhân đạm mặn (pate, xúc xích, thịt ba chỉ) bị đội điểm mặn vượt ngưỡng 5.5 và kích hoạt nhầm gag reaction "mặn chát khát nước". Nâng ngưỡng mặn cực đoan lên > 7.0 (chỉ kích hoạt khi cố tình nêm quá nhiều lần muối/nước mắm).
  4. **Nâng Cấp Động Cơ Cảm Quan Ẩm Thực Phân Tầng (`generateSensoryTastingReview`)**:
     - Tách bạch 4 kịch bản cảm quan cấu trúc:
       - *Cả vỏ và nhân đều có gia vị*: `Món '[Tên]' với lớp vỏ [Vỏ] [Chế biến] được nêm [Gia vị vỏ] bên ngoài, nhồi đẫm/cuộn trọn phần nhân [Các nhân] được nêm đậm đà với [Gia vị nhân] bên trong, có vị [Top 2-3 vị nổi bật]...`
       - *Chỉ nhân có gia vị, vỏ giữ mộc*: `với lớp vỏ [Vỏ] [Chế biến] bên ngoài, nhồi đẫm phần nhân [Các nhân] được nêm với [Gia vị nhân] bên trong...` (Tuyệt đối không gán ghép gia vị nhân ra vỏ).
       - *Chỉ vỏ có gia vị, nhân giữ mộc*: `với lớp vỏ [Vỏ] được nêm [Gia vị vỏ] bên ngoài, nhồi phần nhân thanh đạm [Các nhân] bên trong...`
       - *Món rời/không cuốn nhồi*: Gom gia vị tự nhiên ở đuôi câu, loại bỏ hoàn toàn việc lặp lại từ ngữ vô nghĩa.
  5. **Trực Quan Hóa Thẻ Món & Trợ Năng Báo Cáo Phím `I`**:
     - Cập nhật hàm `describeItemStateShort(item)`: Thẻ món ăn trên Bàn Chế Biến, Khay Tạm và Đĩa Ăn hiển thị rành mạch: `vỏ nêm: Muối biển; nhân nêm: Tương ớt cay ngọt, Sốt Mayonnaise`.
     - Phím tắt `I` (`readDishSummary`) và lời thoại thực khách khi thưởng thức (`feedCharacter`) đồng bộ đọc to câu cảm quan phân tầng chi tiết.
  6. **Kiểm Thử Tự Động Toàn Diện (`test_layered_spices.js`)**:
     - Xây dựng và thực thi thành công 4 kịch bản kiểm thử:
       - *CA 1 (Bánh mì kẹp nhân chiên nêm tương ớt & mayonnaise, vỏ ngoài rắc muối)*: PASS 100%.
       - *CA 2 (Bò cuộn nấm kim châm nướng than phết mật ong ngoài, nhân nêm tiêu & dầu hào trong)*: PASS 100%.
       - *CA 3 (Gỏi cuốn tôm thịt nêm nước mắm trong nhân, vỏ bánh tráng mộc)*: PASS 100%.
       - *CA 4 (Bánh mì nướng bơ rắc muối ngoài, kẹp dưa leo mộc thanh đạm)*: PASS 100%.
     - Kết quả kiểm thử: **21/21 PASS (100%)**, cú pháp JavaScript `index.html` hợp lệ 100%.

---

## 13. Thông Tin Phiên Làm Việc: Chuẩn Hóa Cấu Trúc Ngữ Pháp Liệt Kê 100% Nguyên Liệu & Gia Vị, Tối Ưu Nhịp Đọc NVDA (23/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Vấn đề giải quyết**:
  1. *Lỗi dính liền ngữ nghĩa và thiếu nhịp thở NVDA*: Trong các món nhồi (`stuffedItem`) và món cuốn (`rolledItem`), danh sách nguyên liệu nhân và câu nêm gia vị bị ghép dính liền nhau (ví dụ: `...Thịt ba chỉ heo được nêm đậm đà với...`). Trình đọc màn hình NVDA đọc dồn dập không có dấu ngắt, khiến người nghe hiểu nhầm chỉ có miếng thịt ba chỉ heo được nêm gia vị.
  2. *Lỗi lặp từ nối liên tiếp ("và ... và ...", "cùng ... cùng ...")*: Do sử dụng `.join(' và ')` hoặc `.join(' cùng ')` thẳng đuột, câu mô tả có tới 4-5 từ "và" hoặc nhiều từ "cùng" lặp đi lặp lại khiến lời nhận xét của thực khách bị giật cục, nói vấp.
  3. *Lỗi cắt xén thông tin món ăn (.slice)*: Món rời nhiều nguyên liệu từng bị `.slice(0, 3)` làm mất các nguyên liệu thứ 4, 5, 6; và gia vị từng bị `.slice(0, 4)` gom thành "và X loại gia vị khác", làm giảm tính tự do sáng tạo và không trân trọng trọn vẹn thành quả của người chơi.
  4. *Lỗi lặp từ ", và " trong thực đơn đại tiệc 5 sao*: Lời thoại Chef Bear từng dùng `.join(', và ')` gây lặp từ giữa các món ăn.
- **Các giải pháp & kiến trúc kỹ thuật đã triển khai**:
  1. **Xây Dựng Hàm Tiện Ích Trợ Năng Chuẩn Mực (`formatNaturalList`)**:
     - Tự động ghép danh sách nguyên liệu và gia vị theo đúng chuẩn cú pháp ngữ pháp tiếng Việt:
       - 1 phần tử: `A`
       - 2 phần tử: `A [conjunction] B` (ví dụ: `A và B` hoặc `A cùng B`)
       - 3+ phần tử: `A, B, C [conjunction] D`
  2. **Tối Ưu Hóa Nhịp Điệu NVDA & Chèn Dấu Chấm Ngắt Nhịp Cho Món Nhồi & Món Cuốn**:
     - Phân tách rõ rệt danh sách nhân và câu gia vị bằng dấu chấm câu:
       `nhồi đẫm phần nhân [Danh sách nhân]. Được nêm đậm đà với [Danh sách gia vị nhân] bên trong`
     - Viết hoa chữ `Được` sau dấu chấm câu tạo nhịp nghỉ ngắt quãng tự nhiên (~300ms) cho các bộ đọc NVDA (Sao Mai, Microsoft An, eSpeak-NG), phân định rành mạch cấu trúc nhân và gia vị nêm.
     - Bổ sung dấu phẩy `, được nêm...` ở lớp vỏ ngoài để tránh lặp từ "được... được...".
  3. **Xóa Bỏ Triệt Để Mọi Cơ Chế Cắt Xén — Liệt Kê Đầy Đủ 100%**:
     - *Món rời*: Loại bỏ `.slice(0, 3)`, liệt kê 100% toàn bộ nguyên liệu xào/nấu bằng `formatNaturalList(items, 'cùng')`.
     - *Gia vị nêm rời*: Loại bỏ `.slice(0, 4)` và nhãn `và X loại gia vị khác`, liệt kê 100% toàn bộ gia vị bằng `formatNaturalList(looseSpices, 'và')`.
     - *Món cuốn & món nhồi*: Liệt kê đầy đủ 100% nhân và 100% gia vị vỏ lẫn ruột.
  4. **Chuẩn Hóa Lời Thoại Mâm Cỗ Đại Tiệc (3 đến 6+ món)**:
     - Sửa `.join(', và ')` thành `formatNaturalList` ở dòng 3922, giúp lời nhận xét của Bếp Trưởng Gấu Bự khi đạt 5 sao đại tiệc trở nên trơn tru, hào sảng và không còn lỗi lặp từ.
     - Khẳng định và bảo toàn cơ chế: Mâm cỗ 5 món, 6 món hay nhiều hơn đều được duyệt và xướng tên đầy đủ 100% cả trên Bàn Tiệc (Tab 5), Lời nhận xét khi đút ăn (Phím F) và Báo cáo phím tắt I (`readDishSummary`).
  5. **Kiểm Thử Hồi Quy Tự Động Toàn Diện**:
     - Chạy script kiểm thử chuyên sâu `test_word_repetition.js` và `test_full_listing.js`: xác nhận triệt tiêu 100% cảnh báo lặp từ "A và B và C", liệt kê đủ 6/6 nguyên liệu và 6/6 gia vị trong kịch bản cực đại.
     - Chạy lại các bộ kiểm thử tích hợp (`test_new_ingredients_scenarios.js`) đạt kết quả tuyệt đối **16/16 PASS (100%)**.


---

## 14. Thông Tin Phiên Làm Việc: Xây Dựng Trạm Pha Chế Đồ Uống Tự Do (10. Trạm Pha Chế) & Ma Trận 5 Âm Thanh Foley Play Wait (24/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Bối cảnh & Vấn đề giải quyết**:
  1. *Khái niệm đồ uống bị đóng khung trong Máy Xay Sinh Tố*: Trước đây, món ăn chỉ được coi là "đồ uống" khi đi qua Máy Xay Sinh Tố (`kind: 'blended'`), phát tiếng máy xay rè rè (`blender.ogg`) và gán nhãn "xay nhuyễn sánh mịn". Khi người chơi muốn pha cà phê phin nguyên chất, cà phê sữa đá, bạc xỉu, trà chanh đá hay cacao nóng, việc phải đưa vào máy xay làm mất đi tính chân thực và thanh tao của nghệ thuật pha chế.
  2. *Nghịch lý âm thanh khi pha chế không có đá*: Người dùng Vũ Anh Lộc (LC Boy) đã chỉ ra phát hiện vật lý vô cùng sắc bén: nếu người chơi pha một ly nước nguội hoặc nước nóng không có đá mà lại nghe tiếng đá va lách cách thì sẽ rất vô lý và gượng gạo.
  3. *Bảo tồn triệt để Triết lý Toca Kitchen Sandbox (Zero Hardcoded Recipes)*: Tuyệt đối không hardcode bất kỳ công thức cứng nào (như không tự tiện gán ghép cà phê + sữa thành "Cà phê sữa" hay áp đặt công thức sách giáo khoa). Mọi thức uống đều là sự kết hợp tự do 100% của người chơi.
- **Các giải pháp & kiến trúc kỹ thuật đã triển khai**:
  1. **Bổ Sung Dụng Cụ Thứ 10: "🍹 Trạm Pha Chế Đồ Uống" (`beverage_station`)**:
     - Nâng cấp thanh công cụ từ 9 lên 10 dụng cụ nấu ăn: `<div id="station-selector-grid" class="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5" role="toolbar" aria-label="Chọn 1 trong 10 công cụ nấu ăn">`.
     - Hỗ trợ 3 thao tác chuyên biệt với phím tắt trực quan:
       - 🥄 **Khuấy Đều & Rót Ly (Phím C)** (`stir_pour`): Khuấy tan nguyên liệu lỏng trong ly thủy tinh.
       - 🫨 **Lắc Bình Shaker (Phím S)** (`shake_shaker`): Lắc sủi bọt mịn và hòa quyện bồng bềnh trong bình Boston Shaker.
       - ♨️ **Hãm Trà & Cà Phê Nóng (Phím B)** (`brew_infuse`): Rót nước sôi hãm nóng chiết xuất hương vị sâu lắng bốc khói.
  2. **Tích Hợp Ma Trận 5 Âm Thanh Foley Thực Tế Chế Biến Theo Cơ Chế Play Wait**:
     - Cả 5 file âm thanh đều được phát theo cơ chế **Play Wait** (`await playExternalAudio(soundFile, true)`), kích hoạt `state.isCookingBusy = true` và `aria-busy="true"` chống spam click:
       - `stir_liquid.ogg`: Khuấy ly khi **KHÔNG CÓ ĐÁ** (tiếng nước lỏng chảy róc rách, muỗng xoay êm trong chất lỏng).
       - `stir_ice.ogg`: Khuấy ly khi **CÓ ĐÁ VIÊN** (tiếng muỗng chạm đá viên lách cách trong ly).
       - `shake_liquid.ogg`: Lắc bình shaker khi **KHÔNG CÓ ĐÁ** (Dry Shake - tiếng chất lỏng vỗ sóng sánh mạnh trong bình kín).
       - `shake_ice.ogg`: Lắc bình shaker khi **CÓ ĐÁ VIÊN** (tiếng đá xóc lách cách rộn rã trong bình kim loại).
       - `brew_drink.ogg`: Hãm nước sôi nóng hổi (tiếng rót nước sôi và tiếng xì hơi nước bốc khói).
  3. **Vật Lý & Hóa Học Vị Giác Cảm Quan Đồ Uống (`kind: 'beverage'`)**:
     - Tạo ra thực thể thức uống hoàn chỉnh với `texture = 'drink'`.
     - Tự động nhận diện cờ vật lý `hasIce = true` khi trong thành phần có đá viên (`ice_cubes`).
     - Khi thực khách thưởng thức (`feedCharacter`):
       - Nếu có đá (`hasIce: true`) $\rightarrow$ phát âm thanh hút rột rột lách cách đá viên `drink_with_ice.ogg`.
       - Nếu không đá (`hasIce: false`) $\rightarrow$ phát âm thanh uống ừng ực thanh mát `drink.ogg`.
     - Tác động cảm quan vật lý tự nhiên:
       - Có đá: làm dịu độ gắt của vị đắng, ngọt, chua (`* 0.88`) và tăng cảm giác thanh mát sảng khoái.
       - Hãm nóng: làm dậy hương thơm nồng nàn (`aroma += 1.8`) và vị đắng đậm sâu lắng.
       - Lắc shaker: tăng độ sánh bọt và béo bùi (`aroma += 1.2`, `fatty *= 1.08`).
  4. **Nâng Cấp Bộ Máy Đánh Giá Cảm Quan (`generateSensoryTastingReview`)**:
     - Thêm nhánh miêu tả cấu trúc đồ uống chân thực:
       - Hãm nóng: `Món '[Tên món]' được hãm nóng bốc khói thơm nồng từ [100% nguyên liệu]...`
       - Lắc shaker: `Món '[Tên món]' được lắc bình shaker sủi bọt mát lạnh sảng khoái từ [100% nguyên liệu]...`
       - Khuấy ly: `Món '[Tên món]' được pha chế khuấy đều mát lạnh sảng khoái từ [100% nguyên liệu]...`
     - Tuyệt đối không gán ghép công thức cứng, phản ánh trung thực 100% tên món do người chơi đặt và danh sách nguyên liệu/gia vị đã nêm.
  5. **Mở Rộng Kho Nguyên Liệu Lên 87 Món (+2 Nguyên Liệu Nước & Trà)**:
     - 💧 **Nước lọc tinh khiết** (`pure_water`): Nước lọc trong veo thanh mát, dùng pha loãng cà phê, châm trà, pha nước chanh đường.
     - 🍃 **Lá trà xanh tươi non** (`green_tea_leaves`): Búp trà xanh tươi mơn mởn, vị chát thanh hậu ngọt sâu lắng.
  6. **Đồ Họa Canvas 2D Quầy Bar Pha Chế & Trợ Năng WCAG 2.2 AAA**:
     - Vẽ quầy bar gỗ sang trọng, thảm cao su đen chống trượt, ly thủy tinh pha chế ở trung tâm với mực nước màu sắc động và đá viên nổi bồng bềnh.
     - Phím tắt bàn phím toàn diện: `C` (Khuấy), `S` (Lắc shaker), `B` (Hãm nóng) được thông báo rõ ràng cho NVDA.
  7. **Kiểm Thử Tự Động Toàn Diện 7 Kịch Bản Đồ Uống (`test_beverage_station.js`)**:
     - Kiểm thử thành công 100% các kịch bản:
       - *Kịch bản 1 (Cà phê phin nguyên chất hãm nóng)*: `brew_drink.ogg` $\rightarrow$ `drink.ogg`, không có sữa, không có đá.
       - *Kịch bản 2 (Cà phê phin + Sữa đặc + Đá viên khuấy ly)*: `stir_ice.ogg` $\rightarrow$ `drink_with_ice.ogg`, liệt kê đủ 100% nguyên liệu.
       - *Kịch bản 3 (Trà xanh + Nước lọc + Chanh + Mật ong + Đá lắc shaker)*: `shake_ice.ogg` $\rightarrow$ `drink_with_ice.ogg`.
       - *Kịch bản 4 (Sữa tươi + Ca-cao KHÔNG ĐÁ khuấy & lắc)*: `stir_liquid.ogg` & `shake_liquid.ogg` $\rightarrow$ `drink.ogg`.
       - *Kịch bản 5 (Cà phê + Bò sống + Ớt + Mắm + Đá)*: Nhận diện phản ứng gag hốt hoảng thịt sống tanh của Toca Kitchen.
       - *Kịch bản 6 (Cà phê + Khoai lang mật chín + Đá)*: Lắc shaker đá mát lạnh, liệt kê 100% nguyên liệu.
     - Kết quả kiểm thử: **40/40 TESTS PASS (100%)**.
  8. **Đặc Tính Nhiệt Động Học: Nước Sôi Làm Tan Chảy Hoàn Toàn Đá Viên (`iceMelted`)**:
     - *Hiện tượng vật lý*: Khi chọn thao tác **♨️ Hãm Trà & Cà Phê Nước Nóng (`brew_infuse`)** mà trong ly có **Đá Viên (`ice_cubes`)** (hoặc khi đun nấu trong Nồi luộc, Chảo chiên, Lò nướng): Nhiệt lượng nước sôi 90°C–100°C lập tức làm tan chảy toàn bộ đá viên thành nước lỏng.
     - *Trạng thái vật lý*: Cờ `hasIce` tự động chuyển thành `false` (vì không còn đá viên rắn), kích hoạt cờ `iceMelted = true`.
     - *Nhiệt độ dung dịch*: Cân bằng nhiệt hạ xuống thành nước ấm dịu thanh mát (~40°C), làm dịu độ đậm đặc nhưng hòa quyện êm dịu (`sweet *= 0.92`, `bitter *= 0.92`, `aroma += 1.2`).
     - *Âm thanh khi thưởng thức*: Tự động chuyển sang phát tiếng uống nước ấm không đá `drink.ogg` (vì không còn đá viên để hút lách cách).
     - *Thông báo NVDA & Nhận xét cảm quan*:
       - NVDA: `"Nước sôi nóng hổi đã làm tan chảy toàn bộ đá viên! Hòa quyện thành thức uống '[Tên món]' ấm dịu thanh mát."`
       - Thực khách nhận xét: `"Món '[Tên món]' được hãm nước sôi làm tan chảy hoàn toàn đá viên, tạo nên thức uống ấm dịu thanh mát từ [100% nguyên liệu]..."`.
     - *Bổ sung Kịch bản 8 vào bộ kiểm thử*: Nâng tổng số bài test lên tuyệt đối **45/45 TESTS PASS (100%)**.

---

## 15. Thông Tin Phiên Làm Việc: Nâng Cấp Hệ Thống Lịch Sử Nấu Ăn Nhận Diện Theo Từng Nhóm Nguyên Liệu & Tự Động Bảo Toàn Mẻ Nấu (27/10/2026)
- **Người phát triển**: Vũ Anh Lộc (LC Boy) & Antigravity (Google DeepMind)
- **Bối cảnh & Vấn đề giải quyết**:
  1. *Lỗi gộp chung lịch sử nấu của mọi nguyên liệu trong món ăn*: Khi người chơi chế biến một món ăn gồm nhiều thành phần trên các dụng cụ khác nhau — ví dụ: làm món **"Bò bít tết"**, lấy Khoai tây đem chiên ngập dầu, sau đó lấy Thịt bò, Xúc xích và Pate đem áp chảo — hệ thống cũ chỉ lấy lịch sử của phần tử đầu tiên hoặc nối gộp tất cả thao tác lại và đọc chung chung: `"Món 'Bò bít tết' được chiên ngập dầu rồi đem áp chảo từ Khoai tây, Thịt bò, Xúc xích và Pate"`. Điều này sai thực tế vì khoai tây không hề được áp chảo và thịt bò/xúc xích/pate không hề bị chiên ngập dầu.
  2. *Lỗi nấu đè mẻ cũ khi chuyển công cụ mà quên cất vào Khay Tạm*: Khi người chơi chiên khoai tây xong ở Chảo Chiên Ngập Dầu rồi chuyển thẳng sang Chảo Áp Chảo và lấy thêm thịt bò, xúc xích, pate vào áp chảo mà quên bấm nút cất khoai tây sang Khay Tạm, khoai tây bị áp chảo thêm một lần nữa và bị gán thêm `'fried'` vào `actionHistory`.
  3. *Lỗi hiển thị chuỗi tiếng Anh `'sliced'` trong `describeItemStateShort`*: Khi nguyên liệu được sơ chế trên thớt (`sliced`, `diced`, `minced`) rồi đem nấu nhiệt, `methodMap` trong `describeItemStateShort` thiếu từ điển cho thao tác cắt dẫn đến hiển thị `"thái lát, sliced ➔ áp chảo/xào"`.
- **Các giải pháp & kiến trúc kỹ thuật đã triển khai**:
  1. **Cơ Chế Tự Do Điều Phối Mẻ Nấu 100% Theo Ý Đồ Người Chơi (Phương Án A — Chuẩn Toca Kitchen Sandbox)**:
     - Tuyệt đối không tự ý đẩy ngầm nguyên liệu đang trên bếp sang Khay Tạm khi lấy thêm nguyên liệu sống mới.
     - **Trường hợp Nấu Chung**: Khi người chơi chiên `Khoai tây` xong, giữ nguyên trên bếp và lấy thêm `Thịt bò sống` vào chảo để áp chảo chung:
       - `Khoai tây` ghi nhận chuỗi 2 công đoạn `['deep_fried', 'fried']` $\rightarrow$ *"Khoai tây Đà Lạt được chiên ngập dầu rồi đem áp chảo xém cạnh giòn thơm"*.
       - `Thịt bò` chỉ ghi nhận 1 công đoạn `['fried']` $\rightarrow$ *"Thịt bò thăn tươi được đem áp chảo chín tới vàng ươm"* (không bị gán nhầm là đã chiên ngập dầu).
     - **Trường hợp Nấu Riêng Từng Mẻ**: Khi người chơi chiên `Khoai tây` xong, bấm **Phím `T`** cất ra **Khay Tạm** rồi lấy `Thịt bò, Xúc xích, Pate` vào áp chảo:
       - `Khoai tây` giữ nguyên `['deep_fried']`, nhóm `Thịt bò, Xúc xích, Pate` giữ nguyên `['fried']`.
     - Theo dõi `stationCookSteps` trên từng dụng cụ nhiệt để khi nấu chung nguyên liệu đã chín vàng từ công cụ trước với nguyên liệu sống ở công cụ mới (1–2 lần), nguyên liệu đã chín trước đó không bị cháy khét nhầm; chỉ khi đun quá lửa 3 lần trên cùng một dụng cụ mới kích hoạt cháy khét (`cookLevel = 3`).
  2. **Động Cơ Gom Nhóm Nguyên Liệu Theo Lịch Sử Chế Biến (`groupItemsByCookingHistory`)**:
     - Duyệt qua từng nguyên liệu trong món ăn, trích xuất chuỗi thao tác thực tế (`cleanActs`) và câu mô tả `actionDesc` từ `formatActionHistoryChain`.
     - Các nguyên liệu có **cùng lịch sử chế biến** được gom vào chung 1 nhóm; các nguyên liệu chế biến trên **công cụ khác** được tách thành nhóm riêng theo đúng trình tự thời gian.
     - Đối với đồ uống/sinh tố/món cuốn/món nhồi (`beverage`, `blended`, `rolled`, `stuffed`): Chỉ kế thừa các thao tác tiền xử lý vào cấp cha nếu **tất cả** nguyên liệu thành phần cùng trải qua thao tác đó; nếu chỉ một nguyên liệu con được nướng/nấu trước (ví dụ: Khoai lang mật nướng than hoa rồi đem lắc shaker cùng Cà phê và Đá viên), nguyên liệu đó giữ mô tả riêng `Khoai Lang Mật Tươi Nguyên Củ (được đem nướng than hoa chín tới thơm lừng)` mà không gán nhầm cho Cà phê.
     - Ưu tiên chọn đúng vỏ bánh (`banh_mi_vn`, `burger_bun`, `taco_shell`, `croissant`) làm lớp vỏ ngoài (`outerVessel`) trong `stuff_pack` khi người chơi nhồi cùng xúc xích và thịt.
  3. **Nâng Cấp Câu Cảm Quan Cấu Trúc Trong `generateSensoryTastingReview`**:
     - Khi món ăn có 1 nhóm chế biến duy nhất: Giữ nguyên cấu trúc câu truyền thống để tương thích 100%.
     - Khi món ăn có $\ge 2$ nhóm chế biến khác nhau (như món "Bò bít tết"):
       - 2 nhóm: `Món 'Bò bít tết' kết hợp Khoai tây Đà Lạt được đem chiên ngập dầu vàng ươm giòn rụm, cùng với Thịt bò thăn tươi, Xúc xích hun khói và Pate gan béo thơm được đem áp chảo chín tới vàng ươm, có...`
       - 3+ nhóm: Ngắt nhịp bằng dấu chấm phẩy `; ` giữa các nhóm và nối nhóm cuối bằng `, cùng với ...` giúp trình đọc màn hình NVDA ngắt nghỉ tự nhiên, rõ nghĩa.
     - Hỗ trợ mô tả món ăn kèm trên dĩa (`, ăn kèm ...`) đối với các món cuốn/nhồi có kèm món phụ rời (như Bánh mì bít tết ăn kèm Khoai tây chiên ngập dầu).
  4. **Chuẩn Hóa `describeItemStateShort` Cho Trợ Năng NVDA**:
     - Bổ sung đầy đủ `sliced: 'thái lát'`, `diced: 'thái hạt lựu'`, `minced: 'băm nhuyễn'`, `rolled: 'cuộn chặt'`, `stuffed: 'nhồi nhân'` vào `methodMap` và loại bỏ việc đẩy trùng trạng thái cắt khi đã có trong chuỗi `➔`.
  5. **Kiểm Thử Tự Động Toàn Diện (`test_batch_cooking_history.js`)**:
     - Thực thi 14 bài kiểm thử tự động bao phủ kịch bản Bò bít tết (tự động bảo toàn mẻ & cất Khay Tạm thủ công), Bít tết thập cẩm 4 nhóm công cụ, Chuỗi 7 công đoạn liên hoàn, Cà phê khoai lang nướng lắc đá, Bánh mì nhồi nhân kèm khoai tây chiên, Bánh mì nhồi kép 2 nhóm nhân khác công cụ, và Thực đơn Combo 2 món: đạt kết quả tuyệt đối **14/14 TESTS PASS (100%)**.
