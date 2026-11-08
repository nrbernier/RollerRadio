import sys, json, asyncio
from playwright.async_api import async_playwright
URL = "file://" + str(__import__("pathlib").Path(__file__).resolve().parent.parent / "dist") + "/city_test.html"
SETUP = r"""
document.getElementById('title').dispatchEvent(new PointerEvent('pointerdown'));
G.renderer.render = () => {};
const W=Game.W; window.BG=new Map(); const C=16; const key=(i,j)=>i+','+j;
for (const b of W.boxes){ if (b.dyn) continue; for (let i=Math.floor(b.x0/C); i<=Math.floor(b.x1/C); i++) for (let j=Math.floor(b.z0/C); j<=Math.floor(b.z1/C); j++){ const k=key(i,j); (BG.get(k)||BG.set(k,[]).get(k)).push(b); } }
window.boxAt=(x,y,z,m)=>{ const L=BG.get(key(Math.floor(x/C),Math.floor(z/C)))||[]; for (const b of L) if (x>b.x0+m&&x<b.x1-m&&z>b.z0+m&&z<b.z1-m&&y>b.y0+m&&y<b.y1-m) return b; return null; };
window.tp=(x,z,yaw)=>{const p=Game.player; p.pos.set(x,W.groundAt(x,z,terrainAt(x,z)+2).y,z); p.vel.set(0,0,0); p.yaw=yaw||0; p.mode='ground'; Game.cam.snap(p); W.updateCells(x,z,360);};
window.LOG={ issues:[], knocks:0, frames:0, modes:{}, grinds:0 };
for (const k of ['fell','hazard','bonk','grindStart']) { const f=hooks[k]; hooks[k]=(...a)=>{ if(k==='grindStart') LOG.grinds++; else { LOG.knocks++; LOG.issues.push([k, +Game.player.pos.x.toFixed(1), +Game.player.pos.z.toFixed(1), +Game.player.pos.y.toFixed(1)]); } return f(...a); }; }
window.spotIn=(k,seed)=>{ const R=PLAN.byKey[k].rect; let s=seed; const rr=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
 for (let i=0;i<3000;i++){ const x=R[0]+20+rr()*(R[2]-R[0]-40), z=R[1]+20+rr()*(R[3]-R[1]-40); const t=terrainAt(x,z), g=W.groundAt(x,z,t+2).y; if (Math.abs(g-t)<0.6 && t>2 && !boxAt(x,g+1,z,-1)) return [x,z]; } return null; };
window.runBot=(k,seed,secs)=>new Promise(res=>{ const sp=spotIn(k,seed); if(!sp) return res('nospot'); tp(sp[0],sp[1],seed%6); const K=Input.keys; let s=seed*7+1; const rr=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
  const p=Game.player; const t0=performance.now(); let hist=[]; let nextTurn=0, nextJump=0, camIn=0, camSamples=0, embed=0, under=0;
  K.KeyW=true; Input.kbActive=true;
  const iv=setInterval(()=>{ const t=(performance.now()-t0)/1000;
    if (t>nextTurn){ K.KeyA=false; K.KeyD=false; const r=rr(); if(r<0.3) K.KeyA=true; else if (r<0.6) K.KeyD=true; nextTurn=t+0.4+rr()*1.6; }
    if (t>nextJump){ Input.jumpQ.push(performance.now()); Input.jumpHeld=true; setTimeout(()=>Input.jumpHeld=false, 200+rr()*300); if (rr()<0.5) setTimeout(()=>Input.trickQ.push(performance.now()), 350); nextJump=t+1+rr()*3; }
    const P=p.pos; LOG.frames++; LOG.modes[p.mode]=(LOG.modes[p.mode]||0)+1;
    if (!isFinite(P.x+P.y+P.z)) { LOG.issues.push(['nan',k]); }
    const b=boxAt(P.x,P.y+0.9,P.z,0.15); if (b && b.tag!=='canopy' && !b.dyn) { embed++; if (embed%10===1) LOG.issues.push(['embed',b.tag||'box',+P.x.toFixed(1),+P.z.toFixed(1),+P.y.toFixed(1)]); }
    const c=G.camera.position; camSamples++; const cb=boxAt(c.x,c.y,c.z,0.05); if (cb) { camIn++; if (camIn%10===1) LOG.issues.push(['cam',cb.tag||'box',+c.x.toFixed(1),+c.z.toFixed(1),+c.y.toFixed(1),!!cb.nocam]); }
    else { const q=W.camGrid.query(c.x-0.1,c.z-0.1,c.x+0.1,c.z+0.1,[]); const cc=q.find(b=>c.x>b.x0&&c.x<b.x1&&c.z>b.z0&&c.z<b.z1&&c.y>b.y0&&c.y<b.y1); if (cc) { camIn++; if (camIn%10===1) LOG.issues.push(['camfoliage',+c.x.toFixed(1),+c.z.toFixed(1),+c.y.toFixed(1)]); } }
    if (c.y < terrainAt(c.x,c.z)+0.2 && !(Game.swim>0) && (LOG.cg=(LOG.cg||0)+1)%20===1) { LOG.issues.push(['camground',+c.x.toFixed(1),+c.z.toFixed(1),+c.y.toFixed(1)]); }
    if (P.y < terrainAt(P.x,P.z)-3 && !(Game.swim>0)) { under++; if (under%20===1) LOG.issues.push(['below',+P.x.toFixed(1),+P.z.toFixed(1),+P.y.toFixed(1),+terrainAt(P.x,P.z).toFixed(1),p.mode]); }
    hist.push([t,P.x,P.z]); while (hist.length && hist[0][0]<t-3) hist.shift();
    if (t>3 && hist.length>5 && Math.hypot(P.x-hist[0][1],P.z-hist[0][2])<1.0 && p.mode!=='grind') { LOG.issues.push(['stuck',k,+P.x.toFixed(1),+P.z.toFixed(1),+P.y.toFixed(1),p.mode]); hist=[]; K.KeyS=true; setTimeout(()=>K.KeyS=false,400); }
    if (t>secs){ clearInterval(iv); K.KeyW=K.KeyA=K.KeyD=false; res(k+' done d='+Math.hypot(P.x-sp[0],P.z-sp[1]).toFixed(0)); }
  },50); });
'ok'
"""
async def main():
    secs = float(sys.argv[1]); seeds = int(sys.argv[2])
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 320, 'height': 180})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL)
        await pg.wait_for_function("typeof Game !== 'undefined' && (Game.state === 'title' || Game.state === 'play')", timeout=240000, polling=1000)
        print(await pg.evaluate(SETUP), flush=True)
        await pg.wait_for_timeout(1000)
        for k in ['business','market','oldtown','obs','park','canals','lake','docks']:
            for s in range(seeds):
                print(await pg.evaluate(f"runBot('{k}',{s*97+13},{secs})"), flush=True)
        log = await pg.evaluate("JSON.stringify(LOG)")
        open('bot_log.json','w').write(log)
        L=json.loads(log); print('frames',L['frames'],'knocks',L['knocks'],'grinds',L['grinds'],'modes',L['modes'])
        import collections
        print(collections.Counter(i[0] for i in L['issues']))
        for e in errs[:5]: print('ERR', e)
        await b.close()
asyncio.run(main())
