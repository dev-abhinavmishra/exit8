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
import { posterBacks } from "./posterBacks";
import { posterChanged } from "./posterChanged";
import { counterWorker } from "./counterWorker";
import { walkerBackwards } from "./walkerBackwards";
import { walkerStare } from "./walkerStare";
import { walkerMidstep } from "./walkerMidstep";
import { walkerOfflane } from "./walkerOfflane";
import { walkerHum } from "./walkerHum";
import { walkerAbsent } from "./walkerAbsent";
import { walkerDrop } from "./walkerDrop";
import { fireOpen } from "./fireOpen";
import { posterSwapped } from "./posterSwapped";
import { posterHollow } from "./posterHollow";
import { posterGrin } from "./posterGrin";
import { posterWatches } from "./posterWatches";
import { trofferFalls } from "./trofferFalls";
import { signDrift } from "./signDrift";
import { terminalGlitch } from "./terminalGlitch";
import { memoryPersist } from "./memoryPersist";
import { lightDelay } from "./lightDelay";
import { routeReacts } from "./routeReacts";
import { sightlineImpossible } from "./sightlineImpossible";
import { depthMismatch } from "./depthMismatch";
import { clinicStaffed } from "./clinicStaffed";
import { corridorMirror } from "./corridorMirror";
import { figureThreshold } from "./figureThreshold";
import { corridorFlicker } from "./corridorFlicker";
import { walkerNotes } from "./walkerNotes";
import { gauntletWatch } from "./gauntletWatch";
import { walkerFollow } from "./walkerFollow";
import { lightCold } from "./lightCold";
import { serviceStairwell } from "./serviceStairwell";
import { phoneDialtone } from "./phoneDialtone";
import { ventLoose } from "./ventLoose";
import { capLit } from "./capLit";
import { walkerPapers } from "./walkerPapers";
import { corridorLong } from "./corridorLong";
import { stairFigure } from "./stairFigure";
import { staffDoorAjar } from "./staffDoorAjar";
import { archivesOpen } from "./archivesOpen";
import { archivesStaffed } from "./archivesStaffed";
import { archivesSlam } from "./archivesSlam";
import { staffroomAjar } from "./staffroomAjar";
import { staffroomOccupied } from "./staffroomOccupied";
import { lockerBanging } from "./lockerBanging";
import { corridorNarrow } from "./corridorNarrow";
import { ventsCrawl } from "./ventsCrawl";
import { ductMouth } from "./ductMouth";
import { lobbyVoices } from "./lobbyVoices";
import { archivesDark } from "./archivesDark";
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
import { recordsFiled } from "./recordsFiled";
import { galleryFrost } from "./galleryFrost";
import { vendDead } from "./vendDead";
import { vendEmpty } from "./vendEmpty";
import { sheetsCleared } from "./sheetsCleared";
import { doorStuck } from "./doorStuck";
import { doorsOpen } from "./doorsOpen";
import { doorsSlam } from "./doorsSlam";
import { walkerCrowd } from "./walkerCrowd";
import { lightFollows } from "./lightFollows";
import { glassEyes } from "./glassEyes";
import { signWrongway } from "./signWrongway";
import { terminalBlack } from "./terminalBlack";
import { binFlipped } from "./binFlipped";
import { hatchOpen } from "./hatchOpen";
import { hatchKnocks } from "./hatchKnocks";
import { mapWrong } from "./mapWrong";
import { blindsOpen } from "./blindsOpen";
import { rotaStamped } from "./rotaStamped";
import { sheetsAdded } from "./sheetsAdded";
import { terminalAdvisory } from "./terminalAdvisory";
import { phoneGone } from "./phoneGone";
import { hatchScratched } from "./hatchScratched";
import { shadowFigure } from "./shadowFigure";
import { bayOccupied } from "./bayOccupied";
import { bayValve } from "./bayValve";
import { egressReversed } from "./egressReversed";
import { egressGone } from "./egressGone";
import { galleryDoor } from "./galleryDoor";
import { figureCorridor } from "./figureCorridor";
import { figureRush } from "./figureRush";
import { figureWall } from "./figureWall";
import { ratsScurry } from "./ratsScurry";
import { draftSheet } from "./draftSheet";
import { paDeadAir } from "./paDeadAir";
import { ventSigh } from "./ventSigh";
import { ductClang } from "./ductClang";
import { cableHangs } from "./cableHangs";
import { jacketDrapes } from "./jacketDrapes";
import { shaftGone } from "./shaftGone";
import { shadowMoves } from "./shadowMoves";
import { lightsBuzz } from "./lightsBuzz";
import { mopBucket } from "./mopBucket";
import { counterBell } from "./counterBell";
import { recordsVoice } from "./recordsVoice";
import { doorRattle } from "./doorRattle";
import { echoSteps } from "./echoSteps";
import { figureNorth } from "./figureNorth";
import { totemFallen } from "./totemFallen";
import { signFallen } from "./signFallen";
import { vendDispensed } from "./vendDispensed";
import { figureCorner } from "./figureCorner";
import { lockerTaps } from "./lockerTaps";
import { figureRecords } from "./figureRecords";
import { zoneSick } from "./zoneSick";
import { facePane } from "./facePane";
import { walkerLook } from "./walkerLook";
import { noticeFace } from "./noticeFace";
import { facePaneNorth } from "./facePaneNorth";
import { figureFountain } from "./figureFountain";
import { hornCrackle } from "./hornCrackle";
import { voiceNear } from "./voiceNear";
import { zonePulse } from "./zonePulse";
import { trofferSparks } from "./trofferSparks";
import { clockStopped } from "./clockStopped";
import { panelWires } from "./panelWires";
import { walkSilence } from "./walkSilence";
import { drainGurgles } from "./drainGurgles";
import { corridorBreathes } from "./corridorBreathes";
import { figureDoubles } from "./figureDoubles";
import { vendRebrand } from "./vendRebrand";
import { faceGlass } from "./faceGlass";
import { airlockDark } from "./airlockDark";
import { arrowExtra } from "./arrowExtra";
import { capLeaks } from "./capLeaks";
import { lightRed } from "./lightRed";
import { benchFlipped } from "./benchFlipped";
import { stripGrows } from "./stripGrows";
import { mullionExtra } from "./mullionExtra";
import { glassWriting } from "./glassWriting";
import { glassHands } from "./glassHands";
import { totemReversed } from "./totemReversed";
import { doorSlow } from "./doorSlow";
import { cabinetRows } from "./cabinetRows";
import { mullionMissing } from "./mullionMissing";
import { galleryLit } from "./galleryLit";
import { galleryDark } from "./galleryDark";
import { fanDead } from "./fanDead";
import { fanRacing } from "./fanRacing";
import { passStuck } from "./passStuck";
import { paneFace } from "./paneFace";
import { galleryOccupied } from "./galleryOccupied";
import { galleryMirror } from "./galleryMirror";
import { liftCalls } from "./liftCalls";
import { liftCar } from "./liftCar";
import { shaftOccupied } from "./shaftOccupied";
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
import { phoneRings } from "./phoneRings";
import { pitchSags } from "./pitchSags";
import { fountainRuns } from "./fountainRuns";
import { fountainBlood } from "./fountainBlood";
import { panelOpen } from "./panelOpen";
import { pilotDead } from "./pilotDead";
import { doorLit } from "./doorLit";
import { bucketTipped } from "./bucketTipped";
import { cabGone } from "./cabGone";
import { radLeaks } from "./radLeaks";
import { lockerAjar } from "./lockerAjar";
import { exitWrongway } from "./exitWrongway";
import { walkerFaceless } from "./walkerFaceless";
import { walkerSmile } from "./walkerSmile";
import { walkerEyeless } from "./walkerEyeless";
import { walkerCrawl } from "./walkerCrawl";
import { signLoop8 } from "./signLoop8";
import { signMirror } from "./signMirror";
import { guideShort } from "./guideShort";
import { radGone } from "./radGone";
import { lockersAll } from "./lockersAll";
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
import { totemGone } from "./totemGone";
import { arrowsGone } from "./arrowsGone";
import { cctvDrooped } from "./cctvDrooped";
import { phoneLit } from "./phoneLit";
import { exitSignGone } from "./exitSignGone";
import { intakeGone } from "./intakeGone";
import { bellGone } from "./bellGone";
import { noticeGone } from "./noticeGone";
import { walkerFast } from "./walkerFast";
import { walkerCharge } from "./walkerCharge";
import { walkerWait } from "./walkerWait";
import { ceilingCrack } from "./ceilingCrack";
import { ceilingWeeps } from "./ceilingWeeps";
import { floorFlood } from "./floorFlood";
import { lightsBlackout } from "./lightsBlackout";

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
  posterBacks,
  posterChanged,
  counterWorker,
  walkerBackwards,
  walkerStare,
  walkerMidstep,
  walkerOfflane,
  walkerHum,
  walkerDrop,
  walkerAbsent,
  fireOpen,
  posterSwapped,
  posterHollow,
  posterGrin,
  posterWatches,
  trofferFalls,
  signDrift,
  terminalGlitch,
  memoryPersist,
  lightDelay,
  routeReacts,
  sightlineImpossible,
  depthMismatch,
  clinicStaffed,
  corridorMirror,
  figureThreshold,
  corridorFlicker,
  walkerNotes,
  gauntletWatch,
  walkerFollow,
  lightCold,
  serviceStairwell,
  phoneDialtone,
  ventLoose,
  capLit,
  walkerPapers,
  corridorLong,
  stairFigure,
  staffDoorAjar,
  archivesOpen,
  archivesStaffed,
  archivesSlam,
  staffroomAjar,
  staffroomOccupied,
  lockerBanging,
  corridorNarrow,
  ventsCrawl,
  ductMouth,
  lobbyVoices,
  archivesDark,
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
  recordsFiled,
  galleryFrost,
  doorStuck,
  doorsOpen,
  doorsSlam,
  walkerCrowd,
  lightFollows,
  glassEyes,
  signWrongway,
  terminalBlack,
  binFlipped,
  hatchOpen,
  hatchKnocks,
  mapWrong,
  blindsOpen,
  rotaStamped,
  sheetsAdded,
  terminalAdvisory,
  phoneGone,
  hatchScratched,
  shadowFigure,
  bayOccupied,
  bayValve,
  egressReversed,
  egressGone,
  galleryDoor,
  figureCorridor,
  figureRush,
  figureWall,
  ratsScurry,
  draftSheet,
  paDeadAir,
  ventSigh,
  ductClang,
  cableHangs,
  jacketDrapes,
  shaftGone,
  shadowMoves,
  lightsBuzz,
  mopBucket,
  counterBell,
  recordsVoice,
  doorRattle,
  echoSteps,
  figureNorth,
  totemFallen,
  signFallen,
  vendDispensed,
  figureCorner,
  lockerTaps,
  figureRecords,
  zoneSick,
  facePane,
  walkerLook,
  noticeFace,
  facePaneNorth,
  figureFountain,
  hornCrackle,
  voiceNear,
  zonePulse,
  trofferSparks,
  clockStopped,
  panelWires,
  walkSilence,
  drainGurgles,
  corridorBreathes,
  figureDoubles,
  vendRebrand,
  faceGlass,
  airlockDark,
  arrowExtra,
  capLeaks,
  lightRed,
  benchFlipped,
  stripGrows,
  mullionExtra,
  glassWriting,
  glassHands,
  totemReversed,
  doorSlow,
  cabinetRows,
  mullionMissing,
  galleryLit,
  galleryDark,
  fanDead,
  fanRacing,
  passStuck,
  paneFace,
  galleryOccupied,
  galleryMirror,
  liftCalls,
  liftCar,
  shaftOccupied,
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
  phoneRings,
  pitchSags,
  fountainRuns,
  fountainBlood,
  panelOpen,
  pilotDead,
  doorLit,
  bucketTipped,
  cabGone,
  radLeaks,
  lockerAjar,
  exitWrongway,
  walkerFaceless,
  walkerSmile,
  walkerEyeless,
  walkerCrawl,
  signLoop8,
  signMirror,
  guideShort,
  radGone,
  lockersAll,
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
  totemGone,
  arrowsGone,
  cctvDrooped,
  phoneLit,
  exitSignGone,
  intakeGone,
  bellGone,
  noticeGone,
  walkerFast,
  walkerCharge,
  walkerWait,
  ceilingCrack,
  ceilingWeeps,
  floorFlood,
  lightsBlackout,
  vendDead,
  vendEmpty,
  sheetsCleared,
];
