"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  BarChart2,
  FileText,
  Target,
  User,
  LogOut,
  Trophy,
  TrendingUp,
  Shield,
  LayoutDashboard,
} from "lucide-react";

type ScoutCounts = Record<string, number>;

type AnalystReport = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  analystName: string;
  createdAt: string;
  counts: ScoutCounts | null;
};

const COUNT_SECTIONS = [
  {
    label: "Passes",
    color: "#60a5fa",
    keys: [
      ["Passe certo",        "passeCertoOfensivo"],
      ["Passe decisivo",     "passeDecisivo"],
      ["Passe entre linhas", "passeEntreLinhas"],
      ["Passe para trás",    "passeParaTras"],
      ["Passe errado",       "passeErrado"],
      ["Perca da posse",     "perdaPosse"],
    ],
  },
  {
    label: "Ofensivo",
    color: "#34d399",
    keys: [
      ["Gol",               "gol"],
      ["Assistência",       "assistencia"],
      ["Final. no alvo",    "finalizacaoNoAlvo"],
      ["Finalização fora",  "finalizacaoFora"],
      ["Cruzamento",        "cruzamento"],
      ["Campo ofensivo",    "passeCampoOfensivo"],
      ["Falta sofrida",     "faltaSofrida"],
      ["Impedimento",       "impedimento"],
      ["Drible completo",   "dribleCompleto"],
      ["Drible incompleto", "dribleIncompleto"],
    ],
  },
  {
    label: "Defensivo",
    color: "#a78bfa",
    keys: [
      ["Desarme",           "desarme"],
      ["Interceptação",     "interceptacao"],
      ["Rec. de posse",     "recuperacaoPosse"],
      ["Pressão pós-perda", "pressaoPosPerda"],
      ["Aéreo ganho",       "aereoGanho"],
      ["Aéreo perdido",     "aereoPerdido"],
      ["Campo defensivo",   "passeCampoDefensivo"],
      ["Falta cometida",    "faltaCometida"],
    ],
  },
] as const;

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

type ScoutReport = {
  rating: number;
  intensity: number;
  decision: number;
  positioning: number;
};

type Scout = {
  id: string;
  createdAt: string;
  counts: ScoutCounts;
  report: ScoutReport | null;
};

type AthleteData = {
  id: string;
  name: string;
  team: string;
  position: string;
  photo: string;
  remainingMeetings: number;
  birthDate: string | null;
  planType: string | null;
  planStartDate: string | null;
  planEndDate: string | null;
  analystReports: AnalystReport[];
  metas: Meta[];
  scouts: Scout[];
};

type Section = "dashboard" | "relatorios" | "metas" | "perfil";

