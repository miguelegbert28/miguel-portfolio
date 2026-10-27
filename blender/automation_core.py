import bpy, bmesh, math, random
from mathutils import Vector, Matrix, Euler
random.seed(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
scn=bpy.context.scene

def mat(name, base, metal=0.0, rough=0.5, trans=0.0, emit=None, estr=0.0, alpha=1.0, ior=1.45):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value=(*base,1)
    p.inputs['Metallic'].default_value=metal
    p.inputs['Roughness'].default_value=rough
    p.inputs['Transmission Weight'].default_value=trans
    p.inputs['IOR'].default_value=ior
    if emit:
        p.inputs['Emission Color'].default_value=(*emit,1); p.inputs['Emission Strength'].default_value=estr
    if alpha<1:
        p.inputs['Alpha'].default_value=alpha; m.blend_method='BLEND'
    return m

M_STEEL=mat('BrushedSteel',(0.62,0.64,0.67),1.0,0.32)
M_GRAPH=mat('Graphite',(0.06,0.065,0.075),0.9,0.45)
M_GLASS=mat('FrostedGlass',(0.75,0.9,0.95),0.0,0.28,trans=1.0)
M_TRACE=mat('EmissiveTrace',(0.0,0.6,0.8),0,0.4,emit=(0.0,0.85,1.0),estr=6.0)
M_NODE=mat('EmissiveNode',(0.6,0.95,1.0),0,0.3,emit=(0.55,0.95,1.0),estr=10.0)
M_CORE=mat('EmissiveCore',(0.9,0.98,1.0),0,0.2,emit=(0.75,0.97,1.0),estr=14.0)

root=bpy.data.objects.new('AutomationCore',None); scn.collection.objects.link(root)

def link(obj,parent=root):
    if obj.name not in scn.collection.objects: pass
    obj.parent=parent; return obj

def gear(name, r_out, r_in, thick, teeth, m, tooth_h=None):
    tooth_h = tooth_h or r_out*0.12
    bm=bmesh.new()
    # ring body
    bmesh.ops.create_circle(bm, cap_ends=False, radius=r_out, segments=teeth*4)
    me=bpy.data.meshes.new(name)
    bm.free()
    # use operators for simplicity
    bpy.ops.mesh.primitive_cylinder_add(vertices=max(32,teeth*4), radius=r_out, depth=thick)
    g=bpy.context.active_object; g.name=name
    # hole
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=r_in, depth=thick*3)
    h=bpy.context.active_object
    mod=g.modifiers.new('hole','BOOLEAN'); mod.object=h; mod.operation='DIFFERENCE'; mod.solver='EXACT'
    bpy.context.view_layer.objects.active=g; bpy.ops.object.modifier_apply(modifier='hole')
    bpy.data.objects.remove(h)
    # spoke cutouts
    n_cut=6 if r_out>0.35 else 0
    for i in range(n_cut):
        a=2*math.pi*i/n_cut
        rr=(r_out*0.7+r_in)/2
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=(r_out*0.7-r_in)*0.33, depth=thick*3, location=(rr*math.cos(a),rr*math.sin(a),0))
        c=bpy.context.active_object
        mod=g.modifiers.new('c','BOOLEAN'); mod.object=c; mod.operation='DIFFERENCE'; mod.solver='EXACT'
        bpy.context.view_layer.objects.active=g; bpy.ops.object.modifier_apply(modifier='c'); bpy.data.objects.remove(c)
    # teeth
    tw=2*math.pi*r_out/teeth*0.5
    for i in range(teeth):
        a=2*math.pi*i/teeth
        bpy.ops.mesh.primitive_cube_add(size=1, location=((r_out+tooth_h*0.4)*math.cos(a),(r_out+tooth_h*0.4)*math.sin(a),0), rotation=(0,0,a))
        t=bpy.context.active_object; t.scale=(tooth_h*1.6,tw,thick)
        bpy.ops.object.transform_apply(scale=True)
        bpy.ops.object.select_all(action='DESELECT'); t.select_set(True); g.select_set(True)
        bpy.context.view_layer.objects.active=g; bpy.ops.object.join()
    g.data.materials.append(m)
    bev=g.modifiers.new('bev','BEVEL'); bev.width=thick*0.12; bev.segments=2; bev.limit_method='ANGLE'
    bpy.context.view_layer.objects.active=g; bpy.ops.object.modifier_apply(modifier='bev')
    bpy.ops.object.shade_auto_smooth() if hasattr(bpy.ops.object,'shade_auto_smooth') else None
    return g

