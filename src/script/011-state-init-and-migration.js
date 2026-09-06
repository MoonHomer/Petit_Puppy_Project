  function freshState(){
    var now = Date.now();
    return {
      name:"댕댕이",
      breed:"golden",
      personality:"brave",
      passive:"tough",
      growthPoints:0,
      coins:20,
      // 1) 생활만족도 — 배고픔/청결/유대감/자립감/스트레스. 0~100, 화면엔 이모지로만 노출.
      //    스트레스는 낮을수록 좋음(다른 4항목과 반대 방향)이라 평균 계산 시 (100-스트레스)로 반전해서 합산.
      life:{ hunger:80, clean:85, bond:70, independence:90, stress:20 },
      // 2) 기본 스테이터스 — 충성도/이해력/수행력/친화력/민첩성/근력/건강함/공격성. 0~100, 산책·훈련으로 성장.
      core:{ loyalty:15, comprehension:15, execution:15, affinity:15, agility:15, power:15, health:15, aggression:15 },
      // 3) 고유능력 — 선천적/후천적 x 고유/공통 4분류. 지금은 소지 여부(등급 없음)만 기록.
      //    온보딩에서 뽑힌 성격·패시브가 "공통 선천적 능력"으로 자동 등록됨.
      abilities:{ innateUnique:[], innateCommon:[], acquiredUnique:[], acquiredCommon:[] },
      pixelMode:true,
      eyeColor:"brown",
      coatId:"golden",
      // 29번: 믹스견(시고르자브)일 때만 채워짐 — 매칭된 두 견종, 그리고 픽셀 실루엣에 쓸 체구 출처 견종
      mixParents:null,
      mixGeoBreed:null,
      createdTs: now,
      lastTs: now,
      onboarded:false,
      walk:{ charges:4, maxCharges:4, dateKey: todayKey(now), claimedSlots:[], session:null, summary:null },
      walkItems:{},
      // 35번: 조합형 재료(반짝이는 조각·낡은 리본) 전용 인벤토리 — 애착바구니(walkItems)와 분리해 관리.
      materials:{},
      // 35번: 반짝이는 발자국(희귀 드랍형)의 "누적 산책 횟수 마일스톤" 조건에 사용할 누적 완료 산책 횟수.
      totalWalks:0,
      // 60번: 지역 전담 능력(REGION_ABILITY_MAP)의 후천 취득 경로용 카운터.
      // regionWalkCounts[place.id] = 그 지역에서 완료한 누적 산책 횟수(totalWalks와 동일한 증가 시점, finishWalk()).
      // regionAbilityWalkGrantCount = 이 회차 육성에서 산책 누적으로 획득한 지역 긍정 능력 개수(최대 3, REGION_ABILITY_ACQUIRE_CAP).
      regionWalkCounts:{},
      regionAbilityWalkGrantCount:0,
      // 28번: 산책 중 새로운 만남 이벤트에서 만난 등장인물별 친밀도, 그리고 능력치 카운터(예: 헤헤→우울증 조건)
      walkFriends:{},
      abilityCounters:{},
      dexRecords:[],
      // 33번: 임시보호 테스트 기간(총 FOSTER_DAY_MAX일) 중 현재 며칠째인지. 실제 시계 날짜가 아니라
      // 산책뼈다귀 소진 시점에 startWalk()에서 증가함.
      fosterDay:1,
      // 37번: 성장 단계 시스템(기획문서 9장) — growthStartStage(시작 성장단계, 전환 일정 판단용)와
      // growthStage(현재 성장단계)는 온보딩(startBtn)에서 0~3 중 균등 확률로 굴려 채워짐.
      // growthMaxStats는 그 시점의 computeEffectiveBaseStats() 결과("성장최대기대치")를 그대로 저장해,
      // 초기 비율 계산과 이후 모든 상한 클램프에 재사용함. 기본값은 온보딩 전 임시값.
      growthStartStage:0,
      growthStage:0,
      growthMaxStats:null,
      // 45번(기획문서 11장): 소통버튼 — 기본 5종 + 상점에서 무료로 배우는 7종.
      // 61번: "유저가 위젯을 눌러 여는" 수동 경로의 사용 가능 횟수를 하루 10회 상한(45·46번)에서
      // 최대 TALK_BUTTON_CHARGE_MAX(5)까지 모아두는 충전식(charges)으로 교체 — 게임 시작 시 0회,
      // 산책 체력을 70% 이상 소모하고 돌아오면 finishWalk()에서 +1(상한 클램프). 유휴 자동 발동 경로
      // (TALK_BUTTON_IDLE_MS)는 이 충전과 완전히 무관하게 그대로 유지됨(사용자 지시).
      talkButton:{ owned:TALK_BUTTON_BASE_IDS.slice(), charges:0 },
      // 48번(기획문서 12장): 30일 임시보호 종료 엔딩씬. pendingEnding은 fosterDay가 FOSTER_DAY_MAX에
      // "막 도달"했음을 표시해두는 예약 플래그(그 산책은 정상 진행하고, 홈으로 돌아왔을 때 컷씬을 재생
      // — 어느 시점에 재생할지는 사용자 확인 완료). ending은 실제로 굴려진 결과({outcome, finished,
      // ts})를 저장해, 재접속해도 같은 결과가 유지되고 컷씬이 다시 재생되지 않게 함.
      pendingEnding:false,
      ending:null,
      // 64번(기획문서 15장): 게임 내 시간 시스템 — 뼈다귀를 소모하는 행동 1회마다 1시간씩 흐름.
      // hour: 화면에 보여줄 06~22시 표시용 시각(하루 종료 시퀀스가 끝날 때마다 6으로 리셋).
      // absHour: 게임 시작부터 누적되는 절대 경과 시간(하루 경계에서도 리셋되지 않음) — 산책 3시간
      // 쿨다운처럼 "게임 내 시간으로 N시간 지났는가"를 날짜 경계와 무관하게 판정할 때 사용.
      // lastWalkAbsHour: 가장 최근 산책을 시작한 시점의 absHour(쿨다운 기준점), 아직 산책한 적 없으면 null.
      time:{ hour:6, absHour:0, lastWalkAbsHour:null },
      // 68번(기획문서 19장): "OO아 잠시 나갔다 올게" 활동의 D 이벤트(장소 5종) 하루 내 중복 방지용 —
      // 그날 이미 등장한 장소의 flavor 배열 인덱스를 담아두고, 하루 종료 시퀀스(playDayEndSequence)에서
      // 매번 비워 다음 날엔 5개 장소가 전부 다시 후보로 복원되게 함.
      outing:{ usedPlaces:[] }
    };
  }

  var state = loadState() || freshState();
  // 이전 버전(견종 시스템 도입 전) 저장분 마이그레이션: 랜덤으로 견종/성격/특징을 한 번 부여
  if(state.onboarded && !state.breed){
    // 아주 오래된 저장분이라 믹스견 부모 매칭을 재구성할 수 없으므로, 정식 견종 중에서만 배정
    state.breed = PURE_BREED_ORDER[Math.floor(Math.random()*PURE_BREED_ORDER.length)];
    state.personality = rollTrait(PERSONALITIES).id;
    state.passive = rollTrait(PASSIVES).id;
  }
  // 29번(믹스견) 도입 전 저장분 마이그레이션
  if(state.mixParents === undefined){ state.mixParents = null; }
  if(state.mixGeoBreed === undefined){ state.mixGeoBreed = null; }
  // 60번(지역 전담 능력) 도입 전 저장분 마이그레이션
  if(!state.regionWalkCounts){ state.regionWalkCounts = {}; }
  if(state.regionAbilityWalkGrantCount === undefined){ state.regionAbilityWalkGrantCount = 0; }
  // 이전 버전(생활만족도/기본 스테이터스 통합 체계 도입 전) 저장분 마이그레이션 (25→26번)
  // 구 stats.hunger/clean → life.hunger/clean 그대로 이관, happiness→stress는 반전(100-행복)해 근사치로 옮김,
  // energy→independence는 방향이 같아 그대로 이관. 유대감(life.bond)·자립감 상한·스트레스는 새 항목이라 기본값으로 시작.
  if(!state.life){
    var oldStats = state.stats || {};
    state.life = {
      hunger: typeof oldStats.hunger === "number" ? oldStats.hunger : 80,
      clean: typeof oldStats.clean === "number" ? oldStats.clean : 85,
      bond: 70,
      independence: typeof oldStats.energy === "number" ? oldStats.energy : 90,
      stress: typeof oldStats.happiness === "number" ? clamp(100 - oldStats.happiness, 0, 100) : 20
    };
  }
  if(!state.core){
    var oldExt = state.ext || {};
    state.core = {
      power: typeof oldExt.power === "number" ? oldExt.power : 15,
      agility: typeof oldExt.agility === "number" ? oldExt.agility : 15,
      comprehension: typeof oldExt.comprehension === "number" ? oldExt.comprehension : 15,
      execution: typeof oldExt.execution === "number" ? oldExt.execution : 15,
      loyalty:15, affinity:15, health:15, aggression:15
    };
  }
  if(typeof state.growthPoints !== "number"){
    state.growthPoints = typeof state.bond === "number" ? state.bond : 0;
  }
  if(!state.abilities){
    state.abilities = { innateUnique:[], innateCommon:[], acquiredUnique:[], acquiredCommon:[] };
    if(state.onboarded && state.personality && state.passive){
      var mPersonality = findById(PERSONALITIES, state.personality);
      var mPassive = findById(PASSIVES, state.passive);
      state.abilities.innateCommon.push({ id:"personality:"+mPersonality.id, name:mPersonality.name, positive:true, flavor:mPersonality.flavor });
      state.abilities.innateCommon.push({ id:"passive:"+mPassive.id, name:mPassive.name, positive:!!mPassive.positive, flavor:mPassive.flavor });
    }
  }
  // 54번: 일반(CSS 그래픽) 모드 자체가 삭제되어, 예전에 일반 모드로 저장해둔 세이브(state.pixelMode
  // === false)도 포함해 전부 픽셀모드로 강제 전환 — "테스트 후 재조정 요망" 항목이라 필드는 남겨둠.
  state.pixelMode = true;
  // 이전 버전(눈동자색·모색 선택 도입 전) 저장분 마이그레이션: 그 견종의 기본(첫번째) 팔레트로 지정
  if(state.onboarded && !state.eyeColor){
    state.eyeColor = findById(EYE_COLORS[state.breed] || EYE_COLORS.golden, null).id;
  }
  if(state.onboarded && !state.coatId){
    state.coatId = findById(COAT_PALETTES[state.breed] || COAT_PALETTES.golden, null).id;
  }
  // 이전 버전(산책 시스템 도입 전) 저장분 마이그레이션
  if(!state.walk){
    state.walk = { charges:4, maxCharges:4, dateKey: todayKey(Date.now()), claimedSlots:[], session:null, summary:null };
  }
  if(!state.walkItems){
    state.walkItems = {};
  }
  // 이전 버전(산책 친구·능력 카운터 도입 전) 저장분 마이그레이션 (28번)
  if(!state.walkFriends){
    state.walkFriends = {};
  }
  if(!state.abilityCounters){
    state.abilityCounters = {};
  }
  // 31번: 산책 이벤트 48종 개편 — "도감 특별 기록"(유성/무지개 목격 등)을 쌓아둘 자리.
  // 도감/일기 화면 자체는 아직 준비중이라, 지금은 데이터만 누적해두는 더미 방식.
  if(!state.dexRecords){
    state.dexRecords = [];
  }
  // 33번: 기존 세이브에 임시보호 날짜 카운터가 없다면 1일차부터 시작.
  if(typeof state.fosterDay !== "number"){
    state.fosterDay = 1;
  }
  // 35번(수집아이템 관련 실험 문서 8장): 기존 세이브에 재료 인벤토리·누적 산책 횟수가 없다면 빈 값/0으로 시작.
  if(!state.materials){
    state.materials = {};
  }
  if(typeof state.totalWalks !== "number"){
    state.totalWalks = 0;
  }
  // 37번: 성장 단계 시스템(기획문서 9장) 도입 전 저장분 마이그레이션 — 그 개체가 실제로 어느 성장단계에서
  // 시작했는지, 성장최대기대치가 얼마였는지는 되돌릴 방법이 없음(과거엔 항목4 ±20%로 시작 스탯을 정함).
  // 이미 함께해온 개는 "찹츄"(가중치 배율이 1배라 사실상 영향 없는 단계)로, 성장최대기대치는 100
  // (클램프가 사실상 걸리지 않도록)으로 안전하게 채워, 기존 세이브의 스탯이 갑자기 깎이거나 막히지
  // 않게 함.
  if(typeof state.growthStage !== "number"){
    state.growthStartStage = 2;
    state.growthStage = 2;
    state.growthMaxStats = { power:100, agility:100, comprehension:100, execution:100, loyalty:100, affinity:100, health:100, aggression:100 };
  }
  // 45번: 소통버튼 시스템 도입 전 저장분 마이그레이션 — 기본 5종만 보유한 채로 시작.
  if(!state.talkButton){
    state.talkButton = { owned:TALK_BUTTON_BASE_IDS.slice(), charges:0 };
  }
  // 61번: 충전식(charges) 도입 전 저장분 마이그레이션 — 옛 하루 10회 상한 방식(usedToday/day)에서
  // 이월할 수 있는 값이 없어 0에서 새로 시작(판단 사항, 완료 보고에 명시).
  if(state.talkButton.charges === undefined){ state.talkButton.charges = 0; }
  // 48번: 엔딩씬 도입 전 저장분 마이그레이션 — 아직 아무 결과도 없는 상태로 채움.
  if(state.pendingEnding === undefined){ state.pendingEnding = false; }
  if(state.ending === undefined){ state.ending = null; }
  // 64번(기획문서 15장): 게임 내 시간 시스템 도입 전 저장분 마이그레이션 — 06:00부터 새로 시작.
  if(!state.time){
    state.time = { hour:6, absHour:0, lastWalkAbsHour:null };
  }
  // 68번(기획문서 19장): "OO아 잠시 나갔다 올게" 도입 전 저장분 마이그레이션 — 오늘 등장한 장소가
  // 없는 상태로 새로 시작.
  if(!state.outing){
    state.outing = { usedPlaces:[] };
  }

  function stageIndex(bond){
    if(bond >= STAGE_THRESHOLDS[2]) return 2;
    if(bond >= STAGE_THRESHOLDS[1]) return 1;
    return 0;
  }
  var STAGE_NAMES = ["아기","청소년","성견"];

  // 55번: 모색 hex의 체감 밝기(YIQ 근사식)를 계산해, 산책! 버튼처럼 모색을 배경색으로 쓰는 자리에서
  // 아이콘·글자색을 흰색/짙은 잉크색 중 자동으로 고르기 위한 헬퍼. 임계값 160은 크림색·베이지 계열까지는
  // 흰 글자를 유지하되 흰색·연회색처럼 확실히 밝은 모색부터 잉크색으로 넘어가도록 실측으로 잡은 값.
  function furInkColor(hex){
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    var yiq = (r*299 + g*587 + b*114) / 1000;
    return yiq >= 160 ? "#2C2A22" : "#fff";
  }
  function applyBreedVisuals(){
    var breedId = state.breed || "golden";
    var palette = findById(COAT_PALETTES[breedId] || COAT_PALETTES.golden, state.coatId);
    var f = palette.fur;
    var eye = findById(EYE_COLORS[breedId] || EYE_COLORS.golden, state.eyeColor);
    var root = document.documentElement;
    root.style.setProperty("--fur-a", f.a);
    root.style.setProperty("--fur-a-dark", f.aDark);
    root.style.setProperty("--fur-b", f.b);
    root.style.setProperty("--fur-b-dark", f.bDark);
    root.style.setProperty("--eye-color", eye.hex);
    root.style.setProperty("--fur-ink", furInkColor(f.a));
  }

  function applyDecay(){
    var now = Date.now();
    var elapsedMin = (now - state.lastTs) / 60000;
    if(elapsedMin <= 0){ state.lastTs = now; return 0; }
    var cappedMin = Math.min(elapsedMin, 1440); // cap at 24h worth of decay
    var hungerMult = effMult("hungerDrain");
    var cleanMult = effMult("cleanDrain");
    state.life.hunger = clamp(state.life.hunger - cappedMin*0.4*hungerMult, 0, 100);
    state.life.stress = clamp(state.life.stress + cappedMin*0.25, 0, 100); // 방치되면 스트레스가 서서히 쌓임
    state.life.clean = clamp(state.life.clean - cappedMin*0.2*cleanMult, 0, 100);
    state.life.independence = clamp(state.life.independence + cappedMin*0.15, 0, 100); // 쉬는 동안 자립감(컨디션) 회복
    state.life.bond = clamp(state.life.bond - cappedMin*0.08, 0, 100); // 관계도 꾸준히 챙겨야 유지됨(천천히 감소)
    state.lastTs = now;
    return elapsedMin;
  }

  // 생활만족도 평균 — 스트레스는 낮을수록 좋으므로 (100-스트레스)로 반전해 합산.
  function lifeAvg(){
    var L = state.life;
    return (L.hunger + L.clean + L.bond + L.independence + (100 - L.stress)) / 5;
  }
  // 생활만족도 평균이 80% 이상이면 기본 스테이터스가 온전히 자람. 그 밑으로는 성장폭이 줄어들되,
  // 완전히 막히지는 않도록 최소 20%는 보장(견종/성격에 따른 이후 확장 여지를 위해 완전 차단은 피함).
  function coreGrowthGate(){
    var avg = lifeAvg();
    if(avg >= 80) return 1;
    return clamp(avg / 80, 0.2, 1);
  }

  // 26번: 고유능력(특별능력) 4분류 — innateUnique(고유 선천적)/innateCommon(공통 선천적)/
  // acquiredUnique(고유 후천적)/acquiredCommon(공통 후천적). 지금은 등급 없이 소지 여부만 기록.
  // 산책 이벤트 등에서 능력을 얻거나(취득) 잃을 때(치료/삭제) 이 두 함수를 통해 처리할 예정.
  function grantAbility(category, record){
    var list = state.abilities[category];
    if(!list) return;
    if(list.some(function(a){ return a.id === record.id; })) return; // 이미 있으면 중복 등록 안 함
    list.push(record);
  }
  function revokeAbility(category, id){
    var list = state.abilities[category];
    if(!list) return;
    state.abilities[category] = list.filter(function(a){ return a.id !== id; });
  }

  function dayCount(){
    var diff = Date.now() - state.createdTs;
    return Math.floor(diff / 86400000) + 1;
  }

  function moodOf(){
    var L = state.life;
    var avg = (L.hunger + (100 - L.stress) + L.clean) / 3;
    if(L.independence < 20) return "sleepy";
    if(avg < 35) return "sad";
    if(avg > 65) return "happy";
    return "neutral";
  }

  function showMessage(text){
    el.msgFloat.textContent = text;
    el.msgFloat.classList.add("show");
    window.clearTimeout(showMessage._t);
    showMessage._t = window.setTimeout(function(){
      el.msgFloat.classList.remove("show");
    }, 1600);
  }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  // 스트레스처럼 "낮을수록 좋은" 항목은 값을 반전(100-value)해 표정에 반영
  function setStatFaceInverted(elm, value, statName){
    setStatFace(elm, 100 - value, statName);
  }

