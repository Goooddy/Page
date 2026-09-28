import { useEffect, useState } from 'react';
import { nav, type Params } from '../lib/nav';
import { app, useApp } from '../data/app';
import { AppBar } from '../components/ui/nav';
import { Button, SectionHeader, StatusPill } from '../components/ui/core';
import { SettingsRow } from '../components/ui/rows';
import { PromptSheet } from '../components/ui/overlays';
import { Icon } from '../components/Icon';

const FEATURES = ['As many bookclubs as you like, joined or created', 'No cap on members in rooms you create', 'Follow channels when they launch'];
const FREE = ['3 active bookclubs — 1 you create, 2 you join', 'Up to 10 members in a bookclub you create', 'Everything else works the same'];

function CurrentPlan({ name, line, pill, tone = 'neutral' }: { name: string; line?: string; pill: string; tone?: 'neutral' | 'warning' }) {
  return (
    <div className="row" style={{ padding: '12px 16px', gap: 12, background: 'var(--surface-default)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)', borderRadius: 8 }}>
      <span className="col grow" style={{ gap: 2 }}>
        <span className="t-label-s c-tertiary">Current plan</span>
        <span className="t-label c-secondary">{name}</span>
        {line && <span className="t-caption c-tertiary">{line}</span>}
      </span>
      <StatusPill kind={tone} label={pill} />
    </div>
  );
}

/** Starts a purchase: confirming → (Android: pending →) Premium. Fails when offline. */
export function purchase() {
  if (app.get().offline) {
    app.toast('Payment didn’t go through. Please try again.', 'error', { bottom: 24 });
    return;
  }
  app.set({ purchasing: true });
  setTimeout(() => {
    app.set({ purchasing: false });
    if (app.get().platform === 'android') {
      app.set({ plan: 'pending' });
      setTimeout(() => { if (app.get().plan === 'pending') { app.set({ plan: 'premium' }); app.toast('You’re on Premium', 'success', { bottom: 24 }); } }, 6000);
    } else {
      app.set({ plan: 'premium' });
      app.toast('You’re on Premium', 'success', { bottom: 24 });
    }
  }, 1600);
}

