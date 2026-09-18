  // ===== 77번(신규): [기다려 대회] — [외출하기]의 "대회/이벤트"(47번, 완전한 자리표시자였음) 첫 콘텐츠 =====
  // 원안(사용자 채팅) + AskUserQuestion 확인 4건을 그대로 반영:
  //  1) 하루 참여 제한은 4단계(초급/중급/상급/스페셜리스트) 통틀어 하루 1회(확정: 추천안).
  //  2) 같은 1사이클(3초) 안에서 유저 개와 다른 개가 동시에 탈락하면 공동 순위로 처리(확정: 추천안) —
  //     단, 유저 개+다른 개 1마리만 남은 결승에서 둘이 동시에 탈락하면 공동 1위로 끝내지 않고 반드시
  //     재경기(이 사이클의 탈락을 무효화하고 다시 기다려 버튼을 누르게 함)로 1위를 가림(사용자 추가 요청).
  //  3) 유저 개를 제외한 상대견 4마리에게 A/B/C/D 등급(유저 스탯 대비 가감 비율)을 정확히 1마리씩 고정 배정(확정: 추천안).
  //  4) 상대견 그래픽은 새로 그리지 않고 기존 9견종 실루엣(drawPixelDog)을 재사용해 견종·모색·눈동자색만 랜덤화(확정: 추천안).
  // 그 외 아래는 AskUserQuestion으로 확인받지 않고 기존 코드 관례를 확장한 개발팀 판단(완료 보고에 명시):
  //  - "동시 탈락 시 재경기" 규칙을 5마리>2마리 상태에서 "그 사이클에 살아있는 전원이 동시에 탈락"하는
  //    일반적인 경우(예: 3마리가 남았는데 셋 다 같은 사이클에 탈락)에도 확장 적용 — 누구도 남지 않는
  //    상황을 막기 위한 안전장치(사용자가 명시한 "결승 2마리" 규칙의 자연스러운 일반화로 판단).
  //  - 유저의 개가 탈락한 순간(재경기 대상이 아닌 한) 즉시 게임을 끝내고 결과창을 띄움 — 그 시점에
  //    아직 살아있는 다른 개들의 최종 순위까지는 굳이 더 시뮬레이션하지 않음(유저 결과만 필요하므로).
  //  - 단상 위 개는 "앉아있는 형태" 요청이지만, 별도의 착석 포즈 그래픽은 이번 라운드에 새로 그리지
  //    않고 기존 서있는 픽셀 강아지(drawPixelDog)를 단상 위에 그대로 얹는 방식으로 근사(오픈 이슈).
  //  - 말풍선 아이콘은 성공/실패와 무관하게 매 시도(1초)마다 순수 랜덤으로 고름(사용자 원문이 특정
  //    아이콘을 결과와 매칭짓지 않고 나열만 했기 때문).
  //  - 상대견의 이해력(매칭 확률식의 세 번째 항)은 A~D 등급 배분 대상이 아니라("충성도·수행력만" 명시)
  //    0~100 균등 랜덤으로 둠. 이름은 이 파일에 새로 만든 이름 목록(COMPETITION_DOG_NAMES)에서 뽑음
  //    (기존 코드에 재사용할 만한 NPC 이름 풀이 없었음).
  //  - 게임 내 시간 2시간 진행은 advanceGameTime()을 두 번 호출하는 방식으로 구현 — 기존의 "행동 1회=1시간"
  //    누적 로직(복댕댕이 2시간마다 뼈다귀+1, 디버프 공격성 2시간마다 +3)이 그대로, 별도 특수처리 없이 재사용됨.
  //  - 참여 시 뼈다귀·에너지·배부름·유대감(+5)은 [기다려]를 누른 게 아니라 단계를 선택해 참여를 확정하는
  //    시점에 즉시 적용(어질리티의 "도전 즉시 전부 차감" 관례와 동일한 지점).

  var COMPETITION_ENTRY_BONE_COST = 2;
  var COMPETITION_ENTRY_ENERGY_COST = 10;
  var COMPETITION_ENTRY_HUNGER_COST = 10;
  var COMPETITION_ENTRY_BOND_GAIN = 5;
  var COMPETITION_WINDOW_START_HOUR = 10;
  var COMPETITION_WINDOW_END_HOUR = 17; // 미만(오후 4시대까지 참여 가능, 오후 5시부터는 마감)

  var COMPETITION_TIER_ORDER = ["beginner", "intermediate", "advanced", "specialist"];
  var COMPETITION_TIER_LABELS = { beginner:"초급대회", intermediate:"중급대회", advanced:"상급대회", specialist:"스페셜리스트 대회" };
  var COMPETITION_TIER_BTN_ID = {
    beginner:"competitionTierBeginner", intermediate:"competitionTierIntermediate",
    advanced:"competitionTierAdvanced", specialist:"competitionTierSpecialist"
  };
  var COMPETITION_TIER_COND_ID = {
    beginner:"competitionTierBeginnerCond", intermediate:"competitionTierIntermediateCond",
    advanced:"competitionTierAdvancedCond", specialist:"competitionTierSpecialistCond"
  };

  // 순위별 보상표 — 사용자 원안 그대로. bond는 항상 존재(전 순위 공통), loyalty/comprehension은
  // 낮은 순위(5·4위)엔 일부만 있음. [min,max] 범위는 매 대회마다 그 범위 안에서 새로 굴림.
  var COMPETITION_REWARDS = {
    beginner:{
      5:{ bones:2, bond:[1,1] },
      4:{ bones:2, loyalty:[1,1], bond:[1,1] },
      3:{ bones:3, loyalty:[1,1], bond:[1,1], comprehension:[1,1] },
      2:{ bones:4, loyalty:[1,2], bond:[1,2], comprehension:[1,2] },
      1:{ bones:5, loyalty:[2,4], bond:[2,4], comprehension:[2,4] }
    },
    intermediate:{
      5:{ bones:5, bond:[2,2] },
      4:{ bones:5, loyalty:[2,2], bond:[2,2] },
      3:{ bones:6, loyalty:[2,2], bond:[2,2], comprehension:[2,2] },
      2:{ bones:8, loyalty:[3,5], bond:[3,5], comprehension:[2,4] },
      1:{ bones:10, loyalty:[4,6], bond:[4,6], comprehension:[3,5] }
    },
    advanced:{
      5:{ bones:10, bond:[3,3] },
      4:{ bones:10, loyalty:[3,3], bond:[3,3] },
      3:{ bones:10, loyalty:[3,3], bond:[3,3], comprehension:[2,2] },
      2:{ bones:12, loyalty:[4,5], bond:[4,5], comprehension:[4,5] },
      1:{ bones:15, loyalty:[5,7], bond:[5,7], comprehension:[5,7] }
    },
    specialist:{
      5:{ bones:15, bond:[3,3] },
      4:{ bones:15, loyalty:[3,3], bond:[3,3] },
      3:{ bones:15, loyalty:[3,3], bond:[3,3], comprehension:[2,2] },
      2:{ bones:15, loyalty:[4,6], bond:[4,6], comprehension:[4,6] },
      1:{ bones:20, loyalty:[6,8], bond:[6,8], comprehension:[6,7] }
    }
  };

  // ---- 단계 해금 조건(등급 문자는 006번 파일 GRADE_LETTERS와 동일한 20점 단위 경계) ----
  function competitionTierUnlocked(tierId){
    var w = state.competition.winCounts, c = state.core;
    if(tierId === "beginner") return state.fosterDay >= 2;
    if(tierId === "intermediate") return w.beginner >= 1 && c.loyalty >= 20 && c.execution >= 20;
    if(tierId === "advanced") return w.intermediate >= 2 && c.loyalty >= 40 && c.execution >= 40;
    if(tierId === "specialist") return w.advanced >= 3 && c.loyalty >= 60 && c.execution >= 40;
    return false;
  }
  function competitionTierLockReasons(tierId){
    var w = state.competition.winCounts, c = state.core, out = [];
    if(tierId === "beginner"){
      if(state.fosterDay < 2) out.push("임시보호 2일차부터 참여할 수 있어요");
    } else if(tierId === "intermediate"){
      if(w.beginner < 1) out.push("초급대회에서 1위(우승)를 1회 이상 해야 해요");
      if(c.loyalty < 20) out.push("충성도가 D등급 이상이어야 해요");
      if(c.execution < 20) out.push("수행력이 D등급 이상이어야 해요");
    } else if(tierId === "advanced"){
      if(w.intermediate < 2) out.push("중급대회에서 1위(우승)를 2회 이상 해야 해요");
      if(c.loyalty < 40) out.push("충성도가 C등급 이상이어야 해요");
      if(c.execution < 40) out.push("수행력이 C등급 이상이어야 해요");
    } else if(tierId === "specialist"){
      if(w.advanced < 3) out.push("상급대회에서 1위(우승)를 3회 이상 해야 해요");
      if(c.loyalty < 60) out.push("충성도가 B등급 이상이어야 해요");
      if(c.execution < 40) out.push("수행력이 C등급 이상이어야 해요");
    }
    return out;
  }
  function competitionTierCondText(tierId){
    if(tierId === "beginner") return "임시보호 2일차부터 · 누구나 참여 가능";
    if(tierId === "intermediate") return "초급 1위 1회+ · 충성도 D+ · 수행력 D+";
    if(tierId === "advanced") return "중급 1위 2회+ · 충성도 C+ · 수행력 C+";
    if(tierId === "specialist") return "상급 1위 3회+ · 충성도 B+ · 수행력 C+";
    return "";
  }
  function competitionWindowOpenNow(){
    return state.time.hour >= COMPETITION_WINDOW_START_HOUR && state.time.hour < COMPETITION_WINDOW_END_HOUR;
  }

  // 76번(동물병원)의 checkDebuffOnsets()와 같은 20초 틱에서 호출됨(024번 파일) — 토스트가 아니라
  // "확인 눌러야 사라지는" 팝업이라 별도 함수로 분리.
  function checkCompetitionUnlock(){
    if(state.competition.beginnerAnnounced) return;
    if(state.fosterDay < 2 || state.time.hour < 9) return;
    state.competition.beginnerAnnounced = true;
    saveState();
    if(el.competitionAnnounceText) el.competitionAnnounceText.textContent = "이제부터 기다려 대회(초급)에 참여할 수 있어요!";
    if(el.competitionAnnouncePopup) el.competitionAnnouncePopup.hidden = false;
  }

  function renderCompetitionTierSelect(){
    COMPETITION_TIER_ORDER.forEach(function(tierId){
      var btn = el[COMPETITION_TIER_BTN_ID[tierId]];
      var cond = el[COMPETITION_TIER_COND_ID[tierId]];
      if(cond) cond.textContent = competitionTierCondText(tierId);
      if(btn) btn.classList.toggle("locked", !competitionTierUnlocked(tierId));
    });
  }

  function onCompetitionTierClick(tierId){
    if(competitionMatchRunning) return;
    var reasons = competitionTierLockReasons(tierId);
    if(reasons.length){ showMessage(reasons.join(" / ")); return; }
    if(state.competition.playedToday){ showMessage("오늘은 이미 기다려 대회에 참여했어요."); return; }
    if(!hasBones(COMPETITION_ENTRY_BONE_COST)){ showMessage(pick(FLAVOR.poor)); return; }
    startCompetitionMatch(tierId);
  }

  // ---- 상대견(4마리) 생성 ----
  var COMPETITION_DOG_NAMES = [
    "보리","콩이","두부","몽이","초코","마루","해피","토리","루비","까미",
    "방울","쿠키","별이","봄이","라떼","순두부","알밤","망고","치즈","달이"
  ];
  // A: 유저 대비 +2~10%, B: -2~10%(즉 -10%~-2%), C: -8~15%(즉 -15%~-8%), D: +8~15%
  var COMPETITION_TIER_STAT_RANGE = { A:[0.02,0.10], B:[-0.10,-0.02], C:[-0.15,-0.08], D:[0.08,0.15] };
  function shuffleArr(a){
    for(var i=a.length-1; i>0; i--){
      var j = Math.floor(Math.random()*(i+1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function rollPct(range){ return range[0] + Math.random()*(range[1]-range[0]); }
  function competitionRollTierStat(baseVal, tierLetter){
    var pct = rollPct(COMPETITION_TIER_STAT_RANGE[tierLetter]);
    return clamp(Math.round(baseVal * (1+pct)), 0, 100);
  }
  // 5마리 전부를 시각적으로 같은 조건(중립 성장단계·중립 statVisual)으로 통일해 그려, 유저 개의
  // 성장단계/스탯 개성화(70·75번)가 이 화면에서만 유독 다른 4마리와 어색하게 도드라지지 않게 함
  // (원안·사용자 요청에 없던 판단 — 개발팀이 시각적 일관성을 위해 좁게 채운 지점, 오픈 이슈).
  var COMPETITION_NEUTRAL_SV = {
    bodyWMult:1, legHMult:1, leanForwardPx:0, earAlertMult:1, postureStraighten:0,
    eyeSoftMult:1, tailLiftPx:0, furShineAlpha:0, earBackMult:1, eyeSharpMult:1
  };
  function competitionPlayerVisual(){
    var breedId = state.breed || "golden";
    if(breedId === "mix" && state.mixGeoBreed) breedId = state.mixGeoBreed;
    // 80번: 스프라이트 조회용 coatId — 믹스견은 모색 출처 접두사가 지오메트리 견종(breedId)과 일치할
    // 때만 넘기고, 그 외엔 null(drawPixelDog가 override 경로에서도 안전하게 절차적 렌더링으로 폴백).
    var coatId = state.coatId || null;
    if(state.breed === "mix" && coatId){
      var mixPrefix = breedId + "_";
      coatId = coatId.indexOf(mixPrefix) === 0 ? coatId.slice(mixPrefix.length) : null;
    }
    return {
      breedId:breedId,
      furA: cssVar("--fur-a","#E7C79A"), furADark: cssVar("--fur-a-dark","#C79E68"),
      furB: cssVar("--fur-b","#B98A5E"), furC: cssVar("--fur-c","#EDEDED"), furD: cssVar("--fur-d","#4A4038"),
      eyeColor: cssVar("--eye-color","#4A4038"),
      gv: GROWTH_STAGE_VISUAL[2], sv: COMPETITION_NEUTRAL_SV, mood:"normal", noBadges:true,
      coatId: coatId, stageIdx: 2
    };
  }
  function buildCompetitionOpponents(){
    var pool = PURE_BREED_ORDER.slice();
    var tiers = shuffleArr(["A","B","C","D"]);
    var namesPool = COMPETITION_DOG_NAMES.slice();
    var out = [];
    for(var i=0; i<4; i++){
      var breedId = pool.length ? pool.splice(Math.floor(Math.random()*pool.length), 1)[0] : "golden";
      var coat = rollTrait(COAT_PALETTES[breedId] || COAT_PALETTES.golden);
      var eye = rollTrait(EYE_COLORS[breedId] || EYE_COLORS.golden);
      var name = namesPool.length ? namesPool.splice(Math.floor(Math.random()*namesPool.length), 1)[0] : "댕댕이";
      var tierLetter = tiers[i];
      out.push({
        key:"npc"+i, isPlayer:false, name:name, tierLetter:tierLetter,
        loyalty: competitionRollTierStat(state.core.loyalty, tierLetter),
        execution: competitionRollTierStat(state.core.execution, tierLetter),
        comprehension: Math.floor(Math.random()*101),
        visual:{
          breedId:breedId, furA:coat.fur.a, furADark:coat.fur.aDark, furB:coat.fur.b,
          furC: cssVar("--fur-c","#EDEDED"), furD: cssVar("--fur-d","#4A4038"), eyeColor: eye.hex,
          gv: GROWTH_STAGE_VISUAL[2], sv: COMPETITION_NEUTRAL_SV, mood:"normal", noBadges:true,
          // 80번: 상대견은 항상 순종(pool은 PURE_BREED_ORDER)이라 coat.id를 접두사 처리 없이 그대로 사용
          coatId: coat.id, stageIdx: 2
        },
        eliminated:false, rank:null, bubble:null
      });
    }
    return out;
  }

  // ---- 성공/실패 판정 ----
  // (충성도/5 + 수행력/5 + 이해력/10 + 40)%, 하한 30%·상한 90%(사용자 원안 그대로).
  function competitionSuccessChance(c){
    var pct = (c.loyalty/5) + (c.execution/5) + (c.comprehension/10) + 40;
    return clamp(pct, 30, 90) / 100;
  }

  // ---- 보상 적용 ----
  function rollRange(r){ if(!r) return 0; return r[0] + Math.floor(Math.random()*(r[1]-r[0]+1)); }
  function applyCompetitionReward(tierId, rank){
    var table = COMPETITION_REWARDS[tierId] || COMPETITION_REWARDS.beginner;
    var spec = table[rank] || table[5];
    var depressionPenalty = isAbilityOwned("depression") ? 0.9 : 1;
    var applied = {};
    var bonesGain = spec.bones || 0;
    if(bonesGain) state.coins += bonesGain;
    ["loyalty","comprehension"].forEach(function(key){
      if(!spec[key]) return;
      var raw = rollRange(spec[key]) * depressionPenalty;
      var gain = Math.round(raw);
      if(gain <= 0) return;
      // 76번(22장) 디버프 게이팅과 growthMaxStats 클램프를 어질리티(74번)와 동일한 방식으로 적용.
      var gate = applyDebuffGate("core." + key, gain);
      gain = Math.round(gate.amount);
      if(gain <= 0) return;
      var cap = (state.growthMaxStats && typeof state.growthMaxStats[key] === "number") ? state.growthMaxStats[key] : 100;
      var before = state.core[key];
      state.core[key] = clamp(state.core[key] + gain, 0, cap);
      var actual = state.core[key] - before;
      if(actual > 0) applied["core." + key] = actual;
    });
    if(spec.bond){
      var bondGain = Math.round(rollRange(spec.bond) * depressionPenalty);
      if(bondGain > 0){
        var beforeBond = state.life.bond;
        bumpLifeBond(bondGain);
        var actualBond = state.life.bond - beforeBond;
        if(actualBond !== 0) applied["life.bond"] = actualBond;
      }
    }
    return { applied:applied, bones:bonesGain };
  }

  // ---- 시상대(단상) 캔버스 렌더링 ----
  var COMPETITION_CANVAS_W = 290, COMPETITION_CANVAS_H = 108;
  var COMPETITION_GROUND_ROW = 90;
  var COMPETITION_PODIUM_W = 46, COMPETITION_PODIUM_H = 10;
  // 사용자 지정: 단상 5개 색은 빨강/주황/노랑/초록/파랑 — 항상 이 순서로 화면 왼쪽부터 고정되고,
  // "어느 개가 어느 색 위에 서는지"만 매 대회마다 랜덤(슬롯 배정, contestants[i].slot).
  var COMPETITION_PODIUM_COLORS = ["#D9534F", "#E08A3C", "#E4C93E", "#5FA85F", "#4A86C8"];

  function competitionLaneCenterX(slot){
    var laneW = COMPETITION_CANVAS_W / 5;
    return Math.round(laneW*slot + laneW/2);
  }
  function competitionOffsetXForSlot(slot){
    var cx = Math.round(PX_W/2) + 2; // drawPixelDog() 자체의 중심 좌표 관례(002번)
    return competitionLaneCenterX(slot) - cx;
  }
  function drawCompetitionScene(){
    if(!el.competitionCanvas || !el.competitionCanvas.getContext) return;
    var ctx = el.competitionCanvas.getContext("2d");
    if(!ctx) return;
    ctx.clearRect(0, 0, COMPETITION_CANVAS_W, COMPETITION_CANVAS_H);
    var grad = ctx.createLinearGradient(0, 0, 0, COMPETITION_GROUND_ROW);
    grad.addColorStop(0, cssVar("--sky", "#BFE0EE"));
    grad.addColorStop(1, "#E8F3DC");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, COMPETITION_CANVAS_W, COMPETITION_GROUND_ROW);
    ctx.fillStyle = cssVar("--moss", "#9CB88C");
    ctx.fillRect(0, COMPETITION_GROUND_ROW, COMPETITION_CANVAS_W, COMPETITION_CANVAS_H - COMPETITION_GROUND_ROW);

    if(!CM) return;
    for(var slot=0; slot<5; slot++){
      var laneCx = competitionLaneCenterX(slot);
      ctx.fillStyle = COMPETITION_PODIUM_COLORS[slot];
      ctx.fillRect(laneCx - COMPETITION_PODIUM_W/2, COMPETITION_GROUND_ROW, COMPETITION_PODIUM_W, COMPETITION_PODIUM_H);
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(laneCx - COMPETITION_PODIUM_W/2, COMPETITION_GROUND_ROW, COMPETITION_PODIUM_W, 2);

      var c = null;
      for(var k=0; k<CM.contestants.length; k++){
        if(CM.contestants[k].slot === slot){ c = CM.contestants[k]; break; }
      }
      if(!c || c.eliminated) continue;

      var offsetX = competitionOffsetXForSlot(slot);
      // 77번: 단상 위 "앉아있는" 요청은 새 착석 포즈 그래픽을 그리지 않고 기존 서있는 픽셀 강아지를
      // 그대로 얹는 방식으로 근사(오픈 이슈로 명시).
      drawPixelDog(ctx, COMPETITION_GROUND_ROW, offsetX, false, c.visual);

      ctx.textAlign = "center";
      ctx.font = "8px sans-serif";
      ctx.fillStyle = "#2E2822";
      ctx.fillText(c.name, laneCx, COMPETITION_GROUND_ROW + COMPETITION_PODIUM_H + 9);

      if(c.bubble){
        var bubbleY = COMPETITION_GROUND_ROW - 34;
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.beginPath();
        ctx.arc(laneCx, bubbleY, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.font = "10px sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillText(c.bubble, laneCx, bubbleY + 1);
        ctx.textBaseline = "alphabetic";
      }
    }
  }
  function competitionSetGaugePct(pct){
    if(el.competitionGaugeFill) el.competitionGaugeFill.style.width = clamp(pct, 0, 100) + "%";
  }

  // ---- 경기 진행 ----
  var COMPETITION_BUBBLE_ICONS = ["❤️", "🦴", "🐾", "😊", "❓", "⚠️", "❗"];
  var competitionMatchRunning = false;
  var CM = null; // 현재 진행 중인 경기 상태

  function competitionAssignRanks(group){
    // 사용자 확정: "같은 사이클 안에서 동시 탈락"은 공동 순위 — 그룹이 소비하는 등수 구간 중
    // 더 높은(더 좋은) 등수를 그룹 전원에게 부여(예: 2마리 동시 탈락이 4·5위 구간을 소비하면 둘 다 4위).
    var n = group.length;
    var consumed = CM.rankPool.splice(0, n);
    var rank = Math.min.apply(null, consumed);
    group.forEach(function(c){ c.eliminated = true; c.rank = rank; });
  }

  async function runCompetitionCycle(){
    if(!CM || CM.finished) return;
    el.competitionWaitBtn.disabled = true;
    competitionSetGaugePct(0);
    var aliveBefore = CM.contestants.filter(function(c){ return !c.eliminated; });
    var isFinalTwo = aliveBefore.length === 2;
    if(el.competitionCycleLabel) el.competitionCycleLabel.textContent = "생존 " + aliveBefore.length + "마리 남음";
    var failedThisCycle = [];

    for(var tick=1; tick<=3; tick++){
      await wait(1000);
      competitionSetGaugePct((tick/3)*100);
      aliveBefore.forEach(function(c){
        if(failedThisCycle.indexOf(c) !== -1) return;
        c.bubble = pick(COMPETITION_BUBBLE_ICONS);
      });
      aliveBefore.forEach(function(c){
        if(failedThisCycle.indexOf(c) !== -1) return;
        if(Math.random() >= competitionSuccessChance(c)) failedThisCycle.push(c);
      });
      drawCompetitionScene();
      if(failedThisCycle.indexOf(CM.player) !== -1) break; // 유저 개가 탈락한 순간 즉시 중단(재경기 판정은 아래에서)
    }
    aliveBefore.forEach(function(c){ c.bubble = null; });

    // 결승(2마리)에서 둘 다 이번 사이클에 탈락 → 사용자 추가 요청: 재경기(이번 탈락은 무효화).
    if(isFinalTwo && failedThisCycle.length === 2){
      drawCompetitionScene();
      showMessage("무승부! 다시 한 번 기다려볼까요?");
      el.competitionWaitBtn.disabled = false;
      return;
    }
    // 개발팀 판단(오픈 이슈로 명시): 결승이 아니어도 "이번 사이클에 살아있던 전원이 함께 탈락"하면
    // 아무도 남지 않게 되므로, 같은 원칙(재경기)으로 안전하게 처리.
    if(aliveBefore.length > 2 && failedThisCycle.length === aliveBefore.length){
      drawCompetitionScene();
      showMessage("모두 실패! 다시 한 번 기다려볼까요?");
      el.competitionWaitBtn.disabled = false;
      return;
    }

    if(failedThisCycle.length) competitionAssignRanks(failedThisCycle);
    drawCompetitionScene();

    var aliveAfter = CM.contestants.filter(function(c){ return !c.eliminated; });
    if(aliveAfter.length <= 1){
      if(aliveAfter.length === 1) aliveAfter[0].rank = 1;
      finishCompetitionMatch();
      return;
    }
    if(CM.player.eliminated){
      finishCompetitionMatch();
      return;
    }
    if(el.competitionCycleLabel) el.competitionCycleLabel.textContent = "생존 " + aliveAfter.length + "마리 남음 · 다음 기다려를 눌러보세요";
    el.competitionWaitBtn.disabled = false;
  }

  function onCompetitionWaitClick(){
    if(!CM || CM.finished || el.competitionWaitBtn.disabled) return;
    runCompetitionCycle();
  }

  function finishCompetitionMatch(){
    CM.finished = true;
    competitionMatchRunning = false;
    var player = CM.player;
    var rank = player.rank;
    if(rank === 1){
      if(CM.tierId === "beginner") state.competition.winCounts.beginner++;
      else if(CM.tierId === "intermediate") state.competition.winCounts.intermediate++;
      else if(CM.tierId === "advanced") state.competition.winCounts.advanced++;
      // 스페셜리스트는 그 위의 승급 단계가 없어 조건 판정에는 쓰이지 않지만, 향후 확장을 대비해 카운트만 남김.
    }
    // 사용자 원안: "게임 한 번 참여시 시간 2시간 진행" — advanceGameTime()을 두 번 호출해 기존
    // 부수효과(복댕댕이 2시간마다 뼈다귀+1, 디버프 공격성 2시간마다 +3)를 그대로 재사용.
    advanceGameTime();
    advanceGameTime();
    var reward = applyCompetitionReward(CM.tierId, rank);
    saveState();
    render();

    el.competitionArena.hidden = true;
    el.competitionResult.hidden = false;
    el.competitionResultTitle.textContent = COMPETITION_TIER_LABELS[CM.tierId] + " 결과";
    el.competitionResultText.textContent = (player.name || "댕댕이") + josaIGa(player.name) + " " + rank + "위를 했어요! (뼈다귀 +" + reward.bones + ")";
    renderWalkSummaryStats(el.competitionResultStats, reward.applied);
  }

  function startCompetitionMatch(tierId){
    spendBones(COMPETITION_ENTRY_BONE_COST);
    state.life.independence = clamp(state.life.independence - COMPETITION_ENTRY_ENERGY_COST, 0, 100);
    state.life.hunger = clamp(state.life.hunger - COMPETITION_ENTRY_HUNGER_COST, 0, 100);
    bumpLifeBond(COMPETITION_ENTRY_BOND_GAIN);
    state.competition.playedToday = true;
    saveState();
    render();

    var opponents = buildCompetitionOpponents();
    var player = {
      key:"player", isPlayer:true, name: state.name || "댕댕이",
      loyalty: state.core.loyalty, execution: state.core.execution, comprehension: state.core.comprehension,
      visual: competitionPlayerVisual(), eliminated:false, rank:null, bubble:null
    };
    var contestants = [player].concat(opponents);
    var slots = shuffleArr([0, 1, 2, 3, 4]);
    contestants.forEach(function(c, i){ c.slot = slots[i]; });

    CM = { tierId:tierId, contestants:contestants, player:player, rankPool:[5, 4, 3, 2, 1], finished:false };
    competitionMatchRunning = true;

    el.competitionTierSelect.hidden = true;
    el.competitionClosed.hidden = true;
    el.competitionResult.hidden = true;
    el.competitionArena.hidden = false;
    competitionSetGaugePct(0);
    if(el.competitionCycleLabel) el.competitionCycleLabel.textContent = "생존 5마리 남음";
    el.competitionWaitBtn.disabled = false;
    drawCompetitionScene();
  }

  // ---- veil 열기/닫기 ----
  function openCompetitionVeil(){
    if(CM && !CM.finished && competitionMatchRunning){
      el.competitionTierSelect.hidden = true;
      el.competitionClosed.hidden = true;
      el.competitionArena.hidden = false;
      el.competitionResult.hidden = true;
      openVeil(el.competitionVeil);
      return;
    }
    el.competitionArena.hidden = true;
    if(!(CM && CM.finished)) el.competitionResult.hidden = true;
    if(!competitionWindowOpenNow()){
      el.competitionClosed.hidden = false;
      el.competitionTierSelect.hidden = true;
    } else if(!(CM && CM.finished)){
      el.competitionClosed.hidden = true;
      el.competitionTierSelect.hidden = false;
      renderCompetitionTierSelect();
    }
    openVeil(el.competitionVeil);
  }
  function closeCompetitionVeil(){
    if(competitionMatchRunning) return; // 어질리티(74번)와 같은 원칙 — 경기 진행 중엔 뒤로가기 무시
    CM = null;
    closeVeil(el.competitionVeil);
    maybeTriggerDayEnd();
  }
