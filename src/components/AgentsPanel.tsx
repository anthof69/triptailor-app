import { useEffect, useState } from 'react';
import { IconClose } from './icons';
import { agents as AGENTS, monthsFull, type Country } from '../data/countries';
import { budgetEst, budgetSym } from '../lib/utils';

const AGENT_MSGS: Record<string, (c: Country, m: number) => string> = {
  meteo: (c, m) =>
    `${c.tempLo}–${c.tempHi}°C, ${c.rainDays} j de pluie en moyenne. La fenêtre `
    + `${monthsFull[m].toLowerCase()} est ${c.scores[m] >= 80 ? 'particulièrement clémente' : 'à arbitrer selon vos priorités'}.`,
  budget: (c) =>
    `${budgetSym(c.budget)} par jour — vol compris, comptez environ ${budgetEst(c.budget)}/jour pour un voyageur seul confort moyen.`,
  safety: (c) => {
    const low = c.cont === 'eu' || ['JP','CA','AU','NZ','SG','IS','NO','SE'].includes(c.iso);
    return `Destination ${low ? 'à risque faible' : 'à risque modéré'}. Vigilance habituelle dans les zones touristiques et transports.`;
  },
  plan: (c) =>
    `Suggestion : 7–10 jours pour un premier voyage, en combinant ${c.hi.split(',')[0].toLowerCase()} et une 2ᵉ étape proche.`,
};

interface Props {
  country: Country | null;
  monthIdx: number;
  open: boolean;
  onClose: () => void;
}

interface FeedItem {
  agent: { id: string; name: string; color: string; icon: string };
  text: string;
  t: number;
  big?: boolean;
}

export function AgentsPanel({ country, monthIdx, open, onClose }: Props) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!country) { setFeed([]); return; }
    setFeed(AGENTS.map(a => ({
      agent: a, text: AGENT_MSGS[a.id](country, monthIdx), t: Date.now(),
    })));
  }, [country, monthIdx]);

  if (!open) return null;

  const ask = async () => {
    if (!country) return;
    setPending(true);
    const prompt = `Donne ton verdict pour ${country.name} (${country.city}) en ${monthsFull[monthIdx].toLowerCase()}, sachant : score climat ${country.scores[monthIdx]}/100, ${country.tempLo}-${country.tempHi}°C, budget ${budgetSym(country.budget)}, à voir : ${country.hi}.`;
    let text: string | undefined;
    try {
      const r = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (r.ok) {
        const j = (await r.json()) as { text?: string };
        text = j.text;
      }
    } catch (e) {
      console.warn('[AgentsPanel] /api/claude unreachable', e);
    }
    if (!text) {
      text = `Pour ${country.name} en ${monthsFull[monthIdx].toLowerCase()} : la fenêtre climatique est ${country.scores[monthIdx] >= 80 ? 'optimale' : 'acceptable'}, le budget cohérent, et la sécurité standard. Recommandation : ${country.scores[monthIdx] >= 75 ? 'partez sans hésiter — combinez ' + country.hi.split(',')[0] : 'envisagez une fenêtre alternative'}.`;
    }
    setFeed(f => [...f, {
      agent: { id: 'claude', name: 'Synthèse', color: '#d97757', icon: '✦' },
      text, t: Date.now(), big: true,
    }]);
    setPending(false);
  };

  return (
    <aside className="agents-panel" aria-label="Agents IA">
      <header className="ap-head">
        <div>
          <div className="t-eyebrow">Agents IA</div>
          <h3 className="ap-title">{country ? country.name : "En attente d'une destination"}</h3>
        </div>
        <button className="cp-close" onClick={onClose} aria-label="Fermer"><IconClose size={18}/></button>
      </header>

      <div className="ap-tabs">
        {AGENTS.map(a => (
          <span key={a.id} className="ap-tab" style={{ ['--c' as any]: a.color }}>
            <span className="ap-tab-dot"/>{a.name}
          </span>
        ))}
      </div>

      <div className="ap-feed">
        {!country && (
          <div className="ap-empty">
            <div className="t-serif-it" style={{ fontSize: 24, color: 'var(--tt-ink-soft)' }}>« Cliquez un pays sur la carte… »</div>
            <p className="ap-empty-p">…les quatre agents s'activeront automatiquement pour analyser climat, budget, sécurité et planning.</p>
          </div>
        )}
        {feed.map((msg, i) => (
          <article key={i} className={"ap-msg " + (msg.big ? 'is-big' : '')}>
            <div className="ap-msg-head">
              <span className="ap-avatar" style={{ background: msg.agent.color }}>{msg.agent.icon}</span>
              <span className="ap-name">{msg.agent.name}</span>
              <span className="t-mono ap-time">il y a {i + 1}s</span>
            </div>
            <p className="ap-msg-txt">{msg.text}</p>
          </article>
        ))}
        {pending && (
          <article className="ap-msg is-loading">
            <div className="ap-msg-head">
              <span className="ap-avatar" style={{ background: '#d97757' }}>✦</span>
              <span className="ap-name">Synthèse</span>
              <span className="t-mono ap-time">…</span>
            </div>
            <div className="ap-loading"><span/><span/><span/></div>
          </article>
        )}
      </div>

      <div className="ap-foot">
        <button className="btn btn-primary btn-lg ap-ask" disabled={!country || pending} onClick={ask}>
          <span style={{ fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 18 }}>✦</span>
          {pending ? "L'IA réfléchit…" : "Réponse IA approfondie"}
        </button>
      </div>
    </aside>
  );
}
