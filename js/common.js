/* ============================================================
   common.js — 모든 페이지 공용 기능
   - SITE.go(url)      : 페이드 전환 후 이동
   - SITE.toast(msg)   : 하단 안내 문구
   - SITE.dust         : 금빛 먼지 (start / burst / burstRect)
   ============================================================ */
(function () {
  const SITE = (window.SITE = window.SITE || {});
  SITE.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  SITE.sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- 페이지 전환 ---------- */
  let veil = document.querySelector('.veil');
  if (!veil) {
    veil = document.createElement('div');
    veil.className = 'veil is-on';
    document.body.appendChild(veil);
  }
  window.addEventListener('load', () => {
    requestAnimationFrame(() => requestAnimationFrame(() => veil.classList.remove('is-on')));
  });
  // 뒤로가기(bfcache)로 돌아왔을 때 검은 막이 남지 않도록
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) veil.classList.remove('is-on');
  });

  SITE.go = function (url, delay = 1000) {
    veil.classList.add('is-on');
    setTimeout(() => { location.href = url; }, SITE.reduceMotion ? 50 : delay);
  };

  /* ---------- 토스트 ---------- */
  let toastEl, toastTimer;
  SITE.toast = function (msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 2400);
  };

  /* ---------- 금빛 먼지 ---------- */
  const dust = (SITE.dust = {});
  let canvas, ctx, W, H, dpr;
  const parts = [];
  let ambientTarget = 0;
  let raf = 0;

  let broken = false;   // 캔버스를 못 쓰는 환경이면 입자 효과만 조용히 끔

  /** 캔버스 준비. 실패하면 false (이 경우 입자 효과는 건너뛰고 사이트는 정상 동작) */
  function ensureCanvas() {
    if (broken) return false;
    if (canvas) return true;
    try {
      const c = document.createElement('canvas');
      const x = c.getContext('2d');
      if (!x) throw new Error('canvas 2d 사용 불가');
      c.className = 'dust';
      c.setAttribute('aria-hidden', 'true');
      document.body.appendChild(c);
      canvas = c; ctx = x;
      resize();
      window.addEventListener('resize', resize);
      return true;
    } catch (e) {
      broken = true;
      console.warn('[dust] 입자 효과를 사용할 수 없어 건너뜁니다:', e);
      return false;
    }
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeAmbient(initial) {
    return {
      ambient: true,
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + 10,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -(0.05 + Math.random() * 0.22),
      r: 0.4 + Math.random() * 1.4,
      ta: 0.25 + Math.random() * 0.55,
      ph: Math.random() * 6.28,
      sp: 0.0006 + Math.random() * 0.0014
    };
  }

  function loop(now) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    let ambientCount = 0;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      let a;
      if (p.ambient) {
        ambientCount++;
        p.x += p.vx + Math.sin(now * 0.0004 + p.ph) * 0.08;
        p.y += p.vy;
        if (p.y < -10 || p.x < -10 || p.x > W + 10) {
          if (ambientCount > ambientTarget) { parts.splice(i, 1); continue; }
          Object.assign(p, makeAmbient(false));
        }
        a = p.ta * (0.45 + 0.55 * Math.sin(now * p.sp + p.ph));
      } else {
        p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
        p.x += p.vx; p.y += p.vy;
        p.life -= 1;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        const k = p.life / p.max;
        a = Math.min(1, k * 1.6) * p.ta;
      }
      if (a <= 0.01) continue;
      ctx.fillStyle = 'rgba(255, 220, 150, ' + a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
    }

    // 앰비언트 부족분 보충
    if (ambientCount < ambientTarget && Math.random() < 0.2) parts.push(makeAmbient(false));

    if (parts.length || ambientTarget) raf = requestAnimationFrame(loop);
    else raf = 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }

  /** 배경에 떠다니는 은은한 먼지 시작 */
  dust.start = function (opts) {
    if (!ensureCanvas()) return;
    ambientTarget = (opts && opts.count) || 60;
    if (SITE.reduceMotion) ambientTarget = Math.round(ambientTarget / 3);
    let have = parts.filter((p) => p.ambient).length;
    for (; have < ambientTarget; have++) parts.push(makeAmbient(true));
    kick();
  };
  dust.stop = function () { ambientTarget = 0; };

  /** 한 점에서 금빛 입자가 퍼져나감 */
  dust.burst = function (x, y, n, o) {
    if (!ensureCanvas()) return;
    o = o || {};
    const speed = o.speed || 2.2;
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * 6.2832;
      const s = (0.3 + Math.random()) * speed;
      const life = (o.life || 90) * (0.6 + Math.random() * 0.8);
      parts.push({
        ambient: false, x, y,
        vx: Math.cos(ang) * s, vy: Math.sin(ang) * s - (o.lift || 0.4),
        g: o.gravity !== undefined ? o.gravity : -0.012,
        drag: 0.975,
        r: 0.6 + Math.random() * 1.8,
        life, max: life, ta: 0.55 + Math.random() * 0.45
      });
    }
    kick();
  };

  /** 사각형 영역 전체에서 입자가 흩어져 위로 날아감 (초대장 소멸 연출) */
  dust.burstRect = function (rect, n) {
    if (!ensureCanvas()) return;
    for (let i = 0; i < n; i++) {
      const life = 90 + Math.random() * 90;
      parts.push({
        ambient: false,
        x: rect.left + Math.random() * rect.width,
        y: rect.top + Math.random() * rect.height,
        vx: (Math.random() - 0.35) * 1.6,
        vy: -(0.4 + Math.random() * 1.8),
        g: -0.004, drag: 0.985,
        r: 0.7 + Math.random() * 2,
        life, max: life, ta: 0.6 + Math.random() * 0.4
      });
    }
    kick();
  };
})();
