export type FatigueLoad = { push: number; pull: number; quad: number; post: number; cardio: number }

export const DEFAULT_LOAD_TABLE: Record<string, FatigueLoad> = {
  BENCH:   { push: 3, pull: 2, quad: 0, post: 0, cardio: 0 },
  SQUAT:   { push: 0, pull: 0, quad: 3, post: 2, cardio: 1 },
  OHP:     { push: 2, pull: 2, quad: 0, post: 0, cardio: 0 },
  DEAD:    { push: 0, pull: 0, quad: 2, post: 3, cardio: 1 },
  EASY:    { push: 0, pull: 0, quad: 1, post: 1, cardio: 2 },
  QUALITY: { push: 0, pull: 0, quad: 1, post: 1, cardio: 3 },
  LONG:    { push: 0, pull: 0, quad: 2, post: 1, cardio: 3 },
  TENNIS:  { push: 2, pull: 1, quad: 1, post: 0, cardio: 2 },
  SOCCER:  { push: 0, pull: 0, quad: 2, post: 2, cardio: 3 },
  OTHER:   { push: 1, pull: 1, quad: 1, post: 1, cardio: 2 },
  REST:    { push: 0, pull: 0, quad: 0, post: 0, cardio: 0 },
}
