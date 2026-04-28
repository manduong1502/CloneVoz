// Danh sách Super Admin emails - Chỉ sửa 1 nơi duy nhất
export const SUPER_ADMIN_EMAILS = [
  'lamphatcommerce@gmail.com',
  'mandtdn@gmail.com'
];

export function isSuperAdmin(email) {
  return SUPER_ADMIN_EMAILS.includes(email);
}
