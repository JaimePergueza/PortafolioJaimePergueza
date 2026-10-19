import fs from 'node:fs';
const base='D:/Experimento-respaldo-20261018-192940/Assets/';
for(const file of ['Meshy_AI_T_Pose_Gym_Buddy_0524215726_texture.glb','Meshy_AI_T_Pose_Gym_Buddy_biped/Meshy_AI_T_Pose_Gym_Buddy_biped_Character_output.glb','Meshy_AI_T_Pose_Gym_Buddy_biped/Meshy_AI_T_Pose_Gym_Buddy_biped_Meshy_AI_Meshy_Merged_Animations.glb']){
 const b=fs.readFileSync(base+file);const j=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
 console.log(JSON.stringify({file,bytes:b.length,meshes:j.meshes?.map(m=>({name:m.name,primitives:m.primitives.map(p=>({verts:j.accessors[p.attributes.POSITION]?.count,material:p.material,triangles:j.accessors[p.indices]?.count/3}))})),materials:j.materials?.map(m=>({name:m.name,pbr:m.pbrMetallicRoughness})),skins:j.skins?.map(s=>({name:s.name,bones:s.joints.map(i=>j.nodes[i].name)})),animations:j.animations?.map(a=>({name:a.name,channels:a.channels.length}))}));
}
