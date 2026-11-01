/**
 * YUMCRAFT KITCHEN — COMMUNITY HUB & LEADERBOARD SERVICE
 * Quản lý Cộng Đồng Đầu Bếp (Đăng món ăn / bữa ăn, Xem danh sách, Xem chi tiết, Quản trị xóa bài)
 * và Bảng Xếp Hạng Top 100 Đầu Bếp Xuất Sắc Nhất (Cộng điểm hài lòng, Xếp hạng Top 100, Đặt lại bảng xếp hạng).
 * Hỗ trợ song song cả Firebase Firestore thực tế và Chế độ Giả lập Cục bộ (Local Mock Mode).
 */

import {
  db,
  isFirebaseConfigured,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection
} from "./firebase-config.js";

import {
  getActiveProfileCache,
  setActiveProfileCache
} from "./auth-service.js";

const COMMUNITY_STORAGE_KEY = "yumcraft_community_dishes_db";
const MOCK_USERS_KEY = "yumcraft_mock_users_db";

/**
 * Định dạng Heading tên món ăn hoặc bữa ăn trên Cộng Đồng Đầu Bếp
 * Quy tắc của anh Lộc (LC Boy):
 * - Nếu 1 món: Hiện thẳng tên món ăn đó lên.
 * - Nếu nhiều món (2, 10, 20 hay 100 món): Hiện ra hết toàn bộ không cắt bớt,
 *   món cuối thêm ", và " vào:
 *   Ví dụ: "Bữa ăn với: tên món 1, tên món 2, tên món 3, tên món 4, và tên món 5"
 * @param {Array} dishes - Mảng các món ăn trên dĩa (hoặc mảng tên món)
 * @param {string} fallbackTitle - Tên mặc định nếu mảng rỗng
 * @returns {string}
 */
export function formatCommunityMealHeading(dishes, fallbackTitle = "Món Ăn Sáng Tạo") {
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return fallbackTitle || "Món Ăn Sáng Tạo";
  }

  const names = dishes
    .map(d => {
      if (typeof d === "string") return d.trim();
      if (d && typeof d.name === "string") return d.name.trim();
      return "";
    })
    .filter(Boolean);

  if (names.length === 0) {
    return fallbackTitle || "Món Ăn Sáng Tạo";
  }

  if (names.length === 1) {
    return names[0];
  }

  const initialNames = names.slice(0, -1).join(", ");
  const lastName = names[names.length - 1];
  return `Bữa ăn với: ${initialNames}, và ${lastName}`;
}

/**
 * Đọc danh sách món ăn cộng đồng từ LocalStorage
 */
