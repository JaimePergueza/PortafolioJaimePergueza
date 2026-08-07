import { Text, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import HOLA_MUNDO_STAGE_IMAGE from "../assets/holaMundoStageImage";

function clamp01(value) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function smoothRange(value, start, end) {
  const progress = clamp01((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function Box({ args, position = [0, 0, 0], rotation = [0, 0, 0], color = "#121722", metalness = 0.5, roughness = 0.45 }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

function StageLamp({ x, index, progressRef, deviceMode }) {
  const beamRef = useRef();
  const bulbRef = useRef();
  const pointRef = useRef();

  useFrame((state) => {
    const progress = progressRef.current;
    const reveal = smoothRange(progress, 0.615, 0.7);
    const particleShift = smoothRange(progress, 0.79, 0.9);
    const pulse = 0.88 + Math.sin(state.clock.elapsedTime * (1.25 + index * 0.08) + index) * 0.12;

    if (beamRef.current) {
      beamRef.current.material.opacity = reveal * (0.035 + index * 0.002) * pulse * (1 - particleShift * 0.25);
    }
    if (bulbRef.current) {
      bulbRef.current.material.opacity = reveal * (0.82 + pulse * 0.14);
    }
    if (pointRef.current) {
      pointRef.current.intensity = reveal * (deviceMode === "mobile" ? 1.4 : 2.2) * pulse;
    }
  });

  return (
    <group position={[x, 3.72, -0.25]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.34, 0.72, 24]} />
        <meshStandardMaterial color="#090c12" metalness={0.78} roughness={0.28} />
      </mesh>
      <mesh ref={bulbRef} position={[0, -0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 28]} />
        <meshBasicMaterial color="#dff2ff" opacity={0} toneMapped={false} transparent />
      </mesh>
      <mesh ref={beamRef} position={[0, -2.25, 0.04]}>
        <coneGeometry args={[0.72, 4.2, 28, 1, true]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color={index % 2 === 0 ? "#8ccfff" : "#9baaff"}
          depthWrite={false}
          opacity={0}
          side={THREE.DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
      <pointLight ref={pointRef} color={index % 2 === 0 ? "#bfe8ff" : "#c8c6ff"} distance={7} intensity={0} decay={2} position={[0, -0.5, 0.85]} />
    </group>
  );
}

function Truss() {
  const sections = useMemo(() => [-5.1, -3.4, -1.7, 0, 1.7, 3.4, 5.1], []);

  return (
    <group position={[0, 4.08, -0.55]}>
      <Box args={[11.6, 0.12, 0.12]} position={[0, 0.2, 0]} color="#0b0f16" metalness={0.82} roughness={0.25} />
      <Box args={[11.6, 0.12, 0.12]} position={[0, -0.2, 0]} color="#0b0f16" metalness={0.82} roughness={0.25} />
      {sections.map((x, index) => (
        <group key={x} position={[x, 0, 0]}>
          <Box args={[0.08, 0.5, 0.08]} color="#111722" metalness={0.8} roughness={0.26} />
          {index < sections.length - 1 && (
            <Box
              args={[1.72, 0.055, 0.055]}
              position={[0.84, 0, 0]}
              rotation={[0, 0, index % 2 === 0 ? 0.21 : -0.21]}
              color="#151b26"
              metalness={0.78}
              roughness={0.3}
            />
          )}
        </group>
      ))}
    </group>
  );
}

function SideLight({ side = 1, progressRef }) {
  const glowRef = useRef();
  const beamRef = useRef();

  useFrame(() => {
    const reveal = smoothRange(progressRef.current, 0.63, 0.72);
    if (glowRef.current) glowRef.current.material.opacity = reveal * 0.78;
    if (beamRef.current) beamRef.current.material.opacity = reveal * 0.045;
  });

  return (
    <group position={[side * 5.2, -0.35, 0.15]} rotation={[0, 0, side * -0.12]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.33, 0.42, 0.95, 24]} />
        <meshStandardMaterial color="#090c12" metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh ref={glowRef} position={[-side * 0.52, 0, 0]} rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
        <circleGeometry args={[0.27, 28]} />
        <meshBasicMaterial color={side > 0 ? "#ff79ee" : "#74cfff"} opacity={0} toneMapped={false} transparent />
      </mesh>
      <mesh ref={beamRef} position={[-side * 1.75, 0, 0]} rotation={[0, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2]}>
        <coneGeometry args={[0.95, 3.0, 24, 1, true]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color={side > 0 ? "#a53cff" : "#3d8fff"}
          depthWrite={false}
          opacity={0}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
    </group>
  );
}

export default function HelloWorldStage({ deviceMode, progress, progressRef }) {
  const referenceTexture = useTexture(HOLA_MUNDO_STAGE_IMAGE);
  const stageReveal = smoothRange(progress, 0.605, 0.69);
  const referenceFade = smoothRange(progress, 0.69, 0.82);
  const textReveal = smoothRange(progress, 0.67, 0.75);
  const particleTakeover = smoothRange(progress, 0.79, 0.87);
  const textOpacity = textReveal * (1 - particleTakeover);
  const referenceOpacity = stageReveal * THREE.MathUtils.lerp(0.94, 0.12, referenceFade);
  const stageScale = deviceMode === "mobile" ? 0.84 : deviceMode === "tablet" ? 0.93 : 1;

  useEffect(() => {
    referenceTexture.colorSpace = THREE.SRGBColorSpace;
    referenceTexture.anisotropy = 4;
    referenceTexture.needsUpdate = true;
  }, [referenceTexture]);

  return (
    <group scale={stageScale} visible={progress >= 0.59}>
      <ambientLight color="#18253d" intensity={stageReveal * 0.9} />
      <hemisphereLight color="#6a8fc5" groundColor="#06070c" intensity={stageReveal * 0.42} />

      <mesh position={[0, 0.05, -2.72]}>
        <planeGeometry args={[11.35, 6.38]} />
        <meshBasicMaterial
          map={referenceTexture}
          opacity={referenceOpacity}
          toneMapped={false}
          transparent
        />
      </mesh>

      <mesh position={[0, -3.18, -0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 9]} />
        <meshStandardMaterial color="#05070d" metalness={0.28} roughness={0.62} />
      </mesh>

      <mesh position={[0, -3.15, -0.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 5]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color="#35255b"
          opacity={stageReveal * 0.055}
          transparent
        />
      </mesh>

      <Truss />
      {[-4.25, -2.55, -0.85, 0.85, 2.55, 4.25].map((x, index) => (
        <StageLamp key={x} x={x} index={index} progressRef={progressRef} deviceMode={deviceMode} />
      ))}
      <SideLight side={-1} progressRef={progressRef} />
      <SideLight side={1} progressRef={progressRef} />

      <group position={[0, -0.03, -0.22]}>
        <Text
          position={[0, 1.1, 0]}
          fontSize={1.85}
          anchorX="center"
          anchorY="middle"
          color="#4ed8ff"
          fillOpacity={textOpacity}
          letterSpacing={-0.055}
          outlineColor="#1978ff"
          outlineOpacity={textOpacity * 0.72}
          outlineWidth={0.025}
          material-transparent
          material-toneMapped={false}
        >
          Hola
        </Text>
        <Text
          position={[0, -1.05, 0]}
          fontSize={1.9}
          anchorX="center"
          anchorY="middle"
          color="#b659ff"
          fillOpacity={textOpacity}
          letterSpacing={-0.055}
          outlineColor="#ff55ef"
          outlineOpacity={textOpacity * 0.62}
          outlineWidth={0.025}
          material-transparent
          material-toneMapped={false}
        >
          Mundo
        </Text>
      </group>

      <pointLight color="#356eff" distance={9} intensity={stageReveal * 2.8} position={[-3.8, -1.4, 1.4]} decay={2} />
      <pointLight color="#d23cff" distance={9} intensity={stageReveal * 2.5} position={[3.8, -1.5, 1.2]} decay={2} />
    </group>
  );
}
