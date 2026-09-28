import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import { BadgeCount, BadgeDot, IconButton } from './core';
import levelsSvg from '../../assets/img/statusbar-levels.svg?raw';
import { nav } from '../../lib/nav';
import { app, useApp } from '../../data/app';

export function StatusBar({ light }: { light?: boolean }) {
  return (
    <div className={`status-bar ${light ? 'light' : ''}`}>
      <span className="time">9:41</span>
      <span style={{ width: 78, height: 13 }} dangerouslySetInnerHTML={{ __html: levelsSvg }} />
    </div>
  );
}

type AppBarProps = {
  title?: ReactNode;
  back?: boolean;
  onBack?: () => void;
  backIcon?: IconName;
  actions?: ReactNode;
  textAction?: { label: string; onClick?: () => void; disabled?: boolean };
  variant?: 'default' | 'root' | 'text';
  subtitle?: ReactNode;
  style?: CSSProperties;
  bordered?: boolean;
};

export function AppBar({ title, back = true, onBack, backIcon = 'CaretLeft', actions, textAction, variant = 'default', subtitle, style, bordered = true }: AppBarProps) {
  const goBack = onBack ?? (() => nav.pop());
  const shadow = bordered ? undefined : { boxShadow: 'none' };
  if (variant === 'root') {
    return (
      <header className="appbar" style={{ ...shadow, ...style }}>
        <div className="bar" style={{ padding: '0 8px 0 16px' }}>
          <span className="t-title-l c-primary grow trunc">{title}</span>
          {textAction && (
            <button className={`t-label-l ${textAction.disabled ? 'c-disabled' : 'c-link'}`} style={{ padding: '12px' }} onClick={textAction.onClick} disabled={textAction.disabled}>
              {textAction.label}
            </button>
          )}
          {actions}
        </div>
      </header>
    );
  }
  if (variant === 'text') {
    return (
      <header className="appbar" style={{ ...shadow, ...style }}>
        <div className="bar" style={{ padding: '0 20px 0 4px' }}>
          {back ? <IconButton icon={backIcon} onClick={goBack} label="Back" /> : <span style={{ width: 44 }} />}
          <span className="t-title-s c-primary grow tc trunc">{title}</span>
          <span style={{ minWidth: 32, display: 'flex', justifyContent: 'flex-end' }}>
            {textAction && (
              <button className={`t-label-l ${textAction.disabled ? 'c-disabled' : 'c-link'} tr`} onClick={textAction.onClick} disabled={textAction.disabled}>
                {textAction.label}
              </button>
            )}
          </span>
        </div>
      </header>
    );
  }
  return (
    <header className="appbar" style={{ ...shadow, ...style }}>
      <div className="bar" style={{ padding: back ? '0 4px' : '0 4px 0 16px' }}>
        {back && <IconButton icon={backIcon} onClick={goBack} label="Back" />}
        {subtitle ? (
          <span className="col grow" style={{ gap: 2 }}>
            <span className="t-title-s c-primary trunc">{title}</span>
            <span className="t-caption c-secondary trunc">{subtitle}</span>
          </span>
        ) : (
          <span className="t-title-s c-primary grow trunc">{title}</span>
        )}
        {actions}
        {textAction && (
          <button className={`t-label-l ${textAction.disabled ? 'c-disabled' : 'c-link'}`} style={{ padding: '0 16px' }} onClick={textAction.onClick} disabled={textAction.disabled}>
            {textAction.label}
          </button>
        )}
      </div>
    </header>
  );
}

/** "Modal Cover Header": close on the left, centred title + step. */
export function ModalHeader({ title, step, onClose, closeIcon = 'X', right }: { title: string; step?: string; onClose?: () => void; closeIcon?: IconName; right?: ReactNode }) {
  return (
    <header className="appbar">
      <div className="bar" style={{ padding: '0 4px', gap: 8 }}>
        <IconButton icon={closeIcon} onClick={onClose ?? (() => nav.pop())} label="Close" />
        <span className="col grow center" style={{ gap: 2 }}>
          <span className="t-label-l c-primary tc trunc fill">{title}</span>
          {step && <span className="t-caption c-secondary tc">{step}</span>}
        </span>
        <span style={{ width: 44, display: 'flex', justifyContent: 'flex-end' }}>{right}</span>
      </div>
    </header>
  );
}

export type TabName = 'home' | 'discover' | 'bookclubs' | 'alerts' | 'profile';
const TABS: Array<{ id: TabName; label: string; icon: IconName }> = [
  { id: 'home', label: 'Home', icon: 'House' },
  { id: 'discover', label: 'Discover', icon: 'Compass' },
  { id: 'bookclubs', label: 'Bookclubs', icon: 'ChatsCircle' },
  { id: 'alerts', label: 'Alerts', icon: 'Bell' },
  { id: 'profile', label: 'Profile', icon: 'User' },
];

export function TabBar({ active }: { active: TabName }) {
  const alerts = useApp((s) => s.alertsBadge);
  const dot = useApp((s) => s.bookclubsDot);
  return (
    <nav className="tabbar">
      {TABS.map((t) => {
        const on = t.id === active;
        return (
          <button key={t.id} className={`tab ${on ? 'on' : ''}`} onClick={() => app.goTab(t.id)}>
            <span className="pill-bg">
              <Icon name={t.icon} size={24} weight={on ? 'fill' : 'regular'} tone={on ? 'default' : 'secondary'} />
            </span>
            <span className={`t-label-s tc ${on ? 'c-primary' : 'c-secondary'}`}>{t.label}</span>
            {t.id === 'bookclubs' && dot && <BadgeDot style={{ position: 'absolute', top: 4, left: 'calc(50% + 5px)' }} />}
            {t.id === 'alerts' && alerts > 0 && <BadgeCount n={alerts} style={{ position: 'absolute', top: 4, left: 'calc(50% + 3px)' }} />}
          </button>
        );
      })}
    </nav>
  );
}

type ScreenProps = {
  header?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  tab?: TabName;
  bg?: string;
  bodyStyle?: CSSProperties;
  bodyRef?: React.Ref<HTMLDivElement>;
  overlay?: ReactNode;
  noScroll?: boolean;
};

export function Screen({ header, children, footer, tab, bg, bodyStyle, bodyRef, overlay, noScroll }: ScreenProps) {
  return (
    <div className="screen" style={bg ? { background: bg } : undefined}>
      {header}
      <div className="screen-body" ref={bodyRef} style={{ ...(noScroll ? { overflow: 'hidden', display: 'flex', flexDirection: 'column' } : null), ...bodyStyle }}>
        {children}
      </div>
      {footer}
      {tab && <TabBar active={tab} />}
      {overlay}
    </div>
  );
}

/** Footer pinned to the bottom of a screen (the "pinned-footer" frames in Figma). */
export function PinnedFooter({ children, style, bg = 'var(--surface-canvas)' }: { children: ReactNode; style?: CSSProperties; bg?: string }) {
  return (
    <div className="col" style={{ padding: '16px 16px max(16px, calc(var(--inset-bottom) - 2px))', gap: 12, background: bg, flexShrink: 0, ...style }}>
      {children}
    </div>
  );
}
