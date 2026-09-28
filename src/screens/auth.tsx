import { useEffect, useRef, useState, type ReactNode } from 'react';
import { nav, type Params } from '../lib/nav';
import { AppBar, PinnedFooter } from '../components/ui/nav';
import { Button, Chip, ClubAvatar, OnboardingProgress, SocialButton } from '../components/ui/core';
import { TextField } from '../components/ui/inputs';
import { Icon } from '../components/Icon';
import { app, useApp } from '../data/app';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../data/demoAccounts';

export const EXISTING_EMAIL = 'samuel@example.com';
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/* Shared layout for the auth screens: back-only app bar + padded column. */
function AuthScreen({ children, footer, gap = 16 }: { children: ReactNode; footer?: ReactNode; gap?: number }) {
  return (
    <div className="screen">
      <AppBar />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 24px', gap }}>{children}</div>
      </div>
      {footer && <PinnedFooter bg="transparent">{footer}</PinnedFooter>}
    </div>
  );
}

function Header({ title, sub }: { title: string; sub: ReactNode }) {
  return (
    <div className="col" style={{ gap: 4 }}>
      <h1 className="t-title-s c-secondary">{title}</h1>
      <p className="t-body-s c-tertiary">{sub}</p>
    </div>
  );
}

function OrRule() {
  return (
    <div className="row" style={{ gap: 12 }}>
      <span className="grow" style={{ height: 1, background: 'var(--border-subtle)' }} />
      <span className="t-caption c-tertiary">or</span>
      <span className="grow" style={{ height: 1, background: 'var(--border-subtle)' }} />
    </div>
  );
}

const Link = ({ children, onClick, size = 13 }: { children: ReactNode; onClick?: () => void; size?: number }) => (
  <button onClick={onClick} className="c-link" style={{ font: `600 ${size}px/${size === 12 ? 16 : 18}px var(--font)`, display: 'inline' }}>{children}</button>
);

/* ——— Sign up ——— */
export function SignUp({ params }: { params: Params }) {
  const offline = useApp((s) => s.offline);
  const [email, setEmail] = useState((params.email as string) ?? '');
  const [pw, setPw] = useState((params.pw as string) ?? '');
  const [err, setErr] = useState<{ email?: 'format' | 'used'; pw?: boolean }>((params.err as never) ?? {});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.toast) app.toast('Couldn’t connect. Tap to retry.', 'error', { bottom: 46, action: { label: 'Try again', run: () => submit() } });
    return () => app.hideToast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit() {
    const e: typeof err = {};
    if (!isEmail(email)) e.email = 'format';
    else if (email.trim().toLowerCase() === EXISTING_EMAIL || app.get().accounts[email.trim().toLowerCase()] || DEMO_ACCOUNTS[email.trim().toLowerCase()]) e.email = 'used';
    if (pw.length < 8) e.pw = true;
    setErr(e);
    if (e.email || e.pw) return;
    if (app.get().offline) {
      app.toast('Couldn’t connect. Tap to retry.', 'error', { bottom: 46, action: { label: 'Try again', run: submit } });
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      app.set({ pending: { email: email.trim(), password: pw } });
      nav.push('verify', { email: email.trim() });
    }, 700);
  }

  return (
    <AuthScreen>
      <Header title="Create your account" sub="One account, all your bookclubs." />
      <div className="col" style={{ gap: 8 }}>
        <SocialButton provider="apple" onClick={() => nav.push('username')} />
        <SocialButton provider="google" onClick={() => nav.push('username')} />
      </div>
      <OrRule />
      <div className="col" style={{ gap: 12 }}>
        <TextField
          label="Email" type="email" value={email} placeholder="you@example.com"
          onChange={(v) => { setEmail(v); if (err.email) setErr({ ...err, email: undefined }); }}
          state={err.email ? 'error' : 'default'}
          helper={err.email === 'format' ? 'Enter a full email address, like name@example.com.' : err.email === 'used' ? (
            <>There’s already an account with this email. <Link size={12} onClick={() => nav.replace('login', { email: email.trim() })}>Log in instead</Link></>
          ) : undefined}
        />
        <TextField
          label="Password" type="password" reveal value={pw} placeholder="At least 8 characters"
          onChange={(v) => { setPw(v); if (err.pw) setErr({ ...err, pw: false }); }}
          state={err.pw ? 'error' : 'default'}
          helper="Use 8 characters or more."
          onEnter={submit}
        />
      </div>
      <Button full loading={busy} onClick={submit}>Create account</Button>
      <div className="col" style={{ paddingTop: 4, gap: 16 }}>
        <p className="t-caption c-tertiary tc">
          By continuing you agree to the <button className="c-link" onClick={() => nav.push('terms')}>Terms</button> and <button className="c-link" onClick={() => nav.push('privacy')}>Privacy Policy</button>.
        </p>
        <p className="t-body-s c-secondary tc">Have an account? <Link onClick={() => nav.replace('login')}>Log in</Link></p>
      </div>
      {offline && null}
    </AuthScreen>
  );
}

