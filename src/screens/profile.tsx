import { useEffect, useState, type ReactNode } from 'react';
import { nav, type Params } from '../lib/nav';
import { app, useApp, type Theme } from '../data/app';
import { AppBar, PinnedFooter, Screen } from '../components/ui/nav';
import { Avatar, Button, Chip, ClubAvatar, RadioRow, SectionHeader, StatusPill } from '../components/ui/core';
import { SelectField, TextArea, TextField } from '../components/ui/inputs';
import { Hairline, PreferenceRow, SettingsRow } from '../components/ui/rows';
import { HEADER_BOTTOM, Shimmer, Skeleton } from '../components/ui/states';
import { Dialog } from '../components/ui/overlays';
import logo from '../assets/img/logo.svg';
import { useFirstLoad } from './home';
import { GENRES } from './auth';
import { EXISTING_EMAIL } from './auth';
import { signOutAll } from '../data/reset';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../data/demoAccounts';

const THEME_LABEL: Record<Theme, string> = { system: 'Match my phone', light: 'Light', dark: 'Dark' };

/* ——— Profile tab ——— */
export function Profile({ params }: { params: Params }) {
  const loading = useFirstLoad('profile', params.loading as boolean);
  const theme = useApp((s) => s.theme);
  const plan = useApp((s) => s.plan);
  const user = useApp((s) => s.user);
  const genres = useApp((s) => s.genres);
  const pending = useApp((s) => s.pendingRequests);
  const header = <AppBar variant="root" title="Profile" />;
  if (loading) {
    return (
      <Screen header={header} tab="profile" noScroll overlay={<Shimmer top={HEADER_BOTTOM} bottom={102} />}>
        <div className="col" style={{ padding: '58px 16px 0', gap: 12 }}>
          <Skeleton type="row" /><Skeleton type="card" /><Skeleton type="row" /><Skeleton type="row" /><Skeleton type="row" />
        </div>
      </Screen>
    );
  }
  const planLabel = plan === 'trial' ? 'Premium trial · 5 days left' : plan === 'premium' || plan === 'ending' ? 'Premium' : 'Free';
  return (
    <Screen header={header} tab="profile">
      <div className="col" style={{ padding: '58px 16px 24px', gap: 8 }}>
        <div className="col">
          <div className="row" style={{ paddingBottom: 16, gap: 12 }}>
            <Avatar initials="SE" size="lg" />
            <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
              <span className="t-title-s c-secondary trunc">{user.username}</span>
              <span className="t-caption c-tertiary">Joined April 2026 · 6 bookclubs</span>
            </span>
            <Button size="sm" kind="secondary" onClick={() => nav.push('edit-profile')}>Edit</Button>
          </div>
          <div className="row" style={{ padding: '12px 16px', gap: 12, background: 'var(--surface-default)', boxShadow: 'inset 0 0 0 1px var(--border-subtle)', borderRadius: 8 }}>
            <span className="col grow" style={{ gap: 2 }}>
              <span className="t-label-s c-tertiary">Your plan</span>
              <span className="t-label c-secondary">{planLabel}</span>
            </span>
            <Button size="sm" onClick={() => nav.push('plans')}>See plans</Button>
          </div>
        </div>
        <div className="col">
          <SectionHeader title="Reading interests" link="Edit" onLink={() => nav.push('interests')} />
          <div className="row" style={{ gap: 8, paddingBottom: 8, flexWrap: 'wrap' }}>
            {genres.map((g) => <Chip key={g} label={g} />)}
          </div>
        </div>
        <div className="col" style={{ gap: 8 }}>
          <Hairline />
          <SettingsRow label="Appearance" value={THEME_LABEL[theme]} onClick={() => nav.push('appearance')} />
          <SettingsRow label="Notifications" onClick={() => nav.push('notification-prefs')} />
          <SettingsRow label="Account settings" onClick={() => nav.push('account')} />
          <SettingsRow label="Pending requests" count={pending} onClick={() => nav.push('pending-requests')} />
          <SettingsRow label="About Page234" onClick={() => nav.push('about')} />
          <SettingsRow label="Log out" destructive onClick={() => { signOutAll(); nav.reset([['onboarding', { slide: 0 }], ['login', { email: EXISTING_EMAIL }]]); }} />
        </div>
      </div>
    </Screen>
  );
}

