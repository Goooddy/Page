import { useState } from 'react';
import { nav, type Params } from '../lib/nav';
import { app, useApp } from '../data/app';
import { AppBar, PinnedFooter, Screen } from '../components/ui/nav';
import { Button, Chip, ClubAvatar, SectionHeader } from '../components/ui/core';
import { AlertRow, SettingsRow, type AlertData } from '../components/ui/rows';
import { ConnectionBanner, EmptyState, Shimmer, Skeleton } from '../components/ui/states';
import { Icon } from '../components/Icon';
import { createStore, useStoreValue } from '../lib/store';
import { useFirstLoad } from './home';
import { LargeHeader } from './bookclubs';
import { BookCardView } from './discover';

type Alert = AlertData & { initials: string; go?: () => void };

const seedAlerts = (): Alert[] => [
  { id: 'a1', type: 'reply', unread: true, actor: 'Amaka', initials: 'AO', text: 'replied to your message', meta: 'Midnight Readers Club · 30 min ago' },
  { id: 'a2', type: 'invitation', unread: true, actor: 'Joseph234', initials: 'JO', text: 'invited you to The Bible Readers', meta: '1 hour ago' },
  { id: 'a3', type: 'mention', unread: true, initials: 'FA', text: 'Femi mentioned you', meta: 'The Quill Society · 2 hours ago' },
  { id: 'a4', type: 'request', actor: 'kemi_reads', initials: 'KR', text: 'asked to join Midnight Readers Club', meta: '3 hours ago' },
  { id: 'a5', type: 'moderation', initials: '', text: 'Your message was removed from Clue Seekers', meta: 'Yesterday · Tap to see why' },
  { id: 'a6', type: 'reply', actor: 'Tobi', initials: 'TA', text: 'replied to your message', meta: 'Fantasy World Builders · Monday' },
  { id: 'a7', type: 'resolved', initials: 'PS', text: 'You joined Poetry on Sundays', meta: 'Monday' },
];
// "Alerts — replies and mentions": thread replies and mentions arrive as alerts too.
const repliesAlerts = (): Alert[] => [
  { id: 'b1', type: 'reply', unread: true, actor: 'Tobi', initials: 'TA', text: 'replied to your message', meta: 'Midnight Readers Club · 2 min ago' },
  { id: 'a2', type: 'invitation', unread: true, actor: 'Joseph234', initials: 'JO', text: 'invited you to The Bible Readers', meta: '1 hour ago' },
  { id: 'b3', type: 'mention', unread: true, initials: 'AO', text: 'Amaka mentioned you', meta: 'Midnight Readers Club · 12 min ago' },
  { id: 'a4', type: 'request', actor: 'kemi_reads', initials: 'KR', text: 'asked to join Midnight Readers Club', meta: '3 hours ago' },
  { id: 'a5', type: 'moderation', initials: '', text: 'Your message was removed from Clue Seekers', meta: 'Yesterday · Tap to see why' },
  { id: 'b6', type: 'reply', actor: 'Kemi', initials: 'KE', text: 'replied to your message in a thread', meta: 'Midnight Readers Club · 1 hr ago' },
  { id: 'b7', type: 'mention', initials: 'FE', text: 'Femi mentioned you in a thread', meta: 'Clue Seekers · 3 hr ago' },
];

