  // ===== 74번(신규): 어질리티 연습장 — [외출하기]의 준비중 placeholder였던 항목을 실제 미니게임으로 구현 =====
  // 원안(사용자 채팅) + AskUserQuestion 확인 4건을 그대로 반영:
  //  1) 하루 1회 제한, [도전하기]를 누르는 즉시 뼈다귀20·에너지30·산책횟수1을 전부 차감(확정: 즉시 차감안).
  //  2) 배경은 단순화한 쿼터뷰 코스 캔버스 + 기존 픽셀 반려견(drawPixelDog) 재사용(확정: 추천안).
  //  3) 반려견 모방 실패 시 완전 무작위로 5칸 클릭(확정: 추천안).
  //  4) 최종 달성률 = 유저 정확도 30% + 반려견 정확도 70%(사용자가 추천 50/50 대신 30/70으로 직접 override),
  //     소수점은 최종 합산 결과에서만 반올림.
  // 그 외 아래 판단은 AskUserQuestion으로 확인받지 않고 기존 코드 관례를 그대로 확장한 개발팀 판단(완료 보고에 명시):
  //  - 시스템이 5칸을 뽑을 때 중복(같은 칸 연속/재등장) 허용 — "5개 중 5개를 무작위로 뽑는다"는 원안 문구를
  //    가장 단순한 해석(단순 복원추출)으로 구현.
  //  - 보상 스탯 증가는 finishWalk()와 같은 growthMaxStats 클램프 + 우울증 보유 시 0.9배 패널티를 그대로 적용.
  //  - 게임 시간 진행(advanceGameTime)은 "뼈다귀 소모 행동 1회"로 보아 결과 정산 시점에 정확히 1회만 호출하고,
  //    하루 종료 판정(maybeTriggerDayEnd)은 산책(closeWalkVeil)과 같은 원칙으로 결과창을 닫을 때 확인함.
  //  - 반려견의 모방 애니메이션은 시스템 제시와 같은 칸당 1초 리듬(점등 0.8초·소등 0.2초)을 그대로 재사용.

  var AGILITY_BONE_COST = 20;
  var AGILITY_ENERGY_COST = 30;
  var AGILITY_WALK_COST = 1;
  var AGILITY_PAD_COUNT = 5;
  var AGILITY_ROUNDS = 3;
  var AGILITY_ROUND_TIMER_MS = [5000, 4000, 3000];
  var AGILITY_READY_MS = 2000;
  var AGILITY_GO_MS = 1000;

  // 보상(달성률 100% 기준 고정치) — 사용자 원안 그대로: 근력+5·민첩성+10·이해력+10·수행력+5·충성도+5·친화력+5.
  var AGILITY_REWARD_BASE = { power:5, agility:10, comprehension:10, execution:5, loyalty:5, affinity:5 };

  function randomAgilitySequence(){
    var seq = [];
    for(var i=0;i<AGILITY_PAD_COUNT;i++){ seq.push(Math.floor(Math.random()*AGILITY_PAD_COUNT)); }
    return seq;
  }

  // 사용자 확정 공식: 유대감/5 + 민첩성/5 + 이해력/5 + 수행력/5 + (충성도/10 + 친화력/10) — 5개 스탯
  // 슬롯이 각 20점(충성도·친화력만 10점씩 나눠 합쳐 20점) 만점으로 합산돼 최대 100.
  function agilityFidelityScore(){
    var c = state.core, L = state.life;
    var score = (L.bond/5) + (c.agility/5) + (c.comprehension/5) + (c.execution/5) + (c.loyalty/10) + (c.affinity/10);
    return clamp(score, 0, 100);
  }
  var AGILITY_TIER_BASE = [
    { max:20, base:0.10 },
    { max:40, base:0.30 },
    { max:60, base:0.50 },
    { max:80, base:0.70 },
    { max:100, base:0.85 }
  ];
  function agilityBaseChanceFor(score){
    for(var i=0;i<AGILITY_TIER_BASE.length;i++){
      if(score <= AGILITY_TIER_BASE[i].max) return AGILITY_TIER_BASE[i].base;
    }
    return AGILITY_TIER_BASE[AGILITY_TIER_BASE.length-1].base;
  }
  // 최종 확률 = 구간 기본% + (건강함-50)/10(%p). 건강함이 50 미만이면 오히려 확률이 깎임.
  function agilityReplicateChance(){
    var score = agilityFidelityScore();
    var basePct = agilityBaseChanceFor(score) * 100;
    var healthAdjPct = (state.core.health - 50) / 10;
    return clamp(basePct + healthAdjPct, 0, 100) / 100;
  }
  // 성공: 유저가 실제로 입력한(오답 포함) 시퀀스를 그대로 복제. 실패: 완전 무작위 5칸(사용자 확정).
  function agilityComputeDogSequence(userSeq){
    var success = Math.random() < agilityReplicateChance();
    return success ? userSeq.slice() : randomAgilitySequence();
  }

  function applyAgilityRewards(achievementPct){
    var depressionPenalty = isAbilityOwned("depression") ? 0.9 : 1;
    var applied = {};
    Object.keys(AGILITY_REWARD_BASE).forEach(function(key){
      var raw = AGILITY_REWARD_BASE[key] * (achievementPct/100) * depressionPenalty;
      var gain = Math.round(raw);
      if(gain <= 0) return;
      var cap = (state.growthMaxStats && typeof state.growthMaxStats[key] === "number") ? state.growthMaxStats[key] : 100;
      var before = state.core[key];
      state.core[key] = clamp(state.core[key] + gain, 0, cap);
      var actual = state.core[key] - before;
      if(actual > 0) applied["core." + key] = actual;
    });
    return applied;
  }

  // ---- 발바닥(5칸) DOM 빌드 & 표시 헬퍼 ----
  var AGILITY_PADS_BUILT = false;
  function buildAgilityPawPads(container){
    if(!container) return;
    container.innerHTML = "";
    for(var i=0;i<AGILITY_PAD_COUNT;i++){
      var pad = document.createElement("div");
      pad.className = "agility-pad agility-pad-" + i;
      var mark = document.createElement("span");
      mark.className = "agility-pad-mark";
      pad.appendChild(mark);
      container.appendChild(pad);
    }
  }
  function ensureAgilityPadsBuilt(){
    if(AGILITY_PADS_BUILT) return;
    buildAgilityPawPads(el.agilityPawSystem);
    buildAgilityPawPads(el.agilityPawUser);
    buildAgilityPawPads(el.agilityPawDog);
    AGILITY_PADS_BUILT = true;
  }
  function agilityPadEl(container, idx){
    return container ? container.querySelector(".agility-pad-" + idx) : null;
  }
  function setAgilityPadLit(container, idx, on){
    var p = agilityPadEl(container, idx);
    if(p) p.classList.toggle("lit", !!on);
  }
  function setAgilityPadMark(container, idx, correct){
    var p = agilityPadEl(container, idx);
    if(!p) return;
    p.classList.remove("mark-correct", "mark-wrong");
    p.classList.add(correct ? "mark-correct" : "mark-wrong");
    var mark = p.querySelector(".agility-pad-mark");
    if(mark) mark.textContent = correct ? "O" : "X";
  }
  function clearAgilityPawMarks(container){
    if(!container) return;
    container.querySelectorAll(".agility-pad").forEach(function(p){
      p.classList.remove("lit", "mark-correct", "mark-wrong");
      var mark = p.querySelector(".agility-pad-mark");
      if(mark) mark.textContent = "";
    });
  }

  // ---- 게임 진행 단계 ----
  function agilitySetBanner(text){ if(el.agilityPhaseBanner) el.agilityPhaseBanner.textContent = text; }
  function agilitySetTimerPct(pct){ if(el.agilityTimerFill) el.agilityTimerFill.style.width = clamp(pct,0,100) + "%"; }

  async function agilityPhaseReady(roundIdx){
    if(el.agilityRoundLabel) el.agilityRoundLabel.textContent = (roundIdx+1) + " / " + AGILITY_ROUNDS + " 라운드";
    clearAgilityPawMarks(el.agilityPawSystem);
    clearAgilityPawMarks(el.agilityPawUser);
    clearAgilityPawMarks(el.agilityPawDog);
    agilitySetTimerPct(100);
    agilitySetBanner("준비~");
    await wait(AGILITY_READY_MS);
  }
  async function agilityPhaseReveal(seq){
    agilitySetBanner("순서를 잘 봐둬요!");
    for(var i=0;i<seq.length;i++){
      setAgilityPadLit(el.agilityPawSystem, seq[i], true);
      await wait(800);
      setAgilityPadLit(el.agilityPawSystem, seq[i], false);
      await wait(200);
    }
  }
  async function agilityPhaseGo(){
    agilitySetBanner("시작~!");
    await wait(AGILITY_GO_MS);
  }
  // 유저 입력 단계 — 5칸 클릭(순서 무관하게 어느 칸이든 반복 클릭 가능) 완료 또는 라운드별 제한시간
  // 만료 중 먼저 오는 쪽에서 끝나며, 못 채운 나머지 칸은 -1(미입력, 항상 오답 처리)로 채워짐.
  function agilityPhaseUserInput(roundIdx, seq){
    return new Promise(function(resolve){
      agilitySetBanner("순서대로 발바닥을 눌러보세요!");
      var duration = AGILITY_ROUND_TIMER_MS[roundIdx];
      var clicked = [];
      var startTs = Date.now();
      var padEls = [];
      for(var i=0;i<AGILITY_PAD_COUNT;i++){ padEls.push(agilityPadEl(el.agilityPawUser, i)); }
      var tickTimer = null;
      var finished = false;

      function finish(){
        if(finished) return;
        finished = true;
        if(tickTimer){ window.clearInterval(tickTimer); tickTimer = null; }
        padEls.forEach(function(p){ if(p) p.onclick = null; });
        while(clicked.length < AGILITY_PAD_COUNT){ clicked.push(-1); }
        resolve(clicked);
      }

      padEls.forEach(function(p, idx){
        if(!p) return;
        p.onclick = function(){
          if(finished || clicked.length >= AGILITY_PAD_COUNT) return;
          clicked.push(idx);
          var correct = seq[clicked.length-1] === idx;
          setAgilityPadMark(el.agilityPawUser, idx, correct);
          if(clicked.length >= AGILITY_PAD_COUNT) finish();
        };
      });

      tickTimer = window.setInterval(function(){
        var elapsed = Date.now() - startTs;
        agilitySetTimerPct(100 - (elapsed/duration)*100);
        if(elapsed >= duration) finish();
      }, 50);
    });
  }
  async function agilityPhaseDogImitate(dogSeq){
    agilitySetBanner((state.name || "댕댕이") + "가 흉내내봐요!");
    for(var i=0;i<dogSeq.length;i++){
      if(dogSeq[i] < 0) continue;
      setAgilityPadLit(el.agilityPawDog, dogSeq[i], true);
      await wait(800);
      setAgilityPadLit(el.agilityPawDog, dogSeq[i], false);
      await wait(200);
    }
  }

  var agilityRunning = false;
  async function runAgilityGame(){
    var canonicalAll = [], userAll = [], dogAll = [];
    for(var r=0;r<AGILITY_ROUNDS;r++){
      var seq = randomAgilitySequence();
      canonicalAll.push(seq);
      await agilityPhaseReady(r);
      await agilityPhaseReveal(seq);
      await agilityPhaseGo();
      var userSeq = await agilityPhaseUserInput(r, seq);
      userAll.push(userSeq);
      var dogSeq = agilityComputeDogSequence(userSeq);
      dogAll.push(dogSeq);
      await agilityPhaseDogImitate(dogSeq);
      await wait(400);
    }
    finishAgilityGame(canonicalAll, userAll, dogAll);
  }

  function finishAgilityGame(canonicalAll, userAll, dogAll){
    agilityRunning = false;
    var userCorrect = 0, dogCorrect = 0, total = 0;
    for(var r=0;r<AGILITY_ROUNDS;r++){
      for(var i=0;i<AGILITY_PAD_COUNT;i++){
        total++;
        if(userAll[r][i] === canonicalAll[r][i]) userCorrect++;
        if(dogAll[r][i] === canonicalAll[r][i]) dogCorrect++;
      }
    }
    var userPct = (userCorrect/total)*100;
    var dogPct = (dogCorrect/total)*100;
    // 사용자 확정: 유저 30% / 반려견 70% 가중치, 소수점은 이 최종 합산 결과에서만 반올림.
    var achievementPct = Math.round(userPct*0.3 + dogPct*0.7);

    // 64번(15장) 원칙: 뼈다귀 소모 행동 1회 = 게임 내 시간 1시간. 결과가 전부 처리된 이 시점에 정확히 1회 호출.
    advanceGameTime();
    var gains = applyAgilityRewards(achievementPct);

    stopAgilityWander();
    el.agilityGame.hidden = true;
    el.agilityResult.hidden = false;
    el.agilityResultText.textContent = (state.name || "댕댕이") + "와(과) 함께 " + achievementPct + "% 달성했어요! " +
      "(내 정확도 " + Math.round(userPct) + "% · " + (state.name || "댕댕이") + " 정확도 " + Math.round(dogPct) + "%)";
    renderWalkSummaryStats(el.agilityResultStats, gains);

    saveState();
    render();
  }

  function updateAgilityIntroState(){
    var ok = !state.agility.playedToday && hasBones(AGILITY_BONE_COST)
      && state.life.independence >= AGILITY_ENERGY_COST && state.walk.charges >= AGILITY_WALK_COST;
    if(el.agilityStartBtn) el.agilityStartBtn.disabled = !ok;
  }

  function startAgilityGame(){
    if(agilityRunning) return;
    if(state.agility.playedToday){ showMessage("오늘은 이미 어질리티 연습을 마쳤어요."); return; }
    if(!hasBones(AGILITY_BONE_COST) || state.life.independence < AGILITY_ENERGY_COST || state.walk.charges < AGILITY_WALK_COST){
      showMessage(pick(FLAVOR.poor));
      return;
    }
    // 74번(사용자 확정, AskUserQuestion): [도전하기]를 누르는 즉시 뼈다귀·에너지·산책횟수를 전부 차감.
    spendBones(AGILITY_BONE_COST);
    state.life.independence = clamp(state.life.independence - AGILITY_ENERGY_COST, 0, 100);
    state.walk.charges = clamp(state.walk.charges - AGILITY_WALK_COST, 0, state.walk.maxCharges);
    state.agility.playedToday = true;
    saveState();
    render();

    agilityRunning = true;
    el.agilityIntro.hidden = true;
    el.agilityResult.hidden = true;
    el.agilityGame.hidden = false;
    runAgilityGame();
  }

  function openAgilityVeil(){
    ensureAgilityPadsBuilt();
    if(el.agilityDogName) el.agilityDogName.textContent = state.name || "댕댕이";
    el.agilityIntro.hidden = false;
    el.agilityGame.hidden = true;
    el.agilityResult.hidden = true;
    updateAgilityIntroState();
    openVeil(el.agilityVeil);
    startAgilityWander();
  }
  function closeAgilityVeil(){
    // 게임(3라운드) 진행 도중엔 뒤로가기를 무시 — 라운드가 끝날 때까지 기다림(짧은 진행 시간이라
    // 별도의 중도포기 경로는 만들지 않음, 판단 근거: 산책과 달리 세션이 30초 안팎으로 짧음).
    if(agilityRunning) return;
    stopAgilityWander();
    closeVeil(el.agilityVeil);
    // 64번(15장)과 같은 원칙(산책의 closeWalkVeil() 참고): 하루 종료 판정은 세션이 완전히 끝나
    // 결과창을 닫는 이 시점에 확인함.
    maybeTriggerDayEnd();
  }

  // ---- 상단 쿼터뷰 배경(단순화 버전) — 캔버스 프리미티브만으로 코스 소품을 그리고, 반려견은
  // 002번의 drawPixelDog()를 그대로 재사용해 무작위로 어슬렁이게 함(사용자 확정: 추천안). ----
  var agilityWanderTimer = null;
  var agilityDogX = 0, agilityDogTargetX = 0;
  var AGILITY_DOG_RANGE = 34;
  function agilityPickWanderTarget(){
    agilityDogTargetX = Math.round((Math.random()*2 - 1) * AGILITY_DOG_RANGE);
  }
  function drawAgilityCourseProps(ctx, groundRow){
    // 터널(옆면 사각 + 짙은 입구)
    ctx.fillStyle = "#8B6FB3";
    ctx.fillRect(18, groundRow-16, 24, 16);
    ctx.fillStyle = "#6B4F92";
    ctx.fillRect(18, groundRow-16, 24, 3);
    ctx.fillStyle = "#332740";
    ctx.fillRect(24, groundRow-12, 12, 12);
    // 허들(기둥 2개 + 가로바)
    ctx.fillStyle = "#D8C79E";
    ctx.fillRect(56, groundRow-20, 3, 20);
    ctx.fillRect(76, groundRow-20, 3, 20);
    ctx.fillStyle = "#C4482B";
    ctx.fillRect(54, groundRow-22, 26, 4);
    // 위빙 폴(지그재그로 박힌 기둥 5개)
    ctx.fillStyle = "#5FA0B3";
    [96,103,110,117,124].forEach(function(x, i){
      var h = 16 + (i % 2 === 0 ? 3 : -3);
      ctx.fillRect(x, groundRow-h, 3, h);
    });
    // 경사로(삼각 램프, 옆면 음영으로 입체감)
    ctx.fillStyle = "#B99B68";
    ctx.beginPath();
    ctx.moveTo(128, groundRow);
    ctx.lineTo(140, groundRow-18);
    ctx.lineTo(150, groundRow);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8F7648";
    ctx.beginPath();
    ctx.moveTo(140, groundRow-18);
    ctx.lineTo(150, groundRow);
    ctx.lineTo(140, groundRow);
    ctx.closePath();
    ctx.fill();
  }
  function drawAgilityScene(){
    if(!el.agilityCanvas || !el.agilityCanvas.getContext) return;
    var ctx = el.agilityCanvas.getContext("2d");
    if(!ctx) return;
    ctx.clearRect(0, 0, PX_W, PX_H);
    var groundRow = PX_H - 6;
    var grad = ctx.createLinearGradient(0, 0, 0, groundRow);
    grad.addColorStop(0, "#BFE0EE");
    grad.addColorStop(1, "#E8F3DC");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, PX_W, groundRow);
    ctx.fillStyle = cssVar("--moss", "#9CB88C");
    ctx.fillRect(0, groundRow, PX_W, PX_H - groundRow);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = cssVar("--moss-deep", "#5F7A52");
    ctx.fillRect(0, groundRow, PX_W, 1);
    ctx.globalAlpha = 1;

    drawAgilityCourseProps(ctx, groundRow);

    agilityDogX += (agilityDogTargetX - agilityDogX) * 0.08;
    drawPixelDog(ctx, groundRow, Math.round(agilityDogX));
  }
  function startAgilityWander(){
    agilityPickWanderTarget();
    if(agilityWanderTimer) window.clearInterval(agilityWanderTimer);
    agilityWanderTimer = window.setInterval(function(){
      if(Math.random() < 0.02) agilityPickWanderTarget();
      drawAgilityScene();
    }, 160);
    drawAgilityScene();
  }
  function stopAgilityWander(){
    if(agilityWanderTimer){ window.clearInterval(agilityWanderTimer); agilityWanderTimer = null; }
  }
