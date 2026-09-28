import { useSyncExternalStore } from 'react';

// Minimal external store: one mutable snapshot, replaced immutably on every update.
export function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(patch: Partial<T> | ((s: T) => Partial<T>)) {
      const next = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...next };
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export type Store<T extends object> = ReturnType<typeof createStore<T>>;

export function useStoreValue<T extends object, R>(store: Store<T>, select: (s: T) => R): R {
  return useSyncExternalStore(store.subscribe, () => select(store.get()), () => select(store.get()));
}