/* ——— Verify email ——— */
const WRONG_CODE = '472915';
export function VerifyEmail({ params }: { params: Params }) {
  const email = (params.email as string) || app.get().pending?.email || EXISTING_EMAIL;
  const [code, setCode] = useState((params.code as string) ?? '');
  const [state, setState] = useState<'idle' | 'wrong' | 'expired'>((params.state as never) ?? 'idle');
  const [left, setLeft] = useState(state === 'expired' ? 0 : 42);
  const [focus, setFocus] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const verify = () => {
    if (code.length < 6) return;
    if (left <= 0) { setState('expired'); return; }
    if (code === WRONG_CODE) { setState('wrong'); return; }
    const p = app.get().pending;
    if (p) app.set((s) => ({ accounts: { ...s.accounts, [p.email.toLowerCase()]: p.password }, user: { ...s.user, email: p.email } }));
    nav.push('username');
  };
  const resend = () => { setState('idle'); setCode(''); setLeft(42); input.current?.focus(); };
  const bad = state !== 'idle';
  const active = Math.min(code.length, 5);

  return (
    <AuthScreen
      footer={<Button full disabled={code.length < 6 || state === 'expired'} onClick={verify}>Verify</Button>}
    >
      <Header title="Check your email" sub={<>We sent a 6-digit code to <b className="c-secondary" style={{ fontWeight: 600 }}>{email}</b></>} />
      <div className="row rel" style={{ gap: 8, padding: '8px 0 4px' }} onClick={() => input.current?.focus()}>
        {Array.from({ length: 6 }).map((_, i) => {
          const isActive = focus && !bad && i === active && code.length < 6;
          return (
            <div
              key={i}
              className="col center grow"
              style={{
                height: 56, borderRadius: 8, background: 'var(--surface-default)',
                boxShadow: `inset 0 0 0 ${isActive ? 2 : 1}px ${bad ? 'var(--danger-fill)' : isActive ? 'var(--border-focus)' : 'var(--border-default)'}`,
              }}
            >
              <span className="t-title c-secondary">{code[i] ?? ''}</span>
            </div>
          );
        })}
        <input
          ref={input}
          value={code}
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); if (state === 'wrong') setState('idle'); }}
          onKeyDown={(e) => { if (e.key === 'Enter') verify(); }}
          style={{ position: 'absolute', inset: 0, opacity: 0, caretColor: 'transparent' }}
          aria-label="6-digit code"
        />
      </div>
      {bad && (
        <div className="row" style={{ gap: 6, alignItems: 'flex-start', marginTop: -4 }}>
          <Icon name="WarningCircle" weight="fill" size={16} tone="danger" />
          <span className="t-caption c-danger grow">
            {state === 'wrong' ? 'That code doesn’t match. Check your latest email.' : 'That code has expired. Send a new code to continue.'}
          </span>
        </div>
      )}
      <div className="col" style={{ paddingTop: 4, gap: 12, marginTop: bad ? -4 : 0 }}>
        {left > 0 && state !== 'expired' ? (
          <p className="t-body-s c-tertiary">Didn’t get it? Resend in 0:{String(left).padStart(2, '0')}</p>
        ) : (
          <p className="t-body-s c-tertiary">Didn’t get it? <Link onClick={resend}>Send a new code</Link></p>
        )}
        <p className="t-body-s c-tertiary">Wrong address? <Link onClick={() => nav.pop()}>Change email</Link></p>
      </div>
    </AuthScreen>
  );
}

