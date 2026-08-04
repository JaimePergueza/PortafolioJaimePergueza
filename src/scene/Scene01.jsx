import { ContactShadows, RoundedBox, Text } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

function mat(color, roughness = 0.7, metalness = 0.05, emissive = "#000000", emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });
}

function Box({ args, position = [0,0,0], rotation = [0,0,0], color, roughness = 0.7, metalness = 0.05, castShadow = true, receiveShadow = true }) {
  return <mesh position={position} rotation={rotation} castShadow={castShadow} receiveShadow={receiveShadow}><boxGeometry args={args}/><meshStandardMaterial color={color} roughness={roughness} metalness={metalness}/></mesh>;
}

function Room() {
  const floor = useMemo(() => mat("#5b3724", 0.62), []);
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow material={floor}><planeGeometry args={[13.5,8.2]}/></mesh>
    <Box args={[5.9,5.5,0.22]} position={[3.72,2.75,-4.55]} color="#1d1b1b" roughness={0.92}/>
    <Box args={[0.22,5.5,8.2]} position={[6.62,2.75,-0.45]} color="#19191a" roughness={0.94}/>
    <Box args={[13.5,0.16,8.2]} position={[0,5.48,-0.45]} color="#171717" roughness={0.9}/>
    <Box args={[13.2,0.05,0.06]} position={[0,0.07,-4.35]} color="#ff9b50" roughness={0.35}/>
    <Box args={[0.05,0.05,7.7]} position={[6.45,0.07,-0.45]} color="#ff9b50" roughness={0.35}/>
  </group>;
}

function WindowFrame() {
  const frame = "#080b10";
  return <group position={[-3.35,2.7,-4.35]}>
    <Box args={[6.0,0.13,0.13]} position={[0,2.25,0]} color={frame} metalness={0.55}/>
    <Box args={[6.0,0.13,0.13]} position={[0,-2.25,0]} color={frame} metalness={0.55}/>
    <Box args={[0.13,4.63,0.13]} position={[-2.94,0,0]} color={frame} metalness={0.55}/>
    <Box args={[0.13,4.63,0.13]} position={[2.94,0,0]} color={frame} metalness={0.55}/>
    {[-1.48,0,1.48].map(x=><Box key={x} args={[0.075,4.5,0.1]} position={[x,0,0.04]} color={frame} metalness={0.55}/>) }
    <mesh position={[0,0,0.07]} renderOrder={5}><planeGeometry args={[5.86,4.48]}/><meshPhysicalMaterial color="#8aa7c7" roughness={0.06} transmission={0.1} transparent opacity={0.09} depthWrite={false}/></mesh>
  </group>;
}

function Monitor({ position, rotation=[0,0,0], code=false }) {
  return <group position={position} rotation={rotation}>
    <RoundedBox args={[2.0,1.2,0.08]} radius={0.04} smoothness={3} castShadow><meshStandardMaterial color="#080b10" roughness={0.35} metalness={0.42}/></RoundedBox>
    <mesh position={[0,0,0.046]}><planeGeometry args={[1.84,1.04]}/><meshStandardMaterial color="#07111e" emissive="#0a2747" emissiveIntensity={0.82}/></mesh>
    {code ? <group position={[-0.64,0.26,0.06]}>{[0,1,2,3,4,5].map(i=><group key={i} position={[0,-i*0.14,0]}><Box args={[0.18,0.03,0.01]} color="#bd77ff" castShadow={false}/><Box args={[0.36,0.03,0.01]} position={[0.34,0,0]} color="#6ccfff" castShadow={false}/><Box args={[0.22,0.03,0.01]} position={[0.68,0,0]} color="#ffb25f" castShadow={false}/></group>)}</group> : <><Text position={[0,0.1,0.06]} fontSize={0.17} color="#f5f7fb">JAIME PERGUEZA</Text><Text position={[0,-0.17,0.06]} fontSize={0.08} color="#69bfff">WEB DEVELOPER</Text></>}
    <Box args={[0.1,0.44,0.1]} position={[0,-0.8,0]} color="#101318" metalness={0.5}/>
  </group>;
}

function Chair() {
  const chair = useMemo(()=>mat("#111419",0.48,0.2),[]);
  return <group position={[1.55,0.78,-0.85]} rotation={[0,Math.PI,0]}>
    <RoundedBox args={[1.08,0.18,0.96]} radius={0.12} smoothness={4} material={chair} castShadow/>
    <RoundedBox args={[1.0,1.55,0.22]} radius={0.12} smoothness={4} position={[0,0.94,-0.38]} rotation={[-0.08,0,0]} material={chair} castShadow/>
    <RoundedBox args={[0.58,0.28,0.2]} radius={0.09} smoothness={4} position={[0,1.78,-0.4]} material={chair}/>
    <Box args={[0.11,0.82,0.11]} position={[0,-0.47,0]} color="#15191e" metalness={0.48}/>
  </group>;
}

