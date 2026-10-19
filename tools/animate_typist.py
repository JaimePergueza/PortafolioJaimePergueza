import bpy,math,os,json
from mathutils import Matrix,Vector
OUT='D:/Experimento/exports/personaje';scene=bpy.context.scene
rig=bpy.data.objects['Personaje_Rig'];mesh=bpy.data.objects['Personaje_Referencia']
# Remove the raised construction strips and create a scoop in the tank neckline.
me=mesh.data
import bmesh
bm=bmesh.new();bm.from_mesh(me);bm.verts.ensure_lookup_table()
bad=[f for f in bm.faces if any(150<=v.index<174 for v in f.verts) or all(60<=v.index<72 for v in f.verts)]
bmesh.ops.delete(bm,geom=bad,context='FACES')
bm.verts.ensure_lookup_table()
for i in range(12):
 v=bm.verts[60+i];a=i*2*math.pi/12
 if math.sin(a)<-.1:v.co.z-=.085*max(0,-math.sin(a))**2
bm.to_mesh(me);bm.free();me.update()
# Position the existing chair and keyboard ergonomically.
for o in scene.objects:
 if o.name.startswith('Silla |'):o.location.x-=.13;o.location.y+=.08
 if o.name.startswith('Teclado |') or o.name=='Raton':o.location.y-=.12
rig.animation_data_clear();rig.rotation_euler=(0,0,0);rig.location=(0,0,0)
for pb in rig.pose.bones:pb.rotation_mode='QUATERNION';pb.matrix_basis.identity()
rest={b.name:(b.head_local.copy(),b.tail_local.copy(),b.matrix_local.copy()) for b in rig.data.bones}
hip=Vector((1.12,2.55,.635));origin=Vector((0,0,.9));rz=Matrix.Rotation(math.pi,4,'Z')
def pose_matrix(n,h,t,rotation=None):
 rh,rt,rm=rest[n];d=(Vector(t)-Vector(h)).normalized()
 rot=(rt-rh).normalized().rotation_difference(d).to_matrix().to_4x4() if rotation is None else rotation
 matrix=rot@rm;matrix.translation=Vector(h);return matrix
def put(n,h,t,rotation=None):rig.pose.bones[n].matrix=pose_matrix(n,h,t,rotation)
def solve(a,target,l1,l2,pole):
 v=target-a;dist=min(v.length,l1+l2-.0002);d=v.normalized();along=(l1*l1-l2*l2+dist*dist)/(2*dist);height=max(0,l1*l1-along*along)**.5
 p=Vector(pole)-a;p=(p-d*p.dot(d)).normalized();return a+d*along+p*height
