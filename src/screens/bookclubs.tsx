import { useState } from 'react';
import { nav, type Params } from '../lib/nav';
import { app, useApp } from '../data/app';
import { AppBar, Screen } from '../components/ui/nav';
import { Chip, FAB, IconButton } from '../components/ui/core';
import { ArchivedRow, BookclubRow } from '../components/ui/rows';
import { ConnectionBanner, EmptyState, HEADER_BOTTOM, Shimmer, Skeleton } from '../components/ui/states';
import { MENU_TOP, MenuRow, Popover } from '../components/ui/overlays';
import { CLUBS, clubs, useClubs } from '../data/clubs';
import { useFirstLoad } from './home';

export function Bookclubs({ params }: { params: Params }) {
  const offline = useApp((s) => s.offline);
  const hasClubs = useApp((s) => s.hasClubs);
  const loading = useFirstLoad('bookclubs', params.loading as boolean);
  const [filter, setFilter] = useState<'all' | 'unread' | 'owned'>('all');
  const [menu, setMenu] = useState(!!params.menu);
  const st = useClubs((s) => s);
  const header = <AppBar variant="root" title="Bookclubs" actions={<IconButton icon="DotsThree" onClick={() => setMenu(true)} label="More" />} />;

  if (loading) {
    return (
      <Screen header={header} tab="bookclubs" noScroll overlay={<Shimmer top={HEADER_BOTTOM} bottom={102} />}>
        <div className="col" style={{ padding: '16px 16px 0', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} type="row" />)}
        </div>
      </Screen>
    );
  }
  if (!hasClubs) {
    return (
      <Screen header={header} tab="bookclubs">
        <div style={{ padding: '12px 16px 0' }}>
          <EmptyState icon="ChatsCircle" title="No bookclubs yet" body="The rooms you join will live here, sorted by what’s active."
            action="Discover bookclubs" onAction={() => app.goTab('discover')} />
        </div>
      </Screen>
    );
  }

  const list = [...st.created.map((c) => ({ ...c })), ...CLUBS]
    .filter((c) => !st.left[c.id])
    .map((c) => ({ ...c, unread: !!c.row.unread && !st.read[c.id] }))
    .filter((c) => (filter === 'unread' ? c.unread : filter === 'owned' ? c.role === 'owner' : true));

  return (
    <Screen
      header={<>{header}{offline && <ConnectionBanner text="You’re offline. Showing what was saved." />}</>}
      tab="bookclubs"
      overlay={
        <>
          <FAB onClick={() => nav.modal('create')} style={{ position: 'absolute', right: 16, bottom: 'calc(102px + 16px)', zIndex: 6 }} />
          {menu && (
            <>
              <div className="scrim" onClick={() => setMenu(false)} />
              <Popover style={{ top: MENU_TOP, right: 8, width: 232, padding: 8 }}>
                <MenuRow icon="Check" label="Mark all as read" onClick={() => { clubs.markAllRead(); app.set({ bookclubsDot: false }); setMenu(false); }} />
                <MenuRow icon="Archive" label="Archived bookclubs" onClick={() => setMenu(false)} />
                <MenuRow icon="Bell" label="Notification settings" onClick={() => { setMenu(false); nav.push('notification-prefs'); }} />
              </Popover>
            </>
          )}
        </>
      }
    >
      <div className="col" style={{ padding: '12px 16px 88px', gap: 4 }}>
        <div className="row" style={{ gap: 8, paddingBottom: 8 }}>
          <Chip label="All" on={filter === 'all'} onClick={() => setFilter('all')} />
          <Chip label="Unread" on={filter === 'unread'} onClick={() => setFilter('unread')} />
          <Chip label="Owned by me" on={filter === 'owned'} onClick={() => setFilter('owned')} />
        </div>
        {filter === 'all' && <ArchivedRow count={1} />}
        {list.map((c) => (
          <BookclubRow
            key={c.id}
            c={{ name: c.name, art: c.art, palette: c.palette, ...c.row, unread: c.unread, muted: !!st.muted[c.id] }}
            onClick={() => nav.push('chat', { club: c.id })}
          />
        ))}
      </div>
    </Screen>
  );
}
