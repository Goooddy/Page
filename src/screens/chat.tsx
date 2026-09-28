import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { nav, type Params } from '../lib/nav';
import { app, useApp } from '../data/app';
import { chat, chatStore, getChat, useChat } from '../data/chat';
import { clubById, clubs, useClubs } from '../data/clubs';
import {
  CatchUpStrip, JumpToLatest, Message, ReactionRow, SelectRow, SelectionBar, ThreadHeader, isMsg,
  type ChatItem, type ChatMsg, type SelAction,
} from '../components/ui/chat';
import { Divider, Button, CheckboxRow } from '../components/ui/core';
import { MessageComposer, MentionPicker, TextArea, type MentionOption } from '../components/ui/inputs';
import { ConnectionBanner, EmptyState, Skeleton } from '../components/ui/states';
import { ACTION_MENU_TOP, Dialog, MENU_TOP, MenuRow, Popover, Sheet, SheetTitle } from '../components/ui/overlays';

export const MENTIONS: MentionOption[] = [
  { name: 'Tobi Adeyemi', username: '@tobi', initials: 'TA' },
  { name: 'Temi Okafor', username: '@temi_reads', initials: 'TO' },
  { name: 'Tunde Bello', username: '@tundeb', initials: 'TB' },
];
const LINK = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|org|net|ng|io|co|me|app)\b/i;
export const REASONS = ['Spam or advertising', 'Harassment or abuse', 'Pirated or copyrighted material', 'External link'];

export function mentionQuery(text: string) {
  const m = text.match(/(^|\s)@(\w*)$/);
  return m ? m[2].toLowerCase() : null;
}

/* ——— Report / remove sheets (shared by Chat and Thread) ——— */
export function ReasonSheet({ title, subtitle, action, danger, onSubmit, onElse, onClose, initial = [] }: {
  title: string; subtitle: string; action: string; danger?: boolean; onSubmit: () => void; onElse: () => void; onClose: () => void; initial?: string[];
}) {
  const [picked, setPicked] = useState<string[]>(initial);
  return (
    <Sheet onClose={onClose}>
      <SheetTitle title={title} subtitle={subtitle} />
      <div className="col fill" style={{ padding: '4px 16px', gap: 4 }}>
        {REASONS.map((r) => (
          <CheckboxRow key={r} label={r} on={picked.includes(r)} onChange={(v) => setPicked((p) => (v ? [...p, r] : p.filter((x) => x !== r)))} />
        ))}
        <MenuRow label="Something else" tone="choice" chevron onClick={onElse} style={{ padding: '16px 0' }} />
        <Button full kind={danger ? 'danger' : 'primary'} disabled={!picked.length} onClick={onSubmit}>{action}</Button>
      </div>
    </Sheet>
  );
}

export function ReportFormSheet({ onSubmit, onClose }: { onSubmit: () => void; onClose: () => void }) {
  const [text, setText] = useState('');
  return (
    <Sheet onClose={onClose}>
      <SheetTitle title="Tell us what’s wrong" subtitle="Only Page234 moderators will see this." />
      <div className="col fill" style={{ padding: '8px 16px', gap: 16 }}>
        <TextArea label="What happened?" placeholder="Describe the problem…" helper="A sentence is enough." max={200} value={text} onChange={setText} autoFocus />
        <Button full disabled={!text.trim()} onClick={onSubmit}>Submit report</Button>
      </div>
    </Sheet>
  );
}

type Sheet = null | 'report' | 'report-else' | 'mute' | 'remove' | 'remove-else';
type DialogKind = null | 'leave' | 'delete-one' | 'delete-many';

