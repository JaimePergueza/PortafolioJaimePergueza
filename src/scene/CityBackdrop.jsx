import { useEffect, useState } from "react";
import * as THREE from "three";
import cityBackplate from "../assets/cityBackplate";

export default function CityBackdrop() {
  const [texture, setTexture] = useState(null);

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
    <mesh position={[-3.6, 2.75, -4.405]} renderOrder={-1}>
      <planeGeometry args={[6.06, 4.5]} />
      <meshBasicMaterial map={texture} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}
