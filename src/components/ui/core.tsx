import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import { AVATAR_ART } from '../avatarArt';
import appleSvg from '../../assets/img/apple.svg?raw';
import googleSvg from '../../assets/img/google.svg?raw';

/* ——— Button ——— */
export type ButtonStyle = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger' | 'danger-outline';
type ButtonProps = {
  children?: ReactNode;
  kind?: ButtonStyle;
  size?: 'md' | 'sm';
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leading?: IconName;
  trailing?: IconName;
  onClick?: () => void;
  style?: CSSProperties;
};
export function Button({ children, kind = 'primary', size = 'md', full, disabled, loading, leading, trailing, onClick, style }: ButtonProps) {
  const ic = size === 'sm' ? 18 : 20;
  return (
    <button
      className={`btn btn-${kind} ${size === 'sm' ? 'sm' : ''} ${full ? 'full' : ''} ${loading ? 'loading' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
      style={style}
    >
      {loading ? (
        <Icon name="CircleNotch" size={ic} tone="current" spin />
      ) : (
        <>
          {leading && <Icon name={leading} size={ic} tone="current" />}
          {children}
          {trailing && <Icon name={trailing} size={ic} tone="current" />}
        </>
      )}
    </button>
  );
}

export function SocialButton({ provider, onClick }: { provider: 'apple' | 'google'; onClick?: () => void }) {
  return (
    <button className={`social ${provider}`} onClick={onClick}>
      <span style={{ width: 20, height: 20 }} dangerouslySetInnerHTML={{ __html: provider === 'apple' ? appleSvg : googleSvg }} />
      {provider === 'apple' ? 'Continue with Apple' : 'Continue with Google'}
    </button>
  );
}

export function IconButton({ icon, onClick, kind = 'ghost', weight, size = 24, label, tone }: {
  icon: IconName; onClick?: () => void; kind?: 'ghost' | 'filled' | 'subtle' | 'danger'; weight?: 'regular' | 'bold' | 'fill'; size?: number; label?: string; tone?: Parameters<typeof Icon>[0]['tone'];
}) {
  const t = tone ?? (kind === 'filled' ? 'on-fill' : kind === 'danger' ? 'danger' : 'default');
  return (
    <button className={`icon-btn ${kind}`} onClick={onClick} aria-label={label ?? icon}>
      <Icon name={icon} size={size} weight={weight} tone={t} />
    </button>
  );
}

/* ——— Badge ——— */
export const BadgeDot = ({ style }: { style?: CSSProperties }) => <span className="badge-dot" style={style} />;
export const BadgeCount = ({ n, style }: { n: number | string; style?: CSSProperties }) => <span className="badge-count" style={style}>{n}</span>;

/* ——— Avatars ——— */
export function Avatar({ initials = 'AO', size = 'md', style }: { initials?: string; size?: 'sm' | 'md' | 'lg'; style?: CSSProperties }) {
  const px = size === 'sm' ? 26 : size === 'md' ? 32 : 52;
  return <span className={`avatar ${size === 'lg' ? 'lg' : ''}`} style={{ width: px, height: px, ...style }}>{initials}</span>;
}

export function AvatarGroup({ initials = ['AO', 'AO', 'AO'], more }: { initials?: string[]; more?: string }) {
  return (
    <div className="avatar-group">
      {initials.map((i, k) => (
        <span className="ring" key={k}><Avatar initials={i} size="sm" /></span>
      ))}
      {more && (
        <span style={{ width: 30, height: 30, display: 'flex' }}>
          <span className="more"><span className="t-label-s c-secondary">{more}</span></span>
        </span>
      )}
    </div>
  );
}

export type Palette = 'indigo' | 'forest' | 'clay' | 'rose' | 'teal' | 'plum';
const CLUB_AV: Record<number, { pad: number; r: number; art: number }> = {
  56: { pad: 8, r: 16, art: 40 }, 40: { pad: 4, r: 12, art: 32 }, 32: { pad: 4, r: 8, art: 24 }, 24: { pad: 2, r: 4, art: 20 },
};
export function ArtGlyph({ art, box }: { art: number; box: number }) {
  const def = AVATAR_ART[art] ?? AVATAR_ART[1];
  const h = (box * def.h) / 48;
  const w = (box * def.w) / 48;
  return (
    <span className="art" style={{ width: box, height: box }}>
      <svg width={w} height={h} viewBox={def.vb} fill="none" dangerouslySetInnerHTML={{ __html: def.svg }} />
    </span>
  );
}
export function ClubAvatar({ art = 1, palette = 'indigo', size = 40, style }: { art?: number; palette?: Palette; size?: 56 | 40 | 32 | 24; style?: CSSProperties }) {
  const s = CLUB_AV[size];
  return (
    <span className={`club-av pal-${palette}`} style={{ width: size, height: size, padding: s.pad, borderRadius: s.r, ...style }}>
      <ArtGlyph art={art} box={s.art} />
    </span>
  );
}

export function BookCover({ title = 'PIRANESI', size = 'sm' }: { title?: string; size?: 'sm' | 'md' }) {
  const [w, h] = size === 'sm' ? [46, 69] : [96, 144];
  return (
    <div className="book-cover" style={{ width: w, height: h }}>
      <span className={`${size === 'sm' ? 't-label-s' : 't-label'} c-tertiary`} style={{ display: '-webkit-box', WebkitLineClamp: size === 'sm' ? 3 : 5, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>{title}</span>
    </div>
  );
}

/* ——— Status pill / chip ——— */
export function StatusPill({ kind, label }: { kind: 'live' | 'neutral' | 'warning' | 'danger' | 'public' | 'private'; label?: string }) {
  const text = label ?? { live: 'Live now', neutral: 'Opens Thursday', warning: 'Spoilers ahead', danger: 'Reported', public: 'Public', private: 'Private' }[kind];
  return (
    <span className={`pill pill-${kind}`}>
      {kind === 'live' && <span className="dot" />}
      {kind === 'public' && <Icon name="Globe" size={13} tone="secondary" />}
      {kind === 'private' && <Icon name="LockSimple" size={13} tone="secondary" />}
      {text}
    </span>
  );
}

export function Chip({ label, on, onClick, removable, onRemove }: { label: string; on?: boolean; onClick?: () => void; removable?: boolean; onRemove?: () => void }) {
  return (
    <button className={`chip ${on ? 'on' : ''}`} onClick={onClick}>
      {label}
      {removable && (
        <span onClick={(e) => { e.stopPropagation(); onRemove?.(); }} style={{ display: 'flex' }}>
          <Icon name="X" size={14} tone={on ? 'on-fill' : 'secondary'} />
        </span>
      )}
    </button>
  );
}

/* ——— Section header ——— */
export function SectionHeader({ title, link, onLink }: { title: string; link?: string; onLink?: () => void }) {
  return (
    <div className="row" style={{ padding: '20px 0 8px', gap: 8, width: '100%' }}>
      <span className="t-title-s c-primary grow">{title}</span>
      {link && <button className="t-label c-link" onClick={onLink}>{link}</button>}
    </div>
  );
}

/* ——— Controls ——— */
export const Toggle = ({ on, onChange, disabled }: { on: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) => (
  <button className={`toggle ${on ? 'on' : ''}`} disabled={disabled} onClick={() => onChange?.(!on)} aria-pressed={on} />
);

export const Checkbox = ({ on }: { on: boolean }) => (
  <span className={`checkbox ${on ? 'on' : ''}`}>{on && <Icon name="Check" size={14} tone="on-fill" />}</span>
);

export function CheckboxRow({ label, on, onChange }: { label: string; on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button className="row fill" style={{ padding: '8px 0', gap: 12 }} onClick={() => onChange?.(!on)}>
      <Checkbox on={on} />
      <span className="t-body c-primary grow">{label}</span>
    </button>
  );
}

export function RadioRow({ label, on, onClick }: { label: string; on: boolean; onClick?: () => void }) {
  return (
    <button className="row fill" style={{ padding: '8px 0', gap: 12 }} onClick={onClick}>
      <span className={`radio ${on ? 'on' : ''}`} />
      <span className="t-body c-primary grow">{label}</span>
    </button>
  );
}

export function SelectionCard({ icon, title, desc, on, onClick }: { icon?: IconName; title: string; desc: string; on: boolean; onClick?: () => void }) {
  return (
    <button className={`sel-card ${on ? 'on' : ''}`} onClick={onClick}>
      {icon && <Icon name={icon} size={24} tone={on ? 'default' : 'secondary'} />}
      <span className="col grow" style={{ gap: 2 }}>
        <span className="t-label-l c-primary">{title}</span>
        <span className="t-body-s c-secondary">{desc}</span>
      </span>
      {on && <Icon name="CheckCircle" size={22} tone="default" />}
    </button>
  );
}

export const SelectionCheck = ({ on }: { on: boolean }) => (
  <span className={`sel-check ${on ? 'on' : ''}`}>{on && <Icon name="Check" size={16} weight="bold" tone="on-fill" />}</span>
);

export const Spinner = ({ size = 20 }: { size?: 16 | 20 | 24 }) => <Icon name="CircleNotch" size={size} tone="secondary" spin />;

export function OnboardingProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div style={{ height: 3, background: 'var(--surface-sunken)', width: '100%', flexShrink: 0 }}>
      <div style={{ height: 3, width: `${(step / 3) * 100}%`, background: 'var(--action-primary)' }} />
    </div>
  );
}

export function FAB({ label, onClick, style }: { label?: string; onClick?: () => void; style?: CSSProperties }) {
  return (
    <button className={`fab ${label ? 'ext' : ''}`} onClick={onClick} style={style}>
      <Icon name="Plus" size={24} tone="on-fill" />
      {label}
    </button>
  );
}

export function Divider({ label, unread }: { label: string; unread?: boolean }) {
  const line = { flex: 1, height: 1, background: unread ? 'var(--text-link)' : 'var(--border-subtle)' };
  return (
    <div className="row fill" style={{ padding: '12px 0', gap: 12 }}>
      <span style={line} />
      <span className={`t-caption ${unread ? 'c-link' : 'c-tertiary'}`}>{label}</span>
      <span style={line} />
    </div>
  );
}
