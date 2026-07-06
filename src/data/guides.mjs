// Registry of Boss Playbook pillar pages (Phase 3). Used by the sitemap,
// homepage, and internal-link map. Slug must match the file name in
// src/pages/guides/.
export const guides = [
  { slug: "gm-compensation-playbook-2026", title: "The 2026 GM Compensation Playbook: What General Managers Actually Earn" },
  { slug: "vp-engineering-salaries-2026", title: "VP of Engineering Salaries 2026: Complete US Breakdown by City and Company Stage" },
  { slug: "cto-compensation-guide-2026", title: "CTO Compensation Guide 2026: Base, Equity, Bonus — The Real Numbers" },
  { slug: "chief-of-staff-salary-2026", title: "Chief of Staff Salary 2026: The Role, The Pay, and Why It Varies Wildly" },
  { slug: "director-vp-svp-compensation-2026", title: "Director vs. VP vs. SVP: How Compensation Scales in Tech 2026" },
  { slug: "how-to-negotiate-gm-offer", title: "How to Negotiate a GM Offer: The Tactics Senior Execs Actually Use" },
  { slug: "stock-vs-salary-total-comp", title: "Stock vs. Salary: How Smart Executives Think About Total Comp" },
  { slug: "cost-of-living-salary-30-cities", title: "Cost of Living Adjustment: What Your Salary is Really Worth in 30 US Cities" },
  { slug: "executive-compensation-gap", title: "The Executive Compensation Gap: Why Two VPs at Similar Companies Earn 40% Different" },
  { slug: "switching-industries-senior-leader", title: "Switching Industries as a Senior Leader: What Happens to Your Salary" },
];

export const guideBySlug = Object.fromEntries(guides.map((g) => [g.slug, g]));

// Which guides each exec salary page links to ("From the Playbook"). Chosen so
// every guide receives at least 50 inbound links from exec pages.
export const roleGuides = {
  "general-manager": ["gm-compensation-playbook-2026", "how-to-negotiate-gm-offer"],
  "vp-of-engineering": ["vp-engineering-salaries-2026", "stock-vs-salary-total-comp"],
  "chief-technology-officer": ["cto-compensation-guide-2026", "stock-vs-salary-total-comp"],
  "director-of-operations": ["director-vp-svp-compensation-2026", "cost-of-living-salary-30-cities"],
  "chief-of-staff": ["chief-of-staff-salary-2026", "executive-compensation-gap"],
  "head-of-product": ["director-vp-svp-compensation-2026", "executive-compensation-gap"],
  "svp-of-sales": ["how-to-negotiate-gm-offer", "switching-industries-senior-leader"],
  "vp-of-finance": ["switching-industries-senior-leader", "executive-compensation-gap"],
  "director-of-data-science": ["stock-vs-salary-total-comp", "cost-of-living-salary-30-cities"],
  "software-engineering-manager": ["vp-engineering-salaries-2026", "director-vp-svp-compensation-2026"],
};
