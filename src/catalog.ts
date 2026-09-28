import { nav, type Params } from './lib/nav';
import { app, type AppState } from './data/app';
import { chat } from './data/chat';
import { clubs, type Club } from './data/clubs';
import { alerts, alertsStore } from './screens/alerts';
import type { ChatItem } from './components/ui/chat';

// Every frame on "High Fidelity Designs" (section 13 left out), grouped by section, with how to open it.
// `hint` tells a reviewer how the state is reached inside the app.
export type CatalogItem = { id: string; title: string; go: () => void; hint?: string };
export type CatalogSection = { title: string; items: CatalogItem[] };

type R = Array<[string, Params?]>;
const DEFAULT_PLATFORM: AppState['platform'] = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent) ? 'android' : 'ios';

function resetStores() {
  chat.reset();
  clubs.reset();
  alerts.reset();
}

const signedOut = (routes: R) => () => {
  resetStores();
  app.set({ signedIn: false, forcedOffline: false, offline: !navigator.onLine, loginFails: 0, sheet: null, plan: 'free', platform: DEFAULT_PLATFORM });
  nav.reset(routes);
};

type Opts = {
  offline?: boolean;
  hasClubs?: boolean;
  plan?: AppState['plan'];
  platform?: AppState['platform'];
  theme?: AppState['theme'];
  sheet?: AppState['sheet'];
  setup?: () => void;
};
const S = (routes: R, o: Opts = {}) => () => {
  resetStores();
  app.set({
    signedIn: true, forcedOffline: !!o.offline, offline: !!o.offline || !navigator.onLine, hasClubs: o.hasClubs ?? true,
    plan: o.plan ?? 'free', platform: o.platform ?? DEFAULT_PLATFORM, sheet: null, loaded: { '*': true }, toast: null,
    ...(o.theme ? { theme: o.theme } : null),
  });
  o.setup?.();
  nav.reset(routes);
  if (o.sheet) setTimeout(() => app.set({ sheet: o.sheet ?? null }), 50);
};

/* Chat seeds for frames whose conversation differs from the base "Chat" frame. */
const D1: ChatItem = { id: 'd1', divider: 'date', label: '5 May 2026' };
const DU: ChatItem = { id: 'd2', divider: 'unread', label: '12 new messages' };
const M1 = { id: 'm1', name: 'Amaka', time: '2:09 PM', body: 'I keep coming back to the statues in Chapter 16 — the way he counts them like a rosary.', likes: 24, replies: 24 };
const M2 = { id: 'm2', name: 'Sidi', you: true, time: '2:31 PM', body: 'Same. It reframes the whole second half for me.', likes: 24 };
const M3 = { id: 'm3', name: 'Tobi', time: '2:44 PM', body: 'Does anyone else find the House calmer than the world outside it?', likes: 24 };
const M4 = { id: 'm4', name: 'Femi', time: '3:02 PM', body: 'Chapter 18 tonight if anyone wants to read along.', likes: 24, replies: 24 };
const seed = (club: string, items: ChatItem[], hideCatchup = false) => () => { chat.seed(club, items); if (hideCatchup) chat.hideCatchup(club); };
const mineSeed = seed('historical', [D1, M1, M2, { ...M3, name: 'Sidi', you: true }, DU, { ...M4, name: 'Sidi', you: true }]);
const REPLIES = [
  { id: 'r1', name: 'Tobi', time: '2:14 PM', body: 'That rosary reading hadn’t occurred to me — it reframes the whole second half.', likes: 3 },
  { id: 'r2', name: 'Kemi', time: '2:20 PM', body: 'Same. And the ledger scene right after made it click for me.', likes: 1 },
  { id: 'r3', name: 'Sidi', you: true, time: '2:31 PM', body: '@Tobi that rosary reading hadn’t occurred to me — it reframes the whole second half.', likes: 0, noLikes: true },
];
const SENDING = { id: 'rs', name: 'Sidi', you: true, time: '2:14 PM', body: 'That rosary reading hadn’t occurred to me — it reframes the whole second half.', likes: 0, state: 'sending' as const };
const newClub = () => {
  const c: Club = { id: 'new-1', name: 'Midnight Readers Club', art: 17, palette: 'clay', sub: 'The Journey to my Village · 1 member', role: 'owner', row: { time: 'now', preview: 'Your bookclub is ready' } };
  clubs.create(c);
  chat.seed('new-1', [{ id: 'today', divider: 'date', label: 'Today' }]);
};
const ATOMIC = { title: 'Atomic Habits', author: 'James Clear', year: '2018', genre: 'Self-help' };
const EMAILS = ['amaka@mail.com', 'tobi@mail.com'];
const TH = (p: Params = {}): R => [['bookclubs'], ['chat', { club: 'midnight' }], ['thread', { club: 'midnight', msg: 'm1', ...p }]];

