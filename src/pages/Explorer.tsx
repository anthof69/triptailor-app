import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSearch, IconClose } from '../components/icons';
import { WorldMap } from '../components/WorldMap';
import { ClimatePanel } from '../components/ClimatePanel';
import { AgentsPanel } from '../components/AgentsPanel';
import { continents, countries as ALL, monthsFull } from '../data/countries';
import type { PageProps } from '../App';

function MonthPicker({ monthIdx, setMonthIdx }: { monthIdx: number; setMonthIdx: (i: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="month-pick" onClick={() => setOpen(o => !o)}>
        {monthsFull[monthIdx]}
        <span className="caret">▾</span>
      </button>
      {open && (
        <div className="month-pop" role="listbox">
          {monthsFull.map((m, i) => (
            <button key={m} className={"month-opt " + (i === monthIdx ? 'is-on' : '')}
                    onClick={() => { setMonthIdx(i); setOpen(false); }}>
              <span className="t-mono">{String(i + 1).padStart(2, '0')}</span> {m}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

interface SubNavProps {
  monthIdx: number;
  setMonthIdx: (i: number) => void;
  continent: string;
  setContinent: (c: string) => void;
  query: string;
  setQuery: (q: string) => void;
  totalCount: number;
}

function SubNav({ monthIdx, setMonthIdx, continent, setContinent, query, setQuery, totalCount }: SubNavProps) {
  return (
    <section className="sub-nav">
      <div className="sub-nav-l">
        <h1 className="hero-h">
          <i>Où vous emmène </i>
          <MonthPicker monthIdx={monthIdx} setMonthIdx={setMonthIdx}/>
          <i>&nbsp;?</i>
        </h1>
        <p className="hero-sub">
          {totalCount} destinations notées · cliquez un pays pour ouvrir son climat,
          son budget et l'avis des quatre agents.
        </p>
      </div>
      <div className="sub-nav-r">
        <div className="search-wrap">
          <span className="search-ic"><IconSearch/></span>
          <input className="search-in" placeholder="Lisbonne, Bali, Patagonie…"
                 value={query} onChange={(e) => setQuery(e.target.value)}/>
          {query && (
            <button className="search-x" onClick={() => setQuery('')} aria-label="Effacer">
              <IconClose size={14}/>
            </button>
          )}
        </div>
        <div className="chip-row">
          {continents.map(c => (
            <button key={c.id}
                    className={"chip " + (continent === c.id ? 'is-on' : '')}
                    onClick={() => setContinent(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Explorer({ appState, setAppState, addTrip }: PageProps) {
  const navigate = useNavigate();

  const [monthIdx, setMonthIdx] = useState(appState.monthIdx ?? 4);
  const [continent, setContinent] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  useEffect(() => { setAppState(s => ({ ...s, monthIdx })); }, [monthIdx, setAppState]);

  const selected = selectedIso ? ALL.find(c => c.iso === selectedIso) || null : null;

  const goCompare = (iso: string) => {
    setAppState(s => ({ ...s, comparePicks: Array.from(new Set([...s.comparePicks, iso])).slice(0, 3) }));
    navigate('/comparer');
  };

  return (
    <div className="explorer">
      <SubNav
        monthIdx={monthIdx} setMonthIdx={setMonthIdx}
        continent={continent} setContinent={setContinent}
        query={query} setQuery={setQuery}
        totalCount={ALL.length}
      />
      <main className="explorer-main">
        <WorldMap
          monthIdx={monthIdx}
          continent={continent}
          query={query}
          selectedIso={selectedIso}
          onSelect={setSelectedIso}
        />
        <ClimatePanel
          country={selected}
          monthIdx={monthIdx}
          saved={!!selected && appState.saved.includes(selected.iso)}
          onClose={() => setSelectedIso(null)}
          onAddTrip={(iso) => addTrip(iso, monthIdx)}
          onCompare={goCompare}
        />
        <AgentsPanel
          country={selected}
          monthIdx={monthIdx}
          open={appState.agentsOpen}
          onClose={() => setAppState(s => ({ ...s, agentsOpen: false }))}
        />
      </main>
    </div>
  );
}
