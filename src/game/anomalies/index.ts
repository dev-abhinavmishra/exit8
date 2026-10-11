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
import { posterMissing } from "./posterMissing";
import { doorAjar } from "./doorAjar";
import { watcherFar } from "./watcherFar";
import { airHaze } from "./airHaze";
import { machineRattle } from "./machineRattle";
import { clockWrongFace } from "./clockWrongFace";
import { propDisplaced } from "./propDisplaced";
import { machineSilence } from "./machineSilence";
import { shadowSourceless } from "./shadowSourceless";
import { clockSpins } from "./clockSpins";
import { footstepsAhead } from "./footstepsAhead";
import { doorBreathes } from "./doorBreathes";
import { totemSways } from "./totemSways";
import { cctvSleeps } from "./cctvSleeps";
import { ventGroan } from "./ventGroan";
import { posterBacks } from "./posterBacks";
import { counterWorker } from "./counterWorker";
import { walkerBackwards } from "./walkerBackwards";
import { walkerStare } from "./walkerStare";
import { walkerMidstep } from "./walkerMidstep";
import { walkerOfflane } from "./walkerOfflane";
import { walkerHum } from "./walkerHum";
import { walkerAbsent } from "./walkerAbsent";
import { walkerDrop } from "./walkerDrop";
import { fireOpen } from "./fireOpen";
import { posterHollow } from "./posterHollow";
import { posterGrin } from "./posterGrin";
import { posterWatches } from "./posterWatches";
import { trofferFalls } from "./trofferFalls";
import { signDrift } from "./signDrift";
import { terminalGlitch } from "./terminalGlitch";
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
import { paceDissolves } from "./paceDissolves";
import { guideMissing } from "./guideMissing";
import { guideMisaligned } from "./guideMisaligned";
import { watcherFollows } from "./watcherFollows";
import { clockMissing } from "./clockMissing";
import { binWanders } from "./binWanders";
import { benchMoved } from "./benchMoved";
import { airlockBreach } from "./airlockBreach";
import { tracksWet } from "./tracksWet";
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
import { terminalBlack } from "./terminalBlack";
import { hatchOpen } from "./hatchOpen";
import { hatchKnocks } from "./hatchKnocks";
import { mapWrong } from "./mapWrong";
import { blindsOpen } from "./blindsOpen";
import { rotaStamped } from "./rotaStamped";
import { terminalAdvisory } from "./terminalAdvisory";
import { phoneGone } from "./phoneGone";
import { hatchScratched } from "./hatchScratched";
import { shadowFigure } from "./shadowFigure";
import { bayOccupied } from "./bayOccupied";
import { bayValve } from "./bayValve";
import { egressGone } from "./egressGone";
import { galleryDoor } from "./galleryDoor";
import { figureCorridor } from "./figureCorridor";
import { figureRush } from "./figureRush";
import { figureWall } from "./figureWall";
import { ratsScurry } from "./ratsScurry";
import { paDeadAir } from "./paDeadAir";
import { ventSigh } from "./ventSigh";
import { ductClang } from "./ductClang";
import { cableHangs } from "./cableHangs";
import { jacketDrapes } from "./jacketDrapes";
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
import { facePaneNorth } from "./facePaneNorth";
import { figureFountain } from "./figureFountain";
import { voiceNear } from "./voiceNear";
import { zonePulse } from "./zonePulse";
import { trofferSparks } from "./trofferSparks";
import { clockStopped } from "./clockStopped";
import { panelWires } from "./panelWires";
import { drainGurgles } from "./drainGurgles";
import { corridorBreathes } from "./corridorBreathes";
import { figureDoubles } from "./figureDoubles";
import { faceGlass } from "./faceGlass";
import { airlockDark } from "./airlockDark";
import { capLeaks } from "./capLeaks";
import { lightRed } from "./lightRed";
import { benchFlipped } from "./benchFlipped";
import { stripGrows } from "./stripGrows";
import { glassWriting } from "./glassWriting";
import { glassHands } from "./glassHands";
import { totemReversed } from "./totemReversed";
import { doorSlow } from "./doorSlow";
import { cabinetRows } from "./cabinetRows";
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
import { aidGone } from "./aidGone";
import { phoneOffhook } from "./phoneOffhook";
import { phoneRings } from "./phoneRings";
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
import { cameraTracks } from "./cameraTracks";
import { lightsSurge } from "./lightsSurge";
import { washMirror } from "./washMirror";
import { tapRuns } from "./tapRuns";
import { stallOccupied } from "./stallOccupied";
import { dryerRuns } from "./dryerRuns";
import { pipeLeaks } from "./pipeLeaks";
import { valveOpen } from "./valveOpen";
import { drainBacked } from "./drainBacked";
import { creatureTall } from "./creatureTall";
import { floorBlood } from "./floorBlood";
import { washroomGore } from "./washroomGore";
import { walkerLong } from "./walkerLong";
import { gateOpen } from "./gateOpen";
import { wicketLit } from "./wicketLit";
import { gateKeeper } from "./gateKeeper";
import { wicketClosed } from "./wicketClosed";
import { shutterBreach } from "./shutterBreach";
import { supplyAjar } from "./supplyAjar";
import { supplyLit } from "./supplyLit";
import { supplyOpen } from "./supplyOpen";
import { supplyFigure } from "./supplyFigure";
import { supplyBare } from "./supplyBare";
import { supplyPlate } from "./supplyPlate";
import { pilasterGone } from "./pilasterGone";
import { pilasterExtra } from "./pilasterExtra";
import { pilasterScar } from "./pilasterScar";
import { pilasterFace } from "./pilasterFace";
import { pilasterGrime } from "./pilasterGrime";
import { clockLow } from "./clockLow";
import { clockSway } from "./clockSway";
import { clockFallen } from "./clockFallen";
import { clockDark } from "./clockDark";
import { clockDrip } from "./clockDrip";
import { svcPanelOpen } from "./svcPanelOpen";
import { ventBreath } from "./ventBreath";
import { stainGrown } from "./stainGrown";
import { hatchHand } from "./hatchHand";
import { jboxSevered } from "./jboxSevered";
import { corridorShudder } from "./corridorShudder";
import { corridorSteam } from "./corridorSteam";
import { corridorDust } from "./corridorDust";
import { corridorBreeze } from "./corridorBreeze";
import { corridorCold } from "./corridorCold";
import { platformTrain } from "./platformTrain";
import { platformSignal } from "./platformSignal";
import { platformFigure } from "./platformFigure";
import { platformGate } from "./platformGate";
import { platformWater } from "./platformWater";
import { corridorRat } from "./corridorRat";
import { corridorPuddle } from "./corridorPuddle";
import { corridorHiss } from "./corridorHiss";
import { corridorButt } from "./corridorButt";
import { corridorTag } from "./corridorTag";
import { corridorSlump } from "./corridorSlump";
import { corridorGrowl } from "./corridorGrowl";
import { corridorScrawl } from "./corridorScrawl";
import { corridorMud } from "./corridorMud";
import { exitSignBurn } from "./exitSignBurn";
import { corridorSweep } from "./corridorSweep";
import { corridorDrag } from "./corridorDrag";
import { corridorBreath } from "./corridorBreath";
import { corridorMark } from "./corridorMark";
import { corridorNest } from "./corridorNest";
import { corridorSpill } from "./corridorSpill";
import { patinaCrack } from "./patinaCrack";
import { patinaPatch } from "./patinaPatch";
import { patinaHalo } from "./patinaHalo";
import { patinaRust } from "./patinaRust";
import { patinaScratch } from "./patinaScratch";
import { commuterUpright } from "./commuterUpright";
import { commuterStare } from "./commuterStare";
import { commuterGonePaper } from "./commuterGonePaper";
import { commuterBench } from "./commuterBench";
import { commuterDown } from "./commuterDown";
import { boardDark } from "./boardDark";
import { boardNotin } from "./boardNotin";
import { boardFlick } from "./boardFlick";
import { boardTilt } from "./boardTilt";
import { boardGone } from "./boardGone";
import { walkerEyeless } from "./walkerEyeless";
import { walkerCrawl } from "./walkerCrawl";
import { signLoop8 } from "./signLoop8";
import { signMirror } from "./signMirror";
import { guideShort } from "./guideShort";
import { radGone } from "./radGone";
import { lockersAll } from "./lockersAll";
import { fountainGone } from "./fountainGone";
import { posterTilted } from "./posterTilted";
import { hatchGone } from "./hatchGone";
import { guideRed } from "./guideRed";
import { machineDead } from "./machineDead";
import { benchGone } from "./benchGone";
import { totemGone } from "./totemGone";
import { exitSignGone } from "./exitSignGone";
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
  posterMissing,
  doorAjar,
  watcherFar,
  airHaze,
  machineRattle,
  clockWrongFace,
  propDisplaced,
  machineSilence,
  shadowSourceless,
  clockSpins,
  footstepsAhead,
  doorBreathes,
  totemSways,
  cctvSleeps,
  ventGroan,
  posterBacks,
  counterWorker,
  walkerBackwards,
  walkerStare,
  walkerMidstep,
  walkerOfflane,
  walkerHum,
  walkerDrop,
  walkerAbsent,
  fireOpen,
  posterHollow,
  posterGrin,
  posterWatches,
  trofferFalls,
  signDrift,
  terminalGlitch,
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
  paceDissolves,
  guideMissing,
  guideMisaligned,
  watcherFollows,
  clockMissing,
  binWanders,
  benchMoved,
  airlockBreach,
  tracksWet,
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
  terminalBlack,
  hatchOpen,
  hatchKnocks,
  mapWrong,
  blindsOpen,
  rotaStamped,
  terminalAdvisory,
  phoneGone,
  hatchScratched,
  shadowFigure,
  bayOccupied,
  bayValve,
  egressGone,
  galleryDoor,
  figureCorridor,
  figureRush,
  figureWall,
  ratsScurry,
  paDeadAir,
  ventSigh,
  ductClang,
  cableHangs,
  jacketDrapes,
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
  facePaneNorth,
  figureFountain,
  voiceNear,
  zonePulse,
  trofferSparks,
  clockStopped,
  panelWires,
  drainGurgles,
  corridorBreathes,
  figureDoubles,
  faceGlass,
  airlockDark,
  capLeaks,
  lightRed,
  benchFlipped,
  stripGrows,
  glassWriting,
  glassHands,
  totemReversed,
  doorSlow,
  cabinetRows,
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
  aidGone,
  phoneOffhook,
  phoneRings,
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
  cameraTracks,
  lightsSurge,
  washMirror,
  tapRuns,
  stallOccupied,
  dryerRuns,
  pipeLeaks,
  valveOpen,
  drainBacked,
  creatureTall,
  floorBlood,
  washroomGore,
  walkerLong,
  gateOpen,
  wicketLit,
  gateKeeper,
  wicketClosed,
  shutterBreach,
  supplyAjar,
  supplyLit,
  supplyOpen,
  supplyFigure,
  supplyBare,
  supplyPlate,
  pilasterGone,
  pilasterExtra,
  pilasterScar,
  pilasterFace,
  pilasterGrime,
  clockLow,
  clockSway,
  clockFallen,
  clockDark,
  clockDrip,
  svcPanelOpen,
  ventBreath,
  stainGrown,
  hatchHand,
  jboxSevered,
  corridorShudder,
  corridorSteam,
  corridorDust,
  corridorBreeze,
  corridorCold,
  platformTrain,
  platformSignal,
  platformFigure,
  platformGate,
  platformWater,
  corridorRat,
  corridorPuddle,
  corridorHiss,
  corridorButt,
  corridorTag,
  corridorSlump,
  corridorGrowl,
  corridorScrawl,
  corridorMud,
  exitSignBurn,
  corridorSweep,
  corridorDrag,
  corridorBreath,
  corridorMark,
  corridorNest,
  corridorSpill,
  patinaCrack,
  patinaPatch,
  patinaHalo,
  patinaRust,
  patinaScratch,
  commuterUpright,
  commuterStare,
  commuterGonePaper,
  commuterBench,
  commuterDown,
  boardDark,
  boardNotin,
  boardFlick,
  boardTilt,
  boardGone,
  walkerEyeless,
  walkerCrawl,
  signLoop8,
  signMirror,
  guideShort,
  radGone,
  lockersAll,
  fountainGone,
  posterTilted,
  hatchGone,
  guideRed,
  machineDead,
  benchGone,
  totemGone,
  exitSignGone,
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
