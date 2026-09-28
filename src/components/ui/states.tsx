import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import { Button } from './core';

export function EmptyState({ icon, title, body, action, onAction, link, onLink, style }: {
  icon: IconName; title: string; body: string; action?: string; onAction?: () => void; link?: string; onLink?: () => void; style?: CSSProperties;
}) {
  return (
    <div className="col fill" style={{ padding: '48px 32px', gap: 12, alignItems: 'center', ...style }}>
      <span className="col center" style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--surface-sunken)' }}>
        <Icon name={icon} size={32} tone="tertiary" />
      </span>
      <span className="t-title-s c-primary tc fill">{title}</span>
      <span className="t-body-s c-secondary tc fill">{body}</span>
      {(action || link) && (
        <div className="col" style={{ paddingTop: 8, gap: 12, alignItems: 'center' }}>
          {action && <Button onClick={onAction}>{action}</Button>}
          {link && <button className="t-label c-link" onClick={onLink}>{link}</button>}
        </div>
      )}
    </div>
  );
}

export function ErrorState({ title, body, action, onAction, icon = 'WarningCircle', style }: {
  title: string; body: string; action?: string; onAction?: () => void; icon?: IconName; style?: CSSProperties;
}) {
  return (
    <div className="col fill" style={{ padding: '48px 32px', gap: 12, alignItems: 'center', ...style }}>
      <Icon name={icon} size={36} tone="tertiary" />
      <span className="t-title-s c-primary tc fill">{title}</span>
      <span className="t-body-s c-secondary tc fill">{body}</span>
      {action && (
        <div className="col" style={{ paddingTop: 8 }}>
          <Button kind="secondary" onClick={onAction}>{action}</Button>
        </div>
      )}
    </div>
  );
}

export function ConnectionBanner({ state = 'offline', text }: { state?: 'offline' | 'connecting' | 'restored'; text?: string }) {
  const restored = state === 'restored';
  return (
    <div
      className="row"
      style={{
        padding: '8px 16px', gap: 8, flexShrink: 0, minHeight: 32,
        background: restored ? 'var(--accent-surface)' : 'var(--surface-sunken)',
        boxShadow: 'inset 0 -1px 0 var(--border-subtle)', position: 'relative', zIndex: 4,
      }}
    >
      <Icon name={state === 'offline' ? 'WifiSlash' : state === 'connecting' ? 'CircleNotch' : 'CheckCircle'} size={16} tone={restored ? 'accent' : 'secondary'} spin={state === 'connecting'} />
      <span className={`t-caption grow ${restored ? 'c-accent' : 'c-secondary'}`}>
        {text ?? (state === 'offline' ? 'No connection. Messages will send when you’re back online.' : state === 'connecting' ? 'Connecting…' : 'Back online.')}
      </span>
    </div>
  );
}

function Bar({ w }: { w: number | string }) {
  return <span className="skel" style={{ width: w, height: 10, borderRadius: 4, display: 'block' }} />;
}
export function Skeleton({ type }: { type: 'row' | 'message' | 'card' }) {
  if (type === 'card') {
    return (
      <div className="row skel-row fill" style={{ padding: '12px 0', gap: 12, alignItems: 'flex-start' }}>
        <span className="skel" style={{ width: 48, height: 64, borderRadius: 12, flexShrink: 0 }} />
        <span className="col grow" style={{ paddingTop: 4, gap: 8 }}><Bar w={170} /><Bar w={247} /></span>
      </div>
    );
  }
  return (
    <div className="row skel-row fill" style={{ padding: '12px 0', gap: 12, alignItems: 'flex-start' }}>
      <span className="skel" style={{ width: 40, height: 40, borderRadius: 999, flexShrink: 0 }} />
      <span className="col grow" style={{ paddingTop: 4, gap: 8 }}>
        {type === 'row' ? (<><Bar w={170} /><Bar w={247} /></>) : (<><Bar w={155} /><Bar w="100%" /><Bar w={232} /></>)}
      </span>
    </div>
  );
}

/** The shimmer sweep drawn over loading screens (“1.2s left-to-right sweep, ease-in-out, loops”). */
export function Shimmer({ top = 0, bottom = 0 }: { top?: number; bottom?: number }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, bottom, overflow: 'hidden', pointerEvents: 'none', zIndex: 3 }}>
      <div className="shimmer-sweep" />
    </div>
  );
}

export function LimitReached({ title, body, onPlans, onNotNow, children }: { title: string; body: string; onPlans?: () => void; onNotNow?: () => void; children?: ReactNode }) {
  return (
    <div className="col fill" style={{ padding: '8px 16px', gap: 16 }}>
      <span className="t-title-s c-primary">{title}</span>
      <span className="t-body-s c-secondary">{body}</span>
      {children ?? (
        <div className="row" style={{ padding: 16, gap: 12, background: 'var(--surface-sunken)', borderRadius: 12 }}>
          <span className="col grow" style={{ gap: 2 }}>
            <span className="t-label-l c-primary">Premium</span>
            <span className="t-caption c-secondary">Renews every 30 days · cancel any time</span>
          </span>
          <span className="t-title-s c-primary">₦1,000</span>
        </div>
      )}
      <div className="col" style={{ gap: 8, alignItems: 'center' }}>
        <Button onClick={onPlans}>See plans</Button>
        <Button kind="ghost" onClick={onNotNow}>Not now</Button>
      </div>
    </div>
  );
}
