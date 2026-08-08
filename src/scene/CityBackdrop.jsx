import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import cityBackplate from "../assets/cityBackplateV2";

export default function CityBackdrop() {
  const [texture, setTexture] = useState(null);
  const haze = useMemo(() => new THREE.MeshBasicMaterial({ color: "#416aa4", transparent: true, opacity: 0.08, depthWrite: false }), []);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      const loaded = new THREE.Texture(image);
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.minFilter = THREE.LinearFilter;
      loaded.magFilter = THREE.LinearFilter;
      loaded.generateMipmaps = false;
      loaded.needsUpdate = true;
      setTexture(loaded);
    };
    image.onerror = (error) => console.error("No se pudo cargar el fondo panorámico", error);
    image.src = cityBackplate;
    return () => { active = false; };
  }, []);

  if (!texture) return null;

  return (
    <group position={[-3.35, 2.7, -4.47]}>
      <mesh renderOrder={-5}>
        <planeGeometry args={[5.86, 4.48]} />
        <meshBasicMaterial map={texture} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.02]} material={haze} renderOrder={-4}>
        <planeGeometry args={[5.86, 4.48]} />
      </mesh>
    </group>
  );
}
