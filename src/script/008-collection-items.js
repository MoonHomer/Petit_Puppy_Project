  var COLLECTION_ITEMS = [
    { name:"민들레 홀씨", icon:"🌾", desc:"산책 중 흔하게 모이는 홀씨. 많이 모을수록 민첩성이 계단식으로 올라요(10/50/100개)." },
    { name:"조약돌", icon:"🪨", desc:"산책길에서 주운 반질반질한 돌. 많이 모을수록 건강함이 계단식으로 올라요(10/50/100개)." },
    { name:"나뭇가지", icon:"🌿", desc:"물고 다니기 좋은 나뭇가지. 많이 모을수록 에너지가 덜 소모돼요(10/50/100개)." },
    { name:"매끈한 낙엽", icon:"🍂", desc:"가을이면 유독 많이 밟게 되는 낙엽. 많이 모을수록 청결도가 천천히 줄어요(10/50/100개)." },
    { name:"추억의 목걸이", icon:"📿", desc:"반짝이는 조각과 낡은 리본을 모아 완성한 목걸이. 유대감이 크게, 친화력이 소폭 올라요." },
    { name:"오래된 목줄 조각", icon:"🦴", desc:"어딘가의 강아지가 쓰던 낡은 목줄 조각. 충성도가 크게 올라요." },
    { name:"반짝이는 발자국", icon:"✨", desc:"신비롭게 반짝이는 발자국. 생활만족도 전반이 소폭 올라요." },
    { name:"별빛 조각", icon:"🌟", desc:"밤하늘에서 떨어진 듯한 조각. 무작위 능력치와 유대감이 크게 올라요." },
    // 59번(58번 3~5번, 산책이벤트_지역별_v4.xlsx 신규 아이템 반영): 도토리(도로리 숲 FOREST-001)·
    // 조개껍데기(파르란 해변 BEACH-004·018)는 엑셀에 구체적 효과가 없어 사용자 확인(2026-09-03)에 따라
    // 민들레 홀씨·조약돌과 같은 "누적형"(10/50/100개 계단식 보너스) 방식으로 반영 — 도토리는 근력,
    // 조개껍데기는 친화력에 배정(아직 안 쓰인 스탯 중 지역 테마에 맞춰 선정, coreDisplayValue 참고).
    { name:"도토리", icon:"🌰", desc:"도로리 숲에서 종종 줍는 도토리. 많이 모을수록 근력이 계단식으로 올라요(10/50/100개)." },
    { name:"조개껍데기", icon:"🐚", desc:"파르란 해변에서 파도에 밀려온 조개껍데기. 많이 모을수록 친화력이 계단식으로 올라요(10/50/100개)." }
  ];
  // 35번: 재료 인벤토리(도감 미등록) — 반짝이는 조각·낡은 리본은 애착바구니 칸을 쓰지 않고 이 배열
  // 순서 그대로 attachMaterialsChips에 "이름 x개수" 칩으로만 노출.
  var MATERIAL_ITEMS = ["반짝이는 조각", "낡은 리본"];
  var attachActivePage = 0;
  function renderAttachBasket(){
    var tabs = el.attachTabs ? el.attachTabs.querySelectorAll(".attach-tab") : [];
    for(var t=0;t<tabs.length;t++){
      tabs[t].classList.toggle("active", Number(tabs[t].dataset.page) === attachActivePage);
    }
    var host = el.attachGrid;
    if(host){
      host.innerHTML = "";
      for(var i=0;i<16;i++){
        var cell = document.createElement("div");
        cell.className = "attach-cell";
        // 1페이지의 앞 8칸에만 실제 카탈로그를 배치(나머지 72칸은 기존처럼 빈 칸 유지)
        var item = (attachActivePage === 0) ? COLLECTION_ITEMS[i] : null;
        if(item){
          var owned = (state.walkItems && state.walkItems[item.name]) || 0;
          if(owned > 0){
            cell.className = "attach-cell filled";
            var iconSpan = document.createElement("span");
            iconSpan.className = "attach-cell-icon";
            iconSpan.setAttribute("aria-hidden", "true");
            iconSpan.textContent = item.icon;
            var nameSpan = document.createElement("span");
            nameSpan.className = "attach-cell-name";
            nameSpan.textContent = item.name;
            var qtySpan = document.createElement("span");
            qtySpan.className = "attach-cell-qty";
            qtySpan.textContent = "x" + owned;
            cell.appendChild(iconSpan);
            cell.appendChild(nameSpan);
            cell.appendChild(qtySpan);
            // 36번: title(호버 툴팁) 대신 탭하면 뜨는 설명 팝업으로 교체(모바일 대응, 요청 4번).
            (function(itemRef, ownedCount){
              cell.addEventListener("click", function(){
                showDescPopup(itemRef.icon + " " + itemRef.name + " x" + ownedCount, itemRef.desc);
              });
            })(item, owned);
          } else {
            cell.className = "attach-cell locked";
            cell.textContent = "?";
            cell.title = "아직 만나지 못했어요";
          }
        }
        host.appendChild(cell);
      }
    }
    if(el.attachMaterials && el.attachMaterialsChips){
      var mats = state.materials || {};
      var haveAny = MATERIAL_ITEMS.some(function(name){ return (mats[name] || 0) > 0; });
      el.attachMaterials.hidden = !haveAny;
      if(haveAny){
        el.attachMaterialsChips.innerHTML = "";
        MATERIAL_ITEMS.forEach(function(name){
          var count = mats[name] || 0;
          if(count <= 0) return;
          var chip = document.createElement("span");
          chip.className = "ability-chip";
          chip.textContent = name + " x" + count;
          el.attachMaterialsChips.appendChild(chip);
        });
      }
    }
  }
  if(el.attachTabs){
    el.attachTabs.querySelectorAll(".attach-tab").forEach(function(tabBtn){
      tabBtn.addEventListener("click", function(){
        attachActivePage = Number(this.dataset.page);
        renderAttachBasket();
      });
    });
  }

  function renderExtras(){
    renderAbilityCard();
    var friendIds = Object.keys(state.walkFriends || {});
    el.friendGroup.hidden = friendIds.length === 0;
    if(friendIds.length){
      el.friendList.innerHTML = "";
      friendIds.forEach(function(id){
        var f = state.walkFriends[id];
        var chip = document.createElement("span");
        chip.className = "ability-chip";
        chip.textContent = f.name + " · " + (WALK_FRIEND_LEVELS[f.level] || WALK_FRIEND_LEVELS[0]);
        el.friendList.appendChild(chip);
      });
    }
    // 35번: 애착바구니에 실제로 등록되는 8종(COLLECTION_ITEMS)은 [기본정보]의 "주운 것들" 더미 목록에서는
    // 제외해 같은 아이템이 두 화면에 중복 노출되지 않게 함 — 카탈로그 밖 더미 부산물(고라니 똥 등)만 그대로 노출.
    var itemIds = Object.keys(state.walkItems || {}).filter(function(id){
      return !COLLECTION_ITEMS.some(function(c){ return c.name === id; });
    });
    el.itemGroup.hidden = itemIds.length === 0;
    if(itemIds.length){
      el.itemList.innerHTML = "";
      itemIds.forEach(function(id){
        var chip = document.createElement("span");
        chip.className = "ability-chip";
        chip.textContent = id + " x" + state.walkItems[id];
        el.itemList.appendChild(chip);
      });
    }
  }

