import { useState } from 'react';
import { nav } from '../lib/nav';
import { app, useApp } from '../data/app';
import { AppBar, PinnedFooter } from '../components/ui/nav';
import { Button, Checkbox, ClubAvatar } from '../components/ui/core';
import { PromptSheet } from '../components/ui/overlays';
import wallpaper from '../assets/img/wallpaper.jpg';
import appIcon from '../assets/img/app-icon.svg';
import { alerts } from './alerts';

/* ——— App-wide prompt sheets (limits, trial end, background delivery) ——— */
export type GlobalSheet = 'limit-join' | 'trial-manage' | 'trial-free' | 'background' | null;

/** Runs `join` unless the free plan is already full, in which case the limit sheet opens. */
export function withFreeSlot(join: () => void) {
  const p = app.get().plan;
  if (p === 'free' || p === 'pending') { app.set({ sheet: 'limit-join' }); return; }
  join();
}

export function SheetHost() {
  const sheet = useApp((s) => s.sheet);
  if (!sheet) return null;
  const close = () => app.set({ sheet: null });
  const props = {
    'limit-join': {
      illustration: true, title: 'You’re using all 3 free bookclubs', body: 'The free plan keeps 3 bookclubs active. Upgrade to join this one, or leave a bookclub to make room.',
      primary: 'Upgrade', secondary: 'Cancel', onPrimary: () => { close(); nav.push('plans'); }, onSecondary: close,
    },
    'trial-manage': {
      illustration: true, title: 'Your 7-day trial has ended', body: 'You’re on the free plan now, which keeps 3 bookclubs active. You’re in 6, so some will pause until you choose.',
      primary: 'Upgrade', secondary: 'Choose which 3 stay', onPrimary: () => { close(); nav.push('plans'); }, onSecondary: () => { close(); nav.push('keep-active'); },
    },
    'trial-free': {
      illustration: true, title: 'Your 7-day trial has ended', body: 'You’re on the free plan now. That’s 3 active bookclubs and up to 10 members in a room you create.',
      primary: 'Upgrade', secondary: 'Continue on Free', onPrimary: () => { close(); nav.push('plans'); }, onSecondary: close,
    },
    background: {
      icon: 'BellSlash' as const, title: 'Make sure replies reach you', body: 'Your phone may close Page234 to save battery, and replies can stop coming through. Let it keep running from Settings.',
      primary: 'Open settings', secondary: 'Not now', onPrimary: close, onSecondary: close,
    },
  }[sheet];
  return (
    <>
      <div className="scrim" style={{ zIndex: 70 }} onClick={close} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 71, animation: 'modalIn 280ms cubic-bezier(.2,.8,.2,1) both' }}>
        <PromptSheet {...props} />
      </div>
    </>
  );
}

