import { ContactShadows, RoundedBox, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

const CHARACTER_URL = new URL(
  "../../Assets/Meshy_AI_T_Pose_Gym_Buddy_biped/Meshy_AI_T_Pose_Gym_Buddy_biped_Character_output.glb",
  import.meta.url,
).href;

function mat(color, roughness = 0.72, metalness = 0.05, emissive) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive: emissive ?? "#000000",
    emissiveIntensity: emissive ? 1.35 : 0,
  });
}

function Room() {
  const concrete = useMemo(() => mat("#262524", 0.92), []);
  const wood = useMemo(() => mat("#6b432b", 0.74), []);
  const black = useMemo(() => mat("#14171c", 0.58, 0.24), []);
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#15283f", roughness: 0.12, transmission: 0.2, transparent: true, opacity: 0.72 }), []);

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} material={wood}><planeGeometry args={[13.5, 9.5]} /></mesh>
      <mesh receiveShadow position={[0, 2.75, -4.45]} material={concrete}><boxGeometry args={[13.5, 5.5, 0.24]} /></mesh>
      <mesh receiveShadow position={[6.55, 2.75, -0.2]} material={concrete}><boxGeometry args={[0.22, 5.5, 8.5]} /></mesh>

      <group position={[-3.45, 2.55, -4.26]}>
        <mesh material={black}><boxGeometry args={[5.1, 4.05, 0.16]} /></mesh>
        <mesh position={[0, 0, 0.1]} material={glass}><planeGeometry args={[4.82, 3.76]} /></mesh>
        {[-1.6, 0, 1.6].map((x) => <mesh key={x} position={[x, 0, 0.2]} material={black}><boxGeometry args={[0.065, 3.76, 0.07]} /></mesh>)}
        <mesh position={[0, 0, 0.2]} material={black}><boxGeometry args={[4.82, 0.065, 0.07]} /></mesh>
      </group>

      <CityLights />
      <Shelf />
    </group>
  );
}

function CityLights() {
  const lights = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    x: -5.65 + (i % 10) * 0.53,
    y: 0.65 + Math.floor(i / 10) * 0.4,
    s: 0.018 + ((i * 13) % 5) * 0.006,
  })), []);

  return <group position={[0, 0, -4.12]}>{lights.map((item, i) => (
    <mesh key={i} position={[item.x, item.y, 0]}>
      <sphereGeometry args={[item.s, 8, 8]} />
      <meshBasicMaterial color={i % 5 === 0 ? "#ffc078" : "#8db8ff"} />
    </mesh>
  ))}</group>;
}

function Shelf() {
  const wood = useMemo(() => mat("#67402b", 0.68), []);
  const glow = useMemo(() => mat("#a976ff", 0.4, 0, "#7448ff"), []);

  return <group position={[2.25, 3.68, -4.08]}>
    <mesh material={wood}><boxGeometry args={[4.9, 0.14, 0.52]} /></mesh>
    <mesh position={[0, -0.14, 0.18]} material={glow}><boxGeometry args={[4.55, 0.035, 0.035]} /></mesh>
    {[-1.7, -0.95, -0.2, 0.58, 1.4].map((x, i) => <mesh key={x} position={[x, 0.22 + (i % 2) * 0.05, 0]} castShadow><boxGeometry args={[0.28, 0.42, 0.24]} /><meshStandardMaterial color={["#8fa7bd", "#bd8f8f", "#9b8fbd", "#8fbd9e", "#bda68f"][i]} roughness={0.72} /></mesh>)}
  </group>;
}