function Desk() {
  const wood=useMemo(()=>mat("#75472c",0.56),[]);
  return <group position={[2.0,0,-2.35]}>
    <RoundedBox args={[5.3,0.19,1.55]} radius={0.07} smoothness={4} position={[0,1.1,0]} material={wood} castShadow receiveShadow/>
    <Box args={[0.88,1.08,1.35]} position={[-2.05,0.55,0]} color="#15181d" metalness={0.2}/>
    <Box args={[0.88,1.08,1.35]} position={[2.05,0.55,0]} color="#15181d" metalness={0.2}/>
    <Monitor position={[-1.02,2.0,-0.22]} rotation={[0,0.07,0]}/>
    <Monitor position={[1.08,2.0,-0.22]} rotation={[0,-0.07,0]} code/>
    <RoundedBox args={[1.45,0.05,0.5]} radius={0.03} smoothness={3} position={[0,1.27,0.33]}><meshStandardMaterial color="#101318" roughness={0.42} metalness={0.32}/></RoundedBox>
    <group position={[2.05,0.72,0.2]}><RoundedBox args={[0.7,1.35,1.0]} radius={0.06} smoothness={3}><meshStandardMaterial color="#0b0f15" roughness={0.35} metalness={0.5}/></RoundedBox>{[-0.34,0.34].map(y=><mesh key={y} position={[0.36,y,0]} rotation={[0,Math.PI/2,0]}><circleGeometry args={[0.23,30]}/><meshStandardMaterial color="#15264b" emissive="#246cff" emissiveIntensity={2}/></mesh>)}</group>
    <Chair/>
    <rectAreaLight position={[0,2.65,-0.4]} width={4.4} height={1.8} intensity={4.5} color="#ffc17d"/>
    <pointLight position={[0,1.45,0.15]} color="#ff9c55" intensity={7.2} distance={5.4} decay={2}/>
  </group>;
}

function Shelf() {
  return <group position={[1.8,3.75,-4.38]}>
    <Box args={[4.8,0.13,0.5]} color="#694029" roughness={0.58}/><Box args={[4.55,0.035,0.05]} position={[0,-0.13,0.17]} color="#ff9c50" castShadow={false}/>
    {["HTML","CSS","JS","TS","REACT","NEXT"].map((t,i)=><group key={t} position={[-1.85+i*0.73,0.32,0]}><Box args={[0.38,0.54,0.32]} color={["#927f8f","#8e7580","#88917f","#738595","#8e8b70","#9a7f69"][i]}/><Text position={[0,0,0.17]} fontSize={0.055} color="#151515">{t}</Text></group>)}
  </group>;
}

function Poster({position,lines}) {return <group position={position}><Box args={[0.78,1.96,0.07]} color="#090b0e" metalness={0.24}/>{lines.map((l,i)=><Text key={l} position={[0,0.54-i*0.36,0.045]} fontSize={i===lines.length-1?0.15:0.09} color={i===lines.length-1?"#e7a663":"#c59a70"}>{l}</Text>)}</group>}

function Dumbbell({position,scale=1,rotation=[0,0,0]}) {return <group position={position} scale={scale} rotation={rotation}><mesh rotation={[0,0,Math.PI/2]} castShadow receiveShadow><cylinderGeometry args={[0.045,0.045,0.5,16]}/><meshStandardMaterial color="#35383d" metalness={0.65} roughness={0.3}/></mesh>{[-0.3,0.3].map(x=><mesh key={x} position={[x,0,0]} rotation={[0,0,Math.PI/2]} castShadow receiveShadow><cylinderGeometry args={[0.15,0.15,0.15,16]}/><meshStandardMaterial color="#191b1f" metalness={0.45} roughness={0.42}/></mesh>)}</group>}

function Kettlebell({position,scale=1}) {
  return <group position={position} scale={scale}>
    <mesh castShadow receiveShadow><sphereGeometry args={[0.2,20,16]}/><meshStandardMaterial color="#1b1e22" roughness={0.42} metalness={0.38}/></mesh>
    <mesh position={[0,0.24,0]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[0.13,0.035,12,24,Math.PI]}/><meshStandardMaterial color="#30343a" metalness={0.55} roughness={0.32}/></mesh>
  </group>;
}

