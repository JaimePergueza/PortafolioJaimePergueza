import { ContactShadows, RoundedBox, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

const CHARACTER_URL = new URL(
  "../../Assets/Meshy_AI_T_Pose_Gym_Buddy_biped/Meshy_AI_T_Pose_Gym_Buddy_biped_Character_output.glb",
  import.meta.url,
).href;

function mat(color, roughness = 0.72, metalness = 0.05, emissive) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive: emissive ?? "#000000", emissiveIntensity: emissive ? 1.5 : 0 });
}

function Room() {
  const concrete = useMemo(() => mat("#242323", 0.95), []);
  const wood = useMemo(() => mat("#5f3e29", 0.78), []);
  const black = useMemo(() => mat("#171717", 0.65, 0.18), []);
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#22344d", roughness: 0.18, transmission: 0.16, transparent: true, opacity: 0.62 }), []);
  return <group>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} material={wood}><planeGeometry args={[12, 9]} /></mesh>
    <mesh receiveShadow position={[0, 2.7, -4.35]} material={concrete}><boxGeometry args={[12, 5.4, 0.25]} /></mesh>
    <mesh receiveShadow position={[5.75, 2.7, 0]} material={concrete}><boxGeometry args={[0.25, 5.4, 9]} /></mesh>
    <group position={[-3.55, 2.55, -4.16]}>
      <mesh material={black}><boxGeometry args={[4.3, 3.9, 0.16]} /></mesh>
      <mesh position={[0, 0, 0.1]} material={glass}><planeGeometry args={[4.05, 3.65]} /></mesh>
      {[-1.35, 0, 1.35].map((x) => <mesh key={x} position={[x, 0, 0.19]} material={black}><boxGeometry args={[0.07, 3.65, 0.08]} /></mesh>)}
      <mesh position={[0, 0, 0.19]} material={black}><boxGeometry args={[4.05, 0.07, 0.08]} /></mesh>
    </group>
    <CityLights />
    <Shelf />
  </group>;
}

function CityLights() {
  const lights = useMemo(() => Array.from({ length: 42 }, (_, i) => ({ x: -5.3 + (i % 7) * 0.62, y: 0.75 + Math.floor(i / 7) * 0.42, s: 0.025 + ((i * 17) % 5) * 0.007 })), []);
  return <group position={[0, 0, -4.05]}>{lights.map((item, i) => <mesh key={i} position={[item.x, item.y, 0]}><sphereGeometry args={[item.s, 8, 8]} /><meshBasicMaterial color={i % 4 === 0 ? "#ffc078" : "#8db8ff"} /></mesh>)}</group>;
}

function Shelf() {
  const wood = useMemo(() => mat("#5c3a28", 0.75), []);
  const glow = useMemo(() => mat("#bc8cff", 0.42, 0, "#8e5cff"), []);
  return <group position={[2.35, 3.65, -4.05]}>
    <mesh material={wood}><boxGeometry args={[4.5, 0.12, 0.48]} /></mesh>
    <mesh position={[0, -0.12, 0.16]} material={glow}><boxGeometry args={[4.2, 0.035, 0.035]} /></mesh>
    {[[-1.6,0.28],[-0.8,0.23],[0,0.3],[0.85,0.24]].map(([x,s],i)=><mesh key={i} position={[x,s/2+0.06,0]} castShadow><boxGeometry args={[s,s,s]} /><meshStandardMaterial color={["#8fa7bd","#bd8f8f","#9b8fbd","#8fbd9e"][i]} roughness={0.8}/></mesh>)}
  </group>;
}

function Desk() {
  const wood = useMemo(() => mat("#6d452c", 0.68), []);
  const metal = useMemo(() => mat("#151515", 0.5, 0.35), []);
  const screen = useMemo(() => mat("#91d7ff", 0.2, 0, "#4a9cff"), []);
  return <group position={[1.45, 0, -1.75]}>
    <RoundedBox args={[4.5, 0.18, 1.65]} radius={0.08} smoothness={4} position={[0,1.15,0]} material={wood} castShadow receiveShadow />
    {[-1.85,1.85].map((x)=><mesh key={x} position={[x,0.55,0]} material={metal} castShadow><boxGeometry args={[0.16,1.2,1.25]}/></mesh>)}
    {[-0.9,0.9].map((x)=><group key={x} position={[x,2.0,-0.28]}><mesh material={metal} castShadow><boxGeometry args={[1.62,0.96,0.08]}/></mesh><mesh position={[0,0,0.05]} material={screen}><planeGeometry args={[1.48,0.82]}/></mesh><mesh position={[0,-0.7,0]} material={metal}><boxGeometry args={[0.12,0.44,0.1]}/></mesh></group>)}
    <mesh position={[0,1.28,0.42]} material={metal}><boxGeometry args={[1.45,0.035,0.52]}/></mesh>
    <DeskLamp />
    <NeonSign />
  </group>;
}

