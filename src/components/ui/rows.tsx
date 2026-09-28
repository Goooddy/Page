import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import { Avatar, AvatarGroup, BadgeCount, BookCover, Button, ClubAvatar, StatusPill, Toggle, type Palette } from './core';

/* ——— Bookclub Row ——— */
export type ClubRowData = {
  name: string; art: number; palette?: Palette; time: string; preview: string;
  activity?: string; badge?: number; unread?: boolean; muted?: boolean;
};
export function BookclubRow({ c, onClick }: { c: ClubRowData; onClick?: () => void }) {
  return (
    <button className="row fill" style={{ padding: '12px 0', gap: 12, alignItems: 'flex-start' }} onClick={onClick}>
      <ClubAvatar art={c.art} palette={c.palette} size={40} />
      <span className="col grow" style={{ gap: 4 }}>
        <span className="row" style={{ gap: 8 }}>
          <span className="t-label-l c-primary grow trunc">{c.name}</span>
          {c.muted && <Icon name="BellSlash" size={14} tone="tertiary" />}
          <span className="t-caption c-tertiary nowrap">{c.time}</span>
        </span>
        <span className="row" style={{ gap: 4 }}>
          <span className="t-body-s c-secondary trunc" style={{ flexShrink: c.activity ? 0 : 1 }}>{c.preview}</span>
          {c.activity && (
            <>
              <span className="t-body-s c-secondary">·</span>
              <span className={`${c.unread ? 't-label c-primary' : 't-body-s c-secondary'} trunc`}>{c.activity}</span>
            </>
          )}
        </span>
      </span>
      {c.unread && c.badge ? <BadgeCount n={c.badge} style={{ minWidth: 20, height: 20 }} /> : null}
    </button>
  );
}

export function ArchivedRow({ count, onClick }: { count: number; onClick?: () => void }) {
  return (
    <button className="row fill" style={{ padding: 12, gap: 8, background: 'var(--surface-sunken)', borderRadius: 12 }} onClick={onClick}>
      <Icon name="Archive" size={18} tone="secondary" />
      <span className="t-label c-primary">Archived</span>
      <span className="t-label-s c-secondary" style={{ padding: '2px 8px', background: 'var(--surface-press)', borderRadius: 999 }}>{count}</span>
      <span className="grow" />
      <Icon name="CaretRight" size={18} tone="tertiary" />
    </button>
  );
}

/* ——— Settings / preference rows ——— */
export function SettingsRow({ label, value, count, destructive, onClick, chevron = true, style }: {
  label: string; value?: string; count?: number; destructive?: boolean; onClick?: () => void; chevron?: boolean; style?: CSSProperties;
}) {
  return (
    <button className="row fill" style={{ padding: 12, gap: 8, background: 'var(--surface-default)', minHeight: 44, ...style }} onClick={onClick}>
      <span className={`t-label-l grow ${destructive ? 'c-danger' : 'c-primary'}`}>{label}</span>
      {value && <span className="t-body c-secondary">{value}</span>}
      {count ? <span className="t-label-s" style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--danger-fill)', color: 'var(--danger-on-fill)' }}>{count}</span> : null}
      {!destructive && chevron && <Icon name="CaretRight" size={18} tone="tertiary" />}
    </button>
  );
}

