# TripTailor — Magic Hour redesign

Planificateur de voyage français. Carte mondiale interactive notée sur 12 mois,
quiz d'inspiration, voyages enregistrés, comparaison côte à côte, agents IA.

Stack : **Vite 5 + React 18 + TypeScript + React Router 6 + d3-geo + Supabase + Claude API**.

## Local dev

```sh
npm install
cp .env.example .env.local   # remplir si vous avez les credentials Supabase
npm run dev                  # → http://localhost:5173
```

L'app fonctionne **sans** Supabase ni Claude API : auth/voyages tombent sur
`localStorage`, les agents IA tombent sur une synthèse locale.

## Déploiement Vercel

```sh
# 1) Connecter (une fois)
npx vercel login

# 2) Lier le projet
npx vercel link

# 3) Variables d'environnement
npx vercel env add VITE_SUPABASE_URL      production
npx vercel env add VITE_SUPABASE_ANON_KEY production
npx vercel env add ANTHROPIC_API_KEY      production

# 4) Déployer
npx vercel --prod
```

`vercel.json` est déjà configuré : SPA rewrite, headers cache, timeout 30s sur
`api/claude.ts`.

## Données climat

Le fichier `src/data/countries.ts` contient une baseline curée à la main (60
destinations × 12 mois). Pour rafraîchir via **Open-Meteo** (gratuit, pas de
clé API) :

```sh
npx tsx scripts/fetch-climate.ts   # → écrit src/data/climate.json
```

`climate.json` est mergé au runtime par `countries.ts` — pas besoin de toucher
au code.

## Supabase

Schéma dans `supabase/migrations/0001_init.sql`. Appliquer via le SQL editor ou
`supabase db push`. RLS activé : chaque utilisateur ne voit que ses voyages.

## Structure

```
src/
├── App.tsx · main.tsx              ← routeur + hooks globaux
├── data/countries.ts · climate.json ← métadonnées + scores climat
├── lib/
│   ├── utils.ts                    ← scoring, formatters
│   ├── supabase.ts                 ← client (env-driven)
│   ├── useAuth.ts                  ← Supabase ou localStorage
│   └── useSavedTrips.ts            ← Supabase ou localStorage
├── styles/                          ← tokens.css + app.css (Magic Hour)
├── components/                      ← icons, atoms, Header, WorldMap,
│                                      ClimatePanel, AgentsPanel, AuthModal
└── pages/                           ← Explorer, Inspire, Voyages, Comparer
api/
└── claude.ts                       ← Vercel serverless → Claude Haiku 4.5
scripts/
└── fetch-climate.ts                ← build-time Open-Meteo fetcher
supabase/migrations/
└── 0001_init.sql                   ← saved_trips + RLS
```