function Gym() {
  const rubber=useMemo(()=>mat("#101215",0.94),[]);
  const dark=useMemo(()=>mat("#171a1e",0.48,0.48),[]);
  return <group position={[-3.55,0,-1.15]} scale={0.78}>
    <mesh position={[0,0.06,0]} receiveShadow material={rubber}><boxGeometry args={[4.8,0.1,3.65]}/></mesh>

    <Box args={[4.65,0.035,0.045]} position={[0,0.13,1.73]} color="#5aa7ff" castShadow={false}/>
    <Box args={[4.65,0.035,0.045]} position={[0,0.13,-1.73]} color="#5aa7ff" castShadow={false}/>
    <Box args={[0.045,0.035,3.45]} position={[-2.32,0.13,0]} color="#5aa7ff" castShadow={false}/>
    <Box args={[0.045,0.035,3.45]} position={[2.32,0.13,0]} color="#5aa7ff" castShadow={false}/>

    <group position={[-1.25,0,-0.72]}>
      {[-0.72,0.72].map(x=><Box key={x} args={[0.13,2.4,0.18]} position={[x,1.22,0]} color="#171a1e" metalness={0.55}/>) }
      <mesh position={[0,1.95,0]} rotation={[0,0,Math.PI/2]} castShadow receiveShadow material={dark}><cylinderGeometry args={[0.05,0.05,2.35,18]}/></mesh>
      {[-1.23,1.23].map(x=><mesh key={x} position={[x,1.95,0]} rotation={[0,0,Math.PI/2]} castShadow receiveShadow material={dark}><cylinderGeometry args={[0.28,0.28,0.16,22]}/></mesh>)}
    </group>

    <group position={[-0.55,0,0.68]}>
      <RoundedBox args={[1.85,0.25,0.62]} radius={0.08} smoothness={4} position={[0,0.5,0]} castShadow receiveShadow><meshStandardMaterial color="#171a1e" roughness={0.5} metalness={0.4}/></RoundedBox>
      <Box args={[0.11,0.72,0.11]} position={[-0.67,0.24,0]} rotation={[0,0,-0.16]} color="#202329" metalness={0.5}/>
      <Box args={[0.11,0.72,0.11]} position={[0.67,0.24,0]} rotation={[0,0,0.16]} color="#202329" metalness={0.5}/>
    </group>

    <group position={[1.25,0,-0.7]}>
      <Box args={[1.8,0.1,0.5]} position={[0,0.42,0]} color="#171a1e" metalness={0.52}/>
      <Box args={[1.8,0.1,0.5]} position={[0,0.86,0]} color="#171a1e" metalness={0.52}/>
      {[-0.62,-0.2,0.22,0.64].map((x,i)=><group key={x}><Dumbbell position={[x,0.58,0]} scale={0.66+i*0.04}/><Dumbbell position={[x,1.0,0]} scale={0.62+i*0.04}/></group>)}
    </group>

    <Kettlebell position={[0.8,0.28,1.15]} scale={1.0}/>
    <Kettlebell position={[1.3,0.25,1.18]} scale={0.82}/>
    <mesh position={[1.85,0.35,1.08]} rotation={[0,0,Math.PI/2]} castShadow receiveShadow><cylinderGeometry args={[0.13,0.13,0.72,18]}/><meshStandardMaterial color="#365f50" roughness={0.72}/></mesh>

    <rectAreaLight position={[0,2.9,0.15]} rotation={[-Math.PI/2,0,0]} width={3.1} height={1.3} intensity={5.2} color="#8bbcff"/>
    <spotLight position={[-0.3,3.25,1.3]} target-position={[-0.4,0.4,-0.1]} angle={0.78} penumbra={0.8} intensity={2.2} color="#d8e6ff" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}/>
    <pointLight position={[-2.0,1.65,-1.35]} color="#6ea6ff" intensity={3.2} distance={5.5} decay={2}/>
    <pointLight position={[1.8,1.0,1.0]} color="#5aa7ff" intensity={1.4} distance={3.8} decay={2}/>
  </group>;
}

function Plant({position,scale=1}) {return <group position={position} scale={scale}><mesh position={[0,0.3,0]} castShadow><cylinderGeometry args={[0.28,0.22,0.6,20]}/><meshStandardMaterial color="#151719"/></mesh>{[-0.4,-0.2,0,0.2,0.4].map((x,i)=><mesh key={x} position={[x*0.55,0.75+i*0.11,0]} rotation={[0,0,x]} castShadow><sphereGeometry args={[0.2,16,12]}/><meshStandardMaterial color={i%2?"#214c2e":"#183e28"} roughness={0.82}/></mesh>)}</group>}

function Lighting(){return <><ambientLight intensity={0.46} color="#d5ddeb"/><hemisphereLight intensity={0.68} color="#7899cb" groundColor="#24150e"/><directionalLight castShadow position={[-3,6,5]} intensity={1.75} color="#a9c3ef" shadow-mapSize-width={2048} shadow-mapSize-height={2048}/><pointLight position={[-3.5,2.8,-3.7]} color="#7195ff" intensity={4.8} distance={8} decay={2}/><pointLight position={[2.7,2.2,-3.4]} color="#ffab62" intensity={6.0} distance={6} decay={2}/></>}

export default function Scene01(){return <group><Lighting/><Room/><WindowFrame/><Shelf/><Poster position={[5.2,3.0,-4.4]} lines={["DISCIPLINA","ENFOQUE","CONSTANCIA","ÉXITO"]}/><Poster position={[6.05,3.0,-4.4]} lines={["</>","CODE.","BUILD.","INSPIRE."]}/><Desk/><Gym/><Plant position={[-5.85,0,-3.55]} scale={1.05}/><Plant position={[6.0,0,-3.55]} scale={0.9}/><ContactShadows position={[0,0.08,0]} opacity={0.48} scale={13} blur={2.4} far={8}/></group>}
