  var TIP_CATALOG = [
    { id:"TIP-001", cat:"상식", text:"강아지는 사람보다 최대 10만 배 더 예민한 후각을 가지고 있어요." },
    { id:"TIP-002", cat:"상식", text:"강아지의 코 무늬는 사람의 지문처럼 한 마리 한 마리 모두 달라요." },
    { id:"TIP-003", cat:"상식", text:"강아지도 사람처럼 꿈을 꾼다고 해요 — 자면서 다리를 움찔거리는 것도 그래서일지도?" },
    { id:"TIP-004", cat:"상식", text:"매년 3월 23일은 국제 강아지의 날(National Puppy Day)이에요." },
    { id:"TIP-005", cat:"상식", text:"매년 8월 26일은 세계 개의 날(National Dog Day)이에요." },
    { id:"TIP-006", cat:"상식", text:"매년 12월 2일은 세계 믹스견의 날(National Mutt Day) — 시고르자브 같은 친구들을 위한 날이에요!" },
    { id:"TIP-007", cat:"상식", text:"강아지는 표정과 몸짓만으로도 사람 못지않게 다양한 감정을 표현한다고 해요." },
    { id:"TIP-008", cat:"상식", text:"강아지 발바닥에서 고소한 팝콘 냄새가 난다는 이야기, 들어보셨나요?" },
    { id:"TIP-009", cat:"건강정보", text:"초콜릿은 강아지에게 독성이 있어요 — 아무리 좋아해도 절대 나눠주면 안 돼요." },
    { id:"TIP-010", cat:"건강정보", text:"성견의 영구치는 총 42개예요, 사람(32개)보다 훨씬 많답니다." },
    { id:"TIP-011", cat:"건강정보", text:"강아지도 정기적인 건강검진과 예방접종이 꼭 필요해요." },
    { id:"TIP-012", cat:"건강정보", text:"여름철 산책은 너무 뜨거운 아스팔트를 피해서, 이른 아침이나 저녁에!" },
    { id:"TIP-013", cat:"건강정보", text:"체중 관리는 관절 건강과 직결돼요 — 간식은 적당히!" },
    { id:"TIP-014", cat:"건강정보", text:"심장사상충은 한 번 걸리면 치료가 어려운 만큼, 예방이 최선이에요." },
    { id:"TIP-015", cat:"건강정보", text:"발톱이 너무 길면 걸음걸이에 무리가 갈 수 있어요, 주기적으로 정리해주세요." },
    { id:"TIP-016", cat:"건강정보", text:"스트레스를 받으면 식욕부진이나 과도한 그루밍으로 나타날 수 있어요." },
    { id:"TIP-017", cat:"세계관", text:"오늘 하루도, 이 아이에게는 소중한 하루예요." },
    { id:"TIP-018", cat:"세계관", text:"짧은 다리로도, 이 아이는 최선을 다해 오늘을 걸었어요." },
    { id:"TIP-019", cat:"세계관", text:"함께 걷는 이 시간이, 언젠가는 그리운 기억이 될지도 몰라요." },
    { id:"TIP-020", cat:"세계관", text:"말은 통하지 않아도, 마음은 늘 전해지고 있어요." },
    { id:"TIP-021", cat:"세계관", text:"오늘도 이 아이의 세상은, 당신으로 가득해요." },
    { id:"TIP-022", cat:"세계관", text:"매일이 새로운 산책이듯, 매일이 새로운 하루예요." },
    { id:"TIP-023", cat:"세계관", text:"함께한 시간은, 숫자로는 다 담을 수 없어요." },
    { id:"TIP-024", cat:"세계관", text:"지금 이 순간을, 이 아이도 온 마음으로 함께하고 있어요." },
    { id:"TIP-025", cat:"힌트", text:"소통버튼을 꾸준히 눌러주다 보면... 언젠가 예상 못한 능력이 생길지도?" },
    { id:"TIP-026", cat:"힌트", text:"산책 중 아주 가끔, 정말 특별한 걸 발견할 때가 있대요." },
    { id:"TIP-027", cat:"힌트", text:"애착바구니 속 아이템들은 그냥 모으기만 해도 도움이 된다는 소문이 있어요." },
    { id:"TIP-028", cat:"힌트", text:"어떤 재료 두 개를 같이 모으면... 특별한 게 완성된다는 이야기가 있어요." },
    { id:"TIP-029", cat:"힌트", text:"매일 산책을 거르지 않으면, 몸도 마음도 무럭무럭 자란대요." },
    { id:"TIP-030", cat:"힌트", text:"견종마다 감춰진 성격이 있다는 거, 알고 계셨나요?" },
    { id:"TIP-031", cat:"힌트", text:"가끔은 그냥 가만히 지켜보는 것만으로도 충분할 때가 있어요." },
    { id:"TIP-032", cat:"힌트", text:"무지개색으로 빛나는 무언가를 만난다면... 놓치지 마세요." },
    { id:"TIP-033", cat:"유머", text:"골든리트리버 한 마리가 한 번에 입에 문 테니스공 개수, 기네스 기록은 무려 6개!" },
    { id:"TIP-034", cat:"유머", text:"웰시코기가 1km를 걸어가는 동안 찍히는 발자국의 수는 약 7,700개랍니다!" },
    { id:"TIP-035", cat:"유머", text:"강아지가 하품하면 옆에 있는 강아지도 따라 하품한다는 사실, 알고 계셨나요?" },
    { id:"TIP-036", cat:"유머", text:"포메라니안은 몸무게는 가벼운데 목소리는 절대 안 가벼워요." },
    { id:"TIP-037", cat:"유머", text:"진돗개에게 '손'을 가르치는 데 걸리는 시간은... 견주의 인내심에 달려있대요." },
    { id:"TIP-038", cat:"유머", text:"시바견의 표정을 보고 있으면, 가끔 얘가 나를 평가하는 것 같은 기분이 들어요." },
    { id:"TIP-039", cat:"유머", text:"허스키는 짖는 대신 대화하듯 '우우우' 소리를 낸다는 거, 아시나요?" },
    { id:"TIP-040", cat:"유머", text:"래브라도는 밥그릇 소리만 들려도 이미 앞발을 들고 대기 중이라는 소문이 있어요." },
    // 56번: [개꿀팁 리스트 v2.xlsx]로 기획팀이 40개를 추가 전달(TIP-041~080, 카테고리별 정확히 8개씩) —
    // 기존 TIP-001~040은 ID·문구 전부 그대로였고(대조 완료), 이 40개만 신규.
    { id:"TIP-041", cat:"상식", text:"매년 10월 1일은 세계 검은 개의 날(National Black Dog Day)이에요 — 검은 개는 입양이 더 어렵다는 통념을 깨기 위해 만들어졌대요." },
    { id:"TIP-042", cat:"상식", text:"매년 10월 4일은 세계 동물의 날(World Animal Day)이에요." },
    { id:"TIP-043", cat:"상식", text:"강아지는 사람보다 색을 적게 구분하지만, 어두운 곳에서는 사람보다 훨씬 잘 본대요." },
    { id:"TIP-044", cat:"상식", text:"강아지가 잠들기 전 제자리를 빙글빙글 도는 건, 야생 시절 잠자리를 다지던 습성의 흔적이라는 이야기가 있어요." },
    { id:"TIP-045", cat:"상식", text:"강아지의 청력은 사람보다 훨씬 예민해서, 더 멀리 더 높은 소리까지 들을 수 있대요." },
    { id:"TIP-046", cat:"상식", text:"강아지 수염은 장식이 아니라, 주변 공기의 흐름을 감지하는 진짜 감각기관이에요." },
    { id:"TIP-047", cat:"상식", text:"강아지가 하늘을 보고 배를 뒤집는 건, 온전히 마음을 놓았다는 신호래요." },
    { id:"TIP-048", cat:"상식", text:"강아지의 평균 체온은 사람보다 조금 높은 38~39도 정도예요." },
    { id:"TIP-049", cat:"건강정보", text:"포도와 건포도도 강아지에게는 위험한 음식이에요 — 소량이라도 조심하세요." },
    { id:"TIP-050", cat:"건강정보", text:"정기적인 양치질은 강아지 치석·잇몸병 예방에 큰 도움이 돼요." },
    { id:"TIP-051", cat:"건강정보", text:"귀가 늘어진 견종은 귓속 습기가 잘 안 마를 수 있어요, 주기적인 귀 청소가 중요해요." },
    { id:"TIP-052", cat:"건강정보", text:"중성화 수술은 일부 질병 예방과 행동 안정에 도움이 될 수 있어요." },
    { id:"TIP-053", cat:"건강정보", text:"나이가 들수록 정기검진 주기를 더 짧게 잡는 게 좋아요." },
    { id:"TIP-054", cat:"건강정보", text:"강아지에게는 사람이 먹는 짠 음식이 부담될 수 있어요." },
    { id:"TIP-055", cat:"건강정보", text:"갑작스러운 식욕 변화나 무기력함은 병원 방문이 필요하다는 신호일 수 있어요." },
    { id:"TIP-056", cat:"건강정보", text:"이중모 견종은 억지로 밀지 않는 게 오히려 피부 건강에 좋다고 해요." },
    { id:"TIP-057", cat:"세계관", text:"이 아이의 하루는, 당신이 곁에 있어서 완성돼요." },
    { id:"TIP-058", cat:"세계관", text:"오늘도 뭔가 하나쯤은, 이 아이 덕분에 웃으셨을 거예요." },
    { id:"TIP-059", cat:"세계관", text:"짧은 산책도, 이 아이에게는 커다란 모험이었을지 몰라요." },
    { id:"TIP-060", cat:"세계관", text:"말없이 곁을 지키는 것도, 사랑의 한 방식이에요." },
    { id:"TIP-061", cat:"세계관", text:"이 아이가 기억하는 건 아마, 당신의 목소리와 냄새일 거예요." },
    { id:"TIP-062", cat:"세계관", text:"오늘 하루도 무사히, 함께 지나갔어요." },
    { id:"TIP-063", cat:"세계관", text:"서툰 하루여도 괜찮아요, 함께였으니까요." },
    { id:"TIP-064", cat:"세계관", text:"이 아이에게 내일은, 오늘보다 더 좋은 날일 거예요." },
    { id:"TIP-065", cat:"힌트", text:"성장 단계가 바뀌는 날엔, 뭔가 특별한 안내가 뜬대요." },
    { id:"TIP-066", cat:"힌트", text:"며칠 산책을 안 하면, 이 아이도 표정이 조금 달라질지도 몰라요." },
    { id:"TIP-067", cat:"힌트", text:"밤에 산책하면 낮과는 다른 이야기를 만날 수도 있대요." },
    { id:"TIP-068", cat:"힌트", text:"어떤 이야기는 정말 아주 가끔씩만 펼쳐진다고 해요." },
    { id:"TIP-069", cat:"힌트", text:"이 아이의 성격에 따라, 마음을 표현하는 빈도가 다르대요." },
    { id:"TIP-070", cat:"힌트", text:"애착바구니를 가끔 열어보면, 몰랐던 변화를 발견할 수도 있어요." },
    { id:"TIP-071", cat:"힌트", text:"나이가 들어도, 표현하는 방법은 오히려 더 능숙해진대요." },
    { id:"TIP-072", cat:"힌트", text:"임시보호가 끝나는 날, 이 아이는 뭔가를 남기고 간대요." },
    { id:"TIP-073", cat:"유머", text:"시츄는 웬만한 소란에도 눈 하나 깜짝 안 하는, 반려견계의 프로 무표정러래요." },
    { id:"TIP-074", cat:"유머", text:"보더콜리에게 \"기다려\"를 가르치면, 오히려 계획을 다 세우고 있을지도 몰라요." },
    { id:"TIP-075", cat:"유머", text:"시고르자브는 서류상 견종이 없지만, 매력만큼은 어느 순종에도 안 뒤진대요." },
    { id:"TIP-076", cat:"유머", text:"강아지의 산책 속도는 새로운 냄새 개수에 반비례한다는 우스갯소리가 있어요." },
    { id:"TIP-077", cat:"유머", text:"세상에서 제일 어려운 훈련은 \"간식 참기\"라는 이야기, 다들 공감하시죠?" },
    { id:"TIP-078", cat:"유머", text:"진돗개는 낯선 사람보다 낯선 택배 상자를 더 오래 경계한다는 말이 있어요." },
    { id:"TIP-079", cat:"유머", text:"웰시코기의 엉덩이는 그 자체로 이미 하나의 콘텐츠라는 평가가 있어요." },
    { id:"TIP-080", cat:"유머", text:"강아지는 주인이 우울할 때 옆에 딱 붙어있는데, 신기하게 신났을 땐 더 딱 붙어있어요." }
  ];

  // 파스텔 무지개(빨주노초파남보) — 문구 카테고리와 무관하게 배너가 다음 문구로 넘어갈 때마다 다음
  // 순서 색으로 함께 넘어감(순차 순환 — 완전 무작위 대신, 실제로 무지개를 훑는 느낌을 주려는 의도).
  var TIP_BANNER_COLORS = [
    "#E8746F", // 빨강
    "#F0954C", // 주황
    "#DDAE3E", // 노랑(순수 파스텔 노랑은 흰 글씨 대비가 약해 조금 짙게 조정)
    "#6FA97C", // 초록
    "#5B93C9", // 파랑
    "#6C7FC9", // 남색
    "#9B7FC7"  // 보라
  ];

  var tipShuffleQueue = [];
  var tipLastIdx = -1;
  var tipColorIdx = 0;
  var tipRotateTimer = null;
  var TIP_ROTATE_MS = 18000; // 사용자 확인(추천값 12초 대신 18초 선택)

  function refillTipShuffleQueue(){
    var idxs = TIP_CATALOG.map(function(_, i){ return i; });
    for(var i = idxs.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = idxs[i]; idxs[i] = idxs[j]; idxs[j] = tmp;
    }
    // 셔플백 경계에서 방금 봤던 문구가 곧바로 또 나오는 것만 피함(그 외 순서는 완전 무작위)
    if(idxs.length > 1 && idxs[idxs.length - 1] === tipLastIdx){
      var swapAt = Math.floor(Math.random() * (idxs.length - 1));
      var t = idxs[idxs.length - 1]; idxs[idxs.length - 1] = idxs[swapAt]; idxs[swapAt] = t;
    }
    tipShuffleQueue = idxs;
  }
  function nextTipEntry(){
    if(tipShuffleQueue.length === 0) refillTipShuffleQueue();
    var idx = tipShuffleQueue.pop();
    tipLastIdx = idx;
    return TIP_CATALOG[idx];
  }
  function nextTipColor(){
    var c = TIP_BANNER_COLORS[tipColorIdx % TIP_BANNER_COLORS.length];
    tipColorIdx++;
    return c;
  }
  // 컨테이너 폭에 문구가 다 들어가면 굳이 흘리지 않고 정적으로 표시. prefers-reduced-motion이면
  // 애니메이션을 아예 안 걸고, 대신 .tip-banner-text의 CSS text-overflow:ellipsis 말줄임이 자연히
  // 대신해줌(별도 분기 불필요) — 문구 자체가 18초마다 바뀌는 건 "움직임"이 아니라 정보 갱신이라 보고
  // reduceMotion() 예외 없이 그대로 진행하고, 좌우로 흐르는 "티커 애니메이션"만 여기서 끔.
  function layoutTipTicker(){
    var wrap = el.tipBannerText, inner = el.tipBannerTextInner;
    if(!wrap || !inner) return;
    inner.classList.remove("tip-ticking");
    inner.style.removeProperty("--tip-start");
    inner.style.removeProperty("--tip-end");
    inner.style.removeProperty("--tip-dur");
    if(reduceMotion()) return;
    var cw = wrap.clientWidth, tw = inner.scrollWidth;
    if(tw <= cw) return;
    var dist = cw + tw;
    var dur = Math.max(6, Math.min(20, dist / 55)); // 초당 약 55px 속도로 읽기 편한 흐름 유지
    inner.style.setProperty("--tip-start", cw + "px");
    inner.style.setProperty("--tip-end", (-tw) + "px");
    inner.style.setProperty("--tip-dur", dur + "s");
    void inner.offsetWidth; // 강제 리플로우 — 같은 이름의 애니메이션을 다시 걸 때도 처음부터 재생되게 함
    inner.classList.add("tip-ticking");
  }
  function renderNextTip(){
    if(!el.tipBanner || !el.tipBannerTextInner) return;
    var entry = nextTipEntry();
    el.tipBanner.style.backgroundColor = nextTipColor();
    el.tipBannerTextInner.textContent = entry.text;
    layoutTipTicker();
  }
  function stopTipRotation(){
    if(tipRotateTimer){ window.clearInterval(tipRotateTimer); tipRotateTimer = null; }
  }
  function startTipRotation(){
    stopTipRotation();
    if(!el.tipBanner) return;
    renderNextTip();
    tipRotateTimer = window.setInterval(renderNextTip, TIP_ROTATE_MS);
  }

