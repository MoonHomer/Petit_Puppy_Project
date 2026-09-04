  var PX_W = 150, PX_H = 100;
  var HUMAN_HEIGHT_CM = 170;
  var HEAD_TO_HEIGHT_RATIO = 7.5; // 성인 평균 신체비율(머리 개수 기준 근사치)
  var SCREEN_CM_HEIGHT = HUMAN_HEIGHT_CM + (HUMAN_HEIGHT_CM / HEAD_TO_HEIGHT_RATIO); // 사람 키 + 머리 하나 여유
  var CM_PER_PX = SCREEN_CM_HEIGHT / PX_H;
  // 견종별 대략적인 실측치(경계 자세로 섰을 때 정수리까지의 높이) — 견종 표준 참고 근사치
  // earStyle: 귀 형태(처진귀/쫑긋선귀), tailStyle: 꼬리 형태(흔들이/수달꼬리/말린꼬리/짧은꼬리/풍성한꼬리)
  // bodyHRatio: 몸통 높이 비율(클수록 배가 낮고 다부짐), rumpBump: 엉덩이가 봉긋한 실루엣 여부
  // earScale/snoutRatio: 귀·주둥이 크기를 품종 인상에 맞게 개별 보정
  var BREED_PXSCALE = {
    golden:{ heightCm:71, lengthRatio:1.15, legRatio:0.30, earStyle:"floppy", tailStyle:"wag", earScale:1.15 },
    labrador:{ heightCm:66, lengthRatio:1.2, legRatio:0.28, earStyle:"floppy", tailStyle:"otter" },
    jindo:{ heightCm:62, lengthRatio:1.15, legRatio:0.33, earStyle:"erect", tailStyle:"curl", snoutRatio:0.34 },
    shiba:{ heightCm:46, lengthRatio:1.15, legRatio:0.30, earStyle:"erect", tailStyle:"curl", snoutRatio:0.34 },
    border:{ heightCm:63, lengthRatio:1.15, legRatio:0.32, earStyle:"erect", tailStyle:"wag" },
    corgi:{ heightCm:38, lengthRatio:2.0, legRatio:0.15, bodyHRatio:0.52, earStyle:"erect", tailStyle:"stub", earScale:1.3, snoutRatio:0.4, rumpBump:true },
    pom:{ heightCm:32, lengthRatio:1.05, legRatio:0.22, earStyle:"erect", tailStyle:"plume" },
    // 31번: 시베리안 허스키 — 늑대상의 다부진 체형, 쫑긋 선 귀에 등 위로 살짝 말리는 꼬리
    husky:{ heightCm:58, lengthRatio:1.15, legRatio:0.30, earStyle:"erect", tailStyle:"curl" },
    // 31번: 시츄 — 짧은 다리에 낮은 체고, 단두종 특유의 짧은 주둥이(snoutRatio 최소치), 풍성한 꼬리는 포메 스타일 재활용
    shihtzu:{ heightCm:26, lengthRatio:1.15, legRatio:0.21, earStyle:"floppy", tailStyle:"plume", snoutRatio:0.24 }
  };
  // 32번: 산책 팝업의 반려견이 너무 작다는 피드백 반영 — 픽셀모드 산책 캔버스의 표시 크기를
  // "대형견 기준 체고가 팝업(.walk-scene, 120px) 높이의 2/3를 차지"하도록 역산해서 정함.
  // BREED_PXSCALE에 등록된 견종 중 heightCm가 가장 큰 쪽을 "대형견 기준"으로 자동 선택하므로,
  // 나중에 더 큰 견종이 추가돼도 이 계산이 다시 맞춰짐.
  var WALK_SCENE_HEIGHT_PX = 120; // .walk-scene의 CSS height와 반드시 일치해야 하는 값
  var WALK_LARGE_HEIGHT_RATIO = 2/3;
  var WALK_CANVAS_SCALE = (function(){
    var maxHeightCm = 0;
    Object.keys(BREED_PXSCALE).forEach(function(k){
      if(BREED_PXSCALE[k].heightCm > maxHeightCm) maxHeightCm = BREED_PXSCALE[k].heightCm;
    });
    var rawH = Math.max(6, Math.round(maxHeightCm / CM_PER_PX)); // drawPixelDog()와 동일한 공식
    return (WALK_SCENE_HEIGHT_PX * WALK_LARGE_HEIGHT_RATIO) / rawH;
  })();
  var WALK_CANVAS_DISPLAY_W = Math.round(PX_W * WALK_CANVAS_SCALE);
  var WALK_CANVAS_DISPLAY_H = Math.round(PX_H * WALK_CANVAS_SCALE);
  function cssVar(name, fallback){
    try{
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    }catch(e){ return fallback; }
  }
  function reduceMotion(){
    try{ return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch(e){ return false; }
  }

  var pixelBlink = false, pixelTailFrame = false, pixelBobUp = false;
  var pixelBlinkTimer = null, pixelTailTimer = null, pixelBobTimer = null;

  // 50번: offsetX — 기본은 마당 중앙(cx)이지만, 엔딩씬 '달성' 결과에서는 이동장이 있던 우측 자리에
  // 강아지가 다시 노출돼야 해서(사용자 원안: "이동장이 있던 자리에 반려견이 다시 노출됨") 그 지점으로
  // 실루엣 전체를 그대로 밀어 그릴 수 있도록 함. 다른 모든 호출부(홈 화면·산책 팝업)는 생략 시 0으로 기존과 동일.
  // 53번: forceEyesClosed — 멍멍모드의 수면형 포즈(웅크려 잠들기/꿈꾸는 다리)에서 mood나 blink 타이밍과
  // 무관하게 항상 눈을 감은 모습으로 그리기 위한 선택 인자. 생략하면(undefined/false) 기존 로직 그대로.
  function drawPixelDog(ctx, groundRow, offsetX, forceEyesClosed){
    var breedId = state.breed || "golden";
    // 29번: 믹스견은 전용 실루엣이 없어, 온보딩 때 매칭된 두 견종 중 체구 출처로 뽑힌 쪽의 픽셀 지오메트리를 그대로 재사용
    if(breedId === "mix" && state.mixGeoBreed){ breedId = state.mixGeoBreed; }
    var sc = BREED_PXSCALE[breedId] || BREED_PXSCALE.golden;
    var earStyle = sc.earStyle || "floppy";
    var tailStyle = sc.tailStyle || "wag";
    var H = Math.max(6, Math.round(sc.heightCm / CM_PER_PX));
    var L = Math.max(6, Math.round(H * sc.lengthRatio));
    var legH = Math.max(2, Math.round(H * sc.legRatio));
    var bodyH = Math.max(3, Math.round(H * (sc.bodyHRatio || 0.40)));
    var headH = Math.max(3, H - legH - bodyH);
    var bodyW = Math.max(4, Math.round(L * 0.56));
    // 머리 폭은 "길이"가 아니라 "체고"를 기준으로 잡아, 몸통이 길게 늘어난 견종(웰시코기 등)도
    // 머리만 같이 늘어나 보이지 않고 자연스러운 크기를 유지하게 함
    var headW = Math.max(4, Math.round(H * 0.40));

    var cx = Math.round(PX_W/2) + 2 + (offsetX || 0);
    var bodyLeft = cx - Math.round(bodyW/2);
    var bodyRight = bodyLeft + bodyW;
    var bodyBottom = groundRow - legH;
    var bodyTop = bodyBottom - bodyH;
    // 머리는 몸통 앞쪽(오른쪽) 끝에 상당 부분 겹쳐 붙어, 목이 끊겨 보이지 않도록 함
    var headLeft = bodyRight - Math.round(headW*0.68);
    var headBottom = bodyTop + Math.round(bodyH*0.55);
    var headTop = headBottom - headH;
    var headRight = headLeft + headW;

    var mood = moodOf();
    var oy = (mood !== "sleepy" && !reduceMotion() && pixelBobUp) ? -1 : 0;

    var furA = cssVar("--fur-a", "#E7C79A");
    var furADark = cssVar("--fur-a-dark", "#C79E68");
    var furB = cssVar("--fur-b", "#B98A5E");
    var furC = cssVar("--fur-c", "#EDEDED");
    var furD = cssVar("--fur-d", "#4A4038");
    var eyeColor = cssVar("--eye-color", furD);

    // 다리 — 앞다리/뒷다리 각 2개씩, "먼 쪽 다리 + 가까운 쪽 다리"로 겹쳐 그려 네 발 짐승처럼 보이게 함
    var legW = Math.max(1, Math.round(bodyW*0.14));
    var legGap = Math.max(1, Math.round(legW*0.85));
    var pawH = Math.max(1, Math.round(legH*0.22));
    var backBaseX = bodyLeft + Math.round(bodyW*0.14);
    var frontBaseX = bodyRight - Math.round(bodyW*0.14) - legW;
    function drawLegPair(baseX){
      ctx.fillStyle = furADark;
      ctx.fillRect(baseX - legGap, bodyBottom + oy, legW, legH); // 먼 쪽 다리
      ctx.fillRect(baseX, bodyBottom + oy, legW, legH);          // 가까운 쪽 다리
      ctx.fillStyle = furD;
      ctx.fillRect(baseX - legGap, bodyBottom + legH - pawH + oy, legW, pawH);
      ctx.fillRect(baseX, bodyBottom + legH - pawH + oy, legW, pawH);
    }
    drawLegPair(backBaseX);
    drawLegPair(frontBaseX);

    // 꼬리 (품종별 형태)
    var tailW = Math.max(1, Math.round(L*0.15));
    var tailH = Math.max(1, Math.round(bodyH*0.5));
    ctx.fillStyle = furA;
    if(tailStyle === "curl"){
      // 진돗개/시바견: 등 위로 동그랗게 말린 꼬리
      var curlSize = Math.max(3, Math.round(bodyH*0.6));
      var curlX = bodyLeft - Math.round(curlSize*0.25);
      var curlY = bodyTop - Math.round(curlSize*0.4);
      ctx.fillRect(curlX, curlY + oy, curlSize, curlSize);
      ctx.fillStyle = furADark;
      var innerSize = Math.max(1, Math.round(curlSize*0.4));
      ctx.fillRect(curlX + Math.round(curlSize*0.28), curlY + Math.round(curlSize*0.24) + oy, innerSize, innerSize);
    } else if(tailStyle === "plume"){
      // 포메라니안: 풍성하게 부풀어 오른 꼬리
      var plumeW = Math.max(2, Math.round(tailW*1.7));
      var plumeH = Math.max(2, Math.round(tailH*1.7));
      ctx.fillRect(bodyLeft - plumeW + 2, bodyTop - Math.round(plumeH*0.3) + oy, plumeW, plumeH);
    } else if(tailStyle === "stub"){
      // 웰시코기: 짧게 뭉툭한 꼬리
      var stubW = Math.max(1, Math.round(tailW*0.7));
      var stubH = Math.max(1, Math.round(tailH*0.65));
      ctx.fillRect(bodyLeft - stubW + 1, bodyBottom - stubH + oy, stubW, stubH);
    } else if(tailStyle === "otter"){
      // 래브라도: 두툼하고 곧게 뻗은 "수달 꼬리"
      ctx.fillRect(bodyLeft - tailW, bodyTop + Math.round(bodyH*0.35) + oy, tailW + 1, tailH);
    } else {
      // 골든 리트리버/보더콜리: 부드럽게 살랑이는 꼬리
      var tailX = bodyLeft - tailW + 1;
      var tailY;
      if(mood === "sad"){ tailY = bodyBottom - Math.round(tailH*0.5); }
      else if(mood === "sleepy"){ tailY = bodyTop + Math.round(bodyH*0.25); }
      else { tailY = pixelTailFrame ? (bodyTop - Math.round(tailH*0.15)) : (bodyTop + Math.round(bodyH*0.3)); }
      ctx.fillRect(tailX, tailY + oy, tailW, tailH);
    }

    // 몸통
    ctx.fillStyle = furA;
    ctx.fillRect(bodyLeft, bodyTop + oy, bodyW, bodyH);

    // 엉덩이 뽕(rumpBump) — 웰시코기처럼 봉긋하고 풍성한 뒷모습을 가진 견종만
    if(sc.rumpBump){
      var rumpW = Math.max(2, Math.round(bodyW*0.3));
      var rumpH = Math.max(2, Math.round(bodyH*0.32));
      ctx.fillStyle = furA;
      ctx.fillRect(bodyLeft, bodyTop - rumpH + Math.round(rumpH*0.35) + oy, rumpW, rumpH);
    }

    // 머리 (몸통보다 먼저 겹치는 부분을 자연스럽게 덮도록 몸통 다음에 그림)
    ctx.fillStyle = furA;
    ctx.fillRect(headLeft, headTop + oy, headW, headH);

    // 귀 — "먼 쪽 귀 + 가까운 쪽 귀" 두 개를 살짝 겹쳐 그려, 옆모습이어도 귀가 하나만 있는
    // 것처럼 허전해 보이지 않게 함. 처진 귀는 아래로 늘어지고, 쫑긋 선 귀는 위로 솟음.
    // 모색과 무관하게 항상 또렷이 구분되도록 각 팔레트의 "짙은" 색(aDark)을 사용
    var earScale = sc.earScale || 1;
    if(earStyle === "erect"){
      var earW = Math.max(2, Math.round(headW*0.30*earScale));
      var earH = Math.max(2, Math.round(headH*0.62*earScale));
      var farW = Math.max(1, Math.round(earW*0.8)), farH = Math.max(1, Math.round(earH*0.8));
      var farX = headLeft + Math.round(headW*0.0);
      var farY = headTop - farH + Math.round(farH*0.3);
      var nearX = headLeft + Math.round(headW*0.32);
      var nearY = headTop - earH + Math.round(earH*0.15);
      ctx.fillStyle = furADark;
      ctx.fillRect(farX, farY + oy, farW, farH);   // 먼 쪽 귀 (뒤로 살짝 치우쳐 작게)
      ctx.fillRect(nearX, nearY + oy, earW, earH); // 가까운 쪽 귀 (앞쪽, 원래 크기)
    } else {
      // 처진 귀: 머리 실루엣 뒤쪽(headLeft) 바깥으로 절반 이상 튀어나와 걸리도록 해서
      // 얼굴 위의 무늬가 아니라 목 옆에 늘어진 귀로 보이게 함
      var fearW = Math.max(2, Math.round(headW*0.4*earScale));
      var fearH = Math.max(3, Math.round(headH*1.35*earScale));
      var nearEarX = headLeft - Math.round(fearW*0.55);
      var nearEarY = headTop + Math.round(headH*0.3);
      var farEarW = Math.max(1, Math.round(fearW*0.4)), farEarH = Math.max(1, Math.round(fearH*0.55));
      var farEarX = nearEarX - Math.round(farEarW*0.5);
      var farEarY = nearEarY - Math.round(farEarH*0.25);
      ctx.fillStyle = furADark;
      ctx.fillRect(farEarX, farEarY + oy, farEarW, farEarH);   // 먼 쪽 귀 (살짝 뒤에서 빼꼼)
      ctx.fillRect(nearEarX, nearEarY + oy, fearW, fearH);     // 가까운 쪽 귀 (주로 보이는 귀)
    }

    // 주둥이 — 머리 앞쪽 경계 너머로 튀어나오게 그려 개의 얼굴처럼 보이게 함
    var snoutFactor = sc.snoutRatio || 0.5;
    var snoutW = Math.max(2, Math.round(headW*snoutFactor));
    var snoutH = Math.max(2, Math.round(headH*0.42));
    var snoutLeft = headRight - Math.round(snoutW*0.3);
    var snoutTop = headBottom - snoutH;
    ctx.fillStyle = furC;
    ctx.fillRect(snoutLeft, snoutTop + oy, snoutW, snoutH);

    // 코 끝 (주둥이 맨 앞쪽의 짙은 점)
    var noseW = Math.max(1, Math.round(snoutW*0.34));
    var noseH = Math.max(1, Math.round(snoutH*0.5));
    ctx.fillStyle = furD;
    ctx.fillRect(snoutLeft + snoutW - noseW, snoutTop + Math.round(snoutH*0.18) + oy, noseW, noseH);

    // 눈 — 두 개, 감은 눈은 가는 선으로 표현
    var eyesClosed = forceEyesClosed ? true : (mood === "sleepy" ? true : pixelBlink);
    var eyeY = headTop + Math.round(headH*0.42);
    if(!eyesClosed){
      var eyeSize = Math.max(1, Math.round(headW*0.14));
      ctx.fillStyle = eyeColor;
      ctx.fillRect(headLeft + Math.round(headW*0.32), eyeY + oy, eyeSize, eyeSize);
      ctx.fillRect(headLeft + Math.round(headW*0.6), eyeY + oy, eyeSize, eyeSize);
    } else {
      var lineW = Math.max(1, Math.round(headW*0.16));
      ctx.fillStyle = furD;
      ctx.fillRect(headLeft + Math.round(headW*0.30), eyeY + oy, lineW, 1);
      ctx.fillRect(headLeft + Math.round(headW*0.58), eyeY + oy, lineW, 1);
    }
  }

  // 27번: 픽셀모드 배경 — 기기 시각으로 낮/밤은 항상 정확히 반영하고, 위치 권한과 네트워크가
  // 허용되는 경우에만 실제 날씨를 덧입힘. 공개된 페이지는 임의 서버로의 네트워크 요청이 막혀있을 수
  // 있어(플랫폼 보안 정책), 그런 환경에서는 조용히 "맑음"으로 대체되고 낮/밤만 정확히 반영됨.
  // 32번: lastRainAt — "비온뒤"(WALK-048) 조건 판정을 위해 마지막으로 비/폭풍이 관측된 시각을 기록
  var WEATHER_STATE = { condition:"clear", fetchedAt:0, lastRainAt:0 };
  function isDaytimeNow(){
    var h = new Date().getHours();
    return h >= 6 && h < 19;
  }
  function weatherCodeToCondition(code){
    if(code === 0) return "clear";
    if(code === 1 || code === 2) return "cloudy";
    if(code === 3) return "overcast";
    if(code >= 45 && code <= 48) return "fog";
    if(code >= 51 && code <= 67) return "rain";
    if(code >= 71 && code <= 77) return "snow";
    if(code >= 80 && code <= 82) return "rain";
    if(code >= 85 && code <= 86) return "snow";
    if(code >= 95) return "storm";
    return "clear";
  }
  function tryFetchWeather(){
    if(WEATHER_STATE.fetchedAt && (Date.now() - WEATHER_STATE.fetchedAt) < 30*60000) return; // 30분 캐시
    if(!navigator.geolocation || typeof fetch !== "function") return;
    try{
      navigator.geolocation.getCurrentPosition(function(pos){
        var lat = pos.coords.latitude, lon = pos.coords.longitude;
        var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current_weather=true";
        fetch(url).then(function(res){ return res.json(); }).then(function(data){
          if(data && data.current_weather){
            WEATHER_STATE.condition = weatherCodeToCondition(data.current_weather.weathercode);
            WEATHER_STATE.fetchedAt = Date.now();
            // 32번: "비온뒤"(WALK-048) 판정용 — 비/폭풍이 관측될 때마다 시각을 갱신
            if(WEATHER_STATE.condition === "rain" || WEATHER_STATE.condition === "storm"){
              WEATHER_STATE.lastRainAt = Date.now();
            }
            if(state.pixelMode) drawPixelScene();
          }
        }).catch(function(){ /* 네트워크가 막혀있으면 기본값(맑음)을 그대로 사용 */ });
      }, function(){ /* 위치 권한 거부 — 기본값 유지 */ }, { timeout:6000 });
    }catch(e){ /* 조용히 무시하고 기본값 유지 */ }
  }
  function drawPixelSky(ctx, groundRow){
    var day = isDaytimeNow();
    var cond = WEATHER_STATE.condition;
    var top, bottom;
    if(day){
      if(cond === "overcast" || cond === "fog"){ top = "#9AA6AC"; bottom = "#C7CFC7"; }
      else if(cond === "rain" || cond === "storm"){ top = "#6E7C89"; bottom = "#A7AF9E"; }
      else if(cond === "snow"){ top = "#C7D6DE"; bottom = "#E8EEE4"; }
      else if(cond === "cloudy"){ top = "#A9C3D6"; bottom = "#DCE6D6"; }
      else { top = "#8FCBEF"; bottom = "#D9EFC9"; }
    } else {
      if(cond === "rain" || cond === "storm"){ top = "#12182E"; bottom = "#33384C"; }
      else if(cond === "snow"){ top = "#26314F"; bottom = "#56607A"; }
      else if(cond === "cloudy" || cond === "overcast" || cond === "fog"){ top = "#232B48"; bottom = "#42465F"; }
      else { top = "#1E2A52"; bottom = "#4B4E72"; }
    }
    var grad = ctx.createLinearGradient(0, 0, 0, groundRow);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, PX_W, groundRow);

    if(day && (cond === "clear" || cond === "cloudy")){
      ctx.fillStyle = "#FFE7A0";
      ctx.fillRect(122, 8, 8, 8);
      ctx.fillStyle = "#FFF3C8";
      ctx.fillRect(120, 10, 12, 4);
    }
    if(!day){
      ctx.fillStyle = "#F4EFD8";
      ctx.fillRect(20, 8, 7, 7);
      var stars = [[40,14],[55,7],[70,18],[95,9],[110,15],[10,20]];
      stars.forEach(function(s){ ctx.fillRect(s[0], s[1], 1, 1); });
    }
    if(cond === "cloudy" || cond === "overcast" || cond === "fog"){
      ctx.fillStyle = day ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.18)";
      ctx.fillRect(10, 12, 22, 5);
      ctx.fillRect(70, 6, 26, 5);
    }
    if(cond === "rain" || cond === "storm"){
      ctx.fillStyle = day ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)";
      ctx.fillRect(10, 10, 22, 4);
      ctx.fillRect(70, 5, 26, 4);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#BFE0F2";
      for(var i=0;i<10;i++){
        var rx = (i*15 + 6) % PX_W;
        ctx.fillRect(rx, groundRow-16 + (i%3)*5, 1, 5);
      }
      ctx.globalAlpha = 1;
    }
    if(cond === "snow"){
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for(var j=0;j<12;j++){
        var sx = (j*13 + 4) % PX_W;
        ctx.fillRect(sx, groundRow-20 + (j%4)*5, 1, 1);
      }
    }
  }
  // 53번: 지붕 폭 계산(inset)이 roofY(위쪽)에서 가장 넓고 몸체와 만나는 아래쪽에서 0에 가까워지도록
  // 거꾸로 되어 있던 버그를 고쳐 정삼각 박공지붕(위가 뾰족, 처마가 몸체 폭)으로 재작업. 사용자가 준
  // 참고사진(흰둥이네 집)의 특징 — 크림색 몸체, 파란 박공지붕, 아치형 출입구, 옆면 환기구, 이름표 —
  // 을 스케치 확인(sketch-check-53) 그대로 반영.
  // 이름표 관련(사용자 확인: "실제로 이름을 넣어달라"): 실제로 시도해봤지만, 이 캔버스가 150×100
  // 네이티브 해상도라 5px 안팎의 fillText는 글자 획이 서브픽셀 단위로 뭉개지고, 심지어 안티앨리어싱
  // 번짐이 이름표 칸을 넘어 개집 몸체 전체로 퍼져 얼룩처럼 보이는 문제가 있어(Playwright로 실제
  // 렌더링을 캡처해 확인) 텍스트는 결국 빼고 빈 이름표만 둠 — 반려견 이름은 화면 상단에 이미 항상
  // 표시되고 있어(el.dogNameLabel) 여기서 다시 못 읽는 글씨로 욱여넣기보다 이 편이 낫다고 판단.
  // 커스텀 미니 비트맵 폰트를 새로 만들면 가능하지만 이번 라운드 범위 밖이라 다음 라운드 후보로 남김.
  function drawDoghouse(ctx, groundRow){
    var x = 6, w = 26, eave = 3, roofH = 11, bodyH = 16;
    var bodyY = groundRow - bodyH;
    var roofY = bodyY - roofH;
    var peakX = x + Math.round(w/2);

    // 몸체(크림색)
    ctx.fillStyle = "#F0E4C6";
    ctx.fillRect(x, bodyY, w, bodyH);
    ctx.fillStyle = "#D8C79E";
    ctx.fillRect(x, bodyY, w, 1);

    // 지붕(파란 박공지붕) — 위(roofY)가 뾰족하고 아래(처마)에서 몸체 폭+eave만큼 넓어짐
    ctx.fillStyle = "#4E7FA8";
    for(var i=0;i<roofH;i++){
      var t = i/(roofH-1);
      var rowW = Math.max(2, Math.round(t * (w + eave*2)));
      var rowX = peakX - Math.round(rowW/2);
      ctx.fillRect(rowX, roofY + i, rowW, 1);
    }
    ctx.fillStyle = "#2E5A78";
    ctx.fillRect(peakX - 1, roofY, 2, 2); // 지붕마루 포인트
    ctx.fillRect(x - eave, bodyY - 1, w + eave*2, 1); // 처마 그림자선

    // 옆면 환기구(작은 사각 2개)
    ctx.fillStyle = "#B99B68";
    ctx.fillRect(x + 3, bodyY + 4, 2, 2);
    ctx.fillRect(x + 3, bodyY + 9, 2, 2);

    // 출입구(짙은 아치형) — 위쪽을 계단식으로 좁혀 둥근 아치 느낌을 냄
    var doorW = 10, doorH = 11;
    var doorX = x + Math.round((w-doorW)/2), doorY = groundRow - doorH;
    ctx.fillStyle = "#3A2A22";
    ctx.fillRect(doorX, doorY + 2, doorW, doorH - 2);
    ctx.fillRect(doorX + 1, doorY + 1, doorW - 2, 1);
    ctx.fillRect(doorX + 2, doorY, doorW - 4, 1);

    // 이름표 — 흰 판(빈 판, 위 주석 참고)
    var plateW = 14, plateH = 5;
    var plateX = peakX - Math.round(plateW/2), plateY = bodyY + 2;
    ctx.fillStyle = "#FFFDF3";
    ctx.fillRect(plateX, plateY, plateW, plateH);
    ctx.fillStyle = "#B99B68";
    ctx.fillRect(plateX, plateY, plateW, 1);
  }

  function drawPixelScene(){
    if(!el.pixelCanvas || !el.pixelCanvas.getContext) return;
    var ctx = el.pixelCanvas.getContext("2d");
    if(!ctx) return;
    ctx.clearRect(0, 0, PX_W, PX_H);

    var groundRow = PX_H - 4;
    var groundColor = cssVar("--moss", "#9CB88C");
    var groundColorDeep = cssVar("--moss-deep", "#5F7A52");

    drawPixelSky(ctx, groundRow);

    ctx.fillStyle = groundColor;
    ctx.fillRect(0, groundRow, PX_W, PX_H - groundRow);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = groundColorDeep;
    ctx.fillRect(0, groundRow, PX_W, 1);
    ctx.globalAlpha = 1;

    drawDoghouse(ctx, groundRow);
    drawPixelIdleDog(ctx, groundRow);
  }

  // 53번: 멍멍모드 — 소통버튼 대기시간에 한정하지 않고(사용자 확인: "20초에 한정하지 않고 상시 앰비언트
  // 연출로"), 메인 화면(클래식 픽셀 모드, 우선 이번 라운드는 픽셀모드만 — 사용자 확인)에서 늘 돌아가는
  // 유휴 애니메이션. `멍멍모드_행동목록.xlsx`의 IDLE-001~011(11개, 탐험형·수면형·몸단장형·장난형·
  // 환경반응형) 사이를 무작위(균등 확률)로 순환 재생하고, 포즈가 없을 때는 기존 숨쉬기(IDLE-000, blink/
  // tail/bob 타이머)로 돌아감. "발생 가중치"·"연동 조건" 열은 원안대로 지금은 비어있어 반영하지 않음
  // — 나중에 채워지면 均等 확률 대신 가중치 기반으로 바꾸면 됨.
  var PIXEL_IDLE_POSES = [
    { id:"IDLE-001", cat:"탐험형",     minMs:4000, maxMs:5000 },
    { id:"IDLE-002", cat:"탐험형",     minMs:3000, maxMs:3000 },
    { id:"IDLE-003", cat:"수면형",     minMs:5000, maxMs:7000 },
    { id:"IDLE-004", cat:"수면형",     minMs:4000, maxMs:4000 },
    { id:"IDLE-005", cat:"몸단장형",   minMs:2000, maxMs:3000 },
    { id:"IDLE-006", cat:"몸단장형",   minMs:3000, maxMs:3000 },
    { id:"IDLE-007", cat:"몸단장형",   minMs:1000, maxMs:2000 },
    { id:"IDLE-008", cat:"장난형",     minMs:3000, maxMs:3000 },
    { id:"IDLE-009", cat:"장난형",     minMs:3000, maxMs:4000 },
    { id:"IDLE-010", cat:"환경반응형", minMs:3000, maxMs:3000 },
    { id:"IDLE-011", cat:"환경반응형", minMs:3000, maxMs:4000 }
  ];
  var pixelIdlePose = null, pixelIdlePoseStartTs = 0, pixelIdlePoseDurMs = 0;
  var pixelIdlePoseTickTimer = null, pixelIdlePoseGapTimer = null;

  function stopPixelIdlePoseCycle(){
    if(pixelIdlePoseTickTimer){ window.clearInterval(pixelIdlePoseTickTimer); pixelIdlePoseTickTimer = null; }
    if(pixelIdlePoseGapTimer){ window.clearTimeout(pixelIdlePoseGapTimer); pixelIdlePoseGapTimer = null; }
    pixelIdlePose = null;
  }
  function scheduleNextPixelIdlePose(){
    if(reduceMotion()) return;
    var gap = 4000 + Math.random() * 5000; // 포즈 사이 "그냥 숨쉬기" 간격 4~9초
    pixelIdlePoseGapTimer = window.setTimeout(playRandomPixelIdlePose, gap);
  }
  function playRandomPixelIdlePose(){
    if(reduceMotion()) return;
    var pose = PIXEL_IDLE_POSES[Math.floor(Math.random() * PIXEL_IDLE_POSES.length)];
    pixelIdlePose = pose.id;
    pixelIdlePoseStartTs = Date.now();
    pixelIdlePoseDurMs = pose.minMs + Math.random() * (pose.maxMs - pose.minMs);
    if(pixelIdlePoseTickTimer) window.clearInterval(pixelIdlePoseTickTimer);
    pixelIdlePoseTickTimer = window.setInterval(function(){
      if(Date.now() - pixelIdlePoseStartTs >= pixelIdlePoseDurMs){
        window.clearInterval(pixelIdlePoseTickTimer);
        pixelIdlePoseTickTimer = null;
        pixelIdlePose = null;
        drawPixelScene();
        scheduleNextPixelIdlePose();
        return;
      }
      drawPixelScene();
    }, 120);
    drawPixelScene();
  }

  // 현재 멍멍모드 포즈에 맞춰 강아지를 그림 — 포즈가 없으면(기본 숨쉬기) 기존 drawPixelDog 그대로 호출.
  // 각 포즈는 drawPixelDog를 감싸는 간단한 캔버스 변형(이동/회전/스케일)과, 필요하면 위에 살짝 겹치는
  // 보조 표시(점선 시선·Zzz·움찔 자국 등)로 표현 — 스케치 확인 때 보여드린 컨셉을 실제 색이 입혀진
  // 픽셀아트 위에 그대로 옮긴 것.
  function drawPixelIdleDog(ctx, groundRow){
    var pose = pixelIdlePose;
    if(!pose){ drawPixelDog(ctx, groundRow); return; }
    var elapsed = Date.now() - pixelIdlePoseStartTs;
    var r = pixelIdlePoseDurMs > 0 ? Math.min(1, elapsed / pixelIdlePoseDurMs) : 1;
    var cx = Math.round(PX_W/2) + 2;
    switch(pose){
      case "IDLE-001": // 화면 밖 마실: 걸어나감 → 잠깐 사라짐 → 후다닥 복귀
        if(r < 0.35){ drawPixelDog(ctx, groundRow, Math.round(70 * (r/0.35))); }
        else if(r < 0.65){ /* 화면 밖: 그리지 않음 */ }
        else { drawPixelDog(ctx, groundRow, Math.round(70 * (1 - (r-0.65)/0.35))); }
        break;
      case "IDLE-002": // 골똘히 쳐다보기: 살짝 고개를 든 자세 + 응시 방향 점선
        ctx.save();
        ctx.translate(cx, groundRow); ctx.rotate(-0.05); ctx.translate(-cx, -groundRow);
        drawPixelDog(ctx, groundRow);
        ctx.restore();
        ctx.strokeStyle = "#8A8370"; ctx.lineWidth = 1; ctx.setLineDash([2,2]);
        ctx.beginPath(); ctx.moveTo(cx+10, groundRow-30); ctx.lineTo(cx+34, groundRow-46); ctx.stroke();
        ctx.setLineDash([]);
        break;
      case "IDLE-003": // 웅크려 잠들기: 낮게 웅크린 실루엣 + Zzz
        ctx.save();
        ctx.translate(cx, groundRow); ctx.scale(1, 0.62); ctx.translate(-cx, -groundRow);
        drawPixelDog(ctx, groundRow, 0, true);
        ctx.restore();
        ctx.fillStyle = "#726B58"; ctx.font = "7px sans-serif"; ctx.fillText("Z z", cx+16, groundRow-44);
        break;
      case "IDLE-004": // 꿈꾸는 다리: 누운 채 다리가 움찔움찔 + Zzz
        ctx.save();
        ctx.translate(cx, groundRow); ctx.scale(1, 0.7); ctx.translate(-cx, -groundRow);
        drawPixelDog(ctx, groundRow, (Math.floor(elapsed/220)%2===0) ? 1 : -1, true);
        ctx.restore();
        ctx.fillStyle = "#726B58"; ctx.font = "7px sans-serif"; ctx.fillText("Z z", cx+16, groundRow-40);
        break;
      case "IDLE-005": // 뒷다리로 긁기: 제자리 + 긁는 동작 자국 깜빡임
        drawPixelDog(ctx, groundRow);
        if(Math.floor(elapsed/180) % 2 === 0){
          ctx.strokeStyle = "#C4482B"; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx+8, groundRow-34); ctx.lineTo(cx+14, groundRow-40);
          ctx.moveTo(cx+8, groundRow-30); ctx.lineTo(cx+14, groundRow-36);
          ctx.stroke();
        }
        break;
      case "IDLE-006": // 다운독 기지개: 앞으로 쭉 늘어난 실루엣
        ctx.save();
        ctx.translate(cx, groundRow); ctx.scale(1.12, 0.9); ctx.translate(-cx, -groundRow);
        drawPixelDog(ctx, groundRow);
        ctx.restore();
        break;
      case "IDLE-007": // 부르르 털기: 좌우로 빠르게 흔들림 + 물방울 튀는 선
        drawPixelDog(ctx, groundRow, (Math.floor(elapsed/60) % 2 === 0) ? 1 : -1);
        ctx.strokeStyle = "#8A8370"; ctx.lineWidth = 1; ctx.setLineDash([1,2]);
        ctx.beginPath();
        ctx.moveTo(cx-24, groundRow-30); ctx.lineTo(cx-30, groundRow-34);
        ctx.moveTo(cx+24, groundRow-30); ctx.lineTo(cx+30, groundRow-34);
        ctx.stroke(); ctx.setLineDash([]);
        break;
      case "IDLE-008": { // 꼬리잡기 뱅글뱅글: 몸을 뒤집지 않고(정면 스프라이트가 그대로 회전하면
        // 위아래가 뒤집혀 보여 오히려 어색함) 제자리에서 작게 원을 그리며 도는 궤적으로 표현.
        var loopAngle = r * Math.PI * 2 * 1.6;
        var orbitX = Math.round(Math.sin(loopAngle) * 6);
        drawPixelDog(ctx, groundRow, orbitX);
        ctx.strokeStyle = "#8A8370"; ctx.lineWidth = 1; ctx.setLineDash([1,2]);
        ctx.beginPath(); ctx.ellipse(cx, groundRow-6, 10, 3, 0, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        break;
      }
      case "IDLE-009": // 플레이바우: 앞다리를 낮춘 "놀자" 자세 → 반응 없으면 머쓱하게 풂
        var bowTilt = r < 0.65 ? -0.16 : 0;
        ctx.save();
        ctx.translate(cx, groundRow); ctx.rotate(bowTilt); ctx.translate(-cx, -groundRow);
        drawPixelDog(ctx, groundRow);
        ctx.restore();
        if(r < 0.65){
          ctx.strokeStyle = "#C4482B"; ctx.lineWidth = 1; ctx.setLineDash([2,2]);
          ctx.beginPath(); ctx.moveTo(cx+30, groundRow-52); ctx.lineTo(cx+30, groundRow-58); ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
      case "IDLE-010": // 뭔가 쫓기: 고개를 이리저리 + 작은 점(파리)이 움직임
        drawPixelDog(ctx, groundRow, (Math.floor(elapsed/260) % 2 === 0) ? 2 : -2);
        ctx.fillStyle = "#C4482B";
        ctx.fillRect(cx + 20 + Math.round(Math.sin(elapsed/260) * 16), groundRow - 50 + Math.round(Math.cos(elapsed/310) * 6), 2, 2);
        break;
      case "IDLE-011": // 바닥 냄새 산책: 천천히 좌우로 어슬렁 + 냄새 자국
        var drift = Math.round(Math.sin(elapsed/900) * 10);
        drawPixelDog(ctx, groundRow, drift);
        if(Math.floor(elapsed/300) % 2 === 0){
          ctx.strokeStyle = "#8A8370"; ctx.lineWidth = 1; ctx.setLineDash([1,2]);
          ctx.beginPath(); ctx.arc(cx+drift+16, groundRow-2, 5, Math.PI, 0); ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
      default:
        drawPixelDog(ctx, groundRow);
    }
  }

  // 48번(기획문서 12장): 30일 임시보호 종료 엔딩씬 전용 픽셀 드로잉 3종 — 프로토타입(엔딩씬_프로토타입.html)의
  // CSS 도형을 우리 게임의 캔버스 픽셀 그래픽 스타일(drawDoghouse와 동일한 fillRect 블록 조립 방식,
  // PX_W×PX_H=150×100 좌표계)로 새로 옮겨 그림 — "복귀 화면은 클래식 픽셀 모드 고정"이라는 원안 그대로,
  // 유저의 현재 픽셀모드 on/off 설정과 무관하게 이 씬은 항상 이 방식으로만 그려짐.

  // 이동장(크레이트) 자리의 중심 x좌표 — 편지봉투(drawEndingEnvelope)도 같은 지점을 기준으로 그려지고,
  // 50번: '달성' 결과에서 강아지가 재노출될 때도 이 지점으로 옮겨 그려 "이동장이 있던 자리"를 맞춤.
  var ENDING_SLOT_CENTER_X = 131; // 크레이트 x=118~144(w=26)의 중심
  // drawPixelDog()의 기본 중심(cx = round(PX_W/2)+2)에서 이동장 자리까지 밀어줄 오프셋
  var ENDING_DOG_OFFSET_X = ENDING_SLOT_CENTER_X - (Math.round(PX_W/2) + 2); // = 54

  // 이동장(크레이트) — 좌측 하단 개집(drawDoghouse, x=6~32)과 대칭되는 우측 자리(x=118~144)에 위치.
  function drawEndingCrate(ctx, groundRow){
    var w = 26, h = 20;
    var x = PX_W - 6 - w, y = groundRow - h;
    ctx.fillStyle = "#CFC9B8";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#9C947E";
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y, 2, h);
    ctx.fillRect(x + w - 2, y, 2, h);
    for(var i = 1; i < 4; i++){
      ctx.fillRect(x + Math.round(i*w/4), y + 3, 1, h - 6);
    }
    ctx.fillStyle = "#9C947E";
    ctx.fillRect(x + Math.round(w/2) - 4, y - 4, 8, 4);
  }

  // 승합차량 — 일반(주황)과 찹찹츄 이별 전용(흰색, farewell) 두 색만 다르고 형태는 동일.
  // vanX는 차체 왼쪽 끝의 캔버스 좌표(음수면 화면 밖), bounce는 싣는 연출용 1px 들썩임.
  // 51번: "차량이 작다"는 피드백으로 1.5배 확대 — 원래 치수(46/22/14/10 등)에 ENDING_VAN_SCALE을
  // 곱해 전부 같은 비율로 키움(원래 형태 그대로 확대, 부분별로 따로 조정하지 않음). w는 진입/주차 좌표
  // 계산(playEndingSequence의 startX/parkX)에서도 재사용하므로 ENDING_VAN_W로 별도 상수화해둠.
  var ENDING_VAN_SCALE = 1.5;
  var ENDING_VAN_W = Math.round(46 * ENDING_VAN_SCALE);
  function drawEndingVan(ctx, groundRow, vanX, bounce, farewell){
    var S = ENDING_VAN_SCALE;
    var w = ENDING_VAN_W, bodyH = Math.round(22*S), cabW = Math.round(14*S), cabH = Math.round(10*S);
    var bodyColor = farewell ? "#F5F0E6" : "#E08A3C";
    var edgeColor = farewell ? "#C6BCA4" : "#B96A22";
    var wheelColor = farewell ? "#5B5548" : "#3A332A";
    var oy = bounce ? -1 : 0;
    var bodyY = groundRow - bodyH + oy;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(vanX + w - cabW, bodyY - cabH, cabW, cabH);
    ctx.fillStyle = "#DCEEF5";
    ctx.fillRect(vanX + w - cabW + Math.round(2*S), bodyY - cabH + Math.round(2*S), cabW - Math.round(5*S), Math.round(5*S));
    ctx.fillStyle = bodyColor;
    ctx.fillRect(vanX, bodyY, w, bodyH);
    ctx.fillStyle = edgeColor;
    ctx.fillRect(vanX, bodyY, w, Math.round(2*S));
    ctx.fillStyle = wheelColor;
    ctx.fillRect(vanX + Math.round(6*S), groundRow - Math.round(3*S) + oy, Math.round(8*S), Math.round(6*S));
    ctx.fillRect(vanX + w - Math.round(16*S), groundRow - Math.round(3*S) + oy, Math.round(8*S), Math.round(6*S));
  }

  // 무지개빛 아우라를 두른 편지봉투 — auraPhase(0~1을 계속 순환)로 테두리 두께를 살짝 맥동시켜 반짝임을 표현.
  var ENDING_AURA_COLORS = ["#FFB3B3", "#FFE1A8", "#C9F2C0", "#B6DCF5", "#D2B6F5"];
  function drawEndingEnvelope(ctx, groundRow, auraPhase){
    var w = 22, h = 15;
    var x = PX_W - 6 - 26 + 2, y = groundRow - h - 3;
    var pulse = 2 + Math.round(Math.sin(auraPhase * Math.PI * 2) * 1.5);
    for(var i = 0; i < ENDING_AURA_COLORS.length; i++){
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = ENDING_AURA_COLORS[i];
      var pad = 3 + i*2 + pulse;
      ctx.fillRect(x - pad, y - pad, w + pad*2, h + pad*2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#FFF9E8";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#E8D9A8";
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = "#F3E7C4";
    var flapH = Math.round(h * 0.55);
    for(var r = 0; r < flapH; r++){
      var inset = Math.round((r/flapH) * (w/2));
      ctx.fillRect(x + inset, y + r, w - inset*2, 1);
    }
  }

  // 엔딩씬 한 프레임을 합성 — 하늘/바닥/개집은 항상 그리고, opts로 이동장·강아지·차량·편지봉투를 선택적으로 얹음.
  function drawEndingScene(ctx, opts){
    opts = opts || {};
    ctx.clearRect(0, 0, PX_W, PX_H);
    var groundRow = PX_H - 4;
    var groundColor = cssVar("--moss", "#9CB88C");
    var groundColorDeep = cssVar("--moss-deep", "#5F7A52");
    drawPixelSky(ctx, groundRow);
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, groundRow, PX_W, PX_H - groundRow);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = groundColorDeep;
    ctx.fillRect(0, groundRow, PX_W, 1);
    ctx.globalAlpha = 1;
    drawDoghouse(ctx, groundRow);
    if(opts.showCrate) drawEndingCrate(ctx, groundRow);
    if(opts.showDog) drawPixelDog(ctx, groundRow, opts.dogOffsetX || 0);
    if(typeof opts.vanX === "number") drawEndingVan(ctx, groundRow, opts.vanX, opts.bounce, opts.farewell);
    if(opts.showEnvelope) drawEndingEnvelope(ctx, groundRow, opts.auraPhase || 0);
  }

  // 28번: 산책 팝업 안의 강아지도 픽셀모드일 땐 같은 drawPixelDog()로 그려서 메인화면과 그래픽이 일치하게 함.
  // 배경(하늘·바닥)은 이미 walk-scene의 CSS 그라디언트가 있으니, 여기선 강아지만 투명 배경에 그림.
  function drawWalkPixelDog(){
    if(!el.walkPixelCanvas || !el.walkPixelCanvas.getContext) return;
    var ctx = el.walkPixelCanvas.getContext("2d");
    if(!ctx) return;
    ctx.clearRect(0, 0, PX_W, PX_H);
    drawPixelDog(ctx, PX_H - 4);
  }

  function stopPixelAnimation(){
    [pixelBlinkTimer, pixelTailTimer, pixelBobTimer].forEach(function(t){ if(t) window.clearInterval(t); });
    pixelBlinkTimer = pixelTailTimer = pixelBobTimer = null;
    stopPixelIdlePoseCycle();
  }
  function startPixelAnimation(){
    stopPixelAnimation();
    if(reduceMotion()) return;
    pixelBlinkTimer = window.setInterval(function(){
      pixelBlink = true; drawPixelScene(); drawWalkPixelDog();
      window.setTimeout(function(){ pixelBlink = false; drawPixelScene(); drawWalkPixelDog(); }, 160);
    }, 3200);
    pixelTailTimer = window.setInterval(function(){
      pixelTailFrame = !pixelTailFrame; drawPixelScene(); drawWalkPixelDog();
    }, 450);
    pixelBobTimer = window.setInterval(function(){
      pixelBobUp = !pixelBobUp; drawPixelScene(); drawWalkPixelDog();
    }, 900);
    // 53번: 멍멍모드 — 위 세 타이머와 별개로, 숨쉬기 사이사이 무작위 간격을 두고 12종 유휴 포즈 중
    // 하나를 균등 확률로 골라 재생. 산책 팝업(drawWalkPixelDog)에는 적용하지 않음(메인 마당 전용).
    scheduleNextPixelIdlePose();
  }
  // 48번: 엔딩이 확정된 순간(state.ending이 생기는 시점)부터는 원안대로 픽셀모드를 강제하고, 이 마당
  // 캔버스는 엔딩씬 전용 그리기 함수(playEndingSequence/showEndingRestingFrame)가 직접 관리하므로
  // 여기서 drawPixelScene()으로 평소 장면을 다시 그리면 안 됨 — startPixelAnimation()의 반복 타이머도
  // 함께 멈춰서 덮어쓰지 않게 함. 같은 이유로 화면 잠금(.screen.ending-lock)도 이 함수 하나에서 함께 처리.
  // 54번: 일반(CSS 그래픽) 화면 모드와 그 전환 토글을 사용자 요청으로 완전히 제거 — "테스트하면서
  // 추후 조정할 계획, 일단은 픽셀모드로만 운영"이라는 명시적 코멘트에 따라 상시 픽셀모드로 고정함.
  // 다만 이 상태를 "임시 조치"로 보고, 기존 CSS 강아지 마크업(.dog-wrap 등)·pixelMode 상태 필드 자체는
  // 지우지 않고 그대로 남겨둠 — 나중에 재조정 요청이 오면(예: 다시 토글을 붙이거나 완전히 다른 형태로
  // 재도입) 처음부터 다시 만들 필요 없이 이 지점만 되돌리면 되도록 함(33번 FOSTER_TEST_MODE와 같은 원칙).
  function applyPixelMode(){
    var locked = !!state.ending;
    var active = true; // 항상 픽셀모드 — 토글 삭제로 이제 이 값 외에는 도달 불가
    el.yard.classList.toggle("pixel-mode", active);
    el.yard.classList.toggle("ending-mode", locked);
    if(el.screenRoot) el.screenRoot.classList.toggle("ending-lock", locked);
    if(el.walkDogTrack) el.walkDogTrack.classList.toggle("pixel-mode", active);
    if(locked){ stopPixelAnimation(); stopTipRotation(); return; }
    drawPixelScene(); drawWalkPixelDog(); startPixelAnimation(); startTipRotation();
  }

  // 54번: 개꿀팁 레터박스 — 게임 하단 내비바 바로 위 여백에 상시 노출되는 문구 배너. 기획팀이 정리해
  // 전달한 [개꿀팁 리스트.xlsx]의 40개 문구를 그대로 옮김(카테고리: 상식/건강정보/세계관/힌트/유머 —
  // 색 순환에는 안 쓰고, 나중에 카테고리별 필터·연출이 필요해지면 쓸 수 있게 값만 남겨둠). 56번에서
  // [개꿀팁 리스트 v2.xlsx]로 카테고리별 8개씩 총 40개(TIP-041~080)가 추가돼 지금은 80개. 노출 방식은
  // 같은 파일 '안내' 시트 명세를 그대로 따름 — ①모든 문구가 한 번씩 다 나온 뒤에야 다시 반복되는
  // "셔플백" 방식으로 무작위 순환, ②레터박스 배경은 파스텔 무지개(빨주노초파남보) 색을 문구 카테고리와
  // 무관하게 독립적으로 순환, ③글자색은 흰색 고정. 노출 간격(TIP_ROTATE_MS)·긴 문구 처리 방식(스크롤
  // 티커)은 AskUserQuestion으로 사용자에게 직접 확인한 값 — 각각 18초(추천값 12초 대신 선택), 좌우로
  // 흐르는 티커(추천값이었던 말줄임/2줄바꿈 대신 선택).
  // applyPixelMode()의 잠금 분기(state.ending)에서 stopPixelAnimation()과 나란히 stopTipRotation()도
  // 같이 멈춰줌 — 엔딩 컷씬 동안 배너가 뒤에서 계속 돌아가면 톤이 안 맞을 것 같아, 다른 앰비언트
  // 타이머(멍멍모드 등)와 같은 방식으로 화면 잠금과 함께 정지시킴.
