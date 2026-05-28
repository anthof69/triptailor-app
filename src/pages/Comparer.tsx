import { Link } from 'react-router-dom';
import { IconArrow, IconBookmark, IconClose } from '../components/icons';
import { MiniBars } from '../components/atoms';
import { countryByIso, months, monthsFull, type Country } from '../data/countries';
import { budgetEst, budgetSym, photoGrad, scoreClass, scoreHex, scoreLabel, tagLabel } from '../lib/utils';
import type { PageProps } from '../App';

const AGENT_LINES: Record<string, { meteo: string; budget: string; safety: string; plan: string }> = {
  PT: { meteo: "23°C secs, fenêtre idéale, brise atlantique.",         budget: "€€ — Lisbonne abordable, Algarve doux hors saison.", safety: "Risque faible. Pickpockets dans le tram 28.", plan: "7 j idéal : Lisbonne + Sintra + Algarve." },
  JP: { meteo: "22°C, fin des sakura, début de la saison verte.",       budget: "€€€ — JR Pass conseillé, ryokan en supplément.",     safety: "Risque très faible. Préparer le décalage.",   plan: "10 j : Tōkyō + Kyōto + Naoshima." },
  MA: { meteo: "25°C secs, derniers bons jours avant l'été.",           budget: "€ — riad confortable, change avantageux.",            safety: "Risque modéré. Hommes seuls : médina ok.",   plan: "7-10 j : Marrakech + Atlas + désert." },
  GR: { meteo: "24°C, ciel cristallin, mer encore fraîche.",            budget: "€€ — Cyclades en mai = haute saison naissante.",      safety: "Risque faible.",                              plan: "10 j : Athènes + 2 îles + Crète." },
  IS: { meteo: "13°C, lumière infinie en juillet.",                     budget: "€€€ — Tout cher, location de voiture indispensable.", safety: "Risque très faible.",                         plan: "10 j : Route 1 complète, glaciers." },
  TH: { meteo: "30°C secs en janvier, fin de la saison sèche.",         budget: "€ — vol cher, sur place abordable.",                  safety: "Risque faible.",                              plan: "14 j : Bangkok + Chiang Mai + 1 île." },
};

