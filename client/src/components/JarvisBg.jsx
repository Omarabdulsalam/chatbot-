import { useEffect, useRef } from 'react';

export default function JarvisBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Sphere nodes
    const nodes = Array.from({ length: 80 }, () => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1),
      speed: (Math.random() - 0.5) * 0.003,
      size: Math.random() * 2.2 + 0.8,
      orange: Math.random() > 0.8,
    }));

    // Drifting particles
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00014,
      vy: (Math.random() - 0.5) * 0.00014,
      size: Math.random() * 1.1 + 0.3,
    }));

    // Stars – include nova and color variants
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random(), y: Math.random(),
      size: Math.random() * 1.6 + 0.2,
      speed: Math.random() * 2.5 + 0.4,
      offset: Math.random() * Math.PI * 2,
      base: Math.random() * 0.5 + 0.15,
      nova: Math.random() < 0.08,
      novaSpeed: Math.random() * 0.25 + 0.04,
      blue: Math.random() < 0.25,     // slightly blue tint
      warm: Math.random() < 0.12,     // slightly warm/amber
    }));

    // Shooting stars pool
    const shootingStars = [];

    const proj = (theta, phi, rotY, cx, cy, R) => {
      const sp = Math.sin(phi), cp = Math.cos(phi);
      const ct = Math.cos(theta + rotY), st = Math.sin(theta + rotY);
      return { x: cx + sp * ct * R, y: cy + cp * R, z: sp * st };
    };

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      const R = Math.min(W, H) * 0.33;
      t += 0.004;
      const rotY = t * 0.38;
      const pulse = 0.85 + Math.sin(t * 1.4) * 0.15;

      ctx.fillStyle = '#050d1e';
      ctx.fillRect(0, 0, W, H);

      // ── Stars ─────────────────────────────────────────────────
      stars.forEach(s => {
        let bright;
        if (s.nova) {
          bright = s.base + Math.sin(t * s.novaSpeed + s.offset) * 0.65;
        } else {
          bright = s.base + Math.sin(t * s.speed + s.offset) * 0.38;
        }
        const alpha = Math.max(0, Math.min(1, bright));
        const sx = s.x * W, sy = s.y * H;

        // Color tint
        let r = 200, g = 225, b = 255;
        if (s.blue)  { r = 140; g = 180; b = 255; }
        if (s.warm)  { r = 255; g = 220; b = 160; }

        if (s.size > 1.1 && alpha > 0.5) {
          // Cross-flare for brighter stars
          const flare = s.size * 3.5 * alpha;
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.35})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(sx - flare, sy); ctx.lineTo(sx + flare, sy); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx, sy - flare); ctx.lineTo(sx, sy + flare); ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, s.size * Math.max(0.5, alpha), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      });

      // ── Shooting stars ────────────────────────────────────────
      if (Math.random() < 0.004 && shootingStars.length < 4) {
        const angle = Math.PI * 0.12 + Math.random() * Math.PI * 0.26;
        const spd = 7 + Math.random() * 9;
        shootingStars.push({
          x: Math.random() * W * 0.85,
          y: Math.random() * H * 0.35,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          len: 60 + Math.random() * 90,
          life: 1.0,
          decay: 0.013 + Math.random() * 0.014,
        });
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        const d = Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy);
        const tx = ss.x - (ss.vx / d) * ss.len;
        const ty = ss.y - (ss.vy / d) * ss.len;
        const sg = ctx.createLinearGradient(tx, ty, ss.x, ss.y);
        sg.addColorStop(0, 'rgba(255,255,255,0)');
        sg.addColorStop(0.6, `rgba(200,235,255,${ss.life * 0.45})`);
        sg.addColorStop(1, `rgba(255,255,255,${ss.life})`);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = sg; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.beginPath(); ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${ss.life})`; ctx.fill();
        ss.x += ss.vx; ss.y += ss.vy; ss.life -= ss.decay;
        if (ss.life <= 0 || ss.x > W + 120 || ss.y > H + 120) shootingStars.splice(i, 1);
      }

      // ── Moon (top-right crescent) ─────────────────────────────
      const moonX = W - 85, moonY = 75, moonR = 28;
      const moonBob = Math.sin(t * 0.18) * 3;
      const my = moonY + moonBob;
      // Glow halo
      const mglow = ctx.createRadialGradient(moonX, my, 0, moonX, my, moonR * 3);
      mglow.addColorStop(0, 'rgba(210,235,255,0.10)');
      mglow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = mglow;
      ctx.beginPath(); ctx.arc(moonX, my, moonR * 3, 0, Math.PI * 2); ctx.fill();
      // Full circle
      ctx.beginPath(); ctx.arc(moonX, my, moonR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(228,242,255,0.88)'; ctx.fill();
      // Occlusion cutout → crescent
      ctx.beginPath(); ctx.arc(moonX + moonR * 0.52, my - moonR * 0.07, moonR * 0.88, 0, Math.PI * 2);
      ctx.fillStyle = '#050d1e'; ctx.fill();
      // Soft rim
      ctx.beginPath(); ctx.arc(moonX, my, moonR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(180,220,255,0.20)'; ctx.lineWidth = 1.5; ctx.stroke();

      // ── Ambient glow behind sphere ────────────────────────────
      const bgG = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.4);
      bgG.addColorStop(0, 'rgba(0,55,140,0.16)');
      bgG.addColorStop(0.5, 'rgba(0,20,70,0.07)');
      bgG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bgG; ctx.fillRect(0, 0, W, H);

      // Outer brownish shell tint
      const shellG = ctx.createRadialGradient(cx - R * 0.55, cy - R * 0.2, R * 0.05, cx, cy, R);
      shellG.addColorStop(0, 'rgba(0,0,0,0)');
      shellG.addColorStop(0.55, 'rgba(70,30,10,0.10)');
      shellG.addColorStop(0.82, 'rgba(110,50,15,0.22)');
      shellG.addColorStop(1, 'rgba(60,25,5,0)');
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * 1.01, 0, Math.PI * 2);
      ctx.fillStyle = shellG; ctx.fill(); ctx.restore();

      // ── Sphere wireframe ──────────────────────────────────────
      ctx.lineWidth = 0.5;
      for (let lat = 12; lat < 180; lat += 18) {
        const phi = (lat * Math.PI) / 180;
        ctx.beginPath();
        for (let lng = 0; lng <= 360; lng += 4) {
          const p = proj((lng * Math.PI) / 180, phi, rotY, cx, cy, R);
          lng === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(0,165,215,0.15)'; ctx.stroke();
      }
      for (let lng = 0; lng < 360; lng += 18) {
        ctx.beginPath();
        for (let lat = 0; lat <= 180; lat += 4) {
          const p = proj((lng * Math.PI) / 180, (lat * Math.PI) / 180, rotY, cx, cy, R);
          lat === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(0,165,215,0.12)'; ctx.stroke();
      }
      ctx.lineWidth = 0.35;
      for (let lat = 12; lat < 180; lat += 12) {
        const phi = (lat * Math.PI) / 180;
        ctx.beginPath();
        for (let lng = 0; lng <= 360; lng += 4) {
          const p = proj((lng * Math.PI) / 180, phi, rotY, cx, cy, R * 0.55);
          lng === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(0,200,255,0.18)'; ctx.stroke();
      }
      for (let lng = 0; lng < 360; lng += 12) {
        ctx.beginPath();
        for (let lat = 0; lat <= 180; lat += 4) {
          const p = proj((lng * Math.PI) / 180, (lat * Math.PI) / 180, rotY, cx, cy, R * 0.55);
          lat === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(0,200,255,0.16)'; ctx.stroke();
      }

      // ── Nodes & connections ───────────────────────────────────
      const pn = nodes.map(n => { n.theta += n.speed; return { ...n, ...proj(n.theta, n.phi, rotY, cx, cy, R) }; });
      pn.sort((a, b) => a.z - b.z);
      ctx.lineWidth = 0.75;
      for (let i = 0; i < pn.length; i++) {
        for (let j = i + 1; j < pn.length; j++) {
          const dx = pn[i].x - pn[j].x, dy = pn[i].y - pn[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < R * 0.52) {
            const depth = ((pn[i].z + 1) / 2) * ((pn[j].z + 1) / 2);
            ctx.beginPath(); ctx.moveTo(pn[i].x, pn[i].y); ctx.lineTo(pn[j].x, pn[j].y);
            ctx.strokeStyle = `rgba(0,210,255,${(1 - d / (R * 0.52)) * depth * 0.65})`; ctx.stroke();
          }
        }
      }
      pn.forEach(n => {
        const depth = (n.z + 1) / 2;
        const s = n.size * (0.4 + depth * 0.85);
        const [r, g, b] = n.orange ? [255, 145, 55] : [0, 210, 255];
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, s * 5.5);
        glow.addColorStop(0, `rgba(${r},${g},${b},${depth * 0.75})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(n.x, n.y, s * 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, s, 0, Math.PI * 2);
        ctx.fillStyle = n.orange ? `rgba(255,195,110,${depth})` : `rgba(160,238,255,${depth})`; ctx.fill();
      });

      // ── Core glow ─────────────────────────────────────────────
      [[R * 0.44 * pulse, 0.14],[R * 0.35 * pulse, 0.18],[R * 0.26 * pulse, 0.22],[R * 0.18 * pulse, 0.30]].forEach(([rf, alpha]) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rf);
        g.addColorStop(0, `rgba(80,210,255,${alpha * 1.4})`);
        g.addColorStop(0.45, `rgba(0,140,255,${alpha})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rf, 0, Math.PI * 2); ctx.fill();
      });
      const star2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.14 * pulse);
      star2.addColorStop(0, 'rgba(255,255,255,0.97)');
      star2.addColorStop(0.25, 'rgba(180,242,255,0.80)');
      star2.addColorStop(0.6, 'rgba(0,170,255,0.30)');
      star2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = star2; ctx.beginPath(); ctx.arc(cx, cy, R * 0.14 * pulse, 0, Math.PI * 2); ctx.fill();

      // Sphere border
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,185,255,0.42)'; ctx.lineWidth = 1.8; ctx.stroke();
      const rim = ctx.createRadialGradient(cx, cy, R - 8, cx, cy, R + 22);
      rim.addColorStop(0, 'rgba(0,185,255,0)');
      rim.addColorStop(0.35, 'rgba(0,185,255,0.28)');
      rim.addColorStop(1, 'rgba(0,185,255,0)');
      ctx.strokeStyle = rim; ctx.lineWidth = 16;
      ctx.beginPath(); ctx.arc(cx, cy, R + 7, 0, Math.PI * 2); ctx.stroke();

      // Orbiting arcs
      [
        { sp: 0.48, tilt: 0.27, rr: 1.10, a: 0.32, arc: [0.1, Math.PI * 1.8] },
        { sp: -0.30, tilt: 0.58, rr: 1.17, a: 0.22, arc: [0.4, Math.PI * 1.5] },
        { sp: 0.62, tilt: 0.40, rr: 1.24, a: 0.16, arc: [0.8, Math.PI * 1.6] },
        { sp: -0.20, tilt: 0.70, rr: 1.30, a: 0.10, arc: [1.2, Math.PI * 1.2] },
      ].forEach(({ sp, tilt, rr, a, arc }, i) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * sp + i * 1.4); ctx.scale(1, tilt);
        ctx.beginPath(); ctx.arc(0, 0, R * rr, arc[0], arc[1]);
        ctx.strokeStyle = `rgba(0,200,255,${a})`; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
      });
      [0.6, 1.1, 1.7, 2.4].forEach((off, i) => {
        const angle = t * (0.35 + i * 0.12) + off;
        const oR = R * (1.08 + i * 0.055), tilt = 0.3 + i * 0.12;
        const ox = cx + Math.cos(angle) * oR, oy = cy + Math.sin(angle) * oR * tilt;
        const gd = ctx.createRadialGradient(ox, oy, 0, ox, oy, 6);
        gd.addColorStop(0, 'rgba(0,220,255,0.9)'); gd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gd; ctx.beginPath(); ctx.arc(ox, oy, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200,245,255,0.95)'; ctx.fill();
      });

      // Drifting particles
      particles.forEach(p => {
        p.x = (p.x + p.vx + 1) % 1; p.y = (p.y + p.vy + 1) % 1;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,155,215,0.32)'; ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}
