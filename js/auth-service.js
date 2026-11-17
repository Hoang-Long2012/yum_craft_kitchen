/**
 * YUMCRAFT KITCHEN — AUTH & USER SERVICE
 * Quản lý Đăng Ký, Đăng Nhập, Đăng Xuất, Persistence & Đồng Bộ Hồ Sơ Người Chơi (Firestore)
 * Hỗ trợ cả Firebase Thực Tế & Chế Độ Giả Lập Cục Bộ (Mock Mode) khi chưa điền API Key.
 */

import {
  auth,
  db,
  isFirebaseConfigured,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "./firebase-config.js";

import {
  ROOT_ADMIN_USERNAME,
  isRootAdmin,
  isAdmin,
  getMaintenanceConfig
} from "./admin-service.js";
import { getMockUsers, saveMockUsers } from "./services/mock-storage.js";
import { PROFILE_GENDERS, normalizeProfileGender } from "./profile-data.js";
import { normalizePrivacySettings } from "./social-data.js";
import { validatePassword, validateDisplayName, validateKitchenName, validateProfileBio } from "./auth-data.js";
export { validatePassword, validateDisplayName, validateKitchenName, validateProfileBio } from "./auth-data.js";

// Khóa lưu trữ cục bộ cho Mock Mode
const MOCK_SESSION_KEY = "yumcraft_mock_current_session";
const ACTIVE_PROFILE_KEY = "yumcraft_active_chef_profile";

/**
 * Lưu profile đang hoạt động vào cache
 */
export function setActiveProfileCache(profile) {
  try {
    if (profile) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  } catch (e) {
    console.warn("Không thể lưu cache profile:", e);
  }
}

/**
 * Đọc profile từ cache
 */
export function getActiveProfileCache() {
  try {
    const raw = localStorage.getItem(ACTIVE_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Kiểm tra tính hợp lệ của Tên người dùng (Username)
 * Quy tắc: Không dấu, không khoảng cách, 3 - 30 ký tự, chỉ gồm a-z, A-Z, 0-9, dấu gạch dưới, gạch ngang, chấm
 */
export function validateUsername(username) {
  if (!username || typeof username !== "string") {
    return { valid: false, message: "Vui lòng nhập tên người dùng." };
  }
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { valid: false, message: "Tên người dùng phải có tối thiểu 3 ký tự." };
  }
  if (trimmed.length > 30) {
    return { valid: false, message: "Tên người dùng không được vượt quá 30 ký tự." };
  }
  const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return { 
      valid: false, 
      message: "Tên người dùng không được có dấu hoặc dấu cách, chỉ gồm chữ cái, chữ số và các ký tự: _ . -" 
    };
  }
  return { valid: true, sanitized: trimmed };
}

/** Update the signed-in chef's public profile without changing account identity. */
export async function updateCurrentUserProfile({ displayName, kitchenName, bio = "", gender = "unspecified" }) {
  const current = getActiveProfileCache();
  if (!current?.uid) throw new Error("Vui lòng đăng nhập để chỉnh sửa hồ sơ.");
  const validDisplayName = validateDisplayName(displayName);
  if (!validDisplayName.valid) throw new Error(validDisplayName.message);
  const validKitchenName = validateKitchenName(kitchenName);
  if (!validKitchenName.valid) throw new Error(validKitchenName.message);
  const validBio = validateProfileBio(bio);
  if (!validBio.valid) throw new Error(validBio.message);
  if (!PROFILE_GENDERS.includes(gender)) throw new Error("Vui lòng chọn một giá trị giới tính hợp lệ.");

  const updates = {
    displayName: validDisplayName.sanitized,
    kitchenName: validKitchenName.sanitized,
    bio: validBio.sanitized,
    gender: normalizeProfileGender(gender),
    profileUpdatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && auth && db) {
    if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: updates.displayName });
    await setDoc(doc(db, "users", current.uid), updates, { merge: true });
  } else {
    const users = getMockUsers();
    const index = users.findIndex((user) => user.uid === current.uid);
    if (index < 0) throw new Error("Không tìm thấy tài khoản hiện tại.");
    Object.assign(users[index], updates);
    saveMockUsers(users);
  }

  const updatedProfile = { ...current, ...updates };
  setActiveProfileCache(updatedProfile);
  return updatedProfile;
}

