"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type AnalystReport = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  rating: number;
  intensity: number;
  decision: number;
  positioning: number;
  analystName: string;
  createdAt: string;
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
};

function MetricBar({ label, value, color = "blue" }: { label: string; value: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
  };
  const bar = colorMap[color] ?? "bg-blue-500";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <span className="text-xs font-bold text-white">{value}<span className="text-zinc-500">/10</span></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RatingCircle({ value }: { value: number }) {
  const pct = (value / 10) * 100;
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const color =
    value >= 8 ? "#10b981" : value >= 6 ? "#3b82f6" : value >= 4 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg className="-rotate-90" width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <span className="absolute text-lg font-bold text-white">{value}</span>
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

  const ratingColor =
    report.rating >= 8
      ? "text-emerald-400"
      : report.rating >= 6
      ? "text-blue-400"
      : "text-amber-400";

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
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span className={`text-2xl font-bold ${ratingColor}`}>{report.rating}</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">nota</span>
          </div>
        </div>

        {/* Expand indicator */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 group-hover:text-zinc-400 transition">
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? "Recolher" : "Ver detalhes"}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4">
          <p className="text-sm text-zinc-300 leading-relaxed mb-4">{report.summary}</p>
          <div className="grid grid-cols-2 gap-3">
            <MetricBar label="Avaliação geral" value={report.rating} color="emerald" />
            <MetricBar label="Intensidade" value={report.intensity} color="blue" />
            <MetricBar label="Tomada de decisão" value={report.decision} color="violet" />
            <MetricBar label="Posicionamento" value={report.positioning} color="amber" />
          </div>
        </div>
      )}
    </div>
  );
}

function avg(reports: AnalystReport[], key: keyof Pick<AnalystReport, "rating" | "intensity" | "decision" | "positioning">) {
  if (!reports.length) return 0;
  return Math.round((reports.reduce((s, r) => s + r[key], 0) / reports.length) * 10) / 10;
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
  const avgRating = avg(reports, "rating");
  const avgIntensity = avg(reports, "intensity");
  const avgDecision = avg(reports, "decision");
  const avgPositioning = avg(reports, "positioning");

  const overallScore =
    hasReports
      ? Math.round(((avgRating + avgIntensity + avgDecision + avgPositioning) / 4) * 10) / 10
      : 0;

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
        <div className="absolute -top-60 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
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
          {/* Gradient top stripe */}
          <div className="h-24 bg-[linear-gradient(135deg,rgba(16,185,129,0.3),rgba(59,130,246,0.2))]" />

          <div className="px-6 pb-6">
            {/* Avatar */}
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

              {/* Meetings badge */}
              <div className="mb-1 flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-zinc-300">
                    {athlete.remainingMeetings} reuniões disponíveis
                  </span>
                </div>
              </div>
            </div>

            {/* Info */}
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

              {hasReports && (
                <div className="flex items-center gap-3">
                  <RatingCircle value={overallScore} />
                  <div>
                    <p className="text-xs text-zinc-500">Score geral</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{reports.length} relatório{reports.length > 1 ? "s" : ""}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        {hasReports && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Avaliação geral", value: avgRating, color: "emerald" },
              { label: "Intensidade", value: avgIntensity, color: "blue" },
              { label: "Decisão", value: avgDecision, color: "violet" },
              { label: "Posicionamento", value: avgPositioning, color: "amber" },
            ].map(({ label, value, color }) => {
              const colorMap: Record<string, { text: string; bg: string; ring: string }> = {
                emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
                blue: { text: "text-blue-400", bg: "bg-blue-500/10", ring: "ring-blue-500/20" },
                violet: { text: "text-violet-400", bg: "bg-violet-500/10", ring: "ring-violet-500/20" },
                amber: { text: "text-amber-400", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
              };
              const c = colorMap[color];
              return (
                <div
                  key={label}
                  className={`rounded-2xl ${c.bg} ring-1 ${c.ring} p-4 flex flex-col gap-1`}
                >
                  <span className="text-xs text-zinc-400">{label}</span>
                  <span className={`text-3xl font-bold ${c.text}`}>{value}</span>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider">média</span>
                </div>
              );
            })}
          </div>
        )}

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
                <svg className="h-8 w-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <p className="font-semibold text-zinc-300">Nenhum relatório ainda</p>
              <p className="mt-1 text-sm text-zinc-500">
                Os relatórios dos analistas aparecerão aqui assim que forem publicados.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-12 border-t border-white/5 pt-6 text-center text-xs text-zinc-600">
          Tallents Platform · Área restrita do atleta
        </div>
      </main>
    </div>
  );
}
