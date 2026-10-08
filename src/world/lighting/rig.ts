/**
 * Inspection spot — the single shadow-capable light that rides with the
 * player on Medium+ tiers (the "inspection lamp" feel). Shadow budget is
 * enforced by quality tier: off on Low, on above.
 */
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Scene } from "@babylonjs/core/scene";
import type { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { TierSpec } from "../../engine/quality";

export interface InspectionRig {
  spot: SpotLight;
  shadow: ShadowGenerator | null;
  update(): void;
  setTier(tier: TierSpec): void;
}

export function buildInspectionRig(scene: Scene, camera: FreeCamera, tier: TierSpec): InspectionRig {
  const spot = new SpotLight(
    "light.inspection",
    camera.position.clone(),
    camera.getForwardRay().direction.clone(),
    Math.PI / 2.6,
    4,
    scene,
  );
  spot.diffuse.set(0.9, 0.88, 0.82);
  spot.intensity = 5;
  spot.range = 16;
  spot.falloffType = SpotLight.FALLOFF_PHYSICAL;

  const shadow: ShadowGenerator | null = null;
  // Caster set: walls + figure parts + the big free-standing props.
  // Figure parts make the inspector/watcher/anomaly silhouettes throw
  // real shadows under the lamp — the blob stays as their ground AO.
  const FIG_PARTS = [
    ".leg.",
    ".shoe.",
    ".sleeve.",
    ".hand.",
    ".coat.",
    ".chest",
    ".shoulders",
    ".head",
    ".hair",
    ".skull",
    ".brim",
  ];
  const PROP_PREFIXES = [
    "bench.",
    "bin",
    "prop.vend.",
    "prop.fountain.",
    "junction.machine",
    "sign.totem.",
    "dress.caution.",
  ];
  const isCaster = (n: string) =>
    n.startsWith("wall.") ||
    FIG_PARTS.some((p) => n.includes(p)) ||
    PROP_PREFIXES.some((p) => n.startsWith(p));
  const addCaster = (m: AbstractMesh): void => {
    const g = rig.shadow;
    if (!g) return;
    if (m.isVisible && m.isEnabled() && isCaster(m.name)) g.addShadowCaster(m, false);
  };
  const fillCasters = (): void => {
    for (const m of scene.meshes) addCaster(m);
  };
  // anomaly figures spawn after the map exists — new parts self-register
  scene.onNewMeshAddedObservable.add((m) => addCaster(m));
  const rig: InspectionRig = {
    spot,
    shadow,
    update() {
      spot.position = camera.position.clone();
      const fwd = camera.getForwardRay().direction;
      spot.direction = fwd.clone();
    },
    setTier(t: TierSpec) {
      if (t.shadowMapSize > 0 && !rig.shadow) {
        rig.shadow = new ShadowGenerator(t.shadowMapSize, spot);
        rig.shadow.bias = 0.0004;
        rig.shadow.darkness = 0.35;
        fillCasters();
        rig.shadow.useContactHardeningShadow = false;
      } else if (t.shadowMapSize === 0 && rig.shadow) {
        rig.shadow.dispose();
        rig.shadow = null;
      } else if (
        rig.shadow &&
        rig.shadow.getShadowMap() &&
        rig.shadow.getShadowMap()!.getSize().width !== t.shadowMapSize
      ) {
        rig.shadow.dispose();
        rig.shadow = new ShadowGenerator(t.shadowMapSize, spot);
        rig.shadow.bias = 0.0004;
        fillCasters();
      }
      spot.setEnabled(t.shadowMapSize > 0);
    },
  };
  rig.setTier(tier);
  return rig;
}
