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
  getActiveProfileCache,
  updateCurrentUserProfile,
  updateCurrentUserPrivacySettings,
  changeCurrentUserPassword
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
import { toggleCommunityLike, toggleFollowChef, getFollowingChefIds, getFollowedFeed, hydrateCommunitySocial, getOnlineChefs, getChefPublicProfile, startChefPresence, stopChefPresence, sendKitchenInvite, getKitchenInvites, respondToKitchenInvite, getDirectMessages, getMyConversations, sendDirectMessage, blockChef, unblockChef, getBlockedChefs, getBlockedChefIds } from "./social-service.js";

import { state } from "./core/state.js";
import { getSavedSettings, saveSettings, applySettingsToState } from "./core/settings.js";
import { announceNVDA } from "./accessibility/nvda-announcer.js";
import { escapeHtml } from "./ui/dom-helpers.js";
import { showConfirmDialog, showPromptDialog, showNoticeDialog } from "./ui/confirm-dialog.js";
import { getProfileGenderLabel } from "./profile-data.js";
import { getChefRecipes, getPostLikeState, filterBlockedRecipes, normalizeSearchText, matchesOnlineChefSearch, matchesCommunityRecipeSearch } from "./social-data.js";

export { getSavedSettings, saveSettings };

/**
 * Phát loa thông báo cho NVDA / Trình đọc màn hình (qua bộ điều phối thống nhất)
 */
function announceToScreenReader(text, assertive = false) {
  announceNVDA(text, assertive ? "assertive" : "polite");
}

/**
 * Hiển thị alert trong form
 */
