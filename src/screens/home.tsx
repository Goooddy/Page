import { useEffect, useState } from 'react';
import { nav, type Params } from '../lib/nav';
import { app, useApp } from '../data/app';
import { AppBar, Screen } from '../components/ui/nav';
import { Button, IconButton, SectionHeader } from '../components/ui/core';
import { BookclubCard, BookclubRow } from '../components/ui/rows';
import { ConnectionBanner, EmptyState, HEADER_BOTTOM, Shimmer, Skeleton } from '../components/ui/states';
import { Icon, type IconName } from '../components/Icon';
import { clubById, useClubs } from '../data/clubs';

/** Shows the designed skeleton the first time a tab opens in a session. */
export function useFirstLoad(key: string, forced?: boolean, ms = 900) {
  const done = useApp((s) => !!s.loaded[key] || !!s.loaded['*']);
  const [loading, setLoading] = useState(forced || !done);
  useEffect(() => {
    if (forced) return;
    if (done) { setLoading(false); return; }
    const t = setTimeout(() => { app.markLoaded(key); setLoading(false); }, ms);
    return () => clearTimeout(t);
  }, [done, forced, key, ms]);
  return loading;
}

const EVENTS: Array<{ title: string; meta: Array<[IconName, string]>; action: 'join' | 'remind' }> = [
  { title: 'Mystery Book Club', meta: [['Broadcast', 'Started in 5 min'], ['ChatsCircle', 'Page Turners Guild']], action: 'join' },
  { title: 'Chapters 4–6 of Atomic Habits', meta: [['CalendarBlank', 'Tomorrow'], ['Clock', '7:00 PM'], ['ChatsCircle', 'Midnight Readers Club']], action: 'remind' },
  { title: 'Sunset Jazz Hour', meta: [['Broadcast', 'Started 10 min ago'], ['ChatsCircle', 'Blue Note Lounge']], action: 'join' },
  { title: 'Chapter 7: The Role of Environment', meta: [['CalendarBlank', 'Sept 23'], ['Clock', '6:30 PM'], ['ChatsCircle', 'Evening Bookworms']], action: 'remind' },
  { title: 'Late Night Fantasy Talk', meta: [['Broadcast', 'Started 2 min ago'], ['ChatsCircle', 'The Quill Society']], action: 'join' },
  { title: 'Chapter 8: How to Make a Habit Stick', meta: [['CalendarBlank', 'Friday'], ['Clock', '8:00 PM'], ['ChatsCircle', 'Weekend Readers Circle']], action: 'remind' },
];

// Events are in section 13 (on hold), so the cards show but don't open anything.
function EventCard({ e }: { e: (typeof EVENTS)[number] }) {
  return (
    <div className="col" style={{ width: 230, minHeight: 170, flexShrink: 0, padding: 12, gap: 12, background: 'var(--surface-default)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)', borderRadius: 8 }}>
      <div className="col" style={{ gap: 8 }}>
        <span className="t-title-s c-primary">{e.title}</span>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {e.meta.map(([icon, label]) => (
            <span key={label} className="row" style={{ gap: 4 }}>
              <Icon name={icon} weight="fill" size={18} />
              <span className="t-caption c-primary">{label}</span>
            </span>
          ))}
        </div>
      </div>
      <span>
        {e.action === 'join' ? <Button kind="accent" size="sm">Join now</Button> : <Button size="sm">Remind me</Button>}
      </span>
    </div>
  );
}

export function Home({ params }: { params: Params }) {
  const offline = useApp((s) => s.offline);
  const hasClubs = useApp((s) => s.hasClubs);
  const loading = useFirstLoad('home', params.loading as boolean);
  const read = useClubs((s) => s.read);
  const muted = useClubs((s) => s.muted);
  const header = (
    <AppBar variant="root" title="Home" actions={<IconButton icon="MagnifyingGlass" onClick={() => nav.push('search')} label="Search" />} />
  );

  if (loading) {
    return (
      <Screen header={header} tab="home" noScroll overlay={<Shimmer top={HEADER_BOTTOM} bottom={102} />}>
        <div className="col" style={{ padding: '16px 16px 0', gap: 12 }}>
          <Skeleton type="card" /><Skeleton type="card" /><Skeleton type="row" /><Skeleton type="row" /><Skeleton type="card" /><Skeleton type="row" />
        </div>
      </Screen>
    );
  }
  if (!hasClubs) {
    return (
      <Screen header={header} tab="home" bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 40 }}>
        <div style={{ padding: '0 16px' }}>
          <EmptyState icon="SmileyBlank" title="Nothing here yet" body="Join a bookclub and this is where you’ll see what you’ve missed."
            action="Find a bookclub" onAction={() => app.goTab('discover')} link="or start your own" onLink={() => nav.modal('create')} />
        </div>
      </Screen>
    );
  }

  const mid = clubById('midnight');
  const fan = clubById('fantasy');
  return (
    <Screen header={<>{header}{offline && <ConnectionBanner text="You’re offline. Showing what was saved." />}</>} tab="home">
      <div className="col" style={{ padding: '12px 16px 16px', gap: 4 }}>
        <SectionHeader title="Pick up where you left off" />
        <BookclubRow
          c={{ name: mid.name, art: mid.art, palette: mid.palette, time: '2:09 PM', preview: 'Amaka’s message', activity: '24 new replies', badge: 12, unread: !read.midnight, muted: !!muted.midnight }}
          onClick={() => nav.push('chat', { club: 'midnight' })}
        />
        <BookclubRow
          c={{ name: fan.name, art: fan.art, palette: fan.palette, time: '1:40 PM', preview: 'Tobi’s message', activity: '6 new replies', badge: 5, unread: !read.fantasy }}
          onClick={() => nav.push('chat', { club: 'fantasy' })}
        />
        <SectionHeader title="Happening soon" link="See all" />
        <div className="hscroll" style={{ margin: '0 -16px', padding: '0 16px 16px' }}>
          <div className="row" style={{ gap: 12, alignItems: 'stretch', width: 'max-content' }}>
            {EVENTS.map((e) => <EventCard key={e.title} e={e} />)}
          </div>
        </div>
        <SectionHeader title="Rooms you might like" link="See all" onLink={() => app.goTab('discover')} />
        <div className="col" style={{ gap: 8 }}>
          <BookclubCard
            name="Historical Narratives" reading="The Nightingale  · Historical Fiction" art={19} palette="plum" pill="private"
            action="Send Request" actionKind="secondary"
            onClick={() => nav.push('club-preview', { id: 'private' })}
            onAction={() => nav.push('club-preview', { id: 'private', requested: true })}
          />
          <BookclubCard
            name="Poetry Readers" reading="Rupi Kaur Collection · Poetry" art={29} palette="teal" pill="public"
            action="Join"
            onClick={() => nav.push('club-preview', { id: 'public' })}
            onAction={() => nav.push('club-preview', { id: 'public' })}
          />
        </div>
      </div>
    </Screen>
  );
}
