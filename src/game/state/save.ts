/**
 * Versioned localStorage save. Schema v1.
 * Rules: corrupt blobs are quarantined (kept under a side key) and replaced;
 * missing/old fields normalize via defaults so saves never hard-fail a boot.
 */
import { DEFAULT_SETTINGS, normalizeSettings, type Settings } from "../../accessibility/settings";

export const SAVE_KEY = "nightaudit.save";
export const SCHEMA_VERSION = 1;

export interface Progression {
  bestStability: number;
  runsCompleted: number;
  routesSecured: number;
  anomaliesLogged: number; // correct "divergence" calls
  falseClears: number; // proceeded past a divergence
  falseAlarms: number; // retreated from a clear route
  discovered: string[]; // anomaly ids encountered
  discoveries: string[]; // evidence ids found
  endings: string[]; // "standard" | "investigative"
}

export interface SaveData {
  version: number;
  settings: Settings;
  progression: Progression;
  flags: {
    saveResetNotice: boolean; // set when a corrupt blob was quarantined
    completedOnce: boolean; // unlocks catalog/practice extras
  };
}

export function defaultProgression(): Progression {
  return {
    bestStability: 0,
    runsCompleted: 0,
    routesSecured: 0,
    anomaliesLogged: 0,
    falseClears: 0,
    falseAlarms: 0,
    discovered: [],
    discoveries: [],
    endings: [],
  };
}

export function defaultSave(): SaveData {
  return {
    version: SCHEMA_VERSION,
    settings: structuredClone(DEFAULT_SETTINGS),
    progression: defaultProgression(),
    flags: { saveResetNotice: false, completedOnce: false },
  };
}

function migrate(raw: Record<string, unknown>): SaveData {
  // v1 is the base schema; future versions branch here.
  const base = defaultSave();
  base.settings = normalizeSettings(raw["settings"]);
  const p = raw["progression"];
  if (typeof p === "object" && p !== null) {
    const src = p as Record<string, unknown>;
    const dst = base.progression as unknown as Record<string, unknown>;
    for (const k of Object.keys(dst)) {
      const v = src[k];
      if (Array.isArray(dst[k]) && Array.isArray(v)) {
        dst[k] = (v as unknown[]).filter((x) => typeof x === "string");
      } else if (typeof dst[k] === "number" && typeof v === "number") {
        dst[k] = v;
      }
    }
  }
  const f = raw["flags"];
  if (typeof f === "object" && f !== null) {
    const src = f as Record<string, unknown>;
    if (typeof src["completedOnce"] === "boolean") base.flags.completedOnce = src["completedOnce"];
  }
  return base;
}

export class SaveStore {
  private data: SaveData;

  constructor(private readonly storage: Pick<Storage, "getItem" | "setItem" | "removeItem">) {
    this.data = this.load();
  }

  private load(): SaveData {
    let raw: string | null = null;
    try {
      raw = this.storage.getItem(SAVE_KEY);
    } catch {
      return defaultSave();
    }
    if (raw === null) return defaultSave();
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) throw new Error("save is not an object");
      const v = (parsed as Record<string, unknown>)["version"];
      if (typeof v !== "number" || v > SCHEMA_VERSION) throw new Error(`unsupported version ${v}`);
      return migrate(parsed as Record<string, unknown>);
    } catch {
      // Quarantine the corrupt blob — never silently destroy user data.
      try {
        this.storage.setItem(`${SAVE_KEY}.corrupt`, raw);
      } catch {
        /* storage full — drop quarantine */
      }
      const fresh = defaultSave();
      fresh.flags.saveResetNotice = true;
      return fresh;
    }
  }

  get(): SaveData {
    return this.data;
  }

  update(mutate: (d: SaveData) => void): SaveData {
    mutate(this.data);
    this.persist();
    return this.data;
  }

  persist(): void {
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      /* storage unavailable — session continues in-memory */
    }
  }

  resetAll(): void {
    try {
      this.storage.removeItem(SAVE_KEY);
      this.storage.removeItem(`${SAVE_KEY}.corrupt`);
    } catch {
      /* ignore */
    }
    this.data = defaultSave();
    this.persist();
  }

  consumeResetNotice(): boolean {
    const had = this.data.flags.saveResetNotice;
    if (had) {
      this.data.flags.saveResetNotice = false;
      this.persist();
    }
    return had;
  }
}
