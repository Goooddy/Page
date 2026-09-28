import { createStore, useStoreValue } from '../lib/store';
import type { ChatItem, ChatMsg } from '../components/ui/chat';
import { isMsg } from '../components/ui/chat';
import { appStore } from './app';

// Conversation content from the "Chat" and "Thread" frames (Midnight Readers Club).
const chatSeed = (): ChatItem[] => [
  { id: 'd1', divider: 'date', label: '5 May 2026' },
  { id: 'm1', name: 'Amaka', time: '2:09 PM', body: 'I keep coming back to the statues in Chapter 16 — the way he counts them like a rosary.', likes: 24, replies: 24 },
  { id: 'm2', name: 'Sidi', you: true, time: '2:31 PM', body: 'Same. It reframes the whole second half for me.', likes: 24 },
  { id: 'm3', name: 'Tobi', time: '2:44 PM', body: 'Does anyone else find the House calmer than the world outside it?', likes: 24 },
  { id: 'd2', divider: 'unread', label: '12 new messages' },
  { id: 'm4', name: 'Femi', time: '3:02 PM', body: 'Chapter 18 tonight if anyone wants to read along.', likes: 24, replies: 24 },
];

export type Reply = ChatMsg;
const repliesSeed = (): Reply[] => [
  { id: 'r1', name: 'Tobi', time: '2:14 PM', body: 'That rosary reading hadn’t occurred to me — it reframes the whole second half.', likes: 3 },
  { id: 'r2', name: 'Kemi', time: '2:20 PM', body: 'Same. And the ledger scene right after made it click for me.', likes: 1 },
  { id: 'r3', name: 'Sidi', you: true, time: '2:31 PM', body: '@Tobi that rosary reading hadn’t occurred to me — it reframes the whole second half.', likes: 0, noLikes: true },
];

type ChatState = {
  chats: Record<string, ChatItem[]>;
  replies: Record<string, Reply[]>;
  catchupHidden: Record<string, boolean>;
  primingDone: boolean;
};
export const chatStore = createStore<ChatState>({ chats: {}, replies: {}, catchupHidden: {}, primingDone: false });
export const useChat = <R,>(sel: (s: ChatState) => R) => useStoreValue(chatStore, sel);

export const getChat = (club: string) => chatStore.get().chats[club] ?? chatSeed();
export const getReplies = (key: string) => chatStore.get().replies[key] ?? repliesSeed();

let seq = 0;
export const nowTime = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

function setChat(club: string, fn: (items: ChatItem[]) => ChatItem[]) {
  chatStore.set((s) => ({ chats: { ...s.chats, [club]: fn(s.chats[club] ?? chatSeed()) } }));
}
function setReplies(key: string, fn: (items: Reply[]) => Reply[]) {
  chatStore.set((s) => ({ replies: { ...s.replies, [key]: fn(s.replies[key] ?? repliesSeed()) } }));
}
const patchMsg = <T extends ChatItem | Reply>(items: T[], id: string, p: Partial<ChatMsg>) => items.map((i) => (i.id === id ? ({ ...i, ...p } as T) : i));

/* Delivery simulation: sending → sent; offline → queued → (after 8s still offline) failed. */
function deliver(update: (id: string, p: Partial<ChatMsg>) => void, id: string) {
  if (appStore.get().offline) {
    update(id, { state: 'queued' });
    const failTimer = setTimeout(() => { if (appStore.get().offline) update(id, { state: 'failed' }); }, 8000);
    const unsub = appStore.subscribe(() => {
      if (!appStore.get().offline) {
        clearTimeout(failTimer);
        unsub();
        update(id, { state: 'sending' });
        setTimeout(() => update(id, { state: undefined }), 900);
      }
    });
    return;
  }
  setTimeout(() => update(id, { state: undefined, time: nowTime() }), 1200);
}