export const alertsStore = createStore<{ list: Alert[]; invitation: 'open' | 'accepted' | 'declined' }>({ list: seedAlerts(), invitation: 'open' });
const useAlerts = <R,>(sel: (s: { list: Alert[]; invitation: 'open' | 'accepted' | 'declined' }) => R) => useStoreValue(alertsStore, sel);
const syncBadge = () => app.set({ alertsBadge: alertsStore.get().list.filter((a) => a.unread).length });
export const alerts = {
  reset(variant?: 'replies') { alertsStore.set({ list: variant === 'replies' ? repliesAlerts() : seedAlerts(), invitation: 'open' }); syncBadge(); },
  read(id: string) { alertsStore.set((s) => ({ list: s.list.map((a) => (a.id === id ? { ...a, unread: false } : a)) })); syncBadge(); },
  readAll() { alertsStore.set((s) => ({ list: s.list.map((a) => ({ ...a, unread: false })) })); syncBadge(); },
  patch(id: string, p: Partial<Alert>) { alertsStore.set((s) => ({ list: s.list.map((a) => (a.id === id ? { ...a, ...p } : a)) })); syncBadge(); },
  remove(id: string) { alertsStore.set((s) => ({ list: s.list.filter((a) => a.id !== id) })); syncBadge(); },
  acceptInvite() { alertsStore.set({ invitation: 'accepted' }); alerts.patch('a2', { type: 'resolved', unread: false, text: 'You joined The Bible Readers', meta: '1 hour ago' }); },
  declineInvite() { alertsStore.set({ invitation: 'declined' }); alerts.remove('a2'); },
};

function open(a: Alert) {
  alerts.read(a.id);
  if (a.type === 'invitation') return nav.push('invitation');
  if (a.type === 'moderation') return nav.push('moderation', { kind: 'content' });
  if (a.id === 'a1' || a.id === 'b1' || a.id === 'b6') return nav.push('thread', { club: 'midnight', cold: true });
  if (a.id === 'a3') return nav.push('chat', { club: 'quill' });
  if (a.id === 'b3') return nav.push('chat', { club: 'midnight' });
  if (a.id === 'b7') return nav.push('chat', { club: 'clue' });
  if (a.id === 'a6') return nav.push('chat', { club: 'fantasy' });
  if (a.id === 'a7') return nav.push('chat', { club: 'poetry-sundays' });
  if (a.id === 'a2') return nav.push('chat', { club: 'bible' });
}

