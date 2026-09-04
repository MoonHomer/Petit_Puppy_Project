  function rollTrait(list){ return list[Math.floor(Math.random()*list.length)]; }
  function findById(list, id){
    for(var i=0;i<list.length;i++){ if(list[i].id === id) return list[i]; }
    return list[0];
  }
  // 35번(수집아이템 관련 실험 문서 8장): 애착바구니 누적형 아이템 중 나뭇가지(자립감 소모 완화)·
  // 매끈한 낙엽(청결 감소 완화)의 보정치. "10개 -5%/50개 -10%/100개 -15%"를 계단식(구간별 고정값,
  // 누적 합산 아님)으로 해석 — 문서의 다른 누적형 스탯 아이템(민들레 홀씨·조약돌)과 동일한 표현이라
  // 같은 규칙을 적용함.
  function collectionDecayEase(count){
    if(count >= 100) return 0.15;
    if(count >= 50) return 0.10;
    if(count >= 10) return 0.05;
    return 0;
  }
  // effMult()가 이미 "여러 출처의 배수를 곱한다" 구조라, 아이템 보정을 네 번째 출처로 자연스럽게
  // 얹음 — energyDrain(자립감 소모)·cleanDrain(청결 감소) 두 키를 쓰는 기존 호출부(doPlay/trainStat/
  // finishWalk/applyDecay) 전부에 이 파일 안 다른 곳을 고칠 필요 없이 자동으로 적용됨.
  function itemMultSource(){
    var items = (typeof state !== "undefined" && state.walkItems) ? state.walkItems : {};
    return {
      energyDrain: 1 - collectionDecayEase(items["나뭇가지"] || 0),
      cleanDrain: 1 - collectionDecayEase(items["매끈한 낙엽"] || 0)
    };
  }
  // 여러 출처(견종/성격/패시브/수집 아이템)의 배수를 곱해 최종 배수를 계산
  function effMult(){
    var keys = Array.prototype.slice.call(arguments);
    var breed = BREEDS[state.breed] || BREEDS.golden;
    var personality = findById(PERSONALITIES, state.personality);
    var passive = findById(PASSIVES, state.passive);
    var sources = [breed.mult, personality.mult, passive.mult, itemMultSource()];
    var result = 1;
    keys.forEach(function(k){
      sources.forEach(function(src){
        if(src && typeof src[k] === "number") result *= src[k];
      });
    });
    return result;
  }
  // 같은 강도의 활동이라도 이 아이에게 쉬웠는지 힘들었는지에 따라 다른 문장 풀에서 골라요.
  // 수치(배수)는 화면에 보여주지 않고, 그 결과만 문장으로 간접적으로 드러냅니다.
  function tierFor(mult){
    if(mult <= 0.9) return "eager";
    if(mult >= 1.1) return "tired";
    return "normal";
  }
