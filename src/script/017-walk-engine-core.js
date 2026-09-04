  function pickWalkEvent(){
    var session = state.walk.session;
    var region = (session && session.place) ? WALK_REGIONS[session.place.id] : null;
    var sourceEvents = WALK_EVENTS;
    if(region){
      var commonProb = (typeof region.commonProb === "number") ? region.commonProb : 100;
      var useRegionPool = Math.random() * 100 >= commonProb;
      if(useRegionPool && region.events && region.events.length) sourceEvents = region.events;
    }
    var pool = sourceEvents.filter(function(ev){ return !ev.cond || ev.cond(); });
    if(!pool.length) pool = sourceEvents.length ? sourceEvents : WALK_EVENTS; // 이론상 발생하지 않지만, 혹시 모를 안전장치
    var total = 0;
    var weights = pool.map(function(ev){
      var w = ev.weight * (ev.weightMult ? ev.weightMult() : 1);
      total += w;
      return w;
    });
    var roll = Math.random() * total, cum = 0;
    for(var i=0;i<pool.length;i++){
      cum += weights[i];
      if(roll <= cum) return pool[i];
    }
    return pool[pool.length - 1];
  }

  // 7단계 보상 곡선: 산책체력을 거의 다 쓰고(15~25) 복귀할 때가 가장 이득,
  // 아예 안 쓰고(100) 복귀하면 오히려 손해, 완전히 바닥(0~14)까지 밀어붙여도 다시 손해.
  // pct는 내부 연산에만 쓰고, 화면에는 각 구간의 flavor 문장만 노출(숫자 비공개 원칙).
  var WALK_REWARD_BANDS = [
    { min:100, max:100, pct:0.10, flavor:["나가자마자 바로 돌아왔더니 어리둥절한 표정이에요.","이건 산책이라기보다 문 앞 마실이었어요."] },
    { min:70, max:99, pct:0.50, flavor:["조금 걷다가 금방 돌아왔어요.","이 정도로는 성에 안 차는 눈치예요."] },
    { min:50, max:69, pct:0.70, flavor:["적당히 걷고 돌아왔어요.","살짝 아쉬운 표정이지만 그런대로 만족한 것 같아요."] },
    { min:35, max:49, pct:0.80, flavor:["기분 좋게 산책을 마쳤어요.","꽤 즐거운 산책이었나 봐요."] },
    { min:26, max:34, pct:1.00, flavor:["실컷 걷고 만족스러운 얼굴이에요!","알찬 산책이었어요."] },
    { min:15, max:25, pct:1.20, flavor:["오늘 최고의 산책이었어요!","눈이 반짝반짝, 아주 신났던 것 같아요!"] },
    { min:0, max:14, pct:null, flavor:["신나게 걷다가 결국 지쳐버렸어요...","무리했는지 걸음이 느려졌어요."] } // 50~70% 랜덤
  ];
  function rewardBandFor(stamina){
    for(var i=0;i<WALK_REWARD_BANDS.length;i++){
      var b = WALK_REWARD_BANDS[i];
      if(stamina >= b.min && stamina <= b.max) return b;
    }
    return WALK_REWARD_BANDS[2];
  }
  function rewardPctFromBand(b){
    return b.pct === null ? (0.5 + Math.random()*0.2) : b.pct;
  }

  // 41번: 산책 이벤트 발생 간격을 "5~10초 균일 랜덤"에서, 지금 이 강아지의 상태(견종 체구·성장
  // 단계·충성도/민첩성/수행력 등급)에 따라 매번 달라지는 공식 기반 계산으로 교체.
  // 사용자가 계속 실플레이하며 아래 숫자들만 조정해나갈 예정이라, 전부 이름 붙은 상수로 분리해둠.
  //   1순위(체구, 초) 기준값 → 2순위(성장 단계, 가감)를 더함 → 3·4·5순위(충성도·민첩성·수행력
  //   A~E 등급, 등급 1단계당 0.1초)를 순서대로 더함. A등급=-0.2초, B=-0.1초, C=0, D=+0.1초, E=+0.2초.
  // 등급은 화면에 실제로 보이는 등급 배지 기준(민첩성은 애착바구니 아이템 보정이 포함된 표시값,
  // 35번 coreDisplayValue와 동일)으로 계산해 "지금 보이는 등급"과 항상 일치하게 함.
  // 사용자 확인(2026-09-02): 공식값에 소폭 랜덤 지터를 계속 더하기로 함(완전 고정 X) / 극단적
  // 조합에서도 최소 하한선은 두지 않고 공식 계산값을 그대로 쓰기로 함(안전 클램프 없음).
  var WALK_EVENT_SIZE_BASE_SEC = { "소형":4.0, "중형":4.5, "대형":5.0 };
  var WALK_EVENT_STAGE_ADJ_SEC = [0.5, -0.5, 0, 1.5]; // GROWTH_STAGE_NAMES 순서: 털뭉치·개춘기·찹츄·찹찹츄
  var WALK_EVENT_GRADE_STEP_SEC = 0.1; // 등급 1단계당 조정폭 — A는 -2단계(-0.2초), E는 +2단계(+0.2초)
  var WALK_EVENT_JITTER_SEC = 0.3; // 공식값에 더할 무작위 편차 폭(±). 0으로 두면 완전 고정값이 됨.

  // 42번: 우울증·찹찹츄(노년기) 단계 산책 거부 — 매 산책 시도(startWalk 호출)마다 각각 이 확률로
  // 굴려서, 걸리면 뼈다귀만 소모하고 세션은 열지 않음.
  var WALK_REFUSAL_CHANCE = 0.10;
  var WALK_REFUSAL_MSG_DEPRESSION = "그저 가만히 있고 싶어하는 것 같다. 다음에 산책할까...";
  var WALK_REFUSAL_MSG_OLDAGE = "...이번엔 쉴까? 그래, 편하게 쉬자.";

  function walkEventGradeAdjSec(value){
    var t = tierIndex(value); // 0(E)~4(A)
    return (2 - t) * WALK_EVENT_GRADE_STEP_SEC; // A: -0.2, B: -0.1, C: 0, D: +0.1, E: +0.2
  }
  function walkEventDelaySeconds(){
    var sizeBreedId = (state.breed === "mix" && state.mixGeoBreed) ? state.mixGeoBreed : state.breed;
    var size = SIZE_LABEL[sizeBreedId] || "중형";
    var base = WALK_EVENT_SIZE_BASE_SEC[size] || WALK_EVENT_SIZE_BASE_SEC["중형"];
    var stageAdj = WALK_EVENT_STAGE_ADJ_SEC[state.growthStage];
    if(typeof stageAdj !== "number") stageAdj = 0;
    var loyaltyAdj = walkEventGradeAdjSec(state.core.loyalty);
    var agilityAdj = walkEventGradeAdjSec(coreDisplayValue("agility"));
    var executionAdj = walkEventGradeAdjSec(state.core.execution);
    var formulaSec = base + stageAdj + loyaltyAdj + agilityAdj + executionAdj;
    var jitter = (Math.random() * 2 - 1) * WALK_EVENT_JITTER_SEC;
    return formulaSec + jitter;
  }
  var walkEventTimer = null;

  // 36번(산책 장소 선택, 요청 2번): [산책!]을 누르면 곧바로 산책이 시작되지 않고, 먼저 장소를 고르는
  // 팝업이 뜸. 처음엔 장소별 실제 차등 효과 없이 session.place에 기록만 해뒀는데, 58번(엑셀 왕복 v4,
  // 산책이벤트_지역별_v4.xlsx 반영)에서 그 오픈 이슈를 마무리 — 기존의 막연한 5개 장소(숲/공원/집 근처/
  // 대형마트/시가지)를 엑셀이 정의한 세계관 지역 이름 7곳으로 전부 교체하고, 각 id를 WALK_REGIONS의
  // 키와 정확히 맞춰 실제 이벤트 풀 분기가 연결되도록 함(대형마트는 엑셀에 대응 지역이 없어 자연스럽게
  // 빠짐). 아이콘: 기존 집 근처/동네 공원/도로리 숲/번화가는 예전 장소 아이콘을 그대로 재사용하고,
  // 신규 3곳(소로록 산·뽀로롱 호수·파르란 해변)만 새로 골랐다(판단 근거는 계획 문서에 기록).
  var WALK_PLACES = [
    { id:"home", name:"집 근처", icon:"🏠" },
    { id:"park", name:"동네 공원", icon:"🌳" },
    { id:"forest", name:"도로리 숲", icon:"🌲" },
    { id:"mtn", name:"소로록 산", icon:"🏔️" },
    { id:"lake", name:"뽀로롱 호수", icon:"🏞️" },
    { id:"city", name:"번화가", icon:"🏙️" },
    { id:"beach", name:"파르란 해변", icon:"🏖️" }
  ];

  // 60번(고유능력_입력템플릿_v4.xlsx): 지역 전담 능력 14종의 배율 조회 — finishWalk() 정산 시점에
  // 이번 산책 장소(session.place)를 넣어 호출. 긍정 보유 시 ×2, 부정 보유 시 ×0.5, 둘 다 없으면 ×1.
  // 같은 지역 긍/부정은 설계상 동시 보유 불가(REGION_ABILITY_MAP 취득 로직에서 원천 차단)라
  // 두 조건이 동시에 참일 일은 없음.
  function regionAbilityMultForPlace(place){
    var map = place && REGION_ABILITY_MAP[place.id];
    if(!map) return 1;
    if(isAbilityOwned(map.pos)) return 2;
    if(isAbilityOwned(map.neg)) return 0.5;
    return 1;
  }

  // 60번: 지역 전담 능력의 후천(산책 누적) 취득 경로. 그 지역에서 누적 산책이 정확히
  // REGION_ABILITY_WALK_THRESHOLD(10)회째가 되는 순간 안내 멘트를 한 번 띄우고 그 자리에서
  // REGION_ABILITY_WALK_CHANCE(10%) 확률로 해당 지역 "긍정" 능력 획득을 시도한다. 그때 실패해도
  // 사라지지 않고, 이후 그 지역에서 산책을 마칠 때마다(멘트 없이 조용히) 계속 같은 확률로 재시도한다.
  // 판단: 사용자 채팅 지시 3번이 이 경로를 "긍정 효과 10% 확률로 획득"이라고만 명시해서, 이 경로로는
  // 부정 능력을 절대 부여하지 않음(부정 능력은 온보딩 취득 경로에서만 나옴). 같은 지역 긍/부정은
  // 상호 배타라 이미 어느 한쪽을 갖고 있으면 더 굴리지 않고, 이번 육성 전체에서 이 경로로 얻을 수
  // 있는 능력 개수는 REGION_ABILITY_ACQUIRE_CAP(3)개로 캡을 둔다(캡 도달 후에도 카운터 자체는 계속
  // 올라가되 굴림만 멈춤). 취득 조건은 "앞으로 계속 테스트 후 수정 예정"이라고 사용자가 직접 밝혀둬서,
  // 숫자들을 전부 이름 붙은 상수로 분리해 나중에 쉽게 바꿀 수 있게 함.
  var REGION_ABILITY_WALK_THRESHOLD = 10;
  var REGION_ABILITY_WALK_CHANCE = 0.10;
  var REGION_ABILITY_ACQUIRE_CAP = 3;
  function progressRegionAbilityAcquisition(place){
    var map = place && REGION_ABILITY_MAP[place.id];
    if(!map) return;
    var count = (state.regionWalkCounts[place.id] || 0) + 1;
    state.regionWalkCounts[place.id] = count;
    if(count < REGION_ABILITY_WALK_THRESHOLD) return;
    if(isAbilityOwned(map.pos) || isAbilityOwned(map.neg)) return;
    if(count === REGION_ABILITY_WALK_THRESHOLD){
      showDescPopup("좀 더 이 지역에서의 산책이 자신 있어졌어!",
        state.name + josaIGa(state.name) + " " + place.name + "에서 벌써 열 번째 산책이에요. 이 근처는 이제 훤히 꿰고 있는 것 같아요.");
    }
    if((state.regionAbilityWalkGrantCount || 0) >= REGION_ABILITY_ACQUIRE_CAP) return;
    if(Math.random() < REGION_ABILITY_WALK_CHANCE){
      catalogGrant(map.pos);
      state.regionAbilityWalkGrantCount = (state.regionAbilityWalkGrantCount || 0) + 1;
    }
  }

  // startWalk()가 원래 하던 "지금 산책을 시작할 수 있는가" 판정을 장소 선택 팝업을 열기 전에도
  // 똑같이 써야 해서 별도 함수로 분리(중복 로직 방지).
  // 64번(15장): 산책이 지금 가능한지 — 산책횟수(charges) 잔량, 에너지(independence) 임계치(10 이하
  // 차단), 이전 산책 이후 게임 내 시간으로 3시간(WALK_COOLDOWN_HOURS)이 지났는지를 확인. 뼈다귀 소모
  // 여부는 장소별로 값이 달라(집 근처 1개 vs 나머지 2개) 장소가 정해진 뒤 startWalk()에서 따로 확인함.
  function walkCooldownRemainingHours(){
    if(state.time.lastWalkAbsHour === null) return 0;
    var elapsed = state.time.absHour - state.time.lastWalkAbsHour;
    return Math.max(0, WALK_COOLDOWN_HOURS - elapsed);
  }
  function canStartWalk(){
    syncWalkCharges();
    if(state.walk.charges <= 0){ showMessage("오늘 남은 산책 횟수가 없어요."); return false; }
    var tier = energyWalkTierFor(state.life.independence);
    if(tier.blocked){ showMessage("너무 지쳐서 산책은 무리일 것 같아... 먼저 쉬게 해주세요."); return false; }
    if(walkCooldownRemainingHours() > 0){
      showMessage("산책을 다녀온 지 얼마 안 됐어... 조금 더 있다가 나가요.");
      return false;
    }
    return true;
  }
  function renderWalkPlaceGrid(){
    var host = el.walkPlaceGrid;
    if(!host) return;
    host.innerHTML = "";
    WALK_PLACES.forEach(function(place){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "walk-place-item";
      var icon = document.createElement("span");
      icon.className = "walk-place-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = place.icon;
      var label = document.createElement("span");
      label.textContent = place.name;
      btn.appendChild(icon);
      btn.appendChild(label);
      btn.addEventListener("click", function(){ chooseWalkPlace(place); });
      host.appendChild(btn);
    });
  }
  function openWalkPlacePicker(){
    if(!canStartWalk()) return;
    renderWalkPlaceGrid();
    openVeil(el.walkPlaceVeil);
  }
  function chooseWalkPlace(place){
    closeVeil(el.walkPlaceVeil);
    startWalk(place);
  }

  // 37번: 성장 단계 시스템(기획문서 9장) — state.fosterDay가 하루 진행될 때마다 호출. 시작 성장단계별
  // 전환 일정(GROWTH_TRANSITION_SCHEDULE)에서 아직 지나지 않은 다음 전환 조건에 도달했다면 (a) 팝업
  // 멘트를 띄우고 (b) 전체 기본능력(core.* 8종)에 1회성 고정 보너스(GROWTH_STAGE_BONUS)를 지급함 —
  // 이 보너스는 개체별 성장최대기대치(state.growthMaxStats) 상한 클램프를 적용받음(신규 추가 규칙).
  // fosterDay는 startWalk()에서 항상 1씩만 증가하므로 한 번에 두 단계를 건너뛰는 경우는 없음.
  function checkGrowthStageTransition(){
    if(typeof state.growthStartStage !== "number") return;
    var schedule = GROWTH_TRANSITION_SCHEDULE[state.growthStartStage] || [];
    var hit = null;
    schedule.forEach(function(step){
      if(state.fosterDay >= step.day && state.growthStage < step.to){ hit = step; }
    });
    if(!hit) return;
    state.growthStage = hit.to;
    var max = state.growthMaxStats || {};
    CORE_STATS.forEach(function(s){
      var cap = typeof max[s.key] === "number" ? max[s.key] : 100;
      state.core[s.key] = clamp(state.core[s.key] + GROWTH_STAGE_BONUS, 0, cap);
    });
    var flavor = GROWTH_TRANSITION_FLAVOR[hit.to];
    if(flavor) showDescPopup(flavor.title, flavor.desc);
  }

  // 65번(16장): '미라클멍잉'/'올빼미독' — 산책을 시작하는 그 순간의 게임 내 시계(state.time.hour)
  // 기준으로, 그 산책 전체 이벤트에 적용할 +1(강화)/-1(약화)/0(무영향) 배지를 한 번만 계산해 세션에
  // 고정해둠(산책 중 시간이 더 흘러도 이 값은 바뀌지 않음 — 엑셀 원안이 "산책 시작 시각 기준으로
  // 그 산책 전체에 일괄 적용"이라 명시). 미라클멍잉·올빼미독은 온보딩 시 상호 배타 굴림(startBtn
  // 핸들러 참고)이라 둘 다 owned인 경우는 없음.
  function walkTimeModFor(hour){
    var beforeTen = hour < 10, fromEight = hour >= 20;
    if(isAbilityOwned("miracleMorning")){
      if(beforeTen) return 1;
      if(fromEight) return -1;
      return 0;
    }
    if(isAbilityOwned("nightOwlDog")){
      if(beforeTen) return -1;
      if(fromEight) return 1;
      return 0;
    }
    return 0;
  }
  function startWalk(place){
    if(!canStartWalk()) return;
    // 64번(15장): 산책의 뼈다귀 비용 — 집 근처(home)는 1개, 나머지 6개 지역은 2개. 산책횟수(charges)
    // 소모와는 별개 자원이라 둘 다 확인·차감함.
    var boneCost = (place && place.id === "home") ? BONE_COST_WALK_HOME : BONE_COST_WALK_OTHER;
    if(!hasBones(boneCost)){ showMessage(pick(FLAVOR.poor)); return; }
    state.walk.charges -= 1;
    spendBones(boneCost);
    // 64번: 다음 산책 쿨다운(WALK_COOLDOWN_HOURS)의 기준점을 "이번 산책을 시작한 시점"으로 기록.
    state.time.lastWalkAbsHour = state.time.absHour;
    // 65번(16장): 미라클멍잉/올빼미독 판정은 advanceGameTime()이 시간을 진행시키기 "전"의 시각 —
    // 즉 유저가 산책 버튼을 누른 그 순간의 게임 내 시계 — 을 기준으로 고정함.
    var walkTimeMod = walkTimeModFor(state.time.hour);
    advanceGameTime();
    var energyTier = energyWalkTierFor(state.life.independence);
    if(energyTier.warn){ showMessage(energyTier.warn); }
    // 64번: 이번 산책의 효과 배율은 "산책을 시작한 시점"의 에너지 구간을 기준으로 고정해 세션에
    // 저장해두고, finishWalk() 정산 시 그대로 씀(산책 도중 에너지가 바뀌어도 시작 시점 판정 유지).
    var walkEnergyMult = { gain: energyTier.gain, loss: energyTier.loss };
    // 33·39·43번(구 로직, 64번에서 제거): 예전엔 산책횟수를 다 쓰는 순간 즉시 하루를 진행시키고
    // 산책횟수·자립감을 리필하는 테스트 편의 로직이 여기 있었음. 이제 하루는 오직 게임 내 시간이
    // 22시(DAY_END_HOUR)에 도달해야만(위 advanceGameTime() 호출 누적) 끝나므로, 이 로직은 새 하루
    // 종료 시퀀스(playDayEndSequence())와 정면으로 충돌해 완전히 제거함(사용자 확인 완료) —
    // 산책횟수는 이제 순수하게 "하루 최대 4회, 다음 하루 종료 시퀀스에서만 리필"되고, 자립감(에너지)도
    // 산책과 무관하게 쉬게하기 등으로만 회복됨. 성장 단계 전환 확인(checkGrowthStageTransition())도
    // fosterDay가 실제로 증가하는 새 하루 종료 시퀀스 쪽으로 옮김.
    // 42번: 우울증·찹찹츄(노년기) 단계는 각각 매 산책 시도마다 10% 확률로 산책 자체를 거부함 — 뼈다귀·
    // 산책횟수는 이미 위에서 소모됐으니 "횟수만 날리는" 시도가 되고, 세션은 열리지 않은 채 돌아감.
    // 우울증 쪽을 먼저 굴려서 걸리면 그 멘트를 보여주고 끝내고, 아니면 찹찹츄 거부를 이어서 굴림 —
    // 둘 다 해당하는 개라면 우울증 멘트가 우선(임의 판단, 계획 문서에 근거 기록).
    // 64번: 거부로 세션이 열리지 않고 곧장 돌아가는 경우도 이번 행동(시도)의 결과가 이미 전부
    // 처리된 것이므로, 여기서 바로 하루 종료 판정을 확인함(정상 진행되는 산책은 closeWalkVeil()에서 확인).
    if(isAbilityOwned("depression") && Math.random() < WALK_REFUSAL_CHANCE){
      saveState();
      render();
      showMessage(WALK_REFUSAL_MSG_DEPRESSION);
      maybeTriggerDayEnd();
      return;
    }
    if(state.growthStage === 3 && Math.random() < WALK_REFUSAL_CHANCE){
      saveState();
      render();
      showMessage(WALK_REFUSAL_MSG_OLDAGE);
      maybeTriggerDayEnd();
      return;
    }
    state.walk.summary = null;
    // 32번: deltaLedger — 산책 중 이벤트로 발생한 수치 변화를 즉시 반영하지 않고 여기 쌓아뒀다가,
    // 산책을 마칠 때(finishWalk) 남은 산책체력 보상배율을 적용해 한꺼번에 정산함
    // 34번: eventCount·lastEvent·itemChips — 산책 UX 개편(기획문서 7장)에서 추가된 "지금 보여줄 이야기
    // 카드" 상태와 "이번 산책에서 주운 것들" 누적 목록.
    // 36번: place — 이번 산책에서 고른 장소(추후 이벤트 빈도/결과 차등에 쓸 자리, 지금은 기록만 함).
    // 42번: cards — 이번 산책에서 지금까지 나온 이야기 카드(문구+칩)를 전부 누적해두는 배열.
    // lastEvent는 하위 호환용으로 계속 마지막 카드를 가리키게 남겨둠(참조하는 곳은 없지만 안전하게).
    state.walk.session = { stamina:100, log:[], pendingEvent:null, deltaLedger:[], eventCount:0, lastEvent:null, cards:[], itemChips:[], place: place || null, walkEnergyMult: walkEnergyMult, walkTimeMod: walkTimeMod };
    saveState();
    render();
    syncWalkDogVisual();
    el.walkVeil.classList.add("show");
    renderWalkVeil();
    startWalkAnim();
    scheduleNextWalkEvent();
  }

  // 산책 팝업 속 반려견도 현재 견종·성장단계와 같은 모습으로 보이도록 클래스를 그대로 복사.
  // 28번: 픽셀모드 여부도 메인화면과 똑같이 맞춰서, CSS 강아지/픽셀 캔버스 중 알맞은 쪽만 보이게 함.