/** Save the signed-in user's privacy choices. Unspecified options retain public defaults for older accounts. */
export async function updateCurrentUserPrivacySettings(settings) {
  const current = getActiveProfileCache();
  if (!current?.uid) throw new Error("Vui lòng đăng nhập để chỉnh sửa quyền riêng tư.");
  const privacySettings = normalizePrivacySettings(settings);
  if (isFirebaseConfigured() && db) {
    await setDoc(doc(db, "users", current.uid), { privacySettings }, { merge: true });
  } else {
    const users = getMockUsers();
    const index = users.findIndex((user) => user.uid === current.uid);
    if (index < 0) throw new Error("Không tìm thấy tài khoản hiện tại.");
    users[index].privacySettings = privacySettings;
    saveMockUsers(users);
  }
  const updatedProfile = { ...current, privacySettings };
  setActiveProfileCache(updatedProfile);
  return updatedProfile;
}

/** Change the current account password after confirming the existing credential. */
export async function changeCurrentUserPassword({ currentPassword, newPassword, confirmPassword }) {
  const profile = getActiveProfileCache();
  if (!profile?.uid) throw new Error("Vui lòng đăng nhập để đổi mật khẩu.");
  const validation = validatePassword(newPassword, confirmPassword);
  if (!validation.valid) throw new Error(validation.message);
  if (!currentPassword) throw new Error("Vui lòng nhập mật khẩu hiện tại.");
  if (currentPassword === newPassword) throw new Error("Mật khẩu mới phải khác mật khẩu hiện tại.");

  if (isFirebaseConfigured() && auth && db) {
    if (profile.adminPassword || profile.mockPassword) {
      const savedPassword = profile.adminPassword || profile.mockPassword;
      if (currentPassword !== savedPassword) throw new Error("Mật khẩu hiện tại không chính xác.");
      const updates = { adminPassword: newPassword, mockPassword: newPassword };
      await setDoc(doc(db, "users", profile.uid), updates, { merge: true });
      setActiveProfileCache({ ...profile, ...updates });
      return true;
    }
    const user = auth.currentUser;
    if (!user?.email) throw new Error("Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.");
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);

    return true;
  }

  const users = getMockUsers();
  const user = users.find((entry) => entry.uid === profile.uid);
  if (!user || user.password !== currentPassword) throw new Error("Mật khẩu hiện tại không chính xác.");
  user.password = newPassword;
  saveMockUsers(users);
  return true;
}

/**
 * Kiểm tra tính hợp lệ của Email
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, message: "Vui lòng nhập địa chỉ email." };
  }
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: "Địa chỉ email không đúng định dạng (ví dụ: chef@example.com)." };
  }
  return { valid: true, sanitized: trimmed };
}

/**
 * ĐĂNG KÝ TÀI KHOẢN MỚI
 */
