import sys, json, time, base64, asyncio, struct, os
from playwright.async_api import async_playwright
URL = "file://" + str(__import__("pathlib").Path(__file__).resolve().parent.parent / "dist") + "/city_test.html"
OUT = 'aud/'
PATCH = r"""
(() => {
  window.REC = { chunks: [], n: 0, marks: [], notes: [], sfx: [] };
  const AC = window.AudioContext;
  const oc = BaseAudioContext.prototype.createOscillator;
  BaseAudioContext.prototype.createOscillator = function () {
    const o = oc.call(this), p = o.frequency, sv = p.setValueAtTime.bind(p); let first = true;
    p.setValueAtTime = (v, t) => { if (first) { first = false; const st = (new Error().stack || '').split('\n'); const nm = l => ((l || '').trim().split(' ')[1] || '?');
      const SS = (typeof Sound !== 'undefined') ? Sound : null, H = SS && SS.H; REC.notes.push([t, v, o.type, nm(st[3]), nm(st[4]), nm(st[5]), H ? H.root : 0, H ? H.modeName : '', H ? H.deg : 0, SS ? SS.place : '', H && H.next ? H.next.root : -1]); }
      return sv(v, t); };
    return o; };
  const cn = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (d, ...a) {
    if (d instanceof AudioDestinationNode && !this.__rec) {
      const ctx = this.context;
      if (!ctx.__sp) { const sp = ctx.createScriptProcessor(4096, 2, 1); sp.__rec = true; ctx.__sp = sp;
        sp.onaudioprocess = e => { const L = e.inputBuffer.getChannelData(0), R = e.inputBuffer.getChannelData(1), m = new Float32Array(L.length); for (let i = 0; i < L.length; i++) m[i] = (L[i] + R[i]) * 0.5; REC.chunks.push(m); REC.n += m.length; REC.sr = ctx.sampleRate; };
        cn.call(sp, d); }
      cn.call(this, ctx.__sp);
    }
    return cn.call(this, d, ...a);
  };
})();
"""
SETUP = r"""
document.getElementById('title').dispatchEvent(new PointerEvent('pointerdown'));
window.tp=(x,z,yaw)=>{const p=Game.player; p.pos.set(x,Game.W.groundAt(x,z,terrainAt(x,z)+2).y,z); p.vel.set(0,0,0); p.yaw=yaw||0; p.mode='ground'; Game.cam.snap(p); Game.W.updateCells(x,z,360);};
window.mark=(name)=>{ REC.marks.push([name, REC.n, Sound.ctx.currentTime, REC.notes.length]); return name+' @'+REC.n; };
for (const k in Sound.sfx) { const f = Sound.sfx[k]; Sound.sfx[k] = (...a) => { REC.sfx.push([Sound.ctx.currentTime, k, JSON.stringify(a).slice(0,60)]); return f(...a); }; }
G.renderer.render = () => {};
window.mover=null; window.moveTo=(x0,z0,x1,z1,secs)=>{ const t0=performance.now(); clearInterval(mover); mover=setInterval(()=>{ const u=Math.min(1,(performance.now()-t0)/1000/secs); const x=x0+(x1-x0)*u, z=z0+(z1-z0)*u; const p=Game.player; p.pos.set(x,Game.W.groundAt(x,z,terrainAt(x,z)+2).y,z); p.vel.set((x1-x0)/secs,0,(z1-z0)/secs); if(u>=1) clearInterval(mover); },50); };
'ok ' + Sound.ready
"""
async def main():
    scen = json.load(open(sys.argv[1]))
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 320, 'height': 180})
        logs = []
        pg.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
        await pg.add_init_script(PATCH)
        await pg.goto(URL)
        await pg.wait_for_function("typeof Game !== 'undefined' && (Game.state === 'title' || Game.state === 'play')", timeout=240000, polling=1000)
        print(await pg.evaluate(SETUP))
        await pg.wait_for_timeout(1500)
        for st in scen:
            if 'eval' in st: r = await pg.evaluate(st['eval']); print('eval', str(r)[:200])
            if 'mark' in st: print(await pg.evaluate(f"mark({json.dumps(st['mark'])})"))
            if 'wait' in st: await pg.wait_for_timeout(st['wait'])
        await pg.evaluate("mark('END')")
        meta = await pg.evaluate("JSON.stringify({sr: REC.sr, n: REC.n, marks: REC.marks, notes: REC.notes, sfx: REC.sfx})")
        open(OUT + 'meta.json', 'w').write(meta)
        m = json.loads(meta); print('samples', m['n'], 'sr', m['sr'], 'notes', len(m['notes']))
        # pull audio in pieces
        total = m['n']; step = 48000 * 20; pos = 0; raw = bytearray()
        while pos < total:
            b64 = await pg.evaluate(f"""(() => {{ const s={pos}, e=Math.min(REC.n, {pos+step}); let all=new Int16Array(e-s), k=0, idx=0;
              for (const c of REC.chunks) {{ const c0=idx, c1=idx+c.length; idx=c1; if (c1<=s||c0>=e) continue; for (let i=Math.max(s,c0); i<Math.min(e,c1); i++) {{ const v=Math.max(-1,Math.min(1,c[i-c0])); all[k++]=v*32767; }} }}
              let bin=''; const u=new Uint8Array(all.buffer); for (let i=0;i<u.length;i+=8192) bin+=String.fromCharCode.apply(null,u.subarray(i,i+8192)); return btoa(bin); }})()""")
            raw += base64.b64decode(b64); pos += step
        sr = m['sr']
        with open(OUT + 'all.wav', 'wb') as f:
            f.write(b'RIFF' + struct.pack('<I', 36 + len(raw)) + b'WAVEfmt ' + struct.pack('<IHHIIHH', 16, 1, 1, sr, sr * 2, 2, 16) + b'data' + struct.pack('<I', len(raw)) + raw)
        for l in logs: print(l)
        await b.close()
asyncio.run(main())
