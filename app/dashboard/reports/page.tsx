"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────

type AthleteOption = {
  id: string;
  name: string;
  team: string;
  position: string;
  photo: string;
};

type Clip = {
  id: string;
  start: number;
  end: number;
  createdAt: number;
  label: string;
  description: string;
  confidence: "baixa" | "média" | "alta";
};

type Report = {
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
  clips: Clip[];
  athlete: AthleteOption;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const METRIC_LABELS: { key: keyof Pick<Report, "rating" | "intensity" | "decision" | "positioning">; label: string; color: string }[] = [
  { key: "rating",      label: "Avaliação geral",    color: "emerald" },
  { key: "intensity",   label: "Intensidade",         color: "blue"    },
  { key: "decision",    label: "Tomada de decisão",   color: "violet"  },
  { key: "positioning", label: "Posicionamento",      color: "amber"   },
];

const COLOR = {
  emerald: { bar: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
  blue:    { bar: "bg-blue-500",    text: "text-blue-400",    bg: "bg-blue-500/10",    ring: "ring-blue-500/20"    },
  violet:  { bar: "bg-violet-500",  text: "text-violet-400",  bg: "bg-violet-500/10",  ring: "ring-violet-500/20"  },
  amber:   { bar: "bg-amber-500",   text: "text-amber-400",   bg: "bg-amber-500/10",   ring: "ring-amber-500/20"   },
} as const;

function ratingColor(v: number) {
  if (v >= 8) return "text-emerald-400";
  if (v >= 6) return "text-blue-400";
  if (v >= 4) return "text-amber-400";
  return "text-red-400";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function avg(reports: Report[], key: keyof Pick<Report, "rating" | "intensity" | "decision" | "positioning">) {
  if (!reports.length) return 0;
  return Math.round((reports.reduce((s, r) => s + r[key], 0) / reports.length) * 10) / 10;
}

// ── MetricBar ─────────────────────────────────────────────────────────────────

function MetricBar({ label, value, color }: { label: string; value: number; color: keyof typeof COLOR }) {
  const c = COLOR[color];
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className={`text-xs font-bold ${c.text}`}>{value}<span className="text-zinc-600">/10</span></span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${c.bar}`}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── MetricSlider ──────────────────────────────────────────────────────────────

function MetricSlider({ label, value, color, onChange }: {
  label: string; value: number; color: keyof typeof COLOR;
  onChange: (v: number) => void;
}) {
  const c = COLOR[color];
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <span className={`text-sm font-bold ${c.text}`}>{value}<span className="text-zinc-600">/10</span></span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500 h-1.5 cursor-pointer"
      />
      <div className="mt-0.5 flex justify-between text-[10px] text-zinc-700">
        <span>0</span><span>5</span><span>10</span>
      </div>
    </div>
  );
}

// ── ReportCard ────────────────────────────────────────────────────────────────

function ReportCard({ report }: { report: Report }) {
  const [expanded, setExpanded] = useState(false);
  const hasPhoto = Boolean(report.athlete.photo);
  const overallScore = Math.round(
    ((report.rating + report.intensity + report.decision + report.positioning) / 4) * 10
  ) / 10;

  return (
    <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/[0.07] hover:ring-white/20">
      <div className="p-5">
        {/* Athlete row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-white/10">
            {hasPhoto ? (
              <Image src={report.athlete.photo} alt={report.athlete.name} fill className="object-cover" sizes="40px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-zinc-400">
                {report.athlete.name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{report.athlete.name}</p>
            <p className="text-xs text-zinc-500">{report.athlete.team} · {report.athlete.position}</p>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-2xl font-bold ${ratingColor(overallScore)}`}>{overallScore}</span>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">score</p>
          </div>
        </div>

        {/* Title + meta */}
        <h3 className="font-semibold text-white leading-snug">{report.title}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span>por {report.analystName}</span>
          <span className="h-1 w-1 rounded-full bg-zinc-700" />
          <span>{formatDate(report.createdAt)}</span>
        </div>

        {/* Tags */}
        {report.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {report.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-300 ring-1 ring-blue-500/20">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Metrics preview */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {METRIC_LABELS.map(({ key, label, color }) => {
            const c = COLOR[color as keyof typeof COLOR];
            return (
              <div key={key} className={`rounded-xl ${c.bg} ring-1 ${c.ring} p-2 text-center`}>
                <p className={`text-base font-bold ${c.text}`}>{report[key]}</p>
                <p className="text-[9px] text-zinc-500 leading-tight mt-0.5">{label.split(" ")[0]}</p>
              </div>
            );
          })}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 text-xs text-zinc-400 ring-1 ring-white/5 transition hover:bg-white/10 hover:text-zinc-200"
        >
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? "Recolher" : "Ver resumo e métricas"}
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">{report.summary}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {METRIC_LABELS.map(({ key, label, color }) => (
              <MetricBar key={key} label={label} value={report[key]} color={color as keyof typeof COLOR} />
            ))}
          </div>

          {/* Clips */}
          {report.clips?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Lances cortados ({report.clips.length})
              </p>
              <div className="space-y-2">
                {report.clips.map((c) => {
                  const confStyle =
                    c.confidence === "alta"
                      ? "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20"
                      : c.confidence === "média"
                      ? "text-amber-400 bg-amber-500/10 ring-amber-500/20"
                      : "text-zinc-400 bg-white/5 ring-white/10";
                  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
                  return (
                    <div key={c.id} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">{c.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${confStyle}`}>
                          {c.confidence}
                        </span>
                        <span className="text-xs text-zinc-500">{fmt(c.start)} → {fmt(c.end)}</span>
                      </div>
                      {c.description && (
                        <p className="mt-1 text-xs text-zinc-400">{c.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── EMPTY_METRICS + FORM ──────────────────────────────────────────────────────

const EMPTY_FORM = {
  athleteId: "",
  title: "",
  summary: "",
  tags: "",
  rating: 7,
  intensity: 7,
  decision: 7,
  positioning: 7,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAthleteId, setFilterAthleteId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const firstInputRef = useRef<HTMLSelectElement>(null);

  const fetchReports = useCallback(async (aId = "") => {
    setLoading(true);
    try {
      const url = aId ? `/api/analyst-reports?athleteId=${aId}` : "/api/analyst-reports";
      const res = await fetch(url);
      const data = await res.json();
      setReports(data.reports ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // load athletes + reports in parallel
    Promise.all([
      fetch("/api/athletes").then((r) => r.json()),
      fetch("/api/analyst-reports").then((r) => r.json()),
    ]).then(([aData, rData]) => {
      setAthletes(aData.athletes ?? []);
      setReports(rData.reports ?? []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchReports(filterAthleteId);
  }, [filterAthleteId, fetchReports]);

  function openModal() {
    setForm(EMPTY_FORM);
    setErro("");
    setModalOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }

  function closeModal() {
    setModalOpen(false);
    setErro("");
  }

  function setMetric(key: "rating" | "intensity" | "decision" | "positioning") {
    return (v: number) => setForm((f) => ({ ...f, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSaving(true);
    try {
      const res = await fetch("/api/analyst-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data?.error || "Erro ao salvar."); return; }
      closeModal();
      fetchReports(filterAthleteId);
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  // Stats
  const avgRating      = avg(reports, "rating");
  const avgIntensity   = avg(reports, "intensity");
  const avgDecision    = avg(reports, "decision");
  const avgPositioning = avg(reports, "positioning");

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Relatórios</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {loading ? "Carregando..." : `${reports.length} relatório${reports.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter by athlete */}
          <select
            value={filterAthleteId}
            onChange={(e) => setFilterAthleteId(e.target.value)}
            className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
          >
            <option value="">Todos os atletas</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo relatório
          </button>
        </div>
      </div>

      {/* ── Stats strip (only if reports exist) ─────────────────────────── */}
      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {METRIC_LABELS.map(({ key, label, color }) => {
            const c = COLOR[color as keyof typeof COLOR];
            const value = { rating: avgRating, intensity: avgIntensity, decision: avgDecision, positioning: avgPositioning }[key];
            return (
              <div key={key} className={`rounded-2xl ${c.bg} ring-1 ${c.ring} p-4`}>
                <p className="text-xs text-zinc-400">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${c.text}`}>{value}</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">média</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/5" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <svg className="h-7 w-7 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <p className="font-semibold text-zinc-300">
            {filterAthleteId ? "Nenhum relatório para esse atleta" : "Nenhum relatório cadastrado"}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {filterAthleteId
              ? "Mude o filtro ou crie um novo relatório."
              : 'Clique em "Novo relatório" para começar.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {reports.map((r) => <ReportCard key={r.id} report={r} />)}
        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 ring-1 ring-white/10 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 shrink-0">
              <div>
                <h2 className="font-semibold text-white">Novo relatório</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Preencha a avaliação do atleta</p>
              </div>
              <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
              {/* Atleta */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Atleta <span className="text-red-400">*</span>
                </label>
                <select
                  ref={firstInputRef}
                  required
                  value={form.athleteId}
                  onChange={(e) => setForm((f) => ({ ...f, athleteId: e.target.value }))}
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
                >
                  <option value="" disabled>Selecionar atleta</option>
                  {athletes.length === 0 && (
                    <option disabled>Nenhum atleta cadastrado</option>
                  )}
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} — {a.team} ({a.position})</option>
                  ))}
                </select>
              </div>

              {/* Título */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Título do relatório <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Análise jogo vs Palmeiras — 18/02/26"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {/* Resumo */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Resumo / Observações <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva o desempenho, pontos fortes e áreas de melhoria..."
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  className="w-full resize-none rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Tags <span className="text-zinc-600">(separadas por vírgula)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Passe, Decisão, Pressão alta"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {/* Métricas */}
              <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 space-y-4">
                <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Métricas (0 – 10)</p>
                {METRIC_LABELS.map(({ key, label, color }) => (
                  <MetricSlider
                    key={key}
                    label={label}
                    value={form[key as keyof typeof form] as number}
                    color={color as keyof typeof COLOR}
                    onChange={setMetric(key as "rating" | "intensity" | "decision" | "positioning")}
                  />
                ))}
              </div>

              {erro && (
                <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">
                  {erro}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
                  {saving ? "Salvando..." : "Salvar relatório"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
