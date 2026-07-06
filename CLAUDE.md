# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # no package-lock.json is committed; see deployment note below
npm run dev        # local dev server (astro dev)
npm run build      # static build to dist/
npm run preview    # serve the built dist/ locally
```

There are no tests or linters configured.

## Architecture

Astro 4 static site (`output: "static"` in `astro.config.mjs`). No client-side framework; all pages are fully static HTML generated at build time (~2,660 pages). `build.format: "file"` means routes emit as `dist/salary/software-developer/new-york-ny.html` (not `.../index.html` directories) — URL patterns and redirects must account for this.

**Read README.md first** — it documents the full architecture, data provenance, how to add pages, and the autonomous decisions already made. Key structure:

- `src/pages/salary/[occupation]/[location].astro` — the page factory. `getStaticPaths()` emits TWO page families: legacy (20 hardcoded occupations × `scripts/cities.json`, rendered inline) and Boss Playbook exec pages (10 roles from `src/data/exec-roles.mjs` × 50 metros from `src/data/metros.mjs`, rendered via `src/components/ExecSalaryPage.astro`). Wages = national band × city `costMultiplier`, rounded to $1,000.
- `src/lib/narrative.mjs` — deterministic seeded narrative composer; exec page copy varies per (role, metro) hash. Builds are reproducible.
- `src/layouts/Layout.astro` — global chrome, ALL global CSS, SEO meta, JSON-LD injection via `jsonLd` prop. `GuideLayout.astro` wraps the 10 pillar pages in `src/pages/guides/` (registered in `src/data/guides.mjs`).
- `src/pages/sitemap.xml.ts` and `src/pages/internal-links.json.ts` — build-time endpoints; they duplicate the occupation list and link logic, so keep them in sync when adding occupations.
- `scripts/cities.json` — single source of truth for cities/multipliers. `scripts/data/bls-oews-2025.json` — BLS OEWS national wage snapshot anchoring exec bands.
- `public/js/salary-hydrate.js` — client-side refresh from the live salary API (`web-production-d6bdb.up.railway.app`); covers legacy occupations × 15 metros only, fails silently elsewhere.

Lists that must be kept in sync manually when adding a legacy occupation: the dynamic route, `index.astro`, `sitemap.xml.ts`, `internal-links.json.ts`.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys `dist/` to Cloudflare Pages (project `salary-site`) via `cloudflare/pages-action@v1` on push to main. Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets. Live at salary-site-49i.pages.dev.

Gotchas learned from git history and current state:

- **Do not add a `wrangler.toml`** — it was deliberately removed (Cloudflare Pages with the git-based action doesn't need it and it broke deploys).
- **The `@astrojs/cloudflare` adapter is in `package.json` but intentionally NOT used** in `astro.config.mjs` — the site is pure static output; re-adding the adapter broke Pages deploys previously.
- **Do not re-add an SPA catch-all to `public/_redirects`** — `/* /index.html 200` was removed because it soft-404s every unknown URL to the homepage, which breaks programmatic SEO crawling.

## Mission status

The mission below has been executed (July 2026): 500 exec pages (10 titles × 50 metros), 10 pillar guides, sitemap, robots.txt, hydration snippet, internal-links.json, and README are live. Blockers hit and workarounds taken are documented in README.md ("Decisions & blockers"): the live API has no exec-title coverage (exec pages anchor to BLS OEWS May 2025 instead), and O*NET Web Services requires human-verified registration (skills data curated from published O*NET profiles instead). The mission text is retained below as the spec of record.

---

# Boss Playbook — Salary Site SEO Factory

You are an autonomous SEO content engineer and full-stack developer working for the Boss Playbook brand. Your audience is experienced GMs, VPs, and senior tech executives who care about compensation, career leverage, and leadership strategy.

Your mission: build a complete programmatic SEO content system for this salary site (currently deployed at salary-site-49i.pages.dev on Cloudflare Pages). The live salary data API is at web-production-d6bdb.up.railway.app.

## PHASE 1 — DISCOVER (do this first, report findings before proceeding)
1. Read every file in this repository. Understand the full stack: framework, build system, routing, how pages are currently generated, how the API is called, deployment config.
2. Query web-production-d6bdb.up.railway.app to discover all available endpoints, response schemas, and what job titles and locations are supported. Document everything.
3. Fetch BLS OES API data (no key required) for these SOC codes — median wage, p10, p90, employment count: General and Operations Managers (11-1021), Computer and Information Systems Managers (11-3021), Sales Managers (11-2022), Financial Managers (11-3031), Marketing Managers (11-2021), Chief Executives (11-1011), Software Developers (15-1252), Data Scientists (15-2051), Software Engineering Managers (11-9041), Chief of Staff / Management Analysts (13-1111).
4. Register for a free O*NET Web Services key at https://services.onetcenter.org/developer/ and fetch top 10 skills + 5 related job titles for each role above.
5. Build a master data table: {job_title, soc_code, metro_area, api_salary, bls_median, bls_p10, bls_p90, onet_skills, onet_related}.
6. Read the existing deployment workflow (.github/workflows if present) and understand exactly how to deploy.

## PHASE 2 — GENERATE 500 SALARY PAGES

Target job titles (10):
General Manager, VP of Engineering, Chief Technology Officer, Director of Operations, Chief of Staff, Head of Product, SVP of Sales, VP of Finance, Director of Data Science, Software Engineering Manager

Target metros (50):
San Francisco CA, New York NY, Seattle WA, Austin TX, Chicago IL, Boston MA, Los Angeles CA, Denver CO, Atlanta GA, Miami FL, Dallas TX, Washington DC, Minneapolis MN, Phoenix AZ, Nashville TN, Portland OR, San Diego CA, Charlotte NC, Raleigh NC, Detroit MI, Philadelphia PA, Pittsburgh PA, Salt Lake City UT, Kansas City MO, Indianapolis IN, Columbus OH, Louisville KY, Richmond VA, Tampa FL, Orlando FL, San Antonio TX, Houston TX, Milwaukee WI, Memphis TN, Cleveland OH, Cincinnati OH, St. Louis MO, Baltimore MD, Hartford CT, Providence RI, Buffalo NY, Rochester NY, Sacramento CA, Fresno CA, Las Vegas NV, Albuquerque NM, Tucson AZ, Oklahoma City OK, Omaha NE, Boise ID

For each title x metro combination, generate a complete page integrated into this site's existing framework (static generation, routing, or whatever pattern this codebase uses). Each page must have:

- URL pattern: /salary/[job-title-slug]/[city-slug] (e.g., /salary/general-manager/san-francisco-ca)
- <title>: "[Job Title] Salary in [City] (2026 Guide) | Boss Playbook"
- Meta description: 155 chars max, primary keyword natural
- JSON-LD schema: FAQPage schema with 3 Q&As per page
- H1: "What Does a [Job Title] Make in [City]? The 2026 Answer"

PAGE SECTIONS (write unique narrative for each, not templated filler):
1. THE NUMBER (150 words): Lead with the salary from our API. BLS median as secondary. Percentile range. Direct — exec audience hates fluff.
2. WHAT MOVES IT (200 words): Industry, company stage (startup vs. public), P&L scope, headcount, geography premium vs. national median. Use BLS percentile spread as evidence.
3. SKILLS THAT PAY MORE (150 words): Top 3-5 skills from O*NET with commentary on why they command premium in this specific role.
4. HOW TO NEGOTIATE THIS NUMBER (200 words): Tactical, senior-exec framing. Not generic HR advice. Write as a 30-year exec talking to another exec — direct, experienced, occasionally blunt. No corporate euphemisms.
5. RELATED ROLES IN [CITY] (100 words): 3 internal links to other pages you're generating — same city different title OR same title adjacent city. This builds the internal link graph.
6. CTA BLOCK: "Get the full Boss Playbook compensation strategy — free weekly breakdown for GMs and executives." Link to newsletter signup. Include @boss.playbook.

VOICE: A 30-year tech exec who has been in the room during comp negotiations. Confident, data-backed, occasionally blunt. The reader has been around long enough to spot BS.

## PHASE 3 — 10 PILLAR PAGES (1,500-2,000 words each)
After all 500 base pages, generate these long-form authority pages:
1. "The 2026 GM Compensation Playbook: What General Managers Actually Earn"
2. "VP of Engineering Salaries 2026: Complete US Breakdown by City and Company Stage"
3. "CTO Compensation Guide 2026: Base, Equity, Bonus — The Real Numbers"
4. "Chief of Staff Salary 2026: The Role, The Pay, and Why It Varies Wildly"
5. "Director vs. VP vs. SVP: How Compensation Scales in Tech 2026"
6. "How to Negotiate a GM Offer: The Tactics Senior Execs Actually Use"
7. "Stock vs. Salary: How Smart Executives Think About Total Comp"
8. "Cost of Living Adjustment: What Your Salary is Really Worth in 30 US Cities"
9. "The Executive Compensation Gap: Why Two VPs at Similar Companies Earn 40% Different"
10. "Switching Industries as a Senior Leader: What Happens to Your Salary"

## PHASE 4 — TECHNICAL DELIVERABLES
1. Update sitemap.xml with all 510 pages
2. robots.txt (if not present)
3. A lightweight JS snippet to hydrate salary numbers client-side from the live API on page load so data stays fresh without rebuilding static pages
4. GitHub Actions workflow that deploys to Cloudflare Pages on push to main (use wrangler if already configured, otherwise set up)
5. Internal link map as /internal-links.json — flag any pages with fewer than 2 internal links and add links to fix them
6. README.md update documenting the full architecture, how to add new pages, and how to update data sources

## RULES
- Integrate with the existing codebase — do not rip out the current framework and replace it
- Make reasonable decisions autonomously, document them in README
- If the API returns unexpected data, adapt and note it
- Do not stop for confirmation between phases
- If you hit a technical blocker, document it and find a workaround

Start with Phase 1. Show me what you find in the repo and the API before writing a single page.
