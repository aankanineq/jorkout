'use client';

import { useState } from 'react';

const SPLIT_LABEL: Record<string, string> = {
    PUSH: '푸시',
    PULL: '풀',
    LEG: '레그',
}

const RUN_TYPE_LABEL: Record<string, string> = {
    EASY: '이지',
    LONG: '롱런',
    TEMPO: '템포',
    INTERVAL: '인터벌',
    RECOVERY: '리커버리',
    RACE: '레이스',
    FARTLEK: '파틀렉',
}

function formatDuration(totalSec: number): string {
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
}

export type WeeklyDayData = {
    date: Date;
    dayName: string;
    isToday: boolean;
    lifts: {
        id: string;
        splitType: string;
        duration: number | null;
        exerciseLogs: {
            id: string;
            exercise: { name: string; role: string };
            sets: { id: string; weight: number; reps: number; isWarmup: boolean }[];
        }[];
    }[];
    runs: {
        id: string;
        runType: string;
        distanceKm: number;
        durationSec: number;
    }[];
}

export default function WeeklyTracker({ days }: { days: WeeklyDayData[] }) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    return (
        <div>
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">이번 주 운동</h2>
            <div className="flex justify-between gap-2">
                {days.map((day, i) => {
                    const isSelected = expandedIndex === i;

                    return (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1 w-0">
                            <span className={`text-xs font-medium ${day.isToday ? 'text-indigo-600' : 'text-zinc-500'}`}>
                                {day.dayName}
                            </span>
                            <button
                                onClick={() => setExpandedIndex(isSelected ? null : i)}
                                className={`w-full h-[72px] flex flex-col gap-1 outline-none transition-transform active:scale-95 ${isSelected ? 'ring-2 ring-zinc-400 ring-offset-2 rounded-xl' : ''}`}
                            >
                                {day.lifts.length === 0 && day.runs.length === 0 ? (
                                    <div className={`w-full h-full rounded-xl flex items-center justify-center bg-zinc-50 border border-zinc-100 ${day.isToday ? 'ring-2 ring-indigo-200 border-transparent bg-white' : ''}`}>
                                        <span className="text-zinc-300 text-xs">-</span>
                                    </div>
                                ) : (
                                    <>
                                        {day.lifts.map((lift, idx) => (
                                            <div key={`lift-${idx}`} className="w-full h-full rounded-xl min-h-0 bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden">
                                                <span className="text-[10px] sm:text-xs font-semibold text-indigo-700 w-full text-center truncate px-1">
                                                    {SPLIT_LABEL[lift.splitType]}
                                                </span>
                                            </div>
                                        ))}
                                        {day.runs.map((run, idx) => (
                                            <div key={`run-${idx}`} className="w-full h-full rounded-xl min-h-0 bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden">
                                                <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 w-full text-center truncate px-1">
                                                    러닝
                                                </span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {expandedIndex !== null && (days[expandedIndex].lifts.length > 0 || days[expandedIndex].runs.length > 0) && (
                <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm font-semibold text-zinc-500 mb-2 px-1">
                        {days[expandedIndex].date.getMonth() + 1}월 {days[expandedIndex].date.getDate()}일 ({days[expandedIndex].dayName})
                    </p>

                    {/* Render Lift Sessions matching RecentSessions layout */}
                    {days[expandedIndex].lifts.map(lift => (
                        <div key={lift.id} className="rounded-xl bg-zinc-50 border border-zinc-100 px-5 py-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium whitespace-nowrap">
                                        {SPLIT_LABEL[lift.splitType]}
                                    </span>
                                </div>
                                {lift.duration && (
                                    <span className="text-xs text-zinc-400">{lift.duration}분</span>
                                )}
                            </div>

                            {lift.exerciseLogs && lift.exerciseLogs.length > 0 ? (
                                <div className="space-y-1.5">
                                    {lift.exerciseLogs.map(log => (
                                        <div key={log.id} className="flex items-start justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                {log.exercise.role === 'MAIN' && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                                )}
                                                <span className="text-zinc-600">{log.exercise.name}</span>
                                            </div>
                                            <div className="flex gap-1 text-xs text-zinc-500 flex-wrap justify-end pl-2">
                                                {log.sets.filter(s => !s.isWarmup).map(set => (
                                                    <span key={set.id} className="px-1.5 py-0.5 rounded bg-zinc-100/50 border border-zinc-200/50 text-zinc-600">
                                                        {set.weight}×{set.reps}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-400">기록된 종목이 없습니다.</p>
                            )}
                        </div>
                    ))}

                    {/* Render Run Sessions matching run Log layout */}
                    {days[expandedIndex].runs.map(run => (
                        <div key={run.id} className="rounded-xl bg-zinc-50 border border-zinc-100 px-5 py-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RUN_TYPE_LABEL[run.runType] === '이지' ? 'bg-sky-100 text-sky-700' :
                                            RUN_TYPE_LABEL[run.runType] === '롱런' ? 'bg-violet-100 text-violet-700' :
                                                RUN_TYPE_LABEL[run.runType] === '템포' ? 'bg-orange-100 text-orange-700' :
                                                    RUN_TYPE_LABEL[run.runType] === '인터벌' ? 'bg-rose-100 text-rose-700' :
                                                        RUN_TYPE_LABEL[run.runType] === '리커버리' ? 'bg-teal-100 text-teal-700' :
                                                            RUN_TYPE_LABEL[run.runType] === '레이스' ? 'bg-amber-100 text-amber-700' : 'bg-pink-100 text-pink-700'
                                            }`}>
                                            {RUN_TYPE_LABEL[run.runType]}
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-600 truncate">
                                        {run.distanceKm.toFixed(1)} km · {run.durationSec ? formatDuration(run.durationSec) : '-'}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-4 text-right text-sm">
                                    <div>
                                        <p className="text-xs text-zinc-400 mb-0.5">페이스</p>
                                        <p className="text-zinc-700">{run.durationSec ? `${Math.floor((run.durationSec / run.distanceKm) / 60)}'${(Math.floor(run.durationSec / run.distanceKm) % 60).toString().padStart(2, '0')}"` : '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
