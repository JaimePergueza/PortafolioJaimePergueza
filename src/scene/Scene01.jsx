import {
  ContactShadows,
  Float,
  RoundedBox,
  useGLTF,
} from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

const LAPTOP_URL = new URL(
  "../../Assets/fbx/source_extracted/laptop.fbx",
  import.meta.url,
).href;
const BOOK_URL = new URL(
  "../../Assets/fbx/source_extracted/book.fbx",
  import.meta.url,
).href;
const BIN_URL = new URL(
  "../../Assets/fbx/source_extracted/bin.fbx",
  import.meta.url,
).href;
const BOTTLE_URL = new URL(
  "../../Assets/Agua/waterbottle_obj.obj",
  import.meta.url,
).href;
const BIPED_CHARACTER_URL = new URL(
  "../../Assets/Meshy_AI_T_Pose_Gym_Buddy_biped/Meshy_AI_T_Pose_Gym_Buddy_biped_Character_output.glb",
  import.meta.url,
).href;
const CHARACTER_ANCHOR_POSITION = [0.22, 0.56, 1.0];
const CHARACTER_ANCHOR_ROTATION = [0.04, -2.46, 0];

function useClayMaterial(color, extra = {}) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.95,
        metalness: 0.02,
        ...extra,
      }),
    [color, extra],
  );
}

function tuneImportedMaterial(material, { tint, preserveMap }) {
  const next = material?.clone?.() ?? new THREE.MeshStandardMaterial();

  if (!preserveMap && tint) {
    next.color = new THREE.Color(tint);
    next.map = null;
  } else if (tint && !next.map) {
    next.color = new THREE.Color(tint);
  }

  next.roughness = 0.96;
  next.metalness = 0.03;
  next.envMapIntensity = 0.2;

  return next;
}

function usePreparedObject(source, options) {
  const { targetSize, tint, preserveMap = true } = options;

  return useMemo(() => {
    const root = SkeletonUtils.clone(source);

    root.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.castShadow = true;
      child.receiveShadow = true;

      if (Array.isArray(child.material)) {
        child.material = child.material.map((material) =>
          tuneImportedMaterial(material, { tint, preserveMap }),
        );
      } else if (child.material) {
        child.material = tuneImportedMaterial(child.material, {
          tint,
          preserveMap,
        });
      } else {
        child.material = new THREE.MeshStandardMaterial({
          color: tint ?? "#8d96aa",
          roughness: 0.96,
          metalness: 0.03,
        });
      }
    });

    root.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    const scale = targetSize / maxDimension;
    const offset = new THREE.Vector3(
      -center.x * scale,
      -box.min.y * scale,
      -center.z * scale,
    );

    return {
      root,
      scale,
      offset: [offset.x, offset.y, offset.z],
    };
  }, [source, targetSize, tint, preserveMap]);
}

function ImportedAsset({
  source,
  targetSize,
  position,
  rotation = [0, 0, 0],
  tint,
  preserveMap = true,
}) {
  const prepared = usePreparedObject(source, {
    targetSize,
    tint,
    preserveMap,
  });

  return (
    <group position={position} rotation={rotation} scale={prepared.scale}>
      <primitive object={prepared.root} position={prepared.offset} />
    </group>
  );
}

