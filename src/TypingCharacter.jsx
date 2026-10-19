import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { AnimationMixer, LoopRepeat } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { createChairMotion } from "./chairMotion";

const characterUrl = `${import.meta.env.BASE_URL}models/low_poly_man_working_at_a_table_with_a_laptop.glb`;

export const characterSettings = {
  position: [1.12, -0.05, -2.48],
  rotation: [0, Math.PI, 0],
  scale: 0.17,
};

export default function TypingCharacter({ active, laboratory }) {
  const { scene, animations } = useGLTF(characterUrl);
  const character = useMemo(() => {
    const instance = clone(scene);
    instance.traverse((object) => {
      if (!object.isMesh) return;
      let ancestor = object.parent;
      let belongsToCharacter = false;
      while (ancestor) {
        if (/^Armature/i.test(ancestor.name)) belongsToCharacter = true;
        ancestor = ancestor.parent;
      }
      object.visible = belongsToCharacter;
      object.castShadow = belongsToCharacter;
      object.receiveShadow = belongsToCharacter;
    });
    return instance;
  }, [scene]);
  const mixer = useMemo(() => new AnimationMixer(character), [character]);
  const playback = useMemo(() => ({ reduced: false, running: false }), []);
  const invalidate = useThree((state) => state.invalidate);
  const chairMotion = useRef(null);

  useEffect(() => {
    const clip = animations.find((animation) => animation.duration > 0);
    if (!clip) return;
    const action = mixer.clipAction(clip).setLoop(LoopRepeat, Infinity).reset().play();
    mixer.setTime(0);
    character.updateWorldMatrix(true, true);
    if (active) chairMotion.current = createChairMotion(laboratory, character.getObjectByName("chair_0"));
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      playback.reduced = preference.matches;
      playback.running = active;
      action.paused = preference.matches || !active;
      invalidate();
    };
    sync();
    preference.addEventListener("change", sync);
    return () => {
      preference.removeEventListener("change", sync);
      playback.running = false;
      chairMotion.current?.reset();
      chairMotion.current = null;
      mixer.stopAllAction();
      mixer.uncacheRoot(character);
    };
  }, [character, animations, mixer, playback, active, invalidate, laboratory]);

  useFrame((_, delta) => {
    if (!playback.running || playback.reduced || document.hidden) return;
    mixer.update(Math.min(delta, 1 / 15));
    chairMotion.current?.update();
    invalidate();
  });

  return (
    <group visible={active} position={characterSettings.position} rotation={characterSettings.rotation} scale={characterSettings.scale}>
      <primitive object={character} dispose={null} />
    </group>
  );
}