export function Plans({ params }: { params: Params }) {
  const plan = useApp((s) => s.plan);
  const android = useApp((s) => s.platform === 'android');
  const purchasing = useApp((s) => s.purchasing);
  const [cancel, setCancel] = useState(!!params.cancel);
  const store = android ? 'Google Play' : 'the App Store';
  useEffect(() => {
    if (params.toast === 'restore') app.toast('No previous purchase found on this account.', 'error', { bottom: 24 });
    if (params.toast === 'failed') app.toast('Payment didn’t go through. Please try again.', 'error', { bottom: 24 });
    if (params.toast === 'premium') app.toast('You’re on Premium', 'success', { bottom: 24 });
  }, [params.toast]);

  const subscribed = plan === 'premium' || plan === 'ending';
  return (
    <div className="screen">
      <AppBar title="Plans" />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 24px', gap: 12 }}>
          {subscribed ? (
            <>
              {plan === 'premium'
                ? <CurrentPlan name="Premium" line="Renews 17 October · ₦1,000 every 30 days" pill="Active" />
                : <CurrentPlan name="Premium" line="Ends 17 October · won’t renew" pill="Ending" tone="warning" />}
              <SectionHeader title="Your subscription" />
              <SettingsRow label={android ? 'Manage in Google Play' : 'Manage in the App Store'} />
              {plan === 'premium' ? (
                <>
                  <SettingsRow label="Cancel subscription" onClick={() => setCancel(true)} />
                  <p className="t-caption c-tertiary">Billed through {store}. Cancelling keeps Premium until 17 October, then your account returns to the free plan.</p>
                </>
              ) : (
                <>
                  <Button full onClick={() => app.set({ plan: 'premium' })}>Resubscribe</Button>
                  <p className="t-caption c-tertiary">You’ll keep everything until 17 October. After that your account returns to the free plan and any bookclubs over the free limit will pause.</p>
                </>
              )}
              <SectionHeader title="Questions" />
              <SettingsRow label="What’s included" onClick={() => nav.push('whats-included')} />
            </>
          ) : (
            <>
              {plan === 'trial' ? (
                <CurrentPlan name="Premium trial" line="Ends 2 Oct. After that you move to the free plan. Nothing is charged." pill="5 days left" />
              ) : plan === 'pending' ? (
                <CurrentPlan name="Free" line="Payment processing" pill="Pending" tone="warning" />
              ) : (
                <CurrentPlan name="Free" pill="Active" />
              )}
              <SectionHeader title="Premium" />
              <div className="col" style={{ padding: 16, gap: 12, background: 'var(--surface-default)', boxShadow: 'inset 0 0 0 2px var(--border-interactive)', borderRadius: 12 }}>
                <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
                  <span className="t-title c-secondary">₦1,000</span>
                  <span className="t-caption c-tertiary">every 30 days</span>
                </div>
                <div className="col" style={{ gap: 8 }}>
                  {FEATURES.map((f) => (
                    <div key={f} className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                      <Icon name="Check" size={16} style={{ marginTop: 1 }} />
                      <span className="t-body-s c-secondary">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              {plan === 'pending' ? (
                <p className="t-caption c-tertiary">Google Play is still confirming your payment. You don’t need to pay again — Premium starts as soon as it clears, and we’ll send you an alert.</p>
              ) : (
                <>
                  <Button full loading={purchasing || !!params.confirming} onClick={purchase}>{plan === 'trial' ? 'Keep Premium after your trial' : 'Upgrade to Premium'}</Button>
                  <p className="t-caption c-tertiary">
                    {android ? 'Billed through Google Play. Renews every 30 days until cancelled. Manage or cancel any time in Google Play.' : 'Billed through the App Store. Renews every 30 days until cancelled. Manage or cancel any time in your store account.'}
                  </p>
                </>
              )}
              <SectionHeader title="On the free plan" />
              <div className="col" style={{ padding: 16, gap: 8, background: 'var(--surface-sunken)', borderRadius: 12 }}>
                {FREE.map((f) => <span key={f} className="t-body-s c-tertiary">{f}</span>)}
              </div>
              <SectionHeader title="Questions" />
              <SettingsRow label="What’s included" onClick={() => nav.push('whats-included')} />
              <SettingsRow label="Restore a purchase" onClick={() => app.toast('No previous purchase found on this account.', 'error', { bottom: 24 })} />
            </>
          )}
        </div>
      </div>
      {cancel && (
        <>
          <div className="scrim" onClick={() => setCancel(false)} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41, animation: 'modalIn 280ms cubic-bezier(.2,.8,.2,1) both' }}>
            <PromptSheet
              icon="Globe"
              title={`Cancelling happens in ${android ? 'Google Play' : 'the App Store'}`}
              body="Page234 can’t cancel it for you. Open your store account, then come back — Premium runs until 17 October either way."
              primary={android ? 'Open Google Play settings' : 'Open App Store settings'}
              secondary="Never mind"
              onPrimary={() => { setCancel(false); app.set({ plan: 'ending' }); }}
              onSecondary={() => setCancel(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function WhatsIncluded() {
  const rows: Array<[string, string, string]> = [
    ['Bookclubs you can keep active', '3', 'Unlimited'],
    ['Bookclubs you can create', '1', 'Unlimited'],
    ['Members in a room you create', '10', 'Unlimited'],
    ['Reading, replying and threads', 'Yes', 'Yes'],
    ['Alerts and notifications', 'Yes', 'Yes'],
    ['Follow channels', '—', 'Soon'],
  ];
  return (
    <div className="screen">
      <AppBar title="What’s included" />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 32px' }}>
          <div className="row" style={{ paddingBottom: 8, gap: 12 }}>
            <span className="grow" />
            <span className="t-label-s c-tertiary tc" style={{ width: 56 }}>Free</span>
            <span className="t-label-s c-link tc" style={{ width: 84 }}>Premium</span>
          </div>
          {rows.map(([label, free, prem]) => (
            <div key={label} className="row" style={{ padding: '12px 0', gap: 12 }}>
              <span className="t-body-s c-secondary grow">{label}</span>
              <span className="t-caption c-tertiary tc" style={{ width: 56 }}>{free}</span>
              <span className="t-label c-secondary tc" style={{ width: 84 }}>{prem}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
