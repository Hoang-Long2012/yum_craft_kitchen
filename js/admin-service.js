/**
 * YUMCRAFT KITCHEN — ADMIN & SERVER MANAGEMENT SERVICE
 * Quản lý Bảng Quản Trị, Danh sách Người Chơi, Thăng/Tước quyền, Cấm/Gỡ cấm,
 * Đổi mật khẩu, Xóa tài khoản, Thông Báo Trong Ngày (MOTD) & Bảo Trì Máy Chủ.
 * Hỗ trợ song song cả Firebase Firestore thực tế và Chế độ Giả lập Cục bộ (Mock Mode).
 */

import {
  db,
  isFirebaseConfigured,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs
} from "./firebase-config.js";

// ROOT ADMIN DUY NHẤT VÀ TỐI CAO CỦA YUMCRAFT KITCHEN
// CHÍNH XÁC 100% LÀ "lc_boy" (chữ thường, không hoa, không biến thể)
export const ROOT_ADMIN_USERNAME = "lc_boy";

// Khóa lưu trữ cục bộ cho Mock Mode / Caching
const MOCK_USERS_KEY = "yumcraft_mock_users_db";
const SYSTEM_MOTD_KEY = "yumcraft_system_motd";
const SYSTEM_MAINTENANCE_KEY = "yumcraft_system_maintenance";
const BANNED_IPS_KEY = "yumcraft_banned_ips";

/**
 * Kiểm tra xem tài khoản có phải là Root Admin tối cao không
 * So sánh chính xác nghiêm ngặt từng ký tự
 */
export function isRootAdmin(profile) {
  if (!profile || typeof profile !== "object") return false;
  return profile.username === ROOT_ADMIN_USERNAME;
}

/**
 * Kiểm tra xem tài khoản có quyền Quản trị viên hay không
 * Bao gồm: Root Admin lc_boy HOẶC tài khoản được cấp quyền (isAdmin === true)
 */
export function isAdmin(profile) {
  if (!profile || typeof profile !== "object") return false;
  if (isRootAdmin(profile)) return true;
  return profile.isAdmin === true || profile.role === "admin";
}

/**
 * Lấy danh sách tài khoản Mock từ localStorage
 */
