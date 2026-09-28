import { useEffect, useState } from 'react';
import { nav, type Params } from '../lib/nav';
import { app } from '../data/app';
import { AppBar, ModalHeader, PinnedFooter } from '../components/ui/nav';
import { Button, Chip, ClubAvatar, IconButton, SectionHeader, SelectionCard, type Palette } from '../components/ui/core';
import { SearchField, SelectField, TextArea, TextField } from '../components/ui/inputs';
import { AvatarPickerCell, Hairline, MemberRow, PreferenceRow, SelectedBook, SettingsRow } from '../components/ui/rows';
import { Dialog, MenuRow, Sheet, SheetTitle } from '../components/ui/overlays';
import { Icon } from '../components/Icon';
import { clubById, clubs, useClubs } from '../data/clubs';
import { ReasonSheet, ReportFormSheet } from './chat';
import { GenreSheet } from './create';

export const PICKER_PALETTES: Palette[] = ['rose', 'plum', 'forest', 'teal', 'indigo', 'clay'];
export const paletteFor = (art: number) => PICKER_PALETTES[(art - 1) % 6];

/* ——— Bookclub information ——— */
export function ClubInfo({ params }: { params: Params }) {
  const clubId = (params.club as string) ?? 'midnight';
  const club = clubById(clubId);
  const owner = params.member ? false : club.role === 'owner';
  const muted = useClubs((s) => s.muted[clubId]);
  const [showInSearch, setShowInSearch] = useState(true);
  const [dialog, setDialog] = useState<null | 'leave' | 'remove'>((params.dialog as never) ?? null);
  const [removing, setRemoving] = useState('hcao');
  const [sheet, setSheet] = useState<null | 'mute' | 'report' | 'report-else'>(null);
  const reported = () => { setSheet(null); app.toast('Reported. We’ll review this.', 'success', { bottom: 46 }); };

  return (
    <div className="screen">
      <AppBar title="Bookclub info" />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 24px' }}>
          <div className="col" style={{ paddingBottom: 16, gap: 4, alignItems: 'center' }}>
            <span style={{ width: 80, height: 80, display: 'flex' }}>
              <span style={{ transform: 'scale(1.4286)', transformOrigin: 'top left', display: 'flex' }}>
                <ClubAvatar art={club.art} palette={club.palette} size={56} />
              </span>
            </span>
            <span className="t-title-s c-secondary tc">{club.name}</span>
            <span className="t-caption c-tertiary tc">{club.isPrivate ? 'Private' : 'Public'} · 206 members</span>
          </div>
          <p className="t-body-s c-tertiary tc">A slow read of one book at a time. Chapters, not spoilers — say where you are before you say what you think.</p>
          <div className="row" style={{ padding: '16px 0', gap: 8 }}>
            <span className="grow" style={{ display: 'flex' }}><Button full size="sm" kind="secondary" onClick={() => nav.modal('invite', { club: clubId, member: !owner })}>Invite</Button></span>
            <span className="grow" style={{ display: 'flex' }}><Button full size="sm" kind="secondary" onClick={() => navigator.clipboard?.writeText('page234.com/r/midnight-readers-37488').catch(() => {})}>Share</Button></span>
            <span className="grow" style={{ display: 'flex' }}><Button full size="sm" kind="secondary" onClick={() => (muted ? clubs.unmute(clubId) : setSheet('mute'))}>{muted ? 'Unmute' : 'Mute'}</Button></span>
          </div>
          <div className="col" style={{ padding: '12px 16px', gap: 2, background: 'var(--surface-default)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)', borderRadius: 8 }}>
            <span className="t-label-s c-tertiary">Reading</span>
            <span className="t-label c-secondary">The Journey to my Village</span>
            <span className="t-caption c-tertiary">Smith White · Fiction</span>
          </div>
          <SectionHeader title="Members" link="See all 206" onLink={owner ? () => nav.push('members', { club: clubId }) : undefined} />
          <MemberRow name="Joseph234" initials="JO" type="owner" />
          <MemberRow name="hcao" initials="HC" onMore={owner ? () => { setRemoving('hcao'); setDialog('remove'); } : undefined} />
          <MemberRow name="lebatramkol" initials="LB" onMore={owner ? () => { setRemoving('lebatramkol'); setDialog('remove'); } : undefined} />
          {owner && (
            <>
              <Hairline />
              <SettingsRow label="Edit bookclub" onClick={() => nav.modal('edit-club', { club: clubId })} />
              <SettingsRow label="Manage members" onClick={() => nav.push('members', { club: clubId })} />
              <SettingsRow label="Archive bookclub" />
              <PreferenceRow label="Show in search and recommendations" desc="Owner only" on={showInSearch} onChange={setShowInSearch} />
            </>
          )}
          <Hairline />
          <SettingsRow label="Leave bookclub" destructive onClick={() => setDialog('leave')} />
          <SettingsRow label="Report bookclub" destructive onClick={() => setSheet('report')} />
        </div>
      </div>
      {sheet === 'mute' && <MuteSheet clubId={clubId} name={club.name} onClose={() => setSheet(null)} />}
      {sheet === 'report' && <ReasonSheet title="Why are you reporting this?" subtitle="Only Page234 moderators will see this report." action="Submit report" onClose={() => setSheet(null)} onElse={() => setSheet('report-else')} onSubmit={reported} />}
      {sheet === 'report-else' && <ReportFormSheet onClose={() => setSheet(null)} onSubmit={reported} />}
      {dialog === 'leave' && (
        <Dialog title="Leave this bookclub?" body={`You’ll stop receiving alerts from ${club.name}. You can rejoin any time.`} confirm="Leave"
          onCancel={() => setDialog(null)} onConfirm={() => { clubs.leave(clubId); setDialog(null); app.goTab('bookclubs'); }} />
      )}
      {dialog === 'remove' && (
        <Dialog title={`Remove ${removing}?`} body="They’ll lose access to this bookclub and will be told they were removed." confirm="Remove"
          onCancel={() => setDialog(null)} onConfirm={() => setDialog(null)} />
      )}
    </div>
  );
}

