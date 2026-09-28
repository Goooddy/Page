import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import { Avatar, ClubAvatar, SelectionCheck, type Palette } from './core';
import { nav } from '../../lib/nav';

export type Reaction = { emoji: string; count: number; mine?: boolean };
export type ChatMsg = {
  id: string;
  name: string;
  you?: boolean;
  time: string;
  body: string;
  likes: number;
  liked?: boolean;
  replies?: number;
  reactions?: Reaction[];
  quote?: { name: string; snippet: string };
  edited?: boolean;
  state?: 'sending' | 'queued' | 'failed' | 'deleted' | 'removed';
  /** Reply rows drawn without the like control (Likes=false) */
  noLikes?: boolean;
};
export type ChatItem = ChatMsg | { id: string; divider: 'date' | 'unread'; label: string };
export const isMsg = (i: ChatItem): i is ChatMsg => !('divider' in i);

/* Renders "@name" mentions in the link style used by the Reply Row. */
export function RichText({ text, small }: { text: string; small?: boolean }) {
  const parts = text.split(/(@[A-Za-z0-9_]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('@') ? <span key={i} className="t-label c-link">{p}</span> : <span key={i} className={small ? 't-body-s' : 't-body'}>{p}</span>,
      )}
    </>
  );
}

export function TypingDots() {
  return <span className="typing-dots"><i /><i /><i /></span>;
}

export function LikeControl({ count, liked, onToggle }: { count: number; liked?: boolean; onToggle?: () => void }) {
  return (
    <button className="row" style={{ gap: 4, padding: '4px 4px 4px 0' }} onClick={(e) => { e.stopPropagation(); onToggle?.(); }} aria-pressed={liked}>
      <Icon name="Heart" weight={liked ? 'fill' : 'regular'} size={18} tone={liked ? 'danger' : 'secondary'} />
      <span className={`t-caption ${liked ? 'c-danger' : 'c-secondary'}`}>{count}</span>
    </button>
  );
}

export function ReactionChip({ r, onClick }: { r: Reaction; onClick?: () => void }) {
  return (
    <button
      className="row"
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      style={{
        gap: 4, padding: '4px 8px', borderRadius: 999,
        background: r.mine ? 'var(--action-subtle)' : 'var(--surface-sunken)',
        boxShadow: r.mine ? 'inset 0 0 0 1px var(--border-focus)' : undefined,
      }}
    >
      <span style={{ font: '400 14px/14px var(--font)' }}>{r.emoji}</span>
      <span className="t-label-s" style={{ color: r.mine ? 'var(--action-subtle-text)' : 'var(--text-secondary)' }}>{r.count}</span>
    </button>
  );
}

export function QuoteInMessage({ name, snippet, own }: { name: string; snippet: string; own?: boolean }) {
  return (
    <div className="col" style={{ padding: '8px 12px', gap: 2, borderRadius: 8, background: own ? 'var(--surface-default)' : 'var(--action-subtle)', boxShadow: 'inset 3px 0 0 var(--action-primary)' }}>
      <span className="t-label-s c-link">{name}</span>
      <span className="t-body-s c-secondary">{snippet}</span>
    </div>
  );
}

export function RemovedContent({ type }: { type: 'removed' | 'deleted' }) {
  return (
    <div className="row" style={{ padding: 12, gap: 8, background: 'var(--surface-sunken)', borderRadius: 12, alignSelf: type === 'deleted' ? 'flex-end' : 'stretch' }}>
      <Icon name="Prohibit" size={18} tone="tertiary" />
      <span className="t-body-s c-tertiary">{type === 'removed' ? 'This message was removed by a moderator.' : 'This message was deleted.'}</span>
    </div>
  );
}

type MsgProps = {
  m: ChatMsg;
  variant?: 'message' | 'reply';
  onLike?: () => void;
  onReplies?: () => void;
  onReaction?: (emoji: string) => void;
  onRetry?: () => void;
  onDeleteFailed?: () => void;
  onLongPress?: () => void;
  onTap?: () => void;
  style?: CSSProperties;
};

function useLongPress(onLong?: () => void, onTap?: () => void) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const clear = () => { if (t.current) clearTimeout(t.current); t.current = null; };
  return {
    onPointerDown: (e: React.PointerEvent) => {
      fired.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      clear();
      if (onLong) t.current = setTimeout(() => { fired.current = true; onLong(); }, 450);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (start.current && (Math.abs(e.clientX - start.current.x) > 8 || Math.abs(e.clientY - start.current.y) > 8)) clear();
    },
    onPointerUp: () => { clear(); },
    onPointerLeave: () => clear(),
    onClick: () => { if (!fired.current) onTap?.(); },
    onContextMenu: (e: React.MouseEvent) => { e.preventDefault(); clear(); if (!fired.current) onLong?.(); fired.current = true; },
  };
}

