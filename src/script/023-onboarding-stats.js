  function jitter(value, pct){
    var factor = 1 + (Math.random() * 2 - 1) * pct;
    return Math.round(clamp(value * factor, 0, 100));
  }

  // 37번: 성장 단계 시스템(기획문서 9장) — 시작 성장단계의 비율 구간(GROWTH_STAGE_RATIO)에서 스탯 1종당
  // 독립적으로 무작위 비율을 굴림. 실제 스탯 계산(성장최대기대치 × 비율, 절사)은 호출부에서 처리.
  function growthRatioRoll(stageIdx){
    var range = GROWTH_STAGE_RATIO[stageIdx] || GROWTH_STAGE_RATIO[2];
    return range[0] + Math.random() * (range[1] - range[0]);
  }

  // 31번: 시고르자브(믹스견) 1단계 — "품종 기반 베이스 값" 산출. 부/모견 우선일 땐 50(중립)과
  // 해당 견종 스탯의 중간값에 ±10% 변동을, 완전 랜덤일 땐 스탯별로 0~100 전체 랜덤을 적용.
  // 이 결과는 아직 "품종 혼합"만 반영된 상태이며, 개체별 ±20% 변동(item4)은 별도로 2단계에서 한 번 더 적용됨(중복 아님).
  function computeMixBaseStats(sireId, damId, method){
    var sireStats = BREED_BASE_STATS[sireId] || BREED_BASE_STATS.golden;
    var damStats = BREED_BASE_STATS[damId] || BREED_BASE_STATS.golden;
    var result = {};
    CORE_STATS.forEach(function(s){
      if(method === "sire"){
        result[s.key] = jitter((50 + sireStats[s.key]) / 2, 0.10);
      } else if(method === "dam"){
        result[s.key] = jitter((50 + damStats[s.key]) / 2, 0.10);
      } else { // "random" — 완전 랜덤
        result[s.key] = Math.floor(Math.random() * 101);
      }
    });
    return result;
  }

  // 31번: 견종에 따라 순종은 마스터 표를 그대로, 믹스견(시고르자브)은 1단계 부모 혼합 로직을 거쳐
  // "품종 기반 베이스 값"을 반환. 실제 시작 스탯은 여기에 item4의 ±20% 개체별 변동을 한 번 더 적용해서 만듦.
  function computeEffectiveBaseStats(breedId, mixParents, mixMethod){
    if(breedId === "mix" && mixParents && mixParents.length === 2){
      return computeMixBaseStats(mixParents[0], mixParents[1], mixMethod);
    }
    return BREED_BASE_STATS[breedId] || BREED_BASE_STATS.golden;
  }

  function shuffledBreeds(){
    var arr = BREED_ORDER.slice();
    for(var i = arr.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function buildCrateGrid(){
    crateBreeds = shuffledBreeds().slice(0, 3); // 4개 견종 중 3개를 이동장에 비밀리에 배정
    el.crateGrid.innerHTML = "";
    crateBreeds.forEach(function(breedId, idx){
      var card = document.createElement("button");
      card.type = "button";
      card.className = "crate-card";
      card.setAttribute("aria-label", (idx+1) + "번 이동장 선택하기");
      card.innerHTML =
        '<span class="crate-pic">' +
          '<span class="crate-handle"></span>' +
          '<span class="crate-box">' +
            '<span class="crate-vent l"></span><span class="crate-vent r"></span>' +
            '<span class="crate-shadow"></span>' +
            '<span class="crate-door">' +
              '<span class="crate-bar"></span><span class="crate-bar"></span>' +
              '<span class="crate-bar"></span><span class="crate-bar"></span>' +
            '</span>' +
          '</span>' +
        '</span>' +
        '<span class="cnum">' + (idx+1) + '번 이동장</span>';
      card.addEventListener("click", function(){ chooseCrate(breedId); });
      el.crateGrid.appendChild(card);
    });
  }

  function buildEyeColorGrid(breedId){
    var options = EYE_COLORS[breedId] || EYE_COLORS.golden;
    el.eyeColorGrid.innerHTML = "";
    options.forEach(function(color){
      var card = document.createElement("button");
      card.type = "button";
      card.className = "swatch-card";
      card.setAttribute("aria-label", "눈동자 색: " + color.name);
      var dot = document.createElement("span");
      dot.className = "swatch-dot";
      dot.style.background = color.hex;
      var label = document.createElement("span");
      label.className = "swatch-name";
      label.textContent = color.name;
      card.appendChild(dot);
      card.appendChild(label);
      card.addEventListener("click", function(){
        chosenEyeColor = color;
        el.stepEyeColor.hidden = true;
        el.stepCoatColor.hidden = false;
        buildCoatGrid(breedId);
      });
      el.eyeColorGrid.appendChild(card);
    });
  }

  function buildCoatGrid(breedId){
    var options = COAT_PALETTES[breedId] || COAT_PALETTES.golden;
    el.coatColorGrid.innerHTML = "";
    options.forEach(function(palette){
      var card = document.createElement("button");
      card.type = "button";
      card.className = "swatch-card";
      card.setAttribute("aria-label", "모색: " + palette.name);
      var dot = document.createElement("span");
      dot.className = "swatch-dot";
      dot.style.background = "linear-gradient(135deg, " + palette.fur.a + " 50%, " + palette.fur.b + " 50%)";
      var label = document.createElement("span");
      label.className = "swatch-name";
      label.textContent = palette.name;
      card.appendChild(dot);
      card.appendChild(label);
      card.addEventListener("click", function(){
        chosenCoat = palette;
        el.revealEyeColor.textContent = chosenEyeColor ? chosenEyeColor.name : "-";
        el.revealCoat.textContent = chosenCoat.name;
        el.stepCoatColor.hidden = true;
        el.stepReveal.hidden = false;
        el.nameInput.focus();
      });
      el.coatColorGrid.appendChild(card);
    });
  }

  function chooseCrate(breedId){
    chosenBreed = breedId;
    rolledPersonality = rollTrait(PERSONALITIES);
    rolledPassive = rollTrait(PASSIVES);
    var breed = BREEDS[breedId];
    el.revealBreed.textContent = breed.name;
    el.revealPersonality.textContent = rolledPersonality.name;
    el.revealPassive.textContent = rolledPassive.name;
    el.revealPassive.className = "rv " + (rolledPassive.positive ? "positive" : "negative");
    el.revealFlavor.textContent = breed.desc + " " + rolledPersonality.flavor + " " + rolledPassive.flavor;
    if(breedId === "mix"){
      // 29번: 믹스견은 등록된 견종 중 두 마리를 무작위로 매칭 — 그 중 하나를 체구(크기) 출처로 다시 뽑음
      var pool = PURE_BREED_ORDER.slice();
      var p1idx = Math.floor(Math.random()*pool.length);
      var p1 = pool.splice(p1idx,1)[0];
      var p2 = pool[Math.floor(Math.random()*pool.length)];
      chosenMixParents = [p1, p2];
      chosenMixGeoBreed = Math.random() < 0.5 ? p1 : p2;
      el.sizeHintWord.textContent = SIZE_LABEL[chosenMixGeoBreed] || "중형";
      // 31번: 스탯 산출 방식 굴림(부견쪽 45% / 모견쪽 45% / 완전 랜덤 10%)
      var statRoll = Math.random();
      chosenMixStatMethod = statRoll < 0.45 ? "sire" : (statRoll < 0.90 ? "dam" : "random");
      if(chosenMixStatMethod === "random"){
        el.revealFlavor.textContent += " 응? 얘는 눈이 마치 무지개처럼 빛나는걸.";
      }
    } else {
      chosenMixParents = null;
      chosenMixGeoBreed = null;
      chosenMixStatMethod = null;
      el.sizeHintWord.textContent = SIZE_LABEL[breedId] || "중형";
    }
    el.stepShelter.hidden = true;
    el.stepSizeHint.hidden = false;
  }

  el.sizeHintNext.addEventListener("click", function(){
    el.stepSizeHint.hidden = true;
    if(chosenBreed === "mix"){
      // 29번: 믹스견은 눈동자색·모색을 유저가 고르지 않고, 매칭된 두 견종의 팔레트에서 랜덤으로 바로 확정
      var eyePool = EYE_COLORS.mix.filter(function(c){ return chosenMixParents.indexOf(c.sourceBreed) !== -1; });
      var coatPool = COAT_PALETTES.mix.filter(function(c){ return chosenMixParents.indexOf(c.sourceBreed) !== -1; });
      chosenEyeColor = eyePool[Math.floor(Math.random()*eyePool.length)];
      chosenCoat = coatPool[Math.floor(Math.random()*coatPool.length)];
      el.revealEyeColor.textContent = chosenEyeColor.name;
      el.revealCoat.textContent = chosenCoat.name;
      el.stepReveal.hidden = false;
      el.nameInput.focus();
    } else {
      el.stepEyeColor.hidden = false;
      buildEyeColorGrid(chosenBreed);
    }
  });