function getLocalCommunityDishes() {
  try {
    const raw = localStorage.getItem(COMMUNITY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Lưu danh sách món ăn cộng đồng vào LocalStorage
 */
function saveLocalCommunityDishes(list) {
  try {
    localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Không thể lưu danh sách cộng đồng vào localStorage:", e);
  }
}

/**
 * Đọc danh sách Mock Users từ LocalStorage
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
 * Lưu danh sách Mock Users vào LocalStorage
 */
function saveMockUsers(users) {
  try {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn("Không thể lưu mock users:", e);
  }
}

/**
 * ĐƯA MÓN ĂN / BỮA ĂN LÊN CỘNG ĐỒNG ĐẦU BẾP & CỘNG ĐIỂM VÀO BẢNG XẾP HẠNG
 * @param {Object} mealPayload - Dữ liệu bữa ăn vừa được thực khách thưởng thức và đánh giá
 * @param {Object} chefProfile - Hồ sơ người chơi đang đăng nhập (tùy chọn, tự lấy từ cache nếu thiếu)
 */
export async function publishMealToCommunity(mealPayload, chefProfile = null) {
  const profile = chefProfile || getActiveProfileCache();
  if (!profile || !profile.uid) {
    throw new Error("Vui lòng đăng nhập tài khoản Bếp Trưởng để đưa món ăn lên cộng đồng.");
  }
  if (!mealPayload || typeof mealPayload !== "object") {
    throw new Error("Không tìm thấy dữ liệu món ăn vừa thưởng thức để đưa lên cộng đồng.");
  }

  const rawDishes = Array.isArray(mealPayload.dishes) ? mealPayload.dishes : [];
  const headingTitle = formatCommunityMealHeading(rawDishes, mealPayload.fallbackTitle || "Món Ăn Tự Chế");

  // Chuẩn hóa danh sách các món ăn có trên cái dĩa để hiển thị trong hộp thoại Xem Chi Tiết
  const dishesOnPlate = rawDishes.map((d, idx) => {
    const itemNames = Array.isArray(d.items) && d.items.length > 0
      ? d.items.map(i => i.name).join(", ")
      : (d.ingredientsSummary || "Nguyên liệu tự chọn");

    const structureDesc = (d.analysis && d.analysis.structureSummary)
      ? d.analysis.structureSummary
      : (d.structureSummary || itemNames);

    const garnishEmoji = (d.garnish && d.garnish.emoji)
      ? d.garnish.emoji
      : (Array.isArray(d.items) && d.items[0] && d.items[0].emoji ? d.items[0].emoji : "🍽️");

    const garnishName = (d.garnish && d.garnish.name) ? d.garnish.name : (d.garnishName || "Mộc");

    return {
      index: idx + 1,
      name: d.name || `Món ${idx + 1}`,
      emoji: garnishEmoji,
      garnishName: garnishName,
      ingredientsSummary: itemNames,
      structureSummary: structureDesc,
      harmonyScore: (d.analysis && typeof d.analysis.harmonyScore === "number")
        ? d.analysis.harmonyScore
        : (Number(d.harmonyScore) || 0)
    };
  });

  const satisfactionScore = Math.max(0, Math.round(Number(mealPayload.satisfactionScore) || 0));
  const nowIso = new Date().toISOString();
  const postId = "dish_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);

  const newPost = {
    id: postId,
    headingTitle: headingTitle,
    dishCount: dishesOnPlate.length || 1,
    isMultiDish: dishesOnPlate.length > 1,
    chefUid: profile.uid,
    chefUsername: profile.username || "chef",
    chefDisplayName: profile.displayName || profile.username || "Bếp Trưởng",
    kitchenName: profile.kitchenName || "Nhà Bếp Sáng Tạo",
    dishesOnPlate: dishesOnPlate,
    customerName: mealPayload.customerName || "Thực Khách",
    customerEmoji: mealPayload.customerEmoji || "😋",
    customerSpeech: mealPayload.customerSpeech || "Món ăn rất thú vị!",
    customerMoodTag: mealPayload.customerMoodTag || "Hài lòng 😋",
    satisfactionScore: satisfactionScore,
    createdAt: nowIso
  };

  // 1. Lưu bài đăng vào LocalStorage cache
  const localPosts = getLocalCommunityDishes();
  localPosts.unshift(newPost);
  saveLocalCommunityDishes(localPosts);

  // 2. Lưu bài đăng lên Firestore collection `community_dishes`
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, "community_dishes", postId), newPost);
    } catch (err) {
      console.warn("Lưu món ăn cộng đồng lên Firestore gặp lỗi, đã lưu cục bộ:", err);
    }
  }

  // 3. Cộng Điểm Hài Lòng vào Điểm Tổng của người chơi (`totalScore`)
  let newTotalScore = (Number(profile.totalScore) || 0) + satisfactionScore;

  if (isFirebaseConfigured() && db) {
    try {
      const userRef = doc(db, "users", profile.uid);
      const userSnap = await getDoc(userRef);
      let currentDbScore = 0;
      if (userSnap.exists()) {
        currentDbScore = Number(userSnap.data().totalScore) || 0;
      } else {
        currentDbScore = Number(profile.totalScore) || 0;
      }
      newTotalScore = currentDbScore + satisfactionScore;
      await setDoc(userRef, {
        uid: profile.uid,
        username: profile.username || "chef",
        displayName: profile.displayName || "Bếp Trưởng",
        kitchenName: profile.kitchenName || "Nhà Bếp Sáng Tạo",
        totalScore: newTotalScore,
        lastScoredAt: nowIso
      }, { merge: true });
    } catch (err) {
      console.warn("Cập nhật điểm bảng xếp hạng lên Firestore gặp lỗi:", err);
    }
  }

  // Đồng bộ vào Mock Users DB
  const mockUsers = getMockUsers();
  const mockIdx = mockUsers.findIndex(u => u.uid === profile.uid);
  if (mockIdx !== -1) {
    const currentMockScore = Number(mockUsers[mockIdx].totalScore) || 0;
    // Nếu chưa chạy qua Firestore hoặc điểm mock lớn hơn thì đồng bộ chính xác
    if (!isFirebaseConfigured() || !db) {
      newTotalScore = currentMockScore + satisfactionScore;
    }
    mockUsers[mockIdx].totalScore = newTotalScore;
    mockUsers[mockIdx].lastScoredAt = nowIso;
    saveMockUsers(mockUsers);
  } else {
    mockUsers.push({
      uid: profile.uid,
      username: profile.username || "chef",
      displayName: profile.displayName || "Bếp Trưởng",
      email: profile.email || "",
      kitchenName: profile.kitchenName || "Nhà Bếp Sáng Tạo",
      totalScore: newTotalScore,
      lastScoredAt: nowIso,
      createdAt: profile.createdAt || nowIso
    });
    saveMockUsers(mockUsers);
  }

  // Đồng bộ vào Active Profile Cache
  const updatedProfile = {
    ...profile,
    totalScore: newTotalScore,
    lastScoredAt: nowIso
  };
  setActiveProfileCache(updatedProfile);

  return {
    post: newPost,
    addedScore: satisfactionScore,
    newTotalScore: newTotalScore
  };
}

