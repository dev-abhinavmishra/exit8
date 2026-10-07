/**
 * Inspection spot — the single shadow-capable light that rides with the
 * player on Medium+ tiers (the "inspection lamp" feel). Shadow budget is
 * enforced by quality tier: off on Low, on above.
 */
import { SpotLight } from "@babylonjs/core/Lights/spotLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import type { Scene } from "@babylonjs/core/scene";
import type { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
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
        // static world casts; player has no body
        for (const m of scene.meshes) {
          if (m.isVisible && m.isEnabled() && m.name.startsWith("wall.")) {
            rig.shadow.addShadowCaster(m, false);
          }
        }
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
        for (const m of scene.meshes) {
          if (m.isVisible && m.isEnabled() && m.name.startsWith("wall."))
            rig.shadow.addShadowCaster(m, false);
        }
      }
      spot.setEnabled(t.shadowMapSize > 0);
    },
  };
  rig.setTier(tier);
  return rig;
}
