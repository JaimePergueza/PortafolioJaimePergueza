import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import cityBackplate from "../assets/cityBackplate";

export default function CityBackdrop() {
  const texture = useTexture(cityBackplate);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  return (
    <mesh position={[-3.6, 2.75, -4.405]} renderOrder={-1}>
      <planeGeometry args={[6.06, 4.5]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
