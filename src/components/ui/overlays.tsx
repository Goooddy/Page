import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import { app, useApp } from '../../data/app';
import { Button } from './core';
import disconnected from '../../assets/img/disconnected.svg';

export function ToastHost() {
  const t = useApp((s) => s.toast);
  const bottom = useApp((s) => s.toastBottom);
  if (!t) return null;
  const icon: IconName = t.icon ?? (t.kind === 'success' ? 'CheckCircle' : t.kind === 'error' ? 'WarningCircle' : 'Trash');
  return (
    <div style={{ position: 'absolute', left: 16, right: 16, bottom, zIndex: 60 }} key={t.id}>
      <div className="toast" onClick={() => { if (t.kind === 'error' && t.action) { t.action.run(); app.hideToast(); } }}>
        <Icon name={icon} size={20} tone="inverse" />
        <span className="t-body-s grow" style={{ color: 'var(--text-inverse)' }}>{t.text}</span>
        {t.action && t.kind !== 'error' && (
          <button className="t-label" style={{ color: 'var(--text-inverse)' }} onClick={() => { t.action?.run(); app.hideToast(); }}>
            {t.action.label}
          </button>
        )}
      </div>
    </div>
  );
}

/** Static toast placed by a screen (used where Figma shows one in a fixed spot). */
export function ToastView({ icon, text, action, onAction, style }: { icon: IconName; text: string; action?: string; onAction?: () => void; style?: CSSProperties }) {
  return (
    <div className="toast" style={style}>
      <Icon name={icon} size={20} tone="inverse" />
      <span className="t-body-s grow" style={{ color: 'var(--text-inverse)' }}>{text}</span>
      {action && <button className="t-label" style={{ color: 'var(--text-inverse)' }} onClick={onAction}>{action}</button>}
    </div>
  );
}

export function Sheet({ children, onClose, style }: { children: ReactNode; onClose?: () => void; style?: CSSProperties }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" style={style}>
        <span className="handle" />
        {children}
      </div>
    </>
  );
}

export function SheetTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="col fill" style={{ padding: '12px 16px', gap: 4 }}>
      <span className="t-title-s c-primary">{title}</span>
      {subtitle && <span className="t-body-s c-secondary">{subtitle}</span>}
    </div>
  );
}

export function MenuRow({ icon, label, tone = 'default', chevron, onClick, right, style }: {
  icon?: IconName; label: string; tone?: 'default' | 'destructive' | 'choice'; chevron?: boolean; onClick?: () => void; right?: ReactNode; style?: CSSProperties;
}) {
  return (
    <button className="menu-row" onClick={onClick} style={style}>
      {icon && tone !== 'choice' && <Icon name={icon} size={22} tone={tone === 'destructive' ? 'danger' : 'default'} />}
      <span className={`t-body grow ${tone === 'destructive' ? 'c-danger' : 'c-primary'}`}>{label}</span>
      {right}
      {chevron && <Icon name="CaretRight" size={20} tone="tertiary" />}
    </button>
  );
}

export function Dialog({ title, body, confirm, onConfirm, onCancel, cancel = 'Cancel' }: {
  title: string; body: ReactNode; confirm: string; onConfirm: () => void; onCancel: () => void; cancel?: string;
}) {
  return (
    <>
      <div className="scrim" onClick={onCancel} />
      <div className="dialog-wrap" onClick={onCancel}>
        <div className="dialog" onClick={(e) => e.stopPropagation()} role="alertdialog">
          <span className="t-title-s c-primary tc fill">{title}</span>
          <span className="t-body-s c-secondary tc fill">{body}</span>
          <div className="actions">
            <button className="cancel" onClick={onCancel}>{cancel}</button>
            <button className="danger" onClick={onConfirm}>{confirm}</button>
          </div>
        </div>
      </div>
    </>
  );
}

export function PromptSheet({ icon, illustration, title, body, primary, secondary, onPrimary, onSecondary }: {
  icon?: IconName; illustration?: boolean; title: string; body: string; primary: string; secondary: string; onPrimary: () => void; onSecondary: () => void;
}) {
  return (
    <div className="col" style={{ background: 'var(--surface-default)', borderRadius: '14px 14px 0 0', padding: '10px 16px 32px', gap: 10, alignItems: 'center' }}>
      <span style={{ width: 38, height: 4, borderRadius: 2, background: '#cccccc' }} />
      {illustration && <img src={disconnected} alt="" style={{ width: '100%', height: 96, objectFit: 'fill' }} />}
      {icon && <Icon name={icon} size={24} />}
      <span className="t-title-s c-secondary tc fill">{title}</span>
      <span className="t-body-s c-tertiary tc fill">{body}</span>
      <Button full onClick={onPrimary}>{primary}</Button>
      <Button full kind="secondary" onClick={onSecondary}>{secondary}</Button>
    </div>
  );
}

export function Popover({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div className="popover" style={{ position: 'absolute', zIndex: 45, ...style }}>{children}</div>;
}
