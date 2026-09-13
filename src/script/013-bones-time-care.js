  var BONE_COST_CARE = 1;
  var BONE_COST_WALK_HOME = 1;
  var BONE_COST_WALK_OTHER = 2;
  // 하루 07~21시가 아니라 06시 시작·22시 종료(밤 10시)로 명시됨 — 총 16시간, 뼈다귀 소모 행동 1회당 1시간.
  var DAY_START_HOUR = 6;
  var DAY_END_HOUR = 22;
  // 산책 1회 후 다음 산책까지 게임 내 시간으로 지나야 하는 시간(사용자 확정 수치, 밸런싱 대상 아님).
  var WALK_COOLDOWN_HOURS = 3;
  // 일일 리셋 뼈다귀 지급량 — 문서에 "테스트용 가정치"로 명시된 값, 실플레이 후 조정 가능.
  var DAILY_BONE_GRANT = 20;
  // 에너지(state.life.independence) 구간별 산책 효과 배율·차단 — 전부 문서에 "테스트용 가정치"로
  // 명시된 값. min은 포함, 그 구간 안에 있으면 해당 gain/loss 배율이 deltaLedger 정산(finishWalk)의
  // "긍정적 효과"에만 곱해짐(60번 지역 전담 능력 배율과 같은 지점, 서로 곱연산으로 함께 적용).
  var ENERGY_WALK_TIERS = [
    { min:31, max:100, gain:1.0, loss:1.0, warn:null, blocked:false },
    { min:21, max:30,  gain:0.8, loss:1.2, warn:"경고! 오늘은 좀 지쳐 보여... 무리하면 안 좋을 것 같아.", blocked:false },
    { min:11, max:20,  gain:0.5, loss:1.5, warn:"경고! 에너지가 많이 떨어졌어... 산책보다 쉬는 게 어때?", blocked:false },
    { min:0,  max:10,  gain:0,   loss:1,   warn:null, blocked:true }
  ];
  function energyWalkTierFor(independence){
    for(var i = 0; i < ENERGY_WALK_TIERS.length; i++){
      var t = ENERGY_WALK_TIERS[i];
      if(independence >= t.min && independence <= t.max) return t;
    }
    return ENERGY_WALK_TIERS[0];
  }
  function hasBones(n){ return state.coins >= n; }
  function spendBones(n){ state.coins = Math.max(0, state.coins - n); }
  // 뼈다귀를 소모하는 행동 1회 = 게임 내 시간 1시간 진행. 소모 뼈다귀 개수(1개든 2개든)와 무관하게
  // 항상 정확히 1시간만 흐름(원안 "행동 1회마다 1시간" — 뼈다귀 단위가 아니라 행동 단위).
  // absHour는 하루 경계에서도 리셋되지 않는 누적값 — 산책 3시간 쿨다운 판정에 사용.
  function advanceGameTime(){
    state.time.hour += 1;
    state.time.absHour += 1;
    // 65번(16장): '복댕댕이' 보유 시 게임 내 시간 2시간마다(=행동 2회당) 뼈다귀 +1. absHour는 하루
    // 경계에서도 리셋되지 않는 누적값이라(아래 WALK_COOLDOWN_HOURS 관련 로직과 동일한 값) 짝수가 될
    // 때마다 지급하면 날짜가 바뀌어도 2시간 주기가 끊기지 않음.
    if(state.time.absHour % 2 === 0 && isAbilityOwned("blessedPup")){
      state.coins += 1;
    }
    // 76번(22장): 부정 디버프 10종 중 뭐라도 걸려있는 동안 공통 부수효과 — 게임 내 시간 2시간마다
    // 공격성 +3(엑셀 '기타' 란 공통 명시, 삐짐 포함). blessedPup과 같은 absHour 짝수 판정을 재사용.
    if(state.time.absHour % 2 === 0 && anyActiveDebuff()){
      state.core.aggression = clamp(state.core.aggression + 3, 0, 100);
    }
  }
  function gameClockLabel(){
    var h = state.time.hour;
    var period = h < 12 ? "오전" : "오후";
    var h12 = h % 12; if(h12 === 0) h12 = 12;
    return period + " " + h12 + "시";
  }
  // 8번: "시간은 오직 행동을 통해서만 흐른다" — 실제 시계 기반으로 강제 하루 종료를 굴리는 장치는
  // 만들지 않음. 이 함수는 뼈다귀 소모 행동이 "그 결과까지 전부 처리된 직후"에만 호출되는 게 원칙 —
  // 기본돌봄은 각 함수 맨 끝에서, 산책은 세션이 완전히 끝나는 closeWalkVeil()에서 호출됨(산책 도중엔
  // 하루가 끊기지 않도록, 시작 시점엔 시간만 흐르고 이 판정은 미룸).
  var dayEndInProgress = false;
  function maybeTriggerDayEnd(){
    if(dayEndInProgress || state.ending) return;
    if(state.time.hour >= DAY_END_HOUR){
      playDayEndSequence();
    }
  }

  function doFeed(){
    if(state.life.hunger >= 98){ showMessage(pick(FLAVOR.full)); return; }
    if(!hasBones(BONE_COST_CARE)){ showMessage(pick(FLAVOR.poor)); return; }
    // 63번(14장): "이것도 내꺼~ 저것도 내꺼~"(과식 성향 능력) 보유 시 밥주기의 배부름 상승치가 +25→+28로 커짐
    var hungerGain = isAbilityOwned("hoarder") ? 28 : 25;
    state.life.hunger = clamp(state.life.hunger + hungerGain, 0, 100);
    var stressRelief = 3 * effMult("happinessGain","happinessGainCalm","happinessGainFeed");
    // 76번(22장): '예민함' 디버프 보유 시 스트레스 감소 효과가 조용히 무효화됨.
    var stressGate = applyDebuffGate("life.stress", -stressRelief);
    state.life.stress = clamp(state.life.stress + stressGate.amount, 0, 100);
    addGrowth(2 * effMult("bondGain"));
    var bondMsg = bumpLifeBond(2);
    // 64번(15장): 밥주기도 [기본돌봄] 5개 활동 중 하나로 뼈다귀 1개를 "소모"함 — 기존에 여기서
    // 주던 +1 코인 보상은 제거(사용자 확인: "구분 없이 전부 1개 소모"라는 원안과 상충해 보상 없이
    // 순수 소모만 하도록 확정, 놀아주기도 동일).
    spendBones(BONE_COST_CARE);
    advanceGameTime();
    showMessage(stressGate.msg || bondMsg || pick(FLAVOR.feed));
    saveRenderPulse();
    maybeTriggerDayEnd();
  }
  // 63번(14장): 원안이 요청한 "기존 스트레스 감소 효과에 배부름-5·유대감+3 추가"는 실제로 이미
  // 이 함수에 그대로 구현돼 있었음(아래 hunger-5, bumpLifeBond(3)) — 값도 정확히 일치해 코드
  // 변경 없이 그대로 둠(완료 보고에 명시).
  function doPlay(){
    if(state.life.independence < 12){ showMessage(pick(FLAVOR.tired)); return; }
    if(!hasBones(BONE_COST_CARE)){ showMessage(pick(FLAVOR.poor)); return; }
    var energyMult = effMult("energyDrain");
    var stressRelief = 20 * effMult("happinessGain","happinessGainActive");
    var independenceCost = 15 * energyMult;
    // 76번(22장): '예민함' 디버프 보유 시 스트레스 감소 효과가 조용히 무효화됨.
    var stressGate = applyDebuffGate("life.stress", -stressRelief);
    state.life.stress = clamp(state.life.stress + stressGate.amount, 0, 100);
    state.life.independence = clamp(state.life.independence - independenceCost, 0, 100);
    state.life.hunger = clamp(state.life.hunger - 5, 0, 100);
    addGrowth(3 * effMult("bondGain"));
    var bondMsg = bumpLifeBond(3);
    // 64번(15장): 놀아주기의 기존 +2 코인 보상도 밥주기와 동일한 이유로 제거하고 뼈다귀 1개 소모로 전환.
    spendBones(BONE_COST_CARE);
    advanceGameTime();
    showMessage(stressGate.msg || bondMsg || pick(FLAVOR.play[tierFor(energyMult)]));
    saveRenderPulse();
    maybeTriggerDayEnd();
  }
  // ===== 산책(walk) 시스템 =====
  // 기획서 24번 항목 설계를 그대로 구현. 산책은 "그냥 클릭 한 번"이 아니라
  // 별도의 산책 세션(veil)을 열어, 5~10초 간격의 랜덤 이벤트를 겪으며 산책체력을 소모하고,
  // 유저가 원하는 시점에 복귀하면 남은 산책체력 구간에 따라 보상 비율이 달라짐.
