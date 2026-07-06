import type { APIRoute } from "astro";
import citiesData from "../../scripts/cities.json";
import { execRoles } from "../data/exec-roles.mjs";
import { metros } from "../data/metros.mjs";
import { guides, roleGuides } from "../data/guides.mjs";
import { pickRelatedLinks } from "../lib/narrative.mjs";

// Recomputes the internal link graph from the same data/logic the pages are
// built from, so the map stays true by construction. Pages with fewer than 2
// outbound or 2 inbound content links are flagged.

const legacyOccupations = [
  "software-developer", "registered-nurse", "financial-analyst", "teacher",
  "mechanical-engineer", "marketing-manager", "accountant", "data-scientist",
  "electrician", "physical-therapist", "sales-manager", "human-resources-manager",
  "graphic-designer", "truck-driver", "dentist", "lawyer", "pharmacist",
  "civil-engineer", "real-estate-agent", "cybersecurity-analyst",
];

// Raw source of the pillar pages, so guide outbound links are counted from
// what was actually written.
const guideSources = import.meta.glob("./guides/*.astro", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const GET: APIRoute = () => {
  const outbound: Record<string, string[]> = {};

  // Legacy salary pages — mirrors the rotating link scheme in
  // src/pages/salary/[occupation]/[location].astro.
  const cities = citiesData as { slug: string }[];
  for (let occIdx = 0; occIdx < legacyOccupations.length; occIdx++) {
    const occ = legacyOccupations[occIdx];
    for (let cityIdx = 0; cityIdx < cities.length; cityIdx++) {
      const city = cities[cityIdx];
      const url = `/salary/${occ}/${city.slug}`;
      const links: string[] = [];
      const related: string[] = [];
      for (let k = 1; related.length < 4; k++) {
        const cand = legacyOccupations[(occIdx + cityIdx + k) % legacyOccupations.length];
        if (cand !== occ && !related.includes(cand)) related.push(cand);
      }
      for (const rel of related) links.push(`/salary/${rel}/${city.slug}`);
      for (let k = 1; k <= 6; k++) {
        links.push(`/salary/${occ}/${cities[(cityIdx + k) % cities.length].slug}`);
      }
      outbound[url] = links;
    }
  }

  // Exec salary pages
  for (const role of execRoles) {
    for (const metro of metros) {
      const url = `/salary/${role.slug}/${metro.slug}`;
      const rel = pickRelatedLinks({ role, metro, execRoles, metroList: metros });
      outbound[url] = [
        ...rel.sameCity.map((l: { href: string }) => l.href),
        rel.adjacent.href,
        rel.adjacentPrev.href,
        ...(roleGuides[role.slug as keyof typeof roleGuides] ?? []).map((g: string) => `/guides/${g}`),
      ];
    }
  }

  // Pillar pages — parse hrefs out of the authored source.
  for (const g of guides) {
    const key = Object.keys(guideSources).find((k) => k.includes(`/${g.slug}.astro`));
    const src = key ? guideSources[key] : "";
    const links = [...src.matchAll(/href="(\/(?:salary|guides)\/[^"]+)"/g)].map((m) => m[1]);
    outbound[`/guides/${g.slug}`] = [...new Set(links)];
  }

  // Inbound counts across the graph.
  const inbound: Record<string, number> = {};
  for (const links of Object.values(outbound)) {
    for (const l of links) inbound[l] = (inbound[l] ?? 0) + 1;
  }

  const pages: Record<string, { outbound: string[]; outboundCount: number; inboundCount: number }> = {};
  const flagged: { page: string; reason: string }[] = [];
  for (const [url, links] of Object.entries(outbound)) {
    const inb = inbound[url] ?? 0;
    pages[url] = { outbound: links, outboundCount: links.length, inboundCount: inb };
    if (links.length < 2) flagged.push({ page: url, reason: `only ${links.length} outbound internal links` });
    if (inb < 2) flagged.push({ page: url, reason: `only ${inb} inbound internal links` });
  }

  const body = {
    generated: new Date().toISOString(),
    totalPages: Object.keys(pages).length,
    flaggedCount: flagged.length,
    note: "Pages flagged when outbound or inbound content links < 2. Exec pages link 2 same-city roles + prev/next metro by construction; legacy pages link 4 related occupations + 6 cities.",
    flagged,
    pages,
  };

  return new Response(JSON.stringify(body, null, 1), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