export function MuteSheet({ clubId, name, onClose }: { clubId: string; name: string; onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <SheetTitle title={`Mute ${name}?`} subtitle="No phone alerts from it. Replies and mentions still show in Alerts." />
      <div className="col fill" style={{ paddingBottom: 8 }}>
        {[['For 8 hours', 'Muted for 8 hours'], ['For a week', 'Muted for a week'], ['Until I turn it back on', 'Muted until you turn it back on']].map(([label, toast]) => (
          <MenuRow key={label} label={label} tone="choice" onClick={() => {
            clubs.mute(clubId, label);
            onClose();
            app.toast(toast, 'success', { bottom: 46, action: { label: 'Undo', run: () => clubs.unmute(clubId) } });
          }} />
        ))}
      </div>
    </Sheet>
  );
}

/* ——— Manage members / member search ——— */
type Person = { name: string; initials: string; type: 'member' | 'owner' | 'request'; meta?: string };
const REQUESTS: Person[] = [
  { name: 'kemi_reads', initials: 'K', type: 'request', meta: 'Requested 2 hours ago' },
  { name: 'bookish_ade', initials: 'B', type: 'request', meta: 'Requested yesterday' },
];
const MEMBERS: Person[] = [
  { name: 'Joseph234', initials: 'J', type: 'owner' },
  { name: 'hcao', initials: 'H', type: 'member' },
  { name: 'lebatramkol', initials: 'L', type: 'member' },
  { name: 'amaka', initials: 'A', type: 'member' },
];
const SEARCH_POOL: Person[] = [
  { name: 'bookish_ade', initials: 'AD', type: 'member' },
  { name: 'adeola_reads', initials: 'AE', type: 'member' },
  { name: 'ade_ng', initials: 'AN', type: 'request', meta: 'Requested yesterday' },
  { name: 'hcao', initials: 'HC', type: 'member' },
  { name: 'lebatramkol', initials: 'LB', type: 'member' },
  { name: 'amaka', initials: 'AM', type: 'member' },
  { name: 'kemi_reads', initials: 'KR', type: 'request', meta: 'Requested 2 hours ago' },
];

export function ManageMembers({ params }: { params: Params }) {
  const [requests, setRequests] = useState(REQUESTS);
  const [members, setMembers] = useState(MEMBERS);
  const [count, setCount] = useState(206);
  const [removing, setRemoving] = useState<string | null>((params.remove as string) ?? null);
  return (
    <div className="screen">
      <AppBar title="Members" actions={<IconButton icon="MagnifyingGlass" onClick={() => nav.push('member-search')} label="Search members" />} />
      <div className="screen-body">
        <div className="col" style={{ padding: '12px 16px 16px', gap: 4 }}>
          {requests.length > 0 && (
            <>
              <SectionHeader title="Requests to join" />
              {requests.map((r) => (
                <MemberRow key={r.name} {...r}
                  onApprove={() => { setRequests((x) => x.filter((y) => y.name !== r.name)); setMembers((m) => [m[0], { ...r, type: 'member' }, ...m.slice(1)]); setCount((c) => c + 1); }}
                  onDecline={() => setRequests((x) => x.filter((y) => y.name !== r.name))} />
              ))}
            </>
          )}
          <SectionHeader title={`${count} members`} />
          {members.map((m) => <MemberRow key={m.name} {...m} onMore={() => setRemoving(m.name)} />)}
        </div>
      </div>
      {removing && (
        <Dialog title={`Remove ${removing}?`} body="They’ll lose access to this bookclub and will be told they were removed." confirm="Remove"
          onCancel={() => setRemoving(null)}
          onConfirm={() => { setMembers((m) => m.filter((x) => x.name !== removing)); setCount((c) => c - 1); setRemoving(null); }} />
      )}
    </div>
  );
}

