import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Scene01 from "./scene/Scene01";

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
    const idleX = Math.sin(state.clock.elapsedTime * 0.12) * 0.025;
    const idleY = Math.sin(state.clock.elapsedTime * 0.09) * 0.015;

    desired.set(
      THREE.MathUtils.lerp(-8.4, -5.9, p) + pointer.x * 0.22 + idleX,
      THREE.MathUtils.lerp(3.55, 2.7, p) + pointer.y * 0.12 + idleY,
      THREE.MathUtils.lerp(7.8, 4.7, p),
    );

    camera.position.x = THREE.MathUtils.damp(camera.position.x, desired.x, 3.5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desired.y, 3.5, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desired.z, 3.5, delta);

    target.set(
      THREE.MathUtils.lerp(0.2, 1.2, p),
      THREE.MathUtils.lerp(1.55, 1.7, p),
      THREE.MathUtils.lerp(-1.65, -2.15, p),
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
      <div className={`intro-copy${progress > 0.62 ? " is-visible" : ""}`}>
        <code>print(&quot;Hola Mundo&quot;)</code>
        <span>Hola Mundo</span>
      </div>

      <div className={`scroll-cue${progress > 0.08 ? " is-hidden" : ""}`}>
        <span>Desliza para entrar</span><i />
      </div>

      <Canvas
        camera={{ position: [-8.4, 3.55, 7.8], fov: 43, near: 0.1, far: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        shadows
      >
        <color attach="background" args={["#090b10"]} />
        <fog attach="fog" args={["#090b10", 15, 29]} />
        <Suspense fallback={null}><Scene01 /></Suspense>
        <LoadingOverlay />
        <CameraRig progressRef={progressRef} pointerRef={pointerRef} />
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.34} luminanceThreshold={0.72} luminanceSmoothing={0.38} mipmapBlur />
          <Noise opacity={0.004} />
          <Vignette eskil={false} offset={0.12} darkness={0.28} />
        </EffectComposer>
      </Canvas>
    </main>
  );
}