function DeskLamp() {
  const metal = useMemo(() => mat("#1a1816",0.45,0.5),[]);
  return <group position={[1.72,1.25,-0.48]}>
    <mesh material={metal}><cylinderGeometry args={[0.2,0.24,0.08,24]}/></mesh>
    <mesh position={[0,0.55,0]} rotation={[0,0,-0.2]} material={metal}><cylinderGeometry args={[0.045,0.045,1.1,16]}/></mesh>
    <mesh position={[-0.13,1.08,0]} rotation={[0,0,0.35]} material={metal}><coneGeometry args={[0.28,0.42,24,1,true]}/></mesh>
    <pointLight position={[-0.25,0.95,0.08]} color="#ffbd78" intensity={8} distance={4}/>
  </group>;
}

function NeonSign() {
  const glow = useMemo(() => mat("#ffb15f",0.35,0,"#ff7a24"),[]);
  return <group position={[2.55,2.95,-2.45]} rotation={[0,0,-0.02]}>
    <mesh rotation={[0,0,0.55]} position={[-0.3,0,0]} material={glow}><boxGeometry args={[0.55,0.07,0.07]}/></mesh>
    <mesh rotation={[0,0,-0.55]} position={[-0.3,-0.28,0]} material={glow}><boxGeometry args={[0.55,0.07,0.07]}/></mesh>
    <mesh rotation={[0,0,-0.55]} position={[0.3,0,0]} material={glow}><boxGeometry args={[0.55,0.07,0.07]}/></mesh>
    <mesh rotation={[0,0,0.55]} position={[0.3,-0.28,0]} material={glow}><boxGeometry args={[0.55,0.07,0.07]}/></mesh>
    <pointLight color="#ff8a3d" intensity={5} distance={3}/>
  </group>;
}

function GymZone() {
  const metal = useMemo(() => mat("#181818",0.52,0.45),[]);
  const pad = useMemo(() => mat("#242424",0.7),[]);
  return <group position={[-3.45,0,-0.9]}>
    <RoundedBox args={[1.85,0.28,0.72]} radius={0.1} smoothness={4} position={[0,0.56,0]} material={pad} castShadow />
    <mesh position={[-0.65,0.27,0]} rotation={[0,0,-0.18]} material={metal}><boxGeometry args={[0.12,0.75,0.12]}/></mesh>
    <mesh position={[0.65,0.27,0]} rotation={[0,0,0.18]} material={metal}><boxGeometry args={[0.12,0.75,0.12]}/></mesh>
    <Dumbbell position={[-0.72,0.16,-1.1]}/><Dumbbell position={[0.72,0.16,-1.1]}/><Dumbbell position={[0,0.16,-1.45]} scale={1.25}/>
  </group>;
}

function Dumbbell({position,scale=1}) {
  const metal=useMemo(()=>mat("#171717",0.48,0.5),[]);
  return <group position={position} scale={scale} rotation={[0,0,0.2]}><mesh rotation={[0,0,Math.PI/2]} material={metal}><cylinderGeometry args={[0.055,0.055,0.55,16]}/></mesh>{[-0.32,0.32].map(x=><mesh key={x} position={[x,0,0]} rotation={[0,0,Math.PI/2]} material={metal}><cylinderGeometry args={[0.17,0.17,0.16,16]}/></mesh>)}</group>;
}

function Chair() {
  const dark=useMemo(()=>mat("#171717",0.58,0.22),[]);
  return <group position={[1.05,0.85,0.1]} rotation={[0,-0.22,0]}><RoundedBox args={[1.0,0.2,0.95]} radius={0.14} smoothness={4} material={dark} castShadow/><RoundedBox args={[0.95,1.45,0.24]} radius={0.14} smoothness={4} position={[0,0.88,-0.35]} rotation={[-0.12,0,0]} material={dark} castShadow/><mesh position={[0,-0.55,0]} material={dark}><cylinderGeometry args={[0.08,0.08,0.9,16]}/></mesh></group>;
}

function Character() {
  const { scene }=useGLTF(CHARACTER_URL);
  const clone=useMemo(()=>{ const c=SkeletonUtils.clone(scene); c.traverse((o)=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}}); return c; },[scene]);
  return <primitive object={clone} position={[1.05,0.78,0.08]} rotation={[0,-2.72,0]} scale={0.84}/>;
}

function Lighting() {
  return <><ambientLight intensity={0.2} color="#a7b5cc"/><hemisphereLight intensity={0.34} color="#7892bd" groundColor="#17120f"/><directionalLight castShadow position={[-4,7,5]} intensity={1.5} color="#9fb9e8" shadow-mapSize-width={2048} shadow-mapSize-height={2048}/><pointLight position={[-3.4,2.7,-3.4]} color="#6b8dff" intensity={4.2} distance={7}/><pointLight position={[2.1,0.35,-2.2]} color="#6b52ff" intensity={2.5} distance={4}/><pointLight position={[1.2,1.7,-1.2]} color="#ffb066" intensity={5.5} distance={4}/></>;
}

export default function Scene01(){
  return <group position={[0,-0.02,0]}><Lighting/><Room/><Desk/><Chair/><Character/><GymZone/><ContactShadows position={[0,0.02,0]} opacity={0.46} scale={11} blur={2.8} far={7}/></group>;
}

useGLTF.preload(CHARACTER_URL);