// ─── SVG Pie Chart ─────────────────────────────────────────────────────────
function PieChart({ data, size = 100 }: { data: Array<{ label: string; value: number; color: string }>; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const R = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;
  let cumAngle = -Math.PI / 2;

  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const x1 = cx + R * Math.cos(startAngle);
    const y1 = cy + R * Math.sin(startAngle);
    const x2 = cx + R * Math.cos(endAngle);
    const y2 = cy + R * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M${cx},${cy} L${x1},${y1} A${R},${R},0,${largeArc},1,${x2},${y2} Z`;
    return { ...d, path, pct: Math.round((d.value / total) * 100) };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-20 w-20 shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="#09090b" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="space-y-1.5 min-w-0 flex-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-zinc-400 truncate flex-1">{s.label}</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: s.color }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-5">
          <p className="text-sm text-zinc-300 leading-relaxed">{report.summary}</p>

          {report.counts && (() => {
            const c = report.counts as ScoutCounts;
            const totalActions = Object.values(c).reduce((a, b) => a + (b ?? 0), 0);
            if (totalActions === 0) return null;

            const chartRows: { label: string; value: number; color: string }[] = [];
            for (const sec of COUNT_SECTIONS) {
              for (const [label, key] of sec.keys) {
                const val = c[key] ?? 0;
                if (val > 0) chartRows.push({ label, value: val, color: sec.color });
              }
            }
            const maxVal = Math.max(...chartRows.map((r) => r.value), 1);

            return (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Ações registradas ({totalActions} total)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {COUNT_SECTIONS.map((sec) => {
                      const total = sec.keys.reduce((s, [, k]) => s + (c[k] ?? 0), 0);
                      return (
                        <div key={sec.label} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 text-center">
                          <p className="text-[10px] uppercase tracking-wider" style={{ color: sec.color }}>{sec.label}</p>
                          <p className="text-2xl font-bold text-white mt-0.5">{total}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {COUNT_SECTIONS.map((sec) => {
                    const rows = sec.keys.filter(([, k]) => (c[k] ?? 0) > 0);
                    if (rows.length === 0) return null;
                    return (
                      <div key={sec.label} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: sec.color }}>{sec.label}</p>
                        <div className="space-y-1">
                          {rows.map(([label, key]) => (
                            <div key={key} className="flex items-center justify-between gap-2">
                              <span className="text-xs text-zinc-400 truncate">{label}</span>
                              <span className="text-sm font-bold tabular-nums" style={{ color: sec.color }}>{c[key] ?? 0}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {chartRows.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Gráfico das ações</p>
                    <div className="space-y-2">
                      {chartRows.map((row) => (
                        <div key={row.label} className="flex items-center gap-3">
                          <span className="w-32 shrink-0 truncate text-right text-xs text-zinc-400">{row.label}</span>
                          <div className="flex-1 overflow-hidden rounded-full bg-white/5 h-5">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.round((row.value / maxVal) * 100)}%`, backgroundColor: row.color }}
                            />
                          </div>
                          <span className="w-6 shrink-0 text-xs font-bold tabular-nums text-white">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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

        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 transition">
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

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard",  label: "Dashboard",   icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "relatorios", label: "Relatórios",  icon: <FileText className="h-4 w-4" /> },
  { id: "metas",      label: "Metas",       icon: <Target className="h-4 w-4" /> },
  { id: "perfil",     label: "Perfil",      icon: <User className="h-4 w-4" /> },
];

