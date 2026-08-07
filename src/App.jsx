import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Scene01 from "./scene/Scene01";
import CityBackdrop from "./scene/CityBackdrop";
import ParticleTextScene from "./scene/ParticleTextScene";

const CAMERA_PRESETS = {
  desktop: {
    fov: 39,
    monitorFov: 33,
    particleFov: 42,
    studioStart: [-5.15, 2.72, 6.15],
    studioApproach: [-3.25, 2.38, 3.25],
    monitorNear: [0.62, 2.1, -0.25],
    monitorInside: [0.89, 2.02, -1.78],
    particleCamera: [0, 0.05, 8.2],
    targetStart: [0.75, 1.55, -2.05],
    targetApproach: [0.98, 1.88, -2.52],
    monitorTarget: [0.98, 2.0, -2.57],
    pointerX: 0.14,
    pointerY: 0.08,
  },
  tablet: {
    fov: 43,
    monitorFov: 35,
    particleFov: 44,
    studioStart: [-5.0, 2.8, 7.1],
    studioApproach: [-3.5, 2.45, 4.05],
    monitorNear: [0.58, 2.1, 0.05],
    monitorInside: [0.88, 2.02, -1.6],
    particleCamera: [0, 0.05, 9.5],
    targetStart: [0.58, 1.58, -2.05],
    targetApproach: [0.96, 1.88, -2.5],
    monitorTarget: [0.98, 2.0, -2.57],
    pointerX: 0.09,
    pointerY: 0.055,
  },
  mobile: {
    fov: 49,
    monitorFov: 39,
    particleFov: 48,
    studioStart: [-4.7, 2.85, 8.7],
    studioApproach: [-3.0, 2.55, 5.4],
    monitorNear: [0.56, 2.12, 0.55],
    monitorInside: [0.88, 2.03, -1.25],
    particleCamera: [0, 0.05, 14.2],
    targetStart: [0.42, 1.58, -2.08],
    targetApproach: [0.92, 1.86, -2.48],
    monitorTarget: [0.98, 2.0, -2.57],
    pointerX: 0,
    pointerY: 0,
  },
};

