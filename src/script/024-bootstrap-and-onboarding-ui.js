  function openOnboarding(){
    el.onboardVeil.classList.add("show");
    el.nameInput.value = "";
    chosenBreed = null;
    chosenEyeColor = null;
    chosenCoat = null;
    chosenMixParents = null;
    chosenMixGeoBreed = null;
    chosenMixStatMethod = null;
    chosenPoodleSize = null;
    buildCrateGrid();
    el.stepShelter.hidden = false;
    el.stepSizeHint.hidden = true;
    el.stepEyeColor.hidden = true;
    el.stepCoatColor.hidden = true;
    el.stepReveal.hidden = true;
  }
  function closeOnboarding(){
    el.onboardVeil.classList.remove("show");
  }

  el.startBtn.addEventListener("click", function(){
    var name = el.nameInput.value.trim();
    state.name = name.length ? name.slice(0,10) : "댕댕이";
    state.breed = chosenBreed || BREED_ORDER[0];
    state.personality = rolledPersonality ? rolledPersonality.id : rollTrait(PERSONALITIES).id;
    state.passive = rolledPassive ? rolledPassive.id : rollTrait(PASSIVES).id;
    state.eyeColor = chosenEyeColor ? chosenEyeColor.id : rollTrait(EYE_COLORS[state.breed] || EYE_COLORS.golden).id;
    state.coatId = chosenCoat ? chosenCoat.id : rollTrait(COAT_PALETTES[state.breed] || COAT_PALETTES.golden).id;
    state.onboarded = true;
    state.lastTs = Date.now();
    state.createdTs = Date.now();
    // 29번: 시고르자브(믹스견) — 매칭된 두 견종 정보를 저장해 픽셀 실루엣·모색/눈동자 풀에 계속 활용
    state.mixParents = chosenMixParents ? chosenMixParents.slice() : null;
    state.mixGeoBreed = chosenMixGeoBreed || null;
    // 78번(24장): 푸들일 때만 채워짐 — 그래픽 크기 클래스(스탯·고유능력은 3사이즈 공통).
    state.breedSizeClass = (state.breed === "poodle") ? (chosenPoodleSize || "standard") : null;
    // 31번: 견종별 시작 스탯표(2026-09-01 기획 문서) 반영 — 순종은 마스터 표 값을, 시고르자브는
    // 1단계 부모 혼합 로직(부견쪽45%/모견쪽45%/완전랜덤10%) 결과를 사용.
    // 37번(기획문서 9장, 성장 단계 시스템): 이 결과값은 더 이상 "시작값"이 아니라 이 개체가 도달할 수
    // 있는 "성장최대기대치"(절대 상한)로 재정의됨 — state.growthMaxStats에 저장해 이후 상한 클램프에도
    // 계속 재사용함. 기존 항목4(개체별 ±20% 변동)는 이 성장 단계 시스템으로 완전히 대체됨: 이동장에서
    // 만나는 순간 시작 성장단계(4종 균등 25%)를 굴리고, 실제 시작 스탯은 스탯 8종 각각 독립적으로
    // "성장최대기대치 × 그 단계의 비율 구간(GROWTH_STAGE_RATIO)"을 굴려 절사해서 정함.
    var growthMax = computeEffectiveBaseStats(state.breed, chosenMixParents, chosenMixStatMethod);
    state.growthMaxStats = growthMax;
    state.growthStartStage = Math.floor(Math.random() * GROWTH_STAGE_NAMES.length);
    state.growthStage = state.growthStartStage;
    CORE_STATS.forEach(function(s){
      state.core[s.key] = Math.floor(growthMax[s.key] * growthRatioRoll(state.growthStartStage));
    });
    // 26번: 지금 뽑힌 성격·패시브를 "공통 선천적 능력"으로 고유능력 목록에도 등록
    var pOb = findById(PERSONALITIES, state.personality);
    var sOb = findById(PASSIVES, state.passive);
    state.abilities.innateCommon.push({ id:"personality:"+pOb.id, name:pOb.name, positive:true, flavor:pOb.flavor });
    state.abilities.innateCommon.push({ id:"passive:"+sOb.id, name:sOb.name, positive:!!sOb.positive, flavor:sOb.flavor });
    // 28번: 엑셀로 받은 고유능력 중, 온보딩 시점 확률로 부여되는 것들을 여기서 실제로 굴림
    ABILITY_CATALOG.forEach(function(def){
      if(!def.onboardRoll) return;
      var chance = def.onboardRoll();
      if(chance > 0 && Math.random() <= chance){ catalogGrant(def.id); }
    });
    // 60번: 지역 전담 능력 14종의 온보딩 취득 — 위 forEach의 능력별 독립 굴림(onboardRoll) 방식으로는
    // "10% 확률로 딱 하나만, 14종 중 균등(1/14, 긍/부정 구분 없음)"이라는 사용자 지정 확률 구조를
    // 정확히 재현할 수 없어(14개를 각각 독립 굴리면 확률이 어긋나고, 같은 지역 긍/부정이 동시에 뽑힐
    // 위험도 생김) 별도의 단일 결합 굴림으로 처리. 사용자 지시 3번①을 그대로 반영.
    // 66번(2단계): 결합 굴림 자체는 rollCombinedExclusiveAbility()로 통합(006-abilities-and-domrefs.js).
    var regionAbilityIds = [];
    Object.keys(REGION_ABILITY_MAP).forEach(function(rid){
      regionAbilityIds.push(REGION_ABILITY_MAP[rid].pos, REGION_ABILITY_MAP[rid].neg);
    });
    rollCombinedExclusiveAbility(0.10, regionAbilityIds);
    // 65번(16장): '미라클멍잉'/'올빼미독' — 엑셀 원안은 독립 5%씩이지만 동시 보유가 명시적으로
    // 금지돼 있어, 지역 전담 능력과 같은 방식으로 10% 결합 굴림 하나를 반반(50/50)으로 나눠 배정
    // — 각자 체감 확률은 여전히 5%이면서 상호 배타가 항상 보장됨.
    rollCombinedExclusiveAbility(0.10, ["miracleMorning", "nightOwlDog"]);
    saveState();
    closeOnboarding();
    render();
  });

  // init
  if(!state.onboarded){
    render();
    openOnboarding();
  } else {
    var awayMin = applyDecay();
    render();
    saveState();
    // 48번: 이미 엔딩이 재생·확정된 세이브라면(재접속) 컷씬을 다시 돌리지 않고 마지막 장면으로 곧장
    // 복귀 — "조작 정지"가 확정 상태이므로 "심심했어요" 같은 평소 토스트도 굳이 띄우지 않음.
    if(state.ending && state.ending.finished){
      // 48번(재작업): showEndingRestingFrame() 안에서 이미 applyPixelMode()를 호출해 픽셀모드 강제·
      // 화면 잠금까지 처리하므로 여기서 따로 다시 부를 필요 없음.
      showEndingRestingFrame();
      tryFetchWeather();
      return;
    }
    if(awayMin > 20){
      var h = Math.floor(awayMin/60), m = Math.round(awayMin%60);
      var away = h > 0 ? (h+"시간 "+m+"분") : (m+"분");
      showMessage(away + " 동안 심심했어요");
    }
    // 산책 중에 새로고침 등으로 페이지를 벗어났다가 돌아온 경우, 세션이 남아있으면 이어서 보여줌
    if(state.walk.session){
      syncWalkDogVisual();
      el.walkVeil.classList.add("show");
      renderWalkVeil();
      startWalkAnim();
      scheduleNextWalkEvent();
    }
  }
  tryFetchWeather();
  applyPixelMode();

  // light live tick while page stays open
  window.setInterval(function(){
    if(!state.onboarded) return;
    // 48번: 엔딩이 확정된 뒤엔(재생 중이든 다 끝났든) 이 틱도 완전히 멈춤 — 이전엔 전체화면 veil이
    // 남아있는 동안엔 사실상 안 보였을 뿐 이 틱 자체는 계속 돌고 있었는데(새로고침 없이 이어지는
    // 세션에서 render()가 마당 캔버스를 도로 평소 장면으로 덮어쓸 뻔한 지점), 이번에 명시적으로 막음.
    if(state.ending) return;
    applyDecay();
    // 76번(22장): 5종(멍함·미열·무기력증·새침함·예민함) 디버프의 상태값 기반 발현 판정 — 성공하면
    // 힌트 문구를 토스트로 띄움(우선순위는 낮게, 방치 안내(away)보다는 뒤로 두지 않고 그냥 이 자리에서
    // 바로 노출 — 다른 tick 안내와 겹칠 일이 거의 없는 20초 주기라 문제 없음).
    var onsetHint = checkDebuffOnsets();
    render();
    saveState();
    tryFetchWeather();
    if(onsetHint) showMessage(onsetHint);
    // 77번([기다려 대회] 신규): 초급대회 최초 해금(임시보호 2일차 오전 9시 이후) 안내는 토스트가
    // 아니라 "확인 눌러야 사라지는" 팝업이라, 위 onsetHint 토스트와는 별개로 처리.
    checkCompetitionUnlock();
  }, 20000);

  // 46번(45번 트리거 설계 수정): 소통버튼 유휴 트리거 — "화면 조작이 TALK_BUTTON_IDLE_MS(30초)
  // 동안 전혀 없을 때" 반려견이 스스로 말을 걸며(호응/무시 확인 팝업을 먼저 띄움), 하루 10회
  // 카운트와는 무관하게 동작. 45번의 "앱이 켜진 채 30초마다 무조건" 고정 인터벌 방식은 폐기.
  // click/touchstart/keydown을 유휴 판정용 "조작"으로 간주해 lastInteractionTs를 갱신하고,
  // 1초마다 폴링해서 유휴 시간이 기준을 넘겼는지 확인함.
  var lastInteractionTs = Date.now();
  ["click","touchstart","keydown"].forEach(function(evt){
    window.addEventListener(evt, function(){ lastInteractionTs = Date.now(); }, { passive:true });
  });
  window.setInterval(function(){
    if(!state.onboarded) return;
    // 48번: 엔딩이 확정된 뒤엔 소통버튼 유휴 트리거도 완전히 멈춤(조작 정지 확정 상태이므로) — 이전엔
    // 전체화면 veil이 isAnyVeilOpen()에 걸려 사실상 막아줬지만, 이제 그 veil이 없으므로 명시적으로 확인.
    if(state.ending) return;
    if(isAnyVeilOpen()) return; // 유휴 확인 팝업 자체가 떠 있는 경우도 여기서 걸러짐(중복 발동 방지)
    if(Date.now() - lastInteractionTs < TALK_BUTTON_IDLE_MS) return;
    openTalkIdlePrompt();
    lastInteractionTs = Date.now(); // 확인 팝업이 떠 있는 동안 다시 즉시 재발동하지 않도록 리셋
  }, 1000);

