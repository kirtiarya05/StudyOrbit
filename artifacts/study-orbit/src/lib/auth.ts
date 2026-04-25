export const USER_ID_KEY = "studyorbit_user_id";

export function getCurrentUserId(): number | null {
  const idStr = localStorage.getItem(USER_ID_KEY);
  if (!idStr) return null;
  const id = parseInt(idStr, 10);
  return isNaN(id) ? null : id;
}

export function setCurrentUserId(id: number) {
  localStorage.setItem(USER_ID_KEY, id.toString());
}

export function clearCurrentUserId() {
  localStorage.removeItem(USER_ID_KEY);
}