function LightingRig() {
  return (
    <>
      <hemisphereLight
        intensity={0.6}
        color="#8ea6d3"
        groundColor="#171621"
      />
      <ambientLight intensity={0.24} color="#8ca2d0" />
      <directionalLight
        castShadow
        intensity={1.15}
        color="#c5d3ff"
        position={[4.2, 6.5, 2.4]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <spotLight
        castShadow
        intensity={14}
        angle={0.48}
        penumbra={1}
        distance={18}
        color="#ffcaa3"
        position={[-2.4, 3.4, 0.2]}
      />
      <pointLight
        intensity={3.8}
        color="#bf9fff"
        distance={7}
        position={[2.9, 0.28, -3.48]}
      />
      <pointLight
        intensity={3.2}
        color="#77ddd4"
        distance={8}
        position={[-2.8, 0.28, -3.48]}
      />
      <pointLight
        intensity={2.4}
        color="#9edcff"
        distance={4}
        position={[0.15, 1.35, -0.18]}
      />
      <pointLight
        intensity={2.2}
        color="#95b4ff"
        distance={4.8}
        position={[3.15, 2.1, -4.16]}
      />
    </>
  );
}

function RoomShell() {
  const wall = useClayMaterial("#20283b");
  const floor = useClayMaterial("#293346");
  const accentLeft = useClayMaterial("#74d8d0", {
    emissive: "#4adfd3",
    emissiveIntensity: 2.1,
  });
  const accentRight = useClayMaterial("#b7a0ff", {
    emissive: "#b996ff",
    emissiveIntensity: 2,
  });
  const signFrame = useClayMaterial("#6f7ff7", {
    emissive: "#7693ff",
    emissiveIntensity: 0.95,
  });

  return (
    <group>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        material={floor}
      >
        <planeGeometry args={[10, 10]} />
      </mesh>

      <RoundedBox
        args={[10, 4.5, 0.35]}
        radius={0.12}
        smoothness={4}
        position={[0, 2.2, -4.8]}
        material={wall}
        receiveShadow
      />

      <RoundedBox
        args={[0.35, 4.5, 10]}
        radius={0.12}
        smoothness={4}
        position={[-4.8, 2.2, 0]}
        material={wall}
        receiveShadow
      />

      <RoundedBox
        args={[5.6, 0.08, 0.08]}
        radius={0.04}
        smoothness={4}
        position={[-2, 0.14, -3.6]}
        material={accentLeft}
      />

      <RoundedBox
        args={[4.3, 0.08, 0.08]}
        radius={0.04}
        smoothness={4}
        position={[2.5, 0.14, -3.6]}
        material={accentRight}
      />

      <RoundedBox
        args={[2.1, 1.45, 0.18]}
        radius={0.2}
        smoothness={4}
        position={[3.2, 2.1, -4.55]}
        material={signFrame}
      />

      <mesh position={[3.2, 2.1, -4.42]}>
        <planeGeometry args={[1.15, 0.75]} />
        <meshStandardMaterial
          color="#dce6ff"
          emissive="#a8bcff"
          emissiveIntensity={3}
          roughness={0.45}
          metalness={0}
        />
      </mesh>

      <WallPipe position={[-2.4, 3.2, -4.6]} rotation={[0, 0, -0.25]} />
      <WallPipe position={[0.7, 3.1, -4.6]} rotation={[0, 0, 0.2]} />
      <WallPipe position={[-4.45, 2.7, -1.6]} rotation={[0, 0, Math.PI / 2]} />
    </group>
  );
}

function WallPipe({ position, rotation }) {
  const pipe = useClayMaterial("#445168");

  return (
    <group position={position} rotation={rotation}>
      <mesh material={pipe}>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 18]} />
      </mesh>
      <mesh position={[-0.55, 0, 0]} material={pipe}>
        <torusGeometry args={[0.09, 0.04, 12, 24]} />
      </mesh>
      <mesh position={[0.55, 0, 0]} material={pipe}>
        <torusGeometry args={[0.09, 0.04, 12, 24]} />
      </mesh>
    </group>
  );
}

function DeskPlatform() {
  const wood = useClayMaterial("#786053");

  return (
    <group position={[0.1, 0.7, 0.45]}>
      <RoundedBox
        castShadow
        receiveShadow
        args={[4.4, 0.26, 2.25]}
        radius={0.14}
        smoothness={4}
        position={[0, 0.75, 0]}
        material={wood}
      />

      {[
        [-1.75, 0.34, -0.8],
        [1.75, 0.34, -0.8],
        [-1.75, 0.34, 0.8],
        [1.75, 0.34, 0.8],
      ].map((pos) => (
        <RoundedBox
          key={pos.join(",")}
          castShadow
          args={[0.22, 0.9, 0.22]}
          radius={0.06}
          smoothness={4}
          position={pos}
          material={wood}
        />
      ))}
    </group>
  );
}

