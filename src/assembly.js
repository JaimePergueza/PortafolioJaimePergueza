import gsap from "gsap";
import { Vector3 } from "three";

function assemblyStage(name) {
  if (/suelo|tabla|goma/i.test(name)) return 0;
  if (/ciudad|cielo/i.test(name)) return 1;
  if (/techo|pared.*reflejada|cuadro.*reflejado/i.test(name)) return 6;
  if (/muro|pared|hormigon|junta|fondo.panel|cube|liston|ventanal|cortina/i.test(name)) return 1;
  if (/escritorio|estante|banco|mancuernas.*balda|rack/i.test(name)) return 2;
  if (/pantalla|silla|pc|disco|cylinder|mancuerna/i.test(name)) return 3;
  if (/led|downlight|espejo/i.test(name)) return 5;
  return 4;
}

export function assembleScene({ scene, camera, cameraSettings, invalidate, onComplete }) {
  const originals = [];
  scene.traverse((object) => {
    if (!object.isMesh || object.isSkinnedMesh) return;
    originals.push({
      object,
      position: object.position.clone(),
      scale: object.scale.clone(),
      visible: object.visible,
      stage: assemblyStage(object.name),
    });
  });

  const finalPosition = new Vector3(...cameraSettings.position);
  const finalTarget = new Vector3(...cameraSettings.target);
  const overviewPosition = new Vector3(-6.8, 5.2, 7.4);
  const overviewTarget = new Vector3(0.1, 1.1, -1.8);
  const target = overviewTarget.clone();
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let finished = false;

  const restore = () => {
    originals.forEach(({ object, position, scale, visible }) => {
      object.position.copy(position);
      object.scale.copy(scale);
      object.visible = visible;
    });
    camera.position.copy(finalPosition);
    camera.lookAt(finalTarget);
    camera.updateMatrixWorld(true);
    invalidate();
  };

  if (motionPreference.matches) {
    restore();
    onComplete();
    return restore;
  }

  originals.forEach(({ object, position, scale, stage }) => {
    object.visible = false;
    const direction = position.x < 0 ? -1 : 1;
    object.position.set(position.x + (stage === 1 ? direction * 2.5 : direction * 0.4), position.y + (stage === 0 ? -1.2 : 2.4), position.z + (stage === 1 ? -0.8 : 0.5));
    object.scale.copy(scale).multiplyScalar(0.65);
  });
  camera.position.copy(overviewPosition);
  camera.lookAt(overviewTarget);
  camera.updateMatrixWorld(true);
  invalidate();

  const timeline = gsap.timeline({
    onUpdate: () => {
      camera.lookAt(target);
      camera.updateMatrixWorld(true);
      invalidate();
    },
    onComplete: () => {
      if (finished) return;
      finished = true;
      restore();
      onComplete();
    },
  });

  originals.forEach(({ object, position, scale, visible, stage }, index) => {
    const delay = stage === 6 ? 8.6 : 0.8 + stage * 0.85 + (index % 11) * 0.045;
    timeline.set(object, { visible }, delay);
    timeline.to(object.position, { x: position.x, y: position.y, z: position.z, duration: stage === 6 ? 0.45 : 1.25, ease: "power3.out" }, delay);
    timeline.to(object.scale, { x: scale.x, y: scale.y, z: scale.z, duration: stage === 6 ? 0.45 : 1.1, ease: "power2.out" }, delay);
  });
  timeline.to(camera.position, { x: finalPosition.x, y: finalPosition.y, z: finalPosition.z, duration: 2.5, ease: "power2.inOut" }, 6.1);
  timeline.to(target, { x: finalTarget.x, y: finalTarget.y, z: finalTarget.z, duration: 2.5, ease: "power2.inOut" }, 6.1);

  const finish = () => {
    if (motionPreference.matches) timeline.progress(1);
  };
  motionPreference.addEventListener("change", finish);

  return () => {
    timeline.kill();
    motionPreference.removeEventListener("change", finish);
    restore();
  };
}
