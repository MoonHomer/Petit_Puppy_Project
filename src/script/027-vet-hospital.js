  // 76번(동물병원, 기획문서 22장 신규): [외출하기]의 준비중 placeholder였던 항목을 실제 진단/치료
  // 화면으로 구현. 상점(shopVeil/switchShopTab, 007번)과 같은 "탭 버튼 + data 속성 + active 클래스"
  // 패턴을 그대로 재사용 — [진단받기](뼈다귀 3개, 횟수 제한 없음)로 은폐(???)된 디버프의 정체를
  // 밝히고, [치료하기](1회당 뼈다귀 5개, 하루 최대 3회)로 밝혀진 디버프의 치료를 시도함.
  var VET_DIAGNOSE_COST = 3;
  var VET_TREAT_COST = 5;
  var VET_TREAT_DAILY_MAX = 3;

  function switchVetTab(tab){
    if(el.vetTabs){
      el.vetTabs.querySelectorAll(".shop-tab").forEach(function(btn){
        btn.classList.toggle("active", btn.dataset.tab === tab);
      });
    }
    if(el.vetPageDiagnose) el.vetPageDiagnose.hidden = (tab !== "diagnose");
    if(el.vetPageTreat) el.vetPageTreat.hidden = (tab !== "treat");
    if(tab === "treat") renderVetTreatGrid();
  }
  // 69번 상점과 같은 원칙 — 열 때마다 [진단받기] 탭으로 초기화(직전에 [치료하기] 탭을 보고 있었더라도).
  function openVetVeil(){
    closeVeil(el.outingVeil);
    switchVetTab("diagnose");
    openVeil(el.vetVeil);
  }
  function closeVetVeil(){
    closeVeil(el.vetVeil);
    openVeil(el.outingVeil);
  }
  if(el.vetTabs){
    el.vetTabs.querySelectorAll(".shop-tab").forEach(function(btn){
      btn.addEventListener("click", function(){ switchVetTab(this.dataset.tab); });
    });
  }
  if(el.vetBackBtn) el.vetBackBtn.addEventListener("click", closeVetVeil);

  // 지금 은폐(hidden:true) 상태로 걸려있는 디버프 목록 — [진단받기]가 전부 한 번에 공개함.
  function ownedHiddenDebuffs(){
    return DEBUFF_IDS.filter(function(id){
      if(!isAbilityOwned(id)) return false;
      var def = findAbilityDef(id);
      var list = state.abilities[def.category] || [];
      return list.some(function(a){ return a.id === "catalog:"+id && a.hidden; });
    });
  }
  // 이미 공개됐고(hidden:false) 병원 치료 대상인(삐짐 제외) 디버프 목록 — [치료하기] 탭에 나열됨.
  function ownedRevealedTreatableDebuffs(){
    return DEBUFF_IDS.filter(function(id){
      if(id === "sulking") return false; // 삐짐은 병원 치료 대상이 아님(소통버튼 응답으로만 해제)
      if(!isAbilityOwned(id)) return false;
      var def = findAbilityDef(id);
      var list = state.abilities[def.category] || [];
      return list.some(function(a){ return a.id === "catalog:"+id && !a.hidden; });
    });
  }
  if(el.vetDiagnoseBtn){
    el.vetDiagnoseBtn.addEventListener("click", function(){
      if(!hasBones(VET_DIAGNOSE_COST)){ showMessage(pick(FLAVOR.poor)); return; }
      var hidden = ownedHiddenDebuffs();
      spendBones(VET_DIAGNOSE_COST);
      if(!hidden.length){
        showMessage("지금은 딱히 이상이 없어 보여요.");
      } else {
        var names = hidden.map(function(id){
          revealDebuffAbility(id);
          return findAbilityDef(id).name;
        });
        showMessage(state.name + josaIGa(state.name) + " " + names.join(", ") + "에 걸렸대!");
        renderVetTreatGrid();
      }
      saveRenderPulse();
    });
  }
  function renderVetTreatGrid(){
    var host = el.vetTreatGrid;
    if(!host) return;
    host.innerHTML = "";
    var ids = ownedRevealedTreatableDebuffs();
    if(!ids.length){
      var p = document.createElement("p");
      p.className = "walk-summary-empty";
      p.textContent = "지금은 치료할 증상이 없어요.";
      host.appendChild(p);
      return;
    }
    ids.forEach(function(id){
      var def = findAbilityDef(id);
      var item = document.createElement("div");
      item.className = "shop-item";
      var name = document.createElement("span");
      name.className = "name";
      name.textContent = def.name;
      var desc = document.createElement("span");
      desc.className = "desc";
      desc.textContent = "치료 성공률 " + Math.round((def.cureRate || 0) * 100) + "%";
      var btn = document.createElement("button");
      btn.appendChild(document.createTextNode(VET_TREAT_COST + " "));
      var coinDot = document.createElement("span");
      coinDot.className = "coin-dot";
      coinDot.style.width = "10px";
      coinDot.style.height = "10px";
      btn.appendChild(coinDot);
      btn.disabled = state.coins < VET_TREAT_COST || state.vet.treatToday >= VET_TREAT_DAILY_MAX;
      btn.addEventListener("click", function(){ treatDebuff(id); });
      item.appendChild(name);
      item.appendChild(desc);
      item.appendChild(btn);
      host.appendChild(item);
    });
  }
  // 치료 시도 — 실패해도 뼈다귀·하루 횟수는 그대로 소모(재방문 필요, 엑셀 원문대로).
  function treatDebuff(id){
    if(!hasBones(VET_TREAT_COST) || state.vet.treatToday >= VET_TREAT_DAILY_MAX){
      showMessage(pick(FLAVOR.poor));
      return;
    }
    var def = findAbilityDef(id);
    spendBones(VET_TREAT_COST);
    state.vet.treatToday += 1;
    if(Math.random() < (def.cureRate || 0)){
      catalogRevoke(id);
      showMessage("이번 치료가 확실히 효과가 있는 것 같아!");
    } else {
      showMessage("다음에 한 번 더 와야겠어...");
    }
    renderVetTreatGrid();
    saveRenderPulse();
  }
