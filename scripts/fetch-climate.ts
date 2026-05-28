/* scripts/fetch-climate.ts — Build-time climate data fetcher.
 *
 *   pnpm tsx scripts/fetch-climate.ts
 *   # → writes src/data/climate.json
 *
 * For each country in src/data/countries.ts, calls Open-Meteo Archive API
 * to get 30-year monthly averages, then computes a 0-100 "Climate Score"
 * per month. No API key needed; rate-limit is generous (~10k req/day).
 *
 * Re-run whenever you add a new country or want to refresh the baseline.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { countries } from '../src/data/countries';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'src', 'data', 'climate.json');

// We sample 5 recent years (much faster than 30) — climate-API would give
// a true climatology baseline but it requires `models=` selection and is
// noisier. Archive-api with the last 5y is a good pragmatic default.
const YEARS = [2019, 2020, 2021, 2022, 2023];

interface OpenMeteoDaily {
  daily: {
    time: string[];                  // ISO date "2023-01-01"
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    temperature_2m_mean: number[];
    precipitation_sum: number[];
  };
}

interface ClimateEntry {
  scores: number[];   // 12 monthly scores 0-100
  tempLo: number;
  tempHi: number;
  rainDays: number;
}
type ClimateMap = Record<string, ClimateEntry>;  // keyed by ISO-2

// Score formula: warm enough (not too hot), dry enough.
// 0–100, peaking at 20–26°C and < 4 rainy days/month.
function monthScore(meanTempC: number, rainyDays: number): number {
  // Temperature comfort: triangle peaking 20-26, gentle slopes 0 outside 5..35
  let temp = 0;
  if (meanTempC >= 20 && meanTempC <= 26) temp = 100;
  else if (meanTempC >= 5 && meanTempC < 20) temp = ((meanTempC - 5) / 15) * 100;
  else if (meanTempC > 26 && meanTempC <= 35) temp = ((35 - meanTempC) / 9) * 100;
  // Rain penalty: 0 days → +0, 12 days → -45
  const rainPenalty = Math.min(45, rainyDays * 3.75);
  const raw = Math.round(temp * 0.95 - rainPenalty + 15);
  return Math.max(0, Math.min(100, raw));
}

async function fetchCountry(iso: string, lat: number, lon: number): Promise<ClimateEntry | null> {
  const monthBuckets: { tMean: number[]; tMin: number[]; tMax: number[]; rain: number[] }[] =
    Array.from({ length: 12 }, () => ({ tMean: [], tMin: [], tMax: [], rain: [] }));

  for (const year of YEARS) {
    const url = new URL('https://archive-api.open-meteo.com/v1/archive');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('start_date', `${year}-01-01`);
    url.searchParams.set('end_date', `${year}-12-31`);
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum');
    url.searchParams.set('timezone', 'auto');

    let r: Response;
    try {
      r = await fetch(url);
    } catch (e) {
      console.error(`  ${iso} ${year}: fetch error`, (e as Error).message);
      return null;
    }
    if (!r.ok) {
      console.error(`  ${iso} ${year}: HTTP ${r.status}`);
      return null;
    }
    const data = (await r.json()) as OpenMeteoDaily;
    const { time, temperature_2m_mean, temperature_2m_max, temperature_2m_min, precipitation_sum } = data.daily;
    for (let i = 0; i < time.length; i++) {
      const m = Number(time[i].slice(5, 7)) - 1;
      if (Number.isFinite(temperature_2m_mean[i])) monthBuckets[m].tMean.push(temperature_2m_mean[i]);
      if (Number.isFinite(temperature_2m_min[i]))  monthBuckets[m].tMin.push(temperature_2m_min[i]);
      if (Number.isFinite(temperature_2m_max[i]))  monthBuckets[m].tMax.push(temperature_2m_max[i]);
      if (Number.isFinite(precipitation_sum[i]))   monthBuckets[m].rain.push(precipitation_sum[i]);
    }
  }

  const mean = (a: number[]) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

  // Annual aggregates (used for tempLo/Hi and average rain days/month)
  const allMin = monthBuckets.flatMap(b => b.tMin);
  const allMax = monthBuckets.flatMap(b => b.tMax);
  const tempLo = Math.round(mean(allMin));
  const tempHi = Math.round(mean(allMax));

  // Rainy days: count days with precipitation_sum >= 1mm
  const rainyDays = monthBuckets.map(b => b.rain.filter(p => p >= 1).length / YEARS.length);
  const rainDays = Math.round(rainyDays.reduce((a, b) => a + b, 0) / 12);

  const scores = monthBuckets.map((b, m) => monthScore(mean(b.tMean), rainyDays[m]));

  return { scores, tempLo, tempHi, rainDays };
}

async function main() {
  const out: ClimateMap = {};
  let done = 0;
  for (const c of countries) {
    process.stdout.write(`[${++done}/${countries.length}] ${c.iso} ${c.name.padEnd(22)} `);
    const entry = await fetchCountry(c.iso, c.lat, c.lon);
    if (entry) {
      out[c.iso] = entry;
      process.stdout.write(`✓ scores ${entry.scores.join(',')}\n`);
    } else {
      process.stdout.write('✗ skipped (will keep curated values)\n');
    }
    // Be polite to Open-Meteo — small delay between countries.
    await new Promise(r => setTimeout(r, 250));
  }

  await writeFile(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nWrote ${Object.keys(out).length} entries → ${OUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
