import { useEffect, useState } from 'react';
import { nav, type Params } from '../lib/nav';
import { app, useApp } from '../data/app';
import { AppBar, PinnedFooter, Screen } from '../components/ui/nav';
import { BookCover, Button, Chip, ClubAvatar, IconButton, SectionHeader, StatusPill } from '../components/ui/core';
import { SearchField } from '../components/ui/inputs';
import { MemberRow, SettingsRow } from '../components/ui/rows';
import { ConnectionBanner, EmptyState, ErrorState, HEADER_BOTTOM, Shimmer, Skeleton } from '../components/ui/states';
import { MENU_TOP, MenuRow, Popover } from '../components/ui/overlays';
import { Message } from '../components/ui/chat';
import { Icon, type IconName } from '../components/Icon';
import { clubs, useClubs } from '../data/clubs';
import { DiscoverRowView } from './auth';
import { useFirstLoad } from './home';
import { ReasonSheet, ReportFormSheet } from './chat';
import { withFreeSlot } from './misc';

type Row = { id: string; name: string; meta: string; art: number; action: 'join' | 'request' | 'joined'; genre?: string };
const SECTIONS: Array<{ title: string; rows: Row[] }> = [
  { title: 'Active right now', rows: [
    { id: 'd-historical', name: 'Historical Narratives', meta: '3.4k members · 89 active', art: 1, action: 'join' },
    { id: 'd-quill', name: 'The Quill Society', meta: 'Private · invitation or request only', art: 2, action: 'request' },
    { id: 'd-clue', name: 'Clue Seekers', meta: '840 members · 22 active', art: 3, action: 'join' },
  ] },
  { title: 'Because you read Mystery', rows: [
    { id: 'd-mystery', name: 'Mystery Novel Enthusiasts', meta: '2.1k members · 120 active', art: 4, action: 'join' },
    { id: 'd-clue2', name: 'Clue Seekers', meta: '840 members · 22 active', art: 5, action: 'join' },
  ] },
  { title: 'Trending this week', rows: [
    { id: 'd-fantasy', name: 'Fantasy World Builders', meta: '5.2k members · 340 active', art: 6, action: 'join' },
    { id: 'd-midnight', name: 'Midnight Readers Club', meta: '2.1k members · 206 active', art: 7, action: 'joined' },
  ] },
];
export const DISCOVER_GENRES = ['All', 'Fiction', 'Poetry', 'Mystery', 'History'];

const CLUB_OF: Record<string, string> = { 'd-historical': 'historical', 'd-quill': 'quill', 'd-clue': 'clue', 'd-clue2': 'clue', 'd-mystery': 'mystery', 'd-fantasy': 'fantasy', 'd-midnight': 'midnight', 'r-habit': 'habit' };

function ClubRow({ r }: { r: Row }) {
  const joined = useClubs((s) => s.joined[r.id]);
  const action = r.action === 'request' ? 'request' : (joined ?? r.action === 'joined') ? 'joined' : 'join';
  return (
    <DiscoverRowView
      name={r.name} meta={r.meta} art={r.art} action={action}
      onClick={() => (action === 'joined' ? nav.push('chat', { club: CLUB_OF[r.id] ?? r.id }) : nav.push('club-preview', { id: r.action === 'request' ? 'private' : 'public' }))}
      onAction={() => (r.action === 'request' ? nav.push('club-preview', { id: 'private' }) : action === 'joined' ? clubs.join(r.id, false) : withFreeSlot(() => clubs.join(r.id, true)))}
    />
  );
}

