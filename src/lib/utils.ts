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
  KE: ['#ffd07e', '#b54e22', '#241008'],
  PE: ['#ffd29c', '#a8632e', '#1c0f08'],
  CL: ['#ffd29c', '#b54e22', '#241008'],
  HR: ['#cfe0e6', '#3a86a0', '#0c2030'],
  EG: ['#ffd07e', '#cf6042', '#260e0a'],
  TR: ['#ffd29c', '#c75a3a', '#2a0f08'],
  KR: ['#f9d5d5', '#c44b6a', '#2a0e1c'],
  TN: ['#ffd07e', '#cf6042', '#260e0a'],
  JO: ['#ffd07e', '#cf6042', '#260e0a'],
  AE: ['#ffd07e', '#cf6042', '#260e0a'],
  ZA: ['#ffd29c', '#a8632e', '#1c0f08'],
  AR: ['#ffd29c', '#a8632e', '#1c0f08'],
  IL: ['#ffd07e', '#cf6042', '#260e0a'],
  MY: ['#ffd99a', '#d97a32', '#241008'],
  PH: ['#ffd99a', '#d97a32', '#241008'],
};
export function photoGrad(iso: string) {
  const [a, b, c] = PHOTO_PALETTE[iso] || ['#d97757', '#a84e2f', '#0e0907'];
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