/* ——— Edit profile ——— */
export function EditProfile() {
  const user = useApp((s) => s.user);
  const [name, setName] = useState(user.username);
  const [bio, setBio] = useState(useApp((s) => s.bio));
  return (
    <div className="screen">
      <AppBar variant="text" title="Edit profile" textAction={{ label: 'Save', onClick: () => { app.set((s) => ({ user: { ...s.user, username: name.trim() || s.user.username }, bio })); nav.pop(); } }} />
      <div className="screen-body">
        <div className="col" style={{ padding: '20px 16px 24px', gap: 12 }}>
          <div className="col" style={{ paddingBottom: 8, gap: 8, alignItems: 'center' }}>
            <Avatar initials="SE" size="lg" />
            <button className="t-label c-link">Change avatar</button>
          </div>
          <TextField label="Username" value={name} onChange={setName} helper="People find you by this name." />
          <TextArea label="Bio" value={bio} onChange={setBio} helper="Optional" max={160} />
        </div>
      </div>
    </div>
  );
}

/* ——— Notification preferences ——— */
export function NotificationPrefs() {
  const [p, setP] = useState({ replies: true, invites: true, moderation: true, likes: false, billing: true, quiet: true });
  const t = (k: keyof typeof p) => (v: boolean) => setP({ ...p, [k]: v });
  return (
    <div className="screen">
      <AppBar title="Notifications" />
      <div className="screen-body">
        <div className="col" style={{ padding: '12px 16px 24px', gap: 4 }}>
          <SettingsRow label="System notifications" value="Allowed" />
          <SectionHeader title="What we send you" />
          <PreferenceRow label="Replies and mentions" desc="When someone answers you or names you" on={p.replies} onChange={t('replies')} />
          <PreferenceRow label="Invitations and requests" desc="Invites, and people asking to join your rooms" on={p.invites} onChange={t('invites')} />
          <PreferenceRow label="Moderation" desc="Content or membership changes" on={p.moderation} onChange={t('moderation')} />
          <PreferenceRow label="Likes" desc="Shown in Alerts only" on={p.likes} onChange={t('likes')} />
          <PreferenceRow label="Account and billing" on={p.billing} onChange={t('billing')} />
          <SectionHeader title="Quiet hours" />
          <PreferenceRow label="Pause notifications" desc="10:00 PM – 7:00 AM" on={p.quiet} onChange={t('quiet')} />
        </div>
      </div>
    </div>
  );
}

/* ——— Pending requests ——— */
export function PendingRequests() {
  const [asked, setAsked] = useState(false);
  const Row = ({ art, name, meta, right }: { art: number; name: string; meta: string; right: ReactNode }) => (
    <div className="row" style={{ padding: '12px 0', gap: 12 }}>
      <ClubAvatar art={art} size={32} />
      <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
        <span className="t-label c-secondary trunc">{name}</span>
        <span className="t-caption c-tertiary">{meta}</span>
      </span>
      {right}
    </div>
  );
  return (
    <div className="screen">
      <AppBar title="Pending requests" />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 24px' }}>
          <p className="t-body-s c-tertiary" style={{ paddingBottom: 12 }}>Owners decide who joins a private bookclub. You’ll get an alert the moment one says yes.</p>
          <Row art={1} name="The Bible Readers" meta="Asked 2 days ago" right={<StatusPill kind="neutral" label="Waiting" />} />
          <Row art={2} name="Environmental Advocates" meta="Asked last week" right={<StatusPill kind="neutral" label="Waiting" />} />
          <Row art={3} name="Private Poetry Circle" meta={asked ? 'Asked just now' : 'Not accepted · 4 days ago'} right={asked ? <StatusPill kind="neutral" label="Waiting" /> : <Button size="sm" kind="ghost" onClick={() => setAsked(true)}>Ask again</Button>} />
          <Row art={4} name="Thursday Night Fiction" meta="Not accepted · yesterday" right={<Button size="sm" kind="ghost" disabled>Ask again in 6 days</Button>} />
        </div>
      </div>
    </div>
  );
}

