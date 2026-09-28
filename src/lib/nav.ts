import { createStore, useStoreValue } from './store';

export type Params = Record<string, unknown>;
export type Route = { name: string; params: Params; key: string; mode: 'push' | 'modal' | 'fade' | 'none' };

type NavState = {
  stack: Route[];
  exiting: Route | null;
  /** key of the route revealed by the last pop (animates in from the left) */
  revealed: string | null;
};

let seq = 0;
const mk = (name: string, params: Params = {}, mode: Route['mode'] = 'push'): Route => ({
  name, params, mode, key: `${name}-${++seq}`,
});

export const navStore = createStore<NavState>({ stack: [mk('launch', {}, 'none')], exiting: null, revealed: null });

let exitTimer: ReturnType<typeof setTimeout> | undefined;
const finishExit = () => {
  clearTimeout(exitTimer);
  exitTimer = setTimeout(() => navStore.set({ exiting: null, revealed: null }), 280);
};

export const nav = {
  push(name: string, params: Params = {}) {
    navStore.set((s) => ({ stack: [...s.stack, mk(name, params, 'push')], revealed: null }));
  },
  modal(name: string, params: Params = {}) {
    navStore.set((s) => ({ stack: [...s.stack, mk(name, params, 'modal')], revealed: null }));
  },
  /** Replace the top screen (no slide — used for state changes that keep the user in place). */
  replace(name: string, params: Params = {}, mode: Route['mode'] = 'fade') {
    navStore.set((s) => ({ stack: [...s.stack.slice(0, -1), mk(name, params, mode)], revealed: null }));
  },
  pop(n = 1) {
    const { stack } = navStore.get();
    if (stack.length <= 1) return;
    const count = Math.min(n, stack.length - 1);
    const exiting = stack[stack.length - 1];
    const next = stack.slice(0, stack.length - count);
    navStore.set({ stack: next, exiting, revealed: next[next.length - 1].key });
    finishExit();
  },
  popTo(name: string) {
    const { stack } = navStore.get();
    const i = stack.map((r) => r.name).lastIndexOf(name);
    if (i < 0) return;
    nav.pop(stack.length - 1 - i);
  },
  /** Start a fresh stack (tab switches, flow completions, screen-list jumps). */
  reset(routes: Array<[string, Params?]>, mode: Route['mode'] = 'fade') {
    const stack = routes.map(([n, p], i) => mk(n, p ?? {}, i === routes.length - 1 ? mode : 'none'));
    navStore.set({ stack, exiting: null, revealed: null });
  },
  /** Update params of the top route in place (keeps component state). */
  setParams(params: Params) {
    navStore.set((s) => {
      const top = s.stack[s.stack.length - 1];
      return { stack: [...s.stack.slice(0, -1), { ...top, params: { ...top.params, ...params } }] };
    });
  },
  top: () => navStore.get().stack[navStore.get().stack.length - 1],
};

export const useNavState = () => useStoreValue(navStore, (s) => s);
