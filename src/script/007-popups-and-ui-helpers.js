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
  el.outingAgility.addEventListener("click", function(){ openOutingPlaceholder("어질리티 연습장"); });
  el.outingCafe.addEventListener("click", function(){ openOutingPlaceholder("애견카페"); });
  el.outingVet.addEventListener("click", function(){ openOutingPlaceholder("동물병원"); });
  el.outingGroom.addEventListener("click", function(){ openOutingPlaceholder("펫미용실"); });
  // 47번: 대회/이벤트 — 다른 준비중 항목과 달리 별도 화면으로 이동하지 않고, 토스트 멘트만 띄우고 [외출하기] 화면에 머무름
  el.outingEvent.addEventListener("click", function(){ showMessage("현재 참여 가능한 이벤트나 대회가 없습니다."); });

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