function Desk() {
  const wood = useMemo(() => mat("#71482f", 0.64), []);
  const metal = useMemo(() => mat("#121519", 0.42, 0.42), []);
  const screen = useMemo(() => mat("#89c8ff", 0.18, 0, "#3e82cc"), []);

  return <group position={[2.15, 0, -2.35]}>
    <RoundedBox args={[5.05, 0.18, 1.72]} radius={0.08} smoothness={4} position={[0, 1.12, 0]} material={wood} castShadow receiveShadow />
    {[-2.12, 2.12].map((x) => <mesh key={x} position={[x, 0.54, 0]} material={metal} castShadow><boxGeometry args={[0.16, 1.15, 1.32]} /></mesh>)}

    {[-1.03, 1.03].map((x, i) => <group key={x} position={[x, 2.0, -0.28]} rotation={[0, i === 0 ? 0.05 : -0.05, 0]}>
      <mesh material={metal} castShadow><boxGeometry args={[1.78, 1.02, 0.08]} /></mesh>
      <mesh position={[0, 0, 0.05]} material={screen}><planeGeometry args={[1.64, 0.88]} /></mesh>
      <mesh position={[0, -0.72, 0]} material={metal}><boxGeometry args={[0.12, 0.46, 0.1]} /></mesh>
    </group>)}

    <mesh position={[0, 1.26, 0.42]} material={metal}><boxGeometry args={[1.55, 0.035, 0.54]} /></mesh>
    <mesh position={[1.93, 0.73, -0.15]} material={metal}><boxGeometry args={[0.72, 1.42, 1.15]} /></mesh>
    <mesh position={[1.93, 0.73, 0.44]}><boxGeometry args={[0.5, 0.98, 0.035]} /><meshStandardMaterial color="#0c1320" emissive="#225cff" emissiveIntensity={1.4} /></mesh>
    <DeskLamp />
    <NeonSign />
  </group>;
}

function DeskLamp() {
  const metal = useMemo(() => mat("#171512", 0.4, 0.55), []);
  return <group position={[2.08, 1.22, -0.48]}>
    <mesh material={metal}><cylinderGeometry args={[0.2, 0.24, 0.08, 24]} /></mesh>
    <mesh position={[0, 0.57, 0]} rotation={[0, 0, -0.22]} material={metal}><cylinderGeometry args={[0.045, 0.045, 1.12, 16]} /></mesh>
    <mesh position={[-0.15, 1.12, 0]} rotation={[0, 0, 0.36]} material={metal}><coneGeometry args={[0.3, 0.44, 24, 1, true]} /></mesh>
    <pointLight castShadow position={[-0.3, 1.0, 0.08]} color="#ffc07a" intensity={14} distance={5.2} decay={2} />
  </group>;
}

function NeonSign() {
  const glow = useMemo(() => mat("#ffb15f", 0.35, 0, "#ff7a24"), []);
  return <group position={[3.25, 3.0, -4.0]} rotation={[0, 0, -0.02]}>
    <mesh rotation={[0, 0, 0.55]} position={[-0.3, 0, 0]} material={glow}><boxGeometry args={[0.55, 0.07, 0.07]} /></mesh>
    <mesh rotation={[0, 0, -0.55]} position={[-0.3, -0.28, 0]} material={glow}><boxGeometry args={[0.55, 0.07, 0.07]} /></mesh>
    <mesh rotation={[0, 0, -0.55]} position={[0.3, 0, 0]} material={glow}><boxGeometry args={[0.55, 0.07, 0.07]} /></mesh>
    <mesh rotation={[0, 0, 0.55]} position={[0.3, -0.28, 0]} material={glow}><boxGeometry args={[0.55, 0.07, 0.07]} /></mesh>
    <pointLight color="#ff8a3d" intensity={4.5} distance={3.6} />
  </group>;
}

function GymZone() {
  const metal = useMemo(() => mat("#15181b", 0.46, 0.5), []);
  const pad = useMemo(() => mat("#20252b", 0.62), []);
  const rubber = useMemo(() => mat("#121416", 0.92), []);

  return <group position={[-3.15, 0, -1.05]}>
    <mesh receiveShadow position={[0, 0.018, 0]} material={rubber}><boxGeometry args={[4.25, 0.035, 3.2]} /></mesh>
    <RoundedBox args={[2.15, 0.3, 0.78]} radius={0.1} smoothness={4} position={[-0.3, 0.58, 0.18]} material={pad} castShadow />
    <mesh position={[-1.04, 0.28, 0.18]} rotation={[0, 0, -0.18]} material={metal}><boxGeometry args={[0.12, 0.78, 0.12]} /></mesh>
    <mesh position={[0.45, 0.28, 0.18]} rotation={[0, 0, 0.18]} material={metal}><boxGeometry args={[0.12, 0.78, 0.12]} /></mesh>
    <BarbellRack />
    <Dumbbell position={[-1.2, 0.18, -0.9]} />
    <Dumbbell position={[-0.15, 0.18, -1.2]} scale={1.18} />
    <Dumbbell position={[0.95, 0.18, -0.85]} scale={0.92} />
  </group>;
}

