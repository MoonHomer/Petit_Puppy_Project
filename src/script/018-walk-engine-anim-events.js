  function syncWalkDogVisual(){
    var extra = el.dogWrap.className.replace("dog-wrap", "").trim();
    el.walkDogWrap.className = ("dog-wrap walk-dog-wrap " + extra).trim();
    if(el.walkDogTrack) el.walkDogTrack.classList.toggle("pixel-mode", !!state.pixelMode);
    // 32번: 픽셀모드 산책 캔버스를 "대형견 기준 체고=팝업 높이의 2/3" 배율로 확대
    if(el.walkPixelCanvas){
      el.walkPixelCanvas.style.width = WALK_CANVAS_DISPLAY_W + "px";
      el.walkPixelCanvas.style.height = WALK_CANVAS_DISPLAY_H + "px";
    }
    drawWalkPixelDog();
  }

  // 산책 중임을 시각적으로 보여주기 위해, 팝업 안에서 반려견이 화면을 좌우로 오가며 걷는 애니메이션.
  // 속도는 매번 오갈 때마다 랜덤하게 바뀌어(빠르게/느리게) 단조롭지 않게 함. reduce-motion이면 정지된 채로 둠.
  var walkAnimId = null, walkAnimX = 0, walkAnimDir = 1, walkAnimSpeed = 50, walkAnimLastTs = null;
  function startWalkAnim(){
    stopWalkAnim();
    if(reduceMotion()){ return; }
    walkAnimX = 0; walkAnimDir = 1; walkAnimSpeed = 30 + Math.random()*50;
    walkAnimLastTs = null;
    function frame(ts){
      if(walkAnimLastTs === null) walkAnimLastTs = ts;
      var dt = Math.min((ts - walkAnimLastTs) / 1000, 0.1);
      walkAnimLastTs = ts;
      // 32번: 픽셀모드는 캔버스가 훨씬 커졌으니(WALK_CANVAS_DISPLAY_W) 걷는 범위도 그 폭만큼 넉넉히 빼줘야
      // 화면 밖으로 밀려나지 않음. 일반(CSS) 모드는 기존 강아지 박스(0.6배 기준 약 90px) 그대로.
      var spriteVisualW = state.pixelMode ? WALK_CANVAS_DISPLAY_W : 90;
      var trackWidth = Math.max(30, (el.walkScene ? el.walkScene.clientWidth : 260) - spriteVisualW);
      walkAnimX += walkAnimDir * walkAnimSpeed * dt;
      if(walkAnimX >= trackWidth){ walkAnimX = trackWidth; walkAnimDir = -1; walkAnimSpeed = 25 + Math.random()*60; }
      if(walkAnimX <= 0){ walkAnimX = 0; walkAnimDir = 1; walkAnimSpeed = 25 + Math.random()*60; }
      el.walkDogTrack.style.left = walkAnimX + "px";
      var flip = walkAnimDir >= 0 ? 1 : -1;
      el.walkDogWrap.style.transform = "scale(0.6) scaleX(" + flip + ")";
      if(el.walkPixelCanvas) el.walkPixelCanvas.style.transform = "scaleX(" + flip + ")";
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
    var spriteW = state.pixelMode ? WALK_CANVAS_DISPLAY_W : 90;
    for(var n=0; n<5; n++){
      var p = document.createElement("div");
      p.className = "walk-particle";
      var size = kind === "sparkle" ? 5 : 7;
      p.style.width = size + "px"; p.style.height = size + "px";
      p.style.background = color;
      p.style.left = (spriteW*0.3 + Math.random()*spriteW*0.4) + "px";
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
