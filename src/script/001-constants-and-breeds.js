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
    // 29번: 믹스견(시고르자브) — 등록된 견종 중 두 마리를 무작위로 매칭해 만들어지는, 세상에 하나뿐인 조합.
    // 특정 견종 배수를 주지 않고 중립으로 두고, 크기·모색·눈동자색·픽셀 실루엣은 매칭된 두 견종에서 랜덤으로 물려받음(chooseCrate 참고).
    mix: {
      name:"시고르자브", desc:"어떤 두 견종이 만났는지는 아무도 몰라요. 세상에 하나뿐인 조합이에요.",
      fur:{a:"#D9A85E", aDark:"#B4823E", b:"#C89552", bDark:"#9E7238"},
      mult:{}
    }
  };
  var BREED_ORDER = ["golden","labrador","jindo","shiba","border","corgi","pom","husky","shihtzu","mix"];
  // 실제 "정식 견종" 목록(믹스견의 부모 매칭 대상) — mix 자신은 제외
  var PURE_BREED_ORDER = ["golden","labrador","jindo","shiba","border","corgi","pom","husky","shihtzu"];

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
  var SIZE_LABEL = { golden:"대형", labrador:"대형", jindo:"중형", shiba:"소형", border:"중형", corgi:"소형", pom:"소형", husky:"중형", shihtzu:"소형", mix:"중형" };

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
