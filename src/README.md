# 쁘띠멍 게임 소스 구조 (66번, 신규)

`furball-diary.html`은 claude.ai 아티팩트 플랫폼 제약상 여전히 **단일 HTML 파일로 게시**되지만,
그 파일을 직접 손으로 긁어가며 편집하는 대신 이 `src/` 아래 여러 파일로 나눠 관리하고,
`../build.py`가 게시 직전에 하나로 합칩니다. 플레이어 입장에서는 아무것도 바뀌지 않습니다 —
바뀐 건 오직 Claude(개발팀)가 코드를 찾고 고치는 방식뿐입니다.

## 작업 흐름

1. 고칠 내용에 맞는 파일을 아래 지도에서 찾아 그 파일만 연다(전체 7,000줄을 훑을 필요 없음).
2. `src/` 아래 해당 파일을 수정한다.
3. `python3 build.py`로 `furball-diary.html`을 다시 만든다.
4. `node --check`(구문 검사)와 필요하면 Playwright로 검증한다.
5. `git add -A && git commit -m "..."`으로 체크포인트를 남긴다 — 회귀가 발견되면
   `git log`로 이전 커밋을 찾아 `git checkout <commit> -- furball-diary.html src/`로 되돌릴 수 있음.
6. `Artifact` 도구로 게시한다.

## 파일 지도

- `head-meta.html` — `<title>`, 메타 설명, 구글 폰트 링크.
- `styles.css` — 전체 CSS(`<style>` 안에 그대로 들어감).
- `body-markup.html` — 전체 HTML 마크업(`<div class="stage">...` 전체).
- `script/` — JS 전체(원래 하나의 IIFE 안에 있던 코드를 실행 순서 그대로 나눔 — 파일 순서가
  곧 실행 순서이므로 **순서를 바꾸면 안 됨**). 번호 접두어(`001-`, `002-`...)가 곧 원본 파일의
  줄 순서와 같습니다.

