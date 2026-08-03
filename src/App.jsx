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
    const idleX = Math.sin(state.clock.elapsedTime * 0.12) * 0.035;
    const idleY = Math.sin(state.clock.elapsedTime * 0.09) * 0.02;

    desired.set(
      THREE.MathUtils.lerp(8.6, 6.25, p) + pointer.x * 0.3 + idleX,
      THREE.MathUtils.lerp(4.45, 3.05, p) + pointer.y * 0.18 + idleY,
      THREE.MathUtils.lerp(8.9, 6.2, p),
    );

    camera.position.x = THREE.MathUtils.damp(camera.position.x, desired.x, 3.8, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desired.y, 3.8, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desired.z, 3.8, delta);

    target.set(
      THREE.MathUtils.lerp(0.2, 0.95, p),
      THREE.MathUtils.lerp(1.7, 1.65, p),
      THREE.MathUtils.lerp(-1.0, -1.45, p),
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
      <div className={`intro-copy${progress > 0.55 ? " is-visible" : ""}`}>
        <code>print(&quot;Hola Mundo&quot;)</code>
        <span>Hola Mundo</span>
      </div>

      <div className={`scroll-cue${progress > 0.08 ? " is-hidden" : ""}`}>
        <span>Desliza para entrar</span><i />
      </div>

      <Canvas
        camera={{ position: [8.6, 4.45, 8.9], fov: 39, near: 0.1, far: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
        shadows
      >
        <color attach="background" args={["#07090d"]} />
        <fog attach="fog" args={["#090b10", 12, 25]} />
        <Suspense fallback={null}><Scene01 /></Suspense>
        <LoadingOverlay />
        <CameraRig progressRef={progressRef} pointerRef={pointerRef} />
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.48} luminanceThreshold={0.62} luminanceSmoothing={0.35} mipmapBlur />
          <Noise opacity={0.008} />
          <Vignette eskil={false} offset={0.18} darkness={0.42} />
        </EffectComposer>
      </Canvas>
    </main>
  );
}
