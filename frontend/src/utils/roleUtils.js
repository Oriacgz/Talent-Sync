export function normalizeRole(role) {
  if (!role || typeof role !== 'string') {
    return '';
  }
  return role.trim().toUpperCase();
}
