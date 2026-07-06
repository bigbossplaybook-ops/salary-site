// Narrative engine for Boss Playbook exec salary pages.
//
// Every sentence-level choice is driven by a deterministic hash of
// (role, metro), so builds are reproducible and each of the 500 pages gets a
// distinct composition: different openers, different factor ordering, and
// metro-specific economic commentary — not one template with numbers swapped.

export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(seed, salt, arr) {
  return arr[(seed + salt * 2654435761) % arr.length];
}

function rotate(seed, salt, arr) {
  const n = (seed + salt * 40503) % arr.length;
  return [...arr.slice(n), ...arr.slice(0, n)];
}

export const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const pctFmt = (mult) => {
  const pct = Math.round(Math.abs(mult - 1) * 100);
  return { pct, above: mult >= 1 };
};

function listOut(items) {
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}

// ---------- Section 1: THE NUMBER ----------
export function buildTheNumber({ role, metro, city, wages, year }) {
  const seed = hashSeed(role.slug + "|" + metro.slug);
  const { pct, above } = pctFmt(city.costMultiplier);
  const geo = pct < 3
    ? `${city.name} pays this role almost exactly at the national line`
    : above
      ? `${city.name} pays a ${pct}% premium over the national market`
      : `${city.name} prices the role about ${pct}% under the national market`;

  const opener = pick(seed, 1, [
    `A ${role.label} in ${city.name} earns a median of ${fmt(wages.median)} in ${year}. The working range runs from ${fmt(wages.p25)} at the 25th percentile to ${fmt(wages.p75)} at the 75th, with top-decile operators clearing ${fmt(wages.p90)}.`,
    `The number is ${fmt(wages.median)} — that's the ${year} median for a ${role.label} in ${city.name}. Most offers land between ${fmt(wages.p25)} and ${fmt(wages.p75)}; the top 10% of the market clears ${fmt(wages.p90)}.`,
    `Median ${role.label} pay in ${city.name} sits at ${fmt(wages.median)} for ${year}. The realistic negotiating band is ${fmt(wages.p25)} to ${fmt(wages.p75)}, and ${fmt(wages.p90)} is where the 90th percentile starts — not where fantasy begins.`,
  ]);

  const blsLine = pick(seed, 2, [
    `For calibration: BLS pegs the national median for ${role.socTitle} (SOC ${role.soc}) at ${fmt(role.bls.median)}, spanning ${fmt(role.bls.p10)} to ${fmt(role.bls.p90)} across ${role.bls.employment.toLocaleString()} jobholders. ${role.premiumNote}`,
    `The federal baseline: BLS reports ${fmt(role.bls.median)} median nationally for ${role.socTitle} (SOC ${role.soc}), with a ${fmt(role.bls.p10)}–${fmt(role.bls.p90)} percentile spread across ${role.bls.employment.toLocaleString()} positions. ${role.premiumNote}`,
  ]);

  const closer = pick(seed, 3, [
    `${geo}, and the spread between the 25th and 90th percentile is ${fmt(wages.p90 - wages.p25)} — which is the real story. Where you land in that spread is negotiable; the median is just the market's opening bid.`,
    `${geo}. Note the ${fmt(wages.p90 - wages.p25)} gap between the 25th and 90th percentiles — that gap is scope, industry and negotiation, and every dollar of it is contestable.`,
  ]);

  return [opener, blsLine, closer];
}

// ---------- Section 2: WHAT MOVES IT ----------
export function buildWhatMovesIt({ role, metro, city, wages }) {
  const seed = hashSeed(role.slug + "|" + metro.slug);
  const spread = role.bls.p90 - role.bls.p10;

  const intro = pick(seed, 4, [
    `Four variables move this number more than anything on your resume.`,
    `The band is wide by design. Here's what actually determines where you land in it.`,
    `Same title, very different paychecks — these are the levers that explain the spread.`,
  ]);

  const factors = rotate(seed, 5, role.movesIt);

  const evidence = pick(seed, 6, [
    `The evidence for how much these levers matter is in the federal data itself: BLS shows a ${fmt(spread)} spread between the 10th and 90th percentile for this occupation nationally. That's not noise — it's scope, industry and stage being priced in real offers.`,
    `Don't take it on faith — the BLS percentile spread for this SOC is ${fmt(spread)} from bottom decile to top. A spread that wide is the market telling you the title doesn't set the price; the mandate does.`,
  ]);

  const local = pick(seed, 7, [
    `Locally, the demand side is ${listOut(metro.industries)}. ${metro.econ} In practice, ${metro.talent} — factor that into how hard you push.`,
    `In ${city.name} specifically, the buyers are ${listOut(metro.industries)} — think ${listOut(metro.employers.slice(0, 3))}. ${metro.econ}`,
  ]);

  return { intro, factors, evidence, local };
}

