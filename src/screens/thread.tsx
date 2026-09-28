import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { nav, type Params } from '../lib/nav';
import { app, useApp } from '../data/app';
import { chat, getChat, getReplies, useChat, type Reply } from '../data/chat';
import { clubById } from '../data/clubs';
import { Message, PinnedParent, ReactionRow, SelectRow, SelectionBar, ThreadHeader, isMsg, type ChatMsg, type SelAction } from '../components/ui/chat';
import { MessageComposer, MentionPicker } from '../components/ui/inputs';
import { EmptyState, ErrorState, ConnectionBanner, Skeleton } from '../components/ui/states';
import { Dialog, MenuRow, Popover, PromptSheet } from '../components/ui/overlays';
import { Icon } from '../components/Icon';
import { MENTIONS, ReasonSheet, ReportFormSheet, mentionQuery } from './chat';

function SwipeToReply({ children, onReply, enabled }: { children: React.ReactNode; onReply: () => void; enabled: boolean }) {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const horizontal = useRef(false);
  const end = () => {
    if (dx > 56) onReply();
    start.current = null;
    horizontal.current = false;
    setDx(0);
  };
  if (!enabled) return <>{children}</>;
  return (
    <div
      className="rel"
      style={{ touchAction: 'pan-y' }}
      onPointerDown={(e) => { start.current = { x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const x = e.clientX - start.current.x;
        const y = e.clientY - start.current.y;
        if (!horizontal.current && Math.abs(x) > 10 && Math.abs(x) > Math.abs(y)) horizontal.current = true;
        if (horizontal.current) setDx(Math.max(0, Math.min(72, x)));
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={() => { if (start.current) end(); }}
    >
      <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', opacity: Math.min(1, dx / 48), display: 'flex' }}>
        <Icon name="ArrowBendUpLeft" size={24} tone="secondary" />
      </span>
      <div style={{ transform: `translateX(${dx}px)`, transition: start.current ? 'none' : 'transform 200ms ease' }}>{children}</div>
    </div>
  );
}

type Sheet = null | 'report' | 'report-else';

const COLD_PARENT: ChatMsg = { id: 'cold-parent', name: 'Sidi', time: 'Yesterday', body: 'Finished Chapter 18 on the bus home. The ending landed differently than I expected.', likes: 24, replies: 2 };
const COLD_REPLIES: Reply[] = [
  { id: 'c1', name: 'Amaka', time: 'now', body: 'That’s exactly the bit I wanted to talk about — say more?', likes: 3 },
  { id: 'c2', name: 'Kemi', time: 'Yesterday', body: 'Same here. I had to sit with it for a while.', likes: 1 },
];

export function Thread({ params }: { params: Params }) {
  const clubId = (params.club as string) ?? 'midnight';
  const msgId = (params.msg as string) ?? 'm1';
  const cold = !!params.cold;
  const key = cold ? 'cold' : `${clubId}:${msgId}`;
  const club = clubById(clubId);
  const offline = useApp((s) => s.offline);
  const chatItems = useChat((s) => s.chats[clubId]);
  const parent = useMemo(() => cold ? COLD_PARENT : (chatItems ?? getChat(clubId)).filter(isMsg).find((m) => m.id === msgId) ?? (getChat(clubId).filter(isMsg)[1] as ChatMsg), [chatItems, clubId, msgId, cold]);
  const seed = useMemo(() => (params.empty ? [] : cold ? COLD_REPLIES : getReplies(key)), [key, params.empty, cold]);
  const replies: Reply[] = useChat((s) => s.replies[key]) ?? seed;
  const primingDone = useChat((s) => s.primingDone);

  const [loading, setLoading] = useState(!!params.loading || !app.isLoaded(`thread-${key}`));
  const [draft, setDraft] = useState((params.draft as string) ?? '');
  const [replyTo, setReplyTo] = useState<string | null>((params.replyTo as string) ?? null);
  const [editing, setEditing] = useState<string | null>((params.editing as string) ?? null);
  const [sel, setSel] = useState<string[]>((params.select as string[]) ?? []);
  const [more, setMore] = useState(!!params.more);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [dialog, setDialog] = useState(!!params.dialog);
  const [priming, setPriming] = useState(!!params.priming);
  const screenRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const [rxTop, setRxTop] = useState<number | null>(null);

  useEffect(() => {
    if (params.empty) chat.seedReplies(key, []);
    if (params.sending) chat.seedReplies(key, [...getReplies(key), { id: 'rs', name: 'Sidi', you: true, time: '2:14 PM', body: 'That rosary reading hadn’t occurred to me — it reframes the whole second half.', likes: 0, state: 'sending' }]);
  }, [key, params.empty, params.sending]);

  useEffect(() => {
    if (params.loading || !loading) return;
    const t = setTimeout(() => { app.markLoaded(`thread-${key}`); setLoading(false); }, 700);
    return () => clearTimeout(t);
  }, [key, loading, params.loading]);

  const byId = (id: string) => replies.find((r) => r.id === id);
  const selMsgs = sel.map(byId).filter(Boolean) as Reply[];
  const one = selMsgs.length === 1 ? selMsgs[0] : null;
  const actions: SelAction[] = one ? (one.you ? ['reply', 'copy', 'delete', 'more'] : ['reply', 'copy', 'more']) : selMsgs.every((m) => m.you) ? ['copy', 'delete'] : ['copy'];
  const exitSel = () => { setSel([]); setMore(false); };

  useLayoutEffect(() => {
    if (!one) { setRxTop(null); return; }
    const row = rowRefs.current[one.id];
    const scr = screenRef.current;
    if (!row || !scr) return;
    const scale = scr.getBoundingClientRect().height / scr.offsetHeight || 1;
    setRxTop(Math.max(100, (row.getBoundingClientRect().top - scr.getBoundingClientRect().top) / scale - 52));
  }, [one, replies]);

  const onAction = (a: SelAction) => {
    if (a === 'reply' && one) { setReplyTo(one.id); exitSel(); }
    if (a === 'copy') { navigator.clipboard?.writeText(selMsgs.map((m) => m.body).join('\n\n')).catch(() => {}); exitSel(); }
    if (a === 'delete') setDialog(true);
    if (a === 'more') setMore((m) => !m);
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    if (editing) { chat.editReply(key, editing, text); setEditing(null); }
    else {
      const q = replyTo ? byId(replyTo) : null;
      chat.sendReply(key, text, q ? { name: q.name, snippet: q.body } : undefined);
      setReplyTo(null);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 30);
      if (!primingDone) setTimeout(() => setPriming(true), 700);
    }
    setDraft('');
  };

  const mq = mentionQuery(draft);
  const mentionOpts = mq === null ? [] : MENTIONS.filter((o) => o.name.toLowerCase().startsWith(mq) || o.username.slice(1).startsWith(mq));
  const reply = replyTo ? byId(replyTo) : null;
  const parentGone = parent.state === 'deleted' || parent.state === 'removed' || params.gone;

  return (
    <div className="screen" ref={screenRef}>
      {sel.length ? (
        <SelectionBar count={sel.length} actions={actions} onClose={exitSel} onAction={onAction} />
      ) : (
        <ThreadHeader title="Thread" subtitle={club.name} onMore={() => {}} />
      )}
      {offline && <ConnectionBanner state="offline" />}
      {params.removed ? (
        <div className="screen-body">
          <ErrorState icon="Prohibit" title="You’re no longer in this bookclub" body="You left or were removed, so this conversation isn’t available." action="Back to Bookclubs" onAction={() => app.goTab('bookclubs')} />
        </div>
      ) : parentGone ? (
        <div className="screen-body">
          <ErrorState icon="Prohibit" title="This message was deleted" body="Its thread was deleted with it." action="Open the bookclub" onAction={() => nav.replace('chat', { club: clubId }, 'push')} />
        </div>
      ) : (
        <div className="screen-body" ref={listRef}>
          <div style={{ padding: 16, background: 'var(--surface-canvas)' }}>
            <PinnedParent m={parent} onLike={() => chat.like(clubId, parent.id)} replyLabel={replies.length ? `${cold ? replies.length : parent.replies ?? replies.length} replies` : 'No replies yet'} />
          </div>
          {loading ? (
            <div className="col" style={{ padding: '16px 16px 0', gap: 16 }}>
              {[0, 1, 2].map((i) => <Skeleton key={i} type="message" />)}
            </div>
          ) : replies.length === 0 ? (
            <div style={{ padding: '16px 16px 0' }}>
              <EmptyState icon="ChatCircle" title="No replies yet" body="Be the first to reply." />
            </div>
          ) : (
            <div className="col" style={{ padding: sel.length ? '16px 0 16px' : '16px 16px 16px', gap: 16 }}>
              {replies.map((r) => {
                const node = (
                  <Message
                    m={r}
                    variant="reply"
                    onLike={() => chat.likeReply(key, r.id)}
                    onReaction={(e) => chat.reactReply(key, r.id, e)}
                    onLongPress={r.state ? undefined : () => setSel([r.id])}
                  />
                );
                return (
                  <div key={r.id} ref={(el) => { rowRefs.current[r.id] = el; }} style={cold && r.id === 'c1' && !sel.length ? { padding: 8, margin: -8, background: 'var(--action-subtle)', borderRadius: 12 } : undefined}>
                    {sel.length ? (
                      <SelectRow selected={sel.includes(r.id)} onToggle={() => setSel((s) => { const n = s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id]; if (!n.length) setMore(false); return n; })}>{node}</SelectRow>
                    ) : (
                      <SwipeToReply enabled={!r.state} onReply={() => setReplyTo(r.id)}>{node}</SwipeToReply>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {!parentGone && !params.removed && (
        <MessageComposer
          value={draft}
          onChange={setDraft}
          onSend={send}
          placeholder="Add to the thread…"
          replyingTo={reply ? { name: reply.name, snippet: reply.body } : null}
          onCancelReply={() => setReplyTo(null)}
          editing={!!editing}
          onCancelEdit={() => { setEditing(null); setDraft(''); }}
          autoFocus={!!editing || !!replyTo}
          above={mentionOpts.length > 0 ? (
            <MentionPicker options={mentionOpts} style={{ position: 'absolute', left: 16, right: 16, bottom: 'calc(100% + 8px)' }} onPick={(o) => setDraft((d) => d.replace(/@(\w*)$/, `${o.username} `))} />
          ) : null}
        />
      )}

      {one && rxTop !== null && !more && (
        <div style={{ position: 'absolute', top: rxTop, right: 45, zIndex: 20 }}>
          <ReactionRow onPick={(e) => { chat.reactReply(key, one.id, e); exitSel(); }} />
        </div>
      )}
      {more && one && (
        <>
          <div style={{ position: 'absolute', inset: 0, zIndex: 30 }} onClick={() => setMore(false)} />
          <Popover style={{ top: 92, right: 8, width: 200, zIndex: 31 }}>
            {one.you ? (
              <MenuRow icon="PencilSimple" label="Edit" onClick={() => { setEditing(one.id); setDraft(one.body); exitSel(); }} />
            ) : (
              <MenuRow icon="Flag" label="Report" onClick={() => { setMore(false); setSheet('report'); }} />
            )}
          </Popover>
        </>
      )}
      {sheet === 'report' && (
        <ReasonSheet title="Why are you reporting this?" subtitle="Only Page234 moderators will see this report." action="Submit report"
          onClose={() => setSheet(null)} onElse={() => setSheet('report-else')}
          onSubmit={() => { setSheet(null); exitSel(); app.toast('Reported. We’ll review this.', 'success', { bottom: 80 }); }} />
      )}
      {sheet === 'report-else' && (
        <ReportFormSheet onClose={() => setSheet(null)} onSubmit={() => { setSheet(null); exitSel(); app.toast('Reported. We’ll review this.', 'success', { bottom: 80 }); }} />
      )}
      {dialog && (
        <Dialog
          title={sel.length > 1 ? `Delete ${sel.length} replies?` : 'Delete this reply?'}
          body="This can’t be undone."
          confirm="Delete"
          onCancel={() => setDialog(false)}
          onConfirm={() => { chat.removeReplies(key, sel.length ? sel : ['r3']); setDialog(false); exitSel(); }}
        />
      )}
      {priming && (
        <>
          <div className="scrim" />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41, animation: 'modalIn 280ms cubic-bezier(.2,.8,.2,1) both' }}>
            <PromptSheet
              icon="Bell"
              title="Know when someone replies"
              body="We’ll tell you when someone answers you or invites you somewhere. Nothing else."
              primary="Turn on notifications"
              secondary="Not now"
              onPrimary={() => { chat.markPrimed(); app.set({ pushEnabled: true }); setPriming(false); if (app.get().platform === 'android') setTimeout(() => app.set({ sheet: 'background' }), 500); }}
              onSecondary={() => { chat.markPrimed(); setPriming(false); }}
            />
          </div>
        </>
      )}
    </div>
  );
}
