import { Vector3 } from "three";

export function createChairMotion(laboratory, sourceChair) {
  if (!sourceChair) return { update() {}, reset() {} };
  sourceChair.updateWorldMatrix(true, false);
  laboratory.updateMatrixWorld(true);
  const origin = sourceChair.getWorldPosition(new Vector3());
  const parts = [];
  laboratory.traverse((object) => {
    if (!object.isMesh || !/^Silla/i.test(object.name)) return;
    parts.push({ object, position: object.position.clone(), worldPosition: object.getWorldPosition(new Vector3()) });
  });
  const displacement = new Vector3();
  const destination = new Vector3();

  return {
    update() {
      sourceChair.updateWorldMatrix(true, false);
      sourceChair.getWorldPosition(displacement).sub(origin);
      displacement.y = 0;
      parts.forEach(({ object, worldPosition }) => {
        destination.copy(worldPosition).add(displacement);
        object.position.copy(object.parent.worldToLocal(destination));
      });
    },
    reset() {
      parts.forEach(({ object, position }) => object.position.copy(position));
    },
  };
}