/**
 * LẤY DANH SÁCH TOÀN BỘ MÓN ĂN & BỮA ĂN TRÊN CỘNG ĐỒNG ĐẦU BẾP
 * Sắp xếp từ mới nhất đến cũ nhất
 */
export async function getCommunityDishes() {
  if (isFirebaseConfigured() && db) {
    try {
      const colRef = collection(db, "community_dishes");
      const snap = await getDocs(colRef);
      const dishes = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        dishes.push({
          ...data,
          id: docSnap.id
        });
      });
      dishes.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      // Đồng bộ xuống cache local để truy xuất nhanh
      saveLocalCommunityDishes(dishes);
      return dishes;
    } catch (err) {
      console.warn("Không thể tải community_dishes từ Firestore, dùng dữ liệu local:", err);
    }
  }

  const localDishes = getLocalCommunityDishes();
  return localDishes.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

/**
 * XÓA 1 MÓN ĂN / BỮA ĂN BẤT KỲ TRÊN CỘNG ĐỒNG (DÀNH CHO ADMIN)
 * @param {string} dishId - ID bài đăng cần xóa
 */
export async function deleteCommunityDish(dishId) {
  if (!dishId) throw new Error("Thiếu mã món ăn cần xóa.");

  // 1. Xóa khỏi LocalStorage
  const localDishes = getLocalCommunityDishes();
  const filtered = localDishes.filter(d => d.id !== dishId);
  saveLocalCommunityDishes(filtered);

  // 2. Xóa khỏi Firestore
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, "community_dishes", dishId));
    } catch (err) {
      console.error("Lỗi xóa món ăn cộng đồng trên Firestore:", err);
      throw err;
    }
  }

  return true;
}

/**
 * XÓA TẤT CẢ MÓN ĂN TRÊN CỘNG ĐỒNG (DÀNH CHO ADMIN)
 */
export async function deleteAllCommunityDishes() {
  // 1. Xóa sạch LocalStorage
  saveLocalCommunityDishes([]);

  // 2. Xóa toàn bộ documents trong collection `community_dishes` trên Firestore
  if (isFirebaseConfigured() && db) {
    try {
      const colRef = collection(db, "community_dishes");
      const snap = await getDocs(colRef);
      const deletePromises = [];
      snap.forEach(docSnap => {
        deletePromises.push(deleteDoc(doc(db, "community_dishes", docSnap.id)));
      });
      await Promise.all(deletePromises);
    } catch (err) {
      console.error("Lỗi xóa tất cả món ăn cộng đồng trên Firestore:", err);
      throw err;
    }
  }

  return true;
}

