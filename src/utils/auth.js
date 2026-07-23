export function getAuthHeader() {
  const token = sessionStorage.getItem('usertoken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