export function Discover({ params }: { params: Params }) {
  const offline = useApp((s) => s.offline);
  const loadedBefore = useApp((s) => !!s.loaded.discover || !!s.loaded['*']);
  const [failed, setFailed] = useState(!!params.failed || (offline && !loadedBefore));
  const loading = useFirstLoad('discover', params.loading as boolean || failed);
  const [genre, setGenre] = useState('All');
  const header = <AppBar variant="root" title="Discover" />;

  if (failed) {
    return (
      <Screen header={header} tab="discover" bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 16px 60px' }}>
        <ErrorState title="Something went wrong" body="We couldn’t load this. Check your connection and try again." action="Try again"
          onAction={() => { if (!app.get().offline) { app.markLoaded('discover'); setFailed(false); } }} />
      </Screen>
    );
  }
  if (loading) {
    return (
      <Screen header={header} tab="discover" noScroll overlay={<Shimmer top={HEADER_BOTTOM} bottom={102} />}>
        <div className="col" style={{ padding: '16px 16px 0', gap: 12 }}>
          <Skeleton type="card" /><Skeleton type="card" /><Skeleton type="row" /><Skeleton type="row" /><Skeleton type="card" />
        </div>
      </Screen>
    );
  }
  return (
    <Screen header={<>{header}{offline && <ConnectionBanner text="You’re offline. Showing what was saved." />}</>} tab="discover">
      <div className="col" style={{ padding: '12px 16px 16px', gap: 4 }}>
        <button onClick={() => nav.push('search')} style={{ display: 'block', width: '100%' }}>
          <div className="field search" style={{ pointerEvents: 'none' }}>
            <Icon name="MagnifyingGlass" size={20} tone="secondary" />
            <span className="t-body c-tertiary grow">Search by bookclub, book or author</span>
          </div>
        </button>
        <div className="row hscroll" style={{ gap: 8, padding: '12px 0 4px' }}>
          {DISCOVER_GENRES.map((g) => <Chip key={g} label={g} on={genre === g} onClick={() => setGenre(g)} />)}
        </div>
        {SECTIONS.map((s) => (
          <div key={s.title} className="col">
            <SectionHeader title={s.title} link="See all" />
            {s.rows.map((r) => <ClubRow key={r.id} r={r} />)}
          </div>
        ))}
        <SettingsRow label="Channels · coming soon" onClick={() => nav.push('channels')} />
      </div>
    </Screen>
  );
}

/* ——— Search ——— */
type Result = Row & { genres: string[] };
const INDEX: Result[] = [
  { id: 'd-midnight', name: 'Midnight Readers Club', meta: 'Atomic Habits · 2.1k members', art: 1, action: 'joined', genres: ['Non-fiction'] },
  { id: 'r-habit', name: 'Habit Builders', meta: 'Atomic Habits · 640 members', art: 2, action: 'join', genres: ['Non-fiction'] },
  { id: 'd-quill', name: 'The Quill Society', meta: 'Private · invitation or request only', art: 3, action: 'request', genres: ['Non-fiction'] },
];
const OTHER: Result[] = SECTIONS.flatMap((s) => s.rows).filter((r) => r.id !== 'd-midnight' && r.id !== 'd-quill')
  .map((r) => ({ ...r, genres: [r.name.includes('Mystery') || r.name.includes('Clue') ? 'Mystery' : r.name.includes('Historical') ? 'History' : 'Fiction'] }));

