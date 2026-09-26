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
