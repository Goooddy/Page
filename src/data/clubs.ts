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
  role: 'owner' | 'member';
  row: { time: string; preview: string; activity?: string; badge?: number; unread?: boolean };
};

export const CLUBS: Club[] = [
  { id: 'midnight', name: 'Midnight Readers Club', art: 1, palette: 'rose', sub: 'Atomic Habits · 2.1k members', role: 'owner',
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
};

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
};
export const clubsStore = createStore<ClubsState>({ muted: {}, left: {}, read: {}, created: [], requested: {}, joined: {} });
export const useClubs = <R,>(sel: (s: ClubsState) => R) => useStoreValue(clubsStore, sel);

export const clubs = {
  mute(id: string, label: string) { clubsStore.set((s) => ({ muted: { ...s.muted, [id]: label } })); },
  unmute(id: string) { clubsStore.set((s) => ({ muted: { ...s.muted, [id]: false } })); },
  leave(id: string) { clubsStore.set((s) => ({ left: { ...s.left, [id]: true } })); },
  markRead(id: string) { clubsStore.set((s) => ({ read: { ...s.read, [id]: true } })); },
  markAllRead() { clubsStore.set({ read: Object.fromEntries(CLUBS.map((c) => [c.id, true])) }); },
  create(c: Club) { clubsStore.set((s) => ({ created: [c, ...s.created] })); },
  request(id: string) { clubsStore.set((s) => ({ requested: { ...s.requested, [id]: true } })); },
  join(id: string, on = true) { clubsStore.set((s) => ({ joined: { ...s.joined, [id]: on } })); },
  reset() { clubsStore.set({ muted: {}, left: {}, read: {}, created: [], requested: {}, joined: {} }); },
};
