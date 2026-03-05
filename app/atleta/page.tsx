"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, BarChart2, FileText } from "lucide-react";

type AnalystReport = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  analystName: string;
  createdAt: string;
};

type GoalItem = {
  id: string;
  category: string;
  name: string;
  target: number;
  current: number;
  unit: string;
};

type Meta = {
  id: string;
  title: string;
  season: string;
  description: string;
  analystName: string;
  createdAt: string;
  goals: GoalItem[];
};

type AthleteData = {
  id: string;
  name: string;
  team: string;
  position: string;
  photo: string;
  remainingMeetings: number;
  birthDate: string | null;
  analystReports: AnalystReport[];
  metas: Meta[];
};

function ReportCard({ report, index }: { report: AnalystReport; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(report.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="group rounded-2xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/[0.07] hover:ring-white/20"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <button
        className="w-full p-5 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {report.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-300 ring-1 ring-blue-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="font-semibold text-white leading-snug">{report.title}</h3>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-400">
              <span>{report.analystName}</span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span>{date}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 group-hover:text-zinc-400 transition">
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Recolher" : "Ver detalhes"}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4">
          <p className="text-sm text-zinc-300 leading-relaxed">{report.summary}</p>
        </div>
      )}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, { text: string; bg: string; ring: string }> = {
  "Técnico":     { text: "text-blue-400",    bg: "bg-blue-500/10",    ring: "ring-blue-500/20"    },
  "Físico":      { text: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
  "Tático":      { text: "text-violet-400",  bg: "bg-violet-500/10",  ring: "ring-violet-500/20"  },
  "Mental":      { text: "text-amber-400",   bg: "bg-amber-500/10",   ring: "ring-amber-500/20"   },
  "Estatístico": { text: "text-orange-400",  bg: "bg-orange-500/10",  ring: "ring-orange-500/20"  },
};

function catStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? { text: "text-zinc-400", bg: "bg-zinc-500/10", ring: "ring-zinc-500/20" };
}

function pct(current: number, target: number) {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function progressBarColor(p: number) {
  if (p >= 100) return "bg-emerald-500";
  if (p >= 70)  return "bg-blue-500";
  if (p >= 40)  return "bg-amber-500";
  return "bg-red-500";
}

function progressTextColor(p: number) {
  if (p >= 100) return "text-emerald-400";
  if (p >= 70)  return "text-blue-400";
  if (p >= 40)  return "text-amber-400";
  return "text-red-400";
}

function MetaCard({ meta }: { meta: Meta }) {
  const [expanded, setExpanded] = useState(false);
  const goals = Array.isArray(meta.goals) ? meta.goals : [];
  const avgProgress = goals.length
    ? Math.round(goals.reduce((s, g) => s + pct(g.current, g.target), 0) / goals.length)
    : 0;
  const completed = goals.filter((g) => pct(g.current, g.target) >= 100).length;

  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/[0.07]">
      <button className="w-full p-5 text-left" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300 ring-1 ring-blue-500/20">
                {meta.season}
              </span>
            </div>
            <h3 className="font-semibold text-white leading-snug">{meta.title}</h3>
            <p className="mt-1 text-xs text-zinc-500">{meta.analystName}</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className={`text-xl font-bold ${progressTextColor(avgProgress)}`}>{avgProgress}%</p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">progresso</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-400">{completed}</p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">metas batidas</p>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progressBarColor(avgProgress)}`}
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 transition group-hover:text-zinc-400">
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Recolher" : `Ver ${goals.length} objetivo${goals.length !== 1 ? "s" : ""}`}
        </div>
      </button>

      {expanded && goals.length > 0 && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-3">
          {meta.description && (
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">{meta.description}</p>
          )}
          {goals.map((goal) => {
            const p = pct(goal.current, goal.target);
            const cc = catStyle(goal.category);
            return (
              <div key={goal.id}>
                <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${cc.bg} ${cc.text} ${cc.ring}`}>
                    {goal.category}
                  </span>
                  <span className="text-xs font-medium text-white flex-1 min-w-0">{goal.name}</span>
                  <span className={`text-xs font-bold shrink-0 ${progressTextColor(p)}`}>
                    {goal.current}/{goal.target} {goal.unit}
                  </span>
                  <span className={`text-xs font-bold shrink-0 ${progressTextColor(p)}`}>{p}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${progressBarColor(p)}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AtletaPage() {
  const [athlete, setAthlete] = useState<AthleteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/athlete/me")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/loginAtleta");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.athlete) setAthlete(data.athlete);
      })
      .catch(() => router.replace("/loginAtleta"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/athlete/logout", { method: "POST" });
    router.replace("/loginAtleta");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-400">Carregando sua área...</p>
        </div>
      </div>
    );
  }

  if (!athlete) return null;

  const reports = athlete.analystReports;
  const hasReports = reports.length > 0;

  const positionBadgeColor =
    athlete.position === "Atacante"
      ? "text-red-400 bg-red-500/10 ring-red-500/20"
      : athlete.position === "Meia"
      ? "text-violet-400 bg-violet-500/10 ring-violet-500/20"
      : athlete.position === "Zagueiro" || athlete.position === "Lateral"
      ? "text-blue-400 bg-blue-500/10 ring-blue-500/20"
      : athlete.position === "Goleiro"
      ? "text-amber-400 bg-amber-500/10 ring-amber-500/20"
      : "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-125 w-125 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-96 rounded-full bg-violet-500/8 blur-3xl" />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
              <Image src="/logo.png" alt="Tallents" fill className="object-contain p-1" />
            </div>
            <span className="text-sm font-semibold text-white">Tallents</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-400 sm:block">
              Olá, <span className="font-medium text-white">{athlete.name.split(" ")[0]}</span>
            </span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              {loggingOut ? "Saindo..." : "Sair"}
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 py-8">
        {/* Profile hero */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10">
          <div className="h-24 bg-[linear-gradient(135deg,rgba(16,185,129,0.3),rgba(59,130,246,0.2))]" />

          <div className="px-6 pb-6">
            <div className="relative -mt-12 mb-4 flex items-end gap-5">
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-zinc-800 ring-4 ring-zinc-950 shrink-0">
                {athlete.photo ? (
                  <Image
                    src={athlete.photo}
                    alt={athlete.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-zinc-500">
                    {athlete.name[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div className="mb-1 flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-zinc-300">
                    {athlete.remainingMeetings} reuniões disponíveis
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{athlete.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${positionBadgeColor}`}>
                    {athlete.position}
                  </span>
                  <span className="text-sm text-zinc-400">{athlete.team}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reports section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Relatórios dos analistas</h2>
              <p className="text-sm text-zinc-500">
                {hasReports
                  ? `${reports.length} relatório${reports.length > 1 ? "s" : ""} disponíve${reports.length > 1 ? "is" : "l"}`
                  : "Nenhum relatório ainda"}
              </p>
            </div>
          </div>

          {hasReports ? (
            <div className="space-y-3">
              {reports.map((report, i) => (
                <ReportCard key={report.id} report={report} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <FileText className="h-8 w-8 text-zinc-500" />
              </div>
              <p className="font-semibold text-zinc-300">Nenhum relatório ainda</p>
              <p className="mt-1 text-sm text-zinc-500">
                Os relatórios dos analistas aparecerão aqui assim que forem publicados.
              </p>
            </div>
          )}
        </div>

        {/* Metas section */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Metas da Temporada</h2>
            <p className="text-sm text-zinc-500">
              {athlete.metas.length > 0
                ? `${athlete.metas.length} ficha${athlete.metas.length > 1 ? "s" : ""} de objetivos`
                : "Nenhuma meta definida ainda"}
            </p>
          </div>

          {athlete.metas.length > 0 ? (
            <div className="space-y-3">
              {athlete.metas.map((meta) => (
                <MetaCard key={meta.id} meta={meta} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <BarChart2 className="h-8 w-8 text-zinc-500" />
              </div>
              <p className="font-semibold text-zinc-300">Nenhuma meta definida</p>
              <p className="mt-1 text-sm text-zinc-500">
                As metas da temporada aparecerão aqui quando forem criadas pelo analista.
              </p>
            </div>
          )}
        </div>

        <div className="mt-12 border-t border-white/5 pt-6 text-center text-xs text-zinc-600">
          Tallents Platform · Área restrita do atleta
        </div>
      </main>
    </div>
  );
}