export function MemberSearch({ params }: { params: Params }) {
  const [q, setQ] = useState((params.q as string) ?? 'ade');
  const [gone, setGone] = useState<string[]>([]);
  const res = q.trim() ? SEARCH_POOL.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()) && !gone.includes(p.name)) : [];
  return (
    <div className="screen">
      <div style={{ paddingTop: 'var(--inset-top)', flexShrink: 0 }}>
        <div className="row" style={{ padding: '8px 16px', gap: 12 }}>
          <button onClick={() => nav.pop()} aria-label="Back" style={{ display: 'flex' }}><Icon name="CaretLeft" size={24} /></button>
          <SearchField value={q} onChange={setQ} placeholder="Search members" autoFocus style={{ flex: 1 }} />
        </div>
      </div>
      <div className="screen-body">
        <div className="col" style={{ padding: '12px 16px 16px', gap: 4 }}>
          {q.trim() && <SectionHeader title={`${res.length} member${res.length === 1 ? '' : 's'}`} />}
          {res.map((p) => <MemberRow key={p.name} {...p} onApprove={() => setGone((g) => [...g, p.name])} onDecline={() => setGone((g) => [...g, p.name])} />)}
        </div>
      </div>
    </div>
  );
}

/* ——— Invite people ——— */
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export function InviteBlock({ owner, emails, setEmails, onSent, intro }: {
  owner: boolean; emails: string[]; setEmails: (f: (e: string[]) => string[]) => void; onSent: () => void; intro: { title: string; body: string };
}) {
  const [link, setLink] = useState('page234.com/r/midnight-readers-37488');
  const [draft, setDraft] = useState('');
  const add = () => { if (isEmail(draft)) { setEmails((e) => (e.includes(draft.trim()) ? e : [...e, draft.trim()])); setDraft(''); } };
  return (
    <div className="col" style={{ padding: '16px 16px 24px', gap: 8 }}>
      <span className="t-title-s c-secondary">{intro.title}</span>
      <span className="t-body-s c-tertiary">{intro.body}</span>
      <div className="col" style={{ padding: 12, gap: 8, background: 'var(--surface-sunken)', borderRadius: 8 }}>
        <span className="t-caption c-tertiary">Invitation link</span>
        <span className="t-label c-secondary">{link}</span>
        <div className="row" style={{ gap: 8 }}>
          <span className="grow" style={{ display: 'flex' }}><Button full size="sm" onClick={() => { if (navigator.share) navigator.share({ url: `https://${link}` }).catch(() => {}); else navigator.clipboard?.writeText(link).catch(() => {}); }}>Share</Button></span>
          <span className="grow" style={{ display: 'flex' }}><Button full size="sm" kind="secondary" onClick={() => navigator.clipboard?.writeText(link).catch(() => {})}>Copy</Button></span>
          {owner && <span className="grow" style={{ display: 'flex' }}><Button full size="sm" kind="secondary" onClick={() => setLink(`page234.com/r/midnight-readers-${Math.floor(10000 + Math.random() * 89999)}`)}>Reset</Button></span>}
        </div>
      </div>
      <span className="t-caption c-tertiary tc">or invite by email</span>
      <TextField label="Email address" type="email" value={draft} onChange={setDraft} placeholder="name@example.com" onEnter={add}
        trailing={isEmail(draft) ? <button className="t-label c-link" onClick={add}>Add</button> : undefined} />
      {emails.length > 0 && (
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {emails.map((e) => <Chip key={e} label={e} on removable onRemove={() => setEmails((x) => x.filter((y) => y !== e))} />)}
        </div>
      )}
      <Button full kind="secondary" disabled={!emails.length} onClick={onSent}>Send invitations</Button>
    </div>
  );
}

