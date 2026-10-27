import bpy, math
scn=bpy.context.scene
scn.render.engine='CYCLES'; scn.cycles.samples=48; scn.cycles.device='CPU'
scn.render.resolution_x=800; scn.render.resolution_y=800
w=bpy.data.worlds.new('w'); scn.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=(0.02,0.025,0.03,1); w.node_tree.nodes['Background'].inputs[1].default_value=1.0
cam=bpy.data.cameras.new('c'); co=bpy.data.objects.new('cam',cam); scn.collection.objects.link(co); co.location=(3.2,-3.2,2.0); 
co.rotation_euler=(math.radians(66),0,math.radians(45)); scn.camera=co
for loc,e in [((3,-2,4),400),((-4,2,1),200)]:
    l=bpy.data.lights.new('l','AREA'); l.energy=e; l.size=3; lo=bpy.data.objects.new('l',l); lo.location=loc; scn.collection.objects.link(lo)
    lo.rotation_euler=(lo.location*-1).to_track_quat('-Z','Y').to_euler()
scn.render.filepath='//preview.png'
bpy.ops.render.render(write_still=True)
