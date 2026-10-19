import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, useGLTF, useProgress } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { ACESFilmicToneMapping, Box3, Color, MathUtils, Object3D, PlaneGeometry, Vector3 } from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { animateScreens } from "./animatedScreens";
import { assembleScene } from "./assembly";
import { animatePlants } from "./plantMotion";
import TypingCharacter from "./TypingCharacter";

RectAreaLightUniformsLib.init();

const modelUrl = `${import.meta.env.BASE_URL}models/MiZona_estudio.glb`;

const cameraSettings = {
  position: [-1.9, 2.4, 0.95],
  target: [0.65, 1.25, -2.7],
  horizontalFov: 72,
  maxVerticalFov: 64,
};

function Scenario({ assemblyRun, onReady }) {
  const { scene } = useGLTF(modelUrl);
  const invalidate = useThree((state) => state.invalidate);
  const camera = useThree((state) => state.camera);
  const viewport = useThree((state) => state.size);
  const assembling = useRef(true);
  const [assembled, setAssembled] = useState(false);

  useEffect(() => animateScreens(scene, invalidate), [scene, invalidate]);
  useEffect(() => {
    if (assembled) return animatePlants(scene, invalidate);
  }, [scene, invalidate, assembled]);

  useLayoutEffect(() => {
    scene.updateMatrixWorld(true);
    scene.traverse((object) => {
      if (/^Personaje_Rig/i.test(object.name)) object.visible = false;
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (/LED|RGB/i.test(material.name)) material.emissiveIntensity = 3;
        });
      }
    });
    if (!assembling.current) camera.position.fromArray(cameraSettings.position);
    const aspect = viewport.width / viewport.height;
    const horizontalLimit = MathUtils.radToDeg(2 * Math.atan(Math.tan(MathUtils.degToRad(cameraSettings.horizontalFov / 2)) / aspect));
    camera.fov = Math.min(cameraSettings.maxVerticalFov, horizontalLimit);
    camera.near = 0.05;
    camera.far = 100;
    if (!assembling.current) camera.lookAt(...cameraSettings.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    invalidate();
  }, [scene, invalidate, camera, viewport.width, viewport.height]);

  useLayoutEffect(() => {
    assembling.current = true;
    setAssembled(false);
    return assembleScene({
      scene,
      camera,
      cameraSettings,
      invalidate,
      onComplete: () => {
        assembling.current = false;
        setAssembled(true);
        onReady();
      },
    });
  }, [scene, camera, invalidate, assemblyRun, onReady]);

  return (
    <>
      <primitive object={scene} />
      <Suspense fallback={null}>
        <TypingCharacter active={assembled} laboratory={scene} />
      </Suspense>
      {assembled && <Mirror scene={scene} />}
      <StudioLighting />
    </>
  );
}

function Mirror({ scene }) {
  const group = useRef();
  const invalidate = useThree((state) => state.invalidate);
  const surface = useMemo(() => {
    scene.updateMatrixWorld(true);
    let mirror;
    scene.traverse((object) => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (/Espejo.*superficie/i.test(object.name) || materials.some((material) => /Espejo pulido/i.test(material.name))) mirror = object;
    });
    if (!mirror) return null;
    const bounds = new Box3().setFromObject(mirror);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    return { mesh: mirror, position: [center.x, center.y, bounds.max.z + 0.002], width: size.x, height: size.y };
  }, [scene]);

  useLayoutEffect(() => {
    if (!surface) return;
    const geometry = new PlaneGeometry(surface.width, surface.height);
    const reflector = new Reflector(geometry, {
      color: new Color(0.5, 0.5, 0.5),
      textureWidth: 1024,
      textureHeight: 2048,
      clipBias: 0,
      multisample: 2,
    });
    reflector.position.fromArray(surface.position);
    reflector.name = "Espejo_reflejo";
    const originalVisibility = surface.mesh.visible;
    surface.mesh.visible = false;
    const parent = group.current;
    parent.add(reflector);
    reflector.updateMatrixWorld(true);
    invalidate();
    return () => {
      surface.mesh.visible = originalVisibility;
      parent.remove(reflector);
      reflector.dispose();
      geometry.dispose();
    };
  }, [surface, invalidate]);

  return <group ref={group} />;
}

function StudioLighting() {
  const target = new Object3D();
  target.position.set(0, 0.5, -2);
  target.updateMatrixWorld(true);

  return (
    <group>
      <hemisphereLight args={["#9eb5d3", "#473022", 0.22]} />
      <spotLight
        position={[0.3, 2.88, -1.8]}
        intensity={38}
        angle={1.15}
        penumbra={0.85}
        decay={2}
        color="#ffd3a0"
        target={target}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={12}
        shadow-normalBias={0.015}
        shadow-bias={-0.0001}
      />
      <rectAreaLight position={[-1.15, 2.85, -3.4]} rotation={[0.3, Math.PI, 0]} width={2.1} height={0.18} intensity={9} color="#58e6e3" />
      <rectAreaLight position={[0.05, 1.5, -3.4]} rotation={[0, Math.PI, 0]} width={0.14} height={2.7} intensity={7} color="#58e6e3" />
      <rectAreaLight position={[-0.85, 1.55, -3.48]} rotation={[0, Math.PI, 0]} width={1.25} height={2.1} intensity={4} color="#ffb65f" />
      <rectAreaLight position={[1.15, 2.3, -3.25]} rotation={[0.7, Math.PI, 0]} width={1.9} height={0.15} intensity={12} color="#ffc078" />
      <rectAreaLight position={[1.15, 1.77, -3.25]} rotation={[0.6, Math.PI, 0]} width={1.9} height={0.12} intensity={8} color="#ffc078" />
      <rectAreaLight position={[2.45, 1.6, -2.2]} rotation={[0, Math.PI / 2, 0]} width={2.4} height={2.3} intensity={1.5} color="#8eaee8" />
      <pointLight position={[1.1, 1.05, -2.95]} intensity={0.6} distance={1.8} color="#7adce8" />
    </group>
  );
}

function Loading() {
  const { progress } = useProgress();
  return <Html center><p className="status" role="status">Cargando escenario · {Math.round(progress)}%</p></Html>;
}

class SceneErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <p className="scene-error" role="alert">No se pudo cargar el escenario. Recarga la página para intentarlo de nuevo.</p>;
    }
    return this.props.children;
  }
}

export default function App() {
  const [assemblyRun, setAssemblyRun] = useState(0);
  const [ready, setReady] = useState(false);
  const onReady = useMemo(() => () => setReady(true), []);

  return (
    <main className="scene-viewer" aria-label="Visor del escenario 3D">
      <SceneErrorBoundary>
        <Canvas shadows gl={{ toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }} camera={{ position: cameraSettings.position, fov: 50 }} dpr={[1, 1.5]} frameloop="demand" fallback={<p className="scene-error">Tu navegador no tiene WebGL disponible.</p>}>
          <color attach="background" args={["#10151e"]} />
          <Suspense fallback={<Loading />}>
            <Scenario assemblyRun={assemblyRun} onReady={onReady} />
          </Suspense>
          <EffectComposer multisampling={0}>
            <Bloom luminanceThreshold={1.1} intensity={0.3} mipmapBlur />
          </EffectComposer>
        </Canvas>
      </SceneErrorBoundary>
      {ready && <button className="replay-assembly" onClick={() => { setReady(false); setAssemblyRun((value) => value + 1); }}>Repetir ensamblaje</button>}
    </main>
  );
}
