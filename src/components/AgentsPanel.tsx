import { useEffect, useState } from 'react';
import { IconClose } from './icons';
import { agents as AGENTS, monthsFull, type Country } from '../data/countries';
import { AGENT_MSGS, askClaude } from '../lib/agents';

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

function relTime(t: number, now: number): string {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 5) return "à l'instant";
  if (s < 60) return `il y a ${s}s`;
  const m = Math.round(s / 60);
  return `il y a ${m} min`;
}

export function AgentsPanel({ country, monthIdx, open, onClose }: Props) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [pending, setPending] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Tick once a second so relative timestamps stay truthful.
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

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
    const text = await askClaude(country, monthIdx);
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
              <span className="t-mono ap-time">{relTime(msg.t, now)}</span>
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