function ImportedDeskProps() {
  const laptop = useLoader(FBXLoader, LAPTOP_URL);
  const book = useLoader(FBXLoader, BOOK_URL);
  const bin = useLoader(FBXLoader, BIN_URL);
  const bottle = useLoader(OBJLoader, BOTTLE_URL);

  return (
    <>
      <ImportedAsset
        source={laptop}
        targetSize={1.42}
        position={[0.1, 1.04, -0.05]}
        rotation={[0, Math.PI, 0]}
        tint="#343d51"
        preserveMap={false}
      />

      <ImportedAsset
        source={book}
        targetSize={0.8}
        position={[-1.15, 1.0, -0.45]}
        rotation={[0, 0.24, 0]}
        tint="#7e90c4"
        preserveMap={false}
      />
      <ImportedAsset
        source={book}
        targetSize={0.78}
        position={[-1.12, 1.1, -0.47]}
        rotation={[0, 0.18, 0]}
        tint="#5f6c9d"
        preserveMap={false}
      />
      <ImportedAsset
        source={book}
        targetSize={0.76}
        position={[-1.08, 1.19, -0.52]}
        rotation={[0, 0.14, 0]}
        tint="#9ea9d5"
        preserveMap={false}
      />

      <ImportedAsset
        source={bottle}
        targetSize={0.42}
        position={[-0.36, 1.08, 0.8]}
        rotation={[0, -0.2, 0]}
        tint="#c58b62"
        preserveMap={false}
      />

      <ImportedAsset
        source={bin}
        targetSize={0.72}
        position={[3.0, 0.08, -2.35]}
        rotation={[0, -0.45, 0]}
        tint="#3f4658"
        preserveMap={false}
      />

      <mesh position={[0.12, 1.47, -0.35]} rotation={[-0.95, 0, 0]}>
        <planeGeometry args={[0.95, 0.58]} />
        <meshStandardMaterial
          color="#9edfff"
          emissive="#88d8ff"
          emissiveIntensity={2.4}
          roughness={0.28}
          metalness={0}
        />
      </mesh>
      <pointLight
        intensity={6}
        color="#8edcff"
        distance={4.8}
        position={[0.08, 1.2, 0.02]}
      />
      <RoundedBox
        args={[1.28, 0.03, 0.9]}
        radius={0.03}
        smoothness={4}
        position={[0.12, 1.0, 0.05]}
        material={useClayMaterial("#2b3242")}
      />
    </>
  );
}

function Chair() {
  const chair = useClayMaterial("#444c61");
  const seatAccent = useClayMaterial("#4c5770");

  return (
    <group position={[0.78, 0.44, 1.16]} rotation={[0, -0.18, 0]}>
      <RoundedBox
        castShadow
        args={[1.18, 0.28, 1.06]}
        radius={0.18}
        smoothness={4}
        position={[0, 0.7, 0]}
        material={chair}
      />
      <RoundedBox
        castShadow
        args={[0.96, 0.08, 0.82]}
        radius={0.14}
        smoothness={4}
        position={[0, 0.83, -0.02]}
        material={seatAccent}
      />
      <RoundedBox
        castShadow
        args={[0.28, 1.3, 0.28]}
        radius={0.08}
        smoothness={4}
        position={[0, 0.16, 0]}
        material={chair}
      />
      <RoundedBox
        castShadow
        args={[1.18, 1.72, 0.4]}
        radius={0.2}
        smoothness={4}
        position={[0, 1.6, -0.42]}
        material={chair}
      />
      <RoundedBox
        castShadow
        args={[0.78, 0.95, 0.16]}
        radius={0.12}
        smoothness={4}
        position={[0, 1.48, -0.22]}
        material={seatAccent}
      />
      <RoundedBox
        castShadow
        args={[0.2, 0.78, 0.2]}
        radius={0.08}
        smoothness={4}
        position={[-0.58, 1.02, 0]}
        material={chair}
      />
      <RoundedBox
        castShadow
        args={[0.2, 0.78, 0.2]}
        radius={0.08}
        smoothness={4}
        position={[0.58, 1.02, 0]}
        material={chair}
      />
    </group>
  );
}

