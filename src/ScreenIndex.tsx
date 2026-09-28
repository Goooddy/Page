import { useState } from 'react';
import { CATALOG } from './catalog';

export function ScreenIndex() {
  const [open, setOpen] = useState<Record<string, boolean>>({ [CATALOG[0].title]: true });
  const [active, setActive] = useState<string | null>(null);
  const total = CATALOG.reduce((n, s) => n + s.items.length, 0);
  return (
    <aside className="shell-side">
      <h1>Page234</h1>
      <p className="sub">Clickable prototype · {total} screens. Use the app, or jump to any screen below.</p>
      {CATALOG.map((sec) => (
        <div className="shell-sec" key={sec.title}>
          <button className="sec-head" onClick={() => setOpen((o) => ({ ...o, [sec.title]: !o[sec.title] }))}>
            <span>{sec.title}</span>
            <span className="n">{open[sec.title] ? '−' : sec.items.length}</span>
          </button>
          {open[sec.title] && sec.items.map((it) => (
            <button
              key={it.id}
              className={`shell-item ${active === it.id ? 'on' : ''}`}
              onClick={() => { setActive(it.id); it.go(); }}
            >
              {it.title}
              {it.hint && <span className="hint">{it.hint}</span>}
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}
