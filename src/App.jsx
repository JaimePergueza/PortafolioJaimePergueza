import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Scene01 from "./scene/Scene01";
import CityBackdrop from "./scene/CityBackdrop";

const CAMERA_PRESETS = {
  desktop: {
    fov: 38,
    start: [-6.7, 2.85, 7.25],
    end: [-4.65, 2.35, 4.95],
    targetStart: [0.65, 1.55, -2.0],
    targetEnd: [1.75, 1.65, -2.45],
    pointerX: 0.14,
    pointerY: 0.08,
  },
  tablet: {
    fov: 43,
    start: [-6.15, 2.95, 8.55],
    end: [-4.45, 2.45, 6.05],
    targetStart: [0.5, 1.58, -2.05],
    targetEnd: [1.45, 1.64, -2.42],
    pointerX: 0.09,
    pointerY: 0.055,
  },
  mobile: {
    fov: 50,
    start: [-5.45, 3.0, 10.9],
    end: [-4.05, 2.5, 7.45],
    targetStart: [0.35, 1.58, -2.08],
    targetEnd: [1.12, 1.62, -2.38],
    pointerX: 0,
    pointerY: 0,
  },
};

function getDeviceMode() {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width <= 720) return "mobile";
  if (width <= 1100) return "tablet";
  return "desktop";
}

function useDeviceMode() {
  const [mode, setMode] = useState(getDeviceMode);

  useEffect(() => {
    const updateMode = () => setMode(getDeviceMode());
    window.addEventListener("resize", updateMode);
    window.addEventListener("orientationchange", updateMode);
    return () => {
      window.removeEventListener("resize", updateMode);
      window.removeEventListener("orientationchange", updateMode);
    };
  }, []);

  return mode;
}

function LoadingOverlay() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return <Html center><div className="loading-card"><span>Cargando estudio</span><strong>{Math.round(progress)}%</strong></div></Html>;
}

function CameraRig({ progressRef, pointerRef, deviceMode }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const preset = CAMERA_PRESETS[deviceMode];

  useEffect(() => {
    camera.fov = preset.fov;
    camera.updateProjectionMatrix();
  }, [camera, preset.fov]);

  useFrame((state, delta) => {
    const p = progressRef.current;
    const pointer = pointerRef.current;
    const idleX = deviceMode === "mobile" ? 0 : Math.sin(state.clock.elapsedTime * 0.12) * 0.014;
    const idleY = deviceMode === "mobile" ? 0 : Math.sin(state.clock.elapsedTime * 0.09) * 0.009;

    desired.set(
      THREE.MathUtils.lerp(preset.start[0], preset.end[0], p) + pointer.x * preset.pointerX + idleX,
      THREE.MathUtils.lerp(preset.start[1], preset.end[1], p) + pointer.y * preset.pointerY + idleY,
      THREE.MathUtils.lerp(preset.start[2], preset.end[2], p),
    );

    camera.position.x = THREE.MathUtils.damp(camera.position.x, desired.x, 3.5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desired.y, 3.5, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desired.z, 3.5, delta);

    target.set(
      THREE.MathUtils.lerp(preset.targetStart[0], preset.targetEnd[0], p),
      THREE.MathUtils.lerp(preset.targetStart[1], preset.targetEnd[1], p),
      THREE.MathUtils.lerp(preset.targetStart[2], preset.targetEnd[2], p),
    );
    camera.lookAt(target);
  });

  return null;
}

export default function App() {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const touchYRef = useRef(null);
  const deviceMode = useDeviceMode();
  const isMobile = deviceMode === "mobile";

  const setStoryProgress = (value) => {
    const next = THREE.MathUtils.clamp(value, 0, 1);
    progressRef.current = next;
    setProgress(next);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (["ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        setStoryProgress(progressRef.current + 0.12);
      }
      if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        setStoryProgress(progressRef.current - 0.12);
      }
      if (event.key === "Home") setStoryProgress(0);
      if (event.key === "End") setStoryProgress(1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main
      className={`app-shell is-${deviceMode}`}
      onWheel={(event) => setStoryProgress(progressRef.current + event.deltaY * 0.0008)}
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return;
        pointerRef.current.x = event.clientX / window.innerWidth - 0.5;
        pointerRef.current.y = 0.5 - event.clientY / window.innerHeight;
      }}
      onPointerLeave={() => {
        pointerRef.current.x = 0;
        pointerRef.current.y = 0;
      }}
      onTouchStart={(event) => {
        touchYRef.current = event.touches[0]?.clientY ?? null;
      }}
      onTouchMove={(event) => {
        const currentY = event.touches[0]?.clientY;
        if (currentY == null || touchYRef.current == null) return;
        const deltaY = touchYRef.current - currentY;
        touchYRef.current = currentY;
        setStoryProgress(progressRef.current + (deltaY / window.innerHeight) * 1.28);
      }}
      onTouchEnd={() => {
        touchYRef.current = null;
      }}
    >
      <div className={`intro-copy${progress > 0.64 ? " is-visible" : ""}`}>
        <code>print(&quot;Hola Mundo&quot;)</code>
        <span>Hola Mundo</span>
      </div>

      <div className={`scroll-cue${progress > 0.08 ? " is-hidden" : ""}`}>
        <span>{isMobile ? "Desliza hacia arriba" : "Desliza para entrar"}</span><i />
      </div>

      {isMobile && (
        <div className="mobile-progress" aria-hidden="true">
          <span style={{ transform: `scaleY(${Math.max(progress, 0.035)})` }} />
        </div>
      )}

      <Canvas
        camera={{
          position: CAMERA_PRESETS[deviceMode].start,
          fov: CAMERA_PRESETS[deviceMode].fov,
          near: 0.1,
          far: 70,
        }}
        dpr={isMobile ? [1, 1.2] : [1, 1.5]}
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
        <CameraRig progressRef={progressRef} pointerRef={pointerRef} deviceMode={deviceMode} />
        <EffectComposer multisampling={0}>
          <Bloom intensity={isMobile ? 0.28 : 0.36} luminanceThreshold={0.72} luminanceSmoothing={0.44} mipmapBlur />
          {!isMobile && <Noise opacity={0.0018} />}
          <Vignette eskil={false} offset={0.06} darkness={isMobile ? 0.1 : 0.16} />
        </EffectComposer>
      </Canvas>
    </main>
  );
}
