/* site/src/lib/utils.ts
   Helpers used across components. */

import type { Country, Tag } from '../data/countries';
import { monthsFull } from '../data/countries';

export function scoreClass(s: number) {
  if (s >= 80) return 's-emerald';
  if (s >= 65) return 's-amber';
  if (s >= 50) return 's-orange';
  return 's-slate';
}
export function scoreHex(s: number) {
  if (s >= 80) return '#22b07a';
  if (s >= 65) return '#e7b54b';
  if (s >= 50) return '#e08543';
  return '#6b6055';
}
export function scoreLabel(s: number) {
  if (s >= 80) return 'Idéal';
  if (s >= 65) return 'Très bon';
  if (s >= 50) return 'Correct';
  return 'À éviter';
}

export function budgetSym(b: number) { return '€'.repeat(b); }
export function budgetLabel(b: number) {
  return b === 1 ? 'modeste' : b === 2 ? 'confort' : 'premium';
}
export function budgetEst(b: number) {
  return b === 1 ? '45–80 €' : b === 2 ? '90–160 €' : '180–320 €';
}

const TAG_LABELS: Record<Tag, string> = {
  plage: 'Plage', culture: 'Culture', aventure: 'Aventure',
  gastro: 'Gastronomie', ville: 'Ville', nature: 'Nature',
};
export function tagLabel(t: Tag | string) {
  return (TAG_LABELS as Record<string, string>)[t] || t;
}

// Per-ISO photographic gradient (replace with real photo URLs in prod).
// Hand-curated palettes for the "hero" destinations; everything else gets a
// deterministic unique gradient from hashPalette() — so no two cards look alike.
const PHOTO_PALETTE: Record<string, [string, string, string]> = {
  PT: ['#f6c073', '#c8612a', '#3c1a10'],
  JP: ['#f9d5d5', '#c44b6a', '#2a0e1c'],
  MA: ['#ffb27a', '#d8521f', '#2a0e07'],
  IS: ['#a2c8e0', '#3a6a7e', '#0d1820'],
  TH: ['#ffd99a', '#d97a32', '#241008'],
  GR: ['#dbe9f4', '#3a86a0', '#0c2030'],
  ES: ['#ffc06e', '#cf5a2f', '#36130b'],
  IT: ['#ffd29c', '#c75a3a', '#2a0f08'],
  NO: ['#cde2e8', '#42788e', '#0c1822'],
  BR: ['#ffd07e', '#cf6042', '#260e0a'],
  AU: ['#ffcb95', '#cf5b34', '#221008'],
  MX: ['#ffd07e', '#cf3d2c', '#2a0a0a'],
  VN: ['#ffe6a2', '#bf6038', '#250f08'],
  ID: ['#ffd29c', '#ad4a2a', '#1c0a06'],
  NZ: ['#c4e2c4', '#3f7e5a', '#0d1f15'],
  CR: ['#c4e8d2', '#3f9e5a', '#0d2015'],
  NP: ['#dbe4ec', '#5a7a96', '#0c1822'],
  PE: ['#ffd29c', '#a8632e', '#1c0f08'],
  HR: ['#cfe0e6', '#3a86a0', '#0c2030'],
  TR: ['#ffd29c', '#c75a3a', '#2a0f08'],
  KR: ['#f9d5d5', '#c44b6a', '#2a0e1c'],
};
// Deterministic warm-toned palette derived from the ISO code, so every country
// without a hand-curated palette still gets a distinct gradient (no twins).
function hashPalette(iso: string): [string, string, string] {
  let h = 0;
  for (let i = 0; i < iso.length; i++) h = (h * 31 + iso.charCodeAt(i)) >>> 0;
  const hue = h % 360;                 // full wheel, but…
  // …pull toward the Magic Hour warm/earth range (terracotta→amber→teal-green)
  const warmHue = [18, 28, 36, 44, 8, 158, 192][h % 7];
  const hi = `hsl(${warmHue}, ${62 + (h % 18)}%, ${64 + (hue % 10)}%)`;
  const mid = `hsl(${warmHue}, ${58 + (h % 16)}%, ${42 + (h % 8)}%)`;
  const lo = `hsl(${(warmHue + 8) % 360}, 45%, ${9 + (h % 6)}%)`;
  return [hi, mid, lo];
}

export function photoGrad(iso: string) {
  const [a, b, c] = PHOTO_PALETTE[iso] || hashPalette(iso);
  return `radial-gradient(ellipse at 30% 30%, ${a} 0%, transparent 45%), `
       + `radial-gradient(ellipse at 75% 60%, ${b} 0%, transparent 50%), `
       + `linear-gradient(180deg, ${b} 0%, ${c} 100%)`;
}

