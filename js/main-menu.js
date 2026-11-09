import { state } from "./core/state.js";
/**
 * YUMCRAFT KITCHEN — MAIN MENU & AUTH CONTROLLER
 * Điều phối luồng màn hình: Xác thực (Đăng nhập / Đăng ký) <-> Menu Chính <-> Chọn Nhân Vật <-> Nhà Bếp
 * Đảm bảo 100% tiêu chuẩn WCAG 2.2 AAA & NVDA First
 */

import {
  registerUser,
  loginUser,
  logoutUser,
  initAuthListener,
  getActiveProfileCache
} from "./auth-service.js";

import {
  ROOT_ADMIN_USERNAME,
  isRootAdmin,
  isAdmin,
  getAllUsers,
  toggleAdminRole,
  banUser,
  unbanUser,
  adminResetPassword,
  deleteUserAccount,
  getSystemMotd,
  setSystemMotd,
  hasUnreadMotd,
  markMotdAsRead,
  getServerStats,
  getMaintenanceConfig,
  setMaintenanceMode
} from "./admin-service.js";

import {
  formatCommunityMealHeading,
  publishMealToCommunity,
  getCommunityDishes,
  deleteCommunityDish,
  deleteAllCommunityDishes,
  getLeaderboardTop100,
  resetLeaderboardScores
} from "./community-service.js";

// Khóa lưu cài đặt
const SETTINGS_STORAGE_KEY = "yumcraft_game_settings";

/**
 * Đọc cài đặt trò chơi từ localStorage
 */
export function getSavedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Không thể đọc cài đặt trò chơi:", e);
  }
  return {
    sfxEnabled: true,
    sfxVolume: 80,
    voiceAnnouncements: true
  };
}

/**
 * Lưu cài đặt trò chơi vào localStorage
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Lỗi khi lưu cài đặt:", e);
  }
}

/**
 * Phát loa thông báo cho NVDA / Trình đọc màn hình
 */
function announceToScreenReader(text, assertive = false) {
  const liveId = assertive ? "nvda-live-assertive-a" : "nvda-live-polite-a";
  const region = document.getElementById(liveId);
  if (region) {
    region.textContent = "";
    setTimeout(() => {
      region.textContent = text;
    }, 50);
  }
}

/**
 * Hiển thị alert trong form
 */
function showAlert(boxId, message, isError = true) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.textContent = message;
  box.classList.remove("hidden");
  if (isError) {
    box.className = "mb-4 p-3.5 rounded-2xl text-sm font-semibold border bg-red-50 text-red-700 border-red-300";
  } else {
    box.className = "mb-4 p-3.5 rounded-2xl text-sm font-semibold border bg-emerald-50 text-emerald-800 border-emerald-300";
  }
  announceToScreenReader(message, true);
}

function clearAlert(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.textContent = "";
  box.classList.add("hidden");
}

/**
 * Quản lý chuyển đổi giữa các Màn Hình Cấp Cao (Screens)
 * screenName: 'auth' | 'main-menu' | 'character-select' | 'kitchen'
 */
export function showScreen(screenName) {
  const screenAuth = document.getElementById("screen-auth");
  const screenMainMenu = document.getElementById("screen-main-menu");
  const screenSelect = document.getElementById("screen-character-select");
  const screenKitchen = document.getElementById("screen-kitchen");

  const allScreens = [screenAuth, screenMainMenu, screenSelect, screenKitchen];
  allScreens.forEach(s => {
    if (s) {
      s.classList.add("hidden");
      s.classList.remove("flex");
    }
  });

  if (screenName === "auth") {
    if (screenAuth) {
      screenAuth.classList.remove("hidden");
      screenAuth.classList.add("flex");
      const firstInput = document.getElementById("login-identifier");
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
      announceToScreenReader("Màn hình Đăng Nhập YumCraft Kitchen.");
    }
  } else if (screenName === "main-menu") {
    if (screenMainMenu) {
      screenMainMenu.classList.remove("hidden");
      screenMainMenu.classList.add("flex");
      const btnEnter = document.getElementById("btn-menu-enter-kitchen");
      if (btnEnter) setTimeout(() => btnEnter.focus(), 100);
      announceToScreenReader("Menu Chính YumCraft Kitchen. Sử dụng phím Tab hoặc mũi tên để chọn.");
    }
  } else if (screenName === "character-select") {
    if (screenSelect) {
      screenSelect.classList.remove("hidden");
      screenSelect.classList.add("flex");
      const btnBack = document.getElementById("btn-back-to-main-menu");
      if (btnBack) setTimeout(() => btnBack.focus(), 100);
      announceToScreenReader("Màn hình Chọn Thực Khách. Chọn 1 trong 4 nhân vật để bắt đầu nấu.");
    }
  } else if (screenName === "kitchen") {
    if (screenKitchen) {
      screenKitchen.classList.remove("hidden");
      screenKitchen.classList.add("flex");
    }
  }
}

/**
 * Quản lý chuyển đổi giữa Đăng Nhập và Đăng Ký trong Screen Auth
 */
export function showAuthView(viewName) {
  const viewLogin = document.getElementById("view-login");
  const viewRegister = document.getElementById("view-register");
  clearAlert("login-alert-box");
  clearAlert("reg-alert-box");

  if (viewName === "register") {
    if (viewLogin) viewLogin.classList.add("hidden");
    if (viewRegister) {
      viewRegister.classList.remove("hidden");
      const firstInput = document.getElementById("reg-username");
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
      announceToScreenReader("Giao diện Đăng Ký Tài Khoản Bếp Trưởng Mới.");
    }
  } else {
    if (viewRegister) viewRegister.classList.add("hidden");
    if (viewLogin) {
      viewLogin.classList.remove("hidden");
      const firstInput = document.getElementById("login-identifier");
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
      announceToScreenReader("Giao diện Đăng Nhập Bếp Trưởng.");
    }
  }
}

/**
 * Cập nhật thông tin người dùng lên Menu Chính
 */
export function updateMainMenuUserProfile(profile) {
  if (!profile) return;
  const nameEl = document.getElementById("menu-user-display-name");
  const usernameEl = document.getElementById("menu-user-username");
  const kitchenEl = document.getElementById("menu-user-kitchen-name");

  if (nameEl) nameEl.textContent = profile.displayName || "Bếp Trưởng";
  if (usernameEl) usernameEl.textContent = profile.username ? `(@${profile.username})` : "";
  if (kitchenEl) kitchenEl.textContent = profile.kitchenName || "Nhà Bếp Sáng Tạo";

  // Hiển thị nút Bảng Quản Trị nếu tài khoản là Quản trị viên
  const btnAdmin = document.getElementById("btn-menu-admin");
  if (btnAdmin) {
    if (isAdmin(profile)) {
      btnAdmin.classList.remove("hidden");
    } else {
      btnAdmin.classList.add("hidden");
    }
  }
}

/**
 * Đồng bộ cài đặt vào game state nếu có
 */
function applySettingsToGameState(settings) {
  if (window.state) {
    window.state.sfxEnabled = settings.sfxEnabled;
    window.state.sfxVolume = settings.sfxVolume / 100;
  }
}

/**
 * =========================================================================
 * BỘ ĐIỀU PHỐI THÔNG BÁO TRONG NGÀY (MOTD BROADCAST CONTROLLER)
 * =========================================================================
 */
export async function checkAndShowMotdBroadcast(profile) {
  if (!profile) return false;
  try {
    const currentMotd = await getSystemMotd();
    if (currentMotd && hasUnreadMotd(profile, currentMotd)) {
      const modalBroadcast = document.getElementById("modal-motd-broadcast");
      const headlineEl = document.getElementById("motd-broadcast-headline");
      const contentEl = document.getElementById("motd-broadcast-content");
      const authorEl = document.getElementById("motd-broadcast-author");
      const timeEl = document.getElementById("motd-broadcast-time");

      if (headlineEl) headlineEl.textContent = currentMotd.title || "Thông Báo Máy Chủ";
      if (contentEl) contentEl.textContent = currentMotd.content || "";
      if (authorEl) authorEl.textContent = "Đăng bởi: " + (currentMotd.authorName || ROOT_ADMIN_USERNAME);
      if (timeEl) {
        const d = currentMotd.updatedAt ? new Date(currentMotd.updatedAt) : new Date();
        timeEl.textContent = d.toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      }

      if (modalBroadcast && !modalBroadcast.open) {
        modalBroadcast.showModal();
        announceToScreenReader(`Thông báo trong ngày từ Quản trị viên: ${currentMotd.title}. Nhấn Tab để duyệt nội dung và bấm nút đã đọc.`);
        return true;
      }
    }
  } catch (e) {
    console.warn("Lỗi kiểm tra MOTD:", e);
  }
  return false;
}

/**
 * =========================================================================
 * BỘ ĐIỀU PHỐI BẢNG QUẢN TRỊ VIÊN (ADMIN PANEL CONTROLLER)
 * =========================================================================
 */
