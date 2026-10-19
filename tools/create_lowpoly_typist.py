import bpy,math,random,os,json
from mathutils import Vector,Matrix,Quaternion
random.seed(31)
OUT='D:/Experimento/exports/personaje';os.makedirs(OUT,exist_ok=True)
scene=bpy.context.scene
# Only remove the imported comparison asset created in this task.
old=bpy.data.collections.get('Personaje | Gym Buddy')
if old:
 for o in list(old.objects):bpy.data.objects.remove(o,do_unlink=True)
 bpy.data.collections.remove(old)
col=bpy.data.collections.new('Personaje | referencia low poly');scene.collection.children.link(col)
def mat(n,c,rough=.65,metal=0):
 m=bpy.data.materials.new(n);m.use_nodes=True;m.diffuse_color=(*c,1);p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
mats=[]
for i in range(6):mats.append(mat('Piel | faceta %d'%i,(.43+i*.018,.235+i*.013,.145+i*.009)))
for i in range(5):mats.append(mat('Camiseta | faceta %d'%i,(.145+i*.020,.155+i*.020,.16+i*.020)))
for i in range(4):mats.append(mat('Pantalon | faceta %d'%i,(.007+i*.003,.009+i*.003,.010+i*.003)))
for i in range(3):mats.append(mat('Cabello | faceta %d'%i,(.010+i*.005,.009+i*.004,.007+i*.003)))
SHOE=len(mats);mats.append(mat('Calzado azul grafito',(.025,.034,.049)))
GOLD=len(mats);mats.append(mat('Cruz y cadena doradas',(.68,.45,.095),.30,.7))
FRAME=len(mats);mats.append(mat('Montura negra',(.014,.016,.018),.36))
LENS=len(mats);mats.append(mat('Lentes gris humo',(.29,.34,.37),.18,.3))
LIP=len(mats);mats.append(mat('Labios',(.29,.14,.085)))
verts=[];faces=[];mi=[];weights=[]
def V(v,b):verts.append(tuple(v));weights.append({b:1} if isinstance(b,str) else b);return len(verts)-1
def F(v,m):faces.append(tuple(v));mi.append(m)
def ringmesh(stations,weightspec,material,segments=10):
 # stations = (center, radius across X, depth across Y), for vertical anatomy.
 rings=[]
 for j,(c,rx,ry) in enumerate(stations):
  wt=weightspec[j] if isinstance(weightspec,list) else weightspec
  rings.append([V(Vector(c)+Vector((math.cos(i*2*math.pi/segments)*rx,math.sin(i*2*math.pi/segments)*ry,0)),wt) for i in range(segments)])
 for j in range(len(rings)-1):
  for i in range(segments):
   a,b=rings[j][i],rings[j][(i+1)%segments];c,d=rings[j+1][(i+1)%segments],rings[j+1][i]
   m=material() if callable(material) else material
   F((a,b,c),m);F((a,c,d),material() if callable(material) else material)
 F(tuple(reversed(rings[0])),material() if callable(material) else material);F(rings[-1],material() if callable(material) else material)
def tube(points,radii,bone,material,segments=8):
 pp=[Vector(p) for p in points];rings=[]
 for j,(c,r) in enumerate(zip(pp,radii)):
  d=(pp[min(j+1,len(pp)-1)]-pp[max(0,j-1)]).normalized();ref=Vector((0,0,1)) if abs(d.z)<.9 else Vector((0,1,0));u=d.cross(ref).normalized();v=d.cross(u).normalized()
  rr=r if isinstance(r,tuple) else (r,r)
  rings.append([V(c+u*math.cos(i*2*math.pi/segments)*rr[0]+v*math.sin(i*2*math.pi/segments)*rr[1],bone) for i in range(segments)])
 for j in range(len(rings)-1):
  for i in range(segments):
   a,b=rings[j][i],rings[j][(i+1)%segments];c,d=rings[j+1][(i+1)%segments],rings[j+1][i];m=material() if callable(material) else material
   F((a,b,c),m);F((a,c,d),material() if callable(material) else material)
 F(tuple(reversed(rings[0])),material() if callable(material) else material);F(rings[-1],material() if callable(material) else material)
