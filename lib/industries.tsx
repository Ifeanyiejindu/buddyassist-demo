import { ReactNode } from "react";

export interface Industry {
  id: string;
  slug: string;
  name: string;
  coverName: string;
  coverSub: string;
  domain: string;
  tagline: string;
  surface: string;
  chrome: [string, string];
  coverStyle: React.CSSProperties;
  glyph: ReactNode;
}

const Glyph = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full block">
    {children}
  </svg>
);

export const INDUSTRIES: Industry[] = [
  {
    id: "ecommerce",
    slug: "acme",
    name: "Acme Store",
    coverName: "Acme",
    coverSub: "Modern goods · home",
    domain: "E-commerce",
    tagline: 'E-commerce · "Help me find a gift"',
    surface: "Floating bubble",
    chrome: ["Acme™", "EST. 2018"],
    coverStyle: {
      ["--cb" as string]: "#E2C8B5",
      ["--cf" as string]: "#1A1815",
      ["--cff" as string]: "var(--font-serif), serif",
      ["--cfw" as string]: "400",
      ["--cls" as string]: "-0.01em",
    },
    glyph: (
      <Glyph>
        <circle cx="50" cy="55" r="34" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="20" y1="55" x2="80" y2="55" stroke="currentColor" strokeWidth="1" />
      </Glyph>
    ),
  },
  {
    id: "healthcare",
    slug: "northbrook",
    name: "Northbrook Clinic",
    coverName: "Northbrook",
    coverSub: "Family practice · clinic",
    domain: "Healthcare",
    tagline: "Healthcare · Book, triage, follow-up",
    surface: "Voice / call interface",
    chrome: ["Northbrook", "NPI · 1487"],
    coverStyle: {
      ["--cb" as string]: "#DDE7E2",
      ["--cf" as string]: "#1B3329",
      ["--cff" as string]: "var(--font-grotesk), sans-serif",
      ["--cfw" as string]: "500",
    },
    glyph: (
      <Glyph>
        <path d="M5,55 L25,55 L32,38 L42,72 L52,30 L60,55 L95,55" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </Glyph>
    ),
  },
  {
    id: "booking",
    slug: "wayfare",
    name: "Wayfare Travel",
    coverName: "Wayfare",
    coverSub: "Slow travel, planned well",
    domain: "Booking",
    tagline: "Booking · Plan a 4-day Lisbon trip",
    surface: "Full-screen concierge",
    chrome: ["Wayfare", "LIS · BCN · LX"],
    coverStyle: {
      ["--cb" as string]: "#D9C5A4",
      ["--cf" as string]: "#1F2A3A",
      ["--cff" as string]: "var(--font-serif), serif",
      ["--cfw" as string]: "400",
      ["--cls" as string]: "-0.01em",
      ["--cfs" as string]: "italic",
    },
    glyph: (
      <Glyph>
        <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="1" />
        <line x1="14" y1="50" x2="86" y2="50" stroke="currentColor" strokeWidth="1" />
        <line x1="50" y1="14" x2="50" y2="86" stroke="currentColor" strokeWidth="1" />
      </Glyph>
    ),
  },
  {
    id: "marketing",
    slug: "pulse",
    name: "Pulse Agency",
    coverName: "Pulse.",
    coverSub: "Performance marketing",
    domain: "Marketing",
    tagline: "Marketing · Why is CAC up this week?",
    surface: "Top-bar slide-down",
    chrome: ["● PULSE", "WEEK 19"],
    coverStyle: {
      ["--cb" as string]: "#0E0F12",
      ["--cf" as string]: "#A8FF35",
      ["--cff" as string]: "var(--font-grotesk), sans-serif",
      ["--cfw" as string]: "600",
      ["--cls" as string]: "-0.03em",
    },
    glyph: (
      <Glyph>
        <rect x="20" y="60" width="8" height="25" fill="currentColor" />
        <rect x="36" y="48" width="8" height="37" fill="currentColor" />
        <rect x="52" y="30" width="8" height="55" fill="currentColor" />
        <rect x="68" y="40" width="8" height="45" fill="currentColor" />
      </Glyph>
    ),
  },
  {
    id: "support",
    slug: "helix",
    name: "Helix Support",
    coverName: "Helix",
    coverSub: "Support, properly resolved",
    domain: "Customer support",
    tagline: "Customer support · Resolve a ticket",
    surface: "Resizable side panel",
    chrome: ["HELIX", "SLA · 99.9"],
    coverStyle: {
      ["--cb" as string]: "#1F2937",
      ["--cf" as string]: "#E8EEF5",
      ["--cff" as string]: "var(--font-grotesk), sans-serif",
      ["--cfw" as string]: "500",
      ["--cls" as string]: "-0.02em",
    },
    glyph: (
      <Glyph>
        <rect x="18" y="28" width="64" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <rect x="18" y="46" width="64" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <rect x="18" y="64" width="40" height="10" rx="2" fill="currentColor" />
      </Glyph>
    ),
  },
  {
    id: "restaurant",
    slug: "olivetta",
    name: "Olivetta",
    coverName: "Olivetta",
    coverSub: "Trattoria · wine bar",
    domain: "Restaurant",
    tagline: "Restaurant · Allergens, pairings, reservations",
    surface: "Inline / contextual",
    chrome: ["Olivetta", "EST. MMXIV"],
    coverStyle: {
      ["--cb" as string]: "#3A4A3F",
      ["--cf" as string]: "#F1ECE0",
      ["--cff" as string]: "var(--font-serif), serif",
      ["--cfw" as string]: "400",
      ["--cls" as string]: "-0.01em",
      ["--cfs" as string]: "italic",
    },
    glyph: (
      <Glyph>
        <ellipse cx="50" cy="50" rx="32" ry="14" fill="none" stroke="currentColor" strokeWidth="1.2" transform="rotate(-25 50 50)" />
        <line x1="22" y1="62" x2="78" y2="38" stroke="currentColor" strokeWidth="1" />
      </Glyph>
    ),
  },
  {
    id: "realestate",
    slug: "keystone",
    name: "Keystone Realty",
    coverName: "Keystone",
    coverSub: "Residential brokerage",
    domain: "Real estate",
    tagline: "Real estate · Find a 2BR near transit",
    surface: "Floating bubble",
    chrome: ["KEYSTONE", "MLS · LIVE"],
    coverStyle: {
      ["--cb" as string]: "#1A2B33",
      ["--cf" as string]: "#D4B98C",
      ["--cff" as string]: "var(--font-serif), serif",
      ["--cfw" as string]: "400",
      ["--cls" as string]: "-0.01em",
    },
    glyph: (
      <Glyph>
        <polygon points="50,18 86,46 86,86 14,86 14,46" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="14" y1="46" x2="50" y2="18" stroke="currentColor" strokeWidth="1.2" />
        <line x1="50" y1="18" x2="86" y2="46" stroke="currentColor" strokeWidth="1.2" />
      </Glyph>
    ),
  },
  {
    id: "banking",
    slug: "northbank",
    name: "Northbank",
    coverName: "NORTHBANK",
    coverSub: "Private banking · since 1928",
    domain: "Banking",
    tagline: "Banking · Explain my statement",
    surface: "Secure side panel",
    chrome: ["NORTHBANK", "FDIC INSURED"],
    coverStyle: {
      ["--cb" as string]: "#0E1B2C",
      ["--cf" as string]: "#C4A878",
      ["--cff" as string]: "var(--font-grotesk), sans-serif",
      ["--cfw" as string]: "500",
      ["--cls" as string]: "0.04em",
    },
    glyph: (
      <Glyph>
        {[20, 36, 52, 68, 84].map((x) => (
          <line key={x} x1={x} y1="22" x2={x} y2="86" stroke="currentColor" strokeWidth="0.8" />
        ))}
      </Glyph>
    ),
  },
  {
    id: "education",
    slug: "lumen",
    name: "Lumen Learn",
    coverName: "Lumen",
    coverSub: "Learning, the long way",
    domain: "Education",
    tagline: "Education · Tutor me through calculus",
    surface: "ChatGPT-style tutor",
    chrome: ["Lumen", "SEM · SPRING"],
    coverStyle: {
      ["--cb" as string]: "#231A33",
      ["--cf" as string]: "#EDE7DA",
      ["--cff" as string]: "var(--font-serif), serif",
      ["--cfw" as string]: "400",
      ["--cls" as string]: "-0.01em",
    },
    glyph: (
      <Glyph>
        <path d="M20,80 Q35,30 50,80 Q65,30 80,80" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="14" y1="80" x2="86" y2="80" stroke="currentColor" strokeWidth="0.8" />
      </Glyph>
    ),
  },
];
