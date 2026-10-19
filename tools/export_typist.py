import bpy,os,json,shutil
scene=bpy.context.scene;scene.frame_set(1)
rig=bpy.data.objects['Personaje_Rig'];mesh=bpy.data.objects['Personaje_Referencia']
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);mesh.select_set(True);bpy.context.view_layer.objects.active=rig
props=bpy.ops.export_scene.gltf.get_rna_type().properties
args={'filepath':'D:/Experimento/public/models/Personaje_Typing.glb','export_format':'GLB','use_selection':True,'export_animations':True,'export_frame_range':True,'export_force_sampling':True,'export_skins':True,'export_extras':True}
if 'export_animation_mode' in props:
 modes=[p.identifier for p in props['export_animation_mode'].enum_items]
 args['export_animation_mode']='ACTIVE_ACTIONS' if 'ACTIVE_ACTIONS' in modes else 'ACTIONS'
if 'export_all_armature_actions' in props:args['export_all_armature_actions']=False
if 'export_anim_slide_to_zero' in props:args['export_anim_slide_to_zero']=True
bpy.ops.export_scene.gltf(**args)
shutil.copy2(args['filepath'],'D:/Experimento/exports/personaje/Personaje_Typing.glb')
staticpath='D:/Experimento/public/models/MiZona_estudio.glb'
backup='D:/Experimento/exports/personaje/MiZona_web_antes_personaje.glb'
if not os.path.exists(backup):shutil.copy2(staticpath,backup)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
 if o.type in {'MESH','FONT','CURVE'} and not o.hide_render and o!=mesh and 'Personaje' not in o.name:
  if o.type=='MESH' and not len(o.data.vertices):continue
  o.select_set(True)
bpy.ops.export_scene.gltf(filepath=staticpath,export_format='GLB',use_selection=True,export_animations=False,export_apply=True,export_extras=True)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath='D:/Experimento/exports/personaje/MiZona_personaje_animado.blend')
print('EXPORTED',os.path.getsize(args['filepath']),'character bytes',os.path.getsize(staticpath),'scene bytes')
