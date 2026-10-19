export const plantMotionSettings = {
  amplitude: 0.018,
  speed: 0.85,
  framesPerSecond: 20,
};

export function animatePlants(scene, invalidate) {
  const leaves = [];
  scene.traverse((object) => {
    if (!object.isMesh || !/hoja|enredadera/i.test(object.name)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (!materials.some((material) => /follaje/i.test(material.name))) return;
    const original = object.geometry;
    const geometry = original.clone();
    geometry.computeBoundingBox();
    const positions = geometry.getAttribute("position");
    const rest = positions.array.slice();
    const bounds = geometry.boundingBox;
    const height = Math.max(bounds.max.y - bounds.min.y, 0.001);
    const hanging = /enredadera/i.test(object.name);
    const weights = Array.from({ length: positions.count }, (_, index) => {
      const heightRatio = (positions.getY(index) - bounds.min.y) / height;
      return Math.pow(hanging ? 1 - heightRatio : heightRatio, 1.5);
    });
    object.geometry = geometry;
    leaves.push({ object, original, geometry, positions, rest, weights, phase: leaves.length * 0.73 });
  });

  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const frameDuration = 1000 / plantMotionSettings.framesPerSecond;
  let elapsed = 0;

  const reset = () => {
    leaves.forEach(({ geometry, positions, rest }) => {
      positions.array.set(rest);
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    });
    invalidate();
  };

  const timer = window.setInterval(() => {
    if (document.hidden || preference.matches || !leaves.length) return;
    elapsed += frameDuration / 1000;
    const fade = Math.min(elapsed / 1.5, 1);
    leaves.forEach(({ geometry, positions, rest, weights, phase }) => {
      const wind = elapsed * plantMotionSettings.speed;
      weights.forEach((weight, index) => {
        const offset = index * positions.itemSize;
        const amplitude = plantMotionSettings.amplitude * weight * fade;
        positions.setXYZ(index,
          rest[offset] + Math.sin(wind + phase) * amplitude,
          rest[offset + 1],
          rest[offset + 2] + Math.sin(wind * 0.7 + phase) * amplitude * 0.55,
        );
      });
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    });
    invalidate();
  }, frameDuration);
  preference.addEventListener("change", reset);

  return () => {
    window.clearInterval(timer);
    preference.removeEventListener("change", reset);
    leaves.forEach(({ object, original, geometry }) => {
      object.geometry = original;
      geometry.dispose();
    });
    invalidate();
  };
}
