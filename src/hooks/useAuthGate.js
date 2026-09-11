/**
 * useAuthGate — YatraGo guest-mode action guard hook
 *
 * Usage inside any component:
 *   const gate = useAuthGate();
 *   <button onClick={() => gate(handleBook, { type: 'booking', payload: { listing } })}>
 *     Pay & Confirm
 *   </button>
 *
 * If the user is authenticated  → calls action() immediately.
 * If the user is a guest        → stores { resumeFn, type, payload } in useGuestStore,
 *                                 then opens the GuestLoginModal.
 *
 * After successful login, GuestLoginModal reads resumeFn and calls it automatically.
 */
import { useAuthStore, useGuestStore, useGuestLoginModalStore } from '../store';

export function useAuthGate() {
  const { isAuthenticated } = useAuthStore();
  const { setPendingAction }  = useGuestStore();
  const { openModal }         = useGuestLoginModalStore();

  /**
   * @param {Function} action          - The function to run if/when authenticated
   * @param {Object}   [pendingContext] - Extra metadata stored for post-login resume
   *   @param {string}  pendingContext.type    - 'booking' | 'parcel' | 'rental' | 'navigate' | ...
   *   @param {Object}  [pendingContext.payload] - Anything needed to describe the action to the user
   *   @param {'signin'|'signup'} [pendingContext.defaultTab='signin']
   */
  return function gate(action, pendingContext = {}) {
    if (isAuthenticated) {
      action();
      return;
    }
    // Store the pending action so GuestLoginModal can resume it after auth
    setPendingAction({
      type:      pendingContext.type    || 'action',
      payload:   pendingContext.payload || {},
      resumeFn:  action,
    });
    openModal(pendingContext.defaultTab || 'signin');
  };
}
