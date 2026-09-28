import { useEffect, useRef, useState } from 'react';
import logo from '../assets/img/logo.svg';
import ill1 from '../assets/img/illustration-1.svg';
import ill2 from '../assets/img/illustration-2.svg';
import ill3 from '../assets/img/illustration-3.svg';
import { nav, type Params } from '../lib/nav';
import { AppBar, PinnedFooter } from '../components/ui/nav';
import { Button } from '../components/ui/core';
import { app } from '../data/app';

export function Launch({ params }: { params: Params }) {
  const deleted = !!params.deleted;
  useEffect(() => {
    if (deleted) {
      app.toast('Your account has been deleted.', 'neutral', { bottom: 40, icon: 'Trash' });
      return () => app.hideToast();
    }
    const t = setTimeout(() => nav.reset([['onboarding', { slide: 0 }]]), 1800);
    return () => clearTimeout(t);
  }, [deleted]);
  if (deleted) {
    return (
      <div className="screen tap" onClick={() => nav.reset([['onboarding', { slide: 0 }]])}>
        <img src={logo} alt="Page 234" style={{ position: 'absolute', width: 209, height: 65.3, left: 'calc(50% - 104.5px)', top: 'calc(50% - 47px)' }} />
        <p className="t-body-s c-tertiary tc" style={{ position: 'absolute', left: 0, right: 0, top: 'calc(50% + 34px)' }}>Welcome to a quieter space</p>
      </div>
    );
  }
  return (
    <div className="screen tap" onClick={() => nav.reset([['onboarding', { slide: 0 }]])}>
      <img src={logo} alt="Page 234" style={{ position: 'absolute', width: 209, height: 65.3, left: 'calc(50% - 104.5px)', top: 'calc(50% - 47px)' }} />
      <p className="t-body-l c-tertiary tc" style={{ position: 'absolute', left: 0, right: 0, bottom: 62 }}>Welcome to a quieter space</p>
    </div>
  );
}

const SLIDES = [
  {
    img: ill1, x: -22, y: -56, s: 405.7,
    title: 'Find readers on the same page',
    body: 'Every bookclub is built around one book. Join one for yours, or start your own.',
  },
  {
    img: ill2, x: -43, y: -68, s: 431.7,
    title: 'Talk it through together',
    body: 'Replies stay with the message they answer, so even busy chats are easy to follow.',
  },
  {
    img: ill3, x: 7, y: -24, s: 347.8,
    title: 'Pick up where you left off',
    body: 'Bookclubs open at your first unread message. Missed a lot? The busiest threads come first.',
  },
];

export function Onboarding({ params }: { params: Params }) {
  const [i, setI] = useState((params.slide as number) ?? 0);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const width = useRef(393);
  useEffect(() => setI((params.slide as number) ?? 0), [params.slide]);

  const onDown = (x: number, w: number) => { start.current = x; width.current = w; };
  const onMove = (x: number) => { if (start.current !== null) setDrag(x - start.current); };
  const onUp = () => {
    if (start.current === null) return;
    const d = drag;
    start.current = null;
    setDrag(0);
    if (d < -50 && i < 2) setI(i + 1);
    else if (d > 50 && i > 0) setI(i - 1);
  };

  return (
    <div className="screen">
      <AppBar variant="text" back={false} textAction={{ label: 'Skip', onClick: () => nav.push('signup') }} />
      <div
        className="grow"
        style={{ overflow: 'hidden', position: 'relative', touchAction: 'pan-y' }}
        onPointerDown={(e) => onDown(e.clientX, e.currentTarget.clientWidth)}
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={onUp}
      >
        <div
          className="row"
          style={{
            height: '100%', alignItems: 'stretch', width: '300%',
            transform: `translateX(calc(${-i * 100 / 3}% + ${drag / 3}px))`,
            transition: start.current === null ? 'transform 320ms cubic-bezier(.2,.8,.2,1)' : 'none',
          }}
        >
          {SLIDES.map((s, k) => (
            <div key={k} className="col" style={{ width: '33.3333%', padding: '8px 16px 0', gap: 20, alignItems: 'center' }}>
              <div style={{ width: '100%', aspectRatio: '361 / 300', maxHeight: 300, flexShrink: 1, background: 'var(--blue-100)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                <img
                  src={s.img}
                  alt=""
                  draggable={false}
                  style={{ position: 'absolute', left: `${(s.x / 361) * 100}%`, top: `${(s.y / 300) * 100}%`, width: `${(s.s / 361) * 100}%`, height: 'auto', pointerEvents: 'none' }}
                />
              </div>
              <h2 className="t-title-l c-primary tc fill">{s.title}</h2>
              <p className="t-body c-tertiary tc fill">{s.body}</p>
              <div className="row" style={{ gap: 4 }}>
                {[0, 1, 2].map((d) => (
                  <button
                    key={d}
                    aria-label={`Slide ${d + 1}`}
                    onClick={() => setI(d)}
                    style={{ width: d === i ? 36 : 6, height: 6, borderRadius: 4, background: d === i ? 'var(--action-primary)' : 'var(--border-default)', transition: 'width 200ms' }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <PinnedFooter style={{ alignItems: 'center' }}>
        <Button full onClick={() => nav.push('signup')}>Begin my journey</Button>
        <button className="t-body-s c-tertiary tc fill" onClick={() => nav.push('login')}>Already here?&nbsp; Log in</button>
      </PinnedFooter>
    </div>
  );
}
