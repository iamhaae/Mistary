/* ============================================================
   config.js — 사이트 전체 설정 (가장 먼저 로드됨)
   기관 이름이 정해지면 orgName만 바꾸면 모든 페이지에 반영돼요.
   새 페이지를 만들면 아래 pages에서 ready를 true로 바꿔주세요.
   (ready: false 인 페이지는 클릭 시 "준비 중" 안내만 떠요)
   ============================================================ */
window.SITE = {
  orgName: 'THE INSTITUTE',          // ← 기관 이름 (미정, 임시값)
  tagline: '시대를 넘어, 기록하는 자들',
  pages: {
    invitation:    { url: 'index.html',         ready: true  },
    main:          { url: 'main.html',          ready: true  },
    investigation: { url: 'investigation.html', ready: false },
    archive:       { url: 'archive.html',       ready: false }
  }
};
