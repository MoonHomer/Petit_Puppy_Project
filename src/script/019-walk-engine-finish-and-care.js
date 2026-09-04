  function finishWalk(){
    window.clearTimeout(walkEventTimer);
    stopWalkAnim();
    var session = state.walk.session;
    if(!session) return;
    var band = rewardBandFor(session.stamina);
    var pct = rewardPctFromBand(band);

    // 32번: 산책 중 이벤트로 쌓인 deltaLedger를 여기서 한꺼번에 정산.
    // "좋은 방향(수치상승효과)" 변화는 보상배율(pct)만큼 증폭, "나쁜 방향(수치감소효과)" 변화는
    // 배율 없이 그대로 반영 — 사용자가 요청한 그대로. 같은 스탯에 여러 이벤트가 겹쳤을 수 있어
    // 스탯별로 다 더한 뒤 한 번만 반올림/clamp해서 반영(라운딩 오차 누적 방지).
    // 37번(기획문서 9장): 여기에 현재 성장단계별 가중치(GROWTH_WALK_MULT)를 추가로 곱함 — 문서상
    // "산책 이벤트로 인한 능력치 가감"에만 적용되는 배율이라 기본 스테이터스(core.*)에만 걸고,
    // life.*(포만감/청결/유대감/자립감/스트레스)는 이 성장 단계 시스템과 무관하므로 그대로 둠.
    var gwMult = GROWTH_WALK_MULT[state.growthStage] || GROWTH_WALK_MULT[2];
    // 40번: '우울증' 고유능력 소지 시 "활동으로 얻는 기본능력 증가폭 10% 감소" — 산책 이벤트로
    // 기본능력(core.*)이 오르는 이 지점에 0.9배를 곱함(훈련소 trainStat()에도 동일하게 적용).
    var depressionPenalty = isAbilityOwned("depression") ? 0.9 : 1;
    // 60번: 지역 전담 능력의 ×2/×0.5 배율 — 사용자 지시 2번대로 "긍정적 효과"(스탯 상승·만족도 개선·
    // 스트레스 감소)에만 걸고, deltaLedger에 안 쌓이는 아래쪽 고정 완료 보너스(stressRelief/bondGain/
    // coinGain)와 애초에 해로운 효과(청결 감소 등, beneficial=false)는 대상에서 뺌 — 판단 근거는
    // 계획 문서에 기록.
    var regionMult = regionAbilityMultForPlace(session.place);
    // 64번(15장): 에너지 구간별 산책 효과 배율 — 산책을 시작한 시점의 에너지 구간에 따라 상승효과는
    // 줄고(0.5~0.8배) 하락효과는 커짐(1.2~1.5배). 시작 시점 값을 세션에 고정해뒀으므로(walkEnergyMult)
    // 여기서도 그대로 재사용(옛 세션에는 이 필드가 없을 수 있어 기본값 1/1로 안전하게 대체).
    var energyWalkMult = session.walkEnergyMult || { gain:1, loss:1 };
    var eventTotals = {};
    (session.deltaLedger || []).forEach(function(d){
      var dir = STAT_GOOD_DIRECTION[d.path] || 1;
      var beneficial = (d.amount * dir) > 0;
      var applied = beneficial ? d.amount * pct * regionMult * energyWalkMult.gain : d.amount * energyWalkMult.loss;
      if(d.path.indexOf("core.") === 0){
        applied *= beneficial ? gwMult.gain : gwMult.loss;
        if(beneficial) applied *= depressionPenalty;
      }
      eventTotals[d.path] = (eventTotals[d.path] || 0) + applied;
    });
    // 34번: 종료 리포트 막대그래프에 쓸 "실제로 적용된" 변화량(클램프 반영 후) — 카드에서 보여준
    // 이벤트별 원본 수치와는 다를 수 있어(보상배율·클램프 때문에) 여기서 따로 기록해둠.
    var appliedTotals = {};
    var bondFromEvents = 0;
    Object.keys(eventTotals).forEach(function(path){
      var parts = path.split(".");
      var cur = state[parts[0]][parts[1]];
      // 37번: core.* 스탯의 상승 상한은 100이 아니라 개체별 성장최대기대치(state.growthMaxStats) —
      // 성장 단계 가중치(예: 털뭉치 ×3)가 자기 최대치를 넘어서는 모순을 막기 위한 신규 클램프 규칙.
      // life.*는 기존 그대로 0~100.
      var cap = 100;
      if(parts[0] === "core" && state.growthMaxStats && typeof state.growthMaxStats[parts[1]] === "number"){
        cap = state.growthMaxStats[parts[1]];
      }
      var next = clamp(Math.round(cur + eventTotals[path]), 0, cap);
      state[parts[0]][parts[1]] = next;
      // life.* 스탯은 applyDecay()가 시간에 따라 소수점 단위로 서서히 깎기 때문에 cur가 정수가
      // 아닐 수 있음(core.* 는 항상 정수) — next(정수)에서 cur(소수 가능)를 빼면 리포트에 "+2.65" 같은
      // 소수점이 노출되는 문제가 있어, 여기서 반올림해 항상 정수로 표시되게 함.
      appliedTotals[path] = Math.round(next - cur);
      if(path === "life.bond") bondFromEvents = next - cur;
    });
    if(bondFromEvents > 0){ addGrowth(bondFromEvents * coreGrowthGate()); }

    // 기존 24~25번 설계 그대로: 산책을 마치는 것 자체에 대한 기본 보상(체력 소모·스트레스 완화·유대감·코인)
    var energyMult = effMult("energyDrain","energyDrainWalk");
    var stressRelief = 15 * pct * effMult("happinessGain","happinessGainActive");
    var bondGain = 10 * pct * effMult("bondGain","bondWalk");
    var coinGain = Math.round(4 * pct);
    state.life.stress = clamp(state.life.stress - stressRelief, 0, 100);
    state.life.independence = clamp(state.life.independence - 20*energyMult, 0, 100);
    state.life.hunger = clamp(state.life.hunger - 10, 0, 100);
    state.life.clean = clamp(state.life.clean - 10, 0, 100);
    addGrowth(bondGain * coreGrowthGate());
    bumpLifeBond(bondGain);
    state.coins += coinGain;
    // 35번: 반짝이는 발자국(희귀 드랍형)의 "누적 산책 횟수 마일스톤" 조건에 쓸 누적 완료 산책 횟수.
    // 도중에 "그만하고 돌아가기"로 끝내도 산책을 한 번 완료한 것으로 집계함.
    state.totalWalks = (state.totalWalks || 0) + 1;
    // 60번: 지역별 누적 산책 횟수도 totalWalks와 동일한 타이밍(그만하고 돌아가기 포함)에 함께 집계하고,
    // 그 자리에서 지역 전담 능력의 산책 누적 취득 시도까지 처리.
    progressRegionAbilityAcquisition(session.place);
    // 61번: 소통버튼 충전 — 산책 체력을 TALK_BUTTON_CHARGE_MIN_CONSUMED_PCT(70%) 이상 소모하고
    // 돌아온 경우(남은 체력 session.stamina가 30 이하) 수동 소통버튼 사용 가능 횟수를 1 충전(최대
    // TALK_BUTTON_CHARGE_MAX). "그만하고 돌아가기"로 일찍 끝내도 그 시점의 소모율로 그대로 판정.
    var staminaConsumedPct = 1 - (session.stamina / 100);
    if(staminaConsumedPct >= TALK_BUTTON_CHARGE_MIN_CONSUMED_PCT){
      var prevCharges = state.talkButton.charges || 0;
      state.talkButton.charges = Math.min(TALK_BUTTON_CHARGE_MAX, prevCharges + 1);
      if(state.talkButton.charges > prevCharges){
        session.itemChips.push("🐾 소통버튼 충전 +1");
      }
    }
    // 34번: 종료 리포트에 쓸 이야기 개수·리포트용 최종 적용치·주워 온 것들 목록을 함께 저장.
    state.walk.summary = {
      bandFlavor: pick(band.flavor),
      coinGain: coinGain,
      log: session.log.slice(),
      eventCount: session.eventCount || 0,
      statTotals: appliedTotals,
      itemChips: (session.itemChips || []).slice()
    };
    state.walk.session = null;
    saveState();
    render();
    renderWalkVeil();
  }

  function closeWalkVeil(){
    stopWalkAnim();
    clearWalkPose();
    el.walkVeil.classList.remove("show");
    state.walk.summary = null;
    saveState();
    render();
    // 64번(15장): 산책은 시작할 때 시간이 흐르지만(startWalk), "결과까지 전부 처리된 직후"에 하루
    // 종료를 판정해야 하므로(원안 명시) 세션이 완전히 끝나 홈 화면으로 돌아온 바로 지금 확인함.
    // 하루가 30일째(FOSTER_DAY_MAX)에 도달했다면 playDayEndSequence() 안에서 그대로 이어서
    // 엔딩 컷씬(48번)까지 재생하므로, 예전에 여기서 따로 부르던 maybeFireEndingCutscene()은
    // 더 이상 필요 없음(fosterDay가 이제 이 하루 종료 시퀀스에서만 증가하기 때문).
    maybeTriggerDayEnd();
  }

  // 34번(산책 UX 개편): 이벤트 하나의 스탯 변화·수집 칩을 "다이어리 카드" 하단에 pill 형태로 노출.
  // 스탯 칩은 STAT_GOOD_DIRECTION 기준으로 좋은 방향이면 up(초록 계열)/나쁜 방향이면 down(코랄 계열),
  // 수집·친구·도감 칩은 item(골드 계열)로 구분(기존 [기본정보] trait-pill의 positive/negative 색상 재사용).
  function renderWalkEventChips(container, statChips, itemChips){
    container.innerHTML = "";
    (statChips || []).forEach(function(d){
      var dir = STAT_GOOD_DIRECTION[d.p] || 1;
      var good = (d.n * dir) > 0;
      var span = document.createElement("span");
      span.className = "walk-chip " + (good ? "up" : "down");
      span.textContent = statPathLabel(d.p) + " " + (d.n > 0 ? "+" : "") + d.n;
      container.appendChild(span);
    });
    (itemChips || []).forEach(function(label){
      var span = document.createElement("span");
      span.className = "walk-chip item";
      span.textContent = label;
      container.appendChild(span);
    });
    if(!container.children.length){
      var span = document.createElement("span");
      span.className = "walk-chip neutral";
      span.textContent = "특별한 변화는 없었어요";
      container.appendChild(span);
    }
  }

  // 34번: 종료 리포트의 "이번 산책 총합" 막대그래프. statTotals는 finishWalk()에서 클램프까지 반영해
  // 계산한 실제 적용치라, 카드에서 봤던 이벤트별 수치의 단순 합과는 살짝 다를 수 있음(의도된 차이).
  function renderWalkSummaryStats(container, totals){
    container.innerHTML = "";
    var keys = Object.keys(totals || {}).filter(function(k){ return totals[k] !== 0; });
    if(!keys.length){
      var p = document.createElement("p");
      p.className = "walk-summary-empty";
      p.textContent = "이번엔 능력치 변화가 크지 않았어요.";
      container.appendChild(p);
      return;
    }
    keys.forEach(function(path){
      var v = totals[path];
      var dir = STAT_GOOD_DIRECTION[path] || 1;
      var good = (v * dir) > 0;
      var pct = Math.min(100, Math.abs(v) * 20);
      var row = document.createElement("div");
      row.className = "walk-stat-row";
      var label = document.createElement("span");
      label.className = "walk-stat-label";
      label.textContent = statPathLabel(path);
      var track = document.createElement("span");
      track.className = "walk-stat-track";
      var fill = document.createElement("span");
      fill.className = "walk-stat-fill " + (good ? "up" : "down");
      fill.style.width = pct + "%";
      track.appendChild(fill);
      var val = document.createElement("span");
      val.className = "walk-stat-val " + (good ? "up" : "down");
      val.textContent = (v > 0 ? "+" : "") + v;
      row.appendChild(label); row.appendChild(track); row.appendChild(val);
      container.appendChild(row);
    });
  }

  // 42번: 산책 중 이야기 카드를 "지금 하나만" 갈아치우던 걸(34번) 삭제 없이 전부 쌓이는 스크롤
  // 목록으로 바꿈 — session.cards(전체 카드 배열)를 매번 통째로 다시 그려서(다른 renderX 함수들과
  // 같은 방식) renderWalkVeil이 여러 곳에서 호출돼도(새로고침 복귀 등) 중복으로 쌓이지 않게 함.
  // 마지막엔 스크롤을 맨 아래로 내려 방금 나온 카드가 항상 보이게 함.
  function renderWalkLog(session){
    var host = el.walkLog;
    if(!host) return;
    host.innerHTML = "";
    var cards = session.cards || [];
    if(!cards.length){
      var entry = document.createElement("div");
      entry.className = "walk-log-entry";
      var p = document.createElement("p");
      p.className = "walk-narrative";
      p.textContent = "산책로에 들어섰어요. 어떤 이야기가 기다리고 있을까요?";
      entry.appendChild(p);
      host.appendChild(entry);
    } else {
      cards.forEach(function(card){
        var entry = document.createElement("div");
        entry.className = "walk-log-entry";
        var p = document.createElement("p");
        p.className = "walk-narrative";
        p.textContent = card.text;
        entry.appendChild(p);
        var chipRow = document.createElement("div");
        chipRow.className = "walk-chips";
        entry.appendChild(chipRow);
        renderWalkEventChips(chipRow, card.statChips, card.itemChips);
        host.appendChild(entry);
      });
    }
    host.scrollTop = host.scrollHeight;
  }
  function renderWalkVeil(){
    var session = state.walk.session;
    if(session){
      el.walkSummaryBox.hidden = true;
      // 44번(버그 수정): 결과 화면(walk-summary)이 뜬 뒤에도 그 위에 42번의 스크롤 로그(walk-book)가
      // 계속 남아있어서, 이벤트가 많이 쌓인 산책일수록 로그 높이만큼 '확인' 버튼이 화면 아래로 밀려나
      // 눌리지 않는 문제가 있었음 — 결과 화면에서는 이야기 글뭉치를 다시 보여줄 필요가 없으므로,
      // 진행 중(session)일 때만 로그를 보여주고 결과 화면(summary)에서는 통째로 숨김.
      el.walkBook.hidden = false;
      el.walkReturnBtn.hidden = false;
      // 36번: 고른 산책 장소를 상단 타이틀에 함께 보여줌(선택 결과를 확인시켜주는 정도의 연출).
      el.walkTitle.textContent = session.place ? (session.place.icon + " " + session.place.name + " 산책 중") : "산책 중";
      var t = tierIndex(session.stamina);
      el.walkFace.textContent = STATE_EMOJI[t];
      el.walkStaminaFill.style.width = session.stamina + "%";
      el.walkStaminaLabel.textContent = "산책체력 " + STATE_LABELS[t];
      el.walkEventCount.textContent = (session.eventCount || 0) + "번째 이야기";
      renderWalkLog(session);
    } else if(state.walk.summary){
      var sm = state.walk.summary;
      el.walkReturnBtn.hidden = true;
      el.walkBook.hidden = true;
      el.walkSummaryBox.hidden = false;
      el.walkFace.textContent = "🐾";
      el.walkStaminaFill.style.width = "0%";
      el.walkStaminaLabel.textContent = "산책 완료";
      el.walkEventCount.textContent = "";
      el.walkSummaryText.textContent =
        sm.bandFlavor + (sm.coinGain > 0 ? (" (코인 +" + sm.coinGain + ")") : "");
      el.walkSummaryMeta.textContent = "이야기 " + (sm.eventCount || 0) + "개를 함께 만들었어요";
      renderWalkSummaryStats(el.walkSummaryStats, sm.statTotals);
      if(sm.itemChips && sm.itemChips.length){
        el.walkSummaryItemSection.hidden = false;
        el.walkSummaryItemChips.innerHTML = "";
        sm.itemChips.forEach(function(label){
          var span = document.createElement("span");
          span.className = "walk-chip item";
          span.textContent = label;
          el.walkSummaryItemChips.appendChild(span);
        });
      } else {
        el.walkSummaryItemSection.hidden = true;
      }
    }
  }
  // 63번(14장): 목욕시키기에 스트레스+10·에너지-5·유대감-5가 신규로 추가됨 — 지금까지의 "약한
  // 스트레스 완화"(effMult 기반) 대신, 이 세 값을 기준으로 삼고 능력 보유 시 조정치를 더하는 방식으로
  // 전면 교체. 조정치는 아래처럼 원안 표의 "능력 보유 시 최종 수치"를 역산한 가산값(원안 표 기준
  // 기본값 대비 차이) — 여러 능력을 동시에 보유하면(예: 서로 다른 지역의 능력 2개) 조정치를 전부
  // 더함(원안에는 능력 하나씩만 예시가 있어 이 가산 방식은 개발팀 판단, 오픈 이슈로 문서화).
  // addGrowth()는 목욕시키기와 무관하게 계속 진행되는 별개의 "성장 단계" 진행치라 그대로 유지.
  var BATH_ABILITY_MODS = [
    { id:"regionHateForest", stress:-4, energy:0, bond:0 },  // 청결왕: 기본(+10/-5/-5) → +6/-5/-5
    { id:"regionLoveLake",   stress:-5, energy:2, bond:4 },  // 퐁당퐁당: → +5/-3/-1
    { id:"regionHateLake",   stress:5,  energy:0, bond:-3 }  // 비버공포증: → +15/-5/-8
  ];
  function doBath(){
    if(!hasBones(BONE_COST_CARE)){ showMessage(pick(FLAVOR.poor)); return; }
    state.life.clean = clamp(state.life.clean + 40, 0, 100);
    // 65번(16장): '물개' 보유 시 목욕 에너지 소모량이 1/2로 줄어듦(엑셀 원안: 기존 -5 → -3, 반올림).
    // BATH_ABILITY_MODS(지역 능력 조정치)보다 먼저 적용해 그 위에 지역 능력 조정이 가산되는 순서로
    // 구현 — 두 효과가 겹칠 때(예: 물개+퐁당퐁당) 어느 쪽을 먼저 적용할지는 엑셀에 명시되지 않아
    // 개발팀이 판단한 지점(오픈 이슈, 위 ABILITY_CATALOG의 sealPup 주석에도 기록).
    var stressDelta = 10, bondDelta = -5;
    var energyDelta = isAbilityOwned("sealPup") ? -3 : -5;
    BATH_ABILITY_MODS.forEach(function(m){
      if(isAbilityOwned(m.id)){ stressDelta += m.stress; energyDelta += m.energy; bondDelta += m.bond; }
    });
    state.life.stress = clamp(state.life.stress + stressDelta, 0, 100);
    state.life.independence = clamp(state.life.independence + energyDelta, 0, 100);
    state.life.bond = clamp(state.life.bond + bondDelta, 0, 100);
    addGrowth(2 * effMult("bondGain"));
    // 64번(15장): 목욕시키기도 뼈다귀 1개 소모 + 게임 내 시간 1시간 진행.
    spendBones(BONE_COST_CARE);
    advanceGameTime();
    showMessage(pick(FLAVOR.bath));
    saveRenderPulse();
    maybeTriggerDayEnd();
  }
  // 63번(14장): [기본돌봄] 신설 활동 2종 — 간식주기(상점의 유료 "간식"과 별개, 무료·소폭 효과)와
  // 쉬게하기. 둘 다 효과가 여러 스탯에 걸쳐 있어(예: 배부름이 이미 가득 차도 스트레스·유대감 효과는
  // 여전히 유효) doFeed처럼 "가득 차면 조기 반환"하는 상한 가드는 일부러 넣지 않음(밥주기는 효과가
  // 배부름 하나뿐이라 가드가 유효하지만, 이 두 활동은 다르다는 판단 — 완료 보고에 명시).
  function doTreat(){
    if(!hasBones(BONE_COST_CARE)){ showMessage(pick(FLAVOR.poor)); return; }
    state.life.hunger = clamp(state.life.hunger + 10, 0, 100);
    state.life.stress = clamp(state.life.stress - 5, 0, 100);
    state.life.bond = clamp(state.life.bond + 3, 0, 100);
    // 64번(15장): 간식주기도 뼈다귀 1개 소모 + 게임 내 시간 1시간 진행.
    spendBones(BONE_COST_CARE);
    advanceGameTime();
    showMessage(pick(FLAVOR.treat));
    saveRenderPulse();
    maybeTriggerDayEnd();
  }
  function doRest(){
    if(!hasBones(BONE_COST_CARE)){ showMessage(pick(FLAVOR.poor)); return; }
    state.life.stress = clamp(state.life.stress - 5, 0, 100);
    state.life.independence = clamp(state.life.independence + 20, 0, 100);
    // 64번(15장): 쉬게하기도 뼈다귀 1개 소모 + 게임 내 시간 1시간 진행.
    spendBones(BONE_COST_CARE);
    advanceGameTime();
    showMessage(pick(FLAVOR.rest));
    saveRenderPulse();
    maybeTriggerDayEnd();
  }
  function doBuySnack(){
    if(state.coins < 10){ showMessage(pick(FLAVOR.poor)); return; }
    state.coins -= 10;
    state.life.hunger = clamp(state.life.hunger + 40, 0, 100);
    var stressRelief = 5 * effMult("happinessGain","happinessGainCalm","happinessGainFeed");
    state.life.stress = clamp(state.life.stress - stressRelief, 0, 100);
    showMessage(pick(FLAVOR.snack));
    saveRenderPulse();
  }
  function doBuyToy(){
    if(state.coins < 15){ showMessage(pick(FLAVOR.poor)); return; }
    state.coins -= 15;
    var stressRelief = 35 * effMult("happinessGain","happinessGainActive");
    state.life.stress = clamp(state.life.stress - stressRelief, 0, 100);
    addGrowth(2 * effMult("bondGain"));
    bumpLifeBond(2);
    showMessage(pick(FLAVOR.toy));
    saveRenderPulse();
  }

  // 45번(기획문서 11장): 소통버튼 시스템 — 테스트 버전 확정분만 구현.
  //  · 이해력 등급·성장 단계에 따른 표현 명료도 차등, 버튼 해금 게이팅(둘 다 정식 버전 설계)은
  //    사용자가 이번 라운드에서 명시적으로 제외 요청 — 지금은 보유한 버튼 중 무작위로 고름.
  // 46번: "유저가 위젯을 눌러 여는" 수동 경로에만 사용 횟수 제한이 걸림. 화면 조작이 일정 시간 없을 때
  // (진짜 유휴 상태) 반려견이 스스로 말을 거는 이벤트는 이 제한과 무관한 별도 트랙이며,
  // 발동 전에 항상 호응/무시를 먼저 물어봄 — 아래 openTalkIdlePrompt() 참고.
  // 61번: 수동 경로의 사용 횟수 제한을 "하루 10회 상한(45·46번, usedToday/day 기준 매일 리셋)"에서
  // "최대 5회까지 모아두는 충전식(charges)"으로 교체 — 게임 시작 시 0회, 산책 체력을 70% 이상
  // 소모하고 돌아오면(finishWalk()) +1씩 충전(상한 클램프, 충전 조건 자체는 하루 리셋과 무관).
