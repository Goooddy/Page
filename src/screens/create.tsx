import { useState } from 'react';
import { nav, type Params } from '../lib/nav';
import { ModalHeader, PinnedFooter } from '../components/ui/nav';
import { Button, RadioRow, SectionHeader, SelectionCard } from '../components/ui/core';
import { SearchField, SelectField, TextArea, TextField } from '../components/ui/inputs';
import { BookResultRow, SelectedBook } from '../components/ui/rows';
import { Dialog } from '../components/ui/overlays';
import { Icon } from '../components/Icon';
import { clubs, useClubs, type Club } from '../data/clubs';
import { chat } from '../data/chat';
import { app } from '../data/app';
import { AvatarGrid, InviteBlock, paletteFor } from './clubinfo';

export const CLUB_GENRES = ['Fiction', 'Non-fiction', 'Mystery', 'Romance', 'Fantasy', 'Poetry', 'Sci-Fi', 'History', 'Biography', 'Business', 'Self-help', 'Faith', 'African literature', 'Classics', 'Thriller', 'Essays', 'Not sure yet'];

export function GenreSheet({ value, onPick, onClose }: { value?: string; onPick: (g: string) => void; onClose: () => void }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="col" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 102, zIndex: 41, background: 'var(--surface-default)', borderRadius: '20px 20px 0 0', padding: '8px 16px 24px', alignItems: 'center', animation: 'modalIn 280ms cubic-bezier(.2,.8,.2,1) both' }}>
        <span style={{ width: 38, height: 4, borderRadius: 4, background: 'var(--border-default)', flexShrink: 0 }} />
        <div className="col fill" style={{ padding: '12px 0 8px', gap: 4 }}>
          <span className="t-label-l c-secondary">Choose a genre</span>
          <span className="t-caption c-tertiary">Pick the closest one — you can change it later.</span>
        </div>
        <div className="col fill screen-body">
          {CLUB_GENRES.map((g) => <RadioRow key={g} label={g} on={value === g} onClick={() => onPick(g)} />)}
        </div>
      </div>
    </>
  );
}

type Book = { title: string; author: string; year: string; genre: string };
const BOOKS: Book[] = [
  { title: 'Atomic Habits', author: 'James Clear', year: '2018', genre: 'Self-help' },
  { title: 'Atomic Habits Journal', author: 'James Clear', year: '2019', genre: 'Self-help' },
  { title: 'The Atomic Human', author: 'Neil Lawrence', year: '2024', genre: 'Non-fiction' },
];

