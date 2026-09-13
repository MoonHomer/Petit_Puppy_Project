  function render(){
    var stg = stageIndex(state.growthPoints);
    var breed = BREEDS[state.breed] || BREEDS.golden;
    var personality = findById(PERSONALITIES, state.personality);
    var passive = findById(PASSIVES, state.passive);

    el.dogNameLabel.textContent = state.name;
    el.stageChip.textContent = STAGE_NAMES[stg];
    el.coinCount.textContent = Math.round(state.coins);
    // 33번: 실제 날짜(dayCount) 대신, 산책뼈다귀 소진으로 진행되는 임시보호 N일차를 표시.
    // 37번: 성장 단계(털뭉치/개춘기/찹츄/찹찹츄)도 함께 노출.
    el.dayBadge.textContent = "임시보호 " + FOSTER_DAY_MAX + "일 중 " + state.fosterDay + "일차 · " + (GROWTH_STAGE_NAMES[state.growthStage] || GROWTH_STAGE_NAMES[2]);
    // 64번(기획문서 15장): 게임 내 현재 시각(06~22시) 표시.
    el.gameClockBadge.textContent = "🕕 " + gameClockLabel();

    el.breedTag.textContent = breed.name;
    el.infoBreedTag.textContent = breed.name;
    el.personalityTag.textContent = personality.name;
    el.passiveTag.textContent = passive.name;
    el.passiveTag.className = "trait-pill " + (passive.positive ? "positive" : "negative");

    // 29번: 일반(CSS) 그래픽도 믹스견은 전용 실루엣이 없어 체구 출처 견종의 모양을 그대로 빌려 씀(픽셀 모드와 동일한 원칙)
    var cssBreedId = (state.breed === "mix" && state.mixGeoBreed) ? state.mixGeoBreed : state.breed;
    el.dogWrap.className = "dog-wrap stage-" + stg + " breed-" + cssBreedId;
    var mood = moodOf();
    el.dogEl.className = "dog mood-" + mood;

    // 1) 생활만족도(5) — 숫자 대신 이모지로만 노출
    // 62번: 접근성 라벨(aria-label)도 화면 표시 라벨과 통일 — 포만감(hunger)은 기존에 "배고픔"이라는
    // 다른 단어를 쓰고 있어 패널 라벨("포만감")과도 원래 어긋나 있었는데, 이번에 "배부름"으로 함께 정리.
    var L = state.life;
    setStatFace(el.valIndependence, L.independence, "에너지");
    setStatFace(el.valHunger, L.hunger, "배부름");
    setStatFace(el.valClean, L.clean, "청결도");
    setStatFace(el.valLifeBond, L.bond, "유대감");
    setStatFaceInverted(el.valStress, L.stress, "스트레스");

    // 2) 기본 스테이터스(8) — 28-3번: 이모지 대신 A~E 등급 배지로 노출
    var C = state.core;
    setStatGrade(el.valPower, C.power, "근력");
    // 35번: 민첩성·건강함은 애착바구니 수집 아이템(민들레 홀씨·조약돌) 보유 개수에 따른 표시 보정을 더해 보여줌
    setStatGrade(el.valAgility, coreDisplayValue("agility"), "민첩성");
    setStatGrade(el.valComprehension, C.comprehension, "이해력");
    setStatGrade(el.valExecution, C.execution, "수행력");
    setStatGrade(el.valLoyalty, C.loyalty, "충성도");
    setStatGrade(el.valAffinity, C.affinity, "친화력");
    setStatGrade(el.valHealth, coreDisplayValue("health"), "건강함");
    setStatGrade(el.valAggression, C.aggression, "공격성");

    var independenceTier = tierIndex(L.independence);
    el.trainEnergyHint.textContent = "지금 컨디션 " + STATE_EMOJI[independenceTier];

    var nextIdx = stg < 2 ? stg + 1 : 2;
    var floor = STAGE_THRESHOLDS[stg];
    var ceil = STAGE_THRESHOLDS[nextIdx];
    if(stg === 2){
      el.bondLabel.textContent = "지금 이대로, 가장 가까운 사이예요";
      el.bondFill.style.width = "100%";
    } else {
      var pct = clamp(((state.growthPoints - floor) / (ceil - floor)) * 100, 0, 100);
      el.bondLabel.textContent = BOND_PHRASES[tierIndex(pct)];
      el.bondFill.style.width = pct + "%";
    }

    // 64번(기획문서 15장): [기본돌봄] 5개 버튼은 이제 뼈다귀 1개가 없으면 아예 눌러도 소용이 없으니
    // (doFeed 등 내부에서 FLAVOR.poor 멘트만 뜨고 아무 효과 없음) 기존 각자의 조건에 뼈다귀 보유
    // 여부를 추가로 걸어 버튼 자체를 눌러보기 전에 알 수 있게 함.
    el.btnFeed.disabled = L.hunger >= 98 || !hasBones(BONE_COST_CARE);
    el.btnPlay.disabled = L.independence < 12 || !hasBones(BONE_COST_CARE);
    el.btnBath.disabled = !hasBones(BONE_COST_CARE);
    el.btnTreat.disabled = !hasBones(BONE_COST_CARE);
    el.btnRest.disabled = !hasBones(BONE_COST_CARE);
    // 68번(기획문서 19장): "OO아 잠시 나갔다 올게"는 위 5개와 달리 뼈다귀 1개 소모 공통 규칙을 따르지
    // 않고(이벤트 자체 증감이 그 자리를 대신함), 뼈다귀가 0개여도 획득형 이벤트(B·E)가 걸릴 수 있어
    // 뼈다귀 보유 여부로 막을 이유가 없음 — 항상 눌러볼 수 있게 둠.
    el.btnOuting.disabled = false;
    syncWalkCharges();
    // 64번(기획문서 15장, 43번 주석 대체): 예전엔 FOSTER_TEST_MODE 동안 자립감(에너지) 조건을 아예
    // 보지 않고 산책횟수 하나로만 버튼을 제어했지만, 이제 에너지 10 이하 구간(energyWalkTierFor의
    // blocked)이 정식으로 산책을 막는 조건이 됐고, 여기에 3시간 쿨다운(walkCooldownRemainingHours)과
    // "집 근처" 최소 비용(BONE_COST_WALK_HOME)만큼의 뼈다귀 보유 여부까지 함께 확인함 — 장소별로
    // 정확한 비용은 장소 선택 후 startWalk()에서 다시 확인하므로, 여기서는 "어느 장소로도 못 갈 만큼"
    // 부족한 경우만 걸러냄.
    var walkEnergyTier = energyWalkTierFor(L.independence);
    el.navWalk.disabled = state.walk.charges <= 0 || !!state.walk.session ||
      walkEnergyTier.blocked || walkCooldownRemainingHours() > 0 || !hasBones(BONE_COST_WALK_HOME);
    el.walkCountLabel.textContent = state.walk.charges + "/" + state.walk.maxCharges;
    el.buySnack.disabled = state.coins < 10;
    el.buyToy.disabled = state.coins < 15;
    renderTalkWidget();

    applyBreedVisuals();
    // 48번: 엔딩이 확정된 뒤엔 이 마당 캔버스를 엔딩씬 전용 함수가 관리하므로, render()가 평소 장면으로
    // 덮어쓰지 않도록 건너뜀(추가 안전장치 — 잠금 상태에선 애초에 render()를 부를 조작 경로도 대부분 막혀있음).
    if(!state.ending && state.pixelMode){ drawPixelScene(); drawWalkPixelDog(); }
  }

  // 성장 단계(아기→청소년→성견)를 밀어올리는 누적 경험치. 0~100 생활만족도(life.bond)와는
  // 별개의 개념 — growthPoints는 한 번 오르면 내려가지 않는 "지금까지 함께한 시간의 총량".
  function addGrowth(n){ state.growthPoints += n; }
  // 하루하루의 관계 만족도(life.bond, 0~100)는 케어할 때마다 조금씩 오르고 방치되면 서서히 식음.
  // 76번(22장): '새침함' 디버프 보유 시 유대감이 "오르는" 변화만 조용히 무효화됨 — applyDebuffGate로
  // 게이트를 거친 뒤 반영. 반환값(무효화 안내 멘트, 없으면 null)은 새로 추가된 것이라 호출부가 원하면
  // 자기 showMessage에 조합해 쓸 수 있고, 기존 호출부들은 반환값을 그냥 무시해도 동작에 영향 없음.
  function bumpLifeBond(n){
    var gate = applyDebuffGate("life.bond", n);
    state.life.bond = clamp(state.life.bond + gate.amount, 0, 100);
    return gate.msg;
  }

  // ===== 64번(기획문서 15장): 게임 진행 핵심 소모품 체계 — 뼈다귀·게임 내 시간 =====
  // 뼈다귀(state.coins, 🦴)는 기존 상점 화폐 기능을 그대로 유지하면서, 이제 [기본돌봄]·[산책]처럼
  // "게임 내 시간을 흐르게 하는" 행동의 소모 자원도 겸함. 소모 기준은 활동 구분 없이 기본돌봄 전부 1개,
  // 산책은 집 근처 1개(+산책횟수 1)·나머지 6개 지역 2개(+산책횟수 1) — 원안 그대로.