export function Alerts({ params }: { params: Params }) {
  const offline = useApp((s) => s.offline);
  const loading = useFirstLoad('alerts', params.loading as boolean);
  const list = useAlerts((s) => s.list);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const anyUnread = list.some((a) => a.unread);
  const header = <LargeHeader title="Alerts" textAction={anyUnread || params.markable ? { label: 'Mark all read', onClick: alerts.readAll } : undefined} />;

  if (loading) {
    return (
      <Screen header={<LargeHeader title="Alerts" />} tab="alerts" noScroll overlay={<Shimmer top={138} bottom={102} />}>
        <div className="col" style={{ padding: '16px 16px 0', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} type="message" />)}
        </div>
      </Screen>
    );
  }
  const shown = filter === 'unread' ? list.filter((a) => a.unread) : list;
  return (
    <Screen header={<>{header}{offline && <ConnectionBanner text="You’re offline. Showing what was saved." />}</>} tab="alerts">
      <div className="col" style={{ paddingTop: 12, gap: 4 }}>
        {list.length === 0 ? (
          <EmptyState icon="Bell" title="You’re all caught up" body="Replies, mentions and invitations will show up here." />
        ) : (
          <>
            <div className="row" style={{ padding: '0 16px 8px', gap: 8 }}>
              <Chip label="All" on={filter === 'all'} onClick={() => setFilter('all')} />
              <Chip label="Unread" on={filter === 'unread'} onClick={() => setFilter('unread')} />
            </div>
            {shown.length === 0 ? (
              <EmptyState icon="Bell" title="You’re all caught up" body="Replies, mentions and invitations will show up here." />
            ) : (
              <div className="col" style={{ gap: 1, background: 'var(--border-subtle)' }}>
                {shown.map((a) => (
                  <AlertRow
                    key={a.id}
                    a={a}
                    onClick={() => open(a)}
                    onAccept={() => {
                      if (a.type === 'invitation') { alerts.acceptInvite(); nav.push('chat', { club: 'bible' }); }
                      else alerts.patch(a.id, { type: 'resolved', unread: false, text: `You approved ${a.actor}`, meta: a.meta });
                    }}
                    onDecline={() => (a.type === 'invitation' ? alerts.declineInvite() : alerts.remove(a.id))}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Screen>
  );
}

/* ——— Invitation received ——— */
export function InvitationReceived({ params }: { params: Params }) {
  const state = useAlerts((s) => s.invitation);
  const gone = !!params.gone || state !== 'open';
  return (
    <div className="screen">
      <AppBar backIcon="X" />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 16px', gap: 8, alignItems: 'center' }}>
          <ClubAvatar art={1} size={56} />
          <span className="t-caption c-tertiary tc fill">Joseph234 invited you to</span>
          <span className="t-title-s c-secondary tc fill">The Bible Readers</span>
          <span className="t-caption c-tertiary tc fill">Private · 24 members</span>
          <BookCardView title="The Screwtape Letters" author="C.S. Lewis · Faith" />
          <p className="t-body-s c-tertiary tc fill">
            {gone ? 'This invitation is no longer available. It may have been withdrawn, or you already responded on another device.' : 'You’ll be able to read the conversation once you join.'}
          </p>
        </div>
      </div>
      <PinnedFooter style={{ gap: 8 }}>
        {gone ? (
          <Button full kind="secondary" onClick={() => nav.pop()}>Close</Button>
        ) : (
          <>
            <Button full onClick={() => { alerts.acceptInvite(); nav.replace('chat', { club: 'bible' }, 'push'); }}>Accept invitation</Button>
            <Button full kind="secondary" onClick={() => { alerts.declineInvite(); nav.pop(); }}>Decline</Button>
          </>
        )}
      </PinnedFooter>
    </div>
  );
}

/* ——— Moderation reasons ——— */
export function ModerationReason({ params }: { params: Params }) {
  const content = params.kind !== 'removed';
  const Rule = ({ title, body }: { title: string; body: string }) => (
    <div className="row" style={{ gap: 8, paddingBottom: 12, alignItems: 'flex-start' }}>
      <Icon name="ShieldCheck" size={20} tone="secondary" />
      <span className="col grow" style={{ gap: 2 }}>
        <span className="t-label c-secondary">{title}</span>
        <span className="t-caption c-tertiary">{body}</span>
      </span>
    </div>
  );
  return (
    <div className="screen">
      <AppBar title={content ? 'Content removed' : 'Removed from bookclub'} />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 24px' }}>
          <div className="col" style={{ paddingBottom: 8, gap: 4 }}>
            <span className="t-title-s c-secondary">{content ? 'Your message was removed from Clue Seekers' : 'You were removed from Clue Seekers'}</span>
            <span className="t-caption c-tertiary">{content ? 'Yesterday, 4:12 PM' : 'Yesterday, 4:20 PM'}</span>
          </div>
          {content && (
            <>
              <SectionHeader title="What was removed" />
              <div className="col" style={{ padding: 12, gap: 4, background: 'var(--surface-sunken)', borderRadius: 8 }}>
                <span className="t-body-s c-tertiary">Found a free copy here if anyone wants it — link in my bio, just search my name on that site.</span>
              </div>
            </>
          )}
          <SectionHeader title="Why" />
          {content ? (
            <Rule title="External links aren’t allowed" body="Page234 doesn’t permit links to other websites. This keeps conversations on the platform and protects against spam." />
          ) : (
            <Rule title="Repeated off-topic posting" body="The owner of a bookclub can remove members from their own room. Page234 administrators were not involved." />
          )}
          <SettingsRow label="Removed by" value="The bookclub owner" chevron={false} />
          {content ? <SettingsRow label="Your account" value="In good standing" chevron={false} /> : <SettingsRow label="Can you rejoin?" value="Yes, it’s public" chevron={false} />}
          <div style={{ paddingTop: 20 }}>
            {content ? (
              <Button full kind="secondary" onClick={() => nav.push('content-rules')}>Read the content rules</Button>
            ) : (
              <Button full kind="secondary" onClick={() => nav.push('club-preview', { id: 'public' })}>Open the bookclub</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