export async function registerUser({
  username,
  displayName,
  email,
  password,
  confirmPassword,
  kitchenName,
  gender = "unspecified",
  rememberMe = true
}) {
  // 1. Kiểm tra validation phía client
  const validUsername = validateUsername(username);
  if (!validUsername.valid) throw new Error(validUsername.message);

  const validDisplayName = validateDisplayName(displayName);
  if (!validDisplayName.valid) throw new Error(validDisplayName.message);

  const validEmail = validateEmail(email);
  if (!validEmail.valid) throw new Error(validEmail.message);

  const validPass = validatePassword(password, confirmPassword);
  if (!validPass.valid) throw new Error(validPass.message);

  const validKitchen = validateKitchenName(kitchenName);
  if (!validKitchen.valid) throw new Error(validKitchen.message);
  if (!PROFILE_GENDERS.includes(gender)) throw new Error("Vui lòng chọn một giá trị giới tính hợp lệ.");
  const cleanGender = normalizeProfileGender(gender);

  const cleanUsername = validUsername.sanitized;
  const usernameLower = cleanUsername.toLowerCase();
  const cleanDisplayName = validDisplayName.sanitized;
  const cleanKitchenName = validKitchen.sanitized;
  const cleanEmail = validEmail.sanitized;

  // BẢO VỆ ĐỊNH DANH QUẢN TRỊ VIÊN TỐI CAO lc_boy:
  // Nếu có người nhập LC_Boy, Lc_Boy hay bất kỳ biến thể hoa/thường nào khác -> Chặn ngay lập tức
  if (usernameLower === ROOT_ADMIN_USERNAME && cleanUsername !== ROOT_ADMIN_USERNAME) {
    throw new Error(`Tên người dùng '${cleanUsername}' không khả dụng. Tên quản trị viên chỉ dành riêng cho 'lc_boy' viết thường.`);
  }

  const isDefaultAdmin = cleanUsername === ROOT_ADMIN_USERNAME;

  // 2. Chế độ Firebase Thực Tế
  if (isFirebaseConfigured() && auth && db) {
    const usernameDocRef = doc(db, "usernames", usernameLower);
    try {
      // Thiết lập persistence trước khi tạo tài khoản
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      // Kiểm tra username đã tồn tại chưa trên Firestore
      const usernameSnap = await getDoc(usernameDocRef);
      if (usernameSnap.exists()) {
        throw new Error(`Tên người dùng '${cleanUsername}' đã có người sử dụng. Vui lòng chọn tên khác.`);
      }

      // Tạo tài khoản Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Cập nhật displayName cho user Auth
      await updateProfile(user, { displayName: cleanDisplayName });

      // Lưu chi tiết profile vào Firestore
      const userProfile = {
        uid: user.uid,
        username: cleanUsername,
        usernameLower: usernameLower,
        displayName: cleanDisplayName,
        kitchenName: cleanKitchenName,
        gender: cleanGender,
        email: cleanEmail,
        isAdmin: isDefaultAdmin,
        isBanned: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", user.uid), userProfile);
      await setDoc(usernameDocRef, {
        uid: user.uid,
        email: cleanEmail,
        username: cleanUsername
      });

      // Kiểm tra trạng thái cấm & bảo trì
      validateLoginAccountStatus(userProfile);

      setActiveProfileCache(userProfile);
      return userProfile;
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        // KIỂM TRA TỔNG QUÁT: Email này có người chơi nào đang hoạt động trong game không?
        const qEmail = query(collection(db, "users"), where("email", "==", cleanEmail));
        const emailSnap = await getDocs(qEmail);

        if (emailSnap.empty) {
          // TÀI KHOẢN CŨ GẮN VỚI EMAIL NÀY ĐÃ BỊ QUẢN TRỊ VIÊN XÓA SẠCH KHỎI GAME!
          // Tự động giải phóng email và tái sinh tài khoản mới toanh cho người chơi:

          // 1. Kiểm tra UID đã lưu trong 'deleted_users' nếu có
          let rebornUid = null;
          try {
            const delSnap = await getDoc(doc(db, "deleted_users", cleanEmail.toLowerCase()));
            if (delSnap.exists() && delSnap.data().uid) {
              rebornUid = delSnap.data().uid;
            }
          } catch (e) {
            console.warn("Lỗi đọc deleted_users:", e);
          }

          // 2. Nếu chưa có UID, thử đăng nhập Firebase Auth để lấy UID gốc
          if (!rebornUid) {
            try {
              const oldCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
              if (oldCred && oldCred.user) {
                rebornUid = oldCred.user.uid;
              }
            } catch (e) {
              // Mật khẩu mới khác mật khẩu cũ, không sao
            }
          }

          // 3. Fallback UID ngẫu nhiên nếu không lấy được UID từ 2 bước trên
          if (!rebornUid) {
            rebornUid = "reborn_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
          }

          const rebornProfile = {
            uid: rebornUid,
            username: cleanUsername,
            usernameLower: usernameLower,
            displayName: cleanDisplayName,
            kitchenName: cleanKitchenName,
            gender: cleanGender,
            email: cleanEmail,
            adminPassword: password, // Mật khẩu mới người chơi vừa đặt khi tạo tài khoản
            mockPassword: password,
            isAdmin: isDefaultAdmin,
            isBanned: false,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          };

          // Lưu hồ sơ mới vào Firestore
          await setDoc(doc(db, "users", rebornUid), rebornProfile);
          await setDoc(usernameDocRef, {
            uid: rebornUid,
            email: cleanEmail,
            username: cleanUsername
          });

          // Dọn dẹp bản ghi trong deleted_users nếu có
          try {
            await deleteDoc(doc(db, "deleted_users", cleanEmail.toLowerCase()));
          } catch (e) {}

          // Kiểm tra trạng thái cấm & bảo trì
          validateLoginAccountStatus(rebornProfile);

          setActiveProfileCache(rebornProfile);

          if (rememberMe) {
            localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ uid: rebornUid, rememberMe: true, isFirebase: true }));
          } else {
            sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ uid: rebornUid, rememberMe: false, isFirebase: true }));
          }

          return rebornProfile;
        }

        throw new Error("Địa chỉ email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.");
      } else if (err.code === "auth/invalid-email") {
        throw new Error("Địa chỉ email không hợp lệ.");
      } else if (err.code === "auth/weak-password") {
        throw new Error("Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn (tối thiểu 8 ký tự).");
      }
      throw err;
    }
  }

  // 3. Chế độ Giả Lập Cục Bộ (Mock Mode)
  const mockUsers = getMockUsers();
  if (mockUsers.some(u => u.usernameLower === usernameLower)) {
    throw new Error(`Tên người dùng '${cleanUsername}' đã có người sử dụng. Vui lòng chọn tên khác.`);
  }
  if (mockUsers.some(u => u.email.toLowerCase() === cleanEmail.toLowerCase())) {
    throw new Error("Địa chỉ email này đã được đăng ký trong hệ thống.");
  }

  const newMockUser = {
    uid: "mock_user_" + Date.now(),
    username: cleanUsername,
    usernameLower: usernameLower,
    displayName: cleanDisplayName,
    kitchenName: cleanKitchenName,
    gender: cleanGender,
    email: cleanEmail,
    password: password, // Chỉ dùng trong mock mode nội bộ
    isAdmin: isDefaultAdmin,
    isBanned: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  mockUsers.push(newMockUser);
  saveMockUsers(mockUsers);

  if (rememberMe) {
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ uid: newMockUser.uid, rememberMe: true }));
  } else {
    sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ uid: newMockUser.uid, rememberMe: false }));
  }

  const profile = { ...newMockUser };
  delete profile.password;
  setActiveProfileCache(profile);
  return profile;
}

