# JORKOUT 코드베이스 문서

> 피트니스 트래킹 앱 — Next.js 16, React 19, TypeScript, Prisma, PostgreSQL
> 웨이트(5/3/1 프로그램), 러닝, 스포츠, 바디 메트릭을 피로도 기반 추천 시스템으로 관리

---

## 목차

1. [프로젝트 구조](#1-프로젝트-구조)
2. [기술 스택](#2-기술-스택)
3. [데이터베이스 스키마](#3-데이터베이스-스키마)
4. [핵심 비즈니스 로직](#4-핵심-비즈니스-로직)
5. [서버 액션 (API)](#5-서버-액션-api)
6. [페이지 구조](#6-페이지-구조)
7. [컴포넌트](#7-컴포넌트)
8. [유틸리티 라이브러리](#8-유틸리티-라이브러리)
9. [데이터 흐름](#9-데이터-흐름)
10. [환경 설정](#10-환경-설정)

---

## 1. 프로젝트 구조

```
jorkout/
├── app/                          # Next.js App Router 루트
│   ├── page.tsx                  # 대시보드 (홈)
│   ├── layout.tsx                # 루트 레이아웃 + BottomNav
│   ├── globals.css               # 전역 스타일 (CSS 변수, 테마)
│   │
│   ├── actions/                  # 서버 액션 (DB 뮤테이션)
│   │   ├── activity.ts           # 활동 CRUD
│   │   ├── liftSession.ts        # 리프트 세션 CRUD
│   │   ├── liftConfig.ts         # 5/3/1 설정, 사이클 관리, TM
│   │   ├── runSession.ts         # 러닝 세션 CRUD
│   │   ├── sportSession.ts       # 스포츠 세션 CRUD
│   │   ├── bodyLog.ts            # 바디 로그 CRUD
│   │   ├── exercise.ts           # 운동 목록 관리
│   │   ├── fatigue.ts            # 피로도 계산 + 추천
│   │   ├── equipment.ts          # 장비 설정
│   │   └── race.ts               # 레이스 관리
│   │
│   ├── components/               # 재사용 컴포넌트
│   │   ├── BottomNav.tsx         # 하단 네비게이션 바
│   │   └── FatigueBar.tsx        # 피로도 시각화 바
│   │
│   ├── body/page.tsx             # 바디 메트릭 트래킹
│   ├── history/                  # 활동 히스토리
│   │   ├── page.tsx              # 히스토리 메인
│   │   ├── CalendarView.tsx      # 캘린더 뷰
│   │   └── ExerciseHistory.tsx   # 운동 이력 표시
│   ├── race/                     # 레이스 관리
│   │   ├── page.tsx
│   │   └── RaceForm.tsx
│   ├── run/log/page.tsx          # 러닝 기록
│   ├── session/[id]/             # 리프트 세션 진행
│   │   ├── page.tsx
│   │   └── SessionRecorder.tsx   # 세트 기록 UI
│   ├── settings/                 # 앱 설정
│   │   ├── page.tsx
│   │   └── SettingsClient.tsx
│   └── sport/log/page.tsx        # 스포츠 기록
│
├── lib/                          # 유틸리티
│   ├── prisma.ts                 # Prisma 클라이언트 싱글톤
│   ├── date.ts                   # KST 날짜 유틸
│   ├── equipment.ts              # 장비 무게 계산
│   └── fatigueDefaults.ts        # 피로도 기본값 테이블
│
├── prisma/
│   ├── schema.prisma             # DB 스키마
│   ├── seed.ts                   # 초기 데이터 시드
│   ├── delete_logs.ts            # 유틸 스크립트
│   └── dummy.ts                  # 더미 데이터
│
├── public/
│   └── manifest.json             # PWA 매니페스트
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── prisma.config.ts
├── todo.md
└── CODEBASE.md                   # 이 문서
```

---

## 2. 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.6 |
| 언어 | TypeScript | 5 |
| 프론트엔드 | React | 19.2.3 |
| 스타일링 | Tailwind CSS | 4 |
| ORM | Prisma | 7 |
| 데이터베이스 | PostgreSQL | - |
| DB 드라이버 | pg | 8.19.0 |

**아키텍처 패턴**
- Next.js App Router (RSC + Server Actions)
- 서버 컴포넌트에서 직접 DB 호출
- 클라이언트 컴포넌트는 `'use client'` 명시
- 서버 액션은 `'use server'` 명시, Form action 또는 직접 호출
- 시간 처리: UTC 저장, KST(UTC+9) 표시

---

## 3. 데이터베이스 스키마

### 3.1 Enum 타입

```prisma
enum ActivityType { LIFT | RUN | SPORT | REST }
enum LiftType     { BENCH | SQUAT | OHP | DEAD }
enum RunType      { EASY | QUALITY | LONG }
enum SportType    { TENNIS | SOCCER | OTHER }
enum CycleWeek    { FIVE | THREE | ONE | DELOAD }
```

### 3.2 모델 관계도

```
Activity (1)──────(1) LiftSession ──(N)── ExerciseLog ──(N)── ExerciseSet
         │                               (N)
         ├──────(1) RunSession           │
         └──────(1) SportSession    Exercise (LiftType별 운동 정의)

LiftConfig     (LiftType별 TM, 사이클, 피로 설정)
EquipmentConfig(장비별 설정 JSON)
FatigueOverride(날짜+존별 수동 피로도 덮어쓰기)
Race           (레이스 일정)
BodyLog        (날짜별 체중/체지방/근육량)
```

### 3.3 핵심 모델 상세

#### `Activity` — 모든 활동의 기반 레코드
```prisma
model Activity {
  id         String       @id @default(cuid())
  date       DateTime     @db.Date          // 날짜 (UTC 저장, KST 기준)
  type       ActivityType                   // LIFT | RUN | SPORT | REST
  notes      String?
  isBackfill Boolean      @default(false)   // 과거 소급 입력 여부 (사이클 진행 X)
  createdAt  DateTime     @default(now())

  liftSession  LiftSession?   // type=LIFT 일 때만 연결
  runSession   RunSession?    // type=RUN 일 때만 연결
  sportSession SportSession?  // type=SPORT 일 때만 연결
}
```
**핵심**: `isBackfill=true`이면 과거에 소급 입력한 활동. 사이클 진행 로직에서 제외됨.

---

#### `LiftConfig` — 종목별 5/3/1 설정
```prisma
model LiftConfig {
  id          String    @id @default(cuid())
  liftType    LiftType  @unique              // BENCH | SQUAT | OHP | DEAD
  nickname    String?                        // 사용자 정의 이름
  fatigueLoad Json?                          // 피로도 기여값 (push/pull/quad/post/cardio)
  enabled     Boolean   @default(true)       // 추천 대상 여부
  tm          Float                          // Training Max (kg)
  cycleWeek   CycleWeek                      // 현재 주차 (FIVE→THREE→ONE→DELOAD→FIVE...)
  tmIncrement Float     @default(5)          // AMRAP 기본 TM 증가량
}
```
**핵심**: `tm`과 `cycleWeek`로 모든 세트 무게가 자동 계산됨.

---

#### `Exercise` — 운동 정의 (종목별 메뉴)
```prisma
model Exercise {
  id               String   @id @default(cuid())
  name             String   @unique
  liftType         LiftType                    // 어떤 날의 운동인지
  role             String                      // MAIN | BBB | ACCESSORY
  order            Int                         // 세션 내 순서
  targetSets       Int
  targetMinReps    Int
  targetMaxReps    Int
  equipmentType    String   @default("MANUAL") // BARBELL|DUMBBELL|CABLE|BODYWEIGHT|MANUAL
  availableWeights Float[]                     // 선택 가능한 무게 목록 (장비 기반 미리 계산)

  exerciseLogs ExerciseLog[]
}
```
**role 설명**:
- `MAIN`: 5/3/1 메인 세트 (TM × 퍼센트로 자동 무게 계산)
- `BBB`: Boring But Big 보조 세트 (TM × 50%)
- `ACCESSORY`: 부속 운동 (수동 무게 선택)

---

#### `LiftSession` — 특정 날의 웨이트 세션
```prisma
model LiftSession {
  id         String   @id @default(cuid())
  activityId String   @unique              // Activity와 1:1
  liftType   LiftType
  date       DateTime @db.Date
  duration   Int?                          // 운동 시간 (초)
  completed  Boolean  @default(false)      // 완료 여부

  activity     Activity
  exerciseLogs ExerciseLog[]               // 세션에서 수행한 운동들
}
```

---

#### `ExerciseLog` — 세션 안 하나의 운동
```prisma
model ExerciseLog {
  id            String @id @default(cuid())
  liftSessionId String
  exerciseId    String
  order         Int                        // 세션 내 순서

  liftSession LiftSession
  exercise    Exercise
  sets        ExerciseSet[]               // 이 운동의 세트들
}
```

---

#### `ExerciseSet` — 개별 세트 기록
```prisma
model ExerciseSet {
  id            String  @id @default(cuid())
  exerciseLogId String
  setNumber     Int
  weight        Float                      // kg
  reps          Int
  isWarmup      Boolean @default(false)    // 워밍업 세트
  isAmrap       Boolean @default(false)    // AMRAP 세트 (TM 조정에 사용)

  exerciseLog ExerciseLog
}
```
**핵심**: `isAmrap=true`인 세트의 reps 수가 다음 사이클 TM 계산에 사용됨.

---

#### `RunSession` — 러닝 기록
```prisma
model RunSession {
  id          String  @id @default(cuid())
  activityId  String  @unique
  date        DateTime @db.Date
  runType     RunType               // EASY | QUALITY | LONG
  distanceKm  Float
  durationSec Int                   // 초 단위
  avgPace     Int                   // 초/km
  raceId      String?               // 연결된 레이스 (선택)

  activity Activity
}
```

---

#### `SportSession` — 스포츠 기록
```prisma
model SportSession {
  id          String    @id @default(cuid())
  activityId  String    @unique
  date        DateTime  @db.Date
  sportType   SportType              // TENNIS | SOCCER | OTHER
  durationMin Int                    // 분 단위
  rpe         Int?                   // 자각 강도 (0~10)
  notes       String?

  activity Activity
}
```

---

#### `FatigueOverride` — 피로도 수동 조정
```prisma
model FatigueOverride {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  zone      String                        // PUSH|PULL|QUAD|POST|CARDIO
  value     Int                           // 0~6
  updatedAt DateTime @default(now())

  @@unique([date, zone])                  // 날짜+존당 1개
}
```

---

#### `BodyLog` — 체성분 기록
```prisma
model BodyLog {
  id         String   @id @default(cuid())
  date       DateTime @unique @db.Date    // 날짜당 1개
  weight     Float?                       // kg
  bodyFat    Float?                       // %
  muscleMass Float?                       // kg
}
```

---

#### `Race` — 레이스 일정
```prisma
model Race {
  id             String   @id @default(cuid())
  name           String
  date           DateTime @db.Date
  distanceKm     Float
  goalTime       String?                  // 목표 기록 (문자열)
  actualTime     String?                  // 실제 기록 (문자열)
  weeklyTargetKm Float?                   // 주간 목표 러닝 거리
  status         String   @default("UPCOMING")  // UPCOMING | COMPLETED
  createdAt      DateTime @default(now())
}
```

---

#### `EquipmentConfig` — 장비 설정
```prisma
model EquipmentConfig {
  id   String @id @default(cuid())
  type String @unique                    // BARBELL | DUMBBELL | CABLE | BODYWEIGHT
  data Json                             // 장비별 설정 구조체
}
```
장비별 data 구조:
```ts
BARBELL:    { barWeight: 20, platesPerSide: [20, 15, 10, 5, 5, 2.5] }
DUMBBELL:   { weights: [3, 5, 6, 8, 10, 12, 13, 15, 18, 20] }
CABLE:      { min: 5, max: 60, step: 5 }
BODYWEIGHT: { extraWeights: [5, 10, 15, 20] }
```

---

## 4. 핵심 비즈니스 로직

### 4.1 5/3/1 웨이트리프팅 프로그램

4주 사이클: `FIVE → THREE → ONE → DELOAD → FIVE → ...`

#### 사이클별 메인 세트 퍼센트 & 렙
| 주차 | 세트1 | 세트2 | 세트3 (AMRAP) |
|------|-------|-------|---------------|
| FIVE (5주) | TM×65% × 5회 | TM×75% × 5회 | TM×85% × 5+회 |
| THREE (3주) | TM×70% × 3회 | TM×80% × 3회 | TM×90% × 3+회 |
| ONE (1주) | TM×75% × 5회 | TM×85% × 3회 | TM×95% × 1+회 |
| DELOAD | TM×40% × 5회 | TM×50% × 5회 | TM×60% × 5회 |

BBB(Boring But Big): TM × 50% 로 5세트
**무게는 모두 5kg 단위로 반올림**

#### 사이클 진행 (`advanceCycle`)
```
세션 완료 → advanceCycle() 호출
→ FIVE → THREE → ONE → DELOAD → (DELOAD 완료시 TM 조정) → FIVE
```

#### DELOAD 완료 시 TM 자동 조정 (`calcAmrapTMDelta`)
가장 최근 ONE 주차 MAIN 운동의 AMRAP 세트 렙수 기준:
```
0~1렙: TM × 0.9   (약 -10%, 2.5kg 단위 반올림)
2렙:   변동 없음
3~4렙: +tmIncrement (기본 5kg)
5+렙:  +tmIncrement × 2 (기본 10kg)
```
AMRAP 기록이 없으면 기본값 +tmIncrement

#### 세션 소급 입력 (`createPastLiftSession`)
- `isBackfill: true`로 생성
- `completed: true`로 바로 완료 처리
- 사이클 진행 없음
- 피로도 계산에서도 제외

#### 세션 삭제 (`deleteSession`)
- 완료된 세션이고 backfill이 아니면 `revertCycle()` 호출해 사이클 되돌림

#### 자동 완료 처리 (`autoCompleteStaleSessions`)
대시보드 진입 시 실행. 오늘 이전에 생성되었지만 미완료인 세션을 자동으로 완료 + 사이클 진행.

---

### 4.2 피로도 시스템

5개 존: **PUSH, PULL, QUAD, POST, CARDIO**

#### 피로도 기본값 테이블 (`lib/fatigueDefaults.ts`)
| 활동 | PUSH | PULL | QUAD | POST | CARDIO |
|------|------|------|------|------|--------|
| BENCH | 3 | 2 | 0 | 0 | 0 |
| SQUAT | 0 | 0 | 3 | 2 | 1 |
| OHP | 2 | 2 | 0 | 0 | 0 |
| DEAD | 0 | 0 | 2 | 3 | 1 |
| EASY(런) | 0 | 0 | 1 | 1 | 2 |
| QUALITY(런) | 0 | 0 | 1 | 1 | 3 |
| LONG(런) | 0 | 0 | 2 | 1 | 3 |
| TENNIS | 2 | 1 | 1 | 0 | 2 |
| SOCCER | 0 | 0 | 2 | 2 | 3 |
| OTHER | 1 | 1 | 1 | 1 | 2 |
| REST | 0 | 0 | 0 | 0 | 0 |

**커스텀 설정**: `LiftConfig.fatigueLoad`에 저장하면 기본값 대신 사용됨.

#### 피로도 계산 알고리즘 (`getFatigueState`)
```
최근 14일 활동(isBackfill=false) 조회
→ 각 활동마다:
   daysAgo = 오늘 - 활동날짜 (일수)
   contribution = max(0, load[zone] - daysAgo)   ← 하루 1씩 감소(decay)
   fatigue[zone] += contribution
→ REST 활동은 추가로 각 존에서 -1 (이미 0 load이므로 보너스 회복)
→ FatigueOverride 적용 (수동 덮어쓰기)
→ 모든 값 0~6 클램핑
```
**핵심**: 피로도는 활동 후 날마다 1씩 자동 감소. 14일 지나면 완전 회복.

---

### 4.3 활동 추천 엔진 (`getRecommendation`)

```
1. 전체 피로도 모두 4 이상이거나 3일 연속 활동 → REST 추천
2. 활성화된 리프트(enabled=true)가 없으면 RUN/SPORT 추천
3. 리프트별 피로 점수 계산:
     score = Σ(load[zone] × fatigue[zone])   ← 낮을수록 지금 하기 좋음
4. 가장 낮은 점수의 리프트 추천
   (단, 마지막에 한 리프트는 같은 점수라도 후순위)
5. 대안: 나머지 리프트들 + 다음 러닝 타입 + SPORT + REST
```

**다음 러닝 타입**: EASY→QUALITY→LONG→EASY 순환
(QUAD+POST 합이 6 이상이면 강제로 EASY 제안)

---

### 4.4 장비 무게 계산 (`lib/equipment.ts`)

```
BARBELL: 바 무게 + 한쪽 원판 조합의 모든 부분집합 합 × 2
  예) bar=20, plates=[20,15,10,5] → 20, 30, 40, 45, 50... 모든 조합
DUMBBELL: 명시된 무게 목록 그대로
CABLE: min~max 사이를 step 간격으로
BODYWEIGHT: 0 (체중) + extraWeights 목록
```

운동(Exercise)에 `availableWeights[]`가 저장되어 세션 기록 시 버튼으로 선택.

---

### 4.5 사이클 주차 추론 (`syncCycleWeeks`)

세팅 페이지에서 실행 가능. 최근 완료 세션의 세트 패턴으로 현재 주차를 추론:
```
첫 세트 5회 + 두 번째 세트 3회  → ONE 주차 완료 → 다음은 DELOAD
첫 세트 3회 + 두 번째 세트 3회  → THREE 주차 완료 → 다음은 ONE
첫 세트 5회 + 두 번째 세트 5회 + AMRAP → FIVE 주차 완료 → 다음은 THREE
첫 세트 5회 + 두 번째 세트 5회 + 일반  → DELOAD 주차 완료 → 다음은 FIVE
```

---

## 5. 서버 액션 (API)

Next.js Server Actions. 모두 `'use server'` 지시어로 선언. Form action 또는 클라이언트에서 직접 호출.

### `app/actions/activity.ts`

| 함수 | 설명 |
|------|------|
| `getTodayActivities()` | 오늘 활동 조회 (liftSession/runSession/sportSession 포함) |
| `getRecentActivities(days)` | 최근 N일 활동 조회 |
| `getWeeklyStats(weekStart?)` | 이번 주 요약 (liftCount, runKm, restCount, activities) |
| `logRest(date?)` | 휴식 기록 |
| `deleteActivity(id)` | 활동 삭제 (완료된 LIFT면 사이클 되돌림) |

---

### `app/actions/liftSession.ts`

| 함수 | 설명 |
|------|------|
| `autoCompleteStaleSessions()` | 오래된 미완료 세션 자동 완료 + 사이클 진행 |
| `startSession(liftType)` | 새 세션 생성 → `/session/[id]` 리다이렉트 |
| `saveSet(exerciseLogId, data)` | 세트 저장/수정 |
| `deleteSet(setId)` | 세트 삭제 |
| `completeSession(sessionId)` | 세션 완료 + 사이클 진행 → `/` 리다이렉트 |
| `createPastLiftSession(liftType, date)` | 과거 세션 소급 입력 (isBackfill=true) |
| `deleteSession(sessionId)` | 세션 삭제 (완료+비백필이면 사이클 되돌림) |

`startSession` 상세:
1. 오늘 같은 타입 세션이 이미 있으면 그 세션으로 리다이렉트
2. 없으면 `Activity` + `LiftSession` + `ExerciseLog`(BBB 제외) 생성
3. BBB는 별도 ExerciseLog 없이 SessionRecorder에서 직접 처리

---

### `app/actions/liftConfig.ts`

| 함수 | 설명 |
|------|------|
| `getLiftConfig(liftType)` | TM + 세트 무게 계산된 mainSets, bbbWeight 반환 |
| `getAllLiftConfigs()` | 전체 설정 + weekLabel 포함 |
| `advanceCycle(liftType)` | 다음 주차로 진행 (DELOAD→FIVE 시 TM 조정) |
| `revertCycle(liftType)` | 이전 주차로 되돌림 |
| `updateCycleWeek(liftType, week)` | 주차 수동 설정 |
| `toggleLiftConfig(liftType, enabled)` | 리프트 활성/비활성 |
| `updateFatigueLoad(liftType, load)` | 피로도 기여값 커스텀 |
| `updateNickname(liftType, nickname)` | 리프트 별명 설정 |
| `updateTM(liftType, newTM)` | TM 수동 수정 |
| `syncCycleWeeks()` | 세션 패턴 기반 주차 자동 추론 |

`getLiftConfig` 반환값 예시 (BENCH, ONE주차, TM=80kg):
```js
{
  liftType: 'BENCH',
  tm: 80,
  cycleWeek: 'ONE',
  weekLabel: '1s',
  isDeload: false,
  mainSets: [
    { weight: 60, reps: 5, percentage: 75 },   // 80×0.75=60
    { weight: 70, reps: 3, percentage: 85 },   // 80×0.85=68→70(5단위)
    { weight: 75, reps: '1+', percentage: 95 } // 80×0.95=76→75(5단위)
  ],
  bbbWeight: 40   // 80×0.50=40
}
```

---

### `app/actions/fatigue.ts`

| 함수 | 설명 |
|------|------|
| `getFatigueState()` | 현재 피로도 5존 계산 (0~6) |
| `adjustFatigue(zone, value)` | 오늘 날짜 특정 존 수동 오버라이드 |
| `getRecommendation()` | 피로도 기반 주 추천 + 대안 목록 반환 |

`getRecommendation` 반환 구조:
```ts
{
  primary: { type: 'LIFT', subType: 'BENCH', reason: '피로 최소 · 5s week' }
           | { type: 'REST', reason: '전체 피로 높음' },
  alternatives: [
    { type: 'LIFT', subType: 'SQUAT', reason: 'SQUAT' },
    { type: 'RUN',  subType: 'QUALITY', reason: 'CARDIO 2/6' },
    { type: 'SPORT', reason: '스포츠 기록' },
    { type: 'REST',  reason: '휴식' },
  ],
  fatigue: { push: 2, pull: 1, quad: 3, post: 2, cardio: 1 }
}
```

---

### `app/actions/runSession.ts`

| 함수 | 설명 |
|------|------|
| `getNextRunType()` | 마지막 런 타입 기반 다음 런 타입 제안 |
| `createRunSession(data)` | 러닝 세션 생성 |
| `updateRunSession(id, data)` | 러닝 세션 수정 |

---

### `app/actions/sportSession.ts`

| 함수 | 설명 |
|------|------|
| `createSportSession(data)` | 스포츠 세션 생성 |
| `updateSportSession(id, data)` | 스포츠 세션 수정 |
| `deleteSportSession(id)` | 스포츠 세션 삭제 |

---

### `app/actions/bodyLog.ts`

| 함수 | 설명 |
|------|------|
| `createBodyLog(data)` | 체성분 기록 (날짜 기준 upsert) |
| `deleteBodyLog(id)` | 체성분 기록 삭제 |
| `getRecentBodyLogs(days)` | 최근 N일 기록 조회 |

---

### `app/actions/exercise.ts`

| 함수 | 설명 |
|------|------|
| `getExercisesByLiftType(liftType)` | 종목별 운동 목록 (order 정렬) |
| `createExercise(data)` | 새 운동 추가 |
| `updateExercise(id, data)` | 운동 수정 |
| `deleteExercise(id)` | 운동 삭제 (연결된 로그/세트 cascade) |
| `swapExerciseOrder(idA, idB)` | 운동 순서 변경 |
| `updateWeightPresets(id, weights)` | 운동 가능 무게 목록 업데이트 |

---

### `app/actions/equipment.ts`

| 함수 | 설명 |
|------|------|
| `getEquipmentConfigs()` | 전체 장비 설정 조회 |
| `upsertEquipmentConfig(type, data)` | 장비 설정 저장/수정 |
| `updateExerciseEquipmentType(id, type)` | 운동의 장비 타입 변경 |
| `initEquipmentConfigs()` | 기본 장비 설정 초기화 |

---

### `app/actions/race.ts`

| 함수 | 설명 |
|------|------|
| `createRace(data)` | 레이스 추가 |
| `updateRace(id, data)` | 레이스 정보/결과 수정 |
| `deleteRace(id)` | 레이스 삭제 |

---

## 6. 페이지 구조

### `/` — 대시보드 (`app/page.tsx`)

**서버 컴포넌트**. 진입 시 `autoCompleteStaleSessions()` 실행.

병렬 데이터 조회:
- `getRecommendation()` → 피로도 + 추천
- `getWeeklyStats()` → 이번 주 요약
- `getAllLiftConfigs()` → TM/주차 정보
- `getTodayActivities()` → 오늘 활동

**화면 구성**:
```
[헤더: JORKOUT + 새로고침 + 설정 링크]

[현재 피로도]
  FatigueBar (PUSH/PULL/QUAD/POST/CARDIO 각 0~6)

[오늘의 추천 / 진행중 / 오늘의 운동]
  상태에 따라 3가지 중 하나:
  A. 진행중 세션 있음: "이어서 하기" 카드 → /session/[id]
  B. 오늘 완료한 활동 있음: 완료 카드들 + "추가 운동" 대안
  C. 아무것도 안 함: 주 추천 카드 (시작 버튼 또는 휴식 버튼) + 대안 3열

[이번 주 기록]
  활동 목록 + 하단 요약 (리프트 N회, 러닝 Xkm, 휴식 N일)
```

---

### `/history` — 활동 히스토리 (`app/history/page.tsx`)

**캘린더 뷰** + **운동 이력** 탭 구성.

캘린더에서 날짜 클릭 시:
- 해당 날짜 활동 목록 표시
- 활동 삭제 가능
- 과거 활동 소급 입력 폼 (LIFT/RUN/SPORT/REST)
- 리프트는 `createPastLiftSession()` 호출 (사이클 진행 없음)

운동 이력 탭:
- 리프트별 사이클 진행 현황 (5s → 3s → 1s → DEL → 5s...)
- 러닝 이력 (타입별, 거리)

---

### `/body` — 바디 메트릭 (`app/body/page.tsx`)

- 체중(kg), 체지방(%), 근육량(kg) 입력 폼
- SVG 라인 차트로 트렌드 시각화
- 차트 포인트 클릭 시 해당 날짜 기록 삭제 가능
- 날짜당 1개 기록 (upsert)

---

### `/race` — 레이스 관리 (`app/race/page.tsx`)

- 예정 레이스 목록 + D-day 카운트다운
- 이번 주 러닝 거리 vs 주간 목표 진행률
- 레이스 추가/완료 처리 폼
- `RaceForm.tsx`: 모달 형태 레이스 추가 폼

---

### `/run/log` — 러닝 기록 (`app/run/log/page.tsx`)

- 거리(km), 시간(분:초), 러닝 타입 입력
- 페이스 자동 계산 표시
- 제출 시 `createRunSession()` 호출

---

### `/sport/log` — 스포츠 기록 (`app/sport/log/page.tsx`)

- 스포츠 종류 선택 (TENNIS/SOCCER/OTHER)
- 소요 시간(분), RPE(3~9) 입력
- 제출 시 `createSportSession()` 호출

---

### `/session/[id]` — 리프트 세션 (`app/session/[id]/page.tsx`)

`SessionRecorder.tsx`가 핵심 컴포넌트.

**화면 구성**:
```
[헤더: Bench Day, 5s week]

[MAIN 세트 섹션]
  세트1: 60kg × 5회  [기록] [삭제]
  세트2: 70kg × 3회  [기록] [삭제]
  세트3: 75kg × 1+회 [기록] [삭제] ← AMRAP 표시

[BBB 세트 섹션]
  40kg × 5회 × 5세트

[ACCESSORY 운동들]
  운동명, 무게 선택, 세트 기록

[완료하기 버튼] → completeSession() → 사이클 진행 → /
```

이전 세션 기록과 비교 가능.

---

### `/settings` — 설정 (`app/settings/page.tsx` + `SettingsClient.tsx`)

**클라이언트 컴포넌트** (`SettingsClient.tsx`).

탭/섹션 구성:
1. **리프트 설정**: TM 수동 수정, 주차 수동 설정, 리프트 활성화/비활성화, 별명 설정, 사이클 동기화
2. **운동 관리**: 종목별 운동 목록, 추가/수정/삭제, 순서 변경, 타겟 세트×렙 설정
3. **장비 설정**: 바벨/덤벨/케이블/맨몸 설정, 무게 프리셋 재계산
4. **피로도 설정**: 종목별 피로 기여값 커스텀

---

## 7. 컴포넌트

### `BottomNav` (`app/components/BottomNav.tsx`)

고정 하단 네비게이션. 4개 탭:
- `/` (홈/대시보드)
- `/body` (바디)
- `/history` (히스토리)
- `/settings` (설정)

현재 경로 기반 활성 탭 강조.

---

### `FatigueBar` (`app/components/FatigueBar.tsx`)

5개 존 피로도 시각화 + 수동 조정.

```
PUSH  ██████░ 4/6  [-] [+]
PULL  ███░░░░ 2/6  [-] [+]
QUAD  █████░░ 3/6  [-] [+]
POST  ████░░░ 3/6  [-] [+]
CARD  ██░░░░░ 1/6  [-] [+]
```

색상: 0~2 녹색, 3~4 주황, 5~6 빨강
`[-]`/`[+]` 클릭 시 `adjustFatigue()` 호출.

---

### `CalendarView` (`app/history/CalendarView.tsx`)

월별 캘린더 그리드. 날짜에 활동 타입별 도트 표시.
날짜 클릭 → 사이드 패널: 해당 날 활동 표시 + 인라인 추가/수정 폼.

---

### `ExerciseHistory` (`app/history/ExerciseHistory.tsx`)

리프트 세션 이력:
- 날짜별 세션 카드
- 사이클 주차 시각화 (5s/3s/1s/DEL 색상 구분)
- 접었다 펼치기로 세부 세트 확인

---

### `SessionRecorder` (`app/session/[id]/SessionRecorder.tsx`)

세션 기록 핵심 UI. 클라이언트 컴포넌트.

- MAIN 세트 행: 미리 계산된 무게/렙 표시, 완료 체크, AMRAP 표시
- BBB 세트 행: TM×50% 무게, 5×5 또는 5×10 구성
- ACCESSORY 행: 무게 드롭다운(availableWeights) + 렙 입력
- 세트 저장: `saveSet()` 호출
- 이전 세션 값 비교 표시

---

### `BodyChart` (`app/body/BodyChart.tsx`)

커스텀 SVG 라인 차트.
- 체중/근육량/체지방 3개 선
- X축: 날짜, Y축: 값
- 데이터 포인트 클릭 → 삭제 확인

---

### `RaceForm` (`app/race/RaceForm.tsx`)

모달 폼. 레이스 이름, 날짜, 거리, 목표 기록, 주간 목표 거리 입력.

---

### `SettingsClient` (`app/settings/SettingsClient.tsx`)

클라이언트 컴포넌트. 모든 설정 UI 통합:
- 상태 관리: `useState`로 편집 모드 토글
- 각 설정 변경 시 서버 액션 직접 호출
- 장비 설정 변경 시 `computeAvailableWeights()` 재계산 후 `updateWeightPresets()` 호출

---

## 8. 유틸리티 라이브러리

### `lib/prisma.ts` — Prisma 클라이언트

```ts
// 싱글톤 패턴으로 연결 재사용
// DIRECT_URL 환경변수 사용
// @prisma/adapter-pg로 pg 드라이버 연결
```

---

### `lib/date.ts` — KST 날짜 유틸

```ts
nowKST()        // 현재 KST 시간 (Date 객체)
todayKST()      // KST 기준 오늘 0시 UTC Date (DB 저장용)
tomorrowKST()   // KST 기준 내일 0시 UTC Date
getMondayKST()  // 이번 주 월요일 UTC Date
toKST(date)     // UTC Date → KST 표시용 Date 변환
```

**왜 KST 변환이 필요한가?**
DB에는 UTC로 저장되지만, 사용자는 KST 기준으로 날짜를 인식함.
`today = 2024-01-15 15:00 KST` = `2024-01-15 06:00 UTC`
→ DB에 `2024-01-15`로 저장하려면 UTC+9 오프셋 고려 필요.

---

### `lib/fatigueDefaults.ts` — 피로도 기본값

```ts
export type FatigueLoad = { push: number; pull: number; quad: number; post: number; cardio: number }

export const DEFAULT_LOAD_TABLE: Record<string, FatigueLoad> = {
  BENCH:   { push: 3, pull: 2, quad: 0, post: 0, cardio: 0 },
  // ... (위 섹션 4.2 테이블 참조)
}
```

---

### `lib/equipment.ts` — 장비 무게 계산

```ts
computeAvailableWeights(equipmentType, configs): number[]
```

BARBELL의 경우 원판 목록의 모든 부분집합 합 계산 (비트마스크 없이 Set 활용):
```ts
const sums = new Set([0])
for (const plate of platesPerSide) {
  for (const s of [...sums]) sums.add(s + plate)
}
return [...sums].map(s => barWeight + 2 * s).sort()
```

---

## 9. 데이터 흐름

### 세션 시작부터 완료까지

```
사용자: 대시보드에서 "운동 시작하기" 클릭
→ startSession('BENCH') [Server Action]
  → 오늘 BENCH 세션 있으면 기존 세션 redirect
  → 없으면 Activity + LiftSession + ExerciseLog(BBB 제외) DB 생성
  → redirect('/session/[id]')

사용자: 세트 완료 후 무게/렙 입력
→ saveSet(exerciseLogId, { weight, reps, isAmrap }) [Server Action]
  → ExerciseSet upsert
  → revalidatePath('/session/[id]')

사용자: "완료하기" 클릭
→ completeSession(sessionId) [Server Action]
  → LiftSession.completed = true
  → advanceCycle(liftType)
    → cycleWeek: FIVE → THREE → ONE → DELOAD
    → DELOAD→FIVE 전환 시 AMRAP 렙 조회 → TM 자동 조정
  → revalidatePath('/')
  → redirect('/')
```

### 피로도 계산 흐름

```
대시보드 로드
→ getRecommendation() [Server Action]
  → getFatigueState()
    → 최근 14일 Activity 조회 (isBackfill=false)
    → 각 활동의 피로 기여도 = max(0, load - daysAgo)
    → 합산 후 FatigueOverride 적용
    → 0~6 클램핑
  → 피로도 기반 추천 로직 실행
→ FatigueBar에 결과 표시
```

---

## 10. 환경 설정

### 환경변수 (`.env`)
```env
DIRECT_URL="postgresql://user:password@host:5432/dbname"
```

### `prisma.config.ts`
```ts
import { defineConfig } from 'prisma/config'
export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrate: { async adapter() { /* pg adapter */ } },
})
```

### `package.json` 주요 스크립트
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

### PWA (`public/manifest.json`)
앱 설치 지원. 이름, 아이콘, 테마 컬러 등 정의.

---

## 부록: 주요 타입 정리

```ts
// 피로도 상태
type FatigueState = { push: number; pull: number; quad: number; post: number; cardio: number }

// 추천 결과
type Recommendation = {
  primary: { type: 'LIFT'; subType: LiftType; reason: string }
         | { type: 'REST'; reason: string }
  alternatives: Array<{ type: ActivityType; subType?: string; reason: string }>
  fatigue: FatigueState
}

// 세트 저장 입력
type SaveSetData = {
  setId?: string
  setNumber: number
  weight: number
  reps: number
  isWarmup?: boolean
  isAmrap?: boolean
}

// 장비 설정 타입
type BarbellConfig   = { barWeight: number; platesPerSide: number[] }
type DumbbellConfig  = { weights: number[] }
type CableConfig     = { min: number; max: number; step: number }
type BodyweightConfig = { extraWeights: number[] }
```
