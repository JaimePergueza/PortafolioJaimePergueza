import bpy,math
from mathutils import Vector
scene=bpy.context.scene;rig=bpy.data.objects['Personaje_Rig'];mesh=bpy.data.objects['Personaje_Referencia']
scene.frame_set(1)
# Add geometry to the exposed collar and joints in the rest pose, preserving weights.
pieces=[]
for n,r,material in [('Shin.L',.073,mesh.data.materials[12]),('Shin.R',.073,mesh.data.materials[12]),('Forearm.L',.044,mesh.data.materials[2]),('Forearm.R',.044,mesh.data.materials[2])]:
 p=rig.data.bones[n].head_local
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=r,location=p);o=bpy.context.object;o.name='Personaje | articulacion';bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);o.data.materials.append(material);g=o.vertex_groups.new(name=n);g.add(list(range(len(o.data.vertices))),1,'REPLACE');pieces.append(o)
vv=[];ff=[];count=12
for z,rx,ry in [(1.265,.13,.105),(1.33,.103,.077),(1.385,.049,.048)]:
 for i in range(count):
  a=i*2*math.pi/count;vv.append((math.cos(a)*rx,math.sin(a)*ry,z))
for j in range(2):
 for i in range(count):a=j*count+i;b=j*count+(i+1)%count;ff.extend([(a,b,a+count),(b,b+count,a+count)])
me=bpy.data.meshes.new('Pecho bajo el cuello');me.from_pydata(vv,[],ff);me.update();o=bpy.data.objects.new('Personaje | cuello de camiseta',me);scene.collection.objects.link(o);o.data.materials.append(mesh.data.materials[3]);g=o.vertex_groups.new(name='Chest');g.add(list(range(len(vv))),1,'REPLACE');pieces.append(o)
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True)
for o in pieces:o.select_set(True)
bpy.context.view_layer.objects.active=mesh;bpy.ops.object.join()
mesh.data.update()
preview=bpy.data.scenes['Personaje | estudio referencia'];preview.frame_set(1)
for o in preview.objects:
 if o.type=='LIGHT':o.data.energy*=1.6
# Aim the close-up at the face and hands from the front-right.
preview.camera.data.ortho_scale=1.72
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[1].default_value=.12
for name,power,loc,color in [('Personaje | luz frontal',180,(-1.5,1.0,2.5),(.85,.9,1)),('Personaje | luz escritorio',70,(1.1,3.1,2.6),(1,.65,.38))]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.size=2;o.data.color=color;o.rotation_euler=(Vector((1.1,2.6,1))-o.location).to_track_quat('-Z','Y').to_euler()
scene.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath='D:/Experimento/exports/personaje/MiZona_personaje_animado.blend')
bpy.ops.render.render(scene=preview.name,write_still=True)
print('REFINED',len(mesh.data.vertices),'vertices')
