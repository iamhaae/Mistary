/* ============================================================
   main.js — 메인 페이지 (main.html)
   - 기관 이름/문구 주입
   - 금빛 먼지, 타이틀 주변 입자
   - 문패 메뉴: 터치 피드백, 이동 전환
   ============================================================ */
(function () {
  const SITE = window.SITE;

  /* 기관 이름 (config.js) */
  const orgName = document.getElementById('orgName');
  const orgSub = document.getElementById('orgSub');
  orgName.textContent = SITE.orgName;
  orgSub.textContent = SITE.tagline;
  document.title = SITE.orgName;

  /* 배경 먼지 */
  SITE.dust.start({ count: window.innerWidth < 640 ? 45 : 95 });

  /* 배경 깊이감: 마우스를 움직이면 창(먼 곳) → 빛 → 아치(가까운 곳) 순으로 다르게 움직임
     (마우스가 있는 기기에서만, 모션 줄이기 설정이면 꺼짐) */
  if (matchMedia('(hover: hover)').matches && !SITE.reduceMotion) {
    const layers = Array.from(document.querySelectorAll('.layer[data-depth]'));
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    });
    (function tick() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      layers.forEach((l) => {
        const d = Number(l.dataset.depth) || 0;
        l.style.transform = 'translate3d(' + (-cx * d).toFixed(2) + 'px,' + (-cy * d * 0.6).toFixed(2) + 'px,0)';
      });
      requestAnimationFrame(tick);
    })();
  }

  /* 타이틀 주변에 가끔 떠오르는 금빛 입자 */
  const titleBlock = document.getElementById('titleBlock');
  function spark() {
    if (document.hidden) return;
    const s = document.createElement('span');
    s.className = 'spark';
    const w = orgName.offsetWidth, h = orgName.offsetHeight;
    s.style.left = (orgName.offsetLeft + Math.random() * w) + 'px';
    s.style.top  = (orgName.offsetTop + h * (0.2 + Math.random() * 0.7)) + 'px';
    s.style.setProperty('--dx', ((Math.random() - 0.5) * 40).toFixed(0) + 'px');
    s.style.setProperty('--dy', (-(18 + Math.random() * 46)).toFixed(0) + 'px');
    titleBlock.appendChild(s);
    setTimeout(() => s.remove(), 3300);
  }
  if (!SITE.reduceMotion) setInterval(spark, 420);

  /* 문패 메뉴 */
  const doors = document.querySelectorAll('.door');
  doors.forEach((door) => {
    // 모바일: hover 대신 터치 시 같은 빛 효과
    door.addEventListener('touchstart', () => door.classList.add('is-lit'), { passive: true });
    const unlit = () => setTimeout(() => door.classList.remove('is-lit'), 350);
    door.addEventListener('touchend', unlit);
    door.addEventListener('touchcancel', unlit);

    door.addEventListener('click', (e) => {
      e.preventDefault();
      const cfg = SITE.pages[door.dataset.page];
      const r = door.getBoundingClientRect();
      SITE.dust.burst(r.left + r.width / 2, r.top + r.height / 2, 26, { speed: 1.8 });

      if (!cfg || !cfg.ready) {
        door.classList.add('is-lit');
        setTimeout(() => door.classList.remove('is-lit'), 700);
        SITE.toast('아직 문이 열리지 않았습니다 — 준비 중인 공간이에요');
        return;
      }
      document.body.classList.add('is-entering');
      SITE.go(cfg.url, 1000);
    });
  });
})();