/* ——— Onboarding steps ——— */
function StepScreen({ step, title, sub, children, footer, skip, gap = 8, padTop = 16 }: {
  step: 1 | 2 | 3; title: string; sub: string; children: ReactNode; footer: ReactNode; skip?: () => void; gap?: number; padTop?: number;
}) {
  return (
    <div className="screen">
      {skip ? <AppBar variant="text" textAction={{ label: 'Skip', onClick: skip }} /> : <AppBar />}
      <OnboardingProgress step={step} />
      <div className="screen-body">
        <div className="col" style={{ padding: `${padTop}px 16px 16px`, gap }}>
          {step === 3 ? (
            <div className="col" style={{ gap: 4, paddingBottom: 8 }}>
              <h1 className="t-title-s c-secondary">{title}</h1>
              <p className="t-body-s c-tertiary">{sub}</p>
            </div>
          ) : (
            <>
              <h1 className="t-title-s c-secondary">{title}</h1>
              <p className="t-body-s c-tertiary">{sub}</p>
            </>
          )}
          {children}
        </div>
      </div>
      <PinnedFooter>{footer}</PinnedFooter>
    </div>
  );
}

const TAKEN = new Set(['samuelessence']);
export function ChooseUsername() {
  const [name, setName] = useState('samuelessence');
  const [status, setStatus] = useState<'checking' | 'ok' | 'taken' | 'idle'>('taken');
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!name.trim()) { setStatus('idle'); return; }
    setStatus('checking');
    const t = setTimeout(() => setStatus(TAKEN.has(name.trim().toLowerCase()) ? 'taken' : 'ok'), 600);
    return () => clearTimeout(t);
  }, [name]);
  const cont = () => {
    if (status !== 'ok') return;
    app.set((s) => ({ user: { ...s.user, username: name.trim() } }));
    nav.push('genres');
  };
  return (
    <StepScreen
      step={1}
      title="Pick a username"
      sub="This is how people will know you in conversations. You can change it later."
      footer={<Button full disabled={!name.trim()} onClick={cont}>Continue</Button>}
    >
      <TextField
        label="Username"
        value={name}
        onChange={setName}
        state={status === 'taken' ? 'error' : status === 'ok' ? 'success' : status === 'checking' ? 'checking' : 'default'}
        helper={status === 'taken' ? 'Sorry, that name is taken.' : status === 'ok' ? 'That name is available.' : status === 'checking' ? 'Checking availability…' : undefined}
        onEnter={cont}
      />
      {status === 'taken' && (
        <>
          <span className="t-caption c-tertiary">Try one of these</span>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {['samuelessence344', 'samuel_essence', 'essence234'].map((s) => (
              <Chip key={s} label={s} onClick={() => setName(s)} />
            ))}
          </div>
        </>
      )}
    </StepScreen>
  );
}

export const GENRES = ['Fiction', 'Non-fiction', 'Mystery', 'Romance', 'Fantasy', 'Poetry', 'Sci-Fi', 'History', 'Biography', 'Business', 'Self-help', 'Faith', 'African literature', 'Classics', 'Thriller', 'Essays'];

export function PickGenres() {
  const initial = useApp((s) => s.genres);
  const [sel, setSel] = useState<string[]>(initial);
  const toggle = (g: string) => setSel((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));
  const next = () => { app.set({ genres: sel }); nav.push('join-clubs'); };
  return (
    <StepScreen
      step={2}
      title="What do you read?"
      sub="Pick a few and we’ll show you bookclubs worth joining."
      skip={() => nav.push('join-clubs')}
      padTop={12}
      footer={<Button full disabled={sel.length === 0} onClick={next}>{sel.length ? `Continue with ${sel.length}` : 'Continue'}</Button>}
    >
      <div className="row" style={{ flexWrap: 'wrap', gap: 8, paddingTop: 8 }}>
        {GENRES.map((g) => <Chip key={g} label={g} on={sel.includes(g)} onClick={() => toggle(g)} />)}
      </div>
    </StepScreen>
  );
}

const STARTER = [
  { id: 'midnight', name: 'Midnight Readers Club', meta: 'Atomic Habits · 2.1k members', art: 2, action: 'joined' },
  { id: 'clue', name: 'Clue Seekers', meta: 'The Silent Patient · 840 members', art: 3, action: 'joined' },
  { id: 'poetry-sundays', name: 'Poetry on Sundays', meta: 'Selected Poems · 1.1k members', art: 4, action: 'joined' },
  { id: 'african-lit', name: 'African Literature Now', meta: 'Crimson Blossoms · 3.2k members', art: 5, action: 'join' },
  { id: 'quill', name: 'The Quill Society', meta: 'Private · invitation or request only', art: 6, action: 'request' },
  { id: 'historical', name: 'Historical Narratives', meta: 'Half of a Yellow Sun · 3.4k members', art: 7, action: 'join' },
] as const;