function BarbellRack() {
  const metal = useMemo(() => mat("#14171a", 0.4, 0.55), []);
  return <group position={[-1.45, 0, 0.35]}>
    {[-0.72, 0.72].map((x) => <mesh key={x} position={[x, 1.05, 0]} material={metal}><boxGeometry args={[0.12, 2.1, 0.16]} /></mesh>)}
    <mesh position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]} material={metal}><cylinderGeometry args={[0.055, 0.055, 2.25, 18]} /></mesh>
    {[-1.2, 1.2].map((x) => <mesh key={x} position={[x, 1.55, 0]} rotation={[0, 0, Math.PI / 2]} material={metal}><cylinderGeometry args={[0.3, 0.3, 0.16, 22]} /></mesh>)}
  </group>;
}

function Dumbbell({ position, scale = 1 }) {
  const metal = useMemo(() => mat("#17191c", 0.42, 0.56), []);
  return <group position={position} scale={scale} rotation={[0, 0, 0.2]}>
    <mesh rotation={[0, 0, Math.PI / 2]} material={metal}><cylinderGeometry args={[0.055, 0.055, 0.55, 16]} /></mesh>
    {[-0.32, 0.32].map((x) => <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={metal}><cylinderGeometry args={[0.17, 0.17, 0.16, 16]} /></mesh>)}
  </group>;
}

function Chair() {
  const dark = useMemo(() => mat("#15191e", 0.5, 0.22), []);
  return <group position={[1.15, 0.78, -0.55]} rotation={[0, -0.08, 0]}>
    <RoundedBox args={[1.15, 0.22, 1.05]} radius={0.14} smoothness={4} material={dark} castShadow />
    <RoundedBox args={[1.08, 1.62, 0.26]} radius={0.15} smoothness={4} position={[0, 0.95, -0.42]} rotation={[-0.1, 0, 0]} material={dark} castShadow />
    <mesh position={[0, -0.58, 0]} material={dark}><cylinderGeometry args={[0.085, 0.085, 0.92, 16]} /></mesh>
  </group>;
}

function Character() {
  const { scene } = useGLTF(CHARACTER_URL);
  const clone = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    c.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  return <primitive object={clone} position={[1.12, 0.52, -0.5]} rotation={[0, Math.PI, 0]} scale={0.66} />;
}

function Lighting() {
  return <>
    <ambientLight intensity={0.42} color="#c4cfdf" />
    <hemisphereLight intensity={0.62} color="#91a9cf" groundColor="#241811" />
    <directionalLight castShadow position={[-3, 7, 5]} intensity={2.25} color="#b8c9ec" shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
    <pointLight position={[-3.3, 2.75, -3.5]} color="#6b8dff" intensity={5.8} distance={8} />
    <pointLight position={[2.0, 0.42, -2.15]} color="#6b52ff" intensity={2.8} distance={4.5} />
    <pointLight position={[1.35, 1.8, -1.1]} color="#ffb066" intensity={7.5} distance={5.5} />
    <rectAreaLight position={[1.4, 2.6, -3.4]} rotation={[0, Math.PI, 0]} width={4.8} height={2.1} intensity={3.4} color="#ffc48a" />
  </>;
}

export default function Scene01() {
  return <group position={[0, -0.02, 0]}>
    <Lighting />
    <Room />
    <Desk />
    <Chair />
    <Character />
    <GymZone />
    <ContactShadows position={[0, 0.02, 0]} opacity={0.5} scale={12.5} blur={2.5} far={8} />
  </group>;
}

useGLTF.preload(CHARACTER_URL);
