"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, ChevronDown, Download, X } from "lucide-react";

// -- Types --

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

type ScoutCounts = {
  passeErrado: number;
  passeParaTras: number;
  passeErradoDefensivo: number;
  passeCertoOfensivo: number;
  passeDecisivo: number;
  passeEntreLinhas: number;
  cruzamento: number;
  assistencia: number;
  finalizacaoNoAlvo: number;
  finalizacaoFora: number;
  gol: number;
  desarme: number;
  interceptacao: number;
  recuperacaoPosse: number;
  pressaoPosPerda: number;
  aereoGanho: number;
  aereoPerdido: number;
  passeCampoDefensivo: number;
  passeCampoOfensivo: number;
  faltaCometida: number;
  faltaSofrida: number;
  impedimento: number;
  perdaPosse: number;
  dribleCompleto: number;
  dribleIncompleto: number;
};

type Report = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  analystName: string;
  createdAt: string;
  clips: Clip[];
  counts: ScoutCounts | null;
  athlete: AthleteOption;
};

// -- Helpers --

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// -- ReportCard --

function ReportCard({ report }: { report: Report }) {
  const [expanded, setExpanded] = useState(false);
  const hasPhoto = Boolean(report.athlete.photo);

  return (
    <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/[0.07] hover:ring-white/20">
      <div className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-white/10">
            {hasPhoto ? (
              <Image
                src={report.athlete.photo}
                alt={report.athlete.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-zinc-400">
                {report.athlete.name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {report.athlete.name}
            </p>
            <p className="text-xs text-zinc-500">
              {report.athlete.team} &middot; {report.athlete.position}
            </p>
          </div>
        </div>

        <h3 className="font-semibold leading-snug text-white">{report.title}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span>por {report.analystName}</span>
          <span className="h-1 w-1 rounded-full bg-zinc-700" />
          <span>{formatDate(report.createdAt)}</span>
        </div>

        {report.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {report.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-300 ring-1 ring-blue-500/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 text-xs text-zinc-400 ring-1 ring-white/5 transition hover:bg-white/10 hover:text-zinc-200"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Recolher" : "Ver resumo"}
          </button>
          <a
            href={`/api/analyst-reports/${report.id}/pdf`}
            download
            className="flex items-center gap-1.5 rounded-xl bg-blue-600/20 px-3 py-2 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/25 transition hover:bg-blue-600/30 hover:text-blue-200"
          >
            <Download className="h-3.5 w-3.5" />
            Baixar PDF
          </a>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-white/5 px-5 pb-5 pt-4">
          <p className="text-sm leading-relaxed text-zinc-300">{report.summary}</p>

          {report.clips?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Lances cortados ({report.clips.length})
              </p>
              <div className="space-y-2">
                {report.clips.map((c, idx) => {
                  const confStyle =
                    c.confidence === "alta"
                      ? "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20"
                      : c.confidence === "média"
                        ? "text-amber-400 bg-amber-500/10 ring-amber-500/20"
                        : "text-zinc-400 bg-white/5 ring-white/10";
                  const fmt = (t: number) =>
                    `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
                  return (
                    <div
                      key={c.id ?? idx}
                      className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">
                          {c.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${confStyle}`}
                        >
                          {c.confidence}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {fmt(c.start)} &rarr; {fmt(c.end)}
                        </span>
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

          {/* Scout counts */}
          {report.counts && Object.keys(report.counts).length > 0 && (() => {
            const c = report.counts as ScoutCounts;
            const sections = [
              {
                label: "Passes",
                color: "text-blue-400",
                bg: "bg-blue-500/5",
                ring: "ring-blue-500/15",
                rows: [
                  ["Passe certo",          c.passeCertoOfensivo],
                  ["Passe decisivo",       c.passeDecisivo],
                  ["Passe entre linhas",   c.passeEntreLinhas],
                  ["Passe para trás",      c.passeParaTras],
                  ["Passe errado",         c.passeErrado],
                  ["Perca da posse",       c.perdaPosse ?? 0],
                ] as [string, number][],
              },
              {
                label: "Ofensivo",
                color: "text-emerald-400",
                bg: "bg-emerald-500/5",
                ring: "ring-emerald-500/15",
                rows: [
                  ["Gol",                      c.gol],
                  ["Assistência",              c.assistencia],
                  ["Finalização no alvo",      c.finalizacaoNoAlvo],
                  ["Finalização fora",         c.finalizacaoFora],
                  ["Cruzamento",               c.cruzamento],
                  ["Passe no campo ofensivo",  c.passeCampoOfensivo ?? 0],
                  ["Falta sofrida",            c.faltaSofrida ?? 0],
                  ["Impedimento",              c.impedimento ?? 0],
                  ["Drible completo",          c.dribleCompleto ?? 0],
                  ["Drible incompleto",        c.dribleIncompleto ?? 0],
                ] as [string, number][],
              },
              {
                label: "Defensivo",
                color: "text-violet-400",
                bg: "bg-violet-500/5",
                ring: "ring-violet-500/15",
                rows: [
                  ["Desarme",                  c.desarme],
                  ["Interceptação",            c.interceptacao],
                  ["Recuperação de posse",     c.recuperacaoPosse],
                  ["Pressão pós-perda",        c.pressaoPosPerda],
                  ["Aéreo ganho",              c.aereoGanho],
                  ["Aéreo perdido",            c.aereoPerdido],
                  ["Passe no campo defensivo", c.passeCampoDefensivo ?? 0],
                  ["Falta cometida",           c.faltaCometida ?? 0],
                ] as [string, number][],
              },
            ];
            return (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Ações registradas
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {sections.map((sec) => (
                    <div key={sec.label} className={`rounded-2xl p-3 ring-1 ${sec.bg} ${sec.ring}`}>
                      <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${sec.color}`}>
                        {sec.label}
                      </p>
                      <div className="space-y-1">
                        {sec.rows.map(([label, val]) => (
                          <div key={label} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-zinc-400">{label}</span>
                            <span className={`text-sm font-bold tabular-nums ${val > 0 ? sec.color : "text-zinc-700"}`}>
                              {val ?? 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// -- Form defaults --

const EMPTY_FORM = {
  athleteId: "",
  title: "",
  summary: "",
  tags: "",
};

// -- Page --

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
      const url = aId
        ? `/api/analyst-reports?athleteId=${aId}`
        : "/api/analyst-reports";
      const res = await fetch(url);
      const data = await res.json();
      setReports(data.reports ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/athletes").then((r) => r.json()),
      fetch("/api/analyst-reports").then((r) => r.json()),
    ])
      .then(([aData, rData]) => {
        setAthletes(aData.athletes ?? []);
        setReports(rData.reports ?? []);
      })
      .finally(() => setLoading(false));
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
      if (!res.ok) {
        setErro(data?.error || "Erro ao salvar.");
        return;
      }
      closeModal();
      fetchReports(filterAthleteId);
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Relatórios</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {loading
              ? "Carregando..."
              : `${reports.length} relatório${reports.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterAthleteId}
            onChange={(e) => setFilterAthleteId(e.target.value)}
            className="appearance-none rounded-2xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os atletas</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo relatório
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/5"
            />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/5 py-16 text-center ring-1 ring-white/10">
          <p className="font-semibold text-zinc-300">
            {filterAthleteId
              ? "Nenhum relatório para esse atleta"
              : "Nenhum relatório cadastrado"}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {filterAthleteId
              ? "Mude o filtro ou crie um novo relatório."
              : 'Clique em "Novo relatório" para começar.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-zinc-900 shadow-2xl ring-1 ring-white/10">
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <h2 className="font-semibold text-white">Novo relatório</h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Preencha as informações do relatório
                </p>
              </div>
              <button
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 overflow-y-auto px-6 py-5"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Atleta <span className="text-red-400">*</span>
                </label>
                <select
                  ref={firstInputRef}
                  required
                  value={form.athleteId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, athleteId: e.target.value }))
                  }
                  className="w-full appearance-none rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Selecionar atleta
                  </option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.team} ({a.position})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Título do relatório <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Análise jogo vs Palmeiras"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Resumo / Observações <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva o desempenho, pontos fortes e áreas de melhoria..."
                  value={form.summary}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, summary: e.target.value }))
                  }
                  className="w-full resize-none rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Tags{" "}
                  <span className="text-zinc-600">(separadas por vírgula)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Passe, Decisão, Pressão alta"
                  value={form.tags}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tags: e.target.value }))
                  }
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {erro && (
                <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">
                  {erro}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
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