function getMockUsers() {
  try {
    const raw = localStorage.getItem(MOCK_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Lưu danh sách tài khoản Mock vào localStorage
 */
function saveMockUsers(users) {
  try {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Lỗi khi lưu mock users:", e);
  }
}

/**
 * LẤY TOÀN BỘ DANH SÁCH TÀI KHOẢN TRÊN MÁY CHỦ
 */
export async function getAllUsers() {
  // 1. Chế độ Firebase Thực Tế
  if (isFirebaseConfigured() && db) {
    try {
      const usersCol = collection(db, "users");
      const snapshot = await getDocs(usersCol);
      const usersList = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        usersList.push({
          uid: docSnap.id,
          username: data.username || "chef",
          displayName: data.displayName || "Bếp Trưởng",
          email: data.email || "",
          kitchenName: data.kitchenName || "Nhà Bếp Sáng Tạo",
          isAdmin: data.username === ROOT_ADMIN_USERNAME || data.isAdmin === true,
          isBanned: Boolean(data.isBanned),
          banReason: data.banReason || "",
          isIpBanned: Boolean(data.isIpBanned),
          createdAt: data.createdAt || "",
          lastLoginAt: data.lastLoginAt || ""
        });
      });
      // Sắp xếp: Root Admin lên đầu, sau đó đến Admin, rồi đến ngày tạo mới nhất
      return usersList.sort((a, b) => {
        if (a.username === ROOT_ADMIN_USERNAME) return -1;
        if (b.username === ROOT_ADMIN_USERNAME) return 1;
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
    } catch (err) {
      console.warn("Không thể tải danh sách users từ Firestore, chuyển sang mock:", err);
    }
  }

  // 2. Chế độ Mock Mode
  const mockUsers = getMockUsers();
  return mockUsers.map(u => ({
    uid: u.uid,
    username: u.username,
    displayName: u.displayName,
    email: u.email,
    kitchenName: u.kitchenName,
    isAdmin: u.username === ROOT_ADMIN_USERNAME || Boolean(u.isAdmin),
    isBanned: Boolean(u.isBanned),
    banReason: u.banReason || "",
    isIpBanned: Boolean(u.isIpBanned),
    createdAt: u.createdAt || "",
    lastLoginAt: u.lastLoginAt || ""
  })).sort((a, b) => {
    if (a.username === ROOT_ADMIN_USERNAME) return -1;
    if (b.username === ROOT_ADMIN_USERNAME) return 1;
    if (a.isAdmin && !b.isAdmin) return -1;
    if (!a.isAdmin && b.isAdmin) return 1;
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });
}

/**
 * THĂNG CHỨC / TƯỚC QUYỀN QUẢN TRỊ VIÊN
 * @param {string} targetUid - UID của người dùng cần thay đổi quyền
 * @param {boolean} makeAdmin - true để thăng chức, false để tước quyền
 * @param {string} targetUsername - Tên người dùng để kiểm tra an toàn
 */
export async function toggleAdminRole(targetUid, makeAdmin, targetUsername) {
  // BẢO VỆ TUYỆT ĐỐI CHO ROOT ADMIN lc_boy
  if (targetUsername === ROOT_ADMIN_USERNAME) {
    throw new Error(`Quản trị viên tối cao '${ROOT_ADMIN_USERNAME}' là bất khả xâm phạm. Không ai có quyền tước quyền!`);
  }

  // 1. Firebase Thực Tế
  if (isFirebaseConfigured() && db) {
    try {
      const userRef = doc(db, "users", targetUid);
      await setDoc(userRef, { isAdmin: Boolean(makeAdmin) }, { merge: true });
      return true;
    } catch (err) {
      console.error("Lỗi cập nhật quyền admin trên Firestore:", err);
      throw err;
    }
  }

  // 2. Mock Mode
  const mockUsers = getMockUsers();
  const user = mockUsers.find(u => u.uid === targetUid);
  if (!user) throw new Error("Không tìm thấy người dùng trong hệ thống.");
  user.isAdmin = Boolean(makeAdmin);
  saveMockUsers(mockUsers);
  return true;
}

/**
 * CẤM TÀI KHOẢN (BAN USER)
 * @param {string} targetUid - UID của người dùng
 * @param {string} targetUsername - Tên người dùng
 * @param {string} reason - Lý do cấm (mặc định "Không có lý do" nếu để trống)
 * @param {boolean} banIp - Có cấm địa chỉ IP hay không
 */
export async function banUser(targetUid, targetUsername, reason = "", banIp = false) {
  // BẢO VỆ TUYỆT ĐỐI CHO ROOT ADMIN lc_boy
  if (targetUsername === ROOT_ADMIN_USERNAME) {
    throw new Error(`Không thể cấm tài khoản Quản trị viên tối cao '${ROOT_ADMIN_USERNAME}'!`);
  }

  const cleanReason = (reason && reason.trim()) ? reason.trim() : "Không có lý do";
  const banData = {
    isBanned: true,
    banReason: cleanReason,
    isIpBanned: Boolean(banIp),
    bannedAt: new Date().toISOString()
  };

  // Nếu cấm IP, ghi nhận vào danh sách IP bị cấm
  if (banIp) {
    addBannedIpRecord(targetUid, targetUsername);
  }

  // 1. Firebase Thực Tế
  if (isFirebaseConfigured() && db) {
    try {
      const userRef = doc(db, "users", targetUid);
      await setDoc(userRef, banData, { merge: true });
      return true;
    } catch (err) {
      console.error("Lỗi cấm tài khoản trên Firestore:", err);
      throw err;
    }
  }

  // 2. Mock Mode
  const mockUsers = getMockUsers();
  const user = mockUsers.find(u => u.uid === targetUid);
  if (!user) throw new Error("Không tìm thấy người dùng.");
  Object.assign(user, banData);
  saveMockUsers(mockUsers);
  return true;
}

/**
 * GỠ CẤM / MỞ KHÓA TÀI KHOẢN (UNBAN USER)
 */
export async function unbanUser(targetUid) {
  const unbanData = {
    isBanned: false,
    banReason: "",
    isIpBanned: false,
    unbannedAt: new Date().toISOString()
  };

  // 1. Firebase Thực Tế
  if (isFirebaseConfigured() && db) {
    try {
      const userRef = doc(db, "users", targetUid);
      await setDoc(userRef, unbanData, { merge: true });
      return true;
    } catch (err) {
      console.error("Lỗi gỡ cấm trên Firestore:", err);
      throw err;
    }
  }

  // 2. Mock Mode
  const mockUsers = getMockUsers();
  const user = mockUsers.find(u => u.uid === targetUid);
  if (!user) throw new Error("Không tìm thấy người dùng.");
  Object.assign(user, unbanData);
  saveMockUsers(mockUsers);
  return true;
}

/**
 * ĐỔI MẬT KHẨU TÀI KHOẢN (ADMIN RESET PASSWORD)
 */
export async function adminResetPassword(targetUid, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Mật khẩu mới phải có tối thiểu 8 ký tự.");
  }

  // 1. Mock Mode: Đổi trực tiếp
  const mockUsers = getMockUsers();
  const user = mockUsers.find(u => u.uid === targetUid);
  if (user) {
    user.password = newPassword;
    saveMockUsers(mockUsers);
  }

  // 2. Firebase Mode: Ghi nhận trạng thái reset mật khẩu
  if (isFirebaseConfigured() && db) {
    try {
      const userRef = doc(db, "users", targetUid);
      await setDoc(userRef, { 
        adminPassword: newPassword,
        mockPassword: newPassword, // Lưu để hỗ trợ đồng bộ mock/local fallback
        passwordResetByAdminAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("Lưu trạng thái reset password trên Firestore:", err);
    }
  }

  return true;
}

/**
 * XÓA TÀI KHOẢN VĨNH VIỄN
 */
export async function deleteUserAccount(targetUid, targetUsername, targetEmail) {
  // BẢO VỆ TUYỆT ĐỐI CHO ROOT ADMIN lc_boy
  if (targetUsername === ROOT_ADMIN_USERNAME) {
    throw new Error(`Quản trị viên tối cao '${ROOT_ADMIN_USERNAME}' là tài khoản gốc của hệ thống, không thể xóa!`);
  }

  // 1. Firebase Thực Tế
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, "users", targetUid));
      if (targetUsername) {
        await deleteDoc(doc(db, "usernames", targetUsername.toLowerCase()));
      }
      if (targetEmail) {
        // Lưu thông tin giải phóng email để tự động tái sinh tài khoản mới khi đăng ký lại
        await setDoc(doc(db, "deleted_users", targetEmail.toLowerCase()), {
          uid: targetUid,
          username: targetUsername || "",
          deletedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Lỗi xóa user trên Firestore:", err);
      throw err;
    }
  }

  // 2. Mock Mode
  const mockUsers = getMockUsers();
  const filtered = mockUsers.filter(u => u.uid !== targetUid);
  saveMockUsers(filtered);

  return true;
}

/**
 * Ghi nhận IP bị cấm vào bộ nhớ
 */
function addBannedIpRecord(uid, username) {
  try {
    const raw = localStorage.getItem(BANNED_IPS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({ uid, username, bannedAt: new Date().toISOString() });
    localStorage.setItem(BANNED_IPS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Lỗi lưu IP cấm:", e);
  }
}

/**
 * =========================================================================
 * HỆ THỐNG THÔNG BÁO TRONG NGÀY (MESSAGE OF THE DAY - MOTD)
 * =========================================================================
 */

/**
 * Lấy Thông Báo Trong Ngày hiện tại
 */
export async function getSystemMotd() {
  // 1. Firebase Thực Tế
  if (isFirebaseConfigured() && db) {
    try {
      const motdDoc = await getDoc(doc(db, "system", "motd"));
      if (motdDoc.exists()) {
        return motdDoc.data();
      }
    } catch (e) {
      console.warn("Lỗi tải MOTD từ Firestore:", e);
    }
  }

  // 2. Local Storage Fallback
  try {
    const raw = localStorage.getItem(SYSTEM_MOTD_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * ĐẶT THÔNG BÁO TRONG NGÀY MỚI (GHI ĐÈ THÔNG BÁO CŨ)
 * @param {Object} options
 * @param {string} options.title - Tiêu đề thông báo
 * @param {string} options.content - Nội dung thông báo
 * @param {string} options.authorName - Tên người đăng (mặc định lc_boy)
 */
export async function setSystemMotd({ title, content, authorName = ROOT_ADMIN_USERNAME }) {
  if (!title || !title.trim()) {
    throw new Error("Vui lòng nhập tiêu đề cho thông báo trong ngày.");
  }
  if (!content || !content.trim()) {
    throw new Error("Vui lòng nhập nội dung thông báo.");
  }

  const newMotd = {
    id: "motd_" + Date.now(),
    title: title.trim(),
    content: content.trim(),
    authorName: authorName || ROOT_ADMIN_USERNAME,
    updatedAt: new Date().toISOString()
  };

  // 1. Lưu vào LocalStorage
  try {
    localStorage.setItem(SYSTEM_MOTD_KEY, JSON.stringify(newMotd));
  } catch (e) {
    console.error("Lỗi lưu MOTD vào localStorage:", e);
  }

  // 2. Lưu vào Firestore
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, "system", "motd"), newMotd);
    } catch (e) {
      console.warn("Lỗi lưu MOTD vào Firestore:", e);
    }
  }

  return newMotd;
}

/**
 * Kiểm tra xem người dùng hiện tại có thông báo trong ngày nào chưa đọc không
 */
export function hasUnreadMotd(profile, currentMotd) {
  if (!currentMotd || !currentMotd.id) return false;
  if (!profile || !profile.uid) return false;

  try {
    const lastReadId = localStorage.getItem(`yumcraft_read_motd_${profile.uid}`);
    if (lastReadId === currentMotd.id) return false;
    if (profile.lastReadMotdId === currentMotd.id) return false;
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Đánh dấu người dùng đã đọc thông báo trong ngày
 */
export async function markMotdAsRead(profile, motdId) {
  if (!profile || !profile.uid || !motdId) return;

  try {
    localStorage.setItem(`yumcraft_read_motd_${profile.uid}`, motdId);
  } catch (e) {}

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, "users", profile.uid), { lastReadMotdId: motdId }, { merge: true });
    } catch (e) {}
  }
}

/**
 * =========================================================================
 * THỐNG KÊ MÁY CHỦ & CHẾ ĐỘ BẢO TRÌ (SERVER INSIGHTS & MAINTENANCE)
 * =========================================================================
 */

/**
 * Lấy thống kê tổng quan máy chủ
 */
export async function getServerStats() {
  const users = await getAllUsers();
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.isAdmin).length;
  const bannedCount = users.filter(u => u.isBanned).length;

  return {
    totalUsers,
    adminCount,
    bannedCount,
    activeUsers: totalUsers - bannedCount
  };
}

/**
 * Lấy cấu hình Chế độ Bảo Trì
 */
export function getMaintenanceConfig() {
  try {
    const raw = localStorage.getItem(SYSTEM_MAINTENANCE_KEY);
    return raw ? JSON.parse(raw) : { enabled: false, reason: "" };
  } catch (e) {
    return { enabled: false, reason: "" };
  }
}

/**
 * Bật / Tắt Chế độ Bảo Trì Máy Chủ
 */
export async function setMaintenanceMode(enabled, reason = "") {
  const config = {
    enabled: Boolean(enabled),
    reason: reason.trim() || "Máy chủ đang tạm dừng để bảo trì và nâng cấp gian bếp. Vui lòng quay lại sau ít phút!",
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(SYSTEM_MAINTENANCE_KEY, JSON.stringify(config));
  } catch (e) {}

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, "system", "maintenance"), config);
    } catch (e) {}
  }

  return config;
}

export {
  getCommunityDishes,
  deleteCommunityDish,
  deleteAllCommunityDishes,
  getLeaderboardTop100,
  resetLeaderboardScores
} from "./community-service.js";

