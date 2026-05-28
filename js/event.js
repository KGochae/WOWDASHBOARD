// 최종 이벤트 연출 — triggerFinalEvent() 로 수동 발동
// Firebase RTDB 연동 시 onValue 콜백에서 호출 예정

function triggerFinalEvent() {
  if (document.getElementById('feo')) return;

  const RANK_FILTER = new Set(['버튜버', '고정멤버']);
  const FONT = "'Pretendard', sans-serif";
  let _feoViewer = null;

  // ── 오버레이 ──────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'feo';
  overlay.style.cssText = [
    'position:fixed','top:0','left:0','width:100%','height:100%',
    'background:#000','z-index:99999',
    'opacity:0','transition:opacity 5s ease',
    'overflow:hidden',
  ].join(';');
  document.body.appendChild(overlay);

  // 닫기 버튼
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = [
    'position:fixed','top:20px','right:24px',
    'background:none','border:1px solid rgba(255,255,255,0.3)',
    'color:rgba(255,255,255,0.6)','font-size:20px',
    'width:40px','height:40px','border-radius:50%',
    'cursor:pointer','z-index:100000',
    'display:none','align-items:center','justify-content:center',
    `font-family:${FONT}`,
    'transition:color 0.2s,border-color 0.2s',
  ].join(';');
  closeBtn.onmouseenter = () => { closeBtn.style.color='#fff'; closeBtn.style.borderColor='rgba(255,255,255,0.8)'; };
  closeBtn.onmouseleave = () => { closeBtn.style.color='rgba(255,255,255,0.6)'; closeBtn.style.borderColor='rgba(255,255,255,0.3)'; };
  closeBtn.onclick = () => {
    // WebGL 컨텍스트 해제
    if (_feoViewer) {
      try {
        const c = _feoViewer.canvas;
        if (c) { const g = c.getContext('webgl') || c.getContext('experimental-webgl'); g?.getExtension('WEBGL_lose_context')?.loseContext(); }
      } catch(e) {}
      _feoViewer = null;
    }
    overlay.style.transition = 'opacity 0.6s ease';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 600);
  };
  overlay.appendChild(closeBtn);

  // ── Phase 1: 5초 페이드 인 ────────────────────────────
  requestAnimationFrame(() => requestAnimationFrame(() => { overlay.style.opacity = '1'; }));

  // ── Phase 2: 카운트다운 3 → 1 ────────────────────────
  setTimeout(() => {
    const cdEl = document.createElement('div');
    cdEl.style.cssText = [
      'position:absolute','top:50%','left:50%',
      'transform:translate(-50%,-50%)',
      `font-family:${FONT}`,
      'font-size:clamp(120px,20vw,220px)','font-weight:900','color:#fff',
      'text-shadow:0 0 60px rgba(255,255,255,0.4)',
      'opacity:0','transition:opacity 0.2s ease',
      'user-select:none',
    ].join(';');
    overlay.appendChild(cdEl);

    let count = 3;
    const tick = () => {
      if (count < 1) {
        cdEl.style.opacity = '0';
        setTimeout(() => { cdEl.remove(); showStatCard(); }, 300);
        return;
      }
      cdEl.style.opacity = '0';
      setTimeout(() => {
        cdEl.textContent = count--;
        cdEl.style.opacity = '1';
        setTimeout(tick, 1000);
      }, 200);
    };
    tick();
  }, 5000);

  // ── 유틸 ─────────────────────────────────────────────
  function countUp(el, target, duration, fmt) {
    const start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = fmt(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function getProfileImg(name) {
    const gm = GUILD_DB[name] || {};
    const soop = (window._soopMapById && _soopMapById[gm.character_id]) ||
                 (window._soopMap && _soopMap[name]);
    return soop?.profile_img || gm.avatar_img || '';
  }

  // ── 3D 모델 로딩 ──────────────────────────────────────
  async function loadEventModel(charData, containerId) {
    if (typeof window.generateModels !== 'function') return;
    const container = document.getElementById(containerId);
    if (!container) return;

    const items = (Object.keys(charData.items || {}).map(Number)
      .filter(s => charData.items[s] && charData.items[s].did > 0 && VISUAL_SLOTS.includes(s))
      .map(s => [s, Math.round(charData.items[s].did)]));

    const rect = container.getBoundingClientRect();
    const aspect = (rect.width > 0 && rect.height > 0) ? rect.width / rect.height : 0.72;
    const ap = { ...charData.appearance, items };

    const stretchCanvas = () => {
      const c = container.querySelector('canvas');
      const d = container.querySelector('div[style]');
      if (c) { c.style.width = '100%'; c.style.height = '100%'; c.style.display = 'block'; }
      if (d) { d.style.width = '100%'; d.style.height = '100%'; }
    };

    const applyAnim = (viewer) => {
      const poll = setInterval(() => {
        if (typeof viewer?.renderer?.actors?.[0]?.setAnimation === 'function') {
          viewer.renderer.actors[0].setAnimation('Stand');
          clearInterval(poll);
        }
      }, 150);
      setTimeout(() => clearInterval(poll), 8000);
    };

    try {
      const viewer = await window.generateModels(aspect, `#${containerId}`, ap, 'classic');
      if (!document.getElementById(containerId)) return; // 오버레이 닫힌 경우
      _feoViewer = viewer;
      stretchCanvas();
      applyAnim(viewer);
      // 모델 준비 완료 → 컨테이너 fade in
      container.style.transition = 'opacity 1s ease';
      container.style.opacity = '1';
    } catch(e) {
      try {
        const viewer = await window.generateModels(aspect, `#${containerId}`,
          { race: charData.race_id, gender: charData.viewer_gender, items, noCharCustomization: true }, 'classic');
        if (!document.getElementById(containerId)) return;
        _feoViewer = viewer;
        stretchCanvas();
        applyAnim(viewer);
        container.style.transition = 'opacity 1s ease';
        container.style.opacity = '1';
      } catch(e2) { /* 모델 로딩 실패 — 무음 처리 */ }
    }
  }

  // ── Phase 3: 통계 카드 연출 ───────────────────────────
  function showStatCard() {
    // [TEST] 왁두의 방어숙련도
    const playerName = '왁두';
    const charData   = CHAR_DB[playerName] || {};
    const statValue  = (STATS_DB[playerName] || {}).defense_effective || 0;
    const profileImg = getProfileImg(playerName);
    const color      = '#7eb8d4';

    // Sub label
    const subEl = document.createElement('div');
    subEl.style.cssText = [
      'position:absolute','top:18%','left:50%','transform:translateX(-50%)',
      `font-family:${FONT}`,'font-size:12px','font-weight:400',
      `color:${color}`,'letter-spacing:0.5em','text-transform:uppercase',
      'white-space:nowrap','opacity:0','transition:opacity 0.6s ease',
    ].join(';');
    subEl.textContent = 'DEFENSE SKILL';

    // Title
    const titleEl = document.createElement('div');
    titleEl.style.cssText = [
      'position:absolute','top:calc(18% + 26px)','left:50%','transform:translateX(-50%)',
      `font-family:${FONT}`,'font-size:clamp(32px,5vw,66px)','font-weight:800',
      'color:#fff','letter-spacing:0.06em','white-space:nowrap',
      `text-shadow:0 0 40px ${color}66`,
      'opacity:0','transition:opacity 0.7s ease',
    ].join(';');
    titleEl.textContent = '방어숙련도';

    // 프로필 이미지 — 시작: 중앙, 이동: 왼쪽
    const imgEl = document.createElement('img');
    imgEl.src = profileImg;
    imgEl.onerror = () => { imgEl.style.background = 'rgba(255,255,255,0.05)'; };
    imgEl.style.cssText = [
      'position:absolute',
      'top:58%','left:50%',
      'transform:translate(-50%,-50%)',
      'width:clamp(130px,14vw,190px)','height:clamp(130px,14vw,190px)',
      'border-radius:50%','object-fit:cover',
      `border:3px solid ${color}`,
      `box-shadow:0 0 50px ${color}55`,
      'opacity:0',
      'transition:opacity 0.5s ease, left 1s cubic-bezier(0.4,0,0.2,1)',
    ].join(';');

    // 닉네임 — 이미지 아래, 함께 이동
    const nameEl = document.createElement('div');
    nameEl.style.cssText = [
      'position:absolute',
      'top:calc(58% + clamp(75px,8.5vw,105px))','left:50%',
      'transform:translateX(-50%)',
      `font-family:${FONT}`,'font-size:clamp(13px,1.5vw,17px)','font-weight:400',
      'color:rgba(255,255,255,0.45)','letter-spacing:0.2em','white-space:nowrap',
      'opacity:0',
      'transition:opacity 0.5s ease, left 1s cubic-bezier(0.4,0,0.2,1)',
    ].join(';');
    nameEl.textContent = playerName;

    // 방어숙련도 값 (닉네임 아래 소형)
    const valEl = document.createElement('div');
    valEl.style.cssText = [
      'position:absolute',
      'top:calc(58% + clamp(75px,8.5vw,105px) + 28px)','left:50%',
      'transform:translateX(-50%)',
      `font-family:${FONT}`,'font-size:clamp(22px,3vw,36px)','font-weight:700',
      `color:${color}`,'letter-spacing:0.1em','white-space:nowrap',
      'opacity:0',
      'transition:opacity 0.6s ease, left 1s cubic-bezier(0.4,0,0.2,1)',
    ].join(';');
    valEl.textContent = '0';

    // 3D 모델 컨테이너 — 오른쪽, 처음엔 opacity:0
    const modelWrap = document.createElement('div');
    modelWrap.id = 'feo-model';
    modelWrap.style.cssText = [
      'position:absolute',
      'right:3%','top:8%','bottom:4%',
      'width:44%',
      'opacity:0',           // 로딩 완료 시 fade in
      'overflow:hidden',
      'border-radius:8px',
      // 로딩 중 미묘한 테두리 표시
      `border:1px solid ${color}22`,
    ].join(';');

    // 모델 로딩 힌트 (로딩 중에만 보임)
    const loadingHint = document.createElement('div');
    loadingHint.style.cssText = [
      'position:absolute','top:50%','left:50%',
      'transform:translate(-50%,-50%)',
      `font-family:${FONT}`,'font-size:13px',
      'color:rgba(255,255,255,0.2)','letter-spacing:0.25em',
    ].join(';');
    loadingHint.textContent = 'LOADING...';
    modelWrap.appendChild(loadingHint);

    overlay.appendChild(subEl);
    overlay.appendChild(titleEl);
    overlay.appendChild(imgEl);
    overlay.appendChild(nameEl);
    overlay.appendChild(valEl);
    overlay.appendChild(modelWrap);

    // 모델 로딩 선행 시작 (DOM 렌더 후 100ms 딜레이)
    setTimeout(() => loadEventModel(charData, 'feo-model'), 100);

    // ── 애니메이션 시퀀스 ──
    requestAnimationFrame(() => requestAnimationFrame(() => {

      // T+0.08s: sub label
      setTimeout(() => { subEl.style.opacity = '1'; }, 80);

      // T+0.35s: title
      setTimeout(() => { titleEl.style.opacity = '1'; }, 350);

      // T+1.1s: 프로필 이미지 중앙 등장
      setTimeout(() => {
        imgEl.style.opacity = '1';
      }, 1100);

      // T+2.4s: 이미지 왼쪽으로 이동 + 닉네임/수치 등장
      setTimeout(() => {
        // 왼쪽으로 이동 (left 23% 기준)
        imgEl.style.left = '23%';
        nameEl.style.left = '23%';
        nameEl.style.opacity = '1';
        valEl.style.left = '23%';
        valEl.style.opacity = '1';

        // 모델 컨테이너 테두리 강조 (모델 로딩 기다리는 동안)
        modelWrap.style.border = `1px solid ${color}44`;

        // 수치 카운트업
        countUp(valEl, statValue, 2000, v => v.toLocaleString());
      }, 2400);
    }));

    // T+12s: THANK YOU (모델 감상 충분히 후)
    setTimeout(showThankYou, 12000);
  }

  // ── Phase 4: THANK YOU ────────────────────────────────
  function showThankYou() {
    // WebGL 컨텍스트 해제
    if (_feoViewer) {
      try {
        const c = _feoViewer.canvas;
        if (c) { const g = c.getContext('webgl') || c.getContext('experimental-webgl'); g?.getExtension('WEBGL_lose_context')?.loseContext(); }
      } catch(e) {}
      _feoViewer = null;
    }

    // 기존 요소 fade out
    Array.from(overlay.children).forEach(el => {
      if (el === closeBtn) return;
      el.style.transition = 'opacity 0.6s ease';
      el.style.opacity = '0';
    });

    setTimeout(() => {
      Array.from(overlay.children).forEach(el => {
        if (el === closeBtn) return;
        el.remove();
      });

      const tyEl = document.createElement('div');
      tyEl.style.cssText = [
        'position:absolute','top:50%','left:50%',
        'transform:translate(-50%,-50%)',
        'text-align:center',
        'opacity:0','transition:opacity 1.8s ease',
      ].join(';');
      tyEl.innerHTML = `
        <div style="font-family:${FONT};font-size:clamp(48px,9vw,96px);font-weight:900;
                    color:#fff;letter-spacing:0.12em;
                    text-shadow:0 0 80px rgba(255,210,120,0.7),0 0 20px rgba(255,255,255,0.4)">
          THANK YOU
        </div>
        <div style="font-family:${FONT};font-size:clamp(13px,1.8vw,20px);font-weight:300;
                    color:rgba(255,255,255,0.38);margin-top:24px;letter-spacing:0.35em">
          WOW END
        </div>
      `;
      overlay.appendChild(tyEl);
      closeBtn.style.display = 'flex';
      requestAnimationFrame(() => requestAnimationFrame(() => { tyEl.style.opacity = '1'; }));
    }, 600);
  }
}
