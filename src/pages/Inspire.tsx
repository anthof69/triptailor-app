import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconArrow, IconBookmark } from '../components/icons';
import { Score } from '../components/atoms';
import { countries as ALL, monthsFull, type Country, type Tag } from '../data/countries';
import { budgetLabel, budgetSym, photoGrad, tagLabel, teaseFor } from '../lib/utils';
import type { PageProps } from '../App';

const VIBES: { id: Tag; label: string; gly: string }[] = [
  { id: 'plage',    label: 'La mer',     gly: '~' },
  { id: 'culture',  label: 'La culture', gly: '§' },
  { id: 'aventure', label: "L'aventure", gly: '△' },
  { id: 'gastro',   label: 'La table',   gly: '✦' },
  { id: 'nature',   label: 'La nature',  gly: '❋' },
  { id: 'ville',    label: 'La ville',   gly: '☐' },
];

interface Ranked { c: Country; score: number; tagMatch: number; total: number }

function rankCountries(vibes: Tag[], budget: number, monthIdx: number): Ranked[] {
  return ALL
    .map(c => {
      const score = c.scores[monthIdx];
      const tagMatch = vibes.length ? vibes.filter(v => c.tags.includes(v)).length / vibes.length : 0.4;
      const budgetMatch = c.budget <= budget ? 1 : 0.4;
      const total = score * 0.55 + (tagMatch * 100) * 0.30 + (budgetMatch * 100) * 0.15;
      return { c, score, tagMatch, total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

function whyFor(c: Country, vibes: Tag[]) {
  const matchedTags = vibes.filter(v => c.tags.includes(v));
  if (matchedTags.length === 0) return 'Score climatique élevé ce mois-ci';
  return matchedTags.map(t => tagLabel(t).toLowerCase()).join(' + ') + (c.budget <= 2 ? ' · budget contenu' : ' · expérience premium');
}

export function Inspire({ appState, setAppState, addTrip }: PageProps) {
  const navigate = useNavigate();
  const [vibes, setVibes] = useState<Tag[]>(['plage', 'gastro']);
  const [budget, setBudget] = useState(2);
  const [duration, setDuration] = useState(8);
  const monthIdx = appState.monthIdx ?? 4;

  const top5 = useMemo(() => rankCountries(vibes, budget, monthIdx), [vibes, budget, monthIdx]);
  const [hero, ...rest] = top5;
  const toggleVibe = (id: Tag) => setVibes(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);

  const cycleMonth = () => setAppState(s => ({ ...s, monthIdx: (monthIdx + 1) % 12 }));

  return (
    <div className="inspire-wrap">
      <aside className="quiz">
        <div className="quiz-head">
          <div className="t-eyebrow">Inspire-moi</div>
          <h1 className="quiz-h">Qu'est-ce qui<br/><i>vous appelle</i> ?</h1>
          <p className="quiz-sub">Cinq destinations triées sur le volet, en croisant vos envies avec la fenêtre climatique du mois choisi.</p>
        </div>

        <div className="quiz-section">
          <h3>Vos envies · {vibes.length}</h3>
          <div className="tag-grid">
            {VIBES.map(v => (
              <button key={v.id} className={"tag-btn " + (vibes.includes(v.id) ? 'is-on' : '')}
                      onClick={() => toggleVibe(v.id)}>
                <span className="gly">{v.gly}</span>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-section">
          <h3>Budget · max</h3>
          <div className="budget-row">
            {[1, 2, 3].map(b => (
              <button key={b} className={budget === b ? 'is-on' : ''} onClick={() => setBudget(b)}>
                <span className="euro">€</span>{budgetLabel(b)}
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-section">
          <h3>
            Durée du voyage
            <span className="soon-tag">bientôt</span>
          </h3>
          <div className="slider-wrap">
            <div className="slider-head">
              <span className="slider-val">{duration}<sup>jours</sup></span>
              <span style={{ fontSize: 12, color: 'var(--tt-ink-muted)' }}>
                {duration <= 4 ? 'court week-end' : duration <= 10 ? 'séjour standard' : 'long voyage'}
              </span>
            </div>
            <input className="slider" type="range" min={3} max={21}
                   value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))}/>
            <div className="slider-axis"><span>3</span><span>7</span><span>14</span><span>21</span></div>
            <p className="soon-note">La durée servira bientôt à générer un itinéraire jour&nbsp;par&nbsp;jour. Pour l'instant, le top 5 dépend de vos envies, du budget et du mois.</p>
          </div>
        </div>

        <div className="quiz-cta">
          <div className="quiz-summary">
            On cherche <i>{vibes.length ? vibes.map(v => tagLabel(v).toLowerCase()).join(', ') : 'un peu de tout'}</i>{' '}
            avec un budget <i>{budgetLabel(budget)}</i> en{' '}
            <i>{monthsFull[monthIdx].toLowerCase()}</i>.
          </div>
        </div>
      </aside>

      <main className="results">
        <div className="results-head">
          <h2 className="results-h">
            <i>Cinq</i> destinations<br/>pour vous, en{' '}
            <span className="results-month" onClick={cycleMonth}>
              <i>{monthsFull[monthIdx].toLowerCase()}</i>{' '}
              <span style={{ fontFamily: 'var(--f-sans)', fontStyle: 'normal', fontSize: '0.5em', color: 'var(--tt-terra)' }}>▾</span>
            </span>
            .
          </h2>
          <div className="results-meta">
            <div className="t-eyebrow">Trié par</div>
            <div style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--tt-terra-soft)', marginTop: 2 }}>pertinence</div>
          </div>
        </div>

        <div className="results-grid">
          {hero && (
            <div className="hero-result" style={{ background: photoGrad(hero.c.iso) }}>
              <div className="hero-rank">01</div>
              <div className="hero-iso">{hero.c.iso}</div>
              <h3 className="hero-name">{hero.c.name}</h3>
              <div className="hero-city">{hero.c.city}</div>
              <p className="hero-tease">« {teaseFor(hero.c, monthIdx)} »</p>
              <div className="hero-meta">
                <span><b>{hero.c.tempLo}–{hero.c.tempHi}°C</b></span>
                <span><b>{budgetSym(hero.c.budget)}</b>/jour</span>
                <span><b>{hero.c.rainDays}j</b> pluie</span>
                <span style={{ marginLeft: 'auto', textTransform: 'uppercase', fontSize: 9.5, letterSpacing: '.16em', color: 'var(--tt-terra-soft)' }}>· {whyFor(hero.c, vibes)}</span>
              </div>
              <div className="hero-cta-row">
                <button className="btn btn-primary" onClick={() => addTrip(hero.c.iso, monthIdx)}><IconBookmark size={14}/> Enregistrer</button>
                <button className="btn btn-ghost" onClick={() => navigate('/')}>Voir sur la carte <IconArrow/></button>
              </div>
              <span className="hero-score-big">{hero.score}<sup>/100</sup></span>
            </div>
          )}

          <div className="side-stack">
            {rest.map((r, i) => (
              <article key={r.c.iso} className="side-card">
                <div className="side-card-photo" style={{ background: photoGrad(r.c.iso) }}>
                  <span className="side-card-rank">{String(i + 2).padStart(2, '0')}</span>
                </div>
                <div className="side-card-body">
                  <h4 className="side-card-name">{r.c.name}</h4>
                  <div className="side-card-sub">{r.c.city} · {budgetSym(r.c.budget)}</div>
                  <div className="side-card-why">{whyFor(r.c, vibes)}</div>
                </div>
                <div className="side-card-score">
                  <Score value={r.score} size={36} label={false}/>
                  <span className="m" style={{ fontFamily: 'var(--f-mono)', fontSize: 9.5, color: 'var(--tt-ink-mute2)', letterSpacing: '.1em', textTransform: 'uppercase' }}>score</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
