import json, numpy as np, wave, math, collections, sys
import os; D=os.environ.get('AD','aud/')
m=json.load(open(D+'meta.json')); sr=m['sr']
w=wave.open(D+'all.wav'); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32767
MODES={'major':[0,2,4,5,7,9,11],'dorian':[0,2,3,5,7,9,10],'aeolian':[0,2,3,5,7,8,10],'mixolydian':[0,2,4,5,7,9,10],'phrygian':[0,1,3,5,7,8,10],'lydian':[0,2,4,6,7,9,11],'hijaz':[0,1,4,5,7,8,10],'harmonic':[0,2,3,5,7,8,11],'penta':[0,2,4,7,9]}
marks=m['marks']; notes=m['notes']
def db(v): return 20*math.log10(max(v,1e-9))
print(f"{'segment':26s} {'rms':>6s} {'peak':>6s} {'p95win':>7s} {'p5win':>7s} {'maxjump':>7s} {'notes/s':>7s} modes")
segs=[]
for i in range(len(marks)-1):
    name,s0,t0,n0=marks[i]; _,s1,t1,n1=marks[i+1]
    if name=='END': break
    seg=x[s0:s1]; 
    if len(seg)<sr: continue
    win=int(sr*0.4); k=len(seg)//win; r=np.sqrt((seg[:k*win].reshape(k,win)**2).mean(1)+1e-12); rd=20*np.log10(r)
    s1w=int(sr*1); k1=len(seg)//s1w; r1=20*np.log10(np.sqrt((seg[:k1*s1w].reshape(k1,s1w)**2).mean(1)+1e-12))
    nn=[n for n in notes if t0<=n[0]<t1]
    modes=collections.Counter((n[9],n[6],n[7]) for n in nn)
    print(f"{name:26s} {db(np.sqrt((seg**2).mean())):6.1f} {db(np.abs(seg).max()):6.1f} {np.percentile(rd,95):7.1f} {np.percentile(rd,5):7.1f} {np.abs(np.diff(r1)).max():7.1f} {len(nn)/(t1-t0):7.1f} {dict(modes.most_common(3))}")
    segs.append((name,s0,s1,t0,t1))
# pitch analysis
SKIP={'kick','snare','rim','ride','conga','doum','tek','frame','bird','quack','bark','clack','hoot','bubbles','land','scratch','softKick','hat','brush','shaker','clap','sub_unused'}
bycaller=collections.defaultdict(lambda:[0,0,collections.Counter()]); hi=[]
groups=collections.defaultdict(list)
for n in notes: groups[(round(n[0],4), n[3])].append(n)
sel=[]
for k,g in groups.items():
    g.sort(key=lambda n:n[1]); sel.append(g[0])
    for n in g[1:]:
        mid=69+12*math.log2(max(n[1],1)/440)
        if abs(mid-round(mid))<0.1 and abs(math.log2(n[1]/g[0][1])-round(math.log2(n[1]/g[0][1])))>0.01: sel.append(n)
for n in sel:
    t,f,typ,c1,c2,c3,root,mode,dg,place=n[:10]
    who=c1.split('.')[-1]
    if who in SKIP or who=='osc' or f<40 or f>5000: continue
    if who=='vox': f=f/0.97
    mid=69+12*math.log2(f/440)
    hi.append((mid,who,c2.split('.')[-1]))
    cents=(mid-round(mid))*100
    pc=(round(mid)-root)%12
    sc=MODES.get(mode,MODES['major'])
    ok=pc in sc
    b=bycaller[(who,c2.split('.')[-1])]
    b[0]+=1
    if not ok or abs(cents)>8: b[1]+=1; b[2][(mode,pc,round(cents))]+=1
print('\ncaller(instrument <- from)        notes  offkey/detuned  examples(mode,pc,cents)')
for k,v in sorted(bycaller.items(),key=lambda kv:-kv[1][1]):
    if v[1]==0: continue
    print(f"{k[0]+' <- '+k[1]:36s} {v[0]:5d} {v[1]:5d}  {v[2].most_common(4)}")
print('\nclean callers:', ', '.join(f"{k[0]}<-{k[1]}({v[0]})" for k,v in bycaller.items() if v[1]==0))
print('\nsfx calls:', collections.Counter(s[1] for s in m['sfx']).most_common())

hi.sort(reverse=True)
print('\nhighest pitched notes:', [(round(a),b,c) for a,b,c in hi[:12]])
byw=collections.defaultdict(list)
for a,b,c in hi: byw[b].append(a)
print('range by instrument:', {k:(round(min(v)),round(max(v)),len(v)) for k,v in byw.items()})