def place(o, loc=(0,0,0), rot=(0,0,0)):
    o.location=loc; o.rotation_euler=rot; o.parent=root; return o

# Core sphere
bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=0.32)
core=bpy.context.active_object; core.name='CoreGlow'; core.data.materials.append(M_CORE); bpy.ops.object.shade_smooth(); place(core)
# glass shell around core
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=0.46)
sh=bpy.context.active_object; sh.name='CoreShell'; sh.data.materials.append(M_GLASS)
w=sh.modifiers.new('w','WIREFRAME'); w.thickness=0.012
bpy.context.view_layer.objects.active=sh; bpy.ops.object.modifier_apply(modifier='w'); sh.data.materials[0]=M_STEEL; place(sh)

# Big gear rings on 3 axes
G1=gear('GearRingA',1.15,0.98,0.07,72,M_STEEL); place(G1,rot=(math.radians(90),0,0))
G2=gear('GearRingB',0.98,0.84,0.06,60,M_GRAPH); place(G2,rot=(0,math.radians(90),math.radians(20)))
G3=gear('GearRingC',0.82,0.70,0.05,52,M_STEEL); place(G3,rot=(math.radians(30),math.radians(-25),0))

# satellite gears
sats=[]
for i,(r,a,b) in enumerate([(0.22,0.3,0.9),(0.17,2.1,-0.4),(0.26,3.6,0.5),(0.15,4.7,-0.9),(0.2,5.6,0.2),(0.13,1.2,-1.1)]):
    g=gear(f'SatGear{i}',r,r*0.35,0.05,max(12,int(r*80)),M_STEEL if i%2 else M_GRAPH)
    d=1.32
    p=Vector((math.cos(a)*math.cos(b),math.sin(a)*math.cos(b),math.sin(b)))*d
    rot=p.to_track_quat('Z','Y').to_euler()
    place(g,loc=p,rot=rot); sats.append(g)

# Glass circuit plates: stacked concentric plates
for k,(r,z) in enumerate([(0.72,-0.16),(0.62,0.0),(0.72,0.16)]):
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=r, depth=0.025, location=(0,0,z))
    pl=bpy.context.active_object; pl.name=f'GlassPlate{k}'
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.5, depth=0.2, location=(0,0,z))
    hh=bpy.context.active_object
    mod=pl.modifiers.new('h','BOOLEAN'); mod.object=hh; mod.operation='DIFFERENCE'; mod.solver='EXACT'
    bpy.context.view_layer.objects.active=pl; bpy.ops.object.modifier_apply(modifier='h'); bpy.data.objects.remove(hh)
    pl.data.materials.append(M_GLASS)
    bev=pl.modifiers.new('b','BEVEL'); bev.width=0.006; bev.segments=2
    bpy.context.view_layer.objects.active=pl; bpy.ops.object.modifier_apply(modifier='b'); bpy.ops.object.shade_smooth()
    plate_parent=bpy.data.objects.new(f'PlateTilt{k}',None); scn.collection.objects.link(plate_parent); plate_parent.parent=root
    plate_parent.rotation_euler=(math.radians(62+k*8),math.radians(k*14-14),0)
    pl.parent=plate_parent
    # circuit traces on plate: radial segments with right angle bends
    for t in range(14):
        a=2*math.pi*t/14+k*0.2
        r1=0.52; r2=r-0.03
        rm=random.uniform(r1+0.04,r2-0.04)
        da=random.choice([-1,1])*0.12
        pts=[(r1,a),(rm,a),(rm+0.04,a+da),(r2,a+da)]
        crv=bpy.data.curves.new(f'Trace{k}_{t}','CURVE'); crv.dimensions='3D'; crv.bevel_depth=0.0055; crv.bevel_resolution=1
        sp=crv.splines.new('POLY'); sp.points.add(len(pts)-1)
        for j,(rr,aa) in enumerate(pts): sp.points[j].co=(rr*math.cos(aa),rr*math.sin(aa),z+0.016,1)
        ob=bpy.data.objects.new(f'Trace{k}_{t}',crv); scn.collection.objects.link(ob); ob.parent=plate_parent; crv.materials.append(M_TRACE)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=0.016,location=(r2*math.cos(a+da),r2*math.sin(a+da),z+0.016))
        nd=bpy.context.active_object; nd.data.materials.append(M_NODE); nd.parent=plate_parent

