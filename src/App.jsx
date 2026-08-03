import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import Scene01 from "./scene/Scene01";

function LoadingOverlay() {
  const { active, progress, item, loaded, total } = useProgress();

  if (!active) return null;

  return (
    <Html center>
      <div className="loading-card">
        <p className="loading-label">Inicializando escena</p>
        <strong>{Math.round(progress)}%</strong>
        <span>{loaded}/{total}</span>
        {item ? <small>{item.split("/").pop()}</small> : null}
      </div>
    </Html>
  );
}

function CameraRig({ dragState, storyProgress }) {
  const { camera } = useThree();
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const drag = dragState.current;
    const progress = storyProgress.current;

    if (!drag.isDragging) {
      drag.targetX = THREE.MathUtils.damp(drag.targetX, 0, 4, delta);
      drag.targetY = THREE.MathUtils.damp(drag.targetY, 0, 4, delta);
    }

    drag.currentX = THREE.MathUtils.damp(drag.currentX, drag.targetX, 6, delta);
    drag.currentY = THREE.MathUtils.damp(drag.currentY, drag.targetY, 6, delta);

    // Plano 1: vista general del estudio. Plano 2: acercamiento al personaje.
    desiredPosition.set(
      THREE.MathUtils.lerp(5.9, 3.55, progress) + drag.currentX,
      THREE.MathUtils.lerp(5.4, 3.15, progress) - drag.currentY * 0.45,
      THREE.MathUtils.lerp(7.4, 5.05, progress) + Math.abs(drag.currentX) * 0.08,
    );

    desiredTarget.set(
      THREE.MathUtils.lerp(0, 0.28, progress) + drag.currentX * 0.28,
      THREE.MathUtils.lerp(1.5, 1.52, progress) + drag.currentY * 0.18,
      THREE.MathUtils.lerp(0, 0.58, progress),
    );

    camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredPosition.x, 4.5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredPosition.y, 4.5, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredPosition.z, 4.5, delta);

    lookAt.lerp(desiredTarget, 1 - Math.exp(-5 * delta));
    camera.lookAt(lookAt);
  });

  return null;
}

export default function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const storyProgress = useRef(0);
  const dragState = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
  });

  const updateProgress = (nextValue) => {
    const next = THREE.MathUtils.clamp(nextValue, 0, 1);
    storyProgress.current = next;
    setProgress(next);
  };

  const handleWheel = (event) => {
    updateProgress(storyProgress.current + event.deltaY * 0.00085);
  };

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragState.current.isDragging = true;
    dragState.current.lastX = event.clientX;
    dragState.current.lastY = event.clientY;
    setIsDragging(true);
  };

  const handlePointerMove = (event) => {
    const drag = dragState.current;
    if (!drag.isDragging) return;

    const deltaX = event.clientX - drag.lastX;
    const deltaY = event.clientY - drag.lastY;

    drag.lastX = event.clientX;
    drag.lastY = event.clientY;

    drag.targetX = THREE.MathUtils.clamp(
      drag.targetX + (deltaX / window.innerWidth) * 1.25,
      -0.35,
      0.35,
    );
    drag.targetY = THREE.MathUtils.clamp(
      drag.targetY + (deltaY / window.innerHeight) * 1.05,
      -0.22,
      0.22,
    );
  };

  const handlePointerUp = (event) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragState.current.isDragging = false;
    setIsDragging(false);
  };

  const terminalVisible = progress > 0.42;
  const greetingVisible = progress > 0.62;

  return (
    <div
      className={`app-shell${isDragging ? " is-dragging" : ""}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <header className="hud">
        <p className="eyebrow">Scene 01 · The Studio</p>
        <h1>Jaime Pergueza</h1>
        <p className="copy">Developer · 3D · XR</p>
      </header>

      <aside className={`terminal-card${terminalVisible ? " is-visible" : ""}`}>
        <div className="terminal-topbar">
          <span />
          <span />
          <span />
          <small>main.py</small>
        </div>
        <code>
          <span className="terminal-keyword">print</span>
          <span>(</span>
          <span className="terminal-string">&quot;Hola Mundo&quot;</span>
          <span>)</span>
        </code>
        <p className={greetingVisible ? "is-visible" : ""}>Hola Mundo</p>
      </aside>

      <div className={`scroll-cue${progress > 0.08 ? " is-hidden" : ""}`}>
        <span>Scroll para entrar</span>
        <i />
      </div>

      <div className="story-meter" aria-hidden="true">
        <span style={{ transform: `scaleY(${Math.max(progress, 0.04)})` }} />
      </div>

      <Canvas
        camera={{ position: [5.9, 5.4, 7.4], fov: 34 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows
      >
        <color attach="background" args={["#101626"]} />
        <fog attach="fog" args={["#101626", 8.5, 18]} />

        <Suspense fallback={null}>
          <Scene01 />
        </Suspense>
        <LoadingOverlay />
        <CameraRig dragState={dragState} storyProgress={storyProgress} />

        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.72}
            luminanceThreshold={0.45}
            luminanceSmoothing={0.28}
            mipmapBlur
          />
          <Noise opacity={0.012} />
          <Vignette eskil={false} offset={0.12} darkness={0.52} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
