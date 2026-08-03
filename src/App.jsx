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

  if (!active) {
    return null;
  }

  return (
    <Html center>
      <div className="loading-card">
        <p className="loading-label">Loading Scene</p>
        <strong>{Math.round(progress)}%</strong>
        <span>
          {loaded}/{total}
        </span>
        {item ? <small>{item.split("/").pop()}</small> : null}
      </div>
    </Html>
  );
}

function CameraRig({ dragState }) {
  const { camera } = useThree();
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const basePosition = useMemo(() => new THREE.Vector3(5.9, 5.4, 7.4), []);
  const baseTarget = useMemo(() => new THREE.Vector3(0, 1.5, 0), []);

  useFrame((_, delta) => {
    const drag = dragState.current;

    if (!drag.isDragging) {
      drag.targetX = THREE.MathUtils.damp(drag.targetX, 0, 4, delta);
      drag.targetY = THREE.MathUtils.damp(drag.targetY, 0, 4, delta);
    }

    drag.currentX = THREE.MathUtils.damp(drag.currentX, drag.targetX, 6, delta);
    drag.currentY = THREE.MathUtils.damp(drag.currentY, drag.targetY, 6, delta);

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      basePosition.x + drag.currentX,
      5,
      delta,
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      basePosition.y - drag.currentY * 0.45,
      5,
      delta,
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      basePosition.z + Math.abs(drag.currentX) * 0.08,
      5,
      delta,
    );

    lookAt.set(
      baseTarget.x + drag.currentX * 0.28,
      baseTarget.y + drag.currentY * 0.18,
      baseTarget.z,
    );
    camera.lookAt(lookAt);
  });

  return null;
}

export default function App() {
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
  });

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragState.current.isDragging = true;
    dragState.current.lastX = event.clientX;
    dragState.current.lastY = event.clientY;
    setIsDragging(true);
  };

  const handlePointerMove = (event) => {
    const drag = dragState.current;
    if (!drag.isDragging) {
      return;
    }

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

  return (
    <div
      className={`app-shell${isDragging ? " is-dragging" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="hud">
        <p className="eyebrow">Scene 01</p>
        <h1>Jaime Pergueza</h1>
        <p className="copy">Web Dev</p>
      </div>

      <Canvas
        camera={{ position: [5.9, 5.4, 7.4], fov: 34 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
        shadows
      >
        <color attach="background" args={["#101626"]} />
        <fog attach="fog" args={["#101626", 8.5, 18]} />

        <Suspense fallback={null}>
          <Scene01 />
        </Suspense>
        <LoadingOverlay />
        <CameraRig dragState={dragState} />

        <EffectComposer>
          <Bloom
            intensity={0.72}
            luminanceThreshold={0.45}
            luminanceSmoothing={0.28}
            mipmapBlur
          />
          <Noise opacity={0.014} />
          <Vignette eskil={false} offset={0.12} darkness={0.52} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
