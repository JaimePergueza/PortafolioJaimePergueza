import { ContactShadows, RoundedBox, Text } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

function material(color, roughness = 0.7, metalness = 0.05, emissive = "#000000", emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });
}

function Box({ args, position, rotation, color, roughness = 0.7, metalness = 0.05, castShadow = true, receiveShadow = true }) {
  return <mesh position={position} rotation={rotation} castShadow={castShadow} receiveShadow={receiveShadow}><boxGeometry args={args} /><meshStandardMaterial color={color} roughness={roughness} metalness={metalness} /></mesh>;
}

function Room() {
  const floor = useMemo(() => material("#633d27", 0.62), []);
  const concrete = useMemo(() => material("#211f1e", 0.92), []);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={floor}><planeGeometry args={[15, 10]} /></mesh>
    <mesh position={[0, 2.85, -4.75]} receiveShadow material={concrete}><boxGeometry args={[15, 5.7, 0.24]} /></mesh>
    <mesh position={[0, 5.68, 0]} receiveShadow material={concrete}><boxGeometry args={[15, 0.18, 10]} /></mesh>
    <Box args={[15, 0.08, 0.09]} position={[0, 0.08, -4.55]} color="#ff9b4b" roughness={0.35} />
    <Box args={[0.07, 0.07, 4.7]} position={[7.25, 0.07, -2.15]} color="#ff9b4b" roughness={0.35} />
  </group>;
}

function Skyline() {
  const buildings = useMemo(() => Array.from({ length: 20 }, (_, i) => ({ x: -5.5 + i * 0.55, w: 0.34 + ((i * 7) % 4) * 0.08, h: 0.8 + ((i * 11) % 8) * 0.2 })), []);
  return <group position={[-0.1, -1.8, -0.25]}>{buildings.map((b, i) => <group key={i} position={[b.x, b.h / 2, 0]}>
    <Box args={[b.w, b.h, 0.34]} color="#111a28" roughness={0.88} />
    {Array.from({ length: Math.max(2, Math.floor(b.h * 2.5)) }, (_, row) => [-0.09, 0.09].map((x, col) => <mesh key={`${row}-${col}`} position={[x, -b.h / 2 + 0.22 + row * 0.32, 0.18]}><planeGeometry args={[0.05, 0.075]} /><meshBasicMaterial color={(row + i + col) % 4 === 0 ? "#ffb35f" : "#6fa6ff"} /></mesh>))}
  </group>)}</group>;
}

function WindowWall() {
  const frame = useMemo(() => material("#090c11", 0.42, 0.45), []);
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#10213a", roughness: 0.12, transmission: 0.08, transparent: true, opacity: 0.74 }), []);
  return <group position={[-3.6, 2.75, -4.56]}>
    <mesh material={frame}><boxGeometry args={[6.4, 4.85, 0.2]} /></mesh>
    <mesh position={[0, 0, 0.115]} material={glass}><planeGeometry args={[6.08, 4.52]} /></mesh>
    {[-2.03, 0, 2.03].map(x => <mesh key={x} position={[x, 0, 0.18]} material={frame}><boxGeometry args={[0.075, 4.52, 0.08]} /></mesh>)}
    <mesh position={[0, 0, 0.18]} material={frame}><boxGeometry args={[6.08, 0.075, 0.08]} /></mesh>
    <mesh position={[0.4, 1.55, 0.2]}><circleGeometry args={[0.18, 32]} /><meshBasicMaterial color="#dbe8ff" /><pointLight color="#87aaff" intensity={3.8} distance={6} /></mesh>
    <Skyline />
  </group>;
}

function Monitor({ position, rotation = [0, 0, 0], title, lines }) {
  return <group position={position} rotation={rotation}>
    <RoundedBox args={[2.05, 1.22, 0.09]} radius={0.045} smoothness={3} castShadow><meshStandardMaterial color="#090c11" roughness={0.34} metalness={0.42} /></RoundedBox>
    <mesh position={[0, 0, 0.052]}><planeGeometry args={[1.88, 1.05]} /><meshStandardMaterial color="#07111e" emissive="#0c2948" emissiveIntensity={0.85} roughness={0.28} /></mesh>
    {lines ? <group position={[-0.67, 0.28, 0.065]}>{[0,1,2,3,4,5].map(line => <group key={line} position={[0,-line*0.14,0]}><Box args={[0.16,0.035,0.012]} color="#b77cff" castShadow={false} receiveShadow={false}/><Box args={[0.38,0.035,0.012]} position={[0.34,0,0]} color="#65c9ff" castShadow={false} receiveShadow={false}/><Box args={[0.24,0.035,0.012]} position={[0.7,0,0]} color="#ffb968" castShadow={false} receiveShadow={false}/></group>)}</group> : <><Text position={[0,0.12,0.068]} fontSize={0.18} color="#f5f7fb" anchorX="center">{title}</Text><Text position={[0,-0.17,0.068]} fontSize={0.085} color="#6ebcff" anchorX="center">WEB DEVELOPER</Text></>}
    <Box args={[0.12,0.45,0.12]} position={[0,-0.82,0]} color="#101318" metalness={0.48}/><Box args={[0.72,0.07,0.32]} position={[0,-1.03,0.04]} color="#101318" metalness={0.48}/>
  </group>;
}