export function Search({ params }: { params: Params }) {
  const [q, setQ] = useState((params.q as string) ?? '');
  const [genre, setGenre] = useState((params.genre as string) ?? 'All');
  const [loading, setLoading] = useState(!!params.loading);
  const [shown, setShown] = useState(q);
  useEffect(() => {
    if (params.loading) return;
    if (!q.trim()) { setShown(''); return; }
    setLoading(true);
    const t = setTimeout(() => { setShown(q); setLoading(false); }, 600);
    return () => clearTimeout(t);
  }, [q, params.loading]);
  const term = shown.trim().toLowerCase();
  const all = !term ? [] : [...INDEX, ...OTHER].filter((r) => r.name.toLowerCase().includes(term) || r.meta.toLowerCase().includes(term) || (term.includes('atomic') && INDEX.includes(r)));
  const results = genre === 'All' ? all : all.filter((r) => r.genres.includes(genre));
  return (
    <div className="screen">
      <div style={{ paddingTop: 'var(--inset-top)', background: 'var(--surface-canvas)', flexShrink: 0 }}>
        <div className="row" style={{ padding: '8px 16px', gap: 12 }}>
          <button onClick={() => nav.pop()} aria-label="Back" style={{ display: 'flex' }}><Icon name="CaretLeft" size={24} /></button>
          <SearchField value={q} onChange={setQ} placeholder="Search by bookclub, book or author" autoFocus={!params.q} style={{ flex: 1 }} />
        </div>
        <div className="row hscroll" style={{ padding: '4px 16px 12px', gap: 8, boxShadow: 'inset 0 -1px 0 var(--border-subtle)' }}>
          {DISCOVER_GENRES.map((g) => <Chip key={g} label={g} on={genre === g} onClick={() => setGenre(g)} />)}
        </div>
      </div>
      <div className="screen-body">
        <div className="col" style={{ padding: '12px 16px 16px', gap: 4 }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} type="row" />)
          ) : !term ? null : results.length ? (
            results.map((r) => <ClubRow key={r.id} r={r} />)
          ) : all.length ? (
            <EmptyState icon="MagnifyingGlass" title={`No ${genre} bookclubs match “${shown.trim()}”`} body={`${all.length} bookclub${all.length === 1 ? '' : 's'} in other genres match your search.`}
              action="Show all genres" onAction={() => setGenre('All')} />
          ) : (
            <EmptyState icon="MagnifyingGlass" title={`No bookclubs match “${shown.trim()}”`} body="Try a different title, author or bookclub name."
              action="Create this bookclub" onAction={() => nav.modal('create')} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ——— Bookclub preview ——— */
const PREVIEWS = {
  public: {
    name: 'Midnight Readers Club', art: 1, meta: 'Public · 2.1k members · 120 active now',
    about: 'A slow, close reading club. We take two chapters a week and talk about what stuck — no homework, no pressure to finish first.',
    book: 'Atomic Habits', author: 'James Clear · Non-fiction',
  },
  private: {
    name: 'The Bible Readers', art: 1, meta: 'Private · Invite or request only',
    about: 'A weekly reading group working through the Screwtape Letters, one letter at a time.',
    book: 'The Screwtape Letters', author: 'C.S. Lewis · Faith',
  },
};

export function BookCardView({ title, author }: { title: string; author: string }) {
  return (
    <div className="col fill" style={{ gap: 8 }}>
      <BookCover size="md" title={title} />
      <span className="t-label c-primary">{title}</span>
      <span className="t-caption c-tertiary">{author}</span>
    </div>
  );
}

export function ClubPreview({ params }: { params: Params }) {
  const kind = (params.id as 'public' | 'private') ?? 'public';
  const p = PREVIEWS[kind];
  const requestedStore = useClubs((s) => !!s.requested['bible']);
  const [requested, setRequested] = useState(!!params.requested || requestedStore);
  const [menu, setMenu] = useState(!!params.menu);
  const [sheet, setSheet] = useState<null | 'report' | 'report-else'>(null);
  const [loading, setLoading] = useState(!!params.loading || !app.isLoaded(`preview-${kind}`));
  useEffect(() => {
    if (params.loading || !loading) return;
    const t = setTimeout(() => { app.markLoaded(`preview-${kind}`); setLoading(false); }, 700);
    return () => clearTimeout(t);
  }, [kind, loading, params.loading]);
  useEffect(() => { if (params.requested) clubs.request('bible'); }, [params.requested]);

  const reported = () => { setSheet(null); app.toast('Reported. We’ll review this.', 'success', { bottom: 109 }); };
  return (
    <div className="screen">
      <AppBar actions={<IconButton icon="DotsThree" onClick={() => setMenu(true)} label="More" />} />
      <div className="screen-body">
        {loading ? (
          <div className="col" style={{ padding: '12px 16px 0', gap: 8 }}>
            <Skeleton type="card" /><Skeleton type="message" /><Skeleton type="message" />
          </div>
        ) : (
          <div className="col" style={{ padding: '12px 16px 16px', gap: 8, alignItems: 'center' }}>
            <ClubAvatar art={p.art} size={56} />
            <span className="t-title-s c-secondary tc fill">{p.name}</span>
            <span className="t-caption c-tertiary tc fill">{p.meta}</span>
            <p className="t-body-s c-tertiary fill">{p.about}</p>
            <BookCardView title={p.book} author={p.author} />
            <MemberRow name="Joseph234" initials="JO" type="owner" />
            {kind === 'public' ? (
              <>
                <span className="t-label c-secondary fill">Recent conversation</span>
                <div className="col fill" style={{ opacity: 0.4, pointerEvents: 'none' }}>
                  <Message m={{ id: 'p1', name: 'Amaka', time: '2:09 PM', body: 'I keep coming back to the statues in Chapter 16 — the way he counts them like a rosary.', likes: 24 }} />
                  <Message m={{ id: 'p2', name: 'Tobi', time: '2:14 PM', body: 'That reading hadn’t occurred to me. It reframes the whole second half.', likes: 24 }} />
                </div>
              </>
            ) : (
              <div className="fill" style={{ padding: 12, background: 'var(--surface-canvas)', borderRadius: 8 }}>
                <p className="t-body-s c-tertiary">You’ll be able to read the conversation once the owner approves you.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <PinnedFooter style={{ boxShadow: 'inset 0 1px 0 var(--border-subtle)', gap: 0 }}>
        {kind === 'public' ? (
          <Button full disabled={loading} onClick={() => withFreeSlot(() => nav.replace('chat', { club: 'midnight' }, 'push'))}>Join bookclub</Button>
        ) : requested ? (
          <Button full kind="secondary" disabled>Request sent</Button>
        ) : (
          <Button full disabled={loading} onClick={() => { clubs.request('bible'); setRequested(true); }}>Request to join</Button>
        )}
      </PinnedFooter>
      {menu && (
        <>
          <div className="scrim" onClick={() => setMenu(false)} />
          <Popover style={{ top: MENU_TOP, right: 8, width: 232, padding: 8 }}>
            <MenuRow icon="LinkSimple" label="Share bookclub" onClick={() => { navigator.clipboard?.writeText('page234.com/r/midnight-readers-37488').catch(() => {}); setMenu(false); }} />
            <MenuRow icon="Flag" label="Report bookclub" tone="destructive" onClick={() => { setMenu(false); setSheet('report'); }} />
          </Popover>
        </>
      )}
      {sheet === 'report' && (
        <ReasonSheet title="Why are you reporting this?" subtitle="Only Page234 moderators will see this report." action="Submit report"
          onClose={() => setSheet(null)} onElse={() => setSheet('report-else')} onSubmit={reported} />
      )}
      {sheet === 'report-else' && <ReportFormSheet onClose={() => setSheet(null)} onSubmit={reported} />}
    </div>
  );
}

/* ——— Channels ——— */
const FEATURES: Array<[IconName, string, string]> = [
  ['Megaphone', 'Announcements', 'New releases, book fairs and author tours, straight from the source.'],
  ['CalendarBlank', 'Events', 'Readings and launches you can add to your calendar.'],
  ['ChatsCircle', 'Bookclubs they host', 'Join discussions run by the people who publish and sell the books.'],
];
export function Channels() {
  return (
    <div className="screen">
      <AppBar title="Channels" />
      <div className="screen-body">
        <div className="col" style={{ padding: '24px 16px 32px', gap: 16 }}>
          <div className="col" style={{ gap: 12, alignItems: 'center' }}>
            <span className="col center" style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--action-subtle)' }}>
              <Icon name="Broadcast" weight="fill" size={32} style={{ color: 'var(--action-primary)' }} tone="current" />
            </span>
            <StatusPill kind="neutral" label="Coming soon" />
            <span className="t-title-s c-secondary tc">Follow the people behind the books</span>
            <span className="t-body-s c-tertiary tc">A home on Page234 for publishers, bookstores and authors. Follow them for new releases, readings and the bookclubs they host.</span>
          </div>
          <div className="col">
            <SectionHeader title="What you’ll be able to do" />
            <div className="col" style={{ gap: 16 }}>
              {FEATURES.map(([icon, title, body]) => (
                <div key={title} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <span className="col center" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-sunken)', flexShrink: 0 }}>
                    <Icon name={icon} size={20} />
                  </span>
                  <span className="col grow" style={{ gap: 2 }}>
                    <span className="t-label c-tertiary">{title}</span>
                    <span className="t-caption c-tertiary">{body}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <span className="t-caption c-tertiary">Following channels will come with Premium. We’ll let you know when they open.</span>
          <div className="col">
            <SectionHeader title="Publish or sell books?" />
            <SettingsRow label="Tell us you’d like a channel" onClick={() => nav.push('contact-support')} />
          </div>
        </div>
      </div>
    </div>
  );
}
