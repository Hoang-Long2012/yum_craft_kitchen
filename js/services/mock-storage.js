export const MOCK_USERS_KEY = "yumcraft_mock_users_db";

/**
 * Read and parse a JSON value from localStorage safely.
 * @param {string} key
 * @param {*} [fallback=null]
 * @returns {*}
 */
export function readStorageJson(key, fallback = null) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Serialize and store a JSON value in localStorage safely.
 * @param {string} key
 * @param {*} value
 * @returns {boolean}
 */
export function writeStorageJson(key, value) {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`Không thể ghi dữ liệu cục bộ (${key}):`, e);
    return false;
  }
}

/**
 * Lấy danh sách tài khoản Mock từ localStorage.
 * @returns {Array<object>}
 */
export function getMockUsers() {
  const users = readStorageJson(MOCK_USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

/**
 * Lưu danh sách tài khoản Mock vào localStorage.
 * @param {Array<object>} users
 * @returns {boolean}
 */
export function saveMockUsers(users) {
  return writeStorageJson(MOCK_USERS_KEY, Array.isArray(users) ? users : []);
}
