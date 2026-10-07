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
  /** optional walking-figure pictogram, drawn left of the title */
  figure?: "left" | "right";
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
    figure: "right",
    tone: "amber",
  },
  {
    id: "sign.notice.board",
    title: "NOTICE",
    sub: "LOOP INSPECTIONS RESUMED 04:12",
    arrow: "none",
    tone: "dark",
  },
  {
    id: "sign.fire.point",
    title: "FIRE POINT",
    sub: "HOSE · EXTINGUISHER · ALARM",
    arrow: "none",
    tone: "dark",
  },
  {
    id: "sign.lift",
    title: "SERVICE LIFT",
    sub: "OUT OF SERVICE · DIAL 7-700",
    arrow: "none",
    tone: "dark",
  },
  {
    id: "sign.cap.plaque",
    title: "SECTOR CAP",
    sub: "AUTHORIZED PERSONNEL ONLY",
    arrow: "none",
    tone: "dark",
  },
  {
    id: "sign.directory",
    title: "ROUTE DIRECTORY",
    sub: "NORTH INTAKE · JUNCTION S-2 · INSPECTION POINT",
    arrow: "right",
    tone: "amber",
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
    epilogues: {
      standard: "Shift filed clean. Upstairs, the city hums on. The loop is satisfied — for tonight.",
      investigative:
        "Six memos, one pattern. The Authority knew exactly what it was hiding — and now so does Inspector N-117.",
      lost: "Stability zero. The report writes itself in a handwriting that is almost yours. The route keeps your shift.",
      practice: "Drills logged. The real route remembers none of this.",
    },
  },
  credits: {
    title: "CREDITS",
    lines: [
      "NIGHT AUDIT — a looping-corridor inspection",
      "Concept, code, world, audio: Cognition Devin",
      "Engine: Babylon.js (MIT)",
      "All textures and audio are generated in-browser — no external assets.",
      "Inspired by the anomaly-spotting genre. All fiction original.",
      "Civic Works Authority thanks you for your continued inspection.",
    ],
  },
} as const;
