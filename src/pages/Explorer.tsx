import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IconSearch, IconClose, IconCompare } from '../components/icons';
import { WorldMap } from '../components/WorldMap';
import { ClimatePanel } from '../components/ClimatePanel';
import { AgentsPanel } from '../components/AgentsPanel';
import { MonthPicker } from '../components/MonthPicker';
import { continents, countries as ALL } from '../data/countries';
import { scoreClass, scoreHex } from '../lib/utils';
import type { PageProps } from '../App';


function SearchBox({ monthIdx, query, setQuery, onPick }: {
  monthIdx: number; query: string; setQuery: (q: string) => void; onPick: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return ALL
      .filter(c => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q))
      .sort((a, b) => b.scores[monthIdx] - a.scores[monthIdx])
      .slice(0, 6);
  }, [query, monthIdx]);

  useEffect(() => { setActive(0); }, [query]);

  const pick = (iso: string) => { onPick(iso); setOpen(false); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!matches.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, matches.length - 1)); setOpen(true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(matches[active].iso); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div className="search-wrap" ref={ref}>
      <span className="search-ic"><IconSearch/></span>
      <input
        className="search-in" placeholder="Lisbonne, Bali, Patagonie…"
        value={query}
        role="combobox" aria-expanded={open && matches.length > 0} aria-controls="search-listbox" aria-autocomplete="list"
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {query && (
        <button className="search-x" onClick={() => { setQuery(''); setOpen(false); }} aria-label="Effacer">
          <IconClose size={14}/>
        </button>
      )}
      {open && matches.length > 0 && (
        <ul className="search-pop" id="search-listbox" role="listbox">
          {matches.map((c, i) => {
            const s = c.scores[monthIdx];
            return (
              <li key={c.iso} role="option" aria-selected={i === active}
                  className={"search-opt " + (i === active ? 'is-active' : '')}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => { e.preventDefault(); pick(c.iso); }}>
                <span className="search-opt-flag" style={{ background: scoreHex(s) }}/>
                <span className="search-opt-name">{c.name}<span className="search-opt-city"> · {c.city}</span></span>
                <span className={"search-opt-score score " + scoreClass(s)} style={{ color: scoreHex(s), fontSize: 18 }}>{s}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
  onPick: (iso: string) => void;
  compareMode: boolean;
  onToggleCompareMode: () => void;
}

function SubNav({ monthIdx, setMonthIdx, continent, setContinent, query, setQuery, totalCount, onPick, compareMode, onToggleCompareMode }: SubNavProps) {
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
        <div className="sub-nav-search-row">
          <SearchBox monthIdx={monthIdx} query={query} setQuery={setQuery} onPick={onPick}/>
          <button className={"chip cmp-toggle " + (compareMode ? 'is-on' : '')}
                  onClick={onToggleCompareMode} aria-pressed={compareMode}>
            <IconCompare size={14}/> Comparer
          </button>
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [monthIdx, setMonthIdx] = useState(appState.monthIdx ?? 4);
  const [continent, setContinent] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => { setAppState(s => ({ ...s, monthIdx })); }, [monthIdx, setAppState]);

  // Deep-link: /?pays=PT&mois=5 selects + (via WorldMap) flies to the country on load.
  // Read once on mount, then strip the params so they don't linger.
  useEffect(() => {
    const pays = searchParams.get('pays');
    const mois = searchParams.get('mois');
    if (mois !== null) { const m = parseInt(mois, 10); if (m >= 0 && m <= 11) setMonthIdx(m); }
    if (pays && ALL.some(c => c.iso === pays)) setSelectedIso(pays);
    if (pays || mois !== null) setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = selectedIso ? ALL.find(c => c.iso === selectedIso) || null : null;

  const onPick = (iso: string) => { setContinent('all'); setSelectedIso(iso); };

  const goCompare = (iso: string) => {
    setAppState(s => ({ ...s, comparePicks: Array.from(new Set([...s.comparePicks, iso])).slice(0, 3) }));
    navigate('/comparer');
  };

  const picks = appState.comparePicks;
  const toggleCompare = (iso: string) => {
    setAppState(s => {
      const has = s.comparePicks.includes(iso);
      if (has) return { ...s, comparePicks: s.comparePicks.filter(x => x !== iso) };
      if (s.comparePicks.length >= 3) return s;            // cap at 3
      return { ...s, comparePicks: [...s.comparePicks, iso] };
    });
  };
  const onMapSelect = (iso: string) => {
    if (compareMode) toggleCompare(iso);
    else setSelectedIso(iso);
  };

  return (
    <div className="explorer">
      <SubNav
        monthIdx={monthIdx} setMonthIdx={setMonthIdx}
        continent={continent} setContinent={setContinent}
        query={query} setQuery={setQuery}
        totalCount={ALL.length}
        onPick={onPick}
        compareMode={compareMode}
        onToggleCompareMode={() => { setCompareMode(m => !m); setSelectedIso(null); }}
      />
      <main className="explorer-main">
        <WorldMap
          monthIdx={monthIdx}
          continent={continent}
          query={query}
          selectedIso={compareMode ? null : selectedIso}
          onSelect={onMapSelect}
          compareSet={compareMode ? picks : []}
        />

        {compareMode && (
          <div className="cmp-tray" role="region" aria-label="Sélection à comparer">
            <div className="cmp-tray-head">
              <span className="t-eyebrow">Comparer — touchez 2 ou 3 pays</span>
              <button className="cmp-tray-x" onClick={() => setCompareMode(false)} aria-label="Quitter le mode comparaison">Terminé</button>
            </div>
            <div className="cmp-tray-items">
              {picks.length === 0 && <span className="cmp-tray-empty">Aucun pays sélectionné</span>}
              {picks.map(iso => {
                const c = ALL.find(x => x.iso === iso)!;
                return (
                  <button key={iso} className="cmp-tray-chip" onClick={() => toggleCompare(iso)} title={`Retirer ${c.name}`}>
                    {c.name} <span aria-hidden>×</span>
                  </button>
                );
              })}
            </div>
            <button className="btn btn-primary cmp-tray-go" disabled={picks.length < 2}
                    onClick={() => navigate('/comparer')}>
              Comparer {picks.length >= 2 ? `(${picks.length})` : ''}
            </button>
          </div>
        )}

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
