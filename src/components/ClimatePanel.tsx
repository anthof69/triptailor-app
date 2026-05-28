import { Link } from 'react-router-dom';
import { IconClose, IconBookmark, IconCompare, IconArrow } from './icons';
import { ScoreRing, MiniBars, ScoreWhy } from './atoms';
import { months, monthsFull, type Country } from '../data/countries';
import { budgetSym, scoreHex, scoreLabel, tagLabel } from '../lib/utils';

interface Props {
  country: Country | null;
  monthIdx: number;
  saved: boolean;
  onClose: () => void;
  onAddTrip: (iso: string) => void;
  onCompare: (iso: string) => void;
}

export function ClimatePanel({ country, monthIdx, saved, onClose, onAddTrip, onCompare }: Props) {
  if (!country) return null;
  const score = country.scores[monthIdx];
  return (
    <aside className="climate-panel" aria-label={`Détails pour ${country.name}`}>
      <header className="cp-head">
        <button className="cp-close" onClick={onClose} aria-label="Fermer"><IconClose size={18}/></button>
        <div className="t-eyebrow">{monthsFull[monthIdx]} · {country.iso}</div>
      </header>

      <div className="cp-hero">
        <div className="cp-flag" style={{
          background: `linear-gradient(135deg, ${scoreHex(score)}, ${scoreHex(score)}55), radial-gradient(circle at 70% 30%, rgba(255,210,170,0.35), transparent 50%)`,
        }}>
          <span className="cp-flag-iso">{country.iso}</span>
        </div>
        <div>
          <h2 className="cp-name"><i>{country.name}</i></h2>
          <div className="cp-city">{country.city}</div>
        </div>
      </div>

      <div className="cp-score-block">
        <ScoreRing value={score} size={132} stroke={9}/>
        <div className="cp-score-meta">
          <div className="t-eyebrow">Score climatique</div>
          <div className="cp-score-headline" style={{ color: scoreHex(score) }}>
            {scoreLabel(score)}
          </div>
          <div className="cp-score-sub">en {monthsFull[monthIdx].toLowerCase()}</div>
        </div>
      </div>

      <div className="cp-why"><ScoreWhy country={country} monthIdx={monthIdx}/></div>

      <div className="cp-bars">
        <div className="cp-bars-head">
          <span className="t-eyebrow">Année entière</span>
          <span className="t-mono">{scoreHex(score).toUpperCase()}</span>
        </div>
        <MiniBars scores={country.scores} monthIdx={monthIdx} width={344} height={56}/>
        <div className="cp-bars-axis">
          {months.map((m, i) => (
            <span key={m} className={i === monthIdx ? 'is-on' : ''}>{m[0]}</span>
          ))}
        </div>
      </div>

      <div className="cp-grid">
        <div className="cp-stat">
          <div className="t-eyebrow">Température</div>
          <div className="cp-stat-val">{country.tempLo}–{country.tempHi}<span className="cp-stat-u">°C</span></div>
        </div>
        <div className="cp-stat">
          <div className="t-eyebrow">Pluie</div>
          <div className="cp-stat-val">{country.rainDays}<span className="cp-stat-u">j/mois</span></div>
        </div>
        <div className="cp-stat">
          <div className="t-eyebrow">Budget</div>
          <div className="cp-stat-val">{budgetSym(country.budget)}<span className="cp-stat-u">/jour</span></div>
        </div>
      </div>

      <div className="cp-tags">
        {country.tags.map(t => <span key={t} className="chip">{tagLabel(t)}</span>)}
      </div>

      <div className="cp-hl">
        <div className="t-eyebrow">À voir</div>
        <p className="cp-hl-txt"><i>{country.hi}</i></p>
      </div>

      <Link className="cp-detail-link" to={`/pays/${country.iso}`}>
        Page complète, agents &amp; partage <IconArrow size={13}/>
      </Link>

      <div className="cp-ctas">
        <button className="btn btn-primary cp-cta-1" onClick={() => onAddTrip(country.iso)}>
          <IconBookmark size={14} filled={saved}/> {saved ? "Voyage enregistré" : "Ajouter à mes voyages"}
        </button>
        <button className="btn btn-ghost" onClick={() => onCompare(country.iso)}>
          <IconCompare size={14}/> Comparer
        </button>
      </div>
    </aside>
  );
}
