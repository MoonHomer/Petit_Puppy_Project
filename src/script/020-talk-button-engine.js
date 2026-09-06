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
  function openTalkIdlePrompt(){
    if(!el.talkIdlePopup) return;
    el.talkIdlePopupText.textContent = state.name + josaIGa(state.name) + " 할 말이 있는 것 같은데?";
    el.talkIdlePopup.hidden = false;
  }
  function closeTalkIdlePrompt(){
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
