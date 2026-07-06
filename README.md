# Boss Playbook — Salary Site

Programmatic SEO salary site: 2,600+ static pages built with Astro, deployed to
Cloudflare Pages at https://salary-site-49i.pages.dev.

Two content systems share one framework:

1. **Legacy "SalaryInsights" pages** — 20 general occupations × 107 cities
   (`/salary/software-developer/new-york-ny`, …), the original site.
2. **Boss Playbook executive pages** — 10 executive titles × 50 target metros
   (`/salary/general-manager/san-francisco-ca`, …) plus 10 long-form pillar
   guides (`/guides/…`), aimed at GMs, VPs, and senior tech executives.

## Architecture

```
scripts/
  cities.json                 ← single source of truth for cities + costMultiplier
  data/bls-oews-2025.json     ← BLS OEWS May 2025 national snapshot (10 SOC codes)
src/
  data/
    exec-roles.mjs            ← 10 exec roles: wage bands, skills, negotiation material
    metros.mjs                ← 50 metro economic profiles (industries, employers, character)
    guides.mjs                ← registry of the 10 pillar pages
  lib/narrative.mjs           ← deterministic seeded narrative composer (unique copy per page)
  layouts/
    Layout.astro              ← global chrome, CSS, SEO meta, JSON-LD injection
    GuideLayout.astro         ← long-form pillar page shell (Article JSON-LD, CTA)
  components/ExecSalaryPage.astro ← exec page template (6 mission sections)
  pages/
    index.astro               ← homepage (legacy categories + exec hub)
    newsletter.astro          ← CTA target
    salary/[occupation]/[location].astro ← THE page factory (legacy + exec branches)
    guides/*.astro            ← 10 pillar pages (1,500–2,000 words each)
    sitemap.xml.ts            ← build-time sitemap over every page
    internal-links.json.ts    ← build-time link graph + <2-link flagging
public/
  js/salary-hydrate.js        ← client-side refresh from the live salary API
  robots.txt, _redirects
```

### How pages are generated

`src/pages/salary/[occupation]/[location].astro#getStaticPaths` emits both page
families:

- **Legacy**: hardcoded occupation list × `scripts/cities.json`. Wages =
  national figures × city `costMultiplier`, rounded to $1,000.
- **Exec**: `execRoles` × `metros`. Same multiplier model, but national bands
  are anchored to BLS OEWS May 2025 (see *Data model* below), and the template
  branches to `ExecSalaryPage.astro`.

Exec page copy is composed at build time by `src/lib/narrative.mjs`: every
sentence-level choice (openers, factor ordering, metro commentary) is selected
by a deterministic hash of `(role, metro)`, so each of the 500 pages reads
differently while builds stay reproducible.

### Data model and provenance

| Source | What it provides | Where |
| --- | --- | --- |
| Railway salary API (`web-production-d6bdb.up.railway.app`) | Live wages for the 20 legacy occupations × 15 metros | client-side hydration only |
| BLS OEWS May 2025 (public API, no key) | National median/p10/p90/employment for 10 SOC codes | `scripts/data/bls-oews-2025.json` |
| O*NET SOC profiles | Skills + related titles per role | curated into `src/data/exec-roles.mjs` |
| `scripts/cities.json` | City metadata + costMultiplier | build-time localization |

**Exec wage model**: each exec title anchors to its closest SOC (documented per
role in `exec-roles.mjs` with a `titlePremium` and `premiumNote`) because titles
like "VP of Engineering" are narrower than their SOC. Per-metro figure =
national band × metro costMultiplier.

### Decisions & blockers (made autonomously, per mission rules)

- **The live API has no exec-title data** (verified: 20 legacy occupations, 15
  locations only). Exec pages therefore anchor to BLS; the hydration script
  (`public/js/salary-hydrate.js`) refreshes numbers on page load *where the API
  has coverage* and fails silently elsewhere, so static figures remain
  authoritative. If exec titles are ever added to the API, hydration picks them
  up automatically — no rebuild needed.
