import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { months, monthsFull } from '../data/countries';

export function MonthPicker({ monthIdx, setMonthIdx }: { monthIdx: number; setMonthIdx: (i: number) => void }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

  // Anchor the popover under the trigger on desktop (fixed coords so it escapes
  // any ancestor stacking context). On mobile it's a bottom sheet (CSS-positioned).
  useLayoutEffect(() => {
    if (!open || isMobile() || !btnRef.current) { setCoords(null); return; }
    const r = btnRef.current.getBoundingClientRect();
    const width = 340;
    const left = Math.max(12, Math.min(r.left, window.innerWidth - width - 12));
    setCoords({ top: r.bottom + 8, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const overlay = open ? createPortal(
    <>
      <div className="month-pop-bg" onClick={() => setOpen(false)} aria-hidden="true"/>
      <div
        ref={popRef}
        className={"month-pop " + (coords ? 'is-anchored' : '')}
        role="listbox" aria-label="Choisir un mois"
        style={coords ? { top: coords.top, left: coords.left } : undefined}
      >
        <div className="month-pop-title">Partir en quel mois ?</div>
        <div className="month-pop-grid">
          {monthsFull.map((m, i) => (
            <button key={m} className={"month-opt " + (i === monthIdx ? 'is-on' : '')}
                    role="option" aria-selected={i === monthIdx}
                    onClick={() => { setMonthIdx(i); setOpen(false); }}>
              <span className="month-opt-num t-mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="month-opt-name">{m}</span>
              <span className="month-opt-abbr">{months[i]}</span>
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <span className="month-pick-wrap">
      <button ref={btnRef} className="month-pick" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}>
        {monthsFull[monthIdx]}
        <span className="caret">▾</span>
      </button>
      {overlay}
    </span>
  );
}
