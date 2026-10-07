/**
 * The slice's anomaly catalog — every def registered into the run's
 * weighted bag. Keep registration here (not in app.ts) so tests and the
 * catalog doc can't drift from what actually ships.
 */
import type { AnomalyDef } from "./types";
import { clockReverse } from "./clockReverse";
import { doorwayExtra } from "./doorwayExtra";
import { footstepsExtra } from "./footstepsExtra";
import { lightOut } from "./lightOut";
import { lightFlicker } from "./lightFlicker";
import { signFlip } from "./signFlip";
import { posterMissing } from "./posterMissing";
import { slatMissing } from "./slatMissing";
import { doorAjar } from "./doorAjar";
import { watcherFar } from "./watcherFar";
import { cctvGaze } from "./cctvGaze";
import { airHaze } from "./airHaze";
import { terminalNotice } from "./terminalNotice";
import { machineRattle } from "./machineRattle";

export const ALL_ANOMALIES: AnomalyDef[] = [
  clockReverse,
  doorwayExtra,
  footstepsExtra,
  lightOut,
  lightFlicker,
  signFlip,
  posterMissing,
  slatMissing,
  doorAjar,
  watcherFar,
  cctvGaze,
  airHaze,
  terminalNotice,
  machineRattle,
];
