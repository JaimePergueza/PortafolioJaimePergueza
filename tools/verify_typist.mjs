import fs from 'node:fs';
import assert from 'node:assert/strict';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer, Vector3 } from 'three';
const b=fs.readFileSync('public/models/Personaje_Typing.glb');
const gltf=await new Promise((resolve,reject)=>new GLTFLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'',resolve,reject));
const clip=gltf.animations.find(a=>/Typing_Seated/.test(a.name));assert(clip,'Falta animacion de escritura');assert(Math.abs(clip.duration-5)<.001);
const mixer=new AnimationMixer(gltf.scene);mixer.clipAction(clip).play();
function sample(time){mixer.setTime(time);gltf.scene.updateMatrixWorld(true);const result={};for(const n of ['Hips','HandL','Hand_L','Hand.L','Index3L','Index3_L','Index3.L','ShinL','Shin_L','Shin.L']){const o=gltf.scene.getObjectByName(n);if(o)result[n]=o.getWorldPosition(new Vector3()).toArray();}return result;}
const a=sample(0),bpose=sample(.375),end=sample(5);
let maxDelta=0;for(const n of Object.keys(a)){for(let i=0;i<3;i++){maxDelta=Math.max(maxDelta,Math.abs(a[n][i]-bpose[n][i]));assert(Math.abs(a[n][i]-end[n][i])<.0001,'Bucle discontinuo: '+n);}}
assert(maxDelta>.001,'La animacion no mueve el esqueleto');
let skinned=0,bones=0;gltf.scene.traverse(o=>{if(o.isSkinnedMesh){skinned++;bones=o.skeleton.bones.length;const attr=o.geometry.getAttribute('skinWeight');for(let i=0;i<attr.count;i++)assert(Math.abs(attr.getX(i)+attr.getY(i)+attr.getZ(i)+attr.getW(i)-1)<.002,'Pesos invalidos');}});
assert(skinned>0);assert(bones>=45);
const report={clip:clip.name,duration:clip.duration,skinnedPrimitives:skinned,bones,bytes:b.length,motionMeters:maxDelta,seamlessLoop:true,samples:{start:a,moving:bpose}};
fs.writeFileSync('exports/personaje/web_animation_validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