export default function AtletaPage() {
  const [athlete, setAthlete] = useState<AthleteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
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
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-125 w-125 -translate-x-1/2 rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-64 w-64 rounded-full bg-blue-600/8 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-96 rounded-full bg-violet-500/6 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.06),transparent_55%)]" />
      </div>

      <div className="relative flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-white/5 bg-zinc-950/90 backdrop-blur-xl">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-white/5 px-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                <Image src="/logo.png" alt="Tallents" fill className="object-contain p-1" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">Tallents</span>
            </Link>
          </div>

          {/* Athlete mini card */}
          <div className="px-4 py-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-zinc-800 ring-2 ring-white/10">
                {athlete.photo ? (
                  <Image
                    src={athlete.photo}
                    alt={athlete.name}
                    fill
                    className="object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-zinc-400">
                    {athlete.name[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{athlete.name.split(" ")[0]}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${positionBadgeColor}`}>
                  {athlete.position}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 ring-1 ring-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-300">
                {athlete.remainingMeetings} reuniões disponíveis
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Menu
            </p>
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <span className={`transition-colors ${isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {item.id === "dashboard" && (athlete.scouts ?? []).length > 0 && (
                    <span className="ml-auto rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">
                      {(athlete.scouts ?? []).length}
                    </span>
                  )}
                  {item.id === "relatorios" && reports.length > 0 && (
                    <span className="ml-auto rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">
                      {reports.length}
                    </span>
                  )}
                  {item.id === "metas" && athlete.metas.length > 0 && (
                    <span className="ml-auto rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      {athlete.metas.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-white/5 p-3">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Saindo..." : "Sair da conta"}
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 pl-64">
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-16 items-center border-b border-white/5 bg-zinc-950/80 px-8 backdrop-blur-xl">
            <div>
              <h1 className="text-base font-bold text-white">
                {activeSection === "dashboard"  && "Dashboard"}
                {activeSection === "relatorios" && "Relatórios"}
                {activeSection === "metas"      && "Metas da Temporada"}
                {activeSection === "perfil"     && "Meu Perfil"}
              </h1>
              <p className="text-xs text-zinc-500">
                {activeSection === "dashboard"  && "Visão geral do seu desempenho"}
                {activeSection === "relatorios" && `${reports.length} relatório${reports.length !== 1 ? "s" : ""} disponíve${reports.length !== 1 ? "is" : "l"}`}
                {activeSection === "metas"      && `${athlete.metas.length} ficha${athlete.metas.length !== 1 ? "s" : ""} de objetivos`}
                {activeSection === "perfil"     && athlete.team}
              </p>
            </div>
          </header>

          {/* Content */}
          <main className="p-8">
            {/* ── Dashboard ── */}
            {activeSection === "dashboard" && (() => {
              const scouts = athlete.scouts ?? [];
              const allCounts: ScoutCounts = {};
              for (const s of scouts) {
                for (const [k, v] of Object.entries(s.counts ?? {})) {
                  allCounts[k] = (allCounts[k] ?? 0) + (v as number);
                }
              }
              const totalActions = Object.values(allCounts).reduce((a, b) => a + b, 0);

              // Average metrics from reports
              const reportsWithMetrics = scouts.filter((s) => s.report);
              const avgRating = reportsWithMetrics.length
                ? Math.round(reportsWithMetrics.reduce((s, r) => s + (r.report?.rating ?? 0), 0) / reportsWithMetrics.length * 10) / 10
                : null;
              const avgIntensity = reportsWithMetrics.length
                ? Math.round(reportsWithMetrics.reduce((s, r) => s + (r.report?.intensity ?? 0), 0) / reportsWithMetrics.length * 10) / 10
                : null;
              const avgDecision = reportsWithMetrics.length
                ? Math.round(reportsWithMetrics.reduce((s, r) => s + (r.report?.decision ?? 0), 0) / reportsWithMetrics.length * 10) / 10
                : null;
              const avgPositioning = reportsWithMetrics.length
                ? Math.round(reportsWithMetrics.reduce((s, r) => s + (r.report?.positioning ?? 0), 0) / reportsWithMetrics.length * 10) / 10
                : null;

              // Pie chart: pass accuracy
              const passCorrect = (allCounts.passeCertoOfensivo ?? 0) + (allCounts.passeDecisivo ?? 0) + (allCounts.passeEntreLinhas ?? 0) + (allCounts.passeParaTras ?? 0);
              const passWrong = (allCounts.passeErrado ?? 0) + (allCounts.perdaPosse ?? 0);

              // Pie chart: offensive vs defensive actions
              const totalOff = COUNT_SECTIONS[1].keys.reduce((s, [, k]) => s + (allCounts[k] ?? 0), 0);
              const totalDef = COUNT_SECTIONS[2].keys.reduce((s, [, k]) => s + (allCounts[k] ?? 0), 0);
              const totalPass = COUNT_SECTIONS[0].keys.reduce((s, [, k]) => s + (allCounts[k] ?? 0), 0);

              // Best actions
              const chartRows: { label: string; value: number; color: string }[] = [];
              for (const sec of COUNT_SECTIONS) {
                for (const [label, key] of sec.keys) {
                  const val = allCounts[key] ?? 0;
                  if (val > 0) chartRows.push({ label, value: val, color: sec.color });
                }
              }
              chartRows.sort((a, b) => b.value - a.value);
              const top5 = chartRows.slice(0, 5);
              const maxVal = Math.max(...top5.map((r) => r.value), 1);

              // Metas overall progress
              const allGoals = athlete.metas.flatMap((m) => Array.isArray(m.goals) ? m.goals : []);
              const overallPct = allGoals.length
                ? Math.round(allGoals.reduce((s, g) => s + pct(g.current, g.target), 0) / allGoals.length)
                : null;

              return (
                <div className="space-y-5">
                  {scouts.length === 0 ? (
                    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-16 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                        <BarChart2 className="h-8 w-8 text-zinc-500" />
                      </div>
                      <p className="font-semibold text-zinc-300">Nenhum dado ainda</p>
                      <p className="mt-1 text-sm text-zinc-500">O dashboard será preenchido conforme os scouts forem registrados.</p>
                    </div>
                  ) : (
                    <>
                      {/* KPI row */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          { label: "Scouts",       value: scouts.length,   color: "text-blue-400",    icon: <FileText className="h-4 w-4" /> },
                          { label: "Ações totais", value: totalActions,    color: "text-emerald-400", icon: <TrendingUp className="h-4 w-4" /> },
                          { label: "Relatórios",   value: reports.length,  color: "text-violet-400",  icon: <Trophy className="h-4 w-4" /> },
                          { label: "Metas",        value: athlete.metas.length, color: "text-amber-400", icon: <Target className="h-4 w-4" /> },
                        ].map((kpi) => (
                          <div key={kpi.label} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 text-center">
                            <div className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 ${kpi.color}`}>
                              {kpi.icon}
                            </div>
                            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">{kpi.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Average metrics */}
                      {avgRating !== null && (
                        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden">
                          <div className="border-b border-white/5 px-5 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Médias de desempenho ({reportsWithMetrics.length} scouts)</p>
                          </div>
                          <div className="grid grid-cols-2 gap-px bg-white/5 sm:grid-cols-4">
                            {[
                              { label: "Rating geral", value: avgRating,      color: "#60a5fa" },
                              { label: "Intensidade",  value: avgIntensity,   color: "#34d399" },
                              { label: "Decisão",      value: avgDecision,    color: "#a78bfa" },
                              { label: "Posicionamento", value: avgPositioning, color: "#fbbf24" },
                            ].map((m) => (
                              <div key={m.label} className="bg-zinc-950 px-5 py-4 text-center">
                                <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}/10</p>
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-0.5">{m.label}</p>
                                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
                                  <div className="h-full rounded-full" style={{ width: `${((m.value ?? 0) / 10) * 100}%`, backgroundColor: m.color }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action distribution + pass accuracy */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Category distribution pie */}
                        {(totalPass + totalOff + totalDef) > 0 && (
                          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Distribuição de ações</p>
                            <PieChart data={[
                              { label: "Passes",    value: totalPass, color: "#60a5fa" },
                              { label: "Ofensivo",  value: totalOff,  color: "#34d399" },
                              { label: "Defensivo", value: totalDef,  color: "#a78bfa" },
                            ].filter((d) => d.value > 0)} />
                          </div>
                        )}

                        {/* Pass accuracy pie */}
                        {(passCorrect + passWrong) > 0 && (
                          <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Precisão de passe</p>
                            <PieChart data={[
                              { label: "Passes certos", value: passCorrect, color: "#34d399" },
                              { label: "Passes errados", value: passWrong,  color: "#f87171" },
                            ]} />
                          </div>
                        )}
                      </div>

                      {/* Top 5 actions bar chart */}
                      {top5.length > 0 && (
                        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Top ações mais realizadas</p>
                          <div className="space-y-3">
                            {top5.map((row) => (
                              <div key={row.label} className="flex items-center gap-3">
                                <span className="w-32 shrink-0 truncate text-right text-xs text-zinc-400">{row.label}</span>
                                <div className="flex-1 overflow-hidden rounded-full bg-white/5 h-5">
                                  <div className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.round((row.value / maxVal) * 100)}%`, backgroundColor: row.color }} />
                                </div>
                                <span className="w-8 shrink-0 text-xs font-bold tabular-nums text-white">{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metas progress bar */}
                      {overallPct !== null && (
                        <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Progresso geral das metas</p>
                            <span className={`text-sm font-bold ${progressTextColor(overallPct)}`}>{overallPct}%</span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                            <div className={`h-full rounded-full transition-all duration-700 ${progressBarColor(overallPct)}`} style={{ width: `${overallPct}%` }} />
                          </div>
                          <p className="mt-2 text-xs text-zinc-500">
                            {allGoals.filter((g) => pct(g.current, g.target) >= 100).length} de {allGoals.length} objetivos concluídos
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {/* ── Relatórios ── */}
            {activeSection === "relatorios" && (
              <div>
                {reports.length > 0 ? (
                  <div className="space-y-3">
                    {reports.map((report, i) => (
                      <ReportCard key={report.id} report={report} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-16 text-center">
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
            )}

            {/* ── Metas ── */}
            {activeSection === "metas" && (
              <div>
                {athlete.metas.length > 0 ? (
                  <div className="space-y-3">
                    {athlete.metas.map((meta) => (
                      <MetaCard key={meta.id} meta={meta} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-16 text-center">
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
            )}

            {/* ── Perfil ── */}
            {activeSection === "perfil" && (
              <div className="space-y-6">
                {/* Cover + avatar */}
                <div className="overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10">
                  <div className="h-32 bg-[linear-gradient(135deg,rgba(16,185,129,0.35),rgba(59,130,246,0.25),rgba(139,92,246,0.2))]" />
                  <div className="px-7 pb-7">
                    <div className="relative -mt-14 mb-5 flex items-end gap-5">
                      <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-zinc-800 ring-4 ring-zinc-950 shrink-0">
                        {athlete.photo ? (
                          <Image
                            src={athlete.photo}
                            alt={athlete.name}
                            fill
                            className="object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-zinc-500">
                            {athlete.name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="mb-1">
                        <h2 className="text-2xl font-bold tracking-tight text-white">{athlete.name}</h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${positionBadgeColor}`}>
                            {athlete.position}
                          </span>
                          <span className="text-sm text-zinc-400">{athlete.team}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{reports.length}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Relatórios</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                      <Target className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{athlete.metas.length}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Fichas de metas</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                      <Trophy className="h-5 w-5 text-violet-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{athlete.remainingMeetings}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Reuniões</p>
                  </div>
                </div>

                {/* Info card */}
                <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5">
                      <Shield className="h-4 w-4 text-zinc-400" />
                    </div>
                    <p className="text-sm font-semibold text-white">Informações do atleta</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    <InfoRow label="Nome completo" value={athlete.name} />
                    <InfoRow label="Posição" value={athlete.position} />
                    <InfoRow label="Time" value={athlete.team} />
                    {athlete.birthDate && (
                      <InfoRow
                        label="Data de nascimento"
                        value={new Date(athlete.birthDate).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                      />
                    )}
                  {athlete.planType && <InfoRow label="Tipo de plano" value={athlete.planType} />}
                  {athlete.planStartDate && (
                    <InfoRow label="Início do plano" value={new Date(athlete.planStartDate).toLocaleDateString("pt-BR")} />
                  )}
                  {athlete.planEndDate && (
                    <InfoRow label="Término do plano" value={new Date(athlete.planEndDate).toLocaleDateString("pt-BR")} />
                  )}
                  </div>
                </div>

                {/* Progress summary */}
                {athlete.metas.length > 0 && (() => {
                  const allGoals = athlete.metas.flatMap((m) => (Array.isArray(m.goals) ? m.goals : []));
                  if (allGoals.length === 0) return null;
                  const overallPct = Math.round(
                    allGoals.reduce((s, g) => s + pct(g.current, g.target), 0) / allGoals.length
                  );
                  const completed = allGoals.filter((g) => pct(g.current, g.target) >= 100).length;
                  return (
                    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden">
                      <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5">
                          <TrendingUp className="h-4 w-4 text-zinc-400" />
                        </div>
                        <p className="text-sm font-semibold text-white">Progresso geral das metas</p>
                      </div>
                      <div className="px-6 py-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">{completed} de {allGoals.length} objetivos concluídos</span>
                          <span className={`text-sm font-bold ${progressTextColor(overallPct)}`}>{overallPct}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${progressBarColor(overallPct)}`}
                            style={{ width: `${overallPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-3.5">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