function CharacterSeatGuide() {
  const guide = useClayMaterial("#55637f", {
    transparent: true,
    opacity: 0.18,
    emissive: "#8ba8df",
    emissiveIntensity: 0.12,
  });
  const marker = useClayMaterial("#86d7ff", {
    emissive: "#86d7ff",
    emissiveIntensity: 1.6,
  });

  return (
    <group position={CHARACTER_ANCHOR_POSITION} rotation={CHARACTER_ANCHOR_ROTATION}>
      <RoundedBox
        args={[0.92, 1.12, 0.82]}
        radius={0.24}
        smoothness={4}
        position={[0, 0.68, -0.02]}
        material={guide}
      />
      <RoundedBox
        args={[0.16, 0.04, 0.64]}
        radius={0.04}
        smoothness={4}
        position={[-0.28, 0.7, -0.34]}
        rotation={[-0.52, 0, 0]}
        material={marker}
      />
      <RoundedBox
        args={[0.16, 0.04, 0.64]}
        radius={0.04}
        smoothness={4}
        position={[0.28, 0.7, -0.34]}
        rotation={[-0.52, 0, 0]}
        material={marker}
      />
      <mesh position={[0, 1.24, -0.08]}>
        <sphereGeometry args={[0.11, 18, 18]} />
        <meshStandardMaterial
          color="#d6e5ff"
          emissive="#8db5ff"
          emissiveIntensity={1.4}
          roughness={0.3}
          metalness={0}
          transparent
          opacity={0.32}
        />
      </mesh>
    </group>
  );
}

function applyCharacterPose(root) {
  const rotateBone = (name, [x = 0, y = 0, z = 0]) => {
    const bone = root.getObjectByName(name);

    if (!bone) {
      return;
    }

    bone.rotation.x += x;
    bone.rotation.y += y;
    bone.rotation.z += z;
  };

  const moveBone = (name, [x = 0, y = 0, z = 0]) => {
    const bone = root.getObjectByName(name);

    if (!bone) {
      return;
    }

    bone.position.x += x;
    bone.position.y += y;
    bone.position.z += z;
  };

  moveBone("Hips", [0, -6.5, 2.6]);
  rotateBone("Hips", [-0.08, 0.04, 0]);

  rotateBone("Spine02", [0.3, 0, 0.04]);
  rotateBone("Spine01", [0.16, 0, 0]);
  rotateBone("Spine", [0.08, 0, 0]);
  rotateBone("neck", [0.12, -0.14, 0]);
  rotateBone("Head", [0.08, -0.12, 0]);

  rotateBone("LeftUpLeg", [-1.22, 0.04, -0.08]);
  rotateBone("LeftLeg", [1.38, 0, 0.02]);
  rotateBone("LeftFoot", [-0.32, 0, 0.08]);

  rotateBone("RightUpLeg", [-1.16, -0.04, 0.08]);
  rotateBone("RightLeg", [1.34, 0, -0.02]);
  rotateBone("RightFoot", [-0.26, 0, -0.08]);

  rotateBone("LeftShoulder", [0.35, 0.18, -1.18]);
  rotateBone("LeftArm", [-0.28, 0.18, -0.78]);
  rotateBone("LeftForeArm", [-0.92, -0.02, 0.14]);
  rotateBone("LeftHand", [0.2, 0.1, 0.18]);

  rotateBone("RightShoulder", [0.32, -0.18, 1.12]);
  rotateBone("RightArm", [-0.24, -0.16, 0.72]);
  rotateBone("RightForeArm", [-0.86, 0.04, -0.12]);
  rotateBone("RightHand", [0.18, -0.1, -0.18]);
}

function CharacterRig() {
  const character = useGLTF(BIPED_CHARACTER_URL);
  const hoodie = useClayMaterial("#434d63");
  const hoodieAccent = useClayMaterial("#56617c");
  const characterRoot = useMemo(() => {
    const root = SkeletonUtils.clone(character.scene);

    root.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.castShadow = true;
      child.receiveShadow = true;

      if (child.material?.clone) {
        child.material = child.material.clone();
      }

      if (child.material) {
        child.material.roughness = 0.98;
        child.material.metalness = 0.01;
        child.material.envMapIntensity = 0.18;
      }
    });

    root.updateMatrixWorld(true);

    return root;
  }, [character.scene]);

  return (
    <group
      position={CHARACTER_ANCHOR_POSITION}
      rotation={CHARACTER_ANCHOR_ROTATION}
    >
      <group position={[0.02, -0.18, -0.08]} rotation={[0.08, Math.PI + 0.04, 0]} scale={1}>
        <primitive object={characterRoot} />
      </group>
      <group position={[0.02, 0.02, -0.04]} rotation={[0, 0.08, 0]}>
        <RoundedBox
          castShadow
          args={[0.88, 1.02, 0.78]}
          radius={0.24}
          smoothness={4}
          position={[0, 0.78, 0.04]}
          material={hoodie}
        />
        <RoundedBox
          castShadow
          args={[0.72, 0.5, 0.5]}
          radius={0.18}
          smoothness={4}
          position={[0, 1.2, -0.06]}
          material={hoodieAccent}
        />
        <RoundedBox
          castShadow
          args={[0.24, 0.52, 0.24]}
          radius={0.1}
          smoothness={4}
          position={[-0.28, 0.46, 0.18]}
          rotation={[0.26, 0, 0.34]}
          material={hoodie}
        />
        <RoundedBox
          castShadow
          args={[0.24, 0.44, 0.24]}
          radius={0.1}
          smoothness={4}
          position={[0.24, 0.48, 0.04]}
          rotation={[0.44, 0, -0.18]}
          material={hoodie}
        />
      </group>
    </group>
  );
}