const TEASES: Record<string, string> = {
  PT: "Quartier d'Alfama au crépuscule, vinho verde en terrasse.",
  JP: "Cerisiers à Kyōto, gyozas dans un izakaya silencieux.",
  MA: "Médina au soleil doré, vent du Sahara au camp de base.",
  IS: "Geysers sous la lumière rasante, road-trip sur la route 1.",
  TH: "Long-tail boat entre Krabi et Phi Phi, currys verts à minuit.",
  GR: "Cyclades en lumière blanche, taverne sur le port à 22h.",
  ES: "Andalousie en orange, fériés andalous, gazpacho frais.",
  IT: "Toscane en fleur, négroni dans une enoteca à Florence.",
  NO: "Fjords du Sognefjord, soleil de minuit sur Lofoten.",
  CR: "Volcans actifs, plages désertes côté Caraïbes.",
  NP: "Vallée de Pokhara, premier matin face à l'Annapurna.",
  PE: "Brouillard d'altitude au Machu Picchu, ceviche à Lima.",
  NZ: "Fjordland en lumière douce, vins de Marlborough.",
  MX: "Cénotes du Yucatán, mole noir à Oaxaca.",
  MY: "Bornéo en pluie chaude, laksa au petit matin à Penang.",
};
export function teaseFor(c: Country, monthIdx: number) {
  return TEASES[c.iso] || `${c.city} en ${monthsFull[monthIdx].toLowerCase()}, comme une évidence.`;
}

// ── "Pourquoi ce score" — plain-language breakdown of the climate score ──
export type ScoreTone = 'good' | 'mid' | 'bad';
export interface ScoreFactor { label: string; detail: string; tone: ScoreTone }

export function scoreFactors(c: Country, m: number): ScoreFactor[] {
  const factors: ScoreFactor[] = [];

  // Température (jugée sur la max moyenne)
  const hi = c.tempHi;
  let tTone: ScoreTone, tDetail: string;
  if (hi >= 20 && hi <= 28) { tTone = 'good'; tDetail = `${c.tempLo}–${hi}°C, idéal`; }
  else if (hi >= 15 && hi < 20) { tTone = 'mid'; tDetail = `${c.tempLo}–${hi}°C, frais`; }
  else if (hi > 28 && hi <= 33) { tTone = 'mid'; tDetail = `${c.tempLo}–${hi}°C, chaud`; }
  else if (hi > 33) { tTone = 'bad'; tDetail = `${c.tempLo}–${hi}°C, très chaud`; }
  else { tTone = 'bad'; tDetail = `${c.tempLo}–${hi}°C, froid`; }
  factors.push({ label: 'Température', detail: tDetail, tone: tTone });

  // Pluie
  let rTone: ScoreTone, rDetail: string;
  if (c.rainDays <= 3) { rTone = 'good'; rDetail = `${c.rainDays} j/mois, sec`; }
  else if (c.rainDays <= 6) { rTone = 'mid'; rDetail = `${c.rainDays} j/mois, quelques averses`; }
  else { rTone = 'bad'; rDetail = `${c.rainDays} j/mois, humide`; }
  factors.push({ label: 'Pluie', detail: rDetail, tone: rTone });

  // Saison — ce mois est-il proche du pic annuel du pays ?
  const peak = Math.max(...c.scores);
  const gap = peak - c.scores[m];
  let sTone: ScoreTone, sDetail: string;
  if (gap <= 5) { sTone = 'good'; sDetail = 'pleine saison'; }
  else if (gap <= 18) { sTone = 'mid'; sDetail = 'épaule de saison'; }
  else { sTone = 'bad'; sDetail = 'hors saison'; }
  factors.push({ label: 'Saison', detail: sDetail, tone: sTone });

  return factors;
}

export function scoreFactorHex(tone: ScoreTone): string {
  return tone === 'good' ? '#22b07a' : tone === 'mid' ? '#e7b54b' : '#e08543';
}

/** One-sentence plain explanation of the month's score. */
export function scoreExplain(c: Country, m: number): string {
  const s = c.scores[m];
  const f = scoreFactors(c, m);
  const bits = f.map(x => x.detail.replace(/^\d.*?,\s*/, '')); // strip leading numbers for prose
  const verdict = s >= 80 ? 'une fenêtre idéale' : s >= 65 ? 'une très bonne période' : s >= 50 ? 'une période correcte' : 'une période à éviter';
  return `Note ${s}/100 — ${verdict} : ${bits.join(', ')}.`;
}