export function InvitePeople({ params }: { params: Params }) {
  const club = clubById((params.club as string) ?? 'midnight');
  const owner = params.member ? false : club.role === 'owner';
  const [emails, setEmails] = useState<string[]>((params.emails as string[]) ?? []);
  useEffect(() => { if (params.sent) app.toast('Invitations sent to 2 people', 'success', { bottom: 50 }); }, [params.sent]);
  return (
    <div className="screen">
      <ModalHeader title="Invite people" step={club.name} />
      <div className="screen-body">
        <InviteBlock
          owner={owner}
          emails={emails}
          setEmails={setEmails}
          intro={{ title: `Invite people to ${club.name}`, body: owner ? 'Anyone with this link can join. Reset it to stop an old link working.' : 'Anyone with this link can join this bookclub.' }}
          onSent={() => { app.toast(`Invitations sent to ${emails.length} ${emails.length === 1 ? 'person' : 'people'}`, 'success', { bottom: 50 }); setEmails(() => []); }}
        />
      </div>
    </div>
  );
}

/* ——— Edit bookclub ——— */
export function AvatarGrid({ art, onPick }: { art: number; onPick: (n: number) => void }) {
  return (
    <div className="hscroll" style={{ height: 228, overflowY: 'auto', overflowX: 'hidden', boxShadow: 'inset 0 0 0 1px var(--border-subtle)', borderRadius: 12 }}>
      <div style={{ padding: 8, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, justifyItems: 'center' }}>
        {Array.from({ length: 35 }, (_, i) => i + 1).map((n) => (
          <AvatarPickerCell key={n} art={n} palette={paletteFor(n)} selected={art === n} onClick={() => onPick(n)} size={71} />
        ))}
      </div>
    </div>
  );
}

export function EditClub({ params }: { params: Params }) {
  const club = clubById((params.club as string) ?? 'midnight');
  const wasPrivate = !!params.wasPrivate || !!club.isPrivate;
  const initial = { name: club.name, about: 'A slow read of one book at a time. Chapters, not spoilers — say where you are before you say what you think.', author: 'Smith White', genre: 'Fiction', art: club.art, pub: !wasPrivate };
  const [f, setF] = useState({ ...initial, pub: params.wasPrivate ? true : initial.pub });
  const [genreSheet, setGenreSheet] = useState(false);
  const changed = JSON.stringify(f) !== JSON.stringify(initial);
  return (
    <div className="screen">
      <ModalHeader title="Edit bookclub" step={club.name} />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 24px', gap: 12 }}>
          <TextField label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v.slice(0, 50) })} placeholder="e.g. Midnight Readers Club" counter={`${f.name.length} / 50`} />
          <TextArea label="What’s it about?" value={f.about} onChange={(v) => setF({ ...f, about: v })} helper="Optional" max={200} />
          <span className="t-label c-secondary">Book</span>
          <SelectedBook title="The Journey to my Village" author="Smith White · Fiction" cover="THE JOURNEY" />
          <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
            <div className="grow"><TextField label="Author" value={f.author} onChange={(v) => setF({ ...f, author: v })} placeholder="e.g. The Diary of the Sun" /></div>
            <div className="grow"><SelectField label="Genre" value={f.genre} placeholder="Choose a genre" helper="Change it if that’s not right." onClick={() => setGenreSheet(true)} /></div>
          </div>
          <SectionHeader title="Choose an avatar" />
          <AvatarGrid art={f.art} onPick={(n) => setF({ ...f, art: n })} />
          <SectionHeader title="Who can join?" />
          <SelectionCard icon="Globe" title="Public" desc="Anyone can find this bookclub and join it." on={f.pub} onClick={() => setF({ ...f, pub: true })} />
          <SelectionCard icon="LockSimple" title="Private" desc="Only people you invite or approve can join." on={!f.pub} onClick={() => setF({ ...f, pub: false })} />
          {wasPrivate && f.pub && (
            <div className="row" style={{ padding: 12, gap: 8, background: 'var(--surface-sunken)', borderRadius: 8, alignItems: 'flex-start' }}>
              <Icon name="Info" size={18} />
              <span className="t-caption c-tertiary grow">Anyone will be able to find this bookclub and read its past conversation. Current members stay.</span>
            </div>
          )}
        </div>
      </div>
      <PinnedFooter style={{ boxShadow: 'inset 0 1px 0 var(--border-subtle)', gap: 4 }}>
        <Button full disabled={!changed} onClick={() => nav.pop()}>Save changes</Button>
      </PinnedFooter>
      {genreSheet && <GenreSheet value={f.genre} onPick={(g) => { setF({ ...f, genre: g }); setGenreSheet(false); }} onClose={() => setGenreSheet(false)} />}
    </div>
  );
}
