  // 71번(산책 화면 실제 반영): "산책pov용 화면 개편" 확정 디자인(walk_pov_9breeds.html, 70-2번 카메라
  // 방향 확정 + 5차 피드백 최종본)을 실제 게임 데이터에 맞춰 그대로 옮긴 파일. 프로토타입에서 하드코딩했던
  // 하늘색·견종 모색·9견종 한정 테스트 UI는 걷어내고, 실제 게임의 drawPixelSky()(시간대·날씨 반영)·
  // cssVar("--fur-a" 등, 유저가 온보딩에서 고른 실제 모색)·growthVisual()(성장 단계 스케일·회색톤)·
  // WALK_PLACES 7개 지역으로 교체 연결함. 사용자 확인: "주화면은 현행 유지" — 이 파일은 산책 화면
  // (#walkScene) 전용이고 주화면(개집 화면, drawPixelScene)은 절대 건드리지 않음.
  //
  // 두 겹 캔버스 구조(006번 el 등록 참고):
  //  - #walkPovCanvas: 하늘·바닥·도로·좌우 소품(배경) 전용. 포즈 애니메이션(.walk-pose-*, 018번)의
  //    영향을 받지 않도록 반려견과 별개 레이어로 둠 — 이벤트 포즈로 반려견이 짧게 기울거나 커지는 연출이
  //    배경까지 함께 틀어지면 부자연스러워서 분리함.
  //  - #walkPixelCanvas(기존 요소 재사용): 반려견 전용, 투명 배경. 두 캔버스 모두 같은 좌표계
  //    (PX_W×PX_H, 002번 참고)를 쓰므로 항상 정확히 같은 지평선·도로 위치에 겹쳐 보임.
  // 실제 프레임 구동(매 rAF마다 updateWalkPovScene → drawWalkPovBackground/drawWalkPixelDog)은
  // 018-walk-engine-anim-events.js의 startWalkAnim()에서 함.

  // 주의(중요): 이 파일은 build.py가 파일명 알파벳순(001~024, 그리고 025)으로 이어붙여 하나의 IIFE로
  // 만든다. drawWalkPixelDog()(002번)는 render()(012번)가 "산책 화면이 열려있지 않아도" 매번 호출하고,
  // render()는 부트스트랩(024번)이 스크립트 로드 직후 곧바로 한 번 부르므로 — 파일 순서상 025번(이 파일)의
  // 최상위 코드가 아직 실행되기도 전에 이 파일 안의 함수가 호출될 수 있다. `function foo(){}` 선언은
  // 전체 스크립트 기준으로 완전히 호이스팅돼 항상 안전하지만, `var X = {...}` 형태의 최상위 대입은
  // "그 줄이 실제로 실행돼야" 값이 채워지므로 그 전에 참조하면 undefined다(실제로 이 문제로 최초 구현이
  // 깨졌었음 — Playwright 검증 라운드에서 발견). 그래서 상수성 테이블(WALK_REGION_VISUALS/WALK_BREED_FRONT)과
  // PX_H 의존 계산값(WALK_POV_HORIZON/WALK_POV_SCALE)을 전부 "처음 호출될 때 한 번만 계산해 캐싱하는
  // 함수"로 감싸 파일 로드 순서와 완전히 무관하게 만듦.
  function walkPovHorizon(){ return Math.round(PX_H * 46/120); } // 프로토타입 180x120/HORIZON=46 비율을 그대로 축소
  function walkPovScale(){ return PX_W / 180; } // 프로토타입(180 너비) 좌표계 → 게임 캔버스(PX_W=150, 같은 3:2 비율) 축소 배율

  // ---- 원근 헬퍼(프로토타입과 동일한 이름·공식 유지 — 나란히 비교하기 쉽게) ----
  function ease(d){ return Math.pow(1-d, 1.6); } // d:0(가까움)~1(지평선) -> 0..1 스케일
  function screenY(d){ return walkPovHorizon() + (PX_H - walkPovHorizon()) * ease(d); }
  function roadHalfWidth(d){ var s = ease(d); return (3 + s*82) * walkPovScale(); }

  function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  // ---- 지역별 배경 팔레트(WALK_PLACES/WALK_REGIONS와 id 반드시 일치) ----
  // 하늘은 기존 drawPixelSky()(시간대 4단계 × 실제 날씨 7종 반영, 002번)를 그대로 재사용하고,
  // 바닥·도로·좌우 소품(나무/갈대/야자수/울타리)만 지역별로 새로 정의함. forest/lake/beach/city는
  // 9breeds 프로토타입에서 이미 만들어둔 값을 그대로 가져오고, home/park/mtn(프로토타입에 없던 3곳)은
  // 이번에 새로 잡음 — WALK_PLACES 아이콘(🏠🌳🏔️)에 맞춰 각각 아늑한 동네 골목(집 근처), 잔디밭
  // 공원(동네 공원), 바위 섞인 등산로(소로록 산) 톤으로 설계.
  var _walkRegionVisualsCache = null;
  function walkRegionVisuals(){
    if(!_walkRegionVisualsCache){
      _walkRegionVisualsCache = {
        home:   { groundNear:"#C9B98A", groundFar:"#DDD0A8", road:"#B8A47A", roadDark:"#9C8860", prop:"#8A6D5C", propDark:"#6B5245", propType:"fence" },
        park:   { groundNear:"#6E8F5B", groundFar:"#93B378", road:"#C9B98A", roadDark:"#AD9A6E", prop:"#3F6B3A", propDark:"#2C4E29", propType:"tree" },
        forest: { groundNear:"#5C7A4C", groundFar:"#8FAE72", road:"#8A7256", roadDark:"#6E5A43", prop:"#3F6B3A", propDark:"#2C4E29", propType:"tree" },
        mtn:    { groundNear:"#8B8577", groundFar:"#ACA694", road:"#9C9280", roadDark:"#7D7462", prop:"#5B6E4E", propDark:"#425138", propType:"tree" },
        lake:   { groundNear:"#5A9E8F", groundFar:"#86C2B4", road:"#93866C", roadDark:"#75694F", prop:"#3E85A6", propDark:"#2A6280", propType:"reed" },
        city:   { groundNear:"#9AA6AC", groundFar:"#B9C0BC", road:"#5B5F5E", roadDark:"#454847", prop:"#8A6D5C", propDark:"#6B5245", propType:"fence" },
        beach:  { groundNear:"#E4C88A", groundFar:"#EFDDAE", road:"#DCC48E", roadDark:"#C2A971", prop:"#3F8F82", propDark:"#2C6A5F", propType:"palm" }
      };
    }
    return _walkRegionVisualsCache;
  }
  function currentWalkRegionVisual(){
    var placeId = (state.walk.session && state.walk.session.place) ? state.walk.session.place.id : "home";
    return walkRegionVisuals()[placeId] || walkRegionVisuals().home;
  }

  // ---- 견종별 정면 실루엣 특징(귀 모양·무늬·체구 배율) ----
  // AKC 견종 표준·나무위키(진돗개/시바견) 리서치를 반영한 9breeds 프로토타입 표를 그대로 이식. 모색
  // (furA/furADark)은 여기 넣지 않고 drawWalkFrontDog()에서 drawPixelDog()와 똑같이 cssVar("--fur-a" 등)로
  // 매번 읽어옴 — 유저가 온보딩에서 실제로 고른 모색(COAT_PALETTES)이 마당 화면과 동일하게 반영되게 함.
  var _walkBreedFrontCache = null;
  function walkBreedFront(){
    if(!_walkBreedFrontCache){
      _walkBreedFrontCache = {
        golden:   { earStyle:"floppy",     scale:1.0,  name:"골든 리트리버" },
        labrador: { earStyle:"floppyLow",  scale:0.95, name:"래브라도 리트리버" },
        jindo:    { earStyle:"erect",      scale:0.88, snoutLong:true, name:"진돗개" },
        shiba:    { earStyle:"erectSmall", scale:0.66, urajiro:true, name:"시바견" },
        border:   { earStyle:"asymmetric",scale:0.92, blaze:true, chestWhite:true, name:"보더콜리" },
        corgi:    { earStyle:"erect",      scale:0.6,  blaze:true, name:"웰시코기" },
        pom:      { earStyle:"erectSmall", scale:0.5,  fluffy:true, name:"포메라니안" },
        husky:    { earStyle:"erect",      scale:0.85, mask:true, chestWhite:true, name:"시베리안 허스키" },
        shihtzu:  { earStyle:"floppyLong", scale:0.5,  fluffy:true, snoutShort:true, name:"시츄" }
      };
    }
    return _walkBreedFrontCache;
  }

  // ---- 좌우 소품(풀/나무/울타리) 스크롤 상태 ----
  var walkPovProps = [], walkPovTravel = 0;
  function walkPovSpawnProp(dInit){
    walkPovProps.push({
      d: dInit != null ? dInit : 1,
      side: Math.random() < 0.5 ? -1 : 1,
      lane: 0.15 + Math.random()*0.55,
      kind: Math.random() < 0.7 ? "small" : "big"
    });
  }
  function drawWalkPovProp(ctx, p, region){
    var sy = screenY(p.d);
    var s = ease(p.d);
    if(s < 0.02) return;
    var hw = roadHalfWidth(p.d);
    var baseX = PX_W/2 + p.side * (hw + p.lane * (4 + s*60) * walkPovScale());
    var size = ((p.kind === "big" ? 16 : 8) * s + 1) * walkPovScale();
    ctx.fillStyle = p.kind === "big" ? region.propDark : region.prop;
    if(region.propType === "tree"){
      ctx.fillRect(baseX - size*0.12, sy - size*0.9, size*0.24, size*0.9);
      ctx.beginPath();
      ctx.fillStyle = region.prop;
      ctx.arc(baseX, sy - size*0.95, size*0.55, 0, Math.PI*2);
      ctx.fill();
    } else if(region.propType === "reed"){
      ctx.fillRect(baseX-1, sy-size, 2, size);
      ctx.fillRect(baseX-size*0.3, sy-size*0.7, 2, size*0.7);
    } else if(region.propType === "palm"){
      ctx.fillRect(baseX-size*0.08, sy-size, size*0.16, size);
      ctx.fillStyle = region.prop;
      for(var k=0;k<4;k++){
        ctx.save();
        ctx.translate(baseX, sy-size);
        ctx.rotate(k*1.6);
        ctx.fillRect(0, 0, size*0.5, size*0.14);
        ctx.restore();
      }
    } else { // fence
      ctx.fillRect(baseX - size*0.08, sy-size, size*0.16, size);
      ctx.fillRect(baseX - size*0.5, sy-size*0.55, size, size*0.12);
    }
  }

  // ---- 반려견 접근 루프 상태 ----
  var dogLoopPhase = 0; // 0(방금 지평선에서 등장) ~ 1(카메라 코앞) 반복
  var DOG_APPROACH_SPEED = 0.14; // 1초에 이 비율만큼 접근(프로토타입 값 그대로)

  // 산책이 새로 시작되거나(startWalk) 새로고침 후 이어질 때(resumeSession) 호출 — 소품·접근 루프를 처음 상태로.
  function resetWalkPovScene(){
    dogLoopPhase = 0;
    walkPovTravel = 0;
    walkPovProps = [];
    for(var i=0;i<14;i++) walkPovSpawnProp(Math.random());
  }

  // 매 애니메이션 프레임(018번 startWalkAnim의 rAF 루프)마다 호출 — 도로 스크롤·소품 이동·접근 루프 진행.
  function updateWalkPovScene(dt){
    walkPovTravel += dt * 0.5;
    walkPovProps.forEach(function(p){
      p.d -= dt * 0.22;
      if(p.d <= 0){
        p.d = 1;
        p.side = Math.random() < 0.5 ? -1 : 1;
        p.lane = 0.15 + Math.random()*0.55;
        p.kind = Math.random() < 0.7 ? "small" : "big";
      }
    });
    dogLoopPhase += dt * DOG_APPROACH_SPEED;
    if(dogLoopPhase > 1) dogLoopPhase -= 1;
  }

  // 배경(하늘·바닥·도로·소품) — #walkPovCanvas 전용, 반려견 레이어와 완전히 분리.
  function drawWalkPovBackground(){
    if(!el.walkPovCanvas || !el.walkPovCanvas.getContext) return;
    var ctx = el.walkPovCanvas.getContext("2d");
    if(!ctx) return;
    ctx.clearRect(0, 0, PX_W, PX_H);
    var region = currentWalkRegionVisual();

    // 하늘 — 마당 화면과 동일한 시간대/날씨 반영 렌더러 재사용(67번 drawPixelSky, 002번)
    drawPixelSky(ctx, walkPovHorizon());

    // 바닥(원경~근경 그라디언트)
    var gg = ctx.createLinearGradient(0, walkPovHorizon(), 0, PX_H);
    gg.addColorStop(0, region.groundFar);
    gg.addColorStop(1, region.groundNear);
    ctx.fillStyle = gg;
    ctx.fillRect(0, walkPovHorizon(), PX_W, PX_H - walkPovHorizon());

    // 도로(행마다 폭이 좁아지는 사다리꼴 — 얇은 가로띠로 근사, 진행에 따라 스크롤)
    for(var y = walkPovHorizon(); y < PX_H; y++){
      var d = 1 - (y - walkPovHorizon()) / (PX_H - walkPovHorizon());
      var hw = roadHalfWidth(d);
      var stripe = Math.floor((walkPovTravel*40 + y)/4) % 2 === 0;
      ctx.fillStyle = stripe ? region.road : region.roadDark;
      ctx.fillRect(PX_W/2 - hw, y, hw*2, 1);
    }
    // 중앙 점선
    ctx.fillStyle = "#F3EEDE";
    for(var i=0;i<10;i++){
      var dd = ((i/10) + walkPovTravel*0.25) % 1;
      var sy2 = screenY(dd), s2 = ease(dd);
      if(s2 < 0.03) continue;
      var lw = Math.max(1, 3*s2*walkPovScale());
      ctx.fillRect(PX_W/2 - lw/2, sy2, lw, Math.max(1, 2*s2));
    }

    // 좌우 소품(먼 것부터 그려 가까운 소품이 위에 겹치게)
    walkPovProps.slice().sort(function(a,b){ return b.d - a.d; }).forEach(function(p){ drawWalkPovProp(ctx, p, region); });
  }

  // 반려견(정면) — #walkPixelCanvas 전용, 투명 배경. drawWalkPixelDog()(002번)에서 매 프레임 호출됨.
  function drawWalkFrontDog(ctx, t){
    var breedId = state.breed || "golden";
    // 29번 관례와 동일: 믹스견은 전용 구조 데이터가 없어, 온보딩 때 매칭된 두 견종 중 체구 출처로 뽑힌
    // 쪽의 정면 실루엣 구조(귀 모양 등)를 그대로 재사용.
    if(breedId === "mix" && state.mixGeoBreed){ breedId = state.mixGeoBreed; }
    var bf = walkBreedFront()[breedId] || walkBreedFront().golden;
    var gv = growthVisual();

    // 70번(drawPixelDog)과 동일한 방식으로 실제 모색·눈동자색을 CSS 변수에서 읽어옴 — 온보딩에서 고른
    // 색이 마당 화면과 산책 화면 양쪽에 항상 동일하게 반영되게 함.
    var furA = cssVar("--fur-a", "#E7C79A");
    var furADark = cssVar("--fur-a-dark", "#C79E68");
    var furC = cssVar("--fur-c", "#FBF2DF");
    var furD = cssVar("--fur-d", "#4A4038");
    var eyeColor = cssVar("--eye-color", furD);
    if(gv.grey){
      furA = mixHexToGrey(furA, 0.32);
      furADark = mixHexToGrey(furADark, 0.32);
    }

    var d = Math.max(0.02, 1 - dogLoopPhase); // d:1(지평선)~0(카메라 코앞)
    var sy = screenY(d);
    var s = ease(d);
    var sc = bf.scale * gv.scale; // 견종 체구 배율 × 성장단계 배율(70번 관례와 동일)
    var earPerk = gv.earPerk;
    var sway = Math.sin(t*2.1) * 5 * s * sc;
    var bob = Math.sin(t*6.4) * 1.4 * s * sc;
    var cx = PX_W/2 + sway;

    // 마인크래프트 모브풍 "각진 블록형" 비례 — 세로 비율 머리3:몸통5:다리1, 몸통 가로폭=머리 가로폭
    // (5차에 걸친 사용자 피드백으로 확정된 최종 비율, walk_pov_9breeds.html 그대로 이식)
    var unit = ((9 + s*54) * sc) / 9;
    var headH = unit*3, bodyH = unit*5, legH = unit*1;
    var blockW = unit*5.4;
    var headW = blockW, bodyW = blockW;
    var legW = bodyW*0.26, legGap = bodyW*0.16;

    var totalH = headH*0.86 + bodyH*0.92 + legH;
    var headTop = sy - totalH*0.58 + bob + (gv.headDroop || 0);
    var headY = headTop + headH/2;
    var bodyTop = headTop + headH*0.86;
    var bodyBottom = bodyTop + bodyH;
    var headX = cx;

    // 앞다리 2개(존재감만 주는 짧은 길이) — 몸통보다 먼저 그려 몸통이 윗부분을 살짝 덮게 함
    if(s > 0.04){
      var legY = bodyBottom - bodyH*0.12;
      ctx.fillStyle = furADark;
      roundRect(ctx, cx-legGap/2-legW, legY, legW, legH, legW*0.22); ctx.fill();
      roundRect(ctx, cx+legGap/2, legY, legW, legH, legW*0.22); ctx.fill();
      if(s > 0.12){
        ctx.fillStyle = "#F4F1E6";
        var pawH = legH*0.32;
        roundRect(ctx, cx-legGap/2-legW, legY+legH-pawH, legW, pawH, legW*0.2); ctx.fill();
        roundRect(ctx, cx+legGap/2, legY+legH-pawH, legW, pawH, legW*0.2); ctx.fill();
      }
    }

    // 몸통(가슴, 각진 사다리꼴) — 하단 좌우로 벌려 뒷다리/엉덩이가 있는 인상을 실루엣만으로 표현
    var hipFlare = bodyW*0.24;
    ctx.fillStyle = furA;
    ctx.beginPath();
    ctx.moveTo(cx-bodyW/2, bodyTop);
    ctx.lineTo(cx+bodyW/2, bodyTop);
    ctx.lineTo(cx+bodyW/2+hipFlare, bodyBottom);
    ctx.lineTo(cx-bodyW/2-hipFlare, bodyBottom);
    ctx.closePath();
    ctx.fill();
    if(bf.chestWhite && s > 0.1){
      ctx.fillStyle = "#F4F1E6";
      roundRect(ctx, cx-bodyW*0.24, bodyTop+bodyH*0.2, bodyW*0.48, bodyH*0.75, bodyW*0.12); ctx.fill();
    }
    if(bf.fluffy && s > 0.15){
      ctx.fillStyle = furA;
      for(var i=0;i<5;i++){
        var ang = Math.PI + (i/4)*Math.PI;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang)*bodyW*0.46, bodyTop+bodyH*0.3 + Math.sin(ang)*bodyH*0.3, bodyW*0.18, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // 귀(머리보다 먼저 그려 머리 뒤로 살짝 걸치게) — 견종별 5가지 스타일
    var earW = headW*0.3;
    function erectEar(sideSign, w, h, rot){
      w *= earPerk; h *= earPerk;
      ctx.save(); ctx.translate(headX+sideSign*headW*0.34, headY-headH*0.4); ctx.rotate(sideSign*rot);
      ctx.beginPath(); ctx.moveTo(-w*0.5,0); ctx.lineTo(w*0.5,0); ctx.lineTo(0,-h); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    function floppyEar(sideSign, xRatio, yRatio, w, h, wag){
      w *= earPerk; h *= earPerk;
      ctx.save(); ctx.translate(headX+sideSign*headW*xRatio, headY-headH*yRatio);
      ctx.rotate(sideSign*(-0.08+Math.sin(t*4+(sideSign>0?1.5:0))*0.04*s*(wag?1:0)));
      roundRect(ctx, -w*0.5, 0, w, h, w*0.45); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = furADark;
    if(bf.earStyle === "erect"){
      erectEar(-1, earW, headH*0.58, 0.22); erectEar(1, earW, headH*0.58, 0.22);
    } else if(bf.earStyle === "erectSmall"){
      erectEar(-1, earW*0.72, headH*0.4, 0.28); erectEar(1, earW*0.72, headH*0.4, 0.28);
    } else if(bf.earStyle === "asymmetric"){
      // 보더콜리: AKC 표준 "한쪽 또는 양쪽 귀가 서거나 반쯤 접힘" — 한쪽은 쫑긋, 한쪽은 끝이 접힘
      erectEar(-1, earW*0.85, headH*0.5, 0.24);
      ctx.save(); ctx.translate(headX+headW*0.34, headY-headH*0.4); ctx.rotate(0.3);
      ctx.beginPath(); ctx.moveTo(-earW*0.42,0); ctx.lineTo(earW*0.42,0); ctx.lineTo(earW*0.05,-headH*0.34); ctx.lineTo(earW*0.4,-headH*0.22); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if(bf.earStyle === "floppyLow"){
      floppyEar(-1, 0.44, 0.02, earW*0.95, headH*0.62, true); floppyEar(1, 0.44, 0.02, earW*0.95, headH*0.62, true);
    } else if(bf.earStyle === "floppyLong"){
      floppyEar(-1, 0.5, 0.1, earW*1.15, headH*0.95, false); floppyEar(1, 0.5, 0.1, earW*1.15, headH*0.95, false);
    } else {
      floppyEar(-1, 0.46, 0.08, earW, headH*0.8, true); floppyEar(1, 0.46, 0.08, earW, headH*0.8, true);
    }

    // 머리(정면, 몸통과 마찬가지로 각진 블록형)
    ctx.fillStyle = furA;
    roundRect(ctx, headX-headW/2, headY-headH/2, headW, headH, headH*0.26); ctx.fill();
    if(bf.blaze){
      ctx.fillStyle = "#FBF6EC";
      roundRect(ctx, headX-headW*0.16, headY-headH*0.02, headW*0.32, headH*0.5, headW*0.14); ctx.fill();
    }
    if(bf.urajiro && s > 0.1){
      // 시바견: 볼 양쪽 크림색 "우라지로" 무늬(리서치로 확인한 필수 특징)
      ctx.fillStyle = "#F0DCC0";
      ctx.beginPath(); ctx.ellipse(headX-headW*0.28, headY+headH*0.2, headW*0.17, headH*0.16, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(headX+headW*0.28, headY+headH*0.2, headW*0.17, headH*0.16, 0, 0, Math.PI*2); ctx.fill();
    }
    if(bf.mask && s > 0.1){
      // 허스키: 눈가 마스크 무늬(AKC "striking masks, spectacles")
      ctx.fillStyle = "#5B6169";
      roundRect(ctx, headX-headW*0.42, headY-headH*0.18, headW*0.3, headH*0.32, headW*0.1); ctx.fill();
      roundRect(ctx, headX+headW*0.12, headY-headH*0.18, headW*0.3, headH*0.32, headW*0.1); ctx.fill();
    }

    if(s > 0.06){
      // 눈 2개 — 저해상도에서 원(arc)이 "+"자로 뭉개지는 문제(4차 피드백)를 피해 중앙 픽셀만 살린
      // 정사각형으로 표현. 색은 온보딩에서 고른 실제 눈동자색(cssVar --eye-color)을 그대로 씀.
      ctx.fillStyle = eyeColor;
      var eyeY = headY - headH*0.02, eyeSize = Math.max(1, headW*0.045);
      ctx.fillRect(headX-headW*0.22-eyeSize/2, eyeY-eyeSize/2, eyeSize, eyeSize);
      ctx.fillRect(headX+headW*0.22-eyeSize/2, eyeY-eyeSize/2, eyeSize, eyeSize);
      // 주둥이(밝은 패치) + 코 — 진돗개는 길게, 시츄는 짧고 납작하게(단두종)
      ctx.fillStyle = bf.urajiro ? "#F0DCC0" : furC;
      var snoutMult = bf.snoutLong ? 1.35 : (bf.snoutShort ? 0.55 : 1.0);
      var snoutW = headW*0.42*(bf.snoutShort?1.15:1), snoutH = headH*0.34*snoutMult;
      var snoutTop = headY + headH*(bf.snoutShort ? 0.22 : 0.14);
      roundRect(ctx, headX-snoutW/2, snoutTop, snoutW, snoutH, snoutW*0.4); ctx.fill();
      ctx.fillStyle = furD;
      var noseR = Math.max(0.5, headW*(bf.snoutShort?0.09:0.075));
      var noseCy = snoutTop+snoutH*0.55;
      ctx.beginPath(); ctx.arc(headX, noseCy, noseR, 0, Math.PI*2); ctx.fill();
      // 입("⊥" 모양) — 코 아래 짧은 세로선 + 끝에 가로선, 세로:가로 비율 1:2(4차 피드백 확정치)
      var mouthStemW = Math.max(1, headW*0.02);
      var mouthStemH = snoutH*0.3;
      var mouthStemY = noseCy + noseR*0.8;
      ctx.fillRect(headX-mouthStemW/2, mouthStemY, mouthStemW, mouthStemH);
      var mouthBarW = mouthStemH*2, mouthBarH = Math.max(1, headW*0.02);
      ctx.fillRect(headX-mouthBarW/2, mouthStemY+mouthStemH-mouthBarH, mouthBarW, mouthBarH);
    }
  }
