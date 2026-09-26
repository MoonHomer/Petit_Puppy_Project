  // 85번(메인화면 교체 — 페이퍼컷 레이어 거실): 종이를 5장 겹쳐 정면에서 입체처럼 보이게 하는 마당.
  // 사용자가 스케치(페이퍼컷_마당_스케치 v1~v3)로 확정한 내용을 그대로 게임에 옮김 — 색 구성, 크림색 종이
  // 테두리, 레이어 배율(먼 곳부터 x0.7·x1.5·x2·x3·x3.5, 레이어2 x3 = 84번 원본 시트 1:1), 종이 가장자리를
  // 넘는 "폴짝" 레이어 이동(점프 꼭대기에서 앞뒤 순서 바꿈), 친밀도(유대감)에 따른 선호 레이어, 불편할 때
  // 레이어5·4로 반반 피하기, 마우스/손가락 시차(패럴랙스), 개가 소품(방석·밥그릇·장난감)을 쓰는 행동.
  // 기본 세트는 "집 안(거실)"이고 소파는 사용자 요청으로 주황·짙은 노랑 계열. 숲 세트도 데이터로 남겨둠
  // (추후 세트 꾸미기용). 그리기는 84번의 #pixelDogHiCanvas(마당 위 고해상도 레이어)를 화면 크기×기기
  // 픽셀비율로 키워 그대로 씀. 논리 좌표는 660×440(= 150×100의 4.4배, 84번과 같은 좌표계).
  // 엔딩씬(state.ending) 동안은 꺼지고, 기존 150×100 마당(엔딩 연출)이 그대로 보임.
  var PC = null;
  function papercutYardActive(){
    return typeof PC !== "undefined" && !!PC && !state.ending && !!(el && el.pixelDogHiCanvas);
  }
  function papercutYardKick(){ if(typeof PC !== "undefined" && PC) PC.kick(); }

  (function(){
    var W = 660, H = 440, NATIVE = 3.0, K = W / PX_W;          // K = 4.4
    var SCALES = [0.7, 1.5, 2.0, 3.0, 3.5];                    // 레이어5(먼 곳) → 레이어1(가까운 곳)
    // 불편한 상황 기준(스트레스)과 친밀도(유대감) → 선호 레이어. 테스트하며 조정할 값이라 이름 붙여 분리.
    var PC_UNCOMFORTABLE_STRESS = 70;
    var PC_PREF_SIGMA = 0.75;
    var c = null;                                              // 지금 그리는 캔버스 ctx(캐시 캔버스 포함)

    // ---------- 레이어 정의 ----------
    var HOME_LAYERS = [
      { base:238, a1:2, f1:0.011, p1:0.4, a2:1.5, f2:0.029, p2:1.2, color:"#C9A676", depth:0.18 },
      { base:276, a1:3, f1:0.009, p1:2.0, a2:1.5, f2:0.024, p2:0.3, color:"#D4B283", depth:0.36 },
      { base:316, a1:2, f1:0.012, p1:4.1, a2:1.5, f2:0.031, p2:2.6, color:"#DDBF91", depth:0.56 },
      { base:356, a1:3, f1:0.010, p1:1.1, a2:1.5, f2:0.027, p2:4.0, color:"#E6CB9E", depth:0.78 },
      { base:398, a1:2, f1:0.013, p1:3.3, a2:1.5, f2:0.035, p2:0.9, color:"#EED7AE", depth:1.00 }
    ];
    var FOREST_LAYERS = [
      { base:238, a1:10, f1:0.011, p1:0.4, a2:5, f2:0.029, p2:1.2, color:"#5E9A86", depth:0.18 },
      { base:276, a1:12, f1:0.009, p1:2.0, a2:6, f2:0.024, p2:0.3, color:"#6CAB78", depth:0.36 },
      { base:316, a1:9,  f1:0.012, p1:4.1, a2:5, f2:0.031, p2:2.6, color:"#83BC6C", depth:0.56 },
      { base:356, a1:11, f1:0.010, p1:1.1, a2:6, f2:0.027, p2:4.0, color:"#9BCB66", depth:0.78 },
      { base:398, a1:8,  f1:0.013, p1:3.3, a2:5, f2:0.035, p2:0.9, color:"#B4D873", depth:1.00 }
    ];
    var LAYERS = HOME_LAYERS;
    function edgeY(i, x){
      var L = LAYERS[i];
      return L.base + L.a1*Math.sin(x*L.f1 + L.p1) + L.a2*Math.sin(x*L.f2 + L.p2);
    }
    function feetY(i, x){
      var top = edgeY(i, x);
      if(i === LAYERS.length - 1) return top + 0.72 * (H + 12 - top);   // 레이어1: 발끝이 테두리에 살짝 걸릴 만큼
      return top + 0.5 * (edgeY(i + 1, x) - top);
    }

    // ---------- 종이 소품 도형 ----------
    function rrect(x, y, w, h, r){
      c.beginPath();
      c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    function noShadow(){ c.shadowColor = "transparent"; }
    function tree(x, y, w, h, col){
      c.fillStyle = col; c.beginPath(); c.moveTo(x - w*0.5, y);
      c.quadraticCurveTo(x - w*0.55, y - h*0.55, x, y - h); c.quadraticCurveTo(x + w*0.55, y - h*0.55, x + w*0.5, y);
      c.closePath(); c.fill();
    }
    function cloud(x, y, s){
      c.fillStyle = "#FFFFFF"; c.beginPath();
      c.arc(x, y, 14*s, Math.PI*0.5, Math.PI*1.5); c.arc(x+16*s, y-10*s, 16*s, Math.PI, Math.PI*2);
      c.arc(x+36*s, y-4*s, 12*s, Math.PI*1.2, Math.PI*2.5); c.closePath(); c.fill();
    }
    function tuft(x, y, s, col){
      c.fillStyle = col;
      for(var k = -2; k <= 2; k++){ c.beginPath(); c.ellipse(x + k*5*s, y - 9*s, 3*s, 11*s, k*0.35, 0, Math.PI*2); c.fill(); }
    }
    function bush(x, y, s){
      c.fillStyle = "#4F8F5A"; c.beginPath(); c.arc(x-12*s, y-8*s, 12*s, 0, 7); c.arc(x+4*s, y-14*s, 15*s, 0, 7); c.arc(x+20*s, y-7*s, 11*s, 0, 7); c.fill();
      c.fillStyle = "#E8577A";
      [[-14,-12],[0,-22],[10,-10],[22,-12],[-4,-6]].forEach(function(p){ c.beginPath(); c.arc(x+p[0]*s, y+p[1]*s, 3.2*s, 0, 7); c.fill(); });
    }
    function doghouse(x, y, s){
      c.fillStyle = "#C98A5A"; c.fillRect(x - 26*s, y - 38*s, 52*s, 38*s);
      c.fillStyle = "#9E5B3C"; c.beginPath(); c.moveTo(x - 34*s, y - 36*s); c.lineTo(x, y - 62*s); c.lineTo(x + 34*s, y - 36*s); c.closePath(); c.fill();
      c.fillStyle = "#4A3226"; c.beginPath(); c.moveTo(x - 11*s, y); c.lineTo(x - 11*s, y - 18*s); c.arc(x, y - 18*s, 11*s, Math.PI, 0); c.lineTo(x + 11*s, y); c.closePath(); c.fill();
    }
    function flowers(x, y, s){
      for(var k = 0; k < 4; k++){
        var fx = x + (k-1.5)*9*s, fy = y - (k%2 ? 14 : 20)*s;
        c.strokeStyle = "#3F7D48"; c.lineWidth = 1.6*s; c.beginPath(); c.moveTo(fx, y); c.lineTo(fx, fy); c.stroke();
        c.fillStyle = k%2 ? "#FFFFFF" : "#F6C85F"; c.beginPath(); c.arc(fx, fy, 3.6*s, 0, 7); c.fill();
      }
    }
    function bookshelf(x, base){
      var w = 92, h = 124, top = base - h;
      c.fillStyle = "#9E6B45"; rrect(x, top, w, h, 4); c.fill();
      c.save(); noShadow();
      c.fillStyle = "#7E5236";
      for(var r = 0; r < 3; r++) c.fillRect(x + 7, top + 10 + r*38, w - 14, 30);
      var cols = ["#E8577A","#F6C85F","#5E9A86","#FFFFFF","#9CD3E6","#83BC6C"];
      for(r = 0; r < 3; r++){
        var bx = x + 10;
        for(var k = 0; k < 6 && bx < x + w - 16; k++){
          var bw = 7 + ((k*5 + r*3) % 6), bh = 20 + ((k*7 + r) % 9);
          c.fillStyle = cols[(k + r*2) % cols.length];
          if(r === 1 && k === 4){ c.save(); c.translate(bx, top + 40 + r*38); c.rotate(-0.25); c.fillRect(0, -bh, bw, bh); c.restore(); }
          else c.fillRect(bx, top + 40 + r*38 - bh, bw, bh);
          bx += bw + 2;
        }
      }
      c.restore();
    }
    // 소파 — 85번 사용자 요청: 주황·짙은 노랑 계열(쿠션은 청록·분홍으로 대비)
    function sofa(cx, base){
      var w = 250, x = cx - w/2;
      c.fillStyle = "#E39A3B";
      rrect(x + 14, base - 96, w - 28, 70, 18); c.fill();
      rrect(x, base - 64, 40, 64, 14); c.fill();
      rrect(x + w - 40, base - 64, 40, 64, 14); c.fill();
      c.fillStyle = "#F0B75A"; rrect(x + 30, base - 44, w - 60, 40, 10); c.fill();
      c.fillStyle = "#5E9A86"; rrect(x + 46, base - 84, 44, 40, 12); c.fill();
      c.fillStyle = "#E8577A"; rrect(x + w - 92, base - 82, 42, 38, 12); c.fill();
    }
    function floorLamp(x, base){
      c.fillStyle = "#7E5236"; c.fillRect(x - 2, base - 150, 4, 150);
      c.fillStyle = "#FFF1C9";
      c.beginPath(); c.moveTo(x - 26, base - 128); c.lineTo(x - 16, base - 170); c.lineTo(x + 16, base - 170); c.lineTo(x + 26, base - 128); c.closePath(); c.fill();
    }
    function sideTable(x, base){
      c.fillStyle = "#9E6B45"; rrect(x - 30, base - 60, 60, 10, 4); c.fill();
      c.fillRect(x - 24, base - 52, 6, 52); c.fillRect(x + 18, base - 52, 6, 52);
      c.fillStyle = "#FFFFFF"; rrect(x - 8, base - 78, 16, 18, 3); c.fill();
      c.fillStyle = "#9CD3E6"; c.fillRect(x - 8, base - 70, 16, 4);
    }
    function tallPlant(x, base, s){
      c.fillStyle = "#C9785A"; rrect(x - 16*s, base - 34*s, 32*s, 34*s, 5*s); c.fill();
      [[-0.5,86],[0.1,100],[0.6,80],[-0.9,62],[1.0,58]].forEach(function(l, k){
        c.save(); c.translate(x, base - 30*s); c.rotate(l[0]);
        c.fillStyle = k % 2 ? "#4F8F5A" : "#6CAB78";
        c.beginPath(); c.ellipse(0, -l[1]*s/2, 10*s, l[1]*s/2, 0, 0, 7); c.fill();
        c.restore();
      });
    }
    function rug(cx, y){
      c.fillStyle = "#83BC6C"; c.beginPath(); c.ellipse(cx, y, 150, 24, 0, 0, 7); c.fill();
      c.save(); noShadow();
      c.fillStyle = "#9BCB66"; c.beginPath(); c.ellipse(cx, y, 120, 17, 0, 0, 7); c.fill();
      c.fillStyle = "#B4D873"; c.beginPath(); c.ellipse(cx, y, 84, 11, 0, 0, 7); c.fill();
      c.restore();
    }
    function dogBed(cx, y){
      c.fillStyle = "#E8577A"; c.beginPath(); c.ellipse(cx, y - 12, 58, 20, 0, 0, 7); c.fill();
      c.save(); noShadow(); c.fillStyle = "#F4B6C4"; c.beginPath(); c.ellipse(cx, y - 16, 42, 11, 0, 0, 7); c.fill(); c.restore();
    }
    function bowl(cx, y, s){
      c.fillStyle = "#9CD3E6";
      c.beginPath(); c.moveTo(cx - 22*s, y - 16*s); c.lineTo(cx + 22*s, y - 16*s); c.lineTo(cx + 16*s, y); c.lineTo(cx - 16*s, y); c.closePath(); c.fill();
      c.save(); noShadow(); c.fillStyle = "#C98A5A"; c.beginPath(); c.ellipse(cx, y - 16*s, 18*s, 4*s, 0, 0, 7); c.fill(); c.restore();
    }
    function ball(cx, y, s){
      c.fillStyle = "#F6C343"; c.beginPath(); c.arc(cx, y - 12*s, 12*s, 0, 7); c.fill();
      c.save(); noShadow(); c.strokeStyle = "#E8577A"; c.lineWidth = 3*s;
      c.beginPath(); c.arc(cx, y - 12*s, 12*s, -0.9, 0.9); c.stroke();
      c.beginPath(); c.arc(cx, y - 12*s, 12*s, Math.PI - 0.9, Math.PI + 0.9); c.stroke();
      c.restore();
    }
    function ropeToy(cx, y, s){
      c.fillStyle = "#FFFFFF"; rrect(cx - 26*s, y - 10*s, 52*s, 9*s, 4*s); c.fill();
      c.fillStyle = "#5E9A86"; c.beginPath(); c.arc(cx - 28*s, y - 6*s, 7*s, 0, 7); c.arc(cx + 28*s, y - 6*s, 7*s, 0, 7); c.fill();
    }
    function frontPot(cx, y, s, pink){
      c.fillStyle = "#C9785A"; rrect(cx - 24*s, y - 36*s, 48*s, 36*s, 6*s); c.fill();
      [-1.1,-0.6,-0.1,0.4,0.9].forEach(function(a, k){
        c.save(); c.translate(cx, y - 32*s); c.rotate(a);
        c.fillStyle = pink ? (k % 2 ? "#E8577A" : "#D94B6E") : (k % 2 ? "#4F8F5A" : "#6CAB78");
        c.beginPath(); c.ellipse(0, -30*s, 13*s, 30*s, 0, 0, 7); c.fill();
        c.restore();
      });
    }
    function frameArt(x, y){
      c.fillStyle = "#FFFFFF"; rrect(x, y, 86, 64, 4); c.fill();
      c.save(); noShadow(); c.beginPath(); c.rect(x + 7, y + 7, 72, 50); c.clip();
      c.fillStyle = "#9CD3E6"; c.fillRect(x + 7, y + 7, 72, 50);
      c.fillStyle = "#F6C343"; c.beginPath(); c.arc(x + 58, y + 30, 9, 0, 7); c.fill();
      c.fillStyle = "#6CAB78"; c.beginPath(); c.ellipse(x + 30, y + 60, 44, 20, 0, 0, 7); c.fill();
      c.fillStyle = "#9BCB66"; c.beginPath(); c.ellipse(x + 70, y + 62, 34, 14, 0, 0, 7); c.fill();
      c.restore();
    }
    function wallClock(cx, cy){
      c.fillStyle = "#FFFFFF"; c.beginPath(); c.arc(cx, cy, 24, 0, 7); c.fill();
      c.save(); noShadow();
      c.strokeStyle = "#5E9A86"; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, 22, 0, 7); c.stroke();
      // 게임 내 시각(행동 1회 = 1시간, 64번)을 가리킴 — 게임 시간은 "정각" 단위라 분침은 12시에 고정
      var hh = (state.time && typeof state.time.hour === "number") ? state.time.hour : 9, mm = 0;
      var hA = ((hh % 12) + mm/60) / 12 * Math.PI*2, mA = mm/60 * Math.PI*2;
      c.strokeStyle = "#3A3226"; c.lineCap = "round";
      c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(hA)*11, cy - Math.cos(hA)*11); c.stroke();
      c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(mA)*16, cy - Math.cos(mA)*16); c.stroke();
      c.restore();
    }

    // ---------- 꾸미기 소품(레이어별 자리) ----------
    // back = 종이 뒤에서 위로 솟음, 그 외 = 종이 앞면에 붙음. spot = 개가 가서 쓰는 자리(nose=코를 대는 행동).
    // price(뼈다귀)는 스케치 임시값 — 구매·저장은 아직 없고 지금은 전부 켜진 상태로 보여줌(다음 단계: 상점 연결).
    var HOME_DECOR = [
      { id:"bookshelf", name:"책장",          layer:0, price:0,  on:true, back:true, draw:function(){ bookshelf(528, edgeY(0,574) + 6); } },
      { id:"tallPlant", name:"키 큰 화분",    layer:0, price:15, on:true, back:true, draw:function(){ tallPlant(470, edgeY(0,470) + 6, 1.0); } },
      { id:"sofa",      name:"소파",          layer:1, price:0,  on:true, back:true, draw:function(){ sofa(238, edgeY(1,238) + 6); } },
      { id:"lamp",      name:"스탠드 조명",   layer:1, price:20, on:true, back:true, draw:function(){ floorLamp(398, edgeY(1,398) + 6); } },
      { id:"sideTable", name:"협탁과 머그",   layer:2, price:12, on:true, back:true, draw:function(){ sideTable(598, edgeY(2,598) + 6); } },
      { id:"rug",       name:"동그란 러그",   layer:2, price:0,  on:true, draw:function(){ rug(330, feetY(2,330) + 4); } },
      { id:"dogBed",    name:"강아지 방석",   layer:2, price:15, on:true, spot:{ x:200, kind:"lie" }, draw:function(){ dogBed(200, feetY(2,200) + 8); } },
      { id:"bowl",      name:"밥그릇",        layer:3, price:0,  on:true, spot:{ x:520, kind:"sniff", nose:true }, draw:function(){ bowl(520, feetY(3,520) + 10, 1.1); } },
      { id:"ball",      name:"공 장난감",     layer:3, price:5,  on:true, spot:{ x:236, kind:"play", nose:true }, draw:function(){ ball(236, feetY(3,236) + 10, 1.1); } },
      { id:"rope",      name:"로프 장난감",   layer:3, price:8,  on:true, spot:{ x:400, kind:"play", nose:true }, draw:function(){ ropeToy(400, feetY(3,400) + 12, 1.1); } },
      { id:"potGreen",  name:"앞 화분(초록)", layer:4, price:20, on:true, draw:function(){ frontPot(40, H - 12, 1.05, false); } },
      { id:"potPink",   name:"앞 화분(분홍)", layer:4, price:25, on:true, draw:function(){ frontPot(622, H - 12, 1.0, true); } },
      { id:"frameArt",  name:"벽 액자",       layer:-1, price:10, on:true },
      { id:"clock",     name:"벽시계",        layer:-1, price:12, on:true }
    ];
    var FOREST_DECOR = [
      { id:"farTrees", name:"숲 나무 줄", layer:0, price:0, on:true, back:true,
        draw:function(){ [70,120,180,470,530,590].forEach(function(x,k){ tree(x, edgeY(0,x)+6, 34+(k%2)*8, 70+(k%3)*14, k%2 ? "#3E7A68" : "#4B8874"); }); } },
      { id:"bigTrees", name:"큰 나무 두 그루", layer:1, price:30, on:true, back:true,
        draw:function(){ [40,610].forEach(function(x){ tree(x, edgeY(1,x)+6, 46, 108, "#3F8055"); }); } },
      { id:"tuftL4", name:"풀 무더기", layer:1, price:5, on:true, draw:function(){ tuft(260, feetY(1,260)+6, 0.9, "#4F9A5E"); } },
      { id:"doghouse", name:"개집", layer:2, price:0, on:true, spot:{ x:470, kind:"sit" }, draw:function(){ doghouse(505, feetY(2,505)+4, 1.0); } },
      { id:"tuftL3", name:"풀 무더기", layer:2, price:5, on:true, draw:function(){ tuft(150, feetY(2,150)+6, 1.1, "#5AA15F"); } },
      { id:"bush", name:"꽃덤불", layer:3, price:20, on:true, draw:function(){ bush(95, feetY(3,95)+10, 1.2); } },
      { id:"flowersL2", name:"들꽃 한 줌", layer:3, price:10, on:true, draw:function(){ flowers(420, feetY(3,420)+8, 1.3); } },
      { id:"grassL1", name:"앞 풀숲", layer:4, price:8, on:true, draw:function(){ tuft(40, H-18, 1.8, "#6FB45F"); tuft(560, H-14, 2.0, "#6FB45F"); } },
      { id:"flowersL1", name:"앞 들꽃", layer:4, price:10, on:true, draw:function(){ flowers(612, H-20, 1.8); } }
    ];
    var DECOR = HOME_DECOR;
    function decorOn(id){ for(var i = 0; i < DECOR.length; i++) if(DECOR[i].id === id) return DECOR[i].on; return false; }

    // ---------- 배경 ----------
    function homeBackdrop(){
      c.fillStyle = "#E3E9D3"; c.fillRect(-40, -10, W + 80, H + 20);
      c.fillStyle = "#DCE4CB";
      for(var x = -40; x < W + 40; x += 34) c.fillRect(x, -10, 14, H + 20);
      c.save();
      c.shadowColor = "rgba(40,34,20,0.18)"; c.shadowBlur = 10; c.shadowOffsetY = 3;
      var wx = 92, wy = 44, ww = 196, wh = 150;
      c.fillStyle = "#FFFFFF"; rrect(wx - 10, wy - 10, ww + 20, wh + 20, 10); c.fill();
      c.save(); noShadow();
      c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
      var g = c.createLinearGradient(0, wy, 0, wy + wh);
      g.addColorStop(0, "#9CD3E6"); g.addColorStop(0.6, "#E6EFD8"); g.addColorStop(1, "#F4E6C4");
      c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
      c.fillStyle = "#F6C343"; c.beginPath(); c.arc(wx + 140, wy + 112, 30, 0, 7); c.fill();
      cloud(wx + 22, wy + 38, 0.8); cloud(wx + 118, wy + 30, 0.6);
      c.fillStyle = "#5E9A86"; c.beginPath(); c.moveTo(wx, wy + wh);
      for(var t = 0; t <= ww; t += 6) c.lineTo(wx + t, wy + wh - 22 - 8*Math.sin(t*0.05) - 5*Math.sin(t*0.13 + 1));
      c.lineTo(wx + ww, wy + wh); c.closePath(); c.fill();
      [20, 44, 150, 176].forEach(function(t, k){ tree(wx + t, wy + wh - 18, 16, 40 + (k%2)*10, "#4B8874"); });
      c.restore();
      c.save(); noShadow(); c.fillStyle = "#FFFFFF";
      c.fillRect(wx + ww/2 - 4, wy, 8, wh); c.fillRect(wx, wy + wh/2 - 4, ww, 8); c.restore();
      c.fillStyle = "#9BCB66";
      c.beginPath(); c.moveTo(wx - 26, wy - 18); c.lineTo(wx + 22, wy - 18);
      c.quadraticCurveTo(wx + 2, wy + 80, wx + 16, wy + wh + 30); c.lineTo(wx - 26, wy + wh + 30); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(wx + ww + 26, wy - 18); c.lineTo(wx + ww - 22, wy - 18);
      c.quadraticCurveTo(wx + ww - 2, wy + 80, wx + ww - 16, wy + wh + 30); c.lineTo(wx + ww + 26, wy + wh + 30); c.closePath(); c.fill();
      c.fillStyle = "#83BC6C"; c.fillRect(wx - 34, wy - 26, ww + 68, 10);
      if(decorOn("frameArt")) frameArt(400, 66);
      if(decorOn("clock")) wallClock(344, 70);
      c.restore();
    }
    function forestBackdrop(){
      var g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#9CD3E6"); g.addColorStop(0.55, "#E6EFD8"); g.addColorStop(1, "#F4E6C4");
      c.fillStyle = g; c.fillRect(-40, -10, W + 80, H + 20);
      c.save(); c.shadowColor = "rgba(40,34,20,0.18)"; c.shadowBlur = 10; c.shadowOffsetY = 3;
      c.fillStyle = "#F6C343"; c.beginPath(); c.arc(330, 236, 58, 0, 7); c.fill();
      cloud(90, 70, 1.3); cloud(420, 58, 1.0); cloud(540, 110, 1.4); cloud(250, 130, 0.8);
      c.restore();
    }
    function paper(i){
      c.save();
      c.shadowColor = "rgba(40,34,20,0.28)"; c.shadowBlur = 14; c.shadowOffsetY = -3;
      c.fillStyle = LAYERS[i].color; c.beginPath(); c.moveTo(-40, H + 20);
      for(var x = -40; x <= W + 40; x += 6) c.lineTo(x, edgeY(i, x));
      c.lineTo(W + 40, H + 20); c.closePath(); c.fill();
      c.restore();
    }
    function frame(){
      c.save();
      c.shadowColor = "rgba(40,34,20,0.35)"; c.shadowBlur = 16;
      c.fillStyle = "#F4EEE2"; c.beginPath(); c.rect(-10, -10, W + 20, H + 20);
      var m = 12, r = 42;
      c.moveTo(m + r, m);
      c.arcTo(m, m, m, m + r, r); c.arcTo(m, H - m, m + r, H - m, r);
      c.arcTo(W - m, H - m, W - m, H - m - r, r); c.arcTo(W - m, m, W - m - r, m, r);
      c.closePath(); c.fill("evenodd");
      c.restore();
    }

    // ---------- 캐시(정적인 종이 장면은 미리 그려두고 매 프레임엔 붙이기만) ----------
    // 시차(패럴랙스)로 좌우로 밀릴 여유(PAD)를 두고 그림. 시계 바늘 때문에 배경은 1분마다 새로 그림.
    var PAD = 40;
    var cache = { key:"", scale:0, backdrop:null, layers:[], frame:null };
    function mkCanvas(wl, hl, sc){
      var cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(wl * sc)); cv.height = Math.max(1, Math.round(hl * sc));
      return cv;
    }
    function withCtx(cv, sc, ox, fn){
      c = cv.getContext("2d");
      c.setTransform(sc, 0, 0, sc, ox * sc, 0);
      fn();
      c.setTransform(1, 0, 0, 1, 0, 0);
    }
    function rebuildCache(sc, minuteKey){
      var home = LAYERS === HOME_LAYERS;
      cache.backdrop = mkCanvas(W + PAD*2, H, sc);
      withCtx(cache.backdrop, sc, PAD, function(){ (home ? homeBackdrop : forestBackdrop)(); });
      cache.layers = [];
      for(var i = 0; i < LAYERS.length; i++){
        var cv = mkCanvas(W + PAD*2, H, sc);
        (function(li){
          withCtx(cv, sc, PAD, function(){
            c.save(); c.shadowColor = "rgba(40,34,20,0.2)"; c.shadowBlur = 8;
            DECOR.forEach(function(d){ if(d.on && d.back && d.layer === li) d.draw(); });
            c.restore();
            paper(li);
            c.save(); c.shadowColor = "rgba(40,34,20,0.22)"; c.shadowBlur = 6; c.shadowOffsetY = 2;
            DECOR.forEach(function(d){ if(d.on && !d.back && d.layer === li && d.draw) d.draw(); });
            c.restore();
          });
        })(i);
        cache.layers.push(cv);
      }
      cache.frame = mkCanvas(W, H, sc);
      withCtx(cache.frame, sc, 0, frame);
      cache.scale = sc; cache.key = minuteKey;
    }

    // ---------- 개 ----------
    var dog = { layer:3, slot:3, x:330, face:-1, mode:"idle", t:0, dur:2000, kind:"tail", target:3,
                hop:null, walkTo:330, scareLayer:0, fleeing:false, justFled:false, afterWalk:null };
    function layerScale(i){ return SCALES[i]; }
    function uncomfortable(){
      var L = state.life || {};
      return (L.stress || 0) >= PC_UNCOMFORTABLE_STRESS || moodOf() === "sad";
    }
    function pickLayer(){
      if(dog.fleeing) return dog.scareLayer;
      var bond = (state.life && typeof state.life.bond === "number") ? state.life.bond : 50;
      var pref = 0.5 + 2.5 * bond / 100, ws = [], sum = 0, i;
      for(i = 0; i < 5; i++){ var w = Math.exp(-Math.pow(i - pref, 2) / (2*PC_PREF_SIGMA*PC_PREF_SIGMA)); ws.push(w); sum += w; }
      var r = Math.random() * sum;
      for(i = 0; i < 5; i++){ r -= ws[i]; if(r <= 0) return i; }
      return 4;
    }
    // 개 본체 크기(레이어2 x3 기준, 660 좌표): 웰시코기 성견 = 원본 시트 서기 높이(193px, 1:1). 다른 견종은
    // 실제 체고 비율을 그대로 쓰면 대형견이 레이어2에서 이미 화면을 꽉 채워서(골든 ≈ 코기의 1.9배), 견종 간
    // 차이는 제곱근으로 누그러뜨림(골든 ≈ 1.37배 — 스케치에서 확인한 "대형견 가정 1.35배"와 같은 수준).
    // 성장 단계 차이(털뭉치 x0.7 등)는 누그러뜨리지 않고 그대로 곱함. 테스트하며 조정할 값(PC_BREED_SIZE_EXP).
    var PC_BREED_SIZE_EXP = 0.5;
    function yardTargetH(breedId, stageScale){
      var sc = BREED_PXSCALE[breedId] || BREED_PXSCALE.golden;
      return Math.max(6, Math.round(sc.heightCm / CM_PER_PX * stageScale * breedSizeScale() * YARD_DOG_SIZE_MULT)) * 1.18;
    }
    function dogBase(){
      var breedId = state.breed || "golden";
      if(breedId === "mix" && state.mixGeoBreed) breedId = state.mixGeoBreed;
      var gv = growthVisual().scale;
      var ref = yardTargetH("corgi", 1) / (breedSizeScale() || 1);                 // 푸들 크기 배율이 기준에 섞이지 않게
      var breedFactor = Math.pow(yardTargetH(breedId, 1) / ref, PC_BREED_SIZE_EXP);
      return { targetH: yardTargetH(breedId, gv),                                  // 150×100 정지 그림 속 실제 높이
               sceneH: (typeof DOG_ANIM_HI_REF_H === "number" ? DOG_ANIM_HI_REF_H : 193) * breedFactor * gv };
    }
    function animSheet(){
      if(state.breed === "mix" || !state.coatId) return null;
      var st = (typeof state.growthStage === "number") ? state.growthStage : 2;
      return getDogAnimSheetHi(state.breed, st, state.coatId);
    }
    // 시트가 있을 때: 원본 1:1(x3)을 기준으로 한 배율. 없을 때: 150×100 절차적/정지 스프라이트를 4.4배 기준으로.
    function dogPixelScale(layerS){
      var b = dogBase();
      if(animSheet()){
        var s = b.sceneH / DOG_ANIM_HI_REF_H;
        var si = Math.round(s);
        if(si >= 1 && Math.abs(s - si) < 0.15) s = si;                           // 레이어2에서 원본 1:1로 딱 맞춤
        return s * layerS / NATIVE;
      }
      return b.sceneH / b.targetH * layerS / NATIVE;                               // 150×100 정지 그림 1px당 660 좌표
    }
    function startHop(to, fast){
      var from = dog.layer, sA = layerScale(from), sB = layerScale(to);
      var dir = Math.random() < 0.5 ? -1 : 1;
      var x1 = Math.max(90, Math.min(W - 90, dog.x + dir*(30 + Math.random()*40)));
      dog.face = x1 > dog.x ? 1 : -1;
      var front = Math.max(from, to), xm = (dog.x + x1) / 2;
      var yA = feetY(from, dog.x), yB = feetY(to, x1), mid = (yA + yB) / 2;
      var avgH = dogBase().sceneH / NATIVE * (sA + sB) / 2;
      var arc = Math.max(mid - (edgeY(front, xm) - 8), avgH * 0.28);
      dog.mode = "hop";
      dog.hop = { from:from, to:to, x0:dog.x, x1:x1, yA:yA, yB:yB, sA:sA, sB:sB, arc:arc, t:0, dur: fast ? 420 : 640 };
    }
    function stepToward(tgt, fast){ startHop(tgt > dog.layer ? dog.layer + 1 : dog.layer - 1, fast); }
    function decideNext(){
      // 불편한 상황이 새로 시작되면 레이어5·4 중 하나(반반)로 빠르게 피함
      var unc = uncomfortable();
      if(unc && !dog.fleeing){ dog.fleeing = true; dog.scareLayer = Math.random() < 0.5 ? 0 : 1; }
      if(!unc) dog.fleeing = false;
      var tgt = dog.target = pickLayer();
      if(tgt !== dog.layer){ stepToward(tgt, dog.fleeing); return; }
      var spots = dog.fleeing ? [] : DECOR.filter(function(d){ return d.on && d.spot && d.layer === dog.layer; });
      if(spots.length && Math.random() < 0.4){
        var sp = spots[Math.floor(Math.random() * spots.length)];
        var dir = dog.x <= sp.spot.x ? 1 : -1;
        var kk = dogPixelScale(layerScale(dog.layer));
        var noseOff = sp.spot.nose ? (animSheet() ? 0.36 * DOG_ANIM_HI_CELL_W * kk : 16 * kk) : 0;
        dog.mode = "walk"; dog.walkTo = sp.spot.x - dir * noseOff; dog.afterWalk = sp.spot.kind; dog.face = dir;
        return;
      }
      var sleepy = moodOf() === "sleepy";
      if(Math.random() < (sleepy ? 0.2 : 0.55)){
        dog.mode = "walk";
        var margin = dog.layer === 4 ? 40 : 90;
        dog.walkTo = margin + Math.random() * (W - 2*margin);
        dog.face = dog.walkTo > dog.x ? 1 : -1;
      } else startIdle();
    }
    function startIdle(){
      dog.mode = "idle"; dog.t = 0;
      var tm = growthVisual().timeMult || 1;
      if(dog.afterWalk){
        dog.kind = dog.afterWalk; dog.afterWalk = null;
        dog.dur = (dog.kind === "lie" ? 5000 + Math.random()*3000 : 2400 + Math.random()*1600) * tm;
        return;
      }
      var near = dog.layer >= 3, far = dog.layer <= 1;
      var opts = dog.layer === 4 ? ["sit","sit","tail","stand"] : near ? ["sit","tail","tail","stand"] :
                 far ? ["sniff","lie","stand","tail"] : ["tail","stand","sniff","sit"];
      if(moodOf() === "sleepy") opts = ["lie","lie","sit"];
      if(dog.fleeing) opts = dog.justFled ? ["shake"] : ["lie","stand","sniff"];
      dog.justFled = false;
      dog.kind = opts[Math.floor(Math.random() * opts.length)];
      dog.dur = (dog.kind === "shake" ? 900 : 1800 + Math.random()*2600) * tm;
    }
    function frameFor(now){
      if(dog.mode === "hop") return 11;
      if(dog.mode === "walk") return 6 + Math.floor(now/140) % 4;
      switch(dog.kind){
        case "sit": return 5;
        case "tail": return Math.floor(now/260) % 2 ? 3 : 4;
        case "sniff": return 10;
        case "lie": return Math.floor(now/900) % 2 ? 13 : 12;
        case "shake": return 20;
        case "play": return Math.floor(now/700) % 3 === 2 ? 22 : 21;
        default: return (now % 3200 < 160) ? 2 : 0;
      }
    }
    function update(dt){
      if(dog.mode === "idle"){
        dog.t += dt; if(dog.t >= dog.dur) decideNext();
        else if(uncomfortable() && !dog.fleeing) decideNext();       // 불편해지면 하던 걸 멈추고 바로 피함
      } else if(dog.mode === "walk"){
        var sp = 0.04 * layerScale(dog.layer) * dt;
        if(Math.abs(dog.walkTo - dog.x) <= sp){ dog.x = dog.walkTo; startIdle(); }
        else dog.x += sp * (dog.walkTo > dog.x ? 1 : -1);
      } else if(dog.mode === "hop"){
        var h = dog.hop; h.t += dt;
        var p = Math.min(1, h.t / h.dur);
        dog.x = h.x0 + (h.x1 - h.x0) * p;
        dog.slot = p < 0.5 ? h.from : h.to;
        if(p >= 1){
          dog.layer = dog.slot = h.to; dog.hop = null;
          if(dog.layer !== dog.target) stepToward(dog.target, dog.fleeing);
          else { if(dog.fleeing) dog.justFled = true; startIdle(); }
        }
      }
    }

    // 시트가 없는 개(다른 견종·성장 단계·믹스견): 기존 150×100 마당 렌더러(drawPixelDog, 80~81번 정지
    // 스프라이트 또는 절차적 드로잉)로 오프스크린에 한 장 그린 뒤 배율을 곱해 붙임 — 원래 오른쪽을 봄.
    var dogOff = null;
    function staticDogCanvas(eyesClosed){
      if(!dogOff){ dogOff = document.createElement("canvas"); dogOff.width = PX_W; dogOff.height = PX_H; }
      var octx = dogOff.getContext("2d");
      octx.clearRect(0, 0, PX_W, PX_H);
      drawPixelDog(octx, PX_H - 4, 0, eyesClosed, null, YARD_DOG_SIZE_MULT);
      return dogOff;
    }

    var px = 0, pxTarget = 0;
    function layerOffset(i){ return -px * 16 * LAYERS[i].depth; }
    function dogPose(){
      if(dog.mode === "hop"){
        var h = dog.hop, p = Math.min(1, h.t / h.dur);
        return { x:dog.x, y:h.yA + (h.yB - h.yA)*p - h.arc*4*p*(1-p), s:h.sA + (h.sB - h.sA)*p,
                 off:layerOffset(h.from) + (layerOffset(h.to) - layerOffset(h.from))*p, air:4*p*(1-p), ground:h.yA + (h.yB - h.yA)*p };
      }
      var y = feetY(dog.layer, dog.x);
      return { x:dog.x, y:y, s:layerScale(dog.layer), off:layerOffset(dog.layer), air:0, ground:y };
    }
    function drawDog(g, now){
      var P = dogPose(), k = dogPixelScale(P.s);
      var sheet = animSheet();
      g.save();
      g.translate(P.off, 0);
      var shW = (sheet ? 70 : 16) * k, shH = (sheet ? 11 : 2.5) * k;   // 종이 위 그림자(점프 중엔 작고 옅어짐)
      g.fillStyle = "rgba(40,34,20," + (0.22 * (1 - 0.6*P.air)).toFixed(3) + ")";
      g.beginPath(); g.ellipse(P.x, P.ground - 2, Math.max(8, shW * (1 - 0.4*P.air)), Math.max(3, shH), 0, 0, 7); g.fill();
      g.shadowColor = "rgba(40,34,20,0.30)"; g.shadowBlur = 8*k + 2; g.shadowOffsetY = 3*k;
      g.imageSmoothingEnabled = k < 0.999;
      g.translate(P.x, 0);
      if(sheet){
        var f = frameFor(now), sx = (f % DOG_ANIM_COLS) * DOG_ANIM_HI_CELL_W, sy = Math.floor(f / DOG_ANIM_COLS) * DOG_ANIM_HI_CELL_H;
        var dw = DOG_ANIM_HI_CELL_W * k, dh = DOG_ANIM_HI_CELL_H * k;
        if(dog.face > 0) g.scale(-1, 1);                          // 시트는 왼쪽을 봄
        g.drawImage(sheet, sx, sy, DOG_ANIM_HI_CELL_W, DOG_ANIM_HI_CELL_H, -dw/2, P.y - dh, dw, dh);
      } else {
        var closed = dog.mode === "idle" && dog.kind === "lie";
        var bob = dog.mode === "walk" ? Math.round(Math.abs(Math.sin(now/140)) * 1.5) : 0;   // 걷는 느낌만 살짝
        var off = staticDogCanvas(closed);
        if(dog.face < 0) g.scale(-1, 1);                          // 기존 마당 개는 오른쪽을 봄
        var cxL = Math.round(PX_W/2) + 2;
        g.drawImage(off, 0, 0, PX_W, PX_H, -cxL * k, P.y - (PX_H - 4) * k - bob * k, PX_W * k, PX_H * k);
      }
      g.restore();
    }

    // ---------- 루프 ----------
    var raf = 0, last = 0, running = false, lastRectW = 0;
    function canvasEl(){ return el && el.pixelDogHiCanvas; }
    function visible(cv){ return cv && cv.offsetParent !== null && cv.clientWidth > 0; }
    function render(now){
      var cv = canvasEl();
      if(!visible(cv)) return;
      var dpr = Math.min(3, window.devicePixelRatio || 1);
      var wpx = Math.round(cv.clientWidth * dpr), hpx = Math.round(cv.clientHeight * dpr);
      if(cv.width !== wpx || cv.height !== hpx){ cv.width = wpx; cv.height = hpx; }
      var sc = cv.width / W;
      var hourNow = (state.time && typeof state.time.hour === "number") ? state.time.hour : 0;
      var minuteKey = (LAYERS === HOME_LAYERS ? "h" : "f") + ":" + hourNow + ":" + DECOR.map(function(x){ return x.on ? 1 : 0; }).join("");
      if(cache.scale !== sc || cache.key !== minuteKey) rebuildCache(sc, minuteKey);
      var g = cv.getContext("2d");
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, cv.width, cv.height);
      g.drawImage(cache.backdrop, Math.round((-PAD - px*3) * sc), 0);
      for(var i = 0; i < LAYERS.length; i++){
        g.drawImage(cache.layers[i], Math.round((-PAD + layerOffset(i)) * sc), 0);
        if(dog.slot === i){ g.setTransform(sc, 0, 0, sc, 0, 0); drawDog(g, now); g.setTransform(1, 0, 0, 1, 0, 0); }
      }
      g.drawImage(cache.frame, 0, 0);
    }
    function loop(now){
      raf = 0;
      if(!papercutYardActive()){ running = false; var cv = canvasEl(); if(cv){ var gg = cv.getContext("2d"); gg.setTransform(1,0,0,1,0,0); gg.clearRect(0,0,cv.width,cv.height); } return; }
      var dt = last ? Math.min(60, now - last) : 16; last = now;
      if(!reduceMotion()){
        px += (pxTarget - px) * 0.08;
        update(dt);
      }
      render(now);
      if(reduceMotion()){ running = false; return; }
      raf = window.requestAnimationFrame(loop);
    }
    function kick(){
      if(!papercutYardActive()) return;
      if(el.pixelCanvas && el.pixelCanvas.getContext){ el.pixelCanvas.getContext("2d").clearRect(0, 0, PX_W, PX_H); }
      if(!running){ running = true; last = 0; raf = window.requestAnimationFrame(loop); }
      else if(reduceMotion()) render(performance.now());
    }

    // 시차(패럴랙스): 마당 위에서 마우스/손가락 위치에 따라 레이어별로 다른 폭으로 살짝 움직임
    if(el && el.yard){
      el.yard.addEventListener("pointermove", function(e){
        var r = el.yard.getBoundingClientRect();
        if(r.width > 0) pxTarget = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      }, { passive:true });
      el.yard.addEventListener("pointerleave", function(){ pxTarget = 0; }, { passive:true });
    }

    PC = {
      kick: kick,
      // 테스트·향후 이벤트용(예: 큰 소리 이벤트로 놀람) — 지금은 게임 로직에서 호출하지 않음
      scare: function(){ dog.fleeing = true; dog.scareLayer = Math.random() < 0.5 ? 0 : 1; if(dog.mode !== "hop") decideNext(); },
      setSet: function(name){ var home = name !== "forest"; LAYERS = home ? HOME_LAYERS : FOREST_LAYERS; DECOR = home ? HOME_DECOR : FOREST_DECOR; cache.key = ""; },
      decor: function(){ return DECOR; },
      dog: dog
    };
    startIdle();
    drawPixelScene();
  })();
