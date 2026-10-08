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
import { walkerBackwards } from "./walkerBackwards";
import { walkerStare } from "./walkerStare";
import { walkerAbsent } from "./walkerAbsent";
import { fireOpen } from "./fireOpen";
import { posterSwapped } from "./posterSwapped";
import { signDrift } from "./signDrift";
import { terminalGlitch } from "./terminalGlitch";
import { memoryPersist } from "./memoryPersist";
import { lightDelay } from "./lightDelay";
import { routeReacts } from "./routeReacts";
import { sightlineImpossible } from "./sightlineImpossible";
import { depthMismatch } from "./depthMismatch";
import { liftArrives } from "./liftArrives";
import { gazeShift } from "./gazeShift";
import { paceDissolves } from "./paceDissolves";
import { guideMissing } from "./guideMissing";
import { guideMisaligned } from "./guideMisaligned";
import { shaftGlow } from "./shaftGlow";
import { watcherFollows } from "./watcherFollows";
import { postersMirror } from "./postersMirror";
import { clockMissing } from "./clockMissing";
import { binWanders } from "./binWanders";
import { noticeAmends } from "./noticeAmends";
import { benchMoved } from "./benchMoved";
import { airlockBreach } from "./airlockBreach";
import { tracksWet } from "./tracksWet";
import { chalkMarks } from "./chalkMarks";
import { figureSouth } from "./figureSouth";
import { cctvAll } from "./cctvAll";
import { guideCross } from "./guideCross";
import { shutterAjar } from "./shutterAjar";
import { recordsBreach } from "./recordsBreach";
import { galleryFrost } from "./galleryFrost";
import { vendDead } from "./vendDead";
import { sheetsCleared } from "./sheetsCleared";
import { doorStuck } from "./doorStuck";
import { walkerCrowd } from "./walkerCrowd";
import { lightFollows } from "./lightFollows";
import { glassEyes } from "./glassEyes";
import { signWrongway } from "./signWrongway";
import { terminalBlack } from "./terminalBlack";
import { binFlipped } from "./binFlipped";
import { hatchOpen } from "./hatchOpen";
import { stripGrows } from "./stripGrows";
import { mullionExtra } from "./mullionExtra";
import { glassWriting } from "./glassWriting";
import { totemReversed } from "./totemReversed";
import { doorSlow } from "./doorSlow";
import { cabinetRows } from "./cabinetRows";
import { mullionMissing } from "./mullionMissing";
import { galleryLit } from "./galleryLit";
import { liftCalls } from "./liftCalls";
import { benchSit } from "./benchSit";
import { stainSpread } from "./stainSpread";
import { signGhost } from "./signGhost";
import { hallStretch } from "./hallStretch";
import { vanishMisaligned } from "./vanishMisaligned";
import { arrowPoints } from "./arrowPoints";
import { bayplateGone } from "./bayplateGone";
import { ventSlats } from "./ventSlats";
import { extGone } from "./extGone";
import { aidGone } from "./aidGone";
import { phoneOffhook } from "./phoneOffhook";
import { fountainRuns } from "./fountainRuns";
import { panelOpen } from "./panelOpen";
import { pilotDead } from "./pilotDead";
import { doorLit } from "./doorLit";
import { bucketTipped } from "./bucketTipped";
import { cabGone } from "./cabGone";
import { radLeaks } from "./radLeaks";
import { lockerAjar } from "./lockerAjar";
import { exitWrongway } from "./exitWrongway";
import { walkerFaceless } from "./walkerFaceless";
import { walkerCrawl } from "./walkerCrawl";
import { signLoop8 } from "./signLoop8";
import { guideShort } from "./guideShort";
import { radGone } from "./radGone";
import { lockersAll } from "./lockersAll";
import { phoneGone } from "./phoneGone";
import { mopGone } from "./mopGone";
import { posterDup } from "./posterDup";
import { exitDark } from "./exitDark";
import { fountainGone } from "./fountainGone";
import { posterTilted } from "./posterTilted";
import { hatchGone } from "./hatchGone";
import { guideRed } from "./guideRed";
import { dirGone } from "./dirGone";
import { machineDead } from "./machineDead";
import { benchGone } from "./benchGone";

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
  walkerBackwards,
  walkerStare,
  walkerAbsent,
  fireOpen,
  posterSwapped,
  signDrift,
  terminalGlitch,
  memoryPersist,
  lightDelay,
  routeReacts,
  sightlineImpossible,
  depthMismatch,
  liftArrives,
  gazeShift,
  paceDissolves,
  guideMissing,
  guideMisaligned,
  shaftGlow,
  watcherFollows,
  postersMirror,
  clockMissing,
  binWanders,
  noticeAmends,
  benchMoved,
  airlockBreach,
  tracksWet,
  chalkMarks,
  figureSouth,
  cctvAll,
  guideCross,
  shutterAjar,
  recordsBreach,
  galleryFrost,
  doorStuck,
  walkerCrowd,
  lightFollows,
  glassEyes,
  signWrongway,
  terminalBlack,
  binFlipped,
  hatchOpen,
  stripGrows,
  mullionExtra,
  glassWriting,
  totemReversed,
  doorSlow,
  cabinetRows,
  mullionMissing,
  galleryLit,
  liftCalls,
  benchSit,
  stainSpread,
  signGhost,
  hallStretch,
  vanishMisaligned,
  arrowPoints,
  bayplateGone,
  ventSlats,
  extGone,
  aidGone,
  phoneOffhook,
  fountainRuns,
  panelOpen,
  pilotDead,
  doorLit,
  bucketTipped,
  cabGone,
  radLeaks,
  lockerAjar,
  exitWrongway,
  walkerFaceless,
  walkerCrawl,
  signLoop8,
  guideShort,
  radGone,
  lockersAll,
  phoneGone,
  mopGone,
  posterDup,
  exitDark,
  fountainGone,
  posterTilted,
  hatchGone,
  guideRed,
  dirGone,
  machineDead,
  benchGone,
  vendDead,
  sheetsCleared,
];