export function Message({ m, variant = 'message', onLike, onReplies, onReaction, onRetry, onDeleteFailed, onLongPress, onTap, style }: MsgProps) {
  const reply = variant === 'reply';
  const lp = useLongPress(onLongPress, onTap);
  const pending = m.state === 'sending' || m.state === 'queued' || m.state === 'failed';
  const gone = m.state === 'deleted' || m.state === 'removed';
  const pad = m.you ? '8px 0 8px 48px' : reply ? '8px 0 8px 32px' : '8px 0';
  return (
    <div className="row fill" style={{ padding: pad, gap: 12, alignItems: 'flex-start', justifyContent: m.you ? 'flex-end' : 'flex-start', ...style }} {...lp}>
      {!m.you && <Avatar initials={m.name[0]} size={reply ? 'sm' : 'md'} />}
      <div className="col grow" style={{ gap: 4, alignItems: m.you ? 'flex-end' : 'flex-start', minWidth: 0 }}>
        <div className="row fill" style={{ gap: 8 }}>
          {!m.you && <span className="t-label c-primary nowrap">{m.name}</span>}
          <span className="grow" />
          {m.edited && !gone && <span className="t-caption c-tertiary">Edited</span>}
          {m.state === 'sending' ? (
            <span className="row"><span className="t-caption c-tertiary">Sending</span><TypingDots /></span>
          ) : m.state === 'queued' ? (
            <span className="t-caption c-tertiary">Queued</span>
          ) : m.state === 'failed' ? (
            <span className="t-caption c-danger">Not sent</span>
          ) : (
            <span className="t-caption c-tertiary nowrap">{m.time}</span>
          )}
        </div>
        {gone ? (
          <RemovedContent type={m.state === 'removed' ? 'removed' : 'deleted'} />
        ) : (
          <div className={`bubble ${m.you ? 'own' : 'other'}`} style={{ gap: m.quote ? 8 : pending ? 0 : 8 }}>
            {m.quote && <QuoteInMessage name={m.quote.name} snippet={m.quote.snippet} own={m.you} />}
            <span className={`${reply ? 't-body-s' : 't-body'} ${m.state === 'sending' || m.state === 'queued' ? 'c-secondary' : 'c-primary'}`} style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              <RichText text={m.body} small={reply} />
            </span>
          </div>
        )}
        {m.state === 'failed' ? (
          <div className="row" style={{ gap: 16 }}>
            <button className="t-label c-link" onClick={(e) => { e.stopPropagation(); onRetry?.(); }}>Retry</button>
            <button className="t-label c-danger" onClick={(e) => { e.stopPropagation(); onDeleteFailed?.(); }}>Delete</button>
          </div>
        ) : !pending && !gone && (!m.noLikes || m.reactions?.length || m.replies) ? (
          <div className="row" style={{ gap: 16, justifyContent: m.you ? 'flex-end' : 'flex-start', flexWrap: 'wrap' }}>
            {!m.noLikes && <LikeControl count={m.likes} liked={m.liked} onToggle={onLike} />}
            {m.reactions && m.reactions.length > 0 && (
              <span className="row" style={{ gap: 4 }}>
                {m.reactions.map((r) => <ReactionChip key={r.emoji} r={r} onClick={() => onReaction?.(r.emoji)} />)}
              </span>
            )}
            {!!m.replies && (
              <button className="row" style={{ gap: 2 }} onClick={(e) => { e.stopPropagation(); onReplies?.(); }}>
                <span className="t-label c-link">{m.replies} {m.replies === 1 ? 'reply' : 'replies'}</span>
                <Icon name="CaretRight" size={14} />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function SelectRow({ selected, children, onToggle }: { selected: boolean; children: ReactNode; onToggle: () => void }) {
  return (
    <div className="row tap fill" style={{ padding: '0 16px', gap: 12, alignItems: 'flex-start', background: selected ? 'var(--action-subtle)' : undefined }} onClick={onToggle}>
      <span style={{ paddingTop: 12 }}><SelectionCheck on={selected} /></span>
      <div className="grow" style={{ minWidth: 0, pointerEvents: 'none' }}>{children}</div>
    </div>
  );
}

export function PinnedParent({ m, onLike, replyLabel }: { m: ChatMsg; onLike?: () => void; replyLabel?: string }) {
  return (
    <div className="col" style={{ padding: '12px 16px', gap: 8, background: 'var(--surface-sunken)', boxShadow: 'inset 0 -1px 0 var(--border-subtle)' }}>
      <div className="row" style={{ gap: 8 }}>
        <Avatar initials={m.name[0]} size="sm" />
        <span className="t-label c-primary">{m.name}</span>
        <span className="grow" />
        <span className="t-caption c-tertiary">{m.time}</span>
      </div>
      {m.state === 'deleted' || m.state === 'removed' ? <RemovedContent type={m.state === 'removed' ? 'removed' : 'deleted'} /> : <span className="t-body c-primary">{m.body}</span>}
      <div className="row" style={{ gap: 16 }}>
        <LikeControl count={m.likes} liked={m.liked} onToggle={onLike} />
        <span className="t-caption c-secondary">{replyLabel ?? `${m.replies ?? 0} replies`}</span>
      </div>
    </div>
  );
}

export function ThreadHeader({ title, subtitle, club, muted, loader, onBack, onMore }: {
  title: string; subtitle: string; club?: { art: number; palette?: Palette }; muted?: boolean; loader?: boolean; onBack?: () => void; onMore?: () => void;
}) {
  return (
    <header className="appbar">
      <div className="bar" style={{ padding: '0 4px', gap: 8 }}>
        <button className="icon-btn" onClick={onBack ?? (() => nav.pop())} aria-label="Back"><Icon name="CaretLeft" size={24} /></button>
        <div className="row grow" style={{ gap: 8, minWidth: 0 }}>
          {club && <ClubAvatar art={club.art} palette={club.palette} size={40} />}
          <div className="col" style={{ gap: 2, minWidth: 0, alignItems: 'flex-start' }}>
            <span className="row" style={{ gap: 4, maxWidth: '100%' }}>
              <span className="t-label-l c-primary trunc">{title}</span>
              {muted && <Icon name="BellSlash" size={16} tone="secondary" />}
            </span>
            <span className="row" style={{ maxWidth: '100%' }}>
              <span className="t-caption c-secondary trunc">{subtitle}</span>
              {loader && <TypingDots />}
            </span>
          </div>
        </div>
        {onMore && <button className="icon-btn" onClick={onMore} aria-label="More"><Icon name="DotsThree" size={24} /></button>}
      </div>
    </header>
  );
}

export function CatchUpStrip({ title, chips, onClose }: { title: string; chips: Array<{ label: string; onClick?: () => void }>; onClose?: () => void }) {
  return (
    <div className="col" style={{ padding: '12px 16px', gap: 8, background: 'var(--action-subtle)', boxShadow: 'inset 0 -1px 0 var(--border-subtle)', flexShrink: 0, position: 'relative', zIndex: 4 }}>
      <div className="row" style={{ gap: 8 }}>
        <span className="t-label c-primary grow">{title}</span>
        <button onClick={onClose} aria-label="Dismiss" style={{ display: 'flex' }}><Icon name="X" size={18} tone="secondary" /></button>
      </div>
      <div className="row" style={{ gap: 8 }}>
        {chips.map((c) => (
          <button key={c.label} className="t-caption c-primary" onClick={c.onClick} style={{ padding: '4px 12px', background: 'var(--surface-default)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)', borderRadius: 999 }}>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function JumpToLatest({ onClick, style }: { onClick?: () => void; style?: CSSProperties }) {
  return (
    <button className="row" onClick={onClick} style={{ gap: 4, padding: '8px 12px', background: 'var(--surface-inverse)', borderRadius: 999, boxShadow: 'var(--elevation-2)', ...style }}>
      <span className="t-label c-inverse">Jump to latest</span>
      <Icon name="CaretDown" size={16} tone="inverse" />
    </button>
  );
}

export type SelAction = 'reply' | 'thread' | 'copy' | 'delete' | 'more';
const SEL_ICON: Record<SelAction, IconName> = { reply: 'ArrowBendUpLeft', thread: 'ChatCircleText', copy: 'Copy', delete: 'Trash', more: 'DotsThree' };
export function SelectionBar({ count, actions, onClose, onAction }: { count: number; actions: SelAction[]; onClose: () => void; onAction: (a: SelAction) => void }) {
  return (
    <header className="appbar">
      <div className="bar" style={{ padding: '0 4px', gap: 8 }}>
        <button className="icon-btn" onClick={onClose} aria-label="Cancel selection"><Icon name="X" size={24} /></button>
        <span className="t-label-l c-primary grow">{count} selected</span>
        <span className="row">
          {actions.map((a) => (
            <button key={a} className="icon-btn" onClick={() => onAction(a)} aria-label={a}><Icon name={SEL_ICON[a]} size={24} /></button>
          ))}
        </span>
      </div>
    </header>
  );
}

export const REACTIONS = ['😂', '👏', '🤔'];
export function ReactionRow({ onPick, style }: { onPick: (r: string) => void; style?: CSSProperties }) {
  const cell = { width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' } as const;
  return (
    <div className="row" style={{ padding: 8, gap: 4, background: 'var(--surface-default)', borderRadius: 999, boxShadow: 'var(--elevation-2)', ...style }} onClick={(e) => e.stopPropagation()}>
      <button style={cell} onClick={() => onPick('❤')} aria-label="Like"><Icon name="Heart" weight="fill" size={26} tone="danger" /></button>
      {REACTIONS.map((r) => (
        <button key={r} style={{ ...cell, font: '600 24px/24px var(--font)' }} onClick={() => onPick(r)}>{r}</button>
      ))}
      <button style={cell} aria-label="More reactions"><Icon name="Plus" size={22} tone="secondary" /></button>
    </div>
  );
}