def solidbox(center,size,bone,material):
 c=Vector(center);s=Vector(size)/2;ids=[V(c+Vector((x*s.x,y*s.y,z*s.z)),bone) for x,y,z in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
 for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]:F([ids[i] for i in f],material)
skin=lambda:random.randrange(0,6);shirt=lambda:random.randrange(6,11);pants=lambda:random.randrange(11,15);hair=lambda:random.randrange(15,18)
# Torso with angular chest, broad shoulders, and a tapered waist.
ringmesh([((0,0,.855),.155,.10),((0,0,.96),.158,.105),((0,0,1.09),.17,.115),((0,0,1.22),.222,.135),((0,0,1.31),.225,.112),((0,0,1.36),.16,.075)],['Hips','Spine','Spine','Chest','Chest','Chest'],shirt,12)
# Scoop neck and skin trapezius: top tank shoulders are narrow straps.
tube([(-.19,0,1.31),(-.115,0,1.365),(-.055,0,1.38)],[.062,.046,.043],'Chest',skin)
tube([(.19,0,1.31),(.115,0,1.365),(.055,0,1.38)],[.062,.046,.043],'Chest',skin)
ringmesh([((0,0,1.335),.055,.051),((0,0,1.43),.057,.054),((0,0,1.465),.064,.059)],'Neck',skin,10)
# Tank chest covers the trapezius at the sides, keeping exposed upper neck.
for s in [-1,1]:tube([(s*.147,-.071,1.35),(s*.176,-.095,1.285)],[.022,.027],'Chest',shirt,6)
# Head: silhouette and jaw are designed as planar rings.
ringmesh([((0,-.022,1.425),.043,.048),((0,-.015,1.452),.068,.066),((0,0,1.49),.085,.079),((0,0,1.555),.100,.090),((0,0,1.615),.100,.088),((0,.002,1.665),.087,.078),((0,.005,1.70),.057,.052)],'Head',skin,12)
# Angular nose, nostrils and a neutral mouth.
ids=[V(p,'Head') for p in [(-.019,-.080,1.575),(.019,-.080,1.575),(-.023,-.096,1.529),(.023,-.096,1.529),(0,-.133,1.538),(0,-.10,1.591)]]
for f in [(0,2,4),(0,4,5),(5,4,1),(1,4,3),(2,3,4)]:F([ids[i] for i in f],skin())
tube([(-.034,-.083,1.493),(0,-.096,1.497),(.034,-.083,1.493)],[.004,.005,.003],'Head',LIP,5)
tube([(-.028,-.083,1.486),(0,-.094,1.481),(.028,-.083,1.486)],[.003,.006,.003],'Head',skin,5)
# Short, sharply outlined goatee and chin patch.
goatee=[(-.034,-.076,1.456),(-.024,-.079,1.441),(0,-.075,1.429),(.024,-.079,1.441),(.034,-.076,1.456),(.015,-.087,1.451),(-.015,-.087,1.451)]
F([V(v,'Head') for v in goatee],15)
# Hair cap: irregular polygonal hairline, short sides and swept crown.
rings=[];seg=12
for level in range(3):
 rr=[]
 for i in range(seg):
  a=i*2*math.pi/seg;front=max(0,-math.sin(a));back=max(0,math.sin(a));z=[1.598+front*.052-back*.026,1.688+math.cos(a)*.009,1.728-math.cos(a)*.005][level]
  rx=[.102,.101,.065][level];ry=[.091,.087,.057][level];rr.append(V((math.cos(a)*rx,math.sin(a)*ry+.003,z),'Head'))
 rings.append(rr)
for j in range(2):
 for i in range(seg):
  F((rings[j][i],rings[j][(i+1)%seg],rings[j+1][i]),hair());F((rings[j][(i+1)%seg],rings[j+1][(i+1)%seg],rings[j+1][i]),hair())