/**
 * LẤY BẢNG XẾP HẠNG TOP 100 ĐẦU BẾP NẤU ĂN NGON NHẤT
 * - Tối đa 100 người (Top 1 -> Top 100)
 * - Ai có nhiều điểm nhất sẽ đứng đầu Top
 * - Người đứng top cuối (Hạng 100) bị vượt qua bởi một người chơi nhiều điểm hơn sẽ tự động bị đẩy ra khỏi bảng xếp hạng
 */
export async function getLeaderboardTop100() {
  let usersList = [];

  if (isFirebaseConfigured() && db) {
    try {
      const usersCol = collection(db, "users");
      const snap = await getDocs(usersCol);
      snap.forEach(docSnap => {
        const d = docSnap.data();
        usersList.push({
          uid: docSnap.id,
          username: d.username || "chef",
          displayName: d.displayName || d.username || "Bếp Trưởng",
          kitchenName: d.kitchenName || "Nhà Bếp Sáng Tạo",
          totalScore: Number(d.totalScore) || 0,
          isBanned: Boolean(d.isBanned),
          lastScoredAt: d.lastScoredAt || d.createdAt || ""
        });
      });
    } catch (err) {
      console.warn("Không thể tải bảng xếp hạng từ Firestore, dùng mock users:", err);
    }
  }

  // Fallback hoặc bổ sung từ Mock Users nếu danh sách Firestore rỗng ở môi trường test offline
  if (usersList.length === 0) {
    const mockUsers = getMockUsers();
    usersList = mockUsers.map(u => ({
      uid: u.uid,
      username: u.username || "chef",
      displayName: u.displayName || u.username || "Bếp Trưởng",
      kitchenName: u.kitchenName || "Nhà Bếp Sáng Tạo",
      totalScore: Number(u.totalScore) || 0,
      isBanned: Boolean(u.isBanned),
      lastScoredAt: u.lastScoredAt || u.createdAt || ""
    }));
  }

  // Chỉ lấy những người chơi có điểm > 0 và không bị cấm
  const eligibleChefs = usersList.filter(u => u.totalScore > 0 && !u.isBanned);

  // Sắp xếp giảm dần theo điểm số (cao nhất đứng đầu)
  // Nếu bằng điểm nhau thì ai đạt điểm đó sớm hơn đứng trên
  eligibleChefs.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return (a.lastScoredAt || "").localeCompare(b.lastScoredAt || "");
  });

  // Cắt đúng tối đa 100 đầu bếp xuất sắc nhất (Top 100)
  const top100 = eligibleChefs.slice(0, 100).map((chef, index) => ({
    rank: index + 1,
    uid: chef.uid,
    username: chef.username,
    displayName: chef.displayName,
    kitchenName: chef.kitchenName,
    totalScore: chef.totalScore
  }));

  return top100;
}

/**
 * ĐẶT LẠI BẢNG XẾP HẠNG VỀ TRỐNG (DÀNH CHO ADMIN)
 * Đưa điểm `totalScore` của toàn bộ người chơi về 0
 */
export async function resetLeaderboardScores() {
  // 1. Reset trong Mock Users DB
  const mockUsers = getMockUsers();
  mockUsers.forEach(u => {
    u.totalScore = 0;
  });
  saveMockUsers(mockUsers);

  // 2. Reset trong Active Profile Cache nếu đang đăng nhập
  const activeProfile = getActiveProfileCache();
  if (activeProfile) {
    activeProfile.totalScore = 0;
    setActiveProfileCache(activeProfile);
  }

  // 3. Reset trên Firestore `users` collection
  if (isFirebaseConfigured() && db) {
    try {
      const usersCol = collection(db, "users");
      const snap = await getDocs(usersCol);
      const resetPromises = [];
      snap.forEach(docSnap => {
        resetPromises.push(
          setDoc(doc(db, "users", docSnap.id), { totalScore: 0 }, { merge: true })
        );
      });
      await Promise.all(resetPromises);
    } catch (err) {
      console.error("Lỗi đặt lại bảng xếp hạng trên Firestore:", err);
      throw err;
    }
  }

  return true;
}
