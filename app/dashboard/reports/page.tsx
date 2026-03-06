"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Plus, ChevronDown, Download, X, FileText,
  Film, BarChart2, AlignLeft, Clock, Scissors,
  Zap, Shield, TrendingUp, Trash2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type AthleteOption = {
  id: string; name: string; team: string; position: string; photo: string;
};

type Clip = {
  id: string; start: number; end: number;
  label: string; description: string; confidence: "baixa" | "média" | "alta";
};

type ScoutCounts = Record<string, number>;

type Report = {
  id: string; title: string; summary: string; tags: string[];
  analystName: string; createdAt: string;
  clips: Clip[]; counts: ScoutCounts | null;
  athlete: AthleteOption;
};

// ── Constants ────────────────────────────────────────────────────────────────

const COUNT_SECTIONS = [
  {
    label: "Passes", color: "#60a5fa", hex: "blue",
    keys: [
      ["Passe certo",        "passeCertoOfensivo"],
      ["Passe decisivo",     "passeDecisivo"],
      ["Passe entre linhas", "passeEntreLinhas"],
      ["Passe para trás",    "passeParaTras"],
      ["Passe errado",       "passeErrado"],
      ["Perca da posse",     "perdaPosse"],
    ] as [string, string][],
  },
  {
    label: "Ofensivo", color: "#34d399", hex: "emerald",
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
    ] as [string, string][],
  },
  {
    label: "Defensivo", color: "#a78bfa", hex: "violet",
    keys: [
      ["Desarme",           "desarme"],
      ["Interceptação",     "interceptacao"],
      ["Rec. de posse",     "recuperacaoPosse"],
      ["Pressão pós-perda", "pressaoPosPerda"],
      ["Aéreo ganho",       "aereoGanho"],
      ["Aéreo perdido",     "aereoPerdido"],
      ["Campo defensivo",   "passeCampoDefensivo"],
      ["Falta cometida",    "faltaCometida"],
    ] as [string, string][],
  },
];