export function CreateClub({ params }: { params: Params }) {
  const [step, setStep] = useState<1 | 2>((params.step as 1 | 2) ?? 1);
  const [name, setName] = useState((params.name as string) ?? '');
  const [about, setAbout] = useState('');
  const [q, setQ] = useState((params.q as string) ?? '');
  const [book, setBook] = useState<Book | null>((params.book as Book) ?? null);
  const [manual, setManual] = useState(!!params.manual);
  const [manualBook, setManualBook] = useState({ title: (params.manual as string) ?? '', author: params.manual ? 'Abubakar Adam Ibrahim' : '' });
  const [author, setAuthor] = useState(book?.author ?? '');
  const [genre, setGenre] = useState<string>(book?.genre ?? (params.manual ? 'Fiction' : ''));
  const [genreSheet, setGenreSheet] = useState(!!params.genreSheet);
  const [discard, setDiscard] = useState(!!params.discard);
  const [art, setArt] = useState(1);
  const [pub, setPub] = useState(true);
  const created = useClubs((s) => s.created.length);

  const results = q.trim().length >= 2 ? BOOKS.filter((b) => b.title.toLowerCase().includes(q.trim().toLowerCase()) || b.author.toLowerCase().includes(q.trim().toLowerCase())) : [];
  const dirty = !!(name || about || q || book || manualBook.title);
  const hasBook = manual ? !!manualBook.title.trim() && !!genre : !!book;
  const canContinue = !!name.trim() && hasBook;
  const close = () => (dirty ? setDiscard(true) : nav.pop());
  const pick = (b: Book) => { setBook(b); setAuthor(b.author); setGenre(b.genre); };

  const create = () => {
    const title = manual ? manualBook.title.trim() : book!.title;
    const id = `new-${created + 1}`;
    const c: Club = { id, name: name.trim(), art, palette: paletteFor(art), sub: `${title} · 1 member`, isPrivate: !pub, role: 'owner', row: { time: 'now', preview: 'Your bookclub is ready' } };
    clubs.create(c);
    chat.seed(id, [{ id: 'today', divider: 'date', label: 'Today' }]);
    app.set({ hasClubs: true });
    nav.replace('created-invite', { club: id }, 'fade');
  };

  if (step === 2) {
    return (
      <div className="screen">
        <ModalHeader title="New bookclub" step="Step 2 of 2" closeIcon="CaretLeft" onClose={() => setStep(1)} />
        <div className="screen-body">
          <div className="col" style={{ padding: '16px 16px 24px', gap: 12 }}>
            <SectionHeader title="Choose an avatar" />
            <AvatarGrid art={art} onPick={setArt} />
            <SectionHeader title="Who can join?" />
            <SelectionCard icon="Globe" title="Public" desc="Anyone can find this bookclub and join it." on={pub} onClick={() => setPub(true)} />
            <SelectionCard icon="LockSimple" title="Private" desc="Only people you invite or approve can join." on={!pub} onClick={() => setPub(false)} />
          </div>
        </div>
        <PinnedFooter style={{ boxShadow: 'inset 0 1px 0 var(--border-subtle)', gap: 4 }}>
          <Button full onClick={create}>Create bookclub</Button>
        </PinnedFooter>
      </div>
    );
  }

  return (
    <div className="screen">
      <ModalHeader title="New bookclub" step="Step 1 of 2" onClose={close} />
      <div className="screen-body">
        <div className="col" style={{ padding: '16px 16px 24px', gap: 12 }}>
          <TextField label="Name" value={name} onChange={(v) => setName(v.slice(0, 50))} placeholder="e.g. Midnight Readers Club" counter={`${name.length} / 50`} />
          <TextArea label="What’s it about?" value={about} onChange={setAbout} placeholder="Explore magical worlds, epic adventures and unforgettable characters." helper="Optional" max={200} />
          <span className="t-label c-secondary">Book</span>
          {manual ? (
            <>
              <TextField label="Book title" value={manualBook.title} onChange={(v) => setManualBook({ ...manualBook, title: v.slice(0, 120) })} placeholder="e.g. Season of Crimson Blossoms" counter={`${manualBook.title.length} / 120`} />
              <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <div className="grow"><TextField label="Author (optional)" value={manualBook.author} onChange={(v) => setManualBook({ ...manualBook, author: v })} placeholder="e.g. Abubakar Adam Ibrahim" /></div>
                <div className="grow"><SelectField label="Genre" value={genre} placeholder="Choose a genre" helper="Pick the closest, or “Not sure yet”." onClick={() => setGenreSheet(true)} /></div>
              </div>
              <button className="t-body-s c-link" style={{ textAlign: 'left' }} onClick={() => { setManual(false); setGenre(book?.genre ?? ''); }}>Search for the book instead</button>
            </>
          ) : book ? (
            <>
              <SelectedBook title={book.title} author={`${book.author} · ${genre || book.genre}`} onChange={() => { setBook(null); setQ(''); }} />
              <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <div className="grow"><TextField label="Author" value={author} onChange={setAuthor} placeholder="e.g. James Clear" /></div>
                <div className="grow"><SelectField label="Genre" value={genre} placeholder="Choose a genre" helper="Change it if that’s not right." onClick={() => setGenreSheet(true)} /></div>
              </div>
            </>
          ) : (
            <>
              <SearchField value={q} onChange={setQ} placeholder="Search a title" />
              {results.length > 0 && (
                <div className="col">
                  {results.map((b) => <BookResultRow key={b.title} title={b.title} author={`${b.author} · ${b.year}`} onClick={() => pick(b)} />)}
                </div>
              )}
              <button className="t-body-s c-link" style={{ textAlign: 'left' }} onClick={() => { setManual(true); setManualBook((m) => ({ ...m, title: m.title || q })); }}>Can’t find it? Add it manually</button>
            </>
          )}
          {(book || manual) && (
            <div className="row" style={{ padding: 12, gap: 8, background: 'var(--surface-sunken)', borderRadius: 8, alignItems: 'flex-start' }}>
              <Icon name="Info" size={18} />
              <span className="t-caption c-tertiary grow">Page234 doesn’t host books. This just tells people what you’re reading together.</span>
            </div>
          )}
        </div>
      </div>
      <PinnedFooter style={{ boxShadow: 'inset 0 1px 0 var(--border-subtle)', gap: 4 }}>
        <Button full disabled={!canContinue} onClick={() => setStep(2)}>Continue</Button>
      </PinnedFooter>
      {genreSheet && <GenreSheet value={genre} onPick={(g) => { setGenre(g); setGenreSheet(false); }} onClose={() => setGenreSheet(false)} />}
      {discard && (
        <Dialog title="Discard this bookclub?" body="What you’ve typed so far won’t be saved." confirm="Discard" onCancel={() => setDiscard(false)} onConfirm={() => { setDiscard(false); nav.pop(); }} />
      )}
    </div>
  );
}

export function CreatedInvite({ params }: { params: Params }) {
  const id = (params.club as string) ?? 'new-1';
  const club = useClubs((s) => s.created.find((c) => c.id === id));
  const [emails, setEmails] = useState<string[]>((params.emails as string[]) ?? []);
  const name = club?.name ?? 'Midnight Readers Club';
  return (
    <div className="screen">
      <ModalHeader title="Invite people" step={name} onClose={() => nav.replace('chat', { club: id }, 'fade')} />
      <div className="screen-body">
        <InviteBlock
          owner
          emails={emails}
          setEmails={setEmails}
          intro={{ title: 'Your bookclub is ready', body: 'Invite a few people to start the conversation. You can always do this later from the bookclub menu.' }}
          onSent={() => { app.toast(`Invitations sent to ${emails.length} ${emails.length === 1 ? 'person' : 'people'}`, 'success', { bottom: 109 }); setEmails(() => []); }}
        />
      </div>
      <PinnedFooter style={{ boxShadow: 'inset 0 1px 0 var(--border-subtle)', gap: 4 }}>
        <Button full onClick={() => nav.replace('chat', { club: id }, 'fade')}>Go to bookclub</Button>
      </PinnedFooter>
    </div>
  );
}
