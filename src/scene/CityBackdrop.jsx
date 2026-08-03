import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import cityBackplate from "../assets/cityBackplate";

function FrameBar({ args, position }) {
  return (
    <mesh position={position} renderOrder={4}>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#090c11" roughness={0.42} metalness={0.48} />
    </mesh>
  );
}

export default function CityBackdrop() {
  const [texture, setTexture] = useState(null);
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#8aa7c7",
        roughness: 0.08,
        transmission: 0.18,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      cityBackplate,
      (loadedTexture) => {
        if (!active) {
          loadedTexture.dispose();
          return;
        }
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.generateMipmaps = false;
        loadedTexture.needsUpdate = true;
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.error("No se pudo cargar el fondo de ciudad", error);
      },
    );

    return () => {
      active = false;
    };
  }, []);

  if (!texture) return null;

  return (
    <group position={[-3.6, 2.75, -4.28]}>
      <mesh renderOrder={2}>
        <planeGeometry args={[6.12, 4.56]} />
        <meshBasicMaterial map={texture} toneMapped={false} depthWrite />
      </mesh>

      <mesh position={[0, 0, 0.018]} material={glass} renderOrder={3}>
        <planeGeometry args={[6.12, 4.56]} />
      </mesh>

      <FrameBar args={[6.38, 0.12, 0.12]} position={[0, 2.34, 0.05]} />
      <FrameBar args={[6.38, 0.12, 0.12]} position={[0, -2.34, 0.05]} />
      <FrameBar args={[0.12, 4.68, 0.12]} position={[-3.13, 0, 0.05]} />
      <FrameBar args={[0.12, 4.68, 0.12]} position={[3.13, 0, 0.05]} />
      {[-2.03, 0, 2.03].map((x) => (
        <FrameBar key={x} args={[0.075, 4.56, 0.1]} position={[x, 0, 0.06]} />
      ))}
      <FrameBar args={[6.12, 0.075, 0.1]} position={[0, 0, 0.06]} />
    </group>
  );
}
