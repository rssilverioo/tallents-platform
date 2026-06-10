"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  BarChart2,
  TrendingUp,
  Zap,
  Shield,
  Users,
  Clock,
  Star,
} from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type AthleteStats = {
  id: string;
  name: string;
  team: string;
  position: string;
  photo: string;
  reportCount: number;
  totalCounts: Record<string, number>;
  avgCounts: Record<string, number>;
  minutesPlayed: { total: number; avg: number | null; gamesWithRecord: number };
  sofaScore: { avg: number; max: number; min: number; gamesRated: number } | null;
};

// ── Seções de contagem (mesmas do scout) ──────────────────────────────────────

const SECTIONS = [
  {
    label: "Passes",
    color: "#60a5fa",
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    keys: [
      ["Passe certo",        "passeCertoOfensivo"],
      ["Passe decisivo",     "passeDecisivo"],
      ["Passe entre linhas", "passeEntreLinhas"],
      ["Passe para trás",    "passeParaTras"],
      ["Passe errado",       "passeErrado"],
      ["Perda de posse",     "perdaPosse"],
    ] as [string, string][],
  },
  {
    label: "Ofensivo",
    color: "#34d399",
    icon: <Zap className="h-3.5 w-3.5" />,
    keys: [
      ["Gol",               "gol"],
      ["Assistência",       "assistencia"],
      ["Final. no gol",     "finalizacaoNoAlvo"],
      ["Finalização",       "finalizacaoFora"],
      ["Cruzamento",        "cruzamento"],
      ["Campo ofensivo",    "passeCampoOfensivo"],
      ["Falta sofrida",     "faltaSofrida"],
      ["Impedimento",       "impedimento"],
      ["Drible completo",   "dribleCompleto"],
      ["Drible incompleto", "dribleIncompleto"],
    ] as [string, string][],
  },
  {
    label: "Defensivo",
    color: "#a78bfa",
    icon: <Shield className="h-3.5 w-3.5" />,
    keys: [
      ["Desarme",           "desarme"],
      ["Interceptação",     "interceptacao"],
      ["Rec. de posse",     "recuperacaoPosse"],
      ["Pressão pós-perda", "pressaoPosPerda"],
      ["Aéreo ganho",       "aereoGanho"],
      ["Aéreo perdido",     "aereoPerdido"],
      ["Campo defensivo",        "passeCampoDefensivo"],
      ["Falta cometida",         "faltaCometida"],
      ["Duelo rasteiro ganho",   "dueloRasteiroGanho"],
      ["Duelo rasteiro perdido", "dueloRasteiroPerdido"],
    ] as [string, string][],
  },
];

// ── Card do atleta ─────────────────────────────────────────────────────────────

