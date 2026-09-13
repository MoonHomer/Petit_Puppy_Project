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
    // 76번(22장): 부정 디버프 10종의 "상승효과 무효화" 게이트 — 이 경로에 매칭된 디버프를 이미 보유
    // 중이고 이번 변화가 "좋은 방향"이면 조용히 0으로 무효화. 아직 없다면 특정 3종(근육통·발가락삠·
    // 무뚝뚝병)에 한해 이 이벤트를 계기로 낮은 확률의 발현을 시도(성공해도 '이번' 이벤트는 그대로
    // 적용되고, 다음 이벤트부터 무효화가 걸림) — 힌트는 종료 리포트로 넘어갈 때 안내 멘트로 씀.
    var walkDebuffNullified = {};
    var walkOnsetHint = null;
    (session.deltaLedger || []).forEach(function(d){
      var dir = STAT_GOOD_DIRECTION[d.path] || 1;
      var beneficial = (d.amount * dir) > 0;
      var debuffId = DEBUFF_STAT_MAP[d.path];
      if(debuffId && isAbilityOwned(debuffId) && beneficial){
        walkDebuffNullified[debuffId] = true;
      } else {
        if(d.path === "core.power" && beneficial){ walkOnsetHint = walkOnsetHint || tryOnsetDebuff("muscleAche", DEBUFF_EVENT_ONSET_CHANCE); }
        if(d.path === "core.agility" && beneficial){ walkOnsetHint = walkOnsetHint || tryOnsetDebuff("toeSprain", DEBUFF_EVENT_ONSET_CHANCE); }
        if(d.path === "core.affinity" && !beneficial){ walkOnsetHint = walkOnsetHint || tryOnsetDebuff("aloofness", DEBUFF_EVENT_ONSET_CHANCE); }
      }
      var applied = beneficial ? d.amount * pct * regionMult * energyWalkMult.gain : d.amount * energyWalkMult.loss;
      if(debuffId && walkDebuffNullified[debuffId]) applied = 0;
      if(d.path.indexOf("core.") === 0){
        applied *= beneficial ? gwMult.gain : gwMult.loss;
        if(beneficial) applied *= depressionPenalty;
      }
      eventTotals[d.path] = (eventTotals[d.path] || 0) + applied;
    });
    var walkDebuffMsg = null;
    Object.keys(walkDebuffNullified).forEach(function(id){
      if(!walkDebuffMsg) walkDebuffMsg = debuffDisplayName(id) + " 때문에 효과가 없는 것 같아";
    });
    if(!walkDebuffMsg) walkDebuffMsg = walkOnsetHint;
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
    // 76번(22장): 산책 완료 자체의 고정 보상(스트레스 완화·유대감 상승)도 각각 '예민함'·'새침함'
    // 게이트를 거침 — 위 이벤트별 무효화 메시지가 아직 없을 때만 이쪽 메시지를 채택(우선순위 낮음).
    var stressGate = applyDebuffGate("life.stress", -stressRelief);
    state.life.stress = clamp(state.life.stress + stressGate.amount, 0, 100);
    if(!walkDebuffMsg) walkDebuffMsg = stressGate.msg;
    state.life.independence = clamp(state.life.independence - 20*energyMult, 0, 100);
    state.life.hunger = clamp(state.life.hunger - 10, 0, 100);
    state.life.clean = clamp(state.life.clean - 10, 0, 100);
    addGrowth(bondGain * coreGrowthGate());
    var bondMsg = bumpLifeBond(bondGain);
    if(!walkDebuffMsg) walkDebuffMsg = bondMsg;
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
      itemChips: (session.itemChips || []).slice(),
      // 76번(22장): 이번 산책에서 있었던 디버프 무효화/발현 힌트 안내(없으면 null) — closeWalkVeil()이
      // 화면을 홈으로 되돌린 직후 showMessage로 띄워줌.
      debuffMsg: walkDebuffMsg
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
    // 76번(22장): summary를 비우기 전에 debuffMsg를 먼저 꺼내둠 — 화면이 홈으로 돌아온 뒤에 띄워야
    // 산책 결과 화면 위가 아니라 메인 화면에 토스트로 보임.
    var pendingDebuffMsg = state.walk.summary && state.walk.summary.debuffMsg;
    state.walk.summary = null;
    saveState();
    render();
    if(pendingDebuffMsg) showMessage(pendingDebuffMsg);
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
    // 76번(22장): '예민함' 게이트 — 스트레스 감소 무효화. bond 증가도 bumpLifeBond로 통일해 '새침함' 게이트 적용.
    var stressGate = applyDebuffGate("life.stress", -5);
    state.life.stress = clamp(state.life.stress + stressGate.amount, 0, 100);
    var bondMsg = bumpLifeBond(3);
    // 64번(15장): 간식주기도 뼈다귀 1개 소모 + 게임 내 시간 1시간 진행.
    spendBones(BONE_COST_CARE);
    advanceGameTime();
    showMessage(stressGate.msg || bondMsg || pick(FLAVOR.treat));
    saveRenderPulse();
    maybeTriggerDayEnd();
  }
  function doRest(){
    if(!hasBones(BONE_COST_CARE)){ showMessage(pick(FLAVOR.poor)); return; }
    // 76번(22장): '예민함'(스트레스 감소)·'무기력증'(에너지 회복) 게이트.
    var stressGate = applyDebuffGate("life.stress", -5);
    state.life.stress = clamp(state.life.stress + stressGate.amount, 0, 100);
    var energyGate = applyDebuffGate("life.independence", 20);
    state.life.independence = clamp(state.life.independence + energyGate.amount, 0, 100);
    // 64번(15장): 쉬게하기도 뼈다귀 1개 소모 + 게임 내 시간 1시간 진행.
    spendBones(BONE_COST_CARE);
    advanceGameTime();
    showMessage(stressGate.msg || energyGate.msg || pick(FLAVOR.rest));
    saveRenderPulse();
    maybeTriggerDayEnd();
  }
  // 68번(기획문서 19장): [기본돌봄] 신규 활동 "OO아 잠시 나갔다 올게" — 위 5개 활동과 달리 BONE_COST_CARE
  // 공통 규칙을 따르지 않고, 아래 5개 이벤트(A~E) 중 1개가 발동해 그 이벤트 자체의 "시간당 뼈다귀 증감"이
  // 소모/지급을 대신함(사용자 확정, 2026-09-04). 다섯 이벤트 공통으로 시간당 배부름-5·유대감-2·청결도-2·
  // 스트레스+2가 똑같이 적용되고, 이벤트별로 다른 건 시간 범위·시간당 뼈다귀·멘트뿐.
  var OUTING_EVENTS = [
    { id:"A", type:"drain", hoursMin:1, hoursMax:5, bonePerHour:-1,
      flavor:["오랜만에 친구와 만나 시간 가는 줄 모르고... 아, OO!!(후다닥)"] },
    { id:"B", type:"gain",  hoursMin:2, hoursMax:4, bonePerHour:3,
      flavor:["OO아.. 너를 위해 열심히 사료값 벌고 왔어!"] },
    // C(혼합형): 시간당 +1/-1을 매 시간 독립적으로 균등 추첨 — bonePerHour는 고정값이 없어 null로
    // 표시하고, 실제 굴림은 doOuting() 안에서 시간 루프마다 처리함.
    { id:"C", type:"mixed", hoursMin:1, hoursMax:2, bonePerHour:null,
      flavor:["OO아, 금방 다녀올게!"] },
    // D(소모형): 장소 5종은 시간 범위·시간당 뼈다귀 전부 동일 — flavor 배열 인덱스만 다른 순수 연출
    // 분기(사용자 확정). 병원=0·마트=1·행복센터=2·본가=3·약속=4 순서로, 아래 doOuting()의 하루 내
    // 중복 방지 로직(state.outing.usedPlaces)이 이 인덱스를 그대로 기록해둠.
    { id:"D", type:"drain", hoursMin:1, hoursMax:3, bonePerHour:-2,
      flavor:[
        "OO아, 병원에 사람이 많아서 진료 순서가 자꾸 밀렸어. 오래 기다렸지, 미안!",
        "장 보러 갔다가 세일하는 거 보니까 나도 모르게 정신줄을 놨지 뭐야, OO아! 미안, 조금 늦었지?",
        "행복센터에 서류 떼러 갔는데 번호표 뽑고 한참 기다렸어, OO아! 사람이 왜 이렇게 많던지...",
        "본가에 잠깐 들렀는데 엄마가 자꾸 밥 먹고 가라고 붙잡으시더라고, OO아! 그래서 늦었어~",
        "거래처랑 약속이 있었는데 상대방이 늦게 오는 바람에 계속 기다렸어, OO아! 미안 진짜..."
      ] },
    { id:"E", type:"gain",  hoursMin:1, hoursMax:3, bonePerHour:2,
      flavor:["OO아.. 안 쓰는 물건들 좀 정리해서 팔고 왔어! 용돈 좀 벌었지 뭐야."] }
  ];
  // 뼈다귀 잔량이 적을수록 획득형(B·E) 이벤트가 더 자주 뽑히도록 하는 가중치(사용자 확정: 10개 이하
  // ×1.5, 5개 이하 ×2 — 두 조건이 겹치는 5개 이하 구간은 더 큰 쪽인 ×2만 적용, 누적 아님).
  function outingBoneMult(){
    if(state.coins <= 5) return 2;
    if(state.coins <= 10) return 1.5;
    return 1;
  }
  // 확률 재정규화 공식은 원안에 명시가 없어(오픈 이슈) 개발팀 재량으로 가장 단순하고 투명한 방식을
  // 택함 — 획득형(B·E)에만 위 배율을 가중치로 곱하고, 나머지(A·C·D)는 가중치 1을 유지한 뒤 가중치
  // 합 대비 비율로 뽑음(가중치 합 비례 추첨). 예: 뼈다귀 5개 이하면 가중치가 A1·B2·C1·D1·E2(합7)가
  // 되어 최종 확률은 B·E 각 2/7(~28.6%), A·C·D 각 1/7(~14.3%).
  function pickOutingEvent(){
    var mult = outingBoneMult();
    var weights = OUTING_EVENTS.map(function(ev){ return (ev.type === "gain") ? mult : 1; });
    var total = weights.reduce(function(a,b){ return a + b; }, 0);
    var roll = Math.random() * total;
    for(var i = 0; i < OUTING_EVENTS.length; i++){
      roll -= weights[i];
      if(roll <= 0) return OUTING_EVENTS[i];
    }
    return OUTING_EVENTS[OUTING_EVENTS.length - 1];
  }
  // 한글 호격 조사(아/야) — 받침 있으면 "아", 없으면 "야"(josaIGa와 같은 방식, 다른 조사 쌍).
  function josaAYa(word){
    if(!word) return "야";
    var last = word.charCodeAt(word.length - 1);
    if(last >= 0xAC00 && last <= 0xD7A3){
      return ((last - 0xAC00) % 28 === 0) ? "야" : "아";
    }
    return "야";
  }
  // 이벤트 원문의 "OO"는 반려견 이름 자리표시자 — "OO아"(호격) 패턴을 실제 이름+조사로 먼저 치환한
  // 뒤, 조사 없이 단독으로 쓰인 나머지 "OO"(예: A의 "...아, OO!!")는 이름 그대로 치환.
  function fillOutingName(text){
    var name = state.name;
    text = text.split("OO아").join(name + josaAYa(name));
    text = text.split("OO").join(name);
    return text;
  }
  function doOuting(){
    var ev = pickOutingEvent();
    var hours = ev.hoursMin + Math.floor(Math.random() * (ev.hoursMax - ev.hoursMin + 1));
    var flavorText;
    if(ev.id === "D"){
      // D 하루 내 중복 방지(사용자 확정, 2026-09-04): 그날 이미 나온 장소는 다시 안 나오고, 다음 날
      // 06시 리셋(playDayEndSequence)에서 5개 전부 복원됨. 이 규칙은 D 내부 장소 선택에만 적용되고
      // 최상위 A~E 이벤트 선택 자체에는 적용되지 않음(사용자 확정).
      var avail = [];
      ev.flavor.forEach(function(text, idx){
        if(state.outing.usedPlaces.indexOf(idx) === -1) avail.push(idx);
      });
      if(avail.length === 0){ state.outing.usedPlaces = []; avail = ev.flavor.map(function(_, idx){ return idx; }); }
      var placeIdx = avail[Math.floor(Math.random() * avail.length)];
      state.outing.usedPlaces.push(placeIdx);
      flavorText = ev.flavor[placeIdx];
    } else {
      flavorText = ev.flavor[0];
    }
    // 시간 경과분을 advanceGameTime()으로 실제 한 시간씩 흘려보내(블레스드펍 2시간 보너스 등 기존
    // 시계 로직과 정확히 맞물리도록), 매 시간 공통 감소·이벤트별 뼈다귀 증감을 함께 적용. 도중에
    // 하루 종료 시각(DAY_END_HOUR)에 닿으면 남은 시간은 흘려보내지 않고 거기서 멈춤 — 산책과 같은
    // 원칙(하루는 오직 "행동이 그 결과까지 처리된 직후"에만 종료 판정, 013 참고).
    for(var h = 0; h < hours; h++){
      var boneDelta = ev.type === "mixed" ? (Math.random() < 0.5 ? 1 : -1) : ev.bonePerHour;
      state.coins = Math.max(0, state.coins + boneDelta);
      state.life.hunger = clamp(state.life.hunger - 5, 0, 100);
      state.life.bond = clamp(state.life.bond - 2, 0, 100);
      state.life.clean = clamp(state.life.clean - 2, 0, 100);
      state.life.stress = clamp(state.life.stress + 2, 0, 100);
      advanceGameTime();
      if(state.time.hour >= DAY_END_HOUR) break;
    }
    showMessage(fillOutingName(flavorText));
    saveRenderPulse();
    maybeTriggerDayEnd();
  }
  function doBuySnack(){
    if(state.coins < 10){ showMessage(pick(FLAVOR.poor)); return; }
    state.coins -= 10;
    state.life.hunger = clamp(state.life.hunger + 40, 0, 100);
    var stressRelief = 5 * effMult("happinessGain","happinessGainCalm","happinessGainFeed");
    // 76번(22장): '예민함' 게이트 — 스트레스 감소 무효화.
    var stressGate = applyDebuffGate("life.stress", -stressRelief);
    state.life.stress = clamp(state.life.stress + stressGate.amount, 0, 100);
    showMessage(stressGate.msg || pick(FLAVOR.snack));
    saveRenderPulse();
  }
  function doBuyToy(){
    if(state.coins < 15){ showMessage(pick(FLAVOR.poor)); return; }
    state.coins -= 15;
    var stressRelief = 35 * effMult("happinessGain","happinessGainActive");
    // 76번(22장): '예민함'(스트레스 감소)·'새침함'(유대감 상승, bumpLifeBond 경유) 게이트.
    var stressGate = applyDebuffGate("life.stress", -stressRelief);
    state.life.stress = clamp(state.life.stress + stressGate.amount, 0, 100);
    addGrowth(2 * effMult("bondGain"));
    var bondMsg = bumpLifeBond(2);
    showMessage(stressGate.msg || bondMsg || pick(FLAVOR.toy));
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
