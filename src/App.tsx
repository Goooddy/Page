import { useEffect, useLayoutEffect, useState } from 'react';
import { useNavState, type Route } from './lib/nav';
import { SCREENS } from './screens';
import { StatusBar } from './components/ui/nav';
import { ToastHost } from './components/ui/overlays';
import { useApp } from './data/app';
import { ScreenIndex } from './ScreenIndex';
import { SheetHost } from './screens/misc';

// Frames drawn without the iOS status bar in Figma.
const NO_STATUS_BAR = new Set(['launch', 'lock-screen', 'android-shade']);

function Layer({ route, cls }: { route: Route; cls: string }) {
  const C = SCREENS[route.name];
  return (
    <div className={`nav-layer ${cls}`}>
      {C ? <C params={route.params} /> : <div className="screen center t-body c-secondary">Missing screen: {route.name}</div>}
    </div>
  );
}

function Navigator() {
  const { stack, exiting, revealed } = useNavState();
  const enterCls: Record<Route['mode'], string> = { push: 'enter-push', modal: 'enter-modal', fade: 'enter-fade', none: '' };
  return (
    <>
      {stack.map((r, i) => {
        const isTop = i === stack.length - 1;
        let cls = '';
        if (i < stack.length - 2) cls = 'hidden';
        else if (isTop && revealed === r.key) cls = exiting?.mode === 'push' ? 'under-pop' : '';
        else if (isTop && !revealed) cls = enterCls[r.mode];
        return <Layer key={r.key} route={r} cls={cls} />;
      })}
      {exiting && <Layer key={exiting.key} route={exiting} cls={exiting.mode === 'modal' ? 'exit-modal' : 'exit-pop'} />}
    </>
  );
}

/** OS dark mode, unless the host page (e.g. a Claude artifact viewer) stamps an explicit data-theme on <html>. */
function readDark() {
  const forced = document.documentElement.dataset.theme;
  if (forced === 'dark' || forced === 'light') return forced === 'dark';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function useDarkPreference() {
  const [dark, setDark] = useState(readDark);
  useEffect(() => {
    const f = () => setDark(readDark());
    const m = window.matchMedia?.('(prefers-color-scheme: dark)');
    m?.addEventListener('change', f);
    const o = new MutationObserver(f);
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { m?.removeEventListener('change', f); o.disconnect(); };
  }, []);
  return dark;
}

export function Phone({ framed }: { framed: boolean }) {
  const theme = useApp((s) => s.theme);
  const sysDark = useDarkPreference();
  const dark = theme === 'dark' || (theme === 'system' && sysDark);
  const lightStatus = useApp((s) => s.statusBarLight);
  const { stack } = useNavState();
  const top = stack[stack.length - 1]?.name;
  const showStatus = framed && !NO_STATUS_BAR.has(top);
  // Colors the real phone's status bar to match the app's canvas (light #f9f9fb, dark #0d0c10).
  useEffect(() => {
    if (!framed) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0d0c10' : '#f9f9fb');
  }, [dark, framed]);
  return (
    <div className={`phone ${framed ? '' : 'fullscreen'} ${dark ? 'theme-dark' : ''}`}>
      <Navigator />
      <SheetHost />
      <ToastHost />
      {showStatus && <StatusBar light={lightStatus} />}
    </div>
  );
}

function useLayout() {
  const calc = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [size, setSize] = useState(calc);
  useLayoutEffect(() => {
    const f = () => setSize(calc());
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return size;
}

export default function App() {
  const { w, h } = useLayout();
  const framed = w >= 760;
  if (!framed) return <Phone framed={false} />;
  const stageW = w - 300;
  const scale = Math.min(1, (h - 48) / 872, (stageW - 48) / 413);
  return (
    <div className="shell">
      <ScreenIndex />
      <main className="shell-stage">
        <div className="frame-wrap" style={{ transform: `scale(${scale})` }}>
          <div className="phone-frame">
            <Phone framed />
          </div>
        </div>
      </main>
    </div>
  );
}