/* ——— Manage active bookclubs ——— */
export function KeepActive() {
  const [keep, setKeep] = useState<string[]>(['midnight', 'quill', 'clue']);
  const rooms: Array<[string, string, string]> = [
    ['midnight', 'Midnight Readers Club', 'Atomic Habits · 2.1k members'],
    ['quill', 'The Quill Society', 'Deep Work · 1.8k members'],
    ['clue', 'Clue Seekers', 'The Silent Patient · 840 members'],
    ['poetry-sundays', 'Poetry on Sundays', 'Selected Poems · 1.1k members'],
    ['african-lit', 'African Literature Now', 'Crimson Blossoms · 3.2k members'],
    ['historical', 'Historical Narratives', 'Half of a Yellow Sun · 3.4k members'],
  ];
  const toggle = (id: string) => setKeep((k) => (k.includes(id) ? k.filter((x) => x !== id) : k.length >= 3 ? k : [...k, id]));
  return (
    <div className="screen">
      <AppBar title="Keep active" />
      <div className="screen-body">
        <div className="col" style={{ padding: '12px 16px 16px' }}>
          <div className="col" style={{ paddingBottom: 12, gap: 4 }}>
            <span className="t-title-s c-secondary">Choose 3 to keep active</span>
            <span className="t-body-s c-tertiary">The rest pause — you keep your messages, and they come back if you upgrade. Nothing is deleted.</span>
          </div>
          {rooms.map(([id, name, meta], i) => {
            const on = keep.includes(id);
            // Once 3 are chosen, the rest fade (Figma: 55% opacity) and can't be picked until one is unticked.
            const faded = !on && keep.length >= 3;
            return (
              <button key={id} className="row fill" style={{ padding: '8px 0', gap: 12, opacity: faded ? 0.55 : 1, transition: 'opacity 150ms' }} onClick={() => toggle(id)}>
                <Checkbox on={on} />
                <ClubAvatar art={i + 1} size={32} />
                <span className="col grow" style={{ gap: 2 }}>
                  <span className={`t-label ${on ? 'c-secondary' : 'c-tertiary'}`}>{name}</span>
                  <span className="t-caption c-tertiary">{meta}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <PinnedFooter style={{ gap: 8 }}>
        <Button full onClick={() => nav.push('plans')}>Upgrade</Button>
        <Button full kind="secondary" disabled={keep.length !== 3} onClick={() => { app.set({ plan: 'free' }); nav.pop(); }}>Save and continue on Free</Button>
      </PinnedFooter>
    </div>
  );
}

/* ——— Push notifications ——— */
const openThread = () => { app.set({ signedIn: true }); nav.reset([['bookclubs'], ['thread', { club: 'midnight', cold: true }]]); };
const acceptInvite = () => { app.set({ signedIn: true }); alerts.acceptInvite(); nav.reset([['alerts'], ['chat', { club: 'bible' }]]); };

export function LockScreen() {
  const [inviteGone, setInviteGone] = useState(false);
  const card = { background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', borderRadius: 16, padding: 12, display: 'flex', flexDirection: 'column' as const };
  const Meta = ({ when }: { when: string }) => (
    <div className="row" style={{ gap: 8 }}>
      <img src={appIcon} alt="" style={{ width: 18, height: 18 }} />
      <span className="t-label-s grow" style={{ color: '#6b6b6b' }}>PAGE234</span>
      <span className="t-caption" style={{ color: '#8c8c8c' }}>{when}</span>
    </div>
  );
  return (
    <div className="screen" style={{ background: `url(${wallpaper}) center / cover no-repeat` }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.38) 0%, rgba(0,0,0,.06) 20%, rgba(0,0,0,.06) 26%, rgba(0,0,0,.30) 34%, rgba(0,0,0,.34) 100%)' }} />
      <div className="col" style={{ position: 'absolute', top: 64, left: 0, right: 0, gap: 2, alignItems: 'center', color: '#fff' }}>
        <span className="t-body-s">Monday 7 September</span>
        <span style={{ font: '700 80px/80px var(--font)', letterSpacing: '-0.02em' }}>9:41</span>
      </div>
      <div className="col" style={{ position: 'absolute', top: 240, left: 16, right: 16, gap: 4 }}>
        <button style={{ ...card, gap: 4, textAlign: 'left' }} onClick={openThread}>
          <Meta when="now" />
          <span className="t-label" style={{ color: '#0d0d0d' }}>Amaka replied to your message</span>
          <span className="t-body-s" style={{ color: '#595959' }}>Midnight Readers Club · “Okayyy guys, I just finished chapter 2 and I feel personally…”</span>
        </button>
        <div style={{ margin: '0 auto', width: 336, maxWidth: 'calc(100% - 24px)', height: 14, background: 'rgba(255,255,255,0.62)', borderRadius: '0 0 12px 12px', marginTop: -4 }} />
        <span className="t-caption tc" style={{ color: '#fff' }}>Midnight Readers Club · 3 new replies</span>
        {!inviteGone && (
          <div style={{ ...card, gap: 8 }}>
            <Meta when="1h ago" />
            <span className="t-label" style={{ color: '#0d0d0d' }}>Joseph234 invited you to The Bible Readers</span>
            <div className="row" style={{ gap: 8, paddingTop: 2 }}>
              {['Accept', 'Decline'].map((l) => (
                <button key={l} className="t-label grow tc" style={{ padding: '8px 0', borderRadius: 12, background: '#ededf2', color: '#0d0d0d' }}
                  onClick={() => (l === 'Accept' ? acceptInvite() : (alerts.declineInvite(), setInviteGone(true)))}>{l}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AndroidShade() {
  const [gone, setGone] = useState<string[]>([]);
  const card = { background: '#24242b', borderRadius: 24, padding: '12px 16px', display: 'flex', flexDirection: 'column' as const, gap: 4, textAlign: 'left' as const };
  const Head = ({ channel, when }: { channel: string; when: string }) => (
    <div className="row" style={{ gap: 8 }}>
      <img src={appIcon} alt="" style={{ width: 16, height: 16 }} />
      <span className="t-caption grow" style={{ color: '#fff' }}>Page234 · {channel}</span>
      <span className="t-caption" style={{ color: '#fff' }}>{when}</span>
    </div>
  );
  const act = { color: '#8cb8f5' };
  return (
    <div className="screen" style={{ background: `url(${wallpaper}) center / cover no-repeat` }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(18,18,26,0.78)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }} />
      <div className="row" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 44, padding: '16px 20px 0' }}>
        <span className="t-label" style={{ color: '#fff' }}>9:41</span>
      </div>
      <div className="col" style={{ position: 'absolute', top: 64, left: 16, right: 16, gap: 8 }}>
        {!gone.includes('sum') && (
          <button style={card} onClick={openThread}>
            <Head channel="Replies & mentions" when="now" />
            <span className="t-label" style={{ color: '#fff' }}>Midnight Readers Club</span>
            <span className="t-body-s" style={{ color: '#fff' }}>3 new replies</span>
          </button>
        )}
        {!gone.includes('reply') && (
          <div style={card} className="tap" onClick={openThread}>
            <Head channel="Replies & mentions" when="now" />
            <span className="t-label" style={{ color: '#fff' }}>Amaka replied to your message</span>
            <span className="t-body-s" style={{ color: '#fff' }}>“Okayyy guys, I just finished chapter 2 and I feel personally…”</span>
            <div className="row" style={{ gap: 16, paddingTop: 4 }} onClick={(e) => e.stopPropagation()}>
              <button className="t-label" style={act} onClick={openThread}>Reply</button>
              <button className="t-label" style={act} onClick={() => setGone((g) => [...g, 'reply', 'sum'])}>Mark as read</button>
            </div>
          </div>
        )}
        {!gone.includes('invite') && (
          <div style={card}>
            <Head channel="Invitations & requests" when="1h" />
            <span className="t-label" style={{ color: '#fff' }}>Joseph234 invited you to The Bible Readers</span>
            <div className="row" style={{ gap: 16, paddingTop: 4 }}>
              <button className="t-label" style={act} onClick={acceptInvite}>Accept</button>
              <button className="t-label" style={act} onClick={() => { alerts.declineInvite(); setGone((g) => [...g, 'invite']); }}>Decline</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