export const chat = {
  reset() { chatStore.set({ chats: {}, replies: {}, catchupHidden: {}, primingDone: false }); },
  seed(club: string, items: ChatItem[]) { chatStore.set((s) => ({ chats: { ...s.chats, [club]: items } })); },
  seedReplies(key: string, items: Reply[]) { chatStore.set((s) => ({ replies: { ...s.replies, [key]: items } })); },
  send(club: string, body: string, quote?: ChatMsg['quote']) {
    const id = `n${++seq}`;
    setChat(club, (items) => [...items, { id, name: 'Sidi', you: true, time: nowTime(), body, likes: 0, quote, state: 'sending' }]);
    deliver((mid, p) => setChat(club, (items) => patchMsg(items, mid, p)), id);
    return id;
  },
  retry(club: string, id: string) {
    setChat(club, (items) => patchMsg(items, id, { state: 'sending' }));
    deliver((mid, p) => setChat(club, (items) => patchMsg(items, mid, p)), id);
  },
  removePending(club: string, id: string) { setChat(club, (items) => items.filter((i) => i.id !== id)); },
  edit(club: string, id: string, body: string) { setChat(club, (items) => patchMsg(items, id, { body, edited: true })); },
  remove(club: string, ids: string[], how: 'deleted' | 'removed') {
    setChat(club, (items) => items.map((i) => (ids.includes(i.id) && isMsg(i) ? { ...i, state: how, replies: 0, reactions: undefined } : i)));
  },
  like(club: string, id: string) {
    setChat(club, (items) => items.map((i) => (i.id === id && isMsg(i) ? { ...i, liked: !i.liked, likes: i.likes + (i.liked ? -1 : 1) } : i)));
  },
  react(club: string, id: string, emoji: string) {
    if (emoji === '❤') {
      setChat(club, (items) => items.map((i) => (i.id === id && isMsg(i) && !i.liked ? { ...i, liked: true, likes: i.likes + 1 } : i)));
      return;
    }
    setChat(club, (items) => items.map((i) => {
      if (i.id !== id || !isMsg(i)) return i;
      const rs = [...(i.reactions ?? [])];
      const k = rs.findIndex((r) => r.emoji === emoji);
      if (k >= 0) {
        const r = rs[k];
        if (r.mine) { if (r.count <= 1) rs.splice(k, 1); else rs[k] = { ...r, count: r.count - 1, mine: false }; }
        else rs[k] = { ...r, count: r.count + 1, mine: true };
      } else rs.unshift({ emoji, count: 1, mine: true });
      return { ...i, reactions: rs };
    }));
  },
  hideCatchup(club: string) { chatStore.set((s) => ({ catchupHidden: { ...s.catchupHidden, [club]: true } })); },

  /* Thread replies */
  sendReply(key: string, body: string, quote?: ChatMsg['quote']) {
    const id = `t${++seq}`;
    setReplies(key, (items) => [...items, { id, name: 'Sidi', you: true, time: nowTime(), body, likes: 0, noLikes: true, quote, state: 'sending' }]);
    deliver((rid, p) => setReplies(key, (items) => patchMsg(items, rid, p)), id);
  },
  editReply(key: string, id: string, body: string) { setReplies(key, (items) => patchMsg(items, id, { body, edited: true })); },
  removeReplies(key: string, ids: string[]) { setReplies(key, (items) => items.filter((i) => !ids.includes(i.id))); },
  likeReply(key: string, id: string) { setReplies(key, (items) => items.map((i) => (i.id === id ? { ...i, liked: !i.liked, likes: i.likes + (i.liked ? -1 : 1) } : i))); },
  reactReply(key: string, id: string, emoji: string) {
    setReplies(key, (items) => items.map((i) => {
      if (i.id !== id) return i;
      if (emoji === '❤') return i.liked ? i : { ...i, liked: true, likes: i.likes + 1 };
      const rs = [...(i.reactions ?? [])];
      const k = rs.findIndex((r) => r.emoji === emoji);
      if (k >= 0) rs[k] = { ...rs[k], count: rs[k].count + (rs[k].mine ? -1 : 1), mine: !rs[k].mine };
      else rs.unshift({ emoji, count: 1, mine: true });
      return { ...i, reactions: rs.filter((r) => r.count > 0) };
    }));
  },
  markPrimed() { chatStore.set({ primingDone: true }); },
};
