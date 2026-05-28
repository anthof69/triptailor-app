/* Shared agent logic — used by both the slide-in AgentsPanel (Explorer)
 * and the full detail page (Pays). */

import { monthsFull, type Country } from '../data/countries';
import { budgetEst, budgetSym } from './utils';

export const AGENT_MSGS: Record<string, (c: Country, m: number) => string> = {
  meteo: (c, m) =>
    `${c.tempLo}–${c.tempHi}°C, ${c.rainDays} j de pluie en moyenne. La fenêtre `
    + `${monthsFull[m].toLowerCase()} est ${c.scores[m] >= 80 ? 'particulièrement clémente' : 'à arbitrer selon vos priorités'}.`,
  budget: (c) =>
    `${budgetSym(c.budget)} par jour — vol compris, comptez environ ${budgetEst(c.budget)}/jour pour un voyageur seul confort moyen.`,
  safety: (c) => {
    const low = c.cont === 'eu' || ['JP', 'CA', 'AU', 'NZ', 'SG', 'IS', 'NO', 'SE'].includes(c.iso);
    return `Destination ${low ? 'à risque faible' : 'à risque modéré'}. Vigilance habituelle dans les zones touristiques et transports.`;
  },
  plan: (c) =>
    `Suggestion : 7–10 jours pour un premier voyage, en combinant ${c.hi.split(',')[0].toLowerCase()} et une 2ᵉ étape proche.`,
};

/** Ask the serverless Claude endpoint for a synthesis; falls back to a local
 *  deterministic summary if the endpoint is unreachable. */
export async function askClaude(country: Country, monthIdx: number): Promise<string> {
  const prompt = `Donne ton verdict pour ${country.name} (${country.city}) en ${monthsFull[monthIdx].toLowerCase()}, sachant : score climat ${country.scores[monthIdx]}/100, ${country.tempLo}-${country.tempHi}°C, budget ${budgetSym(country.budget)}, à voir : ${country.hi}.`;
  try {
    const r = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (r.ok) {
      const j = (await r.json()) as { text?: string };
      if (j.text) return j.text;
    }
  } catch (e) {
    console.warn('[askClaude] /api/claude unreachable', e);
  }
  const s = country.scores[monthIdx];
  return `Pour ${country.name} en ${monthsFull[monthIdx].toLowerCase()} : la fenêtre climatique est ${s >= 80 ? 'optimale' : 'acceptable'}, le budget cohérent, et la sécurité standard. Recommandation : ${s >= 75 ? 'partez sans hésiter — combinez ' + country.hi.split(',')[0] : 'envisagez une fenêtre alternative'}.`;
}