function AthleteStatsCard({ athlete }: { athlete: AthleteStats }) {
  const [expanded, setExpanded] = useState(false);

  const c = athlete.totalCounts;
  const avg = athlete.avgCounts;
  const totalActions = Object.values(c).reduce((a, b) => a + b, 0);

  const sectionTotals = SECTIONS.map((sec) => ({
    ...sec,
    total: sec.keys.reduce((s, [, k]) => s + (c[k] ?? 0), 0),
  }));

  const hasData = totalActions > 0;

  return (
    <div className="overflow-hidden rounded-3xl bg-zinc-900 ring-1 ring-white/8 transition duration-200 hover:ring-white/15">
      {/* Cabeçalho do card */}
      <button
        className="flex w-full items-center gap-4 p-5 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Foto */}
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 ring-1 ring-white/10">
          {athlete.photo ? (
            <Image
              src={athlete.photo}
              alt={athlete.name}
              fill
              className="object-cover"
              sizes="44px"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-zinc-400">
              {athlete.name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{athlete.name}</p>
          <p className="text-xs text-zinc-500">
            {athlete.team} · {athlete.position}
          </p>
        </div>

        {/* Chips de resumo */}
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <div className="rounded-xl bg-white/5 px-2.5 py-1.5 text-center ring-1 ring-white/8">
            <p className="text-[10px] text-zinc-500">Scouts</p>
            <p className="text-sm font-bold text-white">{athlete.reportCount}</p>
          </div>
          {hasData && (
            <div className="rounded-xl bg-white/5 px-2.5 py-1.5 text-center ring-1 ring-white/8">
              <p className="text-[10px] text-zinc-500">Ações</p>
              <p className="text-sm font-bold text-white">{totalActions}</p>
            </div>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Painel expandido */}
      {expanded && (
        <div className="border-t border-white/5 p-5 space-y-5">

          {/* Minutos jogados + SofaScore */}
          {(athlete.minutesPlayed.gamesWithRecord > 0 || athlete.sofaScore) && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {athlete.minutesPlayed.gamesWithRecord > 0 && (
                <>
                  <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-sky-400" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                        Min. Totais
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {athlete.minutesPlayed.total}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {athlete.minutesPlayed.gamesWithRecord} jogo{athlete.minutesPlayed.gamesWithRecord !== 1 ? "s" : ""} registrado{athlete.minutesPlayed.gamesWithRecord !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-sky-400" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                        Média / Jogo
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {athlete.minutesPlayed.avg ?? "—"}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">minutos</p>
                  </div>
                </>
              )}

              {athlete.sofaScore && (
                <>
                  <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-400" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                        Nota Média
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {athlete.sofaScore.avg.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {athlete.sofaScore.gamesRated} jogo{athlete.sofaScore.gamesRated !== 1 ? "s" : ""} avaliado{athlete.sofaScore.gamesRated !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-400" />
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                        Melhor / Pior
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {athlete.sofaScore.max.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      mín. {athlete.sofaScore.min.toFixed(1)}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Totais por seção */}
          {hasData && (
            <div className="grid grid-cols-3 gap-2">
              {sectionTotals.map((sec) => (
                <div
                  key={sec.label}
                  className="rounded-2xl bg-white/5 p-3 text-center ring-1 ring-white/10"
                >
                  <div
                    className="mx-auto mb-1 flex h-6 w-6 items-center justify-center"
                    style={{ color: sec.color }}
                  >
                    {sec.icon}
                  </div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: sec.color }}
                  >
                    {sec.label}
                  </p>
                  <p className="text-2xl font-bold text-white mt-0.5">
                    {sec.total}
                  </p>
                  {athlete.reportCount > 0 && (
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      ~{(sec.total / athlete.reportCount).toFixed(1)} / scout
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tabelas detalhadas por seção */}
          {hasData ? (
            <div className="space-y-3">
              {SECTIONS.map((sec) => {
                const rows = sec.keys.filter(([, k]) => (c[k] ?? 0) > 0);
                if (rows.length === 0) return null;
                const maxVal = Math.max(...rows.map(([, k]) => c[k] ?? 0), 1);

                return (
                  <div
                    key={sec.label}
                    className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                  >
                    {/* Título da seção */}
                    <div className="mb-3 flex items-center gap-2">
                      <span style={{ color: sec.color }}>{sec.icon}</span>
                      <p
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: sec.color }}
                      >
                        {sec.label}
                      </p>
                    </div>

                    {/* Header da tabela */}
                    <div className="mb-2 flex items-center gap-3 px-0.5">
                      <span className="w-32 shrink-0 text-[10px] font-semibold uppercase text-zinc-600">
                        Ação
                      </span>
                      <div className="flex-1" />
                      <span className="w-10 shrink-0 text-right text-[10px] font-semibold uppercase text-zinc-600">
                        Total
                      </span>
                      <span className="w-14 shrink-0 text-right text-[10px] font-semibold uppercase text-zinc-600">
                        Média
                      </span>
                    </div>

                    <div className="space-y-2">
                      {rows.map(([label, key]) => {
                        const total = c[key] ?? 0;
                        const media = avg[key] ?? 0;
                        const barPct = Math.round((total / maxVal) * 100);

                        return (
                          <div key={key} className="flex items-center gap-3">
                            <span className="w-32 shrink-0 truncate text-xs text-zinc-400">
                              {label}
                            </span>
                            <div className="flex-1 overflow-hidden rounded-full bg-white/5 h-3">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${barPct}%`,
                                  backgroundColor: sec.color,
                                  opacity: 0.7,
                                }}
                              />
                            </div>
                            <span
                              className="w-10 shrink-0 text-right text-xs font-bold tabular-nums"
                              style={{ color: sec.color }}
                            >
                              {total}
                            </span>
                            <span className="w-14 shrink-0 text-right text-[11px] text-zinc-500 tabular-nums">
                              ~{media}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 py-8 text-center ring-1 ring-white/10">
              <BarChart2 className="mx-auto h-7 w-7 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-500">
                {athlete.reportCount === 0
                  ? "Nenhum scout registrado para este atleta."
                  : "Nenhuma ação registrada nos scouts deste atleta."}
              </p>
            </div>
          )}

          {/* Rodapé com info */}
          {athlete.reportCount > 0 && (
            <p className="text-center text-[11px] text-zinc-600">
              Baseado em {athlete.reportCount} scout
              {athlete.reportCount !== 1 ? "s" : ""} · Média por scout
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function MediasPage() {
  const [athletes, setAthletes] = useState<AthleteStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/athletes/stats")
      .then((r) => r.json())
      .then((d) => setAthletes(d.athletes ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalScouts = athletes.reduce((s, a) => s + a.reportCount, 0);
  const athletesWithData = athletes.filter((a) => a.reportCount > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Médias Gerais</h1>
        <p className="mt-0.5 text-sm text-zinc-400">
          {loading
            ? "Carregando..."
            : `${athletes.length} atleta${athletes.length !== 1 ? "s" : ""} · ${totalScouts} scout${totalScouts !== 1 ? "s" : ""} · ${athletesWithData} com dados`}
        </p>
      </div>

      {/* Chips de resumo */}
      {!loading && athletes.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: "Atletas",
              value: athletes.length,
              color: "bg-blue-500/10 text-blue-300 ring-blue-500/20",
              icon: <Users className="h-3.5 w-3.5" />,
            },
            {
              label: "Scouts registrados",
              value: totalScouts,
              color: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
              icon: <BarChart2 className="h-3.5 w-3.5" />,
            },
          ].map((chip) => (
            <div
              key={chip.label}
              className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 ring-1 text-sm font-semibold ${chip.color}`}
            >
              {chip.icon}
              <span>{chip.value}</span>
              <span className="font-normal text-xs opacity-70">{chip.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/5"
            />
          ))}
        </div>
      ) : athletes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/5 py-16 text-center ring-1 ring-white/10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <Users className="h-7 w-7 text-zinc-500" />
          </div>
          <p className="font-semibold text-zinc-300">Nenhum atleta cadastrado</p>
          <p className="mt-1 text-sm text-zinc-500">
            Cadastre atletas e registre scouts para ver as médias aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {athletes.map((a) => (
            <AthleteStatsCard key={a.id} athlete={a} />
          ))}
        </div>
      )}
    </div>
  );
}
