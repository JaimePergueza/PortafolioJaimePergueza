import bpy,json
from mathutils import Vector
scene=bpy.context.scene
print('FILE',bpy.data.filepath,'CAMERA',scene.camera.name if scene.camera else None)
for o in scene.objects:
 if o.type=='ARMATURE' or any(s in o.name.lower() for s in ['cuerpo','chair','silla','teclado','banco','character','mesh_0','escritorio']):
  print(json.dumps({'name':o.name,'type':o.type,'loc':list(o.location),'dims':list(o.dimensions),'min':[min((o.matrix_world@Vector(c))[i] for c in o.bound_box) for i in range(3)],'max':[max((o.matrix_world@Vector(c))[i] for c in o.bound_box) for i in range(3)],'bones':list(o.data.bones.keys()) if o.type=='ARMATURE' else [],'verts':len(o.data.vertices) if o.type=='MESH' else 0,'hidden':o.hide_render}))
