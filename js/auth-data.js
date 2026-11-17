/** Pure account validation helpers shared by auth-service and unit tests. */
export function validatePassword(password, confirmPassword = null) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Vui lòng nhập mật khẩu.' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Mật khẩu phải có tối thiểu 8 ký tự.' };
  }
  if (confirmPassword !== null && password !== confirmPassword) {
    return { valid: false, message: 'Mật khẩu nhập lại không trùng khớp.' };
  }
  return { valid: true };
}

export function validateDisplayName(displayName) {
  if (!displayName || typeof displayName !== 'string') {
    return { valid: false, message: 'Vui lòng nhập tên hiển thị.' };
  }
  const trimmed = displayName.trim();
  if (trimmed.length < 2) return { valid: false, message: 'Tên hiển thị phải có tối thiểu 2 ký tự.' };
  if (trimmed.length > 50) return { valid: false, message: 'Tên hiển thị không được vượt quá 50 ký tự.' };
  return { valid: true, sanitized: trimmed };
}

export function validateKitchenName(kitchenName) {
  if (!kitchenName || typeof kitchenName !== 'string') {
    return { valid: false, message: 'Vui lòng nhập tên nhà bếp.' };
  }
  const trimmed = kitchenName.trim();
  if (trimmed.length < 2) return { valid: false, message: 'Tên nhà bếp phải có tối thiểu 2 ký tự.' };
  if (trimmed.length > 60) return { valid: false, message: 'Tên nhà bếp không được vượt quá 60 ký tự.' };
  return { valid: true, sanitized: trimmed };
}

export function validateProfileBio(bio) {
  if (typeof bio !== 'string' || bio.trim().length > 160) {
    return { valid: false, message: 'Phần giới thiệu không được vượt quá 160 ký tự.' };
  }
  return { valid: true, sanitized: bio.trim() };
}
