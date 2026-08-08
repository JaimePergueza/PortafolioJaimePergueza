import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

function Box({ args, position = [0, 0, 0], rotation = [0, 0, 0], color, roughness = 0.6, metalness = 0.2, castShadow = true, receiveShadow = true }) {
  return (
    <mesh position={position} rotation={rotation} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

function Bolt({ position, rotation = [0, Math.PI / 2, 0] }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[0.035, 0.035, 0.018, 20]} />
      <meshStandardMaterial color="#747b84" roughness={0.28} metalness={0.92} />
    </mesh>
  );
}

function JHook({ x }) {
  return (
    <group position={[x, 1.47, -0.54]}>
      <Box args={[0.24, 0.09, 0.2]} position={[0, 0, 0.07]} color="#262b31" roughness={0.48} metalness={0.5} />
      <Box args={[0.08, 0.23, 0.2]} position={[x < 0 ? -0.08 : 0.08, 0.08, 0.07]} color="#262b31" roughness={0.48} metalness={0.5} />
      <Box args={[0.18, 0.025, 0.17]} position={[0, 0.052, 0.075]} color="#252525" roughness={0.9} metalness={0.02} />
      <Bolt position={[x < 0 ? 0.125 : -0.125, -0.005, 0.08]} />
    </group>
  );
}

function WeightPlate({ x, radius = 0.285, thickness = 0.085 }) {
  const darkRubber = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#141619", roughness: 0.82, metalness: 0.08 }),
    [],
  );

  return (
    <group position={[x, 1.55, -0.54]}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={darkRubber} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, thickness, 48]} />
      </mesh>
      <mesh position={[x < 0 ? -thickness / 2 - 0.004 : thickness / 2 + 0.004, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.012, 28]} />
        <meshStandardMaterial color="#747b84" roughness={0.24} metalness={0.9} />
      </mesh>
    </group>
  );
}

function Barbell() {
  const chrome = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#b7bec7", roughness: 0.2, metalness: 0.96 }),
    [],
  );

  return (
    <group>
      <mesh position={[0, 1.55, -0.54]} rotation={[0, 0, Math.PI / 2]} material={chrome} castShadow receiveShadow>
        <cylinderGeometry args={[0.035, 0.035, 3.35, 36]} />
      </mesh>

      {[-1.24, 1.24].map((x) => (
        <mesh key={`sleeve-${x}`} position={[x, 1.55, -0.54]} rotation={[0, 0, Math.PI / 2]} material={chrome} castShadow>
          <cylinderGeometry args={[0.052, 0.052, 0.42, 32]} />
        </mesh>
      ))}

      {[-0.58, 0.58].map((x) => (
        <mesh key={`ring-${x}`} position={[x, 1.55, -0.54]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.039, 0.039, 0.018, 24]} />
          <meshStandardMaterial color="#6f7781" roughness={0.25} metalness={0.9} />
        </mesh>
      ))}

      <WeightPlate x={-1.18} radius={0.285} thickness={0.085} />
      <WeightPlate x={-1.285} radius={0.255} thickness={0.075} />
      <WeightPlate x={-1.38} radius={0.22} thickness={0.065} />
      <WeightPlate x={1.18} radius={0.285} thickness={0.085} />
      <WeightPlate x={1.285} radius={0.255} thickness={0.075} />
      <WeightPlate x={1.38} radius={0.22} thickness={0.065} />

      {[-1.475, 1.475].map((x) => (
        <mesh key={`collar-${x}`} position={[x, 1.55, -0.54]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.072, 0.072, 0.055, 28]} />
          <meshStandardMaterial color="#59616a" roughness={0.3} metalness={0.84} />
        </mesh>
      ))}
    </group>
  );
}

function Rack() {
  const frame = "#1c2025";
  return (
    <group>
      {[-0.86, 0.86].map((x) => (
        <group key={x}>
          <Box args={[0.14, 1.65, 0.16]} position={[x, 0.88, -0.56]} color={frame} roughness={0.48} metalness={0.5} />
          <Box args={[0.72, 0.12, 0.68]} position={[x, 0.08, -0.46]} color={frame} roughness={0.5} metalness={0.46} />
          <Box args={[0.1, 0.72, 0.11]} position={[x, 0.39, -0.18]} rotation={[-0.58, 0, 0]} color={frame} roughness={0.5} metalness={0.46} />
          {[0.72, 0.95, 1.18, 1.41].map((y) => (
            <Bolt key={`${x}-${y}`} position={[x + (x < 0 ? 0.08 : -0.08), y, -0.48]} />
          ))}
        </group>
      ))}

      <Box args={[1.86, 0.1, 0.12]} position={[0, 0.14, -0.82]} color={frame} roughness={0.5} metalness={0.46} />
      <JHook x={-0.86} />
      <JHook x={0.86} />
    </group>
  );
}

function Bench() {
  const vinyl = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#101114", roughness: 0.72, metalness: 0.04 }),
    [],
  );

  return (
    <group>
      <RoundedBox args={[0.52, 0.14, 2.05]} radius={0.08} smoothness={5} position={[0, 0.48, 0.34]} material={vinyl} castShadow receiveShadow />
      <Box args={[0.12, 0.12, 1.55]} position={[0, 0.31, 0.37]} color="#20242a" roughness={0.52} metalness={0.46} />
      <Box args={[0.1, 0.55, 0.1]} position={[0, 0.24, -0.22]} color="#20242a" roughness={0.52} metalness={0.46} />
      <Box args={[0.1, 0.55, 0.1]} position={[0, 0.24, 1.03]} color="#20242a" roughness={0.52} metalness={0.46} />
      <Box args={[0.78, 0.1, 0.16]} position={[0, 0.07, -0.22]} color="#20242a" roughness={0.52} metalness={0.46} />
      <Box args={[0.78, 0.1, 0.16]} position={[0, 0.07, 1.03]} color="#20242a" roughness={0.52} metalness={0.46} />
      <Bolt position={[0.08, 0.31, -0.22]} />
      <Bolt position={[0.08, 0.31, 1.03]} />
    </group>
  );
}

export default function BenchPressStation() {
  return (
    <group position={[-3.55, 0, -1.05]} scale={0.92}>
      <mesh position={[0, 0.045, 0.15]} receiveShadow>
        <boxGeometry args={[3.45, 0.08, 3.0]} />
        <meshStandardMaterial color="#0f1114" roughness={0.96} metalness={0.02} />
      </mesh>

      <Box args={[3.1, 0.025, 0.025]} position={[0, 0.095, 1.58]} color="#477fb5" roughness={0.42} metalness={0.12} castShadow={false} />
      <Box args={[3.1, 0.025, 0.025]} position={[0, 0.095, -1.28]} color="#477fb5" roughness={0.42} metalness={0.12} castShadow={false} />

      <Rack />
      <Bench />
      <Barbell />

      <rectAreaLight position={[0, 2.45, 0.15]} rotation={[-Math.PI / 2, 0, 0]} width={3.0} height={1.45} intensity={3.8} color="#a9c9f2" />
      <pointLight position={[-1.55, 1.35, 0.55]} color="#7aa8df" intensity={1.7} distance={4.2} decay={2} />
      <pointLight position={[1.3, 0.72, 0.85]} color="#d6e5f7" intensity={0.65} distance={2.8} decay={2} />
    </group>
  );
}