export function initAdminPanelController() {
  let currentSelectedUser = null;
  let cachedUsersList = [];

  // --- 1. Mở & Đóng Bảng Quản Trị Trung Tâm ---
  const btnMenuAdmin = document.getElementById("btn-menu-admin");
  const modalAdminPanel = document.getElementById("modal-admin-panel");
  const btnCloseAdminPanel = document.getElementById("btn-close-admin-panel");
  const btnCloseAdminPanelBottom = document.getElementById("btn-close-admin-panel-bottom");

  const refreshAdminPanelStats = async () => {
    try {
      const stats = await getServerStats();
      const statTotal = document.getElementById("admin-stat-total-users");
      const statAdmins = document.getElementById("admin-stat-admins");
      const statBanned = document.getElementById("admin-stat-banned");
      if (statTotal) statTotal.textContent = stats.totalUsers;
      if (statAdmins) statAdmins.textContent = stats.adminCount;
      if (statBanned) statBanned.textContent = stats.bannedCount;

      const maint = getMaintenanceConfig();
      const maintText = document.getElementById("admin-maintenance-status-text");
      const maintBadge = document.getElementById("admin-maintenance-status-badge");
      if (maintText) {
        maintText.textContent = `Chế độ bảo trì máy chủ: ${maint.enabled ? 'ĐANG BẬT' : 'Đang Tắt'}`;
      }
      if (maintBadge) {
        maintBadge.textContent = maint.enabled ? "BẢO TRÌ" : "Bình Thường";
        maintBadge.className = maint.enabled 
          ? "text-xs font-bold bg-amber-500 text-white px-3 py-1 rounded-full animate-pulse" 
          : "text-xs font-bold bg-stone-200 text-stone-800 px-3 py-1 rounded-full";
      }
    } catch (e) {
      console.warn("Lỗi nạp thống kê admin:", e);
    }
  };

  if (btnMenuAdmin && modalAdminPanel) {
    btnMenuAdmin.addEventListener("click", async () => {
      const profile = getActiveProfileCache();
      if (!profile || !isAdmin(profile)) {
        alert("Bạn không có quyền truy cập Bảng Quản Trị.");
        return;
      }
      await refreshAdminPanelStats();
      modalAdminPanel.showModal();
      announceToScreenReader("Bảng Quản Trị Máy Chủ. Dùng phím Tab để điều hướng các tùy chọn.");
    });
  }

  const closeAdminPanel = () => {
    if (modalAdminPanel && modalAdminPanel.open) {
      modalAdminPanel.close();
      if (btnMenuAdmin) btnMenuAdmin.focus();
    }
  };
  if (btnCloseAdminPanel) btnCloseAdminPanel.addEventListener("click", closeAdminPanel);
  if (btnCloseAdminPanelBottom) btnCloseAdminPanelBottom.addEventListener("click", closeAdminPanel);

  // --- 2. Bật / Tắt Chế Độ Bảo Trì Máy Chủ ---
  const btnToggleMaintenance = document.getElementById("btn-admin-toggle-maintenance");
  if (btnToggleMaintenance) {
    btnToggleMaintenance.addEventListener("click", async () => {
      const current = getMaintenanceConfig();
      if (current.enabled) {
        const confirmTurnOff = window.confirm("Bạn có chắc chắn muốn TẮT chế độ bảo trì máy chủ? Người chơi sẽ có thể đăng nhập bình thường.");
        if (confirmTurnOff) {
          await setMaintenanceMode(false);
          await refreshAdminPanelStats();
          announceToScreenReader("Đã tắt chế độ bảo trì máy chủ thành công.");
        }
      } else {
        const reasonInput = window.prompt("Nhập thông báo lý do bảo trì gửi đến người chơi (hoặc để trống dùng mặc định):", "Máy chủ đang tạm dừng ít phút để bảo trì và nâng cấp gian bếp. Vui lòng quay lại sau!");
        if (reasonInput !== null) {
          await setMaintenanceMode(true, reasonInput);
          await refreshAdminPanelStats();
          announceToScreenReader("Đã bật chế độ bảo trì máy chủ thành công.");
        }
      }
    });
  }

  // --- 3. Danh Sách Tài Khoản Trên Máy Chủ ---
  const btnAdminViewUsers = document.getElementById("btn-admin-view-users");
  const modalAdminUsers = document.getElementById("modal-admin-users");
  const btnCloseAdminUsers = document.getElementById("btn-close-admin-users");
  const btnBackToAdminPanel = document.getElementById("btn-back-to-admin-panel");
  const usersListContainer = document.getElementById("admin-users-list");
  const searchUsersInput = document.getElementById("admin-search-users");
  const usersCountEl = document.getElementById("admin-users-count");

  const renderUsersList = (users) => {
    if (!usersListContainer) return;
    usersListContainer.innerHTML = "";

    if (!users || users.length === 0) {
      usersListContainer.innerHTML = `
        <div class="p-6 text-center text-stone-500 font-semibold text-sm">
          Không tìm thấy tài khoản người chơi nào phù hợp.
        </div>
      `;
      if (usersCountEl) usersCountEl.textContent = "Hiển thị 0 tài khoản";
      return;
    }

    if (usersCountEl) {
      usersCountEl.textContent = `Hiển thị ${users.length} tài khoản người chơi trên máy chủ`;
    }

    users.forEach(u => {
      const itemBtn = document.createElement("button");
      itemBtn.type = "button";
      itemBtn.className = "w-full text-left p-3.5 bg-stone-50 hover:bg-purple-50 rounded-2xl border border-stone-200 hover:border-purple-300 transition flex items-center justify-between gap-3 cursor-pointer focus:ring-2 focus:ring-purple-400";
      
      const isRoot = u.username === ROOT_ADMIN_USERNAME;
      const isStaffAdmin = !isRoot && u.isAdmin;
      const avatarIcon = isRoot ? "👑" : (isStaffAdmin ? "🛡️" : "👨‍🍳");

      let badgesHtml = "";
      if (isRoot) {
        badgesHtml += `<span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-purple-950 font-sans shadow-sm">👑 ROOT ADMIN</span>`;
      } else if (isStaffAdmin) {
        badgesHtml += `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-200 text-purple-900 font-sans">🛡️ QUẢN TRỊ</span>`;
      }
      if (u.isBanned) {
        badgesHtml += `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 font-sans ml-1.5">🚫 BỊ KHÓA</span>`;
      }

      itemBtn.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <span class="text-2xl flex-shrink-0" aria-hidden="true">${avatarIcon}</span>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-extrabold text-stone-900 font-game truncate text-sm sm:text-base">${u.displayName || "Bếp Trưởng"}</span>
              <span class="text-xs text-stone-500 font-mono">(@${u.username})</span>
              ${badgesHtml}
            </div>
            <div class="text-xs text-stone-500 truncate mt-0.5">
              <span>${u.email || "Không có email"}</span> &bull; 
              <span class="text-orange-700 font-semibold">${u.kitchenName || "Nhà bếp"}</span>
            </div>
          </div>
        </div>
        <span class="text-xs font-bold text-purple-700 bg-white px-3 py-1.5 rounded-xl border border-purple-200 shadow-sm flex-shrink-0">
          Chi tiết ➔
        </span>
      `;

      itemBtn.addEventListener("click", () => {
        openUserActionModal(u);
      });

      usersListContainer.appendChild(itemBtn);
    });
  };

  const loadAndShowUsers = async () => {
    if (modalAdminPanel) modalAdminPanel.close();
    if (modalAdminUsers) modalAdminUsers.showModal();
    if (usersCountEl) usersCountEl.textContent = "Đang tải danh sách người chơi...";
    if (searchUsersInput) searchUsersInput.value = "";

    try {
      cachedUsersList = await getAllUsers();
      renderUsersList(cachedUsersList);
      announceToScreenReader(`Đã tải danh sách gồm ${cachedUsersList.length} tài khoản người chơi. Sử dụng ô tìm kiếm hoặc Tab để duyệt.`);
    } catch (e) {
      console.error("Lỗi tải users:", e);
      if (usersCountEl) usersCountEl.textContent = "Lỗi nạp danh sách tài khoản.";
    }
  };

  if (btnAdminViewUsers) {
    btnAdminViewUsers.addEventListener("click", loadAndShowUsers);
  }

  if (searchUsersInput) {
    searchUsersInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderUsersList(cachedUsersList);
        return;
      }
      const filtered = cachedUsersList.filter(u => 
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.kitchenName && u.kitchenName.toLowerCase().includes(q))
      );
      renderUsersList(filtered);
    });
  }

  const returnToAdminPanel = () => {
    if (modalAdminUsers) modalAdminUsers.close();
    if (modalAdminPanel) modalAdminPanel.showModal();
  };
  if (btnCloseAdminUsers) btnCloseAdminUsers.addEventListener("click", returnToAdminPanel);
  if (btnBackToAdminPanel) btnBackToAdminPanel.addEventListener("click", returnToAdminPanel);

  // --- 4. Chi Tiết Người Chơi & Menu Hành Động ---
  const modalUserAction = document.getElementById("modal-admin-user-action");
  const btnCloseUserAction = document.getElementById("btn-close-user-action");
  const btnBackToUsersList = document.getElementById("btn-back-to-users-list");
  const userActionTitle = document.getElementById("admin-user-action-title");
  const userActionSubtitle = document.getElementById("admin-user-action-subtitle");
  const userDetailsBox = document.getElementById("admin-user-details-box");

  const btnUserActionRole = document.getElementById("btn-user-action-role");
  const btnUserActionRoleText = document.getElementById("btn-user-action-role-text");
  const btnUserActionBan = document.getElementById("btn-user-action-ban");
  const btnUserActionBanIcon = document.getElementById("btn-user-action-ban-icon");
  const btnUserActionBanText = document.getElementById("btn-user-action-ban-text");
  const btnUserActionResetPwd = document.getElementById("btn-user-action-reset-pwd");
  const btnUserActionDelete = document.getElementById("btn-user-action-delete");

  const openUserActionModal = (u) => {
    currentSelectedUser = u;
    if (modalAdminUsers) modalAdminUsers.close();

    const isRoot = u.username === ROOT_ADMIN_USERNAME;
    if (userActionTitle) userActionTitle.textContent = u.displayName || "Bếp Trưởng";
    if (userActionSubtitle) userActionSubtitle.textContent = `@${u.username}`;

    if (userDetailsBox) {
      userDetailsBox.innerHTML = `
        <div class="flex items-center justify-between pb-1 border-b border-stone-200">
          <span class="text-stone-500 font-semibold">Tên đăng nhập:</span>
          <span class="font-bold text-stone-900 font-mono">@${u.username}</span>
        </div>
        <div class="flex items-center justify-between py-1 border-b border-stone-200">
          <span class="text-stone-500 font-semibold">Email:</span>
          <span class="font-bold text-stone-900">${u.email || "Chưa thiết lập"}</span>
        </div>
        <div class="flex items-center justify-between py-1 border-b border-stone-200">
          <span class="text-stone-500 font-semibold">Gian bếp:</span>
          <span class="font-bold text-orange-700">${u.kitchenName || "Nhà bếp sáng tạo"}</span>
        </div>
        <div class="flex items-center justify-between py-1 border-b border-stone-200">
          <span class="text-stone-500 font-semibold">Quyền hạn:</span>
          <span class="font-bold ${isRoot ? 'text-amber-800' : (u.isAdmin ? 'text-purple-800' : 'text-stone-700')}">
            ${isRoot ? '👑 Quản Trị Viên Tối Cao' : (u.isAdmin ? '🛡️ Quản Trị Viên' : '🍳 Bếp Trưởng Thường')}
          </span>
        </div>
        <div class="flex items-center justify-between pt-1">
          <span class="text-stone-500 font-semibold">Trạng thái tài khoản:</span>
          <span class="font-bold ${u.isBanned ? 'text-red-700' : 'text-emerald-700'}">
            ${u.isBanned ? `🚫 Đang bị cấm (${u.banReason || 'Không có lý do'})` : '🟢 Hoạt động bình thường'}
          </span>
        </div>
        ${u.isIpBanned ? '<div class="text-xs text-red-600 font-bold mt-1">⚠️ Địa chỉ IP của tài khoản này đã bị cấm.</div>' : ''}
        ${isRoot ? '<div class="mt-2 p-2 bg-amber-100/80 rounded-xl text-amber-900 font-bold text-xs">⭐ Quản trị viên tối cao lc_boy là bất khả xâm phạm. Không ai có quyền tước quyền, cấm hay xóa.</div>' : ''}
      `;
    }

    // Điều chỉnh các nút thao tác
    if (isRoot) {
      if (btnUserActionRole) btnUserActionRole.classList.add("hidden");
      if (btnUserActionBan) btnUserActionBan.classList.add("hidden");
      if (btnUserActionDelete) btnUserActionDelete.classList.add("hidden");
    } else {
      if (btnUserActionRole) {
        btnUserActionRole.classList.remove("hidden");
        if (btnUserActionRoleText) {
          btnUserActionRoleText.textContent = u.isAdmin ? "🔻 Tước Quyền Quản Trị Viên" : "👑 Thăng Chức Lên Quản Trị Viên";
        }
      }
      if (btnUserActionBan) {
        btnUserActionBan.classList.remove("hidden");
        if (btnUserActionBanIcon && btnUserActionBanText) {
          btnUserActionBanIcon.textContent = u.isBanned ? "🔓" : "🚫";
          btnUserActionBanText.textContent = u.isBanned ? "Mở Khóa / Gỡ Cấm Tài Khoản" : "Cấm Tài Khoản Này";
        }
      }
      if (btnUserActionDelete) {
        btnUserActionDelete.classList.remove("hidden");
      }
    }

    if (modalUserAction) modalUserAction.showModal();
    announceToScreenReader(`Chi tiết tài khoản ${u.displayName} @${u.username}. Dùng Tab để chọn thao tác.`);
  };

  const returnToUsersList = () => {
    if (modalUserAction) modalUserAction.close();
    if (modalAdminUsers) modalAdminUsers.showModal();
  };
  if (btnCloseUserAction) btnCloseUserAction.addEventListener("click", returnToUsersList);
  if (btnBackToUsersList) btnBackToUsersList.addEventListener("click", returnToUsersList);

  // --- 5. Đổi Quyền Quản Trị Viên ---
  if (btnUserActionRole) {
    btnUserActionRole.addEventListener("click", async () => {
      if (!currentSelectedUser) return;
      const target = currentSelectedUser;
      const willBeAdmin = !target.isAdmin;
      const actionText = willBeAdmin ? "thăng chức lên Quản trị viên" : "tước quyền Quản trị viên";
      const confirmAction = window.confirm(`Bạn có chắc muốn ${actionText} cho tài khoản @${target.username}?`);
      if (!confirmAction) return;

      try {
        await toggleAdminRole(target.uid, willBeAdmin, target.username);
        target.isAdmin = willBeAdmin;
        openUserActionModal(target);
        announceToScreenReader(`Đã ${actionText} cho tài khoản @${target.username} thành công.`);
      } catch (err) {
        alert(err.message || "Thao tác thất bại.");
      }
    });
  }

  // --- 6. Cấm Tài Khoản / Mở Khóa ---
  const modalAdminBan = document.getElementById("modal-admin-ban-user");
  const btnCancelBan = document.getElementById("btn-cancel-ban");
  const formAdminBan = document.getElementById("form-admin-ban");
  const banTargetName = document.getElementById("admin-ban-target-name");

  if (btnUserActionBan) {
    btnUserActionBan.addEventListener("click", async () => {
      if (!currentSelectedUser) return;
      const target = currentSelectedUser;
      
      // Nếu đang bị cấm -> Thực hiện Mở khóa (Unban)
      if (target.isBanned) {
        const confirmUnban = window.confirm(`Bạn có chắc muốn MỞ KHÓA / GỠ CẤM cho tài khoản @${target.username}?`);
        if (!confirmUnban) return;
        try {
          await unbanUser(target.uid);
          target.isBanned = false;
          target.banReason = "";
          target.isIpBanned = false;
          openUserActionModal(target);
          announceToScreenReader(`Đã mở khóa tài khoản @${target.username} thành công.`);
        } catch (e) {
          alert(e.message || "Lỗi khi mở khóa tài khoản.");
        }
        return;
      }

      // Nếu chưa bị cấm -> Mở modal Cấm
      if (modalUserAction) modalUserAction.close();
      if (banTargetName) banTargetName.textContent = `Bạn đang chuẩn bị cấm tài khoản: @${target.username}`;
      const reasonInput = document.getElementById("ban-reason");
      const banIpBox = document.getElementById("ban-ip-checkbox");
      if (reasonInput) reasonInput.value = "";
      if (banIpBox) banIpBox.checked = false;

      if (modalAdminBan) {
        modalAdminBan.showModal();
        if (reasonInput) reasonInput.focus();
        announceToScreenReader(`Hộp thoại cấm tài khoản @${target.username}. Nhập lý do cấm.`);
      }
    });
  }

  if (btnCancelBan && modalAdminBan) {
    btnCancelBan.addEventListener("click", () => {
      modalAdminBan.close();
      if (modalUserAction) modalUserAction.showModal();
    });
  }

  if (formAdminBan && modalAdminBan) {
    formAdminBan.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentSelectedUser) return;
      const target = currentSelectedUser;
      const reason = document.getElementById("ban-reason").value.trim();
      const banIp = document.getElementById("ban-ip-checkbox").checked;

      try {
        await banUser(target.uid, target.username, reason, banIp);
        target.isBanned = true;
        target.banReason = reason || "Không có lý do";
        target.isIpBanned = banIp;

        modalAdminBan.close();
        openUserActionModal(target);
        announceToScreenReader(`Đã cấm tài khoản @${target.username} thành công.`);
      } catch (err) {
        alert(err.message || "Lỗi cấm tài khoản.");
      }
    });
  }

  // --- 7. Đổi Mật Khẩu Người Chơi ---
  const modalAdminResetPwd = document.getElementById("modal-admin-reset-pwd");
  const btnCancelResetPwd = document.getElementById("btn-cancel-reset-pwd");
  const formAdminResetPwd = document.getElementById("form-admin-reset-pwd");
  const resetPwdTargetName = document.getElementById("admin-reset-pwd-target-name");
  const resetPwdAlert = document.getElementById("admin-reset-pwd-alert");

  if (btnUserActionResetPwd) {
    btnUserActionResetPwd.addEventListener("click", () => {
      if (!currentSelectedUser) return;
      const target = currentSelectedUser;
      if (modalUserAction) modalUserAction.close();

      if (resetPwdTargetName) resetPwdTargetName.textContent = `Đổi mật khẩu cho: @${target.username}`;
      const p1 = document.getElementById("admin-new-password");
      const p2 = document.getElementById("admin-confirm-password");
      if (p1) p1.value = "";
      if (p2) p2.value = "";
      if (resetPwdAlert) resetPwdAlert.classList.add("hidden");

      if (modalAdminResetPwd) {
        modalAdminResetPwd.showModal();
        if (p1) p1.focus();
        announceToScreenReader(`Hộp thoại đổi mật khẩu cho tài khoản @${target.username}.`);
      }
    });
  }

  if (btnCancelResetPwd && modalAdminResetPwd) {
    btnCancelResetPwd.addEventListener("click", () => {
      modalAdminResetPwd.close();
      if (modalUserAction) modalUserAction.showModal();
    });
  }

  if (formAdminResetPwd && modalAdminResetPwd) {
    formAdminResetPwd.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentSelectedUser) return;
      const target = currentSelectedUser;
      const p1 = document.getElementById("admin-new-password").value;
      const p2 = document.getElementById("admin-confirm-password").value;

      if (!p1 || p1.length < 8) {
        if (resetPwdAlert) {
          resetPwdAlert.textContent = "Mật khẩu mới phải có tối thiểu 8 ký tự.";
          resetPwdAlert.className = "text-xs p-3 rounded-xl font-bold bg-red-100 text-red-800 border border-red-300";
          resetPwdAlert.classList.remove("hidden");
        }
        return;
      }
      if (p1 !== p2) {
        if (resetPwdAlert) {
          resetPwdAlert.textContent = "Mật khẩu xác nhận không trùng khớp.";
          resetPwdAlert.className = "text-xs p-3 rounded-xl font-bold bg-red-100 text-red-800 border border-red-300";
          resetPwdAlert.classList.remove("hidden");
        }
        return;
      }

      try {
        await adminResetPassword(target.uid, p1);
        modalAdminResetPwd.close();
        if (modalUserAction) modalUserAction.showModal();
        announceToScreenReader(`Đã đổi mật khẩu cho tài khoản @${target.username} thành công.`);
        alert(`Đổi mật khẩu cho tài khoản @${target.username} thành công!`);
      } catch (err) {
        if (resetPwdAlert) {
          resetPwdAlert.textContent = err.message || "Lỗi khi đổi mật khẩu.";
          resetPwdAlert.className = "text-xs p-3 rounded-xl font-bold bg-red-100 text-red-800 border border-red-300";
          resetPwdAlert.classList.remove("hidden");
        }
      }
    });
  }

  // --- 8. Xóa Tài Khoản Vĩnh Viễn ---
  const modalAdminDelete = document.getElementById("modal-admin-delete-user");
  const btnCancelDelete = document.getElementById("btn-cancel-delete-user");
  const btnConfirmDelete = document.getElementById("btn-confirm-delete-user");
  const deleteTargetText = document.getElementById("admin-delete-target-text");

  if (btnUserActionDelete) {
    btnUserActionDelete.addEventListener("click", () => {
      if (!currentSelectedUser) return;
      const target = currentSelectedUser;
      if (modalUserAction) modalUserAction.close();

      if (deleteTargetText) {
        deleteTargetText.innerHTML = `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <strong>"${target.displayName}" (@${target.username})</strong>? Toàn bộ dữ liệu hồ sơ sẽ bị xóa khỏi cơ sở dữ liệu và không thể hoàn tác!`;
      }
      if (modalAdminDelete) {
        modalAdminDelete.showModal();
        if (btnCancelDelete) btnCancelDelete.focus();
        announceToScreenReader(`Cảnh báo: Bạn có chắc chắn muốn xóa tài khoản @${target.username} vĩnh viễn không?`);
      }
    });
  }

  if (btnCancelDelete && modalAdminDelete) {
    btnCancelDelete.addEventListener("click", () => {
      modalAdminDelete.close();
      if (modalUserAction) modalUserAction.showModal();
    });
  }

  if (btnConfirmDelete && modalAdminDelete) {
    btnConfirmDelete.addEventListener("click", async () => {
      if (!currentSelectedUser) return;
      const target = currentSelectedUser;
      try {
        await deleteUserAccount(target.uid, target.username, target.email);
        modalAdminDelete.close();
        announceToScreenReader(`Đã xóa vĩnh viễn tài khoản @${target.username}.`);
        alert(`Đã xóa tài khoản @${target.username} thành công.`);
        await loadAndShowUsers();
      } catch (err) {
        alert(err.message || "Lỗi khi xóa tài khoản.");
      }
    });
  }

  // --- 9. Đặt Thông Báo Trong Ngày (MOTD) ---
  const btnAdminOpenMotd = document.getElementById("btn-admin-open-motd");
  const modalAdminMotd = document.getElementById("modal-admin-motd");
  const btnCloseAdminMotd = document.getElementById("btn-close-admin-motd");
  const btnCancelMotd = document.getElementById("btn-cancel-motd");
  const formAdminMotd = document.getElementById("form-admin-motd");
  const motdTitleInput = document.getElementById("admin-motd-title-input");
  const motdContentInput = document.getElementById("admin-motd-content-input");
  const motdAlert = document.getElementById("admin-motd-alert");

  if (btnAdminOpenMotd && modalAdminMotd) {
    btnAdminOpenMotd.addEventListener("click", async () => {
      if (modalAdminPanel) modalAdminPanel.close();
      if (motdAlert) motdAlert.classList.add("hidden");

      // Nạp thông báo hiện tại nếu có
      try {
        const existingMotd = await getSystemMotd();
        if (existingMotd) {
          if (motdTitleInput) motdTitleInput.value = existingMotd.title || "";
          if (motdContentInput) motdContentInput.value = existingMotd.content || "";
        } else {
          if (motdTitleInput) motdTitleInput.value = "";
          if (motdContentInput) motdContentInput.value = "";
        }
      } catch (e) {}

      modalAdminMotd.showModal();
      if (motdTitleInput) motdTitleInput.focus();
      announceToScreenReader("Hộp thoại đặt thông báo trong ngày (MOTD). Nhập tiêu đề và nội dung.");
    });
  }

  const closeMotdModal = () => {
    if (modalAdminMotd) modalAdminMotd.close();
    if (modalAdminPanel) modalAdminPanel.showModal();
  };
  if (btnCloseAdminMotd) btnCloseAdminMotd.addEventListener("click", closeMotdModal);
  if (btnCancelMotd) btnCancelMotd.addEventListener("click", closeMotdModal);

  if (formAdminMotd && modalAdminMotd) {
    formAdminMotd.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = motdTitleInput.value.trim();
      const content = motdContentInput.value.trim();
      const profile = getActiveProfileCache();

      if (!title || !content) {
        if (motdAlert) {
          motdAlert.textContent = "Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo.";
          motdAlert.className = "text-xs p-3 rounded-xl font-bold bg-red-100 text-red-800 border border-red-300";
          motdAlert.classList.remove("hidden");
        }
        return;
      }

      try {
        await setSystemMotd({
          title,
          content,
          authorName: profile ? (profile.displayName || profile.username) : ROOT_ADMIN_USERNAME
        });

        modalAdminMotd.close();
        if (modalAdminPanel) modalAdminPanel.showModal();
        announceToScreenReader("Đã đăng thông báo trong ngày mới thành công. Thông báo cũ đã được ghi đè.");
        alert("Đã đăng thông báo trong ngày mới thành công! Tất cả người chơi sẽ nhìn thấy khi đăng nhập.");
      } catch (err) {
        if (motdAlert) {
          motdAlert.textContent = err.message || "Lỗi khi lưu thông báo.";
          motdAlert.className = "text-xs p-3 rounded-xl font-bold bg-red-100 text-red-800 border border-red-300";
          motdAlert.classList.remove("hidden");
        }
      }
    });
  }

  // --- 10. Đóng Thông Báo Trong Ngày Broadcast Khi Người Chơi Nhấn Đã Đọc ---
  const btnCloseMotdBroadcast = document.getElementById("btn-close-motd-broadcast");
  const modalBroadcast = document.getElementById("modal-motd-broadcast");
  if (btnCloseMotdBroadcast && modalBroadcast) {
    btnCloseMotdBroadcast.addEventListener("click", async () => {
      const activeProfile = getActiveProfileCache();
      const currentMotd = await getSystemMotd();
      if (activeProfile && currentMotd) {
        await markMotdAsRead(activeProfile, currentMotd.id);
      }
      modalBroadcast.close();
      const btnEnter = document.getElementById("btn-menu-enter-kitchen");
      if (btnEnter) btnEnter.focus();
      announceToScreenReader("Đã đọc thông báo trong ngày. Chuyển về Menu Chính.");
    });
  }

  // --- 11. Quản Lý Cộng Đồng Đầu Bếp (Admin) ---
  const btnAdminManageCommunity = document.getElementById("btn-admin-manage-community");
  const modalAdminCommunity = document.getElementById("modal-admin-community");
  const btnCloseAdminCommunity = document.getElementById("btn-close-admin-community");
  const btnBackFromAdminCommunity = document.getElementById("btn-back-from-admin-community");
  const adminSearchCommunity = document.getElementById("admin-search-community");
  const btnAdminDeleteAllCommunity = document.getElementById("btn-admin-delete-all-community");
  const adminCommunityListEl = document.getElementById("admin-community-list");
  const adminCommunityCountEl = document.getElementById("admin-community-count");

  let cachedAdminCommunityDishes = [];

  const renderAdminCommunityList = (dishes) => {
    if (!adminCommunityListEl) return;
    adminCommunityListEl.innerHTML = "";

    if (!dishes || dishes.length === 0) {
      adminCommunityListEl.innerHTML = `
        <div class="p-6 text-center text-stone-500 font-semibold text-sm bg-stone-50 rounded-2xl border border-dashed border-stone-300">
          Chưa có món ăn hoặc bữa ăn nào trên Cộng đồng Đầu bếp.
        </div>
      `;
      if (adminCommunityCountEl) adminCommunityCountEl.textContent = "Hiện có 0 bài đăng trên cộng đồng";
      return;
    }

    if (adminCommunityCountEl) {
      adminCommunityCountEl.textContent = `Hiện có ${dishes.length} món ăn / bữa ăn được đăng lên cộng đồng`;
    }

    dishes.forEach((post) => {
      const itemEl = document.createElement("div");
      itemEl.setAttribute("role", "listitem");
      itemEl.className = "p-4 bg-stone-50 hover:bg-emerald-50/60 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition";

      const titleText = post.headingTitle || "Món Ăn Sáng Tạo";
      const chefText = post.chefDisplayName || post.chefUsername || "Bếp Trưởng";
      const kitchenText = post.kitchenName || "Nhà Bếp Sáng Tạo";
      const scoreText = Number(post.satisfactionScore) || 0;

      const infoDiv = document.createElement("div");
      infoDiv.className = "min-w-0 flex-1";

      const h3 = document.createElement("h3");
      h3.className = "font-extrabold text-stone-900 font-game text-sm sm:text-base leading-snug";
      h3.textContent = titleText;

      const metaP = document.createElement("p");
      metaP.className = "text-xs text-stone-600 mt-1";
      metaP.textContent = `Người chơi: ${chefText} (@${post.chefUsername || "chef"}) • Được sản xuất bởi: ${kitchenText} • Điểm hài lòng: ${scoreText} điểm`;

      infoDiv.appendChild(h3);
      infoDiv.appendChild(metaP);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "px-3.5 py-2 bg-red-100 hover:bg-red-600 text-red-800 hover:text-white font-game font-bold text-xs rounded-xl border border-red-300 transition cursor-pointer shrink-0";
      delBtn.textContent = `🗑️ Xóa ${titleText}`;
      delBtn.setAttribute("aria-label", `Xóa ${titleText}`);

      delBtn.addEventListener("click", async () => {
        const confirmDel = window.confirm(`Bạn có chắc chắn muốn xóa bài đăng "${titleText}" của ${chefText} khỏi cộng đồng không?`);
        if (!confirmDel) return;
        try {
          await deleteCommunityDish(post.id);
          cachedAdminCommunityDishes = cachedAdminCommunityDishes.filter(d => d.id !== post.id);
          const q = adminSearchCommunity ? adminSearchCommunity.value.toLowerCase().trim() : "";
          const listToRender = q
            ? cachedAdminCommunityDishes.filter(d =>
                (d.headingTitle && d.headingTitle.toLowerCase().includes(q)) ||
                (d.chefDisplayName && d.chefDisplayName.toLowerCase().includes(q)) ||
                (d.kitchenName && d.kitchenName.toLowerCase().includes(q))
              )
            : cachedAdminCommunityDishes;
          renderAdminCommunityList(listToRender);
          announceToScreenReader(`Đã xóa ${titleText} khỏi cộng đồng đầu bếp.`);
        } catch (err) {
          alert(err.message || "Lỗi khi xóa bài đăng cộng đồng.");
        }
      });

      itemEl.appendChild(infoDiv);
      itemEl.appendChild(delBtn);
      adminCommunityListEl.appendChild(itemEl);
    });
  };

  const openAdminCommunityModal = async () => {
    if (modalAdminPanel) modalAdminPanel.close();
    if (modalAdminCommunity) modalAdminCommunity.showModal();
    if (adminSearchCommunity) adminSearchCommunity.value = "";
    if (adminCommunityCountEl) adminCommunityCountEl.textContent = "Đang tải danh sách món ăn trên cộng đồng...";

    try {
      cachedAdminCommunityDishes = await getCommunityDishes();
      renderAdminCommunityList(cachedAdminCommunityDishes);
      if (adminSearchCommunity) adminSearchCommunity.focus();
      announceToScreenReader(`Quản lý cộng đồng đầu bếp: Đang có ${cachedAdminCommunityDishes.length} bài đăng.`);
    } catch (e) {
      console.error("Lỗi tải danh sách cộng đồng admin:", e);
      if (adminCommunityCountEl) adminCommunityCountEl.textContent = "Lỗi tải danh sách cộng đồng.";
    }
  };

  if (btnAdminManageCommunity) {
    btnAdminManageCommunity.addEventListener("click", openAdminCommunityModal);
  }

  if (adminSearchCommunity) {
    adminSearchCommunity.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderAdminCommunityList(cachedAdminCommunityDishes);
        return;
      }
      const filtered = cachedAdminCommunityDishes.filter(d =>
        (d.headingTitle && d.headingTitle.toLowerCase().includes(q)) ||
        (d.chefDisplayName && d.chefDisplayName.toLowerCase().includes(q)) ||
        (d.chefUsername && d.chefUsername.toLowerCase().includes(q)) ||
        (d.kitchenName && d.kitchenName.toLowerCase().includes(q))
      );
      renderAdminCommunityList(filtered);
    });
  }

  if (btnAdminDeleteAllCommunity) {
    btnAdminDeleteAllCommunity.addEventListener("click", async () => {
      if (cachedAdminCommunityDishes.length === 0) {
        announceToScreenReader("Hiện không có bài đăng nào trên cộng đồng để xóa.");
        alert("Hiện không có bài đăng nào trên cộng đồng để xóa.");
        return;
      }
      const confirmAll = window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA TẤT CẢ (${cachedAdminCommunityDishes.length} bài đăng) trên Cộng đồng Đầu bếp không?`);
      if (!confirmAll) return;

      try {
        await deleteAllCommunityDishes();
        cachedAdminCommunityDishes = [];
        renderAdminCommunityList([]);
        announceToScreenReader("Đã xóa tất cả món ăn trên Cộng đồng Đầu bếp thành công.");
        alert("Đã xóa tất cả món ăn trên Cộng đồng Đầu bếp thành công!");
      } catch (err) {
        alert(err.message || "Lỗi khi xóa tất cả bài đăng cộng đồng.");
      }
    });
  }

  const returnFromAdminCommunity = () => {
    if (modalAdminCommunity) modalAdminCommunity.close();
    if (modalAdminPanel) modalAdminPanel.showModal();
    if (btnAdminManageCommunity) btnAdminManageCommunity.focus();
  };
  if (btnCloseAdminCommunity) btnCloseAdminCommunity.addEventListener("click", returnFromAdminCommunity);
  if (btnBackFromAdminCommunity) btnBackFromAdminCommunity.addEventListener("click", returnFromAdminCommunity);

  // --- 12. Đặt Lại Bảng Xếp Hạng (Admin) ---
  const btnAdminResetLeaderboard = document.getElementById("btn-admin-reset-leaderboard");
  if (btnAdminResetLeaderboard) {
    btnAdminResetLeaderboard.addEventListener("click", async () => {
      const confirmReset = window.confirm("Bạn có chắc chắn muốn ĐẶT LẠI BẢNG XẾP HẠNG về trống không? Toàn bộ điểm của các đầu bếp sẽ đưa về 0.");
      if (!confirmReset) return;

      try {
        await resetLeaderboardScores();
        announceToScreenReader("Đã đặt lại bảng xếp hạng về trống thành công.");
        alert("Đã đặt lại Bảng xếp hạng thành công! Hiện tại chưa có ai trong bảng xếp hạng này.");
      } catch (err) {
        alert(err.message || "Lỗi khi đặt lại bảng xếp hạng.");
      }
    });
  }
}

