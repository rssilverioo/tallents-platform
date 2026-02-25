"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type AthleteStatus = {
  id: string;
  name: string;
  team: string;
  position: string;
  photo: string;
  remainingMeetings: number;
  _count: { scouts: number };
};

type Phase = "inicio" | "consolidacao" | "fase_final";

function getPhase(a: AthleteStatus): Phase {
  const totalDone = a._count.scouts;
  if (a.remainingMeetings === 0) return "fase_final";
  if (totalDone > 0) return "consolidacao";
  return "inicio";
}

const PHASE_META: Record<
  Phase,
  {
    label: string;
    desc: string;
    color: string;
    bg: string;
    ring: string;
    bar: string;
    badge: string;
    icon: React.ReactNode;
  }
> = {
  inicio: {
    label: "Início",
    desc: "Nenhum scout realizado ainda",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
    bar: "bg-blue-500",
    badge: "bg-blue-500/15 text-blue-300 ring-blue-500/25",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  consolidacao: {
    label: "Consolidação",
    desc: "Tem scouts e ainda tem encontros",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/20",
    bar: "bg-violet-500",
    badge: "bg-violet-500/15 text-violet-300 ring-violet-500/25",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm9.75-3c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-9.75zM6 7.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v12.375c0 .621-.504 1.125-1.125 1.125H7.125A1.125 1.125 0 016 19.875V7.5z" />
      </svg>
    ),
  },
  fase_final: {
    label: "Fase Final",
    desc: "Todos os encontros concluídos",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    bar: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const PHASE_ORDER: Phase[] = ["inicio", "consolidacao", "fase_final"];

function ProgressBar({ value, max, barClass }: { value: number; max: number; barClass: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-all duration-700 ${barClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function StatusPage() {
  const [athletes, setAthletes] = useState<AthleteStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setAthletes(d.athletes ?? []))
      .catch(() => setAthletes([]))
      .finally(() => setLoading(false));
  }, []);

  const byPhase = PHASE_ORDER.reduce<Record<Phase, AthleteStatus[]>>(
    (acc, p) => {
      acc[p] = athletes.filter((a) => getPhase(a) === p);
      return acc;
    },
    { inicio: [], consolidacao: [], fase_final: [] }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Status dos Planos</h1>
        <p className="mt-0.5 text-sm text-zinc-400">
          {loading
            ? "Carregando..."
            : `${athletes.length} atleta${athletes.length !== 1 ? "s" : ""} monitorados`}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/5" />
          ))}
        </div>
      ) : (
        <>
          {/* Phase summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {PHASE_ORDER.map((phase) => {
              const meta = PHASE_META[phase];
              const count = byPhase[phase].length;
              const pct =
                athletes.length > 0
                  ? Math.round((count / athletes.length) * 100)
                  : 0;
              return (
                <div
                  key={phase}
                  className={`rounded-3xl p-5 ring-1 ${meta.bg} ${meta.ring}`}
                >
                  <div className={`flex items-center gap-2 ${meta.color} mb-3`}>
                    {meta.icon}
                    <span className="font-semibold">{meta.label}</span>
                  </div>
                  <p className={`text-4xl font-bold ${meta.color}`}>{count}</p>
                  <p className="mt-0.5 text-sm text-zinc-400">
                    atleta{count !== 1 ? "s" : ""}
                  </p>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>{meta.desc}</span>
                      <span>{pct}%</span>
                    </div>
                    <ProgressBar
                      value={count}
                      max={athletes.length}
                      barClass={meta.bar}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Athlete lists per phase */}
          {athletes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10 py-16 text-center">
              <p className="font-semibold text-zinc-300">Nenhum atleta cadastrado</p>
              <p className="mt-1 text-sm text-zinc-500">
                Cadastre atletas na aba Atletas para ver o status dos planos.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {PHASE_ORDER.map((phase) => {
                const meta = PHASE_META[phase];
                const list = byPhase[phase];
                if (list.length === 0) return null;
                return (
                  <div key={phase}>
                    <div className={`mb-3 flex items-center gap-2 ${meta.color}`}>
                      {meta.icon}
                      <h2 className="font-semibold">
                        {meta.label}
                        <span className="ml-2 text-sm font-normal text-zinc-500">
                          ({list.length})
                        </span>
                      </h2>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {list.map((a) => {
                        const totalScouts = a._count.scouts;
                        // total meetings = done + remaining
                        const totalMeetings = totalScouts + a.remainingMeetings;
                        const doneMeetings = totalScouts;

                        return (
                          <div
                            key={a.id}
                            className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-white/10">
                                {a.photo ? (
                                  <Image
                                    src={a.photo}
                                    alt={a.name}
                                    fill
                                    className="object-cover"
                                    sizes="36px"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-400">
                                    {a.name[0]?.toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{a.name}</p>
                                <p className="text-xs text-zinc-500">
                                  {a.team} · {a.position}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${meta.badge}`}
                              >
                                {meta.label}
                              </span>
                            </div>

                            <div className="mt-3 space-y-1.5">
                              <div className="flex justify-between text-xs text-zinc-500">
                                <span>
                                  {doneMeetings} scout{doneMeetings !== 1 ? "s" : ""} feito{doneMeetings !== 1 ? "s" : ""}
                                </span>
                                <span>{a.remainingMeetings} restante{a.remainingMeetings !== 1 ? "s" : ""}</span>
                              </div>
                              <ProgressBar
                                value={doneMeetings}
                                max={totalMeetings || 1}
                                barClass={meta.bar}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