function clamp01(value) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function smoothRange(value, start, end) {
  const progress = clamp01((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function lerpVector(output, start, end, progress) {
  output.set(
    THREE.MathUtils.lerp(start[0], end[0], progress),
    THREE.MathUtils.lerp(start[1], end[1], progress),
    THREE.MathUtils.lerp(start[2], end[2], progress),
  );
}

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
  const particleModeRef = useRef(false);
  const preset = CAMERA_PRESETS[deviceMode];

  useEffect(() => {
    camera.fov = preset.fov;
    camera.updateProjectionMatrix();
  }, [camera, preset.fov]);

  useFrame((state, delta) => {
    const p = progressRef.current;
    const pointer = pointerRef.current;
    const isParticleMode = p >= 0.575;
    let desiredFov = preset.fov;

    if (p < 0.34) {
      const approach = smoothRange(p, 0, 0.34);
      lerpVector(desired, preset.studioStart, preset.studioApproach, approach);
      lerpVector(target, preset.targetStart, preset.targetApproach, approach);
    } else if (p < 0.5) {
      const monitorApproach = smoothRange(p, 0.34, 0.5);
      lerpVector(desired, preset.studioApproach, preset.monitorNear, monitorApproach);
      lerpVector(target, preset.targetApproach, preset.monitorTarget, monitorApproach);
      desiredFov = THREE.MathUtils.lerp(preset.fov, preset.monitorFov, monitorApproach);
    } else if (!isParticleMode) {
      const screenDive = smoothRange(p, 0.5, 0.575);
      lerpVector(desired, preset.monitorNear, preset.monitorInside, screenDive);
      target.set(...preset.monitorTarget);
      desiredFov = THREE.MathUtils.lerp(preset.monitorFov, preset.monitorFov - 5, screenDive);
    } else {
      const particleDrift = smoothRange(p, 0.66, 0.86);
      desired.set(
        preset.particleCamera[0],
        preset.particleCamera[1],
        preset.particleCamera[2] - particleDrift * (deviceMode === "mobile" ? 0.45 : 0.32),
      );
      target.set(0, 0, 0);
      desiredFov = preset.particleFov;
    }

    const studioParallax = 1 - smoothRange(p, 0.2, 0.44);
    if (!isParticleMode && studioParallax > 0) {
      const idleX = deviceMode === "mobile" ? 0 : Math.sin(state.clock.elapsedTime * 0.12) * 0.014;
      const idleY = deviceMode === "mobile" ? 0 : Math.sin(state.clock.elapsedTime * 0.09) * 0.009;
      desired.x += (pointer.active ? pointer.x * preset.pointerX : 0) * studioParallax + idleX;
      desired.y += (pointer.active ? pointer.y * preset.pointerY : 0) * studioParallax + idleY;
    }

    if (particleModeRef.current !== isParticleMode) {
      camera.position.copy(desired);
      camera.fov = desiredFov;
      camera.updateProjectionMatrix();
      particleModeRef.current = isParticleMode;
    }

    camera.position.x = THREE.MathUtils.damp(camera.position.x, desired.x, 3.5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desired.y, 3.5, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desired.z, 3.5, delta);
    const nextFov = THREE.MathUtils.damp(camera.fov, desiredFov, 5, delta);
    if (Math.abs(camera.fov - nextFov) > 0.0001) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(target);
  });

  return null;
}

export default function App() {
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const pointerRef = useRef({ active: false, x: 0, y: 0 });
  const touchYRef = useRef(null);
  const deviceMode = useDeviceMode();
  const isMobile = deviceMode === "mobile";
  const transitionOpacity = progress < 0.575
    ? smoothRange(progress, 0.47, 0.555)
    : 1 - smoothRange(progress, 0.585, 0.66);
  const storyStage = progress < 0.34
    ? "studio"
    : progress < 0.575
      ? "monitor"
      : progress < 0.86
        ? "particles"
        : "explosion";

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
      aria-label="Introducción interactiva del portafolio de Jaime Pergueza"
      className={`app-shell is-${deviceMode} stage-${storyStage}`}
      data-story-progress={progress.toFixed(3)}
      data-story-stage={storyStage}
      onWheel={(event) => setStoryProgress(progressRef.current + event.deltaY * 0.0008)}
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return;
        pointerRef.current.active = true;
        pointerRef.current.x = event.clientX / window.innerWidth - 0.5;
        pointerRef.current.y = 0.5 - event.clientY / window.innerHeight;
      }}
      onPointerLeave={() => {
        pointerRef.current.active = false;
        pointerRef.current.x = 0;
        pointerRef.current.y = 0;
      }}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        touchYRef.current = touch?.clientY ?? null;
        if (!touch) return;
        pointerRef.current.active = true;
        pointerRef.current.x = touch.clientX / window.innerWidth - 0.5;
        pointerRef.current.y = 0.5 - touch.clientY / window.innerHeight;
      }}
      onTouchMove={(event) => {
        const touch = event.touches[0];
        const currentY = touch?.clientY;
        if (currentY == null || touchYRef.current == null) return;
        const deltaY = touchYRef.current - currentY;
        touchYRef.current = currentY;
        pointerRef.current.x = touch.clientX / window.innerWidth - 0.5;
        pointerRef.current.y = 0.5 - touch.clientY / window.innerHeight;
        setStoryProgress(progressRef.current + (deltaY / window.innerHeight) * 1.28);
      }}
      onTouchEnd={() => {
        touchYRef.current = null;
        pointerRef.current.active = false;
      }}
    >
      <h1 className="sr-only">Hola Mundo — Portafolio de Jaime Pergueza</h1>

      <div className="scene-transition" style={{ opacity: transitionOpacity }} aria-hidden="true" />

      <div className={`scroll-cue${progress > 0.08 ? " is-hidden" : ""}`}>
        <span>{isMobile ? "Desliza hacia arriba" : "Haz scroll para acercarte"}</span><i />
      </div>

      {isMobile && (
        <div className="mobile-progress" aria-hidden="true">
          <span style={{ transform: `scaleY(${Math.max(progress, 0.035)})` }} />
        </div>
      )}

      <Canvas
        camera={{
          position: CAMERA_PRESETS[deviceMode].studioStart,
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
          <group visible={progress < 0.595}>
            <CityBackdrop />
            <Scene01 />
          </group>
          <ParticleTextScene
            deviceMode={deviceMode}
            pointerRef={pointerRef}
            progressRef={progressRef}
          />
        </Suspense>
        <LoadingOverlay />
        <CameraRig progressRef={progressRef} pointerRef={pointerRef} deviceMode={deviceMode} />
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={progress >= 0.575 ? (isMobile ? 0.48 : 0.66) : (isMobile ? 0.28 : 0.36)}
            luminanceThreshold={progress >= 0.575 ? 0.44 : 0.72}
            luminanceSmoothing={0.44}
            mipmapBlur
          />
          {!isMobile && <Noise opacity={0.0018} />}
          <Vignette eskil={false} offset={0.06} darkness={progress >= 0.575 ? 0.3 : (isMobile ? 0.1 : 0.16)} />
        </EffectComposer>
      </Canvas>
    </main>
  );
}
