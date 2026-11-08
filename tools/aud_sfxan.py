import numpy as np, wave, json, os
from scipy.signal import butter, sosfilt
D=os.environ.get('AD','aud/')
w=wave.open(D+'all.wav'); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32767
sr=44100; m=json.load(open(D+'meta.json')); marks=m['marks']
hp=butter(4,250,'hp',fs=sr,output='sos')
def stats(seg):
    ph=sosfilt(hp,seg); win=int(sr*0.05); k=len(ph)//win; r=np.sqrt((ph[:k*win].reshape(k,win)**2).mean(1))
    act=r>r.max()*0.1
    return 20*np.log10(np.abs(seg).max()+1e-9), 20*np.log10(r.max()+1e-9), 20*np.log10(np.sqrt((r[act]**2).mean())+1e-9), act.sum()*0.05
print(f"{'sfx':16s} {'peak':>6s} {'phone50ms max':>13s} {'phone active rms':>16s} {'dur':>5s}")
for i in range(len(marks)-1):
    nm,s0=marks[i][0],marks[i][1]; s1=marks[i+1][1]
    if nm=='END': break
    p,mx,ar,du=stats(x[s0:s1]); print(f"{nm:16s} {p:6.1f} {mx:13.1f} {ar:16.1f} {du:5.2f}")
