import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function clamp01(value) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function smoothRange(value, start, end) {
  const progress = clamp01((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function Box({ args, position = [0, 0, 0], rotation = [0, 0, 0], color = "#111621", metalness = 0.6, roughness = 0.38 }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

const BEAM_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BEAM_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    float x = abs(vUv.x - 0.5) * 2.0;
    float width = mix(0.95, 0.12, vUv.y);
    float softEdge = 1.0 - smoothstep(width * 0.58, width, x);
    float core = 1.0 - smoothstep(0.0, max(width * 0.48, 0.06), x);
    float verticalFade = pow(max(sin(vUv.y * 3.14159265), 0.0), 0.72);
    float alpha = (softEdge * 0.58 + core * 0.42) * verticalFade * uOpacity;

    gl_FragColor = vec4(uColor * (0.65 + core * 0.48), alpha);
  }
`;

const BACKDROP_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BACKDROP_FRAGMENT_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec3 color = vec3(0.006, 0.009, 0.017);

    vec2 leftDelta = uv - vec2(0.31, 0.30);
    vec2 rightDelta = uv - vec2(0.70, 0.28);
    float blueGlow = exp(-13.0 * dot(leftDelta, leftDelta));
    float violetGlow = exp(-13.5 * dot(rightDelta, rightDelta));

    color += vec3(0.010, 0.055, 0.12) * blueGlow;
    color += vec3(0.070, 0.016, 0.105) * violetGlow;

    float curtain = sin(uv.x * 76.0) * 0.004 + sin(uv.x * 31.0) * 0.003;
    color += curtain;

    vec2 centered = uv - 0.5;
    float vignette = smoothstep(0.22, 0.78, length(centered * vec2(1.05, 0.78)));
    color *= 1.0 - vignette * 0.62;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function Backdrop() {
  return (
    <group position={[0, 0.12, -2.35]}>
      <mesh>
        <planeGeometry args={[10.8, 6.2]} />
        <shaderMaterial vertexShader={BACKDROP_VERTEX_SHADER} fragmentShader={BACKDROP_FRAGMENT_SHADER} />
      </mesh>
      <Box args={[10.95, 0.18, 0.22]} position={[0, 3.06, 0.04]} color="#11151d" metalness={0.72} roughness={0.28} />
      <Box args={[0.10, 6.05, 0.10]} position={[-5.40, 0, 0.08]} color="#0a0e14" metalness={0.7} roughness={0.32} />
      <Box args={[0.10, 6.05, 0.10]} position={[5.40, 0, 0.08]} color="#0a0e14" metalness={0.7} roughness={0.32} />
    </group>
  );
}

function Truss() {
  const sections = useMemo(() => [-5.2, -3.47, -1.73, 0, 1.73, 3.47, 5.2], []);

  return (
    <group position={[0, 4.32, -0.75]}>
      <Box args={[11.4, 0.085, 0.085]} position={[0, 0.16, 0]} color="#0a0e15" metalness={0.84} roughness={0.22} />
      <Box args={[11.4, 0.085, 0.085]} position={[0, -0.16, 0]} color="#0a0e15" metalness={0.84} roughness={0.22} />
      {sections.map((x, index) => (
        <group key={x} position={[x, 0, 0]}>
          <Box args={[0.06, 0.42, 0.06]} color="#121823" metalness={0.82} roughness={0.24} />
          {index < sections.length - 1 && (
            <Box
              args={[1.76, 0.042, 0.042]}
              position={[0.86, 0, 0]}
              rotation={[0, 0, index % 2 === 0 ? 0.16 : -0.16]}
              color="#161d29"
              metalness={0.78}
              roughness={0.28}
            />
          )}
        </group>
      ))}
    </group>
  );
}

function SoftBeam({ x, index, progressRef }) {
  const materialRef = useRef();
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(index % 2 === 0 ? "#8bc9ff" : "#a8b6ff") },
      uOpacity: { value: 0 },
    }),
    [index],
  );

  useFrame((state) => {
    const reveal = smoothRange(progressRef.current, 0.625, 0.71);
    const particles = smoothRange(progressRef.current, 0.84, 0.93);
    const pulse = 0.92 + Math.sin(state.clock.elapsedTime * 1.15 + index * 0.7) * 0.08;
    if (materialRef.current) {
      materialRef.current.uniforms.uOpacity.value = reveal * (1 - particles * 0.35) * 0.18 * pulse;
    }
  });

  return (
    <mesh position={[x, 1.05, -0.52]} scale={[1.35, 5.1, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={BEAM_VERTEX_SHADER}
        fragmentShader={BEAM_FRAGMENT_SHADER}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
        transparent
      />
    </mesh>
  );
}

function StageLamp({ x, index, progressRef, deviceMode }) {
  const lensRef = useRef();
  const lightRef = useRef();

  useFrame((state) => {
    const reveal = smoothRange(progressRef.current, 0.615, 0.70);
    const pulse = 0.93 + Math.sin(state.clock.elapsedTime * (1.08 + index * 0.035) + index) * 0.07;

    if (lensRef.current) lensRef.current.material.opacity = reveal * 0.9 * pulse;
    if (lightRef.current) {
      lightRef.current.intensity = reveal * (deviceMode === "mobile" ? 12 : 20) * pulse;
    }
  });

  return (
    <group>
      <group position={[x, 3.82, 0.12]} rotation={[0.12, 0, index % 2 === 0 ? -0.025 : 0.025]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.30, 0.62, 24]} />
          <meshStandardMaterial color="#070a10" metalness={0.82} roughness={0.23} />
        </mesh>
        <mesh ref={lensRef} position={[0, -0.33, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.18, 28]} />
          <meshBasicMaterial color="#eff8ff" opacity={0} toneMapped={false} transparent />
        </mesh>
      </group>
      <spotLight
        ref={lightRef}
        position={[x, 3.55, 1.35]}
        color={index % 2 === 0 ? "#b8dcff" : "#d4d1ff"}
        intensity={0}
        angle={0.25}
        penumbra={0.92}
        distance={10}
        decay={2}
      />
      <SoftBeam x={x} index={index} progressRef={progressRef} />
    </group>
  );
}

function FloorGlow({ x, color, progressRef }) {
  const materialRef = useRef();

  useFrame(() => {
    const reveal = smoothRange(progressRef.current, 0.64, 0.73);
    if (materialRef.current) materialRef.current.opacity = reveal * 0.12;
  });

  return (
    <mesh position={[x, -3.135, 0.4]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.2, 1.1, 1]}>
      <circleGeometry args={[1, 48]} />
      <meshBasicMaterial
        ref={materialRef}
        blending={THREE.AdditiveBlending}
        color={color}
        depthWrite={false}
        opacity={0}
        toneMapped={false}
        transparent
      />
    </mesh>
  );
}

export default function HelloWorldStage({ deviceMode, progress, progressRef }) {
  const stageReveal = smoothRange(progress, 0.605, 0.69);
  const stageScale = deviceMode === "mobile" ? 0.78 : deviceMode === "tablet" ? 0.92 : 1;
  const lampPositions = deviceMode === "mobile"
    ? [-3.45, -1.72, 0, 1.72, 3.45]
    : [-4.2, -2.52, -0.84, 0.84, 2.52, 4.2];

  return (
    <group scale={stageScale} visible={progress >= 0.59}>
      <ambientLight color="#0c1628" intensity={stageReveal * 0.24} />
      <hemisphereLight color="#35547d" groundColor="#020307" intensity={stageReveal * 0.24} />

      <Backdrop />

      <mesh position={[0, -3.18, 0.15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15, 10]} />
        <meshStandardMaterial color="#04060b" metalness={0.46} roughness={0.36} />
      </mesh>

      <FloorGlow x={-2.1} color="#1b72ff" progressRef={progressRef} />
      <FloorGlow x={2.05} color="#b236ff" progressRef={progressRef} />

      <Truss />
      {lampPositions.map((x, index) => (
        <StageLamp key={x} x={x} index={index} progressRef={progressRef} deviceMode={deviceMode} />
      ))}

      <pointLight color="#287dff" distance={8} intensity={stageReveal * 3.2} position={[-3.2, -1.55, 1.8]} decay={2} />
      <pointLight color="#b43cff" distance={8} intensity={stageReveal * 2.7} position={[3.1, -1.45, 1.65]} decay={2} />
    </group>
  );
}