# Node pathways: nodes on sphere r=1.5 connected by arcs
nodes=[]
for i in range(16):
    v=Vector((random.gauss(0,1),random.gauss(0,1),random.gauss(0,1))).normalized()*random.uniform(1.25,1.55)
    nodes.append(v)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=random.uniform(0.03,0.055), location=v)
    n=bpy.context.active_object; n.name=f'PathNode{i}'; n.data.materials.append(M_NODE); place(n,loc=v)
    # tiny steel collar
    bpy.ops.mesh.primitive_torus_add(major_radius=0.07, minor_radius=0.008, location=v)
    tr=bpy.context.active_object; tr.data.materials.append(M_STEEL); tr.rotation_euler=v.to_track_quat('Z','Y').to_euler(); tr.parent=root
pairs=set()
for i,v in enumerate(nodes):
    d=sorted(range(len(nodes)),key=lambda j:(nodes[j]-v).length)[1:3]
    for j in d: pairs.add(tuple(sorted((i,j))))
for (i,j) in pairs:
    a,b=nodes[i],nodes[j]
    crv=bpy.data.curves.new(f'Path{i}_{j}','CURVE'); crv.dimensions='3D'; crv.bevel_depth=0.006; crv.bevel_resolution=2
    sp=crv.splines.new('POLY'); N=16; sp.points.add(N-1)
    for s in range(N):
        t=s/(N-1); p=a.lerp(b,t); rr=a.length*(1-t)+b.length*t
        p=p.normalized()*(rr+0.12*math.sin(math.pi*t))
        sp.points[s].co=(*p,1)
    ob=bpy.data.objects.new(f'Path{i}_{j}',crv); scn.collection.objects.link(ob); ob.parent=root; crv.materials.append(M_TRACE)
# inner spokes core->ring
for i in range(8):
    a=2*math.pi*i/8
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.018, depth=0.5, location=(0.72*math.cos(a),0,0.72*math.sin(a)), rotation=(0,math.pi/2-a,0))
    s=bpy.context.active_object; s.data.materials.append(M_GRAPH); s.parent=root

# convert curves to meshes
bpy.ops.object.select_all(action='DESELECT')
for o in list(scn.objects):
    if o.type=='CURVE':
        o.select_set(True); bpy.context.view_layer.objects.active=o
bpy.ops.object.convert(target='MESH')
tris=sum(len(o.data.polygons) for o in scn.objects if o.type=='MESH')
print('POLYS',tris, 'OBJS',len(scn.objects))
import os
out=os.path.join(os.getcwd(),'automation_core.glb')
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7, export_apply=True, export_yup=True)
# also an uncompressed copy
bpy.ops.export_scene.gltf(filepath=out.replace('.glb','_raw.glb'), export_format='GLB', export_apply=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(os.getcwd(),'automation_core.blend'))