function DecorProps() {
  const metal = useClayMaterial("#59657a");
  const bench = useClayMaterial("#45515f");
  const mute = useClayMaterial("#30394a");

  return (
    <>
      <group position={[-3.35, 0.6, 0.15]} rotation={[0, 0.25, 0]}>
        <RoundedBox
          args={[0.2, 1.1, 0.2]}
          radius={0.06}
          smoothness={4}
          position={[-0.5, 0.55, 0]}
          material={metal}
        />
        <RoundedBox
          args={[0.2, 1.1, 0.2]}
          radius={0.06}
          smoothness={4}
          position={[0.5, 0.55, 0]}
          material={metal}
        />
        <RoundedBox
          args={[1.35, 0.16, 0.2]}
          radius={0.06}
          smoothness={4}
          position={[0, 1.04, 0]}
          material={metal}
        />
        <mesh castShadow position={[-0.6, 1.04, 0]} material={mute}>
          <cylinderGeometry args={[0.18, 0.18, 0.14, 24]} />
        </mesh>
        <mesh castShadow position={[-0.28, 1.04, 0]} material={mute}>
          <cylinderGeometry args={[0.11, 0.11, 0.1, 24]} />
        </mesh>
        <mesh castShadow position={[0.28, 1.04, 0]} material={mute}>
          <cylinderGeometry args={[0.11, 0.11, 0.1, 24]} />
        </mesh>
        <mesh castShadow position={[0.6, 1.04, 0]} material={mute}>
          <cylinderGeometry args={[0.18, 0.18, 0.14, 24]} />
        </mesh>
      </group>

      <group position={[-1.9, 0.33, -2.6]} rotation={[0, 0.18, 0]}>
        <RoundedBox
          args={[1.5, 0.16, 0.56]}
          radius={0.1}
          smoothness={4}
          position={[0, 0.65, 0]}
          material={bench}
        />
        <RoundedBox
          args={[0.12, 0.68, 0.12]}
          radius={0.04}
          smoothness={4}
          position={[-0.58, 0.3, -0.18]}
          material={bench}
        />
        <RoundedBox
          args={[0.12, 0.68, 0.12]}
          radius={0.04}
          smoothness={4}
          position={[0.58, 0.3, -0.18]}
          material={bench}
        />
      </group>

      <mesh castShadow position={[3.15, 0.56, -2.3]} material={mute}>
        <cylinderGeometry args={[0.28, 0.34, 1.1, 24]} />
      </mesh>
      <mesh castShadow position={[1.7, 1.0, 0.52]} rotation={[0.28, 0.4, 0]} material={mute}>
        <cylinderGeometry args={[0.11, 0.11, 0.7, 22]} />
      </mesh>
      <mesh castShadow position={[1.35, 0.94, 0.77]} rotation={[0.24, -0.2, 0]} material={mute}>
        <cylinderGeometry args={[0.11, 0.11, 0.42, 22]} />
      </mesh>
    </>
  );
}

export default function Scene01() {
  return (
    <>
      <LightingRig />

      <Float speed={1.1} rotationIntensity={0.05} floatIntensity={0.06}>
        <group rotation={[0, -0.58, 0]} position={[0, 0, 0.2]}>
          <RoomShell />
          <DecorProps />
          <DeskPlatform />
          <ImportedDeskProps />
          <Chair />
          <CharacterRig />
        </group>
      </Float>
      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.45}
        scale={11}
        blur={2.8}
        far={6}
        color="#09101b"
      />
    </>
  );
}

useGLTF.preload(BIPED_CHARACTER_URL);