export function JoinBookclubs() {
  const [joined, setJoined] = useState<Record<string, boolean>>(() => Object.fromEntries(STARTER.map((c) => [c.id, c.action === 'joined'])));
  const count = Object.values(joined).filter(Boolean).length;
  // Joining none leads to the empty Home ("Nothing here yet").
  const finish = () => { app.set({ hasClubs: count > 0 }); app.signIn(); };
  return (
    <StepScreen
      step={3}
      title="Join a few to get started"
      sub="The busiest rooms in Fiction, Mystery and Poetry right now. You can leave any of them later."
      skip={finish}
      padTop={12}
      gap={4}
      footer={<Button full onClick={finish}>{count ? `Continue with ${count}` : 'Continue'}</Button>}
    >
      {STARTER.map((c) => (
        <DiscoverRowView
          key={c.id}
          name={c.name}
          meta={c.meta}
          art={c.art}
          action={c.action === 'request' ? 'request' : joined[c.id] ? 'joined' : 'join'}
          onAction={() => (c.action === 'request' ? nav.push('club-preview', { id: 'quill' }) : setJoined((j) => ({ ...j, [c.id]: !j[c.id] })))}
        />
      ))}
    </StepScreen>
  );
}

export function DiscoverRowView({ name, meta, art, palette, action, onAction, onClick }: {
  name: string; meta: string; art: number; palette?: 'indigo' | 'forest' | 'clay' | 'rose' | 'teal' | 'plum'; action: 'join' | 'request' | 'joined'; onAction?: () => void; onClick?: () => void;
}) {
  return (
    <div className="row tap" style={{ padding: '12px 0', gap: 12 }} onClick={onClick}>
      <ClubAvatar art={art} palette={palette} size={40} />
      <div className="col grow" style={{ gap: 2 }}>
        <span className="t-label-l c-primary trunc">{name}</span>
        <span className="t-body-s c-secondary trunc">{meta}</span>
      </div>
      <span onClick={(e) => e.stopPropagation()}>
        {action === 'join' && <Button size="sm" onClick={onAction}>Join</Button>}
        {action === 'request' && <Button size="sm" kind="secondary" onClick={onAction}>Request</Button>}
        {action === 'joined' && <Button size="sm" kind="ghost" onClick={onAction}>Joined</Button>}
      </span>
    </div>
  );
}

/* ——— Log in ——— */
export function LogIn({ params }: { params: Params }) {
  const [email, setEmail] = useState((params.email as string) ?? '');
  const [pw, setPw] = useState((params.pw as string) ?? '');
  const [err, setErr] = useState<'mismatch' | 'locked' | null>((params.err as never) ?? null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.reset) app.toast('Password reset. Sign in with your new one.', 'success', { bottom: 46 });
    return () => app.hideToast();
  }, [params.reset]);

  const submit = () => {
    if (!email.trim() || !pw || err === 'locked') return;
    const accounts = app.get().accounts;
    const key = email.trim().toLowerCase();
    const demo = DEMO_ACCOUNTS[key];
    const known = key === EXISTING_EMAIL || key in accounts || !!demo;
    // A password set in this session wins; demo accounts otherwise use the shared demo password.
    const expected = key in accounts ? accounts[key] : demo ? DEMO_PASSWORD : null;
    const ok = known && (expected == null || expected === pw);
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (ok) { app.set((st) => ({ loginFails: 0, user: { ...st.user, email: email.trim() } })); app.signIn(demo); return; }
      const fails = app.get().loginFails + 1;
      app.set({ loginFails: fails });
      setErr(fails >= 3 ? 'locked' : 'mismatch');
    }, 600);
  };

  return (
    <AuthScreen>
      <Header title="Log in" sub="Welcome back to your bookclubs." />
      <div className="col" style={{ gap: 8 }}>
        <SocialButton provider="apple" onClick={() => app.signIn()} />
        <SocialButton provider="google" onClick={() => app.signIn()} />
      </div>
      <OrRule />
      <div className="col" style={{ gap: 12 }}>
        <TextField label="Email" type="email" value={email} placeholder="you@example.com" onChange={(v) => { setEmail(v); if (err === 'mismatch') setErr(null); }} />
        <TextField
          label="Password" type="password" reveal value={pw} placeholder="Enter your password"
          onChange={(v) => { setPw(v); if (err === 'mismatch') setErr(null); }}
          state={err ? 'error' : 'default'}
          helper={err === 'mismatch' ? 'That email and password don’t match.' : err === 'locked' ? 'Too many attempts. Wait 5 minutes, or reset your password.' : undefined}
          onEnter={submit}
        />
        <button className="t-body-s c-link tr" onClick={() => nav.push('forgot', { email })}>Forgot password?</button>
      </div>
      <Button full loading={busy} disabled={err === 'locked'} onClick={submit}>Log in</Button>
      <div className="col" style={{ paddingTop: 4 }}>
        <p className="t-body-s c-secondary tc">New here? <Link onClick={() => nav.replace('signup')}>Create account</Link></p>
      </div>
    </AuthScreen>
  );
}

