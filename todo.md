# History 과거 기록 삽입 기능

## 진행 상태: ✅ 완료

### 1. [x] Server actions 수정 — 과거 날짜 지원
- `createPastLiftSession(liftType, date)` 신규 — 사이클 진행 없이 세션 생성, 즉시 completed
- `createRunSession` — optional `date` 파라미터 추가
- `createSportSession` — optional `date` 파라미터 추가
- `logRest` — optional `date` 파라미터 추가

### 2. [x] CalendarView — 기록 추가 UI
- 날짜 선택 시 "＋ 기록 추가" 버튼
- 타입 선택: LIFT / RUN / SPORT / REST
- LIFT → 종류 선택(Bench/Squat/OHP/Dead) → 세션 생성 후 `/session/[id]`로 이동
- RUN → 인라인 폼 (타입/거리/시간)
- SPORT → 인라인 폼 (종목/시간/RPE)
- REST → 즉시 기록

### 3. [x] 빌드 확인 ✅
