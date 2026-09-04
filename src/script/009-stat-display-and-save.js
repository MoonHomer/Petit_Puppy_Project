  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

  // 핵심 대전제: 돌봄·유대감처럼 관계의 질을 나타내는 값은 숫자 대신 상태로 보여줍니다.
  // (막대 길이는 남기되, 정확한 수치 대신 5단계 표정/문구로 표현 — 추후 스탯별 전용 문구로 다듬을 예정)
  var STATE_EMOJI = ["😖","😟","😐","🙂","😄"];
  var STATE_LABELS = ["많이 힘들어요","별로예요","보통이에요","좋아요","최고예요"];
  var BOND_PHRASES = ["이제 막 만났어요","조금씩 친해지고 있어요","제법 가까워졌어요","거의 다 왔어요","곧 자라날 것 같아요!"];
  function tierIndex(value){ return clamp(Math.floor(value/20), 0, 4); }
  function setStatFace(elm, value, statName){
    var t = tierIndex(value);
    elm.textContent = STATE_EMOJI[t];
    elm.setAttribute("role", "img");
    elm.setAttribute("aria-label", statName + " 상태: " + STATE_LABELS[t]);
  }

  // 28-3번: 기본능력(8) 전용 — 이모지 5단계 대신 A~E 등급 배지로 표시.
  // 값이 높을수록 좋은 등급(A)이 되도록 tierIndex(0~4)를 그대로 뒤집어 매핑.
  var GRADE_LETTERS = ["E","D","C","B","A"];
  var GRADE_LABELS = ["E등급","D등급","C등급","B등급","A등급"];
  function setStatGrade(elm, value, statName){
    var t = tierIndex(value);
    var letter = GRADE_LETTERS[t];
    elm.textContent = letter;
    elm.className = "chip-grade grade-" + letter.toLowerCase();
    elm.setAttribute("role", "img");
    elm.setAttribute("aria-label", statName + " " + GRADE_LABELS[t]);
  }

  // 35번(수집아이템 관련 실험 문서 8장): 애착바구니 누적형 아이템 중 민들레 홀씨(민첩성)·조약돌(건강함)의
  // "보유 개수에 따라 계단식으로 커지는" 보정치. 문서 표현이 개수를 잃으면(아직 소비/거래 시스템은
  // 없지만) 사라질 수 있는 "상시 보정"으로 읽혀서, state.core의 원본 저장값(훈련·시고르자브 산출 등
  // 다른 로직이 그대로 참조함)은 건드리지 않고 화면 표시(등급 배지) 시점에만 더해서 보여줌 — 판단
  // 근거는 계획 문서 35번에 기록.
  function collectionStatBonus(count){
    if(count >= 100) return 7;
    if(count >= 50) return 5;
    if(count >= 10) return 3;
    return 0;
  }
  function coreDisplayValue(key){
    var raw = state.core[key];
    var bonus = 0;
    if(key === "agility") bonus = collectionStatBonus((state.walkItems && state.walkItems["민들레 홀씨"]) || 0);
    if(key === "health") bonus = collectionStatBonus((state.walkItems && state.walkItems["조약돌"]) || 0);
    // 59번(58번 3~5번, 신규 수집 아이템 반영): 도토리→근력, 조개껍데기→친화력도 같은 누적형 계단식 보정
    if(key === "power") bonus = collectionStatBonus((state.walkItems && state.walkItems["도토리"]) || 0);
    if(key === "affinity") bonus = collectionStatBonus((state.walkItems && state.walkItems["조개껍데기"]) || 0);
    return clamp(raw + bonus, 0, 100);
  }

  function loadState(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      var parsed = JSON.parse(raw);
      if(!parsed || typeof parsed !== "object") return null;
      return parsed;
    }catch(e){ return null; }
  }
  function saveState(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){ /* storage unavailable, continue in-memory */ }
  }

  // 45번(기획문서 11장): 소통버튼 카탈로그 — base:true 5종은 온보딩 시 기본 지급, 나머지 7종은
  // [외출하기]→[상점]에서 무료(테스트 버전 확정 가격 0원)로 배워서 보유 세트에 "추가"됨(교체 아님).
  // 이해력 등급·성장 단계에 따른 해금 게이팅, 표현 명료도 차등은 정식 버전 설계로 남겨두고
  // 이번 라운드에선 구현하지 않음(사용자 명시 — 지금은 건드리지 않아도 됨).