scene.render.fps=24;scene.frame_start=1;scene.frame_end=121
sample=[]
for frame in range(1,122,2):
 scene.frame_set(frame);t=(frame-1)/24;phase=2*math.pi*t/5
 lean=math.radians(8)+math.sin(phase)*.006
 R=rz@Matrix.Rotation(lean,4,'X');M=Matrix.Translation(hip+Vector((0,0,.0015*math.sin(phase))))@R@Matrix.Translation(-origin)
 for n in ['Hips','Spine','Chest','Neck','Head']:
  h,tail,_=rest[n]
  if n=='Head':
   headrot=R@Matrix.Rotation(.018*math.sin(phase),4,'X')@Matrix.Rotation(.012*math.sin(phase*2),4,'Z');put(n,M@h,M@tail,headrot)
  else:put(n,M@h,M@tail,R)
  bpy.context.view_layer.update()
 for side,s in [('L',1),('R',-1)]:
  thigh,shin,foot='Thigh.'+side,'Shin.'+side,'Foot.'+side
  h=hip+rz@(rest[thigh][0]-origin);d=Vector((-s*.018,.36,-.075)).normalized();knee=h+d*(rest[thigh][1]-rest[thigh][0]).length
  ankle=knee+Vector((0,.018,-(rest[shin][1]-rest[shin][0]).length));put(thigh,h,knee);bpy.context.view_layer.update();put(shin,knee,ankle);bpy.context.view_layer.update()
  put(foot,ankle,ankle+rz@(rest[foot][1]-rest[foot][0]),rz);bpy.context.view_layer.update()
  upper,fore,hand='UpperArm.'+side,'Forearm.'+side,'Hand.'+side
  shoulder=M@rest[upper][0]
  wrist=Vector((1.12-s*.10+.002*math.sin(phase*3),2.868+.003*math.sin(phase*4+s),.785+.0035*math.sin(phase*(17 if s==1 else 19))))
  elbow=solve(shoulder,wrist,(rest[upper][1]-rest[upper][0]).length,(rest[fore][1]-rest[fore][0]).length,shoulder+Vector((-s*.25,-.10,-.4)))
  put(upper,shoulder,elbow);bpy.context.view_layer.update();put(fore,elbow,wrist);bpy.context.view_layer.update()
  hr=Matrix.Rotation(s*math.pi/2,4,'Z')@Matrix.Rotation(.01*math.sin(phase*17),4,'Y');hm=Matrix.Translation(wrist)@hr@Matrix.Translation(-rest[hand][0]);put(hand,wrist,hm@rest[hand][1],hr);bpy.context.view_layer.update()
  for fi,finger in enumerate(['Index','Middle','Ring','Pinky','Thumb']):
   count=2 if finger=='Thumb' else 3;previous=None
   tap=.5+.5*math.sin(phase*(13+fi)+s*.8+fi*1.7)
   for j in range(count):
    n=f'{finger}{j+1}.{side}';h0,t0,_=rest[n];h=hm@h0 if previous is None else previous
    angle=math.radians((6+tap*10)*(j+1) if finger!='Thumb' else 5+tap*4)
    fr=hr@Matrix.Rotation(s*angle,4,'Y');tail=h+fr@(t0-h0);put(n,h,tail,fr);bpy.context.view_layer.update();previous=tail
  if frame in [1,31,61,91,121]:sample.append({'frame':frame,'side':side,'wrist':list(wrist),'index_tip':list(rig.pose.bones['Index3.'+side].tail)})
 for pb in rig.pose.bones:
  pb.keyframe_insert(data_path='location',frame=frame,group=pb.name);pb.keyframe_insert(data_path='rotation_quaternion',frame=frame,group=pb.name);pb.keyframe_insert(data_path='scale',frame=frame,group=pb.name)
action=rig.animation_data.action;action.name='Typing_Seated'
# Explicit linear interpolation and a matching first/last pose make a seamless loop.
try:
 for slot in action.slots:
  for layer in action.layers:
   for strip in layer.strips:
    bag=strip.channelbag(slot)
    if bag:
     for curve in bag.fcurves:
      for key in curve.keyframe_points:key.interpolation='LINEAR'
except Exception:pass
rig['animation']='Typing_Seated';rig['duration_seconds']=5.0;rig['fingers_animated']=True;scene.frame_set(1)
# A three-quarter studio view of the seated pose, including the actual chair.
preview=bpy.data.scenes['Personaje | estudio referencia']
for o in scene.objects:
 if o.name.startswith('Silla |') and o.name not in preview.collection.objects:preview.collection.objects.link(o)
cam=preview.camera;cam.location=(2.5,4.2,1.95);cam.rotation_euler=(Vector((1.12,2.72,.85))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=1.75
for o in preview.objects:
 if o.type=='LIGHT':
  o.location=Vector((1.12,2.55,0))+o.location;o.rotation_euler=(Vector((1.12,2.55,1))-o.location).to_track_quat('-Z','Y').to_euler()
preview.frame_start=1;preview.frame_end=121;preview.render.fps=24;preview.frame_set(1);preview.render.filepath=OUT+'/personaje_sentado.png'
# Main scene camera for a full-room render.
bpy.ops.object.camera_add(location=(-1.9,-.95,2.4));cam2=bpy.context.object;cam2.name='Camara | personaje escribiendo';cam2.data.lens=26;cam2.rotation_euler=(Vector((.65,2.7,1.25))-cam2.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam2
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.resolution_x=1200;scene.render.resolution_y=850;scene.render.resolution_percentage=100;scene.render.filepath=OUT+'/MiZona_con_personaje.png'
with open(OUT+'/animation_manifest.json','w') as f:json.dump({'clip':'Typing_Seated','seconds':5,'fps':24,'frames':[1,121],'bones':len(rig.pose.bones),'vertices':len(me.vertices),'faces':len(me.polygons),'pose_samples':sample,'reference_match':'aproximacion modelada; no es una copia exacta'},f,indent=2)
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/MiZona_personaje_animado.blend')
bpy.ops.render.render(scene=preview.name,write_still=True)
print('ANIMATED',action.name,len(rig.pose.bones),'bones')
