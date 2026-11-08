# usage: python3 tour.py out_prefix phase n_per_district [keys...]
import json, sys, subprocess
pre, phase, n = sys.argv[1], float(sys.argv[2]), int(sys.argv[3])
keys = sys.argv[4:] or ['park','obs','oldtown','business','market','canals','docks','lake']
setup = """document.getElementById('title').dispatchEvent(new PointerEvent('pointerdown')); window.errs=[]; window.addEventListener('error', e=>errs.push(e.message));
window.tp=(x,z,yaw,dist,y)=>{const p=Game.player; p.pos.set(x,y??Game.W.groundAt(x,z,terrainAt(x,z)+2).y,z); p.vel.set(0,0,0); p.yaw=yaw; p.mode='ground'; Game.cam.dist=dist||7; Game.cam.snap(p); Game.cam.yaw=yaw; Game.W.updateCells(x,z,360);};
let s=12345; const rr=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
const inBox=(x,y,z)=>Game.W.boxes.some(b=>x>b.x0-0.5&&x<b.x1+0.5&&z>b.z0-0.5&&z<b.z1+0.5&&y<b.y1&&y>b.y0-3);
window.PTS=[]; const keys=KEYS, n=NNN;
for (const k of keys){ const R=PLAN.byKey[k].rect; let got=0, tries=0; while(got<n && tries<4000){ tries++; const x=R[0]+20+rr()*(R[2]-R[0]-40), z=R[1]+20+rr()*(R[3]-R[1]-40); const g=Game.W.groundAt(x,z,terrainAt(x,z)+2).y; if (inBox(x,g+1,z)) continue; if (g<0.5) continue; PTS.push([k,x,z,rr()*6.28]); got++; } }
Sky.phase=PHASE; 'pts '+PTS.length""".replace("KEYS",json.dumps(keys)).replace("NNN",str(n)).replace("PHASE",str(phase))
steps=[{"eval":setup}]
N=len(keys)*n
for i in range(N):
    steps.append({"eval":f"const p=PTS[{i}]; Sky.phase={phase}; tp(p[1],p[2],p[3],7); p[0]+' '+p[1].toFixed(0)+','+p[2].toFixed(0)"})
    steps.append({"wait":2200,"shot":f"{pre}{i:02d}.png"})
steps.append({"eval":"JSON.stringify(errs.slice(0,5))"})
json.dump(steps,open(pre+'.json','w'))
out=subprocess.run(['timeout','900','python3','shot.py',pre+'.json','960','540'],capture_output=True,text=True).stdout
lines=[l for l in out.splitlines() if 'eval' in l or 'pageerror' in l]
print('\n'.join(lines))
from PIL import Image
for g in range(0,N,4):
    ims=[Image.open(f"{pre}{i:02d}.png").resize((640,360)) for i in range(g,min(N,g+4))]
    G=Image.new('RGB',(1280,720))
    for j,im in enumerate(ims): G.paste(im,((j%2)*640,(j//2)*360))
    G.save(f"{pre}_g{g//4}.png")
