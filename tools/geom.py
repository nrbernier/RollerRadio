import json, asyncio, collections
from playwright.async_api import async_playwright
URL = "file://" + str(__import__("pathlib").Path(__file__).resolve().parent.parent / "dist") + "/city_test.html"
JS = r"""
(() => {
const W=Game.W; const BG=new Map(); const C=16; const key=(i,j)=>i+','+j;
for (const b of W.boxes){ if (b.dyn) continue; for (let i=Math.floor(b.x0/C); i<=Math.floor(b.x1/C); i++) for (let j=Math.floor(b.z0/C); j<=Math.floor(b.z1/C); j++){ const k=key(i,j); (BG.get(k)||BG.set(k,[]).get(k)).push(b); } }
const boxAt=(x,y,z,m,skip)=>{ const L=BG.get(key(Math.floor(x/C),Math.floor(z/C)))||[]; for (const b of L) if (!(skip&&skip.has(b.tag)) && x>b.x0+m&&x<b.x1-m&&z>b.z0+m&&z<b.z1-m&&y>b.y0+m&&y<b.y1-m) return b; return null; };
const out={ tags:{}, walk:[], cars:[], trees:[], rails:[], railsUnder:[] };
for (const b of W.boxes) out.tags[b.tag||'none']=(out.tags[b.tag||'none']||0)+1;
const soft=new Set(['canopy','bounce']);
// pedestrians' paths
for (const n of W.npcs||[]) { if (n.kind!=='walk') continue; for (const P of n.paths) for (let j=0;j<P.length-1;j++){ const a=P[j], b=P[j+1], L=Math.hypot(b[0]-a[0],b[1]-a[1]); let hits=0, first=null; for (let s=0;s<=L;s+=1){ const x=a[0]+(b[0]-a[0])*s/L, z=a[1]+(b[1]-a[1])*s/L; const g=W.groundAt(x,z,terrainAt(x,z)+3).y; const bx=boxAt(x,g+0.9,z,0.05,soft); if (bx){ hits++; if(!first) first=[+x.toFixed(0),+z.toFixed(0),bx.tag||'box']; } } if (hits) out.walk.push([n.style,hits,first]); } }
// cars
for (const k in W.roads){ const R=W.roads[k]; if (!R.pts) continue; const P=R.pts; for (let j=0;j<P.length-1;j++){ const a=P[j], b=P[j+1], L=Math.hypot(b[0]-a[0],b[1]-a[1]), ux=(b[0]-a[0])/L, uz=(b[1]-a[1])/L; for (const lane of [-3.2,3.2]) { let hits=0, first=null; for (let s=0;s<=L;s+=1.5){ const x=a[0]+ux*s-uz*lane, z=a[1]+uz*s+ux*lane; const g=terrainAt(x,z); const bx=boxAt(x,g+1,z,0.05,soft); if (bx){ hits++; if(!first) first=[+x.toFixed(0),+z.toFixed(0),bx.tag||'box']; } } if (hits) out.cars.push([k,lane,hits,first]); } } }
// trees inside things
for (const t of W.treeList||[]) { const b=boxAt(t[0],t[1]+1.2,t[2],0.05,new Set(['tree','canopy','bounce'])); if (b) out.trees.push([+t[0].toFixed(0),+t[2].toFixed(0),b.tag||'box']); }
// rails: buried in boxes or underground
for (const r of W.rails){ let inBox=0, under=0, f1=null, f2=null; for (const sg of r.segs) for (let s=0;s<=sg.len;s+=1){ const x=sg.a.x+sg.dir.x*s, y=sg.a.y+sg.dir.y*s, z=sg.a.z+sg.dir.z*s; const b=boxAt(x,y+0.35,z,0.08,new Set(['canopy','bounce'])); if (b && b.tag!=='rail'){ inBox++; if(!f1) f1=[+x.toFixed(0),+z.toFixed(0),+y.toFixed(1),b.tag||'box']; } if (r.voice!=='metro' && y<terrainAt(x,z)-0.3){ under++; if(!f2) f2=[+x.toFixed(0),+z.toFixed(0),+y.toFixed(1),+terrainAt(x,z).toFixed(1)]; } } if (inBox>2) out.rails.push([r.kind,r.voice||'',r.hidden,inBox,+r.len.toFixed(0),f1]); if (under>2) out.railsUnder.push([r.kind,r.voice||'',under,+r.len.toFixed(0),f2]); }
// standers inside things
out.stand=[]; const skipS=new Set(['canopy','bounce','benchleg','bench','seat']);
for (const n of W.npcs||[]) { if (n.kind==='walk') continue; const pts = n.kind==='group' ? [[n.x,n.z,0,n.y]] : (n.pts||[]); for (const q of pts){ const x=q[0], z=q[1]; const g=q[3]!=null && typeof q[3]==='number' && q[3]>2.5 ? q[3] : W.groundAt(x,z,terrainAt(x,z)+3).y; const b=boxAt(x,g+1.0,z,0.1,skipS); if (b) out.stand.push([n.kind,n.style,+x.toFixed(0),+z.toFixed(0),b.tag||'box']); } }
return JSON.stringify(out);
})()
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 320, 'height': 180})
        await pg.goto(URL)
        await pg.wait_for_function("typeof Game !== 'undefined' && (Game.state === 'title' || Game.state === 'play')", timeout=240000, polling=1000)
        o = json.loads(await pg.evaluate(JS)); open('geom.json','w').write(json.dumps(o))
        print('tags', o['tags'])
        for k in ['walk','cars','trees','rails','railsUnder','stand']:
            print(f'\n== {k}: {len(o[k])}')
            if k=='walk':
                c=collections.Counter(w[0] for w in o[k]); print(c)
                for w in sorted(o[k],key=lambda w:-w[1])[:25]: print(' ',w)
            elif k=='trees':
                print(collections.Counter(t[2] for t in o[k]).most_common()); print(' ', o[k][:30])
            else:
                for w in o[k][:40]: print(' ',w)
        await b.close()
asyncio.run(main())