function Chair() {
  const chair = useMemo(() => material("#111418", 0.46, 0.22), []);
  return <group position={[0.2,0.72,1.25]} rotation={[0,Math.PI,0]}>
    <RoundedBox args={[1.12,0.18,1.02]} radius={0.12} smoothness={4} material={chair} castShadow/>
    <RoundedBox args={[1.04,1.58,0.23]} radius={0.12} smoothness={4} position={[0,0.95,-0.4]} rotation={[-0.07,0,0]} material={chair} castShadow/>
    <RoundedBox args={[0.62,0.3,0.22]} radius={0.1} smoothness={4} position={[0,1.82,-0.42]} material={chair} castShadow/>
    <Box args={[0.12,0.82,0.12]} position={[0,-0.46,0]} color="#15191e" metalness={0.45}/>
  </group>;
}

function Desk() {
  const wood = useMemo(() => material("#754a2e", 0.58), []);
  const dark = useMemo(() => material("#111418", 0.43, 0.34), []);
  return <group position={[2.45,0,-2.5]}>
    <RoundedBox args={[5.6,0.2,1.75]} radius={0.07} smoothness={4} position={[0,1.12,0]} material={wood} castShadow receiveShadow/>
    <Box args={[1.0,1.1,1.55]} position={[-2.18,0.56,0]} color="#15181d" metalness={0.2}/><Box args={[1.0,1.1,1.55]} position={[2.18,0.56,0]} color="#15181d" metalness={0.2}/>
    <Monitor position={[-1.15,2.05,-0.24]} rotation={[0,0.08,0]} title="JAIME PERGUEZA"/><Monitor position={[1.15,2.05,-0.24]} rotation={[0,-0.08,0]} lines/>
    <RoundedBox args={[1.55,0.055,0.52]} radius={0.035} smoothness={3} position={[0,1.29,0.34]} material={dark}/>
    <PcTower position={[2.15,0.75,0.3]}/><Chair/>
    <rectAreaLight position={[0,2.65,-0.55]} width={4.5} height={1.7} intensity={5.2} color="#ffbd78"/>
    <pointLight position={[0,1.5,0.25]} color="#ff9b51" intensity={10} distance={5.5} decay={2}/>
  </group>;
}

function PcTower({ position }) {
  return <group position={position}><RoundedBox args={[0.72,1.4,1.08]} radius={0.06} smoothness={3} castShadow><meshStandardMaterial color="#0c1016" roughness={0.36} metalness={0.5}/></RoundedBox>{[0.38,-0.38].map(y=><mesh key={y} position={[0.365,y,0]} rotation={[0,Math.PI/2,0]}><circleGeometry args={[0.24,30]}/><meshStandardMaterial color="#14274c" emissive="#246cff" emissiveIntensity={2.2}/></mesh>)}</group>;
}

function ShelfAndPosters() {
  return <group>
    <group position={[1.7,3.85,-4.48]}><Box args={[5.0,0.13,0.52]} color="#6b432c" roughness={0.58}/><Box args={[4.7,0.035,0.05]} position={[0,-0.14,0.18]} color="#ff9c50" castShadow={false} receiveShadow={false}/>{["HTML","CSS","JS","TS","REACT","NEXT"].map((label,i)=><group key={label} position={[-1.95+i*0.78,0.34,0]}><Box args={[0.42,0.58,0.35]} color={["#927f8f","#8e7580","#88917f","#738595","#8e8b70","#9a7f69"][i]} roughness={0.75}/><Text position={[0,0,0.19]} fontSize={0.06} color="#151515" anchorX="center">{label}</Text></group>)}</group>
    <Poster position={[5.55,3.12,-4.52]} lines={["DISCIPLINA","ENFOQUE","CONSTANCIA","ÉXITO"]}/><Poster position={[6.55,3.12,-4.52]} lines={["</>","CODE.","BUILD.","INSPIRE."]}/>
  </group>;
}

function Poster({position,lines}) { return <group position={position}><Box args={[0.82,2.05,0.08]} color="#090b0e" metalness={0.25}/>{lines.map((line,i)=><Text key={line} position={[0,0.58-i*0.38,0.05]} fontSize={i===lines.length-1?0.16:0.1} color={i===lines.length-1?"#e7a663":"#c59a70"} anchorX="center">{line}</Text>)}</group>; }

