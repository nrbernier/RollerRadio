import numpy as np, wave, json
from scipy.signal import butter, sosfilt
w=wave.open('aud/all.wav'); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32767
sr=44100; m=json.load(open('aud/meta.json')); marks=m['marks']
hp=butter(4,250,'hp',fs=sr,output='sos'); lp=butter(4,120,'lp',fs=sr,output='sos'); hi=butter(4,4000,'hp',fs=sr,output='sos')
db=lambda v: 20*np.log10(np.sqrt(np.mean(v**2))+1e-9)
print(f"{'seg':22s} {'full':>6s} {'<120':>6s} {'>250(phone)':>11s} {'>4k':>6s}  {'phone p10-p90 (0.4s)':>20s}")
for i in range(len(marks)-1):
    nm,s0=marks[i][0],marks[i][1]; s1=marks[i+1][1]
    if nm=='END': break
    seg=x[s0:s1]; ph=sosfilt(hp,seg)
    win=int(sr*0.4); k=len(ph)//win; r=20*np.log10(np.sqrt((ph[:k*win].reshape(k,win)**2).mean(1))+1e-9)
    print(f"{nm:22s} {db(seg):6.1f} {db(sosfilt(lp,seg)):6.1f} {db(ph):11.1f} {db(sosfilt(hi,seg)):6.1f}  {np.percentile(r,10):8.1f} {np.percentile(r,90):8.1f}")
