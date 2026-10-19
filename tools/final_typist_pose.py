import bpy,math,json
from mathutils import Matrix,Vector
OUT='D:/Experimento/exports/personaje';scene=bpy.context.scene;rig=bpy.data.objects['Personaje_Rig'];mesh=bpy.data.objects['Personaje_Referencia']
source=open('D:/Experimento/tools/animate_typist.py',encoding='utf-8').read()
pose=source[source.index('rig.animation_data_clear();'):source.index('# A three-quarter studio view')]
exec(pose.replace('.785+.0035','.775+.0035'))
with open(OUT+'/animation_manifest.json','w') as f:json.dump({'clip':rig.animation_data.action.name,'seconds':5,'fps':24,'frames':[1,121],'bones':len(rig.pose.bones),'vertices':len(mesh.data.vertices),'triangles':sum(len(p.vertices)-2 for p in mesh.data.polygons),'pose_samples':sample,'reference_match':'aproximacion; no es una copia exacta'},f,indent=2)
scene.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=OUT+'/MiZona_personaje_animado.blend')
print('TYPING_CONTACT_ADJUSTED')
