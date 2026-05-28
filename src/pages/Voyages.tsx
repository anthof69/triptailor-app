import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconMap, IconCompare, IconTrash } from '../components/icons';
import { countries as ALL, countryByIso, monthsFull, type Country } from '../data/countries';
import { budgetSym, photoGrad, scoreClass, scoreHex, tagLabel } from '../lib/utils';
import type { PageProps } from '../App';

interface TripEntry { iso: string; month: number; added: string }
interface TripDisplay { entry: TripEntry; country: Country }

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays < 1) return "à l'instant";
  if (diffDays === 1) return 'hier';
  if (diffDays < 30) return `il y a ${diffDays} jours`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function TripCard({ entry, country, onCompare, onRemove }: { entry: TripEntry; country: Country; onCompare: (iso: string) => void; onRemove: (iso: string) => void }) {
  const score = country.scores[entry.month];
  return (
    <article className="trip-card">
      <div className="trip-hero" style={{ background: photoGrad(country.iso) }}>
        <span className="trip-iso">{country.iso}</span>
        <span className={"trip-score-corner score " + scoreClass(score)} style={{ color: scoreHex(score) }}>{score}</span>
      </div>
      <div className="trip-body">
        <div>
          <h3 className="trip-name">{country.name}</h3>
          <div className="trip-city">{country.city} · partir en <i style={{ color: 'var(--tt-terra-soft)' }}>{monthsFull[entry.month]}</i></div>
        </div>
        <div className="trip-meta">
          <span><b>{country.tempLo}–{country.tempHi}°C</b></span>
          <span><b>{budgetSym(country.budget)}</b>/jour</span>
          <span><b>{country.rainDays}j</b> pluie</span>
        </div>
        <div className="trip-tags">
          {country.tags.map(t => <span key={t} className="trip-tag">{tagLabel(t)}</span>)}
        </div>
      </div>
      <div className="trip-foot">
        <span className="trip-added">Ajouté {entry.added}</span>
        <Link to="/" className="icon-btn" title="Voir sur la carte"><IconMap/></Link>
        <button className="icon-btn" title="Comparer" onClick={() => onCompare(country.iso)}><IconCompare/></button>
        <button className="icon-btn" title="Retirer" onClick={() => onRemove(country.iso)}><IconTrash/></button>
      </div>
    </article>
  );
}

export function Voyages({ appState, setAppState, removeTrip }: PageProps) {
  const navigate = useNavigate();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'high' | 'winter' | 'summer'>('all');

  const trips: TripDisplay[] = useMemo(() => {
    return appState.savedTrips
      .map(s => ({
        entry: { iso: s.iso, month: s.month, added: formatRelative(s.addedAt) },
        country: countryByIso(s.iso)!,
      }))
      .filter(t => t.country);
  }, [appState.savedTrips]);

  const filtered = useMemo(() => {
    if (filter === 'high')   return trips.filter(t => t.country.scores[t.entry.month] >= 80);
    if (filter === 'winter') return trips.filter(t => [11, 0, 1].includes(t.entry.month));
    if (filter === 'summer') return trips.filter(t => [5, 6, 7].includes(t.entry.month));
    return trips;
  }, [trips, filter]);

  const avgScore = trips.length ? Math.round(trips.reduce((a, t) => a + t.country.scores[t.entry.month], 0) / trips.length) : 0;
  const months = new Set(trips.map(t => t.entry.month));

  const onRemove = (iso: string) => { void removeTrip(iso); };
  const onCompare = (iso: string) => {
    setAppState(s => ({ ...s, comparePicks: Array.from(new Set([...s.comparePicks, iso])).slice(0, 3) }));
    navigate('/comparer');
  };

  return (
    <>
      <section className="page-head-voyages">
        <div className="page-l">
          <div className="t-eyebrow">Mes voyages · {trips.length} destinations</div>
          <h1 className="page-h"><i>{trips.length} idées</i> en pause,<br/>une seule à choisir.</h1>
          <p className="page-sub">Vos destinations enregistrées, ordonnées par <span style={{ color: 'var(--tt-ink-soft)' }}>fenêtre climatique</span>. Cliquez une carte pour rouvrir son analyse, comparer, ou planifier le départ.</p>
        </div>
        <div className="page-r">
          <div className="stat-row">
            <div><div className="stat-num">{trips.length}</div><div className="stat-lab">enregistrées</div></div>
            <div>
              <div className="stat-num">{avgScore}<span style={{ fontFamily: 'var(--f-mono)', fontStyle: 'normal', fontSize: 14, color: 'var(--tt-ink-muted)', marginLeft: 4 }}>/100</span></div>
              <div className="stat-lab">score moy.</div>
            </div>
            <div><div className="stat-num">{months.size}</div><div className="stat-lab">mois couverts</div></div>
          </div>
        </div>
      </section>

      <div className="filter">
        <div className="filter-l">
          <button className={"chip " + (filter === 'all' ? 'is-on' : '')} onClick={() => setFilter('all')}>Tous · {trips.length}</button>
          <button className={"chip " + (filter === 'high' ? 'is-on' : '')} onClick={() => setFilter('high')}>Score ≥ 80</button>
          <button className={"chip " + (filter === 'winter' ? 'is-on' : '')} onClick={() => setFilter('winter')}>Hiver</button>
          <button className={"chip " + (filter === 'summer' ? 'is-on' : '')} onClick={() => setFilter('summer')}>Été</button>
        </div>
        <div className="filter-r">
          <button className="sort-btn">
            <span className="t-eyebrow" style={{ textTransform: 'none', letterSpacing: '.05em' }}>Trier :</span>{' '}
            <b style={{ color: 'var(--tt-ink)' }}>Récents</b> ▾
          </button>
          <div className="view-tog">
            <button className={view === 'grid' ? 'is-on' : ''} onClick={() => setView('grid')}>▦</button>
            <button className={view === 'list' ? 'is-on' : ''} onClick={() => setView('list')}>≡</button>
          </div>
        </div>
      </div>

      <div className="trip-grid">
        {filtered.length === 0 ? (
          <div className="empty">
            <div style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 64, color: 'var(--tt-terra)', lineHeight: 1 }}>«</div>
            <h2 className="empty-h">Aucun voyage <i style={{ color: 'var(--tt-terra)' }}>pour l'instant.</i></h2>
            <p className="empty-p">Commencez par cliquer un pays sur la carte, ou laissez-vous inspirer.</p>
            <div className="empty-ctas" style={{ display: 'flex', gap: 8 }}>
              <Link className="btn btn-primary" to="/">Ouvrir la carte</Link>
              <Link className="btn btn-ghost" to="/inspire">M'inspirer</Link>
            </div>
          </div>
        ) : (
          filtered.map(t => (
            <TripCard key={t.entry.iso} entry={t.entry} country={t.country}
                      onCompare={onCompare} onRemove={onRemove}/>
          ))
        )}
        {filtered.length > 0 && (
          <Link className="add-card" to="/">
            <span className="add-card-glyph">+</span>
            <span className="add-card-h">Nouvelle idée</span>
            <span style={{ color: 'var(--tt-ink-muted)', fontSize: 12.5, marginTop: -4 }}>Retournez sur la carte ou laissez-vous inspirer</span>
          </Link>
        )}
      </div>
    </>
  );
}
