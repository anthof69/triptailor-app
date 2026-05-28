import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { IconArrow, IconBookmark, IconCompare, IconMap } from '../components/icons';
import { ScoreRing, MiniBars, ScoreWhy } from '../components/atoms';
import { MonthPicker } from '../components/MonthPicker';
import { agents as AGENTS, countryByIso, months } from '../data/countries';
import { budgetEst, budgetSym, photoGrad, scoreHex, scoreLabel, tagLabel } from '../lib/utils';
import { AGENT_MSGS, askClaude } from '../lib/agents';
import type { PageProps } from '../App';

export function Pays({ appState, setAppState, addTrip, removeTrip }: PageProps) {
  const { iso = '' } = useParams();
  const navigate = useNavigate();
  const country = countryByIso(iso);

  const [monthIdx, setMonthIdx] = useState(appState.monthIdx ?? 4);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setMonthIdx(appState.monthIdx ?? 4); }, [appState.monthIdx]);
  useEffect(() => { setSynthesis(null); }, [iso, monthIdx]);
  useEffect(() => { window.scrollTo(0, 0); }, [iso]);

  if (!country) {
    return (
      <div className="pays-404">
        <div style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 64, color: 'var(--tt-terra)', lineHeight: 1 }}>?</div>
        <h1 className="empty-h">Destination introuvable.</h1>
        <p className="empty-p">Ce pays n'existe pas (encore) dans notre atlas.</p>
        <Link className="btn btn-primary" to="/">Ouvrir la carte</Link>
      </div>
    );
  }

  const score = country.scores[monthIdx];
  const saved = appState.saved.includes(country.iso);
  const inCompare = appState.comparePicks.includes(country.iso);

  const onShare = async () => {
    const url = `${window.location.origin}/pays/${country.iso}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { /* clipboard blocked — ignore */ }
  };
  const goCompare = () => {
    setAppState(s => ({ ...s, comparePicks: Array.from(new Set([...s.comparePicks, country.iso])).slice(0, 3) }));
    navigate('/comparer');
  };
  const ask = async () => {
    setPending(true);
    setSynthesis(await askClaude(country, monthIdx));
    setPending(false);
  };

  return (
    <div className="pays">
      {/* HERO */}
      <header className="pays-hero" style={{ background: photoGrad(country.iso) }}>
        <div className="pays-hero-top">
          <Link to="/" className="pays-back" aria-label="Retour à la carte"><IconArrow dir="left"/> Carte</Link>
          <span className="pays-hero-iso">{country.iso}</span>
        </div>
        <div className="pays-hero-foot">
          <div className="t-eyebrow" style={{ color: 'rgba(245,237,224,0.82)' }}>{country.tags.map(tagLabel).join(' · ')}</div>
          <h1 className="pays-name">{country.name}</h1>
          <div className="pays-city">{country.city}</div>
        </div>
      </header>

      {/* BODY */}
      <div className="pays-body">
        <div className="pays-main">
          <div className="pays-score-row">
            <ScoreRing value={score} size={132} stroke={9}/>
            <div>
              <div className="t-eyebrow">Score climatique</div>
              <div className="pays-score-headline" style={{ color: scoreHex(score) }}>{scoreLabel(score)}</div>
              <div className="pays-score-sub">
                en <MonthPicker monthIdx={monthIdx} setMonthIdx={setMonthIdx}/>
              </div>
            </div>
          </div>

          <p className="pays-hl"><i>{country.hi}</i></p>

          <ScoreWhy country={country} monthIdx={monthIdx}/>

          <div className="pays-bars">
            <div className="cp-bars-head">
              <span className="t-eyebrow">L'année entière</span>
              <span className="t-mono">{scoreHex(score).toUpperCase()}</span>
            </div>
            <MiniBars scores={country.scores} monthIdx={monthIdx} width={520} height={64}/>
            <div className="cp-bars-axis">
              {months.map((m, i) => <span key={m} className={i === monthIdx ? 'is-on' : ''}>{m[0]}</span>)}
            </div>
          </div>

          <div className="pays-stats">
            <div className="cp-stat"><div className="t-eyebrow">Température</div><div className="cp-stat-val">{country.tempLo}–{country.tempHi}<span className="cp-stat-u">°C</span></div></div>
            <div className="cp-stat"><div className="t-eyebrow">Pluie</div><div className="cp-stat-val">{country.rainDays}<span className="cp-stat-u">j/mois</span></div></div>
            <div className="cp-stat"><div className="t-eyebrow">Budget</div><div className="cp-stat-val">{budgetSym(country.budget)}<span className="cp-stat-u">≈ {budgetEst(country.budget)}</span></div></div>
          </div>

          {/* AGENTS */}
          <section className="pays-agents">
            <div className="t-eyebrow">Les quatre agents</div>
            <div className="pays-agent-list">
              {AGENTS.map(a => (
                <div key={a.id} className="pays-agent">
                  <span className="pays-agent-dot" style={{ background: a.color }}>{a.icon}</span>
                  <div>
                    <div className="pays-agent-name">{a.name}</div>
                    <p className="pays-agent-txt">{AGENT_MSGS[a.id](country, monthIdx)}</p>
                  </div>
                </div>
              ))}
            </div>
            {synthesis ? (
              <div className="pays-synth">
                <div className="pays-agent-name" style={{ color: 'var(--tt-terra-soft)' }}>✦ Synthèse IA</div>
                <p className="pays-agent-txt" style={{ marginTop: 4 }}>{synthesis}</p>
              </div>
            ) : (
              <button className="btn btn-primary btn-lg" style={{ justifyContent: 'center', width: '100%' }} disabled={pending} onClick={ask}>
                <span style={{ fontFamily: 'var(--f-serif)', fontStyle: 'italic', fontSize: 18 }}>✦</span>
                {pending ? "L'IA réfléchit…" : 'Réponse IA approfondie'}
              </button>
            )}
          </section>
        </div>

        {/* STICKY ACTIONS */}
        <aside className="pays-actions">
          <button className="btn btn-primary" onClick={() => (saved ? removeTrip(country.iso) : addTrip(country.iso, monthIdx))}>
            <IconBookmark size={14} filled={saved}/> {saved ? 'Enregistré ✓' : 'Ajouter à mes voyages'}
          </button>
          <button className="btn btn-ghost" onClick={goCompare}>
            <IconCompare size={14}/> {inCompare ? 'Dans le comparateur' : 'Comparer'}
          </button>
          <Link className="btn btn-ghost" to={`/?pays=${country.iso}&mois=${monthIdx}`}>
            <IconMap size={14}/> Voir sur la carte
          </Link>
          <button className="btn btn-ghost" onClick={onShare}>
            {copied ? 'Lien copié ✓' : 'Partager'}
          </button>
        </aside>
      </div>
    </div>
  );
}
