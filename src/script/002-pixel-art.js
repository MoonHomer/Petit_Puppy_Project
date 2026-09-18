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
    shihtzu:{ heightCm:26, lengthRatio:1.15, legRatio:0.21, earStyle:"floppy", tailStyle:"plume", snoutRatio:0.24 },
    // 78번(24장): 신규 3종. headScaleMult/curlyFur는 이번에 새로 추가된 속성(기본값 1/false) — 아래
    // drawPixelDog()에서 헤더·몸통 실루엣에 반영됨.
    // 몰티즈: 아주 작은 체구, 실키한 처진 귀(시츄 스타일 재사용), 짧고 가는 주둥이.
    maltese:{ heightCm:22, lengthRatio:1.1, legRatio:0.22, earStyle:"floppyLong", tailStyle:"plume", snoutRatio:0.26 },
    // 푸들: 스탠다드(100%) 기준 체고 — 소형/미디엄은 breedSizeScale()로 별도 곱연산. 처진 귀, 동그란 폼폼 꼬리(plume 재사용).
    poodle:{ heightCm:45, lengthRatio:1.05, legRatio:0.34, earStyle:"floppyLow", tailStyle:"plume", snoutRatio:0.3 },
    // 비숑프리제: "큰 대두"(headScaleMult×2)·짧은 다리(legRatio 최소치권)·곱슬곱슬 뭉게구름 실루엣(curlyFur).
    bichon:{ heightCm:26, lengthRatio:1.1, legRatio:0.17, earStyle:"floppyLow", earScale:0.8, tailStyle:"plume", snoutRatio:0.32, headScaleMult:2, curlyFur:true }
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
  // 70번: 찹찹츄(노년기) 전용 "옅은 회색 톤"용 — 원색을 유지한 채 자기 평균 밝기(회색) 쪽으로만
  // amount만큼 당겨서, 팔레트가 달라도(모색 20종) 항상 자연스럽게 탈채도되도록 함.
  function mixHexToGrey(hex, amount){
    try{
      var m = /^#([0-9a-fA-F]{6})$/.exec(hex);
      if(!m) return hex;
      var r = parseInt(m[1].slice(0,2),16), g = parseInt(m[1].slice(2,4),16), b = parseInt(m[1].slice(4,6),16);
      var grey = Math.round((r+g+b)/3);
      r = Math.round(r + (grey-r)*amount);
      g = Math.round(g + (grey-g)*amount);
      b = Math.round(b + (grey-b)*amount);
      function h2(n){ var s = n.toString(16); return s.length < 2 ? "0"+s : s; }
      return "#" + h2(r) + h2(g) + h2(b);
    }catch(e){ return hex; }
  }
  // 78번(24장): 비숑프리제의 "곱슬곱슬 뭉게구름 같은" 털 실루엣용 — 새 그래픽 자산 없이, 기존
  // drawCloudPuff()와 같은 발상(작은 뭉치 블록 여러 개)을 털색으로 재사용해 몸통·머리 윤곽에 스캘럽
  // 느낌의 뭉치를 얹음. sc.curlyFur가 true인 견종에서만 호출됨(현재는 비숑프리제 한정).
  function drawFurPuff(ctx, cx, cy, r, color){
    ctx.fillStyle = color;
    ctx.fillRect(cx - r, cy - Math.round(r*0.4), r*2, Math.max(1, Math.round(r*0.8)));
    ctx.fillRect(cx - Math.round(r*0.6), cy - r, Math.max(1, Math.round(r*1.2)), Math.max(1, Math.round(r*0.6)));
  }

  // 79번(그래픽 업그레이드): 유저가 보내준 "크로스스티치 픽셀아트" 레퍼런스들의 핵심 스타일 요소 —
  // (1) 실루엣 전체를 감싸는 굵고 짙은 아웃라인, (2) 배경과 확실히 분리되는 또렷한 형태 — 를 기존
  // drawPixelDog()/drawWalkFrontDog()의 세밀한 견종별 치수 로직은 전혀 건드리지 않고 덧입히기 위한
  // 공용 후처리 유틸. 두 함수 모두 "실제 화면 ctx가 아니라 임시 오프스크린 캔버스에 평소처럼 그린 뒤,
  // 픽셀 단위로 알파값을 검사해 실루엣 바깥 1칸을 어두운 아웃라인 색으로 채우고, 그 결과 비트맵을
  // 최종적으로 원래 ctx에 한 번에 합성"하는 방식으로 이 함수를 사용함 — 견종별 좌표 계산은 100% 그대로
  // 재사용되고, 오직 "그려진 결과물에 테두리를 두르는" 시각효과만 추가됨.
  var DOG_OUTLINE_COLOR = "#2A2019"; // 모색 팔레트와 무관하게 항상 짙은 다크브라운으로 고정(레퍼런스 전 견종 공통)
  // 80-1번(그래픽팀 버그 리포트 반영): 스프라이트를 "원본 비율 유지 + 접지선에 발이 닿도록 하단
  // 정렬 + 가로 중앙 정렬 + 픽셀아트답게 안티앨리어싱 없이(nearest-neighbor)" 그리는 표준 방식.
  // 원인 조사: (1) "세로로 늘어나 보임"은 실제로는 비율이 강제로 찌그러지는 버그가 아니라(가로폭은
  // 이미 이전부터 spriteH×naturalWidth/naturalHeight로 원본 비율 그대로 산출하고 있었음, 아래 로직
  // 그대로 유지), (2) "스프라이트 주변 검은 사각 테두리"가 진짜 원인 — ctx.imageSmoothingEnabled
  // 기본값(true) 때문에 drawImage()가 스프라이트를 다운스케일할 때 PNG의 이진(0 또는 255) 알파가
  // 경계에서 흐릿하게 번지고(anti-aliasing), 그 번짐이 applyAutoOutline()의 임계값(alpha>10)을 넘어
  // 실루엣이 아니라 이미지 전체의 사각형 경계 부근을 "칠해진 것"으로 오인해 사각형에 가까운 테두리를
  // 그리게 됨(Playwright로 smoothing on/off 비교 렌더링해 직접 재현·확인). ctx.imageSmoothingEnabled =
  // false로 다운스케일을 nearest-neighbor로 강제하면 이진 알파가 그대로 유지되어 실루엣을 따라가는
  // 깔끔한 테두리가 그려짐 — 그래픽팀이 제안한 표준 그리기 함수와 동일한 처방.
  function drawDogSpriteContain(ctx, img, cx, groundRow, oy, targetH){
    ctx.imageSmoothingEnabled = false;
    var w = Math.round(targetH * (img.naturalWidth / img.naturalHeight));
    var h = Math.round(targetH);
    var x = Math.round(cx - w/2);
    var y = Math.round(groundRow - h + oy);
    ctx.drawImage(img, x, y, w, h);
  }
  var _dogOffCanvas = null, _dogOffCtx = null;
  function getDogOffscreenCtx(w, h){
    if(!_dogOffCanvas){
      _dogOffCanvas = document.createElement("canvas");
      _dogOffCtx = _dogOffCanvas.getContext("2d");
    }
    if(_dogOffCanvas.width !== w) _dogOffCanvas.width = w;
    if(_dogOffCanvas.height !== h) _dogOffCanvas.height = h;
    _dogOffCtx.clearRect(0, 0, w, h);
    return _dogOffCtx;
  }
  function hexToRgbTriple(hex){
    var m = /^#([0-9a-fA-F]{6})$/.exec(hex || "");
    if(!m) return [42, 32, 25];
    return [parseInt(m[1].slice(0,2),16), parseInt(m[1].slice(2,4),16), parseInt(m[1].slice(4,6),16)];
  }
  // 80-3번(그래픽팀 버그 리포트 반영): "정수리~이마 사이 투명한 구멍" 수정. 원인 조사 결과 스프라이트
  // PNG 원본 자체엔 내부에 갇힌 투명 픽셀이 전혀 없음(직접 알파채널 디코딩해 flood-fill로 확인) —
  // 실제로는 두 귀(쫑긋 선 귀) 사이의 정상적인 틈(원래 그림에서도 존재하던, 하늘이 비치는 V자 홈)이
  // 원인이었음. 80-2번에서 강아지 체고를 2배 넘게 키우면서 예전엔 몇 픽셀에 불과해 안 보이던 이 틈이
  // 최대 20px 안팎까지 커졌고, applyAutoOutline()이 이 틈도 외곽 실루엣과 똑같이 검은 테두리로 둘러
  // 그리는 바람에 "구멍이 뚫린 것"처럼 보이게 됨(절차적 드로잉의 쫑긋 귀도 원래 같은 틈이 있었지만
  // 마찬가지로 작아서 눈에 안 띄었을 뿐, 잠재적으로 같은 증상). 다리 사이·꼬리 옆 등 실루엣 아래쪽의
  // "진짜" 오목한 부분(정상적으로 뚫려 보여야 하는 부분)은 절대 건드리면 안 되므로, 실루엣의 맨 위쪽
  // (귀가 있는 구간)에서만, 그리고 그 구간이 "세로로 갈라진 여러 덩어리"로 보일 때만 그 갈라진 덩어리
  // 사이 틈을 주변 색으로 메워 하나로 이어붙임 — 외곽선은 이렇게 메워진 뒤의 매끈한 실루엣을 따라
  // 그려지므로 더 이상 구멍처럼 보이지 않음. 실루엣 아래쪽(몸통·다리·꼬리 부근)은 이 함수가 전혀
  // 손대지 않아 기존 렌더링과 동일.
  function closeTopSilhouetteNotches(offCtx, w, h){
    var img;
    try{ img = offCtx.getImageData(0, 0, w, h); }catch(e){ return; }
    var data = img.data;
    function opaqueAt(x, y){ return data[(y*w+x)*4+3] > 10; }
    var minY = -1, maxY = -1;
    for(var y=0; y<h && minY<0; y++){
      for(var x=0; x<w; x++){ if(opaqueAt(x,y)){ minY = y; break; } }
    }
    if(minY < 0) return; // 완전히 빈 캔버스(방어)
    for(var y2=h-1; y2>=minY && maxY<0; y2--){
      for(var x2=0; x2<w; x2++){ if(opaqueAt(x2,y2)){ maxY = y2; break; } }
    }
    var bboxH = maxY - minY + 1;
    // 귀는 항상 머리 꼭대기(실루엣 맨 위)에서 시작되므로, 이 범위 안에서만 검사 — 다리 사이 공간(맨
    // 아래쪽)까지는 절대 닿지 않도록 넉넉히 보수적으로 35%로 제한.
    var scanRows = Math.max(3, Math.round(bboxH * 0.35));
    var changed = false;
    for(var y=minY; y<Math.min(h, minY+scanRows); y++){
      var first=-1, last=-1;
      for(var x=0; x<w; x++){
        if(opaqueAt(x,y)){ if(first<0) first=x; last=x; }
      }
      if(first<0) continue;
      var runs=0, inRun=false;
      for(var x3=first; x3<=last; x3++){
        var o = opaqueAt(x3,y);
        if(o && !inRun){ runs++; inRun=true; }
        else if(!o){ inRun=false; }
      }
      if(runs <= 1) continue; // 이미 하나로 이어진 구간 — 손대지 않음(귀 사이 틈이 없는 견종은 여기서 항상 skip)
      for(var x4=first; x4<=last; x4++){
        if(opaqueAt(x4,y)) continue;
        var srcIdx = -1;
        for(var lx=x4-1; lx>=first; lx--){ if(opaqueAt(lx,y)){ srcIdx = y*w+lx; break; } }
        if(srcIdx<0){ for(var rx=x4+1; rx<=last; rx++){ if(opaqueAt(rx,y)){ srcIdx = y*w+rx; break; } } }
        if(srcIdx<0 && y+1<h && opaqueAt(x4,y+1)){ srcIdx = (y+1)*w+x4; }
        if(srcIdx>=0){
          var sp=srcIdx*4, dp=(y*w+x4)*4;
          data[dp]=data[sp]; data[dp+1]=data[sp+1]; data[dp+2]=data[sp+2]; data[dp+3]=255;
          changed = true;
        }
      }
    }
    if(changed) offCtx.putImageData(img, 0, 0);
  }
  // offCtx에 이미 그려진 내용의 실루엣을 읽어, 그 바깥 경계(8방향 인접) 1칸을 outlineHex로 채움.
  // 파이썬 프로토타입(pixel_proto)에서 검증한 "8방향 인접 셀 자동 아웃라인" 알고리즘을 캔버스
  // getImageData/putImageData로 그대로 옮긴 것.
  function applyAutoOutline(offCtx, w, h, outlineHex){
    var img;
    try{ img = offCtx.getImageData(0, 0, w, h); }catch(e){ return; } // 캔버스 미지원 환경 방어
    var data = img.data;
    var n = w*h;
    var filled = new Uint8Array(n);
    for(var i=0;i<n;i++){ filled[i] = data[i*4+3] > 10 ? 1 : 0; }
    var rgb = hexToRgbTriple(outlineHex);
    var toOutline = [];
    for(var y=0;y<h;y++){
      for(var x=0;x<w;x++){
        var idx = y*w+x;
        if(filled[idx]) continue;
        var isEdge = false;
        for(var dy=-1;dy<=1 && !isEdge;dy++){
          for(var dx=-1;dx<=1;dx++){
            if(dx===0 && dy===0) continue;
            var nx=x+dx, ny=y+dy;
            if(nx>=0 && nx<w && ny>=0 && ny<h && filled[ny*w+nx]){ isEdge = true; break; }
          }
        }
        if(isEdge) toOutline.push(idx);
      }
    }
    for(var k=0;k<toOutline.length;k++){
      var p = toOutline[k]*4;
      data[p]=rgb[0]; data[p+1]=rgb[1]; data[p+2]=rgb[2]; data[p+3]=255;
    }
    offCtx.putImageData(img, 0, 0);
  }

  var pixelBlink = false, pixelTailFrame = false, pixelBobUp = false;
  var pixelBlinkTimer = null, pixelTailTimer = null, pixelBobTimer = null;

  // 50번: offsetX — 기본은 마당 중앙(cx)이지만, 엔딩씬 '달성' 결과에서는 이동장이 있던 우측 자리에
  // 강아지가 다시 노출돼야 해서(사용자 원안: "이동장이 있던 자리에 반려견이 다시 노출됨") 그 지점으로
  // 실루엣 전체를 그대로 밀어 그릴 수 있도록 함. 다른 모든 호출부(홈 화면·산책 팝업)는 생략 시 0으로 기존과 동일.
  // 53번: forceEyesClosed — 멍멍모드의 수면형 포즈(웅크려 잠들기/꿈꾸는 다리)에서 mood나 blink 타이밍과
  // 무관하게 항상 눈을 감은 모습으로 그리기 위한 선택 인자. 생략하면(undefined/false) 기존 로직 그대로.
  // 77번(기다려 대회): override — 유저의 개가 아닌 "다른 개"(대회 상대견 4마리 등)를 같은 캔버스에
  // 동시에 다른 생김새·색상으로 그려야 할 때 쓰는 선택 인자. {breedId, furA, furADark, furB, furC, furD,
  // eyeColor, gv, sv, mood, noBadges}를 전달하면 전역 state 대신 이 값들을 사용 — 생략(undefined)하면
  // 기존처럼 항상 state(유저 자신의 개)를 그대로 읽어, 기존 호출부는 전부 그대로 안전.
  // 80-2번(마당 화면 원근감 조정): sizeMult — 마당(pixelCanvas) 화면에서만 강아지를 실제 체구 비례와
  // 무관하게 훨씬 크게(사용자 지정: 체고 60~65px) 그리기 위한 배율. 생략(undefined)하면 기존과 동일한
  // 1배로, 어질리티·대회·엔딩씬 등 기존 모든 호출부는 전혀 영향받지 않음 — 아래 drawYardDog() 래퍼를
  // 통해서만 이 값이 채워짐. H(체고)에 곱해지므로 다리·몸통·머리 등 하위 치수 전부가 비율 그대로
  // 함께 커지고(절차적 경로), 스프라이트 경로도 H를 그대로 재사용해 자동으로 같은 비율로 커짐 —
  // 150×100 논리 좌표계 안에서 계산되는 값이라 배경 픽셀과 크기 단위가 항상 맞아떨어짐(CSS 별도 확대 아님).
  function drawPixelDog(realCtx, groundRow, offsetX, forceEyesClosed, override, sizeMult){
    // 79번: 이하 함수 본문은 전부 그대로 두고(견종별 치수·성장/무드/스탯 로직 무변경), 실제 화면
    // realCtx 대신 임시 오프스크린 캔버스에 그린 뒤 맨 끝에서 아웃라인을 두르고 한 번에 합성함.
    // ctx라는 이름을 그대로 재바인딩하므로 아래 250여 줄의 기존 ctx.fillRect(...) 호출은 단 한 줄도
    // 손대지 않아도 자동으로 오프스크린 쪽에 그려짐. realCtx는 caller가 이미 걸어둔 transform
    // (idle 포즈의 save/translate/rotate/scale 등)을 그대로 유지하고 있어, 마지막 drawImage 한 번에
    // 그 변형이 동일하게 적용됨(각 도형에 개별 적용하던 것과 최종 결과는 동일).
    // 79-1번(버그 수정): 오프스크린 캔버스를 PX_W×PX_H(150×100)로 고정해뒀던 게 원인이 되어, 이보다
    // 넓은 실제 캔버스(예: [기다려 대회]의 #competitionCanvas, 290×108)에 그릴 때 offsetX가 150을
    // 넘어가는 개체(대회 5단상 중 뒤쪽 슬롯들)가 오프스크린 밖으로 잘려 사라지고, 합성(drawImage)도
    // (0,0)~(150,100) 영역에만 이뤄져 캔버스 나머지 부분이 비어 보이는 문제가 있었음(사용자가 실플레이 중
    // 발견해 보고). 오프스크린 크기를 realCtx가 실제로 그려지는 캔버스의 물리적 크기(width/height 속성)에
    // 맞춰 매 호출마다 동적으로 잡도록 수정 — 마당(pixelCanvas)·산책(walkPixelCanvas)·어질리티(agilityCanvas)는
    // 전부 기존과 동일한 150×100이라 이 변경으로 달라지는 게 없고, 대회(competitionCanvas, 290×108)만
    // 실제 캔버스 크기에 맞는 오프스크린을 받게 됨. realCtx.canvas가 없는 극단적 방어 상황에서만 기존
    // PX_W/PX_H로 폴백.
    var dogOffW = (realCtx && realCtx.canvas && realCtx.canvas.width) || PX_W;
    var dogOffH = (realCtx && realCtx.canvas && realCtx.canvas.height) || PX_H;
    var ctx = getDogOffscreenCtx(dogOffW, dogOffH);
    var ov = override || null;
    var breedId = (ov && ov.breedId) ? ov.breedId : (state.breed || "golden");
    // 29번: 믹스견은 전용 실루엣이 없어, 온보딩 때 매칭된 두 견종 중 체구 출처로 뽑힌 쪽의 픽셀 지오메트리를 그대로 재사용
    if(!ov && breedId === "mix" && state.mixGeoBreed){ breedId = state.mixGeoBreed; }
    var sc = BREED_PXSCALE[breedId] || BREED_PXSCALE.golden;
    var earStyle = sc.earStyle || "floppy";
    var tailStyle = sc.tailStyle || "wag";
    // 70번(20장): 성장 단계별 시각 변수 — 체고(H)에 스케일을 곱해 다리·몸통·머리 등 모든 하위 치수가
    // 비율 그대로 함께 줄어들게 함(다리 길이가 짧아져도 bodyBottom=groundRow-legH 공식 덕에 발은 항상
    // 접지선에 그대로 붙어있음 — 별도 캔버스 좌표 보정 불필요).
    var gv = (ov && ov.gv) ? ov.gv : growthVisual();
    // 75번(21장): 누적 스탯 기반 시각 개성화 입력값 — growthVisual()과 나란히, drawPixelDog()의
    // 기존 계산식에 배율/오프셋만 얹는 식으로 소비함(새 그래픽 자산 없음, statVisual() 주석 참고).
    var sv = (ov && ov.sv) ? ov.sv : statVisual();
    // 78번: 푸들 소형/미디엄/스탠다드 크기 클래스 배율(breedSizeScale, 다른 견종은 항상 1)을
    // 성장단계 스케일과 곱연산으로 함께 적용 — 24장 사용자 지정 그대로.
    // 80-2번: sizeMult(마당 화면 전용, drawYardDog() 경유시에만 1이 아닌 값)를 H에 곱연산으로 추가.
    // H 하나에서 L/legH/bodyH/headH/bodyW/headW 등 하위 치수가 전부 파생되므로(위 주석 참고), 절차적
    // 경로는 비율 그대로 커지고, 스프라이트 경로도 targetH가 H*1.18이라 자동으로 동일 배율로 커짐 —
    // 150×100 논리 좌표계 안에서 계산되는 값이라 배경 픽셀과 항상 크기 단위가 맞음(CSS 확대 아님).
    var sizeMultVal = (typeof sizeMult === "number" && sizeMult > 0) ? sizeMult : 1;
    var H = Math.max(6, Math.round(sc.heightCm / CM_PER_PX * gv.scale * breedSizeScale() * sizeMultVal));
    var L = Math.max(6, Math.round(H * sc.lengthRatio));
    // 민첩성: 다리 비율 소폭 조정
    var legH = Math.max(2, Math.round(H * sc.legRatio * sv.legHMult));
    var bodyH = Math.max(3, Math.round(H * (sc.bodyHRatio || 0.40)));
    var headH = Math.max(3, H - legH - bodyH);
    // 근력: 체형(가슴·어깨 폭) 비율 소폭 조정
    var bodyW = Math.max(4, Math.round(L * 0.56 * sv.bodyWMult));
    // 머리 폭은 "길이"가 아니라 "체고"를 기준으로 잡아, 몸통이 길게 늘어난 견종(웰시코기 등)도
    // 머리만 같이 늘어나 보이지 않고 자연스러운 크기를 유지하게 함
    var headW = Math.max(4, Math.round(H * 0.40));
    // 78번(24장): 비숑프리제 "큰 대두" — 다른 치수(다리·몸통)는 그대로 두고 머리 폭·높이만 배율.
    if(sc.headScaleMult){
      headH = Math.round(headH * sc.headScaleMult);
      headW = Math.round(headW * sc.headScaleMult);
    }

    var cx = Math.round(PX_W/2) + 2 + (offsetX || 0);
    var bodyLeft = cx - Math.round(bodyW/2);
    var bodyRight = bodyLeft + bodyW;
    var bodyBottom = groundRow - legH;
    var bodyTop = bodyBottom - bodyH;
    // 머리는 몸통 앞쪽(오른쪽) 끝에 상당 부분 겹쳐 붙어, 목이 끊겨 보이지 않도록 함
    // 민첩성: 스프린터형으로 살짝 앞으로 기운 자세(머리를 미세하게 앞쪽으로 당김)
    var headLeft = bodyRight - Math.round(headW*0.68) + (sv.leanForwardPx || 0);
    // 70번: 찹찹츄는 headDroop만큼 머리를 살짝 낮춰 그려 "고개가 살짝 낮음" 자세를 표현
    // 75번: 수행력이 높을수록 그 처짐을 완화(자세가 반듯하고 정렬됨)
    var effectiveHeadDroop = Math.round((gv.headDroop || 0) * (1 - sv.postureStraighten * 0.6));
    var headBottom = bodyTop + Math.round(bodyH*0.55) + effectiveHeadDroop;
    var headTop = headBottom - headH;
    var headRight = headLeft + headW;

    var mood = (ov && ov.mood) ? ov.mood : moodOf();
    var oy = (mood !== "sleepy" && !reduceMotion() && pixelBobUp) ? -1 : 0;

    var furA = (ov && ov.furA) || cssVar("--fur-a", "#E7C79A");
    var furADark = (ov && ov.furADark) || cssVar("--fur-a-dark", "#C79E68");
    var furB = (ov && ov.furB) || cssVar("--fur-b", "#B98A5E");
    var furC = (ov && ov.furC) || cssVar("--fur-c", "#EDEDED");
    var furD = (ov && ov.furD) || cssVar("--fur-d", "#4A4038");
    var eyeColor = (ov && ov.eyeColor) || cssVar("--eye-color", furD);
    // 70번: 찹찹츄는 몸통·귀 털색을 옅게 탈채도(전신에 은은하게) — 코·눈동자(furD/eyeColor)는 그대로
    // 두어 표정이 흐려지지 않게 함. "입가·눈가 회색 톤" 디테일 포인트는 아래 주둥이/눈 블록 근처에서
    // 별도로 반투명 패치를 얹어 표현.
    if(gv.grey){
      furA = mixHexToGrey(furA, 0.32);
      furADark = mixHexToGrey(furADark, 0.32);
    }

    // 80번(그래픽팀 협업): AI 스프라이트 파일럿 적용 — 절차적 드로잉 대신 미리 그려둔 견종별×성장단계별
    // ×팔레트별 스프라이트 이미지가 있으면 그걸 합성하고, 없으면(아직 못 만든 조합·로딩 전·믹스견 등)
    // 기존 절차적 드로잉으로 안전하게 폴백함. override(대회 상대견) 쪽은 coatId/stageIdx를 명시로
    // 넘겨받고, 유저 자신의 개는 state.coatId/state.growthStage를 그대로 읽음. 믹스견(시고르자브)은
    // 전용 스프라이트가 없으므로, 모색 출처 접두사가 지오메트리 견종(breedId)과 일치할 때만 스프라이트를
    // 시도하고 그 외엔 coatId를 null로 둬 항상 절차적 드로잉으로 빠지게 함(그래픽팀 오픈이슈 5번).
    var stageIdx = (ov && typeof ov.stageIdx === "number") ? ov.stageIdx : (typeof state.growthStage === "number" ? state.growthStage : 2);
    var coatId = null;
    if(ov){
      coatId = ov.coatId || null;
    } else {
      coatId = state.coatId || null;
      if(state.breed === "mix" && coatId){
        var mixPrefix = breedId + "_";
        coatId = coatId.indexOf(mixPrefix) === 0 ? coatId.slice(mixPrefix.length) : null;
      }
    }
    var spriteImg = coatId ? getDogSpriteImage(breedId, stageIdx, coatId) : null;

    if(spriteImg){
      // 스프라이트 경로: 절차적 좌표(legH/bodyH/headH 등)는 배지 위치 계산 등에 계속 쓰이므로 그대로 두고,
      // 실루엣만 이미지 한 장으로 대체. 체고(H)에 귀·꼬리 여유분(헤드룸)을 곱해 세로 크기를 잡고, 스프라이트
      // 원본 가로세로 비율을 유지한 채 가로 크기를 산출 — groundRow(접지선)에 바닥을 맞추고 cx(중심)에 가로
      // 중앙 정렬. Playwright 시각 확인으로 튜닝된 값(80번). 80-1번: 실제 그리기는 drawDogSpriteContain()으로
      // 위임 — 비율 유지 계산은 동일하고, ctx.imageSmoothingEnabled=false가 추가돼 다운스케일 시 사각형
      // 테두리 아티팩트가 생기지 않음(위 함수 정의부 주석 참고).
      drawDogSpriteContain(ctx, spriteImg, cx, groundRow, oy, H * 1.18);
    } else {
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
      // 래브라도: 두툼하고 곧게 뻗은 "수달 꼬리" — 75번: 친화력이 높으면 기본값으로 살짝 들려있음
      ctx.fillRect(bodyLeft - tailW, bodyTop + Math.round(bodyH*0.35) - sv.tailLiftPx + oy, tailW + 1, tailH);
    } else {
      // 골든 리트리버/보더콜리: 부드럽게 살랑이는 꼬리
      var tailX = bodyLeft - tailW + 1;
      var tailY;
      if(mood === "sad"){ tailY = bodyBottom - Math.round(tailH*0.5); }
      else if(mood === "sleepy"){ tailY = bodyTop + Math.round(bodyH*0.25); }
      // 75번: 친화력이 높으면 기본값으로 살짝 들려있음(슬프거나 졸릴 때는 그대로 두어 감정 표현 유지)
      else { tailY = (pixelTailFrame ? (bodyTop - Math.round(tailH*0.15)) : (bodyTop + Math.round(bodyH*0.3))) - sv.tailLiftPx; }
      ctx.fillRect(tailX, tailY + oy, tailW, tailH);
    }

    // 몸통
    ctx.fillStyle = furA;
    ctx.fillRect(bodyLeft, bodyTop + oy, bodyW, bodyH);

    // 79번: 가슴/배 밝은 패치 — 유저가 보내준 레퍼런스 대부분이 공통적으로 갖고 있던 특징(몸통 앞쪽
    // 아래에 furC 톤의 밝은 가슴털)을 견종 불문 공통으로 얹어 실루엣에 입체감을 더함. 머리가 붙는
    // 몸통 앞쪽(오른쪽) 아래쪽에 배치.
    var chestW = Math.max(1, Math.round(bodyW*0.4));
    var chestH = Math.max(1, Math.round(bodyH*0.6));
    var chestX = bodyRight - chestW - Math.round(bodyW*0.08);
    var chestY = bodyBottom - chestH;
    ctx.fillStyle = furC;
    ctx.fillRect(chestX, chestY + oy, chestW, chestH);

    // 75번: 건강함 → 털 하이라이트(윤기) 레이어 강화 — 등줄기를 따라 옅은 밝은 띠를 얹어 표현
    if(sv.furShineAlpha > 0){
      ctx.save();
      ctx.globalAlpha = sv.furShineAlpha;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(bodyLeft + Math.round(bodyW*0.08), bodyTop + oy, Math.round(bodyW*0.84), Math.max(1, Math.round(bodyH*0.16)));
      ctx.restore();
    }

    // 엉덩이 뽕(rumpBump) — 웰시코기처럼 봉긋하고 풍성한 뒷모습을 가진 견종만
    if(sc.rumpBump){
      var rumpW = Math.max(2, Math.round(bodyW*0.3));
      var rumpH = Math.max(2, Math.round(bodyH*0.32));
      ctx.fillStyle = furA;
      ctx.fillRect(bodyLeft, bodyTop - rumpH + Math.round(rumpH*0.35) + oy, rumpW, rumpH);
    }

    // 78번: 곱슬곱슬 뭉게구름 실루엣(비숑프리제) — 몸통 윤곽을 따라 작은 뭉치를 얹어 스캘럽 느낌을 냄
    if(sc.curlyFur){
      var bPuffR = Math.max(2, Math.round(bodyH*0.22));
      [[bodyLeft+bodyW*0.15, bodyTop],[bodyLeft+bodyW*0.5, bodyTop-bPuffR*0.3],[bodyLeft+bodyW*0.85, bodyTop],
       [bodyLeft-bPuffR*0.3, bodyTop+bodyH*0.5],[bodyRight+bPuffR*0.3, bodyTop+bodyH*0.5]].forEach(function(p){
        drawFurPuff(ctx, p[0], p[1]+oy, bPuffR, furA);
      });
    }

    // 머리 (몸통보다 먼저 겹치는 부분을 자연스럽게 덮도록 몸통 다음에 그림)
    ctx.fillStyle = furA;
    ctx.fillRect(headLeft, headTop + oy, headW, headH);

    // 78번: 머리 쪽 곱슬 뭉치도 함께(귀·눈·주둥이는 이후에 그려져 또렷하게 그 위에 얹힘)
    if(sc.curlyFur){
      var hPuffR = Math.max(2, Math.round(headH*0.26));
      [[headLeft+headW*0.2, headTop],[headLeft+headW*0.5, headTop-hPuffR*0.3],[headLeft+headW*0.8, headTop]].forEach(function(p){
        drawFurPuff(ctx, p[0], p[1]+oy, hPuffR, furA);
      });
    }

    // 귀 — "먼 쪽 귀 + 가까운 쪽 귀" 두 개를 살짝 겹쳐 그려, 옆모습이어도 귀가 하나만 있는
    // 것처럼 허전해 보이지 않게 함. 처진 귀는 아래로 늘어지고, 쫑긋 선 귀는 위로 솟음.
    // 모색과 무관하게 항상 또렷이 구분되도록 각 팔레트의 "짙은" 색(aDark)을 사용
    // 70번: 털뭉치는 귀가 조금 더 쫑긋(earPerk>1), 찹찹츄는 살짝 처짐(earPerk<1)
    // 75번: 이해력이 높으면 귀가 항상 쫑긋 선 기본 자세(확대), 공격성이 높으면 살짝 뒤로 젖혀진 인상(축소)
    var earScale = (sc.earScale || 1) * gv.earPerk * sv.earAlertMult * sv.earBackMult;
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

    // 70번(찹찹츄 디테일 포인트): 입가·눈가에 옅은 회색 톤 — 반투명 패치를 배경(주둥이/얼굴) 위에
    // 얹어서 표현하고, 눈은 이 패치보다 나중에 그려 또렷함을 유지함(패치가 눈동자를 가리지 않게).
    if(gv.grey){
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#B7B2A4";
      // 입가: 주둥이 뿌리 쪽에 옅게
      ctx.fillRect(snoutLeft - Math.round(snoutW*0.1), snoutTop + Math.round(snoutH*0.05) + oy, Math.round(snoutW*0.55), Math.round(snoutH*0.45));
      // 눈가: 눈 주변에 옅게(아래에서 계산할 eyeY와 같은 기준을 앞당겨 사용)
      var greySpot = Math.max(2, Math.round(headW*0.22));
      var greyEyeY = headTop + Math.round(headH*0.42) - Math.round(greySpot*0.3);
      ctx.fillRect(headLeft + Math.round(headW*0.24), greyEyeY + oy, greySpot, greySpot);
      ctx.fillRect(headLeft + Math.round(headW*0.56), greyEyeY + oy, greySpot, greySpot);
      ctx.restore();
    }

    // 눈 — 두 개, 감은 눈은 가는 선으로 표현
    var eyesClosed = forceEyesClosed ? true : (mood === "sleepy" ? true : pixelBlink);
    var eyeY = headTop + Math.round(headH*0.42);
    if(!eyesClosed){
      // 75번: 충성도·친화력이 높으면 눈매가 부드럽고 둥글게(확대), 공격성이 높으면 눈매가 날카롭게(축소)
      var eyeSize = Math.max(1, Math.round(headW*0.14 * sv.eyeSoftMult * sv.eyeSharpMult));
      ctx.fillStyle = eyeColor;
      ctx.fillRect(headLeft + Math.round(headW*0.32), eyeY + oy, eyeSize, eyeSize);
      ctx.fillRect(headLeft + Math.round(headW*0.6), eyeY + oy, eyeSize, eyeSize);
    } else {
      var lineW = Math.max(1, Math.round(headW*0.16));
      ctx.fillStyle = furD;
      ctx.fillRect(headLeft + Math.round(headW*0.30), eyeY + oy, lineW, 1);
      ctx.fillRect(headLeft + Math.round(headW*0.58), eyeY + oy, lineW, 1);
    }
    } // 80번: spriteImg 유무 분기(if/else) 종료 — 이 아래 배지·아웃라인·합성은 두 경로 공통으로 계속 실행

    // 75번(21장): 능력 보유 → 시각적 표식(원칙만 반영) — 취득한 능력(catalog: 접두사) 하나당 머리 위에
    // 작은 점 하나씩, 최대 ABILITY_BADGE_MAX개까지만 그려 화면이 어지러워지지 않게 함. 긍정 능력은
    // 밝은 초록, 부정 능력은 탁한 주황으로 구분(개별 능력별 구체 모양·색 매핑은 다음 라운드 오픈 이슈).
    var badgeAbilities = (ov && ov.noBadges) ? [] : ownedCatalogAbilities();
    if(badgeAbilities.length){
      var badgeCount = Math.min(badgeAbilities.length, ABILITY_BADGE_MAX);
      var badgeSize = Math.max(1, Math.round(headW*0.09));
      var badgeGap = Math.max(1, Math.round(badgeSize*0.6));
      var badgeRowW = badgeCount*badgeSize + (badgeCount-1)*badgeGap;
      var badgeStartX = headLeft + Math.round(headW/2) - Math.round(badgeRowW/2);
      var badgeY = headTop - badgeSize - Math.max(1, Math.round(headH*0.12));
      for(var bi=0; bi<badgeCount; bi++){
        ctx.fillStyle = badgeAbilities[bi].positive ? "#5FBF6B" : "#D98A3D";
        ctx.fillRect(badgeStartX + bi*(badgeSize+badgeGap), badgeY + oy, badgeSize, badgeSize);
      }
    }

    // 80-3번: 아웃라인을 두르기 전에, 실루엣 맨 위쪽(귀 부근)에 생길 수 있는 "갈라진 틈"을 먼저
    // 메움 — 위 closeTopSilhouetteNotches() 정의부 주석 참고.
    closeTopSilhouetteNotches(ctx, dogOffW, dogOffH);
    // 79번: 오프스크린에 다 그려진 실루엣에 굵은 아웃라인을 두른 뒤, 캐릭터가 실제로 보여야 할
    // realCtx로 한 번에 합성(캐릭터가 idle 포즈 등으로 이미 걸어둔 transform은 realCtx 쪽에 그대로
    // 남아있으므로 drawImage 한 번으로 기존과 동일하게 반영됨).
    applyAutoOutline(ctx, dogOffW, dogOffH, DOG_OUTLINE_COLOR);
    realCtx.drawImage(ctx.canvas, 0, 0);
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
  // 67번(신규): 배경 하늘색은 실제 접속 시각이 아니라 "게임 속 시간"(state.time.hour, 06~22시,
  // 64번에서 도입된 게임시계)을 기준으로 4단계로 나눠 반영 — 사용자 지정 구간 그대로: 아침 06~10시 /
  // 낮 11~16시 / 노을·저녁 17~19시 / 밤 20~22시(+방어적 기본값). 산책 이벤트 조건에 쓰이는
  // isDaytimeNow()/timeBand()(58번, 실제 기기 시각 기준 — "이 경계는 절대 건드리지 않는다"고 이미
  // 확정된 별개 시스템)는 전혀 건드리지 않고, 배경 전용으로 새 함수를 분리함.
  function gameSkyBand(){
    var h = (typeof state !== "undefined" && state.time && typeof state.time.hour === "number") ? state.time.hour : 6;
    if(h >= 6 && h <= 10) return "morning";
    if(h >= 11 && h <= 16) return "day";
    if(h >= 17 && h <= 19) return "evening";
    return "night";
  }
  // 67번: 시간대(4종) × 실제 관측 날씨(7종, weatherCodeToCondition 결과)의 하늘 그라디언트 표를
  // 손으로 지정 — 색상 보간 함수 대신 명시적 표로 관리해 팔레트를 눈으로 바로 확인·조정할 수 있게 함.
  // 각 값은 [오프셋, 색상] 배열이라 createLinearGradient에 그대로 addColorStop으로 먹임(3단 그라디언트도 가능).
  var SKY_PALETTES = {
    morning: {
      clear:    [[0,"#8FB8DE"],[0.55,"#BFDCE6"],[1,"#F7DCB0"]],
      cloudy:   [[0,"#9FB9CE"],[0.55,"#C7D6D6"],[1,"#EAD9BE"]],
      overcast: [[0,"#A7ADAE"],[1,"#D8CDBC"]],
      fog:      [[0,"#B7BDB8"],[1,"#E2D9C8"]],
      rain:     [[0,"#5E6B78"],[1,"#9C9587"]],
      storm:    [[0,"#4C5560"],[1,"#847E77"]],
      snow:     [[0,"#B9CBD8"],[1,"#EBE3D6"]]
    },
    day: {
      clear:    [[0,"#6FB6E8"],[1,"#DCEFD2"]],
      cloudy:   [[0,"#A9C3D6"],[1,"#DCE6D6"]],
      overcast: [[0,"#9AA6AC"],[1,"#C7CFC7"]],
      fog:      [[0,"#9AA6AC"],[1,"#C7CFC7"]],
      rain:     [[0,"#6E7C89"],[1,"#A7AF9E"]],
      storm:    [[0,"#5B6672"],[1,"#8D9483"]],
      snow:     [[0,"#C7D6DE"],[1,"#E8EEE4"]]
    },
    evening: {
      clear:    [[0,"#4C4A7C"],[0.5,"#C96A4E"],[1,"#F6B65E"]],
      cloudy:   [[0,"#565575"],[0.5,"#B87C63"],[1,"#E7C588"]],
      overcast: [[0,"#5B5A66"],[1,"#9C8C82"]],
      fog:      [[0,"#605F6C"],[1,"#A69A8E"]],
      rain:     [[0,"#33313F"],[1,"#5E5850"]],
      storm:    [[0,"#28262E"],[1,"#4A443E"]],
      snow:     [[0,"#4C4D6A"],[1,"#9598A0"]]
    },
    night: {
      clear:    [[0,"#151A34"],[1,"#3C3F5C"]],
      cloudy:   [[0,"#20253E"],[1,"#41425A"]],
      overcast: [[0,"#232B48"],[1,"#42465F"]],
      fog:      [[0,"#242A3E"],[1,"#454A5C"]],
      rain:     [[0,"#10142A"],[1,"#2E3242"]],
      storm:    [[0,"#0C0F22"],[1,"#282A38"]],
      snow:     [[0,"#232E4A"],[1,"#4E566E"]]
    }
  };
  // 67번: 은은한 장식 구름 한 송이(테두리 없는 단순 픽셀 뭉치 3단) — 실제 관측 날씨와 무관하게 항상
  // 살짝 떠 있어 "구름"을 표현하고, 날씨가 실제로 흐리다면 아래 기존 오버레이가 더 진하게 덧그려짐.
  function drawCloudPuff(ctx, x, y){
    ctx.fillRect(x, y, 14, 4);
    ctx.fillRect(x + 3, y - 2, 9, 3);
    ctx.fillRect(x - 2, y + 3, 18, 2);
  }
  function drawPixelSky(ctx, groundRow){
    var band = gameSkyBand();
    var cond = WEATHER_STATE.condition;
    var palette = SKY_PALETTES[band] || SKY_PALETTES.day;
    var stops = palette[cond] || palette.clear;

    var grad = ctx.createLinearGradient(0, 0, 0, groundRow);
    stops.forEach(function(s){ grad.addColorStop(s[0], s[1]); });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, PX_W, groundRow);

    // 해/달/별 — 시간대별로 위치·색·크기를 다르게(아침=낮게 뜬 은은한 해, 낮=높이 뜬 밝은 해,
    // 저녁=낮게 지는 크고 붉은 해, 밤=달+별). 맑음/흐림일 때만(비·눈·안개엔 해가 안 보이는 게 자연스러움)
    if(cond === "clear" || cond === "cloudy"){
      if(band === "morning"){
        ctx.fillStyle = "#FFE2A6"; ctx.fillRect(18, 30, 9, 9);
        ctx.fillStyle = "#FFF2CC"; ctx.fillRect(16, 32, 13, 5);
      } else if(band === "day"){
        ctx.fillStyle = "#FFE7A0"; ctx.fillRect(122, 8, 8, 8);
        ctx.fillStyle = "#FFF3C8"; ctx.fillRect(120, 10, 12, 4);
      } else if(band === "evening"){
        ctx.fillStyle = "#FF9F5E"; ctx.fillRect(112, 34, 11, 11);
        ctx.fillStyle = "#FFC98A"; ctx.fillRect(109, 37, 17, 5);
      }
    }
    if(band === "night"){
      ctx.fillStyle = "#F4EFD8";
      ctx.fillRect(20, 8, 7, 7);
      var stars = [[40,14],[55,7],[70,18],[95,9],[110,15],[10,20],[130,11],[60,22]];
      stars.forEach(function(s){ ctx.fillRect(s[0], s[1], 1, 1); });
    }

    // 67번(개발팀 판단 추가): 시간대별 보너스 풍경 요소 — 아침엔 나는 새 두 마리(V자), 저녁엔 지평선
    // 근처를 나는 새 실루엣 한 마리로 노을 분위기를 보강. 낮/밤은 기존 해·달·별 요소로 충분하다고 판단.
    if(band === "morning" && (cond === "clear" || cond === "cloudy")){
      ctx.fillStyle = "rgba(60,54,46,0.55)";
      [[45,20],[54,24]].forEach(function(b){
        ctx.fillRect(b[0], b[1], 3, 1);
        ctx.fillRect(b[0]-2, b[1]-1, 2, 1);
        ctx.fillRect(b[0]+3, b[1]-1, 2, 1);
      });
    }
    if(band === "evening" && (cond === "clear" || cond === "cloudy")){
      ctx.fillStyle = "rgba(60,40,30,0.5)";
      ctx.fillRect(90, 26, 3, 1);
      ctx.fillRect(88, 25, 2, 1);
      ctx.fillRect(93, 25, 2, 1);
    }

    // 67번: 장식용 잔잔한 구름 2송이 — 날씨와 무관하게 항상 은은히 떠 있고, 시간대별 색조를 입혀
    // "구름" 표현을 상시화. Date.now() 기반 위상으로 아주 느리게 좌우로 흔들려("바람" 느낌) —
    // 전용 애니메이션 타이머를 새로 만들지 않아도 숨쉬기/유휴포즈 타이머가 주기적으로 drawPixelScene()을
    // 다시 불러주므로 자연히 흘러가는 것처럼 보임.
    var drift = Math.sin(Date.now() / 4000) * 3;
    var cloudTint = band === "night" ? "rgba(255,255,255,0.16)"
      : band === "evening" ? "rgba(255,236,214,0.55)"
      : band === "morning" ? "rgba(255,255,255,0.5)"
      : "rgba(255,255,255,0.7)";
    ctx.fillStyle = cloudTint;
    drawCloudPuff(ctx, 14 + drift, 14);
    drawCloudPuff(ctx, 82 - drift, 9);

    // 기존 날씨별 강조 오버레이(실제 흐림/비/눈이 관측됐을 때 더 진하게)는 그대로 유지
    if(cond === "cloudy" || cond === "overcast" || cond === "fog"){
      ctx.fillStyle = band === "night" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.55)";
      ctx.fillRect(10, 12, 22, 5);
      ctx.fillRect(70, 6, 26, 5);
    }
    if(cond === "rain" || cond === "storm"){
      ctx.fillStyle = band === "night" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)";
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

    // 67번: 바람 표현 — 상단에 옅은 대각 스트리크 몇 개, drift 위상에 맞춰 서서히 흘러 미풍 느낌을 냄
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = band === "night" ? "#AEB6D6" : "#FFFFFF";
    ctx.lineWidth = 1;
    for(var wi = 0; wi < 3; wi++){
      var wx = ((wi * 45 + drift * 6) % (PX_W + 20)) - 10;
      var wy = 4 + wi * 4;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + 9, wy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
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
  // 80-2번: opts(선택) — {scale, x, groundRow}. 생략하면 완전히 기존과 동일(항등변환)이라 엔딩씬 등
  // 기존 호출부는 전혀 영향받지 않음. 마당(drawPixelScene)에서만 "작고 훨씬 뒤(위)로 밀린" 개집을
  // 그리기 위해 사용 — 함수 본문(x=6 기준 좌표식)은 한 글자도 안 건드리고, 원래 접지 기준점(x=6,
  // groundRow)이 opts.x/opts.groundRow로 매핑되도록 좌표계 자체를 이동+축소함(translate→scale→
  // 역translate 합성). 이 씬은 바닥이 4px 띠뿐인 평면 다이어그램이라 진짜 원근감은 없고, "더 작고 더
  // 위(하늘 쪽)"로 배치하는 것으로 "멀리 있다"는 느낌만 근사함(사용자 확인: 이번엔 실사이즈 비례 무시 허용).
  function drawDoghouse(ctx, groundRow, opts){
    var scale = (opts && opts.scale) || 1;
    var targetX = (opts && opts.x != null) ? opts.x : 6;
    var targetGroundRow = (opts && opts.groundRow != null) ? opts.groundRow : groundRow;
    var needsTransform = (opts != null);
    if(needsTransform){
      ctx.save();
      ctx.translate(targetX, targetGroundRow);
      ctx.scale(scale, scale);
      ctx.translate(-6, -groundRow);
    }
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

    if(needsTransform){
      ctx.restore();
    }
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

    // 80-3번(그래픽팀 피드백 반영): 80-2번에서 시도했던 "개집을 작게 축소해 왼쪽 구석 하늘 쪽으로
    // 배치"가 오히려 "공중에 붕 뜬 집"처럼 보인다는 피드백을 받아, 마당 화면에서는 개집을 아예 그리지
    // 않기로 변경 — drawDoghouse() 함수 자체(및 opts 파라미터, 엔딩씬 호출부)는 그대로 남겨두고, 이
    // 화면(drawPixelScene)의 호출 한 줄만 제거함. 엔딩씬의 개집 렌더링은 이 변경과 무관하게 그대로 유지.
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
    // 70번: 성장 단계별 timeMult를 곱해 "빠르고 부산스럽게(털뭉치)"~"느리고 여유롭게(찹찹츄)" 체감
    // 차이를 냄 — 기준 간격(찹츄, timeMult=1) 자체는 53번에 확정된 4~9초 그대로.
    var gap = (4000 + Math.random() * 5000) * growthVisual().timeMult;
    pixelIdlePoseGapTimer = window.setTimeout(playRandomPixelIdlePose, gap);
  }
  function playRandomPixelIdlePose(){
    if(reduceMotion()) return;
    var pose = PIXEL_IDLE_POSES[Math.floor(Math.random() * PIXEL_IDLE_POSES.length)];
    pixelIdlePose = pose.id;
    pixelIdlePoseStartTs = Date.now();
    pixelIdlePoseDurMs = (pose.minMs + Math.random() * (pose.maxMs - pose.minMs)) * growthVisual().timeMult;
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

  // 80-2번(마당 화면 원근감 조정): 마당(pixelCanvas, drawPixelScene→drawPixelIdleDog 경로) 화면에서만
  // 강아지를 실사이즈 비례 무시하고 훨씬 크게(체고 약 60~65px, 150×100 논리 좌표계 기준) 그리기 위한
  // 배율. 골든(체고 71cm, 대형견 기준)이 성체일 때 H≈37 → 스프라이트 표시 높이 H*1.18≈44px가 나오므로,
  // 44*1.42≈62px로 목표 구간(60~65px) 중앙에 오도록 역산(Playwright로 실측 후 확정). H 하나에만 곱해
  // 다리·몸통·머리 등 모든 하위 치수와(절차적 경로) 스프라이트 표시 높이(스프라이트 경로, H*1.18 그대로
  // 재사용)가 함께 비례 확대됨 — 어질리티(026)·대회(028)·엔딩씬은 이 상수를 전혀 참조하지 않으므로
  // 완전히 기존과 동일하게 유지됨(사용자 확인: "어질리티·대회 화면은 이번 조정 대상이 아님").
  var YARD_DOG_SIZE_MULT = 2.1;
  function drawYardDog(ctx, groundRow, offsetX, forceEyesClosed){
    drawPixelDog(ctx, groundRow, offsetX, forceEyesClosed, null, YARD_DOG_SIZE_MULT);
  }

  // 현재 멍멍모드 포즈에 맞춰 강아지를 그림 — 포즈가 없으면(기본 숨쉬기) 기존 drawPixelDog 그대로 호출.
  // 각 포즈는 drawPixelDog를 감싸는 간단한 캔버스 변형(이동/회전/스케일)과, 필요하면 위에 살짝 겹치는
  // 보조 표시(점선 시선·Zzz·움찔 자국 등)로 표현 — 스케치 확인 때 보여드린 컨셉을 실제 색이 입혀진
  // 픽셀아트 위에 그대로 옮긴 것. 80-2번: 이 함수 내부의 모든 drawPixelDog 호출은 drawYardDog로 교체 —
  // 마당 화면에서만 강아지가 커지도록 스코프를 이 함수 하나로 한정함(호출부는 drawPixelScene 단 하나).
  function drawPixelIdleDog(ctx, groundRow){
    var pose = pixelIdlePose;
    if(!pose){ drawYardDog(ctx, groundRow); return; }
    var elapsed = Date.now() - pixelIdlePoseStartTs;
    var r = pixelIdlePoseDurMs > 0 ? Math.min(1, elapsed / pixelIdlePoseDurMs) : 1;
    var cx = Math.round(PX_W/2) + 2;
    switch(pose){
      case "IDLE-001": // 화면 밖 마실: 걸어나감 → 잠깐 사라짐 → 후다닥 복귀
        if(r < 0.35){ drawYardDog(ctx, groundRow, Math.round(70 * (r/0.35))); }
        else if(r < 0.65){ /* 화면 밖: 그리지 않음 */ }
        else { drawYardDog(ctx, groundRow, Math.round(70 * (1 - (r-0.65)/0.35))); }
        break;
      case "IDLE-002": // 골똘히 쳐다보기: 살짝 고개를 든 자세 + 응시 방향 점선
        ctx.save();
        ctx.translate(cx, groundRow); ctx.rotate(-0.05); ctx.translate(-cx, -groundRow);
        drawYardDog(ctx, groundRow);
        ctx.restore();
        ctx.strokeStyle = "#8A8370"; ctx.lineWidth = 1; ctx.setLineDash([2,2]);
        ctx.beginPath(); ctx.moveTo(cx+10, groundRow-30); ctx.lineTo(cx+34, groundRow-46); ctx.stroke();
        ctx.setLineDash([]);
        break;
      case "IDLE-003": // 웅크려 잠들기: 낮게 웅크린 실루엣 + Zzz
        ctx.save();
        ctx.translate(cx, groundRow); ctx.scale(1, 0.62); ctx.translate(-cx, -groundRow);
        drawYardDog(ctx, groundRow, 0, true);
        ctx.restore();
        ctx.fillStyle = "#726B58"; ctx.font = "7px sans-serif"; ctx.fillText("Z z", cx+16, groundRow-44);
        break;
      case "IDLE-004": // 꿈꾸는 다리: 누운 채 다리가 움찔움찔 + Zzz
        ctx.save();
        ctx.translate(cx, groundRow); ctx.scale(1, 0.7); ctx.translate(-cx, -groundRow);
        drawYardDog(ctx, groundRow, (Math.floor(elapsed/220)%2===0) ? 1 : -1, true);
        ctx.restore();
        ctx.fillStyle = "#726B58"; ctx.font = "7px sans-serif"; ctx.fillText("Z z", cx+16, groundRow-40);
        break;
      case "IDLE-005": // 뒷다리로 긁기: 제자리 + 긁는 동작 자국 깜빡임
        drawYardDog(ctx, groundRow);
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
        drawYardDog(ctx, groundRow);
        ctx.restore();
        break;
      case "IDLE-007": // 부르르 털기: 좌우로 빠르게 흔들림 + 물방울 튀는 선
        drawYardDog(ctx, groundRow, (Math.floor(elapsed/60) % 2 === 0) ? 1 : -1);
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
        drawYardDog(ctx, groundRow, orbitX);
        ctx.strokeStyle = "#8A8370"; ctx.lineWidth = 1; ctx.setLineDash([1,2]);
        ctx.beginPath(); ctx.ellipse(cx, groundRow-6, 10, 3, 0, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        break;
      }
      case "IDLE-009": // 플레이바우: 앞다리를 낮춘 "놀자" 자세 → 반응 없으면 머쓱하게 풂
        var bowTilt = r < 0.65 ? -0.16 : 0;
        ctx.save();
        ctx.translate(cx, groundRow); ctx.rotate(bowTilt); ctx.translate(-cx, -groundRow);
        drawYardDog(ctx, groundRow);
        ctx.restore();
        if(r < 0.65){
          ctx.strokeStyle = "#C4482B"; ctx.lineWidth = 1; ctx.setLineDash([2,2]);
          ctx.beginPath(); ctx.moveTo(cx+30, groundRow-52); ctx.lineTo(cx+30, groundRow-58); ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
      case "IDLE-010": // 뭔가 쫓기: 고개를 이리저리 + 작은 점(파리)이 움직임
        drawYardDog(ctx, groundRow, (Math.floor(elapsed/260) % 2 === 0) ? 2 : -2);
        ctx.fillStyle = "#C4482B";
        ctx.fillRect(cx + 20 + Math.round(Math.sin(elapsed/260) * 16), groundRow - 50 + Math.round(Math.cos(elapsed/310) * 6), 2, 2);
        break;
      case "IDLE-011": // 바닥 냄새 산책: 천천히 좌우로 어슬렁 + 냄새 자국
        var drift = Math.round(Math.sin(elapsed/900) * 10);
        drawYardDog(ctx, groundRow, drift);
        if(Math.floor(elapsed/300) % 2 === 0){
          ctx.strokeStyle = "#8A8370"; ctx.lineWidth = 1; ctx.setLineDash([1,2]);
          ctx.beginPath(); ctx.arc(cx+drift+16, groundRow-2, 5, Math.PI, 0); ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
      default:
        drawYardDog(ctx, groundRow);
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

  // 28번 → 71번(산책 화면 실제 반영)에서 전면 교체: 산책 팝업의 반려견은 더 이상 마당과 같은 뒷모습
  // drawPixelDog()가 아니라, 역POV(정면 접근) 전용으로 새로 그린 drawWalkFrontDog()(025번)를 씀 —
  // 함수 이름과 호출부(syncWalkDogVisual/applyPixelMode/startPixelAnimation의 blink·tail·bob 타이머 등)는
  // 그대로 두고 내부 구현만 바꿔서, 이 함수를 부르는 다른 코드는 전혀 손대지 않아도 되게 함.
  // 배경(하늘·바닥·도로·소품)은 이제 별도 레이어 #walkPovCanvas(drawWalkPovBackground, 025번)가 그리므로
  // 여기선 여전히 반려견만 투명 배경에 그림.
  function drawWalkPixelDog(){
    if(!el.walkPixelCanvas || !el.walkPixelCanvas.getContext) return;
    var ctx = el.walkPixelCanvas.getContext("2d");
    if(!ctx) return;
    ctx.clearRect(0, 0, PX_W, PX_H);
    drawWalkFrontDog(ctx, Date.now() / 1000);
  }

  function stopPixelAnimation(){
    [pixelBlinkTimer, pixelTailTimer, pixelBobTimer].forEach(function(t){ if(t) window.clearInterval(t); });
    pixelBlinkTimer = pixelTailTimer = pixelBobTimer = null;
    stopPixelIdlePoseCycle();
  }
  function startPixelAnimation(){
    stopPixelAnimation();
    if(reduceMotion()) return;
    // 70번: 눈 깜빡임/꼬리/들썩임(숨쉬기) 기본 주기도 timeMult만큼 늘리거나 줄여 성장 단계 속도감을
    // 상시 애니메이션에도 반영 — checkGrowthStageTransition()이 단계 전환 시 이 함수를 다시 불러 새
    // timeMult로 타이머를 재시작함(setInterval 주기는 생성 시점에 고정되므로).
    var tm = growthVisual().timeMult;
    pixelBlinkTimer = window.setInterval(function(){
      pixelBlink = true; drawPixelScene(); drawWalkPixelDog();
      window.setTimeout(function(){ pixelBlink = false; drawPixelScene(); drawWalkPixelDog(); }, 160);
    }, Math.round(3200 * tm));
    pixelTailTimer = window.setInterval(function(){
      pixelTailFrame = !pixelTailFrame; drawPixelScene(); drawWalkPixelDog();
    }, Math.round(450 * tm));
    pixelBobTimer = window.setInterval(function(){
      pixelBobUp = !pixelBobUp; drawPixelScene(); drawWalkPixelDog();
    }, Math.round(900 * tm));
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
