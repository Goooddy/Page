import { createStore, useStoreValue } from '../lib/store';
import { nav } from '../lib/nav';
import type { TabName } from '../components/ui/nav';
import type { IconName } from '../components/Icon';
import type { GlobalSheet } from '../screens/misc';

export type Theme = 'light' | 'dark' | 'system';
export type ToastKind = 'neutral' | 'success' | 'error';
export type Toast = { id: number; kind: ToastKind; text: string; icon?: IconName; action?: { label: string; run: () => void } };

export type AppState = {
  theme: Theme;
  /** true when the browser reports no network (or a reviewer jumped to an offline screen) */
  offline: boolean;
  forcedOffline: boolean;
  alertsBadge: number;
  bookclubsDot: boolean;
  toast: Toast | null;
  /** distance of the toast from the bottom of the phone */
  toastBottom: number;
  /** white status bar text (dark full-bleed screens) */
  statusBarLight: boolean;
  /** tabs that have already shown their first-load skeleton this session */
  loaded: Record<string, boolean>;
  signedIn: boolean;
  /** email → password for accounts created or reset in this session (null = any password) */
  accounts: Record<string, string | null>;
  pending: { email: string; password: string } | null;
  loginFails: number;
  user: { name: string; username: string; email: string };
  genres: string[];
  /** false when the user finished onboarding without joining any bookclub */
  hasClubs: boolean;
  pushEnabled: boolean;
  plan: 'free' | 'trial' | 'premium' | 'ending' | 'pending';
  platform: 'ios' | 'android';
  purchasing: boolean;
  sheet: GlobalSheet;
  bio: string;
  pendingRequests: number;
};

export const appStore = createStore<AppState>({
  theme: 'system',
  offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  forcedOffline: false,
  alertsBadge: 3,
  bookclubsDot: true,
  toast: null,
  toastBottom: 118,
  statusBarLight: false,
  loaded: {},
  signedIn: false,
  accounts: {},
  pending: null,
  loginFails: 0,
  user: { name: 'samuelessence344', username: 'samuelessence344', email: 'samuel@example.com' },
  genres: ['Fiction', 'Mystery', 'Poetry'],
  hasClubs: true,
  pushEnabled: false,
  plan: 'free',
  platform: typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent) ? 'android' : 'ios',
  purchasing: false,
  sheet: null,
  bio: 'Reading my way through the Nigerian canon, slowly.',
  pendingRequests: 2,
});

export const useApp = <R,>(sel: (s: AppState) => R) => useStoreValue(appStore, sel);

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let toastSeq = 0;

export const app = {
  set: appStore.set,
  get: appStore.get,
  goTab(tab: TabName) {
    nav.reset([[tab]], 'none');
  },
  toast(text: string, kind: ToastKind = 'neutral', opts: { action?: Toast['action']; icon?: IconName; bottom?: number } = {}) {
    clearTimeout(toastTimer);
    appStore.set({ toast: { id: ++toastSeq, kind, text, action: opts.action, icon: opts.icon }, toastBottom: opts.bottom ?? 118 });
    toastTimer = setTimeout(() => appStore.set({ toast: null }), 3200);
  },
  hideToast() {
    clearTimeout(toastTimer);
    appStore.set({ toast: null });
  },
  /** `as` = a demo account's plan, plus a sheet to open once Home has loaded. */
  signIn(as?: { plan: AppState['plan']; sheet?: AppState['sheet'] }) {
    appStore.set({ signedIn: true, ...(as ? { plan: as.plan } : null) });
    nav.reset([['home']], 'fade');
    if (as?.sheet) setTimeout(() => appStore.set({ sheet: as.sheet ?? null }), 1100);
  },
  isLoaded(key: string) {
    const l = appStore.get().loaded;
    return !!l[key] || !!l['*'];
  },
  markLoaded(key: string) {
    appStore.set((s) => ({ loaded: { ...s.loaded, [key]: true } }));
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => appStore.set({ offline: appStore.get().forcedOffline }));
  window.addEventListener('offline', () => appStore.set({ offline: true }));
}