/* ——— Reading interests ——— */
export function EditInterests({ params }: { params: Params }) {
  const saved = useApp((s) => s.genres);
  const [sel, setSel] = useState<string[]>((params.sel as string[]) ?? saved);
  const changed = [...sel].sort().join() !== [...saved].sort().join();
  const toggle = (g: string) => setSel((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));
  return (
    <div className="screen">
      <AppBar title="Reading interests" />
      <div className="screen-body">
        <div className="col" style={{ padding: '12px 16px 16px', gap: 8 }}>
          <p className="t-body-s c-tertiary">We use these to recommend bookclubs on Home and Discover.</p>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8, paddingTop: 8 }}>
            {GENRES.map((g) => <Chip key={g} label={g} on={sel.includes(g)} onClick={() => toggle(g)} />)}
          </div>
        </div>
      </div>
      <PinnedFooter>
        <Button full disabled={!changed || !sel.length} onClick={() => { app.set({ genres: sel }); nav.pop(); }}>Save</Button>
      </PinnedFooter>
    </div>
  );
}

/* ——— Appearance ——— */
export function Appearance() {
  const theme = useApp((s) => s.theme);
  return (
    <div className="screen">
      <AppBar title="Appearance" />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 24px', gap: 4 }}>
          {(['system', 'light', 'dark'] as Theme[]).map((t) => (
            <RadioRow key={t} label={THEME_LABEL[t]} on={theme === t} onClick={() => app.set({ theme: t })} />
          ))}
          <p className="t-caption c-tertiary">Match my phone switches between light and dark when your phone does. Changes apply straight away.</p>
        </div>
      </div>
    </div>
  );
}

