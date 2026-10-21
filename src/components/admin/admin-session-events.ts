export const ADMIN_ACTIVITY_EVENT = "vakratund:admin-activity";
export const ADMIN_DIRTY_EVENT = "vakratund:admin-dirty";
export const ADMIN_LOGOUT_EVENT = "vakratund:admin-logout";

export function signalAdminActivity(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(ADMIN_ACTIVITY_EVENT));
}

export function notifyAdminLogout(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(ADMIN_LOGOUT_EVENT));
}

export function setAdminDirtyState(dirty: boolean): void {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(ADMIN_DIRTY_EVENT, { detail: { dirty } }));
}