top=V((-.012,.012,1.735),'Head')
for i in range(seg):F((rings[2][i],rings[2][(i+1)%seg],top),hair())
for s in [-1,1]:
 ringmesh([((s*.102,.0,1.515),.017,.018),((s*.109,.0,1.55),.020,.019),((s*.103,.002,1.584),.012,.015)],'Head',skin,6)
 tube([(s*.043,-.085,1.633),(s*.078,-.070,1.628)],[.006,.005],'Head',15,5)
 # Rectangular, slightly trapezoidal lenses and frame.
 coords=[(s*.015,-.100,1.611),(s*.092,-.084,1.607),(s*.087,-.089,1.565),(s*.026,-.105,1.569)]
 F([V(c,'Head') for c in coords],LENS)
 for i in range(4):tube([coords[i],coords[(i+1)%4]],[.0035,.0035],'Head',FRAME,5)
 tube([(s*.092,-.084,1.607),(s*.108,.025,1.602)],[.0038,.0038],'Head',FRAME,5)
tube([(-.015,-.100,1.603),(0,-.107,1.608),(.015,-.100,1.603)],[.003,.003,.003],'Head',FRAME,5)
# Gold necklace and cross in the position shown in the reference.
for s in [-1,1]:tube([(s*.052,-.045,1.378),(s*.075,-.085,1.31),(0,-.139,1.222)],[.0016]*3,'Chest',GOLD,5)
solidbox((0,-.144,1.200),(.009,.004,.048),'Chest',GOLD);solidbox((0,-.144,1.212),(.029,.004,.008),'Chest',GOLD)
# Pelvis and trousers.
ringmesh([((0,0,.78),.145,.100),((0,0,.855),.165,.108),((0,0,.895),.154,.105)],'Hips',pants,12)
bones=[('Hips',(0,0,.90),(0,0,1.00),None),('Spine',(0,0,1.00),(0,0,1.18),'Hips'),('Chest',(0,0,1.18),(0,0,1.36),'Spine'),('Neck',(0,0,1.36),(0,0,1.44),'Chest'),('Head',(0,0,1.44),(0,0,1.70),'Neck')]
for side,s in [('L',1),('R',-1)]:
 ua='UpperArm.'+side;fa='Forearm.'+side;hand='Hand.'+side;thigh='Thigh.'+side;shin='Shin.'+side;foot='Foot.'+side
 bones += [(ua,(s*.205,0,1.335),(s*.455,0,1.30),'Chest'),(fa,(s*.455,0,1.30),(s*.685,0,1.285),ua),(hand,(s*.685,0,1.285),(s*.775,0,1.285),fa),(thigh,(s*.085,0,.85),(s*.112,0,.48),'Hips'),(shin,(s*.112,0,.48),(s*.115,.008,.105),thigh),(foot,(s*.115,.008,.105),(s*.115,-.135,.055),shin)]
 tube([(s*.186,0,1.335),(s*.245,0,1.335),(s*.315,0,1.325),(s*.385,0,1.312),(s*.458,0,1.30)],[(.075,.077),(.085,.088),(.071,.078),(.066,.068),(.041,.043)],ua,skin,8)
 tube([(s*.45,0,1.30),(s*.50,0,1.297),(s*.563,0,1.291),(s*.63,0,1.287),(s*.691,0,1.285)],[(.042,.043),(.061,.058),(.055,.049),(.041,.037),(.028,.026)],fa,skin,8)
 tube([(s*.68,0,1.285),(s*.73,0,1.285),(s*.777,0,1.285)],[(.029,.023),(.041,.020),(.035,.018)],hand,skin,8)
 for finger,offset,length in [('Index',-.025,.070),('Middle',-.008,.079),('Ring',.010,.072),('Pinky',.027,.057)]:
  for j in range(3):
   n=f'{finger}{j+1}.{side}';start=(s*(.768+j*length/3),offset,1.283);end=(s*(.768+(j+1)*length/3),offset,1.282-j*.001)
   parent=hand if j==0 else f'{finger}{j}.{side}';bones.append((n,start,end,parent));tube([start,end],[.0085-j*.0015,.007-j*.0015],n,skin,6)
 for j in range(2):
  n=f'Thumb{j+1}.{side}';a=(s*(.716+j*.028),-.039-j*.012,1.276-j*.004);b=(s*(.744+j*.028),-.051-j*.012,1.272-j*.004);bones.append((n,a,b,hand if j==0 else 'Thumb1.'+side));tube([a,b],[.011-j*.002,.009-j*.002],n,skin,6)
 ringmesh([((s*.085,0,.855),.099,.105),((s*.095,0,.76),.099,.104),((s*.105,0,.62),.086,.092),((s*.112,0,.472),.071,.074)],thigh,pants,8)
 ringmesh([((s*.112,0,.49),.071,.074),((s*.114,0,.38),.076,.081),((s*.115,0,.22),.062,.067),((s*.115,.008,.10),.056,.054)],shin,pants,8)
 ringmesh([((s*.115,-.055,.025),.069,.132),((s*.115,-.055,.065),.073,.133),((s*.115,-.008,.12),.052,.069)],foot,SHOE,8)