function showAlert(boxId, message, isError = true) {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.textContent = message;
  box.classList.remove("hidden", "sr-only");
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
  box.className = "sr-only mb-4 p-3.5 rounded-2xl text-sm font-semibold border";
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
      s.hidden = true;
    }
  });

  if (screenName === "auth") {
    if (screenAuth) {
      screenAuth.hidden = false;
      screenAuth.classList.remove("hidden");
      screenAuth.classList.add("flex");
      const firstInput = document.getElementById("login-identifier");
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
      announceToScreenReader("Màn hình Đăng Nhập YumCraft Kitchen.");
    }
  } else if (screenName === "main-menu") {
    if (screenMainMenu) {
      screenMainMenu.hidden = false;
      screenMainMenu.classList.remove("hidden");
      screenMainMenu.classList.add("flex");
      const btnEnter = document.getElementById("btn-menu-enter-kitchen");
      if (btnEnter) setTimeout(() => btnEnter.focus(), 100);
      announceToScreenReader("Menu Chính YumCraft Kitchen. Sử dụng phím Tab hoặc mũi tên để chọn.");
    }
  } else if (screenName === "character-select") {
    if (screenSelect) {
      screenSelect.hidden = false;
      screenSelect.classList.remove("hidden");
      screenSelect.classList.add("flex");
      const btnBack = document.getElementById("btn-back-to-main-menu");
      if (btnBack) setTimeout(() => btnBack.focus(), 100);
      announceToScreenReader("Màn hình Chọn Thực Khách. Chọn 1 trong 4 nhân vật để bắt đầu nấu.");
    }
  } else if (screenName === "kitchen") {
    if (screenKitchen) {
      screenKitchen.hidden = false;
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
  applySettingsToState(settings, state);
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
        await showNoticeDialog({ title: "Không có quyền truy cập", message: "Bạn không có quyền truy cập Bảng Quản Trị." });
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
        const confirmTurnOff = await showConfirmDialog({
          title: "Tắt bảo trì máy chủ",
          message: "Bạn có chắc chắn muốn TẮT chế độ bảo trì máy chủ? Người chơi sẽ có thể đăng nhập bình thường."
        });
        if (confirmTurnOff) {
          await setMaintenanceMode(false);
          await refreshAdminPanelStats();
          announceToScreenReader("Đã tắt chế độ bảo trì máy chủ thành công.");
        }
      } else {
        const reasonInput = await showPromptDialog({
          title: "Bật chế độ bảo trì",
          message: "Nhập thông báo lý do bảo trì gửi đến người chơi (hoặc để trống dùng mặc định):",
          defaultValue: "Máy chủ đang tạm dừng ít phút để bảo trì và nâng cấp gian bếp. Vui lòng quay lại sau!"
        });
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
              <span class="font-extrabold text-stone-900 font-game truncate text-sm sm:text-base">${escapeHtml(u.displayName || "Bếp Trưởng")}</span>
              <span class="text-xs text-stone-500 font-mono">(@${escapeHtml(u.username)})</span>
              ${badgesHtml}
            </div>
            <div class="text-xs text-stone-500 truncate mt-0.5">
              <span>${escapeHtml(u.email || "Không có email")}</span> &bull; 
              <span class="text-orange-700 font-semibold">${escapeHtml(u.kitchenName || "Nhà bếp")}</span>
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
          <span class="font-bold text-stone-900 font-mono">@${escapeHtml(u.username)}</span>
        </div>
        <div class="flex items-center justify-between py-1 border-b border-stone-200">
          <span class="text-stone-500 font-semibold">Email:</span>
          <span class="font-bold text-stone-900">${escapeHtml(u.email || "Chưa thiết lập")}</span>
        </div>
        <div class="flex items-center justify-between py-1 border-b border-stone-200">
          <span class="text-stone-500 font-semibold">Gian bếp:</span>
          <span class="font-bold text-orange-700">${escapeHtml(u.kitchenName || "Nhà bếp sáng tạo")}</span>
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
            ${u.isBanned ? `🚫 Đang bị cấm (${escapeHtml(u.banReason || 'Không có lý do')})` : '🟢 Hoạt động bình thường'}
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
      const confirmAction = await showConfirmDialog({
        title: "Xác nhận đổi quyền hạn",
        message: `Bạn có chắc muốn ${actionText} cho tài khoản @${target.username}?`
      });
      if (!confirmAction) return;

      try {
        await toggleAdminRole(target.uid, willBeAdmin, target.username);
        target.isAdmin = willBeAdmin;
        openUserActionModal(target);
        announceToScreenReader(`Đã ${actionText} cho tài khoản @${target.username} thành công.`);
      } catch (err) {
        await showNoticeDialog({ title: "Lỗi", message: err.message || "Thao tác thất bại." });
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
        const confirmUnban = await showConfirmDialog({
          title: "Xác nhận mở khóa",
          message: `Bạn có chắc muốn MỞ KHÓA / GỠ CẤM cho tài khoản @${target.username}?`
        });
        if (!confirmUnban) return;
        try {
          await unbanUser(target.uid);
          target.isBanned = false;
          target.banReason = "";
          target.isIpBanned = false;
          openUserActionModal(target);
          announceToScreenReader(`Đã mở khóa tài khoản @${target.username} thành công.`);
        } catch (e) {
          await showNoticeDialog({ title: "Lỗi", message: e.message || "Lỗi khi mở khóa tài khoản." });
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
        await showNoticeDialog({ title: "Lỗi", message: err.message || "Lỗi cấm tài khoản." });
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
        await showNoticeDialog({ title: "Thành công", message: `Đổi mật khẩu cho tài khoản @${target.username} thành công!` });
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
        deleteTargetText.innerHTML = `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <strong>"${escapeHtml(target.displayName)}" (@${escapeHtml(target.username)})</strong>? Toàn bộ dữ liệu hồ sơ sẽ bị xóa khỏi cơ sở dữ liệu và không thể hoàn tác!`;
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
        await showNoticeDialog({ title: "Thành công", message: `Đã xóa tài khoản @${target.username} thành công.` });
        await loadAndShowUsers();
      } catch (err) {
        await showNoticeDialog({ title: "Lỗi", message: err.message || "Lỗi khi xóa tài khoản." });
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
        await showNoticeDialog({ title: "Thành công", message: "Đã đăng thông báo trong ngày mới thành công! Tất cả người chơi sẽ nhìn thấy khi đăng nhập." });
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
          Cộng đồng chưa có công thức nào.
        </div>
      `;
      if (adminCommunityCountEl) adminCommunityCountEl.textContent = "Hiện có 0 công thức trong cộng đồng";
      return;
    }

    if (adminCommunityCountEl) {
      adminCommunityCountEl.textContent = `Hiện có ${dishes.length} công thức trong cộng đồng`;
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
        const confirmDel = await showConfirmDialog({
          title: "Xác nhận xóa công thức",
          message: `Bạn có chắc chắn muốn xóa công thức "${titleText}" của ${chefText} khỏi cộng đồng không?`,
          danger: true
        });
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
          await showNoticeDialog({ title: "Lỗi", message: err.message || "Lỗi khi xóa công thức khỏi cộng đồng." });
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
      announceToScreenReader(`Quản lý cộng đồng đầu bếp: Đang có ${cachedAdminCommunityDishes.length} công thức.`);
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
        announceToScreenReader("Hiện không có công thức nào trên cộng đồng để xóa.");
        await showNoticeDialog({ title: "Thông báo", message: "Hiện không có công thức nào trên cộng đồng để xóa." });
        return;
      }
      const confirmAll = await showConfirmDialog({
        title: "Cảnh báo xóa tất cả",
        message: `CẢNH BÁO: Bạn có chắc chắn muốn XÓA TẤT CẢ (${cachedAdminCommunityDishes.length} công thức) trên Cộng đồng Đầu bếp không?`,
        danger: true
      });
      if (!confirmAll) return;

      try {
        await deleteAllCommunityDishes();
        cachedAdminCommunityDishes = [];
        renderAdminCommunityList([]);
        announceToScreenReader("Đã xóa tất cả món ăn trên Cộng đồng Đầu bếp thành công.");
        await showNoticeDialog({ title: "Thành công", message: "Đã xóa tất cả món ăn trên Cộng đồng Đầu bếp thành công!" });
      } catch (err) {
        await showNoticeDialog({ title: "Lỗi", message: err.message || "Lỗi khi xóa tất cả công thức cộng đồng." });
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
      const confirmReset = await showConfirmDialog({
        title: "Xác nhận đặt lại Bảng xếp hạng",
        message: "Bạn có chắc chắn muốn ĐẶT LẠI BẢNG XẾP HẠNG về trống không? Toàn bộ điểm của các đầu bếp sẽ đưa về 0.",
        danger: true
      });
      if (!confirmReset) return;

      try {
        await resetLeaderboardScores();
        announceToScreenReader("Đã đặt lại bảng xếp hạng về trống thành công.");
        await showNoticeDialog({ title: "Thành công", message: "Đã đặt lại Bảng xếp hạng thành công! Hiện tại chưa có ai trong bảng xếp hạng này." });
      } catch (err) {
        await showNoticeDialog({ title: "Lỗi", message: err.message || "Lỗi khi đặt lại bảng xếp hạng." });
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
  // --- A. Nút "Chia Sẻ Công Thức" tại Bàn Tiệc sau khi khách nếm thử ---
  const shareContainer = document.getElementById("share-community-container");
  const btnShareToCommunity = document.getElementById("btn-share-to-community");
  const modalConfirmShare = document.getElementById("modal-confirm-share-community");
  const confirmShareDesc = document.getElementById("confirm-share-community-desc");
  const btnConfirmShareYes = document.getElementById("btn-confirm-share-yes");
  const btnConfirmShareNo = document.getElementById("btn-confirm-share-no");

  if (btnShareToCommunity && modalConfirmShare) {
    btnShareToCommunity.addEventListener("click", () => {
      const meal = state.lastTastedMeal || window.lastTastedMeal;
      if (!meal) {
        announceToScreenReader("Chưa có công thức nào vừa được thực khách đánh giá để chia sẻ với cộng đồng.", true);
        return;
      }

      const headingPreview = formatCommunityMealHeading(meal.dishes, meal.fallbackTitle);
      if (confirmShareDesc) {
        confirmShareDesc.textContent = `Công thức: "${headingPreview}" (Điểm hài lòng: ${meal.satisfactionScore} điểm). Khi xác nhận, công thức sẽ được chia sẻ với Cộng đồng Đầu bếp và cộng ${meal.satisfactionScore} điểm vào tổng điểm Bảng xếp hạng của bạn!`;
      }

      modalConfirmShare.showModal();
      if (btnConfirmShareYes) btnConfirmShareYes.focus();
      announceToScreenReader(`Bạn có muốn chia sẻ công thức với cộng đồng đầu bếp không? ${headingPreview}, điểm hài lòng ${meal.satisfactionScore} điểm. Nhấn Xác nhận để chia sẻ.`);
    });
  }

  if (btnConfirmShareNo && modalConfirmShare) {
    btnConfirmShareNo.addEventListener("click", () => {
      modalConfirmShare.close();
      if (btnShareToCommunity) btnShareToCommunity.focus();
      announceToScreenReader("Đã hủy chia sẻ công thức với cộng đồng.");
    });
  }

  if (btnConfirmShareYes && modalConfirmShare) {
    btnConfirmShareYes.addEventListener("click", async () => {
      const meal = state.lastTastedMeal || window.lastTastedMeal;
      if (!meal) {
        modalConfirmShare.close();
        return;
      }

      try {
        btnConfirmShareYes.disabled = true;
        btnConfirmShareYes.textContent = "Đang chia sẻ...";

        const result = await publishMealToCommunity(meal, getActiveProfileCache());

        modalConfirmShare.close();

        // Nút chia sẻ công thức ẩn cho đến khi món tiếp theo được thực khách nếm thử
        if (shareContainer) {
          shareContainer.classList.add("hidden");
        }
        state.lastTastedMeal = null;
        window.lastTastedMeal = null;

        // Chuyển focus về Tab Tủ Lạnh hoặc nút hợp lý để NVDA không bị mất điểm neo
        const tabFridge = document.getElementById("tab-fridge");
        if (tabFridge) tabFridge.focus();

        announceToScreenReader(
          `Đã chia sẻ công thức "${result.post.headingTitle}" với Cộng đồng Đầu bếp! Bạn được cộng ${result.addedScore} điểm hài lòng vào tổng điểm (Tổng điểm hiện tại: ${result.newTotalScore} điểm).`,
          true
        );
      } catch (err) {
        await showNoticeDialog({ title: "Lỗi", message: err.message || "Không thể chia sẻ công thức. Vui lòng thử lại." });
      } finally {
        btnConfirmShareYes.disabled = false;
        btnConfirmShareYes.textContent = "✅ Xác nhận";
      }
    });
  }

  const applyCommunityAuthorPrivacy = async (posts) => {
    const blockedIds = await getBlockedChefIds();
    const visiblePosts = filterBlockedRecipes(posts, blockedIds);
    const authorIds = [...new Set(visiblePosts.map((post) => post.chefUid).filter(Boolean))];
    const profiles = new Map(await Promise.all(authorIds.map(async (uid) => {
      try { return [uid, await getChefPublicProfile(uid)]; }
      catch { return [uid, null]; }
    })));
    return visiblePosts.map((post) => {
      const profile = profiles.get(post.chefUid);
      if (!profile) return { ...post, chefBio: "", chefGender: "unspecified" };
      return {
        ...post,
        chefBio: profile.bio,
        chefGender: profile.gender ? post.chefGender : "unspecified"
      };
    });
  };

  // --- B. Trang "Cộng Đồng Đầu Bếp" ngoài Menu Chính & Hộp Thoại "Xem Chi Tiết" ---
  const btnMenuCommunity = document.getElementById("btn-menu-community");
  const modalCommunityHub = document.getElementById("modal-community-hub");
  const btnCloseCommunityHub = document.getElementById("btn-close-community-hub");
  const btnBackFromCommunity = document.getElementById("btn-back-from-community");
  const communitySearchInput = document.getElementById("community-search-input");
  const communityDishesListEl = document.getElementById("community-dishes-list");
  let hasLoadedCommunityPosts = false;
  const inviteListEl = document.getElementById("community-kitchen-invites-list");
  const inviteListBtn = document.getElementById("btn-community-kitchen-invites");
  const inviteDialog = document.getElementById("modal-community-kitchen-invites");
  const chatDialog = document.getElementById("modal-direct-chat");
  const chatMessagesEl = document.getElementById("direct-chat-messages");
  const chatTitleEl = document.getElementById("direct-chat-title");
  const chatInput = document.getElementById("direct-chat-input");
  const chatFeedback = document.getElementById("direct-chat-feedback");
  const chatForm = document.getElementById("form-direct-chat");
  let activeChatChef = null;
  let chatRefreshTimer = null;
  let inviteRefreshTimer = null;
  let chatReturnFocus = null;

  const renderDirectMessages = (messages) => {
    if (!chatMessagesEl) return;
    chatMessagesEl.innerHTML = "";
    if (!messages.length) {
      chatMessagesEl.textContent = "Chưa có tin nhắn. Hãy bắt đầu trò chuyện!";
      return;
    }
    messages.forEach((message) => {
      const bubble = document.createElement("article");
      bubble.className = `max-w-[90%] p-2.5 rounded-xl ${message.senderUid === getActiveProfileCache()?.uid ? "self-end bg-sky-200" : "self-start bg-white border border-sky-100"}`;
      const author = document.createElement("h3");
      author.className = "text-xs font-bold text-sky-950";
      author.textContent = message.senderUid === getActiveProfileCache()?.uid ? "Bạn" : (message.senderName || activeChatChef?.displayName || "Đầu bếp");
      const body = document.createElement("p");
      body.className = "whitespace-pre-wrap break-words text-sm text-stone-900";
      body.textContent = message.text;
      const time = document.createElement("time");
      time.className = "block mt-1 text-[11px] text-stone-600";
      time.dateTime = message.createdAt || "";
      time.textContent = message.createdAt ? new Date(message.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "";
      bubble.append(author, body, time);
      chatMessagesEl.appendChild(bubble);
    });
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  };

  const refreshDirectMessages = async () => {
    if (!activeChatChef) return;
    try {
      renderDirectMessages(await getDirectMessages(activeChatChef.uid));
      chatFeedback.textContent = activeChatChef.allowDirectMessages === false ? "Đầu bếp này hiện không nhận tin nhắn." : "Tin nhắn được làm mới tự động.";
    } catch (error) {
      chatFeedback.textContent = error.message || "Không tải được tin nhắn.";
    }
  };

  const openDirectChat = (chef, trigger = null) => {
    if (!getActiveProfileCache()?.uid) {
      announceToScreenReader("Vui lòng đăng nhập để trò chuyện.", true);
      return;
    }
    activeChatChef = chef;
    chatReturnFocus = trigger || document.activeElement;
    chatTitleEl.textContent = `Trò chuyện với ${chef.displayName || chef.name || "đầu bếp"}`;
    const canMessage = chef.allowDirectMessages !== false;
    chatInput.disabled = !canMessage;
    document.getElementById("btn-send-direct-chat").disabled = !canMessage;
    chatFeedback.textContent = canMessage ? "Đang tải tin nhắn…" : "Đầu bếp này hiện không nhận tin nhắn.";
    chatDialog.showModal();
    if (canMessage) chatInput.focus();
    void refreshDirectMessages();
    if (chatRefreshTimer) clearInterval(chatRefreshTimer);
    chatRefreshTimer = setInterval(refreshDirectMessages, 3000);
  };

  document.getElementById("btn-close-direct-chat")?.addEventListener("click", () => chatDialog.close());
  chatDialog?.addEventListener("close", () => {
    if (chatRefreshTimer) clearInterval(chatRefreshTimer);
    chatRefreshTimer = null;
    activeChatChef = null;
    if (chatReturnFocus?.isConnected) chatReturnFocus.focus();
  });
  chatForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeChatChef || !chatInput.value.trim()) return;
    const submit = document.getElementById("btn-send-direct-chat");
    submit.disabled = true;
    try {
      await sendDirectMessage(activeChatChef.uid, chatInput.value);
      chatInput.value = "";
      await refreshDirectMessages();
      chatInput.focus();
    } catch (error) {
      chatFeedback.textContent = error.message || "Không gửi được tin nhắn.";
      if (error.message?.includes("không nhận tin nhắn")) {
        activeChatChef.allowDirectMessages = false;
        chatInput.disabled = true;
        submit.disabled = true;
      }
    } finally {
      submit.disabled = activeChatChef?.allowDirectMessages === false;
    }
  });

  const refreshKitchenInvites = async () => {
    if (!inviteListEl) return;
    inviteListEl.setAttribute("aria-busy", "true");
    inviteListEl.textContent = "Đang tải lời mời…";
    try {
      const invites = await getKitchenInvites();
      inviteListEl.innerHTML = "";
      if (!invites.length) {
        inviteListEl.textContent = "Bạn chưa có lời mời vào bếp nào.";
        return;
      }
      invites.forEach((invite) => {
        const incoming = invite.recipientUid === getActiveProfileCache()?.uid;
        const partner = incoming
          ? { uid: invite.senderUid, displayName: invite.senderName || "Đầu bếp", kitchenName: invite.senderKitchen || "Nhà Bếp Sáng Tạo" }
          : { uid: invite.recipientUid, displayName: invite.recipientName || "Đầu bếp", kitchenName: "" };
        const card = document.createElement("article");
        card.className = "p-3 mb-2 bg-white rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-2";
        const summary = document.createElement("h3");
        summary.className = "text-sm font-bold text-stone-800";
        const details = document.createElement("p");
        details.className = "text-xs text-stone-600";
        const status = { pending: "đang chờ phản hồi", accepted: "đã chấp nhận lời mời", declined: "đã từ chối lời mời" }[invite.status] || "không xác định";
        summary.textContent = incoming ? `Lời mời từ ${partner.displayName}` : `Lời mời gửi đến ${partner.displayName}`;
        details.textContent = incoming ? `${partner.kitchenName} · ${status}` : `Lời mời vào bếp · ${status}`;
        card.append(summary, details);
        const actions = document.createElement("div");
        actions.className = "flex flex-wrap gap-2";
        if (incoming && invite.status === "pending") {
          for (const [label, response] of [["Chấp nhận", "accepted"], ["Từ chối", "declined"]]) {
            const action = document.createElement("button");
            action.type = "button";
            action.className = "px-3 py-1.5 rounded-lg bg-amber-100 font-bold text-sm";
            action.textContent = label;
            action.addEventListener("click", async () => {
              action.disabled = true;
              try {
                await respondToKitchenInvite(invite.id, response);
                await refreshKitchenInvites();
                announceToScreenReader(response === "accepted" ? `Đã chấp nhận lời mời vào bếp của ${partner.displayName}.` : `Đã từ chối lời mời của ${partner.displayName}.`);
              } catch (error) { action.disabled = false; announceToScreenReader(error.message, true); }
            });
            actions.appendChild(action);
          }
        }
        if (invite.status === "accepted") {
          const chatBtn = document.createElement("button");
          chatBtn.type = "button";
          chatBtn.className = "px-3 py-1.5 rounded-lg bg-sky-100 text-sky-950 font-bold text-sm";
          chatBtn.textContent = "Trò chuyện";
          chatBtn.addEventListener("click", () => openDirectChat(partner, chatBtn));
          actions.appendChild(chatBtn);
        }
        card.appendChild(actions);
        inviteListEl.appendChild(card);
      });
    } catch (error) {
      inviteListEl.textContent = error.message || "Không tải được lời mời.";
    } finally {
      inviteListEl.setAttribute("aria-busy", "false");
    }
  };

  inviteListBtn?.addEventListener("click", async () => {
    inviteDialog.showModal();
    document.getElementById("btn-close-community-kitchen-invites").focus();
    await refreshKitchenInvites();
    if (inviteRefreshTimer) clearInterval(inviteRefreshTimer);
    inviteRefreshTimer = setInterval(() => {
      if (inviteDialog.open) void refreshKitchenInvites();
    }, 10000);
  });
  document.getElementById("btn-close-community-kitchen-invites")?.addEventListener("click", () => inviteDialog.close());
  inviteDialog?.addEventListener("close", () => {
    if (inviteRefreshTimer) clearInterval(inviteRefreshTimer);
    inviteRefreshTimer = null;
    if (inviteListBtn?.isConnected) inviteListBtn.focus();
  });

  const kitchenSocialDialog = document.getElementById("modal-kitchen-social");
  const kitchenSocialTrigger = document.getElementById("btn-kitchen-social");
  const kitchenOnlineList = document.getElementById("kitchen-online-list");
  const kitchenOnlineSearchInput = document.getElementById("kitchen-online-search");
  const kitchenOnlineSearchEmpty = document.getElementById("kitchen-online-search-empty");
  const kitchenInvitesList = document.getElementById("kitchen-invites-list");
  const kitchenChatsList = document.getElementById("kitchen-chats-list");
  const filterKitchenOnlineChefs = () => {
    const query = normalizeSearchText(kitchenOnlineSearchInput?.value).replace(/^@/, "");
    let visibleCount = 0;
    kitchenOnlineList.querySelectorAll("article[data-search-text]").forEach((card) => {
      card.hidden = Boolean(query && !card.dataset.searchText.includes(query));
      if (!card.hidden) visibleCount++;
    });
    kitchenOnlineSearchEmpty.hidden = !query || visibleCount > 0;
  };
  kitchenOnlineSearchInput?.addEventListener("input", filterKitchenOnlineChefs);
  const renderKitchenSocial = async () => {
    for (const list of [kitchenOnlineList, kitchenInvitesList, kitchenChatsList]) {
      list.setAttribute("aria-busy", "true");
      list.textContent = "Đang tải…";
    }
    try {
      if (getActiveProfileCache()?.uid) followedChefIds = await getFollowingChefIds();
      const [chefs, invites, conversations] = await Promise.all([getOnlineChefs(), getKitchenInvites(), getMyConversations()]);
      kitchenOnlineList.replaceChildren();
      const ownProfile = getActiveProfileCache();
      if (ownProfile?.uid) {
        const ownCard = document.createElement("article");
        ownCard.className = "p-3 rounded-xl border border-sky-200 bg-sky-50";
        ownCard.dataset.searchText = normalizeSearchText(`${ownProfile.username || ""} ${ownProfile.displayName || ""} ${ownProfile.kitchenName || ""}`);
        const ownTitle = document.createElement("h3");
        ownTitle.className = "font-bold";
        ownTitle.textContent = `${ownProfile.displayName || ownProfile.username || "Bếp Trưởng"} (@${ownProfile.username || "chef"}) · Bạn`;
        const ownActions = document.createElement("div");
        ownActions.className = "mt-2 flex flex-wrap gap-2";
        const ownProfileButton = document.createElement("button");
        ownProfileButton.type = "button";
        ownProfileButton.className = "px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-950 font-bold text-sm";
        ownProfileButton.textContent = "Xem hồ sơ";
        ownProfileButton.addEventListener("click", () => void openChefPublicProfile(ownProfile, ownProfileButton));
        ownActions.append(ownProfileButton);
        ownCard.append(ownTitle, ownActions);
        kitchenOnlineList.append(ownCard);
      }
      const others = chefs.filter((chef) => chef.uid !== getActiveProfileCache()?.uid);
      if (!others.length && !ownProfile?.uid) kitchenOnlineList.textContent = "Hiện chưa có đầu bếp nào online.";
      else if (!others.length) {
        const empty = document.createElement("p");
        empty.className = "text-sm text-stone-600";
        empty.textContent = "Hiện chưa có đầu bếp nào khác online.";
        kitchenOnlineList.append(empty);
      }
      others.forEach((chef) => {
        const card = document.createElement("article");
        card.className = "p-3 rounded-xl border border-emerald-200 bg-white";
        card.dataset.searchText = normalizeSearchText(`${chef.username || ""} ${chef.displayName || ""} ${chef.kitchenName || ""}`);
        const title = document.createElement("h3"); title.className = "font-bold"; title.textContent = `${chef.displayName} (@${chef.username})`;
        const actions = document.createElement("div"); actions.className = "mt-2 flex flex-wrap gap-2";
        if (chef.allowKitchenInvites !== false) { const invite = document.createElement("button"); invite.type = "button"; invite.className = "px-3 py-1.5 rounded-lg bg-amber-100 font-bold text-sm"; invite.textContent = "Mời vào bếp";
          invite.addEventListener("click", async () => { invite.disabled = true; try { await sendKitchenInvite(chef.uid, chef.displayName); invite.textContent = "Đã gửi lời mời"; } catch (error) { invite.disabled = false; announceToScreenReader(error.message || "Không gửi được lời mời.", true); } }); actions.append(invite); }
        if (chef.allowDirectMessages !== false) { const chat = document.createElement("button"); chat.type = "button"; chat.className = "px-3 py-1.5 rounded-lg bg-sky-100 font-bold text-sm"; chat.textContent = "Nhắn tin"; chat.addEventListener("click", () => openDirectChat(chef, chat)); actions.append(chat); }
        const profile = document.createElement("button"); profile.type = "button"; profile.className = "px-3 py-1.5 rounded-lg bg-emerald-100 font-bold text-sm"; profile.textContent = "Xem hồ sơ"; profile.addEventListener("click", () => void openChefPublicProfile(chef, profile));
        const block = document.createElement("button"); block.type = "button"; block.className = "px-3 py-1.5 rounded-lg bg-rose-100 text-rose-900 font-bold text-sm"; block.textContent = "Chặn";
        block.addEventListener("click", async () => { block.disabled = true; try { await blockChef(chef.uid); announceToScreenReader(`Đã chặn ${chef.displayName}.`); await renderKitchenSocial(); } catch (error) { block.disabled = false; announceToScreenReader(error.message || "Không thể chặn đầu bếp.", true); } });
        actions.append(profile, block); card.append(title, actions); kitchenOnlineList.append(card);
      });
      kitchenInvitesList.replaceChildren();
      if (!invites.length) kitchenInvitesList.textContent = "Bạn chưa có lời mời nào.";
      invites.forEach((invite) => {
        const incoming = invite.recipientUid === getActiveProfileCache()?.uid;
        const partner = incoming ? { uid: invite.senderUid, displayName: invite.senderName || "Đầu bếp", kitchenName: invite.senderKitchen } : { uid: invite.recipientUid, displayName: invite.recipientName || "Đầu bếp" };
        const card = document.createElement("article"); card.className = "p-3 rounded-xl border border-amber-200 bg-white flex flex-wrap items-center justify-between gap-2";
        const summary = document.createElement("h3"); summary.className = "text-sm font-bold"; summary.textContent = incoming ? `Lời mời từ ${partner.displayName}` : `Lời mời gửi đến ${partner.displayName}`;
        const details = document.createElement("p"); details.className = "text-xs text-stone-600"; details.textContent = incoming ? `${partner.kitchenName || "Nhà bếp"} · ${invite.status}` : `Lời mời vào bếp · ${invite.status}`; card.append(summary, details);
        const actions = document.createElement("div"); actions.className = "flex gap-2";
        if (incoming && invite.status === "pending") for (const [label, answer] of [["Chấp nhận", "accepted"], ["Từ chối", "declined"]]) { const button = document.createElement("button"); button.type = "button"; button.className = "px-3 py-1.5 rounded-lg bg-amber-100 font-bold text-sm"; button.textContent = label; button.addEventListener("click", async () => { button.disabled = true; try { await respondToKitchenInvite(invite.id, answer); await renderKitchenSocial(); } catch (error) { button.disabled = false; announceToScreenReader(error.message || "Không xử lý được lời mời.", true); } }); actions.append(button); }
        if (invite.status === "accepted") { const chat = document.createElement("button"); chat.type = "button"; chat.className = "px-3 py-1.5 rounded-lg bg-sky-100 font-bold text-sm"; chat.textContent = "Nhắn tin"; chat.addEventListener("click", () => openDirectChat(partner, chat)); actions.append(chat); }
        card.append(actions); kitchenInvitesList.append(card);
      });
      kitchenChatsList.replaceChildren();
      if (!conversations.length) kitchenChatsList.textContent = "Chưa có cuộc trò chuyện. Chọn đầu bếp online để nhắn tin.";
      conversations.forEach((chef) => { const card = document.createElement("article"); card.className = "p-3 rounded-xl border border-sky-200 bg-white flex items-center justify-between gap-2"; const summary = document.createElement("div"); summary.className = "min-w-0"; const title = document.createElement("h3"); title.className = "text-sm font-bold"; title.textContent = chef.displayName; const preview = document.createElement("p"); preview.className = "text-sm text-stone-600 truncate"; preview.textContent = chef.lastMessage || "Chưa có tin nhắn"; summary.append(title, preview); const button = document.createElement("button"); button.type = "button"; button.className = "shrink-0 px-3 py-1.5 rounded-lg bg-sky-100 font-bold text-sm"; button.textContent = "Mở chat"; button.addEventListener("click", () => openDirectChat(chef, button)); card.append(summary, button); kitchenChatsList.append(card); });
      filterKitchenOnlineChefs();
    } catch (error) {
      for (const list of [kitchenOnlineList, kitchenInvitesList, kitchenChatsList]) list.textContent = error.message || "Không tải được dữ liệu kết nối.";
    } finally {
      for (const list of [kitchenOnlineList, kitchenInvitesList, kitchenChatsList]) list.setAttribute("aria-busy", "false");
    }
  };
  kitchenSocialTrigger?.addEventListener("click", () => { kitchenSocialDialog.showModal(); void renderKitchenSocial(); });
  document.getElementById("btn-close-kitchen-social")?.addEventListener("click", () => kitchenSocialDialog.close());
  document.getElementById("btn-refresh-kitchen-social")?.addEventListener("click", () => void renderKitchenSocial());
  kitchenSocialDialog?.addEventListener("close", () => { if (kitchenSocialTrigger?.isConnected) kitchenSocialTrigger.focus(); });

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
  const detailLikeCountEl = document.getElementById("community-detail-like-count");
  const detailLikeBtn = document.getElementById("btn-community-detail-like");
  let activeDetailPost = null;

  let cachedCommunityPosts = [];
  let followedChefIds = [];
  let communityFeedMode = "all";
  let lastFocusedViewDetailBtn = null;

  const openCommunityDishDetail = (post, triggerBtn) => {
    lastFocusedViewDetailBtn = triggerBtn || null;
    activeDetailPost = post;

    if (detailTitleEl) detailTitleEl.textContent = post.headingTitle || "Món Ăn Sáng Tạo";
    if (detailMetaEl) {
      detailMetaEl.textContent = `Người chơi: ${post.chefDisplayName || "Bếp Trưởng"} • Được sản xuất bởi: ${post.kitchenName || "Nhà Bếp Sáng Tạo"}`;
    }
    const currentProfile = getActiveProfileCache();
    const { liked: isLiked, likeCount } = getPostLikeState(post, currentProfile?.uid);
    if (detailLikeCountEl) detailLikeCountEl.textContent = `${likeCount} lượt thích`;
    if (detailLikeBtn) {
      detailLikeBtn.textContent = `${isLiked ? "♥ Đã thích" : "♡ Thích"} · ${likeCount}`;
      detailLikeBtn.setAttribute("aria-pressed", String(isLiked));
      detailLikeBtn.setAttribute("aria-label", `${isLiked ? "Bỏ thích" : "Thích"} công thức ${post.headingTitle || "này"}; ${likeCount} lượt thích`);
      detailLikeBtn.disabled = !currentProfile?.uid;
      detailLikeBtn.title = currentProfile?.uid ? "" : "Đăng nhập để thích công thức";
    }

    // 1. Hiện danh sách món trong công thức được chia sẻ
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

  detailLikeBtn?.addEventListener("click", async () => {
    if (!activeDetailPost || !getActiveProfileCache()?.uid) return;
    const currentProfile = getActiveProfileCache();
    detailLikeBtn.disabled = true;
    try {
      const result = await toggleCommunityLike(activeDetailPost.id);
      const likedBy = Array.isArray(activeDetailPost.likedBy) ? activeDetailPost.likedBy : [];
      activeDetailPost.likedBy = result.liked
        ? [...new Set([...likedBy, currentProfile.uid])]
        : likedBy.filter((uid) => uid !== currentProfile.uid);
      activeDetailPost.likeCount = result.likeCount;
      const countLabel = `${result.likeCount} lượt thích`;
      detailLikeCountEl.textContent = countLabel;
      detailLikeBtn.textContent = `${result.liked ? "♥ Đã thích" : "♡ Thích"} · ${result.likeCount}`;
      detailLikeBtn.setAttribute("aria-pressed", String(result.liked));
      detailLikeBtn.setAttribute("aria-label", `${result.liked ? "Bỏ thích" : "Thích"} công thức ${activeDetailPost.headingTitle || "này"}; ${result.likeCount} lượt thích`);
      announceToScreenReader(`${result.liked ? "Đã thích" : "Đã bỏ thích"} ${activeDetailPost.headingTitle}. ${result.likeCount} lượt thích.`);
    } catch (error) {
      announceToScreenReader(error.message || "Không thể cập nhật lượt thích.", true);
    } finally {
      detailLikeBtn.disabled = !getActiveProfileCache()?.uid;
    }
  });

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
    communityDishesListEl.setAttribute("aria-busy", "false");
    communityDishesListEl.innerHTML = "";

    if (!posts || posts.length === 0) {
      communityDishesListEl.innerHTML = communitySearchInput?.value.trim()
        ? `<div class="col-span-full p-10 text-center text-stone-600 font-semibold text-base bg-white/90 rounded-3xl border-2 border-dashed border-emerald-300 shadow-sm">Không tìm thấy công thức của đầu bếp này.</div>`
        : `
        <div class="col-span-full p-10 text-center text-stone-600 font-semibold text-base bg-white/90 rounded-3xl border-2 border-dashed border-emerald-300 shadow-sm">
          Cộng đồng chưa có công thức nào. Hãy nấu một món, mời thực khách nếm thử rồi chia sẻ công thức đầu tiên nhé!
        </div>
      `;
      return;
    }

    const visiblePosts = communityFeedMode === "following" ? getFollowedFeed(posts, followedChefIds) : posts;
    if (!visiblePosts.length) {
      communityDishesListEl.innerHTML = `<div class="col-span-full p-8 text-center text-stone-600 bg-white rounded-3xl border-2 border-dashed border-emerald-300">${communityFeedMode === "following" ? "Đầu bếp bạn theo dõi chưa chia sẻ công thức nào." : "Không tìm thấy công thức phù hợp."}</div>`;
      return;
    }

    visiblePosts.forEach((post) => {
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
      if (post.chefGender && post.chefGender !== "unspecified") {
        const genderEl = document.createElement("p");
        genderEl.className = "text-xs text-stone-600";
        genderEl.textContent = `Giới tính: ${getProfileGenderLabel(post.chefGender)}`;
        topInfo.appendChild(genderEl);
      }
      if (post.chefBio) {
        const bioEl = document.createElement("p");
        bioEl.className = "text-sm text-stone-600";
        bioEl.textContent = post.chefBio;
        topInfo.appendChild(bioEl);
      }

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

      const currentProfile = getActiveProfileCache();
      const likeState = getPostLikeState(post, currentProfile?.uid);
      const likeMembers = Array.isArray(post.likedBy) ? post.likedBy : [];
      const isLiked = likeState.liked;
      const likeBtn = document.createElement("button");
      likeBtn.type = "button";
      likeBtn.className = "px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 font-bold text-xs sm:text-sm";
      likeBtn.textContent = `${isLiked ? "♥ Đã thích" : "♡ Thích"} (${likeState.likeCount})`;
      likeBtn.disabled = !currentProfile?.uid;
      likeBtn.setAttribute("aria-label", `${isLiked ? "Bỏ thích" : "Thích"} công thức ${post.headingTitle || "này"}; ${likeState.likeCount} lượt thích`);
      likeBtn.title = currentProfile?.uid ? "" : "Đăng nhập để thích công thức";
      likeBtn.addEventListener("click", async () => {
        likeBtn.disabled = true;
        try {
          const result = await toggleCommunityLike(post.id);
          post.likedBy = result.liked
            ? [...new Set([...likeMembers, currentProfile.uid])]
            : likeMembers.filter((uid) => uid !== currentProfile.uid);
          post.likeCount = result.likeCount;
          renderCommunityHubList(posts);
          announceToScreenReader(`${result.liked ? "Đã thích" : "Đã bỏ thích"} ${post.headingTitle}. ${result.likeCount} lượt thích.`);
        } catch (error) {
          likeBtn.disabled = false;
          announceToScreenReader(error.message || "Không thể cập nhật lượt thích.", true);
        }
      });

      const followBtn = document.createElement("button");
      followBtn.type = "button";
      const isFollowing = followedChefIds.includes(post.chefUid);
      followBtn.className = "px-4 py-2.5 rounded-2xl bg-sky-50 text-sky-900 border border-sky-200 font-bold text-xs sm:text-sm";
      followBtn.textContent = `${isFollowing ? "Đang theo dõi" : "Theo dõi đầu bếp"} (${Number(post.followerCount) || 0})`;
      followBtn.disabled = !currentProfile?.uid || !post.chefUid || currentProfile.uid === post.chefUid;
      followBtn.setAttribute("aria-label", `${isFollowing ? "Bỏ theo dõi" : "Theo dõi"} ${post.chefDisplayName || "đầu bếp"}`);
      followBtn.addEventListener("click", async () => {
        followBtn.disabled = true;
        try {
          const result = await toggleFollowChef(post.chefUid);
          followedChefIds = result.following
            ? [...new Set([...followedChefIds, post.chefUid])]
            : followedChefIds.filter((uid) => uid !== post.chefUid);
          cachedCommunityPosts.filter((item) => item.chefUid === post.chefUid).forEach((item) => {
            item.followerCount = Math.max(0, (Number(item.followerCount) || 0) + (result.following ? 1 : -1));
          });
          renderCommunityHubList(posts);
          announceToScreenReader(`${result.following ? "Đang theo dõi" : "Đã bỏ theo dõi"} ${post.chefDisplayName}.`);
        } catch (error) {
          followBtn.disabled = false;
          announceToScreenReader(error.message || "Không thể cập nhật theo dõi.", true);
        }
      });

      actionRow.appendChild(scoreBadge);
      actionRow.appendChild(likeBtn);
      if (currentProfile?.uid !== post.chefUid) actionRow.appendChild(followBtn);
      actionRow.appendChild(viewBtn);

      card.appendChild(topInfo);
      card.appendChild(actionRow);

      communityDishesListEl.appendChild(card);
    });
  };

  const openCommunityHub = async (searchQuery = "") => {
    if (!modalCommunityHub) return;
    if (!modalCommunityHub.open) modalCommunityHub.showModal();
    if (communitySearchInput) communitySearchInput.value = searchQuery;
    if (searchQuery && hasLoadedCommunityPosts) {
      communityFeedMode = "all";
      renderCommunityHubList(cachedCommunityPosts.filter((post) => matchesCommunityRecipeSearch(post, searchQuery)));
      communitySearchInput?.focus();
      return;
    }
    if (!searchQuery && hasLoadedCommunityPosts) {
      communityFeedMode = "all";
      renderCommunityHubList(cachedCommunityPosts);
    }
      if (communityDishesListEl) {
        communityDishesListEl.setAttribute("aria-busy", "true");
        communityDishesListEl.innerHTML = `<div class="col-span-full p-8 text-center text-stone-500 font-semibold text-base">Đang tải danh sách món ăn từ Cộng đồng Đầu bếp...</div>`;
      }

      try {
        cachedCommunityPosts = hydrateCommunitySocial(await applyCommunityAuthorPrivacy(await getCommunityDishes()));
        hasLoadedCommunityPosts = true;
        try { followedChefIds = await getFollowingChefIds(); } catch { followedChefIds = []; }
        communityFeedMode = "all";
        const visiblePosts = searchQuery
          ? cachedCommunityPosts.filter((post) => matchesCommunityRecipeSearch(post, searchQuery))
          : cachedCommunityPosts;
        renderCommunityHubList(visiblePosts);
        if (btnBackFromCommunity) {
          btnBackFromCommunity.focus();
        } else if (communitySearchInput) {
          communitySearchInput.focus();
        }
        if (searchQuery) communitySearchInput?.focus();
        announceToScreenReader(searchQuery
          ? `Công thức của @${searchQuery}: tìm thấy ${visiblePosts.length} công thức.`
          : `Cộng đồng Đầu bếp: Hiện có ${cachedCommunityPosts.length} công thức. Dùng phím H hoặc số 3 để duyệt nhanh qua từng công thức.`);
      } catch (e) {
        console.error("Lỗi tải Cộng đồng đầu bếp:", e);
        if (communityDishesListEl) {
          communityDishesListEl.setAttribute("aria-busy", "false");
          communityDishesListEl.innerHTML = `<div class="col-span-full p-8 text-center text-red-800 bg-red-50 rounded-3xl border border-red-200" role="alert">Không tải được cộng đồng. Vui lòng đóng và mở lại để thử lại.</div>`;
        }
      }
  };

  if (btnMenuCommunity && modalCommunityHub) {
    btnMenuCommunity.addEventListener("click", () => openCommunityHub());
  }

  const followingFeedBtn = document.getElementById("btn-community-following-feed");
  if (followingFeedBtn) followingFeedBtn.addEventListener("click", () => {
    communityFeedMode = communityFeedMode === "following" ? "all" : "following";
    followingFeedBtn.textContent = communityFeedMode === "following" ? "🌐 Tất cả công thức" : "👥 Công thức từ người theo dõi";
    renderCommunityHubList(cachedCommunityPosts);
    if (communityFeedMode === "following" && followedChefIds.length === 0) {
      announceToScreenReader("Bạn chưa theo dõi đầu bếp nào. Hãy chọn Theo dõi đầu bếp trên một công thức.");
    }
  });

  const onlineChefsBtn = document.getElementById("btn-community-online-chefs");
  const onlineChefsList = document.getElementById("community-online-chefs-list");
  const onlineChefsSearchInput = document.getElementById("community-online-chefs-search");
  const onlineChefsDialog = document.getElementById("modal-community-online-chefs");
  const chefProfileDialog = document.getElementById("modal-chef-public-profile");
  let profileReturnFocus = null;
  let activeChefUsername = "";
  let cachedOnlineChefs = null;
  const chefRecipeCountEl = document.getElementById("chef-public-profile-recipe-count");
  const viewChefRecipesBtn = document.getElementById("btn-view-chef-recipes");

  const openChefPublicProfile = async (chef, trigger) => {
    profileReturnFocus = trigger;
    activeChefUsername = chef.username || "";
    chefProfileDialog.showModal();
    document.getElementById("chef-public-profile-title").textContent = chef.displayName || "Hồ sơ đầu bếp";
    document.getElementById("chef-public-profile-username").textContent = `@${chef.username || "chef"}`;
    document.getElementById("chef-public-profile-kitchen").textContent = chef.kitchenName || "Nhà Bếp Sáng Tạo";
    document.getElementById("chef-public-profile-gender").textContent = chef.gender ? `Giới tính: ${chef.gender}` : "";
    document.getElementById("chef-public-profile-bio").textContent = chef.bio || "Đầu bếp chưa thêm phần giới thiệu.";
    document.getElementById("chef-public-profile-stats").textContent = `${Number(chef.followerCount) || 0} người theo dõi · ${Number(chef.followingCount) || 0} đang theo dõi · ${Number(chef.totalScore) || 0} điểm`;
    document.getElementById("chef-public-profile-feedback").textContent = "Đang tải hồ sơ…";
    chefRecipeCountEl.textContent = "Công thức: Đang tải…";
    viewChefRecipesBtn.disabled = true;
    document.getElementById("btn-close-chef-public-profile").focus();
    try {
      const profile = await getChefPublicProfile(chef.uid);
      activeChefUsername = profile.username || activeChefUsername;
      document.getElementById("chef-public-profile-title").textContent = profile.displayName;
      document.getElementById("chef-public-profile-username").textContent = `@${profile.username}`;
      document.getElementById("chef-public-profile-kitchen").textContent = profile.kitchenName;
      document.getElementById("chef-public-profile-gender").textContent = profile.gender ? `Giới tính: ${profile.gender}` : "";
      document.getElementById("chef-public-profile-bio").textContent = profile.bio || "Đầu bếp chưa thêm phần giới thiệu.";
      document.getElementById("chef-public-profile-stats").textContent = `${profile.followerCount} người theo dõi · ${profile.followingCount} đang theo dõi · ${profile.totalScore} điểm`;
      document.getElementById("chef-public-profile-feedback").textContent = "";
      try {
        const dishes = await getCommunityDishes();
        const chefRecipes = getChefRecipes(dishes, profile.uid);
        chefRecipeCountEl.textContent = `Công thức: ${chefRecipes.length}`;
        viewChefRecipesBtn.disabled = false;
      } catch {
        chefRecipeCountEl.textContent = "Không tải được số lượng công thức.";
        viewChefRecipesBtn.disabled = false;
      }
    } catch (error) {
      document.getElementById("chef-public-profile-feedback").textContent = error.message || "Không tải được hồ sơ.";
      viewChefRecipesBtn.disabled = true;
    }
  };

  viewChefRecipesBtn?.addEventListener("click", () => {
    profileReturnFocus = null;
    chefProfileDialog.close();
    void openCommunityHub(activeChefUsername);
  });

  document.getElementById("btn-close-chef-public-profile")?.addEventListener("click", () => chefProfileDialog.close());
  chefProfileDialog?.addEventListener("close", () => { if (profileReturnFocus?.isConnected) profileReturnFocus.focus(); });

  const renderOnlineChefs = (chefs) => {
    onlineChefsList.innerHTML = "";
    const currentProfile = getActiveProfileCache();
    const query = onlineChefsSearchInput?.value.trim() || "";
    const matchesChef = (chef) => matchesOnlineChefSearch(chef, query);
    const showOwnProfile = Boolean(currentProfile?.uid && matchesChef(currentProfile));
    const list = document.createElement("ul");
    list.className = "flex flex-col gap-2";
    if (showOwnProfile) {
      const ownItem = document.createElement("li");
      ownItem.className = "p-3 bg-sky-50 rounded-xl border border-sky-200";
      const ownName = document.createElement("strong");
      ownName.textContent = `${currentProfile.displayName || currentProfile.username} (@${currentProfile.username || "chef"}) · Bạn`;
      const ownProfileBtn = document.createElement("button");
      ownProfileBtn.type = "button";
      ownProfileBtn.className = "ml-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-950 font-bold text-sm";
      ownProfileBtn.textContent = "Xem hồ sơ";
      ownProfileBtn.addEventListener("click", () => { void openChefPublicProfile(currentProfile, ownProfileBtn); });
      ownItem.append(ownName, ownProfileBtn);
      list.appendChild(ownItem);
    }
    const otherChefs = chefs.filter((chef) => chef.uid !== currentProfile?.uid && matchesChef(chef));
    if (!otherChefs.length) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "text-sm text-stone-600";
      emptyItem.textContent = query
        ? `Không tìm thấy đầu bếp phù hợp với “${query}”.`
        : (currentProfile?.uid ? "Hiện chưa có đầu bếp nào khác online." : "Hiện chưa có đầu bếp nào online.");
      list.appendChild(emptyItem);
    }
    otherChefs.forEach((chef) => {
      const item = document.createElement("li");
      item.className = "p-3 bg-white rounded-xl border border-emerald-200";
      const name = document.createElement("h3");
      name.className = "font-bold";
      name.textContent = `${chef.displayName} (@${chef.username})`;
      const details = document.createElement("p");
      details.className = "text-sm text-stone-700";
      const updateDetails = () => {
        details.textContent = [chef.kitchenName, chef.gender ? `Giới tính: ${chef.gender}` : "", chef.bio, `${chef.followerCount} người theo dõi`].filter(Boolean).join(" · ");
      };
      updateDetails();
      item.append(name, details);
      if (chef.uid !== getActiveProfileCache()?.uid) {
        const actions = document.createElement("div");
        actions.className = "mt-2 flex flex-wrap gap-2";
        const followBtn = document.createElement("button");
        followBtn.type = "button";
        followBtn.className = "px-3 py-1.5 rounded-lg bg-sky-100 text-sky-950 font-bold text-sm";
        const setFollowLabel = () => {
          const following = followedChefIds.includes(chef.uid);
          followBtn.textContent = following ? "Đang theo dõi" : "Theo dõi";
          followBtn.setAttribute("aria-pressed", String(following));
        };
        setFollowLabel();
        followBtn.disabled = !getActiveProfileCache()?.uid;
        followBtn.addEventListener("click", async () => {
          followBtn.disabled = true;
          try {
            const result = await toggleFollowChef(chef.uid);
            followedChefIds = result.following
              ? [...new Set([...followedChefIds, chef.uid])]
              : followedChefIds.filter((uid) => uid !== chef.uid);
            chef.followerCount = Math.max(0, chef.followerCount + (result.following ? 1 : -1));
            setFollowLabel();
            updateDetails();
            announceToScreenReader(`${result.following ? "Đang theo dõi" : "Đã bỏ theo dõi"} ${chef.displayName}.`);
          } catch (error) {
            announceToScreenReader(error.message || "Không thể cập nhật theo dõi.", true);
          } finally {
            followBtn.disabled = !getActiveProfileCache()?.uid;
          }
        });
        const profileBtn = document.createElement("button");
        profileBtn.type = "button";
        profileBtn.className = "px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-950 font-bold text-sm";
        profileBtn.textContent = "Xem hồ sơ";
        profileBtn.addEventListener("click", () => { void openChefPublicProfile(chef, profileBtn); });
        actions.append(followBtn, profileBtn);
        const blockBtn = document.createElement("button");
        blockBtn.type = "button";
        blockBtn.className = "px-3 py-1.5 rounded-lg bg-rose-100 text-rose-900 font-bold text-sm";
        blockBtn.textContent = "Chặn";
        blockBtn.addEventListener("click", async () => {
          blockBtn.disabled = true;
          try {
            await blockChef(chef.uid);
            announceToScreenReader(`Đã chặn ${chef.displayName}.`);
            cachedOnlineChefs = await getOnlineChefs();
            renderOnlineChefs(cachedOnlineChefs);
          } catch (error) {
            blockBtn.disabled = false;
            announceToScreenReader(error.message || "Không thể chặn đầu bếp.", true);
          }
        });
        actions.appendChild(blockBtn);
        if (chef.allowKitchenInvites !== false) {
          const inviteBtn = document.createElement("button");
          inviteBtn.type = "button";
          inviteBtn.className = "px-3 py-1.5 rounded-lg bg-amber-100 font-bold text-sm";
          inviteBtn.textContent = "Mời vào bếp";
          inviteBtn.addEventListener("click", async () => {
            inviteBtn.disabled = true;
            try {
              await sendKitchenInvite(chef.uid, chef.displayName);
              inviteBtn.textContent = "Đã gửi lời mời";
              announceToScreenReader(`Đã gửi lời mời vào bếp cho ${chef.displayName}.`);
            } catch (error) {
              inviteBtn.disabled = false;
              announceToScreenReader(error.message || "Không gửi được lời mời.", true);
            }
          });
          actions.appendChild(inviteBtn);
        }
        if (chef.allowDirectMessages !== false) {
          const chatBtn = document.createElement("button");
          chatBtn.type = "button";
          chatBtn.className = "px-3 py-1.5 rounded-lg bg-violet-100 text-violet-950 font-bold text-sm";
          chatBtn.textContent = "Trò chuyện";
          chatBtn.addEventListener("click", () => openDirectChat(chef, chatBtn));
          actions.appendChild(chatBtn);
        }
        item.appendChild(actions);
      }
      list.appendChild(item);
    });
    onlineChefsList.appendChild(list);
  };

  if (onlineChefsBtn && onlineChefsList) onlineChefsBtn.addEventListener("click", async () => {
    onlineChefsDialog.showModal();
    onlineChefsSearchInput.focus();
    onlineChefsList.setAttribute("aria-busy", "true");
    onlineChefsList.textContent = "Đang tải danh sách đầu bếp online…";
    try {
      if (getActiveProfileCache()?.uid) followedChefIds = await getFollowingChefIds();
      const chefs = await getOnlineChefs();
      cachedOnlineChefs = chefs;
      renderOnlineChefs(cachedOnlineChefs);
    } catch (error) {
      cachedOnlineChefs = null;
      onlineChefsList.textContent = error.message || "Không tải được danh sách. Hãy thử mở lại.";
    } finally {
      onlineChefsList.setAttribute("aria-busy", "false");
    }
  });
  onlineChefsSearchInput?.addEventListener("input", () => {
    if (cachedOnlineChefs) renderOnlineChefs(cachedOnlineChefs);
  });
  document.getElementById("btn-close-community-online-chefs")?.addEventListener("click", () => onlineChefsDialog.close());
  onlineChefsDialog?.addEventListener("close", () => { if (onlineChefsBtn?.isConnected) onlineChefsBtn.focus(); });

  if (communitySearchInput) {
    communitySearchInput.addEventListener("input", (e) => {
      const q = e.target.value.trim();
      if (!q) {
        renderCommunityHubList(cachedCommunityPosts);
        return;
      }
      const filtered = cachedCommunityPosts.filter((post) => matchesCommunityRecipeSearch(post, q));
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

  const editProfileBtn = document.getElementById("btn-menu-edit-profile");
  const editProfileDialog = document.getElementById("modal-edit-profile");
  const editProfileForm = document.getElementById("form-edit-profile");
  const editProfileFeedback = document.getElementById("edit-profile-feedback");
  const closeEditProfileBtn = document.getElementById("btn-cancel-edit-profile");
  const saveEditProfileBtn = document.getElementById("btn-save-edit-profile");
  if (editProfileBtn && editProfileDialog && editProfileForm) {
    editProfileBtn.addEventListener("click", () => {
      const profile = getActiveProfileCache();
      document.getElementById("profile-display-name").value = profile?.displayName || "";
      document.getElementById("profile-kitchen-name").value = profile?.kitchenName || "";
      document.getElementById("profile-bio").value = profile?.bio || "";
      document.getElementById("profile-gender").value = profile?.gender || "unspecified";
      editProfileFeedback.textContent = "";
      editProfileDialog.showModal();
      document.getElementById("profile-display-name").focus();
    });
    closeEditProfileBtn?.addEventListener("click", () => editProfileDialog.close());
    editProfileDialog.addEventListener("close", () => {
      ["profile-current-password", "profile-new-password", "profile-confirm-password"].forEach((id) => { document.getElementById(id).value = ""; });
      editProfileBtn.focus();
    });
    editProfileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      saveEditProfileBtn.disabled = true;
      editProfileFeedback.textContent = "Đang lưu hồ sơ…";
      editProfileFeedback.className = "text-sm text-stone-600";
      try {
        const profile = await updateCurrentUserProfile({
          displayName: document.getElementById("profile-display-name").value,
          kitchenName: document.getElementById("profile-kitchen-name").value,
          bio: document.getElementById("profile-bio").value,
          gender: document.getElementById("profile-gender").value
        });
        updateMainMenuUserProfile(profile);
        editProfileDialog.close();
        announceToScreenReader("Đã cập nhật hồ sơ công khai.");
      } catch (error) {
        editProfileFeedback.textContent = error.message || "Không thể lưu hồ sơ. Vui lòng thử lại.";
        editProfileFeedback.className = "text-sm text-red-700";
      } finally {
        saveEditProfileBtn.disabled = false;
      }
    });
    document.getElementById("btn-change-account-password")?.addEventListener("click", async () => {
      const button = document.getElementById("btn-change-account-password");
      const currentPassword = document.getElementById("profile-current-password");
      const newPassword = document.getElementById("profile-new-password");
      const confirmPassword = document.getElementById("profile-confirm-password");
      button.disabled = true;
      editProfileFeedback.textContent = "Đang xác minh và đổi mật khẩu…";
      editProfileFeedback.className = "text-sm text-stone-600";
      try {
        await changeCurrentUserPassword({ currentPassword: currentPassword.value, newPassword: newPassword.value, confirmPassword: confirmPassword.value });
        currentPassword.value = "";
        newPassword.value = "";
        confirmPassword.value = "";
        editProfileFeedback.textContent = "Đã đổi mật khẩu thành công.";
        editProfileFeedback.className = "text-sm text-emerald-700";
      } catch (error) {
        editProfileFeedback.textContent = error.message || "Không thể đổi mật khẩu.";
        editProfileFeedback.className = "text-sm text-red-700";
      } finally {
        button.disabled = false;
      }
    });
  }

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
      const gender = document.getElementById("reg-gender").value;
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
          gender,
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
  const blockedChefsListEl = document.getElementById("blocked-chefs-list");

  const refreshBlockedChefsList = async () => {
    if (!blockedChefsListEl) return;
    blockedChefsListEl.setAttribute("aria-busy", "true");
    blockedChefsListEl.textContent = "Đang tải…";
    try {
      const chefs = await getBlockedChefs();
      blockedChefsListEl.replaceChildren();
      if (!chefs.length) {
        blockedChefsListEl.textContent = "Bạn chưa chặn đầu bếp nào.";
        return;
      }
      chefs.forEach((chef) => {
        const row = document.createElement("div");
        row.className = "flex items-center justify-between gap-2 rounded-xl bg-white border border-sky-100 p-2";
        const name = document.createElement("h5");
        name.className = "text-sm font-bold text-stone-800";
        name.textContent = `${chef.displayName} (@${chef.username || "chef"})`;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "shrink-0 px-3 py-1.5 rounded-lg bg-white border border-sky-300 text-sky-950 font-bold text-sm";
        button.textContent = "Bỏ chặn";
        button.addEventListener("click", async () => {
          button.disabled = true;
          try {
            await unblockChef(chef.uid);
            announceToScreenReader(`Đã bỏ chặn ${chef.displayName}.`);
            await refreshBlockedChefsList();
          } catch (error) {
            button.disabled = false;
            announceToScreenReader(error.message || "Không thể bỏ chặn đầu bếp.", true);
          }
        });
        row.append(name, button);
        blockedChefsListEl.appendChild(row);
      });
    } catch (error) {
      blockedChefsListEl.textContent = error.message || "Không tải được danh sách đầu bếp đã chặn.";
    } finally {
      blockedChefsListEl.setAttribute("aria-busy", "false");
    }
  };

  // Nạp trạng thái cài đặt vào modal
  const populateSettingsModal = () => {
    const s = getSavedSettings();
    const toggleSfx = document.getElementById("setting-sfx-toggle");
    const volSlider = document.getElementById("setting-sfx-volume");
    const volLabel = document.getElementById("setting-sfx-volume-val");
    const voiceToggle = document.getElementById("setting-voice-announcements");
    const shortcutToggle = document.getElementById("setting-single-key-shortcuts");
    const privacy = getActiveProfileCache()?.privacySettings || {};

    if (toggleSfx) toggleSfx.checked = s.sfxEnabled;
    if (volSlider) volSlider.value = s.sfxVolume;
    if (volLabel) volLabel.textContent = s.sfxVolume + "%";
    if (voiceToggle) voiceToggle.checked = s.voiceAnnouncements;
    if (shortcutToggle) shortcutToggle.checked = s.singleKeyShortcutsEnabled !== false;
    document.getElementById("setting-privacy-profile-public").checked = privacy.profileVisibility !== "private";
    document.getElementById("setting-privacy-online-status").checked = privacy.showOnlineStatus !== false;
    document.getElementById("setting-privacy-gender").checked = privacy.showGender !== false;
    document.getElementById("setting-privacy-bio").checked = privacy.showBio !== false;
    document.getElementById("setting-privacy-kitchen-invites").checked = privacy.allowKitchenInvites !== false;
    document.getElementById("setting-privacy-direct-messages").checked = privacy.allowDirectMessages !== false;
    document.getElementById("settings-save-feedback").textContent = "";
    void refreshBlockedChefsList();
  };

  if (btnMenuSettings && modalSettings) {
    btnMenuSettings.addEventListener("click", () => {
      modalSettings._returnFocusEl = document.activeElement || btnMenuSettings;
      populateSettingsModal();
      modalSettings.showModal();
      btnCloseSettings?.focus();
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
    btnSaveSettings.addEventListener("click", async () => {
      const toggleSfx = document.getElementById("setting-sfx-toggle");
      const volSlider = document.getElementById("setting-sfx-volume");
      const voiceToggle = document.getElementById("setting-voice-announcements");
      const shortcutToggle = document.getElementById("setting-single-key-shortcuts");

      const newSettings = {
        sfxEnabled: toggleSfx ? toggleSfx.checked : true,
        sfxVolume: volSlider ? parseInt(volSlider.value, 10) : 80,
        voiceAnnouncements: voiceToggle ? voiceToggle.checked : true,
        singleKeyShortcutsEnabled: shortcutToggle ? shortcutToggle.checked : true
      };

      const feedback = document.getElementById("settings-save-feedback");
      btnSaveSettings.disabled = true;
      if (feedback) feedback.textContent = "Đang lưu cài đặt…";
      try {
        saveSettings(newSettings);
        applySettingsToGameState(newSettings);
        const profile = getActiveProfileCache();
        if (profile?.uid) {
          const updatedProfile = await updateCurrentUserPrivacySettings({
            profileVisibility: document.getElementById("setting-privacy-profile-public").checked ? "public" : "private",
            showOnlineStatus: document.getElementById("setting-privacy-online-status").checked,
            showGender: document.getElementById("setting-privacy-gender").checked,
            showBio: document.getElementById("setting-privacy-bio").checked,
            allowKitchenInvites: document.getElementById("setting-privacy-kitchen-invites").checked,
            allowDirectMessages: document.getElementById("setting-privacy-direct-messages").checked
          });
          startChefPresence(updatedProfile);
        }
        modalSettings.close();
        if (btnMenuSettings) btnMenuSettings.focus();
        announceToScreenReader("Đã lưu cài đặt trò chơi và quyền riêng tư.");
      } catch (error) {
        if (feedback) feedback.textContent = error.message || "Không thể lưu cài đặt quyền riêng tư.";
      } finally {
        btnSaveSettings.disabled = false;
      }
    });
  }

  // Nút Hướng dẫn trong Menu Chính
  const btnMenuHelp = document.getElementById("btn-menu-help");
  const modalHelp = document.getElementById("modal-help");
  if (btnMenuHelp && modalHelp) {
    btnMenuHelp.addEventListener("click", () => {
      modalHelp._returnFocusEl = document.activeElement || btnMenuHelp;
      modalHelp.showModal();
      const btnCloseHelp = document.getElementById("btn-close-help");
      if (btnCloseHelp) btnCloseHelp.focus();
    });
  }

  // Nút Đăng xuất trong Menu Chính
  const btnMenuLogout = document.getElementById("btn-menu-logout");
  if (btnMenuLogout) {
    btnMenuLogout.addEventListener("click", async () => {
      const confirmLogout = await showConfirmDialog({
        title: "Xác nhận đăng xuất",
        message: "Bạn có chắc chắn muốn đăng xuất tài khoản Bếp Trưởng khỏi thiết bị này?"
      });
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
      startChefPresence(profile);
      updateMainMenuUserProfile(profile);
      // Nếu đang ở màn hình auth thì chuyển vào main-menu
      const screenAuth = document.getElementById("screen-auth");
      if (screenAuth && !screenAuth.classList.contains("hidden")) {
        showScreen("main-menu");
        announceToScreenReader(`Chào mừng Bếp Trưởng ${profile.displayName} đã trở lại YumCraft Kitchen.`);
        await checkAndShowMotdBroadcast(profile);
      }
    } else {
      await stopChefPresence();
      // Chưa đăng nhập: hiển thị màn hình Auth
      showScreen("auth");
      showAuthView("login");
    }
  });

  // Hỗ trợ phím tắt toàn cục cho Menu Chính
  window.addEventListener("keydown", (e) => {
    const screenMainMenu = document.getElementById("screen-main-menu");
    const isMainMenuVisible = screenMainMenu && !screenMainMenu.classList.contains("hidden");

    if (isMainMenuVisible && state.singleKeyShortcutsEnabled !== false) {
      // Phím H: Mở hướng dẫn
      if ((e.key === "h" || e.key === "H") && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (modalHelp && !modalHelp.open && modalSettings && !modalSettings.open) {
          e.preventDefault();
          modalHelp._returnFocusEl = document.activeElement;
          modalHelp.showModal();
          const btnCloseHelp = document.getElementById("btn-close-help");
          if (btnCloseHelp) btnCloseHelp.focus();
        }
      }
    }
  });
}

// Gắn các hàm toàn cục để tương thích hệ thống
window.showScreen = showScreen;
window.showAuthView = showAuthView;

// Khởi chạy khi DOM đã sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMainMenuController);
} else {
  initMainMenuController();
}