export function Chat({ params }: { params: Params }) {
  const clubId = (params.club as string) ?? 'midnight';
  const club = clubById(clubId);
  const offline = useApp((s) => s.offline);
  const seed = useMemo(() => getChat(clubId), [clubId]);
  const items = useChat((s) => s.chats[clubId]) ?? seed;
  const catchupHidden = useChat((s) => !!s.catchupHidden[clubId]);
  const muted = useClubs((s) => s.muted[clubId]);
  const isOwner = club.role === 'owner' || clubId.startsWith('new-');
  const isPrivateMember = !!club.isPrivate && !isOwner;

  const isNew = clubId.startsWith('new-');
  const [loading, setLoading] = useState(!!params.loading || (!isNew && !app.isLoaded(`chat-${clubId}`)));
  const [draft, setDraft] = useState((params.draft as string) ?? '');
  const [replyTo, setReplyTo] = useState<string | null>((params.replyTo as string) ?? null);
  const [editing, setEditing] = useState<string | null>((params.editing as string) ?? null);
  const [sel, setSel] = useState<string[]>((params.select as string[]) ?? []);
  const [menu, setMenu] = useState(!!params.menu);
  const [more, setMore] = useState(!!params.more);
  const [sheet, setSheet] = useState<Sheet>((params.sheet as Sheet) ?? null);
  const [dialog, setDialog] = useState<DialogKind>((params.dialog as DialogKind) ?? null);
  const [atBottom, setAtBottom] = useState(false);
  // Jump to latest shows only the first time this chat is opened, and goes for good once tapped.
  const firstVisit = useRef(!chatStore.get().visited[clubId]);
  const jumped = useChat((s) => !!s.jumped[clubId]);
  useEffect(() => { chat.markVisited(clubId); }, [clubId]);
  const [target, setTarget] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const screenRef = useRef<HTMLDivElement>(null);
  const [rxTop, setRxTop] = useState<number | null>(null);

  useEffect(() => {
    clubs.markRead(clubId);
    if (params.loading) return;
    if (!loading) return;
    const t = setTimeout(() => { app.markLoaded(`chat-${clubId}`); setLoading(false); }, 800);
    return () => clearTimeout(t);
  }, [clubId, loading, params.loading]);

  useEffect(() => {
    if (params.toast === 'reported') app.toast('Reported. We’ll review this.', 'success', { bottom: 80 });
    if (params.toast === 'muted') app.toast('Muted for 8 hours', 'success', { bottom: 100, action: { label: 'Undo', run: () => clubs.unmute(clubId) } });
    if (params.toast === 'removed') app.toast('Message removed. Amaka will see why.', 'success', { bottom: 100 });
    return () => app.hideToast();
  }, [params.toast, clubId]);

  const msgs = items.filter(isMsg);
  const byId = (id: string) => msgs.find((m) => m.id === id);
  const selMsgs = sel.map(byId).filter(Boolean) as ChatMsg[];
  const selecting = sel.length > 0;
  const one = selMsgs.length === 1 ? selMsgs[0] : null;

  const actions: SelAction[] = useMemo(() => {
    if (!selMsgs.length) return [];
    if (one) return one.you || isOwner ? ['reply', 'thread', 'copy', 'delete', 'more'] : ['reply', 'thread', 'copy', 'more'];
    return selMsgs.every((m) => m.you) ? ['copy', 'delete'] : ['copy'];
  }, [selMsgs, one, isOwner]);

  // Position the reaction row just above the single selected message.
  useLayoutEffect(() => {
    if (!one) { setRxTop(null); return; }
    const row = rowRefs.current[one.id];
    const scr = screenRef.current;
    if (!row || !scr) return;
    const top = row.getBoundingClientRect().top - scr.getBoundingClientRect().top;
    const scale = scr.getBoundingClientRect().height / scr.offsetHeight || 1;
    const hdr = (scr.querySelector('header') as HTMLElement | null)?.offsetHeight ?? 97;
    setRxTop(Math.max(hdr + 3, top / scale - 52));
  }, [one, items]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 24);
    if (one) setSel([]);
  };
  const toBottom = (smooth = true) => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };
  useEffect(() => { requestAnimationFrame(() => onScroll()); }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const exitSel = () => { setSel([]); setMore(false); };
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const onAction = (a: SelAction) => {
    if (!selMsgs.length) return;
    if (a === 'reply' && one) { setReplyTo(one.id); setEditing(null); exitSel(); }
    if (a === 'thread' && one) { exitSel(); nav.push('thread', { club: clubId, msg: one.id }); }
    if (a === 'copy') { navigator.clipboard?.writeText(selMsgs.map((m) => m.body).join('\n\n')).catch(() => {}); exitSel(); }
    if (a === 'delete') {
      if (one && !one.you && isOwner) { setTarget(one.id); setSheet('remove'); return; }
      setDialog(one ? 'delete-one' : 'delete-many');
    }
    if (a === 'more') setMore((m) => !m);
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    if (editing) {
      chat.edit(clubId, editing, text);
      setEditing(null);
    } else {
      const q = replyTo ? byId(replyTo) : null;
      chat.send(clubId, text, q ? { name: q.name, snippet: q.body } : undefined);
      setReplyTo(null);
      setTimeout(() => toBottom(), 30);
    }
    setDraft('');
  };

  const mq = mentionQuery(draft);
  const mentionOpts = mq === null ? [] : MENTIONS.filter((o) => o.name.toLowerCase().startsWith(mq) || o.username.slice(1).startsWith(mq));
  const blocked = LINK.test(draft) ? 'Links aren’t allowed on Page234. Remove it to send.' : null;
  const reply = replyTo ? byId(replyTo) : null;

  const doDelete = () => {
    const ids = [...sel];
    chat.remove(clubId, ids, 'deleted');
    setDialog(null);
    exitSel();
    app.toast(ids.length > 1 ? `${ids.length} messages deleted` : 'Message deleted', 'neutral', { icon: 'Trash', bottom: 100 });
  };

  const header = selecting ? (
    <SelectionBar count={sel.length} actions={actions} onClose={exitSel} onAction={onAction} />
  ) : (
    <ThreadHeader
      title={club.name}
      subtitle={offline || loading ? (offline ? 'Connecting' : club.sub) : club.sub}
      loader={offline || loading}
      club={{ art: club.art, palette: club.palette }}
      muted={!!muted}
      onMore={() => setMenu(true)}
    />
  );

  return (
    <div className="screen" ref={screenRef}>
      {header}
      {offline ? (
        <ConnectionBanner state="offline" />
      ) : (
        !catchupHidden && !loading && !isNew && (
          <CatchUpStrip
            title="3 threads were busy while you were away"
            chips={[
              { label: 'Amaka · 24 replies', onClick: () => nav.push('thread', { club: clubId, msg: 'm1' }) },
              { label: 'Femi · 11', onClick: () => nav.push('thread', { club: clubId, msg: 'm4' }) },
            ]}
            onClose={() => chat.hideCatchup(clubId)}
          />
        )
      )}
      <div className="screen-body" ref={listRef} onScroll={onScroll}>
        {loading ? (
          <div className="col" style={{ padding: '8px 16px 0', gap: 4 }}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} type="message" />)}
          </div>
        ) : (
          <div className="col" style={{ padding: selecting ? '8px 0 16px' : '8px 16px 16px', gap: 4 }}>
            {items.map((it: ChatItem) => {
              if (!isMsg(it)) return <div key={it.id} style={{ padding: selecting ? '0 16px' : 0 }}><Divider label={it.label} unread={it.divider === 'unread'} /></div>;
              const node = (
                <Message
                  m={it}
                  onLike={() => chat.like(clubId, it.id)}
                  onReplies={() => nav.push('thread', { club: clubId, msg: it.id })}
                  onReaction={(e) => chat.react(clubId, it.id, e)}
                  onRetry={() => chat.retry(clubId, it.id)}
                  onDeleteFailed={() => chat.removePending(clubId, it.id)}
                  onLongPress={it.state ? undefined : () => { setSel([it.id]); setMenu(false); }}
                />
              );
              return (
                <div key={it.id} ref={(el) => { rowRefs.current[it.id] = el; }}>
                  {selecting ? (it.state ? <div style={{ padding: '0 16px 0 52px', opacity: 0.6 }}>{node}</div> : <SelectRow selected={sel.includes(it.id)} onToggle={() => { const next = sel.includes(it.id) ? sel.filter((x) => x !== it.id) : [...sel, it.id]; setMore(false); if (!next.length) exitSel(); else toggle(it.id); }}>{node}</SelectRow>) : node}
                </div>
              );
            })}
            {msgs.length === 0 && (
              <div className="col" style={{ alignItems: 'center' }}>
                <EmptyState icon="ChatCircle" title="Your bookclub is ready" body="Start the conversation. Say what drew you to the book, or where you’re up to." />
                <Button size="sm" kind="secondary" onClick={() => nav.modal('invite', { club: clubId })}>Invite people</Button>
              </div>
            )}
          </div>
        )}
      </div>
      {firstVisit.current && !jumped && !atBottom && !loading && !selecting && !mentionOpts.length && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: replyTo ? 201 : editing ? 179 : 121, display: 'flex', justifyContent: 'center', zIndex: 6, pointerEvents: 'none' }}>
          <span style={{ pointerEvents: 'auto' }}><JumpToLatest onClick={() => { chat.markJumped(clubId); toBottom(); }} /></span>
        </div>
      )}
      <MessageComposer
        value={draft}
        onChange={setDraft}
        onSend={send}
        blocked={blocked}
        replyingTo={reply ? { name: reply.name, snippet: reply.body } : null}
        onCancelReply={() => setReplyTo(null)}
        editing={!!editing}
        onCancelEdit={() => { setEditing(null); setDraft(''); }}
        autoFocus={!!editing || !!replyTo}
        above={mentionOpts.length > 0 ? (
          <MentionPicker
            options={mentionOpts}
            style={{ position: 'absolute', left: 16, right: 16, bottom: 'calc(100% + 8px)' }}
            onPick={(o) => setDraft((d) => d.replace(/@(\w*)$/, `${o.username} `))}
          />
        ) : null}
      />

      {/* Reaction row for a single selected message */}
      {one && rxTop !== null && !more && (
        <div style={{ position: 'absolute', top: rxTop, right: 45, zIndex: 20 }}>
          <ReactionRow onPick={(e) => { chat.react(clubId, one.id, e); exitSel(); }} />
        </div>
      )}
      {more && one && (
        <>
          <div style={{ position: 'absolute', inset: 0, zIndex: 30 }} onClick={() => setMore(false)} />
          <Popover style={{ top: ACTION_MENU_TOP, right: 8, width: 200, zIndex: 31 }}>
            {one.you ? (
              <MenuRow icon="PencilSimple" label="Edit" onClick={() => { setEditing(one.id); setDraft(one.body); setReplyTo(null); exitSel(); }} />
            ) : (
              <MenuRow icon="Flag" label="Report" onClick={() => { setTarget(one.id); setMore(false); setSheet('report'); }} />
            )}
          </Popover>
        </>
      )}

      {/* Bookclub menu */}
      {menu && (
        <>
          <div className="scrim" onClick={() => setMenu(false)} />
          <Popover style={{ top: MENU_TOP, right: 8, width: 232, padding: 8 }}>
            <MenuRow icon="Users" label="Bookclub information" onClick={() => { setMenu(false); nav.push('club-info', { club: clubId }); }} />
            {!isPrivateMember && <MenuRow icon="UserPlus" label="Invite people" onClick={() => { setMenu(false); nav.modal('invite', { club: clubId }); }} />}
            {muted ? (
              <MenuRow icon="Bell" label="Unmute bookclub" onClick={() => { setMenu(false); clubs.unmute(clubId); }} />
            ) : (
              <MenuRow icon="BellSlash" label="Mute this bookclub" onClick={() => { setMenu(false); setSheet('mute'); }} />
            )}
            <MenuRow icon="SignOut" label="Leave bookclub" tone="destructive" onClick={() => { setMenu(false); setDialog('leave'); }} />
          </Popover>
        </>
      )}

      {sheet === 'mute' && (
        <Sheet onClose={() => setSheet(null)}>
          <SheetTitle title={`Mute ${club.name}?`} subtitle="No phone alerts from it. Replies and mentions still show in Alerts." />
          <div className="col fill" style={{ paddingBottom: 8 }}>
            {[
              ['For 8 hours', 'Muted for 8 hours'],
              ['For a week', 'Muted for a week'],
              ['Until I turn it back on', 'Muted until you turn it back on'],
            ].map(([label, toast]) => (
              <MenuRow key={label} label={label} tone="choice" onClick={() => {
                clubs.mute(clubId, label);
                setSheet(null);
                app.toast(toast, 'success', { bottom: 100, action: { label: 'Undo', run: () => clubs.unmute(clubId) } });
              }} />
            ))}
          </div>
        </Sheet>
      )}
      {sheet === 'report' && (
        <ReasonSheet
          title="Why are you reporting this?" subtitle="Only Page234 moderators will see this report." action="Submit report"
          initial={params.sheet === 'report' ? ['Harassment or abuse'] : []}
          onClose={() => setSheet(null)} onElse={() => setSheet('report-else')}
          onSubmit={() => { setSheet(null); exitSel(); app.toast('Reported. We’ll review this.', 'success', { bottom: 80 }); }}
        />
      )}
      {sheet === 'report-else' && (
        <ReportFormSheet onClose={() => setSheet(null)} onSubmit={() => { setSheet(null); exitSel(); app.toast('Reported. We’ll review this.', 'success', { bottom: 80 }); }} />
      )}
      {(sheet === 'remove' || sheet === 'remove-else') && (() => {
        const t = byId(target ?? sel[0] ?? 'm1');
        const done = () => {
          chat.remove(clubId, [t?.id ?? 'm1'], 'removed');
          setSheet(null);
          exitSel();
          app.toast(`Message removed. ${t?.name ?? 'Amaka'} will see why.`, 'success', { bottom: 100 });
        };
        return sheet === 'remove' ? (
          <ReasonSheet
            title="Why are you removing this?" subtitle={`${t?.name ?? 'Amaka'} will see this reason. The message and its thread are removed for everyone.`}
            action="Remove message" danger initial={params.sheet === 'remove' ? ['External link'] : []}
            onClose={() => setSheet(null)} onElse={() => setSheet('remove-else')} onSubmit={done}
          />
        ) : <ReportFormSheet onClose={() => setSheet(null)} onSubmit={done} />;
      })()}

      {dialog === 'leave' && (
        <Dialog
          title="Leave this bookclub?"
          body={`You’ll stop receiving alerts from ${club.name}. You can rejoin any time.`}
          confirm="Leave"
          onCancel={() => setDialog(null)}
          onConfirm={() => { clubs.leave(clubId); setDialog(null); app.goTab('bookclubs'); }}
        />
      )}
      {dialog === 'delete-one' && (
        <Dialog title="Delete this message?" body="This can’t be undone." confirm="Delete" onCancel={() => setDialog(null)} onConfirm={doDelete} />
      )}
      {dialog === 'delete-many' && (
        <Dialog title={`Delete ${sel.length} messages?`} body="This can’t be undone. Any threads on them will be deleted too." confirm="Delete" onCancel={() => setDialog(null)} onConfirm={doDelete} />
      )}
    </div>
  );
}