/* ——— Password reset ——— */
export function ForgotPassword({ params }: { params: Params }) {
  const [email, setEmail] = useState((params.email as string) ?? '');
  const [touched, setTouched] = useState(!!params.invalid);
  const invalid = !!email.trim() && !isEmail(email);
  const showErr = touched && invalid;
  const send = () => { if (!email.trim() || invalid) { setTouched(true); return; } nav.push('reset-sent', { email: email.trim() }); };
  return (
    <AuthScreen gap={12} footer={<Button full disabled={!email.trim() || showErr} onClick={send}>Send reset link</Button>}>
      <Header title="Forgot your password?" sub="Enter the email you signed up with and we’ll send you a reset link." />
      <div onBlur={() => setTouched(true)}>
        <TextField
          label="Email" type="email" value={email} placeholder="you@example.com"
          onChange={(v) => { setEmail(v); setTouched(false); }}
          state={showErr ? 'error' : 'default'}
          helper={showErr ? 'Enter a full email address, like name@example.com.' : undefined}
          onEnter={send}
        />
      </div>
    </AuthScreen>
  );
}

export function ResetSent({ params }: { params: Params }) {
  const email = (params.email as string) || EXISTING_EMAIL;
  return (
    <AuthScreen gap={12} footer={<Button full onClick={() => nav.push('set-password', { email })}>Open email app</Button>}>
      <Header title="Check your email" sub={`We sent a reset link to ${email}. It expires in an hour.`} />
    </AuthScreen>
  );
}

export function ResetExpired() {
  return (
    <AuthScreen gap={12} footer={<Button full onClick={() => nav.replace('reset-sent', { email: EXISTING_EMAIL })}>Send a new link</Button>}>
      <Header title="This link has expired" sub="Reset links work for an hour. Send yourself a new one." />
    </AuthScreen>
  );
}

export function SetNewPassword({ params }: { params: Params }) {
  const [a, setA] = useState((params.a as string) ?? '');
  const [b, setB] = useState((params.b as string) ?? '');
  const [touchedA, setTouchedA] = useState(!!params.a);
  const [touchedB, setTouchedB] = useState(!!params.b);
  const short = a.length > 0 && a.length < 8 && (touchedA || b.length > 0);
  const mismatch = !short && a.length >= 8 && b.length > 0 && (touchedB || b.length >= a.length) && a !== b;
  const ok = a.length >= 8 && a === b;
  const save = () => {
    if (!ok) return;
    const email = ((params.email as string) || EXISTING_EMAIL).toLowerCase();
    app.set((s) => ({ accounts: { ...s.accounts, [email]: a }, loginFails: 0 }));
    nav.reset([['onboarding', { slide: 0 }], ['login', { email: params.email ?? EXISTING_EMAIL, reset: true }]]);
  };
  return (
    <AuthScreen gap={12} footer={<Button full disabled={!ok} onClick={save}>Save password</Button>}>
      <Header title="Set a new password" sub="Choose something you haven’t used here before." />
      <div onBlur={() => setTouchedA(true)}>
        <TextField label="New password" type="password" reveal value={a} placeholder="At least 8 characters" onChange={setA}
          state={short ? 'error' : 'default'} helper={mismatch ? undefined : 'Use 8 characters or more.'} />
      </div>
      <div onBlur={() => setTouchedB(true)}>
        <TextField label="Confirm new password" type="password" reveal value={b} placeholder="Type it again" onChange={setB}
          state={mismatch ? 'error' : 'default'} helper={mismatch ? 'These don’t match. Type the same password in both.' : undefined} onEnter={save} />
      </div>
    </AuthScreen>
  );
}
