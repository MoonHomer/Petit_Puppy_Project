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
