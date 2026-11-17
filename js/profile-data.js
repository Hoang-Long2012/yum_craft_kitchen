export const PROFILE_GENDERS = Object.freeze(['female', 'male', 'other', 'unspecified']);

export function normalizeProfileGender(value) {
  return PROFILE_GENDERS.includes(value) ? value : 'unspecified';
}

export function getProfileGenderLabel(value) {
  return ({ female: 'Nữ', male: 'Nam', other: 'Khác', unspecified: 'Không muốn tiết lộ' })[normalizeProfileGender(value)];
}