const SECTION_ICONS = [
  <TrendingUp key="p" className="h-3.5 w-3.5" />,
  <Zap key="o" className="h-3.5 w-3.5" />,
  <Shield key="d" className="h-3.5 w-3.5" />,
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtTime(t: number) {
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
}

// ── SVG Pie Chart ────────────────────────────────────────────────────────────

function PieChart({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-xs text-zinc-600 py-4 text-center">Sem dados</p>;

  const SIZE = 100;
  const R = SIZE * 0.38;
  const cx = SIZE / 2, cy = SIZE / 2;
  let cumAngle = -Math.PI / 2;

  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const s = cumAngle; cumAngle += angle;
    const x1 = cx + R * Math.cos(s), y1 = cy + R * Math.sin(s);
    const x2 = cx + R * Math.cos(cumAngle), y2 = cy + R * Math.sin(cumAngle);
    const path = `M${cx},${cy} L${x1},${y1} A${R},${R},0,${angle > Math.PI ? 1 : 0},1,${x2},${y2} Z`;
    return { ...d, path, pct: Math.round((d.value / total) * 100) };
  });

  return (
    <div className="flex items-center gap-3">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-18 w-18 shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="#09090b" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-[11px] text-zinc-400 truncate flex-1">{s.label}</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: s.color }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Clip Item (accordion) ─────────────────────────────────────────────────────

function ClipItem({ clip, index }: { clip: Clip; index: number }) {
  const [open, setOpen] = useState(false);
  const confStyle =
    clip.confidence === "alta"
      ? { text: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" }
      : clip.confidence === "média"
      ? { text: "text-amber-400", bg: "bg-amber-500/10", ring: "ring-amber-500/20" }
      : { text: "text-zinc-400", bg: "bg-white/5", ring: "ring-white/10" };

  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/8 overflow-hidden transition hover:ring-white/15">
      <button
        className="flex w-full items-center gap-3 p-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Scissors className="h-3 w-3 text-zinc-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{clip.label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock className="h-3 w-3 text-zinc-600" />
            <span className="text-xs text-zinc-500 tabular-nums">{fmtTime(clip.start)} → {fmtTime(clip.end)}</span>
            <span className="text-xs text-zinc-700">·</span>
            <span className="text-xs text-zinc-600">{Math.round(clip.end - clip.start)}s</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${confStyle.bg} ${confStyle.text} ${confStyle.ring}`}>
            {clip.confidence}
          </span>
          <span className="text-xs text-zinc-500 tabular-nums">#{index + 1}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 px-4 py-3">
          {clip.description ? (
            <p className="text-xs text-zinc-400 leading-relaxed">{clip.description}</p>
          ) : (
            <p className="text-xs text-zinc-600 italic">Sem descrição registrada.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Report Card ───────────────────────────────────────────────────────────────

type CardTab = "resumo" | "graficos" | "cortes";

function ReportCard({ report, onDelete }: { report: Report; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<CardTab>("resumo");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/analyst-reports/${report.id}`, { method: "DELETE" });
      if (res.ok) onDelete(report.id);
    } catch {}
    setDeleting(false);
    setConfirmDelete(false);
  }
  const hasPhoto = Boolean(report.athlete.photo);
  const c = report.counts ?? {};

  const totalActions = Object.values(c).reduce((a, b) => a + (b ?? 0), 0);
  const sectionTotals = COUNT_SECTIONS.map((sec) => ({
    ...sec,
    total: sec.keys.reduce((s, [, k]) => s + (c[k] ?? 0), 0),
  }));

  // Chart data
  const passCorrect = (c.passeCertoOfensivo ?? 0) + (c.passeDecisivo ?? 0) + (c.passeEntreLinhas ?? 0) + (c.passeParaTras ?? 0);
  const passWrong = (c.passeErrado ?? 0) + (c.perdaPosse ?? 0);

  const allRows: { label: string; value: number; color: string }[] = [];
  for (const sec of COUNT_SECTIONS) {
    for (const [label, key] of sec.keys) {
      const val = c[key] ?? 0;
      if (val > 0) allRows.push({ label, value: val, color: sec.color });
    }
  }
  allRows.sort((a, b) => b.value - a.value);
  const maxVal = Math.max(...allRows.map((r) => r.value), 1);

  const TABS: Array<{ id: CardTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: "resumo",   label: "Resumo",  icon: <AlignLeft className="h-3.5 w-3.5" /> },
    { id: "graficos", label: "Gráficos", icon: <BarChart2 className="h-3.5 w-3.5" />, count: totalActions > 0 ? totalActions : undefined },
    { id: "cortes",   label: "Cortes",  icon: <Film className="h-3.5 w-3.5" />, count: report.clips?.length || undefined },
  ];

  return (
    <div className="group overflow-hidden rounded-3xl bg-zinc-900 ring-1 ring-white/8 transition duration-200 hover:ring-white/15 hover:shadow-xl hover:shadow-black/30">
      {/* Card header */}
      <div className="p-5">
        {/* Athlete row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 ring-1 ring-white/10">
            {hasPhoto ? (
              <Image src={report.athlete.photo} alt={report.athlete.name} fill className="object-cover" sizes="44px"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-zinc-400">
                {report.athlete.name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{report.athlete.name}</p>
            <p className="text-xs text-zinc-500">{report.athlete.team} · {report.athlete.position}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-zinc-500">{formatDate(report.createdAt)}</p>
            <p className="text-xs text-zinc-600 mt-0.5">por {report.analystName}</p>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold leading-snug text-white mb-3">{report.title}</h3>

        {/* Tags */}
        {report.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {report.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-300 ring-1 ring-blue-500/20">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats strip */}
        {totalActions > 0 && (
          <div className="flex items-center gap-2 mb-4">
            {sectionTotals.map((sec, i) => (
              sec.total > 0 && (
                <div key={sec.label} className="flex items-center gap-1.5 rounded-xl bg-white/5 px-2.5 py-1.5 ring-1 ring-white/8">
                  <span style={{ color: sec.color }}>{SECTION_ICONS[i]}</span>
                  <span className="text-xs font-bold tabular-nums text-white">{sec.total}</span>
                  <span className="text-[10px] text-zinc-500 hidden sm:block">{sec.label}</span>
                </div>
              )
            ))}
            {report.clips?.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl bg-white/5 px-2.5 py-1.5 ring-1 ring-white/8 ml-auto">
                <Scissors className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-xs font-bold tabular-nums text-white">{report.clips.length}</span>
                <span className="text-[10px] text-zinc-500 hidden sm:block">cortes</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/5 py-2 text-xs font-medium text-zinc-400 ring-1 ring-white/8 transition hover:bg-white/10 hover:text-zinc-200"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Recolher" : "Ver detalhes"}
          </button>
          <a
            href={`/api/analyst-reports/${report.id}/pdf`}
            download
            className="flex items-center gap-1.5 rounded-xl bg-blue-600/20 px-3 py-2 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/25 transition hover:bg-blue-600/30"
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </a>
          <button
            onClick={() => setConfirmDelete(true)}
            title="Excluir relatório"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-zinc-500 ring-1 ring-white/8 transition hover:bg-red-500/15 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-zinc-900 ring-1 ring-white/10 shadow-2xl p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 ring-1 ring-red-500/20 mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-center font-semibold text-white mb-1">Excluir relatório?</h3>
            <p className="text-center text-sm text-zinc-400 mb-6">
              Esta ação é irreversível. O relatório de <span className="font-medium text-white">{report.athlete.name}</span> será removido permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-white/5">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-white/5 bg-white/2 px-4 py-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  tab === t.id ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
              >
                {t.icon}
                {t.label}
                {t.count !== undefined && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.id ? "bg-white/15 text-white" : "bg-white/5 text-zinc-500"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4">
            {/* ── Resumo ── */}
            {tab === "resumo" && (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-zinc-300">{report.summary}</p>

                {totalActions > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {sectionTotals.map((sec) => (
                      <div key={sec.label} className="rounded-2xl bg-white/5 p-3 text-center ring-1 ring-white/10">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: sec.color }}>{sec.label}</p>
                        <p className="text-3xl font-bold text-white mt-0.5">{sec.total}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Gráficos ── */}
            {tab === "graficos" && (
              <div className="space-y-4">
                {totalActions === 0 ? (
                  <p className="text-center text-sm text-zinc-600 py-8">Nenhuma ação registrada neste scout.</p>
                ) : (
                  <>
                    {/* Pie charts row */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(passCorrect + passWrong) > 0 && (
                        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Precisão de passe</p>
                          <PieChart data={[
                            { label: "Passes certos",  value: passCorrect, color: "#34d399" },
                            { label: "Passes errados", value: passWrong,   color: "#f87171" },
                          ]} />
                        </div>
                      )}
                      {sectionTotals.some((s) => s.total > 0) && (
                        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Distribuição de ações</p>
                          <PieChart data={sectionTotals.filter((s) => s.total > 0).map((s) => ({ label: s.label, value: s.total, color: s.color }))} />
                        </div>
                      )}
                    </div>

                    {/* Bar chart */}
                    {allRows.length > 0 && (
                      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          Ações registradas ({totalActions} total)
                        </p>
                        <div className="space-y-2">
                          {allRows.map((row) => (
                            <div key={row.label} className="flex items-center gap-3">
                              <span className="w-28 shrink-0 truncate text-right text-xs text-zinc-500">{row.label}</span>
                              <div className="flex-1 overflow-hidden rounded-full bg-white/5 h-4">
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

                    {/* Detail tables per section */}
                    <div className="grid gap-2 sm:grid-cols-3">
                      {COUNT_SECTIONS.map((sec) => {
                        const rows = sec.keys.filter(([, k]) => (c[k] ?? 0) > 0);
                        if (rows.length === 0) return null;
                        return (
                          <div key={sec.label} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: sec.color }}>{sec.label}</p>
                            <div className="space-y-1">
                              {rows.map(([label, key]) => (
                                <div key={key} className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-zinc-500 truncate">{label}</span>
                                  <span className="text-sm font-bold tabular-nums" style={{ color: sec.color }}>{c[key] ?? 0}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Cortes ── */}
            {tab === "cortes" && (
              <div>
                {!report.clips || report.clips.length === 0 ? (
                  <div className="rounded-2xl bg-white/5 p-8 text-center ring-1 ring-white/10">
                    <Scissors className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
                    <p className="text-sm font-medium text-zinc-400">Nenhum corte registrado</p>
                    <p className="text-xs text-zinc-600 mt-1">Os cortes de vídeo aparecerão aqui quando registrados no scout.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                      {report.clips.length} corte{report.clips.length !== 1 ? "s" : ""} · clique para expandir
                    </p>
                    {report.clips.map((clip, idx) => (
                      <ClipItem key={clip.id ?? idx} clip={clip} index={idx} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────

const EMPTY_FORM = { athleteId: "", title: "", summary: "", tags: "" };

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
    Promise.all([
      fetch("/api/athletes").then((r) => r.json()),
      fetch("/api/analyst-reports").then((r) => r.json()),
    ]).then(([aData, rData]) => {
      setAthletes(aData.athletes ?? []);
      setReports(rData.reports ?? []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchReports(filterAthleteId); }, [filterAthleteId, fetchReports]);

  function openModal() {
    setForm(EMPTY_FORM); setErro(""); setModalOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }
  function closeModal() { setModalOpen(false); setErro(""); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErro(""); setSaving(true);
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
    } finally { setSaving(false); }
  }

  // Stats for header
  const totalActions = reports.reduce((s, r) => {
    if (!r.counts) return s;
    return s + Object.values(r.counts).reduce((a, b) => a + (b ?? 0), 0);
  }, 0);
  const totalClips = reports.reduce((s, r) => s + (r.clips?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Relatórios</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {loading ? "Carregando..." : `${reports.length} relatório${reports.length !== 1 ? "s" : ""}${totalActions > 0 ? ` · ${totalActions} ações` : ""}${totalClips > 0 ? ` · ${totalClips} cortes` : ""}`}
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
              <option key={a.id} value={a.id}>{a.name}</option>
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

      {/* Summary chips */}
      {!loading && reports.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Relatórios",  value: reports.length,  color: "bg-blue-500/10 text-blue-300 ring-blue-500/20",    icon: <FileText className="h-3.5 w-3.5" /> },
            { label: "Ações totais",value: totalActions,    color: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20", icon: <BarChart2 className="h-3.5 w-3.5" /> },
            { label: "Cortes",      value: totalClips,      color: "bg-violet-500/10 text-violet-300 ring-violet-500/20", icon: <Scissors className="h-3.5 w-3.5" /> },
          ].map((chip) => (
            <div key={chip.label} className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 ring-1 text-sm font-semibold ${chip.color}`}>
              {chip.icon}
              <span>{chip.value}</span>
              <span className="font-normal text-xs opacity-70">{chip.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/5" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/5 py-16 text-center ring-1 ring-white/10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <FileText className="h-7 w-7 text-zinc-500" />
          </div>
          <p className="font-semibold text-zinc-300">
            {filterAthleteId ? "Nenhum relatório para esse atleta" : "Nenhum relatório cadastrado"}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {filterAthleteId ? "Mude o filtro ou crie um novo relatório." : 'Clique em "Novo relatório" para começar.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onDelete={(id) => setReports((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-zinc-900 shadow-2xl ring-1 ring-white/10">
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <h2 className="font-semibold text-white">Novo relatório</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Preencha as informações do relatório</p>
              </div>
              <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-6 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Atleta <span className="text-red-400">*</span></label>
                <select
                  ref={firstInputRef} required value={form.athleteId}
                  onChange={(e) => setForm((f) => ({ ...f, athleteId: e.target.value }))}
                  className="w-full appearance-none rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Selecionar atleta</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} — {a.team} ({a.position})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Título <span className="text-red-400">*</span></label>
                <input
                  type="text" required placeholder="Ex: Análise jogo vs Palmeiras"
                  value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Resumo / Observações <span className="text-red-400">*</span></label>
                <textarea
                  required rows={3} placeholder="Descreva o desempenho, pontos fortes e áreas de melhoria..."
                  value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  className="w-full resize-none rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Tags <span className="text-zinc-600">(separadas por vírgula)</span>
                </label>
                <input
                  type="text" placeholder="Ex: Passe, Decisão, Pressão alta"
                  value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {erro && (
                <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">{erro}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
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
