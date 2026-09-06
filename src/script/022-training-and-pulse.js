  function trainStat(key, forced){
    var energyMult = effMult("energyDrain");
    var cost = (forced ? 20 : 15) * energyMult;
    // 40번: '우울증' 소지 시 훈련으로 오르는 기본능력도 10% 감소.
    var gain = (forced ? 3 : 6) * coreGrowthGate() * (isAbilityOwned("depression") ? 0.9 : 1);
    state.life.independence = clamp(state.life.independence - cost, 0, 100);
    state.core[key] = clamp(state.core[key] + gain, 0, 100);
    if(forced){
      state.life.stress = clamp(state.life.stress + 10, 0, 100);
    }
    showMessage(pick(TRAIN_FLAVOR[key][forced ? "forced" : "normal"]));
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
  el.talkIdleYes.addEventListener("click", function(){
    closeTalkIdlePrompt();
    bumpLifeBond(2);
    render();
    playTalkPopup("스스로 다가와 말을 걸었어요 · 오늘 횟수와는 무관해요");
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

  // 31번: 개체별 편차(±pct) — 기준값을 (1±pct) 범위에서 무작위로 흔든 뒤 0~100으로 clamp, 정수 반올림.
  // item4(견종별 시작 스테이터스 ±20%)와 시고르자브 1단계 부/모견 가중치(±10%) 양쪽에서 재사용.
