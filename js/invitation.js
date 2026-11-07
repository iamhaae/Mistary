/* ============================================================
   invitation.js — 초대장 페이지 흐름
   falling → landed → opening → read → accepting → (main.html)
   ============================================================ */
(function () {
  const { sleep, reduceMotion, dust } = window.SITE;

  const envWrap  = document.getElementById('envWrap');
  const envelope = document.getElementById('envelope');
  const seal     = document.getElementById('seal');
  const letter   = document.getElementById('letter');
  const hint     = document.getElementById('hint');
  const halo     = document.getElementById('halo');
  const accept   = document.getElementById('accept');

  let state = 'idle';

  /* ---------- 1. 오른쪽 위에서 살랑살랑 떨어지는 초대장 ---------- */
  function fall() {
    state = 'falling';
    const dur = reduceMotion ? 700 : 5200;
    const vw = window.innerWidth, vh = window.innerHeight;
    // 시작점: 화면 중앙 기준 오른쪽 위 바깥
    const sx = vw * 0.5 + 240;
    const sy = -(vh * 0.5 + 280);
    const t0 = performance.now();
    envWrap.classList.add('is-visible');

    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 2.7);   // 끝으로 갈수록 천천히
      const damp = 1 - p;                   // 흔들림도 점점 잦아듦
      const dx = sx * (1 - e) + Math.sin(p * Math.PI * 3.4) * 46 * damp;
      const dy = sy * (1 - e) + Math.sin(p * Math.PI * 2.2 + 0.6) * 12 * damp;
      const rot = 26 * (1 - e) + Math.sin(p * Math.PI * 3.4 + 1.3) * 10 * damp;
      envWrap.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
      if (p < 1) requestAnimationFrame(frame);
      else landed();
    }
    requestAnimationFrame(frame);
    setTimeout(() => halo.classList.add('is-on'), reduceMotion ? 0 : 2400);
  }

  function landed() {
    envWrap.style.transform = 'none';
    envWrap.classList.add('is-landed');
    envelope.disabled = false;
    hint.classList.add('is-on');
    state = 'landed';
  }

  /* ---------- 2. 개봉 ---------- */
  async function openInvitation() {
    if (state !== 'landed') return;
    state = 'opening';
    envelope.disabled = true;
    hint.classList.add('is-off');
    halo.classList.add('is-bright');

    // 봉인에 빛이 맺힘
    seal.classList.add('is-glow');
    await sleep(1000);

    // 봉인이 풀리며 금빛 입자가 흩어짐
    const r = seal.getBoundingClientRect();
    dust.burst(r.left + r.width / 2, r.top + r.height / 2, 46, { speed: 2.6 });
    seal.classList.add('is-break');
    await sleep(350);

    // 덮개가 열림
    envelope.classList.add('is-open');
    await sleep(1300);

    // 봉투는 아래로 물러나고, 편지가 펼쳐짐
    envWrap.classList.add('is-leave');
    letter.classList.add('is-show');
    letter.setAttribute('aria-hidden', 'false');
    await sleep(reduceMotion ? 100 : 1500);

    // 글자가 위에서부터 서서히 나타남
    const lines = letter.querySelectorAll('.l');
    lines.forEach((el, i) => { el.style.transitionDelay = (i * 0.38).toFixed(2) + 's'; });
    letter.classList.add('is-read');
    state = 'read';
    accept.focus({ preventScroll: true });
  }

  /* ---------- 3. 초대 수락 ---------- */
  async function acceptInvitation() {
    if (state !== 'read') return;
    state = 'accepting';
    accept.disabled = true;

    // 편지 전체에 은은한 빛이 퍼짐
    letter.classList.add('is-glow');
    await sleep(1000);

    // 금빛 입자로 흩어지며 사라짐
    const rect = letter.getBoundingClientRect();
    dust.burstRect(rect, window.innerWidth < 600 ? 140 : 240);
    letter.classList.add('is-dissolve');
    halo.classList.remove('is-bright');
    await sleep(1500);

    window.SITE.go(window.SITE.pages.main.url, 900);
  }

  envelope.addEventListener('click', openInvitation);
  accept.addEventListener('click', acceptInvitation);

  /* 시작: 완전한 어둠 속에서 잠시 뒤 초대장이 등장 */
  window.addEventListener('load', () => setTimeout(fall, reduceMotion ? 200 : 1400));
})();
