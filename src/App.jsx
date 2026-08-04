import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Scene01 from "./scene/Scene01";
import CityBackdrop from "./scene/CityBackdrop";

function LoadingOverlay() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return <Html center><div className="loading-card"><span>Cargando estudio</span><strong>{Math.round(progress)}%</strong></div></Html>;
}

function CameraRig({ progressRef, pointerRef }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const p = progressRef.current;
    const pointer = pointerRef.current;
    const idleX = Math.sin(state.clock.elapsedTime * 0.12) * 0.014;
    const idleY = Math.sin(state.clock.elapsedTime * 0.09) * 0.009;

    desired.set(
      THREE.MathUtils.lerp(-6.7, -4.65, p) + pointer.x * 0.14 + idleX,
      THREE.MathUtils.lerp(2.85, 2.35, p) + pointer.y * 0.08 + idleY,
      THREE.MathUtils.lerp(7.25, 4.95, p),
    );

    camera.position.x = THREE.MathUtils.damp(camera.position.x, desired.x, 3.5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desired.y, 3.5, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desired.z, 3.5, delta);

    target.set(
      THREE.MathUtils.lerp(0.65, 1.75, p),
      THREE.MathUtils.lerp(1.55, 1.65, p),
      THREE.MathUtils.lerp(-2.0, -2.45, p),
    );
    camera.lookAt(target);
  });

  return null;
}

export default function App() {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });

  const setStoryProgress = (value) => {
    const next = THREE.MathUtils.clamp(value, 0, 1);
    progressRef.current = next;
    setProgress(next);
  };

  return (
    <main
      className="app-shell"
      onWheel={(event) => setStoryProgress(progressRef.current + event.deltaY * 0.0008)}
      onPointerMove={(event) => {
        pointerRef.current.x = event.clientX / window.innerWidth - 0.5;
        pointerRef.current.y = 0.5 - event.clientY / window.innerHeight;
      }}
    >
      <div className={`intro-copy${progress > 0.64 ? " is-visible" : ""}`}>
        <code>print(&quot;Hola Mundo&quot;)</code>
        <span>Hola Mundo</span>
      </div>

      <div className={`scroll-cue${progress > 0.08 ? " is-hidden" : ""}`}>
        <span>Desliza para entrar</span><i />
      </div>

      <Canvas
        camera={{ position: [-6.7, 2.85, 7.25], fov: 38, near: 0.1, far: 70 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.34 }}
        shadows
      >
        <color attach="background" args={["#07090d"]} />
        <fog attach="fog" args={["#0b1020", 11, 28]} />
        <Suspense fallback={null}>
          <CityBackdrop />
          <Scene01 />
        </Suspense>
        <LoadingOverlay />
        <CameraRig progressRef={progressRef} pointerRef={pointerRef} />
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.36} luminanceThreshold={0.72} luminanceSmoothing={0.44} mipmapBlur />
          <Noise opacity={0.0018} />
          <Vignette eskil={false} offset={0.06} darkness={0.16} />
        </EffectComposer>
      </Canvas>
    </main>
  );
}