/**
 * Kiểm tra trạng thái tài khoản khi đăng nhập: Cấm, Cấm IP, Bảo trì máy chủ
 */
function validateLoginAccountStatus(profile) {
  if (!profile) return;
  
  // Root Admin lc_boy là tối cao, không bao giờ bị cấm hay bảo trì
  if (profile.username === ROOT_ADMIN_USERNAME) {
    profile.isAdmin = true;
    profile.isBanned = false;
    profile.isIpBanned = false;
    return;
  }

  // Kiểm tra tài khoản bị cấm
  if (profile.isBanned) {
    const reason = profile.banReason || "Không có lý do";
    throw new Error(`Tài khoản của bạn đã bị khóa bởi Quản trị viên. Lý do: ${reason}`);
  }

  // Kiểm tra cấm IP
  if (profile.isIpBanned) {
    throw new Error("Địa chỉ IP hoặc thiết bị này đã bị cấm truy cập hệ thống.");
  }

  // Kiểm tra Chế độ bảo trì máy chủ
  const maintenance = getMaintenanceConfig();
  if (maintenance && maintenance.enabled && !isAdmin(profile)) {
    throw new Error(`Máy chủ đang bảo trì: ${maintenance.reason || "Vui lòng quay lại sau ít phút."}`);
  }
}

/**
 * ĐĂNG NHẬP
 * Hỗ trợ đăng nhập bằng Email HOẶC Username
 */
