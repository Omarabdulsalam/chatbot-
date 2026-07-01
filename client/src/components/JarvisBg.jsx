import { useEffect, useRef } from 'react';

export default function JarvisBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let raf, t0  = null;

    const CFG = {
      accent:   '#1de9d6',
      accent2:  '#80fff5',
      bg:       '#02090b',
      label:    'Heal-ios',
      loopSecs: 22,
    };

    let W, H, CX, CY, R;
    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      CX = W / 2; CY = H / 2;
      R  = Math.min(W, H) * 0.215;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Perlin noise ─────────────────────────────────────────────────────
    const _p = new Uint8Array(512);
    {
      const t = new Uint8Array(256);
      for (let i = 0; i < 256; i++) t[i] = i;
      for (let i = 255; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [t[i], t[j]] = [t[j], t[i]];
      }
      for (let i = 0; i < 512; i++) _p[i] = t[i & 255];
    }
    const _fd = x => x*x*x*(x*(x*6-15)+10);
    const _lr = (a, b, t) => a + t*(b-a);
    const _gr = (h, x, y) => { h &= 7; const u=h<4?x:y, v=h<4?y:x; return((h&1)?-u:u)+((h&2)?-v:v); };
    function noise(x, y) {
      const xi=Math.floor(x)&255, yi=Math.floor(y)&255;
      x-=Math.floor(x); y-=Math.floor(y);
      const u=_fd(x), v=_fd(y);
      const a=_p[xi]+yi, aa=_p[a], ab=_p[a+1];
      const b=_p[xi+1]+yi, ba=_p[b], bb=_p[b+1];
      return _lr(_lr(_gr(_p[aa],x,y),  _gr(_p[ba],x-1,y),  u),
                 _lr(_gr(_p[ab],x,y-1),_gr(_p[bb],x-1,y-1),u), v);
    }

    // ── Easing ───────────────────────────────────────────────────────────
    const ease  = x => x<.5 ? 2*x*x : 1-Math.pow(-2*x+2,2)/2;
    const clamp = (x,lo,hi) => Math.max(lo,Math.min(hi,x));
    const ramp  = (t,a,b) => ease(clamp((t-a)/(b-a),0,1));

    // ── Persistent particle / arc pools ──────────────────────────────────
    const ptcls = [];
    const arcs  = [];

    // ── HUD label positions (fixed, slow drift) ───────────────────────────
    const hudLabels = [
      { angle: -0.42, rm: 1.95, text: 'ARC SYNC  98.2%'  },
      { angle:  0.72, rm: 2.06, text: 'NEURAL  ▸ 12ms'   },
      { angle:  2.20, rm: 1.96, text: 'SYS READY'        },
      { angle:  3.85, rm: 2.08, text: '◉ ONLINE  ●●●●●' },
      { angle:  5.20, rm: 1.92, text: 'FREQ 04.7kHz'     },
    ];

    // ─────────────────────────────────────────────────────────────────────
    //  DRAW FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────

    function bgGlow() {
      const g = ctx.createRadialGradient(CX,CY,0, CX,CY,Math.max(W,H)*.68);
      g.addColorStop(0,   'rgba(12,55,55,0.75)');
      g.addColorStop(.35, 'rgba(6,30,32,0.55)');
      g.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    }

    function hexGrid() {
      ctx.save();
      ctx.globalAlpha = .055; ctx.strokeStyle = CFG.accent; ctx.lineWidth = .6;
      const s=H*.033, sq3=Math.sqrt(3);
      const cols=Math.ceil(W/(s*1.5))+2, rows=Math.ceil(H/(s*sq3))+2;
      for (let c=-1;c<cols;c++) for (let r=-1;r<rows;r++) {
        const hx=c*s*1.5, hy=r*s*sq3+(c%2?s*sq3/2:0);
        ctx.beginPath();
        for (let i=0;i<6;i++) { const a=Math.PI/3*i-Math.PI/6; ctx.lineTo(hx+s*Math.cos(a),hy+s*Math.sin(a)); }
        ctx.closePath(); ctx.stroke();
      }
      ctx.restore();
    }

    function scanlines() {
      ctx.save(); ctx.globalAlpha=.032; ctx.fillStyle='#000';
      for (let y=0;y<H;y+=4) ctx.fillRect(0,y,W,2);
      ctx.restore();
    }

    // Rotating cone sweep with bright leading edge
    function scanBeam(t, alpha) {
      if (alpha<=0) return;
      const rot=t*.65, rOut=R*1.80, arcW=Math.PI*.10;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(CX,CY); ctx.arc(CX,CY,rOut,rot-arcW,rot); ctx.closePath();
      const g=ctx.createRadialGradient(CX,CY,0,CX,CY,rOut);
      g.addColorStop(0,   'rgba(30,233,214,0)');
      g.addColorStop(.4,  `rgba(30,233,214,${alpha*.07})`);
      g.addColorStop(1,   `rgba(30,233,214,${alpha*.16})`);
      ctx.fillStyle=g; ctx.fill();
      // Leading edge line
      ctx.globalAlpha=alpha*.65; ctx.strokeStyle=CFG.accent2;
      ctx.lineWidth=1.5; ctx.shadowColor=CFG.accent2; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.moveTo(CX,CY);
      ctx.lineTo(CX+Math.cos(rot)*rOut, CY+Math.sin(rot)*rOut); ctx.stroke();
      ctx.restore();
    }

    // Double-layer organic energy ring using 3 octaves of perlin noise
    function energyRing(t, alpha) {
      if (alpha<=0) return;
      const drawRing = (rBase, sc1, sc2, a1, a2, lw, glwW, glwA) => {
        const N=260, pts=[];
        for (let i=0;i<=N;i++) {
          const a=i/N*Math.PI*2;
          const n1=noise(Math.cos(a)*sc1+t*.32, Math.sin(a)*sc1+t*.25);
          const n2=noise(Math.cos(a)*sc2+t*.65, Math.sin(a)*sc2-t*.45);
          const n3=noise(Math.cos(a)*11 +t*1.1,  Math.sin(a)*11 +t*.9);
          const dr=n1*R*a1+n2*R*a2+n3*R*.04+Math.sin(a*4+t*1.8)*R*.04;
          pts.push({ x:CX+Math.cos(a)*(rBase+dr), y:CY+Math.sin(a)*(rBase+dr) });
        }
        ctx.save();
        ctx.globalAlpha=alpha*glwA; ctx.strokeStyle=CFG.accent2;
        ctx.lineWidth=glwW; ctx.shadowColor=CFG.accent2; ctx.shadowBlur=38;
        ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
        ctx.closePath(); ctx.stroke();
        ctx.globalAlpha=alpha; ctx.strokeStyle=CFG.accent;
        ctx.lineWidth=lw; ctx.shadowColor=CFG.accent; ctx.shadowBlur=10;
        ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
        ctx.closePath(); ctx.stroke();
        ctx.restore();
      };
      drawRing(R*1.88, 2.8, 5.5, .24, .11, 1.7, 16, .13); // outer
      drawRing(R*1.62, 2.2, 4.8, .14, .07, 1.0, 10, .09); // inner secondary
    }

    // Three concentric rings: base circle + bright arc segments + tick marks
    function concentricRings(t, alpha, scale) {
      if (alpha<=0) return;
      const rings = [
        { rm:1.28, spd: .20, ticks:60, arcs:4, aw:.50, lw:1.3 },
        { rm:1.50, spd:-.13, ticks:48, arcs:6, aw:.48, lw:.9  },
        { rm:1.72, spd: .09, ticks:72, arcs:9, aw:.42, lw:.7  },
      ];
      for (const ring of rings) {
        const r=R*ring.rm*scale, rot=t*ring.spd;
        ctx.save();
        ctx.strokeStyle=CFG.accent; ctx.shadowColor=CFG.accent;
        ctx.globalAlpha=alpha*.18; ctx.lineWidth=ring.lw; ctx.shadowBlur=3;
        ctx.beginPath(); ctx.arc(CX,CY,r,0,Math.PI*2); ctx.stroke();
        ctx.globalAlpha=alpha*.85; ctx.lineWidth=ring.lw*2.4; ctx.shadowBlur=14;
        for (let i=0;i<ring.arcs;i++) {
          const a0=rot+(i/ring.arcs)*Math.PI*2, a1=a0+Math.PI/ring.arcs*ring.aw;
          ctx.beginPath(); ctx.arc(CX,CY,r,a0,a1); ctx.stroke();
        }
        ctx.globalAlpha=alpha*.45; ctx.lineWidth=ring.lw; ctx.shadowBlur=5;
        for (let i=0;i<ring.ticks;i++) {
          const a=rot+(i/ring.ticks)*Math.PI*2, len=i%4===0?9:4;
          ctx.beginPath();
          ctx.moveTo(CX+Math.cos(a)*(r-len), CY+Math.sin(a)*(r-len));
          ctx.lineTo(CX+Math.cos(a)*r,        CY+Math.sin(a)*r);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Comet-tailed dots orbiting each ring
    function dataPackets(t, alpha, scale) {
      if (alpha<=0) return;
      const configs = [
        { rm:1.28, spd: .55, n:3 },
        { rm:1.50, spd:-.42, n:4 },
        { rm:1.72, spd: .28, n:2 },
      ];
      for (const c of configs) {
        const r=R*c.rm*scale;
        for (let i=0;i<c.n;i++) {
          const ba=t*c.spd+(i/c.n)*Math.PI*2;
          ctx.save();
          ctx.fillStyle=CFG.accent2; ctx.shadowColor=CFG.accent2;
          for (let j=0;j<=7;j++) {
            const ta=ba-j*.040*Math.sign(c.spd);
            ctx.globalAlpha=alpha*(1-j/8)*(j===0?1:.45);
            ctx.shadowBlur=j===0?20:8;
            ctx.beginPath();
            ctx.arc(CX+Math.cos(ta)*r, CY+Math.sin(ta)*r, j===0?3:2.4-j*.28, 0,Math.PI*2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
    }

    // Floating HUD readout labels around the outer ring
    function dataLabels(t, alpha) {
      if (alpha<=0) return;
      ctx.save();
      ctx.font=`${H*.013}px 'Courier New',monospace`;
      ctx.textBaseline='middle'; ctx.shadowBlur=8;
      for (const lb of hudLabels) {
        const a=lb.angle+t*.038;
        const x=CX+Math.cos(a)*R*lb.rm, y=CY+Math.sin(a)*R*lb.rm;
        const left=x<CX;
        ctx.textAlign=left?'right':'left';
        ctx.globalAlpha=alpha*(.45+.3*Math.sin(t*.9+lb.angle));
        ctx.fillStyle=CFG.accent; ctx.shadowColor=CFG.accent;
        ctx.fillText(lb.text, x+(left?-9:9), y);
        ctx.globalAlpha=alpha*.28; ctx.strokeStyle=CFG.accent; ctx.lineWidth=.6;
        ctx.beginPath();
        ctx.moveTo(x+(left?-4:4), y);
        ctx.lineTo(CX+Math.cos(a)*R*(lb.rm-.14), CY+Math.sin(a)*R*(lb.rm-.14));
        ctx.stroke();
      }
      ctx.restore();
    }

    // Spark particles emitting from the core
    function updateParticles(alpha) {
      if (alpha<=0) { ptcls.length=0; return; }
      if (ptcls.length<65 && Math.random()<.4) {
        const a=Math.random()*Math.PI*2, spd=.5+Math.random()*2.4;
        ptcls.push({
          x:CX+(Math.random()-.5)*R*.25, y:CY+(Math.random()-.5)*R*.25,
          vx:Math.cos(a)*spd, vy:Math.sin(a)*spd,
          life:1, decay:.006+Math.random()*.014, sz:.4+Math.random()*2,
        });
      }
      for (let i=ptcls.length-1;i>=0;i--) {
        const p=ptcls[i];
        p.x+=p.vx; p.y+=p.vy; p.vx*=.98; p.vy*=.98; p.life-=p.decay;
        if (p.life<=0) { ptcls.splice(i,1); continue; }
        ctx.save();
        ctx.globalAlpha=alpha*p.life*.55;
        ctx.fillStyle=p.sz>1.5?CFG.accent2:CFG.accent;
        ctx.shadowColor=CFG.accent; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
    }

    // Rare electric arcs: jagged lightning from core to energy ring
    function updateArcs(alpha) {
      if (alpha<=0) { arcs.length=0; return; }
      if (arcs.length<2 && Math.random()<.006)
        arcs.push({ angle:Math.random()*Math.PI*2, life:1, decay:.04+Math.random()*.06 });
      for (let i=arcs.length-1;i>=0;i--) {
        const arc=arcs[i]; arc.life-=arc.decay;
        if (arc.life<=0) { arcs.splice(i,1); continue; }
        const rEnd=R*1.82;
        const ex=CX+Math.cos(arc.angle)*rEnd, ey=CY+Math.sin(arc.angle)*rEnd;
        ctx.save();
        ctx.globalAlpha=alpha*arc.life*.8;
        ctx.strokeStyle=CFG.accent2; ctx.lineWidth=1.3;
        ctx.shadowColor=CFG.accent2; ctx.shadowBlur=24;
        ctx.beginPath(); ctx.moveTo(CX,CY);
        for (let j=1;j<11;j++) {
          const p=j/11;
          ctx.lineTo(CX+(ex-CX)*p+(Math.random()-.5)*R*.18, CY+(ey-CY)*p+(Math.random()-.5)*R*.18);
        }
        ctx.lineTo(ex,ey); ctx.stroke();
        ctx.restore();
      }
    }

    // Core: layered glow + geodesic mesh + inner rotating halo with diamond markers
    function core(t, alpha) {
      if (alpha<=0) return;
      const rc=R*.54, pulse=.92+Math.sin(t*1.7)*.08;
      ctx.save();
      // Ambient glow layers
      for (const [r,a] of [[rc*1.8,.07],[rc*1.25,.20],[rc*.85,.55]]) {
        const g=ctx.createRadialGradient(CX,CY,0,CX,CY,r*pulse);
        g.addColorStop(0,  `rgba(30,233,214,${a*alpha})`);
        g.addColorStop(.6, `rgba(10,90,100,${a*alpha*.4})`);
        g.addColorStop(1,  'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(CX,CY,r*pulse,0,Math.PI*2); ctx.fill();
      }
      // Bright center
      const gc=ctx.createRadialGradient(CX,CY,0,CX,CY,rc*.38*pulse);
      gc.addColorStop(0,`rgba(230,255,255,${alpha})`); gc.addColorStop(1,'rgba(30,233,214,0)');
      ctx.fillStyle=gc; ctx.beginPath(); ctx.arc(CX,CY,rc*.38*pulse,0,Math.PI*2); ctx.fill();
      // Triangle mesh (clipped)
      ctx.globalAlpha=alpha*.38; ctx.strokeStyle=CFG.accent;
      ctx.lineWidth=.55; ctx.shadowColor=CFG.accent; ctx.shadowBlur=3;
      ctx.save();
      ctx.beginPath(); ctx.arc(CX,CY,rc*.94,0,Math.PI*2); ctx.clip();
      const step=rc*.25;
      for (let row=-6;row<=6;row++) {
        const ry=CY+row*step*.87, off=(row%2)*step*.5;
        for (let col=-6;col<=6;col++) {
          const ox=CX+col*step+off;
          ctx.beginPath();
          ctx.moveTo(ox,      ry+step*.87);
          ctx.lineTo(ox+step, ry+step*.87);
          ctx.lineTo(ox+step*.5, ry);
          ctx.closePath(); ctx.stroke();
        }
      }
      ctx.restore();
      // Inner rotating halo ring
      ctx.globalAlpha=alpha*.7; ctx.strokeStyle=CFG.accent;
      ctx.lineWidth=1.1; ctx.shadowColor=CFG.accent; ctx.shadowBlur=14;
      ctx.beginPath(); ctx.arc(CX,CY,rc*1.08,0,Math.PI*2); ctx.stroke();
      // Four diamond markers on the halo
      const haRot=t*.55;
      ctx.fillStyle=CFG.accent2; ctx.shadowColor=CFG.accent2; ctx.shadowBlur=18;
      for (let i=0;i<4;i++) {
        const a=haRot+(i/4)*Math.PI*2;
        const mx=CX+Math.cos(a)*rc*1.08, my=CY+Math.sin(a)*rc*1.08;
        ctx.save();
        ctx.translate(mx,my); ctx.rotate(a+Math.PI/4);
        ctx.globalAlpha=alpha*.85;
        ctx.beginPath(); ctx.rect(-3.5,-3.5,7,7); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // Top HUD label with letter spacing
    function topLabel(alpha) {
      if (alpha<=0) return;
      ctx.save(); ctx.globalAlpha=alpha;
      const fs=H*.027;
      ctx.fillStyle=CFG.accent; ctx.shadowColor=CFG.accent2; ctx.shadowBlur=20;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font=`100 ${fs}px 'Courier New',monospace`;
      const label=CFG.label.toUpperCase(), space=fs*.9, totalW=(label.length-1)*space;
      for (let i=0;i<label.length;i++) ctx.fillText(label[i], CX-totalW/2+i*space, H*.045);
      // Circled "i"
      const ix=W*.91, iy=H*.04, ir=H*.018;
      ctx.strokeStyle=CFG.accent; ctx.lineWidth=1; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.arc(ix,iy,ir,0,Math.PI*2); ctx.stroke();
      ctx.font=`${ir}px 'Courier New',monospace`; ctx.fillText('i',ix,iy+ir*.05);
      ctx.restore();
    }

    // Glitch text: RGB fringing + horizontal scan bar during assembly
    const GCHARS = '!@#$%^&*<>?/|\\[]{}';
    function glitchText(progress, alpha) {
      if (alpha<=0||progress<=0) return;
      const chars=CFG.label.split(''), fs=R*.56;
      ctx.save();
      ctx.globalAlpha=alpha; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font=`bold ${fs}px 'Courier New',monospace`;
      let s='';
      chars.forEach((ch,i) => {
        const cp=clamp((progress-i/chars.length)*chars.length,0,1);
        s+=cp>=.8?ch:cp>0?GCHARS[Math.floor(Math.random()*GCHARS.length)]:'_';
      });
      if (progress<.82) {
        ctx.fillStyle=`rgba(255,40,40,${alpha*.45})`; ctx.fillText(s,CX+3,CY+3);
        ctx.fillStyle=`rgba(40,40,255,${alpha*.45})`; ctx.fillText(s,CX-3,CY-3);
        // Horizontal scan bar sweeping down through the text
        const scanY=CY-fs*.6+progress*fs*1.2;
        ctx.save();
        ctx.globalAlpha=alpha*.38; ctx.fillStyle=CFG.accent2;
        ctx.fillRect(CX-fs*1.5, scanY-2, fs*3, 4);
        ctx.restore();
      }
      ctx.fillStyle=CFG.accent; ctx.shadowColor=CFG.accent2; ctx.shadowBlur=28;
      ctx.fillText(s,CX,CY);
      ctx.restore();
    }

    // Clock with tick ring, seconds hand, live HH:MM
    function clock(alpha) {
      if (alpha<=0) return;
      const now=new Date(); let h=now.getHours();
      const m=now.getMinutes(), s=now.getSeconds(), ms=now.getMilliseconds();
      const ap=h>=12?'PM':'AM'; h=h%12||12;
      const ts=`${h}:${String(m).padStart(2,'0')}`;
      ctx.save(); ctx.globalAlpha=alpha;
      // Outer ring
      ctx.strokeStyle=CFG.accent; ctx.lineWidth=1.3; ctx.shadowColor=CFG.accent; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.arc(CX,CY,R*.68,0,Math.PI*2); ctx.stroke();
      // 60 tick marks
      for (let i=0;i<60;i++) {
        const a=(i/60)*Math.PI*2-Math.PI/2, len=i%5===0?10:5, r=R*.68;
        ctx.globalAlpha=alpha*(i%5===0?.8:.35); ctx.lineWidth=i%5===0?1.5:.8;
        ctx.beginPath();
        ctx.moveTo(CX+Math.cos(a)*(r-len), CY+Math.sin(a)*(r-len));
        ctx.lineTo(CX+Math.cos(a)*r,        CY+Math.sin(a)*r); ctx.stroke();
      }
      // Smooth seconds hand
      ctx.globalAlpha=alpha*.75; ctx.strokeStyle=CFG.accent2;
      ctx.lineWidth=1.6; ctx.shadowColor=CFG.accent2; ctx.shadowBlur=16;
      const sa=((s+ms/1000)/60)*Math.PI*2-Math.PI/2;
      ctx.beginPath(); ctx.moveTo(CX,CY);
      ctx.lineTo(CX+Math.cos(sa)*R*.62, CY+Math.sin(sa)*R*.62); ctx.stroke();
      // Time digits
      ctx.globalAlpha=alpha; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font=`bold ${R*.44}px 'Courier New',monospace`;
      ctx.fillStyle=CFG.accent2; ctx.shadowColor=CFG.accent2; ctx.shadowBlur=24;
      ctx.fillText(ts,CX,CY-R*.04);
      ctx.font=`${R*.15}px 'Courier New',monospace`; ctx.fillStyle=CFG.accent; ctx.shadowBlur=10;
      ctx.textAlign='left'; ctx.fillText(ap,CX+R*.46,CY-R*.24);
      ctx.textAlign='center'; ctx.fillText(String(s).padStart(2,'0'),CX,CY+R*.32);
      ctx.restore();
    }

    // Calendar card (flips in via Y-scale animation)
    function calendar(alpha, flip) {
      if (alpha<=0) return;
      const now=new Date();
      const month=now.toLocaleString('default',{month:'long'}).toUpperCase();
      const day=now.getDate(), dow=now.toLocaleString('default',{weekday:'short'}).toUpperCase();
      const cw=W*.38, ch=H*.17, scY=Math.abs(Math.cos(flip*Math.PI));
      ctx.save(); ctx.globalAlpha=alpha;
      ctx.translate(CX,CY); ctx.scale(1,scY||.001); ctx.translate(-CX,-CY);
      const x=CX-cw/2, y=CY-ch/2;
      ctx.fillStyle='rgba(2,9,11,0.9)'; ctx.strokeStyle=CFG.accent;
      ctx.lineWidth=1.5; ctx.shadowColor=CFG.accent; ctx.shadowBlur=22;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x,y,cw,ch,10); else ctx.rect(x,y,cw,ch);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle='rgba(30,233,214,.1)'; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x,y,cw,ch*.3,[10,10,0,0]); else ctx.rect(x,y,cw,ch*.3);
      ctx.fill();
      ctx.fillStyle=CFG.accent; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.shadowBlur=8;
      ctx.font=`${ch*.19}px 'Courier New',monospace`; ctx.fillText(month,CX,y+ch*.15);
      ctx.font=`bold ${ch*.52}px 'Courier New',monospace`; ctx.shadowBlur=18; ctx.fillText(String(day),CX,y+ch*.63);
      ctx.font=`${ch*.16}px 'Courier New',monospace`; ctx.shadowBlur=8; ctx.fillText(dow,CX,y+ch*.9);
      ctx.restore();
    }

    // Iron Man suit wireframe + animated power bar
    function suit(alpha, powerFrac) {
      if (alpha<=0) return;
      const sc=H*.0028, ox=W*.24, oy=H*.50;
      const L=(pts,close=false)=>{
        ctx.beginPath();
        pts.forEach(([x,y],i)=>i?ctx.lineTo(ox+x*sc,oy+y*sc):ctx.moveTo(ox+x*sc,oy+y*sc));
        if(close)ctx.closePath(); ctx.stroke();
      };
      ctx.save(); ctx.globalAlpha=alpha;
      ctx.strokeStyle=CFG.accent; ctx.lineWidth=1; ctx.shadowColor=CFG.accent; ctx.shadowBlur=10;
      L([[-20,-92],[-26,-58],[-14,-44],[14,-44],[26,-58],[20,-92]],true);
      L([[-14,-44],[14,-44],[16,-30],[-16,-30]],true);
      L([[-14,-72],[-6,-72],[-6,-62],[-14,-62]],true);
      L([[6,-72],[14,-72],[14,-62],[6,-62]],true);
      L([[-10,-30],[10,-30],[8,-18],[-8,-18]],true);
      L([[-20,-18],[20,-18],[24,12],[-24,12]],true);
      L([[-24,12],[24,12],[22,40],[-22,40]],true);
      L([[-22,40],[22,40],[20,66],[-20,66]],true);
      L([[-20,66],[20,66],[15,76],[-15,76]],true);
      L([[-20,-18],[-50,-8],[-54,20],[-26,22]],true);
      L([[20,-18],[50,-8],[54,20],[26,22]],true);
      L([[-54,20],[-50,56],[-30,58],[-26,22]],true);
      L([[54,20],[50,56],[30,58],[26,22]],true);
      ctx.strokeStyle=CFG.accent2; ctx.lineWidth=1.6; ctx.shadowBlur=22;
      ctx.beginPath(); ctx.arc(ox,oy-10*sc,10*sc,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle=`rgba(30,233,214,${alpha*.9})`; ctx.shadowBlur=30;
      ctx.beginPath(); ctx.arc(ox,oy-10*sc,5*sc,0,Math.PI*2); ctx.fill();
      ctx.restore();
      if (powerFrac>0) {
        const bx=W*.05, by=H*.88, bw=W*.38, bh=H*.016;
        ctx.save(); ctx.globalAlpha=alpha;
        ctx.fillStyle=CFG.accent; ctx.shadowColor=CFG.accent; ctx.shadowBlur=6;
        ctx.font=`${H*.016}px 'Courier New',monospace`;
        ctx.textAlign='left'; ctx.textBaseline='bottom';
        ctx.fillText(`POWER LEVEL   ${Math.round(powerFrac*100)}.0%`, bx, by-H*.005);
        ctx.strokeStyle=CFG.accent; ctx.lineWidth=1; ctx.shadowBlur=6; ctx.strokeRect(bx,by,bw,bh);
        ctx.fillStyle=CFG.accent; ctx.shadowBlur=18;
        ctx.fillRect(bx+1,by+1,(bw-2)*powerFrac,bh-2);
        ctx.restore();
      }
    }

    // ── Main loop ─────────────────────────────────────────────────────────
    function frame(ts) {
      if (!t0) t0=ts;
      const elapsed=(ts-t0)/1000;
      const t=elapsed%CFG.loopSecs;

      ctx.fillStyle=CFG.bg; ctx.fillRect(0,0,W,H);
      bgGlow(); hexGrid(); scanlines();

      // Phase ramps
      const coreA    = ramp(t, 0.0, 2.5);
      const ringA    = ramp(t, 1.2, 3.5);
      const glitchP  = ramp(t, 3.0, 4.8);
      const glitchA  = ramp(t, 3.0, 4.2) * (1-ramp(t, 4.7, 5.3));
      const expand   = ramp(t, 5.0, 7.5);
      const labelsA  = ramp(t, 5.5, 8.0) * (1-ramp(t, 20.5, 21.5));
      const clockA   = ramp(t, 8.0, 9.2)  * (1-ramp(t, 10.5, 11.2));
      const calA     = ramp(t, 11.0, 12.2) * (1-ramp(t, 13.5, 14.2));
      const calFlip  = ramp(t, 11.0, 12.4);
      const suitA    = ramp(t, 17.0, 18.5) * (1-ramp(t, 20.5, 21.5));
      const powerFrac= ramp(t, 17.5, 20.5);
      const labelA   = ramp(t, 0.3, 1.8);
      const ringScale= 1 + expand*.14;

      topLabel(labelA);
      if (coreA>0)    scanBeam(elapsed, coreA);
      if (coreA>0)    energyRing(elapsed, coreA);
      if (ringA>0)    concentricRings(elapsed, ringA, ringScale);
      if (ringA>0)    dataPackets(elapsed, ringA, ringScale);
      if (labelsA>0)  dataLabels(elapsed, labelsA);
      if (coreA>0)    updateParticles(coreA);
      if (coreA>0)    updateArcs(coreA);
      if (coreA>0)    core(elapsed, coreA);
      if (glitchA>0)  glitchText(glitchP, glitchA);
      if (clockA>0)   clock(clockA);
      if (calA>0)     calendar(calA, calFlip);
      if (suitA>0)    suit(suitA, powerFrac);

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