function Dumbbell({position,scale=1}) { return <group position={position} scale={scale} rotation={[0,0,0.15]}><mesh rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[0.045,0.045,0.5,16]}/><meshStandardMaterial color="#2a2d31" metalness={0.65} roughness={0.35}/></mesh>{[-0.3,0.3].map(x=><mesh key={x} position={[x,0,0]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[0.15,0.15,0.15,16]}/><meshStandardMaterial color="#17191d" metalness={0.45} roughness={0.48}/></mesh>)}</group>; }

function DumbbellRack({position}) { return <group position={position}><Box args={[2.1,0.11,0.55]} position={[0,0.42,0]} color="#171a1e" metalness={0.52}/><Box args={[2.1,0.11,0.55]} position={[0,0.9,0]} color="#171a1e" metalness={0.52}/>{[-0.78,-0.25,0.28,0.8].map((x,i)=><group key={x}><Dumbbell position={[x,0.57,0]} scale={0.72+i*0.05}/><Dumbbell position={[x,1.05,0]} scale={0.67+i*0.05}/></group>)}</group>; }

function Gym() {
  const rubber = useMemo(() => material("#111316",0.93),[]);
  const dark = useMemo(() => material("#15181c",0.48,0.48),[]);
  return <group position={[-3.7,0,-1]}>
    <mesh position={[0,0.07,0]} receiveShadow material={rubber}><boxGeometry args={[5.3,0.12,4.35]}/></mesh><Box args={[5.15,0.035,0.045]} position={[0,0.145,2.05]} color="#ff9b50" castShadow={false} receiveShadow={false}/>
    <group position={[-1.55,0,-0.25]}>{[-0.8,0.8].map(x=><Box key={x} args={[0.14,2.65,0.2]} position={[x,1.35,0]} color="#171a1e" metalness={0.55}/>) }<mesh position={[0,2.15,0]} rotation={[0,0,Math.PI/2]} material={dark} castShadow><cylinderGeometry args={[0.055,0.055,2.6,18]}/></mesh>{[-1.37,1.37].map(x=><mesh key={x} position={[x,2.15,0]} rotation={[0,0,Math.PI/2]} material={dark} castShadow><cylinderGeometry args={[0.32,0.32,0.18,22]}/></mesh>)}</group>
    <RoundedBox args={[2.05,0.28,0.68]} radius={0.09} smoothness={4} position={[-0.65,0.55,0.82]} material={dark} castShadow/><Box args={[0.12,0.72,0.12]} position={[-1.38,0.26,0.82]} rotation={[0,0,-0.18]} color="#181b1f" metalness={0.5}/><Box args={[0.12,0.72,0.12]} position={[0.08,0.26,0.82]} rotation={[0,0,0.18]} color="#181b1f" metalness={0.5}/>
    <DumbbellRack position={[1.45,0,-0.35]}/><Dumbbell position={[0.75,0.23,1.5]} scale={1.05}/><Dumbbell position={[1.75,0.23,1.55]} scale={0.9}/>
  </group>;
}

function Plant({position,scale=1}) { return <group position={position} scale={scale}><mesh position={[0,0.32,0]} castShadow><cylinderGeometry args={[0.3,0.23,0.64,20]}/><meshStandardMaterial color="#151719" roughness={0.7}/></mesh>{[-0.38,-0.18,0,0.2,0.4].map((x,i)=><mesh key={x} position={[x*0.55,0.78+i*0.12,0]} rotation={[0,0,x]} castShadow><sphereGeometry args={[0.22,16,12]}/><meshStandardMaterial color={i%2?"#214c2e":"#183e28"} roughness={0.82}/></mesh>)}</group>; }

function Lighting() { return <><ambientLight intensity={0.36} color="#d5ddeb"/><hemisphereLight intensity={0.58} color="#7799cd" groundColor="#24150e"/><directionalLight castShadow position={[-4,7,6]} intensity={1.8} color="#a9c3ef" shadow-mapSize-width={2048} shadow-mapSize-height={2048}/><pointLight position={[-4.5,3.5,-3.8]} color="#7298ff" intensity={5.2} distance={8} decay={2}/><pointLight position={[3,2.4,-3.5]} color="#ffab62" intensity={8.5} distance={6} decay={2}/></>; }

export default function Scene01() { return <group><Lighting/><Room/><WindowWall/><ShelfAndPosters/><Desk/><Gym/><Plant position={[-6.25,0,-3.75]} scale={1.25}/><Plant position={[6.55,0,-3.75]} scale={1.1}/><ContactShadows position={[0,0.08,0]} opacity={0.42} scale={14} blur={2.8} far={8}/></group>; }