/**
 * =========================================================================
 * BỘ ĐIỀU PHỐI CỘNG ĐỒNG ĐẦU BẾP & BẢNG XẾP HẠNG TOP 100 (PLAYER & KITCHEN)
 * =========================================================================
 */
export function initCommunityAndLeaderboardController() {
  // --- A. Nút "Đưa Lên Cộng Đồng" tại Bàn Tiệc (Sau khi khách ăn xong & đánh giá) ---
  const shareContainer = document.getElementById("share-community-container");
  const btnShareToCommunity = document.getElementById("btn-share-to-community");
  const modalConfirmShare = document.getElementById("modal-confirm-share-community");
  const confirmShareDesc = document.getElementById("confirm-share-community-desc");
  const btnConfirmShareYes = document.getElementById("btn-confirm-share-yes");
  const btnConfirmShareNo = document.getElementById("btn-confirm-share-no");

  if (btnShareToCommunity && modalConfirmShare) {
    btnShareToCommunity.addEventListener("click", () => {
      const meal = state.lastTastedMeal;
      if (!meal) {
        announceToScreenReader("Chưa có món ăn nào vừa được thực khách đánh giá để đưa lên cộng đồng.", true);
        return;
      }

      const headingPreview = formatCommunityMealHeading(meal.dishes, meal.fallbackTitle);
      if (confirmShareDesc) {
        confirmShareDesc.textContent = `Tác phẩm: "${headingPreview}" (Điểm hài lòng: ${meal.satisfactionScore} điểm). Khi xác nhận, tác phẩm sẽ được đưa lên Cộng đồng Đầu bếp và cộng ${meal.satisfactionScore} điểm vào tổng điểm Bảng xếp hạng của bạn!`;
      }

      modalConfirmShare.showModal();
      if (btnConfirmShareYes) btnConfirmShareYes.focus();
      announceToScreenReader(`Bạn có muốn đưa lên cộng đồng đầu bếp không? Tác phẩm ${headingPreview}, điểm hài lòng ${meal.satisfactionScore} điểm. Nhấn Xác nhận để đưa lên.`);
    });
  }

  if (btnConfirmShareNo && modalConfirmShare) {
    btnConfirmShareNo.addEventListener("click", () => {
      modalConfirmShare.close();
      if (btnShareToCommunity) btnShareToCommunity.focus();
      announceToScreenReader("Đã hủy đưa món ăn lên cộng đồng.");
    });
  }

  if (btnConfirmShareYes && modalConfirmShare) {
    btnConfirmShareYes.addEventListener("click", async () => {
      const meal = state.lastTastedMeal;
      if (!meal) {
        modalConfirmShare.close();
        return;
      }

      try {
        btnConfirmShareYes.disabled = true;
        btnConfirmShareYes.textContent = "Đang đưa lên...";

        const result = await publishMealToCommunity(meal, getActiveProfileCache());

        modalConfirmShare.close();

        // Nút "Đưa lên cộng đồng" biến mất hoàn toàn (reset) cho đến khi bày bữa ăn mới và khách ăn xong đánh giá lại
        if (shareContainer) {
          shareContainer.classList.add("hidden");
        }
        state.lastTastedMeal = null;

        // Chuyển focus về Tab Tủ Lạnh hoặc nút hợp lý để NVDA không bị mất điểm neo
        const tabFridge = document.getElementById("tab-fridge");
        if (tabFridge) tabFridge.focus();

        announceToScreenReader(
          `Đã đưa "${result.post.headingTitle}" lên Cộng đồng Đầu bếp thành công! Bạn được cộng ${result.addedScore} điểm hài lòng vào tổng điểm (Tổng điểm hiện tại: ${result.newTotalScore} điểm).`,
          true
        );
      } catch (err) {
        alert(err.message || "Không thể đưa món ăn lên cộng đồng. Vui lòng thử lại.");
      } finally {
        btnConfirmShareYes.disabled = false;
        btnConfirmShareYes.textContent = "✅ Xác nhận";
      }
    });
  }

  // --- B. Trang "Cộng Đồng Đầu Bếp" ngoài Menu Chính & Hộp Thoại "Xem Chi Tiết" ---
  const btnMenuCommunity = document.getElementById("btn-menu-community");
  const modalCommunityHub = document.getElementById("modal-community-hub");
  const btnCloseCommunityHub = document.getElementById("btn-close-community-hub");
  const btnBackFromCommunity = document.getElementById("btn-back-from-community");
  const communitySearchInput = document.getElementById("community-search-input");
  const communityDishesListEl = document.getElementById("community-dishes-list");

  const modalDishDetail = document.getElementById("modal-community-dish-detail");
  const btnCloseDishDetail = document.getElementById("btn-close-community-detail");
  const btnCloseDishDetailBottom = document.getElementById("btn-close-community-detail-bottom");
  const detailTitleEl = document.getElementById("community-detail-title");
  const detailMetaEl = document.getElementById("community-detail-meta");
  const detailDishesListEl = document.getElementById("community-detail-dishes-list");
  const detailCustomerEmojiEl = document.getElementById("community-detail-customer-emoji");
  const detailCustomerNameEl = document.getElementById("community-detail-customer-name");
  const detailCustomerSpeechEl = document.getElementById("community-detail-customer-speech");
  const detailScoreEl = document.getElementById("community-detail-score");

  let cachedCommunityPosts = [];
  let lastFocusedViewDetailBtn = null;

  const openCommunityDishDetail = (post, triggerBtn) => {
    lastFocusedViewDetailBtn = triggerBtn || null;

    if (detailTitleEl) detailTitleEl.textContent = post.headingTitle || "Món Ăn Sáng Tạo";
    if (detailMetaEl) {
      detailMetaEl.textContent = `Người chơi: ${post.chefDisplayName || "Bếp Trưởng"} • Được sản xuất bởi: ${post.kitchenName || "Nhà Bếp Sáng Tạo"}`;
    }

    // 1. Hiện danh sách những món ăn có trên cái dĩa được người chơi đưa lên cộng đồng
    if (detailDishesListEl) {
      detailDishesListEl.innerHTML = "";
      const dishesOnPlate = Array.isArray(post.dishesOnPlate) && post.dishesOnPlate.length > 0
        ? post.dishesOnPlate
        : [{ name: post.headingTitle || "Món ăn", emoji: "🍽️", structureSummary: "Chế biến tự do" }];

      dishesOnPlate.forEach((d, idx) => {
        const li = document.createElement("li");
        li.className = "p-2.5 bg-white rounded-xl border border-amber-200 flex items-start gap-2.5 shadow-2xs";

        const emojiSpan = document.createElement("span");
        emojiSpan.className = "text-xl shrink-0";
        emojiSpan.setAttribute("aria-hidden", "true");
        emojiSpan.textContent = d.emoji || "🍽️";

        const textWrap = document.createElement("div");
        textWrap.className = "min-w-0 flex-1";

        const dishNameStrong = document.createElement("div");
        dishNameStrong.className = "font-extrabold text-stone-900 font-game text-xs sm:text-sm";
        dishNameStrong.textContent = `Món ${idx + 1}: ${d.name || "Món ăn"}`;

        const dishDescP = document.createElement("div");
        dishDescP.className = "text-xs text-stone-600 mt-0.5";
        const detailText = d.structureSummary || d.ingredientsSummary || "";
        dishDescP.textContent = detailText ? `Thành phần & Chế biến: ${detailText}` : "Món ăn sáng tạo tự do";

        textWrap.appendChild(dishNameStrong);
        textWrap.appendChild(dishDescP);
        li.appendChild(emojiSpan);
        li.appendChild(textWrap);
        detailDishesListEl.appendChild(li);
      });
    }

    // 2. Sau đó là đánh giá của khách hàng và điểm hài lòng
    if (detailCustomerEmojiEl) detailCustomerEmojiEl.textContent = post.customerEmoji || "😋";
    if (detailCustomerNameEl) {
      detailCustomerNameEl.textContent = `Đánh giá của khách hàng (${post.customerName || "Thực Khách"}):`;
    }
    if (detailCustomerSpeechEl) {
      detailCustomerSpeechEl.textContent = post.customerSpeech || "Món ăn rất ngon miệng!";
    }
    if (detailScoreEl) {
      detailScoreEl.textContent = `${Number(post.satisfactionScore) || 0} / 100 điểm (${post.customerMoodTag || "Hài lòng"})`;
    }

    if (modalDishDetail) {
      modalDishDetail.showModal();
      if (btnCloseDishDetail) {
        btnCloseDishDetail.focus();
      } else if (btnCloseDishDetailBottom) {
        btnCloseDishDetailBottom.focus();
      }
      announceToScreenReader(
        `Chi tiết: ${post.headingTitle}. Gồm ${post.dishesOnPlate ? post.dishesOnPlate.length : 1} món trên dĩa. Đánh giá của ${post.customerName}: ${post.customerSpeech}. Điểm hài lòng: ${post.satisfactionScore} điểm.`
      );
    }
  };

  const closeCommunityDishDetail = () => {
    if (modalDishDetail && modalDishDetail.open) {
      modalDishDetail.close();
      if (lastFocusedViewDetailBtn) {
        lastFocusedViewDetailBtn.focus();
      }
    }
  };

  if (btnCloseDishDetail) btnCloseDishDetail.addEventListener("click", closeCommunityDishDetail);
  if (btnCloseDishDetailBottom) btnCloseDishDetailBottom.addEventListener("click", closeCommunityDishDetail);
  if (modalDishDetail) {
    modalDishDetail.addEventListener("close", () => {
      if (lastFocusedViewDetailBtn) lastFocusedViewDetailBtn.focus();
    });
  }

  const renderCommunityHubList = (posts) => {
    if (!communityDishesListEl) return;
    communityDishesListEl.innerHTML = "";

    if (!posts || posts.length === 0) {
      communityDishesListEl.innerHTML = `
        <div class="col-span-full p-10 text-center text-stone-600 font-semibold text-base bg-white/90 rounded-3xl border-2 border-dashed border-emerald-300 shadow-sm">
          Chưa có món ăn hoặc bữa ăn nào được đưa lên Cộng đồng Đầu bếp. Hãy vào nhà bếp nấu ăn và trở thành người đầu tiên chia sẻ tác phẩm nhé!
        </div>
      `;
      return;
    }

    posts.forEach((post) => {
      const card = document.createElement("article");
      card.className = "p-5 sm:p-6 bg-white rounded-3xl border-2 border-emerald-200 hover:border-emerald-400 shadow-md hover:shadow-lg transition flex flex-col justify-between gap-3";

      const topInfo = document.createElement("div");
      topInfo.className = "flex flex-col gap-1.5";

      // 1. Đầu tiên là Heading tên món ăn (hoặc Bữa ăn với: tên món 1, tên món 2, ..., và tên món N)
      const headingEl = document.createElement("h3");
      headingEl.className = "text-lg sm:text-xl font-extrabold font-game text-stone-900 leading-snug";
      headingEl.textContent = post.headingTitle || "Món Ăn Sáng Tạo";

      // 2. Ở dưới hiện tên người chơi
      const playerEl = document.createElement("p");
      playerEl.className = "text-sm sm:text-base font-bold text-stone-700";
      playerEl.textContent = `Người chơi: ${post.chefDisplayName || post.chefUsername || "Bếp Trưởng"}`;

      // 3. Ở dưới nữa hiện: Được sản xuất bởi: tên nhà bếp
      const kitchenEl = document.createElement("p");
      kitchenEl.className = "text-sm sm:text-base font-bold text-orange-800";
      kitchenEl.textContent = `Được sản xuất bởi: ${post.kitchenName || "Nhà Bếp Sáng Tạo"}`;

      topInfo.appendChild(headingEl);
      topInfo.appendChild(playerEl);
      topInfo.appendChild(kitchenEl);

      // 4. Và nút Xem chi tiết để xem món ăn đó
      const actionRow = document.createElement("div");
      actionRow.className = "mt-2 pt-3 border-t border-emerald-100 flex items-center justify-between gap-3";

      const scoreBadge = document.createElement("span");
      scoreBadge.className = "text-xs sm:text-sm font-extrabold text-emerald-800 bg-emerald-100 px-3.5 py-1.5 rounded-full border border-emerald-200";
      scoreBadge.textContent = `⭐ Điểm hài lòng: ${Number(post.satisfactionScore) || 0} điểm`;

      const viewBtn = document.createElement("button");
      viewBtn.type = "button";
      viewBtn.className = "px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-game font-bold text-xs sm:text-sm shadow transition cursor-pointer";
      viewBtn.textContent = "🔍 Xem chi tiết";
      viewBtn.setAttribute("aria-label", `Xem chi tiết ${post.headingTitle} của ${post.chefDisplayName || "Bếp Trưởng"}`);

      viewBtn.addEventListener("click", () => {
        openCommunityDishDetail(post, viewBtn);
      });

      actionRow.appendChild(scoreBadge);
      actionRow.appendChild(viewBtn);

      card.appendChild(topInfo);
      card.appendChild(actionRow);

      communityDishesListEl.appendChild(card);
    });
  };

  if (btnMenuCommunity && modalCommunityHub) {
    btnMenuCommunity.addEventListener("click", async () => {
      modalCommunityHub.showModal();
      if (communitySearchInput) communitySearchInput.value = "";
      if (communityDishesListEl) {
        communityDishesListEl.innerHTML = `<div class="col-span-full p-8 text-center text-stone-500 font-semibold text-base">Đang tải danh sách món ăn từ Cộng đồng Đầu bếp...</div>`;
      }

      try {
        cachedCommunityPosts = await getCommunityDishes();
        renderCommunityHubList(cachedCommunityPosts);
        if (btnBackFromCommunity) {
          btnBackFromCommunity.focus();
        } else if (communitySearchInput) {
          communitySearchInput.focus();
        }
        announceToScreenReader(`Cộng đồng Đầu bếp: Hiện có ${cachedCommunityPosts.length} món ăn và bữa ăn. Dùng phím H hoặc số 3 để duyệt nhanh qua từng món ăn.`);
      } catch (e) {
        console.error("Lỗi tải Cộng đồng đầu bếp:", e);
      }
    });
  }

  if (communitySearchInput) {
    communitySearchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderCommunityHubList(cachedCommunityPosts);
        return;
      }
      const filtered = cachedCommunityPosts.filter(p =>
        (p.headingTitle && p.headingTitle.toLowerCase().includes(q)) ||
        (p.chefDisplayName && p.chefDisplayName.toLowerCase().includes(q)) ||
        (p.kitchenName && p.kitchenName.toLowerCase().includes(q))
      );
      renderCommunityHubList(filtered);
    });
  }

  const closeCommunityHub = () => {
    if (modalCommunityHub && modalCommunityHub.open) {
      modalCommunityHub.close();
      if (btnMenuCommunity) btnMenuCommunity.focus();
    }
  };
  if (btnCloseCommunityHub) btnCloseCommunityHub.addEventListener("click", closeCommunityHub);
  if (btnBackFromCommunity) btnBackFromCommunity.addEventListener("click", closeCommunityHub);
  if (modalCommunityHub) {
    modalCommunityHub.addEventListener("close", () => {
      if (btnMenuCommunity) btnMenuCommunity.focus();
    });
  }

  // --- C. Bảng Xếp Hạng Top 100 Đầu Bếp ngoài Menu Chính ---
  const btnMenuLeaderboard = document.getElementById("btn-menu-leaderboard");
  const modalLeaderboard = document.getElementById("modal-leaderboard");
  const btnCloseLeaderboard = document.getElementById("btn-close-leaderboard");
  const btnBackFromLeaderboard = document.getElementById("btn-back-from-leaderboard");
  const leaderboardListEl = document.getElementById("leaderboard-list");

  const renderLeaderboardTop100 = (topList) => {
    if (!leaderboardListEl) return;
    leaderboardListEl.innerHTML = "";

    if (!topList || topList.length === 0) {
      leaderboardListEl.innerHTML = `
        <div class="p-10 text-center text-stone-600 font-bold text-base sm:text-lg bg-white/90 rounded-3xl border-2 border-dashed border-amber-300 shadow-sm">
          Chưa có ai trong bảng xếp hạng này.
        </div>
      `;
      return;
    }

    topList.forEach((entry) => {
      const row = document.createElement("div");
      row.setAttribute("role", "listitem");

      let bgStyle = "bg-white border-stone-200 text-stone-800 shadow-xs";
      let medalIcon = "🎖️";
      if (entry.rank === 1) {
        bgStyle = "bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 border-amber-400 text-amber-950 shadow-md";
        medalIcon = "🥇";
      } else if (entry.rank === 2) {
        bgStyle = "bg-gradient-to-r from-slate-100 via-white to-stone-100 border-slate-300 text-slate-900 shadow-sm";
        medalIcon = "🥈";
      } else if (entry.rank === 3) {
        bgStyle = "bg-gradient-to-r from-orange-100/80 via-amber-50 to-orange-50 border-orange-300 text-orange-950 shadow-sm";
        medalIcon = "🥉";
      }

      row.className = `p-4 sm:p-5 rounded-3xl border-2 ${bgStyle} flex items-center justify-between gap-4 transition`;

      const headingLine = document.createElement("h3");
      headingLine.className = "font-extrabold font-game text-base sm:text-lg leading-snug";
      // Định dạng chuẩn 100% theo yêu cầu:
      // Số hạng: tên đầu bếp, đến từ: tên nhà bếp, có số điểm
      headingLine.textContent = `Hạng ${entry.rank}: ${entry.displayName}, đến từ: ${entry.kitchenName}, có ${entry.totalScore} điểm`;

      const iconSpan = document.createElement("span");
      iconSpan.className = "text-2xl sm:text-3xl shrink-0";
      iconSpan.setAttribute("aria-hidden", "true");
      iconSpan.textContent = medalIcon;

      const leftWrap = document.createElement("div");
      leftWrap.className = "flex items-center gap-3.5 min-w-0";
      leftWrap.appendChild(iconSpan);
      leftWrap.appendChild(headingLine);

      row.appendChild(leftWrap);
      leaderboardListEl.appendChild(row);
    });
  };

  if (btnMenuLeaderboard && modalLeaderboard) {
    btnMenuLeaderboard.addEventListener("click", async () => {
      modalLeaderboard.showModal();
      if (leaderboardListEl) {
        leaderboardListEl.innerHTML = `<div class="p-8 text-center text-stone-500 font-semibold text-base">Đang tải Bảng xếp hạng Top 100 Đầu bếp...</div>`;
      }

      try {
        const top100 = await getLeaderboardTop100();
        renderLeaderboardTop100(top100);
        if (btnBackFromLeaderboard) btnBackFromLeaderboard.focus();

        if (!top100 || top100.length === 0) {
          announceToScreenReader("Bảng xếp hạng: Chưa có ai trong bảng xếp hạng này.");
        } else {
          announceToScreenReader(`Bảng xếp hạng Top ${top100.length} đầu bếp nấu ăn ngon nhất. Đứng đầu là Hạng 1: ${top100[0].displayName}, đến từ: ${top100[0].kitchenName}, có ${top100[0].totalScore} điểm.`);
        }
      } catch (e) {
        console.error("Lỗi tải Bảng xếp hạng:", e);
      }
    });
  }

  const closeLeaderboard = () => {
    if (modalLeaderboard && modalLeaderboard.open) {
      modalLeaderboard.close();
      if (btnMenuLeaderboard) btnMenuLeaderboard.focus();
    }
  };
  if (btnCloseLeaderboard) btnCloseLeaderboard.addEventListener("click", closeLeaderboard);
  if (btnBackFromLeaderboard) btnBackFromLeaderboard.addEventListener("click", closeLeaderboard);
  if (modalLeaderboard) {
    modalLeaderboard.addEventListener("close", () => {
      if (btnMenuLeaderboard) btnMenuLeaderboard.focus();
    });
  }
}