// ---------- Section 3: SKILLS THAT PAY MORE ----------
export function buildSkills({ role, metro }) {
  const seed = hashSeed(role.slug + "|" + metro.slug);

  const intro = pick(seed, 8, [
    `From the O*NET profile for ${role.socTitle} (SOC ${role.soc}), these are the skills that actually move the offer — with the reasons hiring committees pay up for them.`,
    `O*NET's occupational profile for SOC ${role.soc} lists dozens of competencies. These are the ones with pricing power.`,
  ]);

  const skills = rotate(seed, 9, role.skills).slice(0, Math.min(5, role.skills.length));

  const closer = pick(seed, 10, [
    `In a market anchored by ${listOut(metro.industries.slice(0, 2))}, lead with the ones that map to the local buyer's problem.`,
    `Given that ${metro.talent}, the skills above aren't a checklist — they're your differentiation story.`,
  ]);

  return { intro, skills, closer };
}

// ---------- Section 4: HOW TO NEGOTIATE ----------
export function buildNegotiate({ role, metro, city, wages }) {
  const seed = hashSeed(role.slug + "|" + metro.slug);

  const intro = pick(seed, 11, [
    `You've been on the other side of this table. So has the person across from you. Skip the scripts — here's what actually works at this level.`,
    `Nobody at this level should be negotiating from a listicle. But after thirty years of watching offers get made and broken, these are the moves that hold up.`,
    `The company modeled your comp before you walked in. Your job is to move the model, not plead with it. Four ways to do that:`,
  ]);

  const tactics = rotate(seed, 12, role.negotiate);

  const closer = pick(seed, 13, [
    `One local note: ${metro.talent}. Price your leverage accordingly — the market in ${city.name} rewards candidates who know exactly which scarce thing they are.`,
    `And remember the ${city.name} context: ${metro.econ.charAt(0).toLowerCase() + metro.econ.slice(1)} The strongest negotiators here anchor on that reality, not on a national percentile chart. Aim above ${fmt(wages.median)} with evidence, or don't aim at all.`,
  ]);

  return { intro, tactics, closer };
}

// ---------- Section 5: RELATED ROLES ----------
export function pickRelatedLinks({ role, metro, execRoles, metroList }) {
  const seed = hashSeed(role.slug + "|" + metro.slug);
  // Two other titles in the same city, plus the same title one metro forward
  // and one back. Deterministic prev/next adjacency guarantees every exec page
  // receives at least two inbound links from its same-role neighbors.
  const sameCity = rotate(seed, 14, role.related).slice(0, 2).map((slug) => {
    const r = execRoles.find((x) => x.slug === slug);
    return { href: `/salary/${slug}/${metro.slug}`, label: `${r.label} in this market`, title: r.label };
  });
  const idx = metroList.findIndex((m) => m.slug === metro.slug);
  const next = metroList[(idx + 1) % metroList.length];
  const prev = metroList[(idx - 1 + metroList.length) % metroList.length];
  return {
    sameCity,
    adjacent: { href: `/salary/${role.slug}/${next.slug}`, slug: next.slug },
    adjacentPrev: { href: `/salary/${role.slug}/${prev.slug}`, slug: prev.slug },
  };
}

export function buildRelatedIntro({ role, city }) {
  const seed = hashSeed(role.slug + "|" + city.name);
  return pick(seed, 15, [
    `Comp decisions are comparative. Before you anchor on this number, look at the adjacent seats — the roles ${role.short}s get traded against in ${city.name}, and what this same seat pays one market over.`,
    `Smart operators benchmark sideways, not just upward. Here's how this seat prices against its neighbors — same city, different chair, and same chair in a different city.`,
  ]);
}

// ---------- FAQ JSON-LD ----------
export function buildFaq({ role, metro, city, wages, year }) {
  const seed = hashSeed(role.slug + "|" + metro.slug);
  const q3ByAngle = {
    [role.faqAngle]: true,
  };
  const third = pick(seed, 16, [
    {
      q: `What does the top 10% of ${role.label}s earn in ${city.name}?`,
      a: `The 90th percentile for a ${role.label} in ${city.name} is approximately ${fmt(wages.p90)} in ${year}. Reaching it is less about tenure than scope: ${role.movesIt[0].split(". ")[0].toLowerCase()}.`,
    },
    {
      q: `Is ${city.name} a high-paying market for a ${role.label}?`,
      a: city.costMultiplier >= 1.05
        ? `Yes. ${city.name} prices this role roughly ${Math.round((city.costMultiplier - 1) * 100)}% above the national market, driven by ${listOut(metro.industries.slice(0, 2))}. ${metro.econ}`
        : `${city.name} prices the role near or below the national line in nominal terms, but adjusted for cost of living the effective compensation is competitive. ${metro.econ}`,
    },
  ]);

  return [
    {
      q: `What is the average ${role.label} salary in ${city.name}, ${city.state}?`,
      a: `The median ${role.label} salary in ${city.name} is ${fmt(wages.median)} in ${year}, with most offers falling between ${fmt(wages.p25)} and ${fmt(wages.p75)}. Figures are anchored to BLS OEWS data for ${role.socTitle} (SOC ${role.soc}) and adjusted for the ${city.name} market.`,
    },
    {
      q: `What moves a ${role.label}'s pay above the median in ${city.name}?`,
      a: `${role.movesIt[0]} Additionally: ${role.skills[0].name.toLowerCase()} is the highest-leverage skill for this role — ${role.skills[0].why.split(". ")[0].toLowerCase()}.`,
    },
    third,
  ];
}
