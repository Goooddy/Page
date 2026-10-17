import { createStore, useStoreValue } from '../lib/store';
import type { Palette } from '../components/ui/core';

// Joined bookclubs as drawn on the "Bookclubs" frame (order, avatar art + palette, row content).
export type Club = {
  id: string;
  name: string;
  art: number;
  palette: Palette;
  /** chat header subtitle */
  sub: string;
  isPrivate?: boolean;
  role: 'admin' | 'member';
  row: { time: string; preview: string; activity?: string; badge?: number; unread?: boolean };
};

export const CLUBS: Club[] = [
  { id: 'midnight', name: 'Midnight Readers Club', art: 1, palette: 'rose', sub: 'Atomic Habits · 2.1k members', role: 'admin',
    row: { time: '2:09 PM', preview: 'Amaka’s message', activity: '24 new replies', badge: 12, unread: true } },
  { id: 'quill', name: 'The Quill Society', art: 2, palette: 'plum', sub: 'Private · invitation or request only', isPrivate: true, role: 'member',
    row: { time: '12:41 PM', preview: 'Femi’s message', activity: '11 new replies', badge: 4, unread: true } },
  { id: 'historical', name: 'Historical Narratives', art: 3, palette: 'forest', sub: 'Half of a Yellow Sun · 3.4k members', role: 'member',
    row: { time: 'Yesterday', preview: 'Kemi: the Biafra chapters are hard going' } },
  { id: 'clue', name: 'Clue Seekers', art: 4, palette: 'teal', sub: 'The Silent Patient · 840 members', role: 'member',
    row: { time: 'Yesterday', preview: 'Tobi: I suspected the wrong man entirely' } },
  { id: 'poetry-sundays', name: 'Poetry on Sundays', art: 5, palette: 'plum', sub: 'Selected Poems · 1.1k members', role: 'member',
    row: { time: 'Mon', preview: 'The meter changes in the third stanza' } },
  { id: 'african-lit', name: 'African Literature Now', art: 6, palette: 'indigo', sub: 'Crimson Blossoms · 3.2k members', role: 'member',
    row: { time: 'Sun', preview: 'Amaka: starting Crimson Blossoms tonight' } },
];

// Other bookclubs that appear in Home / Discover rows (values from those frames).
export const OTHER_CLUBS: Record<string, Omit<Club, 'row' | 'role'>> = {
  fantasy: { id: 'fantasy', name: 'Fantasy World Builders', art: 2, palette: 'indigo', sub: '5.2k members · 340 active' },
  mystery: { id: 'mystery', name: 'Mystery Novel Enthusiasts', art: 4, palette: 'indigo', sub: '2.1k members · 120 active' },
  habit: { id: 'habit', name: 'Habit Builders', art: 2, palette: 'indigo', sub: 'Atomic Habits · 640 members' },
  bible: { id: 'bible', name: 'The Bible Readers', art: 1, palette: 'indigo', sub: 'The Screwtape Letters · Private', isPrivate: true },
  hff: { id: 'hff', name: 'Historical Fiction Fans', art: 8, palette: 'clay', sub: 'Closed · read only' },
};

/* ——— Open & closed bookclubs ———
 * A closed bookclub is read-only. `by: 'you'` = you're its admin and closed it (you can reopen it);
 * `by: 'admin'` = its admin closed it. The two seeds are the rows on the "Closed bookclubs" frame. */
export type ClosedEntry = { by: 'you' | 'admin'; time: string };
export const CLOSED_SEED: Record<string, ClosedEntry> = { hff: { by: 'you', time: 'Aug 12' }, bible: { by: 'admin', time: 'Sep 30' } };
/** Row shown on Bookclubs for a seeded closed bookclub after you reopen it (its latest message). */
export const REOPENED_ROW: Club['row'] = { time: 'now', preview: 'Femi: Chapter 18 tonight if anyone wants to read along' };

export function clubById(id: string): Omit<Club, 'row' | 'role'> & Partial<Pick<Club, 'row' | 'role'>> {
  return clubsStore.get().created.find((c) => c.id === id) ?? CLUBS.find((c) => c.id === id) ?? OTHER_CLUBS[id] ?? { ...CLUBS[0], id, row: CLUBS[0].row, role: 'member' };
}

type ClubsState = {
  muted: Record<string, string | false>;
  left: Record<string, boolean>;
  read: Record<string, boolean>;
  created: Club[];
  requested: Record<string, boolean>;
  joined: Record<string, boolean>;
  /** closed in this session (an entry) or reopened (false); seeds come from CLOSED_SEED */
  closed: Record<string, ClosedEntry | false>;
};
export const clubsStore = createStore<ClubsState>({ muted: {}, left: {}, read: {}, created: [], requested: {}, joined: {}, closed: {} });
export const useClubs = <R,>(sel: (s: ClubsState) => R) => useStoreValue(clubsStore, sel);

export function closedEntry(id: string, st: ClubsState = clubsStore.get()): ClosedEntry | null {
  const v = st.closed[id];
  if (v === false) return null;
  return v ?? CLOSED_SEED[id] ?? null;
}
/** Closed bookclubs, newest first: ones closed this session, then the seeded ones. */
export function closedIds(st: ClubsState = clubsStore.get()): string[] {
  const session = Object.keys(st.closed).filter((id) => st.closed[id] && !(id in CLOSED_SEED)).reverse();
  return [...session, ...Object.keys(CLOSED_SEED)].filter((id) => closedEntry(id, st) && !st.left[id]);
}

/** Leave dialog: the last member deletes the bookclub, an admin hands it on, a member just leaves. */
export function leaveCopy(id: string, name: string, admin: boolean) {
  if (id.startsWith('new-')) return { title: 'Delete this bookclub?', body: `You’re the only member left, so leaving deletes ${name} and its conversation for good.`, confirm: 'Delete' };
  if (admin) return { title: 'Leave this bookclub?', body: 'You’re the admin. When you leave, the most active member becomes the admin. If you come back, you’ll rejoin as a member.', confirm: 'Leave' };
  return { title: 'Leave this bookclub?', body: `You’ll stop receiving alerts from ${name}. You can rejoin any time.`, confirm: 'Leave' };
}

export const clubs = {
  mute(id: string, label: string) { clubsStore.set((s) => ({ muted: { ...s.muted, [id]: label } })); },
  unmute(id: string) { clubsStore.set((s) => ({ muted: { ...s.muted, [id]: false } })); },
  leave(id: string) { clubsStore.set((s) => ({ left: { ...s.left, [id]: true } })); },
  markRead(id: string) { clubsStore.set((s) => ({ read: { ...s.read, [id]: true } })); },
  markAllRead() { clubsStore.set({ read: Object.fromEntries(CLUBS.map((c) => [c.id, true])) }); },
  create(c: Club) { clubsStore.set((s) => ({ created: [c, ...s.created] })); },
  request(id: string) { clubsStore.set((s) => ({ requested: { ...s.requested, [id]: true } })); },
  join(id: string, on = true) { clubsStore.set((s) => ({ joined: { ...s.joined, [id]: on } })); },
  close(id: string) { clubsStore.set((s) => ({ closed: { ...s.closed, [id]: { by: 'you', time: 'now' } } })); },
  reopen(id: string) { clubsStore.set((s) => ({ closed: { ...s.closed, [id]: false } })); },
  reset() { clubsStore.set({ muted: {}, left: {}, read: {}, created: [], requested: {}, joined: {}, closed: {} }); },
};