/* ——— Account settings & password ——— */
export function AccountSettings({ params }: { params: Params }) {
  const email = useApp((s) => s.user.email);
  useEffect(() => {
    if (params.changed) app.toast('Password changed. Other devices were signed out.', 'success', { bottom: 32 });
  }, [params.changed]);
  return (
    <div className="screen">
      <AppBar title="Account settings" />
      <div className="screen-body">
        <div className="col" style={{ padding: '12px 16px 24px', gap: 16 }}>
          <div className="col" style={{ gap: 8 }}>
            <SectionHeader title="Sign in" />
            <div className="col" style={{ gap: 2 }}>
              <SettingsRow label="Email" value={email} chevron={false} />
              <SettingsRow label="Change password" onClick={() => nav.push('change-password')} />
            </div>
          </div>
          <div className="col" style={{ gap: 8 }}>
            <SectionHeader title="Danger zone" />
            <div className="col" style={{ gap: 8 }}>
              <Button full kind="danger-outline" onClick={() => nav.push('delete-account')}>Delete account</Button>
              <p className="t-caption c-tertiary">Deleting your account removes your messages and the bookclubs you own. It can’t be undone.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormScreen({ title, sub, children, footer }: { title: string; sub: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="screen">
      <AppBar />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 24px', gap: 12 }}>
          <div className="col" style={{ gap: 4 }}>
            <span className="t-title-s c-secondary">{title}</span>
            <span className="t-body-s c-tertiary">{sub}</span>
          </div>
          {children}
        </div>
      </div>
      <PinnedFooter bg="transparent">{footer}</PinnedFooter>
    </div>
  );
}

const ResetLink = () => (
  <p className="t-body-s c-tertiary">Don’t remember it? <button className="c-link" style={{ fontWeight: 600 }} onClick={() => nav.push('forgot', { email: app.get().user.email })}>Reset by email instead</button></p>
);
const checkCurrent = (pw: string) => {
  const key = app.get().user.email.toLowerCase();
  const stored = app.get().accounts[key] ?? (DEMO_ACCOUNTS[key] ? DEMO_PASSWORD : null);
  return stored ? pw === stored : pw.length >= 8;
};

export function ChangePassword({ params }: { params: Params }) {
  const [pw, setPw] = useState((params.pw as string) ?? '');
  const [wrong, setWrong] = useState(!!params.wrong);
  const next = () => { if (checkCurrent(pw)) nav.replace('new-password', {}, 'push'); else setWrong(true); };
  return (
    <FormScreen title="Confirm it’s you" sub="Enter your current password before choosing a new one." footer={<Button full disabled={!pw || wrong} onClick={next}>Continue</Button>}>
      <TextField label="Current password" type="password" reveal value={pw} placeholder="Your current password" onChange={(v) => { setPw(v); setWrong(false); }}
        state={wrong ? 'error' : 'default'} helper={wrong ? 'That password isn’t right.' : undefined} onEnter={next} />
      <ResetLink />
    </FormScreen>
  );
}

export function NewPassword({ params }: { params: Params }) {
  const [a, setA] = useState((params.a as string) ?? '');
  const [b, setB] = useState((params.b as string) ?? '');
  const [ta, setTa] = useState(!!params.a);
  const [tb, setTb] = useState(!!params.b);
  const short = a.length > 0 && a.length < 8 && (ta || b.length > 0);
  const mismatch = !short && a.length >= 8 && b.length > 0 && (tb || b.length >= a.length) && a !== b;
  const ok = a.length >= 8 && a === b;
  const save = () => {
    if (!ok) return;
    const email = app.get().user.email.toLowerCase();
    app.set((s) => ({ accounts: { ...s.accounts, [email]: a } }));
    nav.pop();
    setTimeout(() => app.toast('Password changed. Other devices were signed out.', 'success', { bottom: 32 }), 300);
  };
  return (
    <FormScreen title="Choose a new password" sub="You’ll stay signed in here. Other devices will be signed out." footer={<Button full disabled={!ok} onClick={save}>Save password</Button>}>
      <div onBlur={() => setTa(true)}>
        <TextField label="New password" type="password" reveal value={a} placeholder="At least 8 characters" onChange={setA} state={short ? 'error' : 'default'} helper={mismatch ? undefined : 'Use 8 characters or more.'} />
      </div>
      <div onBlur={() => setTb(true)}>
        <TextField label="Confirm new password" type="password" reveal value={b} placeholder="Type it again" onChange={setB} state={mismatch ? 'error' : 'default'} helper={mismatch ? 'These don’t match. Type the same password in both.' : undefined} onEnter={save} />
      </div>
    </FormScreen>
  );
}

/* ——— Delete account ——— */
export function DeleteAccount() {
  return (
    <div className="screen">
      <AppBar />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 24px', gap: 16 }}>
          <span className="t-title-s c-secondary">Before you delete your account</span>
          <div className="col" style={{ gap: 16 }}>
            <SectionHeader title="What goes" />
            <p className="t-body-s c-tertiary" style={{ marginTop: -16 }}>•&nbsp; Your profile, username and messages</p>
            <p className="t-body-s c-tertiary">•&nbsp; Bookclubs you own — Midnight Readers Club will close for its 206 members</p>
            <SectionHeader title="What doesn’t" />
            <p className="t-body-s c-tertiary" style={{ marginTop: -16 }}>•&nbsp; Premium. It’s billed by your app store, so cancel it there or you’ll keep being charged</p>
            <button className="t-label c-link" style={{ textAlign: 'left' }} onClick={() => nav.push('plans')}>Cancel Premium in the App Store first</button>
          </div>
        </div>
      </div>
      <PinnedFooter bg="transparent"><Button full kind="danger" onClick={() => nav.push('delete-confirm')}>Continue</Button></PinnedFooter>
    </div>
  );
}

export function DeleteConfirm({ params }: { params: Params }) {
  const [pw, setPw] = useState((params.pw as string) ?? '');
  const [wrong, setWrong] = useState(false);
  const [dialog, setDialog] = useState(!!params.dialog);
  return (
    <>
      <FormScreen title="Confirm it’s you" sub="Enter your password to delete your account."
        footer={<Button full kind="danger" disabled={!pw} onClick={() => (checkCurrent(pw) || params.dialog ? setDialog(true) : setWrong(true))}>Delete account</Button>}>
        <TextField label="Current password" type="password" reveal value={pw} placeholder="Your current password" onChange={(v) => { setPw(v); setWrong(false); }}
          state={wrong ? 'error' : 'default'} helper={wrong ? 'That password isn’t right.' : undefined} />
        <ResetLink />
      </FormScreen>
      {dialog && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40 }}>
          <Dialog title="Delete your account?" body="This is permanent. Your messages and the bookclubs you own will be removed. Premium is billed by your app store, so cancel it there first."
            confirm="Delete" onCancel={() => setDialog(false)}
            onConfirm={() => { setDialog(false); signOutAll(); nav.reset([['launch', { deleted: true }]], 'fade'); }} />
        </div>
      )}
    </>
  );
}

