import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const FloatingHeart = forwardRef(function FloatingHeart({ onCrackDone }, ref) {
  const canvasRef = useRef(null);
  const onDoneRef = useRef(onCrackDone);
  useEffect(() => { onDoneRef.current = onCrackDone; }, [onCrackDone]);

  const st = useRef({
    t: 0,
    phase: 'float',   // float | zoom | crack | flash
    floatX: 0, floatY: 0,
    startX: 0, startY: 0, startSize: 70,
    zoomT: 0,
    crackT: 0, cracks: [],
    flashT: 0,
    curSize: 70,
  });

  useImperativeHandle(ref, () => ({
    triggerCrack() {
      const s = st.current;
      if (s.phase !== 'float') return;
      s.startX = s.floatX;
      s.startY = s.floatY;
      s.startSize = s.curSize;
      s.zoomT = 0;
      // Generate jagged crack lines
      const n = 13;
      s.cracks = Array.from({ length: n }, (_, i) => {
        let angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const pts = [];
        let x = 0, y = 0;
        for (let j = 0; j < 6; j++) {
          angle += (Math.random() - 0.5) * 0.55;
          const len = 0.065 + Math.random() * 0.11;
          x += Math.cos(angle) * len;
          y += Math.sin(angle) * len;
          pts.push([x, y]);
        }
        return pts;
      });
      s.phase = 'zoom';
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Draw heart path centred at (cx, cy) with given size
    const heartPath = (cx, cy, size) => {
      const sc = size / 28;
      ctx.save();
      ctx.translate(cx - 18 * sc, cy - 17.5 * sc);
      ctx.scale(sc, sc);
      ctx.beginPath();
      ctx.moveTo(18, 31);
      ctx.bezierCurveTo(18, 31, 4, 22, 4, 12.5);
      ctx.bezierCurveTo(4, 7.8, 7.8, 4, 12.5, 4);
      ctx.bezierCurveTo(15.2, 4, 18, 6.5, 18, 6.5);
      ctx.bezierCurveTo(18, 6.5, 20.8, 4, 23.5, 4);
      ctx.bezierCurveTo(28.2, 4, 32, 7.8, 32, 12.5);
      ctx.bezierCurveTo(32, 22, 18, 31, 18, 31);
      ctx.closePath();
      ctx.restore();
    };

    // Animated ECG wave – scanning left-to-right on a 1.6s beat cycle
    const drawECG = (cx, cy, w, h, alpha) => {
      const beatCycle = 1.6;
      const phase = (st.current.t % beatCycle) / beatCycle;
      const scan = Math.min(1, phase / 0.65);
      const fade = phase > 0.65 ? Math.max(0, 1 - (phase - 0.65) / 0.35) : 1;
      const a = alpha * fade;
      if (a < 0.02) return;

      const pts = [
        [0, 0], [0.12, 0], [0.20, -0.48], [0.26, 0.88],
        [0.31, -0.30], [0.37, 0], [0.56, 0], [0.63, -0.68],
        [0.69, 0.36], [0.76, 0], [1, 0],
      ];
      const vis = pts.filter(([x]) => x <= scan);
      if (vis.length < 2) return;

      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      vis.forEach(([px, py], i) => {
        const x = cx - w / 2 + px * w;
        const y = cy + py * h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = Math.max(1.2, w / 32);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.stroke();

      // Glowing scan-head dot
      if (scan < 1) {
        const headPt = vis[vis.length - 1];
        const hx = cx - w / 2 + headPt[0] * w;
        const hy = cy + headPt[1] * h;
        const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 8);
        hg.addColorStop(0, 'rgba(255,255,255,0.9)');
        hg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(hx, hy, 8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    };

    const easeInOut = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

    const fillHeart = (cx, cy, size, alpha) => {
      const g = ctx.createLinearGradient(cx - size, cy - size, cx + size, cy + size);
      g.addColorStop(0, '#ff6b9d'); g.addColorStop(1, '#c9003c');
      ctx.save();
      ctx.globalAlpha = alpha;
      heartPath(cx, cy, size);
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
    };

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const s = st.current;
      s.t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // Adjust z-index live so heart goes above app during crack/zoom/flash
      canvas.style.zIndex =
        s.phase === 'float' ? '0' : '20';

      if (s.phase === 'float') {
        const x = W * (0.5 + 0.40 * Math.sin(s.t * 0.27) * Math.cos(s.t * 0.155));
        const y = H * (0.5 + 0.36 * Math.sin(s.t * 0.215 + 1.1) * Math.cos(s.t * 0.12));
        s.floatX = x; s.floatY = y;

        const pulse = 1 + Math.sin(s.t * 2.2) * 0.07;
        const size = 68 * pulse;
        s.curSize = size;
        const alpha = 0.45 + Math.sin(s.t * 1.5) * 0.10;

        // Halo glow
        const halo = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5);
        halo.addColorStop(0, `rgba(255,60,100,${alpha * 0.40})`);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(x, y, size * 1.5, 0, Math.PI * 2); ctx.fill();

        fillHeart(x, y, size, alpha);
        drawECG(x, y, size * 0.76, size * 0.28, alpha * 1.0);
      }

      else if (s.phase === 'zoom') {
        s.zoomT += 0.022;
        const p = Math.min(1, s.zoomT);
        const ep = easeInOut(p);
        const targetSize = Math.max(W, H) * 1.5;
        const size = s.startSize + (targetSize - s.startSize) * ep;
        const cx = s.startX + (W / 2 - s.startX) * ep;
        const cy = s.startY + (H / 2 - s.startY) * ep;
        const alpha = 0.55 + ep * 0.45;

        fillHeart(cx, cy, size, alpha);
        drawECG(cx, cy, size * 0.76, size * 0.28, (1 - ep * 0.7) * alpha);

        if (p >= 1) { s.phase = 'crack'; s.crackT = 0; }
      }

      else if (s.phase === 'crack') {
        s.crackT += 0.032;
        const p = Math.min(1, s.crackT);
        const targetSize = Math.max(W, H) * 1.5;
        fillHeart(W / 2, H / 2, targetSize, 1 - p * 0.35);

        // Crack lines grow from center outward
        const D = Math.max(W, H);
        s.cracks.forEach(pts => {
          const visN = Math.min(pts.length, Math.ceil(p * (pts.length + 1)));
          if (visN < 1) return;
          ctx.save();
          ctx.beginPath(); ctx.moveTo(W / 2, H / 2);
          pts.slice(0, visN).forEach(([px, py]) => ctx.lineTo(W / 2 + px * D, H / 2 + py * D));
          ctx.strokeStyle = `rgba(255,255,255,${0.88 - p * 0.3})`;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#fff'; ctx.shadowBlur = 8;
          ctx.stroke(); ctx.restore();
          // Secondary thinner crack for depth
          ctx.save();
          ctx.beginPath(); ctx.moveTo(W / 2, H / 2);
          pts.slice(0, visN).forEach(([px, py]) => ctx.lineTo(W / 2 + px * D * 0.6, H / 2 + py * D * 0.6));
          ctx.strokeStyle = `rgba(255,200,220,${0.5 - p * 0.2})`;
          ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
        });

        if (p >= 1) { s.phase = 'flash'; s.flashT = 0; }
      }

      else if (s.phase === 'flash') {
        s.flashT += 0.042;
        const p = Math.min(1, s.flashT);
        ctx.fillStyle = `rgba(255,255,255,${(1 - p) * 0.96})`;
        ctx.fillRect(0, 0, W, H);
        if (p >= 1) {
          s.phase = 'float';
          s.t = Math.random() * 100; // randomise re-entry position
          onDoneRef.current?.();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', transition: 'z-index 0s' }}
    />
  );
});

export default FloatingHeart;
