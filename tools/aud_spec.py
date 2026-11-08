import json, numpy as np, wave, sys
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from scipy.signal import spectrogram
import os; D=os.environ.get('AD','aud/'); m=json.load(open(D+'meta.json')); sr=m['sr']
w=wave.open(D+'all.wav'); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32767
marks=[mk for mk in m['marks']]
names=sys.argv[1:]
fig,axs=plt.subplots(len(names),1,figsize=(14,2.6*len(names)))
for ax,nm in zip(np.atleast_1d(axs),names):
    i=[k for k,mk in enumerate(marks) if mk[0]==nm][0]; s0=marks[i][1]; s1=marks[i+1][1]
    seg=x[s0:s1]
    f,t,S=spectrogram(seg,sr,nperseg=2048,noverlap=1536)
    ax.pcolormesh(t,f,10*np.log10(S+1e-12),shading='auto',vmin=-110,vmax=-30,cmap='magma'); ax.set_yscale('symlog',linthresh=200); ax.set_ylim(40,16000)
    ax.set_title(nm,fontsize=9); 
    # overlay loudness
    win=int(sr*0.1); k=len(seg)//win; r=20*np.log10(np.sqrt((seg[:k*win].reshape(k,win)**2).mean(1))+1e-9)
    ax2=ax.twinx(); ax2.plot(np.arange(k)*0.1,r,color='cyan',lw=0.8); ax2.set_ylim(-60,0)
plt.tight_layout(); plt.savefig(D+'spec_'+names[0]+'.png',dpi=70)
