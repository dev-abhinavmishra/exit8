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
import { clockWrongFace } from "./clockWrongFace";
import { materialSwap } from "./materialSwap";
import { propDisplaced } from "./propDisplaced";
import { tempDrift } from "./tempDrift";
import { machineSilence } from "./machineSilence";
import { announceSpatial } from "./announceSpatial";
import { shadowSourceless } from "./shadowSourceless";
import { lightAvoids } from "./lightAvoids";
import { clockSpins } from "./clockSpins";
import { footstepsAhead } from "./footstepsAhead";
import { doorBreathes } from "./doorBreathes";
import { totemSways } from "./totemSways";
import { stripeWrong } from "./stripeWrong";
import { cctvSleeps } from "./cctvSleeps";
import { ventGroan } from "./ventGroan";
import { posterChanged } from "./posterChanged";
import { counterWorker } from "./counterWorker";

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
  clockWrongFace,
  materialSwap,
  propDisplaced,
  tempDrift,
  machineSilence,
  announceSpatial,
  shadowSourceless,
  lightAvoids,
  clockSpins,
  footstepsAhead,
  doorBreathes,
  totemSways,
  stripeWrong,
  cctvSleeps,
  ventGroan,
  posterChanged,
  counterWorker,
];