/**
 * Khởi tạo toàn bộ sự kiện và luồng hoạt động
 */
export function initMainMenuController() {
  // 1. Áp dụng cài đặt lưu trữ
  const currentSettings = getSavedSettings();
  applySettingsToGameState(currentSettings);

  // 2. Chuyển đổi giữa Login và Register
  const btnSwitchToReg = document.getElementById("btn-switch-to-register");
  if (btnSwitchToReg) {
    btnSwitchToReg.addEventListener("click", () => showAuthView("register"));
  }

  const btnBackToLogin = document.getElementById("btn-back-to-login");
  if (btnBackToLogin) {
    btnBackToLogin.addEventListener("click", () => showAuthView("login"));
  }

  // 3. Nút Ẩn/Hiện mật khẩu ở Đăng Nhập
  const btnToggleLoginPwd = document.getElementById("btn-toggle-login-pwd");
  const inputLoginPwd = document.getElementById("login-password");
  if (btnToggleLoginPwd && inputLoginPwd) {
    btnToggleLoginPwd.addEventListener("click", () => {
      const isPwd = inputLoginPwd.type === "password";
      inputLoginPwd.type = isPwd ? "text" : "password";
      btnToggleLoginPwd.textContent = isPwd ? "🔒 Ẩn mật khẩu" : "👁️ Hiện mật khẩu";
      btnToggleLoginPwd.setAttribute("aria-label", isPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu");
    });
  }

  // 4. Xử lý Form Đăng Nhập
  const formLogin = document.getElementById("form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert("login-alert-box");

      const identifier = document.getElementById("login-identifier").value.trim();
      const password = document.getElementById("login-password").value;
      const rememberMe = document.getElementById("login-remember-me").checked;
      const btnSubmit = document.getElementById("btn-login-submit");
      const btnText = document.getElementById("btn-login-text");

      try {
        if (btnSubmit) btnSubmit.disabled = true;
        if (btnText) btnText.textContent = "Đang kiểm tra đăng nhập...";

        const profile = await loginUser({ identifier, password, rememberMe });
        
        updateMainMenuUserProfile(profile);
        showScreen("main-menu");
        announceToScreenReader(`Đăng nhập thành công! Chào mừng Bếp Trưởng ${profile.displayName} đến với YumCraft Kitchen.`);
        await checkAndShowMotdBroadcast(profile);
      } catch (err) {
        showAlert("login-alert-box", err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      } finally {
        if (btnSubmit) btnSubmit.disabled = false;
        if (btnText) btnText.textContent = "Đăng Nhập";
      }
    });
  }

  // 5. Xử lý Form Đăng Ký
  const formRegister = document.getElementById("form-register");
  if (formRegister) {
    formRegister.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert("reg-alert-box");

      const username = document.getElementById("reg-username").value.trim();
      const displayName = document.getElementById("reg-display-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const password = document.getElementById("reg-password").value;
      const confirmPassword = document.getElementById("reg-confirm-password").value;
      const kitchenName = document.getElementById("reg-kitchen-name").value.trim();
      const rememberMe = document.getElementById("reg-remember-me").checked;
      const btnSubmit = document.getElementById("btn-register-submit");
      const btnText = document.getElementById("btn-register-text");

      try {
        if (btnSubmit) btnSubmit.disabled = true;
        if (btnText) btnText.textContent = "Đang khởi tạo tài khoản Bếp Trưởng...";

        const profile = await registerUser({
          username,
          displayName,
          email,
          password,
          confirmPassword,
          kitchenName,
          rememberMe
        });

        updateMainMenuUserProfile(profile);
        showScreen("main-menu");
        announceToScreenReader(`Đăng ký tài khoản thành công! Chào mừng Bếp Trưởng ${profile.displayName} cùng gian bếp ${profile.kitchenName}.`);
        await checkAndShowMotdBroadcast(profile);
      } catch (err) {
        showAlert("reg-alert-box", err.message || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
      } finally {
        if (btnSubmit) btnSubmit.disabled = false;
        if (btnText) btnText.textContent = "Hoàn Tất Đăng Ký & Vào Bếp";
      }
    });
  }

  // 6. Xử lý Các Nút Trong Menu Chính
  const btnMenuEnter = document.getElementById("btn-menu-enter-kitchen");
  if (btnMenuEnter) {
    btnMenuEnter.addEventListener("click", () => {
      showScreen("character-select");
    });
  }

  const btnMenuSettings = document.getElementById("btn-menu-settings");
  const modalSettings = document.getElementById("modal-settings");
  const btnCloseSettings = document.getElementById("btn-close-settings");
  const btnSaveSettings = document.getElementById("btn-save-settings");

  // Nạp trạng thái cài đặt vào modal
  const populateSettingsModal = () => {
    const s = getSavedSettings();
    const toggleSfx = document.getElementById("setting-sfx-toggle");
    const volSlider = document.getElementById("setting-sfx-volume");
    const volLabel = document.getElementById("setting-sfx-volume-val");
    const voiceToggle = document.getElementById("setting-voice-announcements");

    if (toggleSfx) toggleSfx.checked = s.sfxEnabled;
    if (volSlider) volSlider.value = s.sfxVolume;
    if (volLabel) volLabel.textContent = s.sfxVolume + "%";
    if (voiceToggle) voiceToggle.checked = s.voiceAnnouncements;
  };

  if (btnMenuSettings && modalSettings) {
    btnMenuSettings.addEventListener("click", () => {
      populateSettingsModal();
      modalSettings.showModal();
    });
  }

  if (btnCloseSettings && modalSettings) {
    btnCloseSettings.addEventListener("click", () => {
      modalSettings.close();
      if (btnMenuSettings) btnMenuSettings.focus();
    });
  }

  const sfxSlider = document.getElementById("setting-sfx-volume");
  const sfxLabel = document.getElementById("setting-sfx-volume-val");
  if (sfxSlider && sfxLabel) {
    sfxSlider.addEventListener("input", (e) => {
      sfxLabel.textContent = e.target.value + "%";
    });
  }

  if (btnSaveSettings && modalSettings) {
    btnSaveSettings.addEventListener("click", () => {
      const toggleSfx = document.getElementById("setting-sfx-toggle");
      const volSlider = document.getElementById("setting-sfx-volume");
      const voiceToggle = document.getElementById("setting-voice-announcements");

      const newSettings = {
        sfxEnabled: toggleSfx ? toggleSfx.checked : true,
        sfxVolume: volSlider ? parseInt(volSlider.value, 10) : 80,
        voiceAnnouncements: voiceToggle ? voiceToggle.checked : true
      };

      saveSettings(newSettings);
      applySettingsToGameState(newSettings);
      modalSettings.close();
      if (btnMenuSettings) btnMenuSettings.focus();
      announceToScreenReader("Đã lưu cài đặt trò chơi thành công.");
    });
  }

  // Nút Hướng dẫn trong Menu Chính
  const btnMenuHelp = document.getElementById("btn-menu-help");
  const modalHelp = document.getElementById("modal-help");
  if (btnMenuHelp && modalHelp) {
    btnMenuHelp.addEventListener("click", () => {
      modalHelp.showModal();
    });
  }

  // Nút Đăng xuất trong Menu Chính
  const btnMenuLogout = document.getElementById("btn-menu-logout");
  if (btnMenuLogout) {
    btnMenuLogout.addEventListener("click", async () => {
      const confirmLogout = window.confirm("Bạn có chắc chắn muốn đăng xuất tài khoản Bếp Trưởng khỏi thiết bị này?");
      if (confirmLogout) {
        await logoutUser();
        showScreen("auth");
        showAuthView("login");
        announceToScreenReader("Đã đăng xuất tài khoản. Quay lại màn hình đăng nhập.");
      }
    });
  }

  // Nút Quay lại Menu Chính ở Màn hình Chọn Thực Khách
  const btnBackToMenu = document.getElementById("btn-back-to-main-menu");
  if (btnBackToMenu) {
    btnBackToMenu.addEventListener("click", () => {
      showScreen("main-menu");
    });
  }

  // 6.5. Khởi tạo Bảng Quản Trị Viên & Hệ Thống Thông Báo Máy Chủ
  initAdminPanelController();

  // 6.6. Khởi tạo Hệ Thống Cộng Đồng Đầu Bếp & Bảng Xếp Hạng Top 100
  initCommunityAndLeaderboardController();

  // 7. Lắng nghe Session ban đầu (Tự động đăng nhập nếu có duy trì đăng nhập)
  initAuthListener(async (profile) => {
    if (profile) {
      updateMainMenuUserProfile(profile);
      // Nếu đang ở màn hình auth thì chuyển vào main-menu
      const screenAuth = document.getElementById("screen-auth");
      if (screenAuth && !screenAuth.classList.contains("hidden")) {
        showScreen("main-menu");
        announceToScreenReader(`Chào mừng Bếp Trưởng ${profile.displayName} đã trở lại YumCraft Kitchen.`);
        await checkAndShowMotdBroadcast(profile);
      }
    } else {
      // Chưa đăng nhập: hiển thị màn hình Auth
      showScreen("auth");
      showAuthView("login");
    }
  });

  // Hỗ trợ phím tắt toàn cục cho Menu Chính
  window.addEventListener("keydown", (e) => {
    const screenMainMenu = document.getElementById("screen-main-menu");
    const isMainMenuVisible = screenMainMenu && !screenMainMenu.classList.contains("hidden");

    if (isMainMenuVisible) {
      // Phím H: Mở hướng dẫn
      if ((e.key === "h" || e.key === "H") && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (modalHelp && !modalHelp.open && modalSettings && !modalSettings.open) {
          e.preventDefault();
          modalHelp.showModal();
        }
      }
    }
  });
}

// Khởi chạy khi DOM đã sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMainMenuController);
} else {
  initMainMenuController();
}
