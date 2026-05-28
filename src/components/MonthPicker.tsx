import { useEffect, useRef, useState } from 'react';
import { monthsFull } from '../data/countries';

export function MonthPicker({ monthIdx, setMonthIdx }: { monthIdx: number; setMonthIdx: (i: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="month-pick" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}>
        {monthsFull[monthIdx]}
        <span className="caret">▾</span>
      </button>
      {open && (
        <div className="month-pop" role="listbox">
          {monthsFull.map((m, i) => (
            <button key={m} className={"month-opt " + (i === monthIdx ? 'is-on' : '')}
                    role="option" aria-selected={i === monthIdx}
                    onClick={() => { setMonthIdx(i); setOpen(false); }}>
              <span className="t-mono">{String(i + 1).padStart(2, '0')}</span> {m}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