export async function loginUser({
  identifier,
  password,
  rememberMe = true
}) {
  if (!identifier || !identifier.trim()) {
    throw new Error("Vui lòng nhập Email hoặc Tên người dùng.");
  }
  if (!password) {
    throw new Error("Vui lòng nhập mật khẩu.");
  }

  const cleanId = identifier.trim();
  const isEmail = cleanId.includes("@");

  // 1. Chế độ Firebase Thực Tế
  if (isFirebaseConfigured() && auth && db) {
    try {
      let targetEmail = cleanId;
      let userProfile = null;

      // Nếu người chơi nhập username, tra cứu email & uid trong Firestore collection 'usernames'
      if (!isEmail) {
        const usernameSnap = await getDoc(doc(db, "usernames", cleanId.toLowerCase()));
        if (!usernameSnap.exists()) {
          throw new Error(`Tên người dùng '${cleanId}' không tồn tại.`);
        }
        const uData = usernameSnap.data();
        targetEmail = uData.email;
        if (uData.uid) {
          const uDocSnap = await getDoc(doc(db, "users", uData.uid));
          if (uDocSnap.exists()) {
            userProfile = uDocSnap.data();
          }
        }
      } else {
        // Tra cứu profile bằng email qua query
        const q = query(collection(db, "users"), where("email", "==", targetEmail.toLowerCase()));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          userProfile = qSnap.docs[0].data();
        }
      }

      // KIỂM TRA MẬT KHẨU DO QUẢN TRỊ VIÊN ĐẶT LẠI (ADMIN RESET PASSWORD)
      const adminPass = userProfile?.adminPassword || userProfile?.mockPassword;
      if (adminPass) {
        // Tài khoản đã có mật khẩu mới do Admin đặt lại: BẮT BUỘC dùng mật khẩu mới này!
        if (password !== adminPass) {
          throw new Error("Thông tin đăng nhập hoặc mật khẩu không chính xác.");
        }

        // Cập nhật lastLoginAt
        await setDoc(doc(db, "users", userProfile.uid), { 
          lastLoginAt: new Date().toISOString() 
        }, { merge: true });

        // Kiểm tra trạng thái cấm & bảo trì
        validateLoginAccountStatus(userProfile);

        setActiveProfileCache(userProfile);

        if (rememberMe) {
          localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ uid: userProfile.uid, rememberMe: true, isFirebase: true }));
        } else {
          sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ uid: userProfile.uid, rememberMe: false, isFirebase: true }));
        }

        return userProfile;
      }

      // Nếu tài khoản chưa từng bị Admin đổi mật khẩu, xác thực qua Firebase Auth
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
      const user = userCredential.user;

      // Lấy profile từ Firestore nếu chưa có
      if (!userProfile) {
        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        if (userDocSnap.exists()) {
          userProfile = userDocSnap.data();
        } else {
          userProfile = {
            uid: user.uid,
            username: user.email.split("@")[0],
            displayName: user.displayName || user.email.split("@")[0],
            kitchenName: "Nhà Bếp " + (user.displayName || "Sáng Tạo"),
            email: user.email,
            lastLoginAt: new Date().toISOString()
          };
        }
      }

      // Cập nhật lastLoginAt
      await setDoc(doc(db, "users", user.uid), { lastLoginAt: new Date().toISOString() }, { merge: true });

      // Kiểm tra trạng thái cấm & bảo trì
      validateLoginAccountStatus(userProfile);

      setActiveProfileCache(userProfile);
      return userProfile;
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        throw new Error("Thông tin đăng nhập hoặc mật khẩu không chính xác.");
      } else if (err.code === "auth/too-many-requests") {
        throw new Error("Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút.");
      }
      throw err;
    }
  }

  // 2. Chế độ Mock Mode
  const mockUsers = getMockUsers();
  const user = mockUsers.find(u => {
    if (isEmail) {
      return u.email.toLowerCase() === cleanId.toLowerCase();
    } else {
      return u.usernameLower === cleanId.toLowerCase();
    }
  });

  if (!user || user.password !== password) {
    throw new Error("Tài khoản hoặc mật khẩu không chính xác.");
  }

  user.lastLoginAt = new Date().toISOString();
  saveMockUsers(mockUsers);

  if (rememberMe) {
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ uid: user.uid, rememberMe: true }));
  } else {
    sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ uid: user.uid, rememberMe: false }));
    localStorage.removeItem(MOCK_SESSION_KEY);
  }

  const profile = { ...user };
  delete profile.password;
  
  // Kiểm tra trạng thái cấm & bảo trì cho mock user
  validateLoginAccountStatus(profile);

  setActiveProfileCache(profile);
  return profile;
}

/**
 * ĐĂNG XUẤT
 */
