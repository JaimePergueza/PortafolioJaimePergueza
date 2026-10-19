import bpy,os,json
from mathutils import Vector
out='D:/Experimento/exports/personaje'
os.makedirs(out,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=out+'/MiZona_antes_personaje.blend',copy=True)
scene=bpy.context.scene;before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath='D:/Experimento-respaldo-20261018-192940/Assets/Meshy_AI_T_Pose_Gym_Buddy_biped/Meshy_AI_T_Pose_Gym_Buddy_biped_Character_output.glb')
objects=set(bpy.data.objects)-before
col=bpy.data.collections.new('Personaje | Gym Buddy');scene.collection.children.link(col)
for o in objects:
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o)
arm=next(o for o in objects if o.type=='ARMATURE');arm.name='GymBuddy_Rig';arm.animation_data_clear()
for o in objects:
 if o.type=='MESH':o.name='GymBuddy_Mesh';o.animation_data_clear()
for pb in arm.pose.bones:pb.matrix_basis.identity()
bpy.context.view_layer.update()
print('ARM',list(arm.location),list(arm.rotation_euler),list(arm.scale))
for b in arm.data.bones:print('BONE',b.name,list(b.head_local),list(b.tail_local))
for o in objects:
 if o.type=='MESH':print('MESH',o.name,list(o.dimensions),[[round(v,3) for v in o.matrix_world@Vector(c)] for c in o.bound_box])
preview=bpy.data.scenes.new('Personaje | revision');preview.collection.children.link(col);preview.world=bpy.data.worlds.new('Personaje | mundo');preview.world.color=(.2,.2,.2)
bpy.ops.object.camera_add(location=(2,-4,1.8));cam=bpy.context.object;cam.name='Personaje | camara revision'
for c in list(cam.users_collection):c.objects.unlink(cam)
preview.collection.objects.link(cam);cam.rotation_euler=(Vector((0,0,.9))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.8;preview.camera=cam
for name,loc,power in [('Key',(-2,-3,4),400),('Fill',(3,-1,2),200)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name='Personaje | '+name;o.data.energy=power;o.data.size=3;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
 for c in list(o.users_collection):c.objects.unlink(o)
 preview.collection.objects.link(o)
preview.render.engine='CYCLES';preview.cycles.samples=20;preview.cycles.use_denoising=True;preview.render.resolution_x=800;preview.render.resolution_y=800;preview.render.resolution_percentage=100;preview.render.film_transparent=False;preview.render.filepath=out+'/personaje_original.png'
bpy.ops.render.render(scene=preview.name,write_still=True)
print('IMPORTED',out+'/personaje_original.png')
