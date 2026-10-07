/**
 * All signage copy is original fiction for NIGHT AUDIT. Never paste real
 * transit/agency copy or brand pictograms. Keep text short enough to read
 * at render distance — it doubles as a memorization aid (and anomaly bait).
 */
export const FICTION = {
  city: "ALDER CITY",
  authority: "CIVIC WORKS AUTHORITY",
  division: "ROUTE INTEGRITY DIVISION",
  loopName: "INSPECTION LOOP 7",
  concourse: "MUNICIPAL SERVICES CONCOURSE",
  level: "LEVEL −2",
} as const;

export interface SignSpec {
  /** registry id used by the concourse builder */
  id: string;
  /** primary line, uppercase rendered */
  title: string;
  /** optional secondary line */
  sub?: string;
  /** arrow glyph hint (rendered as text arrow) */
  arrow?: "left" | "right" | "none";
  /** amber | cyan | dark variants */
  tone: "amber" | "cyan" | "dark";
}

export const SIGNS: SignSpec[] = [
  {
    id: "sign.totem.north",
    title: "ARCHIVES",
    sub: "RECORDS WALL · BAYS 1–18",
    arrow: "right",
    tone: "cyan",
  },
  {
    id: "sign.clinic",
    title: "CLINIC INTAKE B",
    sub: "CLOSED 22:00–06:00",
    arrow: "none",
    tone: "amber",
  },
  {
    id: "sign.gallery",
    title: "OBSERVATION GALLERY",
    sub: "AUTHORIZED PERSONNEL",
    arrow: "none",
    tone: "dark",
  },
  {
    id: "sign.junction",
    title: "SERVICE JUNCTION S-2",
    sub: "LIFT LOBBY · EAST SHAFT",
    arrow: "right",
    tone: "cyan",
  },
  {
    id: "sign.exit.south",
    title: "INSPECTION POINT",
    sub: "FILE ROUTE CLEAR →",
    arrow: "right",
    tone: "amber",
  },
  {
    id: "sign.notice.board",
    title: "NOTICE",
    sub: "LOOP INSPECTIONS RESUMED 04:12",
    arrow: "none",
    tone: "dark",
  },
];

/** Diegetic micro-copy; used on posters, terminals, notices. */
export const COPY = {
  airlockTerminal: {
    header: "ROUTE INTEGRITY",
    prompt: "FILE JUDGMENT BEYOND THIS POINT",
    clearLabel: "FILE: ROUTE CLEAR",
    divergenceLabel: "FILE: DIVERGENCE LOGGED",
  },
  startScreen: {
    title: "NIGHT AUDIT",
    sub: "Civic Works Authority · Route Integrity Division",
    brief: [
      "SHIFT BRIEFING — INSPECTOR N-117",
      "Walk Inspection Loop 7. Learn what normal looks like.",
      "If the route is clear: proceed to the south inspection point.",
      "If anything is wrong — anything at all: turn back and log a divergence.",
      "Your judgment keeps the route open. Errors bring it down.",
    ],
    begin: "BEGIN SHIFT",
    continueRun: "CONTINUE SHIFT",
  },
  results: {
    secured: "ROUTE SECURED",
    lost: "ROUTE LOST",
  },
} as const;
