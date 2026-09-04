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
