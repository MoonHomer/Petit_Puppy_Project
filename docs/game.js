(function(){
  "use strict";
  var STORAGE_KEY = "furballDiary.save.v1";
  var STAGE_THRESHOLDS = [0, 50, 150]; // bond needed for stage 0,1,2
  // 4. 능력치 시스템 (선천 - 견종): 기획안 3-4, 4번 반영
  var BREEDS = {
    golden: {
      name:"골든 리트리버", desc:"체력 좋고 먹성도 좋은 든든한 친구",
      fur:{a:"#E8C27A", aDark:"#C99A4E", b:"#D9A75A", bDark:"#B5813A"},
      mult:{ energyDrain:0.85, hungerDrain:1.15, bondWalk:1.1 }
    },
    labrador: {
      name:"래브라도 리트리버", desc:"사람도 음식도 다 좋아하는 사교적인 먹보",
      fur:{a:"#EDD9A3", aDark:"#CBB37D", b:"#E3C98C", bDark:"#BFA268"},
      // 사람을 워낙 좋아해 마음을 여는 속도가 빠르고, 먹는 걸 좋아해 금방 배고파하는 편
      mult:{ hungerDrain:1.25, bondGain:1.1 }
    },
    jindo: {
      name:"진돗개", desc:"충직하고 독립적인, 은근히 까다로운 우리 토종견",
      fur:{a:"#D9A85E", aDark:"#B4823E", b:"#C89552", bDark:"#9E7238"},
      // 한 사람에게만 곁을 내주는 편이라 처음엔 다소 신중하게 마음을 여는 대신, 체력은 튼튼함
      mult:{ bondGain:0.9, energyDrain:0.85 }
    },
    shiba: {
      name:"시바견", desc:"깔끔하고 영리하지만 제멋대로인 매력둥이",
      fur:{a:"#D6812F", aDark:"#B0641E", b:"#F0DCC0", bDark:"#CBB897"},
      // 고양이처럼 스스로 몸단장을 잘해 깨끗함이 잘 유지되고, 활동적으로 놀 때 특히 즐거워함
      mult:{ cleanDrain:0.85, happinessGainActive:1.1 }
    },
    border: {
      name:"보더콜리", desc:"에너지 넘치고 산책을 사랑하는 아이",
      fur:{a:"#F4F1E6", aDark:"#D8D3C2", b:"#3A3A3A", bDark:"#232323"},
      // 지구력이 워낙 좋아 같은 활동으로는 좀처럼 지치지 않음 → 늘 "더 놀고 싶어" 하는 쪽
      mult:{ energyDrain:0.7, happinessGain:1.15, bondWalk:1.2 }
    },
    corgi: {
      name:"웰시코기", desc:"짧은 다리, 넘치는 애교의 소유자",
      fur:{a:"#E7B975", aDark:"#C89552", b:"#FBF6EC", bDark:"#DAD2BE"},
      mult:{ happinessGainFeed:1.3, energyDrain:1.05 }
    },
    pom: {
      name:"포메라니안", desc:"복슬복슬, 예민하지만 사랑스러운 아이",
      fur:{a:"#F0C98A", aDark:"#D2A75F", b:"#F7DFAE", bDark:"#DFC087"},
      // 체구가 작아 같은 활동이라도 금방 지치는 편
      mult:{ cleanDrain:1.25, happinessGainBath:1.2, energyDrain:1.15 }
    },
    // 31번: 견종 10종 확장(기획 문서 2026-09-01) — 시베리안 허스키 · 시츄 추가
    husky: {
      name:"시베리안 허스키", desc:"강한 체력의 독립적인 자유 영혼, 그래도 곁은 늘 사람 옆",
      fur:{a:"#C9CDD6", aDark:"#A9AFBC", b:"#F4F1E6", bDark:"#D8D3C2"},
      // 지구력이 워낙 좋아 활동 후에도 잘 지치지 않는 대신, 독립적인 기질 탓에 마음을 여는 속도는 다소 느긋함
      mult:{ energyDrain:0.75, hungerDrain:1.15, bondGain:0.85 }
    },
    shihtzu: {
      name:"시츄", desc:"도시 생활에 능숙한, 느긋하고 사람 좋아하는 아이",
      fur:{a:"#E7B975", aDark:"#C89552", b:"#FBF6EC", bDark:"#DAD2BE"},
      // 긴 털은 손이 많이 가고, 차분한 시간에 유독 행복해하며, 체구가 작아 금방 지치는 편
      mult:{ cleanDrain:1.2, happinessGainCalm:1.15, energyDrain:1.1 }
    },
    // 78번(24장): 견종 3종 추가 — 몰티즈·푸들·비숑프리제. mult 배율은 문서에 정확한 수치가 없어
    // 리서치 근거(desc 참고)에 맞춰 개발팀이 기존 견종들과 같은 결로 채움(오픈 이슈, 실플레이 후 조정 가능).
    maltese: {
      name:"몰티즈", desc:"아무나 안 좋아하지만 마음을 준 사람껜 끝까지 곁을 지키는, 작고 예민한 아이",
      fur:{a:"#FAF8F2", aDark:"#DAD5C4", b:"#F3EEDF", bDark:"#D8D2BE"},
      // 폐쇄적 사회성(아무나에게 마음을 안 여는 편) → 유대감 형성이 다소 느긋, 체구가 작아 금방 지치는 편
      mult:{ cleanDrain:1.2, energyDrain:1.15, bondGain:0.9 }
    },
    poodle: {
      name:"푸들", desc:"주인의 감정을 가장 잘 읽는, 소형·미디엄·스탠다드 세 크기 중 하나로 만나는 영리한 아이",
      fur:{a:"#E7A55C", aDark:"#C1813C", b:"#D89249", bDark:"#AD7230"},
      // 사람 마음을 잘 읽고 활동적일 때 특히 즐거워함, 곱슬 털은 손질이 자주 필요한 편
      mult:{ cleanDrain:1.15, bondGain:1.1, happinessGainActive:1.1 }
    },
    bichon: {
      name:"비숑프리제", desc:"누구에게나 반갑게 다가가는, 곱슬곱슬 뭉게구름 같은 털의 왕성한 먹보",
      fur:{a:"#FBFAF4", aDark:"#DAD5C4", b:"#F3EEDF", bDark:"#D6D0BC"},
      // 왕성한 식욕과 활발함("비숑타임"), 곱슬 털은 손질이 자주 필요한 편
      mult:{ cleanDrain:1.15, hungerDrain:1.15, happinessGainActive:1.15 }
    },
    // 29번: 믹스견(시고르자브) — 등록된 견종 중 두 마리를 무작위로 매칭해 만들어지는, 세상에 하나뿐인 조합.
    // 특정 견종 배수를 주지 않고 중립으로 두고, 크기·모색·눈동자색·픽셀 실루엣은 매칭된 두 견종에서 랜덤으로 물려받음(chooseCrate 참고).
    mix: {
      name:"시고르자브", desc:"어떤 두 견종이 만났는지는 아무도 몰라요. 세상에 하나뿐인 조합이에요.",
      fur:{a:"#D9A85E", aDark:"#B4823E", b:"#C89552", bDark:"#9E7238"},
      mult:{}
    }
  };
  var BREED_ORDER = ["golden","labrador","jindo","shiba","border","corgi","pom","husky","shihtzu","maltese","poodle","bichon","mix"];
  // 실제 "정식 견종" 목록(믹스견의 부모 매칭 대상) — mix 자신은 제외
  var PURE_BREED_ORDER = ["golden","labrador","jindo","shiba","border","corgi","pom","husky","shihtzu","maltese","poodle","bichon"];

  // 4-1. 랜덤 성격 & 신체 패시브 (석세스모드 참고)
  var PERSONALITIES = [
    { id:"rough", name:"거친", mult:{ energyDrain:0.95 }, flavor:"작은 일에 크게 개의치 않는 씩씩한 성격이에요." },
    { id:"aegyo", name:"귀여운 척하는", mult:{ bondGain:1.1 }, flavor:"애교로 주인의 마음을 사로잡을 줄 알아요." },
    { id:"extro", name:"외향적인", mult:{ happinessGainActive:1.15, happinessGainCalm:0.9 }, flavor:"뛰어놀 때 가장 행복해하는 성격이에요." },
    { id:"intro", name:"내성적인", mult:{ happinessGainCalm:1.15, happinessGainActive:0.9 }, flavor:"조용하고 아늑한 시간을 더 좋아해요." },
    { id:"brave", name:"용감한", mult:{}, flavor:"낯선 것 앞에서도 잘 물러서지 않아요." }
  ];
  // positive:true 특징은 성장에 도움, false는 다뤄야 할 약점 — 둘 다 이 아이만의 개성
  var PASSIVES = [
    { id:"tough", name:"튼튼함", positive:true, mult:{ energyDrain:0.85, cleanDrain:0.9 }, flavor:"웬만한 일에는 지치지 않는 튼튼한 몸이에요." },
    { id:"smart", name:"이해력 뛰어난", positive:true, mult:{ bondGain:1.15 }, flavor:"눈치가 빨라서 금방 마음이 통해요." },
    { id:"ironstomach", name:"철근도 씹어먹을 위장", positive:true, mult:{ hungerDrain:0.85 }, flavor:"뭐든 잘 먹고 좀처럼 배고파하지 않아요." },
    { id:"fragile", name:"다치기 쉬운", positive:false, mult:{ energyDrain:1.15 }, flavor:"활동 후엔 유독 금방 지쳐버려요." },
    { id:"weakbone", name:"뼈가 약함", positive:false, mult:{ bondWalk:0.85, energyDrainWalk:1.1 }, flavor:"산책은 좋아하지만 무리는 조심해야 해요." },
    { id:"hip", name:"고관절이 약함", positive:false, mult:{ energyDrainWalk:1.2 }, flavor:"오래 걷고 나면 다리를 유독 아파해요." }
  ];

  // 견종별 체구 구분(19번 실측 체고 기준) — 이동장을 열기 전, 크기만 먼저 살짝 알려주는 용도
  // 78번: 푸들은 소형/미디엄/스탠다드 3사이즈로 나오지만(개체별 state.breedSizeClass), 이 SIZE_LABEL은
  // 부상 위험 확률(jointCare)처럼 "견종 하나에 크기 하나"를 전제하는 기존 로직용 대표값이라 중형으로 고정.
  var SIZE_LABEL = { golden:"대형", labrador:"대형", jindo:"중형", shiba:"소형", border:"중형", corgi:"소형", pom:"소형", husky:"중형", shihtzu:"소형", maltese:"소형", poodle:"중형", bichon:"소형", mix:"중형" };

  // 견종별로 실제 나올 법한 눈동자 색 팔레트 — 견종은 이미 정해져 있고(이동장 뽑기), 그 안에서 유저가 선택
  var EYE_COLORS = {
    golden: [
      { id:"brown", name:"짙은 갈색", hex:"#5B3A22" },
      { id:"hazel", name:"헤이즐(연갈색)", hex:"#8A6435" },
      { id:"amber", name:"호박색", hex:"#B9812E" }
    ],
    labrador: [
      { id:"brown", name:"짙은 갈색", hex:"#4A2F1C" },
      { id:"hazel", name:"헤이즐(연갈색)", hex:"#8A6435" },
      { id:"amber", name:"호박색", hex:"#B08030" }
    ],
    jindo: [
      { id:"darkbrown", name:"흑갈색", hex:"#2E1D12" },
      { id:"brown", name:"짙은 갈색", hex:"#4A2F1C" }
    ],
    shiba: [
      { id:"darkbrown", name:"흑갈색", hex:"#2E1D12" },
      { id:"amber", name:"호박색", hex:"#8A5A28" }
    ],
    border: [
      { id:"brown", name:"짙은 갈색", hex:"#4A3324" },
      { id:"amber", name:"호박색", hex:"#A9762E" },
      { id:"blue", name:"하늘색(블루)", hex:"#7FAFC4" }
    ],
    corgi: [
      { id:"brown", name:"짙은 갈색", hex:"#4E3520" },
      { id:"hazel", name:"헤이즐(연갈색)", hex:"#8A6435" }
    ],
    pom: [
      { id:"brown", name:"짙은 갈색", hex:"#3E2A1C" },
      { id:"espresso", name:"에스프레소", hex:"#241712" }
    ],
    husky: [
      { id:"blue", name:"하늘색(블루)", hex:"#7EC8E3" },
      { id:"brown", name:"짙은 갈색", hex:"#4A2F1C" }
    ],
    shihtzu: [
      { id:"darkbrown", name:"흑갈색", hex:"#2E1D12" },
      { id:"espresso", name:"에스프레소", hex:"#241712" }
    ],
    // 78번(24장): 신규 3종 — 모두 실제로 짙은 다크 브라운~블랙 계열 눈동자가 표준인 견종들.
    maltese: [
      { id:"darkbrown", name:"짙은 흑갈색", hex:"#241712" },
      { id:"espresso", name:"에스프레소", hex:"#1A120D" }
    ],
    poodle: [
      { id:"darkbrown", name:"짙은 갈색", hex:"#3A2415" },
      { id:"amber", name:"호박색", hex:"#8A5A28" }
    ],
    bichon: [
      { id:"darkbrown", name:"짙은 흑갈색", hex:"#2E1D12" },
      { id:"espresso", name:"에스프레소", hex:"#1F150F" }
    ]
  };
  // 견종별 실제 표준 모색 팔레트 — 첫 항목은 기존에 쓰던 기본 색상과 동일(하위 호환)
  var COAT_PALETTES = {
    golden: [
      { id:"golden", name:"황금색(골든)", fur:{ a:"#E8C27A", aDark:"#C99A4E", b:"#D9A75A", bDark:"#B5813A" } },
      { id:"cream", name:"크림색", fur:{ a:"#F3E3C0", aDark:"#D9C69B", b:"#E9D3A8", bDark:"#C7AE7E" } },
      { id:"darkgold", name:"진한 황금색", fur:{ a:"#C99A52", aDark:"#A87A38", b:"#B98A46", bDark:"#8F6830" } }
    ],
    labrador: [
      { id:"black", name:"블랙", fur:{ a:"#3A3733", aDark:"#242220", b:"#4A4642", bDark:"#302D2A" } },
      { id:"yellow", name:"옐로우", fur:{ a:"#EDD9A3", aDark:"#CBB37D", b:"#E3C98C", bDark:"#BFA268" } },
      { id:"chocolate", name:"초콜릿", fur:{ a:"#8A5A3C", aDark:"#6B4128", b:"#7A4E34", bDark:"#5C3A22" } }
    ],
    jindo: [
      { id:"baekgu", name:"흰색", fur:{ a:"#F3F1E9", aDark:"#D6D2C2", b:"#E7E3D4", bDark:"#C7C2AE" } },
      { id:"hwanggu", name:"황색", fur:{ a:"#D9A85E", aDark:"#B4823E", b:"#C89552", bDark:"#9E7238" } },
      { id:"jaegu", name:"회색 얼룩", fur:{ a:"#B9AF9E", aDark:"#948A7A", b:"#8D8375", bDark:"#6B6255" } }
    ],
    shiba: [
      { id:"aka", name:"적색", fur:{ a:"#D6812F", aDark:"#B0641E", b:"#F0DCC0", bDark:"#CBB897" } },
      { id:"sesame", name:"참깨색", fur:{ a:"#B98A52", aDark:"#93692F", b:"#4A4038", bDark:"#2E2822" } },
      { id:"cream", name:"크림색", fur:{ a:"#F3E6C8", aDark:"#D8C79E", b:"#EFE0BC", bDark:"#CBB88E" } }
    ],
    border: [
      { id:"classic", name:"블랙 & 화이트", fur:{ a:"#F4F1E6", aDark:"#D8D3C2", b:"#3A3A3A", bDark:"#232323" } },
      { id:"red", name:"레드 & 화이트", fur:{ a:"#F4F1E6", aDark:"#D8D3C2", b:"#9A4E30", bDark:"#733823" } },
      { id:"merle", name:"블루 멀", fur:{ a:"#C9CDD6", aDark:"#A9AFBC", b:"#5B6270", bDark:"#3F4552" } }
    ],
    corgi: [
      { id:"fawn", name:"황갈색 & 화이트", fur:{ a:"#E7B975", aDark:"#C89552", b:"#FBF6EC", bDark:"#DAD2BE" } },
      { id:"sable", name:"세이블 & 화이트", fur:{ a:"#C79256", aDark:"#A5763C", b:"#FBF6EC", bDark:"#DAD2BE" } },
      { id:"tricolor", name:"블랙탄 트라이컬러", fur:{ a:"#3A322A", aDark:"#241E18", b:"#C99A5E", bDark:"#A87A3E" } }
    ],
    pom: [
      { id:"orange", name:"오렌지", fur:{ a:"#F0C98A", aDark:"#D2A75F", b:"#F7DFAE", bDark:"#DFC087" } },
      { id:"cream", name:"크림", fur:{ a:"#F5E8CC", aDark:"#DCC89E", b:"#FBF3E1", bDark:"#E3CFA9" } },
      { id:"black", name:"블랙", fur:{ a:"#3C3A38", aDark:"#242222", b:"#585351", bDark:"#3A3634" } }
    ],
    husky: [
      { id:"greywhite", name:"그레이 & 화이트", fur:{ a:"#C9CDD6", aDark:"#A9AFBC", b:"#F4F1E6", bDark:"#D8D3C2" } },
      { id:"blackwhite", name:"블랙 & 화이트", fur:{ a:"#3A3A3A", aDark:"#232323", b:"#F4F1E6", bDark:"#D8D3C2" } },
      { id:"red", name:"레드 & 화이트", fur:{ a:"#9A4E30", aDark:"#733823", b:"#F4F1E6", bDark:"#D8D3C2" } }
    ],
    shihtzu: [
      { id:"goldwhite", name:"골드 & 화이트", fur:{ a:"#E7B975", aDark:"#C89552", b:"#FBF6EC", bDark:"#DAD2BE" } },
      { id:"white", name:"화이트", fur:{ a:"#F8F5EC", aDark:"#DAD5C4", b:"#EDE8D8", bDark:"#CFC9B6" } },
      { id:"black", name:"블랙", fur:{ a:"#3C3A38", aDark:"#242222", b:"#585351", bDark:"#3A3634" } }
    ],
    // 78번(24장): 몰티즈는 실제로 거의 흰색 단일색으로 고정되는 견종 — 완전 고정 대신, 화이트 계열
    // 2종 + 드문 크림탄 1종으로 배정해 흰색 쪽 비중을 2/3로 높임(모색은 균등 랜덤이라 배열 구성으로
    // 가중치를 흉내냄). 완전 고정이 더 낫다면 이 배열을 화이트 한 종류만 남기면 됨 — 아직 미확정(오픈 이슈).
    maltese: [
      { id:"white", name:"화이트", fur:{ a:"#FAF8F2", aDark:"#DAD5C4", b:"#F3EEDF", bDark:"#D8D2BE" } },
      { id:"ivory", name:"아이보리", fur:{ a:"#F5EFDD", aDark:"#D9CFA9", b:"#EFE6C8", bDark:"#CFC299" } },
      { id:"creamtan", name:"크림탄(드묾)", fur:{ a:"#EAD9B0", aDark:"#C9AF7C", b:"#DFCB98", bDark:"#BE9F66" } }
    ],
    poodle: [
      { id:"apricot", name:"애프리콧", fur:{ a:"#E7A55C", aDark:"#C1813C", b:"#D89249", bDark:"#AD7230" } },
      { id:"black", name:"블랙", fur:{ a:"#3A3733", aDark:"#242220", b:"#4A4642", bDark:"#302D2A" } },
      { id:"cream", name:"크림색", fur:{ a:"#F3E6C8", aDark:"#D8C79E", b:"#EFE0BC", bDark:"#CBB88E" } }
    ],
    // 비숑프리제도 실제 견종 표준이 흰색이라, 화이트 계열을 중심으로 배정.
    bichon: [
      { id:"white", name:"화이트", fur:{ a:"#FBFAF4", aDark:"#DAD5C4", b:"#F3EEDF", bDark:"#D6D0BC" } },
      { id:"creamtrim", name:"화이트(살구빛 포인트)", fur:{ a:"#FBFAF4", aDark:"#E2C79A", b:"#F3EEDF", bDark:"#D6BE8E" } },
      { id:"ivory", name:"아이보리", fur:{ a:"#F3E6C8", aDark:"#D8C79E", b:"#EFE0BC", bDark:"#CBB88E" } }
    ]
  };

  // 29번: 믹스견(시고르자브) 전용 눈동자색·모색 풀 — 등록된 모든 견종의 팔레트를 한데 모으되,
  // 원래 견종별로 id가 겹칠 수 있어(예: "cream"이 여러 견종에 있음) "견종id_원래id"로 접두어를 붙여 고유하게 만듦.
  // 실제 랜덤 선택은 매칭된 두 견종(chosenMixParents)의 항목으로만 필터링해서 뽑고, 여기 저장된 값은
  // 이후 재조회(findById 등)를 위한 전체 풀 용도.
  (function buildMixPalettes(){
    var eyeMix = [], coatMix = [];
    PURE_BREED_ORDER.forEach(function(bid){
      (EYE_COLORS[bid] || []).forEach(function(c){
        eyeMix.push({ id:bid+"_"+c.id, name:c.name, hex:c.hex, sourceBreed:bid });
      });
      (COAT_PALETTES[bid] || []).forEach(function(c){
        coatMix.push({ id:bid+"_"+c.id, name:c.name, fur:c.fur, sourceBreed:bid });
      });
    });
    EYE_COLORS.mix = eyeMix;
    COAT_PALETTES.mix = coatMix;
  })();

  // ---- 클래식 픽셀 모드: 가로60 x 세로40 (3:2) 저해상도 화면 ----
  // 화면의 실제 세로 길이를 "170cm 성인 남성이 서 있을 때, 정수리 위로 머리 하나 정도의
  // 여백을 두는" 구도로 가정해 축척을 잡고, 그 축척으로 각 견종의 실제 신장을 픽셀로 환산합니다.
  var PX_W = 150, PX_H = 100;
  var HUMAN_HEIGHT_CM = 170;
  var HEAD_TO_HEIGHT_RATIO = 7.5; // 성인 평균 신체비율(머리 개수 기준 근사치)
  var SCREEN_CM_HEIGHT = HUMAN_HEIGHT_CM + (HUMAN_HEIGHT_CM / HEAD_TO_HEIGHT_RATIO); // 사람 키 + 머리 하나 여유
  var CM_PER_PX = SCREEN_CM_HEIGHT / PX_H;
  // 견종별 대략적인 실측치(경계 자세로 섰을 때 정수리까지의 높이) — 견종 표준 참고 근사치
  // earStyle: 귀 형태(처진귀/쫑긋선귀), tailStyle: 꼬리 형태(흔들이/수달꼬리/말린꼬리/짧은꼬리/풍성한꼬리)
  // bodyHRatio: 몸통 높이 비율(클수록 배가 낮고 다부짐), rumpBump: 엉덩이가 봉긋한 실루엣 여부
  // earScale/snoutRatio: 귀·주둥이 크기를 품종 인상에 맞게 개별 보정
  var BREED_PXSCALE = {
    golden:{ heightCm:71, lengthRatio:1.15, legRatio:0.30, earStyle:"floppy", tailStyle:"wag", earScale:1.15 },
    labrador:{ heightCm:66, lengthRatio:1.2, legRatio:0.28, earStyle:"floppy", tailStyle:"otter" },
    jindo:{ heightCm:62, lengthRatio:1.15, legRatio:0.33, earStyle:"erect", tailStyle:"curl", snoutRatio:0.34 },
    shiba:{ heightCm:46, lengthRatio:1.15, legRatio:0.30, earStyle:"erect", tailStyle:"curl", snoutRatio:0.34 },
    border:{ heightCm:63, lengthRatio:1.15, legRatio:0.32, earStyle:"erect", tailStyle:"wag" },
    corgi:{ heightCm:38, lengthRatio:2.0, legRatio:0.15, bodyHRatio:0.52, earStyle:"erect", tailStyle:"stub", earScale:1.3, snoutRatio:0.4, rumpBump:true },
    pom:{ heightCm:32, lengthRatio:1.05, legRatio:0.22, earStyle:"erect", tailStyle:"plume" },
    // 31번: 시베리안 허스키 — 늑대상의 다부진 체형, 쫑긋 선 귀에 등 위로 살짝 말리는 꼬리
    husky:{ heightCm:58, lengthRatio:1.15, legRatio:0.30, earStyle:"erect", tailStyle:"curl" },
    // 31번: 시츄 — 짧은 다리에 낮은 체고, 단두종 특유의 짧은 주둥이(snoutRatio 최소치), 풍성한 꼬리는 포메 스타일 재활용
    shihtzu:{ heightCm:26, lengthRatio:1.15, legRatio:0.21, earStyle:"floppy", tailStyle:"plume", snoutRatio:0.24 },
    // 78번(24장): 신규 3종. headScaleMult/curlyFur는 이번에 새로 추가된 속성(기본값 1/false) — 아래
    // drawPixelDog()에서 헤더·몸통 실루엣에 반영됨.
    // 몰티즈: 아주 작은 체구, 실키한 처진 귀(시츄 스타일 재사용), 짧고 가는 주둥이.
    maltese:{ heightCm:22, lengthRatio:1.1, legRatio:0.22, earStyle:"floppyLong", tailStyle:"plume", snoutRatio:0.26 },
    // 푸들: 스탠다드(100%) 기준 체고 — 소형/미디엄은 breedSizeScale()로 별도 곱연산. 처진 귀, 동그란 폼폼 꼬리(plume 재사용).
    poodle:{ heightCm:45, lengthRatio:1.05, legRatio:0.34, earStyle:"floppyLow", tailStyle:"plume", snoutRatio:0.3 },
    // 비숑프리제: "큰 대두"(headScaleMult×2)·짧은 다리(legRatio 최소치권)·곱슬곱슬 뭉게구름 실루엣(curlyFur).
    bichon:{ heightCm:26, lengthRatio:1.1, legRatio:0.17, earStyle:"floppyLow", earScale:0.8, tailStyle:"plume", snoutRatio:0.32, headScaleMult:2, curlyFur:true }
  };
  // 32번: 산책 팝업의 반려견이 너무 작다는 피드백 반영 — 픽셀모드 산책 캔버스의 표시 크기를
  // "대형견 기준 체고가 팝업(.walk-scene, 120px) 높이의 2/3를 차지"하도록 역산해서 정함.
  // BREED_PXSCALE에 등록된 견종 중 heightCm가 가장 큰 쪽을 "대형견 기준"으로 자동 선택하므로,
  // 나중에 더 큰 견종이 추가돼도 이 계산이 다시 맞춰짐.
  var WALK_SCENE_HEIGHT_PX = 120; // .walk-scene의 CSS height와 반드시 일치해야 하는 값
  var WALK_LARGE_HEIGHT_RATIO = 2/3;
  var WALK_CANVAS_SCALE = (function(){
    var maxHeightCm = 0;
    Object.keys(BREED_PXSCALE).forEach(function(k){
      if(BREED_PXSCALE[k].heightCm > maxHeightCm) maxHeightCm = BREED_PXSCALE[k].heightCm;
    });
    var rawH = Math.max(6, Math.round(maxHeightCm / CM_PER_PX)); // drawPixelDog()와 동일한 공식
    return (WALK_SCENE_HEIGHT_PX * WALK_LARGE_HEIGHT_RATIO) / rawH;
  })();
  var WALK_CANVAS_DISPLAY_W = Math.round(PX_W * WALK_CANVAS_SCALE);
  var WALK_CANVAS_DISPLAY_H = Math.round(PX_H * WALK_CANVAS_SCALE);
  function cssVar(name, fallback){
    try{
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    }catch(e){ return fallback; }
  }
  function reduceMotion(){
    try{ return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch(e){ return false; }
  }
  // 70번: 찹찹츄(노년기) 전용 "옅은 회색 톤"용 — 원색을 유지한 채 자기 평균 밝기(회색) 쪽으로만
  // amount만큼 당겨서, 팔레트가 달라도(모색 20종) 항상 자연스럽게 탈채도되도록 함.
  function mixHexToGrey(hex, amount){
    try{
      var m = /^#([0-9a-fA-F]{6})$/.exec(hex);
      if(!m) return hex;
      var r = parseInt(m[1].slice(0,2),16), g = parseInt(m[1].slice(2,4),16), b = parseInt(m[1].slice(4,6),16);
      var grey = Math.round((r+g+b)/3);
      r = Math.round(r + (grey-r)*amount);
      g = Math.round(g + (grey-g)*amount);
      b = Math.round(b + (grey-b)*amount);
      function h2(n){ var s = n.toString(16); return s.length < 2 ? "0"+s : s; }
      return "#" + h2(r) + h2(g) + h2(b);
    }catch(e){ return hex; }
  }
  // 78번(24장): 비숑프리제의 "곱슬곱슬 뭉게구름 같은" 털 실루엣용 — 새 그래픽 자산 없이, 기존
  // drawCloudPuff()와 같은 발상(작은 뭉치 블록 여러 개)을 털색으로 재사용해 몸통·머리 윤곽에 스캘럽
  // 느낌의 뭉치를 얹음. sc.curlyFur가 true인 견종에서만 호출됨(현재는 비숑프리제 한정).
  function drawFurPuff(ctx, cx, cy, r, color){
    ctx.fillStyle = color;
    ctx.fillRect(cx - r, cy - Math.round(r*0.4), r*2, Math.max(1, Math.round(r*0.8)));
    ctx.fillRect(cx - Math.round(r*0.6), cy - r, Math.max(1, Math.round(r*1.2)), Math.max(1, Math.round(r*0.6)));
  }

  // 79번(그래픽 업그레이드): 유저가 보내준 "크로스스티치 픽셀아트" 레퍼런스들의 핵심 스타일 요소 —
  // (1) 실루엣 전체를 감싸는 굵고 짙은 아웃라인, (2) 배경과 확실히 분리되는 또렷한 형태 — 를 기존
  // drawPixelDog()/drawWalkFrontDog()의 세밀한 견종별 치수 로직은 전혀 건드리지 않고 덧입히기 위한
  // 공용 후처리 유틸. 두 함수 모두 "실제 화면 ctx가 아니라 임시 오프스크린 캔버스에 평소처럼 그린 뒤,
  // 픽셀 단위로 알파값을 검사해 실루엣 바깥 1칸을 어두운 아웃라인 색으로 채우고, 그 결과 비트맵을
  // 최종적으로 원래 ctx에 한 번에 합성"하는 방식으로 이 함수를 사용함 — 견종별 좌표 계산은 100% 그대로
  // 재사용되고, 오직 "그려진 결과물에 테두리를 두르는" 시각효과만 추가됨.
  var DOG_OUTLINE_COLOR = "#2A2019"; // 모색 팔레트와 무관하게 항상 짙은 다크브라운으로 고정(레퍼런스 전 견종 공통)
  // 80-1번(그래픽팀 버그 리포트 반영): 스프라이트를 "원본 비율 유지 + 접지선에 발이 닿도록 하단
  // 정렬 + 가로 중앙 정렬 + 픽셀아트답게 안티앨리어싱 없이(nearest-neighbor)" 그리는 표준 방식.
  // 원인 조사: (1) "세로로 늘어나 보임"은 실제로는 비율이 강제로 찌그러지는 버그가 아니라(가로폭은
  // 이미 이전부터 spriteH×naturalWidth/naturalHeight로 원본 비율 그대로 산출하고 있었음, 아래 로직
  // 그대로 유지), (2) "스프라이트 주변 검은 사각 테두리"가 진짜 원인 — ctx.imageSmoothingEnabled
  // 기본값(true) 때문에 drawImage()가 스프라이트를 다운스케일할 때 PNG의 이진(0 또는 255) 알파가
  // 경계에서 흐릿하게 번지고(anti-aliasing), 그 번짐이 applyAutoOutline()의 임계값(alpha>10)을 넘어
  // 실루엣이 아니라 이미지 전체의 사각형 경계 부근을 "칠해진 것"으로 오인해 사각형에 가까운 테두리를
  // 그리게 됨(Playwright로 smoothing on/off 비교 렌더링해 직접 재현·확인). ctx.imageSmoothingEnabled =
  // false로 다운스케일을 nearest-neighbor로 강제하면 이진 알파가 그대로 유지되어 실루엣을 따라가는
  // 깔끔한 테두리가 그려짐 — 그래픽팀이 제안한 표준 그리기 함수와 동일한 처방.
  function drawDogSpriteContain(ctx, img, cx, groundRow, oy, targetH){
    ctx.imageSmoothingEnabled = false;
    var w = Math.round(targetH * (img.naturalWidth / img.naturalHeight));
    var h = Math.round(targetH);
    var x = Math.round(cx - w/2);
    var y = Math.round(groundRow - h + oy);
    ctx.drawImage(img, x, y, w, h);
  }
  // 83번: 애니메이션 시트(030-dog-anim-sheets.js)의 프레임 하나를 그림. 표시 크기는 기존 정지 스프라이트와
  // 같은 targetH(H*1.18)를 0번 프레임(서기)의 실제 높이(DOG_ANIM_REF_H)에 맞추는 배율로 잡되, 그 배율이
  // 정수에 가까우면 정수로 스냅해 픽셀이 고르게 보이게 함. 모든 프레임에 같은 배율을 쓰므로 컷 간 크기가
  // 일정하고, 칸 바닥을 접지선(groundRow)에 맞춤. flip=true면 좌우 반전(시트 원본은 전부 왼쪽을 봄).
  function drawDogAnimFrame(ctx, img, frame, cx, groundRow, targetH, flip){
    ctx.imageSmoothingEnabled = false;
    var s = targetH / DOG_ANIM_REF_H;
    var si = Math.round(s);
    if(si >= 1 && Math.abs(s - si) < 0.3) s = si;
    var sx = (frame % DOG_ANIM_COLS) * DOG_ANIM_CELL_W;
    var sy = Math.floor(frame / DOG_ANIM_COLS) * DOG_ANIM_CELL_H;
    var dw = Math.round(DOG_ANIM_CELL_W * s), dh = Math.round(DOG_ANIM_CELL_H * s);
    var x = Math.round(cx - dw/2), y = Math.round(groundRow - dh);
    if(flip){
      ctx.save();
      ctx.translate(x + dw, 0); ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, DOG_ANIM_CELL_W, DOG_ANIM_CELL_H, 0, y, dw, dh);
      ctx.restore();
    } else {
      ctx.drawImage(img, sx, sy, DOG_ANIM_CELL_W, DOG_ANIM_CELL_H, x, y, dw, dh);
    }
  }
  // 84번: 고해상도판 프레임 그리기. 좌표는 150×100 논리 좌표(cx·groundRow)를 캔버스 배율(660/150=4.4)로
  // 옮기고, 크기는 "논리 목표 높이×4.4 ÷ 원본 서기 높이"로 잡되 정수에 가까우면 정수로 스냅 — 웰시코기
  // 성견은 이 값이 약 1.1이라 1로 스냅돼 원본 픽셀이 1:1 그대로 찍힘(리샘플링 없음).
  function drawDogAnimFrameHi(hctx, img, frame, cx, groundRow, targetH, flip){
    var k = hctx.canvas.width / PX_W;
    hctx.imageSmoothingEnabled = false;
    var s = targetH * k / DOG_ANIM_HI_REF_H;
    var si = Math.round(s);
    if(si >= 1 && Math.abs(s - si) < 0.3) s = si;
    var sx = (frame % DOG_ANIM_COLS) * DOG_ANIM_HI_CELL_W;
    var sy = Math.floor(frame / DOG_ANIM_COLS) * DOG_ANIM_HI_CELL_H;
    var dw = Math.round(DOG_ANIM_HI_CELL_W * s), dh = Math.round(DOG_ANIM_HI_CELL_H * s);
    var x = Math.round(cx * k - dw/2), y = Math.round(groundRow * k - dh);
    if(flip){
      hctx.save();
      hctx.translate(x + dw, 0); hctx.scale(-1, 1);
      hctx.drawImage(img, sx, sy, DOG_ANIM_HI_CELL_W, DOG_ANIM_HI_CELL_H, 0, y, dw, dh);
      hctx.restore();
    } else {
      hctx.drawImage(img, sx, sy, DOG_ANIM_HI_CELL_W, DOG_ANIM_HI_CELL_H, x, y, dw, dh);
    }
  }
  // 84번: 마당 위 고해상도 캔버스를 비움 — 매 장면 시작과 엔딩씬(021)에서 호출.
  function yardHiCtx(){
    var c = (typeof el !== "undefined" && el) ? el.pixelDogHiCanvas : null;
    return (c && c.getContext) ? c.getContext("2d") : null;
  }
  function clearYardHiCanvas(){
    var h = yardHiCtx();
    if(h) h.clearRect(0, 0, h.canvas.width, h.canvas.height);
  }
  var _dogOffCanvas = null, _dogOffCtx = null;
  function getDogOffscreenCtx(w, h){
    if(!_dogOffCanvas){
      _dogOffCanvas = document.createElement("canvas");
      _dogOffCtx = _dogOffCanvas.getContext("2d");
    }
    if(_dogOffCanvas.width !== w) _dogOffCanvas.width = w;
    if(_dogOffCanvas.height !== h) _dogOffCanvas.height = h;
    _dogOffCtx.clearRect(0, 0, w, h);
    return _dogOffCtx;
  }
  function hexToRgbTriple(hex){
    var m = /^#([0-9a-fA-F]{6})$/.exec(hex || "");
    if(!m) return [42, 32, 25];
    return [parseInt(m[1].slice(0,2),16), parseInt(m[1].slice(2,4),16), parseInt(m[1].slice(4,6),16)];
  }
  // 80-3번(그래픽팀 버그 리포트 반영): "정수리~이마 사이 투명한 구멍" 수정. 원인 조사 결과 스프라이트
  // PNG 원본 자체엔 내부에 갇힌 투명 픽셀이 전혀 없음(직접 알파채널 디코딩해 flood-fill로 확인) —
  // 실제로는 두 귀(쫑긋 선 귀) 사이의 정상적인 틈(원래 그림에서도 존재하던, 하늘이 비치는 V자 홈)이
  // 원인이었음. 80-2번에서 강아지 체고를 2배 넘게 키우면서 예전엔 몇 픽셀에 불과해 안 보이던 이 틈이
  // 최대 20px 안팎까지 커졌고, applyAutoOutline()이 이 틈도 외곽 실루엣과 똑같이 검은 테두리로 둘러
  // 그리는 바람에 "구멍이 뚫린 것"처럼 보이게 됨. 다리 사이·꼬리 옆 등 실루엣 아래쪽의 "진짜" 오목한
  // 부분(정상적으로 뚫려 보여야 하는 부분)은 절대 건드리면 안 되므로, 실루엣의 맨 위쪽(귀가 있는
  // 구간)에서만 검사.
  // 81번(그래픽팀 신규 스프라이트 반영 중 발견된 버그 수정): 위 80-3번 버전은 "구간이 여러 덩어리로
  // 갈라져 보이면 폭에 상관없이 무조건 메움" 방식이었는데, 이번에 새로 반영한 레퍼런스 기반 스프라이트는
  // (구버전 텍스트 프롬프트 그림과 달리) 쫑긋 선 귀 사이 틈이 훨씬 또렷하고 넓게(수십 px) 그려져 있어 —
  // 이 진짜 귀 사이 여백까지 통째로 메워버리는 바람에 진돗개·허스키 등은 두 귀 사이가 "검은색 끈"처럼
  // 이어 붙고, 보더콜리는 아예 머리 전체가 뭉개진 덩어리로 보이는 새 버그가 생김(유저 실플레이 테스트로
  // 발견) — 정확히 80-3번이 고치려던 "작고 좁은 노이즈성 틈"과ม 오늘 반영한 "실제로 넓게 그려진 정상
  // 귀 사이 여백"을 구분하지 못한 게 원인. 그래서 이제는 각 행에서 "인접한 두 덩어리 사이의 틈 폭"을
  // 개별적으로 재서, MAX_NOTCH_WIDTH(px)보다 좁은 틈만 메우고 그보다 넓은 틈(진짜 귀 사이 여백)은
  // 절대 손대지 않음. 이 값은 Playwright로 12견종×4성장단계를 어질리티·마당 두 배율 모두에서 직접
  // 렌더링해 실측한 뒤 정함 — 정상적인 쫑긋 귀 견종(진돗개·허스키·시바견·웰시코기·보더콜리)은 모든
  // 배율에서 항상 4px보다 훨씬 넓은 틈(최소 5px~최대 수십 px)을 보였고, 아주 작은 노이즈성 틈(예:
  // 포메라니안 일부 성장단계)은 그보다 훨씬 좁았음 — 그 경계 안쪽인 3px로 보수적으로 설정.
  // 81번 추가 수정: 폭 제한만으로는 부족한 사례가 하나 더 있었음 — 보더콜리는 이마의 흰색 블레이즈
  // 무늬(양쪽 검은 귀 사이에 낀 좁고 흰 세로줄)가 다운스케일 과정에서 1~2px짜리 미세한 투명 틈을
  // 만드는데, 이 틈도 폭 기준상 "좁은 노이즈성 틈"으로 오인돼 메워지면서 "가장 가까운 opaque 픽셀"을
  // 왼쪽부터 찾다 보니 흰 블레이즈가 아니라 옆의 검은 귀 색을 주워 칠해버려 블레이즈 전체가 거의
  // 사라지고 머리가 뭉개진 검은 덩어리로 보였음. 좁은 틈이라도 "메울 색"이 양쪽에서 서로 다르면(=서로
  // 다른 무늬 경계를 잇는 것) 절대 메우지 않도록, 틈 좌우의 opaque 색이 비슷할 때만(NOTCH_COLOR_TOL
  // 이내) 채우게 방어 추가 — 같은 색 영역 안의 순수한 다운스케일 틈만 메워지고, 서로 다른 색 무늬
  // 사이(귀↔블레이즈 등)는 항상 원본 그대로 보존됨.
  var NOTCH_MAX_GAP_PX = 3;
  var NOTCH_COLOR_TOL = 40;
  function closeTopSilhouetteNotches(offCtx, w, h){
    var img;
    try{ img = offCtx.getImageData(0, 0, w, h); }catch(e){ return; }
    var data = img.data;
    function opaqueAt(x, y){ return data[(y*w+x)*4+3] > 10; }
    var minY = -1, maxY = -1;
    for(var y=0; y<h && minY<0; y++){
      for(var x=0; x<w; x++){ if(opaqueAt(x,y)){ minY = y; break; } }
    }
    if(minY < 0) return; // 완전히 빈 캔버스(방어)
    for(var y2=h-1; y2>=minY && maxY<0; y2--){
      for(var x2=0; x2<w; x2++){ if(opaqueAt(x2,y2)){ maxY = y2; break; } }
    }
    var bboxH = maxY - minY + 1;
    // 귀는 항상 머리 꼭대기(실루엣 맨 위)에서 시작되므로, 이 범위 안에서만 검사 — 다리 사이 공간(맨
    // 아래쪽)까지는 절대 닿지 않도록 넉넉히 보수적으로 35%로 제한.
    var scanRows = Math.max(3, Math.round(bboxH * 0.35));
    var changed = false;
    for(var y=minY; y<Math.min(h, minY+scanRows); y++){
      // 이 행의 opaque 구간들을 [start,end] 배열로 모음
      var runs = [];
      var inRun = false, runStart = -1;
      for(var x=0; x<w; x++){
        var o = opaqueAt(x,y);
        if(o && !inRun){ inRun = true; runStart = x; }
        else if(!o && inRun){ inRun = false; runs.push([runStart, x-1]); }
      }
      if(inRun) runs.push([runStart, w-1]);
      if(runs.length <= 1) continue; // 이미 하나로 이어진 구간(또는 완전히 빈 행) — 손대지 않음
      // 인접한 두 덩어리 사이의 틈만 개별적으로 검사 — 폭이 NOTCH_MAX_GAP_PX 이하인 좁은 틈만 메움
      for(var ri=0; ri<runs.length-1; ri++){
        var gapStart = runs[ri][1] + 1;
        var gapEnd = runs[ri+1][0] - 1;
        var gapWidth = gapEnd - gapStart + 1;
        if(gapWidth > NOTCH_MAX_GAP_PX) continue; // 넓은 틈(진짜 귀 사이 여백 등) — 절대 메우지 않음
        // 틈 좌우의 색이 서로 다르면(=서로 다른 무늬 경계) 메우지 않음 — 위 주석의 보더콜리 블레이즈 사례 방어
        var leftIdx = (y*w + runs[ri][1]) * 4;
        var rightIdx = (y*w + runs[ri+1][0]) * 4;
        var colorDist = Math.sqrt(
          Math.pow(data[leftIdx]-data[rightIdx],2) +
          Math.pow(data[leftIdx+1]-data[rightIdx+1],2) +
          Math.pow(data[leftIdx+2]-data[rightIdx+2],2)
        );
        if(colorDist > NOTCH_COLOR_TOL) continue;
        for(var x4=gapStart; x4<=gapEnd; x4++){
          var srcIdx = -1;
          for(var lx=x4-1; lx>=runs[ri][0]; lx--){ if(opaqueAt(lx,y)){ srcIdx = y*w+lx; break; } }
          if(srcIdx<0){ for(var rx=x4+1; rx<=runs[ri+1][1]; rx++){ if(opaqueAt(rx,y)){ srcIdx = y*w+rx; break; } } }
          if(srcIdx<0 && y+1<h && opaqueAt(x4,y+1)){ srcIdx = (y+1)*w+x4; }
          if(srcIdx>=0){
            var sp=srcIdx*4, dp=(y*w+x4)*4;
            data[dp]=data[sp]; data[dp+1]=data[sp+1]; data[dp+2]=data[sp+2]; data[dp+3]=255;
            changed = true;
          }
        }
      }
    }
    if(changed) offCtx.putImageData(img, 0, 0);
  }
  // offCtx에 이미 그려진 내용의 실루엣을 읽어, 그 바깥 경계(8방향 인접) 1칸을 outlineHex로 채움.
  // 파이썬 프로토타입(pixel_proto)에서 검증한 "8방향 인접 셀 자동 아웃라인" 알고리즘을 캔버스
  // getImageData/putImageData로 그대로 옮긴 것.
  function applyAutoOutline(offCtx, w, h, outlineHex){
    var img;
    try{ img = offCtx.getImageData(0, 0, w, h); }catch(e){ return; } // 캔버스 미지원 환경 방어
    var data = img.data;
    var n = w*h;
    var filled = new Uint8Array(n);
    for(var i=0;i<n;i++){ filled[i] = data[i*4+3] > 10 ? 1 : 0; }
    var rgb = hexToRgbTriple(outlineHex);
    var toOutline = [];
    for(var y=0;y<h;y++){
      for(var x=0;x<w;x++){
        var idx = y*w+x;
        if(filled[idx]) continue;
        var isEdge = false;
        for(var dy=-1;dy<=1 && !isEdge;dy++){
          for(var dx=-1;dx<=1;dx++){
            if(dx===0 && dy===0) continue;
            var nx=x+dx, ny=y+dy;
            if(nx>=0 && nx<w && ny>=0 && ny<h && filled[ny*w+nx]){ isEdge = true; break; }
          }
        }
        if(isEdge) toOutline.push(idx);
      }
    }
    for(var k=0;k<toOutline.length;k++){
      var p = toOutline[k]*4;
      data[p]=rgb[0]; data[p+1]=rgb[1]; data[p+2]=rgb[2]; data[p+3]=255;
    }
    offCtx.putImageData(img, 0, 0);
  }

  var pixelBlink = false, pixelTailFrame = false, pixelBobUp = false;
  var pixelBlinkTimer = null, pixelTailTimer = null, pixelBobTimer = null;
  // 83번: 마당 화면 전용 "애니메이션 시트 프레임" 요청 — drawPixelIdleDogAnim()이 drawYardDog() 직전에
  // 프레임 번호(0~23)와 좌우 반전 여부를 여기에 넣어두면, drawPixelDog()가 정지 스프라이트 대신 시트의
  // 해당 프레임을 그림. 그리기 직후 항상 null로 되돌려 어질리티·대회·엔딩씬 등 다른 호출부에는 절대
  // 새지 않게 함(그쪽은 지금처럼 정지 스프라이트 그대로).
  var dogAnimFrame = null, dogAnimFlip = false;
  // 84번: 마당 화면이 프레임을 요청할 때만 채워지는 고해상도 캔버스 ctx(#pixelDogHiCanvas). 채워져 있고
  // 고해상도 시트가 준비돼 있으면 개 본체를 이 캔버스에 원본 해상도(1:1)로 그림 — 역시 그리기 직후 null.
  var dogAnimHiCtx = null;

  // 50번: offsetX — 기본은 마당 중앙(cx)이지만, 엔딩씬 '달성' 결과에서는 이동장이 있던 우측 자리에
  // 강아지가 다시 노출돼야 해서(사용자 원안: "이동장이 있던 자리에 반려견이 다시 노출됨") 그 지점으로
  // 실루엣 전체를 그대로 밀어 그릴 수 있도록 함. 다른 모든 호출부(홈 화면·산책 팝업)는 생략 시 0으로 기존과 동일.
  // 53번: forceEyesClosed — 멍멍모드의 수면형 포즈(웅크려 잠들기/꿈꾸는 다리)에서 mood나 blink 타이밍과
  // 무관하게 항상 눈을 감은 모습으로 그리기 위한 선택 인자. 생략하면(undefined/false) 기존 로직 그대로.
  // 77번(기다려 대회): override — 유저의 개가 아닌 "다른 개"(대회 상대견 4마리 등)를 같은 캔버스에
  // 동시에 다른 생김새·색상으로 그려야 할 때 쓰는 선택 인자. {breedId, furA, furADark, furB, furC, furD,
  // eyeColor, gv, sv, mood, noBadges}를 전달하면 전역 state 대신 이 값들을 사용 — 생략(undefined)하면
  // 기존처럼 항상 state(유저 자신의 개)를 그대로 읽어, 기존 호출부는 전부 그대로 안전.
  // 80-2번(마당 화면 원근감 조정): sizeMult — 마당(pixelCanvas) 화면에서만 강아지를 실제 체구 비례와
  // 무관하게 훨씬 크게(사용자 지정: 체고 60~65px) 그리기 위한 배율. 생략(undefined)하면 기존과 동일한
  // 1배로, 어질리티·대회·엔딩씬 등 기존 모든 호출부는 전혀 영향받지 않음 — 아래 drawYardDog() 래퍼를
  // 통해서만 이 값이 채워짐. H(체고)에 곱해지므로 다리·몸통·머리 등 하위 치수 전부가 비율 그대로
  // 함께 커지고(절차적 경로), 스프라이트 경로도 H를 그대로 재사용해 자동으로 같은 비율로 커짐 —
  // 150×100 논리 좌표계 안에서 계산되는 값이라 배경 픽셀과 크기 단위가 항상 맞아떨어짐(CSS 별도 확대 아님).
  function drawPixelDog(realCtx, groundRow, offsetX, forceEyesClosed, override, sizeMult){
    // 79번: 이하 함수 본문은 전부 그대로 두고(견종별 치수·성장/무드/스탯 로직 무변경), 실제 화면
    // realCtx 대신 임시 오프스크린 캔버스에 그린 뒤 맨 끝에서 아웃라인을 두르고 한 번에 합성함.
    // ctx라는 이름을 그대로 재바인딩하므로 아래 250여 줄의 기존 ctx.fillRect(...) 호출은 단 한 줄도
    // 손대지 않아도 자동으로 오프스크린 쪽에 그려짐. realCtx는 caller가 이미 걸어둔 transform
    // (idle 포즈의 save/translate/rotate/scale 등)을 그대로 유지하고 있어, 마지막 drawImage 한 번에
    // 그 변형이 동일하게 적용됨(각 도형에 개별 적용하던 것과 최종 결과는 동일).
    // 79-1번(버그 수정): 오프스크린 캔버스를 PX_W×PX_H(150×100)로 고정해뒀던 게 원인이 되어, 이보다
    // 넓은 실제 캔버스(예: [기다려 대회]의 #competitionCanvas, 290×108)에 그릴 때 offsetX가 150을
    // 넘어가는 개체(대회 5단상 중 뒤쪽 슬롯들)가 오프스크린 밖으로 잘려 사라지고, 합성(drawImage)도
    // (0,0)~(150,100) 영역에만 이뤄져 캔버스 나머지 부분이 비어 보이는 문제가 있었음(사용자가 실플레이 중
    // 발견해 보고). 오프스크린 크기를 realCtx가 실제로 그려지는 캔버스의 물리적 크기(width/height 속성)에
    // 맞춰 매 호출마다 동적으로 잡도록 수정 — 마당(pixelCanvas)·산책(walkPixelCanvas)·어질리티(agilityCanvas)는
    // 전부 기존과 동일한 150×100이라 이 변경으로 달라지는 게 없고, 대회(competitionCanvas, 290×108)만
    // 실제 캔버스 크기에 맞는 오프스크린을 받게 됨. realCtx.canvas가 없는 극단적 방어 상황에서만 기존
    // PX_W/PX_H로 폴백.
    var dogOffW = (realCtx && realCtx.canvas && realCtx.canvas.width) || PX_W;
    var dogOffH = (realCtx && realCtx.canvas && realCtx.canvas.height) || PX_H;
    var ctx = getDogOffscreenCtx(dogOffW, dogOffH);
    var ov = override || null;
    var breedId = (ov && ov.breedId) ? ov.breedId : (state.breed || "golden");
    // 29번: 믹스견은 전용 실루엣이 없어, 온보딩 때 매칭된 두 견종 중 체구 출처로 뽑힌 쪽의 픽셀 지오메트리를 그대로 재사용
    if(!ov && breedId === "mix" && state.mixGeoBreed){ breedId = state.mixGeoBreed; }
    var sc = BREED_PXSCALE[breedId] || BREED_PXSCALE.golden;
    var earStyle = sc.earStyle || "floppy";
    var tailStyle = sc.tailStyle || "wag";
    // 70번(20장): 성장 단계별 시각 변수 — 체고(H)에 스케일을 곱해 다리·몸통·머리 등 모든 하위 치수가
    // 비율 그대로 함께 줄어들게 함(다리 길이가 짧아져도 bodyBottom=groundRow-legH 공식 덕에 발은 항상
    // 접지선에 그대로 붙어있음 — 별도 캔버스 좌표 보정 불필요).
    var gv = (ov && ov.gv) ? ov.gv : growthVisual();
    // 75번(21장): 누적 스탯 기반 시각 개성화 입력값 — growthVisual()과 나란히, drawPixelDog()의
    // 기존 계산식에 배율/오프셋만 얹는 식으로 소비함(새 그래픽 자산 없음, statVisual() 주석 참고).
    var sv = (ov && ov.sv) ? ov.sv : statVisual();
    // 78번: 푸들 소형/미디엄/스탠다드 크기 클래스 배율(breedSizeScale, 다른 견종은 항상 1)을
    // 성장단계 스케일과 곱연산으로 함께 적용 — 24장 사용자 지정 그대로.
    // 80-2번: sizeMult(마당 화면 전용, drawYardDog() 경유시에만 1이 아닌 값)를 H에 곱연산으로 추가.
    // H 하나에서 L/legH/bodyH/headH/bodyW/headW 등 하위 치수가 전부 파생되므로(위 주석 참고), 절차적
    // 경로는 비율 그대로 커지고, 스프라이트 경로도 targetH가 H*1.18이라 자동으로 동일 배율로 커짐 —
    // 150×100 논리 좌표계 안에서 계산되는 값이라 배경 픽셀과 항상 크기 단위가 맞음(CSS 확대 아님).
    var sizeMultVal = (typeof sizeMult === "number" && sizeMult > 0) ? sizeMult : 1;
    var H = Math.max(6, Math.round(sc.heightCm / CM_PER_PX * gv.scale * breedSizeScale() * sizeMultVal));
    var L = Math.max(6, Math.round(H * sc.lengthRatio));
    // 민첩성: 다리 비율 소폭 조정
    var legH = Math.max(2, Math.round(H * sc.legRatio * sv.legHMult));
    var bodyH = Math.max(3, Math.round(H * (sc.bodyHRatio || 0.40)));
    var headH = Math.max(3, H - legH - bodyH);
    // 근력: 체형(가슴·어깨 폭) 비율 소폭 조정
    var bodyW = Math.max(4, Math.round(L * 0.56 * sv.bodyWMult));
    // 머리 폭은 "길이"가 아니라 "체고"를 기준으로 잡아, 몸통이 길게 늘어난 견종(웰시코기 등)도
    // 머리만 같이 늘어나 보이지 않고 자연스러운 크기를 유지하게 함
    var headW = Math.max(4, Math.round(H * 0.40));
    // 78번(24장): 비숑프리제 "큰 대두" — 다른 치수(다리·몸통)는 그대로 두고 머리 폭·높이만 배율.
    if(sc.headScaleMult){
      headH = Math.round(headH * sc.headScaleMult);
      headW = Math.round(headW * sc.headScaleMult);
    }

    var cx = Math.round(PX_W/2) + 2 + (offsetX || 0);
    var bodyLeft = cx - Math.round(bodyW/2);
    var bodyRight = bodyLeft + bodyW;
    var bodyBottom = groundRow - legH;
    var bodyTop = bodyBottom - bodyH;
    // 머리는 몸통 앞쪽(오른쪽) 끝에 상당 부분 겹쳐 붙어, 목이 끊겨 보이지 않도록 함
    // 민첩성: 스프린터형으로 살짝 앞으로 기운 자세(머리를 미세하게 앞쪽으로 당김)
    var headLeft = bodyRight - Math.round(headW*0.68) + (sv.leanForwardPx || 0);
    // 70번: 찹찹츄는 headDroop만큼 머리를 살짝 낮춰 그려 "고개가 살짝 낮음" 자세를 표현
    // 75번: 수행력이 높을수록 그 처짐을 완화(자세가 반듯하고 정렬됨)
    var effectiveHeadDroop = Math.round((gv.headDroop || 0) * (1 - sv.postureStraighten * 0.6));
    var headBottom = bodyTop + Math.round(bodyH*0.55) + effectiveHeadDroop;
    var headTop = headBottom - headH;
    var headRight = headLeft + headW;

    var mood = (ov && ov.mood) ? ov.mood : moodOf();
    var oy = (mood !== "sleepy" && !reduceMotion() && pixelBobUp) ? -1 : 0;

    var furA = (ov && ov.furA) || cssVar("--fur-a", "#E7C79A");
    var furADark = (ov && ov.furADark) || cssVar("--fur-a-dark", "#C79E68");
    var furB = (ov && ov.furB) || cssVar("--fur-b", "#B98A5E");
    var furC = (ov && ov.furC) || cssVar("--fur-c", "#EDEDED");
    var furD = (ov && ov.furD) || cssVar("--fur-d", "#4A4038");
    var eyeColor = (ov && ov.eyeColor) || cssVar("--eye-color", furD);
    // 70번: 찹찹츄는 몸통·귀 털색을 옅게 탈채도(전신에 은은하게) — 코·눈동자(furD/eyeColor)는 그대로
    // 두어 표정이 흐려지지 않게 함. "입가·눈가 회색 톤" 디테일 포인트는 아래 주둥이/눈 블록 근처에서
    // 별도로 반투명 패치를 얹어 표현.
    if(gv.grey){
      furA = mixHexToGrey(furA, 0.32);
      furADark = mixHexToGrey(furADark, 0.32);
    }

    // 80번(그래픽팀 협업): AI 스프라이트 파일럿 적용 — 절차적 드로잉 대신 미리 그려둔 견종별×성장단계별
    // ×팔레트별 스프라이트 이미지가 있으면 그걸 합성하고, 없으면(아직 못 만든 조합·로딩 전·믹스견 등)
    // 기존 절차적 드로잉으로 안전하게 폴백함. override(대회 상대견) 쪽은 coatId/stageIdx를 명시로
    // 넘겨받고, 유저 자신의 개는 state.coatId/state.growthStage를 그대로 읽음. 믹스견(시고르자브)은
    // 전용 스프라이트가 없으므로, 모색 출처 접두사가 지오메트리 견종(breedId)과 일치할 때만 스프라이트를
    // 시도하고 그 외엔 coatId를 null로 둬 항상 절차적 드로잉으로 빠지게 함(그래픽팀 오픈이슈 5번).
    var stageIdx = (ov && typeof ov.stageIdx === "number") ? ov.stageIdx : (typeof state.growthStage === "number" ? state.growthStage : 2);
    var coatId = null;
    if(ov){
      coatId = ov.coatId || null;
    } else {
      coatId = state.coatId || null;
      if(state.breed === "mix" && coatId){
        var mixPrefix = breedId + "_";
        coatId = coatId.indexOf(mixPrefix) === 0 ? coatId.slice(mixPrefix.length) : null;
      }
    }
    var spriteImg = coatId ? getDogSpriteImage(breedId, stageIdx, coatId) : null;
    // 83번: 마당 화면이 애니메이션 프레임을 요청했고(dogAnimFrame) 이 견종·단계·모색의 시트가 있으면
    // 그 프레임을 그림 — 시트 원화에 이미 외곽선이 있으므로 아래의 귀 틈 메우기·자동 외곽선은 건너뜀
    // (그래픽 자산을 "최대한 변경 없이 그대로 배치"하는 원칙).
    var animSheetImg = (!ov && coatId && typeof dogAnimFrame === "number") ? getDogAnimSheet(breedId, stageIdx, coatId) : null;

    var animSheetHiImg = (animSheetImg && dogAnimHiCtx) ? getDogAnimSheetHi(breedId, stageIdx, coatId) : null;

    if(animSheetHiImg){
      // 84번: 원본 해상도 경로 — 개 본체는 겹쳐진 고해상도 캔버스에만 그리고, 이 저해상도 오프스크린에는
      // 아무것도 그리지 않음(아래 배지 등은 기존대로 저해상도 캔버스에 남음).
      drawDogAnimFrameHi(dogAnimHiCtx, animSheetHiImg, dogAnimFrame, cx, groundRow, H * 1.18, dogAnimFlip);
    } else if(animSheetImg){
      drawDogAnimFrame(ctx, animSheetImg, dogAnimFrame, cx, groundRow, H * 1.18, dogAnimFlip);
    } else if(spriteImg){
      // 스프라이트 경로: 절차적 좌표(legH/bodyH/headH 등)는 배지 위치 계산 등에 계속 쓰이므로 그대로 두고,
      // 실루엣만 이미지 한 장으로 대체. 체고(H)에 귀·꼬리 여유분(헤드룸)을 곱해 세로 크기를 잡고, 스프라이트
      // 원본 가로세로 비율을 유지한 채 가로 크기를 산출 — groundRow(접지선)에 바닥을 맞추고 cx(중심)에 가로
      // 중앙 정렬. Playwright 시각 확인으로 튜닝된 값(80번). 80-1번: 실제 그리기는 drawDogSpriteContain()으로
      // 위임 — 비율 유지 계산은 동일하고, ctx.imageSmoothingEnabled=false가 추가돼 다운스케일 시 사각형
      // 테두리 아티팩트가 생기지 않음(위 함수 정의부 주석 참고).
      drawDogSpriteContain(ctx, spriteImg, cx, groundRow, oy, H * 1.18);
    } else {
    // 다리 — 앞다리/뒷다리 각 2개씩, "먼 쪽 다리 + 가까운 쪽 다리"로 겹쳐 그려 네 발 짐승처럼 보이게 함
    var legW = Math.max(1, Math.round(bodyW*0.14));
    var legGap = Math.max(1, Math.round(legW*0.85));
    var pawH = Math.max(1, Math.round(legH*0.22));
    var backBaseX = bodyLeft + Math.round(bodyW*0.14);
    var frontBaseX = bodyRight - Math.round(bodyW*0.14) - legW;
    function drawLegPair(baseX){
      ctx.fillStyle = furADark;
      ctx.fillRect(baseX - legGap, bodyBottom + oy, legW, legH); // 먼 쪽 다리
      ctx.fillRect(baseX, bodyBottom + oy, legW, legH);          // 가까운 쪽 다리
      ctx.fillStyle = furD;
      ctx.fillRect(baseX - legGap, bodyBottom + legH - pawH + oy, legW, pawH);
      ctx.fillRect(baseX, bodyBottom + legH - pawH + oy, legW, pawH);
    }
    drawLegPair(backBaseX);
    drawLegPair(frontBaseX);

    // 꼬리 (품종별 형태)
    var tailW = Math.max(1, Math.round(L*0.15));
    var tailH = Math.max(1, Math.round(bodyH*0.5));
    ctx.fillStyle = furA;
    if(tailStyle === "curl"){
      // 진돗개/시바견: 등 위로 동그랗게 말린 꼬리
      var curlSize = Math.max(3, Math.round(bodyH*0.6));
      var curlX = bodyLeft - Math.round(curlSize*0.25);
      var curlY = bodyTop - Math.round(curlSize*0.4);
      ctx.fillRect(curlX, curlY + oy, curlSize, curlSize);
      ctx.fillStyle = furADark;
      var innerSize = Math.max(1, Math.round(curlSize*0.4));
      ctx.fillRect(curlX + Math.round(curlSize*0.28), curlY + Math.round(curlSize*0.24) + oy, innerSize, innerSize);
    } else if(tailStyle === "plume"){
      // 포메라니안: 풍성하게 부풀어 오른 꼬리
      var plumeW = Math.max(2, Math.round(tailW*1.7));
      var plumeH = Math.max(2, Math.round(tailH*1.7));
      ctx.fillRect(bodyLeft - plumeW + 2, bodyTop - Math.round(plumeH*0.3) + oy, plumeW, plumeH);
    } else if(tailStyle === "stub"){
      // 웰시코기: 짧게 뭉툭한 꼬리
      var stubW = Math.max(1, Math.round(tailW*0.7));
      var stubH = Math.max(1, Math.round(tailH*0.65));
      ctx.fillRect(bodyLeft - stubW + 1, bodyBottom - stubH + oy, stubW, stubH);
    } else if(tailStyle === "otter"){
      // 래브라도: 두툼하고 곧게 뻗은 "수달 꼬리" — 75번: 친화력이 높으면 기본값으로 살짝 들려있음
      ctx.fillRect(bodyLeft - tailW, bodyTop + Math.round(bodyH*0.35) - sv.tailLiftPx + oy, tailW + 1, tailH);
    } else {
      // 골든 리트리버/보더콜리: 부드럽게 살랑이는 꼬리
      var tailX = bodyLeft - tailW + 1;
      var tailY;
      if(mood === "sad"){ tailY = bodyBottom - Math.round(tailH*0.5); }
      else if(mood === "sleepy"){ tailY = bodyTop + Math.round(bodyH*0.25); }
      // 75번: 친화력이 높으면 기본값으로 살짝 들려있음(슬프거나 졸릴 때는 그대로 두어 감정 표현 유지)
      else { tailY = (pixelTailFrame ? (bodyTop - Math.round(tailH*0.15)) : (bodyTop + Math.round(bodyH*0.3))) - sv.tailLiftPx; }
      ctx.fillRect(tailX, tailY + oy, tailW, tailH);
    }

    // 몸통
    ctx.fillStyle = furA;
    ctx.fillRect(bodyLeft, bodyTop + oy, bodyW, bodyH);

    // 79번: 가슴/배 밝은 패치 — 유저가 보내준 레퍼런스 대부분이 공통적으로 갖고 있던 특징(몸통 앞쪽
    // 아래에 furC 톤의 밝은 가슴털)을 견종 불문 공통으로 얹어 실루엣에 입체감을 더함. 머리가 붙는
    // 몸통 앞쪽(오른쪽) 아래쪽에 배치.
    var chestW = Math.max(1, Math.round(bodyW*0.4));
    var chestH = Math.max(1, Math.round(bodyH*0.6));
    var chestX = bodyRight - chestW - Math.round(bodyW*0.08);
    var chestY = bodyBottom - chestH;
    ctx.fillStyle = furC;
    ctx.fillRect(chestX, chestY + oy, chestW, chestH);

    // 75번: 건강함 → 털 하이라이트(윤기) 레이어 강화 — 등줄기를 따라 옅은 밝은 띠를 얹어 표현
    if(sv.furShineAlpha > 0){
      ctx.save();
      ctx.globalAlpha = sv.furShineAlpha;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(bodyLeft + Math.round(bodyW*0.08), bodyTop + oy, Math.round(bodyW*0.84), Math.max(1, Math.round(bodyH*0.16)));
      ctx.restore();
    }

    // 엉덩이 뽕(rumpBump) — 웰시코기처럼 봉긋하고 풍성한 뒷모습을 가진 견종만
    if(sc.rumpBump){
      var rumpW = Math.max(2, Math.round(bodyW*0.3));
      var rumpH = Math.max(2, Math.round(bodyH*0.32));
      ctx.fillStyle = furA;
      ctx.fillRect(bodyLeft, bodyTop - rumpH + Math.round(rumpH*0.35) + oy, rumpW, rumpH);
    }

    // 78번: 곱슬곱슬 뭉게구름 실루엣(비숑프리제) — 몸통 윤곽을 따라 작은 뭉치를 얹어 스캘럽 느낌을 냄
    if(sc.curlyFur){
      var bPuffR = Math.max(2, Math.round(bodyH*0.22));
      [[bodyLeft+bodyW*0.15, bodyTop],[bodyLeft+bodyW*0.5, bodyTop-bPuffR*0.3],[bodyLeft+bodyW*0.85, bodyTop],
       [bodyLeft-bPuffR*0.3, bodyTop+bodyH*0.5],[bodyRight+bPuffR*0.3, bodyTop+bodyH*0.5]].forEach(function(p){
        drawFurPuff(ctx, p[0], p[1]+oy, bPuffR, furA);
      });
    }

    // 머리 (몸통보다 먼저 겹치는 부분을 자연스럽게 덮도록 몸통 다음에 그림)
    ctx.fillStyle = furA;
    ctx.fillRect(headLeft, headTop + oy, headW, headH);

    // 78번: 머리 쪽 곱슬 뭉치도 함께(귀·눈·주둥이는 이후에 그려져 또렷하게 그 위에 얹힘)
    if(sc.curlyFur){
      var hPuffR = Math.max(2, Math.round(headH*0.26));
      [[headLeft+headW*0.2, headTop],[headLeft+headW*0.5, headTop-hPuffR*0.3],[headLeft+headW*0.8, headTop]].forEach(function(p){
        drawFurPuff(ctx, p[0], p[1]+oy, hPuffR, furA);
      });
    }

    // 귀 — "먼 쪽 귀 + 가까운 쪽 귀" 두 개를 살짝 겹쳐 그려, 옆모습이어도 귀가 하나만 있는
    // 것처럼 허전해 보이지 않게 함. 처진 귀는 아래로 늘어지고, 쫑긋 선 귀는 위로 솟음.
    // 모색과 무관하게 항상 또렷이 구분되도록 각 팔레트의 "짙은" 색(aDark)을 사용
    // 70번: 털뭉치는 귀가 조금 더 쫑긋(earPerk>1), 찹찹츄는 살짝 처짐(earPerk<1)
    // 75번: 이해력이 높으면 귀가 항상 쫑긋 선 기본 자세(확대), 공격성이 높으면 살짝 뒤로 젖혀진 인상(축소)
    var earScale = (sc.earScale || 1) * gv.earPerk * sv.earAlertMult * sv.earBackMult;
    if(earStyle === "erect"){
      var earW = Math.max(2, Math.round(headW*0.30*earScale));
      var earH = Math.max(2, Math.round(headH*0.62*earScale));
      var farW = Math.max(1, Math.round(earW*0.8)), farH = Math.max(1, Math.round(earH*0.8));
      var farX = headLeft + Math.round(headW*0.0);
      var farY = headTop - farH + Math.round(farH*0.3);
      var nearX = headLeft + Math.round(headW*0.32);
      var nearY = headTop - earH + Math.round(earH*0.15);
      ctx.fillStyle = furADark;
      ctx.fillRect(farX, farY + oy, farW, farH);   // 먼 쪽 귀 (뒤로 살짝 치우쳐 작게)
      ctx.fillRect(nearX, nearY + oy, earW, earH); // 가까운 쪽 귀 (앞쪽, 원래 크기)
    } else {
      // 처진 귀: 머리 실루엣 뒤쪽(headLeft) 바깥으로 절반 이상 튀어나와 걸리도록 해서
      // 얼굴 위의 무늬가 아니라 목 옆에 늘어진 귀로 보이게 함
      var fearW = Math.max(2, Math.round(headW*0.4*earScale));
      var fearH = Math.max(3, Math.round(headH*1.35*earScale));
      var nearEarX = headLeft - Math.round(fearW*0.55);
      var nearEarY = headTop + Math.round(headH*0.3);
      var farEarW = Math.max(1, Math.round(fearW*0.4)), farEarH = Math.max(1, Math.round(fearH*0.55));
      var farEarX = nearEarX - Math.round(farEarW*0.5);
      var farEarY = nearEarY - Math.round(farEarH*0.25);
      ctx.fillStyle = furADark;
      ctx.fillRect(farEarX, farEarY + oy, farEarW, farEarH);   // 먼 쪽 귀 (살짝 뒤에서 빼꼼)
      ctx.fillRect(nearEarX, nearEarY + oy, fearW, fearH);     // 가까운 쪽 귀 (주로 보이는 귀)
    }

    // 주둥이 — 머리 앞쪽 경계 너머로 튀어나오게 그려 개의 얼굴처럼 보이게 함
    var snoutFactor = sc.snoutRatio || 0.5;
    var snoutW = Math.max(2, Math.round(headW*snoutFactor));
    var snoutH = Math.max(2, Math.round(headH*0.42));
    var snoutLeft = headRight - Math.round(snoutW*0.3);
    var snoutTop = headBottom - snoutH;
    ctx.fillStyle = furC;
    ctx.fillRect(snoutLeft, snoutTop + oy, snoutW, snoutH);

    // 코 끝 (주둥이 맨 앞쪽의 짙은 점)
    var noseW = Math.max(1, Math.round(snoutW*0.34));
    var noseH = Math.max(1, Math.round(snoutH*0.5));
    ctx.fillStyle = furD;
    ctx.fillRect(snoutLeft + snoutW - noseW, snoutTop + Math.round(snoutH*0.18) + oy, noseW, noseH);

    // 70번(찹찹츄 디테일 포인트): 입가·눈가에 옅은 회색 톤 — 반투명 패치를 배경(주둥이/얼굴) 위에
    // 얹어서 표현하고, 눈은 이 패치보다 나중에 그려 또렷함을 유지함(패치가 눈동자를 가리지 않게).
    if(gv.grey){
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#B7B2A4";
      // 입가: 주둥이 뿌리 쪽에 옅게
      ctx.fillRect(snoutLeft - Math.round(snoutW*0.1), snoutTop + Math.round(snoutH*0.05) + oy, Math.round(snoutW*0.55), Math.round(snoutH*0.45));
      // 눈가: 눈 주변에 옅게(아래에서 계산할 eyeY와 같은 기준을 앞당겨 사용)
      var greySpot = Math.max(2, Math.round(headW*0.22));
      var greyEyeY = headTop + Math.round(headH*0.42) - Math.round(greySpot*0.3);
      ctx.fillRect(headLeft + Math.round(headW*0.24), greyEyeY + oy, greySpot, greySpot);
      ctx.fillRect(headLeft + Math.round(headW*0.56), greyEyeY + oy, greySpot, greySpot);
      ctx.restore();
    }

    // 눈 — 두 개, 감은 눈은 가는 선으로 표현
    var eyesClosed = forceEyesClosed ? true : (mood === "sleepy" ? true : pixelBlink);
    var eyeY = headTop + Math.round(headH*0.42);
    if(!eyesClosed){
      // 75번: 충성도·친화력이 높으면 눈매가 부드럽고 둥글게(확대), 공격성이 높으면 눈매가 날카롭게(축소)
      var eyeSize = Math.max(1, Math.round(headW*0.14 * sv.eyeSoftMult * sv.eyeSharpMult));
      ctx.fillStyle = eyeColor;
      ctx.fillRect(headLeft + Math.round(headW*0.32), eyeY + oy, eyeSize, eyeSize);
      ctx.fillRect(headLeft + Math.round(headW*0.6), eyeY + oy, eyeSize, eyeSize);
    } else {
      var lineW = Math.max(1, Math.round(headW*0.16));
      ctx.fillStyle = furD;
      ctx.fillRect(headLeft + Math.round(headW*0.30), eyeY + oy, lineW, 1);
      ctx.fillRect(headLeft + Math.round(headW*0.58), eyeY + oy, lineW, 1);
    }
    } // 80번: spriteImg 유무 분기(if/else) 종료 — 이 아래 배지·아웃라인·합성은 두 경로 공통으로 계속 실행

    // 75번(21장): 능력 보유 → 시각적 표식(원칙만 반영) — 취득한 능력(catalog: 접두사) 하나당 머리 위에
    // 작은 점 하나씩, 최대 ABILITY_BADGE_MAX개까지만 그려 화면이 어지러워지지 않게 함. 긍정 능력은
    // 밝은 초록, 부정 능력은 탁한 주황으로 구분(개별 능력별 구체 모양·색 매핑은 다음 라운드 오픈 이슈).
    var badgeAbilities = (ov && ov.noBadges) ? [] : ownedCatalogAbilities();
    if(badgeAbilities.length){
      var badgeCount = Math.min(badgeAbilities.length, ABILITY_BADGE_MAX);
      var badgeSize = Math.max(1, Math.round(headW*0.09));
      var badgeGap = Math.max(1, Math.round(badgeSize*0.6));
      var badgeRowW = badgeCount*badgeSize + (badgeCount-1)*badgeGap;
      var badgeStartX = headLeft + Math.round(headW/2) - Math.round(badgeRowW/2);
      var badgeY = headTop - badgeSize - Math.max(1, Math.round(headH*0.12));
      for(var bi=0; bi<badgeCount; bi++){
        ctx.fillStyle = badgeAbilities[bi].positive ? "#5FBF6B" : "#D98A3D";
        ctx.fillRect(badgeStartX + bi*(badgeSize+badgeGap), badgeY + oy, badgeSize, badgeSize);
      }
    }

    // 80-3번: 아웃라인을 두르기 전에, 실루엣 맨 위쪽(귀 부근)에 생길 수 있는 "갈라진 틈"을 먼저
    // 메움 — 위 closeTopSilhouetteNotches() 정의부 주석 참고.
    if(!animSheetImg) closeTopSilhouetteNotches(ctx, dogOffW, dogOffH);
    // 79번: 오프스크린에 다 그려진 실루엣에 굵은 아웃라인을 두른 뒤, 캐릭터가 실제로 보여야 할
    // realCtx로 한 번에 합성(캐릭터가 idle 포즈 등으로 이미 걸어둔 transform은 realCtx 쪽에 그대로
    // 남아있으므로 drawImage 한 번으로 기존과 동일하게 반영됨).
    if(!animSheetImg) applyAutoOutline(ctx, dogOffW, dogOffH, DOG_OUTLINE_COLOR);
    realCtx.drawImage(ctx.canvas, 0, 0);
  }

  // 27번: 픽셀모드 배경 — 기기 시각으로 낮/밤은 항상 정확히 반영하고, 위치 권한과 네트워크가
  // 허용되는 경우에만 실제 날씨를 덧입힘. 공개된 페이지는 임의 서버로의 네트워크 요청이 막혀있을 수
  // 있어(플랫폼 보안 정책), 그런 환경에서는 조용히 "맑음"으로 대체되고 낮/밤만 정확히 반영됨.
  // 32번: lastRainAt — "비온뒤"(WALK-048) 조건 판정을 위해 마지막으로 비/폭풍이 관측된 시각을 기록
  var WEATHER_STATE = { condition:"clear", fetchedAt:0, lastRainAt:0 };
  function isDaytimeNow(){
    var h = new Date().getHours();
    return h >= 6 && h < 19;
  }
  function weatherCodeToCondition(code){
    if(code === 0) return "clear";
    if(code === 1 || code === 2) return "cloudy";
    if(code === 3) return "overcast";
    if(code >= 45 && code <= 48) return "fog";
    if(code >= 51 && code <= 67) return "rain";
    if(code >= 71 && code <= 77) return "snow";
    if(code >= 80 && code <= 82) return "rain";
    if(code >= 85 && code <= 86) return "snow";
    if(code >= 95) return "storm";
    return "clear";
  }
  function tryFetchWeather(){
    if(WEATHER_STATE.fetchedAt && (Date.now() - WEATHER_STATE.fetchedAt) < 30*60000) return; // 30분 캐시
    if(!navigator.geolocation || typeof fetch !== "function") return;
    try{
      navigator.geolocation.getCurrentPosition(function(pos){
        var lat = pos.coords.latitude, lon = pos.coords.longitude;
        var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current_weather=true";
        fetch(url).then(function(res){ return res.json(); }).then(function(data){
          if(data && data.current_weather){
            WEATHER_STATE.condition = weatherCodeToCondition(data.current_weather.weathercode);
            WEATHER_STATE.fetchedAt = Date.now();
            // 32번: "비온뒤"(WALK-048) 판정용 — 비/폭풍이 관측될 때마다 시각을 갱신
            if(WEATHER_STATE.condition === "rain" || WEATHER_STATE.condition === "storm"){
              WEATHER_STATE.lastRainAt = Date.now();
            }
            if(state.pixelMode) drawPixelScene();
          }
        }).catch(function(){ /* 네트워크가 막혀있으면 기본값(맑음)을 그대로 사용 */ });
      }, function(){ /* 위치 권한 거부 — 기본값 유지 */ }, { timeout:6000 });
    }catch(e){ /* 조용히 무시하고 기본값 유지 */ }
  }
  // 67번(신규): 배경 하늘색은 실제 접속 시각이 아니라 "게임 속 시간"(state.time.hour, 06~22시,
  // 64번에서 도입된 게임시계)을 기준으로 4단계로 나눠 반영 — 사용자 지정 구간 그대로: 아침 06~10시 /
  // 낮 11~16시 / 노을·저녁 17~19시 / 밤 20~22시(+방어적 기본값). 산책 이벤트 조건에 쓰이는
  // isDaytimeNow()/timeBand()(58번, 실제 기기 시각 기준 — "이 경계는 절대 건드리지 않는다"고 이미
  // 확정된 별개 시스템)는 전혀 건드리지 않고, 배경 전용으로 새 함수를 분리함.
  function gameSkyBand(){
    var h = (typeof state !== "undefined" && state.time && typeof state.time.hour === "number") ? state.time.hour : 6;
    if(h >= 6 && h <= 10) return "morning";
    if(h >= 11 && h <= 16) return "day";
    if(h >= 17 && h <= 19) return "evening";
    return "night";
  }
  // 67번: 시간대(4종) × 실제 관측 날씨(7종, weatherCodeToCondition 결과)의 하늘 그라디언트 표를
  // 손으로 지정 — 색상 보간 함수 대신 명시적 표로 관리해 팔레트를 눈으로 바로 확인·조정할 수 있게 함.
  // 각 값은 [오프셋, 색상] 배열이라 createLinearGradient에 그대로 addColorStop으로 먹임(3단 그라디언트도 가능).
  var SKY_PALETTES = {
    morning: {
      clear:    [[0,"#8FB8DE"],[0.55,"#BFDCE6"],[1,"#F7DCB0"]],
      cloudy:   [[0,"#9FB9CE"],[0.55,"#C7D6D6"],[1,"#EAD9BE"]],
      overcast: [[0,"#A7ADAE"],[1,"#D8CDBC"]],
      fog:      [[0,"#B7BDB8"],[1,"#E2D9C8"]],
      rain:     [[0,"#5E6B78"],[1,"#9C9587"]],
      storm:    [[0,"#4C5560"],[1,"#847E77"]],
      snow:     [[0,"#B9CBD8"],[1,"#EBE3D6"]]
    },
    day: {
      clear:    [[0,"#6FB6E8"],[1,"#DCEFD2"]],
      cloudy:   [[0,"#A9C3D6"],[1,"#DCE6D6"]],
      overcast: [[0,"#9AA6AC"],[1,"#C7CFC7"]],
      fog:      [[0,"#9AA6AC"],[1,"#C7CFC7"]],
      rain:     [[0,"#6E7C89"],[1,"#A7AF9E"]],
      storm:    [[0,"#5B6672"],[1,"#8D9483"]],
      snow:     [[0,"#C7D6DE"],[1,"#E8EEE4"]]
    },
    evening: {
      clear:    [[0,"#4C4A7C"],[0.5,"#C96A4E"],[1,"#F6B65E"]],
      cloudy:   [[0,"#565575"],[0.5,"#B87C63"],[1,"#E7C588"]],
      overcast: [[0,"#5B5A66"],[1,"#9C8C82"]],
      fog:      [[0,"#605F6C"],[1,"#A69A8E"]],
      rain:     [[0,"#33313F"],[1,"#5E5850"]],
      storm:    [[0,"#28262E"],[1,"#4A443E"]],
      snow:     [[0,"#4C4D6A"],[1,"#9598A0"]]
    },
    night: {
      clear:    [[0,"#151A34"],[1,"#3C3F5C"]],
      cloudy:   [[0,"#20253E"],[1,"#41425A"]],
      overcast: [[0,"#232B48"],[1,"#42465F"]],
      fog:      [[0,"#242A3E"],[1,"#454A5C"]],
      rain:     [[0,"#10142A"],[1,"#2E3242"]],
      storm:    [[0,"#0C0F22"],[1,"#282A38"]],
      snow:     [[0,"#232E4A"],[1,"#4E566E"]]
    }
  };
  // 67번: 은은한 장식 구름 한 송이(테두리 없는 단순 픽셀 뭉치 3단) — 실제 관측 날씨와 무관하게 항상
  // 살짝 떠 있어 "구름"을 표현하고, 날씨가 실제로 흐리다면 아래 기존 오버레이가 더 진하게 덧그려짐.
  function drawCloudPuff(ctx, x, y){
    ctx.fillRect(x, y, 14, 4);
    ctx.fillRect(x + 3, y - 2, 9, 3);
    ctx.fillRect(x - 2, y + 3, 18, 2);
  }
  function drawPixelSky(ctx, groundRow){
    var band = gameSkyBand();
    var cond = WEATHER_STATE.condition;
    var palette = SKY_PALETTES[band] || SKY_PALETTES.day;
    var stops = palette[cond] || palette.clear;

    var grad = ctx.createLinearGradient(0, 0, 0, groundRow);
    stops.forEach(function(s){ grad.addColorStop(s[0], s[1]); });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, PX_W, groundRow);

    // 해/달/별 — 시간대별로 위치·색·크기를 다르게(아침=낮게 뜬 은은한 해, 낮=높이 뜬 밝은 해,
    // 저녁=낮게 지는 크고 붉은 해, 밤=달+별). 맑음/흐림일 때만(비·눈·안개엔 해가 안 보이는 게 자연스러움)
    if(cond === "clear" || cond === "cloudy"){
      if(band === "morning"){
        ctx.fillStyle = "#FFE2A6"; ctx.fillRect(18, 30, 9, 9);
        ctx.fillStyle = "#FFF2CC"; ctx.fillRect(16, 32, 13, 5);
      } else if(band === "day"){
        ctx.fillStyle = "#FFE7A0"; ctx.fillRect(122, 8, 8, 8);
        ctx.fillStyle = "#FFF3C8"; ctx.fillRect(120, 10, 12, 4);
      } else if(band === "evening"){
        ctx.fillStyle = "#FF9F5E"; ctx.fillRect(112, 34, 11, 11);
        ctx.fillStyle = "#FFC98A"; ctx.fillRect(109, 37, 17, 5);
      }
    }
    if(band === "night"){
      ctx.fillStyle = "#F4EFD8";
      ctx.fillRect(20, 8, 7, 7);
      var stars = [[40,14],[55,7],[70,18],[95,9],[110,15],[10,20],[130,11],[60,22]];
      stars.forEach(function(s){ ctx.fillRect(s[0], s[1], 1, 1); });
    }

    // 67번(개발팀 판단 추가): 시간대별 보너스 풍경 요소 — 아침엔 나는 새 두 마리(V자), 저녁엔 지평선
    // 근처를 나는 새 실루엣 한 마리로 노을 분위기를 보강. 낮/밤은 기존 해·달·별 요소로 충분하다고 판단.
    if(band === "morning" && (cond === "clear" || cond === "cloudy")){
      ctx.fillStyle = "rgba(60,54,46,0.55)";
      [[45,20],[54,24]].forEach(function(b){
        ctx.fillRect(b[0], b[1], 3, 1);
        ctx.fillRect(b[0]-2, b[1]-1, 2, 1);
        ctx.fillRect(b[0]+3, b[1]-1, 2, 1);
      });
    }
    if(band === "evening" && (cond === "clear" || cond === "cloudy")){
      ctx.fillStyle = "rgba(60,40,30,0.5)";
      ctx.fillRect(90, 26, 3, 1);
      ctx.fillRect(88, 25, 2, 1);
      ctx.fillRect(93, 25, 2, 1);
    }

    // 67번: 장식용 잔잔한 구름 2송이 — 날씨와 무관하게 항상 은은히 떠 있고, 시간대별 색조를 입혀
    // "구름" 표현을 상시화. Date.now() 기반 위상으로 아주 느리게 좌우로 흔들려("바람" 느낌) —
    // 전용 애니메이션 타이머를 새로 만들지 않아도 숨쉬기/유휴포즈 타이머가 주기적으로 drawPixelScene()을
    // 다시 불러주므로 자연히 흘러가는 것처럼 보임.
    var drift = Math.sin(Date.now() / 4000) * 3;
    var cloudTint = band === "night" ? "rgba(255,255,255,0.16)"
      : band === "evening" ? "rgba(255,236,214,0.55)"
      : band === "morning" ? "rgba(255,255,255,0.5)"
      : "rgba(255,255,255,0.7)";
    ctx.fillStyle = cloudTint;
    drawCloudPuff(ctx, 14 + drift, 14);
    drawCloudPuff(ctx, 82 - drift, 9);

    // 기존 날씨별 강조 오버레이(실제 흐림/비/눈이 관측됐을 때 더 진하게)는 그대로 유지
    if(cond === "cloudy" || cond === "overcast" || cond === "fog"){
      ctx.fillStyle = band === "night" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.55)";
      ctx.fillRect(10, 12, 22, 5);
      ctx.fillRect(70, 6, 26, 5);
    }
    if(cond === "rain" || cond === "storm"){
      ctx.fillStyle = band === "night" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)";
      ctx.fillRect(10, 10, 22, 4);
      ctx.fillRect(70, 5, 26, 4);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#BFE0F2";
      for(var i=0;i<10;i++){
        var rx = (i*15 + 6) % PX_W;
        ctx.fillRect(rx, groundRow-16 + (i%3)*5, 1, 5);
      }
      ctx.globalAlpha = 1;
    }
    if(cond === "snow"){
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for(var j=0;j<12;j++){
        var sx = (j*13 + 4) % PX_W;
        ctx.fillRect(sx, groundRow-20 + (j%4)*5, 1, 1);
      }
    }

    // 67번: 바람 표현 — 상단에 옅은 대각 스트리크 몇 개, drift 위상에 맞춰 서서히 흘러 미풍 느낌을 냄
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = band === "night" ? "#AEB6D6" : "#FFFFFF";
    ctx.lineWidth = 1;
    for(var wi = 0; wi < 3; wi++){
      var wx = ((wi * 45 + drift * 6) % (PX_W + 20)) - 10;
      var wy = 4 + wi * 4;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + 9, wy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // 53번: 지붕 폭 계산(inset)이 roofY(위쪽)에서 가장 넓고 몸체와 만나는 아래쪽에서 0에 가까워지도록
  // 거꾸로 되어 있던 버그를 고쳐 정삼각 박공지붕(위가 뾰족, 처마가 몸체 폭)으로 재작업. 사용자가 준
  // 참고사진(흰둥이네 집)의 특징 — 크림색 몸체, 파란 박공지붕, 아치형 출입구, 옆면 환기구, 이름표 —
  // 을 스케치 확인(sketch-check-53) 그대로 반영.
  // 이름표 관련(사용자 확인: "실제로 이름을 넣어달라"): 실제로 시도해봤지만, 이 캔버스가 150×100
  // 네이티브 해상도라 5px 안팎의 fillText는 글자 획이 서브픽셀 단위로 뭉개지고, 심지어 안티앨리어싱
  // 번짐이 이름표 칸을 넘어 개집 몸체 전체로 퍼져 얼룩처럼 보이는 문제가 있어(Playwright로 실제
  // 렌더링을 캡처해 확인) 텍스트는 결국 빼고 빈 이름표만 둠 — 반려견 이름은 화면 상단에 이미 항상
  // 표시되고 있어(el.dogNameLabel) 여기서 다시 못 읽는 글씨로 욱여넣기보다 이 편이 낫다고 판단.
  // 커스텀 미니 비트맵 폰트를 새로 만들면 가능하지만 이번 라운드 범위 밖이라 다음 라운드 후보로 남김.
  // 80-2번: opts(선택) — {scale, x, groundRow}. 생략하면 완전히 기존과 동일(항등변환)이라 엔딩씬 등
  // 기존 호출부는 전혀 영향받지 않음. 마당(drawPixelScene)에서만 "작고 훨씬 뒤(위)로 밀린" 개집을
  // 그리기 위해 사용 — 함수 본문(x=6 기준 좌표식)은 한 글자도 안 건드리고, 원래 접지 기준점(x=6,
  // groundRow)이 opts.x/opts.groundRow로 매핑되도록 좌표계 자체를 이동+축소함(translate→scale→
  // 역translate 합성). 이 씬은 바닥이 4px 띠뿐인 평면 다이어그램이라 진짜 원근감은 없고, "더 작고 더
  // 위(하늘 쪽)"로 배치하는 것으로 "멀리 있다"는 느낌만 근사함(사용자 확인: 이번엔 실사이즈 비례 무시 허용).
  function drawDoghouse(ctx, groundRow, opts){
    var scale = (opts && opts.scale) || 1;
    var targetX = (opts && opts.x != null) ? opts.x : 6;
    var targetGroundRow = (opts && opts.groundRow != null) ? opts.groundRow : groundRow;
    var needsTransform = (opts != null);
    if(needsTransform){
      ctx.save();
      ctx.translate(targetX, targetGroundRow);
      ctx.scale(scale, scale);
      ctx.translate(-6, -groundRow);
    }
    var x = 6, w = 26, eave = 3, roofH = 11, bodyH = 16;
    var bodyY = groundRow - bodyH;
    var roofY = bodyY - roofH;
    var peakX = x + Math.round(w/2);

    // 몸체(크림색)
    ctx.fillStyle = "#F0E4C6";
    ctx.fillRect(x, bodyY, w, bodyH);
    ctx.fillStyle = "#D8C79E";
    ctx.fillRect(x, bodyY, w, 1);

    // 지붕(파란 박공지붕) — 위(roofY)가 뾰족하고 아래(처마)에서 몸체 폭+eave만큼 넓어짐
    ctx.fillStyle = "#4E7FA8";
    for(var i=0;i<roofH;i++){
      var t = i/(roofH-1);
      var rowW = Math.max(2, Math.round(t * (w + eave*2)));
      var rowX = peakX - Math.round(rowW/2);
      ctx.fillRect(rowX, roofY + i, rowW, 1);
    }
    ctx.fillStyle = "#2E5A78";
    ctx.fillRect(peakX - 1, roofY, 2, 2); // 지붕마루 포인트
    ctx.fillRect(x - eave, bodyY - 1, w + eave*2, 1); // 처마 그림자선

    // 옆면 환기구(작은 사각 2개)
    ctx.fillStyle = "#B99B68";
    ctx.fillRect(x + 3, bodyY + 4, 2, 2);
    ctx.fillRect(x + 3, bodyY + 9, 2, 2);

    // 출입구(짙은 아치형) — 위쪽을 계단식으로 좁혀 둥근 아치 느낌을 냄
    var doorW = 10, doorH = 11;
    var doorX = x + Math.round((w-doorW)/2), doorY = groundRow - doorH;
    ctx.fillStyle = "#3A2A22";
    ctx.fillRect(doorX, doorY + 2, doorW, doorH - 2);
    ctx.fillRect(doorX + 1, doorY + 1, doorW - 2, 1);
    ctx.fillRect(doorX + 2, doorY, doorW - 4, 1);

    // 이름표 — 흰 판(빈 판, 위 주석 참고)
    var plateW = 14, plateH = 5;
    var plateX = peakX - Math.round(plateW/2), plateY = bodyY + 2;
    ctx.fillStyle = "#FFFDF3";
    ctx.fillRect(plateX, plateY, plateW, plateH);
    ctx.fillStyle = "#B99B68";
    ctx.fillRect(plateX, plateY, plateW, 1);

    if(needsTransform){
      ctx.restore();
    }
  }

  function drawPixelScene(){
    if(!el.pixelCanvas || !el.pixelCanvas.getContext) return;
    var ctx = el.pixelCanvas.getContext("2d");
    if(!ctx) return;
    ctx.clearRect(0, 0, PX_W, PX_H);
    clearYardHiCanvas();

    var groundRow = PX_H - 4;
    var groundColor = cssVar("--moss", "#9CB88C");
    var groundColorDeep = cssVar("--moss-deep", "#5F7A52");

    drawPixelSky(ctx, groundRow);

    ctx.fillStyle = groundColor;
    ctx.fillRect(0, groundRow, PX_W, PX_H - groundRow);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = groundColorDeep;
    ctx.fillRect(0, groundRow, PX_W, 1);
    ctx.globalAlpha = 1;

    // 80-3번(그래픽팀 피드백 반영): 80-2번에서 시도했던 "개집을 작게 축소해 왼쪽 구석 하늘 쪽으로
    // 배치"가 오히려 "공중에 붕 뜬 집"처럼 보인다는 피드백을 받아, 마당 화면에서는 개집을 아예 그리지
    // 않기로 변경 — drawDoghouse() 함수 자체(및 opts 파라미터, 엔딩씬 호출부)는 그대로 남겨두고, 이
    // 화면(drawPixelScene)의 호출 한 줄만 제거함. 엔딩씬의 개집 렌더링은 이 변경과 무관하게 그대로 유지.
    drawPixelIdleDog(ctx, groundRow);
  }

  // 53번: 멍멍모드 — 소통버튼 대기시간에 한정하지 않고(사용자 확인: "20초에 한정하지 않고 상시 앰비언트
  // 연출로"), 메인 화면(클래식 픽셀 모드, 우선 이번 라운드는 픽셀모드만 — 사용자 확인)에서 늘 돌아가는
  // 유휴 애니메이션. `멍멍모드_행동목록.xlsx`의 IDLE-001~011(11개, 탐험형·수면형·몸단장형·장난형·
  // 환경반응형) 사이를 무작위(균등 확률)로 순환 재생하고, 포즈가 없을 때는 기존 숨쉬기(IDLE-000, blink/
  // tail/bob 타이머)로 돌아감. "발생 가중치"·"연동 조건" 열은 원안대로 지금은 비어있어 반영하지 않음
  // — 나중에 채워지면 均等 확률 대신 가중치 기반으로 바꾸면 됨.
  var PIXEL_IDLE_POSES = [
    { id:"IDLE-001", cat:"탐험형",     minMs:4000, maxMs:5000 },
    { id:"IDLE-002", cat:"탐험형",     minMs:3000, maxMs:3000 },
    { id:"IDLE-003", cat:"수면형",     minMs:5000, maxMs:7000 },
    { id:"IDLE-004", cat:"수면형",     minMs:4000, maxMs:4000 },
    { id:"IDLE-005", cat:"몸단장형",   minMs:2000, maxMs:3000 },
    { id:"IDLE-006", cat:"몸단장형",   minMs:3000, maxMs:3000 },
    { id:"IDLE-007", cat:"몸단장형",   minMs:1000, maxMs:2000 },
    { id:"IDLE-008", cat:"장난형",     minMs:3000, maxMs:3000 },
    { id:"IDLE-009", cat:"장난형",     minMs:3000, maxMs:4000 },
    { id:"IDLE-010", cat:"환경반응형", minMs:3000, maxMs:3000 },
    { id:"IDLE-011", cat:"환경반응형", minMs:3000, maxMs:4000 }
  ];
  var pixelIdlePose = null, pixelIdlePoseStartTs = 0, pixelIdlePoseDurMs = 0;
  var pixelIdlePoseTickTimer = null, pixelIdlePoseGapTimer = null;

  function stopPixelIdlePoseCycle(){
    if(pixelIdlePoseTickTimer){ window.clearInterval(pixelIdlePoseTickTimer); pixelIdlePoseTickTimer = null; }
    if(pixelIdlePoseGapTimer){ window.clearTimeout(pixelIdlePoseGapTimer); pixelIdlePoseGapTimer = null; }
    pixelIdlePose = null;
  }
  function scheduleNextPixelIdlePose(){
    if(reduceMotion()) return;
    // 70번: 성장 단계별 timeMult를 곱해 "빠르고 부산스럽게(털뭉치)"~"느리고 여유롭게(찹찹츄)" 체감
    // 차이를 냄 — 기준 간격(찹츄, timeMult=1) 자체는 53번에 확정된 4~9초 그대로.
    var gap = (4000 + Math.random() * 5000) * growthVisual().timeMult;
    pixelIdlePoseGapTimer = window.setTimeout(playRandomPixelIdlePose, gap);
  }
  function playRandomPixelIdlePose(){
    if(reduceMotion()) return;
    var pose = PIXEL_IDLE_POSES[Math.floor(Math.random() * PIXEL_IDLE_POSES.length)];
    pixelIdlePose = pose.id;
    pixelIdlePoseStartTs = Date.now();
    pixelIdlePoseDurMs = (pose.minMs + Math.random() * (pose.maxMs - pose.minMs)) * growthVisual().timeMult;
    if(pixelIdlePoseTickTimer) window.clearInterval(pixelIdlePoseTickTimer);
    pixelIdlePoseTickTimer = window.setInterval(function(){
      if(Date.now() - pixelIdlePoseStartTs >= pixelIdlePoseDurMs){
        window.clearInterval(pixelIdlePoseTickTimer);
        pixelIdlePoseTickTimer = null;
        pixelIdlePose = null;
        drawPixelScene();
        scheduleNextPixelIdlePose();
        return;
      }
      drawPixelScene();
    }, 120);
    drawPixelScene();
  }

  // 80-2번(마당 화면 원근감 조정): 마당(pixelCanvas, drawPixelScene→drawPixelIdleDog 경로) 화면에서만
  // 강아지를 실사이즈 비례 무시하고 훨씬 크게(체고 약 60~65px, 150×100 논리 좌표계 기준) 그리기 위한
  // 배율. 골든(체고 71cm, 대형견 기준)이 성체일 때 H≈37 → 스프라이트 표시 높이 H*1.18≈44px가 나오므로,
  // 44*1.42≈62px로 목표 구간(60~65px) 중앙에 오도록 역산(Playwright로 실측 후 확정). H 하나에만 곱해
  // 다리·몸통·머리 등 모든 하위 치수와(절차적 경로) 스프라이트 표시 높이(스프라이트 경로, H*1.18 그대로
  // 재사용)가 함께 비례 확대됨 — 어질리티(026)·대회(028)·엔딩씬은 이 상수를 전혀 참조하지 않으므로
  // 완전히 기존과 동일하게 유지됨(사용자 확인: "어질리티·대회 화면은 이번 조정 대상이 아님").
  var YARD_DOG_SIZE_MULT = 2.1;
  function drawYardDog(ctx, groundRow, offsetX, forceEyesClosed){
    drawPixelDog(ctx, groundRow, offsetX, forceEyesClosed, null, YARD_DOG_SIZE_MULT);
  }

  // 현재 멍멍모드 포즈에 맞춰 강아지를 그림 — 포즈가 없으면(기본 숨쉬기) 기존 drawPixelDog 그대로 호출.
  // 각 포즈는 drawPixelDog를 감싸는 간단한 캔버스 변형(이동/회전/스케일)과, 필요하면 위에 살짝 겹치는
  // 보조 표시(점선 시선·Zzz·움찔 자국 등)로 표현 — 스케치 확인 때 보여드린 컨셉을 실제 색이 입혀진
  // 픽셀아트 위에 그대로 옮긴 것. 80-2번: 이 함수 내부의 모든 drawPixelDog 호출은 drawYardDog로 교체 —
  // 마당 화면에서만 강아지가 커지도록 스코프를 이 함수 하나로 한정함(호출부는 drawPixelScene 단 하나).
  // 83번: 유저의 현재 개(견종·성장 단계·모색)에 맞는 애니메이션 시트가 있는지. 믹스견은 전용 시트가 없어 제외.
  function yardAnimSheetReady(){
    if(state.breed === "mix" || !state.coatId) return false;
    var st = (typeof state.growthStage === "number") ? state.growthStage : 2;
    return !!getDogAnimSheet(state.breed, st, state.coatId);
  }
  function drawYardAnimFrame(ctx, groundRow, frame, flip, offsetX){
    dogAnimFrame = frame; dogAnimFlip = !!flip; dogAnimHiCtx = yardHiCtx();
    try{ drawYardDog(ctx, groundRow, offsetX || 0); }
    finally{ dogAnimFrame = null; dogAnimFlip = false; dogAnimHiCtx = null; }
  }
  function drawYardZzz(ctx, x, y){
    ctx.fillStyle = "#726B58"; ctx.font = "7px sans-serif"; ctx.fillText("Z z", x, y);
  }
  // 83번: 시트가 있는 개의 마당 연출 — 기존 IDLE-001~011 포즈 순환(타이머·지속시간·확률)은 그대로 두고,
  // 각 포즈를 "캔버스 변형으로 흉내"내던 부분만 시트의 실제 동작 프레임으로 바꿈. 효과선·점선 같은 보조
  // 표시는 시트 원화와 겹치지 않도록 대부분 빼고, 잠(Zzz)과 IDLE-010의 날벌레 점만 남김.
  function drawPixelIdleDogAnim(ctx, groundRow){
    var pose = pixelIdlePose;
    var cx = Math.round(PX_W/2) + 2;
    if(!pose){
      // 기본 숨쉬기(IDLE-000): 깜빡임 > 졸림(엎드려 턱 괴기) > 숨 내쉼 > 꼬리 흔들기 A/B 순으로 우선
      var f;
      if(pixelBlink) f = 2;
      else if(moodOf() === "sleepy") f = 17;
      else if(pixelBobUp) f = 1;
      else f = pixelTailFrame ? 3 : 4;
      drawYardAnimFrame(ctx, groundRow, f, false, 0);
      return;
    }
    var elapsed = Date.now() - pixelIdlePoseStartTs;
    var r = pixelIdlePoseDurMs > 0 ? Math.min(1, elapsed / pixelIdlePoseDurMs) : 1;
    switch(pose){
      case "IDLE-001": // 화면 밖 마실: 오른쪽으로 걸어나감(걷기 1~4 반복, 반전) → 사라짐 → 후다닥 달려 복귀
        if(r < 0.35){ drawYardAnimFrame(ctx, groundRow, 6 + Math.floor(elapsed/140) % 4, true, Math.round(70 * (r/0.35))); }
        else if(r < 0.65){ /* 화면 밖 */ }
        else { drawYardAnimFrame(ctx, groundRow, 11, false, Math.round(70 * (1 - (r-0.65)/0.35))); }
        break;
      case "IDLE-002": drawYardAnimFrame(ctx, groundRow, 5, false, 0); break; // 앉아 올려다보기
      case "IDLE-003": // 웅크려 자기 A/B(숨쉬기)
        drawYardAnimFrame(ctx, groundRow, (Math.floor(elapsed/900) % 2) ? 13 : 12, false, 0);
        drawYardZzz(ctx, cx + 14, groundRow - 40);
        break;
      case "IDLE-004": // 옆으로 누워 자기 A/B(꿈꾸며 움찔)
        drawYardAnimFrame(ctx, groundRow, (Math.floor(elapsed/220) % 2) ? 15 : 14, false, 0);
        drawYardZzz(ctx, cx + 14, groundRow - 34);
        break;
      case "IDLE-005": drawYardAnimFrame(ctx, groundRow, (Math.floor(elapsed/150) % 2) ? 19 : 18, false, 0); break; // 긁기
      case "IDLE-006": drawYardAnimFrame(ctx, groundRow, (r < 0.12 || r > 0.88) ? 0 : 16, false, 0); break; // 기지개
      case "IDLE-007": drawYardAnimFrame(ctx, groundRow, 20, false, (Math.floor(elapsed/60) % 2 === 0) ? 1 : -1); break; // 털기
      case "IDLE-008": { // 꼬리잡기: 좌우 반전을 번갈아 제자리에서 뱅글뱅글 도는 느낌
        var orbitX = Math.round(Math.sin(r * Math.PI * 2 * 1.6) * 6);
        drawYardAnimFrame(ctx, groundRow, 22, (Math.floor(elapsed/200) % 2) === 1, orbitX);
        break;
      }
      case "IDLE-009": drawYardAnimFrame(ctx, groundRow, r < 0.65 ? 21 : 0, false, 0); break; // 플레이바우 → 머쓱하게 풂
      case "IDLE-010": { // 뭔가 쫓기: 날벌레 쪽(오른쪽 위)을 올려다봄
        var flyX = cx + 20 + Math.round(Math.sin(elapsed/260) * 16);
        drawYardAnimFrame(ctx, groundRow, 23, true, (Math.floor(elapsed/260) % 2 === 0) ? 1 : -1);
        ctx.fillStyle = "#C4482B";
        ctx.fillRect(flyX, groundRow - 58 + Math.round(Math.cos(elapsed/310) * 6), 2, 2);
        break;
      }
      case "IDLE-011": { // 바닥 냄새 산책: 코를 박고 좌우로 어슬렁 — 움직이는 방향을 보게 반전
        var drift = Math.round(Math.sin(elapsed/900) * 10);
        drawYardAnimFrame(ctx, groundRow, 10, Math.cos(elapsed/900) > 0, drift);
        break;
      }
      default: drawYardAnimFrame(ctx, groundRow, 0, false, 0);
    }
  }

  function drawPixelIdleDog(ctx, groundRow){
    // 83번: 애니메이션 시트가 있는 개(현재 웰시코기 성견)는 시트 프레임 경로로, 나머지는 아래 기존 그대로.
    if(yardAnimSheetReady()){ drawPixelIdleDogAnim(ctx, groundRow); return; }
    var pose = pixelIdlePose;
    if(!pose){ drawYardDog(ctx, groundRow); return; }
    var elapsed = Date.now() - pixelIdlePoseStartTs;
    var r = pixelIdlePoseDurMs > 0 ? Math.min(1, elapsed / pixelIdlePoseDurMs) : 1;
    var cx = Math.round(PX_W/2) + 2;
    switch(pose){
      case "IDLE-001": // 화면 밖 마실: 걸어나감 → 잠깐 사라짐 → 후다닥 복귀
        if(r < 0.35){ drawYardDog(ctx, groundRow, Math.round(70 * (r/0.35))); }
        else if(r < 0.65){ /* 화면 밖: 그리지 않음 */ }
        else { drawYardDog(ctx, groundRow, Math.round(70 * (1 - (r-0.65)/0.35))); }
        break;
      case "IDLE-002": // 골똘히 쳐다보기: 살짝 고개를 든 자세 + 응시 방향 점선
        ctx.save();
        ctx.translate(cx, groundRow); ctx.rotate(-0.05); ctx.translate(-cx, -groundRow);
        drawYardDog(ctx, groundRow);
        ctx.restore();
        ctx.strokeStyle = "#8A8370"; ctx.lineWidth = 1; ctx.setLineDash([2,2]);
        ctx.beginPath(); ctx.moveTo(cx+10, groundRow-30); ctx.lineTo(cx+34, groundRow-46); ctx.stroke();
        ctx.setLineDash([]);
        break;
      case "IDLE-003": // 웅크려 잠들기: 낮게 웅크린 실루엣 + Zzz
        ctx.save();
        ctx.translate(cx, groundRow); ctx.scale(1, 0.62); ctx.translate(-cx, -groundRow);
        drawYardDog(ctx, groundRow, 0, true);
        ctx.restore();
        ctx.fillStyle = "#726B58"; ctx.font = "7px sans-serif"; ctx.fillText("Z z", cx+16, groundRow-44);
        break;
      case "IDLE-004": // 꿈꾸는 다리: 누운 채 다리가 움찔움찔 + Zzz
        ctx.save();
        ctx.translate(cx, groundRow); ctx.scale(1, 0.7); ctx.translate(-cx, -groundRow);
        drawYardDog(ctx, groundRow, (Math.floor(elapsed/220)%2===0) ? 1 : -1, true);
        ctx.restore();
        ctx.fillStyle = "#726B58"; ctx.font = "7px sans-serif"; ctx.fillText("Z z", cx+16, groundRow-40);
        break;
      case "IDLE-005": // 뒷다리로 긁기: 제자리 + 긁는 동작 자국 깜빡임
        drawYardDog(ctx, groundRow);
        if(Math.floor(elapsed/180) % 2 === 0){
          ctx.strokeStyle = "#C4482B"; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx+8, groundRow-34); ctx.lineTo(cx+14, groundRow-40);
          ctx.moveTo(cx+8, groundRow-30); ctx.lineTo(cx+14, groundRow-36);
          ctx.stroke();
        }
        break;
      case "IDLE-006": // 다운독 기지개: 앞으로 쭉 늘어난 실루엣
        ctx.save();
        ctx.translate(cx, groundRow); ctx.scale(1.12, 0.9); ctx.translate(-cx, -groundRow);
        drawYardDog(ctx, groundRow);
        ctx.restore();
        break;
      case "IDLE-007": // 부르르 털기: 좌우로 빠르게 흔들림 + 물방울 튀는 선
        drawYardDog(ctx, groundRow, (Math.floor(elapsed/60) % 2 === 0) ? 1 : -1);
        ctx.strokeStyle = "#8A8370"; ctx.lineWidth = 1; ctx.setLineDash([1,2]);
        ctx.beginPath();
        ctx.moveTo(cx-24, groundRow-30); ctx.lineTo(cx-30, groundRow-34);
        ctx.moveTo(cx+24, groundRow-30); ctx.lineTo(cx+30, groundRow-34);
        ctx.stroke(); ctx.setLineDash([]);
        break;
      case "IDLE-008": { // 꼬리잡기 뱅글뱅글: 몸을 뒤집지 않고(정면 스프라이트가 그대로 회전하면
        // 위아래가 뒤집혀 보여 오히려 어색함) 제자리에서 작게 원을 그리며 도는 궤적으로 표현.
        var loopAngle = r * Math.PI * 2 * 1.6;
        var orbitX = Math.round(Math.sin(loopAngle) * 6);
        drawYardDog(ctx, groundRow, orbitX);
        ctx.strokeStyle = "#8A8370"; ctx.lineWidth = 1; ctx.setLineDash([1,2]);
        ctx.beginPath(); ctx.ellipse(cx, groundRow-6, 10, 3, 0, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        break;
      }
      case "IDLE-009": // 플레이바우: 앞다리를 낮춘 "놀자" 자세 → 반응 없으면 머쓱하게 풂
        var bowTilt = r < 0.65 ? -0.16 : 0;
        ctx.save();
        ctx.translate(cx, groundRow); ctx.rotate(bowTilt); ctx.translate(-cx, -groundRow);
        drawYardDog(ctx, groundRow);
        ctx.restore();
        if(r < 0.65){
          ctx.strokeStyle = "#C4482B"; ctx.lineWidth = 1; ctx.setLineDash([2,2]);
          ctx.beginPath(); ctx.moveTo(cx+30, groundRow-52); ctx.lineTo(cx+30, groundRow-58); ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
      case "IDLE-010": // 뭔가 쫓기: 고개를 이리저리 + 작은 점(파리)이 움직임
        drawYardDog(ctx, groundRow, (Math.floor(elapsed/260) % 2 === 0) ? 2 : -2);
        ctx.fillStyle = "#C4482B";
        ctx.fillRect(cx + 20 + Math.round(Math.sin(elapsed/260) * 16), groundRow - 50 + Math.round(Math.cos(elapsed/310) * 6), 2, 2);
        break;
      case "IDLE-011": // 바닥 냄새 산책: 천천히 좌우로 어슬렁 + 냄새 자국
        var drift = Math.round(Math.sin(elapsed/900) * 10);
        drawYardDog(ctx, groundRow, drift);
        if(Math.floor(elapsed/300) % 2 === 0){
          ctx.strokeStyle = "#8A8370"; ctx.lineWidth = 1; ctx.setLineDash([1,2]);
          ctx.beginPath(); ctx.arc(cx+drift+16, groundRow-2, 5, Math.PI, 0); ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
      default:
        drawYardDog(ctx, groundRow);
    }
  }

  // 48번(기획문서 12장): 30일 임시보호 종료 엔딩씬 전용 픽셀 드로잉 3종 — 프로토타입(엔딩씬_프로토타입.html)의
  // CSS 도형을 우리 게임의 캔버스 픽셀 그래픽 스타일(drawDoghouse와 동일한 fillRect 블록 조립 방식,
  // PX_W×PX_H=150×100 좌표계)로 새로 옮겨 그림 — "복귀 화면은 클래식 픽셀 모드 고정"이라는 원안 그대로,
  // 유저의 현재 픽셀모드 on/off 설정과 무관하게 이 씬은 항상 이 방식으로만 그려짐.

  // 이동장(크레이트) 자리의 중심 x좌표 — 편지봉투(drawEndingEnvelope)도 같은 지점을 기준으로 그려지고,
  // 50번: '달성' 결과에서 강아지가 재노출될 때도 이 지점으로 옮겨 그려 "이동장이 있던 자리"를 맞춤.
  var ENDING_SLOT_CENTER_X = 131; // 크레이트 x=118~144(w=26)의 중심
  // drawPixelDog()의 기본 중심(cx = round(PX_W/2)+2)에서 이동장 자리까지 밀어줄 오프셋
  var ENDING_DOG_OFFSET_X = ENDING_SLOT_CENTER_X - (Math.round(PX_W/2) + 2); // = 54

  // 이동장(크레이트) — 좌측 하단 개집(drawDoghouse, x=6~32)과 대칭되는 우측 자리(x=118~144)에 위치.
  function drawEndingCrate(ctx, groundRow){
    var w = 26, h = 20;
    var x = PX_W - 6 - w, y = groundRow - h;
    ctx.fillStyle = "#CFC9B8";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#9C947E";
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y, 2, h);
    ctx.fillRect(x + w - 2, y, 2, h);
    for(var i = 1; i < 4; i++){
      ctx.fillRect(x + Math.round(i*w/4), y + 3, 1, h - 6);
    }
    ctx.fillStyle = "#9C947E";
    ctx.fillRect(x + Math.round(w/2) - 4, y - 4, 8, 4);
  }

  // 승합차량 — 일반(주황)과 찹찹츄 이별 전용(흰색, farewell) 두 색만 다르고 형태는 동일.
  // vanX는 차체 왼쪽 끝의 캔버스 좌표(음수면 화면 밖), bounce는 싣는 연출용 1px 들썩임.
  // 51번: "차량이 작다"는 피드백으로 1.5배 확대 — 원래 치수(46/22/14/10 등)에 ENDING_VAN_SCALE을
  // 곱해 전부 같은 비율로 키움(원래 형태 그대로 확대, 부분별로 따로 조정하지 않음). w는 진입/주차 좌표
  // 계산(playEndingSequence의 startX/parkX)에서도 재사용하므로 ENDING_VAN_W로 별도 상수화해둠.
  var ENDING_VAN_SCALE = 1.5;
  var ENDING_VAN_W = Math.round(46 * ENDING_VAN_SCALE);
  function drawEndingVan(ctx, groundRow, vanX, bounce, farewell){
    var S = ENDING_VAN_SCALE;
    var w = ENDING_VAN_W, bodyH = Math.round(22*S), cabW = Math.round(14*S), cabH = Math.round(10*S);
    var bodyColor = farewell ? "#F5F0E6" : "#E08A3C";
    var edgeColor = farewell ? "#C6BCA4" : "#B96A22";
    var wheelColor = farewell ? "#5B5548" : "#3A332A";
    var oy = bounce ? -1 : 0;
    var bodyY = groundRow - bodyH + oy;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(vanX + w - cabW, bodyY - cabH, cabW, cabH);
    ctx.fillStyle = "#DCEEF5";
    ctx.fillRect(vanX + w - cabW + Math.round(2*S), bodyY - cabH + Math.round(2*S), cabW - Math.round(5*S), Math.round(5*S));
    ctx.fillStyle = bodyColor;
    ctx.fillRect(vanX, bodyY, w, bodyH);
    ctx.fillStyle = edgeColor;
    ctx.fillRect(vanX, bodyY, w, Math.round(2*S));
    ctx.fillStyle = wheelColor;
    ctx.fillRect(vanX + Math.round(6*S), groundRow - Math.round(3*S) + oy, Math.round(8*S), Math.round(6*S));
    ctx.fillRect(vanX + w - Math.round(16*S), groundRow - Math.round(3*S) + oy, Math.round(8*S), Math.round(6*S));
  }

  // 무지개빛 아우라를 두른 편지봉투 — auraPhase(0~1을 계속 순환)로 테두리 두께를 살짝 맥동시켜 반짝임을 표현.
  var ENDING_AURA_COLORS = ["#FFB3B3", "#FFE1A8", "#C9F2C0", "#B6DCF5", "#D2B6F5"];
  function drawEndingEnvelope(ctx, groundRow, auraPhase){
    var w = 22, h = 15;
    var x = PX_W - 6 - 26 + 2, y = groundRow - h - 3;
    var pulse = 2 + Math.round(Math.sin(auraPhase * Math.PI * 2) * 1.5);
    for(var i = 0; i < ENDING_AURA_COLORS.length; i++){
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = ENDING_AURA_COLORS[i];
      var pad = 3 + i*2 + pulse;
      ctx.fillRect(x - pad, y - pad, w + pad*2, h + pad*2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#FFF9E8";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#E8D9A8";
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = "#F3E7C4";
    var flapH = Math.round(h * 0.55);
    for(var r = 0; r < flapH; r++){
      var inset = Math.round((r/flapH) * (w/2));
      ctx.fillRect(x + inset, y + r, w - inset*2, 1);
    }
  }

  // 엔딩씬 한 프레임을 합성 — 하늘/바닥/개집은 항상 그리고, opts로 이동장·강아지·차량·편지봉투를 선택적으로 얹음.
  function drawEndingScene(ctx, opts){
    opts = opts || {};
    ctx.clearRect(0, 0, PX_W, PX_H);
    var groundRow = PX_H - 4;
    var groundColor = cssVar("--moss", "#9CB88C");
    var groundColorDeep = cssVar("--moss-deep", "#5F7A52");
    drawPixelSky(ctx, groundRow);
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, groundRow, PX_W, PX_H - groundRow);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = groundColorDeep;
    ctx.fillRect(0, groundRow, PX_W, 1);
    ctx.globalAlpha = 1;
    drawDoghouse(ctx, groundRow);
    if(opts.showCrate) drawEndingCrate(ctx, groundRow);
    if(opts.showDog) drawPixelDog(ctx, groundRow, opts.dogOffsetX || 0);
    if(typeof opts.vanX === "number") drawEndingVan(ctx, groundRow, opts.vanX, opts.bounce, opts.farewell);
    if(opts.showEnvelope) drawEndingEnvelope(ctx, groundRow, opts.auraPhase || 0);
  }

  // 28번 → 71번(산책 화면 실제 반영)에서 전면 교체: 산책 팝업의 반려견은 더 이상 마당과 같은 뒷모습
  // drawPixelDog()가 아니라, 역POV(정면 접근) 전용으로 새로 그린 drawWalkFrontDog()(025번)를 씀 —
  // 함수 이름과 호출부(syncWalkDogVisual/applyPixelMode/startPixelAnimation의 blink·tail·bob 타이머 등)는
  // 그대로 두고 내부 구현만 바꿔서, 이 함수를 부르는 다른 코드는 전혀 손대지 않아도 되게 함.
  // 배경(하늘·바닥·도로·소품)은 이제 별도 레이어 #walkPovCanvas(drawWalkPovBackground, 025번)가 그리므로
  // 여기선 여전히 반려견만 투명 배경에 그림.
  function drawWalkPixelDog(){
    if(!el.walkPixelCanvas || !el.walkPixelCanvas.getContext) return;
    var ctx = el.walkPixelCanvas.getContext("2d");
    if(!ctx) return;
    ctx.clearRect(0, 0, PX_W, PX_H);
    drawWalkFrontDog(ctx, Date.now() / 1000);
  }

  function stopPixelAnimation(){
    [pixelBlinkTimer, pixelTailTimer, pixelBobTimer].forEach(function(t){ if(t) window.clearInterval(t); });
    pixelBlinkTimer = pixelTailTimer = pixelBobTimer = null;
    stopPixelIdlePoseCycle();
  }
  function startPixelAnimation(){
    stopPixelAnimation();
    if(reduceMotion()) return;
    // 70번: 눈 깜빡임/꼬리/들썩임(숨쉬기) 기본 주기도 timeMult만큼 늘리거나 줄여 성장 단계 속도감을
    // 상시 애니메이션에도 반영 — checkGrowthStageTransition()이 단계 전환 시 이 함수를 다시 불러 새
    // timeMult로 타이머를 재시작함(setInterval 주기는 생성 시점에 고정되므로).
    var tm = growthVisual().timeMult;
    pixelBlinkTimer = window.setInterval(function(){
      pixelBlink = true; drawPixelScene(); drawWalkPixelDog();
      window.setTimeout(function(){ pixelBlink = false; drawPixelScene(); drawWalkPixelDog(); }, 160);
    }, Math.round(3200 * tm));
    pixelTailTimer = window.setInterval(function(){
      pixelTailFrame = !pixelTailFrame; drawPixelScene(); drawWalkPixelDog();
    }, Math.round(450 * tm));
    pixelBobTimer = window.setInterval(function(){
      pixelBobUp = !pixelBobUp; drawPixelScene(); drawWalkPixelDog();
    }, Math.round(900 * tm));
    // 53번: 멍멍모드 — 위 세 타이머와 별개로, 숨쉬기 사이사이 무작위 간격을 두고 12종 유휴 포즈 중
    // 하나를 균등 확률로 골라 재생. 산책 팝업(drawWalkPixelDog)에는 적용하지 않음(메인 마당 전용).
    scheduleNextPixelIdlePose();
  }
  // 48번: 엔딩이 확정된 순간(state.ending이 생기는 시점)부터는 원안대로 픽셀모드를 강제하고, 이 마당
  // 캔버스는 엔딩씬 전용 그리기 함수(playEndingSequence/showEndingRestingFrame)가 직접 관리하므로
  // 여기서 drawPixelScene()으로 평소 장면을 다시 그리면 안 됨 — startPixelAnimation()의 반복 타이머도
  // 함께 멈춰서 덮어쓰지 않게 함. 같은 이유로 화면 잠금(.screen.ending-lock)도 이 함수 하나에서 함께 처리.
  // 54번: 일반(CSS 그래픽) 화면 모드와 그 전환 토글을 사용자 요청으로 완전히 제거 — "테스트하면서
  // 추후 조정할 계획, 일단은 픽셀모드로만 운영"이라는 명시적 코멘트에 따라 상시 픽셀모드로 고정함.
  // 다만 이 상태를 "임시 조치"로 보고, 기존 CSS 강아지 마크업(.dog-wrap 등)·pixelMode 상태 필드 자체는
  // 지우지 않고 그대로 남겨둠 — 나중에 재조정 요청이 오면(예: 다시 토글을 붙이거나 완전히 다른 형태로
  // 재도입) 처음부터 다시 만들 필요 없이 이 지점만 되돌리면 되도록 함(33번 FOSTER_TEST_MODE와 같은 원칙).
  function applyPixelMode(){
    var locked = !!state.ending;
    var active = true; // 항상 픽셀모드 — 토글 삭제로 이제 이 값 외에는 도달 불가
    el.yard.classList.toggle("pixel-mode", active);
    el.yard.classList.toggle("ending-mode", locked);
    if(el.screenRoot) el.screenRoot.classList.toggle("ending-lock", locked);
    if(el.walkDogTrack) el.walkDogTrack.classList.toggle("pixel-mode", active);
    if(locked){ stopPixelAnimation(); stopTipRotation(); return; }
    drawPixelScene(); drawWalkPixelDog(); startPixelAnimation(); startTipRotation();
  }

  // 54번: 개꿀팁 레터박스 — 게임 하단 내비바 바로 위 여백에 상시 노출되는 문구 배너. 기획팀이 정리해
  // 전달한 [개꿀팁 리스트.xlsx]의 40개 문구를 그대로 옮김(카테고리: 상식/건강정보/세계관/힌트/유머 —
  // 색 순환에는 안 쓰고, 나중에 카테고리별 필터·연출이 필요해지면 쓸 수 있게 값만 남겨둠). 56번에서
  // [개꿀팁 리스트 v2.xlsx]로 카테고리별 8개씩 총 40개(TIP-041~080)가 추가돼 지금은 80개. 노출 방식은
  // 같은 파일 '안내' 시트 명세를 그대로 따름 — ①모든 문구가 한 번씩 다 나온 뒤에야 다시 반복되는
  // "셔플백" 방식으로 무작위 순환, ②레터박스 배경은 파스텔 무지개(빨주노초파남보) 색을 문구 카테고리와
  // 무관하게 독립적으로 순환, ③글자색은 흰색 고정. 노출 간격(TIP_ROTATE_MS)·긴 문구 처리 방식(스크롤
  // 티커)은 AskUserQuestion으로 사용자에게 직접 확인한 값 — 각각 18초(추천값 12초 대신 선택), 좌우로
  // 흐르는 티커(추천값이었던 말줄임/2줄바꿈 대신 선택).
  // applyPixelMode()의 잠금 분기(state.ending)에서 stopPixelAnimation()과 나란히 stopTipRotation()도
  // 같이 멈춰줌 — 엔딩 컷씬 동안 배너가 뒤에서 계속 돌아가면 톤이 안 맞을 것 같아, 다른 앰비언트
  // 타이머(멍멍모드 등)와 같은 방식으로 화면 잠금과 함께 정지시킴.
  var TIP_CATALOG = [
    { id:"TIP-001", cat:"상식", text:"강아지는 사람보다 최대 10만 배 더 예민한 후각을 가지고 있어요." },
    { id:"TIP-002", cat:"상식", text:"강아지의 코 무늬는 사람의 지문처럼 한 마리 한 마리 모두 달라요." },
    { id:"TIP-003", cat:"상식", text:"강아지도 사람처럼 꿈을 꾼다고 해요 — 자면서 다리를 움찔거리는 것도 그래서일지도?" },
    { id:"TIP-004", cat:"상식", text:"매년 3월 23일은 국제 강아지의 날(National Puppy Day)이에요." },
    { id:"TIP-005", cat:"상식", text:"매년 8월 26일은 세계 개의 날(National Dog Day)이에요." },
    { id:"TIP-006", cat:"상식", text:"매년 12월 2일은 세계 믹스견의 날(National Mutt Day) — 시고르자브 같은 친구들을 위한 날이에요!" },
    { id:"TIP-007", cat:"상식", text:"강아지는 표정과 몸짓만으로도 사람 못지않게 다양한 감정을 표현한다고 해요." },
    { id:"TIP-008", cat:"상식", text:"강아지 발바닥에서 고소한 팝콘 냄새가 난다는 이야기, 들어보셨나요?" },
    { id:"TIP-009", cat:"건강정보", text:"초콜릿은 강아지에게 독성이 있어요 — 아무리 좋아해도 절대 나눠주면 안 돼요." },
    { id:"TIP-010", cat:"건강정보", text:"성견의 영구치는 총 42개예요, 사람(32개)보다 훨씬 많답니다." },
    { id:"TIP-011", cat:"건강정보", text:"강아지도 정기적인 건강검진과 예방접종이 꼭 필요해요." },
    { id:"TIP-012", cat:"건강정보", text:"여름철 산책은 너무 뜨거운 아스팔트를 피해서, 이른 아침이나 저녁에!" },
    { id:"TIP-013", cat:"건강정보", text:"체중 관리는 관절 건강과 직결돼요 — 간식은 적당히!" },
    { id:"TIP-014", cat:"건강정보", text:"심장사상충은 한 번 걸리면 치료가 어려운 만큼, 예방이 최선이에요." },
    { id:"TIP-015", cat:"건강정보", text:"발톱이 너무 길면 걸음걸이에 무리가 갈 수 있어요, 주기적으로 정리해주세요." },
    { id:"TIP-016", cat:"건강정보", text:"스트레스를 받으면 식욕부진이나 과도한 그루밍으로 나타날 수 있어요." },
    { id:"TIP-017", cat:"세계관", text:"오늘 하루도, 이 아이에게는 소중한 하루예요." },
    { id:"TIP-018", cat:"세계관", text:"짧은 다리로도, 이 아이는 최선을 다해 오늘을 걸었어요." },
    { id:"TIP-019", cat:"세계관", text:"함께 걷는 이 시간이, 언젠가는 그리운 기억이 될지도 몰라요." },
    { id:"TIP-020", cat:"세계관", text:"말은 통하지 않아도, 마음은 늘 전해지고 있어요." },
    { id:"TIP-021", cat:"세계관", text:"오늘도 이 아이의 세상은, 당신으로 가득해요." },
    { id:"TIP-022", cat:"세계관", text:"매일이 새로운 산책이듯, 매일이 새로운 하루예요." },
    { id:"TIP-023", cat:"세계관", text:"함께한 시간은, 숫자로는 다 담을 수 없어요." },
    { id:"TIP-024", cat:"세계관", text:"지금 이 순간을, 이 아이도 온 마음으로 함께하고 있어요." },
    { id:"TIP-025", cat:"힌트", text:"소통버튼을 꾸준히 눌러주다 보면... 언젠가 예상 못한 능력이 생길지도?" },
    { id:"TIP-026", cat:"힌트", text:"산책 중 아주 가끔, 정말 특별한 걸 발견할 때가 있대요." },
    { id:"TIP-027", cat:"힌트", text:"애착바구니 속 아이템들은 그냥 모으기만 해도 도움이 된다는 소문이 있어요." },
    { id:"TIP-028", cat:"힌트", text:"어떤 재료 두 개를 같이 모으면... 특별한 게 완성된다는 이야기가 있어요." },
    { id:"TIP-029", cat:"힌트", text:"매일 산책을 거르지 않으면, 몸도 마음도 무럭무럭 자란대요." },
    { id:"TIP-030", cat:"힌트", text:"견종마다 감춰진 성격이 있다는 거, 알고 계셨나요?" },
    { id:"TIP-031", cat:"힌트", text:"가끔은 그냥 가만히 지켜보는 것만으로도 충분할 때가 있어요." },
    { id:"TIP-032", cat:"힌트", text:"무지개색으로 빛나는 무언가를 만난다면... 놓치지 마세요." },
    { id:"TIP-033", cat:"유머", text:"골든리트리버 한 마리가 한 번에 입에 문 테니스공 개수, 기네스 기록은 무려 6개!" },
    { id:"TIP-034", cat:"유머", text:"웰시코기가 1km를 걸어가는 동안 찍히는 발자국의 수는 약 7,700개랍니다!" },
    { id:"TIP-035", cat:"유머", text:"강아지가 하품하면 옆에 있는 강아지도 따라 하품한다는 사실, 알고 계셨나요?" },
    { id:"TIP-036", cat:"유머", text:"포메라니안은 몸무게는 가벼운데 목소리는 절대 안 가벼워요." },
    { id:"TIP-037", cat:"유머", text:"진돗개에게 '손'을 가르치는 데 걸리는 시간은... 견주의 인내심에 달려있대요." },
    { id:"TIP-038", cat:"유머", text:"시바견의 표정을 보고 있으면, 가끔 얘가 나를 평가하는 것 같은 기분이 들어요." },
    { id:"TIP-039", cat:"유머", text:"허스키는 짖는 대신 대화하듯 '우우우' 소리를 낸다는 거, 아시나요?" },
    { id:"TIP-040", cat:"유머", text:"래브라도는 밥그릇 소리만 들려도 이미 앞발을 들고 대기 중이라는 소문이 있어요." },
    // 56번: [개꿀팁 리스트 v2.xlsx]로 기획팀이 40개를 추가 전달(TIP-041~080, 카테고리별 정확히 8개씩) —
    // 기존 TIP-001~040은 ID·문구 전부 그대로였고(대조 완료), 이 40개만 신규.
    { id:"TIP-041", cat:"상식", text:"매년 10월 1일은 세계 검은 개의 날(National Black Dog Day)이에요 — 검은 개는 입양이 더 어렵다는 통념을 깨기 위해 만들어졌대요." },
    { id:"TIP-042", cat:"상식", text:"매년 10월 4일은 세계 동물의 날(World Animal Day)이에요." },
    { id:"TIP-043", cat:"상식", text:"강아지는 사람보다 색을 적게 구분하지만, 어두운 곳에서는 사람보다 훨씬 잘 본대요." },
    { id:"TIP-044", cat:"상식", text:"강아지가 잠들기 전 제자리를 빙글빙글 도는 건, 야생 시절 잠자리를 다지던 습성의 흔적이라는 이야기가 있어요." },
    { id:"TIP-045", cat:"상식", text:"강아지의 청력은 사람보다 훨씬 예민해서, 더 멀리 더 높은 소리까지 들을 수 있대요." },
    { id:"TIP-046", cat:"상식", text:"강아지 수염은 장식이 아니라, 주변 공기의 흐름을 감지하는 진짜 감각기관이에요." },
    { id:"TIP-047", cat:"상식", text:"강아지가 하늘을 보고 배를 뒤집는 건, 온전히 마음을 놓았다는 신호래요." },
    { id:"TIP-048", cat:"상식", text:"강아지의 평균 체온은 사람보다 조금 높은 38~39도 정도예요." },
    { id:"TIP-049", cat:"건강정보", text:"포도와 건포도도 강아지에게는 위험한 음식이에요 — 소량이라도 조심하세요." },
    { id:"TIP-050", cat:"건강정보", text:"정기적인 양치질은 강아지 치석·잇몸병 예방에 큰 도움이 돼요." },
    { id:"TIP-051", cat:"건강정보", text:"귀가 늘어진 견종은 귓속 습기가 잘 안 마를 수 있어요, 주기적인 귀 청소가 중요해요." },
    { id:"TIP-052", cat:"건강정보", text:"중성화 수술은 일부 질병 예방과 행동 안정에 도움이 될 수 있어요." },
    { id:"TIP-053", cat:"건강정보", text:"나이가 들수록 정기검진 주기를 더 짧게 잡는 게 좋아요." },
    { id:"TIP-054", cat:"건강정보", text:"강아지에게는 사람이 먹는 짠 음식이 부담될 수 있어요." },
    { id:"TIP-055", cat:"건강정보", text:"갑작스러운 식욕 변화나 무기력함은 병원 방문이 필요하다는 신호일 수 있어요." },
    { id:"TIP-056", cat:"건강정보", text:"이중모 견종은 억지로 밀지 않는 게 오히려 피부 건강에 좋다고 해요." },
    { id:"TIP-057", cat:"세계관", text:"이 아이의 하루는, 당신이 곁에 있어서 완성돼요." },
    { id:"TIP-058", cat:"세계관", text:"오늘도 뭔가 하나쯤은, 이 아이 덕분에 웃으셨을 거예요." },
    { id:"TIP-059", cat:"세계관", text:"짧은 산책도, 이 아이에게는 커다란 모험이었을지 몰라요." },
    { id:"TIP-060", cat:"세계관", text:"말없이 곁을 지키는 것도, 사랑의 한 방식이에요." },
    { id:"TIP-061", cat:"세계관", text:"이 아이가 기억하는 건 아마, 당신의 목소리와 냄새일 거예요." },
    { id:"TIP-062", cat:"세계관", text:"오늘 하루도 무사히, 함께 지나갔어요." },
    { id:"TIP-063", cat:"세계관", text:"서툰 하루여도 괜찮아요, 함께였으니까요." },
    { id:"TIP-064", cat:"세계관", text:"이 아이에게 내일은, 오늘보다 더 좋은 날일 거예요." },
    { id:"TIP-065", cat:"힌트", text:"성장 단계가 바뀌는 날엔, 뭔가 특별한 안내가 뜬대요." },
    { id:"TIP-066", cat:"힌트", text:"며칠 산책을 안 하면, 이 아이도 표정이 조금 달라질지도 몰라요." },
    { id:"TIP-067", cat:"힌트", text:"밤에 산책하면 낮과는 다른 이야기를 만날 수도 있대요." },
    { id:"TIP-068", cat:"힌트", text:"어떤 이야기는 정말 아주 가끔씩만 펼쳐진다고 해요." },
    { id:"TIP-069", cat:"힌트", text:"이 아이의 성격에 따라, 마음을 표현하는 빈도가 다르대요." },
    { id:"TIP-070", cat:"힌트", text:"애착바구니를 가끔 열어보면, 몰랐던 변화를 발견할 수도 있어요." },
    { id:"TIP-071", cat:"힌트", text:"나이가 들어도, 표현하는 방법은 오히려 더 능숙해진대요." },
    { id:"TIP-072", cat:"힌트", text:"임시보호가 끝나는 날, 이 아이는 뭔가를 남기고 간대요." },
    { id:"TIP-073", cat:"유머", text:"시츄는 웬만한 소란에도 눈 하나 깜짝 안 하는, 반려견계의 프로 무표정러래요." },
    { id:"TIP-074", cat:"유머", text:"보더콜리에게 \"기다려\"를 가르치면, 오히려 계획을 다 세우고 있을지도 몰라요." },
    { id:"TIP-075", cat:"유머", text:"시고르자브는 서류상 견종이 없지만, 매력만큼은 어느 순종에도 안 뒤진대요." },
    { id:"TIP-076", cat:"유머", text:"강아지의 산책 속도는 새로운 냄새 개수에 반비례한다는 우스갯소리가 있어요." },
    { id:"TIP-077", cat:"유머", text:"세상에서 제일 어려운 훈련은 \"간식 참기\"라는 이야기, 다들 공감하시죠?" },
    { id:"TIP-078", cat:"유머", text:"진돗개는 낯선 사람보다 낯선 택배 상자를 더 오래 경계한다는 말이 있어요." },
    { id:"TIP-079", cat:"유머", text:"웰시코기의 엉덩이는 그 자체로 이미 하나의 콘텐츠라는 평가가 있어요." },
    { id:"TIP-080", cat:"유머", text:"강아지는 주인이 우울할 때 옆에 딱 붙어있는데, 신기하게 신났을 땐 더 딱 붙어있어요." }
  ];

  // 파스텔 무지개(빨주노초파남보) — 문구 카테고리와 무관하게 배너가 다음 문구로 넘어갈 때마다 다음
  // 순서 색으로 함께 넘어감(순차 순환 — 완전 무작위 대신, 실제로 무지개를 훑는 느낌을 주려는 의도).
  var TIP_BANNER_COLORS = [
    "#E8746F", // 빨강
    "#F0954C", // 주황
    "#DDAE3E", // 노랑(순수 파스텔 노랑은 흰 글씨 대비가 약해 조금 짙게 조정)
    "#6FA97C", // 초록
    "#5B93C9", // 파랑
    "#6C7FC9", // 남색
    "#9B7FC7"  // 보라
  ];

  var tipShuffleQueue = [];
  var tipLastIdx = -1;
  var tipColorIdx = 0;
  var tipRotateTimer = null;
  var TIP_ROTATE_MS = 18000; // 사용자 확인(추천값 12초 대신 18초 선택)

  function refillTipShuffleQueue(){
    var idxs = TIP_CATALOG.map(function(_, i){ return i; });
    for(var i = idxs.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = idxs[i]; idxs[i] = idxs[j]; idxs[j] = tmp;
    }
    // 셔플백 경계에서 방금 봤던 문구가 곧바로 또 나오는 것만 피함(그 외 순서는 완전 무작위)
    if(idxs.length > 1 && idxs[idxs.length - 1] === tipLastIdx){
      var swapAt = Math.floor(Math.random() * (idxs.length - 1));
      var t = idxs[idxs.length - 1]; idxs[idxs.length - 1] = idxs[swapAt]; idxs[swapAt] = t;
    }
    tipShuffleQueue = idxs;
  }
  function nextTipEntry(){
    if(tipShuffleQueue.length === 0) refillTipShuffleQueue();
    var idx = tipShuffleQueue.pop();
    tipLastIdx = idx;
    return TIP_CATALOG[idx];
  }
  function nextTipColor(){
    var c = TIP_BANNER_COLORS[tipColorIdx % TIP_BANNER_COLORS.length];
    tipColorIdx++;
    return c;
  }
  // 컨테이너 폭에 문구가 다 들어가면 굳이 흘리지 않고 정적으로 표시. prefers-reduced-motion이면
  // 애니메이션을 아예 안 걸고, 대신 .tip-banner-text의 CSS text-overflow:ellipsis 말줄임이 자연히
  // 대신해줌(별도 분기 불필요) — 문구 자체가 18초마다 바뀌는 건 "움직임"이 아니라 정보 갱신이라 보고
  // reduceMotion() 예외 없이 그대로 진행하고, 좌우로 흐르는 "티커 애니메이션"만 여기서 끔.
  function layoutTipTicker(){
    var wrap = el.tipBannerText, inner = el.tipBannerTextInner;
    if(!wrap || !inner) return;
    inner.classList.remove("tip-ticking");
    inner.style.removeProperty("--tip-start");
    inner.style.removeProperty("--tip-end");
    inner.style.removeProperty("--tip-dur");
    if(reduceMotion()) return;
    var cw = wrap.clientWidth, tw = inner.scrollWidth;
    if(tw <= cw) return;
    var dist = cw + tw;
    var dur = Math.max(6, Math.min(20, dist / 55)); // 초당 약 55px 속도로 읽기 편한 흐름 유지
    inner.style.setProperty("--tip-start", cw + "px");
    inner.style.setProperty("--tip-end", (-tw) + "px");
    inner.style.setProperty("--tip-dur", dur + "s");
    void inner.offsetWidth; // 강제 리플로우 — 같은 이름의 애니메이션을 다시 걸 때도 처음부터 재생되게 함
    inner.classList.add("tip-ticking");
  }
  function renderNextTip(){
    if(!el.tipBanner || !el.tipBannerTextInner) return;
    var entry = nextTipEntry();
    el.tipBanner.style.backgroundColor = nextTipColor();
    el.tipBannerTextInner.textContent = entry.text;
    layoutTipTicker();
  }
  function stopTipRotation(){
    if(tipRotateTimer){ window.clearInterval(tipRotateTimer); tipRotateTimer = null; }
  }
  function startTipRotation(){
    stopTipRotation();
    if(!el.tipBanner) return;
    renderNextTip();
    tipRotateTimer = window.setInterval(renderNextTip, TIP_ROTATE_MS);
  }

  function rollTrait(list){ return list[Math.floor(Math.random()*list.length)]; }
  function findById(list, id){
    for(var i=0;i<list.length;i++){ if(list[i].id === id) return list[i]; }
    return list[0];
  }
  // 35번(수집아이템 관련 실험 문서 8장): 애착바구니 누적형 아이템 중 나뭇가지(자립감 소모 완화)·
  // 매끈한 낙엽(청결 감소 완화)의 보정치. "10개 -5%/50개 -10%/100개 -15%"를 계단식(구간별 고정값,
  // 누적 합산 아님)으로 해석 — 문서의 다른 누적형 스탯 아이템(민들레 홀씨·조약돌)과 동일한 표현이라
  // 같은 규칙을 적용함.
  function collectionDecayEase(count){
    if(count >= 100) return 0.15;
    if(count >= 50) return 0.10;
    if(count >= 10) return 0.05;
    return 0;
  }
  // effMult()가 이미 "여러 출처의 배수를 곱한다" 구조라, 아이템 보정을 네 번째 출처로 자연스럽게
  // 얹음 — energyDrain(자립감 소모)·cleanDrain(청결 감소) 두 키를 쓰는 기존 호출부(doPlay/trainStat/
  // finishWalk/applyDecay) 전부에 이 파일 안 다른 곳을 고칠 필요 없이 자동으로 적용됨.
  function itemMultSource(){
    var items = (typeof state !== "undefined" && state.walkItems) ? state.walkItems : {};
    return {
      energyDrain: 1 - collectionDecayEase(items["나뭇가지"] || 0),
      cleanDrain: 1 - collectionDecayEase(items["매끈한 낙엽"] || 0)
    };
  }
  // 여러 출처(견종/성격/패시브/수집 아이템)의 배수를 곱해 최종 배수를 계산
  function effMult(){
    var keys = Array.prototype.slice.call(arguments);
    var breed = BREEDS[state.breed] || BREEDS.golden;
    var personality = findById(PERSONALITIES, state.personality);
    var passive = findById(PASSIVES, state.passive);
    var sources = [breed.mult, personality.mult, passive.mult, itemMultSource()];
    var result = 1;
    keys.forEach(function(k){
      sources.forEach(function(src){
        if(src && typeof src[k] === "number") result *= src[k];
      });
    });
    return result;
  }
  // 같은 강도의 활동이라도 이 아이에게 쉬웠는지 힘들었는지에 따라 다른 문장 풀에서 골라요.
  // 수치(배수)는 화면에 보여주지 않고, 그 결과만 문장으로 간접적으로 드러냅니다.
  function tierFor(mult){
    if(mult <= 0.9) return "eager";
    if(mult >= 1.1) return "tired";
    return "normal";
  }
  var FLAVOR = {
    feed: ["냠냠, 정말 맛있어요!","꼬리를 흔들며 기뻐해요.","순식간에 다 먹었어요!"],
    play: {
      eager: ["한바탕 뛰어놀고도 눈빛은 여전히 '더!'예요.","체력이 넘쳐서 벌써 다음 놀이를 기다려요.","신나게 놀고도 아직 팔팔해요."],
      normal: ["신나서 폴짝폴짝 뛰어요!","공을 물고 빙글빙글 돌아요.","행복한 표정이에요."],
      tired: ["신나게 놀았지만 금방 숨을 헐떡여요.","즐거워하다가도 이내 지쳐버려요.","조금 놀았을 뿐인데 벌써 헥헥대요."]
    },
    walk: {
      eager: ["산책이 끝났는데도 목줄을 당기며 더 걷고 싶어해요.","이 정도로는 성에 안 차는지 자꾸 앞장서요.","걷고도 아직 힘이 넘쳐 보여요."],
      normal: ["신선한 바람을 맞으며 걸어요.","냄새를 킁킁 맡으며 탐험해요.","기분 좋게 산책했어요!"],
      tired: ["즐거운 산책이었지만 돌아오는 길엔 걸음이 느려졌어요.","신나게 걷다가도 금방 헐떡이며 뒤처져요.","오늘따라 유독 힘들어해요."]
    },
    bath: ["보송보송 깨끗해졌어요!","거품 목욕이 시원해요.","반짝반짝 윤이 나요."],
    snack: ["특별 간식은 역시 최고예요!"],
    // 63번(14장): [기본돌봄] 신설 활동 — 간식주기(작은 참·군것질, 상점의 유료 "간식"과는 별개)와
    // 쉬게하기(자리 잡고 휴식)의 전용 문구
    treat: ["작은 간식 하나에도 눈이 반짝여요!","오물오물, 기분 좋은 참을 먹어요.","간식 냄새를 맡자마자 꼬리가 빨라져요."],
    rest: ["푹신한 자리에 웅크리고 편히 쉬어요.","기지개를 쭉 켜고 나른하게 늘어져요.","눈을 감고 스르르 낮잠에 빠져요."],
    toy: ["새 장난감이 마음에 들어요!"],
    tired: ["너무 지쳐서 쉬고 싶어해요...","컨디션이 안 좋아요. 잠시 쉬게 해주세요."],
    full: ["이미 배가 불러요.","더는 못 먹겠다는 표정이에요."],
    // 69번: 64번부터 "코인"과 "뼈다귀"가 이미 같은 자원(state.coins)을 가리키는데 이 멘트만 옛 이름을
    // 쓰고 있었음 — 상점 힌트("코인으로 구매"→"뼈다귀로 구매")를 정리하는 김에 함께 통일.
    poor: ["뼈다귀가 모자라요."],
    // 64번(기획문서 15장): 하루 종료 시퀀스(playDayEndSequence) 첫 단계에서 보여주는 하루 마무리 멘트.
    // 문서에 예시로 "오늘도 바빴네" 한 줄만 있어 그 톤을 살려 Claude가 몇 개 더 채움(오픈 이슈로 기록).
    dayEnd: ["오늘도 바빴네... 슬슬 눈이 감기나 봐요.", "하루 종일 잘 놀았다는 듯 크게 하품을 해요.", "오늘 하루도 무사히 지나갔어요."],
    // 64번: 06:00 리셋 직후, 하루 종료 시퀀스가 닫히고 화면이 복귀할 때 덧붙이는 아침 멘트(선택 사항으로
    // 요청됨 — "가능하면 좋겠어"). 문서에 문구가 없어 Claude가 새로 작성(오픈 이슈로 기록).
    morning: ["새 아침이에요! 기지개를 쭉 켜고 눈을 떠요.", "창밖이 밝아오자 코를 킁킁대며 잠에서 깨요.", "상쾌한 아침이에요. 오늘은 또 어떤 하루가 될까요?"]
  };

  // 26번: 기본 스테이터스 8종(석세스모드 참고) — 생활만족도가 허락하는 한도 내에서,
  // 자립감(컨디션)을 들여 훈련하거나 산책 이벤트로 꾸준히 키움
  var CORE_STATS = [
    { key:"power", name:"근력", btn:"trainPower", val:"valPower" },
    { key:"agility", name:"민첩성", btn:"trainAgility", val:"valAgility" },
    { key:"comprehension", name:"이해력", btn:"trainComprehension", val:"valComprehension" },
    { key:"execution", name:"수행력", btn:"trainExecution", val:"valExecution" },
    { key:"loyalty", name:"충성도", btn:"trainLoyalty", val:"valLoyalty" },
    { key:"affinity", name:"친화력", btn:"trainAffinity", val:"valAffinity" },
    { key:"health", name:"건강함", btn:"trainHealth", val:"valHealth" },
    { key:"aggression", name:"공격성", btn:"trainAggression", val:"valAggression" }
  ];
  // 31번: 견종별 시작 스탯 기획 문서(2026-09-01, 강형욱 견종백과 리서치 + 사용자 확인 1차 확정)의
  // 마스터 표를 그대로 옮긴 값. CORE_STATS의 8개 키 순서와 표의 컬럼 순서가 정확히 일치함.
  // 37번(기획문서 9장, 성장 단계 시스템): 이 표의 의미가 "시작값"에서 "성장최대기대치"(찹츄 단계에서
  // 모든 성장이 최대치일 때 개체가 도달하는 절대 상한)로 재정의됨. 표 자체와 시고르자브 혼합 로직
  // (computeMixBaseStats/computeEffectiveBaseStats)의 계산식은 전혀 바뀌지 않고, 그 결과값을 실제
  // 시작 스탯으로 쓰던 개체별 ±20% 변동(jitter, item4)이 아래 GROWTH_* 성장 단계 시스템으로 대체됨.
  var BREED_BASE_STATS = {
    golden:   { power:73, agility:48, comprehension:85, execution:85, loyalty:55, affinity:95, health:50, aggression:20 },
    labrador: { power:78, agility:55, comprehension:85, execution:85, loyalty:78, affinity:75, health:55, aggression:30 },
    // 78-1번(사용자 수정 요청): 진돗개 근력 70→60으로 하향.
    jindo:    { power:60, agility:75, comprehension:75, execution:55, loyalty:95, affinity:35, health:90, aggression:65 },
    shiba:    { power:45, agility:70, comprehension:75, execution:45, loyalty:65, affinity:30, health:80, aggression:65 },
    border:   { power:55, agility:90, comprehension:98, execution:90, loyalty:70, affinity:60, health:60, aggression:45 },
    corgi:    { power:40, agility:65, comprehension:80, execution:65, loyalty:90, affinity:80, health:55, aggression:55 },
    pom:      { power:20, agility:55, comprehension:65, execution:40, loyalty:55, affinity:25, health:45, aggression:90 },
    husky:    { power:85, agility:75, comprehension:70, execution:30, loyalty:30, affinity:80, health:60, aggression:15 },
    shihtzu:  { power:15, agility:30, comprehension:55, execution:50, loyalty:50, affinity:90, health:45, aggression:10 },
    // 78번(24장, 고유능력_입력템플릿_v8.xlsx 반영): 신규 3종.
    // 78-1번(사용자 수정 요청): 비숑프리제 근력 25→45로 상향.
    maltese:  { power:15, agility:50, comprehension:60, execution:40, loyalty:60, affinity:35, health:40, aggression:60 },
    // 78-1번: 푸들은 근력만 사이즈별로 달라짐(소형25/미디엄35/스탠다드55) — 여기 적힌 값(55)은
    // "스탠다드" 기준이자 사이즈 클래스가 없을 때의 기본값이고, 실제 적용값은 아래
    // POODLE_POWER_BY_SIZE로 computeEffectiveBaseStats()에서 덮어씀. 근력을 제외한 나머지 7개
    // 스탯·고유능력은 여전히 3사이즈 전부 완전히 동일.
    poodle:   { power:55, agility:70, comprehension:95, execution:90, loyalty:65, affinity:90, health:60, aggression:10 },
    bichon:   { power:45, agility:60, comprehension:55, execution:55, loyalty:70, affinity:95, health:50, aggression:15 }
  };
  // 78번: 푸들 전용 "크기 클래스" — 그래픽 크기만 이 배율로 차등 적용됨(9장 성장단계 스케일과
  // 곱연산으로 함께 적용 — drawPixelDog/drawWalkFrontDog의 breedSizeScale() 참고).
  // 배정 확률(균등 1/3)은 문서에 명시가 없어 개발팀이 기본값으로 채움(오픈 이슈, 실플레이 후 조정 가능).
  var POODLE_SIZE_SCALE = { small:0.70, medium:0.85, standard:1.00 };
  var POODLE_SIZE_LABEL = { small:"소형", medium:"미디엄", standard:"스탠다드" };
  var POODLE_SIZE_CLASSES = ["small","medium","standard"];
  // 78-1번(사용자 수정 요청): "소형/중형/대형에 따라 근력수치를 25/35/55로" — 기존 3사이즈 크기
  // 클래스(small/medium/standard)에 그대로 매핑(대형=standard). 근력만 사이즈별로 달라지는
  // 유일한 스탯이며, computeEffectiveBaseStats()(023번)가 이 표로 BREED_BASE_STATS.poodle.power를
  // 덮어씀 — 다른 7개 스탯·고유능력은 여전히 3사이즈 공통.
  var POODLE_POWER_BY_SIZE = { small:25, medium:35, standard:55 };
  function breedSizeScale(){
    if(typeof state === "undefined") return 1;
    if(state.breed === "poodle" && state.breedSizeClass && POODLE_SIZE_SCALE[state.breedSizeClass] != null){
      return POODLE_SIZE_SCALE[state.breedSizeClass];
    }
    return 1;
  }
  // 37번: 성장 단계 시스템(기획문서 9장, 1차 확정) — 이동장에서 반려견을 만나는 순간(온보딩) 4단계 중
  // 하나가 시작 성장단계로 25%씩 균등 확률 배정됨. 기존에 있던 STAGE_NAMES/stageIndex/STAGE_THRESHOLDS
  // (유대감 누적치로 아기→청소년→성견을 가르는, 반려견 실루엣용 완전히 별개의 시스템)와 이름이 겹치지
  // 않도록 전부 GROWTH_ 접두사를 사용함 — 서로 관련 없는 두 "성장 단계" 개념이니 혼동 주의.
  var GROWTH_STAGE_NAMES = ["털뭉치","개춘기","찹츄","찹찹츄"];
  // 70번(기획 문서 20장, 성장 단계 시각화 1차 확정): 그래픽을 새로 그리지 않고 "파라미터 변형"만으로
  // 4단계를 표현 — GROWTH_STAGE_NAMES와 완전히 같은 순서(인덱스 0~3)로 나열.
  // scale: drawPixelDog()가 그리는 체고(H) 배율(70/85/100/90%, 사용자가 Claude 원안 75/90/100/95에서
  // 최종 조정). timeMult: 멍멍모드 유휴 포즈·산책 이벤트 포즈 애니메이션의 지속시간 배율(1보다 작으면
  // "빠르고 부산스럽게", 크면 "느리고 여유롭게" — 사용자가 표로 지정한 속도감을 수치로 변환한 값이라
  // 정확한 배율 자체는 개발팀 판단, 오픈 이슈). earPerk: 귀 크기 추가 배율(쫑긋한/처진 인상 보정).
  // headDroop: 머리를 살짝 낮춰 그릴 픽셀 오프셋. grey: true면 찹찹츄 전용 "입가·눈가 옅은 회색 톤" +
  // 털색 옅은 탈채도(6장 세계관의 "늙어감" 정서를 그래픽에 처음 반영).
  var GROWTH_STAGE_VISUAL = [
    { scale:0.70, timeMult:0.72, earPerk:1.10, headDroop:0, grey:false }, // 털뭉치: 통통 튀는 느낌·귀가 쫑긋·빠르고 부산스럽게
    { scale:0.85, timeMult:0.88, earPerk:1.0,  headDroop:0, grey:false }, // 개춘기: 활발함·약간 들뜬 자세·보통보다 살짝 빠르게
    { scale:1.00, timeMult:1.0,  earPerk:1.0,  headDroop:0, grey:false }, // 찹츄: 안정적인 기본 자세·기준 속도
    { scale:0.90, timeMult:1.35, earPerk:0.92, headDroop:2, grey:true  }  // 찹찹츄: 고개가 살짝 낮음·느리고 여유롭게·회색 톤
  ];
  function growthVisual(){
    var idx = (typeof state !== "undefined" && typeof state.growthStage === "number") ? state.growthStage : 2;
    return GROWTH_STAGE_VISUAL[idx] || GROWTH_STAGE_VISUAL[2];
  }
  // 75번(기획문서 21장, 수정안 B): 스탯 기반 그래픽 개성화 — 누적 기본능력 8종을 drawPixelDog()의
  // 추가 입력값으로 변환하는 함수. growthVisual()과 같은 패턴(파라미터 배율/오프셋 묶음을 반환)이며,
  // 새 그래픽 세트를 그리지 않고 기존 드로잉 로직의 계산값에 곱/더하기만 하는 방식(사용자 원칙 그대로).
  // 수치 범위(예: 근력이 몇 이상일 때 체형이 얼마나 커지는지)는 21장에 "미정 — 개발 시 확인 필요"로
  // 명시돼 있어 Claude가 판단해 채움(오픈 이슈로 기록) — 전부 50을 "평균/변화 없음" 기준으로 삼아
  // 좌우로 완만하게(대부분 ±10~15% 이내) 보정해, 스탯 하나가 실루엣을 망가뜨리지 않게 함.
  function statVisual(){
    var c = (typeof state !== "undefined" && state.core) ? state.core : {};
    var power = typeof c.power === "number" ? c.power : 50;
    var agility = typeof c.agility === "number" ? c.agility : 50;
    var comprehension = typeof c.comprehension === "number" ? c.comprehension : 50;
    var execution = typeof c.execution === "number" ? c.execution : 50;
    var loyalty = typeof c.loyalty === "number" ? c.loyalty : 50;
    var affinity = typeof c.affinity === "number" ? c.affinity : 50;
    var health = typeof c.health === "number" ? c.health : 50;
    var aggression = typeof c.aggression === "number" ? c.aggression : 50;
    function norm(v){ return (v - 50) / 50; } // 0~100 → -1~+1
    function pos(v){ return Math.max(0, norm(v)); } // 평균 이상일 때만 0~1
    return {
      // 근력 → 체형(가슴·어깨 폭) 비율 소폭 확대(±12%)
      bodyWMult: 1 + norm(power) * 0.12,
      // 민첩성 → 다리 비율 소폭 길게(±10%) + 스프린터형으로 살짝 앞으로 기운 자세(최대 ±1px)
      legHMult: 1 + norm(agility) * 0.10,
      leanForwardPx: Math.round(norm(agility)),
      // 이해력 → 귀가 항상 쫑긋 선 기본 자세(처진귀도 소폭 덜 늘어지게, 최대 +15%)
      // (고개 갸웃 idle 포즈 확률 증가는 애니메이션/상태머신 레벨이라 이번 라운드 범위 밖 — 오픈 이슈)
      earAlertMult: 1 + pos(comprehension) * 0.15,
      // 수행력 → 자세가 반듯하고 정렬됨: 노년기(찹찹츄) 특유의 headDroop을 수행력이 높을수록 완화
      postureStraighten: pos(execution),
      // 충성도 → 눈매가 부드러움 / 친화력 → 눈이 더 둥글게: 둘 다 눈 크기를 살짝 키워 표현(합산 최대 +20%)
      eyeSoftMult: 1 + (pos(loyalty) + pos(affinity)) * 0.10,
      // 친화력 → 꼬리가 기본값으로 살짝 들려있음(살랑/수달 꼬리 계열, 최대 2px)
      // (좌우로 흔들리는 idle 확률 증가는 애니메이션 레벨이라 이번 라운드 범위 밖 — 오픈 이슈)
      tailLiftPx: Math.round(pos(affinity) * 2),
      // 건강함 → 털 하이라이트(윤기) 레이어 강화(최대 알파 0.30)
      furShineAlpha: pos(health) * 0.30,
      // 공격성 → 귀가 살짝 뒤로 젖혀진 기본 자세(귀 스케일 최대 -12%), 눈매가 날카로움(눈 최대 -15%)
      earBackMult: 1 - pos(aggression) * 0.12,
      eyeSharpMult: 1 - pos(aggression) * 0.15
    };
  }
  // 75번(기획문서 21장, 수정안 B): 능력 보유 → 시각적 표식(원칙만 반영, 40여 종 개별 매핑은 다음
  // 라운드로 — 개발팀 제안 후 사용자 확인 예정). state.abilities 4분류 중 온보딩에서 전원에게 항상
  // 자동 부여되는 성격·패시브(personality:/passive: 접두사)는 육성 방향과 무관해 "다르게 키우면
  // 다르게 생김"의 신호가 못 되므로 제외하고, ABILITY_CATALOG에서 실제로 취득한 능력(catalog: 접두사)만
  // 표식 대상으로 삼음. ABILITY_BADGE_MAX로 캡을 둬 능력이 많아져도 화면이 어지러워지지 않게 함
  // (캡 값·표식 모양은 Claude 판단, 오픈 이슈 — 실플레이 후 조정 가능).
  var ABILITY_BADGE_MAX = 6;
  function ownedCatalogAbilities(){
    if(typeof state === "undefined" || !state.abilities) return [];
    var out = [];
    ["innateUnique","innateCommon","acquiredUnique","acquiredCommon"].forEach(function(cat){
      (state.abilities[cat] || []).forEach(function(a){
        if(a && a.id && a.id.indexOf("catalog:") === 0) out.push(a);
      });
    });
    return out;
  }
  // 시작 성장단계별 초기 스탯 비율(성장최대기대치 대비 [최소,최대]) — 8개 스탯 각각 독립적으로 굴리고
  // 절사(Math.floor)함. 시작 확률은 4단계 균등(25%)이 문서의 기본값.
  var GROWTH_STAGE_RATIO = [[0.30,0.50],[0.60,0.90],[0.90,1.00],[0.20,0.50]];
  // 시작 성장단계별 전환 일정(state.fosterDay 기준 절대 일차) — [{day, to}]. 개춘기 체류 기간이
  // 진입 경로에 따라 다르고(털뭉치 경유 10일 vs 개춘기 시작 15일), 찹츄를 거쳐서 도달한 개(털뭉치·
  // 개춘기 출신)는 이번 30일 테스트 구간에서 찹찹츄로 전환되지 않음 — 둘 다 문서에서 "의도된 설계"로
  // 사용자가 확정한 부분이라 그대로 구현.
  var GROWTH_TRANSITION_SCHEDULE = [
    [{ day:16, to:1 }, { day:26, to:2 }], // 털뭉치 시작
    [{ day:16, to:2 }],                    // 개춘기 시작
    [{ day:25, to:3 }],                    // 찹츄 시작
    []                                      // 찹찹츄 시작 — 전환 없음
  ];
  // 산책 이벤트로 발생하는 "기본 스테이터스(core.*)" 가감에만 적용되는 성장단계별 가중치(현재 단계 기준).
  // 단계 전환 시 지급되는 1회성 고정 보너스(GROWTH_STAGE_BONUS)는 이 배율의 영향을 받지 않음(문서 명시).
  var GROWTH_WALK_MULT = [
    { gain:3,   loss:2   }, // 털뭉치 — 쑥쑥 크는 만큼 기복도 큼
    { gain:2,   loss:2.5 }, // 개춘기 — 감정 기복이 표 전체에서 가장 큼(사춘기 컨셉)
    { gain:1,   loss:1   }, // 찹츄 — 기준 배율(변화 없음)
    { gain:1,   loss:2   }  // 찹찹츄 — 노화로 하락만 더 크게
  ];
  // 단계 전환 시 지급되는 "전체 기본능력 일정치 상승" 값 — 기획 문서 9장에 "수치 미정"으로 명시되어
  // 있어 Claude가 판단해 채운 예시값(오픈 이슈, 37번 계획 문서에 기록). 개체별 성장최대기대치
  // (state.growthMaxStats)를 넘지 못하도록 상한 클램프가 함께 적용됨.
  var GROWTH_STAGE_BONUS = 5;
  // 전환 시점마다 노출할 팝업 멘트 — 문서에 문구가 없어 Claude가 새로 작성(오픈 이슈로 기록).
  var GROWTH_TRANSITION_FLAVOR = {
    1: { title:"개춘기가 되었어요!", desc:"포동포동하던 털뭉치 시절을 지나 어느새 부쩍 자랐어요. 어딘가 마음도 몸도 부산스러워진 것 같아요. 기본 능력치가 조금 올랐어요!" },
    2: { title:"의젓한 찹츄가 되었어요!", desc:"이제 제법 안정적인 모습이에요. 하루하루 단단하게 자리를 잡아가고 있어요. 기본 능력치가 조금 올랐어요!" },
    3: { title:"찹찹츄가 되었어요", desc:"천천히, 곱게 나이가 들어가고 있어요. 함께한 시간이 만든 여유가 느껴져요. 기본 능력치가 조금 올랐어요!" }
  };
  var SKILL_LABELS = ["아직 서툴러요","조금 늘었어요","제법 해내요","능숙해요","전문가 같아요"];
  var TRAIN_FLAVOR = {
    power: {
      normal: ["힘차게 달리는 연습을 했어요!","다리에 힘이 붙는 게 느껴져요.","오늘도 신나게 뛰었어요."],
      forced: ["무리해서 달렸더니 많이 힘들어 보여요...","컨디션이 안 좋은데 억지로 뛰었어요."]
    },
    agility: {
      normal: ["장애물을 요리조리 잘 피해요.","몸놀림이 점점 재빨라져요.","균형 감각이 좋아지고 있어요."],
      forced: ["비틀거리면서도 훈련을 마쳤어요.","무리한 탓인지 움직임이 둔해 보여요."]
    },
    comprehension: {
      normal: ["새로운 손짓을 금방 알아채요.","눈치가 점점 빨라지고 있어요.","집중해서 잘 들어줘요."],
      forced: ["집중력이 떨어져서 잘 못 알아들어요.","피곤한지 자꾸 딴 데를 봐요."]
    },
    execution: {
      normal: ["시킨 대로 척척 해내요!","훈련한 동작을 잘 따라해요.","자신있게 명령을 수행해요."],
      forced: ["몸이 안 따라주는지 자꾸 실수해요.","무리해서인지 동작이 흐트러져요."]
    },
    loyalty: {
      normal: ["눈을 맞추며 곁을 지켜요.","부르면 바로 달려와요.","믿음이 점점 쌓이고 있어요."],
      forced: ["억지로 시켰더니 눈치를 봐요.","마지못해 따르는 기색이에요."]
    },
    affinity: {
      normal: ["처음 보는 사람에게도 살갑게 다가가요.","다른 강아지와도 스스럼없이 어울려요.","사교성이 점점 느는 것 같아요."],
      forced: ["낯선 자리를 불편해하며 몸을 사려요.","억지로 어울리다 지쳐버렸어요."]
    },
    health: {
      normal: ["체력검사를 씩씩하게 잘 받았어요.","전반적인 컨디션이 눈에 띄게 좋아졌어요.","몸이 한결 튼튼해진 것 같아요."],
      forced: ["무리한 탓인지 컨디션이 나빠 보여요.","몸살이 날까 걱정되는 상태예요."]
    },
    aggression: {
      normal: ["낯선 상대에게 당당하게 짖어봐요.","경계심을 드러내며 자기 영역을 지켜요.","기 싸움에서 지지 않으려 해요."],
      forced: ["과하게 예민해져서 자꾸 으르렁대요.","훈련이 아니라 스트레스 풀이가 돼버렸어요."]
    }
  };

  // 28번: 유저가 엑셀로 채워 보내준 고유능력 예시들의 카탈로그. state.abilities(실제 소지 목록)와는 별개로
  // "이런 능력이 존재한다"는 정의만 담아두고, 간단한 확률 조건(견종·체구 기반)은 onboardRoll로 온보딩 때
  // 실제로 굴려서 부여하고, 그보다 복잡한 습득 조건(예: NPC 10명과 친밀도 달성)은 아직 실제 이벤트로
  // 구현하지 않았으므로 [능력보기] 화면의 테스트 버튼으로 직접 눌러 획득/삭제해보며 확인할 수 있게 함(더미 방식).
  // 40번: 고유능력 입력템플릿 v2(2026-09-02) 반영 — B열 "분류(긍정/부정/중립)"가 새로 생겨
  // tone 필드로 명시적으로 저장함(기존엔 positive 불리언 하나로만 판단했는데, "너, 내 주인이 되라!"처럼
  // 득실이 섞여 중립으로 재분류된 경우가 생겨 tone이 있으면 그걸 최우선으로 씀 — abilityTone() 참고).
  var ABILITY_CATALOG = [
    {
      id:"heyhey", name:"헤헤", category:"innateUnique", tone:"positive", positive:true, breed:"golden",
      desc:"산책 중 새로운 만남이 발생할 확률 +10%p, 친화력 +5",
      note:"골든 리트리버로 시작하면 50% 확률로 부여돼요(변동 없음). 친화력 +5는 이번에 실제 수치로 반영. \"산책 중 새로운 만남 확률 +10%p\"와 \"3회 이상 거절 시 삭제되고 대신 우울증 취득\"은 산책 중 만남을 수락/거절하는 선택형 이벤트 자체가 지금 화면엔 없어서(34번에서 선택형 카드를 다이어리 카드로 교체하며 보류) 아직 걸 수 없는 조건 — 되살아나면 함께 구현 예정.",
      onboardRoll:function(){ return state.breed === "golden" ? 0.5 : 0; },
      onGrant:function(){
        state.core.affinity = clamp(state.core.affinity + 5, 0, 100);
      }
    },
    {
      id:"depression", name:"우울증", category:"acquiredCommon", tone:"negative", positive:false,
      desc:"산책횟수 최대치 -1, 모든 기본능력 -5, 활동(산책·훈련)으로 얻는 기본능력 증가폭 10% 감소",
      note:"41번: 초기(28번) 버전에 있던 \"선천적으로 이동장에서 시작할 때 가질 확률 3%, 모든 견종\" 취득 경로를 사용자 요청으로 되살림 — v2 반영(40번) 때 행동 기반 조건 3가지로 명세가 구체화되며 뺐었는데, 그 3가지가 아직 자동 추적이 안 돼 우울증이 사실상 도달 불가능해진 상태였음. 이제 온보딩 3% 확률(모든 견종 공통) + 기존 3가지 행동 조건(아직 미구현) 두 경로가 공존. \"활동 능력수치 10% 감소\"는 40번에서 반영 — 산책 이벤트·훈련으로 기본능력이 오르는 모든 지점에 0.9배를 곱함.",
      onboardRoll:function(){ return 0.03; },
      onGrant:function(){
        CORE_STATS.forEach(function(s){ state.core[s.key] = clamp(state.core[s.key] - 5, 0, 100); });
        state.walk.maxCharges = clamp(state.walk.maxCharges - 1, 1, 5);
      },
      onRevoke:function(){
        state.walk.maxCharges = clamp(state.walk.maxCharges + 1, 1, 5);
      }
    },
    {
      id:"jointCare", name:"관절조심", category:"innateCommon", tone:"negative", positive:false,
      desc:"산책 및 모든 활동에서 부상 위험이 10% 증가",
      note:"대형견 10% / 중형견 5% / 소형견 3% 확률로 선천적으로 갖고 시작해요(v2와 수치 동일, 변동 없음). 부상 시스템 자체가 아직 없어서, 지금은 효과가 실제로 발동하진 않아요.",
      onboardRoll:function(){
        var sizeBreedId = (state.breed === "mix" && state.mixGeoBreed) ? state.mixGeoBreed : state.breed;
        var size = SIZE_LABEL[sizeBreedId] || "중형";
        return size === "대형" ? 0.10 : (size === "소형" ? 0.03 : 0.05);
      }
    },
    {
      id:"hoarder", name:"이것도 내꺼~ 저것도 내꺼~", category:"acquiredCommon", tone:"negative", positive:false,
      desc:"건강함 -5, 민첩성 -10 (비만 위험률 +20%는 아직 미구현)",
      note:"포만감 100을 연속 10회 이상 달성하면 얻는 능력이에요(v2에서 \"연속\" 기준으로 확정). 연속 카운트 로직은 아직 없어 자동 취득은 못 걸었어요.",
      onGrant:function(){
        state.core.health = clamp(state.core.health - 5, 0, 100);
        state.core.agility = clamp(state.core.agility - 10, 0, 100);
      }
    },
    {
      id:"roundEarth", name:"지구는 둥그니까!", category:"acquiredCommon", tone:"positive", positive:true,
      desc:"친화력 +2, 공격성 -2",
      note:"등장인물·등장견 10마리 이상과 친해지면 얻는 능력이에요(아직 친밀도 시스템이 없어 자동 획득은 미구현). 골든 리트리버는 5% 확률로 선천 능력으로 태어나기도 해요(변동 없음).",
      onboardRoll:function(){ return state.breed === "golden" ? 0.05 : 0; },
      onGrant:function(){
        state.core.affinity = clamp(state.core.affinity + 2, 0, 100);
        state.core.aggression = clamp(state.core.aggression - 2, 0, 100);
      }
    },
    {
      id:"myOwner", name:"너, 내 주인이 되라!", category:"innateUnique", tone:"neutral", positive:true, breed:"golden",
      desc:"충성도 -5, 친화력 +10, 공격성 -5",
      note:"골든 리트리버로 시작하면 60% 확률로 획득해요(변동 없음). v2에서 분류가 \"중립\"으로 명시돼 카드 색을 초록(중립)으로 바꿈 — 득실이 섞여 있어 긍정으로 보기 애매하다는 안내 원칙 그대로 반영. 2세대 이내 혈통에 골든 리트리버가 있고 모든 등장인물과 친밀도가 보통 이상이면 후천적으로도 얻을 수 있어요(친밀도 시스템 없어 아직 미구현).",
      onboardRoll:function(){ return state.breed === "golden" ? 0.6 : 0; },
      onGrant:function(){
        state.core.loyalty = clamp(state.core.loyalty - 5, 0, 100);
        state.core.affinity = clamp(state.core.affinity + 10, 0, 100);
        state.core.aggression = clamp(state.core.aggression - 5, 0, 100);
      }
    },
    // 40번: 여기서부터 v2 엑셀로 신규 반영된 15종.
    {
      id:"depressionCured", name:"우울증 극뽁!", category:"acquiredCommon", tone:"positive", positive:true,
      desc:"산책 최대횟수 5로 회복(기본 4가 아닌 +1)",
      note:"'우울증'이 치료(삭제)될 때 20% 확률로 얻는 후속 능력이에요. 우울증 자체의 자동 치료 조건이 아직 안 걸려 있어 지금은 이 능력도 자동으론 안 붙지만, 정의는 미리 마련해뒀어요.",
      onGrant:function(){ state.walk.maxCharges = clamp(state.walk.maxCharges + 1, 1, 5); },
      onRevoke:function(){ state.walk.maxCharges = clamp(state.walk.maxCharges - 1, 1, 5); }
    },
    {
      id:"loyalPartner", name:"든든한 파트너", category:"innateUnique", tone:"positive", positive:true, breed:"labrador",
      desc:"수행력 +5, 산책 중 \"부름에 달려오기\" 계열 이벤트 발생확률 +10%p",
      note:"래브라도로 시작하면 40% 확률로 부여돼요. 이벤트 발생확률 보정은 아직 이벤트 가중치 시스템에 능력 변수를 안 걸어놔서 다음 라운드로 미룹니다.",
      onboardRoll:function(){ return state.breed === "labrador" ? 0.4 : 0; },
      onGrant:function(){ state.core.execution = clamp(state.core.execution + 5, 0, 100); }
    },
    {
      id:"onlyOneOwner", name:"오직 한 사람", category:"innateUnique", tone:"neutral", positive:true, breed:"jindo",
      desc:"충성도 +8, 친화력 -5",
      note:"진돗개로 시작하면 50% 확률로 부여돼요.",
      onboardRoll:function(){ return state.breed === "jindo" ? 0.5 : 0; },
      onGrant:function(){
        state.core.loyalty = clamp(state.core.loyalty + 8, 0, 100);
        state.core.affinity = clamp(state.core.affinity - 5, 0, 100);
      }
    },
    {
      id:"myOwnWay", name:"내 방식대로 할래", category:"innateUnique", tone:"neutral", positive:true, breed:"shiba",
      desc:"이해력 +3, 수행력 -5",
      note:"시바견으로 시작하면 50% 확률로 부여돼요.",
      onboardRoll:function(){ return state.breed === "shiba" ? 0.5 : 0; },
      onGrant:function(){
        state.core.comprehension = clamp(state.core.comprehension + 3, 0, 100);
        state.core.execution = clamp(state.core.execution - 5, 0, 100);
      }
    },
    {
      id:"modelStudent", name:"타고난 모범생", category:"innateUnique", tone:"positive", positive:true, breed:"border",
      desc:"이해력 +5, 수행력 +5",
      note:"보더콜리로 시작하면 50% 확률로 부여돼요.",
      onboardRoll:function(){ return state.breed === "border" ? 0.5 : 0; },
      onGrant:function(){
        state.core.comprehension = clamp(state.core.comprehension + 5, 0, 100);
        state.core.execution = clamp(state.core.execution + 5, 0, 100);
      }
    },
    {
      id:"shortLegsBigLove", name:"짧은 다리, 큰 사랑", category:"innateUnique", tone:"positive", positive:true, breed:"corgi",
      desc:"충성도 +5, 친화력 +5",
      note:"웰시코기로 시작하면 50% 확률로 부여돼요.",
      onboardRoll:function(){ return state.breed === "corgi" ? 0.5 : 0; },
      onGrant:function(){
        state.core.loyalty = clamp(state.core.loyalty + 5, 0, 100);
        state.core.affinity = clamp(state.core.affinity + 5, 0, 100);
      }
    },
    {
      id:"smallButFierce", name:"작지만 매서워요", category:"innateUnique", tone:"negative", positive:false, breed:"pom",
      desc:"공격성 +8, 스트레스(만족도) 상승 속도 소폭 증가",
      note:"포메라니안으로 시작하면 50% 확률로 부여돼요. 스트레스 상승 속도 보정은 아직 안 걸었어요(다음 라운드).",
      onboardRoll:function(){ return state.breed === "pom" ? 0.5 : 0; },
      onGrant:function(){ state.core.aggression = clamp(state.core.aggression + 8, 0, 100); }
    },
    {
      id:"myOwnPace", name:"내 갈 길은 내가", category:"innateUnique", tone:"neutral", positive:true, breed:"husky",
      desc:"근력 +5, 수행력 -5",
      note:"시베리안 허스키로 시작하면 50% 확률로 부여돼요.",
      onboardRoll:function(){ return state.breed === "husky" ? 0.5 : 0; },
      onGrant:function(){
        state.core.power = clamp(state.core.power + 5, 0, 100);
        state.core.execution = clamp(state.core.execution - 5, 0, 100);
      }
    },
    {
      id:"easyGoing", name:"세상만사 평화로워", category:"innateUnique", tone:"positive", positive:true, breed:"shihtzu",
      desc:"스트레스(만족도) 상승 속도 대폭 완화",
      note:"시츄로 시작하면 50% 확률로 부여돼요. 스트레스 상승 속도 보정은 고정 수치 효과가 아니라 다음 라운드로 미룹니다.",
      onboardRoll:function(){ return state.breed === "shihtzu" ? 0.5 : 0; }
    },
    // 78번(24장, 고유능력_입력템플릿_v8.xlsx 53~55행): 신규 견종 3종(몰티즈·푸들·비숑프리제) 전용 고유능력.
    // 셋 다 효과가 "배율"이거나 "조건부 시너지"거나 "낮은 확률의 런타임 이벤트"라, 다른 견종들의 유사
    // 사례(든든한 파트너의 이벤트 확률 보정, 세상만사 평화로워의 상승속도 완화 등)와 같은 이유로 실제
    // 배율/이벤트 파이프라인은 아직 안 걸려있음 — 정의만 등록해두고 다음 라운드로 미룸(오픈 이슈).
    {
      id:"aloofOne", name:"새침데기", category:"innateUnique", tone:"neutral", positive:true, breed:"maltese",
      desc:"친화력 상승효과 ×0.7, 충성도 상승효과 ×1.3",
      note:"몰티즈로 시작하면 50% 확률로 부여돼요. 몰티즈 특유의 '폐쇄적 사회성'(아무나 안 좋아하지만 마음 준 사람껜 끝까지 곁을 지킴, 24장 리서치 근거) 반영. 친화력/충성도가 오르는 지점마다 이 배율을 걸려면 gain 파이프라인 전체를 손봐야 해서, 이번엔 정의만 등록하고 실제 배율 적용은 다음 라운드로 미룹니다.",
      onboardRoll:function(){ return state.breed === "maltese" ? 0.5 : 0; }
    },
    {
      id:"emotionReader", name:"마음을 읽어요", category:"innateUnique", tone:"positive", positive:true, breed:"poodle",
      desc:"견생만족도 스트레스가 높은 상태일 때 함께 있으면 유대감 획득량 증가(조건부 시너지, 구체 수치 미정)",
      note:"푸들(소형/미디엄/스탠다드 공통)로 시작하면 50% 확률로 부여돼요. 강형욱 훈련사가 '주인의 감정을 파악하는 데 최고'라고 평가한 푸들 특유의 정서 감지 능력 반영(24장 리서치 근거). 정확한 배율 자체가 원안 엑셀에 '미정'으로 명시돼 있어, 스트레스 연동 시너지는 수치가 확정되는 다음 라운드에 구현합니다.",
      onboardRoll:function(){ return state.breed === "poodle" ? 0.5 : 0; }
    },
    {
      id:"bichonTime", name:"비숑타임!", category:"innateUnique", tone:"neutral", positive:true, breed:"bichon",
      desc:"낮은 확률로 산책·휴식 중 폭발적 에너지 이벤트 발생 — 민첩성·근력 큰 폭 상승과 함께 스트레스도 소폭 상승",
      note:"비숑프리제로 시작하면 50% 확률로 부여돼요. 실제 비숑프리제 보호자들 사이에서 '비숑타임'이라 불리는 폭발적 에너지 분출 현상을 그대로 능력화(24장 리서치 근거). '낮은 확률'·'큰 폭'의 정확한 수치가 아직 없어, 산책·휴식 틱에 실제 이벤트를 발동시키는 로직은 다음 라운드로 미룹니다.",
      onboardRoll:function(){ return state.breed === "bichon" ? 0.5 : 0; }
    },
    {
      id:"strangerShy", name:"낯가림쟁이", category:"acquiredCommon", tone:"negative", positive:false,
      desc:"산책 중 \"새로운 친구 만남\" 계열 이벤트 발생확률 -15%p, 친화력 -3",
      note:"산책 중 낯선 상대에게 짧은 기간 내 3회 이상 놀라거나 짖으면 얻는 능력인데, 그런 반응을 따로 기록하는 시스템이 아직 없어 자동 취득은 못 걸었어요. 이벤트 발생확률 보정도 다음 라운드.",
      onGrant:function(){ state.core.affinity = clamp(state.core.affinity - 3, 0, 100); }
    },
    {
      id:"napMaster", name:"낮잠 명수", category:"acquiredCommon", tone:"neutral", positive:true,
      desc:"스트레스(만족도) 감소 속도 증가, 청결(만족도) 감소 속도 소폭 증가",
      note:"하루 산책 횟수를 다 안 채우고 쉬는 날이 누적 5회 이상이면 얻는 능력인데, 지금 임시보호 테스트 모드(33·39번)는 하루가 뼈다귀를 다 써야만 넘어가게 돼 있어 \"산책을 안 쉬는 날\" 자체가 테스트 중엔 생기기 어려워요 — 정식 모드(실시간 진행)로 넘어가면 자연히 조건이 성립할 수 있는 구조라, 지금은 정의만 두고 자동 취득·속도 보정은 다음 라운드로 미룹니다.",
    },
    {
      id:"scentDetective", name:"킁킁 탐정", category:"acquiredCommon", tone:"positive", positive:true,
      desc:"후각 계열 산책 이벤트(냄새맡기 등)로 얻는 이해력 획득량 +50%",
      note:"모든 견종 공통으로 온보딩 시 3% 확률로 선천 취득 가능(v2 신규 수치). 후각 계열 이벤트 누적 20회로 후천 취득하는 경로와 +50% 보정 자체는 이벤트 카테고리별 배율 시스템이 아직 없어 다음 라운드로 미룹니다.",
      onboardRoll:function(){ return 0.03; }
    },
    {
      id:"scaredyCat", name:"겁쟁이", category:"acquiredCommon", tone:"negative", positive:false,
      desc:"스트레스(만족도) 상승 배율 ×1.5",
      note:"짧은 기간 내 부정적 산책 이벤트를 3회 이상 연속 겪으면 얻는 능력인데, 이벤트를 긍정/부정으로 태깅해 연속 카운트하는 시스템이 아직 없어 자동 취득은 못 걸었어요. 배율 보정도 다음 라운드.",
    },
    {
      id:"luckyPaws", name:"행운의 발바닥", category:"acquiredCommon", tone:"positive", positive:true,
      desc:"희귀 등급 이상 산책 이벤트·애착바구니 아이템 드랍확률 +5%p",
      note:"\"네잎클로버\"(애착바구니 아이템)나 \"유성 목격\" 이벤트로 얻는 능력인데, 이 둘 다 지금 애착바구니 10종(35번)·산책 이벤트 55종 어디에도 아직 없는 신규 콘텐츠라 다음 라운드에 그 아이템·이벤트부터 먼저 만들어야 연결할 수 있어요.",
    },
    {
      id:"mixCombo", name:"둘도 없는 조합", category:"innateUnique", tone:"positive", positive:true, breed:"mix",
      desc:"건강함 +8, 민첩성 +2",
      note:"시고르자브로 시작하면 60% 확률로 부여돼요. 어떤 두 견종이 부모로 뽑히든 상관없이 동일 적용.",
      onboardRoll:function(){ return state.breed === "mix" ? 0.6 : 0; },
      onGrant:function(){
        state.core.health = clamp(state.core.health + 8, 0, 100);
        state.core.agility = clamp(state.core.agility + 2, 0, 100);
      }
    },
    // 52번: v2_03 엑셀로 신규 반영 — 소통버튼(11장) 시스템과 직접 연동되는 첫 고유능력.
    {
      id:"chatterbox", name:"수다쟁이", category:"acquiredCommon", tone:"neutral", positive:true,
      desc:"스테이터스 변화는 없음 — 소통버튼으로 표현할 때 조합하는 단어 개수의 최소값이 그 시점 기준보다 1개 늘어남",
      note:"모든 견종 공통으로 온보딩 시 3% 확률로 선천 취득 가능. 후천적으로는 유휴 소통 이벤트에 [호응해준다]로 응답한 누적 횟수가 20회에 도달하면 자동 취득되고, 화면에 \"우리 개가 곧 사람말도 하겠는걸?\" 팝업이 뜸(엑셀 원안 그대로 실제 카운트를 구현 — talkIdleYes 클릭 핸들러에서 state.abilityCounters.talkIdleAcceptCount로 누적). 다른 \"20회\" 계열 능력(킁킁 탐정 등)과 달리 이 조건은 이미 있는 UI 클릭 이벤트라 바로 자동 취득을 걸 수 있었음. \"최소값 +1\" 효과는 talkWordCountRange()에서 직접 반영됨.",
      onboardRoll:function(){ return 0.03; }
    },
    // 60번: 고유능력_입력템플릿_v4.xlsx 신규 — 지역 전담 능력 14종(7개 지역 × 긍정/부정 1쌍).
    // onboardRoll을 개별로 걸지 않는 이유: 이 14종은 "10% 확률로 그중 1개가 균등(1/14)하게 뽑힌다"는
    // 하나의 사건이라, 각자 독립 확률(10%/14)로 걸면 실제 "적어도 하나 뽑힐 확률"이 10%에서 미묘하게
    // 어긋나고 극히 드물게 같은 지역의 긍/부정 쌍이 동시에 뽑히는 사고(상호 배타 원칙 위반)도 이론상
    // 가능해짐 — 그래서 이 14종만 별도로 startBtn 핸들러 안에서 한 번의 통합 롤로 처리함(아래 참고).
    // onGrant가 없는 이유: 이 능력들은 즉시 스탯을 바꾸는 게 아니라 "그 지역 산책 중 긍정적 효과 배율"이라는
    // 상시 플래그라, finishWalk()가 정산 시점에 isAbilityOwned()로 직접 확인해서 배율을 적용함(REGION_ABILITY_MAP 참고).
    {
      id:"regionLoveHome", name:"이 구역 X는", category:"acquiredCommon", tone:"positive", positive:true,
      desc:"이 동네 골목골목이 다 내 구역이야! 여기선 뭘 해도 신나.",
      note:"집 근처 산책 중 발생하는 모든 이벤트의 긍정적 효과(스탯 상승·만족도 개선·스트레스 감소) 크기가 ×2가 돼요. 청결 감소처럼 원래 해로운 효과는 배율 대상이 아니에요. 취득: ①온보딩 때 10% 확률로 지역 전담 14종 중 하나가 균등(1/14)하게 부여되거나, ②집 근처에서 10회 이상 반복 산책하면 그 순간부터 매 산책마다 10% 확률로 후천 취득을 시도해요(진행중인 육성에서 이 누적 산책 경로로는 최대 3개까지만). 같은 지역의 부정 짝(산책시러)과는 동시 보유 불가."
    },
    {
      id:"regionHateHome", name:"산책시러", category:"acquiredCommon", tone:"negative", positive:false,
      desc:"굳이 나가지 않아도 우리 집이 최고인데... 왜 자꾸 나가재?",
      note:"집 근처 산책 중 발생하는 모든 이벤트의 긍정적 효과 크기가 ×0.5(절반)가 돼요. 취득 경로는 ①온보딩 10%(균등 1/14)만 해당 — 누적 산책으로는 긍정 짝(이 구역 X는)만 얻을 수 있고 부정 능력은 후천 취득 경로가 없어요(엑셀·채팅 지시 종합 판단, 자세한 근거는 기획 문서 참고). 같은 지역의 긍정 짝과는 동시 보유 불가."
    },
    {
      id:"regionLovePark", name:"보안관", category:"acquiredCommon", tone:"positive", positive:true,
      desc:"이 공원은 내가 지킨다! 다들 나만 보면 반가워하지.",
      note:"동네 공원 산책 중 발생하는 모든 이벤트의 긍정적 효과 크기가 ×2가 돼요. 취득 경로·상호 배타 규칙은 \"이 구역 X는\"과 동일(지역만 동네 공원으로 대체). 부정 짝은 쉿."
    },
    {
      id:"regionHatePark", name:"쉿", category:"acquiredCommon", tone:"negative", positive:false,
      desc:"사람도 강아지도 너무 많아... 조용한 데로 가고 싶어.",
      note:"동네 공원 산책 중 발생하는 모든 이벤트의 긍정적 효과 크기가 ×0.5가 돼요. 취득은 온보딩 10%(균등 1/14)로만 가능(누적 산책 후천 취득은 긍정 짝 전용). 긍정 짝(보안관)과 동시 보유 불가."
    },
    {
      id:"regionLoveForest", name:"개람쥐", category:"acquiredCommon", tone:"positive", positive:true,
      desc:"나무든 다람쥐든, 숲에서는 뭐든 다 재밌어!",
      note:"도로리 숲 산책 중 발생하는 모든 이벤트의 긍정적 효과 크기가 ×2가 돼요. 취득 경로·상호 배타 규칙은 \"이 구역 X는\"과 동일(지역만 도로리 숲으로 대체). 부정 짝은 청결왕."
    },
    {
      id:"regionHateForest", name:"청결왕", category:"acquiredCommon", tone:"negative", positive:false,
      desc:"흙투성이 숲이라니... 발 더러워지는 거 딱 질색이야.",
      note:"도로리 숲 산책 중 발생하는 모든 이벤트의 긍정적 효과 크기가 ×0.5가 돼요. 취득은 온보딩 10%(균등 1/14)로만 가능. 긍정 짝(개람쥐)과 동시 보유 불가."
    },
    {
      id:"regionLoveMtn", name:"개어그릴스", category:"acquiredCommon", tone:"positive", positive:true,
      desc:"가파른 길? 문제없어, 오히려 좋아!",
      note:"소로록 산 산책 중 발생하는 모든 이벤트의 긍정적 효과 크기가 ×2가 돼요. 취득 경로·상호 배타 규칙은 \"이 구역 X는\"과 동일(지역만 소로록 산으로 대체). 부정 짝은 집이좋아."
    },
    {
      id:"regionHateMtn", name:"집이좋아", category:"acquiredCommon", tone:"negative", positive:false,
      desc:"이 산은 너무 힘들어... 그냥 집 소파가 최고야.",
      note:"소로록 산 산책 중 발생하는 모든 이벤트의 긍정적 효과 크기가 ×0.5가 돼요. 취득은 온보딩 10%(균등 1/14)로만 가능. 긍정 짝(개어그릴스)과 동시 보유 불가."
    },
    {
      id:"regionLoveLake", name:"퐁당퐁당", category:"acquiredCommon", tone:"positive", positive:true,
      desc:"물만 보면 참을 수가 없어, 풍덩!",
      note:"뽀로롱 호수 산책 중 발생하는 모든 이벤트의 긍정적 효과 크기가 ×2가 돼요. 취득 경로·상호 배타 규칙은 \"이 구역 X는\"과 동일(지역만 뽀로롱 호수로 대체). 부정 짝은 비버공포증."
    },
    {
      id:"regionHateLake", name:"비버공포증", category:"acquiredCommon", tone:"negative", positive:false,
      desc:"물속에서 뭔가 움직이는 것 같아... 무서워!",
      note:"뽀로롱 호수 산책 중 발생하는 모든 이벤트의 긍정적 효과 크기가 ×0.5가 돼요. 취득은 온보딩 10%(균등 1/14)로만 가능. 긍정 짝(퐁당퐁당)과 동시 보유 불가."
    },
    {
      id:"regionLoveCity", name:"인싸", category:"acquiredCommon", tone:"positive", positive:true,
      desc:"사람 많은 곳이야말로 내 무대지!",
      note:"번화가 산책 중 발생하는 모든 이벤트의 긍정적 효과 크기가 ×2가 돼요. 취득 경로·상호 배타 규칙은 \"이 구역 X는\"과 동일(지역만 번화가로 대체). 부정 짝은 기피형."
    },
    {
      id:"regionHateCity", name:"기피형", category:"acquiredCommon", tone:"negative", positive:false,
      desc:"이렇게 시끄럽고 복잡한 곳은 정말 별로야...",
      note:"번화가 산책 중 발생하는 모든 이벤트의 긍정적 효과 크기가 ×0.5가 돼요. 취득은 온보딩 10%(균등 1/14)로만 가능. 긍정 짝(인싸)과 동시 보유 불가."
    },
    {
      id:"regionLoveBeach", name:"해견대", category:"acquiredCommon", tone:"positive", positive:true,
      desc:"파도야 덤벼라! 나는 이 바다의 용사다.",
      note:"파르란 해변 산책 중 발생하는 모든 이벤트의 긍정적 효과 크기가 ×2가 돼요. 취득 경로·상호 배타 규칙은 \"이 구역 X는\"과 동일(지역만 파르란 해변으로 대체). 부정 짝은 너무짜요."
    },
    {
      id:"regionHateBeach", name:"너무짜요", category:"acquiredCommon", tone:"negative", positive:false,
      desc:"짠내 나는 바람도, 발에 닿는 모래도 다 별로야.",
      note:"파르란 해변 산책 중 발생하는 모든 이벤트의 긍정적 효과 크기가 ×0.5가 돼요. 취득은 온보딩 10%(균등 1/14)로만 가능. 긍정 짝(해견대)과 동시 보유 불가."
    },
    // 65번(기획문서 16장): 고유능력_입력템플릿_v5.xlsx 39~42행 신규 4종 — 64번(15장) 뼈다귀·시간 체계와
    // 직접 연동되는 첫 배치. 물개는 목욕(에너지 소모)·산책(물웅덩이 계열 이벤트 가중치)에 걸치고,
    // 미라클멍잉/올빼미독은 산책 "시작 시각"(state.time.hour, 게임 내 시계) 기준으로 그 산책 전체
    // 이벤트의 스탯 변화 폭을 ±1 가감하며 서로 상호 배타(온보딩 통합 굴림은 startBtn 핸들러 참고),
    // 복댕댕이는 advanceGameTime()에 직접 걸어 게임 내 시간 2시간(행동 2회)마다 뼈다귀 +1을 지급함.
    {
      id:"sealPup", name:"물개", category:"acquiredCommon", tone:"positive", positive:true,
      desc:"목욕 시 발생하는 에너지 소모량이 1/2로 줄고(기존 -5 → -3), 산책 중 물웅덩이 계열 이벤트의 발동 가중치가 ×2가 돼요.",
      note:"골든 리트리버 또는 래브라도로 시작하면 20% 확률로 선천 보유해요. 물 관련 산책 이벤트를 많이 겪으면 후천적으로도 얻을 수 있다고 엑셀에 적혀 있지만 구체 조건이 미정이라 이번 라운드엔 온보딩 경로만 구현했어요. 가중치 ×2 대상 이벤트(엑셀 '기타 및 주의점'란 근거, Claude 제안·확인 필요): WALK-037·MTN-004·LAKE-004·LAKE-015·BEACH-010. doBath()에서 에너지 소모량이 목욕 능력 조정치(BATH_ABILITY_MODS)보다 먼저 -5→-3으로 바뀐 뒤 그 위에 지역 능력(퐁당퐁당 등) 조정치가 더해지는 순서로 구현 — 두 효과가 겹칠 때의 계산 순서가 엑셀에 명시되지 않아 개발팀이 판단한 지점(오픈 이슈).",
      onboardRoll:function(){ return (state.breed === "golden" || state.breed === "labrador") ? 0.2 : 0; }
    },
    {
      id:"miracleMorning", name:"미라클멍잉", category:"acquiredCommon", tone:"neutral", positive:true,
      desc:"산책을 오전 10시 이전에 시작하면 그 산책의 모든 이벤트에서 스탯 상승효과 +1·하락효과 -1(더 나빠짐), 저녁 8시 이후 시작하면 반대로 상승효과 -1·하락효과 +1(덜 나빠짐)이 돼요. 10시~20시 사이는 영향 없음.",
      note:"엑셀 원안은 독립 5%지만 '올빼미독'과 동시 보유 불가가 명시돼 있어, 지역 전담 능력 14종과 같은 방식으로 10% 결합 굴림 하나를 반반으로 나눠 상호 배타를 보장(각자 체감 확률은 그대로 5% — startBtn 핸들러 참고). '산책 시작 시각'은 산책을 누른 그 순간의 게임 내 시계(state.time.hour, advanceGameTime() 호출 전 값)로 한 번만 정해 세션에 저장하고, 산책 중 시간이 더 흘러도 그 값을 그대로 씀."
    },
    {
      id:"nightOwlDog", name:"올빼미독", category:"acquiredCommon", tone:"neutral", positive:true,
      desc:"미라클멍잉과 정반대예요 — 오전 10시 이전 산책 시작은 상승효과 -1·하락효과 +1(둘 다 약화), 저녁 8시 이후 시작은 상승효과 +1·하락효과 -1(둘 다 강화). 10시~20시 사이는 영향 없음.",
      note:"선천적으로 시작할 때 5% 확률로 부여 — '미라클멍잉'과 같은 결합 굴림(10%를 반반)으로 처리해 동시 보유를 원천 차단."
    },
    {
      id:"blessedPup", name:"복댕댕이", category:"acquiredCommon", tone:"positive", positive:true,
      desc:"게임 내 시간이 2시간 지날 때마다(뼈다귀 소모 행동 2회당) 뼈다귀 +1을 얻어요.",
      note:"선천적으로 시작할 때 1% 확률로 부여, 시고르자브(믹스견)로 시작하면 3%. 원안은 '1시간마다'였지만 64번(15장)에서 뼈다귀가 핵심 소모 자원으로 격상된 걸 감안해 '2시간마다'로 완화하기로 사용자가 직접 확정(2026-09-03). advanceGameTime()에서 absHour가 짝수가 될 때마다(=2시간 경과마다) 뼈다귀를 지급 — 하루 경계(22시→06시)에도 리셋되지 않는 absHour를 기준으로 삼아 날짜가 바뀌어도 주기가 끊기지 않음.",
      onboardRoll:function(){ return state.breed === "mix" ? 0.03 : 0.01; }
    },
    // 76번(기획문서 22장): 고유능력_입력템플릿_v7.xlsx 43~52행 신규 10종 — 스탯/만족도 디버프 +
    // 동물병원(진단·치료) 시스템. 8개 기본능력 중 공격성 뺀 7개 + 견생만족도 3축(에너지·유대감·스트레스)에
    // 1:1 매칭되고(matchPath), 낮은 확률로 발현되면 [기본정보]엔 이름 대신 "???"(mystery:true)로 표시되며
    // (실제 효과는 매칭된 스탯/만족도의 "상승·회복"만 조용히 무효화 — applyDebuffGate() 참고, 아래에서
    // finishWalk()/trainStat()/bumpLifeBond() 등 각 스탯 변화 지점에 공통 적용), 동물병원 [진단받기]를
    // 받아야 이름이 공개되고(revealDebuffAbility()) 그 뒤 [치료하기]로 치료를 시도(cureRate, 실패하면
    // 유지)할 수 있음. 공격성은 따로 매칭하지 않고, 이 10종 중 뭐라도 걸려있는 동안 advanceGameTime()에서
    // 공통 부수효과로 게임 내 시간 2시간마다 +3씩 오름(엑셀 '기타' 란 공통 명시, 013번 파일 참고).
    // 온보딩(이동장 뽑기) 시 삐짐 제외 9종 전부 각각 독립적으로 3%(onboardRoll) 확률로 "???" 은폐
    // 상태로 시작 가능. 힌트/치료성공률/치료성공·실패 멘트는 전부 엑셀 원문 그대로 사용.
    // 사용자 확인(2026-09-14): 능력명 "낯가림"은 기존 "낯가림쟁이"(strangerShy, 40번)와 혼동되어
    // "무뚝뚝병"으로 개명 확정 — 코드 전체를 확인했으나 "낯가림"이라는 이름으로 먼저 작업 들어간 부분은
    // 없어(strangerShy 하나만 원래도 별개로 존재), 아래 aloofness 항목이 "무뚝뚝병"이라는 이름으로
    // 처음 구현되는 능력임(마이그레이션 불필요).
    {
      id:"muscleAche", name:"근육통", category:"acquiredCommon", tone:"negative", positive:false,
      matchPath:"core.power", mystery:true, cureRate:0.80,
      hint:"몸을 움직일 때마다 움찔하는 것 같아...",
      desc:"근력이 오르는 산책·훈련 효과가 조용히 무효화돼요. 몸을 움직일 때마다 여기저기가 뻐근한 모양이에요.",
      note:"근력 상승 이벤트를 단기간에 많이 겪으면 낮은 확률로 발생(과사용 부상 컨셉) — trainStat()·finishWalk()에서 근력이 오르려 할 때 낮은 확률(DEBUFF_EVENT_ONSET_CHANCE)로 판정(구체 발현 확률은 엑셀에도 '미정'으로 명시, 실플레이 밸런싱 대상). 온보딩 3% 확률로 '???' 은폐 상태 시작도 가능. 동물병원 치료 성공률 80%.",
      onboardRoll:function(){ return 0.03; }
    },
    {
      id:"toeSprain", name:"발가락삠", category:"acquiredCommon", tone:"negative", positive:false,
      matchPath:"core.agility", mystery:true, cureRate:0.80,
      hint:"발을 자꾸 절며 걷는 것 같아...",
      desc:"민첩성이 오르는 산책·훈련 효과가 조용히 무효화돼요. 발끝이 콕콕 쑤시는지 자꾸 발을 저는 모양이에요.",
      note:"민첩성 관련 격한 활동(추격전 등)을 겪으면 낮은 확률로 발생 — trainStat()·finishWalk()에서 민첩성이 오르려 할 때 낮은 확률(DEBUFF_EVENT_ONSET_CHANCE)로 판정. 온보딩 3% 확률로 '???' 은폐 상태 시작도 가능. 동물병원 치료 성공률 80%.",
      onboardRoll:function(){ return 0.03; }
    },
    {
      id:"dazed", name:"멍함", category:"acquiredCommon", tone:"negative", positive:false,
      matchPath:"core.comprehension", mystery:true, cureRate:0.60,
      hint:"오늘따라 멍하니 있는 시간이 많네...",
      desc:"이해력이 오르는 산책·훈련 효과가 조용히 무효화돼요. 불러도 잘 못 듣는지 멍하니 있는 시간이 늘어난 모양이에요.",
      note:"최근 스트레스가 높은 상태(state.life.stress 70 이상, 개발팀 가정치)가 이어지면 20초 주기 틱(checkDebuffOnsets)에서 낮은 확률로 발생. 온보딩 3% 확률로 '???' 은폐 상태 시작도 가능. 동물병원 치료 성공률 60%.",
      onboardRoll:function(){ return 0.03; }
    },
    {
      id:"malaise", name:"몸살기운", category:"acquiredCommon", tone:"negative", positive:false,
      matchPath:"core.execution", mystery:true, cureRate:0.65,
      hint:"왠지 기운이 없어 보여...",
      desc:"수행력이 오르는 산책·훈련 효과가 조용히 무효화돼요. 왠지 기운이 없어서 시키는 것도 굼뜬 모양이에요.",
      note:"발현 조건 '휴식 없이 활동을 몰아서 하면'에 대응하는 명확한 기존 상태값이 없어(오픈 이슈, 완료 보고에 명시) 온보딩 3% 확률 경로만 구현하고 실플레이 중 자동 발현 트리거는 이번 라운드에 넣지 않음. 동물병원 치료 성공률 65%.",
      onboardRoll:function(){ return 0.03; }
    },
    {
      id:"aloofness", name:"무뚝뚝병", category:"acquiredCommon", tone:"negative", positive:false,
      matchPath:"core.affinity", mystery:true, cureRate:0.55,
      hint:"요즘따라 낯선 것들을 부쩍 피하는 것 같아...",
      desc:"친화력이 오르는 산책·훈련 효과가 조용히 무효화돼요. 요즘따라 살갑게 굴지 않고 새침하게 구는 모양이에요.",
      note:"사회 이벤트에서 좋지 않은 경험이 이어지면 낮은 확률로 발생 — finishWalk()에서 친화력이 내려가는(나쁜 방향) 이벤트를 겪을 때 낮은 확률(DEBUFF_EVENT_ONSET_CHANCE)로 판정. 온보딩 3% 확률로 '???' 은폐 상태 시작도 가능. 동물병원 치료 성공률 55%.",
      onboardRoll:function(){ return 0.03; }
    },
    {
      id:"lowFever", name:"미열", category:"acquiredCommon", tone:"negative", positive:false,
      matchPath:"core.health", mystery:true, cureRate:0.85,
      hint:"코가 평소보다 따뜻한 것 같기도 하고...",
      desc:"건강함이 오르는 산책·훈련 효과가 조용히 무효화돼요. 코가 평소보다 따뜻한 것 같기도 한 모양이에요.",
      note:"청결도가 낮은 상태(state.life.clean 30 이하, 개발팀 가정치)가 지속되면 20초 주기 틱(checkDebuffOnsets)에서 낮은 확률로 발생. 온보딩 3% 확률로 '???' 은폐 상태 시작도 가능. 동물병원 치료 성공률 85%.",
      onboardRoll:function(){ return 0.03; }
    },
    {
      id:"sulking", name:"삐짐", category:"acquiredCommon", tone:"negative", positive:false,
      matchPath:"core.loyalty",
      desc:"충성도가 오르는 산책·훈련 효과가 조용히 무효화돼요. 요즘 나한테 말을 잘 안 걸어주는 것 같아 삐진 모양이에요.",
      note:"다른 9종과 달리 예외 케이스 — 모호한 힌트·은폐 단계 없이 소통버튼(11장) 5회 연속 무응답 시 확정 발생하며 발현과 동시에 이름이 바로 공개됨([기본정보]에도 '???' 아님, mystery 플래그 없음). 동물병원 치료 대상이 아니며, 소통버튼에 3회 이상 연속으로 응답하면 자동 해제됨(020·022번 파일). 온보딩 이동장 뽑기로는 취득 불가(onboardRoll 없음, 사용자 명시).",
    },
    {
      id:"lethargy", name:"무기력증", category:"acquiredCommon", tone:"negative", positive:false,
      matchPath:"life.independence", mystery:true, cureRate:0.60,
      hint:"아무리 쉬게 해도 기운을 못 차리는 것 같아...",
      desc:"[기본돌봄-쉬게하기] 등 에너지가 오르는 효과가 조용히 무효화돼요. 아무리 쉬어도 기운이 안 나는 모양이에요.",
      note:"에너지(state.life.independence)가 30 이하인 상태가 오래 지속되면 20초 주기 틱(checkDebuffOnsets)에서 낮은 확률로 발생(엑셀 명시 임계값). 온보딩 3% 확률로 '???' 은폐 상태 시작도 가능. 동물병원 치료 성공률 60%.",
      onboardRoll:function(){ return 0.03; }
    },
    {
      id:"moodiness", name:"새침함", category:"acquiredCommon", tone:"negative", positive:false,
      matchPath:"life.bond", mystery:true, cureRate:0.55,
      hint:"요즘 왠지 저랑 거리를 두는 것 같아...",
      desc:"스킨십·소통버튼 등 유대감이 오르는 효과가 조용히 무효화돼요. 요즘 왠지 거리를 두는 모양이에요.",
      note:"최근 기본돌봄·소통버튼 등 유대감 관련 상호작용이 뜸했으면 낮은 확률로 발생 — 유대감(state.life.bond)이 30 이하인 상태를 그 근사 조건으로 판단(개발팀 가정치)해 20초 주기 틱(checkDebuffOnsets)에서 판정. 온보딩 3% 확률로 '???' 은폐 상태 시작도 가능. 동물병원 치료 성공률 55%.",
      onboardRoll:function(){ return 0.03; }
    },
    {
      id:"touchy", name:"예민함", category:"acquiredCommon", tone:"negative", positive:false,
      matchPath:"life.stress", mystery:true, cureRate:0.55,
      hint:"사소한 일에도 자꾸 예민하게 반응하는 것 같아...",
      desc:"[기본돌봄-놀아주기/간식주기] 등 스트레스가 내려가는 효과가 조용히 무효화돼요. 사소한 것에도 예민하게 반응하는 모양이에요.",
      note:"스트레스가 높은 상태(state.life.stress 70 이상, 개발팀 가정치)가 오래 지속되면 20초 주기 틱(checkDebuffOnsets)에서 낮은 확률로 발생. 온보딩 3% 확률로 '???' 은폐 상태 시작도 가능. 동물병원 치료 성공률 55%.",
      onboardRoll:function(){ return 0.03; }
    }
  ];
  // 60번: 산책 장소 id → {pos, neg} 지역 전담 능력 id 매핑. WALK_PLACES/WALK_REGIONS의 id와 반드시 일치.
  // finishWalk()의 배율 적용, 온보딩 통합 롤, 지역 누적 산책 후천 취득 로직 세 곳에서 공유해서 씀.
  var REGION_ABILITY_MAP = {
    home:   { pos:"regionLoveHome",   neg:"regionHateHome" },
    park:   { pos:"regionLovePark",   neg:"regionHatePark" },
    forest: { pos:"regionLoveForest", neg:"regionHateForest" },
    mtn:    { pos:"regionLoveMtn",    neg:"regionHateMtn" },
    lake:   { pos:"regionLoveLake",   neg:"regionHateLake" },
    city:   { pos:"regionLoveCity",   neg:"regionHateCity" },
    beach:  { pos:"regionLoveBeach",  neg:"regionHateBeach" }
  };
  function findAbilityDef(id){
    for(var i=0;i<ABILITY_CATALOG.length;i++){ if(ABILITY_CATALOG[i].id === id) return ABILITY_CATALOG[i]; }
    return null;
  }
  function catalogGrant(id){
    var def = findAbilityDef(id);
    if(!def) return;
    // 76번(22장): mystery(신규 디버프 9종, 삐짐 제외) 발현 시엔 이름 대신 "???"로, 설명 대신 모호한
    // 힌트 문구로 등록 — 동물병원 [진단받기](revealDebuffAbility)를 받아야 실제 이름·설명이 드러남.
    var record = def.mystery
      ? { id:"catalog:"+def.id, name:"???", positive:def.positive, tone:def.tone, flavor:def.hint, hidden:true }
      : { id:"catalog:"+def.id, name:def.name, positive:def.positive, tone:def.tone, flavor:def.desc };
    grantAbility(def.category, record);
    if(def.onGrant) def.onGrant();
  }
  function catalogRevoke(id){
    var def = findAbilityDef(id);
    if(!def) return;
    revokeAbility(def.category, "catalog:"+def.id);
    if(def.onRevoke) def.onRevoke();
  }
  function isAbilityOwned(id){
    var def = findAbilityDef(id);
    if(!def) return false;
    return (state.abilities[def.category]||[]).some(function(a){ return a.id === "catalog:"+id; });
  }
  // 76번(22장): matchPath가 있는 항목(디버프 10종)을 자동 수집 — 수기 중복 관리 방지.
  var DEBUFF_IDS = [];
  var DEBUFF_STAT_MAP = {};
  ABILITY_CATALOG.forEach(function(def){
    if(def.matchPath){ DEBUFF_IDS.push(def.id); DEBUFF_STAT_MAP[def.matchPath] = def.id; }
  });
  // 이 10종 중 뭐라도 걸려있으면(삐짐 포함) true — advanceGameTime()의 공격성 +3 부수효과 판정용(013번).
  function anyActiveDebuff(){
    return DEBUFF_IDS.some(function(id){ return isAbilityOwned(id); });
  }
  // path(예: "core.power")에 매칭된 디버프를 보유 중이고, 이번 변화(rawDelta)가 그 경로의 "좋은 방향"
  // (STAT_GOOD_DIRECTION, 014번)이면 조용히 무효화(0)하고 안내 메시지를 함께 반환 — 그 외에는(디버프가
  // 없거나, 변화 방향이 오히려 나쁜 쪽이면) 원래 값 그대로 통과.
  function applyDebuffGate(path, rawDelta){
    var debuffId = DEBUFF_STAT_MAP[path];
    if(debuffId && isAbilityOwned(debuffId)){
      var dir = STAT_GOOD_DIRECTION[path] || 1;
      if((rawDelta * dir) > 0){
        return { amount:0, msg: debuffDisplayName(debuffId) + " 때문에 효과가 없는 것 같아" };
      }
    }
    return { amount:rawDelta, msg:null };
  }
  // 은폐 상태(hidden:true)면 "???"로, 공개됐으면(또는 애초에 은폐가 없는 삐짐이면) 실제 이름으로 표시.
  function debuffDisplayName(id){
    var def = findAbilityDef(id);
    if(!def) return "???";
    var list = state.abilities[def.category] || [];
    for(var i=0;i<list.length;i++){
      if(list[i].id === "catalog:"+id) return list[i].hidden ? "???" : def.name;
    }
    return def.name;
  }
  // 동물병원 [진단받기] — 은폐 상태(hidden)를 풀고 실제 이름·설명을 드러냄.
  function revealDebuffAbility(id){
    var def = findAbilityDef(id);
    if(!def) return;
    var list = state.abilities[def.category] || [];
    for(var i=0;i<list.length;i++){
      if(list[i].id === "catalog:"+id && list[i].hidden){
        list[i].hidden = false;
        list[i].name = def.name;
        list[i].flavor = def.desc;
      }
    }
  }
  // 낮은 확률 발현 롤 — 이미 걸려있으면 시도하지 않음. 성공하면 실제로 부여(mystery면 catalogGrant가
  // 알아서 은폐 상태로 등록)하고 힌트 문구를 반환함(호출부가 각자의 메시지 우선순위에 맞춰 조합해 씀 —
  // 여기서 직접 showMessage를 부르면 호출부가 뒤이어 부르는 자기 showMessage에 곧바로 덮여 사라지는
  // 깜빡임 버그가 있어서 일부러 그렇게 함).
  function tryOnsetDebuff(id, chance){
    if(isAbilityOwned(id)) return null;
    if(Math.random() < (chance || 0)){
      catalogGrant(id);
      var def = findAbilityDef(id);
      return def ? def.hint : null;
    }
    return null;
  }
  // 20초 주기 틱(024번)에서 판정하는 5종(멍함·미열·무기력증·새침함·예민함) — 각자 대응 상태값이 그
  // 임계치를 넘겼을 때만 낮은 확률(가정치, 실플레이 밸런싱 대상)로 시도. 나머지 3종(근육통·발가락삠·
  // 무뚝뚝병)은 걸음/훈련 이벤트 지점(finishWalk/trainStat)에서, 몸살기운은 이번 라운드 미구현(오픈 이슈),
  // 삐짐은 소통버튼 무응답 스트릭(020번)에서 각각 별도로 판정.
  var DEBUFF_TICK_ONSET_CHANCE = 0.02;
  var DEBUFF_EVENT_ONSET_CHANCE = 0.05;
  function checkDebuffOnsets(){
    var L = state.life;
    var hint = null;
    if(L.stress >= 70){ hint = hint || tryOnsetDebuff("dazed", DEBUFF_TICK_ONSET_CHANCE); }
    if(L.clean <= 30){ hint = hint || tryOnsetDebuff("lowFever", DEBUFF_TICK_ONSET_CHANCE); }
    if(L.independence <= 30){ hint = hint || tryOnsetDebuff("lethargy", DEBUFF_TICK_ONSET_CHANCE); }
    if(L.bond <= 30){ hint = hint || tryOnsetDebuff("moodiness", DEBUFF_TICK_ONSET_CHANCE); }
    if(L.stress >= 70){ hint = hint || tryOnsetDebuff("touchy", DEBUFF_TICK_ONSET_CHANCE); }
    return hint;
  }
  // 66번(2단계 리팩토링): 온보딩에서 "N% 확률로 딱 하나만, 후보 중 균등하게" 부여하는 결합 굴림
  // 패턴이 지역 전담 능력 14종(60번)과 미라클멍잉/올빼미독(65번) 두 곳에 거의 동일하게 중복돼 있어
  // 하나의 헬퍼로 통합. 후보가 2개일 때 Math.floor(Math.random()*2)로 고르는 것은 기존 코드의
  // "Math.random()<0.5 ? A : B"와 분포가 완전히 동일해(각각 정확히 50%) 행동 변화 없음.
  function rollCombinedExclusiveAbility(chance, candidateIds){
    if(Math.random() < chance){
      catalogGrant(candidateIds[Math.floor(Math.random() * candidateIds.length)]);
    }
  }

  var el = {};
  ["dayBadge","gameClockBadge","dogNameLabel","coinCount","walkCountLabel","dogWrap","dogEl","msgFloat",
   "yard","pixelCanvas","pixelDogHiCanvas","tipBanner","tipBannerText","tipBannerTextInner",
   "breedTag","infoBreedTag","personalityTag","passiveTag","stageChip",
   "valHunger","valClean","valLifeBond","valIndependence","valStress",
   "valPower","valAgility","valComprehension","valExecution",
   "valLoyalty","valAffinity","valHealth","valAggression",
   "trainEnergyHint",
   "trainPower","trainAgility","trainComprehension","trainExecution",
   "trainLoyalty","trainAffinity","trainHealth","trainAggression",
   "trainConfirmBox","trainConfirmNo","trainConfirmYes",
   "bondLabel","bondFill",
   "btnFeed","btnPlay","btnBath","btnTreat","btnRest","btnOuting","buySnack","buyToy",
   "resetOpen","confirmBox","confirmNo","confirmYes",
   "navInfo","navCare","navOuting","navAttach","navDex","navWalk",
   "infoVeil","infoBackBtn","resumeGrid","attachVeil","attachBackBtn","attachTabs","attachGrid",
   "attachMaterials","attachMaterialsChips",
   "friendGroup","friendList","itemGroup","itemList",
   "descPopup","descPopupTitle","descPopupText","descPopupClose",
   "careVeil","careBackBtn","placeholderVeil","placeholderTitle","placeholderBackBtn",
   "outingVeil","outingBackBtn","outingShop","outingAgility","outingCafe","outingVet","outingGroom","outingEvent",
   // 76번(동물병원 신규): [진단받기]/[치료하기] 2탭 구성 — 상점의 shopTabs/switchShopTab과 같은 패턴.
   "vetVeil","vetBackBtn","vetTabs","vetPageDiagnose","vetPageTreat","vetDiagnoseBtn","vetDiagnoseHint","vetTreatGrid",
   // 74번(어질리티 연습장 신규): [외출하기]의 준비중 placeholder를 실제 미니게임으로 구현하며 추가된 DOM 참조.
   // 74-1번(사용자 수정 요청): 유저 칸의 O/X 표시를 화면 중앙의 큰 풍선(agilityFeedbackBalloon)으로 옮기며 추가.
   "agilityVeil","agilityBackBtn","agilityScene","agilityCanvas","agilityFeedbackBalloon","agilityFeedbackMark",
   "agilityIntro","agilityStartBtn",
   "agilityGame","agilityPhaseBanner","agilityRoundLabel","agilityTimerFill",
   "agilityPawSystem","agilityPawUser","agilityPawDog","agilityDogName",
   "agilityResult","agilityResultText","agilityResultStats","agilityResultClose",
   // 77번([기다려 대회] 신규): [외출하기]의 "대회/이벤트"(47번) 첫 실제 콘텐츠 — 028번 JS 참고.
   "competitionVeil","competitionBackBtn","competitionClosed",
   "competitionTierSelect","competitionTierBeginner","competitionTierIntermediate",
   "competitionTierAdvanced","competitionTierSpecialist",
   "competitionTierBeginnerCond","competitionTierIntermediateCond","competitionTierAdvancedCond","competitionTierSpecialistCond",
   "competitionArena","competitionScene","competitionCanvas","competitionGaugeFill","competitionCycleLabel","competitionWaitBtn",
   "competitionResult","competitionResultTitle","competitionResultText","competitionResultStats","competitionResultClose",
   "competitionAnnouncePopup","competitionAnnounceText","competitionAnnounceClose",
   "shopVeil","shopBackBtn","talkShopGrid","shopTabs","shopPageGeneral","shopPageTalk",
   "onboardVeil","nameInput","crateGrid","stepShelter","stepReveal",
   "stepSizeHint","sizeHintWord","sizeHintNext",
   "stepEyeColor","eyeColorGrid","stepCoatColor","coatColorGrid",
   "startBtn","revealBreed","revealEyeColor","revealCoat","revealPersonality","revealPassive","revealFlavor",
   "walkPlaceVeil","walkPlaceGrid","walkPlaceBackBtn",
   "walkVeil","walkTitle","walkFace","walkStaminaFill","walkStaminaLabel","walkEventCount","walkLog","walkBook",
   "walkSummaryBox","walkSummaryText","walkSummaryMeta","walkSummaryStats","walkSummaryItemSection","walkSummaryItemChips",
   "walkSummaryClose","walkReturnBtn",
   "walkScene","walkDogTrack","walkDogWrap","walkDogEl","walkPovCanvas","walkPixelCanvas","walkPixelPoseWrap",
   "talkWidgetBtn","talkWidgetCount","talkVeil","talkUsedHint","talkBtnGrid","talkSaidBox","talkSaidWords","talkCloseBtn",
   "talkIdlePopup","talkIdlePopupText","talkIdleNo","talkIdleYes",
   "walkIntervenePopup","walkIntervenePopupText","walkIntervenePopupBtns",
   "screenRoot","endingBlackout","endingBlackoutText","endingCaption",
   "endingLetterPopup","endingLetterTitle","endingLetterText","endingLetterNote","endingLetterClose",
   "dayEndVeil","dayEndText"
  ].forEach(function(id){ el[id] = document.getElementById(id); });

  // 27번: 하단 홈바 스타일 내비게이션 — 각 항목은 독립된 veil(팝업 화면)을 열고 닫음
  function openVeil(v){ v.classList.add("show"); }
  function closeVeil(v){ v.classList.remove("show"); }

  // 36번: 설명 팝업 — [닫기] 버튼과 팝업 바깥(어두운 배경) 클릭 모두로 닫히게 함.
  el.descPopupClose.addEventListener("click", hideDescPopup);
  el.descPopup.addEventListener("click", function(e){
    if(e.target === el.descPopup) hideDescPopup();
  });
  el.navInfo.addEventListener("click", function(){ renderExtras(); openVeil(el.infoVeil); });
  el.navCare.addEventListener("click", function(){ openVeil(el.careVeil); });
  el.navOuting.addEventListener("click", function(){ openVeil(el.outingVeil); });
  el.navAttach.addEventListener("click", function(){ renderAttachBasket(); openVeil(el.attachVeil); });
  el.navDex.addEventListener("click", function(){ placeholderReturnVeil = null; el.placeholderTitle.textContent = "도감/일기"; openVeil(el.placeholderVeil); });
  el.infoBackBtn.addEventListener("click", function(){ closeVeil(el.infoVeil); });
  el.attachBackBtn.addEventListener("click", function(){ closeVeil(el.attachVeil); });
  el.careBackBtn.addEventListener("click", function(){ closeVeil(el.careVeil); });
  el.outingBackBtn.addEventListener("click", function(){ closeVeil(el.outingVeil); });
  el.shopBackBtn.addEventListener("click", function(){ closeVeil(el.shopVeil); openVeil(el.outingVeil); });
  el.placeholderBackBtn.addEventListener("click", function(){
    closeVeil(el.placeholderVeil);
    if(placeholderReturnVeil){ openVeil(placeholderReturnVeil); placeholderReturnVeil = null; }
  });

  // 28번: 외출하기 메뉴 — [상점]만 실제로 동작(기본돌봄에서 이동해옴), 나머지 4곳은 미구현이라 준비중 화면으로
  var placeholderReturnVeil = null;
  // 69번: 상점을 열 때마다 [일반] 탭으로 초기화(직전에 [소통버튼] 탭을 보고 있다 나갔더라도 다음에
  // 다시 들어오면 항상 첫 탭부터 보여줌 — 애착바구니가 매번 1페이지부터 시작하는 것과 같은 원칙).
  function switchShopTab(tab){
    if(el.shopTabs){
      el.shopTabs.querySelectorAll(".shop-tab").forEach(function(btn){
        btn.classList.toggle("active", btn.dataset.tab === tab);
      });
    }
    if(el.shopPageGeneral) el.shopPageGeneral.hidden = (tab !== "general");
    if(el.shopPageTalk) el.shopPageTalk.hidden = (tab !== "talk");
    if(tab === "talk") renderTalkShop();
  }
  if(el.shopTabs){
    el.shopTabs.querySelectorAll(".shop-tab").forEach(function(btn){
      btn.addEventListener("click", function(){ switchShopTab(this.dataset.tab); });
    });
  }
  el.outingShop.addEventListener("click", function(){
    closeVeil(el.outingVeil);
    openVeil(el.shopVeil);
    switchShopTab("general");
    renderTalkShop();
  });
  function openOutingPlaceholder(title){
    placeholderReturnVeil = el.outingVeil;
    closeVeil(el.outingVeil);
    el.placeholderTitle.textContent = title;
    openVeil(el.placeholderVeil);
  }
  // 74번: 어질리티 연습장은 더 이상 준비중 placeholder가 아니라 실제 순서기억 미니게임(026번 파일) —
  // 나머지 3곳(애견카페·동물병원·펫미용실)은 그대로 준비중 화면으로 유지.
  el.outingAgility.addEventListener("click", openAgilityVeil);
  el.agilityBackBtn.addEventListener("click", closeAgilityVeil);
  el.agilityStartBtn.addEventListener("click", startAgilityGame);
  el.agilityResultClose.addEventListener("click", closeAgilityVeil);
  el.outingCafe.addEventListener("click", function(){ openOutingPlaceholder("애견카페"); });
  // 76번(동물병원, 22장): 어질리티 연습장(74번)에 이어 두 번째로 준비중 placeholder에서 실제 화면으로
  // 전환됨(진단·치료 로직은 027번 파일) — 나머지 2곳(애견카페·펫미용실)은 그대로 준비중 유지.
  el.outingVet.addEventListener("click", openVetVeil);
  el.outingGroom.addEventListener("click", function(){ openOutingPlaceholder("펫미용실"); });
  // 77번([기다려 대회] 신규): 47번 당시 "완전한 자리표시자"였던 대회/이벤트 버튼이 첫 실제 콘텐츠를 가짐 —
  // 어질리티·동물병원과 같은 패턴으로 별도 veil을 엶(028번 파일).
  el.outingEvent.addEventListener("click", openCompetitionVeil);
  el.competitionBackBtn.addEventListener("click", closeCompetitionVeil);
  el.competitionResultClose.addEventListener("click", closeCompetitionVeil);
  el.competitionAnnounceClose.addEventListener("click", function(){ el.competitionAnnouncePopup.hidden = true; });
  el.competitionWaitBtn.addEventListener("click", onCompetitionWaitClick);
  // 77번: 028번 파일에 정의된 상수(COMPETITION_TIER_*)를 여기(007번, 더 이른 로드 순서)서 참조하면
  // 71번에서 확인된 "최상위 var는 파일 순서를 타지만 function은 안전하다"는 관례를 어기게 되므로,
  // 문자열 리터럴로 직접 4개를 연결(함수 호출(onCompetitionTierClick)만 사용 — function은 호이스팅 안전).
  [
    ["competitionTierBeginner","beginner"],
    ["competitionTierIntermediate","intermediate"],
    ["competitionTierAdvanced","advanced"],
    ["competitionTierSpecialist","specialist"]
  ].forEach(function(pair){
    var btn = el[pair[0]], tierId = pair[1];
    if(btn) btn.addEventListener("click", function(){ onCompetitionTierClick(tierId); });
  });

  // 36번: 능력 도감(테스트용) UI는 불필요한 노출이라 제거함(요청 1번). 단, 이 화면이 쓰던
  // catalogGrant/catalogRevoke/isAbilityOwned 함수 자체는 온보딩 능력 뽑기(catalogGrant 재사용)가
  // 계속 참조하므로 그대로 남겨둠 — 지워진 건 화면(호스트 div)과 그 렌더 함수뿐.

  // 36번: [기본정보]·[애착바구니] 공용 "설명 팝업" — 모바일에선 title 속성(마우스 호버) 툴팁이 뜨지
  // 않는 문제(요청 3·4번) 해결용. 카드/칸을 탭하면 이 팝업이 뜨고 [닫기]로 없앰.
  function showDescPopup(title, desc){
    if(!el.descPopup) return;
    el.descPopupTitle.textContent = title;
    el.descPopupText.textContent = desc;
    el.descPopup.hidden = false;
  }
  function hideDescPopup(){
    if(el.descPopup) el.descPopup.hidden = true;
  }

  // 29번: [기본정보] 화면의 이력서 느낌 능력 카드(4x6=24칸) — 30번에서 실수로 [애착바구니]와
  // 합쳐졌던 걸 다시 복원. 아직 능력별 고정 위치 설계 전이라, 보유한 능력을 순서대로 앞칸부터 채우고
  // 나머지는 빈 칸으로 둠. 톤 분류: positive===true→긍정(코랄핑크), positive===false→부정(민트그레이),
  // 성격("personality:" 접두 능력)은 좋고 나쁨이 없는 개성이라 중립(초록)으로 별도 처리.
  function abilityTone(a){
    // 40번: 고유능력 v2 템플릿의 B열(분류: 긍정/부정/중립)이 명시된 경우 최우선으로 씀 —
    // "너, 내 주인이 되라!"처럼 득실이 섞여 긍정/부정 이분법으로는 억지스러운 경우가 있어서.
    if(a.tone) return a.tone;
    if(a.id && a.id.indexOf("personality:") === 0) return "neutral";
    return a.positive ? "positive" : "negative";
  }
  function renderAbilityCard(){
    var host = el.resumeGrid;
    if(!host) return;
    var all = [].concat(
      state.abilities.innateUnique, state.abilities.innateCommon,
      state.abilities.acquiredUnique, state.abilities.acquiredCommon
    );
    host.innerHTML = "";
    var TOTAL_CELLS = 24;
    for(var i=0;i<TOTAL_CELLS;i++){
      var cell = document.createElement("div");
      var a = all[i];
      if(a){
        cell.className = "resume-cell tone-" + abilityTone(a);
        cell.textContent = a.name;
        // 36번: title(호버 툴팁) 대신 탭하면 뜨는 설명 팝업으로 교체(모바일 대응).
        (function(ability){
          cell.addEventListener("click", function(){
            showDescPopup(ability.name, ability.flavor || ability.name);
          });
        })(a);
      } else {
        cell.className = "resume-cell empty";
      }
      host.appendChild(cell);
    }
  }

  // 35번(수집아이템 관련 실험 문서 8장): 실제 수집물 1차 10종 중, 애착바구니 80칸을 차지하는 8종
  // (누적형 4 + 조합 완성품 1 + 희귀 드랍형 3) 카탈로그. 재료 2종(반짝이는 조각·낡은 리본)은 문서
  // 확정대로 이 목록에 넣지 않고 별도 재료 인벤토리(state.materials)로 관리함(아래 attachMaterials).
  // 1페이지(0~7번 칸)에 고정 배치하고, 나머지 72칸은 이전처럼 빈 칸으로 남겨 향후 확장 여지를 둠
  // (문서 근거: "80칸 중 나머지는 이 8종 반영 후 실플레이 테스트를 거쳐 순차 확장 예정").
  var COLLECTION_ITEMS = [
    { name:"민들레 홀씨", icon:"🌾", desc:"산책 중 흔하게 모이는 홀씨. 많이 모을수록 민첩성이 계단식으로 올라요(10/50/100개)." },
    { name:"조약돌", icon:"🪨", desc:"산책길에서 주운 반질반질한 돌. 많이 모을수록 건강함이 계단식으로 올라요(10/50/100개)." },
    { name:"나뭇가지", icon:"🌿", desc:"물고 다니기 좋은 나뭇가지. 많이 모을수록 에너지가 덜 소모돼요(10/50/100개)." },
    { name:"매끈한 낙엽", icon:"🍂", desc:"가을이면 유독 많이 밟게 되는 낙엽. 많이 모을수록 청결도가 천천히 줄어요(10/50/100개)." },
    { name:"추억의 목걸이", icon:"📿", desc:"반짝이는 조각과 낡은 리본을 모아 완성한 목걸이. 유대감이 크게, 친화력이 소폭 올라요." },
    { name:"오래된 목줄 조각", icon:"🦴", desc:"어딘가의 강아지가 쓰던 낡은 목줄 조각. 충성도가 크게 올라요." },
    { name:"반짝이는 발자국", icon:"✨", desc:"신비롭게 반짝이는 발자국. 생활만족도 전반이 소폭 올라요." },
    { name:"별빛 조각", icon:"🌟", desc:"밤하늘에서 떨어진 듯한 조각. 무작위 능력치와 유대감이 크게 올라요." },
    // 59번(58번 3~5번, 산책이벤트_지역별_v4.xlsx 신규 아이템 반영): 도토리(도로리 숲 FOREST-001)·
    // 조개껍데기(파르란 해변 BEACH-004·018)는 엑셀에 구체적 효과가 없어 사용자 확인(2026-09-03)에 따라
    // 민들레 홀씨·조약돌과 같은 "누적형"(10/50/100개 계단식 보너스) 방식으로 반영 — 도토리는 근력,
    // 조개껍데기는 친화력에 배정(아직 안 쓰인 스탯 중 지역 테마에 맞춰 선정, coreDisplayValue 참고).
    { name:"도토리", icon:"🌰", desc:"도로리 숲에서 종종 줍는 도토리. 많이 모을수록 근력이 계단식으로 올라요(10/50/100개)." },
    { name:"조개껍데기", icon:"🐚", desc:"파르란 해변에서 파도에 밀려온 조개껍데기. 많이 모을수록 친화력이 계단식으로 올라요(10/50/100개)." }
  ];
  // 35번: 재료 인벤토리(도감 미등록) — 반짝이는 조각·낡은 리본은 애착바구니 칸을 쓰지 않고 이 배열
  // 순서 그대로 attachMaterialsChips에 "이름 x개수" 칩으로만 노출.
  var MATERIAL_ITEMS = ["반짝이는 조각", "낡은 리본"];
  var attachActivePage = 0;
  function renderAttachBasket(){
    var tabs = el.attachTabs ? el.attachTabs.querySelectorAll(".attach-tab") : [];
    for(var t=0;t<tabs.length;t++){
      tabs[t].classList.toggle("active", Number(tabs[t].dataset.page) === attachActivePage);
    }
    var host = el.attachGrid;
    if(host){
      host.innerHTML = "";
      for(var i=0;i<16;i++){
        var cell = document.createElement("div");
        cell.className = "attach-cell";
        // 1페이지의 앞 8칸에만 실제 카탈로그를 배치(나머지 72칸은 기존처럼 빈 칸 유지)
        var item = (attachActivePage === 0) ? COLLECTION_ITEMS[i] : null;
        if(item){
          var owned = (state.walkItems && state.walkItems[item.name]) || 0;
          if(owned > 0){
            cell.className = "attach-cell filled";
            var iconSpan = document.createElement("span");
            iconSpan.className = "attach-cell-icon";
            iconSpan.setAttribute("aria-hidden", "true");
            iconSpan.textContent = item.icon;
            var nameSpan = document.createElement("span");
            nameSpan.className = "attach-cell-name";
            nameSpan.textContent = item.name;
            var qtySpan = document.createElement("span");
            qtySpan.className = "attach-cell-qty";
            qtySpan.textContent = "x" + owned;
            cell.appendChild(iconSpan);
            cell.appendChild(nameSpan);
            cell.appendChild(qtySpan);
            // 36번: title(호버 툴팁) 대신 탭하면 뜨는 설명 팝업으로 교체(모바일 대응, 요청 4번).
            (function(itemRef, ownedCount){
              cell.addEventListener("click", function(){
                showDescPopup(itemRef.icon + " " + itemRef.name + " x" + ownedCount, itemRef.desc);
              });
            })(item, owned);
          } else {
            cell.className = "attach-cell locked";
            cell.textContent = "?";
            cell.title = "아직 만나지 못했어요";
          }
        }
        host.appendChild(cell);
      }
    }
    if(el.attachMaterials && el.attachMaterialsChips){
      var mats = state.materials || {};
      var haveAny = MATERIAL_ITEMS.some(function(name){ return (mats[name] || 0) > 0; });
      el.attachMaterials.hidden = !haveAny;
      if(haveAny){
        el.attachMaterialsChips.innerHTML = "";
        MATERIAL_ITEMS.forEach(function(name){
          var count = mats[name] || 0;
          if(count <= 0) return;
          var chip = document.createElement("span");
          chip.className = "ability-chip";
          chip.textContent = name + " x" + count;
          el.attachMaterialsChips.appendChild(chip);
        });
      }
    }
  }
  if(el.attachTabs){
    el.attachTabs.querySelectorAll(".attach-tab").forEach(function(tabBtn){
      tabBtn.addEventListener("click", function(){
        attachActivePage = Number(this.dataset.page);
        renderAttachBasket();
      });
    });
  }

  function renderExtras(){
    renderAbilityCard();
    var friendIds = Object.keys(state.walkFriends || {});
    el.friendGroup.hidden = friendIds.length === 0;
    if(friendIds.length){
      el.friendList.innerHTML = "";
      friendIds.forEach(function(id){
        var f = state.walkFriends[id];
        var chip = document.createElement("span");
        chip.className = "ability-chip";
        chip.textContent = f.name + " · " + (WALK_FRIEND_LEVELS[f.level] || WALK_FRIEND_LEVELS[0]);
        el.friendList.appendChild(chip);
      });
    }
    // 35번: 애착바구니에 실제로 등록되는 8종(COLLECTION_ITEMS)은 [기본정보]의 "주운 것들" 더미 목록에서는
    // 제외해 같은 아이템이 두 화면에 중복 노출되지 않게 함 — 카탈로그 밖 더미 부산물(고라니 똥 등)만 그대로 노출.
    var itemIds = Object.keys(state.walkItems || {}).filter(function(id){
      return !COLLECTION_ITEMS.some(function(c){ return c.name === id; });
    });
    el.itemGroup.hidden = itemIds.length === 0;
    if(itemIds.length){
      el.itemList.innerHTML = "";
      itemIds.forEach(function(id){
        var chip = document.createElement("span");
        chip.className = "ability-chip";
        chip.textContent = id + " x" + state.walkItems[id];
        el.itemList.appendChild(chip);
      });
    }
  }

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
  var TALK_BUTTON_CATALOG = [
    { id:"owner", label:"주인", icon:"🧑", base:true },
    { id:"food", label:"밥", icon:"🍖", base:true },
    { id:"walk", label:"산책", icon:"🐾", base:true },
    { id:"like", label:"좋아", icon:"💗", base:true },
    { id:"dislike", label:"싫어", icon:"👎", base:true },
    { id:"bad", label:"나빠", icon:"😠", base:false },
    { id:"doit", label:"해줘", icon:"🙏", base:false },
    { id:"dontwant", label:"하기싫어", icon:"🙅", base:false },
    { id:"silly", label:"바보", icon:"😝", base:false },
    { id:"pooped", label:"똥쌌어", icon:"💩", base:false },
    { id:"pretty", label:"예뻐", icon:"✨", base:false },
    { id:"best", label:"최고", icon:"🏆", base:false }
  ];
  var TALK_BUTTON_BASE_IDS = TALK_BUTTON_CATALOG.filter(function(d){ return d.base; }).map(function(d){ return d.id; });
  function findTalkButtonDef(id){ return findById(TALK_BUTTON_CATALOG, id); }

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
      // 78번(24장): 푸들일 때만 채워짐 — "small"/"medium"/"standard" 중 하나(breedSizeScale() 참고).
      breedSizeClass:null,
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
      outing:{ usedPlaces:[] },
      // 74번(어질리티 연습장 신규): 하루 1회 제한 플래그 — 하루 종료 시퀀스(playDayEndSequence)에서
      // 매번 false로 리셋되어 다음 날 다시 도전할 수 있게 됨.
      agility:{ playedToday:false },
      // 76번(동물병원 신규, 22장): [치료하기] 하루 최대 3회 제한 카운터 — 하루 종료 시퀀스에서 0으로 리셋.
      // [진단받기]는 횟수 제한이 없어 별도 카운터가 필요 없음.
      vet:{ treatToday:0 },
      // 77번([기다려 대회] 신규): playedToday는 하루 종료 시퀀스에서 리셋(4단계 통틀어 하루 1회 —
      // 사용자 확인). winCounts는 단계 승급 조건("OO대회 N회 이상 1위") 판정용 누적 우승 횟수로,
      // 하루 종료와 무관하게 이 회차 육성이 끝날 때까지 계속 누적됨(리셋 없음). beginnerAnnounced는
      // 초급대회 최초 해금 안내 팝업을 "한 번만" 띄우기 위한 플래그.
      competition:{ playedToday:false, winCounts:{ beginner:0, intermediate:0, advanced:0 }, beginnerAnnounced:false }
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
  // 78번(24장, 푸들 크기 클래스) 도입 전 저장분 마이그레이션
  if(state.breedSizeClass === undefined){ state.breedSizeClass = null; }
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
  // 74번(어질리티 연습장 신규): 도입 전 저장분 마이그레이션 — 오늘 아직 도전 안 한 상태로 시작.
  if(!state.agility){
    state.agility = { playedToday:false };
  }
  // 76번(동물병원 신규, 22장): 도입 전 저장분 마이그레이션 — 오늘 아직 치료 안 받은 상태로 시작.
  if(!state.vet){
    state.vet = { treatToday:0 };
  }
  // 77번([기다려 대회] 신규): 도입 전 저장분 마이그레이션 — 오늘 아직 참여 안 한 상태로 시작, 우승
  // 누적·최초 안내 팝업 플래그도 0/false로 시작(단계 승급은 이 회차 육성에서 새로 쌓아가야 함).
  if(!state.competition){
    state.competition = { playedToday:false, winCounts:{ beginner:0, intermediate:0, advanced:0 }, beginnerAnnounced:false };
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
  var WALK_SLOT_HOURS = [6, 12, 18, 21]; // 하루 4회 충전 시각(아침6/정오/저녁6/저녁9)
  // 33번: 테스트 기간(임시보호 30일) 동안은 "실제 시계 날짜"가 아니라 "산책뼈다귀 소진"이
  // 하루를 진행시키는 기준이 됨. FOSTER_TEST_MODE가 켜져 있는 동안은 syncWalkCharges()의
  // 실시간 날짜 롤오버 로직을 건너뛰고, startWalk()에서 뼈다귀가 0이 되는 순간 바로
  // 최대치로 리필 + state.fosterDay를 1 증가시킴(최대 FOSTER_DAY_MAX일에서 정지).
  var FOSTER_TEST_MODE = true;
  var FOSTER_DAY_MAX = 30;
  function todayKey(ts){
    var d = new Date(ts);
    return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
  }
  // 실제 시계 시각 기준으로 오늘 지나온 충전 슬롯 수만큼 산책 횟수를 채워줌.
  // 자정이 지나 날짜가 바뀌면 전날 남은 횟수는 이월되지 않고 0에서 다시 시작.
  // 33번: 테스트 기간 중에는 날짜 진행을 산책뼈다귀 소진 쪽에서 전담하므로, 이 실시간
  // 롤오버 로직 자체를 쉬게 함(그대로 두면 실제 날짜가 바뀔 때 charges/claimedSlots가
  // 별도로 리셋되면서 테스트용 진행 방식과 충돌할 수 있음).
  function syncWalkCharges(){
    if(FOSTER_TEST_MODE) return;
    var w = state.walk;
    if(!w) return;
    var now = new Date();
    var key = todayKey(now.getTime());
    if(w.dateKey !== key){
      w.dateKey = key;
      w.claimedSlots = [];
      w.charges = 0;
    }
    var hour = now.getHours();
    WALK_SLOT_HOURS.forEach(function(slotHour, idx){
      if(hour >= slotHour && w.claimedSlots.indexOf(idx) === -1){
        w.claimedSlots.push(idx);
        w.charges = clamp(w.charges + 1, 0, w.maxCharges);
      }
    });
  }

  // 26번: 스트레스가 이제 생활만족도의 정식 항목(state.life.stress)이 되어, 더 이상 행복 스탯을
  // 대신 빌려쓸 필요 없이 그대로 반영. delta가 양수면 스트레스 증가(나쁨), 음수면 감소(좋음).
  function applyWalkStress(delta){
    state.life.stress = clamp(state.life.stress + delta, 0, 100);
  }

  // 28번: 산책 부산물(즐기게 둔다 선택 시 낮은 확률로 획득) — 아직 별도 인벤토리 화면은 없어서
  // state.walkItems에 개수만 누적하고, [기본정보] 화면에서 "산책에서 주운 것들"로 확인 가능(더미 방식)
  var WALK_BYPRODUCTS = ["나뭇가지","고라니 똥","고양이 털뭉치","지렁이","나뭇잎","병뚜껑","동전"];
  // 34번: ctx(옵션)가 넘어오면 ctx.itemChips에도 라벨을 쌓아서, 이 이벤트 카드에 "수집: OO" 칩으로
  // 바로 노출하고 산책 종료 리포트의 "주워 온 것들" 목록에도 모이게 함.
  function grantWalkItem(name, qty, ctx){
    state.walkItems[name] = (state.walkItems[name] || 0) + qty;
    if(ctx && ctx.itemChips) ctx.itemChips.push("수집: " + name);
  }

  // 35번(수집아이템 관련 실험 문서 8장, 2026-09-01 수정 확정): 조합형 재료(반짝이는 조각·낡은 리본)는
  // grantWalkItem과 달리 애착바구니(state.walkItems)에 바로 등록하지 않고, 별도 재료 인벤토리
  // (state.materials)에만 개수를 쌓아둠 — 문서가 명시한 "단독 효과 없음, 애착바구니 미등록" 규칙 그대로.
  function grantMaterial(name, qty, ctx){
    state.materials[name] = (state.materials[name] || 0) + qty;
    if(ctx && ctx.itemChips) ctx.itemChips.push("재료 획득: " + name);
    checkNecklaceCombo(ctx);
  }
  // 재료 두 종류가 각 1개 이상 모이는 순간 자동 조합 — 문서 확정대로 "조합 조건 충족 → 완성 팝업 멘트
  // 출력 → 애착바구니에 자동 등록" 흐름을 구현. 별도 모달을 새로 만드는 대신, 34번에서 이미 구축한
  // "이벤트 카드 칩 + 종료 리포트 로그" 채널을 그대로 재사용해 눈에 띄게 노출함(판단 근거는 계획
  // 문서에 기록). 효과(유대감 크게 상승·친화력 소폭 상승)는 다른 산책 이벤트와 동일하게
  // session.deltaLedger에 얹어, 산책 종료 시 기존 보상배율 정산 로직을 그대로 재사용해 적용함.
  function checkNecklaceCombo(ctx){
    var shard = state.materials["반짝이는 조각"] || 0;
    var ribbon = state.materials["낡은 리본"] || 0;
    if(shard >= 1 && ribbon >= 1){
      state.materials["반짝이는 조각"] = shard - 1;
      state.materials["낡은 리본"] = ribbon - 1;
      grantWalkItem("추억의 목걸이", 1, ctx);
      if(ctx && ctx.session){
        ctx.session.deltaLedger.push({ path:"life.bond", amount:15 });
        ctx.session.deltaLedger.push({ path:"core.affinity", amount:3 });
        ctx.session.log.push("✨ 반짝이는 조각과 낡은 리본을 모아 추억의 목걸이를 완성했어요!");
      }
      if(ctx && ctx.itemChips) ctx.itemChips.push("🎉 조합 완성: 추억의 목걸이");
    }
  }

  // 28번: 산책 중 만날 수 있는 등장인물 목록과 친밀도 4단계(어색→보통→친밀→절친)
  var WALK_NPCS = [
    { id:"neighborAhjussi", name:"옆집의 안정형 아저씨" },
    { id:"convenienceAlba", name:"편의점 아르바이트생" },
    { id:"highSchoolFriend", name:"고등학교 동창" },
    { id:"twins", name:"중학생 쌍둥이" },
    { id:"cafeOwner", name:"근처 카페 사장님" },
    { id:"mysteryWoman", name:"선글라스에 마스크를 낀 정체불명의 여성" }
  ];
  var WALK_FRIEND_LEVELS = ["어색","보통","친밀","절친"];

  // 32번: 계절 판정 — 산책 이벤트 48종 엑셀의 "계절=봄/가을" 조건에 사용. 달(1~12) 기준 3~5봄/6~8여름/9~11가을/12~2겨울.
  function currentSeason(){
    var m = new Date().getMonth() + 1;
    if(m >= 3 && m <= 5) return "spring";
    if(m >= 6 && m <= 8) return "summer";
    if(m >= 9 && m <= 11) return "autumn";
    return "winter";
  }
  // 58번(지역별 산책 이벤트, 엑셀 왕복 v4 반영): 지역 이벤트 중 일부가 기존 낮/밤(isDaytimeNow, 06~19시)
  // 보다 세분화된 시간대 조건("아침"/"이른 아침"/"저녁")을 요구해 신규로 추가. 사용자 확인(2026-09-03,
  // 58번)에 따라 06~19시 낮/밤 경계는 절대 건드리지 않고 그 "안쪽"에서만 5단계로 더 나눔:
  // 이른아침 06~09 / 아침 09~11 / 낮 11~17 / 저녁 17~19 / 밤 19~06(=!isDaytimeNow()와 완전히 동일).
  function timeBand(){
    var h = new Date().getHours();
    if(h >= 6 && h < 9) return "earlyMorning";
    if(h >= 9 && h < 11) return "morning";
    if(h >= 11 && h < 17) return "day";
    if(h >= 17 && h < 19) return "evening";
    return "night";
  }
  // 58번: LAKE-020("밤+보름달") 조건용 — 실제 천문 API 없이, 알려진 삭망 기준시각(2000-01-06 18:14 UTC)
  // 에서 경과일을 삭망주기(29.530588853일)로 나눈 나머지가 보름(주기의 절반)에서 ±1일 이내면 보름달로
  // 판정하는 표준 근사식을 사용(사용자 확인 2026-09-03, "실제 날짜 기반 근사" 선택). 창을 ±1일로 잡아
  // 한 주기당 약 3일(전체의 ~10%) 정도만 해당하도록 함 — 전설 등급다운 낮은 빈도 유지.
  function isFullMoonNow(){
    var SYNODIC = 29.530588853;
    var KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);
    var daysSince = (Date.now() - KNOWN_NEW_MOON) / 86400000;
    var phase = ((daysSince % SYNODIC) + SYNODIC) % SYNODIC;
    return Math.abs(phase - SYNODIC / 2) <= 1;
  }
  // 32번: "날씨=비온뒤" 조건용 — WEATHER_STATE는 현재 시점 날씨만 담고 있어, 비/폭풍이 관측될 때마다
  // 시각을 따로 기록해두고, 그 후 3시간 이내이면서 지금은 더 이상 비가 아닐 때를 "비온뒤"로 근사함.
  // (실시간 날씨 이력 API가 없어 내린 판단 — 문서에 근거 남김)
  function isJustAfterRain(){
    var cond = WEATHER_STATE.condition;
    if(cond === "rain" || cond === "storm") return false;
    if(!WEATHER_STATE.lastRainAt) return false;
    var hoursSince = (Date.now() - WEATHER_STATE.lastRainAt) / 3600000;
    return hoursSince >= 0 && hoursSince <= 3;
  }

  // 32번: 산책 중 새로운 만남 이벤트(WALK-013/017/046) 공용 처리 — 등장인물 중 무작위 1명을 골라
  // 처음이면 친구목록에 등록하고, 이미 아는 사이면 확률적으로 친밀도를 한 단계 올림.
  // WALK-046(같은 견종 산책 동료와 마주침)도 전용 "반려견 친구" 체계가 아직 없어 동일한 등장인물 풀을
  // 재사용함 — 추후 별도 산책 동료 강아지 목록이 생기면 분리할 예정(오픈 이슈로 남김).
  function walkFriendSideEffect(ctx){
    var npc = pick(WALK_NPCS);
    var known = state.walkFriends[npc.id];
    if(known){
      ctx.session.log.push(npc.name + "와(과) 반갑게 인사해요.");
      if(ctx.itemChips) ctx.itemChips.push("반가운 얼굴: " + npc.name);
      if(Math.random() <= 0.4){
        known.level = clamp(known.level + 1, 0, WALK_FRIEND_LEVELS.length - 1);
        ctx.session.log.push(npc.name + "와(과) 한층 더 가까워졌어요! (" + WALK_FRIEND_LEVELS[known.level] + ")");
        if(ctx.itemChips) ctx.itemChips.push("친밀도 상승: " + npc.name);
      }
    } else {
      state.walkFriends[npc.id] = { name:npc.name, level:0 };
      ctx.session.log.push(npc.name + "와(과) 처음 인사를 나눴어요. (" + WALK_FRIEND_LEVELS[0] + ")");
      if(ctx.itemChips) ctx.itemChips.push("새 친구: " + npc.name);
    }
  }
  // 32번: 도감/일기 화면은 아직 준비중이라, "도감 특별 기록"(WALK-045/048)은 지금은 데이터만 쌓아둠(더미 방식)
  // 34번: ctx(옵션)가 넘어오면 grantWalkItem과 동일하게 ctx.itemChips에도 기록해 카드/리포트에 노출.
  function grantDexRecord(name, ctx){
    state.dexRecords.push({ name:name, ts:Date.now() });
    if(ctx && ctx.itemChips) ctx.itemChips.push("도감 특별 기록: " + name);
  }

  // 32번: 어느 방향이 "좋은 변화"인지 스탯마다 다름(스트레스는 낮을수록 좋음 — 26번에서 이미 확립된 관례).
  // 이 방향 기준으로 산책 종료 시 수치상승(=좋은 방향) 효과는 보상배율만큼 증폭, 수치감소(=나쁜 방향)
  // 효과는 배율 없이 그대로 반영함(사용자 요청 그대로).
  var STAT_GOOD_DIRECTION = {
    "core.power":1, "core.agility":1, "core.comprehension":1, "core.execution":1,
    "core.loyalty":1, "core.affinity":1, "core.health":1, "core.aggression":1,
    "life.hunger":1, "life.clean":1, "life.independence":1, "life.bond":1,
    "life.stress":-1
  };
  // 34번: 산책 UX 개편(기획문서 7장) — 이벤트 카드 칩·종료 리포트 막대그래프에 쓸 "life.xxx" 한글 라벨.
  // core.xxx 쪽은 이미 있는 CORE_STATS의 name을 그대로 재사용.
  // 62번: 견생만족도 패널 라벨 개칭과 맞춰 hunger/clean/independence 표기를 통일(배부름/청결도/에너지).
  var LIFE_STAT_LABELS = { hunger:"배부름", clean:"청결도", bond:"유대감", independence:"에너지", stress:"스트레스" };
  function statPathLabel(path){
    var parts = path.split(".");
    if(parts[0] === "core"){
      var found = null;
      CORE_STATS.forEach(function(s){ if(s.key === parts[1]) found = s.name; });
      return found || parts[1];
    }
    return LIFE_STAT_LABELS[parts[1]] || parts[1];
  }

  // 32번: 산책 이벤트 48종 — 2026-09-01 업로드된 엑셀(산책이벤트_초안_48종.xlsx)을 그대로 옮김.
  // 기존 4종(마킹장소·땅파기/냄새맡기·새로운 친구 만남·배변)은 전부 삭제하고 이 표로 완전히 대체함.
  // 58번(엑셀 왕복 v4, 산책이벤트_지역별_v4.xlsx 반영): 시트 이름이 [산책 이벤트]→[공통 이벤트]로
  // 바뀌었지만 내용은 55종 그대로 100% 유지(변수명 WALK_EVENTS도 그대로 둠) — 이제 산책 장소마다
  // 이 55종이 "공통으로" 등장할 수 있고, 장소별 전용 이벤트 20종씩(아래 HOME_EVENTS 등)이 추가로
  // 섞여 나옴. 어느 풀에서 뽑을지는 WALK_REGIONS와 pickWalkEvent()가 결정.
  // 각 이벤트: { id, cat(축), grade(등급, 표시용 메모), weight(발동확률%, 엑셀 값 그대로 = 상대 가중치),
  //   gauge(소모 체력), text(연출 텍스트), cond(선택, 지금 조건을 만족할 때만 후보에 포함),
  //   weightMult(선택, 가중치에 곱해지는 배율 — 조건부 확률 연출용),
  //   stat(정적 수치효과 배열) 또는 statFn(ctx→수치효과 배열, 조건 분기용),
  //   sideEffect(선택, 수집/친구목록/도감기록처럼 배율 적용 없이 즉시 발생하는 효과) }
  // stat 항목의 각 원소는 {p:"core.xxx"|"life.xxx", n:증감량, chance:(선택, 기본 1)} — chance가 있으면
  // 그 항목만 독립적으로 확률을 굴림(엑셀의 "낮은 확률로 ~" 서술 반영).
  // 수치효과(stat/statFn)는 이 자리에서 바로 반영되지 않고 session.deltaLedger에 쌓였다가,
  // 산책을 마칠 때 finishWalk()에서 보상배율과 함께 한꺼번에 정산됨.
  var WALK_EVENTS = [
    // 38번(엑셀 왕복 편집 v2 반영): WALK-001~012는 사용자가 엑셀에서 [판정유형]="성공-실패 판정"으로
    // 지정하고 [영향능력]을 고른 이벤트 — judge:{ability} 필드가 붙어있으면 resolveWalkEvent()가 성공/
    // 실패를 먼저 판정한 뒤에만 아래 stat(=성공 시 효과)을 적용함. 스탯 값도 이번에 사용자가 엑셀에서
    // 직접 수정한 값(청결 소모 등 추가)으로 갱신됨.
    { id:"WALK-001", cat:"후각/탐지", grade:"일반", weight:3.46, gauge:6, anim:"sniff",
      judge:{ability:"health"},
      text:"킁킁, 여기 흥미로운 냄새가 나는걸?",
      stat:[{p:"core.comprehension", n:1}, {p:"life.clean", n:-1}] },
    { id:"WALK-002", cat:"후각/탐지", grade:"고급", weight:1.88, gauge:8, anim:"sniff",
      judge:{ability:"health"},
      text:"이 냄새, 어디까지 이어질까?",
      stat:[{p:"core.comprehension", n:1}, {p:"life.clean", n:-1}],
      sideEffect:function(ctx){
        if(Math.random() <= 0.2){
          var item = pick(WALK_BYPRODUCTS);
          grantWalkItem(item, 1, ctx);
          ctx.session.log.push("냄새를 쫓다가 뭔가를 주웠어요: " + item);
        }
      } },
    { id:"WALK-003", cat:"후각/탐지", grade:"고급", weight:1.88, gauge:8, anim:"sniff",
      judge:{ability:"health"},
      text:"누군가 먼저 지나간 흔적이 있어!",
      stat:[{p:"core.comprehension", n:1}, {p:"life.clean", n:-1}, {p:"life.bond", n:1}] },
    { id:"WALK-004", cat:"후각/탐지", grade:"희귀", weight:1.2, gauge:10, anim:"sniff",
      judge:{ability:"health"},
      text:"여기 뭔가 숨어있는 것 같은데?!",
      stat:[{p:"core.comprehension", n:2}, {p:"core.power", n:1}, {p:"life.clean", n:-2}] },
    { id:"WALK-005", cat:"후각/탐지", grade:"일반", weight:3.46, gauge:6, anim:"sniff",
      judge:{ability:"agility"},
      text:"음... 이건 다른 친구의 흔적이군.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.agility", n:1}, {p:"life.clean", n:-1}] },
    { id:"WALK-006", cat:"후각/탐지", grade:"희귀", weight:1.2, gauge:5, anim:"sniff",
      judge:{ability:"agility"},
      text:"멀리서도 맡아지는 신비한 향이야.",
      stat:[{p:"core.comprehension", n:2}] },
    { id:"WALK-007", cat:"신체활동", grade:"일반", weight:3.46, gauge:14, anim:"dig", particle:"dust",
      judge:{ability:"power"},
      text:"여기 뭔가 있을 것 같아서 파봤어!",
      stat:[{p:"core.power", n:1}, {p:"life.clean", n:-2}] },
    { id:"WALK-008", cat:"신체활동", grade:"고급", weight:1.88, gauge:12, anim:"dash",
      judge:{ability:"power"},
      text:"휙! 가볍게 넘어버렸다.",
      stat:[{p:"core.power", n:1}, {p:"core.agility", n:1}, {p:"life.clean", n:-2}] },
    { id:"WALK-009", cat:"신체활동", grade:"고급", weight:1.88, gauge:10, anim:"splash", particle:"water",
      judge:{ability:"health"},
      text:"첨벙첨벙! 신나게 물장구!",
      stat:[{p:"core.power", n:2}, {p:"core.agility", n:1}, {p:"life.clean", n:-4}] },
    { id:"WALK-010", cat:"신체활동", grade:"고급", weight:1.88, gauge:16, anim:"dash",
      judge:{ability:"agility"},
      text:"계단쯤이야, 한번에 뛰어올라가지!",
      stat:[{p:"core.power", n:1}, {p:"core.agility", n:1}, {p:"life.clean", n:-1}] },
    { id:"WALK-011", cat:"신체활동", grade:"희귀", weight:1.2, gauge:14, anim:"dash",
      judge:{ability:"agility"},
      text:"이 정도 담장은 문제없어 보이는데?",
      stat:[{p:"core.agility", n:2}, {p:"life.clean", n:-1}] },
    { id:"WALK-012", cat:"신체활동", grade:"희귀", weight:1.2, gauge:16, anim:"dig",
      judge:{ability:"power"},
      text:"이 큰 걸 혼자 끌고 가겠다고?!",
      stat:[{p:"core.power", n:2}, {p:"core.affinity", n:1}, {p:"life.clean", n:-1}, {p:"life.bond", n:1}] },
    { id:"WALK-013", cat:"사회", grade:"일반", weight:3.46, gauge:7, anim:"social",
      text:"저기 새로운 친구가 있어!",
      stat:[{p:"core.affinity", n:1}],
      sideEffect:walkFriendSideEffect },
    { id:"WALK-014", cat:"사회", grade:"일반", weight:3.46, gauge:5, anim:"social",
      text:"안녕하세요! 하고 꼬리를 흔든다.",
      stat:[{p:"core.affinity", n:1}] },
    { id:"WALK-015", cat:"사회", grade:"고급", weight:1.88, gauge:9, anim:"social",
      text:"으르릉... 서로 눈치를 살핀다.",
      // 공격성이 높을수록 이 이벤트가 더 자주 뽑히도록 가중치를 0.5~1.5배 사이에서 조정(원안의 "발생확률↑" 반영)
      weightMult:function(){ return 0.5 + state.core.aggression/100; },
      stat:[{p:"life.stress", n:1}] },
    { id:"WALK-016", cat:"사회", grade:"고급", weight:1.88, gauge:6, anim:"social",
      text:"아이들이 몰려와 쓰다듬어준다!",
      stat:[{p:"core.affinity", n:1}, {p:"life.bond", n:1}] },
    { id:"WALK-017", cat:"사회", grade:"희귀", weight:1.2, gauge:7, anim:"social",
      text:"이 동네에서 오래 산 듯한 친구를 만났다.",
      stat:[{p:"core.affinity", n:2}],
      sideEffect:walkFriendSideEffect },
    { id:"WALK-018", cat:"사회", grade:"고급", weight:1.88, gauge:8, anim:"social",
      text:"주인님 곁을 지키려는 듯 짖는다.",
      stat:[{p:"life.stress", n:1}] },
    { id:"WALK-019", cat:"수집", grade:"일반", weight:3.46, gauge:6, anim:"pickup",
      text:"이 막대기, 마음에 들어!",
      stat:[],
      sideEffect:function(ctx){ grantWalkItem("나뭇가지", 1, ctx); } },
    { id:"WALK-020", cat:"수집", grade:"일반", weight:3.46, gauge:5, anim:"pickup",
      text:"반질반질한 돌을 찾았다.",
      stat:[],
      sideEffect:function(ctx){ grantWalkItem("조약돌", 1, ctx); } },
    { id:"WALK-021", cat:"수집", grade:"고급", weight:1.88, gauge:5, anim:"pickup",
      text:"어? 이거 먹어도 되는 건가?",
      stat:[{p:"life.hunger", n:1}] },
    { id:"WALK-022", cat:"수집", grade:"희귀", weight:1.2, gauge:6, anim:"pickup", particle:"sparkle",
      text:"이게 뭐지? 반짝반짝 빛나는걸.",
      stat:[],
      sideEffect:function(ctx){ grantWalkItem("특수아이템", 1, ctx); } },
    { id:"WALK-023", cat:"수집", grade:"전설", weight:1.75, gauge:6, anim:"pickup", particle:"sparkle",
      text:"어? 이거 행운을 가져다준다던데?!",
      stat:[],
      sideEffect:function(ctx){ grantWalkItem("네잎클로버(행운 아이템)", 1, ctx); } },
    { id:"WALK-024", cat:"수집", grade:"고급", weight:1.88, gauge:5, anim:"pickup",
      text:"누군가의 물건인 것 같은데...",
      stat:[],
      sideEffect:function(ctx){ grantWalkItem("단추", 1, ctx); } },
    { id:"WALK-025", cat:"생리현상", grade:"일반", weight:3.46, gauge:5, anim:"rest",
      text:"시원하게 볼일을 봤다.",
      stat:[{p:"life.clean", n:-1}] },
    { id:"WALK-026", cat:"생리현상", grade:"일반", weight:3.46, gauge:4, anim:"rest",
      text:"목이 말랐는지 벌컥벌컥 마신다.",
      stat:[{p:"life.hunger", n:1}] },
    { id:"WALK-027", cat:"생리현상", grade:"고급", weight:1.88, gauge:5, anim:"sniff",
      text:"풀맛이 궁금했나보다.",
      stat:[{p:"life.hunger", n:1}, {p:"life.stress", n:1, chance:0.15}] },
    { id:"WALK-028", cat:"생리현상", grade:"일반", weight:3.46, gauge:3, anim:"rest",
      text:"헥헥, 그늘에서 잠깐 쉬어간다.",
      stat:[{p:"life.stress", n:-1}] },
    { id:"WALK-029", cat:"생리현상", grade:"희귀", weight:1.2, gauge:8, anim:"dig",
      text:"신났는지 바닥에 뒹굴뒹굴!",
      stat:[{p:"life.clean", n:-2}, {p:"life.bond", n:1}] },
    { id:"WALK-030", cat:"생리현상", grade:"고급", weight:1.88, gauge:6, anim:"sniff",
      text:"어디선가 사료 냄새가 솔솔...",
      stat:[{p:"life.hunger", n:-1}] },
    { id:"WALK-031", cat:"감정/유대", grade:"일반", weight:3.46, gauge:8, anim:"run",
      text:"이름을 부르자 반갑게 달려온다!",
      stat:[{p:"life.bond", n:1}] },
    { id:"WALK-032", cat:"감정/유대", grade:"일반", weight:3.46, gauge:4, anim:"social",
      text:"다리에 얼굴을 부비적댄다.",
      stat:[{p:"life.bond", n:1}] },
    { id:"WALK-033", cat:"감정/유대", grade:"희귀", weight:1.2, gauge:5, anim:"pickup",
      text:"주인님이 챙겨온 간식을 나눠먹는다.",
      stat:[{p:"life.bond", n:2}, {p:"life.hunger", n:1}] },
    { id:"WALK-034", cat:"감정/유대", grade:"고급", weight:1.88, gauge:4, anim:"social",
      text:"번쩍 안아달라며 팔짝거린다.",
      stat:[{p:"life.bond", n:1}] },
    { id:"WALK-035", cat:"감정/유대", grade:"고급", weight:1.88, gauge:3, anim:"rest",
      text:"고맙다는 듯 손을 핥아준다.",
      stat:[{p:"life.bond", n:1}] },
    { id:"WALK-036", cat:"감정/유대", grade:"희귀", weight:1.2, gauge:4, anim:"rest",
      text:"주인님이 잠시 쉬는 동안 곁을 지킨다.",
      stat:[{p:"life.bond", n:2}, {p:"life.stress", n:-1}] },
    { id:"WALK-037", cat:"환경 연동", grade:"고급", weight:1.88, gauge:10, anim:"splash", particle:"water",
      cond:function(){ return WEATHER_STATE.condition === "rain" || WEATHER_STATE.condition === "storm"; },
      // 65번(16장): '물개' 보유 시 물웅덩이 계열 이벤트 발동 가중치 ×2(엑셀 '기타 및 주의점'란이 지정한
      // 5종 중 하나 — WALK-037/MTN-004/LAKE-004/LAKE-015/BEACH-010).
      weightMult:function(){ return isAbilityOwned("sealPup") ? 2 : 1; },
      text:"빗속에서도 신나게 첨벙댄다!",
      stat:[{p:"core.agility", n:1}, {p:"life.clean", n:-2}] },
    { id:"WALK-038", cat:"환경 연동", grade:"희귀", weight:1.2, gauge:5, anim:"lookup",
      cond:function(){ return !isDaytimeNow(); },
      text:"밤하늘을 올려다보며 잠시 멈춰선다.",
      stat:[{p:"life.bond", n:1}] },
    { id:"WALK-039", cat:"환경 연동", grade:"희귀", weight:1.2, gauge:10, anim:"dig",
      cond:function(){ return WEATHER_STATE.condition === "snow"; },
      text:"눈밭에서 신나게 뒹군다!",
      stat:[{p:"life.stress", n:-2}, {p:"life.clean", n:-2}] },
    { id:"WALK-040", cat:"환경 연동", grade:"일반", weight:3.46, gauge:4, anim:"rest",
      cond:function(){ return WEATHER_STATE.condition === "clear" && currentSeason() === "summer"; },
      text:"더위를 피해 그늘로 쏙 들어간다.",
      stat:[{p:"life.stress", n:-1}] },
    { id:"WALK-041", cat:"환경 연동", grade:"고급", weight:1.88, gauge:7, anim:"social",
      cond:function(){ return currentSeason() === "autumn"; },
      text:"바스락바스락, 낙엽 밟는 소리가 좋다.",
      stat:[{p:"life.bond", n:1}] },
    { id:"WALK-042", cat:"환경 연동", grade:"희귀", weight:1.2, gauge:6, anim:"lookup",
      cond:function(){ return currentSeason() === "spring"; },
      text:"흩날리는 꽃잎 사이를 걷는다.",
      // "전반 만족도 소폭 상승" — 특정 스탯이 지정되지 않아, 생활만족도 전반에 걸쳐 조금씩 올려주는 걸로 해석(판단 근거 문서화)
      stat:[{p:"life.hunger", n:1}, {p:"life.clean", n:1}, {p:"life.bond", n:1}, {p:"life.stress", n:-1}] },
    { id:"WALK-043", cat:"희귀/특수", grade:"희귀", weight:1.2, gauge:10, anim:"lookup",
      text:"고양이와 눈이 마주쳤다! 어떻게 반응할까?",
      statFn:function(ctx){
        return state.core.aggression >= 50 ? [{p:"life.stress", n:1}] : [];
      } },
    // 59번(58번 3~5번): 엑셀의 [Claude 제안, 2026-09-03] 성공-실패 판정(영향능력: 민첩성)을 사용자
    // 확정(2026-09-03)에 따라 반영 — WALK-001~012와 동일한 judge 규칙 적용(38번 참고).
    { id:"WALK-044", cat:"희귀/특수", grade:"희귀", weight:1.2, gauge:18, anim:"dash",
      text:"다람쥐를 발견하고 냅다 달려간다!",
      judge:{ability:"agility"},
      stat:[{p:"core.agility", n:2}, {p:"life.stress", n:1}] },
    { id:"WALK-045", cat:"희귀/특수", grade:"전설", weight:1.75, gauge:5, anim:"lookup", particle:"sparkle",
      cond:function(){ return !isDaytimeNow(); },
      text:"밤하늘에 별똥별이 떨어진다!",
      stat:[{p:"life.hunger", n:1}, {p:"life.clean", n:1}, {p:"life.bond", n:1}, {p:"life.stress", n:-1}],
      sideEffect:function(ctx){ grantDexRecord("유성 목격", ctx); } },
    { id:"WALK-046", cat:"희귀/특수", grade:"희귀", weight:1.2, gauge:7, anim:"social",
      text:"어라, 나랑 닮은 친구잖아?",
      stat:[{p:"core.affinity", n:2}],
      sideEffect:walkFriendSideEffect },
    { id:"WALK-047", cat:"희귀/특수", grade:"전설", weight:1.75, gauge:4, anim:"rest",
      text:"지나가던 누군가가 사진을 찍어갔다!",
      stat:[],
      sideEffect:function(ctx){ grantWalkItem("포토카드(특별)", 1, ctx); } },
    { id:"WALK-048", cat:"희귀/특수", grade:"전설", weight:1.75, gauge:5, anim:"lookup", particle:"sparkle",
      cond:function(){ return isJustAfterRain(); },
      text:"비가 그친 하늘에 무지개가 떴다!",
      stat:[{p:"life.hunger", n:1}, {p:"life.clean", n:1}, {p:"life.bond", n:1}, {p:"life.stress", n:-1}],
      sideEffect:function(ctx){ grantDexRecord("무지개 목격", ctx); } },
    // 35번(수집아이템 관련 실험 문서 8장, 2026-09-01): 애착바구니 1차 10종 목록 반영 — 아래 7종 신규 이벤트.
    // 누적형 2종(민들레 홀씨·매끈한 낙엽)은 "산책 중 상시" 규칙대로 나뭇가지·조약돌(WALK-019/020)과
    // 같은 일반 등급·확률로 추가. 매끈한 낙엽은 문서의 "환경 연동 가중 가능" 힌트를 살려 가을에 더
    // 잘 나오도록 weightMult를 얹음(판단 근거는 계획 문서에 기록).
    { id:"WALK-049", cat:"수집", grade:"일반", weight:3.46, gauge:5, anim:"pickup", particle:"dust",
      text:"하얀 홀씨가 바람에 흩날려요.",
      stat:[],
      sideEffect:function(ctx){ grantWalkItem("민들레 홀씨", 1, ctx); } },
    { id:"WALK-050", cat:"수집", grade:"일반", weight:3.46, gauge:5, anim:"pickup", particle:"dust",
      text:"매끈하게 마른 낙엽 한 장을 주웠어요.",
      weightMult:function(){ return currentSeason() === "autumn" ? 1.8 : 1; },
      stat:[],
      sideEffect:function(ctx){ grantWalkItem("매끈한 낙엽", 1, ctx); } },
    // 조합형 재료 2종(반짝이는 조각·낡은 리본) — "산책 중 낮은 확률 획득"을 희귀 등급의 기존 확률
    // 그대로 반영(다른 희귀 수집 이벤트 WALK-022 등과 동일 weight). grantMaterial이 애착바구니가 아닌
    // 별도 재료 인벤토리에 쌓고, 둘 다 모이면 자동으로 조합해 추억의 목걸이를 완성함.
    { id:"WALK-051", cat:"수집", grade:"희귀", weight:1.2, gauge:6, anim:"pickup", particle:"sparkle",
      text:"손바닥 위에서 무언가 반짝, 빛을 냈어요.",
      stat:[],
      sideEffect:function(ctx){ grantMaterial("반짝이는 조각", 1, ctx); } },
    { id:"WALK-052", cat:"수집", grade:"희귀", weight:1.2, gauge:6, anim:"pickup",
      text:"낡았지만 정성스레 묶인 리본 조각을 발견했어요.",
      stat:[],
      sideEffect:function(ctx){ grantMaterial("낡은 리본", 1, ctx); } },
    // 희귀 드랍형 3종 — 문서가 개발팀 재량으로 남긴 "특정 단계" 기준을 기존 구현된 지표로 확정.
    // 오래된 목줄 조각: 성장 단계가 "성견"(stageIndex 2)일 때만 후보 풀에 포함.
    { id:"WALK-053", cat:"희귀/특수", grade:"희귀", weight:1.2, gauge:6, anim:"sniff",
      cond:function(){ return stageIndex(state.growthPoints) === 2; },
      text:"낡은 목줄 조각이 흙 속에 파묻혀 있었다.",
      stat:[{p:"core.loyalty", n:3}],
      sideEffect:function(ctx){ grantWalkItem("오래된 목줄 조각", 1, ctx); } },
    // 반짝이는 발자국: "누적 산책 횟수 마일스톤"을 20회 완료로 확정(판단 근거는 계획 문서에 기록).
    { id:"WALK-054", cat:"희귀/특수", grade:"희귀", weight:1.2, gauge:6, anim:"lookup", particle:"sparkle",
      cond:function(){ return (state.totalWalks || 0) >= 20; },
      text:"땅 위에 신비롭게 반짝이는 발자국이 이어져 있다.",
      stat:[{p:"life.hunger", n:1}, {p:"life.clean", n:1}, {p:"life.bond", n:1}, {p:"life.independence", n:1}, {p:"life.stress", n:-1}],
      sideEffect:function(ctx){ grantWalkItem("반짝이는 발자국", 1, ctx); } },
    // 별빛 조각: 전설 등급 + "성견" 단계 + 밤(기존 isDaytimeNow 재사용)까지 겹쳐야 후보에 포함되도록
    // 이중으로 게이팅하고, weight도 기존 전설 등급(1.75)보다 낮춰 문서의 "매우 낮은 확률"을 강조함
    // (판단 근거는 계획 문서에 기록). 임의 스탯 1종은 statFn으로 매번 다시 뽑음.
    { id:"WALK-055", cat:"희귀/특수", grade:"전설", weight:0.6, gauge:8, anim:"lookup", particle:"sparkle",
      cond:function(){ return !isDaytimeNow() && stageIndex(state.growthPoints) === 2; },
      text:"밤하늘 저편에서 별빛 조각이 반짝이며 떨어진다!",
      statFn:function(ctx){
        var randomStat = pick(CORE_STATS);
        return [{p:"core." + randomStat.key, n:3}, {p:"life.bond", n:3}];
      },
      sideEffect:function(ctx){ grantWalkItem("별빛 조각", 1, ctx); } }
  ];

  // 58번(지역별 산책 이벤트, 산책이벤트_지역별_v4.xlsx 반영): 산책 장소 7곳(집 근처/동네 공원/도로리 숲/
  // 소로록 산/뽀로롱 호수/번화가/파르란 해변) 전용 이벤트 20종씩, 총 140종. 필드 구조는 위 WALK_EVENTS와
  // 동일(judge 필드만 아직 없음 — 지역 신규 이벤트는 전부 [판정유형]="해당없음"으로 반영됨).
  // 개입형 예시 이벤트(HOME-003·PARK-003·MTN-003·LAKE-003·CITY-004)는 59번(58번 3~5번)에서 실제
  // O/X·선택형 개입 UI(showWalkIntervenePopup)와 진짜 분기 효과를 붙여 완성됨 — 각 이벤트 정의의
  // intervene 필드 참고(엑셀 원본의 개입방식/개입형태별 결과 칸 그대로 옮김). stat:[]는 남겨뒀는데,
  // resolveWalkEvent()가 ev.intervene이 있으면 이 stat 대신 팝업에서 고른 선택지의 stat을 씀 —
  // fallback 겸 "자동 진행되는 나머지 이벤트와 필드 모양을 통일해두기 위함.
  // FOREST-001·BEACH-004·BEACH-018이 요구하던 신규 수집 아이템(도토리·조개껍데기)도 59번에서
  // COLLECTION_ITEMS에 등록되고 sideEffect가 채워짐(아래 각 이벤트 정의 참고).
  // 75번(기획문서 21장 + 산책이벤트_지역별_v5.xlsx 반영): 7개 지역 × 7개 스탯(공격성 제외)
  // 순환 밸런스 — 한 지역의 상승(+) 스탯이 다른 지역의 하락(-) 스탯이 되도록 고리 형태로 순환.
  //   집근처 +충성도/-근력 → 소로록산 +근력/-민첩성 → 뽀로롱호수 +민첩성/-친화력 →
  //   동네공원 +친화력/-수행력 → 번화가 +수행력/-건강함 → 파르란해변 +건강함/-이해력 →
  //   도로리숲 +이해력/-충성도 → (다시 집근처)
  // 각 지역 20종 중 개입형(intervene) 1종은 제외, 나머지 중 반대 방향 효과가 이미 있던 이벤트는
  // 상쇄되지 않도록 자동 제외(v5 엑셀에서 기계적으로 계산됨) — 그 결과값을 각 이벤트의 기존
  // stat 배열 끝에 그대로 추가 반영. 문구·등급 검수 없이 수치만 보정한 결과라 일부 조합이
  // 어색할 수 있어(예: 정적인 이벤트에 근력-1), 실플레이 후 개별 조정 대상으로 남겨둠(오픈 이슈).
  var HOME_EVENTS = [
    { id:"HOME-001", cat:"사회", grade:"일반", weight:3, gauge:6, anim:"social",
      text:"낯익은 이웃 아저씨가 반갑게 인사를 건넨다.",
      stat:[{p:"core.affinity", n:1}, {p:"core.power", n:-1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-002", cat:"후각/탐지", grade:"일반", weight:3, gauge:5, anim:"sniff",
      text:"우편함 앞에 서서 한참을 킁킁댄다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.power", n:-1}, {p:"core.loyalty", n:1}] },
    // 58단계(지역 확장, v4 엑셀 반영): 개입형 예시 이벤트 — 실제 O/X·선택형 개입 시스템은 3~5번에서 추가 예정, 우선 효과 없는 텍스트+애니메이션으로만 반영
    // 59번(58번 3~5번, 주인 개입 시스템 반영): O/X형 — O(맞짖기): 공격성+1·스트레스+1 / X(무시): 변화 없음
    { id:"HOME-003", cat:"사회", grade:"일반", weight:3, gauge:6, anim:"social",
      text:"옆집에서 짖는 소리가 들리자 귀를 쫑긋 세운다.",
      stat:[],
      intervene:{ type:"ox", options:[
        { label:"O (맞짖기)", stat:[{p:"core.aggression", n:1},{p:"life.stress", n:1}] },
        { label:"X (무시하고 지나가기)", stat:[] }
      ] } },
    { id:"HOME-004", cat:"감정/유대", grade:"희귀", weight:1, gauge:7, anim:"sniff",
      text:"평소 다니던 골목을 순찰하듯 꼼꼼히 살피며 걷는다.",
      stat:[{p:"core.loyalty", n:1}, {p:"core.power", n:-1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-005", cat:"사회", grade:"일반", weight:3, gauge:6, anim:"social",
      text:"택배 아저씨가 지나가자 반갑게 마중 나간다.",
      stat:[{p:"core.affinity", n:1}, {p:"core.power", n:-1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-006", cat:"후각/탐지", grade:"일반", weight:3, gauge:5, anim:"sniff",
      text:"화단 앞에서 킁킁, 새로 핀 꽃 냄새를 맡는다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.power", n:-1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-007", cat:"감정/유대", grade:"일반", weight:3, gauge:4, anim:"social",
      text:"대문 앞에 앉아 누군가 오기를 기다린다.",
      stat:[{p:"life.bond", n:1}, {p:"core.power", n:-1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-008", cat:"환경 연동", grade:"일반", weight:3, gauge:6, anim:"social",
      text:"낯선 차 소리에 짖으려다 꾹 참는다.",
      stat:[{p:"life.independence", n:1}, {p:"core.power", n:-1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-009", cat:"신체활동", grade:"일반", weight:3, gauge:7, anim:"run",
      text:"작은 마당을 신나게 한 바퀴 돈다.",
      stat:[{p:"core.power", n:1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-010", cat:"희귀/특수", grade:"고급", weight:2, gauge:8, anim:"dash",
      text:"이웃집 고양이와 눈이 마주쳐 잠시 신경전을 벌인다.",
      stat:[{p:"core.aggression", n:1}, {p:"life.stress", n:1}, {p:"core.power", n:-1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-011", cat:"신체활동", grade:"일반", weight:3, gauge:6, anim:"run",
      text:"현관 계단을 오르락내리락 신나게 오간다.",
      stat:[{p:"core.power", n:1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-012", cat:"감정/유대", grade:"일반", weight:3, gauge:4, anim:"lookup",
      text:"창문 밖을 한참 내다본다.",
      stat:[{p:"life.bond", n:1}, {p:"core.power", n:-1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-013", cat:"후각/탐지", grade:"일반", weight:3, gauge:5, anim:"sniff",
      text:"막 걷어온 빨래 냄새를 킁킁 맡는다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.power", n:-1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-014", cat:"생리현상", grade:"일반", weight:3, gauge:4, anim:"rest",
      text:"따스한 현관 앞에서 살짝 낮잠에 빠진다.",
      stat:[{p:"life.stress", n:-1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-015", cat:"환경 연동", grade:"고급", weight:2, gauge:6, anim:"lookup",
      text:"지나가는 자전거 벨 소리에 귀를 쫑긋 세운다.",
      stat:[{p:"core.agility", n:1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-016", cat:"사회", grade:"고급", weight:2, gauge:6, anim:"social",
      text:"골목 어귀에서 동네 고양이와 마주친다.",
      stat:[{p:"core.affinity", n:1}, {p:"core.loyalty", n:1}] },
    { id:"HOME-017", cat:"감정/유대", grade:"희귀", weight:1, gauge:5, anim:"rest",
      text:"익숙한 냄새들 사이에서 마음이 편안해진다.",
      stat:[{p:"life.stress", n:-2}] },
    { id:"HOME-018", cat:"신체활동", grade:"고급", weight:2, gauge:8, anim:"dig", particle:"dust",
      text:"마당 한구석의 흙을 신나게 파본다.",
      stat:[{p:"core.power", n:1}, {p:"life.clean", n:-1}] },
    { id:"HOME-019", cat:"사회", grade:"희귀", weight:1, gauge:7, anim:"social",
      text:"낯선 방문객의 기척에 조심스레 경계한다.",
      stat:[{p:"core.aggression", n:1}] },
    { id:"HOME-020", cat:"환경 연동", grade:"전설", weight:0.4, gauge:6, anim:"lookup", particle:"sparkle",
      cond:function(){ return timeBand() === "evening"; },
      text:"붉게 물든 저녁노을을 나란히 바라본다.",
      stat:[{p:"life.bond", n:2}, {p:"life.stress", n:-1}] }
  ];

  var PARK_EVENTS = [
    { id:"PARK-001", cat:"감정/유대", grade:"일반", weight:3, gauge:6, anim:"social",
      text:"벤치에 앉은 어르신이 반가워하며 손을 내민다.",
      stat:[{p:"core.affinity", n:1}, {p:"life.bond", n:1}, {p:"core.execution", n:-1}, {p:"core.affinity", n:1}] },
    { id:"PARK-002", cat:"수집", grade:"일반", weight:3, gauge:7, anim:"pickup",
      text:"미끄럼틀 아래로 살금살금 들어가 뭔가를 찾는다.",
      stat:[{p:"core.execution", n:-1}, {p:"core.affinity", n:1}],
      sideEffect:function(ctx){ if(Math.random() <= 0.2){ grantWalkItem("나뭇가지", 1, ctx); ctx.session.log.push("숲 놀이터 아래서 나뭇가지를 주웠어요."); } } },
    // 59번(58번 3~5번, 주인 개입 시스템 반영): 선택형 — 함께 논다: 친화력+2·친구목록 등록(WALK_NPCS
    // 재사용) / 거리를 둔다: 변화 없음 / 짖는다: 공격성+1
    { id:"PARK-003", cat:"사회", grade:"일반", weight:3, gauge:8, anim:"social",
      text:"공원에 놀러 나온 다른 강아지 무리를 발견한다.",
      stat:[],
      intervene:{ type:"choice", options:[
        { label:"함께 논다", stat:[{p:"core.affinity", n:2}], sideEffect:walkFriendSideEffect },
        { label:"거리를 둔다", stat:[] },
        { label:"짖는다", stat:[{p:"core.aggression", n:1}] }
      ] } },
    { id:"PARK-004", cat:"희귀/특수", grade:"희귀", weight:1, gauge:12, anim:"dash",
      text:"비둘기 떼를 발견하고 신나게 쫓아버린다.",
      stat:[{p:"core.agility", n:2}, {p:"core.execution", n:-1}, {p:"core.affinity", n:1}] },
    { id:"PARK-005", cat:"수집", grade:"일반", weight:3, gauge:6, anim:"pickup",
      text:"그네 밑을 킁킁대며 뒤진다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.execution", n:-1}, {p:"core.affinity", n:1}] },
    { id:"PARK-006", cat:"생리현상", grade:"일반", weight:3, gauge:5, anim:"rest",
      text:"푹신한 잔디밭에 벌러덩 드러눕는다.",
      stat:[{p:"life.clean", n:-1}, {p:"life.stress", n:-1}, {p:"core.execution", n:-1}, {p:"core.affinity", n:1}] },
    { id:"PARK-007", cat:"환경 연동", grade:"일반", weight:3, gauge:5, anim:"lookup", particle:"water",
      text:"분수대에서 튀는 물방울을 신기하게 구경한다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.execution", n:-1}, {p:"core.affinity", n:1}] },
    { id:"PARK-008", cat:"신체활동", grade:"일반", weight:3, gauge:9, anim:"run",
      text:"조깅하는 사람을 따라 신나게 뛴다.",
      stat:[{p:"core.agility", n:1}, {p:"core.execution", n:-1}, {p:"core.affinity", n:1}] },
    { id:"PARK-009", cat:"사회", grade:"일반", weight:3, gauge:6, anim:"social",
      text:"공놀이하는 아이들을 흥미롭게 구경한다.",
      stat:[{p:"core.affinity", n:1}, {p:"core.execution", n:-1}, {p:"core.affinity", n:1}] },
    { id:"PARK-010", cat:"생리현상", grade:"일반", weight:3, gauge:4, anim:"rest",
      text:"벤치 밑 그늘로 쏙 들어가 쉰다.",
      stat:[{p:"life.stress", n:-1}, {p:"core.execution", n:-1}, {p:"core.affinity", n:1}] },
    { id:"PARK-011", cat:"사회", grade:"고급", weight:2, gauge:6, anim:"social",
      text:"다른 견주와 반갑게 인사를 나눈다.",
      stat:[{p:"core.loyalty", n:1}, {p:"core.execution", n:-1}, {p:"core.affinity", n:1}] },
    { id:"PARK-012", cat:"신체활동", grade:"고급", weight:2, gauge:10, anim:"dig", particle:"dust",
      cond:function(){ return currentSeason() === "autumn"; },
      text:"낙엽 더미로 신나게 다이빙한다.",
      stat:[{p:"core.power", n:1}, {p:"life.clean", n:-1}, {p:"core.affinity", n:1}] },
    { id:"PARK-013", cat:"신체활동", grade:"고급", weight:2, gauge:9, anim:"splash", particle:"water",
      text:"분수대 물줄기를 피해 첨벙거리며 논다.",
      stat:[{p:"life.clean", n:-2}, {p:"life.stress", n:-1}, {p:"core.affinity", n:1}] },
    { id:"PARK-014", cat:"후각/탐지", grade:"일반", weight:3, gauge:5, anim:"sniff",
      text:"운동기구 여기저기의 냄새를 맡고 다닌다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.affinity", n:1}] },
    { id:"PARK-015", cat:"신체활동", grade:"희귀", weight:1, gauge:8, anim:"dash",
      text:"날아가는 배드민턴 공을 신나게 쫓는다.",
      stat:[{p:"core.agility", n:2}, {p:"core.affinity", n:1}] },
    { id:"PARK-016", cat:"환경 연동", grade:"일반", weight:3, gauge:5, anim:"lookup",
      text:"비둘기들이 모이 먹는 모습을 가만히 지켜본다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.affinity", n:1}] },
    { id:"PARK-017", cat:"희귀/특수", grade:"희귀", weight:1, gauge:6, anim:"lookup", particle:"sparkle",
      cond:function(){ return WEATHER_STATE.condition === "clear" && timeBand() === "day"; },
      text:"분수대 물보라 사이로 작은 무지개가 보인다.",
      stat:[{p:"life.hunger", n:1}, {p:"life.clean", n:1}, {p:"life.bond", n:1}, {p:"life.stress", n:-1}] },
    { id:"PARK-018", cat:"사회", grade:"희귀", weight:1, gauge:7, anim:"social",
      text:"공원의 터줏대감처럼 보이는 강아지와 인사한다.",
      stat:[{p:"core.loyalty", n:1}, {p:"core.affinity", n:1}] },
    { id:"PARK-019", cat:"생리현상", grade:"희귀", weight:1, gauge:5, anim:"rest",
      text:"볕 좋은 벤치 아래서 깊이 낮잠에 빠진다.",
      stat:[{p:"life.stress", n:-2}] },
    { id:"PARK-020", cat:"환경 연동", grade:"전설", weight:0.4, gauge:8, anim:"dash", particle:"sparkle",
      cond:function(){ return WEATHER_STATE.condition === "snow"; },
      text:"올겨울 첫눈을 신나게 밟아본다.",
      stat:[{p:"life.bond", n:2}, {p:"life.stress", n:-2}] }
  ];

  var FOREST_EVENTS = [
    // 수집 아이템 '도토리'은 아직 미등록(3~5번에서 등록 예정) — 이번엔 아이템 지급 없이 기본 효과만 반영
    // 59번(58번 3~5번, 신규 수집 아이템 반영): 도토리 1개 획득 — COLLECTION_ITEMS 신규 등록분
    { id:"FOREST-001", cat:"수집", grade:"일반", weight:3, gauge:6, anim:"pickup",
      text:"떨어진 도토리 하나를 발견하고 조심스레 문다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.loyalty", n:-1}], sideEffect:function(ctx){ grantWalkItem("도토리", 1, ctx); } },
    { id:"FOREST-002", cat:"사회", grade:"일반", weight:3, gauge:5, anim:"sniff",
      text:"커다란 나무 둥치 냄새를 맡고 영역 표시를 한다.",
      stat:[{p:"core.loyalty", n:1}, {p:"core.comprehension", n:1}] },
    { id:"FOREST-003", cat:"신체활동", grade:"일반", weight:3, gauge:14, anim:"dash",
      text:"숲속에서 다람쥐를 발견하고 전력으로 뒤쫓는다.",
      stat:[{p:"core.agility", n:2}, {p:"life.stress", n:1}, {p:"core.comprehension", n:1}, {p:"core.loyalty", n:-1}] },
    { id:"FOREST-004", cat:"생리현상", grade:"희귀", weight:1, gauge:4, anim:"rest",
      text:"울창한 나무 그늘 아래서 잠시 멈춰 서서 쉰다.",
      stat:[{p:"life.stress", n:-1}, {p:"core.comprehension", n:1}, {p:"core.loyalty", n:-1}] },
    { id:"FOREST-005", cat:"환경 연동", grade:"일반", weight:3, gauge:5, anim:"sniff",
      text:"낯선 버섯을 신기한 듯 킁킁댄다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.comprehension", n:1}, {p:"core.loyalty", n:-1}] },
    { id:"FOREST-006", cat:"신체활동", grade:"일반", weight:3, gauge:7, anim:"dash",
      text:"팔랑이는 나비를 신나게 쫓는다.",
      stat:[{p:"core.agility", n:1}, {p:"core.comprehension", n:1}, {p:"core.loyalty", n:-1}] },
    { id:"FOREST-007", cat:"환경 연동", grade:"일반", weight:3, gauge:5, anim:"lookup",
      text:"머리 위 새소리에 귀를 쫑긋 기울인다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.comprehension", n:1}, {p:"core.loyalty", n:-1}] },
    { id:"FOREST-008", cat:"후각/탐지", grade:"일반", weight:3, gauge:6, anim:"sniff",
      text:"이끼 낀 바위 구석구석을 탐색한다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.comprehension", n:1}, {p:"core.loyalty", n:-1}] },
    { id:"FOREST-009", cat:"신체활동", grade:"고급", weight:2, gauge:8, anim:"run",
      text:"쓰러진 통나무를 폴짝 뛰어넘는다.",
      stat:[{p:"core.power", n:1}, {p:"core.comprehension", n:1}, {p:"core.loyalty", n:-1}] },
    { id:"FOREST-010", cat:"환경 연동", grade:"일반", weight:3, gauge:5, anim:"lookup",
      text:"딱따구리가 나무 쪼는 소리를 구경한다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.comprehension", n:1}, {p:"core.loyalty", n:-1}] },
    { id:"FOREST-011", cat:"희귀/특수", grade:"희귀", weight:1, gauge:8, anim:"sniff",
      text:"여우가 지나간 듯한 흔적을 발견한다.",
      stat:[{p:"core.comprehension", n:2}, {p:"core.comprehension", n:1}, {p:"core.loyalty", n:-1}] },
    { id:"FOREST-012", cat:"수집", grade:"일반", weight:3, gauge:5, anim:"pickup",
      text:"떨어진 솔방울을 콕콕 건드려본다.",
      stat:[{p:"core.power", n:1}, {p:"core.comprehension", n:1}, {p:"core.loyalty", n:-1}] },
    { id:"FOREST-013", cat:"환경 연동", grade:"일반", weight:3, gauge:5, anim:"lookup",
      cond:function(){ return currentSeason() === "autumn"; },
      text:"바스락바스락, 낙엽 밟는 소리에 신이 난다.",
      stat:[{p:"life.bond", n:1}, {p:"core.comprehension", n:1}] },
    { id:"FOREST-014", cat:"생리현상", grade:"고급", weight:2, gauge:5, anim:"rest",
      text:"깊은 숲그늘 아래서 살짝 낮잠에 빠진다.",
      stat:[{p:"life.stress", n:-1}, {p:"core.comprehension", n:1}] },
    { id:"FOREST-015", cat:"환경 연동", grade:"고급", weight:2, gauge:5, anim:"lookup", particle:"water",
      text:"졸졸 흐르는 계곡물 소리에 귀 기울인다.",
      stat:[{p:"life.stress", n:-1}, {p:"core.comprehension", n:1}] },
    { id:"FOREST-016", cat:"희귀/특수", grade:"희귀", weight:1, gauge:8, anim:"social",
      text:"멧돼지가 지나간 듯한 흔적에 바짝 긴장한다.",
      stat:[{p:"core.aggression", n:1}, {p:"life.stress", n:1}, {p:"core.comprehension", n:1}] },
    { id:"FOREST-017", cat:"환경 연동", grade:"일반", weight:3, gauge:5, anim:"lookup",
      text:"나무 위를 재빠르게 오르내리는 다람쥐를 구경한다.",
      stat:[{p:"core.comprehension", n:1}] },
    { id:"FOREST-018", cat:"환경 연동", grade:"희귀", weight:1, gauge:5, anim:"lookup",
      cond:function(){ return timeBand() === "morning"; },
      text:"이른 아침 숲에 낀 안개 사이를 걷는다.",
      stat:[{p:"life.stress", n:-1}] },
    { id:"FOREST-019", cat:"희귀/특수", grade:"전설", weight:0.4, gauge:6, anim:"lookup", particle:"sparkle",
      cond:function(){ return timeBand() === "night" && currentSeason() === "summer"; },
      text:"반딧불이 무리가 반짝이며 날아다닌다.",
      stat:[{p:"life.bond", n:2}] },
    { id:"FOREST-020", cat:"희귀/특수", grade:"전설", weight:0.4, gauge:6, anim:"lookup", particle:"sparkle",
      text:"숲 전체가 신비로운 기운으로 가득한 듯한 순간.",
      stat:[{p:"life.hunger", n:1}, {p:"life.clean", n:1}, {p:"life.bond", n:2}, {p:"life.stress", n:-1}] }
  ];

  var MTN_EVENTS = [
    { id:"MTN-001", cat:"신체활동", grade:"일반", weight:3, gauge:16, anim:"run",
      text:"가파른 오르막길을 낑낑대며 열심히 오른다.",
      stat:[{p:"core.power", n:2}, {p:"core.power", n:1}, {p:"core.agility", n:-1}] },
    { id:"MTN-002", cat:"생리현상", grade:"일반", weight:3, gauge:6, anim:"lookup",
      text:"정상에 올라 탁 트인 풍경을 바라본다.",
      stat:[{p:"life.hunger", n:1}, {p:"life.clean", n:1}, {p:"life.bond", n:1}, {p:"life.stress", n:-1}, {p:"core.power", n:1}, {p:"core.agility", n:-1}] },
    // 58단계(지역 확장, v4 엑셀 반영): 개입형 예시 이벤트 — 실제 O/X·선택형 개입 시스템은 3~5번에서 추가 예정, 우선 효과 없는 텍스트+애니메이션으로만 반영
    // 59번(58번 3~5번, 주인 개입 시스템 반영): O/X형 — O(부축하듯 챙긴다): 유대감+1 / X(그냥 지켜본다): 변화 없음
    { id:"MTN-003", cat:"희귀/특수", grade:"일반", weight:3, gauge:8, anim:"run",
      text:"돌부리에 발이 걸려 휘청, 넘어질 뻔한다.",
      stat:[],
      intervene:{ type:"ox", options:[
        { label:"O (부축하듯 챙긴다)", stat:[{p:"life.bond", n:1}] },
        { label:"X (그냥 지켜본다)", stat:[] }
      ] } },
    { id:"MTN-004", cat:"환경 연동", grade:"희귀", weight:1, gauge:12, anim:"splash", particle:"water",
      // 65번(16장): '물개' 물웅덩이 가중치 ×2 대상 — WALK-037 주석 참고.
      weightMult:function(){ return isAbilityOwned("sealPup") ? 2 : 1; },
      text:"차갑고 맑은 계곡물을 조심스레 건넌다.",
      stat:[{p:"core.agility", n:1}, {p:"life.clean", n:-1}, {p:"core.power", n:1}] },
    { id:"MTN-005", cat:"신체활동", grade:"일반", weight:3, gauge:8, anim:"run",
      text:"커다란 바위 위로 폴짝 뛰어오른다.",
      stat:[{p:"core.agility", n:1}, {p:"core.power", n:1}] },
    { id:"MTN-006", cat:"신체활동", grade:"일반", weight:3, gauge:9, anim:"run",
      text:"산길에 튀어나온 나무뿌리를 훌쩍 넘는다.",
      stat:[{p:"core.power", n:1}, {p:"core.power", n:1}, {p:"core.agility", n:-1}] },
    { id:"MTN-007", cat:"환경 연동", grade:"일반", weight:3, gauge:5, anim:"lookup",
      text:"산새 울음소리에 잠시 멈춰 귀 기울인다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.power", n:1}, {p:"core.agility", n:-1}] },
    { id:"MTN-008", cat:"사회", grade:"일반", weight:3, gauge:6, anim:"social",
      text:"마주친 등산객과 반갑게 인사한다.",
      stat:[{p:"core.affinity", n:1}, {p:"core.power", n:1}, {p:"core.agility", n:-1}] },
    { id:"MTN-009", cat:"수집", grade:"일반", weight:3, gauge:5, anim:"pickup",
      text:"이름 모를 야생화를 코로 톡톡 건드려본다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.power", n:1}, {p:"core.agility", n:-1}] },
    { id:"MTN-010", cat:"생리현상", grade:"일반", weight:3, gauge:6, anim:"rest",
      text:"가쁜 숨을 헐떡이며 잠시 고른다.",
      stat:[{p:"life.stress", n:1}, {p:"core.power", n:1}, {p:"core.agility", n:-1}] },
    { id:"MTN-011", cat:"환경 연동", grade:"고급", weight:2, gauge:6, anim:"lookup",
      text:"산 정상에서 불어오는 시원한 바람을 맞는다.",
      stat:[{p:"life.stress", n:-1}, {p:"core.power", n:1}, {p:"core.agility", n:-1}] },
    { id:"MTN-012", cat:"신체활동", grade:"고급", weight:2, gauge:14, anim:"run",
      text:"울퉁불퉁한 바위길을 힘차게 오른다.",
      stat:[{p:"core.power", n:2}, {p:"core.power", n:1}, {p:"core.agility", n:-1}] },
    { id:"MTN-013", cat:"희귀/특수", grade:"고급", weight:2, gauge:8, anim:"dash",
      text:"다람쥐가 유독 많은 구간을 지난다.",
      stat:[{p:"core.agility", n:1}, {p:"core.power", n:1}] },
    { id:"MTN-014", cat:"생리현상", grade:"고급", weight:2, gauge:4, anim:"sniff",
      text:"산속 옹달샘 물을 시원하게 마신다.",
      stat:[{p:"life.hunger", n:1}, {p:"core.power", n:1}, {p:"core.agility", n:-1}] },
    { id:"MTN-015", cat:"환경 연동", grade:"희귀", weight:1, gauge:7, anim:"lookup",
      cond:function(){ return timeBand() === "morning" || WEATHER_STATE.condition === "fog"; },
      text:"안개 낀 산길이라 왠지 조금 긴장된다.",
      stat:[{p:"life.stress", n:1}, {p:"core.power", n:1}] },
    { id:"MTN-016", cat:"신체활동", grade:"희귀", weight:1, gauge:10, anim:"dash",
      text:"스쳐 지나가는 산악자전거를 피해 몸을 낮춘다.",
      stat:[{p:"core.agility", n:2}, {p:"core.power", n:1}] },
    { id:"MTN-017", cat:"희귀/특수", grade:"희귀", weight:1, gauge:6, anim:"lookup", particle:"sparkle",
      text:"정상석 앞에서 뿌듯한 듯 잠시 멈춰 선다.",
      stat:[{p:"life.hunger", n:1}, {p:"life.clean", n:1}, {p:"life.bond", n:1}, {p:"life.stress", n:-1}] },
    { id:"MTN-018", cat:"환경 연동", grade:"희귀", weight:1, gauge:6, anim:"lookup",
      cond:function(){ return currentSeason() === "autumn"; },
      text:"붉게 물든 단풍이 절정인 산길을 걷는다.",
      stat:[{p:"life.bond", n:2}] },
    { id:"MTN-019", cat:"희귀/특수", grade:"전설", weight:0.4, gauge:6, anim:"lookup",
      text:"멀리 보이는 산불감시탑을 신기하게 올려다본다.",
      stat:[{p:"core.comprehension", n:2}] },
    { id:"MTN-020", cat:"희귀/특수", grade:"전설", weight:0.4, gauge:6, anim:"lookup", particle:"sparkle",
      cond:function(){ return timeBand() === "earlyMorning"; },
      text:"발아래로 펼쳐진 구름바다를 가만히 내려다본다.",
      stat:[{p:"life.bond", n:2}, {p:"life.stress", n:-1}] }
  ];

  var LAKE_EVENTS = [
    { id:"LAKE-001", cat:"후각/탐지", grade:"일반", weight:3, gauge:4, anim:"lookup",
      text:"누군가 뜨는 물수제비를 신기한 듯 구경한다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.agility", n:1}, {p:"core.affinity", n:-1}] },
    { id:"LAKE-002", cat:"신체활동", grade:"일반", weight:3, gauge:12, anim:"dash",
      text:"호숫가의 오리 떼를 보고 신나게 쫓아다닌다.",
      stat:[{p:"core.agility", n:2}, {p:"core.agility", n:1}, {p:"core.affinity", n:-1}] },
    // 58단계(지역 확장, v4 엑셀 반영): 개입형 예시 이벤트 — 실제 O/X·선택형 개입 시스템은 3~5번에서 추가 예정, 우선 효과 없는 텍스트+애니메이션으로만 반영
    // 59번(58번 3~5번, 주인 개입 시스템 반영): 선택형 — 짖는다: 공격성+1 / 친구인 줄 안다: 친화력+1 / 무시하고 지나간다: 변화 없음
    { id:"LAKE-003", cat:"희귀/특수", grade:"일반", weight:3, gauge:5, anim:"lookup",
      text:"호수에 비친 자기 모습을 발견하고 멈칫한다.",
      stat:[],
      intervene:{ type:"choice", options:[
        { label:"짖는다", stat:[{p:"core.aggression", n:1}] },
        { label:"친구인 줄 안다", stat:[{p:"core.affinity", n:1}] },
        { label:"무시하고 지나간다", stat:[] }
      ] } },
    { id:"LAKE-004", cat:"생리현상", grade:"희귀", weight:1, gauge:10, anim:"splash", particle:"water",
      // 65번(16장): '물개' 물웅덩이 가중치 ×2 대상 — WALK-037 주석 참고.
      weightMult:function(){ return isAbilityOwned("sealPup") ? 2 : 1; },
      text:"얕은 물가에서 신나게 첨벙거리며 논다.",
      stat:[{p:"life.clean", n:-2}, {p:"life.stress", n:-1}, {p:"core.agility", n:1}, {p:"core.affinity", n:-1}] },
    { id:"LAKE-005", cat:"신체활동", grade:"일반", weight:3, gauge:7, anim:"dash",
      text:"호숫가를 날아다니는 잠자리를 쫓는다.",
      stat:[{p:"core.agility", n:1}, {p:"core.agility", n:1}, {p:"core.affinity", n:-1}] },
    { id:"LAKE-006", cat:"환경 연동", grade:"일반", weight:3, gauge:4, anim:"lookup", particle:"water",
      text:"누군가 던진 돌이 물수제비 뜨는 걸 구경한다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.agility", n:1}, {p:"core.affinity", n:-1}] },
    { id:"LAKE-007", cat:"사회", grade:"일반", weight:3, gauge:5, anim:"lookup",
      text:"낚싯대를 드리운 사람을 가만히 구경한다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.agility", n:1}, {p:"core.affinity", n:-1}] },
    { id:"LAKE-008", cat:"희귀/특수", grade:"고급", weight:2, gauge:6, anim:"lookup",
      text:"우아하게 헤엄치는 백조 가족을 발견한다.",
      stat:[{p:"core.affinity", n:1}, {p:"core.agility", n:1}] },
    { id:"LAKE-009", cat:"신체활동", grade:"일반", weight:3, gauge:8, anim:"run",
      text:"호숫가 산책로를 힘차게 걷는다.",
      stat:[{p:"core.power", n:1}, {p:"core.agility", n:1}, {p:"core.affinity", n:-1}] },
    { id:"LAKE-010", cat:"환경 연동", grade:"일반", weight:3, gauge:4, anim:"lookup", particle:"water",
      text:"물 위로 튀어 오르는 물고기에 깜짝 놀란다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.agility", n:1}, {p:"core.affinity", n:-1}] },
    { id:"LAKE-011", cat:"환경 연동", grade:"고급", weight:2, gauge:5, anim:"lookup",
      cond:function(){ return timeBand() === "morning"; },
      text:"이른 아침 호수에 낀 물안개 사이를 걷는다.",
      stat:[{p:"life.stress", n:-1}, {p:"core.agility", n:1}, {p:"core.affinity", n:-1}] },
    { id:"LAKE-012", cat:"사회", grade:"고급", weight:2, gauge:5, anim:"social",
      text:"아직 작은 오리 새끼들과 눈을 마주친다.",
      stat:[{p:"core.affinity", n:1}, {p:"core.agility", n:1}] },
    { id:"LAKE-013", cat:"후각/탐지", grade:"고급", weight:2, gauge:5, anim:"sniff",
      cond:function(){ return currentSeason() === "summer"; },
      text:"활짝 핀 연꽃 냄새를 킁킁 맡는다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.agility", n:1}, {p:"core.affinity", n:-1}] },
    { id:"LAKE-014", cat:"후각/탐지", grade:"일반", weight:3, gauge:4, anim:"sniff",
      text:"호숫가 피크닉 자리의 맛있는 냄새를 맡는다.",
      stat:[{p:"life.hunger", n:1}, {p:"core.agility", n:1}] },
    { id:"LAKE-015", cat:"신체활동", grade:"희귀", weight:1, gauge:6, anim:"splash", particle:"water",
      // 65번(16장): '물개' 물웅덩이 가중치 ×2 대상 — WALK-037 주석 참고.
      weightMult:function(){ return isAbilityOwned("sealPup") ? 2 : 1; },
      text:"직접 물수제비를 흉내 내며 물장구를 친다.",
      stat:[{p:"core.agility", n:1}, {p:"core.agility", n:1}] },
    { id:"LAKE-016", cat:"환경 연동", grade:"희귀", weight:1, gauge:5, anim:"lookup", particle:"sparkle",
      cond:function(){ return timeBand() === "evening"; },
      text:"노을이 호수 위로 붉게 번져간다.",
      stat:[{p:"life.bond", n:2}, {p:"core.agility", n:1}] },
    { id:"LAKE-017", cat:"희귀/특수", grade:"희귀", weight:1, gauge:6, anim:"lookup",
      text:"반짝이는 물고기 떼가 수면 가까이 지나간다.",
      stat:[{p:"core.comprehension", n:2}] },
    { id:"LAKE-018", cat:"환경 연동", grade:"희귀", weight:1, gauge:5, anim:"lookup",
      text:"호수 위로 뽀얀 물안개가 잔잔히 깔린다.",
      stat:[{p:"life.stress", n:-1}] },
    { id:"LAKE-019", cat:"희귀/특수", grade:"전설", weight:0.4, gauge:6, anim:"lookup", particle:"sparkle",
      text:"윤슬이 반짝이며 눈부시게 빛난다.",
      stat:[{p:"life.hunger", n:1}, {p:"life.clean", n:1}, {p:"life.bond", n:1}, {p:"life.stress", n:-1}] },
    { id:"LAKE-020", cat:"희귀/특수", grade:"전설", weight:0.4, gauge:6, anim:"lookup", particle:"sparkle",
      cond:function(){ return timeBand() === "night" && isFullMoonNow(); },
      text:"보름달이 호수 위에 동그랗게 비친다.",
      stat:[{p:"life.bond", n:2}, {p:"life.stress", n:-1}] }
  ];

  var CITY_EVENTS = [
    { id:"CITY-001", cat:"사회", grade:"일반", weight:3, gauge:6, anim:"social",
      text:"카페 테라스 손님들의 관심을 한몸에 받는다.",
      stat:[{p:"core.affinity", n:1}, {p:"core.execution", n:1}, {p:"core.health", n:-1}] },
    { id:"CITY-002", cat:"신체활동", grade:"일반", weight:3, gauge:10, anim:"run",
      text:"붐비는 인파 사이를 요리조리 지나간다.",
      stat:[{p:"core.agility", n:1}, {p:"core.execution", n:1}, {p:"core.health", n:-1}] },
    { id:"CITY-003", cat:"희귀/특수", grade:"일반", weight:3, gauge:4, anim:"lookup",
      text:"쇼윈도에 비친 자기 모습에 놀라 멈칫 선다.",
      stat:[{p:"core.execution", n:1}, {p:"core.health", n:-1}] },
    // 58단계(지역 확장, v4 엑셀 반영): 개입형 예시 이벤트 — 실제 O/X·선택형 개입 시스템은 3~5번에서 추가 예정, 우선 효과 없는 텍스트+애니메이션으로만 반영
    // 59번(58번 3~5번, 주인 개입 시스템 반영): O/X형 — O(같이 몸을 흔든다): 유대감+1 / X(가만히 구경만 한다): 변화 없음
    { id:"CITY-004", cat:"환경 연동", grade:"희귀", weight:1, gauge:5, anim:"social",
      text:"길거리 공연 음악 소리에 발걸음을 멈춘다.",
      stat:[],
      intervene:{ type:"ox", options:[
        { label:"O (같이 몸을 흔든다)", stat:[{p:"life.bond", n:1}] },
        { label:"X (가만히 구경만 한다)", stat:[] }
      ] } },
    { id:"CITY-005", cat:"희귀/특수", grade:"일반", weight:3, gauge:4, anim:"lookup",
      text:"상점 쇼윈도에 진열된 물건들을 구경한다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.execution", n:1}, {p:"core.health", n:-1}] },
    { id:"CITY-006", cat:"사회", grade:"일반", weight:3, gauge:5, anim:"rest",
      text:"신호등이 바뀌길 얌전히 기다린다.",
      stat:[{p:"core.loyalty", n:1}, {p:"core.execution", n:1}, {p:"core.health", n:-1}] },
    { id:"CITY-007", cat:"후각/탐지", grade:"일반", weight:3, gauge:5, anim:"sniff",
      text:"노점상에서 풍기는 냄새에 코를 킁킁댄다.",
      stat:[{p:"life.hunger", n:1}, {p:"core.execution", n:1}, {p:"core.health", n:-1}] },
    { id:"CITY-008", cat:"환경 연동", grade:"일반", weight:3, gauge:6, anim:"social",
      text:"지나가는 버스 소리에도 침착하게 걷는다.",
      stat:[{p:"life.independence", n:1}, {p:"core.execution", n:1}, {p:"core.health", n:-1}] },
    { id:"CITY-009", cat:"사회", grade:"일반", weight:3, gauge:6, anim:"social",
      text:"길거리 악사의 연주를 흥미롭게 구경한다.",
      stat:[{p:"core.affinity", n:1}, {p:"core.execution", n:1}, {p:"core.health", n:-1}] },
    { id:"CITY-010", cat:"환경 연동", grade:"일반", weight:3, gauge:5, anim:"lookup",
      text:"분주한 사람들의 발걸음 소리에 귀 기울인다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.execution", n:1}, {p:"core.health", n:-1}] },
    { id:"CITY-011", cat:"희귀/특수", grade:"고급", weight:2, gauge:6, anim:"dash",
      text:"옷가게 마네킹을 보고 놀라 짖을 뻔한다.",
      stat:[{p:"core.aggression", n:1}, {p:"core.execution", n:1}, {p:"core.health", n:-1}] },
    { id:"CITY-012", cat:"후각/탐지", grade:"고급", weight:2, gauge:5, anim:"sniff",
      text:"아이스크림 트럭에서 나는 달콤한 냄새를 맡는다.",
      stat:[{p:"life.hunger", n:1}, {p:"core.execution", n:1}] },
    { id:"CITY-013", cat:"생리현상", grade:"고급", weight:2, gauge:5, anim:"rest",
      text:"높은 빌딩 그림자 아래서 더위를 식힌다.",
      stat:[{p:"life.stress", n:-1}, {p:"core.execution", n:1}] },
    { id:"CITY-014", cat:"신체활동", grade:"고급", weight:2, gauge:9, anim:"dash",
      text:"도심 한복판의 비둘기 떼를 쫓아본다.",
      stat:[{p:"core.agility", n:1}, {p:"core.execution", n:1}] },
    { id:"CITY-015", cat:"환경 연동", grade:"희귀", weight:1, gauge:6, anim:"dash",
      text:"갑작스러운 택시 클랙슨 소리에 놀란다.",
      stat:[{p:"life.stress", n:1}, {p:"core.execution", n:1}] },
    { id:"CITY-016", cat:"희귀/특수", grade:"희귀", weight:1, gauge:6, anim:"lookup", particle:"sparkle",
      cond:function(){ return currentSeason() === "winter"; },
      text:"화려한 크리스마스 장식을 구경한다.",
      stat:[{p:"life.bond", n:1}, {p:"core.execution", n:1}] },
    { id:"CITY-017", cat:"희귀/특수", grade:"희귀", weight:1, gauge:7, anim:"dash",
      text:"골목에서 마주친 길고양이에 잠시 경계한다.",
      stat:[{p:"core.aggression", n:1}] },
    { id:"CITY-018", cat:"환경 연동", grade:"희귀", weight:1, gauge:6, anim:"lookup", particle:"sparkle",
      cond:function(){ return timeBand() === "evening"; },
      text:"노을에 물든 빌딩숲 사이를 걷는다.",
      stat:[{p:"life.hunger", n:1}, {p:"life.clean", n:1}, {p:"life.bond", n:1}, {p:"life.stress", n:-1}] },
    { id:"CITY-019", cat:"희귀/특수", grade:"전설", weight:0.4, gauge:6, anim:"lookup", particle:"sparkle",
      cond:function(){ return timeBand() === "night"; },
      text:"화려한 도심 야경이 눈앞에 펼쳐진다.",
      stat:[{p:"life.bond", n:2}] },
    { id:"CITY-020", cat:"희귀/특수", grade:"전설", weight:0.4, gauge:6, anim:"social", particle:"sparkle",
      text:"길거리 공연이 끝나자 사람들의 박수갈채가 쏟아진다.",
      stat:[{p:"core.affinity", n:2}, {p:"life.bond", n:1}] }
  ];

  var BEACH_EVENTS = [
    { id:"BEACH-001", cat:"신체활동", grade:"일반", weight:3, gauge:10, anim:"run", particle:"water",
      text:"밀려오는 파도를 피해 후다닥 도망친다.",
      stat:[{p:"core.agility", n:1}, {p:"core.comprehension", n:-1}, {p:"core.health", n:1}] },
    { id:"BEACH-002", cat:"신체활동", grade:"일반", weight:3, gauge:12, anim:"dig", particle:"dust",
      text:"신나게 모래를 파헤치며 논다.",
      stat:[{p:"core.power", n:1}, {p:"life.clean", n:-1}, {p:"core.comprehension", n:-1}, {p:"core.health", n:1}] },
    { id:"BEACH-003", cat:"신체활동", grade:"일반", weight:3, gauge:12, anim:"dash",
      text:"갈매기를 발견하고 힘차게 쫓아간다.",
      stat:[{p:"core.agility", n:1}, {p:"core.comprehension", n:-1}, {p:"core.health", n:1}] },
    // 수집 아이템 '조개껍데기'은 아직 미등록(3~5번에서 등록 예정) — 이번엔 아이템 지급 없이 기본 효과만 반영
    // 59번(58번 3~5번, 신규 수집 아이템 반영): 조개껍데기 1개 획득 — COLLECTION_ITEMS 신규 등록분
    { id:"BEACH-004", cat:"수집", grade:"희귀", weight:1, gauge:5, anim:"pickup", particle:"sparkle",
      text:"반짝이는 조개껍데기 하나를 발견한다.",
      stat:[{p:"core.comprehension", n:-1}, {p:"core.health", n:1}], sideEffect:function(ctx){ grantWalkItem("조개껍데기", 1, ctx); } },
    { id:"BEACH-005", cat:"환경 연동", grade:"일반", weight:3, gauge:4, anim:"lookup", particle:"water",
      text:"철썩이는 파도 소리에 가만히 귀 기울인다.",
      stat:[{p:"life.stress", n:-1}, {p:"core.comprehension", n:-1}, {p:"core.health", n:1}] },
    { id:"BEACH-006", cat:"신체활동", grade:"일반", weight:3, gauge:8, anim:"run",
      text:"넓은 모래사장을 신나게 뛰어다닌다.",
      stat:[{p:"core.agility", n:1}, {p:"core.comprehension", n:-1}, {p:"core.health", n:1}] },
    { id:"BEACH-007", cat:"수집", grade:"일반", weight:3, gauge:5, anim:"pickup",
      text:"모래 위에서 불가사리를 발견하고 코로 콕 찔러본다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.health", n:1}] },
    { id:"BEACH-008", cat:"희귀/특수", grade:"일반", weight:3, gauge:6, anim:"dash",
      text:"게가 옆으로 도망가자 깜짝 놀란다.",
      stat:[{p:"core.aggression", n:1}, {p:"core.comprehension", n:-1}, {p:"core.health", n:1}] },
    { id:"BEACH-009", cat:"생리현상", grade:"일반", weight:3, gauge:5, anim:"rest",
      text:"따뜻한 백사장 위에서 스르르 낮잠에 빠진다.",
      stat:[{p:"life.stress", n:-1}, {p:"core.comprehension", n:-1}, {p:"core.health", n:1}] },
    { id:"BEACH-010", cat:"신체활동", grade:"일반", weight:3, gauge:8, anim:"splash", particle:"water",
      // 65번(16장): '물개' 물웅덩이 가중치 ×2 대상 — WALK-037 주석 참고.
      weightMult:function(){ return isAbilityOwned("sealPup") ? 2 : 1; },
      text:"밀려온 파도에 살짝 발을 적셔본다.",
      stat:[{p:"life.clean", n:-1}, {p:"core.comprehension", n:-1}, {p:"core.health", n:1}] },
    { id:"BEACH-011", cat:"사회", grade:"고급", weight:2, gauge:6, anim:"lookup",
      text:"파도를 타는 서퍼들을 신기하게 구경한다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.health", n:1}] },
    { id:"BEACH-012", cat:"환경 연동", grade:"고급", weight:2, gauge:5, anim:"lookup",
      text:"끼룩끼룩, 갈매기 울음소리에 고개를 든다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.health", n:1}] },
    { id:"BEACH-013", cat:"사회", grade:"고급", weight:2, gauge:6, anim:"social",
      text:"모래성 쌓는 아이들을 옆에서 지켜본다.",
      stat:[{p:"core.affinity", n:1}, {p:"core.comprehension", n:-1}, {p:"core.health", n:1}] },
    { id:"BEACH-014", cat:"후각/탐지", grade:"고급", weight:2, gauge:5, anim:"sniff",
      text:"짭짤한 바닷바람 냄새를 킁킁 맡는다.",
      stat:[{p:"core.comprehension", n:1}, {p:"core.health", n:1}] },
    { id:"BEACH-015", cat:"환경 연동", grade:"희귀", weight:1, gauge:5, anim:"rest",
      cond:function(){ return currentSeason() === "summer"; },
      text:"야자수 그늘 아래 산책로를 따라 걷는다.",
      stat:[{p:"life.stress", n:-1}, {p:"core.comprehension", n:-1}, {p:"core.health", n:1}] },
    { id:"BEACH-016", cat:"희귀/특수", grade:"희귀", weight:1, gauge:5, anim:"pickup", particle:"sparkle",
      text:"모래 속에 반쯤 묻힌 유리병 편지를 발견한다.",
      stat:[{p:"life.hunger", n:1}, {p:"life.clean", n:1}, {p:"life.bond", n:1}, {p:"life.stress", n:-1}, {p:"core.health", n:1}] },
    { id:"BEACH-017", cat:"환경 연동", grade:"희귀", weight:1, gauge:6, anim:"lookup", particle:"sparkle",
      cond:function(){ return timeBand() === "evening"; },
      text:"붉은 노을이 해변 전체를 물들인다.",
      stat:[{p:"life.bond", n:2}] },
    // 수집 아이템 '조개껍데기'은 아직 미등록(3~5번에서 등록 예정) — 이번엔 아이템 지급 없이 기본 효과만 반영
    // 59번(58번 3~5번, 신규 수집 아이템 반영): 조개껍데기 1개 획득 — BEACH-004와 같은 아이템, 두 이벤트
    // 모두에서 나오도록 엑셀 원본 그대로 반영(누적형이라 두 출처가 합쳐져도 문제 없음)
    { id:"BEACH-018", cat:"수집", grade:"희귀", weight:1, gauge:5, anim:"pickup", particle:"sparkle",
      text:"파도에 휩쓸려 온 반짝이는 조개껍데기를 발견한다.",
      stat:[], sideEffect:function(ctx){ grantWalkItem("조개껍데기", 1, ctx); } },
    { id:"BEACH-019", cat:"희귀/특수", grade:"전설", weight:0.4, gauge:6, anim:"lookup",
      cond:function(){ return timeBand() === "night"; },
      text:"저 멀리 등대에서 반짝이는 불빛을 바라본다.",
      stat:[{p:"life.bond", n:2}, {p:"life.stress", n:-1}] },
    { id:"BEACH-020", cat:"희귀/특수", grade:"전설", weight:0.4, gauge:6, anim:"lookup", particle:"sparkle",
      cond:function(){ return timeBand() === "night" && WEATHER_STATE.condition === "clear"; },
      text:"맑은 밤, 별빛이 해변 위로 쏟아지듯 빛난다.",
      stat:[{p:"life.hunger", n:1}, {p:"life.clean", n:1}, {p:"life.bond", n:2}, {p:"life.stress", n:-1}] }
  ];

  // 58번: 산책 장소 7곳 각각의 [지역 전용 이벤트 풀]과, "이 지역에서 공통 이벤트(WALK_EVENTS)가 뜰 확률(%)"
  // — 엑셀 지역 탭 맨 위 G2 셀 값을 그대로 옮김(사용자가 언제든 자유롭게 조정 가능하다고 명시한 값들).
  // 나머지 (100 - commonProb)%는 이 지역의 고유 이벤트 풀(events)에서 뽑힘. WALK_PLACES의 id와 반드시 일치.
  var WALK_REGIONS = {
    home:  { commonProb:30, events:HOME_EVENTS },
    park:  { commonProb:30, events:PARK_EVENTS },
    forest:{ commonProb:25, events:FOREST_EVENTS },
    mtn:   { commonProb:20, events:MTN_EVENTS },
    lake:  { commonProb:25, events:LAKE_EVENTS },
    city:  { commonProb:35, events:CITY_EVENTS },
    beach: { commonProb:25, events:BEACH_EVENTS }
  };

  // 32번: 조건을 만족하는 이벤트만 후보로 추려서, 엑셀의 발동확률(%) 값을 그대로 가중치 삼아 하나를 뽑음.
  // 조건형 이벤트(날씨/시간대/계절)는 조건이 안 맞으면 아예 후보에서 빠짐 — 등급별 확률은 이미
  // 엑셀 단계에서 이벤트 수로 나눠 반영되어 있어(메모 8번), 여기서 다시 등급 가중치를 두지 않음.
  // 58번: 이번 산책의 장소(session.place)가 있으면, 먼저 그 지역의 commonProb(%) 확률로 "공통 이벤트
  // (WALK_EVENTS, 55종)"와 "지역 전용 이벤트(그 지역의 20종)" 중 어느 풀에서 뽑을지부터 정함. 장소가
  // 없거나(이론상 발생 안 함, 안전장치) 등록된 지역이 아니면 기존처럼 공통 풀만 사용.
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
    // 70번(20장): 전환 즉시(점진적 전환 아님) 새 단계의 스케일·자세·색감이 반영되도록 화면을 다시
    // 그리고, 눈깜빡임/꼬리/숨쉬기 타이머도 새 timeMult로 재시작(setInterval 주기는 생성 시점 고정이라
    // 다시 만들어야 함) — 산책 중 전환되면 멈춰있던 마당 화면은 홈으로 돌아온 뒤 반영됨.
    if(state.pixelMode){ drawPixelScene(); startPixelAnimation(); }
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
  function syncWalkDogVisual(){
    var extra = el.dogWrap.className.replace("dog-wrap", "").trim();
    el.walkDogWrap.className = ("dog-wrap walk-dog-wrap " + extra).trim();
    if(el.walkDogTrack) el.walkDogTrack.classList.toggle("pixel-mode", !!state.pixelMode);
    // 71번: 배경·반려견 캔버스 모두 이제 CSS로 항상 .walk-scene 전체를 100% 채우므로(025번), 예전처럼
    // JS로 픽셀 크기를 직접 계산해 넣어줄 필요가 없어짐(32번 WALK_CANVAS_DISPLAY_W/H 로직 제거).
    drawWalkPovBackground();
    drawWalkPixelDog();
  }

  // 71번(산책 화면 실제 반영): 예전엔 이 함수가 반려견 스프라이트를 화면 좌우로 왕복시키는 DOM 트랜스폼
  // 루프였지만, 역POV(정면 접근) 개편으로 반려견이 더 이상 좌우로 걷지 않고 지평선에서 카메라 쪽으로
  // 다가왔다가 다시 멀어지는 루프를 도는 형태로 바뀌어(025-walk-pov-scene.js) 이 함수의 역할도
  // "매 프레임 배경·반려견 캔버스를 함께 다시 그리는 rAF 루프"로 완전히 바뀜. reduce-motion이면 애니메이션
  // 루프 없이 정지 프레임 한 장만 그림(완전히 빈 화면으로 두지 않기 위함).
  var walkAnimId = null, walkAnimLastTs = null;
  function startWalkAnim(){
    stopWalkAnim();
    resetWalkPovScene();
    if(reduceMotion()){
      drawWalkPovBackground();
      drawWalkPixelDog();
      return;
    }
    walkAnimLastTs = null;
    function frame(ts){
      if(walkAnimLastTs === null) walkAnimLastTs = ts;
      var dt = Math.min((ts - walkAnimLastTs) / 1000, 0.1);
      walkAnimLastTs = ts;
      updateWalkPovScene(dt);
      drawWalkPovBackground();
      drawWalkPixelDog();
      walkAnimId = window.requestAnimationFrame(frame);
    }
    walkAnimId = window.requestAnimationFrame(frame);
  }
  function stopWalkAnim(){
    if(walkAnimId){ window.cancelAnimationFrame(walkAnimId); walkAnimId = null; }
  }

  // 34번(산책 UX 개편, 기획문서 7장 항목2 "이벤트별 반려견 애니메이션"): 이벤트를 유형별로 그룹핑해
  // 짧은(1~1.5초) 포즈 모션을 재생. 위 startWalkAnim()의 좌우 왕복 애니메이션은 매 프레임 el.walkDogWrap/
  // el.walkPixelCanvas의 style.transform을 직접 덮어써서 계속 돌아가므로, 이 포즈 애니메이션은 그 두
  // 요소를 건드리지 않고 "안쪽" 요소(CSS 강아지는 #walkDogEl, 픽셀모드는 캔버스를 감싼 새 래퍼
  // #walkPixelPoseWrap)에만 CSS 클래스로 짧게 걸었다가 뗌 — 진행 중인 좌우 이동 애니메이션과 절대
  // 충돌하지 않음(#walkDogEl은 원래도 걷기 루프가 손대지 않는 요소). 같은 클래스명을 두 요소 모두에
  // 걸어두면(둘 중 pixel-mode에 따라 하나만 화면에 보임) 픽셀/일반 모드 양쪽에서 동일하게 동작함.
  var WALK_POSE_DURATION = 1500;
  var walkPoseTimer = null;
  var walkPoseClass = null;
  function clearWalkPose(){
    window.clearTimeout(walkPoseTimer);
    walkPoseTimer = null;
    if(walkPoseClass){
      [el.walkDogEl, el.walkPixelPoseWrap].forEach(function(t){
        if(t) t.classList.remove(walkPoseClass);
      });
      walkPoseClass = null;
    }
  }
  // 70번(20장, 산책 애니메이션 확충): anim/particle 자체는 34번부터 이미 이벤트 데이터(WALK_EVENTS 등
  // "애니메이션"/"입자효과" 컬럼)와 CSS 트랜스폼 애니메이션(styles.css .walk-pose-*)으로 연결돼 있어
  // 사용자가 요청한 9종 포즈+3종 입자효과는 이미 실제로 재생되고 있음(완료 보고에서 확인) — 이번에
  // 추가한 건 성장 단계별 timeMult를 "--pose-speed" CSS 변수로 실어 보내, 같은 포즈라도 성장 단계에
  // 따라 재생 속도(애니메이션 지속시간 자체)가 달라지도록 한 것뿐.
  function playWalkPose(anim, particle){
    clearWalkPose();
    if(anim && !reduceMotion()){
      var cls = "walk-pose-" + anim;
      var speed = growthVisual().timeMult;
      [el.walkDogEl, el.walkPixelPoseWrap].forEach(function(t){
        if(t){ t.style.setProperty("--pose-speed", speed); t.classList.add(cls); }
      });
      walkPoseClass = cls;
      walkPoseTimer = window.setTimeout(clearWalkPose, WALK_POSE_DURATION * speed);
    }
    if(particle) spawnWalkParticles(particle);
  }

  // 기획문서 7장 원안의 "냄새를 파헤칠 때 흙먼지가 튄다" 같은 연출을 위한 작은 입자 효과.
  // el.walkDogTrack에 붙여서(이미 좌우 이동 애니메이션으로 왼쪽 offset이 계산돼 있는 요소) 별도 좌표
  // 계산 없이 현재 반려견 위치 근처에 뿌려지도록 함.
  var WALK_PARTICLE_COLORS = { dust:"#C9A66B", water:"#8FC4E0", sparkle:"#F2D06B" };
  function spawnWalkParticles(kind){
    if(reduceMotion() || !el.walkDogTrack) return;
    var color = WALK_PARTICLE_COLORS[kind] || "#FFFFFF";
    // 71번: 반려견이 더 이상 화면 좌측에서 우측으로 걷는 작은 스프라이트가 아니라(역POV 개편, 025번),
    // 항상 화면 가로 중앙 부근에서 원근에 따라 커지며 다가오므로, 입자도 트랙 전체 폭 기준 중앙 부근에서 뿌림.
    var trackW = el.walkDogTrack.clientWidth || 260;
    for(var n=0; n<5; n++){
      var p = document.createElement("div");
      p.className = "walk-particle";
      var size = kind === "sparkle" ? 5 : 7;
      p.style.width = size + "px"; p.style.height = size + "px";
      p.style.background = color;
      p.style.left = (trackW*0.36 + Math.random()*trackW*0.28) + "px";
      p.style.bottom = (10 + Math.random()*24) + "px";
      p.style.animation = "walkParticleFloat " + (0.7 + Math.random()*0.4) + "s ease-out forwards";
      p.style.animationDelay = (Math.random()*0.2) + "s";
      el.walkDogTrack.appendChild(p);
      (function(elp){ window.setTimeout(function(){ elp.remove(); }, 1300); })(p);
    }
  }

  function scheduleNextWalkEvent(){
    window.clearTimeout(walkEventTimer);
    var session = state.walk.session;
    if(!session) return;
    if(session.stamina <= 0){ finishWalk(); return; }
    var delay = walkEventDelaySeconds() * 1000;
    walkEventTimer = window.setTimeout(triggerWalkEvent, delay);
  }

  // 34번(산책 UX 개편, 기획문서 7장): 이전엔 타이머가 이벤트를 "예고"만 하고, 사용자가 "다음으로"를
  // 눌러야 실제로 적용됐음(pendingEvent 단계). 48종이 전부 선택지 없는 단일 진행형으로 통일된 이후
  // 이 확인 클릭은 사실상 형식적인 한 단계 더 남은 관문이었던 것으로 판단해, 타이머가 울리는 순간
  // 바로 결과를 적용하고 카드(문구+포즈+칩)를 보여주도록 단순화함 — 기획 문서의 "다이어리 한 페이지를
  // 넘기는 듯한" 표현처럼, 페이지가 저절로 넘어가는 느낌을 의도. "산책 그만하고 돌아가기"는 이 흐름과
  // 무관하게 언제든 그대로 클릭 가능(el.walkReturnBtn은 세션이 있는 한 항상 활성 — 아래 finishWalk 참고).
  function triggerWalkEvent(){
    var session = state.walk.session;
    if(!session) return;
    var ev = pickWalkEvent();
    if(!ev){ scheduleNextWalkEvent(); return; }
    resolveWalkEvent(ev);
  }

  // 32번: 선택형(choice) 이벤트는 48종 개편 이후 쓰이지 않지만, 추후 다시 넣을 가능성을 위해 함수는
  // 남겨둠 — 단, 34번에서 pendingEvent 단계 자체가 없어졌으므로 이 함수는 당분간 완전히 죽은 코드이고,
  // 되살릴 경우 이 함수를 부르는 화면(카드 UI)도 함께 새로 설계해야 함.
  function resolveWalkChoice(choice){
    var session = state.walk.session;
    if(!session || !session.pendingEvent) return;
    session.stamina = clamp(session.stamina - (choice.cost||0), 0, 100);
    var ctx = { state:state, session:session, itemChips:[] };
    (choice.effects||[]).forEach(function(eff){
      if(Math.random() <= eff.chance){ eff.apply(ctx); }
    });
    session.pendingEvent = null;
    saveState();
    renderWalkVeil();
    scheduleNextWalkEvent();
  }

  // 38번(엑셀 왕복 편집 v2, "대성공/대실패" 요청): ev.judge={ability}가 붙은 이벤트의 성공 확률(%)을
  // 계산. 기준은 "영향능력의 현재 스탯 값 = 성공 확률"(스탯이 50에서 벗어난 만큼 기준 50%에 1:1로
  // 가감하는 것과 동일한 결과) — 여기에 이해력 1%+수행력 1%+충성도 2%를 합산해 맨 마지막 보정으로
  // 더함(요청하신 계산식 그대로). 0~100% 범위로 클램프.
  function judgeSuccessChance(judge){
    var base = state.core[judge.ability];
    if(typeof base !== "number") base = 50;
    var correction = state.core.comprehension * 0.01 + state.core.execution * 0.01 + state.core.loyalty * 0.02;
    return clamp(base + correction, 0, 100);
  }

  // 38번: 대성공/대실패 판정 — 최종 확률이 85% 이상으로 기운 쪽(성공 또는 실패)으로 실제 결과가
  // 나왔을 때만 "대성공/대실패 후보"가 되고, 거기서 다시 10%를 뽑아야 실제로 대성공/대실패가 됨
  // (요청하신 "85% 이상 + 그 방향대로 결정 + 10% 확률" 조건을 그대로 두 단계로 구현).
  function judgeOutcome(judge){
    var successPct = judgeSuccessChance(judge);
    var success = (Math.random() * 100) < successPct;
    var dominantPct = success ? successPct : (100 - successPct);
    var critical = dominantPct >= 85 && Math.random() < 0.10;
    return { success:success, critical:critical, successPct:successPct };
  }

  // 대성공/대실패 전용 강조 팝업(요청사항) — 36/37번에서 만든 공용 설명 팝업(showDescPopup)을 재사용.
  var CRIT_SUCCESS_FLAVOR = { title:"🌟 대성공!", desc:"평소보다 훨씬 잘 해냈어요! 이번 이벤트의 효과를 2배로 얻었어요." };
  var CRIT_FAIL_FLAVOR = { title:"💥 대실패!", desc:"이번엔 완전히 꼬여버렸어요... 평소와 정반대의 결과가 2배로 나타났어요." };

  // 32번: 이벤트의 수치효과(stat/statFn)는 여기서 바로 state에 반영하지 않고 session.deltaLedger에
  // 쌓아두기만 함 — 실제 반영과 보상배율 적용은 finishWalk()에서 한꺼번에 이뤄짐.
  // 수집/친구목록/도감기록 같은 sideEffect는 배율과 무관한 즉시효과라 여기서 바로 실행.
  // 34번: ctx.itemChips — sideEffect 안에서 grantWalkItem/grantDexRecord/walkFriendSideEffect가
  // 채워주는 "이번 이벤트로 무엇을 얻었는지" 라벨 목록. 스탯 변화(appliedDeltas)와 함께 이벤트 카드에
  // 칩으로 즉시 노출하고, session.itemChips에도 누적해 산책 종료 리포트에서 다시 보여줌.
  // (주의: 카드에 보이는 스탯 칩은 "이 이벤트가 유발한 원본 변화량"이고, 실제로 상태에 반영되는 최종
  //  수치는 finishWalk()에서 보상배율이 적용된 뒤 정해짐 — 32번에서 확립된 "숫자 비공개" 원칙과 다르게
  //  이번 UX 개편은 기획팀 확정 프로토타입을 그대로 반영한 것이라 의도적으로 숫자를 노출함. 최종 결과의
  //  "정답" 수치는 종료 리포트 쪽에 보여줌.)
  // 38번: ev.judge가 있는 이벤트는 여기서 먼저 성공/실패(+대성공/대실패)를 정하고, 그 결과에 따라
  // stat/statFn의 배율(mult)과 sideEffect 실행 여부를 결정한 뒤에만 아래 기존 로직을 그대로 태움 —
  // judge가 없는 기존 이벤트는 이전과 완전히 동일하게 동작함(mult=1, sideEffect 항상 실행).
  function resolveWalkEvent(ev){
    var session = state.walk.session;
    if(!session) return;
    session.stamina = clamp(session.stamina - (ev.gauge||0), 0, 100);
    var ctx = { state:state, session:session, itemChips:[] };

    // 59번(58번 3~5번, 주인 개입 시스템 신규): [주인 개입여부]="개입함"인 이벤트는 여기서 자동 진행을
    // 멈추고 팝업으로 O/X·선택지를 물어봄 — 유저가 고르면 showWalkIntervenePopup 안의 콜백이
    // finishWalkEventResolution()을 직접 불러 나머지(정산·로그·다음 이벤트 예약)를 이어감.
    // 산책체력 소모는 위에서 이미 처리됐으므로 개입 여부와 무관하게 동일하게 적용됨(엑셀 [소모체력] 그대로).
    if(ev.intervene){
      showWalkIntervenePopup(ev, session, ctx);
      return;
    }

    var outcome = null, mult = 1, runSideEffect = true, displayText = ev.text;
    if(ev.judge){
      outcome = judgeOutcome(ev.judge);
      if(outcome.success){
        mult = outcome.critical ? 2 : 1;
        runSideEffect = true;
        displayText = outcome.critical ? (CRIT_SUCCESS_FLAVOR.title + " " + ev.text) : ev.text;
      } else {
        // 실패 시 기본값: 효과 없음(부수효과도 없음). 대실패는 "성공했다면 얻었을 효과의 정반대를
        // 2배로" — 신규 추가 판단(오픈 이슈로 계획 문서에 기록, 실패 시 메모 칸으로 이벤트별 조정 가능).
        mult = outcome.critical ? -2 : 0;
        runSideEffect = false;
        displayText = outcome.critical ? (CRIT_FAIL_FLAVOR.title + " " + ev.text) : (ev.text + " …하지만 잘 되지 않았어요.");
      }
    }

    var deltas = ev.statFn ? ev.statFn(ctx) : (ev.stat || []);
    finishWalkEventResolution(ev, session, ctx, deltas, mult, runSideEffect ? ev.sideEffect : null, displayText, outcome);
  }

  // 59번: resolveWalkEvent()의 "정산·로그·카드 추가·다음 이벤트 예약" 공통 꼬리 부분을 분리 — 일반
  // 이벤트는 resolveWalkEvent()가 바로 이어서 호출하고, 개입형 이벤트는 유저가 선택지를 고른 뒤
  // showWalkIntervenePopup()의 콜백이 대신 호출함(그래서 deltas·sideEffectFn을 인자로 받음 — 선택한
  // 옵션의 효과가 ev.stat/ev.statFn/ev.sideEffect 대신 쓰임, 예: PARK-003 "함께 논다" 선택 시에만
  // 친구목록 등록이 일어나고 다른 선택지에선 안 일어남).
  function finishWalkEventResolution(ev, session, ctx, deltas, mult, sideEffectFn, displayText, outcome){
    var appliedDeltas = [];
    if(mult !== 0){
      deltas.forEach(function(d){
        if(d.chance !== undefined && Math.random() > d.chance) return;
        var amount = d.n * mult;
        // 65번(16장): 미라클멍잉/올빼미독 — session.walkTimeMod(+1/-1/0, 산책 시작 시각 기준 고정값)를
        // 이벤트별 원본 델타에 "부호는 유지한 채 크기만" 가감. 상승효과(양수)는 그대로 +walkTimeMod,
        // 하락효과(음수)는 -walkTimeMod를 더해(이미 음수인 값이 더 나빠지거나 덜 나빠지거나) 엑셀의
        // "상승효과 +1/하락효과 -1(강화)" 또는 그 반대(약화) 어느 쪽이든 정확히 재현. 이 가감은 다른
        // 이벤트와 마찬가지로 이후 finishWalk()의 보상배율(pct)·지역능력·에너지티어 배율을 그대로
        // 통과하므로 최종 반영치는 정확히 ±1이 아닐 수 있음 — 엑셀에 명시되지 않은 적용 순서라 개발팀이
        // 판단한 지점(오픈 이슈).
        if(session.walkTimeMod && amount !== 0){
          amount += (amount > 0 ? session.walkTimeMod : -session.walkTimeMod);
        }
        session.deltaLedger.push({ path:d.p, amount:amount });
        appliedDeltas.push({ p:d.p, n:amount });
      });
    }
    if(sideEffectFn) sideEffectFn(ctx);
    session.log.push(displayText);
    session.eventCount = (session.eventCount||0) + 1;
    session.lastEvent = { text:displayText, statChips:appliedDeltas, itemChips:ctx.itemChips.slice(), anim:ev.anim||null, particle:ev.particle||null };
    // 42번: 이번 카드를 삭제되는 "지금 카드"가 아니라 누적 기록에 추가 — 화면에는 이 배열 전체가
    // 스크롤 목록으로 쌓여서 보임(renderWalkVeil의 renderWalkLog 참고).
    (session.cards || (session.cards = [])).push(session.lastEvent);
    ctx.itemChips.forEach(function(label){ session.itemChips.push(label); });
    saveState();
    renderWalkVeil();
    playWalkPose(ev.anim, ev.particle);
    if(outcome && outcome.critical){
      var flavor = outcome.success ? CRIT_SUCCESS_FLAVOR : CRIT_FAIL_FLAVOR;
      showDescPopup(flavor.title, flavor.desc);
    }
    scheduleNextWalkEvent();
  }

  // 59번(58번 3~5번, 주인 개입 시스템 신규): ev.intervene = { type:"ox"|"choice", options:[{label, stat}] }
  // 형태 — O/X형은 옵션 2개, 선택형은 옵션 3개(엑셀 [개입방식]/[개입형태별 결과] 그대로 옮김). 버튼을
  // 눌러 하나를 고르면 그 옵션의 stat만 적용되고(다른 옵션은 완전히 무시), 나머지 정산은 일반 이벤트와
  // 동일한 finishWalkEventResolution()을 그대로 재사용 — 개입형 이벤트도 대성공/대실패 판정 대상은
  // 아님(엑셀 [판정유형]이 전부 "해당없음"이라 outcome=null로 넘김).
  function showWalkIntervenePopup(ev, session, ctx){
    var iv = ev.intervene;
    el.walkIntervenePopupText.textContent = ev.text;
    var host = el.walkIntervenePopupBtns;
    host.innerHTML = "";
    iv.options.forEach(function(opt){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "intervene-btn";
      btn.textContent = opt.label;
      btn.addEventListener("click", function(){
        el.walkIntervenePopup.hidden = true;
        var displayText = ev.text + " → " + opt.label;
        finishWalkEventResolution(ev, session, ctx, opt.stat || [], 1, opt.sideEffect || null, displayText, null);
      });
      host.appendChild(btn);
    });
    el.walkIntervenePopup.hidden = false;
  }

  // 유저가 직접 "그만하고 돌아가기"를 눌렀을 때, 혹은 산책체력이 다 떨어졌을 때 호출
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
  var TALK_BUTTON_CHARGE_MAX = 5;
  // 61번: 이 비율(remaining stamina 기준 100%-70%=30 이하) 이상 소모하고 돌아온 산책마다 충전 1회.
  var TALK_BUTTON_CHARGE_MIN_CONSUMED_PCT = 0.70;
  // 46번: 45번의 "앱이 켜진 채 30초마다 무조건" 고정 인터벌에서 "화면 조작이 30초간 없을 때"
  // 진짜 유휴 감지로 변경 — 이름도 AUTO_INTERVAL(고정 반복)에서 IDLE_MS(유휴 판정 기준 시간)로 바꿈.
  var TALK_BUTTON_IDLE_MS = 30000;
  // 52번: 한 번 표현할 때 조합하는 버튼 개수 — 45번에선 고정 2개였는데, 실플레이 피드백으로
  // "버튼을 몇 개나 가졌든 상관없이 늘 2개만 조합하더라"는 지적을 받아 임시보호 일차 구간별 가변
  // 범위로 교체. 각 구간 안에서 실제 개수는 균등 확률로 뽑힘(사용자 지정 그대로). 마지막 구간(26일~)의
  // 최대값은 고정 숫자가 아니라 "그 시점에 실제로 보유한 소통버튼 개수 전부"를 뜻해서 max:null로
  // 표시해두고 talkWordCountRange()에서 실제 보유 개수로 치환함.
  var TALK_WORD_COUNT_TIERS = [
    { untilDay:5,  min:2, max:2 },
    { untilDay:10, min:2, max:4 },
    { untilDay:15, min:3, max:5 },
    { untilDay:25, min:3, max:6 },
    { untilDay:Infinity, min:3, max:null }
  ];
  // 그 시점의 일차(state.fosterDay)에 맞는 {min,max} 범위를 계산 — '수다쟁이'(52번 신규 능력)를
  // 보유했으면 최소값이 그 구간 최소값에서 +1(엑셀 원안 그대로). 어느 쪽이든 실제 보유 버튼 개수보다
  // 많은 개수를 조합할 수는 없으므로 항상 그 값으로 클램프.
  function talkWordCountRange(){
    var day = state.fosterDay || 1;
    var tier = TALK_WORD_COUNT_TIERS[TALK_WORD_COUNT_TIERS.length - 1];
    for(var i=0;i<TALK_WORD_COUNT_TIERS.length;i++){
      if(day <= TALK_WORD_COUNT_TIERS[i].untilDay){ tier = TALK_WORD_COUNT_TIERS[i]; break; }
    }
    var ownedCount = (state.talkButton.owned || []).length;
    var min = tier.min;
    var max = (tier.max === null) ? ownedCount : tier.max;
    // 수다쟁이: 최소값 +1 — 그 결과 최소값이 원래 최대값을 넘어서면 최대값도 함께 끌어올림
    // (그렇지 않으면 아래 min<=max 보정 단계에서 보너스가 도로 상쇄돼버림).
    if(isAbilityOwned("chatterbox")){ min += 1; if(max < min){ max = min; } }
    max = Math.min(max, ownedCount);
    min = Math.min(min, max);
    min = Math.max(min, 1);
    return { min:min, max:max };
  }

  // 52번: "임시보호가 진행될수록 반려견이 말이 되는 조합을 낼 확률이 올라간다"는 요청 반영.
  // 정말로 문맥을 이해하는 언어모델을 붙이는 건 이 프로젝트 범위를 넘어서므로(개발팀 판단, 아래
  // 추가제안안 참고), 사람이 미리 다듬어둔 "그럴듯한 조합" 사전(TALK_MEANINGFUL_TEMPLATES)을 두고,
  // 그날의 확률에 당첨되면 이번에 뽑을 개수와 정확히 길이가 같고 지금 보유한 버튼으로만 이뤄진
  // 템플릿 중 하나를 무작위로 골라 쓰는 방식으로 구현. 당첨이 안 되거나(꽝) 그 길이·보유 조합에 맞는
  // 템플릿이 아직 없으면(예: 26일 이후 구간처럼 조합 개수가 템플릿 최대 길이(6)를 넘어가는 경우)
  // 예전과 같은 완전 무작위 방식으로 자연스럽게 대체됨 — 템플릿은 2~6개 조합까지만 준비했고, 더
  // 긴 조합은 이번 라운드에서 커버하지 못함(추가제안안에 기록).
  var TALK_MEANINGFUL_TEMPLATES = [
    // 2개
    ["owner","like"], ["owner","best"], ["owner","pretty"], ["owner","silly"], ["owner","bad"],
    ["food","doit"], ["food","like"], ["food","dontwant"],
    ["walk","doit"], ["walk","like"], ["walk","dontwant"],
    // 3개
    ["owner","food","doit"], ["owner","walk","doit"], ["owner","pretty","like"],
    ["walk","best","like"], ["food","best","like"], ["walk","dontwant","bad"],
    ["pooped","owner","doit"],
    // 4개
    ["owner","food","doit","best"], ["walk","like","owner","best"], ["food","pooped","owner","doit"],
    // 5개
    ["owner","walk","doit","like","best"], ["food","like","owner","pretty","best"],
    // 6개
    ["owner","walk","doit","food","like","best"]
  ];
  function meaningfulComboChance(){
    var day = state.fosterDay || 1;
    if(day <= 10) return 0.30;
    if(day <= 20) return 0.50;
    return 0.70;
  }
  function pickMeaningfulCombo(count, owned){
    var candidates = TALK_MEANINGFUL_TEMPLATES.filter(function(t){
      return t.length === count && t.every(function(id){ return owned.indexOf(id) !== -1; });
    });
    if(!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)].slice();
  }

  // 46번: 한글 받침 유무에 따른 "이/가" 조사 선택 — "말티즈가 할 말이..." vs "봄이가 할 말이...".
  // 유니코드 완성형 한글 코드포인트 범위(가=0xAC00 ~ 힣=0xD7A3)에서 (코드 - 0xAC00) % 28이
  // 0이면 받침 없음("가"), 아니면 받침 있음("이"). 이름 마지막 글자가 한글이 아니면 기본값 "가".
  function josaIGa(word){
    if(!word) return "가";
    var last = word.charCodeAt(word.length - 1);
    if(last >= 0xAC00 && last <= 0xD7A3){
      return ((last - 0xAC00) % 28 === 0) ? "가" : "이";
    }
    return "가";
  }

  // 45번: 이 세션에 열려있는 다른 veil/설명팝업이 있으면 자동 트리거를 건너뜀(수동 클릭은 애초에
  // 홈 화면이 보일 때만 가능하니 이 체크가 필요 없음) — 산책 중이거나 다른 화면을 보는 도중에
  // 불쑥 소통버튼 팝업이 끼어들어 겹치는 것을 막기 위함.
  // 46번: 유휴 확인 팝업(talkIdlePopup) 자체도 하나의 겹침 대상이므로 함께 체크.
  function isAnyVeilOpen(){
    if(document.querySelector(".veil.show")) return true;
    if(el.descPopup && !el.descPopup.hidden) return true;
    if(el.talkIdlePopup && !el.talkIdlePopup.hidden) return true;
    if(el.walkIntervenePopup && !el.walkIntervenePopup.hidden) return true;
    return false;
  }
  // 61번: 충전식으로 바뀌면서 "하루가 지나면 리셋"할 대상이 없어져 syncTalkButtonDay()는 제거됨
  // (충전은 산책 결과로만 늘고, 날짜가 바뀐다고 되돌아가지 않음).
  function renderTalkWidget(){
    if(!el.talkWidgetBtn) return;
    var charges = state.talkButton.charges || 0;
    el.talkWidgetCount.textContent = charges + "/" + TALK_BUTTON_CHARGE_MAX;
    el.talkWidgetBtn.disabled = charges <= 0;
  }
  function renderTalkGrid(){
    var host = el.talkBtnGrid;
    if(!host) return;
    host.innerHTML = "";
    (state.talkButton.owned || []).forEach(function(id){
      var def = findTalkButtonDef(id);
      if(!def) return;
      var item = document.createElement("div");
      item.className = "talk-btn-item";
      item.setAttribute("data-talk-id", id);
      var icon = document.createElement("span");
      icon.className = "talk-btn-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = def.icon;
      var label = document.createElement("span");
      label.className = "talk-btn-label";
      label.textContent = def.label;
      var paw = document.createElement("span");
      paw.className = "talk-paw";
      paw.setAttribute("aria-hidden", "true");
      paw.textContent = "🐾";
      item.appendChild(icon);
      item.appendChild(label);
      item.appendChild(paw);
      host.appendChild(item);
    });
  }
  // 45번: 반려견 발이 보유 버튼 중 몇 개를 무작위 순서로 차례차례 "누르는" 연출 — 누른 버튼은
  // 잠깐 튀어오르는 애니메이션(.pressed)이 붙고, 그 글자가 하단 말풍선에 하나씩 이어붙어 표시됨.
  // 52번: 개수는 talkWordCountRange()(임시보호 일차별 티어 + 수다쟁이 보너스)로 정해지고,
  // meaningfulComboChance()에 당첨되면 TALK_MEANINGFUL_TEMPLATES에서 문맥상 유의미한 조합을
  // 우선 시도한 뒤(해당 개수·보유버튼 조건에 맞는 템플릿이 없으면) 기존 완전 무작위 방식으로 대체.
  function playTalkSequence(){
    var owned = (state.talkButton.owned || []).slice();
    if(!owned.length) return;
    var range = talkWordCountRange();
    var count = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
    count = Math.min(count, owned.length);
    var picks = null;
    if(Math.random() < meaningfulComboChance()){
      picks = pickMeaningfulCombo(count, owned);
    }
    if(!picks){
      var pool = owned.slice();
      picks = [];
      for(var i=0;i<count;i++){
        var idx = Math.floor(Math.random() * pool.length);
        picks.push(pool.splice(idx, 1)[0]);
      }
    }
    el.talkSaidBox.hidden = true;
    el.talkSaidWords.textContent = "";
    var said = [];
    picks.forEach(function(id, i){
      window.setTimeout(function(){
        var itemEl = el.talkBtnGrid.querySelector('[data-talk-id="' + id + '"]');
        if(itemEl){
          itemEl.classList.add("pressed");
          window.setTimeout(function(){ itemEl.classList.remove("pressed"); }, 650);
        }
        var def = findTalkButtonDef(id);
        said.push(def ? def.label : "");
        el.talkSaidBox.hidden = false;
        el.talkSaidWords.textContent = said.join(" ");
      }, i * 700);
    });
  }
  // 46번: 소통버튼 팝업을 실제로 여는 공용 코어 — 61번의 charges는 건드리지 않음(차감/조건 확인은
  // 호출부인 openTalkVeil()이 미리 처리). 수동 클릭 경로(openTalkVeil)와 유휴-호응 경로
  // (openTalkIdlePrompt의 "호응해준다") 양쪽에서 이 함수를 호출하되, 상단 힌트 문구만 경로에 맞게 다르게 넣어줌.
  function playTalkPopup(hintText){
    el.talkUsedHint.textContent = hintText;
    renderTalkGrid();
    openVeil(el.talkVeil);
    playTalkSequence();
    renderTalkWidget();
    saveState();
  }
  // 위젯을 유저가 직접 눌러서 여는 수동 경로 — 61번부터 충전식(state.talkButton.charges, 최대
  // TALK_BUTTON_CHARGE_MAX)이 여기에만 적용됨. 충전이 0이면 열리지 않고, 열 때마다 1회 소모.
  function openTalkVeil(){
    var charges = state.talkButton.charges || 0;
    if(charges <= 0){
      showMessage("지금은 모아둔 소통버튼이 없어요. 산책을 다녀오면 충전돼요.");
      return;
    }
    state.talkButton.charges = charges - 1;
    playTalkPopup("소통버튼을 사용했어요 · 남은 횟수 " + state.talkButton.charges + "/" + TALK_BUTTON_CHARGE_MAX);
  }
  // 46번: 화면 조작이 TALK_BUTTON_IDLE_MS만큼 없었을 때(진짜 유휴 상태) 뜨는 확인 팝업 —
  // 61번 충전식과 완전히 무관하며(사용자 지시로 그대로 유지), [호응해준다]를 눌러야만 실제로 소통버튼 팝업이 열림.
  // 73번: 이 팝업이 노출된 뒤 TALK_BUTTON_IDLE_AUTO_DISMISS_MS(4초) 동안 [호응해준다]/[무시한다] 중
  // 아무것도 누르지 않으면 자동으로 닫히고, 그 "무응답" 경로에서만 유대감-1·스트레스+1 페널티가 적용됨
  // (사용자 명시 요청 — [무시한다]를 직접 누른 경우의 유대감-2, 022번과는 별개의 수치·경로).
  var TALK_BUTTON_IDLE_AUTO_DISMISS_MS = 4000;
  var talkIdleAutoDismissTimer = null;
  function openTalkIdlePrompt(){
    if(!el.talkIdlePopup) return;
    el.talkIdlePopupText.textContent = state.name + josaIGa(state.name) + " 할 말이 있는 것 같은데?";
    el.talkIdlePopup.hidden = false;
    talkIdleAutoDismissTimer = window.setTimeout(function(){
      talkIdleAutoDismissTimer = null;
      closeTalkIdlePrompt();
      bumpLifeBond(-1);
      state.life.stress = clamp(state.life.stress + 1, 0, 100);
      // 76번(22장): '삐짐'의 취득 조건 — 소통버튼 유휴 확인 팝업에 5회 "연속" 무응답(자동 닫힘) 시
      // 확정 발생. [호응해준다]/[무시한다] 중 하나를 눌러 응답하면(022번) 이 스트릭이 즉시 리셋됨.
      state.abilityCounters.talkIdleNoResponseStreak = (state.abilityCounters.talkIdleNoResponseStreak || 0) + 1;
      state.abilityCounters.talkIdleResponseStreak = 0;
      if(state.abilityCounters.talkIdleNoResponseStreak >= 5 && !isAbilityOwned("sulking")){
        catalogGrant("sulking");
        showMessage(state.name + josaIGa(state.name) + " 삐졌어요...");
      }
      render();
      saveState();
    }, TALK_BUTTON_IDLE_AUTO_DISMISS_MS);
  }
  // closeTalkIdlePrompt()는 [호응해준다]/[무시한다] 클릭(022번)과 위 자동 닫힘 타이머 양쪽에서 공통으로
  // 호출되는 유일한 경로라, 여기서 타이머를 함께 정리해두면 사용자가 4초 안에 직접 응답했을 때 자동
  // 닫힘 로직(과 그 페널티)이 뒤늦게 중복 발동하는 일이 없음.
  function closeTalkIdlePrompt(){
    if(talkIdleAutoDismissTimer){ window.clearTimeout(talkIdleAutoDismissTimer); talkIdleAutoDismissTimer = null; }
    if(el.talkIdlePopup) el.talkIdlePopup.hidden = true;
  }
  // 69번: 45번 확정이던 "테스트 기간 무료"를 폐기하고 뼈다귀 유상 구매로 전환 — 상점이 [일반]/[소통버튼]
  // 2개 탭으로 나뉘면서 함께 반영됨. 가격은 이름 붙은 상수로 분리해 조정 가능하게 함.
  var TALK_BUTTON_SHOP_PRICE = 10;
  // 45번: 상점의 소통버튼 신규 7종, 이미 보유했으면 "보유중"으로 비활성화 — 69번부터 미보유 항목은
  // 가격(뼈다귀 개수)을 보여주고, 뼈다귀가 모자라면 버튼 자체를 비활성화.
  function renderTalkShop(){
    var host = el.talkShopGrid;
    if(!host) return;
    host.innerHTML = "";
    TALK_BUTTON_CATALOG.filter(function(def){ return !def.base; }).forEach(function(def){
      var owned = (state.talkButton.owned || []).indexOf(def.id) !== -1;
      var item = document.createElement("div");
      item.className = "shop-item";
      var name = document.createElement("span");
      name.className = "name";
      name.textContent = def.icon + " " + def.label;
      var desc = document.createElement("span");
      desc.className = "desc";
      desc.textContent = "소통버튼에 \"" + def.label + "\" 추가";
      var btn = document.createElement("button");
      if(owned){
        btn.textContent = "보유중";
        btn.disabled = true;
      } else {
        btn.appendChild(document.createTextNode(TALK_BUTTON_SHOP_PRICE + " "));
        var coinDot = document.createElement("span");
        coinDot.className = "coin-dot";
        coinDot.style.width = "10px";
        coinDot.style.height = "10px";
        btn.appendChild(coinDot);
        btn.disabled = state.coins < TALK_BUTTON_SHOP_PRICE;
        btn.addEventListener("click", function(){ buyTalkButton(def.id); });
      }
      item.appendChild(name);
      item.appendChild(desc);
      item.appendChild(btn);
      host.appendChild(item);
    });
  }
  function buyTalkButton(id){
    if((state.talkButton.owned || []).indexOf(id) !== -1){
      showMessage("이미 가지고 있는 소통버튼이에요.");
      return;
    }
    if(state.coins < TALK_BUTTON_SHOP_PRICE){
      showMessage(pick(FLAVOR.poor));
      return;
    }
    state.coins -= TALK_BUTTON_SHOP_PRICE;
    state.talkButton.owned.push(id);
    var def = findTalkButtonDef(id);
    showMessage("새 소통버튼 \"" + (def ? def.label : "") + "\"을(를) 배웠어요!");
    renderTalkShop();
    renderTalkWidget();
    saveRenderPulse();
  }

  // 48번(기획문서 12장): 30일 임시보호 종료 엔딩씬. "달성/미달성" 판정 로직은 문서에도 "추후 구현
  // 예정"으로 명시돼 있어(오픈 이슈), 프로토타입 그대로 무작위로 결정 — 찹찹츄(노년기)로 완주했으면
  // 3택1(미달성/달성/이별), 그 외 단계는 2택1(미달성/달성). "실제 눌렀던 소통버튼 이력 기반 자동 생성"은
  // 11장 오픈 이슈와 동일하게 아직 미구현.
  // 51번: 편지 문구를 "...으로 끝나는 문장"에서 "산책", "좋아", "사랑해"처럼 짧은 낱말을 늘어놓는 형태로
  // 재구성 — 반려견이 그동안 배운 소통버튼 단어들을 직접 하나씩 남기고 간 느낌을 내려는 의도(문장을
  // 완성해서 "말하는" 게 아니라 아는 단어를 흩뿌려두는 쪽이 이 캐릭터성에 더 맞다고 판단). words 배열의
  // 각 항목이 openEndingLetter()에서 크레파스 색·기울기가 다른 낱말 하나씩으로 그려짐.
  var ENDING_LETTERS = {
    fail: {
      title: "소통편지",
      words: ["주인", "사랑해", "산책", "좋아", "밥", "고마워", "안녕"],
      note: "※ 실제 구현 시에는 그동안 눌렀던 소통버튼 이력으로 자동 생성됩니다(지금은 예시 낱말)."
    },
    farewell: {
      title: "마지막 편지",
      words: ["주인", "고마워", "산책", "좋아", "사랑해", "안녕", "안녕"],
      note: "※ 찹찹츄(노년기) 전용 이별 편지 예시입니다. 무지개다리·무지개섬 컨셉과의 실제 연동은 추후 확정됩니다."
    }
  };

  function wait(ms){ return new Promise(function(res){ window.setTimeout(res, ms); }); }

  // 결과를 한 번만 굴리고 state.ending에 저장 — 이후 재접속해도 이 값을 그대로 재사용(재굴림 없음).
  function rollEndingOutcome(){
    if(state.ending) return;
    var isChapchapchu = state.growthStage === 3;
    var outcome;
    if(isChapchapchu){
      var r = Math.random();
      outcome = r < 1/3 ? "fail" : (r < 2/3 ? "success" : "farewell");
    } else {
      outcome = Math.random() < 0.5 ? "fail" : "success";
    }
    state.ending = { outcome: outcome, finished: false, ts: Date.now() };
    saveState();
  }

  var endingAuraTimer = null, endingAuraPhase = 0;
  function stopEndingAura(){
    if(endingAuraTimer){ window.clearInterval(endingAuraTimer); endingAuraTimer = null; }
  }

  // pendingEnding이 예약돼 있으면(이번 산책으로 fosterDay가 30에 도달) 결과를 굴리고 컷씬을 재생.
  // startWalk()의 두 거부(우울증·찹찹츄) 분기, closeWalkVeil() 세 곳에서 호출 — 산책이 어떤 경로로
  // 끝나든(정상 종료/그만두기/거부) 놓치지 않게 함. 반환값은 실제로 컷씬을 띄웠는지 여부.
  function maybeFireEndingCutscene(){
    if(state.pendingEnding && !state.ending){
      state.pendingEnding = false;
      rollEndingOutcome();
      playEndingSequence();
      return true;
    }
    return false;
  }

  // 64번(기획문서 15장): 하루 종료 시퀀스 — 게임 내 시간이 22시(DAY_END_HOUR)에 도달하면
  // maybeTriggerDayEnd()가 호출함. 사용자가 지정한 순서를 그대로 따름:
  //   멘트(FLAVOR.dayEnd) → 페이드아웃 → 암전 2초 → "우리가 함께한지 n일차도 지나간다멍" →
  //   "임시보호 (n+1)일차" → 화면 복귀 + 하루 진행(산책횟수 최대치 회복·뼈다귀 +DAILY_BONE_GRANT·
  //   06:00 리셋) → 아침 멘트. 두 번째 멘트는 방금 끝난 하루(endedDay) 기준, 세 번째 멘트는 사용자
  // 피드백(2026-09-04) 반영 — 이 시점부터는 게임 내에서 이미 다음 날로 넘어간 것이므로 endedDay+1
  // (nextDay, FOSTER_DAY_MAX 상한 동일 적용)로 표기함. 실제 state.fosterDay 증가는 여전히 아래
  // "하루 진행" 블록에서 한 번만 일어남 — 표기용 nextDay 계산과 실제 증가 계산이 어긋나지 않도록
  // 같은 공식(Math.min(FOSTER_DAY_MAX, endedDay+1))을 그대로 재사용.
  // "22시 도달 = 즉시 컷오프로 구현하면 안 된다"는 원안 요구는 이 함수 자체가 아니라 호출부에서
  // 지켜짐 — doFeed 등 각 행동 함수와 closeWalkVeil()은 전부 그 행동의 효과를 state에 반영하고 난
  // "직후"에만 maybeTriggerDayEnd()를 부르므로, 22시를 넘긴 행동도 결과까지 항상 정상 처리된 뒤에야
  // 이 시퀀스가 시작됨. 시퀀스가 도는 동안엔 dayEndVeil이 전체 화면을 덮어 다른 조작이 자연히
  // 막히고, dayEndInProgress 플래그로 재진입(중복 호출)도 막음.
  // 유저가 하루 일부만 행동하고 앱을 꺼둔 경우 게임 시간이 22시 미만에서 멈춘 채로 남는 것은 의도된
  // 설계(사용자 확인) — 이 함수를 강제로 부르는 타이머 등은 절대 두지 않음.
  async function playDayEndSequence(){
    if(dayEndInProgress) return;
    dayEndInProgress = true;
    var endedDay = state.fosterDay;
    var nextDay = Math.min(FOSTER_DAY_MAX, endedDay + 1);

    el.dayEndText.textContent = pick(FLAVOR.dayEnd);
    el.dayEndText.classList.remove("show");
    openVeil(el.dayEndVeil);
    await wait(50);
    el.dayEndText.classList.add("show");
    await wait(1600);
    el.dayEndText.classList.remove("show");
    await wait(500);
    // 암전 2초 — 문구 없이 어두운 화면만 유지(원안 "페이드아웃 → 암전 2초").
    await wait(2000);
    el.dayEndText.textContent = "우리가 함께한지 " + endedDay + "일차도 지나간다멍";
    el.dayEndText.classList.add("show");
    await wait(1800);
    el.dayEndText.classList.remove("show");
    await wait(500);
    el.dayEndText.textContent = "임시보호 " + nextDay + "일차";
    el.dayEndText.classList.add("show");
    await wait(1800);
    el.dayEndText.classList.remove("show");
    await wait(500);

    // ---- 하루 진행: 산책횟수 최대치 회복 + 뼈다귀 지급 + 06:00 리셋(원안 7번) ----
    state.fosterDay = nextDay;
    state.walk.charges = state.walk.maxCharges;
    state.coins += DAILY_BONE_GRANT;
    state.time.hour = DAY_START_HOUR;
    // 68번(기획문서 19장): "OO아 잠시 나갔다 올게" D 이벤트의 하루 내 장소 중복 방지 기록도 여기서
    // 함께 리셋 — 다음 날엔 5개 장소가 전부 다시 후보로 복원됨.
    state.outing.usedPlaces = [];
    // 74번(어질리티 연습장 신규): 하루 1회 제한도 여기서 함께 리셋 — 다음 날 다시 도전 가능.
    if(state.agility) state.agility.playedToday = false;
    // 76번(동물병원 신규, 22장): [치료하기] 하루 최대 3회 제한도 여기서 함께 리셋.
    if(state.vet) state.vet.treatToday = 0;
    // 77번([기다려 대회] 신규): 참여 가능 횟수(4단계 통틀어 하루 1회)만 리셋 — 승급용 누적 우승
    // 횟수(winCounts)는 하루가 바뀌어도 계속 유지됨(단계 승급 조건이라 리셋하면 안 됨).
    if(state.competition) state.competition.playedToday = false;
    // 37번: 성장 단계 전환 확인 — 예전엔 startWalk()의 즉시 하루진행 블록에서 불렀지만, fosterDay가
    // 이제 이 시퀀스에서만 증가하므로 여기로 옮김.
    checkGrowthStageTransition();
    saveState();
    render();

    closeVeil(el.dayEndVeil);
    el.dayEndText.classList.remove("show");
    dayEndInProgress = false;

    // 64번: "아침 멘트도 가능하면 좋겠어" 요청 반영 — 화면 복귀와 함께 짧게 노출.
    showMessage(pick(FLAVOR.morning));

    // 48번(기획문서 12장): fosterDay가 방금 FOSTER_DAY_MAX(30)에 도달했다면 임시보호 기간이 끝난
    // 것 — 엔딩 컷씬을 이어서 재생함(예전엔 closeWalkVeil() 등에서 직접 maybeFireEndingCutscene()을
    // 불렀지만, fosterDay가 이제 이 함수에서만 증가하므로 이 자리로 옮김).
    if(state.fosterDay >= FOSTER_DAY_MAX){
      state.pendingEnding = true;
      maybeFireEndingCutscene();
    }
  }

  // 컷씬(암전 멘트 → 차량 진입 → 들썩임 → 차량 퇴장+이동장 소멸 → 결과 노출)을 실제로 재생.
  // 사용자 확인: 30일째가 되는 산책은 정상적으로 마치고, 결과 화면에서 [확인]을 눌러 홈으로
  // 돌아온 시점(closeWalkVeil)에 재생 — 산책 도중에 끼어들지 않음.
  // 48번(재작업): 별도 팝업 캔버스 대신 메인화면 마당의 #pixelCanvas에 바로 그림 — applyPixelMode()가
  // state.ending을 보고 픽셀모드 강제·화면 잠금·기존 애니메이션 정지를 한 번에 처리해줌.
  async function playEndingSequence(){
    if(!state.ending) return;
    if(!el.pixelCanvas || !el.pixelCanvas.getContext) return;
    applyPixelMode();
    var ctx = el.pixelCanvas.getContext("2d");
    clearYardHiCanvas(); // 84번: 마당 위 고해상도 개 캔버스가 엔딩씬 위에 남지 않게
    var farewell = state.ending.outcome === "farewell";

    el.endingCaption.hidden = true;
    el.endingCaption.textContent = "";
    drawEndingScene(ctx, {});
    el.endingBlackout.classList.add("show");
    await wait(500);
    el.endingBlackoutText.textContent = "아, 벌써 오늘이구나...";
    el.endingBlackoutText.classList.add("show");
    await wait(1600);
    el.endingBlackoutText.classList.remove("show");
    await wait(400);
    el.endingBlackout.classList.remove("show");
    drawEndingScene(ctx, { showCrate:true });
    await wait(600);

    // 승합차량 진입 — 이동장을 완전히 덮는 위치(우측 끝이 화면 끝과 맞닿는 자리)까지, 픽셀 그래픽
    // 관례대로 몇 단계로 나눠 이동. 51번: 차량이 1.5배로 커진 만큼 시작/주차 좌표도 ENDING_VAN_W
    // 기준으로 다시 계산 — 주차 시 우측 끝이 화면 우측(PX_W)에 딱 맞붙고, 시작 시엔 차체 전체가
    // 화면 밖(왼쪽)에 완전히 가려지도록 함(원래 -60/104와 같은 여백 비율을 유지).
    var startX = -ENDING_VAN_W - 14, parkX = PX_W - ENDING_VAN_W, steps = 14;
    for(var i = 0; i <= steps; i++){
      drawEndingScene(ctx, { showCrate:true, vanX: startX + (parkX-startX) * (i/steps), farewell:farewell });
      await wait(1500/steps);
    }
    // 싣는 연출(들썩임) 약 2초
    for(var b = 0; b < 6; b++){
      drawEndingScene(ctx, { showCrate:true, vanX:parkX, bounce:(b % 2 === 0), farewell:farewell });
      await wait(330);
    }
    drawEndingScene(ctx, { showCrate:true, vanX:parkX, farewell:farewell });
    await wait(300);

    // 차량이 퇴장하는 순간부터 이동장도 함께 사라짐(showCrate 생략)
    for(var j = 0; j <= steps; j++){
      drawEndingScene(ctx, { vanX: parkX + (startX-parkX) * (j/steps), farewell:farewell });
      await wait(1500/steps);
    }

    state.ending.finished = true;
    saveState();
    showEndingRestingFrame();
  }

  // 컷씬 재생 없이, 이미 정해진 결과의 "마지막 장면"만 그대로 그림 — 재접속 시 곧바로 이 화면으로 복귀.
  // 48번(재작업): 역시 메인화면 마당의 #pixelCanvas에 직접 그림(별도 팝업 없음).
  function showEndingRestingFrame(){
    if(!state.ending || !el.pixelCanvas || !el.pixelCanvas.getContext) return;
    applyPixelMode();
    var ctx = el.pixelCanvas.getContext("2d");
    clearYardHiCanvas(); // 84번: 마당 위 고해상도 개 캔버스가 엔딩씬 위에 남지 않게
    stopEndingAura();
    if(state.ending.outcome === "success"){
      drawEndingScene(ctx, { showDog:true, dogOffsetX:ENDING_DOG_OFFSET_X });
      el.endingCaption.textContent = "임시보호가 끝났어요. 이 아이는 계속 우리 곁에 있어요.";
    } else {
      endingAuraPhase = 0;
      drawEndingScene(ctx, { showEnvelope:true, auraPhase:0 });
      endingAuraTimer = window.setInterval(function(){
        endingAuraPhase = (endingAuraPhase + 0.08) % 1;
        drawEndingScene(ctx, { showEnvelope:true, auraPhase:endingAuraPhase });
      }, 90);
      el.endingCaption.textContent = "임시보호가 끝났어요. 편지가 남아있어요 — 눌러서 읽어보세요.";
    }
    el.endingCaption.hidden = false;
  }

  // 51번: 편지 낱말을 각각 독립된 <span class="crayon-word">로 감싸 렌더 — CSS의
  // :nth-of-type(7n+N) 규칙이 낱말마다 다른 크레파스 색·기울기를 순환 적용해줌(스타일은 CSS에 있음,
  // 여기선 마크업만 만듦). 낱말은 고정 예시 배열(ENDING_LETTERS)이라 이스케이프 없이 그대로 사용.
  function openEndingLetter(){
    if(!state.ending || !state.ending.finished || state.ending.outcome === "success") return;
    var data = ENDING_LETTERS[state.ending.outcome] || ENDING_LETTERS.fail;
    el.endingLetterTitle.textContent = data.title;
    el.endingLetterText.innerHTML = data.words.map(function(w){
      return '<span class="crayon-word">' + w + '</span>';
    }).join("");
    el.endingLetterNote.textContent = data.note;
    el.endingLetterPopup.hidden = false;
  }
  function closeEndingLetter(){
    el.endingLetterPopup.hidden = true;
  }

  // 훈련: 자립감(구 에너지)이 곧 훈련 예산. 컨디션이 '보통'(😐) 이상이면 바로 훈련하고,
  // 그보다 낮으면(😟/😖) 확인 후에만 강행 — 강행하면 효과는 줄고 스트레스가 늘어남.
  // 기본 스테이터스의 실제 성장폭에는 생활만족도 게이트(coreGrowthGate)가 곱해짐(26번).
  var pendingTrainKey = null;
  function trainStat(key, forced){
    var energyMult = effMult("energyDrain");
    var cost = (forced ? 20 : 15) * energyMult;
    // 40번: '우울증' 소지 시 훈련으로 오르는 기본능력도 10% 감소.
    var gain = (forced ? 3 : 6) * coreGrowthGate() * (isAbilityOwned("depression") ? 0.9 : 1);
    state.life.independence = clamp(state.life.independence - cost, 0, 100);
    // 76번(22장): 해당 기본능력에 매칭된 디버프가 있으면 상승 효과를 조용히 무효화 — 아직 없다면
    // 근력·민첩성 훈련에 한해 이 훈련을 계기로 '근육통'·'발가락삠'의 낮은 확률 발현을 시도.
    var gate = applyDebuffGate("core." + key, gain);
    state.core[key] = clamp(state.core[key] + gate.amount, 0, 100);
    var onsetHint = null;
    if(!gate.msg){
      if(key === "power"){ onsetHint = tryOnsetDebuff("muscleAche", DEBUFF_EVENT_ONSET_CHANCE); }
      else if(key === "agility"){ onsetHint = tryOnsetDebuff("toeSprain", DEBUFF_EVENT_ONSET_CHANCE); }
    }
    if(forced){
      state.life.stress = clamp(state.life.stress + 10, 0, 100);
    }
    showMessage(gate.msg || onsetHint || pick(TRAIN_FLAVOR[key][forced ? "forced" : "normal"]));
    saveRenderPulse();
  }
  function handleTrainClick(key){
    if(tierIndex(state.life.independence) < 2){
      pendingTrainKey = key;
      el.trainConfirmBox.classList.add("show");
      return;
    }
    trainStat(key, false);
  }
  CORE_STATS.forEach(function(s){
    el[s.btn].addEventListener("click", function(){ handleTrainClick(s.key); });
  });
  el.trainConfirmNo.addEventListener("click", function(){
    pendingTrainKey = null;
    el.trainConfirmBox.classList.remove("show");
  });
  el.trainConfirmYes.addEventListener("click", function(){
    el.trainConfirmBox.classList.remove("show");
    if(pendingTrainKey){ trainStat(pendingTrainKey, true); pendingTrainKey = null; }
  });

  function saveRenderPulse(){
    render();
    saveState();
    el.dogWrap.style.transform = "translateX(-50%) scale(1.04)";
    window.setTimeout(function(){ el.dogWrap.style.transform = "translateX(-50%) scale(1)"; }, 140);
  }

  // 45번: 견생만족도 하단 위젯을 직접 눌러 즉시 여는 경로(자동 유휴 타이머와 별개 트랙) — 61번부터
  // 이 경로만 충전(state.talkButton.charges)을 소모함(openTalkVeil() 내부에서 확인·차감).
  el.talkWidgetBtn.addEventListener("click", openTalkVeil);
  el.talkCloseBtn.addEventListener("click", function(){ closeVeil(el.talkVeil); });
  // 46번: 유휴 확인 팝업 — [호응해준다]는 10회 카운트를 건드리지 않고 바로 소통버튼 팝업을 열고,
  // [무시한다]는 그냥 닫기만 함.
  // 64번(사용자 피드백, 2026-09-04): 두 버튼에 유대감 변화를 추가 — [호응해준다] 유대감+2,
  // [무시한다] 유대감-2. playTalkPopup()/closeTalkIdlePrompt()는 각각 talkVeil·talkIdlePopup 쪽
  // UI만 갱신하고 메인화면 견생만족도 패널은 건드리지 않으므로, 두 핸들러 모두 render()를 직접 호출해
  // 유대감 수치가 바로 반영되도록 함.
  // 76번(22장): [호응해준다]/[무시한다] 둘 다 소통버튼에 "응답"한 것으로 간주 — '삐짐'의 무응답
  // 연속 스트릭(020번의 자동 닫힘 타이머 전용)을 리셋하고, 3회 이상 연속 응답이면 삐짐을 자동 해제함.
  function registerTalkIdleResponse(){
    state.abilityCounters.talkIdleResponseStreak = (state.abilityCounters.talkIdleResponseStreak || 0) + 1;
    state.abilityCounters.talkIdleNoResponseStreak = 0;
    if(state.abilityCounters.talkIdleResponseStreak >= 3 && isAbilityOwned("sulking")){
      catalogRevoke("sulking");
      window.setTimeout(function(){
        showMessage(state.name + josaIGa(state.name) + " 다시 기분이 풀린 것 같아요.");
      }, 1600);
    }
  }
  el.talkIdleYes.addEventListener("click", function(){
    closeTalkIdlePrompt();
    bumpLifeBond(2);
    render();
    playTalkPopup("스스로 다가와 말을 걸었어요 · 오늘 횟수와는 무관해요");
    registerTalkIdleResponse();
    // 52번: "수다쟁이" 능력의 후천 취득 조건 — 유휴 소통 이벤트에 [호응해준다]로 응답한 누적
    // 횟수가 20회에 도달하면 자동 취득. 애니메이션과 겹치지 않도록 팝업은 살짝 지연 후 표시.
    if(!isAbilityOwned("chatterbox")){
      state.abilityCounters.talkIdleAcceptCount = (state.abilityCounters.talkIdleAcceptCount || 0) + 1;
      if(state.abilityCounters.talkIdleAcceptCount >= 20){
        catalogGrant("chatterbox");
        saveState();
        window.setTimeout(function(){
          showDescPopup("우리 개가 곧 사람말도 하겠는걸?", state.name + josaIGa(state.name) + " 어느새 소통버튼을 훨씬 더 잘 다뤄요. 이제부터 한 번에 한 마디를 더 얹어 표현해요.");
        }, 1600);
      } else {
        saveState();
      }
    }
  });
  el.talkIdleNo.addEventListener("click", function(){
    closeTalkIdlePrompt();
    bumpLifeBond(-2);
    render();
    registerTalkIdleResponse();
    saveState();
  });
  // 48번(재작업): 엔딩씬이 별도 팝업이 아니라 마당 자체에 그려지므로, 편지 열기도 마당 캔버스를 눌러서
  // 함(openEndingLetter가 결과가 편지(미달성/이별)이고 재생이 끝난 뒤에만 실제로 열리도록 내부에서 가드).
  el.pixelCanvas.addEventListener("click", openEndingLetter);
  el.endingLetterClose.addEventListener("click", closeEndingLetter);

  el.btnFeed.addEventListener("click", doFeed);
  el.btnPlay.addEventListener("click", doPlay);
  el.navWalk.addEventListener("click", openWalkPlacePicker);
  el.walkPlaceBackBtn.addEventListener("click", function(){ closeVeil(el.walkPlaceVeil); });
  el.walkReturnBtn.addEventListener("click", finishWalk);
  el.walkSummaryClose.addEventListener("click", closeWalkVeil);
  el.btnBath.addEventListener("click", doBath);
  el.btnTreat.addEventListener("click", doTreat);
  el.btnRest.addEventListener("click", doRest);
  el.btnOuting.addEventListener("click", doOuting);
  el.buySnack.addEventListener("click", doBuySnack);
  el.buyToy.addEventListener("click", doBuyToy);

  el.resetOpen.addEventListener("click", function(){
    el.confirmBox.classList.add("show");
  });
  el.confirmNo.addEventListener("click", function(){
    el.confirmBox.classList.remove("show");
  });
  el.confirmYes.addEventListener("click", function(){
    try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
    state = freshState();
    el.confirmBox.classList.remove("show");
    openOnboarding();
  });

  // onboarding — 보호센터 이동장 뽑기 (견종을 미리 보여주지 않고, 이동장 하나를 고르면 그 안의 아이를 만나는 방식)
  // 이동장을 고른 뒤에도 견종 자체는 이미 정해진 채 숨겨져 있고, 그 견종 안에서 나올 법한
  // 눈동자 색·모색만 유저가 살짝 골라볼 수 있게 함 (완전한 랜덤은 아니되, 편견 배제 취지는 그대로 유지)
  var chosenBreed = null;
  var rolledPersonality = null, rolledPassive = null;
  var chosenEyeColor = null, chosenCoat = null;
  var crateBreeds = [];
  // 29번: 믹스견(시고르자브) 전용 — 매칭된 두 부모 견종과, 픽셀 실루엣에 쓸 체구 출처 견종
  // 31번: 스탯 산출 방식(부견쪽 우선45% / 모견쪽 우선45% / 완전 랜덤10%)도 이동장을 고르는 시점에 함께 굴림
  // — 완전 랜덤일 때 공개 화면에서 바로 전용 대사를 보여줘야 해서, 시작하기(startBtn) 시점이 아니라 여기서 미리 확정
  var chosenMixParents = null, chosenMixGeoBreed = null, chosenMixStatMethod = null;
  // 78번(24장): 푸들일 때만 쓰임 — 소형/미디엄/스탠다드 중 하나(균등 1/3, breedSizeScale() 참고).
  var chosenPoodleSize = null;

  // 31번: 개체별 편차(±pct) — 기준값을 (1±pct) 범위에서 무작위로 흔든 뒤 0~100으로 clamp, 정수 반올림.
  // item4(견종별 시작 스테이터스 ±20%)와 시고르자브 1단계 부/모견 가중치(±10%) 양쪽에서 재사용.
  function jitter(value, pct){
    var factor = 1 + (Math.random() * 2 - 1) * pct;
    return Math.round(clamp(value * factor, 0, 100));
  }

  // 37번: 성장 단계 시스템(기획문서 9장) — 시작 성장단계의 비율 구간(GROWTH_STAGE_RATIO)에서 스탯 1종당
  // 독립적으로 무작위 비율을 굴림. 실제 스탯 계산(성장최대기대치 × 비율, 절사)은 호출부에서 처리.
  function growthRatioRoll(stageIdx){
    var range = GROWTH_STAGE_RATIO[stageIdx] || GROWTH_STAGE_RATIO[2];
    return range[0] + Math.random() * (range[1] - range[0]);
  }

  // 31번: 시고르자브(믹스견) 1단계 — "품종 기반 베이스 값" 산출. 부/모견 우선일 땐 50(중립)과
  // 해당 견종 스탯의 중간값에 ±10% 변동을, 완전 랜덤일 땐 스탯별로 0~100 전체 랜덤을 적용.
  // 이 결과는 아직 "품종 혼합"만 반영된 상태이며, 개체별 ±20% 변동(item4)은 별도로 2단계에서 한 번 더 적용됨(중복 아님).
  function computeMixBaseStats(sireId, damId, method){
    var sireStats = BREED_BASE_STATS[sireId] || BREED_BASE_STATS.golden;
    var damStats = BREED_BASE_STATS[damId] || BREED_BASE_STATS.golden;
    var result = {};
    CORE_STATS.forEach(function(s){
      if(method === "sire"){
        result[s.key] = jitter((50 + sireStats[s.key]) / 2, 0.10);
      } else if(method === "dam"){
        result[s.key] = jitter((50 + damStats[s.key]) / 2, 0.10);
      } else { // "random" — 완전 랜덤
        result[s.key] = Math.floor(Math.random() * 101);
      }
    });
    return result;
  }

  // 31번: 견종에 따라 순종은 마스터 표를 그대로, 믹스견(시고르자브)은 1단계 부모 혼합 로직을 거쳐
  // "품종 기반 베이스 값"을 반환. 실제 시작 스탯은 여기에 item4의 ±20% 개체별 변동을 한 번 더 적용해서 만듦.
  function computeEffectiveBaseStats(breedId, mixParents, mixMethod){
    if(breedId === "mix" && mixParents && mixParents.length === 2){
      return computeMixBaseStats(mixParents[0], mixParents[1], mixMethod);
    }
    var base = BREED_BASE_STATS[breedId] || BREED_BASE_STATS.golden;
    // 78-1번(사용자 수정 요청): 푸들만 근력이 사이즈 클래스별로 달라짐(소형25/미디엄35/스탠다드55).
    // 이 시점엔 이미 startBtn 핸들러(024번)가 state.breedSizeClass를 확정해둔 뒤라 그대로 읽을 수 있음.
    if(breedId === "poodle"){
      var sizeClass = (typeof state !== "undefined" && state.breedSizeClass) || "standard";
      var overridden = {};
      Object.keys(base).forEach(function(k){ overridden[k] = base[k]; });
      if(POODLE_POWER_BY_SIZE[sizeClass] != null) overridden.power = POODLE_POWER_BY_SIZE[sizeClass];
      return overridden;
    }
    return base;
  }

  function shuffledBreeds(){
    var arr = BREED_ORDER.slice();
    for(var i = arr.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function buildCrateGrid(){
    crateBreeds = shuffledBreeds().slice(0, 3); // 4개 견종 중 3개를 이동장에 비밀리에 배정
    el.crateGrid.innerHTML = "";
    crateBreeds.forEach(function(breedId, idx){
      var card = document.createElement("button");
      card.type = "button";
      card.className = "crate-card";
      card.setAttribute("aria-label", (idx+1) + "번 이동장 선택하기");
      card.innerHTML =
        '<span class="crate-pic">' +
          '<span class="crate-handle"></span>' +
          '<span class="crate-box">' +
            '<span class="crate-vent l"></span><span class="crate-vent r"></span>' +
            '<span class="crate-shadow"></span>' +
            '<span class="crate-door">' +
              '<span class="crate-bar"></span><span class="crate-bar"></span>' +
              '<span class="crate-bar"></span><span class="crate-bar"></span>' +
            '</span>' +
          '</span>' +
        '</span>' +
        '<span class="cnum">' + (idx+1) + '번 이동장</span>';
      card.addEventListener("click", function(){ chooseCrate(breedId); });
      el.crateGrid.appendChild(card);
    });
  }

  function buildEyeColorGrid(breedId){
    var options = EYE_COLORS[breedId] || EYE_COLORS.golden;
    el.eyeColorGrid.innerHTML = "";
    options.forEach(function(color){
      var card = document.createElement("button");
      card.type = "button";
      card.className = "swatch-card";
      card.setAttribute("aria-label", "눈동자 색: " + color.name);
      var dot = document.createElement("span");
      dot.className = "swatch-dot";
      dot.style.background = color.hex;
      var label = document.createElement("span");
      label.className = "swatch-name";
      label.textContent = color.name;
      card.appendChild(dot);
      card.appendChild(label);
      card.addEventListener("click", function(){
        chosenEyeColor = color;
        el.stepEyeColor.hidden = true;
        el.stepCoatColor.hidden = false;
        buildCoatGrid(breedId);
      });
      el.eyeColorGrid.appendChild(card);
    });
  }

  function buildCoatGrid(breedId){
    var options = COAT_PALETTES[breedId] || COAT_PALETTES.golden;
    el.coatColorGrid.innerHTML = "";
    options.forEach(function(palette){
      var card = document.createElement("button");
      card.type = "button";
      card.className = "swatch-card";
      card.setAttribute("aria-label", "모색: " + palette.name);
      var dot = document.createElement("span");
      dot.className = "swatch-dot";
      dot.style.background = "linear-gradient(135deg, " + palette.fur.a + " 50%, " + palette.fur.b + " 50%)";
      var label = document.createElement("span");
      label.className = "swatch-name";
      label.textContent = palette.name;
      card.appendChild(dot);
      card.appendChild(label);
      card.addEventListener("click", function(){
        chosenCoat = palette;
        el.revealEyeColor.textContent = chosenEyeColor ? chosenEyeColor.name : "-";
        el.revealCoat.textContent = chosenCoat.name;
        el.stepCoatColor.hidden = true;
        el.stepReveal.hidden = false;
        el.nameInput.focus();
      });
      el.coatColorGrid.appendChild(card);
    });
  }

  function chooseCrate(breedId){
    chosenBreed = breedId;
    rolledPersonality = rollTrait(PERSONALITIES);
    rolledPassive = rollTrait(PASSIVES);
    var breed = BREEDS[breedId];
    el.revealBreed.textContent = breed.name;
    el.revealPersonality.textContent = rolledPersonality.name;
    el.revealPassive.textContent = rolledPassive.name;
    el.revealPassive.className = "rv " + (rolledPassive.positive ? "positive" : "negative");
    el.revealFlavor.textContent = breed.desc + " " + rolledPersonality.flavor + " " + rolledPassive.flavor;
    if(breedId === "poodle"){
      // 78번(24장): 스탯·고유능력은 3사이즈 공통이라 여기선 그래픽 크기 클래스만 균등 1/3로 굴림.
      chosenPoodleSize = POODLE_SIZE_CLASSES[Math.floor(Math.random()*POODLE_SIZE_CLASSES.length)];
      el.revealFlavor.textContent += " 이번엔 " + POODLE_SIZE_LABEL[chosenPoodleSize] + " 사이즈로 만났어요.";
    } else {
      chosenPoodleSize = null;
    }
    if(breedId === "mix"){
      // 29번: 믹스견은 등록된 견종 중 두 마리를 무작위로 매칭 — 그 중 하나를 체구(크기) 출처로 다시 뽑음
      var pool = PURE_BREED_ORDER.slice();
      var p1idx = Math.floor(Math.random()*pool.length);
      var p1 = pool.splice(p1idx,1)[0];
      var p2 = pool[Math.floor(Math.random()*pool.length)];
      chosenMixParents = [p1, p2];
      chosenMixGeoBreed = Math.random() < 0.5 ? p1 : p2;
      el.sizeHintWord.textContent = SIZE_LABEL[chosenMixGeoBreed] || "중형";
      // 31번: 스탯 산출 방식 굴림(부견쪽 45% / 모견쪽 45% / 완전 랜덤 10%)
      var statRoll = Math.random();
      chosenMixStatMethod = statRoll < 0.45 ? "sire" : (statRoll < 0.90 ? "dam" : "random");
      if(chosenMixStatMethod === "random"){
        el.revealFlavor.textContent += " 응? 얘는 눈이 마치 무지개처럼 빛나는걸.";
      }
    } else {
      chosenMixParents = null;
      chosenMixGeoBreed = null;
      chosenMixStatMethod = null;
      el.sizeHintWord.textContent = SIZE_LABEL[breedId] || "중형";
    }
    el.stepShelter.hidden = true;
    el.stepSizeHint.hidden = false;
  }

  el.sizeHintNext.addEventListener("click", function(){
    el.stepSizeHint.hidden = true;
    if(chosenBreed === "mix"){
      // 29번: 믹스견은 눈동자색·모색을 유저가 고르지 않고, 매칭된 두 견종의 팔레트에서 랜덤으로 바로 확정
      var eyePool = EYE_COLORS.mix.filter(function(c){ return chosenMixParents.indexOf(c.sourceBreed) !== -1; });
      var coatPool = COAT_PALETTES.mix.filter(function(c){ return chosenMixParents.indexOf(c.sourceBreed) !== -1; });
      chosenEyeColor = eyePool[Math.floor(Math.random()*eyePool.length)];
      chosenCoat = coatPool[Math.floor(Math.random()*coatPool.length)];
      el.revealEyeColor.textContent = chosenEyeColor.name;
      el.revealCoat.textContent = chosenCoat.name;
      el.stepReveal.hidden = false;
      el.nameInput.focus();
    } else {
      el.stepEyeColor.hidden = false;
      buildEyeColorGrid(chosenBreed);
    }
  });

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

  // 71번(산책 화면 실제 반영): "산책pov용 화면 개편" 확정 디자인(walk_pov_9breeds.html, 70-2번 카메라
  // 방향 확정 + 5차 피드백 최종본)을 실제 게임 데이터에 맞춰 그대로 옮긴 파일. 프로토타입에서 하드코딩했던
  // 하늘색·견종 모색·9견종 한정 테스트 UI는 걷어내고, 실제 게임의 drawPixelSky()(시간대·날씨 반영)·
  // cssVar("--fur-a" 등, 유저가 온보딩에서 고른 실제 모색)·growthVisual()(성장 단계 스케일·회색톤)·
  // WALK_PLACES 7개 지역으로 교체 연결함. 사용자 확인: "주화면은 현행 유지" — 이 파일은 산책 화면
  // (#walkScene) 전용이고 주화면(개집 화면, drawPixelScene)은 절대 건드리지 않음.
  //
  // 두 겹 캔버스 구조(006번 el 등록 참고):
  //  - #walkPovCanvas: 하늘·바닥·도로·좌우 소품(배경) 전용. 포즈 애니메이션(.walk-pose-*, 018번)의
  //    영향을 받지 않도록 반려견과 별개 레이어로 둠 — 이벤트 포즈로 반려견이 짧게 기울거나 커지는 연출이
  //    배경까지 함께 틀어지면 부자연스러워서 분리함.
  //  - #walkPixelCanvas(기존 요소 재사용): 반려견 전용, 투명 배경. 두 캔버스 모두 같은 좌표계
  //    (PX_W×PX_H, 002번 참고)를 쓰므로 항상 정확히 같은 지평선·도로 위치에 겹쳐 보임.
  // 실제 프레임 구동(매 rAF마다 updateWalkPovScene → drawWalkPovBackground/drawWalkPixelDog)은
  // 018-walk-engine-anim-events.js의 startWalkAnim()에서 함.

  // 주의(중요): 이 파일은 build.py가 파일명 알파벳순(001~024, 그리고 025)으로 이어붙여 하나의 IIFE로
  // 만든다. drawWalkPixelDog()(002번)는 render()(012번)가 "산책 화면이 열려있지 않아도" 매번 호출하고,
  // render()는 부트스트랩(024번)이 스크립트 로드 직후 곧바로 한 번 부르므로 — 파일 순서상 025번(이 파일)의
  // 최상위 코드가 아직 실행되기도 전에 이 파일 안의 함수가 호출될 수 있다. `function foo(){}` 선언은
  // 전체 스크립트 기준으로 완전히 호이스팅돼 항상 안전하지만, `var X = {...}` 형태의 최상위 대입은
  // "그 줄이 실제로 실행돼야" 값이 채워지므로 그 전에 참조하면 undefined다(실제로 이 문제로 최초 구현이
  // 깨졌었음 — Playwright 검증 라운드에서 발견). 그래서 상수성 테이블(WALK_REGION_VISUALS/WALK_BREED_FRONT)과
  // PX_H 의존 계산값(WALK_POV_HORIZON/WALK_POV_SCALE)을 전부 "처음 호출될 때 한 번만 계산해 캐싱하는
  // 함수"로 감싸 파일 로드 순서와 완전히 무관하게 만듦.
  function walkPovHorizon(){ return Math.round(PX_H * 46/120); } // 프로토타입 180x120/HORIZON=46 비율을 그대로 축소
  function walkPovScale(){ return PX_W / 180; } // 프로토타입(180 너비) 좌표계 → 게임 캔버스(PX_W=150, 같은 3:2 비율) 축소 배율

  // ---- 원근 헬퍼(프로토타입과 동일한 이름·공식 유지 — 나란히 비교하기 쉽게) ----
  function ease(d){ return Math.pow(1-d, 1.6); } // d:0(가까움)~1(지평선) -> 0..1 스케일
  function screenY(d){ return walkPovHorizon() + (PX_H - walkPovHorizon()) * ease(d); }
  function roadHalfWidth(d){ var s = ease(d); return (3 + s*82) * walkPovScale(); }
  // 72번: 사용자 요청 — 산책이벤트 화면 반려견의 기존 표시 크기(비율 1)를 1.2배로 확대. walkPovHorizon()/
  // walkPovScale()과 같은 이유로 top-level var가 아닌 함수로 둠(025번 파일 로드 순서 관련 호이스팅 주의사항 참고).
  function walkPovDogScale(){ return 1.2; }

  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  // ---- 지역별 배경 팔레트(WALK_PLACES/WALK_REGIONS와 id 반드시 일치) ----
  // 하늘은 기존 drawPixelSky()(시간대 4단계 × 실제 날씨 7종 반영, 002번)를 그대로 재사용하고,
  // 바닥·도로·좌우 소품(나무/갈대/야자수/울타리)만 지역별로 새로 정의함. forest/lake/beach/city는
  // 9breeds 프로토타입에서 이미 만들어둔 값을 그대로 가져오고, home/park/mtn(프로토타입에 없던 3곳)은
  // 이번에 새로 잡음 — WALK_PLACES 아이콘(🏠🌳🏔️)에 맞춰 각각 아늑한 동네 골목(집 근처), 잔디밭
  // 공원(동네 공원), 바위 섞인 등산로(소로록 산) 톤으로 설계.
  var _walkRegionVisualsCache = null;
  function walkRegionVisuals(){
    if(!_walkRegionVisualsCache){
      _walkRegionVisualsCache = {
        home:   { groundNear:"#C9B98A", groundFar:"#DDD0A8", road:"#B8A47A", roadDark:"#9C8860", prop:"#8A6D5C", propDark:"#6B5245", propType:"fence" },
        park:   { groundNear:"#6E8F5B", groundFar:"#93B378", road:"#C9B98A", roadDark:"#AD9A6E", prop:"#3F6B3A", propDark:"#2C4E29", propType:"tree" },
        forest: { groundNear:"#5C7A4C", groundFar:"#8FAE72", road:"#8A7256", roadDark:"#6E5A43", prop:"#3F6B3A", propDark:"#2C4E29", propType:"tree" },
        mtn:    { groundNear:"#8B8577", groundFar:"#ACA694", road:"#9C9280", roadDark:"#7D7462", prop:"#5B6E4E", propDark:"#425138", propType:"tree" },
        lake:   { groundNear:"#5A9E8F", groundFar:"#86C2B4", road:"#93866C", roadDark:"#75694F", prop:"#3E85A6", propDark:"#2A6280", propType:"reed" },
        city:   { groundNear:"#9AA6AC", groundFar:"#B9C0BC", road:"#5B5F5E", roadDark:"#454847", prop:"#8A6D5C", propDark:"#6B5245", propType:"fence" },
        beach:  { groundNear:"#E4C88A", groundFar:"#EFDDAE", road:"#DCC48E", roadDark:"#C2A971", prop:"#3F8F82", propDark:"#2C6A5F", propType:"palm" }
      };
    }
    return _walkRegionVisualsCache;
  }
  function currentWalkRegionVisual(){
    var placeId = (state.walk.session && state.walk.session.place) ? state.walk.session.place.id : "home";
    return walkRegionVisuals()[placeId] || walkRegionVisuals().home;
  }

  // ---- 견종별 정면 실루엣 특징(귀 모양·무늬·체구 배율) ----
  // AKC 견종 표준·나무위키(진돗개/시바견) 리서치를 반영한 9breeds 프로토타입 표를 그대로 이식. 모색
  // (furA/furADark)은 여기 넣지 않고 drawWalkFrontDog()에서 drawPixelDog()와 똑같이 cssVar("--fur-a" 등)로
  // 매번 읽어옴 — 유저가 온보딩에서 실제로 고른 모색(COAT_PALETTES)이 마당 화면과 동일하게 반영되게 함.
  var _walkBreedFrontCache = null;
  function walkBreedFront(){
    if(!_walkBreedFrontCache){
      _walkBreedFrontCache = {
        golden:   { earStyle:"floppy",     scale:1.0,  name:"골든 리트리버" },
        labrador: { earStyle:"floppyLow",  scale:0.95, name:"래브라도 리트리버" },
        jindo:    { earStyle:"erect",      scale:0.88, snoutLong:true, name:"진돗개" },
        shiba:    { earStyle:"erectSmall", scale:0.66, urajiro:true, name:"시바견" },
        border:   { earStyle:"asymmetric",scale:0.92, blaze:true, chestWhite:true, name:"보더콜리" },
        corgi:    { earStyle:"erect",      scale:0.6,  blaze:true, name:"웰시코기" },
        pom:      { earStyle:"erectSmall", scale:0.5,  fluffy:true, name:"포메라니안" },
        husky:    { earStyle:"erect",      scale:0.85, mask:true, chestWhite:true, name:"시베리안 허스키" },
        shihtzu:  { earStyle:"floppyLong", scale:0.5,  fluffy:true, snoutShort:true, name:"시츄" },
        // 78번(24장): 신규 3종. headScaleMult/legScaleMult는 이번에 새로 추가된 속성(기본 1) — 아래
        // drawWalkFrontDog()에서 반영됨. fluffy는 기존 71번 관례 그대로(포메·시츄와 같은 방식) 재사용.
        maltese:  { earStyle:"floppyLong", scale:0.42, name:"몰티즈" },
        poodle:   { earStyle:"floppyLow",  scale:0.85, name:"푸들" },
        bichon:   { earStyle:"floppyLow",  scale:0.55, fluffy:true, headScaleMult:2, legScaleMult:0.75, name:"비숑프리제" }
      };
    }
    return _walkBreedFrontCache;
  }

  // ---- 좌우 소품(풀/나무/울타리) 스크롤 상태 ----
  var walkPovProps = [], walkPovTravel = 0;
  function walkPovSpawnProp(dInit){
    walkPovProps.push({
      d: dInit != null ? dInit : 1,
      side: Math.random() < 0.5 ? -1 : 1,
      lane: 0.15 + Math.random()*0.55,
      kind: Math.random() < 0.7 ? "small" : "big"
    });
  }
  function drawWalkPovProp(ctx, p, region){
    var sy = screenY(p.d);
    var s = ease(p.d);
    if(s < 0.02) return;
    var hw = roadHalfWidth(p.d);
    var baseX = PX_W/2 + p.side * (hw + p.lane * (4 + s*60) * walkPovScale());
    var size = ((p.kind === "big" ? 16 : 8) * s + 1) * walkPovScale();
    ctx.fillStyle = p.kind === "big" ? region.propDark : region.prop;
    if(region.propType === "tree"){
      ctx.fillRect(baseX - size*0.12, sy - size*0.9, size*0.24, size*0.9);
      ctx.beginPath();
      ctx.fillStyle = region.prop;
      ctx.arc(baseX, sy - size*0.95, size*0.55, 0, Math.PI*2);
      ctx.fill();
    } else if(region.propType === "reed"){
      ctx.fillRect(baseX-1, sy-size, 2, size);
      ctx.fillRect(baseX-size*0.3, sy-size*0.7, 2, size*0.7);
    } else if(region.propType === "palm"){
      ctx.fillRect(baseX-size*0.08, sy-size, size*0.16, size);
      ctx.fillStyle = region.prop;
      for(var k=0;k<4;k++){
        ctx.save();
        ctx.translate(baseX, sy-size);
        ctx.rotate(k*1.6);
        ctx.fillRect(0, 0, size*0.5, size*0.14);
        ctx.restore();
      }
    } else { // fence
      ctx.fillRect(baseX - size*0.08, sy-size, size*0.16, size);
      ctx.fillRect(baseX - size*0.5, sy-size*0.55, size, size*0.12);
    }
  }

  // ---- 반려견 접근 루프 상태 ----
  var dogLoopPhase = 0; // 0(방금 지평선에서 등장) ~ 1(카메라 코앞) 반복
  var DOG_APPROACH_SPEED = 0.14; // 1초에 이 비율만큼 접근(프로토타입 값 그대로)

  // 산책이 새로 시작되거나(startWalk) 새로고침 후 이어질 때(resumeSession) 호출 — 소품·접근 루프를 처음 상태로.
  function resetWalkPovScene(){
    dogLoopPhase = 0;
    walkPovTravel = 0;
    walkPovProps = [];
    for(var i=0;i<14;i++) walkPovSpawnProp(Math.random());
  }

  // 매 애니메이션 프레임(018번 startWalkAnim의 rAF 루프)마다 호출 — 도로 스크롤·소품 이동·접근 루프 진행.
  function updateWalkPovScene(dt){
    walkPovTravel += dt * 0.5;
    walkPovProps.forEach(function(p){
      p.d -= dt * 0.22;
      if(p.d <= 0){
        p.d = 1;
        p.side = Math.random() < 0.5 ? -1 : 1;
        p.lane = 0.15 + Math.random()*0.55;
        p.kind = Math.random() < 0.7 ? "small" : "big";
      }
    });
    dogLoopPhase += dt * DOG_APPROACH_SPEED;
    if(dogLoopPhase > 1) dogLoopPhase -= 1;
  }

  // 배경(하늘·바닥·도로·소품) — #walkPovCanvas 전용, 반려견 레이어와 완전히 분리.
  function drawWalkPovBackground(){
    if(!el.walkPovCanvas || !el.walkPovCanvas.getContext) return;
    var ctx = el.walkPovCanvas.getContext("2d");
    if(!ctx) return;
    ctx.clearRect(0, 0, PX_W, PX_H);
    var region = currentWalkRegionVisual();

    // 하늘 — 마당 화면과 동일한 시간대/날씨 반영 렌더러 재사용(67번 drawPixelSky, 002번)
    drawPixelSky(ctx, walkPovHorizon());

    // 바닥(원경~근경 그라디언트)
    var gg = ctx.createLinearGradient(0, walkPovHorizon(), 0, PX_H);
    gg.addColorStop(0, region.groundFar);
    gg.addColorStop(1, region.groundNear);
    ctx.fillStyle = gg;
    ctx.fillRect(0, walkPovHorizon(), PX_W, PX_H - walkPovHorizon());

    // 도로(행마다 폭이 좁아지는 사다리꼴 — 얇은 가로띠로 근사, 진행에 따라 스크롤)
    for(var y = walkPovHorizon(); y < PX_H; y++){
      var d = 1 - (y - walkPovHorizon()) / (PX_H - walkPovHorizon());
      var hw = roadHalfWidth(d);
      var stripe = Math.floor((walkPovTravel*40 + y)/4) % 2 === 0;
      ctx.fillStyle = stripe ? region.road : region.roadDark;
      ctx.fillRect(PX_W/2 - hw, y, hw*2, 1);
    }
    // 중앙 점선
    ctx.fillStyle = "#F3EEDE";
    for(var i=0;i<10;i++){
      var dd = ((i/10) + walkPovTravel*0.25) % 1;
      var sy2 = screenY(dd), s2 = ease(dd);
      if(s2 < 0.03) continue;
      var lw = Math.max(1, 3*s2*walkPovScale());
      ctx.fillRect(PX_W/2 - lw/2, sy2, lw, Math.max(1, 2*s2));
    }

    // 좌우 소품(먼 것부터 그려 가까운 소품이 위에 겹치게)
    walkPovProps.slice().sort(function(a,b){ return b.d - a.d; }).forEach(function(p){ drawWalkPovProp(ctx, p, region); });
  }

  // 반려견(정면) — #walkPixelCanvas 전용, 투명 배경. drawWalkPixelDog()(002번)에서 매 프레임 호출됨.
  // 79번: drawPixelDog()(002번)와 동일한 방식 — 실제 realCtx 대신 임시 오프스크린에 그대로 그린 뒤
  // 맨 끝에서 굵은 아웃라인을 두르고 한 번에 합성. 이하 기존 좌표/포즈 계산 로직은 전혀 변경하지 않음.
  function drawWalkFrontDog(realCtx, t){
    var ctx = getDogOffscreenCtx(PX_W, PX_H);
    var breedId = state.breed || "golden";
    // 29번 관례와 동일: 믹스견은 전용 구조 데이터가 없어, 온보딩 때 매칭된 두 견종 중 체구 출처로 뽑힌
    // 쪽의 정면 실루엣 구조(귀 모양 등)를 그대로 재사용.
    if(breedId === "mix" && state.mixGeoBreed){ breedId = state.mixGeoBreed; }
    var bf = walkBreedFront()[breedId] || walkBreedFront().golden;
    var gv = growthVisual();

    // 70번(drawPixelDog)과 동일한 방식으로 실제 모색·눈동자색을 CSS 변수에서 읽어옴 — 온보딩에서 고른
    // 색이 마당 화면과 산책 화면 양쪽에 항상 동일하게 반영되게 함.
    var furA = cssVar("--fur-a", "#E7C79A");
    var furADark = cssVar("--fur-a-dark", "#C79E68");
    var furC = cssVar("--fur-c", "#FBF2DF");
    var furD = cssVar("--fur-d", "#4A4038");
    var eyeColor = cssVar("--eye-color", furD);
    if(gv.grey){
      furA = mixHexToGrey(furA, 0.32);
      furADark = mixHexToGrey(furADark, 0.32);
    }

    var d = Math.max(0.02, 1 - dogLoopPhase); // d:1(지평선)~0(카메라 코앞)
    var sy = screenY(d);
    var s = ease(d);
    var sc = bf.scale * gv.scale * walkPovDogScale() * breedSizeScale(); // 견종 체구 배율 × 성장단계 배율(70번 관례와 동일) × 72번 전체 확대 배율(1.2) × 78번 푸들 크기 클래스 배율(다른 견종은 항상 1)
    var earPerk = gv.earPerk;
    var sway = Math.sin(t*2.1) * 5 * s * sc;
    var bob = Math.sin(t*6.4) * 1.4 * s * sc;
    var cx = PX_W/2 + sway;

    // 마인크래프트 모브풍 "각진 블록형" 비례 — 세로 비율 머리3:몸통5:다리1, 몸통 가로폭=머리 가로폭
    // (5차에 걸친 사용자 피드백으로 확정된 최종 비율, walk_pov_9breeds.html 그대로 이식)
    var unit = ((9 + s*54) * sc) / 9;
    var headH = unit*3, bodyH = unit*5, legH = unit*1;
    var blockW = unit*5.4;
    var headW = blockW, bodyW = blockW;
    var legW = bodyW*0.26, legGap = bodyW*0.16;
    // 78번(24장): 비숑프리제 "큰 대두"·짧은 다리 — 몸통 폭(bodyW, 다리 굵기 계산에 이미 쓰임)은 그대로 두고
    // 머리·다리 길이만 배율(headScaleMult/legScaleMult, 기본 1).
    if(bf.headScaleMult){ headH *= bf.headScaleMult; headW *= bf.headScaleMult; }
    if(bf.legScaleMult){ legH *= bf.legScaleMult; }

    var totalH = headH*0.86 + bodyH*0.92 + legH;
    var headTop = sy - totalH*0.58 + bob + (gv.headDroop || 0);
    var headY = headTop + headH/2;
    var bodyTop = headTop + headH*0.86;
    var bodyBottom = bodyTop + bodyH;
    var headX = cx;

    // 앞다리 2개(존재감만 주는 짧은 길이) — 몸통보다 먼저 그려 몸통이 윗부분을 살짝 덮게 함
    if(s > 0.04){
      var legY = bodyBottom - bodyH*0.12;
      ctx.fillStyle = furADark;
      roundRect(ctx, cx-legGap/2-legW, legY, legW, legH, legW*0.22); ctx.fill();
      roundRect(ctx, cx+legGap/2, legY, legW, legH, legW*0.22); ctx.fill();
      if(s > 0.12){
        ctx.fillStyle = "#F4F1E6";
        var pawH = legH*0.32;
        roundRect(ctx, cx-legGap/2-legW, legY+legH-pawH, legW, pawH, legW*0.2); ctx.fill();
        roundRect(ctx, cx+legGap/2, legY+legH-pawH, legW, pawH, legW*0.2); ctx.fill();
      }
    }

    // 몸통(가슴, 각진 사다리꼴) — 하단 좌우로 벌려 뒷다리/엉덩이가 있는 인상을 실루엣만으로 표현
    var hipFlare = bodyW*0.24;
    ctx.fillStyle = furA;
    ctx.beginPath();
    ctx.moveTo(cx-bodyW/2, bodyTop);
    ctx.lineTo(cx+bodyW/2, bodyTop);
    ctx.lineTo(cx+bodyW/2+hipFlare, bodyBottom);
    ctx.lineTo(cx-bodyW/2-hipFlare, bodyBottom);
    ctx.closePath();
    ctx.fill();
    if(bf.chestWhite && s > 0.1){
      ctx.fillStyle = "#F4F1E6";
      roundRect(ctx, cx-bodyW*0.24, bodyTop+bodyH*0.2, bodyW*0.48, bodyH*0.75, bodyW*0.12); ctx.fill();
    }
    if(bf.fluffy && s > 0.15){
      ctx.fillStyle = furA;
      for(var i=0;i<5;i++){
        var ang = Math.PI + (i/4)*Math.PI;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang)*bodyW*0.46, bodyTop+bodyH*0.3 + Math.sin(ang)*bodyH*0.3, bodyW*0.18, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // 귀(머리보다 먼저 그려 머리 뒤로 살짝 걸치게) — 견종별 5가지 스타일
    var earW = headW*0.3;
    function erectEar(sideSign, w, h, rot){
      w *= earPerk; h *= earPerk;
      ctx.save(); ctx.translate(headX+sideSign*headW*0.34, headY-headH*0.4); ctx.rotate(sideSign*rot);
      ctx.beginPath(); ctx.moveTo(-w*0.5,0); ctx.lineTo(w*0.5,0); ctx.lineTo(0,-h); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    function floppyEar(sideSign, xRatio, yRatio, w, h, wag){
      w *= earPerk; h *= earPerk;
      ctx.save(); ctx.translate(headX+sideSign*headW*xRatio, headY-headH*yRatio);
      ctx.rotate(sideSign*(-0.08+Math.sin(t*4+(sideSign>0?1.5:0))*0.04*s*(wag?1:0)));
      roundRect(ctx, -w*0.5, 0, w, h, w*0.45); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = furADark;
    if(bf.earStyle === "erect"){
      erectEar(-1, earW, headH*0.58, 0.22); erectEar(1, earW, headH*0.58, 0.22);
    } else if(bf.earStyle === "erectSmall"){
      erectEar(-1, earW*0.72, headH*0.4, 0.28); erectEar(1, earW*0.72, headH*0.4, 0.28);
    } else if(bf.earStyle === "asymmetric"){
      // 보더콜리: AKC 표준 "한쪽 또는 양쪽 귀가 서거나 반쯤 접힘" — 한쪽은 쫑긋, 한쪽은 끝이 접힘
      erectEar(-1, earW*0.85, headH*0.5, 0.24);
      ctx.save(); ctx.translate(headX+headW*0.34, headY-headH*0.4); ctx.rotate(0.3);
      ctx.beginPath(); ctx.moveTo(-earW*0.42,0); ctx.lineTo(earW*0.42,0); ctx.lineTo(earW*0.05,-headH*0.34); ctx.lineTo(earW*0.4,-headH*0.22); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if(bf.earStyle === "floppyLow"){
      floppyEar(-1, 0.44, 0.02, earW*0.95, headH*0.62, true); floppyEar(1, 0.44, 0.02, earW*0.95, headH*0.62, true);
    } else if(bf.earStyle === "floppyLong"){
      floppyEar(-1, 0.5, 0.1, earW*1.15, headH*0.95, false); floppyEar(1, 0.5, 0.1, earW*1.15, headH*0.95, false);
    } else {
      floppyEar(-1, 0.46, 0.08, earW, headH*0.8, true); floppyEar(1, 0.46, 0.08, earW, headH*0.8, true);
    }

    // 머리(정면, 몸통과 마찬가지로 각진 블록형)
    ctx.fillStyle = furA;
    roundRect(ctx, headX-headW/2, headY-headH/2, headW, headH, headH*0.26); ctx.fill();
    if(bf.blaze){
      ctx.fillStyle = "#FBF6EC";
      roundRect(ctx, headX-headW*0.16, headY-headH*0.02, headW*0.32, headH*0.5, headW*0.14); ctx.fill();
    }
    if(bf.urajiro && s > 0.1){
      // 시바견: 볼 양쪽 크림색 "우라지로" 무늬(리서치로 확인한 필수 특징)
      ctx.fillStyle = "#F0DCC0";
      ctx.beginPath(); ctx.ellipse(headX-headW*0.28, headY+headH*0.2, headW*0.17, headH*0.16, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(headX+headW*0.28, headY+headH*0.2, headW*0.17, headH*0.16, 0, 0, Math.PI*2); ctx.fill();
    }
    if(bf.mask && s > 0.1){
      // 허스키: 눈가 마스크 무늬(AKC "striking masks, spectacles")
      ctx.fillStyle = "#5B6169";
      roundRect(ctx, headX-headW*0.42, headY-headH*0.18, headW*0.3, headH*0.32, headW*0.1); ctx.fill();
      roundRect(ctx, headX+headW*0.12, headY-headH*0.18, headW*0.3, headH*0.32, headW*0.1); ctx.fill();
    }

    if(s > 0.06){
      // 눈 2개 — 저해상도에서 원(arc)이 "+"자로 뭉개지는 문제(4차 피드백)를 피해 중앙 픽셀만 살린
      // 정사각형으로 표현. 색은 온보딩에서 고른 실제 눈동자색(cssVar --eye-color)을 그대로 씀.
      ctx.fillStyle = eyeColor;
      var eyeY = headY - headH*0.02, eyeSize = Math.max(1, headW*0.045);
      ctx.fillRect(headX-headW*0.22-eyeSize/2, eyeY-eyeSize/2, eyeSize, eyeSize);
      ctx.fillRect(headX+headW*0.22-eyeSize/2, eyeY-eyeSize/2, eyeSize, eyeSize);
      // 주둥이(밝은 패치) + 코 — 진돗개는 길게, 시츄는 짧고 납작하게(단두종)
      ctx.fillStyle = bf.urajiro ? "#F0DCC0" : furC;
      var snoutMult = bf.snoutLong ? 1.35 : (bf.snoutShort ? 0.55 : 1.0);
      var snoutW = headW*0.42*(bf.snoutShort?1.15:1), snoutH = headH*0.34*snoutMult;
      var snoutTop = headY + headH*(bf.snoutShort ? 0.22 : 0.14);
      roundRect(ctx, headX-snoutW/2, snoutTop, snoutW, snoutH, snoutW*0.4); ctx.fill();
      ctx.fillStyle = furD;
      var noseR = Math.max(0.5, headW*(bf.snoutShort?0.09:0.075));
      var noseCy = snoutTop+snoutH*0.55;
      ctx.beginPath(); ctx.arc(headX, noseCy, noseR, 0, Math.PI*2); ctx.fill();
      // 입("⊥" 모양) — 코 아래 짧은 세로선 + 끝에 가로선, 세로:가로 비율 1:2(4차 피드백 확정치)
      var mouthStemW = Math.max(1, headW*0.02);
      var mouthStemH = snoutH*0.3;
      var mouthStemY = noseCy + noseR*0.8;
      ctx.fillRect(headX-mouthStemW/2, mouthStemY, mouthStemW, mouthStemH);
      var mouthBarW = mouthStemH*2, mouthBarH = Math.max(1, headW*0.02);
      ctx.fillRect(headX-mouthBarW/2, mouthStemY+mouthStemH-mouthBarH, mouthBarW, mouthBarH);
    }

    // 79번: 마당 화면(drawPixelDog)과 동일한 아웃라인 후처리 — 산책 POV 정면 실루엣도 굵은 다크브라운
    // 테두리로 감싸 두 화면의 그래픽 스타일을 통일함.
    applyAutoOutline(ctx, PX_W, PX_H, DOG_OUTLINE_COLOR);
    realCtx.drawImage(ctx.canvas, 0, 0);
  }
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
  //
  // ===== 74-1번(같은 세션, 사용자 수정 요청): 유저 입력 피드백 방식 변경 =====
  //  게시 직후 사용자 피드백 — "유저 칸 안에 뜨던 O/X를 화면 중앙에 입체감 있는 풍선처럼 크게 보여주고,
  //  누르는 칸 자체는 시스템/반려견 칸처럼 그 칸 고유 색으로만 점등되게 해달라." 반영: 유저 칸 클릭 시
  //  더 이상 정답/오답 텍스트·테두리색을 넣지 않고(setAgilityPadLit로 시스템/반려견과 동일하게 처리),
  //  정답/오답은 showAgilityFeedbackBalloon()이 #agilityScene 중앙에 큰 원형 풍선(엠보스 그림자 + 팝
  //  애니메이션)으로 표시. 관련 없어진 .agility-pad-mark/.mark-correct/.mark-wrong은 정리해 제거.

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

  // 74-2번(사용자 비중 조정 요청): 5개 스탯의 만점 배분을 유대감10 / 민첩성30 / 이해력25 / 수행력25 /
  // 충성도&친화력10(각 5점씩 나눠 합쳐 10)으로 변경. 전부 100이면 10+30+25+25+5+5=100.
  function agilityFidelityScore(){
    var c = state.core, L = state.life;
    var score = (L.bond/10) + (c.agility*3/10) + (c.comprehension/4) + (c.execution/4) + (c.loyalty/20) + (c.affinity/20);
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
      // 76번(22장): 해당 기본능력에 매칭된 디버프가 있으면 상승 효과를 조용히 무효화 — 리포트 막대
      // 그래프엔 그냥 변화 없음으로 나타남(별도 토스트 안내는 생략, 완료 보고에 명시된 단순화).
      var gate = applyDebuffGate("core." + key, gain);
      gain = Math.round(gate.amount);
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
  function clearAgilityPawMarks(container){
    if(!container) return;
    container.querySelectorAll(".agility-pad").forEach(function(p){
      p.classList.remove("lit");
    });
  }

  // 74-1번(사용자 수정 요청): 유저 칸 안의 O/X 텍스트를 없애고, 대신 화면(#agilityScene) 한가운데에
  // 크게 뜨는 입체감 풍선으로 정답/오답을 보여줌. 같은 결과가 연달아 나와도(예: X, X) 애니메이션이
  // 처음부터 다시 재생되도록 클래스를 뗐다 붙이기 전에 강제 리플로우(offsetWidth)를 끼워넣음 —
  // 개꿀팁 티커(layoutTipTicker)에서 이미 쓰던 것과 같은 패턴.
  var agilityBalloonHideTimer = null;
  function showAgilityFeedbackBalloon(correct){
    var balloon = el.agilityFeedbackBalloon, mark = el.agilityFeedbackMark;
    if(!balloon || !mark) return;
    if(agilityBalloonHideTimer){ window.clearTimeout(agilityBalloonHideTimer); agilityBalloonHideTimer = null; }
    mark.textContent = correct ? "O" : "X";
    balloon.classList.remove("pop", "correct", "wrong");
    if(reduceMotion()){
      // 애니메이션 없이 잠깐 정적으로 보여주고 타이머로 직접 숨김(모션 축소 사용자 배려).
      balloon.classList.add(correct ? "correct" : "wrong");
      balloon.style.opacity = "1";
      balloon.style.transform = "translate(-50%,-50%) scale(1)";
      agilityBalloonHideTimer = window.setTimeout(function(){
        balloon.style.opacity = "";
        balloon.style.transform = "";
      }, 550);
      return;
    }
    void balloon.offsetWidth; // 강제 리플로우 — 연속으로 같은 결과가 나와도 애니메이션이 처음부터 재생되게 함
    balloon.classList.add(correct ? "correct" : "wrong", "pop");
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
          // 74-1번(사용자 수정 요청): 누른 칸 자체는 시스템/반려견 칸과 동일하게 그 칸 고유 색으로만
          // 점등하고(정답/오답 구분 없음), 정답/오답 표시는 화면 중앙의 큰 풍선으로 대신함.
          setAgilityPadLit(el.agilityPawUser, idx, true);
          showAgilityFeedbackBalloon(correct);
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
  // 76번(동물병원, 기획문서 22장 신규): [외출하기]의 준비중 placeholder였던 항목을 실제 진단/치료
  // 화면으로 구현. 상점(shopVeil/switchShopTab, 007번)과 같은 "탭 버튼 + data 속성 + active 클래스"
  // 패턴을 그대로 재사용 — [진단받기](뼈다귀 3개, 횟수 제한 없음)로 은폐(???)된 디버프의 정체를
  // 밝히고, [치료하기](1회당 뼈다귀 5개, 하루 최대 3회)로 밝혀진 디버프의 치료를 시도함.
  var VET_DIAGNOSE_COST = 3;
  var VET_TREAT_COST = 5;
  var VET_TREAT_DAILY_MAX = 3;

  function switchVetTab(tab){
    if(el.vetTabs){
      el.vetTabs.querySelectorAll(".shop-tab").forEach(function(btn){
        btn.classList.toggle("active", btn.dataset.tab === tab);
      });
    }
    if(el.vetPageDiagnose) el.vetPageDiagnose.hidden = (tab !== "diagnose");
    if(el.vetPageTreat) el.vetPageTreat.hidden = (tab !== "treat");
    if(tab === "treat") renderVetTreatGrid();
  }
  // 69번 상점과 같은 원칙 — 열 때마다 [진단받기] 탭으로 초기화(직전에 [치료하기] 탭을 보고 있었더라도).
  function openVetVeil(){
    closeVeil(el.outingVeil);
    switchVetTab("diagnose");
    openVeil(el.vetVeil);
  }
  function closeVetVeil(){
    closeVeil(el.vetVeil);
    openVeil(el.outingVeil);
  }
  if(el.vetTabs){
    el.vetTabs.querySelectorAll(".shop-tab").forEach(function(btn){
      btn.addEventListener("click", function(){ switchVetTab(this.dataset.tab); });
    });
  }
  if(el.vetBackBtn) el.vetBackBtn.addEventListener("click", closeVetVeil);

  // 지금 은폐(hidden:true) 상태로 걸려있는 디버프 목록 — [진단받기]가 전부 한 번에 공개함.
  function ownedHiddenDebuffs(){
    return DEBUFF_IDS.filter(function(id){
      if(!isAbilityOwned(id)) return false;
      var def = findAbilityDef(id);
      var list = state.abilities[def.category] || [];
      return list.some(function(a){ return a.id === "catalog:"+id && a.hidden; });
    });
  }
  // 이미 공개됐고(hidden:false) 병원 치료 대상인(삐짐 제외) 디버프 목록 — [치료하기] 탭에 나열됨.
  function ownedRevealedTreatableDebuffs(){
    return DEBUFF_IDS.filter(function(id){
      if(id === "sulking") return false; // 삐짐은 병원 치료 대상이 아님(소통버튼 응답으로만 해제)
      if(!isAbilityOwned(id)) return false;
      var def = findAbilityDef(id);
      var list = state.abilities[def.category] || [];
      return list.some(function(a){ return a.id === "catalog:"+id && !a.hidden; });
    });
  }
  if(el.vetDiagnoseBtn){
    el.vetDiagnoseBtn.addEventListener("click", function(){
      if(!hasBones(VET_DIAGNOSE_COST)){ showMessage(pick(FLAVOR.poor)); return; }
      var hidden = ownedHiddenDebuffs();
      spendBones(VET_DIAGNOSE_COST);
      if(!hidden.length){
        showMessage("지금은 딱히 이상이 없어 보여요.");
      } else {
        var names = hidden.map(function(id){
          revealDebuffAbility(id);
          return findAbilityDef(id).name;
        });
        showMessage(state.name + josaIGa(state.name) + " " + names.join(", ") + "에 걸렸대!");
        renderVetTreatGrid();
      }
      saveRenderPulse();
    });
  }
  function renderVetTreatGrid(){
    var host = el.vetTreatGrid;
    if(!host) return;
    host.innerHTML = "";
    var ids = ownedRevealedTreatableDebuffs();
    if(!ids.length){
      var p = document.createElement("p");
      p.className = "walk-summary-empty";
      p.textContent = "지금은 치료할 증상이 없어요.";
      host.appendChild(p);
      return;
    }
    ids.forEach(function(id){
      var def = findAbilityDef(id);
      var item = document.createElement("div");
      item.className = "shop-item";
      var name = document.createElement("span");
      name.className = "name";
      name.textContent = def.name;
      var desc = document.createElement("span");
      desc.className = "desc";
      desc.textContent = "치료 성공률 " + Math.round((def.cureRate || 0) * 100) + "%";
      var btn = document.createElement("button");
      btn.appendChild(document.createTextNode(VET_TREAT_COST + " "));
      var coinDot = document.createElement("span");
      coinDot.className = "coin-dot";
      coinDot.style.width = "10px";
      coinDot.style.height = "10px";
      btn.appendChild(coinDot);
      btn.disabled = state.coins < VET_TREAT_COST || state.vet.treatToday >= VET_TREAT_DAILY_MAX;
      btn.addEventListener("click", function(){ treatDebuff(id); });
      item.appendChild(name);
      item.appendChild(desc);
      item.appendChild(btn);
      host.appendChild(item);
    });
  }
  // 치료 시도 — 실패해도 뼈다귀·하루 횟수는 그대로 소모(재방문 필요, 엑셀 원문대로).
  function treatDebuff(id){
    if(!hasBones(VET_TREAT_COST) || state.vet.treatToday >= VET_TREAT_DAILY_MAX){
      showMessage(pick(FLAVOR.poor));
      return;
    }
    var def = findAbilityDef(id);
    spendBones(VET_TREAT_COST);
    state.vet.treatToday += 1;
    if(Math.random() < (def.cureRate || 0)){
      catalogRevoke(id);
      showMessage("이번 치료가 확실히 효과가 있는 것 같아!");
    } else {
      showMessage("다음에 한 번 더 와야겠어...");
    }
    renderVetTreatGrid();
    saveRenderPulse();
  }
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
  "use strict";
  // 81번(그래픽팀 신규 스프라이트 파일 반영): 12견종 전체를 사용자 참고 이미지 기반으로 통일해 재생성한
  // 최종본(v5) — 텍스트 프롬프트 8종/레퍼런스 4종 간 품질 격차를 없앤 버전. 생성방식은 이전과 동일하게
  // OpenAI 이미지 생성 API 원본을 /tmp 작업공간의 pipeline.py(배경 제거+타이트 크롭)+recolor2.py
  // (COAT_PALETTES 팔레트별 리컬러링)로 가공해 구움. drawPixelDog()가 (견종, 성장단계, 모색id) 조합에
  // 맞는 이미지가 있으면 이 스프라이트를 그리고, 없으면(방어적 폴백) 기존 절차적 드로잉을 그대로 쓴다.
  // 푸들 소형/미디엄은 아직 별도 그림이 없어(그래픽팀 작업 대기 중) 스탠다드 그림 1종만 있고, 기존
  // breedSizeScale() 배율 메커니즘이 자동으로 소형/미디엄 크기를 담당함(코드 변경 불필요).
  // 81-1번(그래픽팀 재전달 반영): 그래픽팀이 진돗개·허스키·포메라니안 찹찹츄(senior) 3종을 실제
  // 알파 채널이 있는 정상 원본 PNG로 재전달 — 81번 당시의 "배경과 같은 색으로 칠해진 흰 털" 결함은
  // 갤러리 미리보기 배경색((159,174,135))을 실제 스프라이트 원본인 것으로 오인해 추출한 데서 생긴
  // 문제였다고 확인됨(진짜 원본은 처음부터 정상 알파였음). 이번에 받은 원본은 pipeline.py의
  // bbox_with_pad(pad=2)로 타이트 크롭 후 recolor2.py로 3팔레트 재생성해 반영, 진돗개·허스키
  // senior는 80번 이전 구버전 대체를 걷어내고, 포메라니안 senior는 신규로 추가해 더 이상 절차적
  // 드로잉 폴백이 아닌 정식 스프라이트로 렌더링됨. 원본에서 발견된 본체와 분리된 3~4px짜리 유령
  // 픽셀 얼룩(테두리 밖 우하단 구석)은 반영 전 제거함.
  // 81-2번(그래픽팀 보더콜리 수정본 반영): 마지막 남은 예외였던 보더콜리 성견(adult)도 해결됨.
  // 원인은 참고 이미지의 왼쪽 귀 외곽선이 끊겨 있어 그 틈으로 배경 제거가 가슴까지 새어 들어간
  // 것이었고(원화 자체의 색 문제가 아니었음), 그래픽팀이 배경 분리 로직을 개선해 알파 채널이
  // 정상인 원본(border_adult.png)을 재전달함. 동일하게 pipeline.py의 bbox_with_pad(pad=2)로
  // 타이트 크롭 후 recolor2.py로 classic/red/merle 3팔레트 재생성해 반영, 80번 때의 구버전
  // (텍스트 프롬프트 기반) 폴백을 걷어냄. 유령 픽셀 등 추가 결함 없음(연결요소 분석 결과 1개).
  // 이로써 12견종×4단계 전체가 정식 스프라이트로 커버됨(단, 푸들 소형/미디엄은 위 설명대로
  // breedSizeScale() 배율로 처리).
  var DOG_SPRITE_STAGE_KEYS = ["fluff","adol","adult","senior"]; // GROWTH_STAGE_NAMES(0~3)와 동일 순서
  var DOG_SPRITES = {
    golden: {
      fluff: { golden:"assets/sprites/golden-fluff-golden.png", cream:"assets/sprites/golden-fluff-cream.png", darkgold:"assets/sprites/golden-fluff-darkgold.png" },
      adol: { golden:"assets/sprites/golden-adol-golden.png", cream:"assets/sprites/golden-adol-cream.png", darkgold:"assets/sprites/golden-adol-darkgold.png" },
      adult: { golden:"assets/sprites/golden-adult-golden.png", cream:"assets/sprites/golden-adult-cream.png", darkgold:"assets/sprites/golden-adult-darkgold.png" },
      senior: { golden:"assets/sprites/golden-senior-golden.png", cream:"assets/sprites/golden-senior-cream.png", darkgold:"assets/sprites/golden-senior-darkgold.png" }
    },
    labrador: {
      fluff: { black:"assets/sprites/labrador-fluff-black.png", yellow:"assets/sprites/labrador-fluff-yellow.png", chocolate:"assets/sprites/labrador-fluff-chocolate.png" },
      adol: { black:"assets/sprites/labrador-adol-black.png", yellow:"assets/sprites/labrador-adol-yellow.png", chocolate:"assets/sprites/labrador-adol-chocolate.png" },
      adult: { black:"assets/sprites/labrador-adult-black.png", yellow:"assets/sprites/labrador-adult-yellow.png", chocolate:"assets/sprites/labrador-adult-chocolate.png" },
      senior: { black:"assets/sprites/labrador-senior-black.png", yellow:"assets/sprites/labrador-senior-yellow.png", chocolate:"assets/sprites/labrador-senior-chocolate.png" }
    },
    jindo: {
      fluff: { baekgu:"assets/sprites/jindo-fluff-baekgu.png", hwanggu:"assets/sprites/jindo-fluff-hwanggu.png", jaegu:"assets/sprites/jindo-fluff-jaegu.png" },
      adol: { baekgu:"assets/sprites/jindo-adol-baekgu.png", hwanggu:"assets/sprites/jindo-adol-hwanggu.png", jaegu:"assets/sprites/jindo-adol-jaegu.png" },
      adult: { baekgu:"assets/sprites/jindo-adult-baekgu.png", hwanggu:"assets/sprites/jindo-adult-hwanggu.png", jaegu:"assets/sprites/jindo-adult-jaegu.png" },
      senior: { baekgu:"assets/sprites/jindo-senior-baekgu.png", hwanggu:"assets/sprites/jindo-senior-hwanggu.png", jaegu:"assets/sprites/jindo-senior-jaegu.png" }
    },
    shiba: {
      fluff: { aka:"assets/sprites/shiba-fluff-aka.png", sesame:"assets/sprites/shiba-fluff-sesame.png", cream:"assets/sprites/shiba-fluff-cream.png" },
      adol: { aka:"assets/sprites/shiba-adol-aka.png", sesame:"assets/sprites/shiba-adol-sesame.png", cream:"assets/sprites/shiba-adol-cream.png" },
      adult: { aka:"assets/sprites/shiba-adult-aka.png", sesame:"assets/sprites/shiba-adult-sesame.png", cream:"assets/sprites/shiba-adult-cream.png" },
      senior: { aka:"assets/sprites/shiba-senior-aka.png", sesame:"assets/sprites/shiba-senior-sesame.png", cream:"assets/sprites/shiba-senior-cream.png" }
    },
    border: {
      fluff: { classic:"assets/sprites/border-fluff-classic.png", red:"assets/sprites/border-fluff-red.png", merle:"assets/sprites/border-fluff-merle.png" },
      adol: { classic:"assets/sprites/border-adol-classic.png", red:"assets/sprites/border-adol-red.png", merle:"assets/sprites/border-adol-merle.png" },
      adult: { classic:"assets/sprites/border-adult-classic.png", red:"assets/sprites/border-adult-red.png", merle:"assets/sprites/border-adult-merle.png" },
      senior: { classic:"assets/sprites/border-senior-classic.png", red:"assets/sprites/border-senior-red.png", merle:"assets/sprites/border-senior-merle.png" }
    },
    corgi: {
      fluff: { fawn:"assets/sprites/corgi-fluff-fawn.png", sable:"assets/sprites/corgi-fluff-sable.png", tricolor:"assets/sprites/corgi-fluff-tricolor.png" },
      adol: { fawn:"assets/sprites/corgi-adol-fawn.png", sable:"assets/sprites/corgi-adol-sable.png", tricolor:"assets/sprites/corgi-adol-tricolor.png" },
      adult: { fawn:"assets/sprites/corgi-adult-fawn.png", sable:"assets/sprites/corgi-adult-sable.png", tricolor:"assets/sprites/corgi-adult-tricolor.png" },
      senior: { fawn:"assets/sprites/corgi-senior-fawn.png", sable:"assets/sprites/corgi-senior-sable.png", tricolor:"assets/sprites/corgi-senior-tricolor.png" }
    },
    pom: {
      fluff: { orange:"assets/sprites/pom-fluff-orange.png", cream:"assets/sprites/pom-fluff-cream.png", black:"assets/sprites/pom-fluff-black.png" },
      adol: { orange:"assets/sprites/pom-adol-orange.png", cream:"assets/sprites/pom-adol-cream.png", black:"assets/sprites/pom-adol-black.png" },
      adult: { orange:"assets/sprites/pom-adult-orange.png", cream:"assets/sprites/pom-adult-cream.png", black:"assets/sprites/pom-adult-black.png" },
      senior: { orange:"assets/sprites/pom-senior-orange.png", cream:"assets/sprites/pom-senior-cream.png", black:"assets/sprites/pom-senior-black.png" }
    },
    husky: {
      fluff: { greywhite:"assets/sprites/husky-fluff-greywhite.png", blackwhite:"assets/sprites/husky-fluff-blackwhite.png", red:"assets/sprites/husky-fluff-red.png" },
      adol: { greywhite:"assets/sprites/husky-adol-greywhite.png", blackwhite:"assets/sprites/husky-adol-blackwhite.png", red:"assets/sprites/husky-adol-red.png" },
      adult: { greywhite:"assets/sprites/husky-adult-greywhite.png", blackwhite:"assets/sprites/husky-adult-blackwhite.png", red:"assets/sprites/husky-adult-red.png" },
      senior: { greywhite:"assets/sprites/husky-senior-greywhite.png", blackwhite:"assets/sprites/husky-senior-blackwhite.png", red:"assets/sprites/husky-senior-red.png" }
    },
    shihtzu: {
      fluff: { goldwhite:"assets/sprites/shihtzu-fluff-goldwhite.png", white:"assets/sprites/shihtzu-fluff-white.png", black:"assets/sprites/shihtzu-fluff-black.png" },
      adol: { goldwhite:"assets/sprites/shihtzu-adol-goldwhite.png", white:"assets/sprites/shihtzu-adol-white.png", black:"assets/sprites/shihtzu-adol-black.png" },
      adult: { goldwhite:"assets/sprites/shihtzu-adult-goldwhite.png", white:"assets/sprites/shihtzu-adult-white.png", black:"assets/sprites/shihtzu-adult-black.png" },
      senior: { goldwhite:"assets/sprites/shihtzu-senior-goldwhite.png", white:"assets/sprites/shihtzu-senior-white.png", black:"assets/sprites/shihtzu-senior-black.png" }
    },
    maltese: {
      fluff: { white:"assets/sprites/maltese-fluff-white.png", ivory:"assets/sprites/maltese-fluff-ivory.png", creamtan:"assets/sprites/maltese-fluff-creamtan.png" },
      adol: { white:"assets/sprites/maltese-adol-white.png", ivory:"assets/sprites/maltese-adol-ivory.png", creamtan:"assets/sprites/maltese-adol-creamtan.png" },
      adult: { white:"assets/sprites/maltese-adult-white.png", ivory:"assets/sprites/maltese-adult-ivory.png", creamtan:"assets/sprites/maltese-adult-creamtan.png" },
      senior: { white:"assets/sprites/maltese-senior-white.png", ivory:"assets/sprites/maltese-senior-ivory.png", creamtan:"assets/sprites/maltese-senior-creamtan.png" }
    },
    poodle: {
      fluff: { apricot:"assets/sprites/poodle-fluff-apricot.png", black:"assets/sprites/poodle-fluff-black.png", cream:"assets/sprites/poodle-fluff-cream.png" },
      adol: { apricot:"assets/sprites/poodle-adol-apricot.png", black:"assets/sprites/poodle-adol-black.png", cream:"assets/sprites/poodle-adol-cream.png" },
      adult: { apricot:"assets/sprites/poodle-adult-apricot.png", black:"assets/sprites/poodle-adult-black.png", cream:"assets/sprites/poodle-adult-cream.png" },
      senior: { apricot:"assets/sprites/poodle-senior-apricot.png", black:"assets/sprites/poodle-senior-black.png", cream:"assets/sprites/poodle-senior-cream.png" }
    },
    bichon: {
      fluff: { white:"assets/sprites/bichon-fluff-white.png", creamtrim:"assets/sprites/bichon-fluff-creamtrim.png", ivory:"assets/sprites/bichon-fluff-ivory.png" },
      adol: { white:"assets/sprites/bichon-adol-white.png", creamtrim:"assets/sprites/bichon-adol-creamtrim.png", ivory:"assets/sprites/bichon-adol-ivory.png" },
      adult: { white:"assets/sprites/bichon-adult-white.png", creamtrim:"assets/sprites/bichon-adult-creamtrim.png", ivory:"assets/sprites/bichon-adult-ivory.png" },
      senior: { white:"assets/sprites/bichon-senior-white.png", creamtrim:"assets/sprites/bichon-senior-creamtrim.png", ivory:"assets/sprites/bichon-senior-ivory.png" }
    }
  };
  var _dogSpriteImgCache = {};
  function getDogSpriteImage(breedId, stageIdx, coatId){
    try{
      if(!coatId) return null;
      var stageKey = DOG_SPRITE_STAGE_KEYS[stageIdx] || "adult";
      var byBreed = DOG_SPRITES[breedId];
      var byStage = byBreed && byBreed[stageKey];
      var dataUri = byStage && byStage[coatId];
      if(!dataUri) return null;
      var cached = _dogSpriteImgCache[dataUri];
      if(!cached){
        cached = new Image();
        cached.src = dataUri;
        _dogSpriteImgCache[dataUri] = cached;
      }
      return (cached.complete && cached.naturalWidth > 0) ? cached : null;
    }catch(e){ return null; }
  }
  // 83번(사용자 제작 픽셀 애니메이션 시트 1호 — 웰시코기 성견): 사용자가 별도 생성툴로 만든 24컷 시트
  // (6열×4줄, 투명 배경 PNG, 1536×1024)를 게임 해상도로 옮긴 프레임 아틀라스. 가공 방식: 시트의 각 컷을
  // 실제 여백(거터) 기준으로 잘라낸 뒤 모든 컷에 같은 축소 배율(1/4.4)을 적용해(=컷 간 크기 일관성 유지)
  // 픽셀 블록별 최빈색으로 샘플링하고, 색을 5색(외곽선·주모색·흰털·귀 안쪽·혀)으로 정리. 모색 팔레트
  // 3종(fawn/sable/tricolor)은 주모색=fur.a, 흰털=fur.b로 재채색(tricolor는 자동 재채색 임시본).
  // 각 프레임은 CELL_W×CELL_H 칸 안에 "가로 중앙·바닥 정렬"로 들어 있고, 모든 컷이 왼쪽을 봄.
  // 프레임 번호(0부터)는 시트 순서 그대로: 0 서기 / 1 숨 내쉼 / 2 깜빡임 / 3·4 꼬리 흔들기 A·B / 5 앉아
  // 올려다보기 / 6~9 걷기 1~4 / 10 냄새 맡으며 걷기 / 11 후다닥 달리기 / 12·13 웅크려 자기 A·B / 14·15
  // 옆으로 누워 자기 A·B / 16 다운독 기지개 / 17 엎드려 턱 괴기 / 18·19 뒷다리로 긁기 A·B / 20 부르르
  // 털기 / 21 플레이바우 / 22 꼬리잡기 / 23 뭔가 쫓아보기.
  var DOG_ANIM_CELL_W = 55, DOG_ANIM_CELL_H = 49, DOG_ANIM_COLS = 6;
  // 0번 프레임(서기)의 실제 개 높이(px) — 게임 쪽 표시 배율 계산의 기준.
  var DOG_ANIM_REF_H = 44;
  var DOG_ANIM_SHEETS = {
    corgi: {
      adult: {
        fawn:"data:image/png;base64,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",
        sable:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUoAAADECAYAAAD55GgZAAAoQklEQVR42u1dvW5dSY4+uriJn6AjBU5bmSDAWEDooJPGBDfdZFNFhgL5SSwsDEVO5wkUDJw4MAQMDBjO3KkDR/0EzlobjOmlKLKKZLF+zlEREFot33tOfUXyK5L1tyxTpkyZMmXKlClTpkyZMmXKlClTpkyZ0k+OZhdMmTJlBHnx/Nk9/v+PX78Pw097bcO9jR4Z/NaNbYs62zK+p+xvtN2riSi5hls7PeIZU9r298g6i2rbiGTy4vmz++tXh2VZluXq9a25XRLRrMHfoO2A39MHtXV6VLvh+BnwnEmW9Z3N09cpnfV2uto22RNfKTYJ11r8jdqtp+21iXKn7XT4f02IDMA58CMpB34intEzdYD3czrTtm1knUXZpEQma8bGff/0cLnKgZ62G+xXa/v4J9ond5aGe0eHkRTHdaynQ+kzRqmzROpsRIfztEsik9Hweds0ckBitT0Ov+RXLQf3ncXxcsTC/X00kpQMS0ty0kg1KlmuXWc5jFp8a4q4LNhGJ/8aA7yUQdXEv4sCseYUwJrmrGEUt/T9FtK2p4Zv9FniCIE6bSpAaaXXvcXxPt++2YyioGMB0/WrwwPFaNMc+pzRMG5JZ08NX44YtzgA5PyoV2lvH/kwALAmpWFn+0GW99yM2ei11xltbROfNHhvTW+UIM8ubpa7i5tlWZbl09uXYn+0wr73ALn78u3n7xjEViKT6NR2BOMDnW1BX5xjbQkfxnb96rCcMYSxZQG8HOZeA8TeapApEPQ7ax3pcmnOGkdn7ffWqLOt4OMGaw22tftbSX9RzLVKYLtUyJ96qWZ0g+/DfzU1wBHrImuJJiN1Br+PsNgc3g34JIwefL0FY7NEVjl/u3p9O/xicwhIoK0lmLlyRST2vaS4qMI4JcnRFCelcGtKdVI600ZbqX4ZQWcfv34/isKHsY1AJhK2FoN+b8HbNr222sJms8uDMNtvQXAK7SkrrNEYt+RsYItbsslofxs1KKHRJNRfzy5uHgQo2P+gP3J9Ujtr3Vs6X9qPyZHQiIr7+PX70dXr2/+s90x8Thvy46VBo2CEdpTWVEd2tpwzrMkmvbjXuhsHR85Xr2+X5QcmSpRnFzfL+cnxMFnrzvJhGhpvdVS3RF6jpahYN1Iqoxmh1+CIJana6PhK09DRhRKjlhR7Dey7HOtfvzosd1++sYy/RqHF8wiyH6loniOAtQ9uqb29WyAXzteeInHivhjhsJa9RJIf3r/7/5RSCI/vvnxbzk+OsyC0u15aOxwmS29ZYaR0BtrIGR042/WK0zVc+E9hXAR9Ss8e5fg47GuSv2nKQiP6m0SO5yfHoi6xTntPrIqp9+6XXx91Nhce3335lh3tzi5u3Kf0zFTHhuHq9e1yfnL84Id+Rou1xnFVEfjAFqV0Led4dPAbAZ9WJxr9weTIWrZ0cnosTcWbEaXVADXKW0vYv6U0JxV5pXBaCHXUQaM1vpZnk0rtX4vOgAjBPlODuwbXh/fvqrb3SEoFsINx4TEFCoJDZAru09uXRSlBaYpEU7hc5wNGbd2v9wnZ2Og43Wh0RvulVGeRehsNH8blvYrB4m/coCf5G15e00tvOdzayF+rS9B/jXYfaY2yJMWJUlypAjE2qYygUQ432pWkCrWIpFRvqcMIRsXnsckou8QDsNZpMcFKdtnb32qQDzdAlMjff/25/Pb7H9Xae2QZ5UqdrVSw0ksuleIMUoMnN5p5JnyoIZcoGEbp0tpddOG8VG9cFGIZ6Gph5Cb7wCas0Q2NsLbgby3Jkg4MTYiyNDyu4WwR6a42hfMQZQlebtQvHQhKDa6m3iIygginisSEB0lLRFkjHR3F31roVMIe3d6jGiBaTeV7bxn01l9bjuIlZDLq4BaFz+tYLZeYeAfykXHVWi9sxa3FG0mW6qswvenpWshylDQ1MvIaWWcRZDkqvhKMW/O3GgOfBXNUe9XLg3opjaalpYcGQKdhcoQdAPhHg7UUbwpHq3WnPaKs0vWLFsNvGW3VTlOj7c/icxKZj0yS2I9K27wf0eEeLNv5QYx0twFerW/dXQHHWml2BUTjlLBhg8Q7MEp2juSwRTsat1SDYovYZRE9YxqB78G/B8w0t8T2aJkc43Pwmesfumy9o6nEZgBHSZuPIoyyGkkKqTE9M3ItaU4rbFoiWbveRsK3VmzSWmIJG/636GVftbGWRPq7ZSCRlIY7ssYuml4k2QJbLxLpia2HXbbEVpskMbbWUXtNKTmvYb8WkLUUNoIhbMkYnxK2qbt1kqV002pRRMlNftSKTEaVtWHcus5y+NaMsZbuRjxN6OPX70cfv34/6qFH6+TOzqK8KJFmrj2dUtshrM+PvDqjBFuNQvso2EbHNyK2qHY+lStzXUQJyksdbbXW0bsVph4G1gpfT+fZKr6noDuqx9JBbgiijOrkXKHb8kyYXYQQfkspfMnMaQ2pobdSbNJ3azi/9pkj6i1Kd7WwaUopOZLEe+3xDyeedbx7KyBYf4hf6HWulELod+m2wihnQEpybR+j7bzLnCRkxVZqkBSf5vCONeitRH8ivkxUIuGriQ2v9+2hu1rYUpGl5Z1AkhLuqNPRdx7l5Zw3d0cv7H5JhcsYnORs0eE2TXW8HTwiNlw0l56t0VuubT2w0VS1NT7OVqIiLs2Ehxabpd85wmoRKV+/Oiw5PXKRZI3BIyz1LmmEJsz+9Pblg8+dnxxXNUhKmClFaS5szzlcK2wjlh3WUi4ZrVbGPT91PQY9NVxjk/DZXjZZ436qUrLcR7wc/otrGNp6g+UeavyZVssdcGhPjUaDUTvqtb68DOvMiimHi54aHn1ArtUxpCiwBr7akju9XYNxVJvU6lFaMVNzob+LKKVjkeAGPM+2rdPD5bIsy4N7svF+05ZKw+dVYpxAlilnp9hfPH92z7W/57o2igk7l+VEbg2uHs7G7QLC5KHFCPhOD5c/7bInPs7nvFtcR7PJR8TItIXqkba/JlmGnXno3f8p7ffMnfBc434MegK6NDngPeZfwse95/zkOBxbarLDcyL3KHrT4ovYL98aX24/dJTetNhanEeZOg+W+7fUgdqprMaCxVWjxIVzXNOIOuWm5iVBOVyp1AWwWutrVnyt16paMeVIZLTaYxRJtqzTaXF52pMamOFZvbcvaohcIkZKnKUk6Y4oabRUYjyptUy5W+5qGWxufZWVUEbAFoWpFFctvUXi02IcAV/JlSGj+JtGfzUCoiZEWbuTuFpf61E9wlg82Fo6W+llX7lntdRbNHGNhC9SdyP6m4YoNYNwDZKcMmXKlClTpkyZMmXKlClTpkyZMmXKlClTpkyZMriIM0B4VmnOFE2ZMuUpyz5HkiXSY0mPtV01l45MbBPblA0T5bI8OoDi3rN+kB5i0fou4JqDwBpkhP4eSW9PSfdTKqbeYEjcRn/t1h9sjNKm+17Oy+G7Mh7iIfXRleMwkBr4uBOWrDuJRtNbbWwzqpySk120MYMxjnBEk8ZRrl8dlhfPn91rog1w1hGxUSLBWLXYpEFyC9hSepuR5hQ3UZ4eLhc4+gyTn2RUkqPR54wgnvZwzkqfM4rDWfFxRLJ1vY2GbcrKI0qLQeWIZDSng/ZpB4E1YIN2bRHblvU2ZQOpdy5y2rJBcpHyWrFJetsCti3rbSv6wD+tvhslphPO8QnItMFbMcgt1avwydxbw0exzTrjegYt7QqYkXSqIkowSHot5CiXp9cWUPDaBgBKkrlyydYirrXqbcskWaJHFLDdL0vbVRh7i7NpSfLz7ZtVGCclktZ3GE9sMfi2hm2LgjMAuAdLiipHXIGxSxmiJiIpiWZGIhLNpUSjYyrBtiaClAbvtett69EkXUVjiUB7r1R4QJTA7rnb2CwjNxj2CIuWNY6Tw5b6bi9s+L2R2EYjmFrY5oLzMUsmmCSHiyi1ZLm2qDKFyxpxAS4YAEbY3fHx6/cjaAuHTTu4YWzQX9bL1KJx5bB59IaxTWqqn3ZTAV3mZrRHKeEllwdxxikBzn2mp7PViBxGTuc0epvYpoyUEXDR5EjzHOrlQdzoDQbLXaY+ukDbpXbn/h1/Zk1RiQYXHeBGSsk0A3cO2xr1tiWCPLu4We4ymc5ok8EqotzSZICFTNYuW9ZbycCtIdw1S+T6w+jBpGR5Yc9sIHnMmuRoZxc3m1mKsVUyoRfIb0lnFNsWCE1DSKnPp07tKgwais4AxW2xkKS0xLBXNrCjnQ2HCJxd3CznJ8cPfh6Fz1++qU4KspzQ08ow7758Yx3OQpwjlRsAm4TLOyiMsDsC2nB6uAzF5m1L6XY67rupZ6U+39KvLO9Kfc46sdg7mlwW4TxKMEZKjqmRXAIPBkyfRUcFeHftC+TvvnxT49Io1DLCScZTitmKTYOL6s2z3SxCl7X0BoFAid68eKVzUS2RIi0dtBi08Ts959JaV2Bw7/ccIB5hl+rJnFy6w6V2eJTn6kIciFoO503LU0qFovT5ybHKmaQDkVvfT5QzWE5vnqil1wnrGr15IubUgdaleHO7VbjzOC0TcxFi3audivhxv2knFntmQ8mIEiIKjiSlv5eE2tpO8hijFC17MdB6S06RmtlzL0YOWwSuaGy99ebBZiEi6y0A168Ojw73oM+QdrfgtaA9ykC56I6WuVL9HtW/HDHmBjetTR5ZUh1LhBlBkJGOpyWTUgLtgU+DzYqrJrZSvXE4LINDLdvUYqRESWtw+BncZ2ndrgZZepdZ4fam6saYWyzt5vqmpAShtUmRmSNmFmsbY4nTSYPACM7mIZVcfXkUbKVkOZLeMJnQ361RpUSWmAC4WWC8PbiEKDlSOz85foAJ9zOOCmn0q9XP33/9aZqkgbpyCTF6bZLdmfPx6/cjbqbbYog1SSTi3prU7HBvksQG4J1IAHz4ZwRsVlwUG4erNbazi5ufxCJtq8zh45wyt8i61sxvKvKTdkKdXdyIutTqY/fLr+rVCvRzkXdXaWxyl1OklTBbrtWzLjuCbZQYj9XhogcBaoglC6FHHOA4bF6y9OKKwoYJEhMC4IJ/8+Dj+kxDBKeHy0dRXxRJYn/g/ENLcpqJ4NSz6ORiCUHSPtLa5D5nnBZlRzoZ7hxaz4jYMknJsiW+B872I53ACoR/xzPq1omQXrXWRwb/YyB4tPDYOSD00pvkyFAOwG0pwYf7Cq+qwFFly+193qyL65ecbdLVCtzkW5S/4VUDP/89oTNVHaXHxA3tpNQaOu1avxHwSQ6XmqQowdYSX2tsIxBljtA1tUquznlm2AtdUqcsXaiPcWrq5F4CjiDJEpsMude7NknS0D9yC1uv2fsUvtbPrE0kNbYc9lqVEC3SEXI5oUfGjYKFkhCnp1Yk6bEhqW27ZWUS5XTzMqp16m3LQqNJLVnSaDL3fUzKJSTEfZeSJSbMGsFAK3vcWUaINY7Yo0XLE1+MaCZ2IrFZntW6Tz0THFFkmeMN6awIbT+27kupnTst6K3JGnD9/defM8xyDuClwqXCWqfted6lt+boIaQUzlLsPQbwVF15Z3lIDcMsMcjSDi1dTlMb22+//+E2uprYuJqadfSPcoSaZOlp95ozEKntXB9rcNL1r6NmTJ/evsza0a6mYebWR0WSUY3Ru5bRa5U3U3le6JFyrckylSZG2GPpDK/2QBCP37dIh6Ofn3oe/BsuX3DzFzutUeIHWQ3To5xWZFKSxpWsZ8spL+IE7sgUFQa9UkcrxcctDQKytEbQGBP90ZAip0vP+t7UBWqpKN7qY5rPUGx4Bhv/XXMPlnXCNIKEpT7ins29CwZf2vad1ijxroPrV4efHXh2caO62TBlkClwqZEtqh5Cv39+cqxSGGzB8jibhE87wrUkS4oll0ZRXJQkI2tZqTJR6WCj+b7Ur1GrKlLHk3mDB7qjSJOOWggM75bTrKlsmUEBYXLvo32NdZhdDMsdkcR1srQ0QbNDBD4jjcb4EFm6XSvS0aRF2nQktdRccthyKVMUTg4b7s8UUaR2V+RwcRFJCabUYnPJGT22qcEnLfLGuD2Hf3D2Jx1LRo/742yJ6lFzco/mYGDu8A+LfiQfKxlQNHrTRttYh3urMXIn97x4/uz+6vWtuICzdFIBGwrsXmh5QRR3EGxkXSylXOi/0kNw8c4J3HbNdlAvVikiyR1SG5kdAGbtkV+l0WZETZ7b2neX2d5HBz2OMDFOdM/9fUr/YDel24Y9W09LygjRN8MeeUdtz0iiPaMvZZT0OPxoR0sdMVdCjvh4qpSzccbu3eqX0y23F1cb9VF904EkFZF4I66UnlLXOmh0qrVnOmEjfc6Cz7rdVMLh8T18R5b0vRRGTb9pzx2QMqrc2ZapNmuj5lzf7a3KkDodGmc9QJUbuR59nzkwgv49OvVOkaSFrOkzU+QH+D+8f7fsfvl16SEaEuOcAUcw3DmFUsZREjmenxyrr9Dw2KV4+RzJqqLqkZZ7gSxRWq5vaq5M8fKBtsTFRcn0d3yTpNQ3YEvS+/aaL2s63HpQgef7NddiedqfSv09zwOn++33P6qvO8sZsIUkc3WrWrrTRqPWQdwagVLStrbPm8KW9K3WPq2HeOO+roGLfq60HJVrN3xmH2GI3ijU24HRNUJrSF96D4ynT1rt8oioR2qj9JbCRX5SVB+hN6tuOSeV0nlNJFvid1IKm0u7rVF2ztaifNw6oHLfqzJj7Gmox6Fq1Ccj3+PtE/q9Vjg9bbNEob3IP9UOrg2ltlxLL9z7S9qq1UvJzageTCPZTDhRlnaohiRaXOsafV2u93m1sZYYogdTbfL34LYOCC3aHDUQeYlMQ1oRd2v3tIEpU6ZMmTJlypQpU6ZMmTJlypQpU6ZMmTJlypQpU6ZMmTJlypQpU6ZMmTJlypQpU6ZMmTJlypQpU6ZMmTJlypQpU6ZMmbIOmZvSp0yZ8lNGObxkEuWUKVOGJUd6bUKN61bWKPtpJlOmTIKMvIhrRpRTpkzZDEFqybHG1dBrk900mylTnmYUqRUg1FGu9ZgR5UaNbtZ4pqwxkpyRZUOi3BqZeOo69LbGSZxT1kaS2JYnUVYgxq2QSaShTcKcskbbfcqRZZVbGDmFYILQKGwUQqkxMzgjzCmtbbgk3Ybvwu8eooy4LK/nGs99bTKBTsV/x50/iiGlbp/LtZUSX+7z2PBS758ynsPUxhSJJTILKnkG1VcNrENElNJooI0iNeTZI9TXXI1rJUmPYdbAt9UdFlQvWylleCOu1Pe8RHl2cfPg/89Pjn/+fvfl24O/aa8ppoGSBaeEo2W91HWHs5YU6Eh0erhcPt++MRNljY5JKVBLeFEDQTS+CONcUwq5drLEuLR6yt2VHUWSmCyBJLVEmWqDFWfJMyJkp20k/FhIskXaVSKp9ntJsrQ9pfhyDrKltXCnh8vl9HDJ2uZayd+6ZpH6Zi39YpIs0ZUl64K+ocFWD9lZycQyERMNsLYxWEsBFF+UEiPxcWSyBbLEfQ2/w0CzFnxSO3N64giE+96IgwclS0lf3N96kaSKKCWAUtRYiySjyBIUA8+RRjopIm6Fr5aBboUsP9++KcIHdjBKP5QMtNx3R46wczg5ou9JksuSmPWmZAL/BQOFZQK1UuweUYkHWw0F/nh/+Ew4YESDwb2mxjRS3S81A4vxXb2+Zcny49fvRx5yTH2nRv9gDKm6I0eQa/TJ1Prr3iQpRpQpo7DWGWqmyNHRgFYhI4/W1GmlyIuLrOiPZA+p70jPaIHN4pB3X779rLuV4ojEWuJf+Ltesvz09mXzbCDlXyOQZDKiTDUUR18YGJ4xwx3++fbNo+9EjbitSFnCVnuU9UYrubVvmr7DS0FGTtU5u6LYpdnciJJI7fWwox2Hpl0apNEV2Fgrn6pGlBYD+vT25U+DPLu4eUSW2KhGn6Wk7ZOwwSAAv0fh41KvmkSiJRTHkqfw9Zx4ENAOvlh/+G8RdkiWYYWRZW4wqxVtgW2XDi45G9Q8H77XO7Lc1epkriO0JMLVByWjaVmQl7B9vn3DRthaB4iOjMFRI54LZOJdgoO/O9qsdCQRYLyeg2DAfrAdQXlA6v/IDK1GGv7x6/ejj1+/H3F2aM3QKFb8TEspyFsW2msaiNncqhwcfUnpMjXYu4ub5fzk+NHeUvhc7nm1aiee0Z91xh8DAYdttDSEZgZRJZPW2zY5PdTsZy2+H0Ryf/3q8MD+qK3Xtl9tJO5NuyO2LdOstCRzo5N9OTy73EjnUUROuRioNKpD7QI+ixe8lkQCONrCeKKMDCvOgy0i0hl5HR1ul3VUL9lWOjo+b5tpJNqitFVSN4/UTQlG63d3mZHOTSISWWqIhBIKtysggiy5tLkUl9YQUthaGBFntC2jLi9ZcpNrXuKJTL3PLm4ePK9kZYY1mowa5KU++/T25c+fWu8Be8zpLXIgsJSE1DXK2vWQHKHUkJqRh8YJa2DDyo4gghp1vBIyOT1cPphUk9qHCbUmBvp867sio/+R109ifDV9upYt7tbc+VPyBMcRBTcq1yQT3A4PceHRPjd7qinr1I6W4b2td0HhCR9rH8Pnc/5unZDDn8NrV1sNxlFkuUsBLDlsgHPOUXbylGKrXXvx4MHGe/3q8IgEJGPMEVcEmXDP15IJt4aQaxN+3vWrQzeSlPBF2JC1rGNta3Skhxf3X72+Xc5Pjn/+cG3W+KS1xJXra63v7qKIImWIktGOvsg014G1CaZUJLJcC5ngAY1b15qKWpdlEZ1y5EGR00nNd3Iz2r0GfU22cXZx4yJ0bBt0MlXz7l1U2k0jxkdLfsiIAZ/zOuOnty+LzqPTYsO4pKVN1JFLDc2CjZJJjlC49DeaTEqJQZvaeScYvDZXk0CuXx3Y1Q/WpTCWiaDUsp9orBhbjugk0uImy7zkK7Xnw/t3bIazz6U7mo6n6xlTad6yPF4nWSJWkgRsH96/W3a//JrERnFJCqa4sEPWqr9YJgFS7ehJktqaEd75lBLAknLKUpKkJ3xfZ+w91b84NU0RjJX0vJEk+BIcHNLqyhZ6KHCrTJR7J3AClb32QTnCTCmbGgtnvFpFR3US7pDUoupUiprD5SHLEnyp/fTQDg2ZlBJKavunNVKTTnhK6YLDGEmSUl+lIpfzk+MHJzHhYCRnR9zWS82/eUiyJhHeffnGlkO0qXTPcpZ5rzcmlchoyUoo0akBHQh6zMTBu60lBS2ZaCLJWsaY0i84EJdu051hrB1kbMFCnNJOKqnNeGDwZBDwHAtpeG1TKrek7EzbH168LQKICMmeRRg1E4aN9WfawoT12nC75H6ZSGzUyM9Pjk24vNho6i1tM80NKDSV1EZhKTxSH+S+yzmQ9Bxau8NRH07lJFzc4CRlD6ln4DZrsg8aUeJ2Ss9PvdcSNeNJrhRJ5vzDcl9ODp9FR96sxprRcYHKPpp5JdB0JCmpfZRGk97DWzllY8dMjZTaaMOKDYzCsiHAQiZcWcKLQ6tzLj1N1TClUkLOASMiNaz3q9e3yZplTf/KlZGuXt8+qKHXTLVfPH92n/KTWgQZla2aIsrS6CtFGjmHSdVdatzEaMGWSxtaY8vdUpcbWbVkgkfa3Ge5VBJ/PxedSVcic32di+AsuLTEqLEJ+rkUNkrslohfk6VYb6lM+cX5ybEq28lFj1osmghZm9FolsNJZS/X/cEaQ5WMyDKtT2t2tUZCDptGid4IORpbjkxKSVIzQGhIJVfEt94VHUlsJQSiJXhPmushF4rPY1e563BLibJkAufq9a16sNYc4KwJVo4inLGltCLKLWArwUVLCZa2ae6XKXHEaL2VvjNFgJp31LS/EpvSYh3Zp6L662gNBNPjcqutYCvBUdvJLGQSib30PTXarW2rRp8jXAZXy3+09euhiHLKlClTIsh0pJs+OdlNdU2ZMmVKWsJYvHYaNUe+KVO25U/03IeRfWtGlFOmTOlGkvT3UWVfC3zktZ0jKRWuX52R5ZQpZYK32/7YXTWsbxVHlKNfZDVxTZkynk/1vqe7S+rN7TfGHbNW4XCNTpzee4unTGkZSXK/W2y7tY3vSxwyNTpE37ndmmwk8sefGS1FoIYzYhu3EBGBjLC+d4365c4lSHHFCIP+fpq/fuTrdROlt1SAL3mfhBlLUD0GIg9h9CZWan+WjIy2XTjPoIkO9pFkslWHWEN7OSPCyy8iCHMuk1oenX7TiixTA6H0/p7kzmU3H96/+xls0D3X18zgniLIVUSUODXdIkly2EaOJnOCyyBeR5lp/X8EH9mFDxyufWyZNBByKWtuIrJ2FIYP+sDnBfz2+x+PBhvoU25w59ovnbs6fESZqzdYRrzRHM9aS0mN5C2wpYyIRpfWww2o0VqfM8kyTuiZk/DuEVdq5O6dSl3BMlLm6p71lggDroNMXUG6xllZuM0NbmmToqyWuKhjYHI8PVz+/OEMMNVOrCPprmX4+1OZYae3E3pvgLTql0aTp4fL5e+//jRHkb2IBo5Egx+OJFPX8XI2vIrUW1IId84bimLucyMG/lzP2cTcgZ+fb9+wtb9e2CzRAzVGWrfEWFIOt+YyRM2oqXZUyU0u4ogtl6r2ktQ1ENgmLbc+trbBfYRz5m6Cyylz9EhyZFz0/anLuLhDfLlLvXION8kynzrWJEmtLXDfibwhQCOpK1LOLm4eXFSWmhvgykotsZiIEhwqxfzamoMEvodgosDYNPds5FKdmriks/kwWdL3P5ptJAcTjFYbGkValxes9UZYzwwTJr0jMC6qBOKkRGoZbHrh2FuNhM5KpSKuktGxl0FCvcR7J3QPbB+/fj+C1J6rV2oi/1HTtpQttoomLKs8Wk3qYP1C23a//PqAeGDA7BGBSVFlKg3XYu5x2tDOChgmNeD3GilEa6ejuNZEkpQ0wIhys/M5TCks1PFaElZplGfZAsdNpqQiulblFymq4u6khwiz5S45sAd61w/nW9rMrSdJqiJKfFFQ6pKjklpNj3BaWusVdY95yoBqPv/F82f3mCy5MoJGV6naUGvHk0odnqVO2u97l9rAKTi1dK31FVhCRJfn9Fq6FiE9z63ceesyXIE2Nc2fU3TL6CR3HacHlybyajmaR0U3gIEjyd4OplnqlLJly/d7i5YgPQHLGvD3tjn3OkpKMmcXN4/qfBrljzZ7moooLYTZK0qGqAmiyavXt8nURqsnjL9lus1Fg9bTnHB0CHhTpYXShduwvrR0IKfvL7UpKA/QH2w7NdPvXASszSR6yD6STM4ubpbrJb8eCuommFh7Rycpgrz78m35+68/l99+/yOJi9ZRWqY22MhPD5fLHewcESZwLBGydPe4dtdV6r5ra98AwXGHvko3FmKd4Q0DUSSJ7d2yFnAUmQdTV4woUyNDylDoAtNRjmLLjXy7X34d3gEgQvjt9z+W85NjFtPZxc2DPvdiAkLB/81NkmASgsJ+ZBTjeRaXfnv6JLXnupS8NO+W/MjqX5E2HhlVwgDZq0ywswDFkzr0RwMYlMbNfrXsAAsujE0zO4e3bLUWmLnPDQB4i6nGkWiK9u///e97+jfqZDi1w+QZ6Yhc+kzJmm7/06b3lj4HXUNf4r9Z7XqUemFUO6yRKbVh+H9Y+tSrj8ypt2YGPEeS+HvwHHxnRo/Q34srNXK3PF3GSsxQJrHik4gkdVkUrpn2khpLt7BDg66jBkh68IWnTXTniyWq7J3pcUEJnsUvIUuPL5pOkLEaAVY0R5SYmOiyjRZkGYErhw8wtiZKaSeEFk+qDhcp2vo0RHvScqXc8ieOKGlN2YJPk12ADiy6pzap1U1O15yfRemmlp9ZbdQT1GjxqWqU1lpDRK0Np1GtUvA1C8aQwuPBWiu6KFlyZSFJ+vk1iXYbrTRAU31DPbPHAvQRSNJbYthbwFpJ64GSnUXl2qeylODC5xLm8LXAgFM/SAU1xJhK804Pl6YUvaZAVOslPc2BIaOSJdWPZVcctoE1zcjXIkjPdSkmx/XUwgBwLj2gDt0yFffiwsq04osabTUpTsTOo1pGa9GtNNmCB66c0MNCvCWFWqm3J1WVaqMpn4rWTaR/tTqRyYJ1Z1We1bm8oLklLDXScO8zow5ubbHIN7XPtqXhcumeVbfaveypqJJGpJ5ntTi411t6KR0UW/jdaJLDajo9qNaSF5jN4mopNVOFyMkcS7hPcUam5VwaPmL6E3GOp2QfmmfXPke0JYnmyiwz3U7bDfx/6gDmXS2wWsCp8ytHPPA3h4sz1tR3aozaOLL0TlRFREywBg6vjaMTCTiF9fSB5wSrSHuq6diWZ0uDIheAlEbTaxPODil+7t/MEWWEcoH0cKSjMQS6Pq/VPb5Wo5UWcFswRmHDhOOtKUcYp+TMNNpNnYJtIQfv2sMI2/ASds2sjNPDhx+H++IgJHdDQVRpoMcmDE0ZCLdLiip3vZQ6Un2nFj4rxtLDFCiJeEoKLfRS4jAf3r97sPOlNMKMiqhwv0X2oeZZlvfBDpfU5GM06WuX4dWwvdSALQ22bL+1JBDLtjltxDSawIj0FFKalgIzp3gfu1RaSN0CWiP9rj3QeJ+ZIrzcQNo7Qm4xWFsGbPWC849fvx/1GBEk444gyxq4ImqqEdis9cm1RvipyDLl7PDv3iUz2s95Sin0tPqUfqS/b53oWstupMZIBde1Scr5chgjBgLsnBqyXBNJ4khAsxuF6+dW9hVdS6d6WpPeau+Cq53F7axgS2ZSLWlCS8KMwpVTFIexV8QVZZwR5OtdmJ07xYobnDyX4fUkFs/k4OiYWoq1v6TP77xgqVGufXKmFFcu5ZZIsRZZjnDwqtR3uI89hMoR4r/+63+aZDuW9LuWDjW10JJ6ac1JPSkoGZ0/mqXep4dL0cA0taSW0vqQjJpkmYuUaxto1PMxadBCPJAk/DfqxKSeqR7G3XJicHTCotmBhh80AzZ8Tqotu9dRXr86mPaS4usf1jAjrD1IgIsk6cp/DRHWWgOId+rUTsW1fcqto9VEwD+I/8FuKhxJ/uPf/8ziKz3jsZd4d6mVrPGsdcYCtcmcn2mOkSvth5xdFEWU2ruMKZmUkGXtAzLopUvedLsUX7Rhcrt1zk+OVe9LjeKa7396+3KpQdR3X74t//j3P5uRJK6lSjXEWlElRJapKx+kfyvZJbeWu3Mgy9DWzbnyT4pbzJ3A7Y/mnODvv/40ndCiZftaF5FpcdG2aEf53vgAIzdIlYzkmgNhpV0QcGGb1iHpSoDaJ9JIJEnbI20TrKlHLovJ6UGyQalvatsiDZqoPnEq7Al4NPaoPaUs5PinVLSQSrc0iuROSY9WXuqE8JwCJRIdCR81TGiHpDfPTY0ewrXMdnuWS1l0kyNIiSRTdl+bZCzkoNEn3RBS+1R+6DsNf1jbIx3JlwoSUrj3JcanJcnoNKR1SK81uIg6Y6toOUcUHt2lBgLp3RaSTA1mOZ1pdJOK+qV29qj5coQtDXYREVhve/T6hbQUzFP6KzoUQ1t3glEjpwxccG0VaUm4NEq0HO6BP4ed1nN/RxRGje5ybcoZvWSQWiJOPZ9eCJfDIpElR5CpaLf2sYMRhMMNdtK954++33CytUbtmssQ8U0EYkkpgdtElHjWUdsB+HcViwufqUkipbjMQjC2jpJzxuldAK59T9TzIxzt6vUta3MlbRvhDqZcH+ei9Nr+plmJUXI5W7ReXJ2hrReVdLbmHotWtR8JF/f5nGH2KiVYa3zadtW+NjTyAJTc2YzWKLp3iSjXDi+OkWzS05bUc3N3ZEnvO6oFdi3LCp4arhoYU8+xDCatCDN6MO9pI6VtoN/vYd81+jFnd1a7/D8Wo8aPPLY8BQAAAABJRU5ErkJggg==",
        tricolor:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUoAAADECAYAAAD55GgZAAAoVklEQVR42u1dv25Vy85f2eyGkkfIG5wiEroNEkc6QrdGVLc9RapIlDxBykhUKWhvFVFfISSQaD5FouAN9iNQUqF8BWeC49gztseembUylqLDgey1129s//xn/i3LlClTpkyZMmXKlClTpkyZMmXKlClTpvSTozkEU6ZMGUGeHj++gf9/ffgxDD/tpS9ufemRwW/d2Laosy3je8j+ht97NNlJX9wCZHTwW4/IW9OZB76RsT16crw8enJswvb0+PHNWscjvXfCbxmDhD9qHPalF0/y8/theXr8+EYaoahnLMuyPF0ONzOrjBOsM6vBYp31zk6ibbInPuzYj54cq7BxuNbkb/jd0xgMm1Fyg65heRwdR41itdEnOopp34PSmfTdRtaZl01yZLJmbNTnP7+/XGWQx++d7Fdq+/DH2yd3mhfXlBC1z2lBKnBQa0ola7nUwthqdDaiw1neiyOT0fBZ32nkhERrexR+zq9aBvedxvFKxEL9/WgkyZYoQpLjItWoZLl2nZUwSvGtKePSYBud/CMCPFdBReLfeYFYcwmgLXPWEMU1Y7+Fsu2h4XsIE6WwR1kqpaP1utc43vOXp5tRVBrYhEnaPObaCnBsRsK4JZ09NHwlYtxiACj5Ua/W3t7zYQnAmpQGne3Rk2N2lnD03uvMtraJjwveW9MbJsiL05NlWU6WZVmW15df2fFohX1vAfL2zavbP0MQW8lMvEvbEYwv6WwL+qIca0v4ILZHT47/IY3t6K4kCS+FuVeA2GsNMgcCf2atka5U5qwzOss+t0adbQUfFawl2NbubzXjhTFHtcB2uZQ/96WS6JY+n/470gLSmsEd1SA9dZb+nHTWc9Fy+u6Ej8NowddbIDZNZlXyt5/fD8vP74ehtzCmhCS9aw1mql3hiX3PKc6rMY5JcjTFcSXcmkqdnM6k2VZuXEbQ2fXhx5EXPohtBDLhsLUI+r0lVWo/vx/MttrCZouldyK4NS9q5UpoS1thzSXqFpzt5/fD7QqFrdikt7+NmpTgbBL2X9PEDfY/mGnnxiS6at1pB5/6e5g6j6y468OPo/SuWyxRcRnj8ZwRna2ET2qTo5emFlyjC1wP+fP7YTk7v1rOzq/ItoMUZ4uqdaf5ZZwar1lhXpnXaCUq1A1XykicbQ3ZWk2pNjq+2jJ0dIEtrmVZSLIcKYvecawPDertm1f3gK1Vkbh57pV9jUKSJQJYe3DL7e3dArlQvvYQiROOxQiHtRxxJPnl04c7JSUH5uz8SgRiJDJJ/RHc/8Dr1aT9kd7Y8PbRnFNpJqhG0RnG9/P7gbRFi032rgQgNhzEKIxS/Y3aVkh4E7az86usLqW4u2SUy7Is3z6+u6c4Kj1+++ZVMdpdnJ6YT+mZpY4OA+z7UP2fi9MTMdaI46o88CVb5Mo1ieNB4h0Bn1QnEv1dnJ4sb9+8Ws2WTkqPtaV4M6LUGqBEeWtJ+7dU5nA6KzmchlBHDRqt8bU8m5R7/7XoLBEhzCy54C7B9eXThz6lN3QwKj3GQKkUGYN7ffm1qkdWm1ZrSlSIUdr3631CNjQ6SjcSneFxqdWZp95GwwdxceRYwq7xt1IpTi1v6+lvJdzSzF+qy6T/iPc+khplTYnjpbhaBUJsXBvB0h+5OD2pKhWiiKRWb7nDCEbFZ7FJL7uEAVjqtJBgObvs7W8R5EMFiBr546+/l2d/vgh73yNNlKt1tlqBSrcMRI4oLQ1lHM0sM3PYkGsUnKJ0be/Oe0dSrd6oLEQT6KIwUpN9ySa02Q3OsLbgby3JEgeGJkRZmx5HOJtHuSst4SxEWYOXivq1gaDW4CL15lEReDiVJyYYJDUZZUQ5Ooq/tdAph937fYtbGKXT960V53FLG5d9cQTK9TRr8dbcnIjJtWYiodXeds3NiRQ+i01G4sOVxBaPQ4u6FdFis5Lx1d5kWZVRUj2UUZzNmqFI2go9y1TPzGtkndVE+9Hx1WDcmr9FZJQ91gKLD+7tpTRc1tQeGkBlJb2yk9zBDrnT1j2lpaMlvLXRXpOFtMIHddliFUQkLsrn4P97ZWnRJAn9qFYf+xEVd3eS5HDnxBj4O+k7tYqrKeFqcXLYoIO9ffPKjE0T3LydjVqqgbFBvbV0sGh88N/PzutL1JbYcEuJ8rnfu9YW15K2hd95lOG73iBKSksGQ22lTDt+cMkiJctk8NKlPZ4kibFBkqzF1kNGxNbKLvGWyjXrjfI5iK3HgnYPPdbqZDe60rCiInbRtGgr9MLWg0R6Y+thly2xeeku9541balRpeZgjf1aQEYpbARD2JIxPiRsU3frJEtL77+YUcISNTozGVXWhnHrOivhWzPGKN2NeLze9eHH0fXhx1EPPWpL8J1GeV7CHRxrGZRoh9A+3/ME6hpsEY32UbCNjm9EbF7v+VCuzDURZVKeZuJjLdG7FaYeBtYKX0/n2Sq+h6A7rMfaIDcEUXoNcqnRrXlmOvklpfBbKuHhqTYjYIvQWy027rMRzi995oh689JdFDZJK6VEknCvPfyhxDIDbt5PDL9Q61yS48vur+26u60QboL3WvxqOVGawlg6IKM1NohPcnhHK715OhzUn0VnNfgiseGDXGp0p/1sNDaOV6R6hCSpPdVfi6PqJBdu4EtH9WsJpYWzWRVlNcyW2KRBTqI3DZmUsG0JHz6yLYpIanxOE8BbkiTGp7mCRXq2LPZlLZbq5UHWnRaSNBsfqkop2ktpcFscfLcaw8xtUWyJbcS2w5awteyVUTYFr8eAgYnyszXYZMQBHLU7wlzOBuQGWjs4JcOj9nxHZST43fBAa3BqsUVnJVzWrNVdKdq30lsOH5fJrg0ft23T6nOj2CSXMVO7gkqX/mmyyiYZJdfP+3UO38F0Ysrn95fLsix37smG+01bXlfJ3RCXyDJnmBj70+PHN7ksoIdQW9IsJ3JLcPW4ZpTaBQQzKynGhO/z+8tbu+yJj/I567mso9nkfXs8MPzCV3uvL7+G7Ypy25ljva8iGeW3j+9Ix8Wb8n9/X6xSuQMzUjDQkkru/elrgH3x1RzCTAWChK2kl1Z6k+CT2iZsw1ycnizfPr5jHTgan/cBILnnjaI7yYHaVKaZI8uabNJMlP+s8bqxGmIpUkLSbXmwADxVyDMYaPG1Xqt6dn5VfaZnT721wkcRaW9cHvaIx8grqHpnz5xf4LYYJstaklyWyh6lB0nmDK50y110v6Q2MxkJmxemWlxRevPEJ8U4Ar6aK0NG8TeJ/rwTIu1nhph5lCjFi5i93ysCW0tnq73sq/SslnrzJq6R8HnqbkR/kxClJAhHkOSUKVOmTJkyZcqUKVOmTJkyZcqUKVOmTJkyZcqUwYWdAYKzSnOmaMqUKQ9Z9iWSrJEeS3q07xW5dGRim9imbEPYg3vTRfWPnhybiDMdw5Z+PAnYk7y3LFvC6oHlIel+SmDpnTvzTrr1J3cmYO+Tnyl82hNRuDGKPFlFG5ys453D1jv7isQ2s8op5oyyloh6nBpjcZSUMUuyDZglj4aNOkhZk8mXDoZdO7ac3mamOcVMlJ/fXy7p6DNIfpxRcY6GnzOCWN6Hclb8nFEcTouPIpKt6200bFNWnlFqDKpEJKM5XXo/aRBYA7b0XlvEtmW9TdlA6V3KnLZskFSmvFZsnN62gG3LetuKPuBPq896ieo8SngCMn7hrRjklvpV8GTureHD2GafcT1B6+f3w/L0+PGNZmK4t4iIMhkkvhZylMvToyUpeG0BAJNkqV2ytYxrrXrbMknW6PH2mcvhZlnarsLYa5xNSpLPX56uwjgxkWiuqZ3YxsG3NWxbFFgBpHuwuKxyxBUYu5whSjKSmmxmJCKRXEo0OqYabGsiSC54r11vW88m8SoaTQbae6XCHaJM7F66jU0TuZNhj7BoWeI4JWy5z/bCBr/XE9toBBOFbS44H7NlAklyuIxSSpZryypzuLQZV8KVAsAIuzuuDz+O0rtQ2KTBDWJL43V9+HHUMwiUsFn0BrFNaoovu7EkXZZmtEdp4WWXB1HGyQEu/U5PZ4vIHEYu5yR6m9imjFQRUNnkSPMc4uVBVPROBktdpj66pHfn3rv07/B31pSVSHDhADdSSSYJ3CVsa9TblgjyF5fkK53RJoNFRLmlyQANmaxdtqy3msAtIdw1i+f6Q+9gUrO8sGc1sM8ZE+do+MLxSSbjCb5Afks6w9i2QGgSQsr9fu7Urqp3/GfNopU04btoSJJbYtirGmCPWbs4PVnOzq+KBip1vlGO6ioFgWVZ7uCWlHEjlHAJW4lEEjZp6T1CiZqwffn0Yfn28V1XvXkc/Ku9fzz3+9S/eRIllXlrSJ0iSk3ATmQJJ+CGIcrkbBKiLBFmGhz8LAw2fXf0BfJv37wS45IoVKM4rYNEYZPgwnqzbDfz0GWU3lIiUKM3K17uXFRNpogJrMUcAfxOy7m0FqKsDW5edimezCllKlRpB7M2qi9EgYhyOGtZnlNqakqfnV+JnIk7ELn1/UQlg6X0Zj3lvofuZHrTkWBOfx54S7tVqPM4NRNzHqLdq51rccFx01Q3Hpm7RfYlcjw7vyJJkvp7rpxNRmtVKOyTeJAJzE4kAYAilVIQkJZD+LO1mXVOZ9rgVkMgXj0uT71hbNJJndLEEA56GpyarX24FE2/33rViXYyzGMeQDI20jaExSaPNKWOJsOsSbG90v9SW4ELAFJ8ERgt+CTYtLgisdXqjcIhDQ6RtinFCEtv3IPDz6B+Nwnu23n3Ji3LrCLmAbjv9OjPSm2SZWaPmcVoY6xxOi4IjOBsFlIp9ZdHwVZLliPpDZIJ/rO0h1ciS0gA1Cww3B5cQ5QUqZ2dX93BBMf59eXXe7rMlbqUfv7462/Vkh9qgtkjOEhskiy9rw8/js7Or260BtiCQHCvpKaM4whlFIyaUg5H2JpAF4lNiwtjqw3gHth+T3TdL3t/OXMZH5URUeeHYlKMWIidy/w4H/vVtqHbDaVqNMm3j+/Ey9aotklLmxTPXPUqRaMyFKvDRZWjXGZSW6r2Jshc1rU2vXFZF/YRKtvi8OBMEWeI2D68s8pS/7DUsoGrIrjMv5Y7PM/AxYFNapN7TZbS0tHg4OB+hkfz2lORdQ73q5yAkfv3v/+eUddOhPTqtWLHy2Vda9IbRyjU5FkNPjhWcFVFdFapKZmln9POA+DsEo+5VY+Uv8EgBCsETkQZZY+Jm/sOx6+hk671GwEf53C5SYoabC3xtcY2AlGWCF3Sq6Qy7tISrlwWGolLmlGW2lpaAvYhSbtNutzrHU2SCVAC5bmFrdfsfQ5f62dGE0nElsNRW0Fa4Y6QKwk+Mm4ULJiEKD21IkmLDXHvtltWJl5ONy+jWqfetiw4m5SSJc4mS5+HpFxDQtRnMVlCwoxIBlrZ404TIdYYsUfLlic+H5HMqnpi0zyr9Zim+8014kWWJd6AP5Yxbz2W3HvupKC3JmvA9cdff880yxjAa4UqhddwAIy152ghpBzOWuw9Aniur7zTPCTCMGsMsnZA/1kvGuZwtdie/fnCbHSR2Kiemjb6ezlCJFla3nvNFQj37tQYS3DitZWjVkyvL78W7WgXaZgXpyfh5z1GRu8oo5cqb5bytMDZVeni5ha4pesno8ZQcjqP1R/TGLcoh72fn3sePIcitS+o+Yud1Cjhg7SGaVFOKzKpKeNq1rOVlOdxArdniZqCXq2j1eKjlgYlstRm0BAT/pGQIqVLy/re3AVquSxe62OS38HY4Aw2/HvJPVjaCVMPEubGiHo29V0p+OJ3V62jxAMF10thA5E6VOkgWWo9JVSa18G5cNcHhcdieJLnlBbVemQouXWHlu1jEmzUhgGsNwsuDgtHkNJ31Npl+jw1DrXY8IESOLBQ76TNJiX4ct+Z8zu8hley+SFi/701I4fjkzAeSckDA+IODuUWiucGSUqW1CZ9z5KbW6SNA4Sm5yJ1OM5YvHBS2Epkl8OqIRIvkiyRfoksNbapIRIqSbAsps/ZH0damFApW8J6lJzcIzkYmCJLjX44H6shOc0J/pJkIOlwrzVG6uSep8ePb2CGiQejdlIBGkqKGC0viKI27nv2xXLKTeNXewgu3DkB310Sga1YcbkNnc5ydqOm3YBtWXrkV22J59GTp895zW/vw0GPIkyI89Z3l8NNTv/Jbmq3DVu2ntZUc95ndO49DDINZulMwFI/gwOnPQ25lkwoDNQRTxbFUpGeU673RBh1cEGpYiiVV1w2XOqnWfdCg77rDd7Gyi1T+XVQ6wkbhDQEiydscklCbSapJYfczZSlgETt0bf8To4kS9i4iqp0tiWVASa9yLPmEz+izJUTUrKURK77/acD00fwzShzzWeuXCn1SPEzc3fRJPylS7Sis+dS2UhVHJAwqXMKa8mEspd0FKCECCx2yQfMAxl8PDJJzT1V0ixNS5KeYuUDaYuLypLv+RW6IYELvLnv20s+LM0Ia9Jqyecj12JZ3j+XNVmel5zu2Z8vwtedWbP/Ei4ucETg0Z5nKXXa3HFuVBDBpK19P2sJWzO2UvvUHm0HxzoCF/692nZU6b3T7+w9DNGahVoH0LtHaE3prbgsY9Jql4dHP1KapbcUKvPjsnoPvWl1Szlpbma/lMnW+B11IhD1O9yzpVl2yda8fNxyQDT+XMiMseVFLQ7lTR7e18lax8Tj7uiasbaujbPcS92SLKU3fNbacpReqO+veVepXmpuRrVgGslm3ImydkAlJNHiWlfv63Ktz4vGWmOIFkzR5G/BrQ0ILd7ZKxBZiUxCWh53a/e0gSlTpkyZMmXKlClTpkyZMmXKlClTpkyZMmXKlClTpkyZMmXKlClTpkyZMmXKlClTpkyZMmXKlClTpkyZMmXKlClTpkyZsg6Zm9KnTJlyK6McXjKJcsqUKcOSo+a2xYck+2kmU6ZMgoy8i2pmlFOmTFktQUrJMeJq6LXJbprNlCkPM4uUSiLUUa71mBnlRo1u9nimrDGTnJnlb9m3Us5WyMTS18HXZU7inLI2kkyfzd08OjPKCmLU9kFGJRMPQ8M4J2FOWZPtPuTMcu+tDE4hkCCof8d/B7OwngrxnhmEUTk9exLmlGipKbfTZ+Gfa/zI61bTln6zjyaTRArw72sGPIoMc7fPld4VZ8Ol34eGl/v+KeM5TDQmTyyeVVDNM7C+1pggqK+05K6PzWWREvLskepLrsbVkqTFMCPwbXWHBdbLVloZ1owr9zkrUV6cntz5/7Pzq9s/v33z6s7fSa8pxomSBieHo+VieNMdzlJSwJHo8/vL5fnLUzVRRgxMToFSwvMKBN74PIxzVDIptXXWiA/ikuqpdFe2F0lCskwkKSXK3DtocdY8w0N20pdMPxqSbFF2RfVtrCRZ+z61+EoOsqW1cJ/fXy6f31+StrlW8teuWcS+GaVfSJI1utJUXWlscLLVQ3ZaMpEApEjEA2C0MWhbARiflxI98VFksgWyhGOd/pwCzVrwce9Z0hNFINTnRgwemCw5fVF/14skRUTJAeSyxiiS9CLLpJj0HC7ScRlxK3xRBroVsnz+8rQKX7KDUcahJtBSnx05wy7hpIi+J0lmiRKTSY4s4c/as5IcNgpfhAI9SvASWUq+Y8TsLGdjFFniH2uQoJ4VOT4U4eMgT9nfmlsQcDxHIkmWKHPK1/YZWhlRi0i3BmPEjW0u89IQALW8Q/rTEpum3H375tVt360WhyfWGv+Cn7UmLa8vvzavBnL+NQJJLotgHSX1omn2GgODM2ZwwJ+/PL33GQ+ybJHBlrBFR1nrjF5p7Ztk7OBSkJFLdcquMHZuNtejJRK9Hna049CkS4Mkuko21sqnwohSY0CvL7/eGuTF6ck9soRGNXqJgN+Pw5aCQPqzF74UCDycT0IkUkLR4orY5w6DgDT4Qv3Bv/PabQXxepFlKZhFZVvJtmuDS8kGJc9Pnxu2R1k7yNRASEmE6gdyRtOyj8Zhe/7ylMywpQ7gnRknR/V4biIT6xIc+NnRZqU9iQDitRwEk+wH2lFqD3Dj71mhRZTh14cfR9eHH0eUHWorNIwVPlPTCrK2hfaSF4RsrlUOzL64cvm+wZ4sZ+dXt5lD+kz6vdLzononluhPOePZ+YHFNloZgisDr5ZJ622blB4ix1mK7/rw4+jpcrh59OT4jv1hW4+2X2kmbi27PbYt46q0pnJLNiitdHalSGdRREm5ECgX1VPvIv0uXPBakwnAbAvi8TIyqDgLNo9MZ+R1dPC9tFG9Zlvp6Pis74wz0RatrZq+uaduao+Mcym9YcpsIRGOLCVEggmF2hXgQZZU2VyLS2oIOWwtjIgy2pZZl5Usqck1K/F4lt4Xpyd3nlezMkObTXoFeW7MXl9+vf2J+h7pEkPPQKBpCYl7lNH9kBKhREhk5iFxwghsUNkeRBDRx6shk8/vL+9MqnHvBwk1EgN+vva7PLP/kdcxQ3yRPh1li7s1D/6UMsFRREFF5Ugyge9hIS4Y7Uuzp5K2TnS2nL639S4oOOGjHeP0+yV/107Iwd+Da1dbBWMvsizuzLFGOso5R9m9U4stuvdiwYN3NWAS4IyxRFweZEI9X0om1BpC6p3g8x49Oe5Gkhw+DxvStnW07+qd6cHF/T+/H5az86vbH+qdJT6pbXGVxlrquzsvosgZIme0oy8yLQ1gNMHUCkeWayETGNCoda25rHVZFtYpRw6KlE4iv5Oa0e4V9CXVxsXpiYnQoW3gyVTJd++8ym6cMeIvxREj/Z7VGV9ffq06j06KrbTX++L05J4j1xqaBhsmkxKhUOWvN5nUEoO0tLNOMFhtLpJAHj05Jlc/aJfCaCaCcst+vLFCbCWi40iLmiyzki/3Pl8+fSArnH2p3JEMPF7PmCvzfsnddZI1oiXJhO3Lpw/Lt4/vstgwLk7BGBd0yKj+i2YSIPcePUlS2jOCO59ykrDknLKWJPEJ368v8/aeG19YmuYIRkt61kwy+dL14cfR0+PHN62ubMGHAreqRKnvTJyA5UirQO4lc4rCxvL2zavbv9M2n+H3W04E57DlBl9KMhQurRGn9yhllNwpKzkygY4LHV6jZwmhUM4lsQ/qdG68dY2bzOH6XhEkCd9ZqmcOo6XHmGtr1WaSkkBsOYUdBxgN3hr9WRIVakz2li+O2Auqzb68SwOcOfeYiZOSJBZ8XJxkKReX6UT1JXP6TQGGIg+8M4yyg7PzgzrT5LByO6m4d4aBwVJBwOAqJQ2rbXLtlpydScfDije6XeIlxfsuvGbCoLFS0VibbtfcL+OJDRv52fmVOqOyYMMRn9tmWgooONJLs7BS9pQr2TRtAO45uHcHsz6YJXO4qODETXDlngHfOTdBxmWUpcw+9/fWyqhEkiX/0NyXU8Kn0ZG1qtFWdFSi4n4oRm76X+IALbJJK8HmcJUipVTZWmxw95R0lxHeFZQz1FJTPfde1kOd02EKkh5msiO4Rk9Kkh6ZGnz2z++H8Mwn+Zd2TWIaf0hyUXvtnx4/vsHvR/lHCYvXbiCPZ4hvYdRmXznSKJFkru8ScROjBlupbGiNrdRLKkVWKZnASFv6XaqUhJ8vZWfclcjUWJcyOA0uLTFKAqgEm6R/pyV9bFeaJCHnF2fnV6Jqp5Q9SrFY5w60VV0umxQRZc5gJWvxsPI10/q4Z1eTDWqxSZSIyy5Nr8gTW4lMaklSEiAkpEJNfmlLuhJeK7HVEIiU4C1lroVcMD6LXZWuw60lypoJnJ/fD+JgLTnAWZKsHHk4Y0tpRZRbwFaDC5dKmnfLfW9p1tfre6LGXUuAku+ItL8am5JiHdmnvMbraA0E0+NS+61gq8ER7WQaMvHEXvs9Ee8tfVeJPnv4Syv/kSyvGo4op0yZMsWDTEcg95zsprqmTJkyJS9uLB5dRs3IN2XKtvwJn/swsm/NjHLKlCndSBL/edNECcHDo9W3oFR8Os9ItwhOmbJmgbvJRvetaqIc/SKriWvKlPF8qvc93V0ySmq/MRyYtQqFa3TitN5bPGVKj0xSQ5i1d3PXyL7GIXPRwfvO7dZkw5E//J3Rms/YcEZ8xy1kRElGWN+7Rv1S5xHkuGKEoL+f5i+PfL1uorS2CuAl75MwfQmqRyCyEEZvYsX2p6nI8LtTn326HJroYO9JJlt1iDW8L2VEcPmFB2HOZVL3D+9tRZa5QFg63LkHuVPVzZdPH26TjfuHw9wP7jmCbC076yB43mK4BtIZOZssCcRjDQSU4T9EooQHKCTSjB4Lzt9yl7JRdym1WpHCHfTx7M8Xy8/vh+wJWhAnhfnz+8vbn1WV3qV+gybijZalaHspORJpgY07vJfKLrWHG2CD1T5na2QJr3htmVmmbAySS/ruEVdqlO6dyt1XNVLlaibK/N0oJ+w5f2vNRJJj/PHX5fLszxdkEGiNDTsGvDaBI81kuNIAxjnd7X3cy+FB9EDxhVstrgzh7kValmVZEMGUSLJXjz13JBo+apB691Fae3sP5XEGg52pVDb0dLqcoUFsz1+ekr2/Xtg02QMOXLhvKSHI0Se1emZN0VklNbkIM7ZRiSZ3DQS0Sc2tj61tcOfhnKWb4PB2pTX1NiE2Ca7W2PA1CzkDSu+Xjt6HPbYSScK+0NYm8GrL8BYiGXNsC9RnPG8IkEjugF3MG9zcALbp9P8tsaiIMjlTrk+X6zmM0pjNlZqS+8lLuDCxRJaDlKFAw8JGRhlnbt/tCPoZQXq3VSR2+OXTh2EyMCqr5K660CQYvXDspErD+7kToeQyrlx0HMX5MK5Elpb7knthuz78OKIyyxJJcrONo/WHKFtsSVx4BnkEQsV952VZlm8f393J4NLv9MjAuKzScqUIlUm2xqKa+dRczK4tIZ6/PG1+3JInLg4bVG40Nkj6VL9HE9RyJNnL8TxWE1iuaND2gT1PPC9dR8yVs/ga3lF9S+tjvY5k20sAU7fEae4THjGdhorUXt5Uk/lFZ5ZpZhY6iSXzTzqx3hceJZoF11xmKPm8danNoyfHobtFpL6SlhDh5Tm9lq55SM9zK3fWMoJKoSX3N3OKTpG45a4B6Q192nupe2Zelq1iEgwUSfZ2sNtVFYJyN7c6YQ1L1qQEaUlY1oC/t82ZTw/CJHNxenKnxychFqqP1ltyGaWGMHtlySlrgiVXblJKqifcG+qxZ9h6mhNuSZRaC7ULt2t3v3DfX2tT3E4daDveAVvakyxNnPZeKbP3JJNf6X55PVRasA2JtXd2kiPIt29eLX/89ffy7M8XWVy4H9mytIFG/vn95fLt47t//o+ewNFkyNzd49JF67lF+dqxgUuU0nhz5S5FOLmZYStJQnvXrAUcRe5scX0gGwiaZZS5yJAzFLzAdJSj2EqR79vHd8M7QMoQnv35gl2OcXF6cmfMrZgSocD/lmakIQmldZyeWYzlWVT5bRkT711oWqLm/EjrX5427plVpgDZq01wJDU+akInl5FRvZKkNO5ZPWZQS7gwtlIPCG7ZSs9slVFyWKhsGW4xlToH9fuYdCW/A53i7PxKND6p9MYlM5fFU44v+ayWKCAOPN4W/VszWmps8TZirZ697BbaplS4LaItfaqq9JbMgOcGH/4unHFO5VMP0qzBlYvcrQ5MsBhiapNYnTFHSNQpN71L0og1odCJk669Vk3ggy8s73RxerKcnesrthEO3aaySziLX5NZWnzRdR0lFxU4ooTERGUg0WTpgauET5M1eRJlGlcJNolDRhGdtD9NZZRwcqO0/EmyxlWDT7JrqyajTHqT6qaka8rPvHQT5WdaG7UkNVJ8oh6lttfg0WuDfa+o72mNK1IghhweC9ao7KJmyZWGJPHvr0mk22i5AI31nfqZLTPGWrKN3E8v5Ze9BqyWtKCStSWA9fxEixKtuOC5hCV8LTDA0i+VghJizJV5I50WlLJa6/vAY+hyrYMRyRLrR3O8G7SBNc3IRxGk5boU9fYvS/oMm8rc57FDtyzFrbigMrX4vKKtpMTx2HkUZbQa3eKdNVTgKkkiSlh2W8gjqvS2lKpcbzTnU9668fSvVicyabDutMrTOpcVNDVbF1GGW59Zg83j+zWtBHysWi+SpMo9rW7h9kxrVokzUsuzvPQf0XqpDYot/G40KWHda5w5ah90ms2ieimRpYLnZI4m3cc4PctyqgwfsfyxTKBwpbjl2R7fP0pWVGqzzHI7bzfp/3MHMO+iwEoBl86vjDZob0VSxpr7TETUhpmldaLKI2O6OD258wMDIFXCWsbAehWDlz1FOrbm2VxQpBKQ2mx6bULZIcZP/Zs6o/RQbiI9mOlIDAGvz2t1j6/WaOHkk9bY4ZUZnssxrFWAh/NTRgfXqnLrabWZFP7OHuUwnNTrGcBL15gsy+87n7gzZaPI33ONqXcbCL4Xl1Xueil1pP5OFD4tRs+rRC09yVZ6qXGYL58+LBenJ9nzBqwO4xVIPcdQ8izN96XDfXOTj96kL12GF2F7uYDNBdsmGWWJCDx6jyNfkzpiu2ALkmZO04EqOeJ9++aVOJP3LD2jgow1Y819phSsemXnrUQbrMULzq8PP456RAS2THXIvCJweZCkBzZtf3KtTpHLLHNEkf7dumRG+nuWgJ4+A7+L0w/3971bAVuT3UgvwzVc1yY55yth9AgE0DklZLkmkoQtBcluFGqcW9mXd9WD9bQmvUXvgovebbTXgj07vwpZKoSNV7OI2EOJHrhKiqIwRuOLbKDnWiiactG6MLv2+K6RiQZe6wHHeISJo1pMLb9TO16cTewsYCkjXXs/oxZXqeTmlBVl9CP0cLmxg2OssZv0OYog//ev/zSpdjTld5QOJZNuNRNzkZN6qdW1Nv5oVnp/fn/JGpikl9RSWh+SEUmWpV5ltIF6PR+SBp7RTySZ/ut1YlLPUg/ibrnWcXTCwmsiJfwgCdjp97jesnnW+9GTY9VeUnj9wxoWuUoPEuAOqoX/LyHCqDIc7tSJLsWlY0qto5VkwFSLBGaS//6//7pdPdwikHm1OTxLT8q2vasTbJMlP5McI1c7DiW7qFoexC2yLpFJzUGu0QdkcCdza8vtWnwRJRwmTOkZhZyBnZ3LlnpJDkWxyNs3r5Z/n/93+d+//tOEJHEvleohRpbg6WBr7bZNKVlS47OWu3PgZgZJ35xq/+S4RT0I1P5oKlv546+/VSe0SNk+6iIyKS78LlIn6Y0vYaQy+ppILiFbbhdEurBN6pB4IiD6RJocScL34bYJRuqRC+qlFReasYm2RVxhUtfJWBMHqT1KTynb15IJJ98+vvvnKPqrO0rKrQfjjn+PzLYSrtzRZFSJTG3/yjljT3yYZPC1F6UtbJKerSRo4DGuIUnJe1mzV4ogOZKkCeikSZ9bGvCk44UrxBbZZO66CvxvqpPil8NNLvPWivnOnFzWpXEwaxnSOqWXDLZHn7FVtlw23qsqgsGky323hiSlwYzbllfSTS7r596zR8+XImzJ5X7WDKy3PVr9gktiLPMkVT1K6QRB6odJellU5tkywiVcEiVqDveAvwed1nJ/hxdGie5K71Qyes4gpUScez7OjK3b8iiCzK3tjD520INwqGDH3Xt+PwC1m2yNmGSkKkR4EwF/f9fBhyjhrKN0AOCfJSzOvWwkidTi0hvHoWuWXDJOrytBue/xvHK01tF+nWh1cLW3Ee5gKo1xKUuP9jfJSoyay9m89WIaDOnq+prBltxjERWhpbio3y8ZZq9WgnZHhPS9oq8N9dzJUTqbUZtF924Rld7DimMkm7S8S+65pd1B3PcdRYFdy7KCh4YrAmPuOZpg0oowvYN5TxupfQf8+R72HTGOJbvT2uX/A0Ina59yJCbfAAAAAElFTkSuQmCC"
      }
    }
  };
  var _dogAnimImgCache = {};
  // 시트가 있고 디코딩까지 끝났으면 Image를, 아니면 null(→ 호출부는 기존 정지 스프라이트로 폴백).
  // 부트스트랩(024)이 이 파일보다 먼저 drawPixelScene()을 부를 수 있어 DOG_ANIM_SHEETS가 아직
  // undefined인 순간이 있으므로, 함수 선언(호이스팅됨) 안에서 typeof로 방어함.
  function getDogAnimSheet(breedId, stageIdx, coatId){
    try{
      if(typeof DOG_ANIM_SHEETS === "undefined" || !DOG_ANIM_SHEETS) return null;
      var stageKey = DOG_SPRITE_STAGE_KEYS[stageIdx];
      var b = DOG_ANIM_SHEETS[breedId]; if(!b || !b[stageKey]) return null;
      var src = b[stageKey][coatId]; if(!src) return null;
      var key = breedId + "/" + stageKey + "/" + coatId;
      var img = _dogAnimImgCache[key];
      if(!img){
        img = new Image();
        img.onload = function(){ try{ drawPixelScene(); }catch(e){} };
        img.src = src;
        _dogAnimImgCache[key] = img;
      }
      return (img.complete && img.naturalWidth > 0) ? img : null;
    }catch(e){ return null; }
  }

  // 84번(원본 해상도 유지): 같은 24컷 시트를 1/4.4로 줄이지 않고 원본 픽셀 그대로(1:1) 잘라낸 고해상도
  // 아틀라스. 칸 경계·색 정리(5색+혀)·모색 재채색·"칸 안 가로 중앙·바닥 정렬" 규칙은 위 저해상도판과
  // 같고, 축소만 하지 않음. 다만 원본이 경계마다 중간색이 번진 부드러운 이미지라, 팔레트에 확실히 가까운
  // 픽셀만 확정하고 번진 픽셀은 가장 가까운 확정 색을 따르게 해 경계를 또렷하게 정리함(12px 미만 조각은
  // 주변 색으로 흡수, 떨어져 나온 60px 미만 잡티 조각 제거 — 21번 컷 1개). 마당 화면 위에
  // 겹친 고해상도 캔버스(#pixelDogHiCanvas, 660×440 = 150×100의 4.4배)에 그려지고, 이 이미지가 아직
  // 디코딩 전이면 위 저해상도판으로 자동 폴백함. 인덱스(팔레트) PNG라 모색당 약 30KB.
  var DOG_ANIM_HI_CELL_W = 242, DOG_ANIM_HI_CELL_H = 214;
  // 0번 프레임(서기)의 실제 개 높이(원본 px).
  var DOG_ANIM_HI_REF_H = 193;
  var DOG_ANIM_SHEETS_HI = {
    corgi: {
      adult: {
        fawn:"data:image/png;base64,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",
        sable:"data:image/png;base64,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",
        tricolor:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABawAAANYCAMAAAAfU1o6AAADAFBMVEUAAAA3IQk6MirJml7538LuWmQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbDt0pAAAAAXRSTlMAQObYZgAAchBJREFUeNrt3Yt67KiuLtASeL3/K6+emZlJ2cVFAgES/PrO3md3d1IpGRjG3Px6IRAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIhNOgW+B6IBAIhH2roTUCgUAAawQCgeB6pCrbBrZtk5BqErh/ma+qhzRkxS/pImdgzc+H0JKd1GpgDax3x5rOKONWq4E1sAbWwBpYA2tgjQDWwJr7HYH1PZvwG57TAtbAenusaftqDay5WL95jZYMrFHEwGvxc37b11T7IHvXph9rA5cFpXyQ038q7f5FTGp6ff0K+cA61XdsvHAhfHyY++rfjfXqapBPo/GivA8IdXwaYnwRv7QasqOctfAKh2HdWmesWt2U0IZYJ68JtN4G6+CgiMdjbQsvYC2utCdjTcB6c6wJWANrYA2sEcAaWK/Pl47DmpMRZa2mzUrZMtZ6X8v8ii5gvSfWlB2UFZvyNv8cgHUSt1VYM0q5/6PMYn3O0vJaQxanaLuI899UWkLlnI3gVfiCbSKF8ie5xvr6L/qwfl6S5XcccQPUqi7Aem4RB2FtDR6KeFa1toV1ANb1tO5W8y9NbUEJOWrJwBpYm+tZa+Vcq9ebY/3mm3usH1bzN53T8jFe7ZYMrPfFOtOOj8D66J71tQvWz2RExUjLp13HYv3nqlzAeg+sKduOr7Owvuzh9fiW8b+4mURaZewe6+snZPXBwszF59+XZlG86/xeFYNYq+pqdyvyrWD+Kw15Rb0n+NmOrWP9N2ktrK9E0rawjv+wvmRYZywC1rXuzgqsU2kIRnMSSdhsybnv3HlYhtHt18kilk+H1xuyVaxbq3V+SOAcrL8+wl6+bb2oW/HxsSayhTXlWnIf1tfJWIeXwYbcjPVnijEaLmJFrNNUG8b669sltW7B+toD688C3BDr0Ib194ccgfXqFT1rsP7TefOONQmryOUH62fSjNE58nNzMoD1gqvCxLqpVp/Ss3aJdaoZSxry3ydtd8Mgl2A70EfOl0OsL+nIrIt8l2O95KqksU50vApfhsqlbBJr0sKaqssvzTZk7pdNpfgzKmqziHPVugGvnF1esL6EZZxL91isi1abwPpidhKTVl3WsdY6iZw4+6/d97o+U/wzJmq6iAtYs/BKlurGWFdGQLbBWlj7M0171VXJ12oR1vlk7C3dK0wXvL8oofOjdm7IxXa8E9b1an1OGe+A9aWC9WUPa94G+vLqJm9Yt+2wB9YnYG0ar1IZXy35XsD6VdwjZA1rTrVm1OoArF0PgzAasiusrw17msC6D2sqYm3l+YpZygKsr3OwJudYB2Bdnolxg5c21tcBWGeOzX1PcHOsr8sh1m1bkZMzi39WSTzOQ9kN68s71tdhWF/iMr7Owpoo/fYXEo4bGCnlHqwvB1jz+h/1/vm/jb4b97quE7G+gPW+WFMtXGL92g7rj920fVhHYL0l1te10zAI+b85aWL9X4tlWr36qnT2rMk/1gK2gPUewyDX3liHys2pqQe5Fda3kc9Y0DqUL4lprDtuPkaHQUQPizWsr3g/SNhjr6tWxNe1HdZtOTvCmpPvxzH0m2P96GEdgnWoJuQE60v0Htn0wPe/Pdj7YR0Ow7raSh1iLehVb74p5vNx+G/8bI0zWQtEMxM9tdoB1oI1IZIt9j6wpp4ito11C17hYKyva/sJxpLV75fK1lUpV2pZF+S6nGMtPfTG/1ZkMdYXsHaI9VV/dmI2Y+9Yv5+8+Kl1AevLPtaPdigervaG9cXHeo+tyJxO165Y02FYB+pvxt4Pcso6fbc6cC+K0571dS7WntfgXuhZtw3uOSzj0GP1Hkek5rFOnunmCWvG9FM4FWv2WrZ9GvJuWIczsK488Ydgj6X1WFu8Ktzt5vW09sD6OgxracXdAWsRXg6HQfKHdZ2IdeHV5DF2VQBDWIcc1uEMrGubNtlb+iznG6RwbYB12B3r/EtEgHV2vNp1zzoEtWIG1pv0uvxgzVyf2ZPzplgHYG32qlS38ykUs2esaWesw4FYh7OwlrfiAKwdYV0bim+r1V6x/vzO/D19rl6YewbW4RysO+bTdjobJHfqvORiWFxnHaq96vrQTs4/x1i3LFl00OtqqrvOsQ5HYP33Kze3YmAtrQQLse4o5iucgLXnyafkHVlQcT1iHWp3p/ozsKeNTz9fWRenrbCOwntXednrEqzrtbrlnrwz1g57XaG5W+3nPOtkvW7vaV7BG9Z9YyDmd+WuwPqyhnX1+akB6+AT623OUVBvyA6x7llk6+5IAR2sw8oH/hFYU0/pl54ol2H9sX3+tJ61aPs1a235fg35RKyv47AOe2CdbLxxE6x7rfbds2bNLvpakwqsh/SsLW4E0qQ6faCos141w2rx1VhmdXG+VLTLK5mWvUb84u7oI4o/r5CQb7G31gvRdSusr7KqesWmav1+T39Zv0M16PT+YhWfAyBjsV6GmyrWwfacBHNHH6c5O9rtlb8hd02Mm7wdM/SK21VrYM2x+u/VaSl9M2P4uj1r46UMrPvdClYnJI7GmnlmkVhrv1inxzBj29UIRsbwB92TvWF9SR+UPUwwDsH6XsRW27Eu1sEJ1mr53pfyboK1bJt5vrkvx7qyh16aVnDdsw4du9sMGsZqyKGtIR+C9X1p6wlYh1A/K8eX1UWsSaC1AazVmrLdUmYebBS6jro9AOtgv9Ol/jhhHS9OlwtYJy4GFbqr1rB+nYp1+D29WzwGwtx/bb7btXE7zrZAYL051h9GlzvWMqwXX5XDse5Z2QWs7WN9WM8awyCve1/6E+kerIMdrB/f+kisI7AG1r6x7l9ZvAHWica8D9b3763ZlM32PrqxDsDaA9YKK21PxZrcDlczsc6eqVlcOLEMtzFYE7maMm/d4Gb+fQvFvFXc+vP5TrBWStr68hdgPQJrEzdrCdb8zExiLT0sQ3jKj9nkc8UWt7sd17GOm+IlwJrEzdgp1gSsHWNdHMxs5Ovysr1NGeuwDda0UbUG1v+wzqwBAdYnYx2ANbDeFGsiT1rfloGU98MAaycPydpYB1dYv6deyrZeyMDaOtaZpcVb5Ju/BL9nZlZ2MMaNsI7AepODFBqwpj2x3hevMVgHjz1rAda0A9b1NYl+S3kA1sbXdWWwzs21yehyhHXcGK/kUsX+fMPePWsh1ref3gjrAKzNYk2heKqNTK6zsA7A+lys1w/hn4p1beHxfljfijCLtbSfAax3HgbZGuvnT5lfrUrHYV3QWg3rl1OsRQN4wBr5Osc67oh13Anr1/ietd10gfXGWD/yySxYOwLryLL6/ccc7AO7TzmVlpED61rCP/uvzbbjUNgrsCHWB+H1kS+vFe+LdaxDLW/ohrCOtZz2w5r09iKbXdaVXQHSV8C+sI6b48Vtxm2TaltjHb1gTQdjHU7CmgRY//0/dsFaVKu9VmsC1q9PmHlWCxr7sqvxUWIRWO+INQmwDj72Bojw2hvr2vr5j3xlc2obYB05YbzKfxRZPaHbowWwNo81ye7HOxzrLM15J6xDYHW64j4TEydi/f10FDXT2gZr8fY2iw05MN3yf5KTmK774GZwi/VvLgOaMe2OdfSBdZQtdYnBfzGfhvVPLqrN2PQLJr5zjrR7H4QqC9ZIB2sPYHdhzbsmZrGm/v6X/VHcu8R7Yh2HNWSD68rn4XVGvo4OSgXWG2P9sXQvAmv5eIjNlyKL8fKaNLBuwbq0R2onrOOmWKudNHgW1nQi1uQfa1baj5rjE+vUVaicj7MP1pzU7h/qGWs6EGu3YwKj8fqq2CFYqtcj843bYB2B9d5Yf2zAPgdrQREfhXW0V6+BdQHrrMvbYa33/ASsgTWwZn5x4SfX8o2nY506f6/2ZkZnWHfOnZrGmoA1s5A3xLpvRYA3rDuXQRyIdeS0cWO1unO5iwusq0ey7Y1152Im21jHvmq9CdZ9rTg661l/XxA21m136yWzNCSYPJUUc+pCGcSau6fvbKzr92OjM4xjsHYwDBJ1ijjtnQ+tH6nzna7cp7+vyoqLQYLJ016su2NA5g17kYF1voSttlWt+1Mc3AlprfA6zbiSbrDYjLlYJyFqf6ha0gNNf+1sIqVx3VIxPzunq0s5v718e6y1Hp6G3I7VLlz+nMyuvWxRMeu61dTXjIuvHGzB2lwzlmIde3vWEVhPLuXfl3tzrXZ9yo+ohPlTLmMa8jCsaxvZSI5XZ9IVqEVXRI41ics4OMRaMjogKnorwyAtWDMyN9aOKfAPZPtOvOWkVAMVOlvCig15T6zjfKwbp22VsGb4dQjWH8Wf673thnUwjHWMqke8bIz1nPuxLayHJl3HOvZjHQ1iTcBaEWtSw1qRr2FYDzg4IgJrYL26Z02aZazZjN1gXThU2AzWP1MxCcM6VolYKeXne3GUsdaZcRtcbe02ZBqWdDnl1huUFtaUWJ3UhXXlrzf3MX1pHQfFmuNwimsFOotY/toR/tiCXsZD9iLbxtpyQ9ZJfjBe6o+M1If1v6Tbt+xNbMfz4KZRYq9878a9GIH1Vlh/Zx1dNORHU+6t1qNyjvpokcL+bl4rXl7Gs7GmsVav38cYgfVKrNXrwS030mzJdrEeh5dprAlYj8V67fsY9LEOI8If1oYeFc/Fuqa1WaxjD9YxW9RLi3cDrIMPrOMRWGusm+/FOgwdxR0ydmsda4VarZv2YKwbuyLDW7FzrJe/6Uw/KcOFXMZaaf917LR6FNbxrddl8NlpBdarqjWNHQb52GdvpRX7nmHM5LF4TYhBrMNbxW6/SKOwDqoXYML6iLYzu0ZjHYZiHftq+UCzRmFtrxUnr8KEriipX5I7RsBav4ynYB1cYG29IQflhyjTD4yfdakVa7WsJ2JNE7CmUVfEzNZzo6Wsh3W0aHVQXxjisSErYT2oXzUS69CEtb9m7AfrtU8H+h2RMDEUsW7cixzCdYuBSwXUqsNhWGt1r6dUZYWetb9mDKwPwlqrLmseHGF4ZK+/1i5pyYu1DvPjPKxnjFoDa2A9b2nq8lobgPU8rY/AOjhZFQKsNcoZWG+PdV/mLrHuKHSfzXhG13rYSNiCRXzAGlgbdAtYT813WaIGZTN2z0kk5ac6t10cOda29hEcdT82gHVwhvV3zk2ZAuuOkl+3gM/EdrZxzbi0fq95wZd5t7ruyF6xbsdrndP9XTWNAxS2GQfZFeuXN6x7uteZDX2WTr3Rx7qp7i4366ROyKFYj6NuyjDIkjdlu8K69RIBa1mG682iFwHroZ2uYCBdU0v3rM2Tusa64342BGs39dldQw5qw/VO6rXeiWVnYz3zyK4lBzvZ7nQ9t3sNxdrkiSgrbsj+sX55xHrrMv6vGb+35KFYT5usWLImhJnhbJq//9UQrO0v7hpwUohZtu7FDqxH5ruik/X8NzQS64kteirWwn6lU6wbW++Ei/CRMakl3J766FLOTUisxXrq7WjlsI8drAlYu7U6hbViM1bCOjjDWjTSs6Yhh5FJW+hSJ+1SzNdYusB6+SqXAWV6P8ruymH9++eXYj3q+XeaWz56XYHm4rUCaxqCtZnhnky9pp+/bwXrEKJConQE1qkdhJ9XI+qUsQmsqxmPwtrOuG26kOl5R563j3HRPHncCetavaZ0GdNyrI3MKznF+vNp6Tis4zK4ZjXkHNZRNWezvZD3L7dtGdMnad9f4N930GZu0VuCJ2ltFGtKlXH3/dgF1nQG1nQg1s+K/fPndy3jn4Q/i2MrrMOZWP8Uc+J+/HVH7jrj6DF62/Ver/GVWnf8NppryL+rJB5Zxw2GQTjFfMNaZTrGUBm/N+Tw+fWAtatCzv2VB9apL6HRvV60BPcz23gq1o+GTL935L5bsnmsP2pff0EvxbrYkkO6JQPrsdkFM1irrAmZj/VfiPiVWnXyKdpqyLHQkBUyX411sZiLYwLAeibWYUesw5z6fMOaxmC97NiI2FqpO+eb3TVk51hXU/74ahN71mF2Sw75lhzjSqz1VyrSqVjnPQ3zDyibgXXm9hT61zktfHpqbcjdLWDlDapWzMlS/vnvG2Edq0OOu2A9R2yDWH/N+1U43RHrzHeah3VY15DXYb2sF6JbqW1i/ZNVbi5/K6zDplhX/17la80cs56UdO777Ip1rJbBbljfeiFxE6xz8zDVeg2snTTkayHWa873ibyMl8IVTN6R3WHdnLNHrDvrNbA+BmsaXZ7AGljPyxlYA2tg3YV1ANbAGlgDa2BdLON4GtYRWB+BdTwM6wist8aa08y3wnpYwsaxjmdhHfPfak+sh1Vrq1gTsAbW+2FtIGdLeM3AOgDrgeuABp+XCqyB9clYh4Ownr7E+jisB/evWdmp5wOsDcIVjsPaGF7AehbWYWQMHgwpZjciH2BtDK5gsCG7xDoswvo759Ox/r4QO2NdrNoHY70JXK8DsX75w1qhkZfr9jFYV9u4a6xL2R2L9bUNXHW99sOaQzawFgoErLfGOl3GwHoV1jSg9lKmJZvBeoBeObyANbD2ijWpY31bIgOsLWAdgHV/0iqN3BHWQ2ED1jZuyN0XZDTW6ZR13DoFa7Va7wVr6+mOasjA2gHW4TSs+9rx8HecW+tZH4a1cro0D+vw/eIEYL0x1n312ifW4TCsw4lYN6XtGOvlNyhgPQPrCKw3x7qzlL1iHVYVMbAG1sAaWANrD1i/ai8vtYM1Jhh1cqStsf5O83ve7hysi32vzbHW18so1kWr0LMG1gtuyEGrnwms98a63HaB9bKGPBo2YC1eXFwuY2k5f1+Kr/81CK2xWLc35KDslirWpI51OAvrqFrEI7CmakOWtuTxpBWaOD/rfH68S+YE67f1wbpYj+xhjsda2pKVa/V0rL/WdoU2p0c/FY/CWlTMA+BSxTryGnIQNuQJ/U8NrH+TBtYhrmrGHrAeUei6WOu3ZAdY/25SUsI6AGtgrYH14GYMrC1gHQ7EOhjphUwp456xTGCdTG811i8trB/bpE/CmvSwDsDaVrX20rP+TLrX6lFYvyxj/ZZzwyzljGnGx0onAcypqJdx5hMel1n/GozAmpVy8VKNxzrxCNV0G5aV8uI7VE/O13v46Fm/JyzhqbMhpzeeZ+r1PKzbRnXv+TasK5mzJkR4T+7HOqzAuj7NeI3qZgZJpR7ZkL//HIXxt+RkQ8538m10NUdX7LEN+1bErV9Xlm+9Xs+0jBKr7Jusri/WsoF12BrrVx/Wqg8TmUo9HuvedtxeypTLeTzWc/AygPXUfMVYk2msqV71rWBNfy40sAbWwHpMxZ5dxsBaH+toBevm8tkD63gG1nQK1qpJ+8Fa0JYPwDoGTgdUgHX0hHVkNGP5oOisZmwHa1qBtVIxt7bkNVhPxGsp1uK2rFDEQdgHmY41Mw2+1VkpJmF9y7OcTzWNrx+R1ZR8E+57n5cE646lEVHeOD6PGgqzG7LCLVl8xSj7+DQuaRN4zexl1vPlnkLJ7Xp9/Hwm3ckTjPyCJ+7sohGsf1PtxJp9O6tjPaUB87GO3R2vWsZfHzFjE1T+q/79b8xGLOpdP25P739yqF5KeBEbr0wnc1j/wxzW6YxnCwasp2IdZjRgAdZxBtZkAGtBIQtLOc4a9pEkLcUrqGD92h7rOJsxYC0vYmANrKVYv1ZjHXfB+gWsz8E6rsR6UvaJaYjAf7rVxjoA6/2xDvtiXavXtB/WKbGXYJ25c2hj/dgBmPiVKbMwnFbISF1Uq3MLQQ/Cep7V07EO22BNwrVdmT+8BuvAxvr5M96wTu0FltZpCoF3S1tQxrI543rq/Gq9KmPJeKYi1s8b1IKGfKu9M7FelHKmteZbXTWC8WpdGMhltexdsVYu52VlrIJ1+zIhA1jHwhK6qNntosUNuYbX87/d/7EFr7i0lPWxZqRc+vmVWIfy+YvAGlh7x3pkGVvFemTS/rEmp1hXzuFLfmevWMdOq7ceBmlJmTbEur+QXwuxpn2xjtOwXn1DzmFNW2JdfPwdpHXl58ZvlHjudog6tZuZ8tSM7WAd1mGdLN8ZvZCZpVycXxr0JLG4Wue7mxKsJYu/FmJdmz6k3vg60b14K16HdaxirVS3l2Zc7GR+Z/u1flG7IbMuygqrO6s2F6/ppTy0KYtvxouxjuXjJUplaR3r2FTCfz/i8yPfafh564ZDrOvJsw48IztYz2rI7DvYsmfG8XjZxbrlfhdMVusGrOP7N/eIdWXiv+MucGWxLmycNIE1caiuzUh7w1pretYQ1qwbVMNch73nJ1a+rQ35e7HLBlhHAtY5rGO8kqPAhrGu97xeW2KtsWDKG9YdeFUG/RdhHXXzvW1vLk9yrMM6WdKclVzAujy+8laA6QvWXq8aEmaOacoaS35byL+MP8aMPWPdNPBjZRikY+FBZTJ6ol3/SrfelNuxvr1aM1nI3xdD4W92T5xze2FRA+tZq/ZKEzBdF1uAtV69kq4GYT0mK1zLx6PEmowHwGV2lJ6z8bYPr/h5bO6nXY8G3tH36exzKZRx/gNpSbVu6VM/y6l0OhMb6sUrrBUuNAFra1jPbMj0bMiaD21rc36xx80m5szIl/rKuHT9fGJdO0vPIdZ9nWqKjELeBGsC1p+ftxfWxLglL7lBjcGac+MB1ltgXW8kG2HNWdK7FdblLuSeWPP2JNjGWr0hG8SaN/4FrCVYL2nIH1jr1G5OM94Ra5NlLMj5NQCvU7GORrCuXovypmWPWNMgrJ8r9+LkMv79qyyrNbB+0hWX3Z70Fv3YhYuf85BeiFGsVYerHze7HbBOOFxdsTf7CKfPZ1qi3ivMLbva7NSUzdej7bqlsqRWs3pdQ+7I656Ql+X8WpPzkIWZL+5NxxHWf/49MbH+AHvRhh9gbQtrWob14IZsEuvWv9yN11KsX8D6tmJHB+uXCaxfwHo61i9gDayBNbD2hvWkhIE1sAbWtekdYH061t8/ucDq2g63UVi/CrenmdUZWJ+ENY3O9/tHEz83jS7WAU7AWlDIyU/W/dPynMeu6kplRJNTntuQkzfkxIWZ3IQVF6VWc6YlOedegtRbubinma1qyLnvWD3v5/nv4+fhCIke+2qrl94AlpWx8Ew9xZxXpDy3Idso5Ik5myjlefmaasjltpz7Rt2vVXltFJ7LWPHzXsdhbaeQBzUzszmfi/ULWO9fxi9gDayBtdtaDaxPwvoFrCe0Y2CNnjWwBtZ7YL3R+C2wXpfzUqxfhrB+AesxDdnHPcV9yivdSvzgyv7WAcMCA66k/77iPQdgjUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAg1gZeoY5AIBDOrAbWCAQCsT/W9AxcXgQCgQDWCAQCAawVrKat00Uh272G6IEgdm/GX1WR1D5rb6wdtWK970nAGmggVtXo8B5d1RFYA2tgjUBYx5pSAayBNbBGIAxhTYmP+vNpwBpYOy9lYI0wjTU1VugPrP9+EO3ZjIG1E6xPeJRAoGfdi7Wh+k3ZOIit9m+rfPUcFLOThBHnWJ3sWZPCR/35tGAPa4V7k6dWrJY1JcvYKtYKdfrlJGHEeX3qnuZMlPvAnbEOmVGfk7AOVnvWw8b2gDXCFNaS2v3etTwc62Cwgz0ea2NJj8caoyEInz1rKn8UsN4ca1NFPANrm8WMQM8aWAPr2tOTSay7v2H9cRGKIFa14I2xLnxH6fTg9yd9/Y/xVlwen5I/PZm/H/NqtfCTKABrhOVqza2ORQxcYL3tc4Tid6WTsQ7AGmGnWl//RVt1TPfcvj7v30d6wDociXUA1sAa4RDrqwPrx69e3+EOa2J/EHrWwBpYI1Zh/YXr1Y/1dZnH+vq4O7G+ZHoI2GC22nYl7lA2k9Z+lKDPig2sERawvhPGmnjLVWkPWCeSbcD6coN129NTxj8fWD9TZn3PHPjAGmEMa37tzo9Xu8H6asXavltDsbZ6h3r/sqka3Z4wsEb4xZqqVm+K9UOtM7AO9ke6RmL9PUYIrBG2sL5EWIdcM/aB9dWH9d9P8IP1pYL15Qxr2WhXrgcCrBFbYX25wLqSLbHdsppt+RZ1TzgIczb78FTAWjQRQ/xiBiOIxVhfrVhfl0OsL3ZXM7sOxAfW5SIm0dOEN6zlt2RWMYMRhB2sSYL15RNr1r2JXoV1IBtjXStlL1iLb8nAGuEC6+ssrDkTUFS1ej+si6vKbx+0C9aMSXNgbdayfQ+uLep1tWB9bYw1Y8zHFdacUQHGpIQfrFnzqrktNcAaWBvG+pJjffnF+mpoxte1e896J6xDF9YBWG+OtfHX84mwpjrW11FYG8+WkXXdLqosBPGF9dWEdaWY4aRBq0nBassn0lexzkbYAuvrPKyvHbGm/Jh102DXBayB9RZYV1oxetbA2hTWOqUMrIG17a5mFesLWB+AdTZrYI0wYzV61mWsL19Yh94H5OsgrDl2mcQ6SLEmYO2V6s6zxoG1X6xrKV9bYc2dlnCQNK9n3TUPA6wtdqr73jBBB2F9XftjHapWe+9ZN1ntEmtmwsDaDdadb5jIv76ePGEdmuu0y00xPY8RO/asXT08afSsg2wiBlyaGwM5DOsQ3rtd8S0y70oC1o6x7ulk7o31BayBtfF2/PjSB2Ad9Fuxn0KmbUa6Xsx11n3zMMAaWHvGOvjGOnCGrLfFOnRZ7QhrWca82xO4tFO9218DnXzB8rZYh0161v9ly7B6iwlGmdYbYB1k9+QLWO+Mdal5+2nHIW91KIRXrMN9gJ6X7hZj1qmcpRk7wlpaqYG1M6wZe54y9SQd5ttxQeqy1W63mz9fI3sC1tlSDsAaWDvE+vEW1MB+c9upWPt8+UBoepAA1sAaWBvCWvzuNsq/7RtYA2u7hRxij9YmX+tVm4iJPSM/wNoF1kGMtZsXXz+HA4D1MT1rXhH7xlqxlIG1XayZL9qsrNT0gPX9fPYzsL7y6R6BdeSXsGesG2bMsSnGidSUuytLXqea+AyL7bg0xi60OrS8PXvNvanWjFtmUz1g/bwjS8rXEdZvY9YffRBBysDautShcFsuH6DJfG8b2co3L7ZM6sztyUq9Tm/zCG1Y+zwiNVx9RewN6+TIXn/KwNo11vWdExaxrnav5Vh/TGPZSTg5oxBasXb58oHuInaHdW/K6FlvhzVjS7JVrEuVO7ZhHfxg3ZVw+VDZ145Yh9OwzicMrM2PaiZLiHPWj0es9+9Zj8Cadsa6djbSdljj7eYesL6EWLMq9RFYB5sJ1+dTY3s38/PUCR9Yyx+eLM8hj8C6cqAK1DRQzuUDYBK/5rDXVUWsEWurWzbLbTm2TKdaHfNhZX11PTl97u19kf06HRUmzb+zBphGqnRuOT0T68sh1omqDay9DtCz8Lq65iRMZ61otY+EgXUr1pcnrHndEGANrNPTEuQJ6+YqDazdYi1/jwiwBtb7YB18YJ0o6b77E7C2jbXsjHaPWL+Adc9CRQ9zTpl62p/xOVhjatE81uJetXOsbzltyRdngB5YA2tg7RlrAtb+G/HhWIdTsH6NmzMH1vaxJmD9vA7A2hnW31/xLKzvZQ2sT8A6cgesgTWwto31v//7GKzfShxYH4F15M4uAmuDO/lmYG23BQ/E2nYxl7COe2UMrFNt+aPYymd0oWdtFet7Hl3N2HgDHoO15aTHYA2nXWCdLuI7Whewdol1thnXk9wMa2KX7jZYkyRnYG0RrX/Dz6Gidf3wW6dY/0mzD+uwB9au70xTsCZgfYCKijEEa+mSn72wzrydD1hvg3UA1jKs6UCsyRnWna9RBdb7Yx08Yh3PwzqiZ30M1vKDypOnSR6BNQFry3Qly1eGdXCGdbJOi7AOwNo41t1vQzaONSWwjjGnNbAG1g6yTmRMwHo/rHM7nppfsOmjY/2OdUzGtsMglHxA3hrreB7W9ZSB9RSsSVutRqzzG2Ks1+tkvodgnXuM2BfreB7WEVgvNnoE1qEH6+Ab6wisD8A6V7Y7Yx23xLoFwervkLQaNO4t6rqWlY617C0afl6GnJkrB9a7YR0OxjoCa2DN6Vp7qNcMq/9egQ2x1rDL9KKu+8g85Ut3N6wrT4vA2inWqe8nHgNJam23Xn+nW6/VbScq/P1ow6+Kqc2mboZ1vWS3wZqYj4vA2iPWdavbsDZdr2+j1VysY0u5eGzGwHoHrKMhrPXn2qQfxvkCNBrr7itQnVwUfBlnWP/AlahLvVrb7lkD6z6syf/Ynlusm9ZaVH6H82YVfa3l16GGtfDruML6X45crPkX4+czrT00sta+RP9YMwrzFsJGqr3TQTdj1tDezIMGFbFOfuXqZ36OASaxDhOj5UIoY/1xxirthDXnmtw/1NxgNW+M/t9EpNsRASnWsrr+90ON3o//+2p/viGjjIUTMe3O6mMthC8L/NlY376P1TNvTsT63wK2OG6EftxjrN6zcql0JelGu1gna7TCrHlzOZFdrOn2/YJxrWu7FyffO4D1SKz/9ae0tSazWItKl5/we7U5BGt5xkN28xWxJvnQyfBxas2htNT3VetZK9xDR1bsVqwjH+tSDU3/axp7Z+KnugPWA1L+GPXtY2tMndYvZfntqYxg60UoY038r7Eh1v1fR+8hdiLW7T3PWMR6+hldHVgLHiN2wVpwL3773K4e5mqsJQ+LDrD+/LSiwwutbjGyjHU4EevWYYLKLrH9saaXjV7mZKxvX31xKZ+JdWnYtQzxSqcbRh84WLfdf+h4rMNhWBt5lliAtZVSzmEdgXWxZ73W6g6sow7W5AbrR+UG1ouw1su/jHXUwTr6wTqqYi0Nzd18nI/0h3Xj5IcO1iq7KidiHTVW5Z6LdexsuVrbcTl0tS+GqZ7GaAdrccrsKVVJxqFQ4q0XQhdrU1rLYYyzsV7wlJyuxJKW/O/i3I5DqZ1DuagdV2ZTOWnW6Xo7u6pd61FYxxasYxXroIG18pn0yU6w3v1JlPGQwQCmvYJfCGHxsDV7dq/SzzKF9aimXMNa2Mhvtb5nsln3MIWehwieXMo9a1rbs9bDWnRcxMpSXoU1qWGdWMT38QuP4zDCzliH8ViP7nhNxFprPMsB1mQW63H3Jw9Yx7hvzzoHr0usaRHWgoFzYL0D1mFAz1ph1qNjlCtoYR3WYq2ZchiLNSlgHZhYXxtgHZWwZh8nQFawJj2sw5lYa2c8DWsqvDTnJ9swoojHYV2s0rn/wLk5adyVdbEuy7cr1pHiBKybi3kk1rVjfxZ0rMPgZiyaTI2B2ZBHTJQPxVr+3DQUa5qA9eKUu4r6QURBa0pjfV0Gx0He5jlrTGu+OaSGdcc9WW2isQFrE+24LWUR1pbacX/OHrFurNa+sRZPshWxvvXUU+Mmn2CPXcKX2SHP71+zJepb01DFurdij9qfqzKbrteO2zuao7G2smGgnDQZxVrraWITrEmIdbFrXcU6oTWwVsJa6Rn59k2iXayVMt4CaxqFNRmTSxFrKuYcrWEd9LGmA7GmbqwpPwoyu1antc4eI7El1oqTqTEYxpq9NTzui3Uy3YaMJ/Wsa7mPwjoMxJpmYh37sdaYMx6JdamC26jOzXDlBuhjVOl0DcxY9HzM6VmrOG1lqo1ZzEo5z+pZ62L96cx1ZbxWxDrdqjJ97Y91HIXZRUYh3cs9qGq9ZK1ADevYGLOw7ljMVutlGmzDoXcm+efZyXinWtC/7CzmtSnfG/7tn9iHZIQEvkV41mP99vEfxZDP/v489HF0RG4tqtJ095hpdC2se2LaY2Jvx0sJ64nrmvqW/eg8N82+O/WsWTSN9WMIoAXr35cqHoJ1rkC1SizTQGz2u0wzXZwFOAVrjeF6J1h3VGtWMceDsf7U+hqP9W9pzMI67oZ1Yeu5ZaxDv1u+sA5qWMeE3EbLWnu5tYF9A+xhEJqL9aWMdQTWwFoPa51+psukvTxCKWJtLuMbBaOw5k4w6mKdv5DPlBNne/zdTqGDtbD0niSYG9E8HevEnFsE1kYy3g3rVCfhN9HHf2rDOrMncWrPuoZ1sbW9f20drNnll+j+b4p1cID1S7kRD3k8roxstk6r+qO6vVobxToJlwbWD37TixpSBzmVfmkE1oy3y6UeLirDl0rld/uS5ubb9PoiYXp0TKlaRuvZTDSw1ss6TMq6f1b1T5U2l3HarZ88b4vO+EeEfOLbhPVHf3wI1u+J149hYmDNP15O8I31J5BDZpU5zcc6LIq2hhw12vHIlIZgbXmkixJp9vZDVBKO46zOdzLZZa2L9aWC9fMYXTHWqYeLItbxNKzFm4Qm72ZTxdqtW6dgHVSStoU1Y0wghTU1D4M8fK4PWqtgzbmmnVg3vk10M6xfJldEDOh1+XGLVDqZ5qclzGIdhmIdM0/zqZGAGtYhjfWzX8MaB3GEdbSKNdWwphVYTxnqMIX1n8IdlOzjEIXb9wz/aukSrJeV8TqsB45Xv+2Uzn3LDqz/jYN82sAbB7GOddRbuDWs2B/dLBNYTxqWzvS6lmE9tB3/ppw+iMk91vnWmX1+X4D1eKvfMu/HOmQO0susR1uPdWzHunx8UeHj6193SEOm/AaPqT3rQb3L3ILUo7DOfE9asdx6MFwf69jo54c7Z82tDoFMxvrxla6FWPM93wJrGoP1ywTWoYi11iCueawpt8ero5ht7NTkYa3xOPHMeDOs/+b39Df9x4H1MqzT9W9LrCPFMQ3ZzA5z5iIBlWK2atfnMIgO1ia0Hoj1+9nW1xfCgYV1OBPruA/WNoasc1dfvSE3NOOZ+VJvM/aIdeLLKY7tkdWeddTA+i/Cmb8cGFofgPXQUp+JtYV1IDEyFqR+Tgv/9+WnjNHPSbdS40jrecLeMEjquyk+Li56XtTwijtynfvDgaG1N6xJdvubbfX3csxM7VN8j4ozrLvWCxyFdcveJ7V0r/Z1Ajo3KGBd8tos1rK3iS6Yi2pe/LI/1lp4AWtgfTTWwQvWH2IDa7NYfz1PUO/oHrBuoys4x3r5Tq8JWIc2rMMX0Q6xjpR7nSiwXrQQhMeXBtacbGdaHasF3D9mHU/DOm6J9W/nmuRYfy8hUXsR4zSsC/1rW1iTCaynSj0C69ULX1Rr8sC9Mc6xXv9KiQmlnAaWmdFjdbZtrMkn1nEd1iNGQFhYR2C9MdaxNvYDrKsj19SEdXCJddSyelVT3hrrCKy3xnpArT4L6zuybQk5wlorgLV1vIA1sJ5R2HEe1vdTVRrS6X2rF7AG1sAaWE/C2ko5r8T6/t0XkJ1PnkaQHYA1sAbWwHoy1r9j1k1JNWL96Ih3u1lIHlgDa2A9IWtgPR7rMBvrxKgJsAbWwBpYn4B1zSve4r12rMMxWK9uyjOwDmdhHfbI91CsX6uxDo6wTn11YG0Qa2atDiEAa2ANrCUFLSptY1hHYG0Qa97FANbAenql7j/IKS48slyY+jtYp2H9549RPXelbYsL63XnEanA2gXWBKxHdq8N1O6/9H1959c6rLm/rYy17J0L/rF+9QSwtoz1n2McgLVhrLM7Skbnagnr7nKehHVYjvXrBax3xfoC1sDaAdbtpT0N69X1GlifgDWGQYD1lliL5lWBNas5b4P1azHW8oTpL9Wv7gDW07EOzOvdWp/dYx3E86p2sA6rsK69WSMY0rppkZO4qxlGxoICXnyfWog1I+thWHNS76jPB2L9soM1M9338lVqyxOwJo3HRT9Yk1KN9oM16Q1l9pexpBe2HutwANaJcmjGeu1CEDnWwSfW4SysA7BuxTpolDGwnot1IeOTsUbP+gisCVgrYB2BNUMeJayDUayDDazVllpn6rY5rMNIrINiukoPUD7GrLUeJrbqWQcnWEuuiA7Wj48bifW6KaiQxprOwPrvR6jcmYYWLLDuKGYtrON9j+8SrEuZt3A1GmvGj/VjnbiAbrEOjD/7e5xtP9bUgzXzeuhh3a0XsD4H6/daYwvr8Ox1dWPdoXX0gTU5xfqDwbVYV39QaUgTWI8bqbeCdTgB6zAA69YX5rI71r1YU+KvELBup3o+1oKmTJtgHbgVDD1rjeXV9rAOh2FNuZ41NSyzPhbr99duvlXz9ytiA2uF/pYhrEMUDHahZ92Z50CsaTHWQQFr5sW4X00BYTmpacrmxTA8+H+4c4bxJ/3nJ3LT9Yf1ywLWjFuy4tpMxgLN9jVft4ee0NDj0txDkE6RbjOOkr5ItXKy6Hp+RlDA+m+y7rAOM7Fe1ZqzP9G3JOQ3/aFYkyWsS2tCWHXbJ9aaS8zb1Ko9Hkd5IxakmBnr67O6CetkZem8A6exfk9ZC+sordz/rnhoz5vcY60x89aLtWxmsOMpedK4AA+qt3+63kPwcFzIeRjWL+NYB4tYR2CdSEHyHPV9xUMz1pQKbz3rfqzfE1+Kde2zgimsmel2jXXR4Vi/bGAd9bEO87AOeli3d75yP8rLmzJxNtYPJf6N7xVzjppYh8TvdGx3Erfq3ulfOdafH5YazdQTeyDW1I615uOTHOvmB6BWrMM4rENLzzqOwPpj1KQVa3KCdeBb3YL1Z96JUebfD+9ajaWENW2FderDQlBty9JB69DbsxZq/WF17y6vQoJZrHue+HgV+zY9Nwbrv59b3Onc1qv++6uNaRf/uhBr3uKeYVZT12d07hbJ3aLuV1kZa2rH+jtD5UEBQQ9LkrVRrItisytu6Mm6PLnY/SRRuR3lumm5r/n9pTR6IoUeGvUu4Etg/X3vq2gdmVi3VnA1rNkrMXWX6wlbswhrje1AbKxjC9aSWcb7CI0yWR/XwATWwQPWcQTWSo9OY7Cu2CDqZpZN84W1Rs+aGrH+/ZckW7+2Auve7di5Wv2Jdfq7Pv7ugCUhiZ71OKyrpUGiexS3fBleDsKagPVkrEPpXMLOxbd/P/izQAdhTYpYF5NOledzZES+GnNTrNMXuzL22Fyp0zeAIWRV12+KmCrkyy7IcoUflHQL1jQAa61cNbBO9k6H9qzjIqw59+p8x7YX60qB54uSPp/7bWMdZ2NNgln97lnGz0Uqq7Fu2OhKvrDmt76uu5N5rMWVmylXRcyefYyFca1UlulGX1qU1Ih17fmFgXX5on+OiWhx3Xp7EoybKmD9lWq+QkfOtuGeSn1/shmwDoS5jVULazKHdWZ2md/6ukfq31pZ+w7kHqxfGa1FwlPdogRb5QcN3VME0ljHOtYfvbbi1eBALZ9kLBdlZR2fItXCsS5lrKuLFUt1MXbVZyHWFGZiTUuxrrXzMXkLpNUp3vLq3zlYJ8vfJdaMhcdNPeviI/ZUrOvPSCPWg5jDmrVyo7BJqhXrYBVr7Z511MFa9+XIlc0GU7DO0hW685Ri/XshdsU6MkYxxVjf/3ztgbBpGITWYd01izwV64QM2SmMUT3rxM8Owpr7suCW0xmVetahb0jTINb5H+2+L3GaePpX+nsi87F+P9SYt+hYUn/zpf6SYZ0+z7ULa9LHWmkx/Qqs2dMY2mDfPioMx7p8OSRI5ffFCvRbjXXt2UID68KPktIso6x51LoikVvQleM/inOZHVgL9vFJppuqHWsp1qSDNWfb+SirSfEuMA7r1yysMz+1BmtxXtk23IT1n9/rXSwgAztf5YX5Fs/BYI12KpdpqcfOOG+iGetsEbevDZBhHVuxziWdfCgpF6Ie1oLjQTREbe2WcI4xUcP6Bay1tO7DOg7E+sU5HkdqtQhrmo11s3r1ZQtUWvv2GL3N7gnUG8FL6iVdyFUpitJwfwrr375HPesK1v1Hg4h3Xn+0mD6sSQHr2Ic1t4adhjUDrlVYl09cYAuqgPVtsdkIrFsWsjZhnbtweli3HMYvXXVL6lhHv1h/9m/WY01jsX4x+1X7Yc0aWAiaQ5rOsJbVYvNYx6FY60hdOhWJMdn7PivjB+uGRQIGsS4XTu3PO8W6Wvo0COvaEFH/kKY9rEs3pzgU69pndnRFOFsI6z+8AuvihzCKof7r9rBuu0IDsI4aWLfWEHZtY+w//VwbumbpHlVWBMub0+MT2F9lGdbfx0zzsGOc4/is9rlFbKRYtoIButj2wJldUZGblFuL9fsJbY3j1Q1YxwasqdnqmIRFJnTMLS2XzLxlvjMNxvqlgjXnY8Q9ozEda32sc2vZDWPN+tvVKUrK7x5sqsVSrDuHw8pYR754RrBmb6Yxg7V8jL4fa1bXtbJk5nUe1nEo1oxiS2Hd2pqMYE0fWIumnLnZ7oy1fCZnANb1XlxpZM8X1uJdPWuwrrYNbr0E1n1YkwTryMf6t1RpPtadY2vAemHPWmo1b7Fy7boRMUdF2/ogwPrnt1/5tz+0DvDyaxuZwZrZu/jY+B5Ys+TV0RXBFO4ArGkS1tEH1q92rJmTU8XfmIg17yeL14272OHF+ylGeVAf1pJfN4V17k+xOh6dPeu3j6leqTgUa0GFTe18r2+xaONvFtbPLymfW0vUpMzvpxZP1+5Lyli/1LFmlnLm1z5/uP1Oy8KapIMl1FBLs1g3r/cVPjPcPlvB6lFYt+5/EmHdthJVPshHLQOn3WtxmWPW7OWn0TzWlU61BGtZq6+P6L+WBL/j29M1lTY+hTFrkmrtGGtZqq1FwcU68+PjsSZgvRvW3XfhpmxtY02DsX4NxtpOz/rlD+uxNQtYz8U6dGJNW2FNwLr5ltxBxCSsX8B6Q6xJB+t5E2z8J8G/WJNaz7oBaxo8DAKs/WLNc0l1FKS6dOb31zs38VGL1tthffucTtsEf561+pj4p1uOwpoy24QFSyOKOQp+eUwdYvesqRPr0sqX6AVrkmNNY7HOj5oyZjt7R5IFGjQsse7tWtPWWL9UsH4pYj1+9550Xa3gOnf1GuctMZe8jVP91qR2UOj4WpHJoa9B6DTd5+JL9ok/47F+KWFdWlNRA/ouSq4XNEvRKUwDa22sX0awZi4IH3FrmjUzoVErRmCt/20lWJMBrKVlLcCa/RCyvLptgTUBazNYD8kWWM/G+iXEmjvlwcJaYU9uH9YvYC0fZORiTcNrvvCw2VlY3/7W6JY/GOu4EdavnbB+JY6VExtW+NXcn+uRkr/ZGD3rSsbCpeTFPdgzL+mQIsxObgi3Pg+vTuzzHfRvTbM21XcXX+VYkPwRkTTtq9aXUckA62w8zJ8c8CQMrOs563yM9uyLdoWbeanm1SbSqcdtn2G14fC/lQEAalNr4zoqXVjrJjuoggJrYG0I674m0JmtD6wnNIiBWg98qvSE9YGxBOsVNX3QBzf9slus5b8FrA1gPUADYA2sgbWVi9D4+8AaWAPrqRVD/VOOx/p1Rs8aWK/EWvHL135Z7ZIAawPon5Cntwem+T1ri5dkRudlVBme8mgPqxEIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEAoFAIBAIBAKBQCAQCAQCgUAgEAgEArFH0DNwSRAIBAJYIxAIBAJYIxAIBLBGIBAIhBGrgTUCgUDYJRpaIxAIhC+soTUCgUCYwzo8A2AjEAiEG6yhNQKBQBiyGlgjEAiEYaOBNQKBQHi2GlgjEAiEFaxDKYA1AoFAAGsEAoFAAGsEAoHYhWoW1uAagUAgViHNxhrzjAgEArEK6yAI7D1HIBAIB1hjMASBQCCANQKBQCBUsYbWiEX1tR64XIhN634b1mgUCGCNQEyo9qEr0CoQwBqB8IM12gUCWCMQwBqBANYIYK2DNRqGbbuANQLhvNIHYH0EXduk+Jjbzm+//fxJ1BeE7/rfqzVOdgLWc7FuW7GEKoo4dgAEx/ABa+NYo2eNANbAGlg7xBp1FAGs0RCA9awMgTUCWCtMMqI5WLGZNSvnMtserFFDEU5bfBigNS6v0W6mM7eqaz2ak0ZFRfhr7kE30AaA9YhM1asoKiriyBEQYA2s/WCNR0AEsAbWa7FmEA6sgTUCWPdijbHEZqxpU6wJWCPQ3IG1Z6CDas/a4GXvnFGUjwWhgiE2xjrz2xaw3rElcuBq5M3gpaJxvQkcF4nw2PS7q3nin5qrvp6vW/abOA43dkaBNbAeVVtxKUyMgozFmrRcOwdrCo1jB8AaqgwdxMIVUbiS/dUcWNsYBkn9B3YJ27tS7TVU+isABVjv3am+VfOH3C3FozzftSPWtBXWxT8mejTonYmEKMBaKVe3WFPDd1J7A+9OWPMQSv2MoJxnrgup/qG3VChMxBpiA+u+XO1iHdNYx5ZCUsN6vxMgRFZT9V+uHxZgYt2+Cq+v6wG8tMt384R7sqTab3diHW/x0wX6isd/mI91pr26OqpIjHXOKWDdkviSlHe3eufEO7KrXxx1rH8DWOu3ZP7aavZ/MIY19dRPAtYWq/NBs7iGsY4jsKaxWNuuKsWWLNkIk/1vtibcSlhLzNU5PHXKOMhJwwLA2gjW8SNyVouwpmIBK4zvWq4rhYbMM8g/1j9/q2kZSNsCmGlLYk47RfsgrLvLdR3Wqf/Q6HRT/7rY0s3WlVJLZpUU4yCQjtURY3Itd5Eb1iKlPszI6U5nDeE67C0p3pekOdZqQ9fDYkxGyur5WLM+yNF8DBPr9M9cVzPWA68Yz2rRYkPhf5qfNX1uHaPBS09W1+VjFrN3YM25f/++iC8Aa6MPjTK8Ej9z/QlgbRLrGesEDWK957m0H/mKsS7VPdWFIM+hkLVYE7C+YX3Zw7o6cGEHawLW+lhvl7ddrGM2VHvWP51CUdvhLkb2UL1ldvnDujhIztq0mB+xtoV1dQplzwm39EOe8bmjU7AuCD4J66Rs1/VeVexVkupeFlZhjcaahmMdOs50DepYaw6vMsZwT8D6vUXvkna6zlLfQIAvrK+POzEL2WTTvfxg3WhX7geVxqzVZ4W0gK39qMp7NcZiveUQbh7ra1OsP4uUC3apl8abhFuN9W/J/hYv43My6yGcYN0oUu5H7ml3szUL63Ae1qYXKSlj/aiQ/pNmvDdPNnOjuxt3JtbXE+vih6XSurbAWj7HdiljHY7EmoC1Sr7X9aH1JmkznhLbKoXOW0fnYf05FhIYpx/viDW1Y31pYk32sf7svZnEumWUb1usyXum7VjLBze3wJrKZgFrq1hf3/+jiPWlinV33pnJ32Owvj4CWB+NdWEdCLC2jPXf4a6GsYvs+hc9rJW0zi5lu/ZceAysz8SaSQZVrb4/GzvEujq8NQNrUk/4zzfMlXPb+hdNrHVG6wvDAluuCSkPgwDrNNb5CrEX1pXhak9Yf65ZLM4yJgv0M23FPmbP1aPnMQflchZOLaaTtoh17tnxGKwvzVq1B9b59TLBC9ZXM9Ylq+1iLbWrfptSwlrl6uVbcT/WuaRt96y33CpSfcjdZsD+5unfpLiLyfNDRUGv9k7GmlWs22F92cQ6AOsRPc39sU5ofQlrlckjZR9Y5xtvDetrE6w/a3NT7XCBdfEetTfWifGAU7B+jgqc0LPuw5pMY11ZlVnrWt6HQfbH+nLUHDJYX5zdHVR/pvCBdTLj8tcIM7GmoXh9Tgwc2LMmgdUWsb7GYE3Osa6+re/yh3WoY035/ahOe9bVck5vvKUFWPfUmWpf4v1v7TDNyBiVZJY2dWI9+PU8SlhXJl+dY115QaoTrHkrw2tpu+1Zl2edgiTn5AeRVta9gyH8pWzci2x/EQWnTSYXhaRFbYSW1mB9ybDOXhiXWF+sDpegXlis0D121RzwgXVhtWClyL1jzRnryxi0AdYkj52wvk7G+toFa77WR2JNW2NNwNov1tfJWF89XB3Qs6bKzKrHYZCNe9bNQ7hbYs3j+S7KRlhfvrEODbfgmtUWdzDqdTR5Kxa1zFJSK/VdryasL9tYp2bcGjuatVVso7qo67EmoSj1i3EA1kKxdbDmD4Nc+2DN7mjGWFtnoMlWxzWsjvuIplVnYq20IITGjAp4xToIEn6+l1s5hmFNy7Hmc62Bdar95r7XTlgXd8bcrvJ79qnV+Y6xTuVbWxUWPGPNpCspDdnFurS6rejL8y3covRYizKHYh1y99MZY9bCrrUC1sk/ewbWhY0iMaP17dM2xTqyhn/3xjrZvLxgLfHlYbVTrIXL15Zgzb0MhWac/qvAOqvXp9VbYz2xZ016WAedQQGfWIuAoWT3zzfWVbVmY92yxubx1Z/NkoF1ANa/n3YG1vPGrDWxDpKx+g+pNAdwJ2PdC8wYrGkU1vWFTBZ61v1YR2BdOi+jiHW4ml6/Yg5rZvHfPsBFzzqUjgLOtrfxs20jsQ5sq5Ww5lu9Cuvr++0biycY27H+vgM/G2W5K1nVegusC6XwvAxDOtXjsb7YtS5T6kNuUYOxZjc3eky3iXSqizUaawVgJKtlhLkrYn2VR6yZu0JUO1mjsP6+A8fA7kcytPaOdb0ACjXSEdaXEtZkCetX/S1kTS2tG+swalBk0JlxYVC0pV/dbt66K8Qf1qENa8bSRWC9G9Yhu6RCtzG31p4M1r0tzS7WgzrXPrCuaQ2sBQvwgfW2WA8Zpe/vX4/Bmixj3a31CqypGevMKnKKvdutrWMdrtCDdQDWe2IdKktCRk2pjsK6t6kNwJpsYx1HY03NWGdeoFr64q6xppD9brIC61vFumTG/GrTujLvyi/uzx8sv59mCdahuDsmSLH+/BnG68T0sO5qbupK/Wt/apWcHGlNXVrf2EknEVZjHdSwrt6KpcV1XZLZWcNYi3Z7xXQVDCOwJmtYNyQ+D+v3HSs6rc1UF7OccGvK0bzWqRotxnr0phj2eJoO1g1lJdr76bZnrYc18bFulqt/3EcXa5qKdW9PM/rFOtjHuu2h8dmzzueQZ2rOHlx1rLNat5TV156aqNynno51GIZ1sryWYx2A9S5Yj3qF4HistcYDON/6Cs6xJg2sw1+rdUerVbVWsasR60x5rcY69GH98+FU3O/57zcnpDwO6/j3XwHrEdnPHBCYNWY9CuuS1qIv5hxr+fXvxPr9Z38Oyy5+9lqsY7pfTHWs//vN+HhO//mH3F+whfUYu/Rq+pj5xTlYkzbWPashjsA69L7pbbDWZbt6elxVrItldrtc2WYyAuvOdENhJVtsS/k4rLWTbUw3v3AhTMGaFLBmf+eJPetQWgL6Uh8H6SuHAd0Pa1jHz++phHVUxTochrXuYhDjWPsbAXlk3n1j6tjF17A+oPniKi9HPQTrkD8St5kvmVuzsW67QQmwDk1Yx6FYqz/BmlkZAaybsS4vXpuAdZ9fvw2oeYLRN9ZhGNaRhXVYgHXQw5r3SJ1IOcZBWJNPrGk01pJHP6dYC4ZsXWJ9f4JXKDBygHVQ6VmHXqxv138o1rd9BFd3uu1Y/05LmsU6LsK6Z7OqMtZhItbUgnXPYEB+V4gfrHV61gPPYNPEOrR1rcsXSIB1zL+jRE2ufzB+YN2Yb65gZFhn8r3/FVKp2V5GBbrquGOsm2cYqW/kNrsc4jCsRx6Y2bk0JId1x/XPYy15yTFV5uN1Np23ZRvqx6FwsX5POVbWIAyYjDE+hEtd6wQEf8PcMEjDPkbidp+KWiuNgBR/X2V+kY+14KyxYTcojYmYRx/kVKyvtVjTaKzZVZCMDeH2HPP8/s2lzXPWyr1Kq2nEWm3YdhDWOnoB67ZhAfdYXydgHYA1dzZpOtZBAWsC1j6wJkWsgwWs4xSsv7MeOQwSl2PdPSgArC33rAk9658pn1CgYjesv+jqHNQMKljHiVirpntv/FHn/gSsO7HOf1vZMMjAqbbUwqLW+nws1tEH1qu2D+hjXYsNseblrIF1tQGvtEuphv+kwPmyn0MIkzrW5Y9fjDW5wTqoYh0mYd21TgBYb481sbAmg1hLm3Ta6si0mlH3gPW2WIexWHfmDKyBdQ3ruAXWkdM2gbXOEuvxWBOw3h9rDa3dYl1rwbRPz5pYrye/Zcute8Owflbv1Vi3b6IajjUlsI5nYE3nYa20ScQP1hx1aGHPuvDRTW+/pvJX/mzBcSbW0QXWxJjlSOY2C+u3D6lRsQ/Wnd8QWNvFunr0qokhXDWsn87oYT2hW20O66ZPmYD1s5aWbs02se6ki4A1sOYeZ2sRa2IB3Ij1wFy7qvcIrH++QcunPA8oG7I+gl1uNrFuvEsB6zOxLnz33zQXYi1edZxukqVvTdmjNVdinej9L1hn/fgg+e9IGlkf1tEm1s/PSb61EFgPx/raBOvy2eNTh3DLB91VE6fcS3piTesVc4vsJxbHWEt611K5KiNdwHobrGkw1sEY1uQA69ofUMb6rQ6tuTENwJpGYB0NYn0vZE65iVq8Vayp8M5AHaxJ9qQ5GmutU3q99Kzfs6XS+G0K64l0VdcGtmPN2iovqHZ2sc7kvC/WkeRqsL+LUazV697v8yUZxbo33ev5dRIvoF+LdcYu1vKIMB9r3t8ppE/S11+KrXaANdWxltb/huTjHKzjc2i88v6OhuUaqliTGaxD8mAiAtZrsM59m+oILt+vddNt4nmI0ufGoN8167f6uWJFUNiaWMuTTypwKNb3T3l+JAHrXbEOSljXZvH4fU0zWPOGttTKYBLWsQvryhJIkn9J/1hH9vcX7L8slinl3/99XcB6V6yDGta8twvaogtYC7GubgI6EmtOJvdv3lumn5ssf7G+zGMdVsilv7f+gfV//4/EPC7Dun5ihjW62FiHPqxZ77xwgHVch3VIK3A01ome9WUU68+R9pVY/2jNTvvxg3//8YrVm5MtrAMT68gewzWGtYaPw7Bu6bS0Yp38oLZFX709a8Ef3b5nTd1Yf2feOcOZq33ZSQ2dh9HOHSItLyT8+ccrZkuGKk+l47Gutw/F55sF023tPQ4O1jQgWUtYt63uanaa+TSriHVPzb1///5aXPpyzbs2Bf3MZqxpc6yjCax5nRnXI7jAulDk0QbW7xSNxTrKpM6m1FXg9VqV+mryQ1HmYU0jsO7Yv6iNdZJsFRoFKStOt3FeMb8a6x6DNsGasWaNVmHNFYY6sI7GsS69DbsR6yisdk/MOFiTAtYdTLdizUy3OFKnkzLpTUNsgDV1GrQS66CDNbNXaR7roIR1dIZ1bMQ6iqsdq/N4XyrRS1dXnzp5UoY8X26j13qaCEOwZnyl7kWrc7DWblXac4uZc4S+PlUH61hzilaNWU/BOoqp9or1M1E52MzLo7KATw1rQanI090f6xDsYE1af2yM1fe6w68VEqz5NbLl8nQMV7OHW7uw/v6bfVMuXQU+F+vYiDX74pAe1rQQa0mumlgLT99XQXJzrJP9M/Vc04sAJMMyhXIXNcK2sugbAVmPtUKfe2RDig1v1YiesO57E5A4YXm6S7DuXUgrq2NGsb6+oglrAtbAegzW9TI2hnW0hLWocNrSfa6rn4W1+uObK6w5WqefTmkM1tSBdfF9V/JaOQ5r1pM9sNbAWvxd2/Cyg7WwdBqt1sI6jMQ6mLCaqzXVJxivutZPCl1jHSkq7t+bgDUB6w6su+cTaiuNv/8E64gK3jXUxZq7KoSdLsV0wqEV6nas63ZF6RCuOtShVa5sx/or4av4ZzKlNcTq+xn5iVLKpVwaB/lsWkpiyxNPN4VxWKfacXklc9wW6+q3jlKsyT/WQZpu8niB2VhfF19r7hCuRk+zoWLVsb7e8i0lncd68Gh1a7VIAtiF9Wd2jcWc+abirdJty40zG2OodeBy5JPhIqzjiVhHj1jX4foYFRjdsx6H9fUZ+b+Sfu7TfYQoYi05K2cC1q3l3Ih1s1nZTZsaWAdg7XwYJDbem2z1rKtYp6t/9I31leWT1bA1rD4S69ohRFEf66zYwBpY74s1jbR6LdZhENaiCVozWGvY1YA19ZgFrLnfXfb3q1iH5pozAuvkBlT+ERo8rMM4qz9GcFlDArkh3Nap53FYJ2awKhlnrKYBHWsp1lHWbxFjPcNpodUVbpp2XQPr7HeP2lhzP/Te3v78r75jQZh/rC/dnoSlTnOwTmhNKatXYi1aE0KVUfpnxl8vnPiR8rPMqKM5yxeNkbDvUsQ6KveqxTxxjvosfzk21iWLl1m9HuvOv8+zKwyBa27GmfphDOurMAN2//4UqQ/r6rWagnVmX1OtU602VlaqbKSLdZw/BCLoU7994aiN9dQHiXynwy/W6cqzL9aZxmK/Z80fwpXttwHWfrD+Pl6qc3nUbKzra5bsYy0TbaDWprEekLdvrOtDuMpYl16BWbvQvzLMxzoaHQaJ7dW6deemFGsah3VcjnUcj3Vh07miXpUu1Uysx92j+DenhlH6tvP2+FjXZ9uEm1152hYYYC0MKZwNwsU60TertQebWMfWZkwqWBNnanFjrDuWelnA+nYdy0sAamkGB1jH1Aagts5jerlu2+GoRbApj3XlmaFWzXlXq3nG5n5FGCcN3g8kTMyl3nmt1Q7Rztb63V3wYcVaXFsXJ7Sa817Z55NZ43vHFg+DqE2UW8e6snSSN1DJvI7i10vqY10Zhiz0m9qwFqQswDp9IH4F68jvfTFrTefANftY6weMlBi0ZfD6mXTlh+ufJngDkS7W7Ak61hEFzNeC9s6zJb9wJoeO3HbHOnZiHVZgTQPuTTQK61c/1rmuZhnrlkGBlgMJJMd/y7D++HTq4HU7rJt6nXEh1jyDgLUVrF+vZV3rRVi/dLHO9qzvaTD6XmqbPiVv6WzB+v1fyOfagLUZrEmCtfroB7BehDXp5jsE6yDfhVurZc8h3HvTTW+14H9h+XxsEuyGYZByx7qONX85xRisgwbWUYh123gueelZ28e69e3mcQBenOm2QprtbrHy1sw3oZx0fVumTrTdiQJ3VODRdJ+3HP4ETeN7z+SHpUl61uwFzYKlb4GVMJ+o368oWy2R6VlnFvMwu1i8Ovn8+kt71vFtV6pgbYwY6Pfn1D6s31td3xLknqUQxXFIEV1D+tT8g2WKS1zq1jQtRg6tIyCdWDc8NXVizbiC9bc91He2SUZXpO/HIlGILgMfMyof55RdMS8pqlBaAqnVHew3v2lnY/uOgUIjG9Sp1sI6DqBLA66Wk7s60o19t6ck1q+BWFcqF03tWSf+vaxlc6pgz5jFLV8iS1jHFqxbVrY1Wa11hJPkUiqt2ovAek+s3/+DeaxrlUtUHXqwLl1ZdayrX2g21lETa94Hdr0/xQDWcSbW6FnviXX0irVM09q0dp/Vq7AmYA2sE7v1JmD9MoZ1sI11XIN1qFQclbJsXc4srPLUFLUraxRrkmMdl2Idd8KaWM1SAetYOvWg2M5Fj6KzO5rFTQ7y83/yA60v9dDLV2x1uJeeUsdaab5NVhNIDesoEF2cMWlgrZdqYfKjHWvm92/DmrqwpuapRRHW6TMExVj//c9xgNYDjs5oPTJW3ql+JpmqGa+B0XdCbuOTxL1UU21hRCnK5hZXYB2bse44aJHRl098s/5dWOlPS16pzn0Dzxnw1nIdUSNV1hg39jVD6eBg7vURgK3d/cw17vFYRztYz7k5DUy5C2vaB2v2wJBsaFllz2zuw8SgcbGmXqxH1MjXQqwLy6WmYP3aEesXsDaMNQFrYO0P6/LaVt9Yh/F4+ceaXGHdM4RL/dHMyiZYR2AtxzoCaxM967BkFMQO1ppj1q8Om0iOdfnvZ75V/nMrAokvzxE963gw1qSGdctcM1trmoI1a/1RQ4cr9yKPmVh3zTAml7+wyf6at/r6EG2rh9r1kbhOR/OOdf6rjst42ESbCCp5ytKONbFWiaha3Y81syT7sKZpsbx1u0gGGSuMYHR+cfZFGHGdaNiCBWHS84q1reRfBoM2ia2u0AtYu0lO80tMwPp1LtYvYM3L2nFbB9bAWv2LA+sFWP95rgDW9aSBNbDeB+tR3wJYD8b6BayBNbD2k3LxWxDrEgz6EgqzbcD6SKy1mq17rF+pRGY1V/tYp341/2HGM29o/XofbzPhl5vgJlAdC3n5DD1Gt+2GIhAIhE20cTUQCAQCWCMQCAQCWCMQCASwRiAQCASwRiAQCATXamCNQCAQZp3We0EeAoFAIIA1AoFAHGw1sE5elVMGhrALCYEA1sAaWCMQCGANrIE1AgGsgTWwRiAQRpppeFoNrIE1AoGw10Jzr1XEpTmHLxxziEC4wfq6gHWS6c0Nw8m0CIQvrK8/kXpr+alYn3ItDksXgQDWW+sVzsIaWiMQwBpYA2sEAtHRToF1CS9gjUAgLGF9Hd5gf+fWzlgfk80XWCMQBlvqj9R/rL5ObrCUW8q4KdaHpYtA+G+o11sAa2ANrBEIYA2sgTUCgRA31ACseXjteTGANQLhq6FewDrRs75fje2xjv8FsEYgtsV6r13Kn08bZ2EdvaaLewvilEd+YF3F+t8F2fZB4o61q941jjRBoGd9DtaJBce5XUI7OX2/YcfL58A1sEYA65Oxvg7A+i23RLrAGoEA1sbxSl6OjbFOZgusEW0FYO4bbdRcrzTWnEx3OQaZslhvesr3RjenpgoI03fGeru792OveYzxrbGWM6VKAGu/WF+OsCZqrInogANrt831y+pfrGuZUv68o6/f9o71dRbWl9d8K6dQAWtgvS3W8buhVjsoZayDd6yvo7EOwBoBrM3kkOhLhvi10jaktRZi7e8SAWtgjVAbjbL2hVxf1VfyzKKfXRGVZCtWe1TtNKwJWAPrMVAvJbL9q5ibf3v7BpTBOq11PqP9sL6uw7C+vGJNdaw/vz2YHlEG8RbLnOt4k4adW072m4QPrH/iQXbhWuyE9XWdhXUpXbP5VnsM+RaHPvWIooi2sQ7Ni5AtYV2wOuZrPrDeqGftGWtmPQTWa7AmMxVjL6wjsM7YBayB9cvgJBqwPhXrmAgx1h+bHx3SVbRrE6zvBQmsgbU21pF+xAbWWlb/ZNWJ9d8m/rEB0p3UR2Bd2qzp5GwQOda/iZBWEwLUeazf+tcrjGO/5onYYcDq77yKVgeO1V/vRQfWwHpJDiWsg06LA9aV8cNPRqZepkqNKKwMoqZfHev0bTDp8a/zUD++cm7849na98E6AGsnWH98+8JgCLAeURIGsCZg/fOdM+PUO2Kdav6HYU3WsabyCa9qWO9yXNkKrCddp72wpgFY/2sfm2Idrh3fcF58knByasC9iV1crKnD6P8+Bi+Ar9SmNNZTrtGxPevsd06Ofuw1DPKW1hvWO3WpOD1r6+neW9hV0VoJ6x3v3HOwJoNYs9cjT8c6cf0yWAd2XOnYCet/FVDw/Gv/eTmR7+0h4iNf8QDBwqeD2soQRazRs07VpjTZk75HYo9f+s4q2TeyDOvY1qs+CuvHkvHkTW4nrJ/xka8nrAtmy78dsO7HemaNCHmsH6XPXvu5N9ZhC6w/ynw7rIMgX0tYpwAdgTXjKRlYO8SaEsNoRrFum1tMrgG5jsI6HtOzjiKtHWJNUqbzb0SC1qn7/2ysM2VUwJrcYB1LUV9UnR8A8Y11Ll/ehImjV1KW82XP5i/KN7PCegjWgi030DqzHXoi1oGLdW20+l6H1vasy1C/ZdZgtd8xawo1rLPP0q7eH0xcrFkvnzCKdX6HT/XriQ4sQ//aDNafFeI5UsB7XvpYYWAcazoJa+INCzywzs4tm38lJftB4s+64tKZ0PkVbTaxZi4JAdZKpTIL68+/ff1inTsphjEZ5wJr5o1nl2GQUq7/XZP0cL4Ia1vtWfIckZ6Zq/dNBuargTV7eAdYu8T6TevNsa4/KNStdoN1Kc/S3GtyZtkB1oJ889/fHNah0erqaBawdo11bksuqxsa7GPNqa/7YF1Mk4E1s3mbac+SfDnZLngFpwDrq/ymr+qWNkqfrQCsmaXyI07LhiQtrK9WrK89sA5Vq51hXRsR4PMVXGDNSpeHtelhkM+X/FDt5YyVmRpgLcW6dffoAqwvYO13vLqw/Fz2tOwB6+J6e0NvdZP0rC/mDYf3GqR/HxiTa8KAdRLrMB1r3g1b2rFeuSlmMNbkv2fNPeGbo5cxrEenOx9rxqB1L9YBWLc+ok7FOkbu01WlBi3ocqaxzu6J4dbb/E4EV3WX3c+M5cPcnGDNnkrtS3cG1qzudbVkxT3rxAJeYG0M67vW3Fde2cWaq3V2cUuhbbjbDhOG6wWs14xcV0uWhXWqz/65KQFWm8E63u+q8XCswwZYt67aS+iVvzh22nOpYHmnw1RHxqxhXe1YB1bHOjnCAqyTFWs+1s+/HH+0Fr35O1l5FmPNOB+EOza5D9bZcwU4epUvjJn2TGysK93lck2YjDV1YP3ZfBtOlwTWL1b3bsw1yq/uvmldnrdIlvGaZRIZrKsvkG/AOrjCmvq7mozrYhVrasCaVQ8WYh0YVod0ntzBamAtbEhTsE6ez8oaBvn320Z2i5SwLh29Vx+aLK6R8l3HYjvWhTu0Wax7bk1hUS1njC8LFrz0r1IF1rawTk0F/zwKf/3/15V6iadZrKls9VFYk3TAmtcNs4+1ZrbrsS69O1eKdeHQdmAts3oZ1lcS6+chqIaxrnetWVr7xfr2xurPqtaoV/1ReX1zCveT9DqxXn7aQKlrHRSwLlENrAVnqdBsrAsLd9LbUR8v/raD9Y/Xla2M/KY6c9WWqtWJNWl6VlvEupJuxwjIGqxzA9eyHZpBbLWRdZlLz0xnn3Y16kumV+A9sH4s3HmvDZnVyMuabBHrnNiSpjqhTKbhRe2zbYZ332fz/UpPF+vJXRL2gUvyCs6keinWa99wIVx1P+BL1hfgMZbbZ9bb2sSalLF29PT2UZmiMtaXRax/vk/X65LtYh2CaLxajnUA1iKs31vYCqwvJta30RFDWMc//6oP65A5fsEf1gW+uNehclO38aRM4RCshWMgwFqrFTG8No/1wqk3xorqzibrFOt7orHjSlwFrc1g/ZbOv517vVZvjTXb6mDjmanjOzS8QlP8hoYxN7UBWK9dJ1HFOupi7aVXHVkR+vpgy7GWpds76LMP1iyrl8/QLMa6pSs3FeubvpzNUSZmmTJY/x0N6Wu3rjrWREP0sor1oHRt5fs5e9p0TFUz1iak7pFwEtYDBkIYWPPu4KYOXhP1JhuwJnfD1VM7muux1i1yW++eeG+y1XNeYlB6WFrc+/rksvnbyLGmLqz1Llkd69CB9WtrrF9OsOYeadWN1+rrIyv14DXf3yZLSlhL3hR2GtbiwepxUvDOzgPW/rGudzrVOpoWsK5XAa8969dzO6oG1oZLdTjWxPzpLbGm5ftFgPWHXlQf0N0Ja8V06z3r2XWd+Mfd9mFtZuwvlan461D1JcLqHevBWL9vGG8cBuG9+s0x1k6GrCnVsc5fmW68Vl6fZ25U17pz0d7vcRlLOibcc7kUjqmysw5EBWvZ3vAOqCdgnX8JfXmJ0AlY09o9VD1XgI01p2quX8SWqcZfS354WIdurNcylhu4Vtz1Y+dJMjsMIvlWVNbaL9ZBjPXHKzVdYR2lWHvqVadfv5e+AuQZ63y6uQJntkNr+Y7BOnu0pEWsgxST/HjGGViHU7F2MlotxppbNd1hTY2nmNfGCDbDOuR3LZrDWvrV8mPPhc8g61gHttXpYWtgvT3W2YloYD0d65B4g2r7Xi+TWJMC1n8/IF3e6c/oXAgyCWtJNGM9svCB9XCsg2msiY914ziIkY31t1pZWU7L99rQhHrNJ8ZXq5Nbwjr0hSZ3I7AOrA8dqXYD1nHFrdIo1r9lVyhDU6ObPVi3PEisrw45rBXOvBm4B08B6z8n7TdiTQuw1qolGt38UFoPwl5ZYQFrZuU+BetqzTD14pwurDnpmsI696iqdECZqQfJ1NLEOViTQaw7v0dpqfUyrH+Xcqmv3/OK9Qdg+fURG2DNy7YZ62qnbO5w9UlYf7/Dqhvrz8E7YL0I69/0lHvW5Bfr+mveU4JxRgYsYs14T3LKa+GaNjNYx/qrJOT4qLbPxvY+BuvUTAuw3hPrl0usGXzFB1+hyWpHWIdOrBe+Dennz/99Z2q1PovxUW2fpIH1z6u85cMgX6dg5OpuAesArOdhTehZc0/d++xssqbcLNzGcliLsmU+R1haCPL9vRj1WTY9pb9uSxdrcc+6PDX+/AyNybytsB7eXwXWDVhHLtb/fuT6XThi7QBzTuEzly59rWcz8gr32xe+OFiL30rVBGv5l3Swvv6TOmZfDCkarWZgHbQCWAPrEVi/TzRyu15ue9bvwyWs9Xu3VY3LBkB+v7HwwYGTZ1ZVzhkayd/s2mHx+RiRPxGQhXX2hBcVrN9/T7VtjMOafGLN8Nr9BKPuqhizWIveGNM8PLAU68TmcgbW7b3qVqxpDNYXH+v38eoLWKfna4C1Hay1X3i1E9aBpO+sNoB13eooHqoublbrx/rvF/6zckUD60uAdWBgTZaxJmAthip6xzqOwHr9YYTD0zWFdarxrcD6/Z+rWN++sfj4pZ6edWBi/ZGMvZ41NddVbaxpXD9ECWtRNTunZ71+W/IsrBdn/GhXtQx7sb4lF/J95vK4dIoLDayvFqzLZ7x8f0T3a7yebzNe1LMeirV+5dfF+rG1xCXWdF7PmtS0JktYc96v0NAYKbev8yNlzjFtGS5WYc17NVu71fED67dbpkbl7sM6aGA9bjCk8ZSQ+3X5/scnBb4mGAttO/XvasUUC8eOWLo35dLtefHEaqzjOwtlsqXTi+mEi1eg8gKWcVhXl1FW3y+bxLpN6uc1z7YTYD0U61wT8LYaJDsY0ol1NNC9Fqfb+CixthIU3qpZfn+ZCtaBimRXsA4DsK6Moz6+GO+9oaSENZnHmoC1v5Fr2gBryUD9WVi37XzI72TNDo9Up7eG96wrdxEO1qSFNdnCOrEcJAJrJyPX1Za+FdaJ41OB9Qqs49ietQLWtDPWpTEy31hXN72djHVpYHQZ2pJ0xZOMrodBxmAdrGDNGpr5e6gID+uuJcwxUyLAeiHWGrFk5Dp26cXHeqll5e/Xuhvq/rFxWoaJL8/FOr4NODcuQisPhNZ/zgLWSaszH9G33yS3W9jUmPUxWAdfWFdvNtwFbd8v0y7dwMauxByYLrPSr3rG+vnzb9+Bi3XDiwgKjfjzX1PhLbSPzd5jsOasUInjsP66uJOwjl1Yq/esyTTWjMVcm2DN610mj0OyhnXsw7r0q9Oxlt90h2Ad6liH5FDEIqxzVutgnalxI7AWvy62XDdCy0spxmIdgbUUrx6sw15Yh2raBrDW3FPvBev7n0oVdWUMZDDWtDHW//4EsJ6qF795N/SsaT7WtZtT3AfryMc6jsQ6CLEmFawzXiZO6QjXtQJrHz3r0DNar1r/z8a6M32FnvVUrX8qZlvODrGWHYLSsq8+8x9v/8w51egGmwbWIYN18pvIsA79WGvWlZFYxxBD666pQVjbHbMer1rPFWjFOnGRpoOtqLUZrJldOCWsw7BQwDrrZR/WTQeCGMX67SGIAvPALwtYky7T6tV2JGl6evVgPVnrCKw76rD2a638YE07YS35khamGUkwBwOsgXUb1uQEa9luzY161uForNv2jqxZEwKsgfXWWGvXY/KFNSe/Gta0MdbRE9Y6WgPrItZxX6zJMNY0AuvRQ9ZBcM3uciQ71qz0dsI6AutdsVZYEXP/rm1YLx/dbS3jaAHr78y+d7mnWxfP8WAgBJcsfRhTFqP839wJ60qF1TlBwzHWg58IJ3WvO7qctWVilRKe2r/uK/CPOm8E69pBTox9GQawFlbzBNYlnCp//AisQwvN/rG2XpMnP1woYE0LVAPWjrX+xDoA6+FYr1kNAqw1etbA2izWX2+YzG9upuw2iAI+hrGu2QSsWd+nW+kh66yBNbDuDtNYlztK3Hr9b6jr54WjfrCOPViHrbDuGaIG1sB6A6zJL9bsij2x4jdMzuTrlfB7X5kFgD1Wr8Q6NmKNnjXGrP++KJSR325YTzxA4Pdc68rb1UQVe3LFF2Odk6TlW2deEtOczGis9faKGO9Z9+1gXIe1dmtXKer6dawW/1ysVU4ZMIY182xBGdYRWM/CmkxgHZOHyVKwgLUDp8eiplHU5A7rXqZvR0jK+ymTb0QCrKMJrAlYr5mEyWEdgPUGWN++lBustTZB1T6NbGAdqe85cj7Wwj3nBKzVZsaVsFYduAXWOndmYN2ANU3GWi8mVnLpaGY/1gFY62Gt2aqBNbDuBgtYrx651sU63da6UrE5Zi1pr8DaCtYErFdgPXRlj2emxQOeOVIUvrtK31KwbRBYK1fsELbBmnpGMn8m2ZhYc/stEw5BUSz21neHTzntxTzW+Tc2tmF946X3u2sNBFjGmreYyS3WwUhoXIT3K9CplyOsY9N7GIul0FBfgPXzjY23utCE9V0XYM3VuryTDVib0FrjmAyPWOtJBaz1sA7dWAdNrGki1rRqnTUHaxPjAM6xDsAaWANrCdb8NQ5qTtex7iato7QJWANrYM0b6x6U6QCrBxy499cDzWEQq1iHGVjL1gpWe9bkHOsVGNf+eQXWYrVEC6NsYh0asWY9ZdtfFDKifj9EuNUF2gvrkqMGsG49vJpzfYD1UqzFasnWslrDmvPdO+qLzbUvQ2p+sfv2+KLAegrWBbGrHvHex7kI6wCs27DmaT0L63gI1lpaj9Tqk9l9sY7AGlgDa2DtH2v1nnUqCdkm6jk96wCsD8CatsaafGB9A6Adazob68T3FIzopzbFFEk0hLVGpZ+ENaWxDkdiXZ6Q/ayFq7AulUnbhZs1zaiYbtLrtvoybJrRmtUirAX9aw7W8RSsw2CsP7uLlfoCrFdhLR4PWLgucWKBd2E9ONseq/+9f3HsQuN3LeIorL8SWYt16kLoYy3nWnxrvd/4gHX22jy+jxms/7xKIvMdD8R6dbb2B0B4q32B9XisBWUGrFlYUxZrhbe3qY/fAustsI5usY7AuruMK7saJ2P9nal5rClzZfqvhfpK872wjsDaF9a1dIB1n9XJ0e3KJ6rOx/Cr9MTR6tzlic6wDuhZA2sm1rEX63qqwLp9CIQ3I/z5sZthzaxixRWaBrFWWLe4Fmvpl/370T3par9e1IrVHKzjEViHCViHyAO7pbi+rnH1cq/GesBBNsKp8uJ/toa1ziJzb1hrpEwrniFGd0tavwjnigjuSy1Y07AGr1X2qe/ZV8Z9Ii3Heu6aPfdYhw2wDrOxDsB6ItaiMgHWwJp1bRxirXayohOslQ6qB9ayyv0+2CPIt6FMRlwNtaIH1sC6C2ulV7d5wVrnRgWsm7DOLlRQuw0HYC3C+v0PnIV15T3EdrEOwBpYO8d65IoQre5nqt4NmV2srXgA1hrDetPWsgFr91ibquGrsY40o2etcTjMs/INtFpWkYC1EtbfV2DIomOltRHaZDMJ6/nCwNo41l9p1jJ9/wZhbGjUc2H3erzVwHoI1i/dK6B5bPuI4+hYTRlYb451ZGLdXIyTazmwPgpr0roCZ2JNwNoY1tEX1i9gDaxnY02HYx2AtQmsoyustWo1sAbW4kONVEfzvGCtkq3ydnMSrUCOYROsu+9M87BWKXQZ1gFYA2vtxU5OsFZ9uapaznK8zNVwAdaxBetUylrPWGsK+5lK/uwoYA2sgfX6pQFHYn3nmr1jYWesk9c+TNJ6XBPW3PQkLsazsJZ87MjXXc3GmvsX9Gr3aVjHWrosrAOwNo71C1gD69OxNvfsSEKsY+G0VWANrIG1N6xfw7AOwFrNAM6eKGBtGOsArIdgfW/Z22NdL/Ah8//zsX5ZGQVpqOeCw1HZWGdeGjhoKyuw3hLr0HFB9Pthw7D++xmJ5WJxC6wbqJqD9coF1nawbnx3zuCle+rNt37tgXX/Pbf1cnjCWnx198Baljew7sC68jbHQW8KMtCz5vevgTWwBta+sdao2cuxJk5MwpoltjZlwBpYa2Adt8WagDWwvmd5NNZDMwTWdaz7c2zHmtCzBtYusP74ImawZu+fT+56NIb1d57A+hSsSwUuKlL0rNmTavwvQi6xjpaxnrAufh7WJbDCAVj/y7+z1rZgHZdg/VIoak6jFJKgv3TPDNa5q3H7isJq/fd3vz9BE+sArG1jnazeetPhxUvZdk1IHevPK9Ayt9KQ2hqsn9kqYy1PXTNnyatTlmL99uWkfZD33L7/r5+E//cTIqv7jQPWe2MdZNcjjpiB68SaTsU6GMX6KfawhXtGsH6OhvzvrvXodSDA2hXWrD20/Vdp1FoJNawDetaesFbqhljD+mH1Aqxr12VIBf/zF/vI1rPadM+6E+vgGuvQhXXiL5nF+rp2wjpMxDpk28W2WIfJWCv0r6vb8C30t/qs2gjrRGenfRzEPNbPQ+wZWF/hXwem3+qjsP68LLcvJ67aGaz/d4+5WNPSnvXCwZAlWD9eGDRtGCT/lJjo/Y1s1mK/fun6bLvNhT0Va+Ine/0JrTGtiVhnyJ6NdWkX+Ps9v3WBYg5rmtCnTi1JWYQ1Tcc6m+FrWCRabznxn5+IM7Ae3qx/P/vt70tm2sgT1r9/hp1sYFltBevSCNdqrDMdEfEl+OxcAOvVWI9mOjkYwsWauy3LEdb8Uw7uP+UM6yBP9vr8yfbRH2CdrNnNG4Dah0E0sb5XseKFA9bbYB0XYP1B2NZYh6Y7UwJruz3r0h4Z2cRTywrG+Vg/tJ42tXh/v021Uu2E9eQBkBTWpId149q9t48fS9nz652DtSjZ7E8ax/p127T5fNNsV/uV4pCcW1TD+lPrOB3rzyeaeVi/eDcK1iOR3dHq3JSMFtbcip0YAIumsabUmDX1Yk02sc6uJ7c8DPJZs6M61qKuXGnVUS/WN61nHJCS6VjX+7mTChtYz8O61KpXY536oce/6dv8RC+bPevkf3GEtX7PWgR24nsMwXri1OLbdXgZwPoFrE1gPcax9KM9c0abkv++Va0ZJZ3PVj4CkupdLz2TawjWxTotHAwpbT9rxvo+z/Tz7yZNLRaxDsB6ZJL5wy5WYb1iMX11m1DuEjnGOlsRORNGwRvWXGM1ajavXnVj/Q7nvNFqt1jTDliHAVhTK9Zrdj5Rza+QH8D9+XcmsU5ttcy8AFuEdYPWa7AWrID52vFkGuuXJazZazPIPNbBD9asdKgpJLPlOUIHteP8ZuAS1kW3GIW+ZuPT+3dMbdLIYp2pC0F4Lsrc2t2ONY3B+uNaUOsIX3pwZ/hp3okrIFhIR9PLvGnNpTesa51Ada+La3+HYh3rWMfSZpDGAl+CdaTK1v4U1pqLVZdgLV5bLsFa0rmJWay7bkDdm6QVrV6OdaGPrTMARk6wpr4wiXXkYP2c7PSJNeMcluRxLDtiXf9qUaI1p2Yn/mSU1+wlWBdyz3f5t8S6sDTqWKzDJKxzlbAy1Lo71vfy/ndCKrDOat2GdRyKdeZHdLFmTH1md9DMGQqRbzytF7gFrGN++nAq1uPvyNSAddR7lPKB9Y/VX8Fq5naxDsuxJg2+bimwsY4HYy08Cae2ZDOzk3dKXo9OZiiW/x5Yl5ps9Z3n3/+9i63Zj4cktzq+o/UP69jbub5PTU5fAfO5RbZ4H1EaBiHNnvXjfrMca37L8o91eZD2NSc+D1zkYN22yDd7rcrXU/N61OgqZZ9ox/JST+c9GWpes2o7CamWNk0au/zJoLTxSqk/8jkcfX8cLf6xNoF+tufkpl+6B63j33efstVljsxMZe3zsglOBmB5bxtrvWXNmauzEGve5L821rMKl0tWEeughPW05irJXMnqj7HD/tZU+JOS78QFu3qBBKNtS7AurSVox3rdaHWqSg+7M/rAmoD1DlgX1DKGdfcsyyKsX26wTl86d1jnd+OOwzoCa2A9unqX0ALWwLp4FUxjfR/fGo51buOxk2GQKJmvqbcTo1h3vWnFDtaFYgTW6ljTHlgH0z1rfl3WxjrysKYpWEdORaOuSv/nH+8b1BdhzexYtzb0W94LajdVHp94z08qWOus2iPGirilWPPO/LMyZp25CtTSs6ZlWLP6HcOxHlrIuTsUc6FWw6x6cR2ItSLO/lDraq9Ef2VFL4RZ1CQntGksSVCnGQUm39IodPq+trvtS67AunZVkjbLbpY0fRiE2YrVsU53DJZgTcC69ENBD+uXeay7ByaqWAuuBVdg8f5zQZ+6Wnimsebf5sqj8WawZhV03wlh7CE3F1gTsD4aaxJgHYH10p51H9bEeEKa+7QoaMPaV6w+2GYLa+ErnTLNwwHW96YtO9XpI+kFWJPI6UasZVdxONaRf7CTYLB62551FGEdTWEdV2M9vpA7sRZtXH2+W8Fxz1qY9ecTiA2sSRvraA1rfggmFrftWTOw5q0fWjAMMuJiky2sX118qcecQk5NFS1I9kisyRPW1Gb1zmPWvMMNZ9536BysP8bRBy3nWm9WS7aejS7TIXh8Uu20KS3bE69WkmLdVXgDR1GHYc1Mbs7obENDjgM6++UBnwcP52D9Ogzr1+JGqr1jg3s+aXdjki3dG4K12kzea3Jo9IktYf0SgPXSx/rfxzIW/S/G+u/vvc7A+vV6ecY6l7UiJ+6xDvOxXlUFgPUkrMc0dznWDAj2wVopR2BtFWvZLuudsX4B6wFYvyxh3U+ZfaxfwBpYi7CONrGOwHoq1hNa8ui1OevUEsxO3L+jvOkacboBa9LEmrFrgF5qWJMYa5IdX9T/Jclez5p6sV6R02iweF2Myr7cRU17ra6zE90t2Qld/3lPGTQ6xl5wi9Vg0u9Pr9eD/gD3a7yANZK1iPVrGovAWvtbdX/Iuoxeg0uS9akLLwmw3jXZoZwAa/PVaj+sh98YgbULtIC11oUE1sAaWANrYG0e69J/VsdaRXRgDazdY30WWsBa5QNfM7HW6X/v2+FR+ULWWopDrP8PPuOMVErmEgkAAAAASUVORK5CYII="
      }
    }
  };
  var _dogAnimHiImgCache = {};
  // 고해상도판 조회 — 규칙은 getDogAnimSheet()와 동일(없거나 디코딩 전이면 null).
  function getDogAnimSheetHi(breedId, stageIdx, coatId){
    try{
      if(typeof DOG_ANIM_SHEETS_HI === "undefined" || !DOG_ANIM_SHEETS_HI) return null;
      var stageKey = DOG_SPRITE_STAGE_KEYS[stageIdx];
      var b = DOG_ANIM_SHEETS_HI[breedId]; if(!b || !b[stageKey]) return null;
      var src = b[stageKey][coatId]; if(!src) return null;
      var key = breedId + "/" + stageKey + "/" + coatId;
      var img = _dogAnimHiImgCache[key];
      if(!img){
        img = new Image();
        img.onload = function(){ try{ drawPixelScene(); }catch(e){} };
        img.src = src;
        _dogAnimHiImgCache[key] = img;
      }
      return (img.complete && img.naturalWidth > 0) ? img : null;
    }catch(e){ return null; }
  }
})();
