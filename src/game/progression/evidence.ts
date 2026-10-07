/**
 * Field notes — diegetic evidence documents hidden in the corridor.
 * Up to 3 unfiled notes spawn per run (seeded placement); collecting one
 * writes it into progression.discoveries and the route archive. File all
 * six across runs and a SECURED route resolves as the investigative ending.
 * Placement is baseline-legal: notes read as municipal ephemera unless you
 * actually walk up and take them — they are never the loop's anomaly.
 */
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export interface EvidenceNote {
  id: string;
  title: string;
  /** short in-fiction body — the archive keeps the full text */
  lines: string[];
  pos: Vector3;
  rot: Vector3;
}

const WALL_L = -1.735; // wall boxes are 0.12 thick — inner face is |1.74|, posters sit at ±1.735
const WALL_R = 1.735;
const ROT_L = -Math.PI / 2; // left-wall plane faces +x into the corridor
const ROT_R = Math.PI / 2; // right-wall plane faces -x
const FLAT = Math.PI / 2; // counter/bench-top paper faces up (counterWorker convention)

export const EVIDENCE_NOTES: EvidenceNote[] = [
  {
    id: "note.clock",
    title: "RE: GALLERY TIMEPIECE",
    lines: [
      "Timepiece has not kept time",
      "since the refit. Work order",
      "filed and ignored.",
      "",
      "If it runs backward, that is",
      "logged behavior.",
    ],
    pos: new Vector3(-1.35, 0.57, 16.3), // flat on the bench
    rot: new Vector3(FLAT, 0, 0.12),
  },
  {
    id: "note.vent",
    title: "DAMPER INSPECTION 7",
    lines: [
      "Gallery intake grille",
      "'answers back' on night tours.",
      "Classed as thermal flex.",
      "",
      "Do not investigate alone.",
    ],
    pos: new Vector3(WALL_L, 1.85, 8.6), // pinned under the north vent
    rot: new Vector3(0, ROT_L, 0),
  },
  {
    id: "note.counter",
    title: "CLINIC COUNTER PROTOCOL",
    lines: [
      "Counter is staffed until the",
      "last route only. If the",
      "shutter moves after hours,",
      "file it before you check it.",
    ],
    pos: new Vector3(-1.45, 1.08, 37.4), // flat on the clinic counter
    rot: new Vector3(FLAT, 0, -0.08),
  },
  {
    id: "note.shadow",
    title: "RE: SHADOW REPORTS",
    lines: [
      "A shadow crosses the clinic",
      "floor with no source.",
      "Engineers blame the gallery",
      "glass. There is no opening",
      "there.",
    ],
    pos: new Vector3(WALL_R, 1.7, 26), // right wall across from the gallery
    rot: new Vector3(0, ROT_R, 0),
  },
  {
    id: "note.air",
    title: "AIR QUALITY ADVISORY",
    lines: [
      "Particulate spike alarms",
      "dismissed as sensor drift.",
      "",
      "The corridor keeps its own",
      "weather. Dress warm on the",
      "south stretch.",
    ],
    pos: new Vector3(WALL_R, 1.6, 49.5), // right wall approaching south airlock
    rot: new Vector3(0, ROT_R, 0),
  },
  {
    id: "note.machine",
    title: "MACHINE LOG — JUNCTION 4",
    lines: [
      "Unit 4 hums while observed.",
      "Silent when unattended.",
      "Maintenance is aware.",
      "",
      "Do not file — it files itself.",
    ],
    pos: new Vector3(-0.7, 1.55, 47.5), // taped to the machine's corridor face
    rot: new Vector3(0, ROT_L, 0),
  },
];

export const EVIDENCE_PER_RUN = 3;