/* ——— About & legal ——— */
export function About() {
  return (
    <div className="screen">
      <AppBar title="About Page234" />
      <div className="screen-body">
        <div className="col" style={{ padding: '24px 16px 24px' }}>
          <div className="col" style={{ paddingBottom: 24, gap: 4, alignItems: 'center' }}>
            <img src={logo} alt="Page 234" style={{ width: 189, height: 59 }} />
            <span className="t-caption c-tertiary tc">Version 1.0.0 (build 42)</span>
          </div>
          <SettingsRow label="Content rules" onClick={() => nav.push('content-rules')} />
          <SettingsRow label="Terms of service" onClick={() => nav.push('terms')} />
          <SettingsRow label="Privacy policy" onClick={() => nav.push('privacy')} />
          <SettingsRow label="Open-source licences" />
          <SettingsRow label="Contact support" onClick={() => nav.push('contact-support')} />
        </div>
      </div>
    </div>
  );
}

function DocScreen({ title, intro, sections }: { title: string; intro: string; sections: Array<[string, string]> }) {
  return (
    <div className="screen">
      <AppBar title={title} />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 32px' }}>
          <p className="t-body-s c-tertiary">{intro}</p>
          {sections.map(([h, b]) => (
            <div key={h} className="col">
              <SectionHeader title={h} />
              <p className="t-body-s c-tertiary">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const ContentRules = () => (
  <DocScreen title="Content rules" intro="Page234 is a place to talk about books. These rules exist so that stays true. A bookclub owner moderates their own room; Page234 administrators handle the platform." sections={[
    ['No links to other websites', 'Links off Page234 aren’t permitted. It keeps conversations here and keeps spam out. Naming a book, an author or a publisher is fine — linking to them is not.'],
    ['No pirated or copyrighted material', 'Don’t share copies of books, scans, or where to download them. Page234 doesn’t host books and won’t point at anyone who does.'],
    ['No spam or advertising', 'Don’t promote products, services or your own channels in a room you joined to read.'],
    ['No harassment or abuse', 'Disagree with the book, the reading, or each other. Don’t attack the person. Owners can remove members from their own rooms; repeated abuse ends the account.'],
    ['Spoilers', 'Say where you are before you say what you think. A chapter number at the top of a message costs nothing.'],
    ['What happens when a rule is broken', 'The message is removed and you’re told which rule and who acted. Your account standing is shown on that notice. Nothing is removed silently.'],
  ]} />
);

export const Terms = () => (
  <DocScreen title="Terms of service" intro="Plain-language summary of each section sits first; the binding text underneath is supplied by Legal and is not drafted here." sections={[
    ['Your account', 'You need an account to read or post. One person, one account. You’re responsible for what’s posted from it. You must be old enough to hold an account where you live.'],
    ['What you post', 'You keep ownership of what you write. You give Page234 permission to show it inside the app to the people who can see that bookclub. You can delete your messages and your account.'],
    ['What we don’t host', 'Page234 does not host, sell or distribute books. A bookclub names what it is reading; that is all.'],
    ['Bookclubs and moderation', 'A bookclub owner sets who joins their room and can remove members from it. Page234 administrators can remove content or accounts that break the content rules.'],
    ['Premium', 'Premium is billed through the App Store or Play Store and renews every 30 days until cancelled. Cancel in your store account. Refunds follow the store’s policy, not ours.'],
    ['Ending your account', 'You can delete your account at any time from Account settings. We may close an account that repeatedly breaks the content rules.'],
    ['Changes to these terms', 'If these terms change in a way that affects you, you’ll be told in the app before the change takes effect.'],
  ]} />
);

export const Privacy = () => (
  <DocScreen title="Privacy policy" intro="What Page234 collects, why, and what it never does. Legal supplies the binding text; this is the version a person can actually read." sections={[
    ['What we collect', 'Your email address, your username, the bookclubs you join, and what you post in them. Basic device information so the app works on your phone and network.'],
    ['What we don’t collect', 'No contacts, no location, no photos. Page234 does not allow image uploads anywhere except your profile avatar, which is chosen from a set we provide.'],
    ['Who can see what you post', 'Messages in a public bookclub are visible to anyone who opens it. Messages in a private bookclub are visible only to its members. Reports go to Page234 moderators and no one else.'],
    ['Notifications', 'We send notifications only for the categories you leave switched on in Notification settings. We do not send marketing pushes.'],
    ['Keeping your data', 'Delete your account and your messages go with it. Some records are kept where the law requires it; the retention period belongs in the binding text.'],
    ['Your choices', 'You can change your username, choose what notifications you receive, and delete your account, all from Profile.'],
  ]} />
);

/* ——— Contact support ——— */
const TOPICS = ['Billing and payments', 'A bookclub or its owner', 'Someone’s behaviour', 'Something is broken', 'Account and sign-in', 'Something else'];
export function ContactSupport({ params }: { params: Params }) {
  const email = useApp((s) => s.user.email);
  const [topic, setTopic] = useState((params.topic as string) ?? '');
  const [text, setText] = useState((params.text as string) ?? '');
  const [reply, setReply] = useState(email);
  const [picker, setPicker] = useState(!!params.picker);
  useEffect(() => {
    if (params.sent) app.toast(`Sent. We’ll reply to ${email}.`, 'success', { bottom: 104 });
  }, [params.sent, email]);
  const send = () => { app.toast(`Sent. We’ll reply to ${reply}.`, 'success', { bottom: 104 }); setTopic(''); setText(''); };
  return (
    <div className="screen">
      <AppBar title="Contact support" />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 24px', gap: 12 }}>
          <p className="t-body-s c-tertiary">Tell us what happened and we’ll come back to you by email, usually within two working days.</p>
          <SelectField label="What’s this about?" value={topic} placeholder="Choose a topic" helper="Billing · A bookclub · Behaviour · Something broken · Account · Other" onClick={() => setPicker(true)} />
          <TextArea label="What happened?" value={text} onChange={setText} placeholder="Describe the problem…" helper="Include the bookclub name if it helps." max={600} />
          <TextField label="Reply to" type="email" value={reply} onChange={setReply} helper="We’ll answer here." />
        </div>
      </div>
      <PinnedFooter bg="transparent"><Button full disabled={!topic || !text.trim()} onClick={send}>Send</Button></PinnedFooter>
      {picker && (
        <>
          <div className="scrim" onClick={() => setPicker(false)} />
          <div className="col" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41, background: 'var(--surface-default)', padding: '8px 16px 24px', alignItems: 'center', borderRadius: '20px 20px 0 0', animation: 'modalIn 280ms cubic-bezier(.2,.8,.2,1) both' }}>
            <span style={{ width: 38, height: 4, borderRadius: 4, background: 'var(--border-default)' }} />
            <div className="fill" style={{ padding: '12px 0 8px' }}><span className="t-label-l c-secondary">What’s this about?</span></div>
            <div className="col fill">
              {TOPICS.map((t) => <RadioRow key={t} label={t} on={topic === t} onClick={() => { setTopic(t); setPicker(false); }} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