export async function logoutUser() {
  setActiveProfileCache(null);
  localStorage.removeItem(MOCK_SESSION_KEY);
  sessionStorage.removeItem(MOCK_SESSION_KEY);

  if (isFirebaseConfigured() && auth) {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn("Lỗi khi đăng xuất Firebase:", e);
    }
  }
  return true;
}

/**
 * LẮNG NGHE & KIỂM TRA TRẠNG THÁI PHIÊN ĐĂNG NHẬP (SESSION RESTORATION)
 */
export function initAuthListener(onAuthChangedCallback) {
  // 1. Chế độ Firebase Thực Tế
  if (isFirebaseConfigured() && auth && db) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocSnap = await getDoc(doc(db, "users", user.uid));
          if (userDocSnap.exists()) {
            const profile = userDocSnap.data();
            // Nếu tài khoản bị cấm thì đăng xuất ngay lập tức
            if (profile.isBanned && profile.username !== ROOT_ADMIN_USERNAME) {
              await logoutUser();
              onAuthChangedCallback(null);
              return;
            }
            if (profile.username === ROOT_ADMIN_USERNAME) {
              profile.isAdmin = true;
            }
            setActiveProfileCache(profile);
            onAuthChangedCallback(profile);
            return;
          }
        } catch (e) {
          console.warn("Lỗi khi tải profile Firestore:", e);
        }
        // Fallback profile nếu chưa load được Firestore
        const fallbackProfile = {
          uid: user.uid,
          username: user.email ? user.email.split("@")[0] : "chef",
          displayName: user.displayName || "Bếp Trưởng",
          kitchenName: "Nhà Bếp " + (user.displayName || "Sáng Tạo"),
          email: user.email || ""
        };
        setActiveProfileCache(fallbackProfile);
        onAuthChangedCallback(fallbackProfile);
      } else {
        // Kiểm tra xem có phiên đăng nhập của tài khoản đã được Admin đặt lại mật khẩu không
        const cached = getActiveProfileCache();
        if (cached && (cached.adminPassword || cached.mockPassword) && cached.uid) {
          try {
            const checkDoc = await getDoc(doc(db, "users", cached.uid));
            if (checkDoc.exists()) {
              const freshProfile = checkDoc.data();
              if (freshProfile.isBanned && freshProfile.username !== ROOT_ADMIN_USERNAME) {
                await logoutUser();
                onAuthChangedCallback(null);
                return;
              }
              if (freshProfile.username === ROOT_ADMIN_USERNAME) {
                freshProfile.isAdmin = true;
              }
              setActiveProfileCache(freshProfile);
              onAuthChangedCallback(freshProfile);
              return;
            }
          } catch (e) {
            console.warn("Lỗi xác minh phiên admin-reset:", e);
            onAuthChangedCallback(cached);
            return;
          }
        }
        setActiveProfileCache(null);
        onAuthChangedCallback(null);
      }
    });
  }

  // 2. Chế độ Mock Mode
  const checkMockSession = async () => {
    let sessionRaw = localStorage.getItem(MOCK_SESSION_KEY);
    if (!sessionRaw) {
      sessionRaw = sessionStorage.getItem(MOCK_SESSION_KEY);
    }
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        const mockUsers = getMockUsers();
        const found = mockUsers.find(u => u.uid === session.uid);
        if (found) {
          // Nếu tài khoản bị cấm thì đăng xuất ngay
          if (found.isBanned && found.username !== ROOT_ADMIN_USERNAME) {
            await logoutUser();
            onAuthChangedCallback(null);
            return;
          }
          const profile = { ...found };
          if (profile.username === ROOT_ADMIN_USERNAME) {
            profile.isAdmin = true;
          }
          delete profile.password;
          setActiveProfileCache(profile);
          onAuthChangedCallback(profile);
          return;
        }
      } catch (e) {
        console.warn("Lỗi đọc mock session:", e);
      }
    }
    setActiveProfileCache(null);
    onAuthChangedCallback(null);
  };

  // Khởi chạy kiểm tra ngay
  setTimeout(checkMockSession, 50);

  // Trả về hàm dọn dẹp
  return () => {};
}

export {
  ROOT_ADMIN_USERNAME,
  isRootAdmin,
  isAdmin
};
