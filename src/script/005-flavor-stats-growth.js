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
    jindo:    { power:70, agility:75, comprehension:75, execution:55, loyalty:95, affinity:35, health:90, aggression:65 },
    shiba:    { power:45, agility:70, comprehension:75, execution:45, loyalty:65, affinity:30, health:80, aggression:65 },
    border:   { power:55, agility:90, comprehension:98, execution:90, loyalty:70, affinity:60, health:60, aggression:45 },
    corgi:    { power:40, agility:65, comprehension:80, execution:65, loyalty:90, affinity:80, health:55, aggression:55 },
    pom:      { power:20, agility:55, comprehension:65, execution:40, loyalty:55, affinity:25, health:45, aggression:90 },
    husky:    { power:85, agility:75, comprehension:70, execution:30, loyalty:30, affinity:80, health:60, aggression:15 },
    shihtzu:  { power:15, agility:30, comprehension:55, execution:50, loyalty:50, affinity:90, health:45, aggression:10 }
  };
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
