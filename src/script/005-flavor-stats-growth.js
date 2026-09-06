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