export function PreferenceRow({ label, desc, on, onChange, disabled }: { label: string; desc?: string; on: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="row fill" style={{ padding: '12px 0', gap: 12 }}>
      <span className="col grow" style={{ gap: 2 }}>
        <span className="t-label-l c-secondary">{label}</span>
        {desc && <span className="t-body-s c-tertiary">{desc}</span>}
      </span>
      <Toggle on={on} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export const Hairline = ({ style }: { style?: CSSProperties }) => (
  <div style={{ padding: '12px 0 4px', ...style }}><div style={{ height: 1, background: 'var(--border-subtle)' }} /></div>
);

/* ——— Member Row ——— */
export function MemberRow({ name, initials, type = 'member', meta, onMore, onApprove, onDecline }: {
  name: string; initials: string; type?: 'member' | 'owner' | 'request'; meta?: string; onMore?: () => void; onApprove?: () => void; onDecline?: () => void;
}) {
  return (
    <div className="row fill" style={{ padding: '8px 0', gap: 12 }}>
      <Avatar initials={initials} size="md" />
      <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
        <span className="t-label-l c-primary trunc">{name}</span>
        {type !== 'member' && <span className="t-body-s c-secondary">{type === 'owner' ? 'Owner' : meta}</span>}
      </span>
      {type === 'member' && (
        <button onClick={onMore} aria-label="More" style={{ display: 'flex', padding: 12, margin: -12 }}>
          <Icon name="DotsThree" size={20} tone="secondary" />
        </button>
      )}
      {type === 'request' && (
        <span className="row" style={{ gap: 8 }}>
          <Button size="sm" onClick={onApprove}>Approve</Button>
          <Button size="sm" kind="ghost" onClick={onDecline}>Decline</Button>
        </span>
      )}
    </div>
  );
}

/* ——— Alert Row ——— */
export type AlertData = {
  id: string;
  type: 'reply' | 'invitation' | 'request' | 'moderation' | 'mention' | 'resolved';
  unread?: boolean;
  actor?: string;
  initials?: string;
  text: string;
  meta: string;
};
export function AlertRow({ a, onClick, onAccept, onDecline, acceptLabel }: {
  a: AlertData; onClick?: () => void; onAccept?: () => void; onDecline?: () => void; acceptLabel?: string;
}) {
  const hasActions = a.type === 'invitation' || a.type === 'request';
  return (
    <div className="row fill tap" style={{ padding: '12px 16px', gap: 12, alignItems: 'flex-start', background: a.unread ? 'var(--action-subtle)' : 'var(--surface-default)' }} onClick={onClick}>
      {a.type === 'moderation' ? <Icon name="ShieldCheck" size={24} tone="secondary" /> : <Avatar initials={a.initials ?? a.actor?.[0] ?? 'A'} size="md" />}
      <span className="col grow" style={{ gap: 4, minWidth: 0 }}>
        {a.type === 'mention' ? (
          <span className="t-label c-primary">{a.text}</span>
        ) : a.type === 'moderation' ? (
          <span className="t-body-s c-primary">{a.text}</span>
        ) : a.type === 'resolved' ? (
          <span className="row" style={{ gap: 4 }}>
            <Icon name="Check" size={16} tone="accent" />
            <span className="t-body-s c-secondary grow">{a.text}</span>
          </span>
        ) : (
          <span className="t-body-s c-primary" style={{ display: 'block' }}>
            <b className="t-label c-primary" style={{ marginRight: 4 }}>{a.actor}</b>{a.text}
          </span>
        )}
        <span className="t-caption c-tertiary">{a.meta}</span>
        {hasActions && (
          <span className="row" style={{ gap: 8, paddingTop: 4 }} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" onClick={onAccept}>{acceptLabel ?? (a.type === 'invitation' ? 'Accept' : 'Approve')}</Button>
            <Button size="sm" kind="ghost" onClick={onDecline}>Decline</Button>
          </span>
        )}
      </span>
      {a.unread && <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--action-primary)', flexShrink: 0, marginTop: 4 }} />}
    </div>
  );
}

/* ——— Cards ——— */
export function BookclubCard({ name, reading, art, palette, pill, more = '+12', action, actionKind = 'primary', onAction, onClick }: {
  name: string; reading: string; art: number; palette?: Palette; pill: 'live' | 'public' | 'private'; more?: string;
  action: string; actionKind?: 'primary' | 'secondary' | 'ghost'; onAction?: () => void; onClick?: () => void;
}) {
  return (
    <div className="col tap" style={{ padding: 12, gap: 12, background: 'var(--surface-default)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)', borderRadius: 12 }} onClick={onClick}>
      <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
        <ClubAvatar art={art} palette={palette} size={56} />
        <div className="col grow" style={{ gap: 4, minWidth: 0 }}>
          <span className="t-title-s c-primary trunc">{name}</span>
          <span className="t-caption c-tertiary trunc">{reading}</span>
          <span className="row" style={{ gap: 4 }}>
            <StatusPill kind={pill} />
            <AvatarGroup more={more} />
          </span>
        </div>
      </div>
      <span onClick={(e) => e.stopPropagation()} style={{ display: 'flex' }}>
        <Button full kind={actionKind} onClick={onAction}>{action}</Button>
      </span>
    </div>
  );
}

export function BookResultRow({ title, author, cover, onClick }: { title: string; author: string; cover?: string; onClick?: () => void }) {
  return (
    <button className="row fill" style={{ padding: '8px 0', gap: 12 }} onClick={onClick}>
      <BookCover title={cover ?? title.toUpperCase()} />
      <span className="col grow" style={{ gap: 2 }}>
        <span className="t-label-l c-primary trunc">{title}</span>
        <span className="t-body-s c-secondary">{author}</span>
      </span>
    </button>
  );
}

export function SelectedBook({ title, author, cover, onChange }: { title: string; author: string; cover?: string; onChange?: () => void }) {
  return (
    <div className="row fill" style={{ padding: 12, gap: 12, background: 'var(--surface-sunken)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)', borderRadius: 12 }}>
      <BookCover title={cover ?? title.toUpperCase()} />
      <span className="col grow" style={{ gap: 2 }}>
        <span className="t-label-l c-primary">{title}</span>
        <span className="t-body-s c-secondary">{author}</span>
      </span>
      {onChange && <button className="t-label c-link" onClick={onChange}>Change</button>}
    </div>
  );
}

export function AvatarPickerCell({ art, palette, selected, onClick, size = 56 }: { art: number; palette: Palette; selected: boolean; onClick?: () => void; size?: number }) {
  const scale = size / 56;
  return (
    <button
      onClick={onClick}
      style={{ padding: 2 * scale, borderRadius: 16 * scale, boxShadow: selected ? `0 0 0 ${2 * scale}px var(--border-focus)` : undefined, display: 'flex' }}
      aria-pressed={selected}
    >
      <span style={{ width: size, height: size, display: 'flex' }}>
        <span style={{ transform: `scale(${scale})`, transformOrigin: 'top left', display: 'flex' }}>
          <ClubAvatar art={art} palette={palette} size={56} />
        </span>
      </span>
    </button>
  );
}

/* ——— Generic list row with icon (used by About/Help lists) ——— */
export function IconRow({ icon, label, onClick, right }: { icon: IconName; label: string; onClick?: () => void; right?: ReactNode }) {
  return (
    <button className="row fill" style={{ padding: 12, gap: 12, background: 'var(--surface-default)' }} onClick={onClick}>
      <Icon name={icon} size={20} tone="secondary" />
      <span className="t-label-l c-primary grow">{label}</span>
      {right ?? <Icon name="CaretRight" size={18} tone="tertiary" />}
    </button>
  );
}