- **O*NET Web Services blocked**: the API requires a registered key and
  registration needs human email verification. Workaround: skills/related-role
  data curated from O*NET's published SOC profiles, labeled as curated in
  `exec-roles.mjs`.
- **"Software Engineering Manager" has no exact SOC**; 11-9041 (Architectural &
  Engineering Managers) is used as anchor, cross-checked against 15-1252.
- **Newsletter signup** (`/newsletter`) uses a placeholder mailto form — no
  external email provider was invented. Wire up a real ESP (Beehiiv/ConvertKit)
  by replacing the form `action`.
- **Removed the `/* /index.html 200` catch-all** in `public/_redirects`: it made
  every unknown URL a soft-404 serving the homepage, which is harmful for a
  programmatic SEO site.
- **Canonical domain** set to `salary-site-49i.pages.dev` in `astro.config.mjs`
  (was pointing at a non-existent domain, breaking every canonical URL).
- Six metros from the mission brief were missing from `cities.json` (Miami,
  Detroit, Cleveland, Hartford, Providence, Buffalo) and were added, which also
  grew the legacy page set.

## Commands

```bash
npm install
npm run dev       # local dev server
npm run build     # static build to dist/ (~2,660 pages)
npm run preview   # serve dist/ locally
```

## How to add pages

- **New metro for exec pages**: add the city to `scripts/cities.json` (slug,
  names, costMultiplier), then add a profile entry to `src/data/metros.mjs`
  (industries, employers, econ, talent). 10 new pages appear on next build;
  sitemap and link map update automatically.
- **New exec role**: add an entry to `src/data/exec-roles.mjs` (follow an
  existing entry: SOC anchor, wages, 5 skills, 3 related slugs, 4 movesIt, 4
  negotiate items, faqAngle). 50 new pages on next build.
- **New legacy occupation**: add to the occupation list in
  `src/pages/salary/[occupation]/[location].astro`, the `legacyOccupations`
  arrays in `sitemap.xml.ts` and `internal-links.json.ts`, and the homepage
  card list in `index.astro` (these lists are duplicated — keep in sync).
- **New pillar guide**: create `src/pages/guides/<slug>.astro` using
  `GuideLayout`, and register the slug in `src/data/guides.mjs` (drives
  sitemap, homepage, link map).

## How to update data sources

- **BLS refresh** (annual, ~April): re-run the OEWS fetch for the 10 SOC codes
  (series ID pattern `OEUN0000000000000<soc6><datatype>`, datatypes 01/11/13/15)
  against `https://api.bls.gov/publicAPI/v2/timeseries/data/`, update
  `scripts/data/bls-oews-2025.json` and the `bls` blocks + `wages` bands in
  `exec-roles.mjs`.
- **Live API**: hydration reads it at page load; no build step depends on it.
  Endpoints: `/salary?occupation=&location=`, `/occupations`, `/locations`,
  `/compare`, `/docs`.
- **Cost multipliers**: edit `scripts/cities.json`; both page families and the
  cost-of-living guide tables inherit on rebuild.

## Deployment

Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`) runs `npm ci`,
`npm run build`, and deploys `dist/` to the Cloudflare Pages project
`salary-site` via `cloudflare/pages-action@v1`. Requires repo secrets
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

Notes: do not add a `wrangler.toml` and do not enable the `@astrojs/cloudflare`
adapter — both previously broke Pages deploys; the site is pure static output.

## SEO surface

- `sitemap.xml` — every page (salary pages, guides, home, newsletter),
  regenerated each build.
- `robots.txt` — allows all, points at the sitemap.
- `internal-links.json` — full internal link graph with outbound/inbound counts
  per page; pages under 2 links are listed in `flagged` (empty by
  construction — exec pages link 2 same-city roles + prev/next metro
  deterministically).
- Every salary page: FAQPage + BreadcrumbList JSON-LD, canonical URL, OG tags.
  Exec pages follow the Boss Playbook spec (title pattern, H1 pattern, 3 FAQ
  Q&As). Guides: Article JSON-LD.