export const CATALOG: CatalogSection[] = [
  {
    title: '01 · Launch & onboarding',
    items: [
      { id: '32:4', title: 'Launch', go: signedOut([['launch']]) },
      { id: '355:1964', title: 'Onboarding carousel — slide 1', go: signedOut([['onboarding', { slide: 0 }]]) },
      { id: '363:2635', title: 'Onboarding carousel — slide 2', go: signedOut([['onboarding', { slide: 1 }]]), hint: 'Swipe the carousel' },
      { id: '363:2665', title: 'Onboarding carousel — slide 3', go: signedOut([['onboarding', { slide: 2 }]]), hint: 'Swipe the carousel' },
    ],
  },
  {
    title: '02 · Sign up',
    items: [
      { id: '358:2911', title: 'Sign up', go: signedOut([['onboarding'], ['signup']]) },
      { id: '495:6369', title: 'Sign up — check your details', go: signedOut([['onboarding'], ['signup', { email: 'samuel@example', pw: 'abcde', err: { email: 'format', pw: true } }]]), hint: 'Submit an incomplete email and a short password' },
      { id: '495:6464', title: 'Sign up — email already used', go: signedOut([['onboarding'], ['signup', { email: 'samuel@example.com', pw: 'bookclub24', err: { email: 'used' } }]]), hint: 'Sign up with samuel@example.com' },
      { id: '495:6554', title: 'Sign up — no connection', go: signedOut([['onboarding'], ['signup', { email: 'samuel@example.com', pw: 'bookclub24', toast: true }]]), hint: 'Create an account while your device is offline' },
      { id: '373:2849', title: 'Verify email', go: signedOut([['onboarding'], ['signup'], ['verify', { email: 'samuel@example.com', code: '472' }]]), hint: 'Any 6-digit code works' },
      { id: '495:6833', title: 'Verify email — wrong code', go: signedOut([['onboarding'], ['signup'], ['verify', { email: 'samuel@example.com', code: '472915', state: 'wrong' }]]), hint: 'Enter 472915' },
      { id: '495:6894', title: 'Verify email — code expired', go: signedOut([['onboarding'], ['signup'], ['verify', { email: 'samuel@example.com', code: '472915', state: 'expired' }]]), hint: 'Verify after the resend timer runs out' },
      { id: '352:1883', title: 'Choose username', go: signedOut([['onboarding'], ['signup'], ['username']]) },
      { id: '350:2357', title: 'Pick genres', go: signedOut([['onboarding'], ['signup'], ['username'], ['genres']]) },
      { id: '373:3834', title: 'Join bookclubs', go: signedOut([['onboarding'], ['signup'], ['username'], ['genres'], ['join-clubs']]) },
      { id: '352:1948', title: 'Notification priming', go: S(TH({ priming: true, sending: true })), hint: 'Shown after your first reply in a thread' },
    ],
  },
  {
    title: '03 · Log in',
    items: [
      { id: '358:3402', title: 'Log in', go: signedOut([['onboarding'], ['login']]), hint: 'samuel@example.com with any password' },
      { id: '495:6645', title: 'Log in — details don’t match', go: signedOut([['onboarding'], ['login', { email: 'samuel@example.com', pw: 'wrongpass', err: 'mismatch' }]]), hint: 'Use an email with no account' },
      { id: '495:6734', title: 'Log in — too many attempts', go: signedOut([['onboarding'], ['login', { email: 'samuel@example.com', pw: 'wrongpass', err: 'locked' }]]), hint: 'Fail to log in three times' },
    ],
  },
  {
    title: '04 · Password reset',
    items: [
      { id: '391:5694', title: 'Forgot password', go: signedOut([['onboarding'], ['login'], ['forgot']]) },
      { id: '391:5756', title: 'Reset link sent', go: signedOut([['onboarding'], ['login'], ['forgot'], ['reset-sent', { email: 'samuel@example.com' }]]) },
      { id: '391:5816', title: 'Set a new password', go: signedOut([['onboarding'], ['login'], ['forgot'], ['reset-sent'], ['set-password']]), hint: 'Tap “Open email app”' },
      { id: '391:5912', title: 'Log in — password reset', go: signedOut([['onboarding'], ['login', { email: 'samuel@example.com', reset: true }]]) },
      { id: '559:14471', title: 'Forgot password — check your email address', go: signedOut([['onboarding'], ['login'], ['forgot', { email: 'samuel@example', invalid: true }]]) },
      { id: '559:14524', title: 'Set a new password — too short', go: signedOut([['onboarding'], ['login'], ['forgot'], ['reset-sent'], ['set-password', { a: 'abcde', b: 'abcde' }]]) },
      { id: '559:14594', title: 'Reset link expired', go: signedOut([['onboarding'], ['login'], ['reset-expired']]), hint: 'Screen list only' },
      { id: '560:14468', title: 'Set a new password — passwords don’t match', go: signedOut([['onboarding'], ['login'], ['forgot'], ['reset-sent'], ['set-password', { a: 'bookclub24', b: 'bookclub2' }]]) },
    ],
  },
  {
    title: '05 · Home',
    items: [
      { id: '275:1095', title: 'Home', go: S([['home']]) },
      { id: '275:1434', title: 'Home — empty', go: S([['home']], { hasClubs: false }), hint: 'Finish sign-up without joining a bookclub' },
      { id: '391:6369', title: 'Home — loading', go: S([['home', { loading: true }]]), hint: 'First open of the tab' },
      { id: '561:15833', title: 'Home — offline', go: S([['home']], { offline: true }), hint: 'Turn your connection off' },
    ],
  },
  {
    title: '06 · Discover & Channels',
    items: [
      { id: '239:2023', title: 'Discover', go: S([['discover']]) },
      { id: '282:1373', title: 'Search results', go: S([['discover'], ['search', { q: 'atomic habits' }]]), hint: 'Search “atomic habits”' },
      { id: '282:1529', title: 'Bookclub preview — public', go: S([['discover'], ['club-preview', { id: 'public' }]]) },
      { id: '282:2056', title: 'Bookclub preview — private', go: S([['discover'], ['club-preview', { id: 'private' }]]) },
      { id: '391:6463', title: 'Discover — loading', go: S([['discover', { loading: true }]]) },
      { id: '391:7199', title: 'Bookclub preview — menu', go: S([['discover'], ['club-preview', { id: 'public', menu: true }]]) },
      { id: '401:6509', title: 'Search results — no results', go: S([['discover'], ['search', { q: 'the famished road' }]]) },
      { id: '504:6601', title: 'Search results — no results in this genre', go: S([['discover'], ['search', { q: 'atomic habits', genre: 'Mystery' }]]), hint: 'Search, then pick a genre chip' },
      { id: '558:13281', title: 'Channels — coming soon', go: S([['discover'], ['channels']]) },
      { id: '561:15087', title: 'Search results — loading', go: S([['discover'], ['search', { q: 'atomic habits', loading: true }]]) },
      { id: '561:15218', title: 'Bookclub preview — loading', go: S([['discover'], ['club-preview', { id: 'public', loading: true }]]) },
      { id: '561:15350', title: 'Discover — offline', go: S([['discover']], { offline: true }) },
      { id: '561:15582', title: 'Discover — couldn’t load', go: S([['discover', { failed: true }]]), hint: 'Open Discover for the first time while offline' },
    ],
  },
  {
    title: '07 · Bookclubs & chat',
    items: [
      { id: '238:298', title: 'Bookclubs', go: S([['bookclubs']]) },
      { id: '391:6699', title: 'Bookclubs — loading', go: S([['bookclubs', { loading: true }]]) },
      { id: '391:7120', title: 'Bookclubs — menu', go: S([['bookclubs', { menu: true }]]) },
      { id: '401:6319', title: 'Bookclubs — empty', go: S([['bookclubs']], { hasClubs: false }) },
      { id: '537:9294', title: 'Bookclubs — a muted bookclub', go: S([['bookclubs']], { setup: () => clubs.mute('midnight', 'For 8 hours') }), hint: 'Mute a bookclub from its menu' },
      { id: '561:14901', title: 'Bookclubs — offline', go: S([['bookclubs']], { offline: true }) },
      { id: '239:1117', title: 'Chat', go: S([['bookclubs'], ['chat', { club: 'midnight' }]]) },
      { id: '561:14534', title: 'Chat — loading', go: S([['bookclubs'], ['chat', { club: 'midnight', loading: true }]]) },
      { id: '239:2316', title: 'Chat — sending', go: S([['bookclubs'], ['chat', { club: 'midnight' }]], { setup: seed('midnight', [D1, M1, M2, M3, { ...M4, name: 'Sidi', you: true, replies: 0, likes: 0, state: 'sending' }], true) }), hint: 'Send a message' },
      { id: '239:2469', title: 'Chat — offline, queued', go: S([['bookclubs'], ['chat', { club: 'midnight' }]], { offline: true, setup: seed('midnight', [D1, M1, M2, M3, { ...M4, name: 'Sidi', you: true, replies: 0, state: 'queued' }]) }), hint: 'Send while offline' },
      { id: '239:2584', title: 'Chat — offline, failed send', go: S([['bookclubs'], ['chat', { club: 'midnight' }]], { offline: true, setup: seed('midnight', [D1, M1, { ...M2, replies: 24 }, M3, { ...M4, name: 'Sidi', you: true, replies: 0, state: 'failed' }]) }), hint: 'Stay offline for 8 seconds after sending' },
      { id: '391:6119', title: 'Chat — deleted messages', go: S([['bookclubs'], ['chat', { club: 'midnight' }]], { setup: seed('midnight', [D1, M1, { id: 'x1', name: 'Tobi', time: '2:14 PM', body: '', likes: 0, state: 'removed' }, M3, DU, { ...M2, state: 'deleted' }, { ...M4, state: 'removed', replies: 0 }]) }) },
      { id: '391:7563', title: 'Chat — bookclub menu', go: S([['bookclubs'], ['chat', { club: 'midnight', menu: true }]]), hint: 'Tap ••• in the chat header' },
      { id: '537:10406', title: 'Chat — bookclub menu (private, member)', go: S([['bookclubs'], ['chat', { club: 'quill', menu: true }]]), hint: 'Open The Quill Society menu' },
      { id: '516:6746', title: 'Chat — select mode, one of theirs', go: S([['bookclubs'], ['chat', { club: 'historical', select: ['m1'] }]]), hint: 'Long-press (or right-click) a message' },
      { id: '516:7238', title: 'Chat — select mode, one of yours', go: S([['bookclubs'], ['chat', { club: 'historical', select: ['m2'] }]]) },
      { id: '516:7660', title: 'Chat — select mode, several of yours', go: S([['bookclubs'], ['chat', { club: 'historical', select: ['m2', 'm3', 'm4'] }]], { setup: mineSeed }), hint: 'Tap more messages while selecting' },
      { id: '516:8097', title: 'Chat — select mode, several mixed', go: S([['bookclubs'], ['chat', { club: 'historical', select: ['m1', 'm2', 'm3'] }]]) },
      { id: '516:8512', title: 'Chat — delete several', go: S([['bookclubs'], ['chat', { club: 'historical', select: ['m2', 'm3', 'm4'], dialog: 'delete-many' }]], { setup: mineSeed }) },
      { id: '532:8730', title: 'Chat — delete one message', go: S([['bookclubs'], ['chat', { club: 'historical', select: ['m2'], dialog: 'delete-one' }]]) },
      { id: '517:7473', title: 'Chat — replying to a message', go: S([['bookclubs'], ['chat', { club: 'midnight', replyTo: 'm1', draft: 'Same. It’s the counting that makes it feel like prayer.' }]]), hint: 'Select a message, then Reply' },
      { id: '517:7613', title: 'Chat — reply sent', go: S([['bookclubs'], ['chat', { club: 'midnight' }]], { setup: seed('midnight', [D1, { ...M1, reactions: [{ emoji: '😂', count: 3, mine: true }, { emoji: '👏', count: 1 }] }, M2, { id: 'm5', name: 'Sidi', you: true, time: '2:52 PM', body: 'Same. It’s the counting that makes it feel like prayer.', likes: 24, quote: { name: 'Amaka', snippet: M1.body } }]) }) },
      { id: '517:7856', title: 'Chat — editing a message', go: S([['bookclubs'], ['chat', { club: 'midnight', editing: 'm2', draft: 'Same. It reframes the whole second half, and the ending.' }]]), hint: 'Select your message, ••• then Edit' },
      { id: '517:7987', title: 'Chat — message edited', go: S([['bookclubs'], ['chat', { club: 'midnight' }]], { setup: seed('midnight', [D1, M1, { ...M2, body: 'Same. It reframes the whole second half, and the ending.', edited: true }, M3, DU, M4]) }) },
      { id: '518:8563', title: 'Chat — select mode, more menu open (yours)', go: S([['bookclubs'], ['chat', { club: 'historical', select: ['m2'], more: true }]]) },
      { id: '531:8680', title: 'Chat — select mode, more menu open (theirs)', go: S([['bookclubs'], ['chat', { club: 'historical', select: ['m1'], more: true }]]) },
      { id: '529:8880', title: 'Chat — mentioning someone', go: S([['bookclubs'], ['chat', { club: 'midnight', draft: 'Loved this reading, @T' }]]), hint: 'Type @ in the composer' },
      { id: '356:3108', title: 'Report — reasons', go: S([['bookclubs'], ['chat', { club: 'historical', sheet: 'report' }]]), hint: 'Select someone’s message, ••• then Report' },
      { id: '356:3309', title: 'Report — something else', go: S([['bookclubs'], ['chat', { club: 'historical', sheet: 'report-else' }]]) },
      { id: '356:3499', title: 'Report — submitted', go: S([['bookclubs'], ['chat', { club: 'historical', toast: 'reported' }]]) },
      { id: '537:9087', title: 'Chat — mute options', go: S([['bookclubs'], ['chat', { club: 'midnight', sheet: 'mute' }]]) },
      { id: '537:9144', title: 'Chat — muted', go: S([['bookclubs'], ['chat', { club: 'midnight', toast: 'muted' }]], { setup: () => clubs.mute('midnight', 'For 8 hours') }) },
      { id: '537:9213', title: 'Chat — bookclub menu (muted)', go: S([['bookclubs'], ['chat', { club: 'midnight', menu: true }]], { setup: () => clubs.mute('midnight', 'For 8 hours') }) },
      { id: '557:12791', title: 'Chat — select mode, owner on someone else’s message', go: S([['bookclubs'], ['chat', { club: 'midnight', select: ['m1'] }]]), hint: 'In a bookclub you own' },
      { id: '557:12987', title: 'Chat — owner removing a message (reason)', go: S([['bookclubs'], ['chat', { club: 'midnight', select: ['m1'], sheet: 'remove' }]]) },
      { id: '557:13210', title: 'Chat — message removed by owner', go: S([['bookclubs'], ['chat', { club: 'midnight', toast: 'removed' }]], { setup: seed('midnight', [D1, { ...M1, state: 'removed', replies: 0 }, M2, M3, DU, M4]) }) },
      { id: '261:1628', title: 'Thread', go: S(TH({ sending: true })) },
      { id: '561:14735', title: 'Thread — loading', go: S(TH({ loading: true })) },
      { id: '401:6654', title: 'Thread — no replies yet', go: S(TH({ empty: true })) },
      { id: '529:7940', title: 'Thread — select mode, one of theirs', go: S(TH({ select: ['r2'] })) },
      { id: '529:8223', title: 'Thread — select mode, one of yours', go: S(TH({ select: ['r3'] })) },
      { id: '529:8488', title: 'Thread — swiping to reply', go: S(TH({ sending: true })), hint: 'Drag a reply to the right' },
      { id: '529:8587', title: 'Thread — replying to a reply', go: S(TH({ sending: true, replyTo: 'r2', draft: 'The ledger scene is where it turned for me too.' })) },
      { id: '529:8643', title: 'Thread — reply sent with a quote', go: S(TH(), { setup: () => chat.seedReplies('midnight:m1', [REPLIES[1], REPLIES[2], { id: 'r9', name: 'Sidi', you: true, time: '2:58 PM', body: 'The ledger scene is where it turned for me too.', likes: 0, noLikes: true, quote: { name: 'Kemi', snippet: REPLIES[1].body } }]) }) },
      { id: '531:8758', title: 'Thread — select mode, more menu open (theirs)', go: S(TH({ select: ['r2'], more: true })) },
      { id: '533:8743', title: 'Thread — select mode, more menu open (yours)', go: S(TH({ select: ['r3'], more: true })) },
      { id: '533:9037', title: 'Thread — editing a reply', go: S(TH({ sending: true, editing: 'r3', draft: '@Tobi that rosary reading hadn’t occurred to me — it reframes the ending too.' })) },
      { id: '533:9160', title: 'Thread — reply edited', go: S(TH(), { setup: () => chat.seedReplies('midnight:m1', [REPLIES[0], REPLIES[1], { ...REPLIES[2], body: '@Tobi that rosary reading hadn’t occurred to me — it reframes the ending too.', edited: true }, SENDING]) }) },
      { id: '401:5212', title: 'Confirm — delete reply', go: S(TH({ sending: true, dialog: true })) },
      { id: '358:3488', title: 'Bookclub information', go: S([['bookclubs'], ['chat', { club: 'midnight' }], ['club-info', { club: 'midnight' }]]), hint: 'Chat menu → Bookclub information' },
      { id: '558:13626', title: 'Bookclub information — member view', go: S([['bookclubs'], ['chat', { club: 'historical' }], ['club-info', { club: 'historical' }]]), hint: 'In a bookclub you don’t own' },
      { id: '401:5130', title: 'Confirm — leave bookclub', go: S([['bookclubs'], ['chat', { club: 'midnight' }], ['club-info', { club: 'midnight', dialog: 'leave' }]]) },
      { id: '344:2139', title: 'Manage members', go: S([['bookclubs'], ['club-info', { club: 'midnight' }], ['members']]) },
      { id: '373:4600', title: 'Member search', go: S([['bookclubs'], ['club-info', { club: 'midnight' }], ['members'], ['member-search', { q: 'ade' }]]) },
      { id: '401:5242', title: 'Confirm — remove member', go: S([['bookclubs'], ['club-info', { club: 'midnight' }], ['members', { remove: 'hcao' }]]), hint: 'Tap ••• on a member' },
      { id: '537:10224', title: 'Invite people (owner)', go: S([['bookclubs'], ['chat', { club: 'midnight' }], ['invite', { club: 'midnight', emails: EMAILS }]]) },
      { id: '537:10275', title: 'Invite people (member)', go: S([['bookclubs'], ['chat', { club: 'historical' }], ['invite', { club: 'historical', member: true, emails: EMAILS }]]) },
      { id: '537:10338', title: 'Invite people — sent', go: S([['bookclubs'], ['chat', { club: 'historical' }], ['invite', { club: 'historical', member: true, sent: true }]]), hint: 'Add emails, then Send invitations' },
      { id: '558:13737', title: 'Edit bookclub', go: S([['bookclubs'], ['club-info', { club: 'midnight' }], ['edit-club', { club: 'midnight' }]]) },
      { id: '558:14225', title: 'Edit bookclub — switching to public', go: S([['bookclubs'], ['club-info', { club: 'midnight' }], ['edit-club', { club: 'midnight', wasPrivate: true }]]), hint: 'Make a private bookclub public' },
    ],
  },
  {
    title: '08 · Create bookclub',
    items: [
      { id: '373:4138', title: 'Create bookclub — step 1 (details)', go: S([['bookclubs'], ['create', { q: 'atomic hab' }]]), hint: 'Tap + on Bookclubs' },
      { id: '373:4257', title: 'Create bookclub — step 1 (book chosen)', go: S([['bookclubs'], ['create', { name: 'Midnight Readers Club', book: ATOMIC }]]) },
      { id: '539:10852', title: 'Create bookclub — step 1 (add book manually)', go: S([['bookclubs'], ['create', { name: 'Midnight Readers Club', manual: 'Season of Crimson Blossoms' }]]) },
      { id: '391:5355', title: 'Genre picker', go: S([['bookclubs'], ['create', { name: 'Midnight Readers Club', book: ATOMIC, genreSheet: true }]]) },
      { id: '401:5273', title: 'Confirm — discard draft', go: S([['bookclubs'], ['create', { name: 'Midnight Readers Club', book: ATOMIC, discard: true }]]), hint: 'Close the form after typing' },
      { id: '373:4359', title: 'Create bookclub — step 2 (identity)', go: S([['bookclubs'], ['create', { name: 'Midnight Readers Club', book: ATOMIC, step: 2 }]]) },
      { id: '348:1785', title: 'Create bookclub — invite (after creating)', go: S([['bookclubs'], ['created-invite', { club: 'new-1', emails: EMAILS }]], { setup: newClub }) },
      { id: '558:13434', title: 'Chat — new bookclub, first open', go: S([['bookclubs'], ['chat', { club: 'new-1' }]], { setup: newClub }) },
    ],
  },
  {
    title: '09 · Alerts',
    items: [
      { id: '356:2562', title: 'Alerts', go: S([['alerts']]) },
      { id: '391:6901', title: 'Alerts — loading', go: S([['alerts', { loading: true }]]) },
      { id: '401:6253', title: 'Alerts — empty', go: S([['alerts']], { setup: () => { alertsStore.set({ list: [] }); app.set({ alertsBadge: 0 }); } }) },
      { id: '529:9036', title: 'Alerts — replies and mentions', go: S([['alerts']], { setup: () => alerts.reset('replies') }) },
      { id: '561:16145', title: 'Alerts — offline', go: S([['alerts']], { offline: true }) },
      { id: '344:1771', title: 'Invitation received', go: S([['alerts'], ['invitation']]), hint: 'Tap the invitation alert' },
      { id: '401:6999', title: 'Invitation received — no longer available', go: S([['alerts'], ['invitation', { gone: true }]]), hint: 'Open an invitation you already answered' },
      { id: '348:1670', title: 'Tap → destination (cold start)', go: S([['alerts'], ['thread', { club: 'midnight', cold: true }]]), hint: 'Tap a reply alert or notification' },
      { id: '373:4748', title: 'Moderation reason — content removed', go: S([['alerts'], ['moderation', { kind: 'content' }]]), hint: 'Tap the moderation alert' },
      { id: '373:4884', title: 'Moderation reason — removed from bookclub', go: S([['alerts'], ['moderation', { kind: 'removed' }]]) },
      { id: '401:6768', title: 'Thread — parent deleted', go: S([['alerts'], ['thread', { club: 'midnight', msg: 'm1', gone: true }]]) },
      { id: '401:6838', title: 'Thread — removed while reading', go: S([['alerts'], ['thread', { club: 'midnight', msg: 'm1', removed: true }]]) },
      { id: '401:6933', title: 'Bookclub preview — private, request sent', go: S([['discover'], ['club-preview', { id: 'private', requested: true }]]), hint: 'Tap “Request to join”' },
    ],
  },
  {
    title: '10 · Push notifications',
    items: [
      { id: '373:4940', title: 'Lock screen — iOS', go: S([['lock-screen']]) },
      { id: '373:4965', title: 'Notification shade — Android', go: S([['android-shade']]) },
      { id: '561:16299', title: 'Notifications — phone closes the app in the background', go: S(TH({ sending: true }), { sheet: 'background' }), hint: 'Android: after turning on notifications' },
    ],
  },
  {
    title: '11 · Profile, plans & settings',
    items: [
      { id: '364:2682', title: 'Profile', go: S([['profile']]) },
      { id: '391:6991', title: 'Profile — loading', go: S([['profile', { loading: true }]]) },
      { id: '559:11632', title: 'Profile — Premium trial', go: S([['profile']], { plan: 'trial' }) },
      { id: '378:4659', title: 'Edit profile', go: S([['profile'], ['edit-profile']]) },
      { id: '344:1651', title: 'Notification preferences', go: S([['profile'], ['notification-prefs']]) },
      { id: '378:4911', title: 'Pending requests', go: S([['profile'], ['pending-requests']]) },
      { id: '548:10268', title: 'Edit reading interests', go: S([['profile'], ['interests']]) },
      { id: '548:10368', title: 'Edit reading interests — changed', go: S([['profile'], ['interests', { sel: ['Fiction', 'Mystery', 'Poetry', 'African literature'] }]]) },
      { id: '569:15818', title: 'Appearance', go: S([['profile'], ['appearance']], { theme: 'system' }) },
      { id: '569:15896', title: 'Appearance — Dark chosen', go: S([['profile'], ['appearance']], { theme: 'dark' }) },
      { id: '378:4785', title: 'Account settings', go: S([['profile'], ['account']]) },
      { id: '389:4391', title: 'Change password — confirm it’s you', go: S([['profile'], ['account'], ['change-password']]) },
      { id: '559:14629', title: 'Change password — wrong current password', go: S([['profile'], ['account'], ['change-password', { pw: 'wrongpw', wrong: true }]]), hint: 'Enter fewer than 8 characters' },
      { id: '389:4453', title: 'Change password — new password', go: S([['profile'], ['account'], ['new-password']]) },
      { id: '559:14683', title: 'Change password — new password too short', go: S([['profile'], ['account'], ['new-password', { a: 'abcde' }]]) },
      { id: '560:14538', title: 'Change password — passwords don’t match', go: S([['profile'], ['account'], ['new-password', { a: 'bookclub24', b: 'bookclub2' }]]) },
      { id: '391:5887', title: 'Account settings — password changed', go: S([['profile'], ['account', { changed: true }]]) },
      { id: '401:7353', title: 'Delete account — before you go', go: S([['profile'], ['account'], ['delete-account']]) },
      { id: '401:7424', title: 'Delete account — confirm it’s you', go: S([['profile'], ['account'], ['delete-account'], ['delete-confirm']]) },
      { id: '401:8061', title: 'Delete account — final confirm', go: S([['profile'], ['account'], ['delete-account'], ['delete-confirm', { pw: 'bookclub24', dialog: true }]]) },
      { id: '401:7478', title: 'Account deleted — back to launch', go: signedOut([['launch', { deleted: true }]]) },
      { id: '378:5067', title: 'About Page234', go: S([['profile'], ['about']]) },
      { id: '388:4513', title: 'Content rules', go: S([['profile'], ['about'], ['content-rules']]) },
      { id: '389:3960', title: 'Terms of service', go: S([['profile'], ['about'], ['terms']]) },
      { id: '389:4101', title: 'Privacy policy', go: S([['profile'], ['about'], ['privacy']]) },
      { id: '389:4226', title: 'Contact support', go: S([['profile'], ['about'], ['contact-support']]) },
      { id: '391:5490', title: 'Support topic picker', go: S([['profile'], ['about'], ['contact-support', { picker: true }]]) },
      { id: '391:5570', title: 'Contact support — sent', go: S([['profile'], ['about'], ['contact-support', { topic: 'Something is broken', text: 'The Alerts tab shows a badge but the list is empty. Started yesterday on my Infinix.', sent: true }]]) },
      { id: '378:3288', title: 'Plans', go: S([['profile'], ['plans']]) },
      { id: '389:4524', title: 'What’s included', go: S([['profile'], ['plans'], ['whats-included']]) },
      { id: '389:4651', title: 'Plans — nothing to restore', go: S([['profile'], ['plans', { toast: 'restore' }]]), hint: 'Tap “Restore a purchase”' },
      { id: '546:10175', title: 'Plans — confirming purchase', go: S([['profile'], ['plans', { confirming: true }]]), hint: 'Tap “Upgrade to Premium”' },
      { id: '546:10245', title: 'Plans — upgrade complete', go: S([['profile'], ['plans', { toast: 'premium' }]], { plan: 'premium' }) },
      { id: '546:10279', title: 'Plans — payment failed', go: S([['profile'], ['plans', { toast: 'failed' }]]), hint: 'Upgrade while offline' },
      { id: '546:10327', title: 'Plans — payment pending (Android)', go: S([['profile'], ['plans']], { plan: 'pending', platform: 'android' }), hint: 'Upgrade on an Android phone' },
      { id: '391:6007', title: 'Plans — Premium active', go: S([['profile'], ['plans']], { plan: 'premium' }) },
      { id: '414:6873', title: 'Plans — cancel subscription', go: S([['profile'], ['plans', { cancel: true }]], { plan: 'premium' }) },
      { id: '414:7428', title: 'Plans — Premium ending', go: S([['profile'], ['plans']], { plan: 'ending' }) },
      { id: '559:11748', title: 'Plans — Premium trial', go: S([['profile'], ['plans']], { plan: 'trial' }) },
      { id: '559:11824', title: 'Plans — on Android', go: S([['profile'], ['plans']], { platform: 'android' }) },
    ],
  },
  {
    title: '12 · Limits',
    items: [
      { id: '378:3920', title: 'Limit — trial ended, rooms to manage', go: S(TH({ sending: true }), { sheet: 'trial-manage' }), hint: 'Screen list only' },
      { id: '378:3993', title: 'Limit — trial ended, nothing to manage', go: S(TH({ sending: true }), { sheet: 'trial-free' }), hint: 'Screen list only' },
      { id: '378:4066', title: 'Limit — free plan hits a premium feature', go: S(TH({ sending: true }), { sheet: 'limit-join' }), hint: 'On Free, join another bookclub' },
      { id: '378:4355', title: 'Manage active bookclubs', go: S([['profile'], ['keep-active']]), hint: '“Choose which 3 stay”' },
    ],
  },
];