export function Comparer({ appState, setAppState, addTrip }: PageProps) {
  const monthIdx = appState.monthIdx ?? 4;
  const picks = appState.comparePicks.length ? appState.comparePicks : ['PT', 'JP', 'MA'];
  const cs = picks.map(iso => countryByIso(iso)).filter(Boolean) as Country[];
  const winnerIdx = cs.length ? cs.reduce((bi, c, i) => c.scores[monthIdx] > cs[bi].scores[monthIdx] ? i : bi, 0) : -1;

  const remove = (iso: string) =>
    setAppState(s => ({ ...s, comparePicks: s.comparePicks.filter(x => x !== iso) }));

  return (
    <>
      <section className="page-head-cmp">
        <div className="head-l">
          <div className="t-eyebrow">Comparaison · {cs.length}/3</div>
          <h1 className="page-h">
            Trois pays, <i>une seule fenêtre</i><br/>en{' '}
            <span className="month-pick-inline">{monthsFull[monthIdx].toLowerCase()}</span>.
          </h1>
        </div>
        {cs.length > 0 && winnerIdx >= 0 && (
          <div className="verdict">
            <span className="verdict-glyph">✦</span>
            <p className="verdict-txt">
              <b>{cs[winnerIdx].name}</b> sort en tête ce mois-ci avec un score de{' '}
              <b style={{ color: 'var(--tt-emerald)' }}>{cs[winnerIdx].scores[monthIdx]}</b>.
              {cs[winnerIdx].budget <= 2 ? ' Climat clément + budget contenu.' : ' Climat clément, expérience premium.'}
            </p>
          </div>
        )}
      </section>

      <div className="cmp">
        {/* HEADER ROW */}
        <div className="row-lab" style={{ padding: 0, border: 'none' }}/>
        {cs.map(c => (
          <div key={c.iso} className="hcell">
            <div className="cmp-photo" style={{ background: photoGrad(c.iso) }}>
              <button className="cmp-remove" onClick={() => remove(c.iso)} aria-label={`Retirer ${c.name}`}><IconClose/></button>
              <span className="cmp-iso">{c.iso}</span>
              <div>
                <h3 className="cmp-name"><Link to={`/pays/${c.iso}`} style={{ color: 'inherit', textDecoration: 'none' }}>{c.name}</Link></h3>
                <div className="cmp-city">{c.city}</div>
              </div>
            </div>
          </div>
        ))}
        {cs.length < 3 && (
          <Link className="add-col" to="/">
            <span className="add-col-gly">+</span>
            <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--tt-ink)' }}>Ajouter</span>
            <span style={{ fontSize: 12, color: 'var(--tt-ink-muted)' }}>Choisir un pays sur la carte</span>
          </Link>
        )}

        {/* SCORE */}
        <div className="row-lab">Score climatique</div>
        {cs.map((c, i) => {
          const s = c.scores[monthIdx];
          return (
            <div key={c.iso} className={"cell " + (i === winnerIdx ? 'winner' : '')}>
              <span className={"cmp-score " + scoreClass(s)} style={{ color: scoreHex(s) }}>{s}<sup>/100</sup></span>
              <div className="cmp-verdict-mini">
                <b>{scoreLabel(s)}</b>
                {i === winnerIdx && <span style={{ color: 'var(--tt-emerald)', fontFamily: 'var(--f-mono)', fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', marginLeft: 6 }}>· vainqueur</span>}
              </div>
            </div>
          );
        })}
        {cs.length < 3 && <div className="cell" style={{ borderLeft: '1px dashed var(--tt-rule-strong)', background: 'transparent' }}/>}

        {/* MONTHLY BARS */}
        <div className="row-lab">Saison · 12 mois</div>
        {cs.map(c => (
          <div key={c.iso} className="cell">
            <div className="cmp-bars">
              <MiniBars scores={c.scores} monthIdx={monthIdx} width={300}/>
              <div className="cmp-bars-axis">
                {months.map((m, i) => <span key={m} style={{ color: i === monthIdx ? 'var(--tt-terra)' : undefined }}>{m[0]}</span>)}
              </div>
            </div>
          </div>
        ))}
        {cs.length < 3 && <div className="cell" style={{ borderLeft: '1px dashed var(--tt-rule-strong)', background: 'transparent' }}/>}

        {/* TEMPÉRATURE */}
        <div className="row-lab">Température</div>
        {cs.map(c => (
          <div key={c.iso} className="cell">
            <span className="cmp-metric">{c.tempLo}–{c.tempHi}<span className="u">°C</span></span>
            <div className="cmp-metric-sub">Amplitude : {c.tempHi - c.tempLo}°C</div>
          </div>
        ))}
        {cs.length < 3 && <div className="cell" style={{ borderLeft: '1px dashed var(--tt-rule-strong)', background: 'transparent' }}/>}

        {/* PLUIE */}
        <div className="row-lab">Pluie</div>
        {cs.map(c => (
          <div key={c.iso} className="cell">
            <span className="cmp-metric">{c.rainDays}<span className="u">j/mois</span></span>
            <div className="cmp-metric-sub">{c.rainDays <= 3 ? "Saison sèche" : c.rainDays <= 6 ? "Quelques averses" : "Saison humide"}</div>
          </div>
        ))}
        {cs.length < 3 && <div className="cell" style={{ borderLeft: '1px dashed var(--tt-rule-strong)', background: 'transparent' }}/>}

        {/* BUDGET */}
        <div className="row-lab">Budget</div>
        {cs.map(c => (
          <div key={c.iso} className="cell">
            <span className="cmp-metric">{budgetSym(c.budget)}<span className="u">/jour</span></span>
            <div className="cmp-metric-sub">Environ {budgetEst(c.budget)}</div>
          </div>
        ))}
        {cs.length < 3 && <div className="cell" style={{ borderLeft: '1px dashed var(--tt-rule-strong)', background: 'transparent' }}/>}

        {/* TAGS */}
        <div className="row-lab">Profils</div>
        {cs.map(c => (
          <div key={c.iso} className="cell">
            <div className="cmp-tags">
              {c.tags.map(t => <span key={t} className="chip">{tagLabel(t)}</span>)}
            </div>
          </div>
        ))}
        {cs.length < 3 && <div className="cell" style={{ borderLeft: '1px dashed var(--tt-rule-strong)', background: 'transparent' }}/>}

        {/* HIGHLIGHTS */}
        <div className="row-lab">À voir</div>
        {cs.map(c => (
          <div key={c.iso} className="cell">
            <p className="cmp-hl">« {c.hi} »</p>
          </div>
        ))}
        {cs.length < 3 && <div className="cell" style={{ borderLeft: '1px dashed var(--tt-rule-strong)', background: 'transparent' }}/>}

        {/* AGENTS */}
        <div className="row-lab">Voix des agents</div>
        {cs.map(c => {
          const a = AGENT_LINES[c.iso];
          if (!a) return <div key={c.iso} className="cell" style={{ color: 'var(--tt-ink-mute2)', fontSize: 12 }}>Analyse en cours…</div>;
          return (
            <div key={c.iso} className="cell">
              <div className="agent-row">
                <div className="agent-line"><span className="agent-dot" style={{ background: '#22b07a' }}/><span><b style={{ color: 'var(--tt-ink)' }}>Météo</b> · {a.meteo}</span></div>
                <div className="agent-line"><span className="agent-dot" style={{ background: '#e7b54b' }}/><span><b style={{ color: 'var(--tt-ink)' }}>Budget</b> · {a.budget}</span></div>
                <div className="agent-line"><span className="agent-dot" style={{ background: '#d97757' }}/><span><b style={{ color: 'var(--tt-ink)' }}>Sécurité</b> · {a.safety}</span></div>
                <div className="agent-line"><span className="agent-dot" style={{ background: '#8ab4ff' }}/><span><b style={{ color: 'var(--tt-ink)' }}>Planning</b> · {a.plan}</span></div>
              </div>
            </div>
          );
        })}
        {cs.length < 3 && <div className="cell" style={{ borderLeft: '1px dashed var(--tt-rule-strong)', background: 'transparent' }}/>}

        {/* CTA */}
        <div className="row-lab"/>
        {cs.map(c => (
          <div key={c.iso} className="cell" style={{ borderBottom: 'none' }}>
            <div className="cmp-cta-row">
              <button className="btn btn-primary" onClick={() => addTrip(c.iso, monthIdx)}><IconBookmark size={14}/> Enregistrer</button>
              <Link to="/" className="btn btn-ghost">Ouvrir <IconArrow/></Link>
            </div>
          </div>
        ))}
        {cs.length < 3 && <div className="cell" style={{ borderLeft: '1px dashed var(--tt-rule-strong)', background: 'transparent', borderBottom: 'none' }}/>}
      </div>
    </>
  );
}