# Single low-poly skinned mesh and a standard deformation skeleton.
me=bpy.data.meshes.new('Personaje facetado | geometria');me.from_pydata(verts,[],faces);me.update();mesh=bpy.data.objects.new('Personaje_Referencia',me);col.objects.link(mesh)
for m in mats:me.materials.append(m)
for i,p in enumerate(me.polygons):p.material_index=mi[i];p.use_smooth=False
rigdata=bpy.data.armatures.new('Personaje | esqueleto');rig=bpy.data.objects.new('Personaje_Rig',rigdata);col.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for n,h,t,parent in bones:
 b=rigdata.edit_bones.new(n);b.head=h;b.tail=t
 if parent:b.parent=rigdata.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
for n,_,_,_ in bones:mesh.vertex_groups.new(name=n)
for i,w in enumerate(weights):
 for n,value in w.items():mesh.vertex_groups[n].add([i],value,'REPLACE')
mod=mesh.modifiers.new('Deformacion del personaje','ARMATURE');mod.object=rig;mesh.parent=rig
mesh['reference']='codex-clipboard-86c05484-de5b-43d8-a1dd-0095f11c3b0b.jpg';mesh['style']='low-poly muscular / camiseta gris / gafas rectangulares / cruz dorada'
# Correct normals consistently, leaving planar shading intact.
bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);bpy.context.view_layer.objects.active=mesh;bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
# Isolated studio for checking the reference character in standing T-pose.
preview=bpy.data.scenes.new('Personaje | estudio referencia');preview.collection.children.link(col);preview.world=bpy.data.worlds.new('Personaje | fondo neutro');preview.world.color=(.15,.15,.15)
def preview_obj(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 preview.collection.objects.link(o);return o
bpy.ops.object.camera_add(location=(2,-5,2.30));cam=preview_obj(bpy.context.object);cam.name='Personaje | camara frontal';cam.rotation_euler=(Vector((0,0,.90))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.0;preview.camera=cam
for loc,power in [((-2,-3,4),300),((3,-1,2.5),170)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=preview_obj(bpy.context.object);o.data.energy=power;o.data.size=3;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
preview.render.engine='CYCLES';preview.cycles.samples=24;preview.cycles.use_denoising=True;preview.render.resolution_x=900;preview.render.resolution_y=900;preview.render.resolution_percentage=100;preview.render.filepath=OUT+'/personaje_referencia_tpose.png'
preview.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/MiZona_personaje_modelado.blend')
bpy.ops.render.render(scene=preview.name,write_still=True)
print('CREATED',len(verts),'vertices',len(faces),'faces',len(bones),'bones')
