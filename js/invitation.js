/* ============================================================
   invitation.js — 초대장 페이지 흐름
   falling → landed → opening → read → accepting → (main.html)

   * 입자 효과 등 "꾸밈" 단계가 실패해도 편지는 반드시 열리도록
     각 단계를 보호해 두었어요. (showLetter 는 어떤 경우에도 실행됨)
   ============================================================ */
(function () {
  const SITE = window.SITE || {};
  const reduceMotion = !!SITE.reduceMotion;
  const sleep = SITE.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const dust = SITE.dust || { burst() {}, burstRect() {} };
  const go = SITE.go || ((url) => { location.href = url; });

  const envWrap  = document.getElementById('envWrap');
  const envelope = document.getElementById('envelope');
  const seal     = document.getElementById('seal');
  const letter   = document.getElementById('letter');
  const hint     = document.getElementById('hint');
  const halo     = document.getElementById('halo');
  const accept   = document.getElementById('accept');

  let state = 'idle';

  /** 꾸밈 효과용: 실패해도 흐름을 멈추지 않음 */
  function safe(fn) {
    try { fn(); } catch (e) { console.warn('[invitation] 효과 건너뜀:', e); }
  }

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
  function showLetter() {
    if (state === 'read' || state === 'accepting') return;
    envelope.classList.add('is-open');
    envWrap.classList.add('is-leave');
    letter.classList.add('is-show');
    letter.setAttribute('aria-hidden', 'false');

    // 글자가 위에서부터 서서히 나타남
    setTimeout(() => {
      const lines = letter.querySelectorAll('.l');
      lines.forEach((el, i) => { el.style.transitionDelay = (i * 0.38).toFixed(2) + 's'; });
      letter.classList.add('is-read');
    }, reduceMotion ? 100 : 1500);

    state = 'read';

    // 글이 길어 스크롤이 필요하면 아래쪽에 ▾ 표시 (스크롤하면 사라짐)
    safe(() => {
      const sc = letter.querySelector('.letter-scroll');
      setTimeout(() => {
        if (sc.scrollHeight > sc.clientHeight + 8) letter.classList.add('has-more');
      }, reduceMotion ? 200 : 2600);
      sc.addEventListener('scroll', () => letter.classList.remove('has-more'), { passive: true, once: true });
    });
  }

  async function openInvitation() {
    if (state !== 'landed') return;
    state = 'opening';
    envelope.disabled = true;
    hint.classList.add('is-off');
    halo.classList.add('is-bright');

    try {
      // 봉인에 빛이 맺힘
      seal.classList.add('is-glow');
      await sleep(1000);

      // 봉인이 풀리며 금빛 입자가 흩어짐
      safe(() => {
        const r = seal.getBoundingClientRect();
        dust.burst(r.left + r.width / 2, r.top + r.height / 2, 46, { speed: 2.6 });
      });
      seal.classList.add('is-break');
      await sleep(350);

      // 덮개가 열림
      envelope.classList.add('is-open');
      await sleep(1300);
    } catch (e) {
      console.warn('[invitation] 개봉 연출 중 오류, 편지를 바로 펼칩니다:', e);
    }

    // 무슨 일이 있어도 편지는 펼쳐짐
    showLetter();
  }

  /* ---------- 3. 초대 수락 ---------- */
  async function acceptInvitation() {
    if (state !== 'read') return;
    state = 'accepting';
    accept.disabled = true;

    try {
      // 편지 전체에 은은한 빛이 퍼짐
      letter.classList.add('is-glow');
      await sleep(1000);

      // 금빛 입자로 흩어지며 사라짐
      safe(() => {
        const rect = letter.getBoundingClientRect();
        dust.burstRect(rect, window.innerWidth < 600 ? 140 : 240);
      });
      letter.classList.add('is-dissolve');
      halo.classList.remove('is-bright');
      await sleep(1500);
    } catch (e) {
      console.warn('[invitation] 수락 연출 중 오류:', e);
    }

    go(SITE.pages ? SITE.pages.main.url : 'main.html', 900);
  }

  envelope.addEventListener('click', openInvitation);
  accept.addEventListener('click', acceptInvitation);

  /* 시작: 완전한 어둠 속에서 잠시 뒤 초대장이 등장 */
  window.addEventListener('load', () => setTimeout(fall, reduceMotion ? 200 : 1400));
})();