| 파일 | 담긴 내용 |
|---|---|
| `001-constants-and-breeds.js` | 저장키, 견종/성격/패시브/눈동자색/모색 데이터(`BREEDS`, `PERSONALITIES`, `PASSIVES`, `EYE_COLORS`, `COAT_PALETTES`) |
| `002-pixel-art.js` | 픽셀 캔버스 드로잉(강아지·하늘·개집·엔딩씬 그래픽), 날씨, 멍멍모드(유휴 애니메이션) |
| `003-tips-banner.js` | "개꿀팁" 레터박스 배너(`TIP_CATALOG`, 셔플백, 티커) |
| `004-core-utils.js` | `rollTrait`/`findById`/`effMult` 등 범용 헬퍼 |
| `005-flavor-stats-growth.js` | 대사 문구(`FLAVOR`), 기본능력 8종(`CORE_STATS`), 견종별 시작 스탯, 성장 단계 관련 상수 |
| `006-abilities-and-domrefs.js` | 고유능력 카탈로그(`ABILITY_CATALOG`, 40종) + 지역 전담 능력 맵 + 능력 취득/판정 헬퍼 + DOM 요소 참조(`el`) 초기화 |
| `007-popups-and-ui-helpers.js` | 팝업 열기/닫기, 설명 팝업, 능력 카드 렌더링 |
| `008-collection-items.js` | 애착바구니 수집 아이템(`COLLECTION_ITEMS`), 재료 인벤토리, 관련 렌더링 |
| `009-stat-display-and-save.js` | 이모지/등급 배지 표시, 저장·불러오기(localStorage) |
| `010-talk-button-catalog.js` | 소통버튼 카탈로그(기본 5종+상점 7종) |
| `011-state-init-and-migration.js` | `freshState()`, 옛 세이브 마이그레이션 전체, 성장 단계, 모색 적용, 생활만족도 감소(`applyDecay`) |
| `012-render.js` | 메인 화면 `render()` 함수(가장 큰 단일 렌더 함수) |
| `013-bones-time-care.js` | 뼈다귀·게임시계 상수와 헬퍼(`hasBones`/`advanceGameTime`/`gameClockLabel`), 밥주기·놀아주기 |
| `014-walk-core-setup.js` | 산책 충전 동기화, 아이템/재료 지급, 등장인물·계절·시간대 판정 헬퍼 |
| `015-walk-events-common.js` | 공통 산책 이벤트 55종(`WALK_EVENTS`) |
| `016-walk-events-regions.js` | 지역별 전용 산책 이벤트 140종(`HOME_EVENTS` 등 7개 배열) + `WALK_REGIONS` |
| `017-walk-engine-core.js` | 이벤트 추첨(`pickWalkEvent`), 보상 배율, 지역 능력 배율, 산책 시작(`startWalk`) |
| `018-walk-engine-anim-events.js` | 산책 중 애니메이션, 이벤트 판정(성공/실패, 대성공/대실패), 개입(O/X·선택형) 팝업 |
| `019-walk-engine-finish-and-care.js` | 산책 종료 정산(`finishWalk`), 종료 화면 렌더링, 목욕/간식/휴식, 상점 구매 |
| `020-talk-button-engine.js` | 소통버튼 충전·발동·조합 로직 |
| `021-ending-sequence.js` | 30일 종료 엔딩 컷씬 전체 |
| `022-training-and-pulse.js` | 기본능력 훈련, 화면 갱신 펄스 애니메이션 |
| `023-onboarding-stats.js` | 온보딩 시 스탯 산출(믹스견 포함), 이동장/눈동자색/모색 선택 화면 빌더 |
| `024-bootstrap-and-onboarding-ui.js` | 온보딩 열기/닫기, "시작하기" 버튼 핸들러(고유능력 온보딩 굴림 포함), 나머지 이벤트 리스너 등록, 20초 라이브 틱(감쇠·디버프 발현·대회 해금 안내), 소통버튼 유휴 트리거 |
| `025-walk-pov-scene.js` | 산책 POV 화면(71번 확정 디자인) — 실제 게임 데이터(날씨·모색·성장 단계·7개 지역)에 맞춘 카메라뷰 렌더링 |
| `026-agility-game.js` | 어질리티 연습장(74번, 신규) — 순서기억 미니게임 전체(도전 시작·라운드 진행·판정·보상) |
| `027-vet-hospital.js` | 동물병원(76번, 신규) — 디버프 진단/치료 탭 화면, `VET_DIAGNOSE_COST` 등 |
| `028-competition-game.js` | 기다려 대회(77번, 신규) — [대회/이벤트] 4단계(초급/중급/상급/스페셜리스트) 미니게임: 해금 조건 판정, 상대견 생성(A~D 등급), 5단상 캔버스 렌더링, 3틱 성공/실패 판정·동시탈락/재경기 로직, 순위별 보상 테이블 |

## 지켜야 할 것

- **파일 순서를 바꾸지 말 것.** 전부 하나의 스코프(같은 IIFE) 안에서 순서대로 실행되던 코드라,
  뒤 파일이 앞 파일의 `var`/`function`을 참조합니다. 새 코드를 추가할 땐 "이 데이터/함수가 쓰이는
  시점보다 먼저 정의되는 파일"에 넣거나, 자기 완결적이면 새 번호 파일을 만들어도 됩니다(예: `025-...js`).
- **`build.py`가 만든 결과와 실제 게시 파일이 항상 일치해야 합니다.** `python3 build.py --check`로
  수시로 확인하세요 — diff가 나오면 `furball-diary.html`을 수작업으로 직접 고친 뒤 `src/`에 반영을
  안 한 것일 수 있습니다(반대로 하는 것을 원칙으로: `src/`를 고치고 `build.py`로 재생성).
- 이 구조 자체는 65번까지의 게임 동작을 **전혀 바꾸지 않습니다** — `python3 build.py --check`가
  "byte-identical"을 확인해줍니다. 66번에서 이 구조로 전환한 직후의 커밋이 그 증거입니다.
