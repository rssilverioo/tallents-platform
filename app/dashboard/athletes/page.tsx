"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import AthleteCard from "@/app/components/dashboard/AthleteCard";
import type { Athlete } from "@/app/components/dashboard/types";
import {
  Search, Plus, Users, Trash2, X, Upload,
  FileText, Target, ChevronDown, BarChart2,
} from "lucide-react";

const POSITIONS = ["Goleiro", "Lateral", "Zagueiro", "Volante", "Meia", "Atacante"];
const PLAN_TYPES = ["Mensal", "Trimestral", "Anual"];

const EMPTY_FORM = {
  name: "", team: "", position: "", birthDate: "",
  remainingMeetings: "0", photo: "",
  planType: "", planStartDate: "", planEndDate: "",
};

// ─── Full athlete profile types ───────────────────────────────────────────────
type ScoutCounts = Record<string, number>;
type FullAthlete = Athlete & {
  analystReports?: Array<{
    id: string; title: string; summary: string; tags: string[];
    analystName: string; createdAt: string; counts: ScoutCounts | null;
  }>;
  metas?: Array<{
    id: string; title: string; season: string; description: string;
    analystName: string; createdAt: string;
    goals: Array<{ id: string; category: string; name: string; target: number; current: number; unit: string }>;
  }>;
  scouts?: Array<{ id: string; createdAt: string; counts: ScoutCounts; report: { rating: number; intensity: number; decision: number; positioning: number } | null }>;
};

const COUNT_SECTIONS = [
  { label: "Passes",    color: "#60a5fa", keys: [["Passe certo","passeCertoOfensivo"],["Passe decisivo","passeDecisivo"],["Passe entre linhas","passeEntreLinhas"],["Passe para trás","passeParaTras"],["Passe errado","passeErrado"],["Perca da posse","perdaPosse"]] },
  { label: "Ofensivo",  color: "#34d399", keys: [["Gol","gol"],["Assistência","assistencia"],["Final. no alvo","finalizacaoNoAlvo"],["Finalização fora","finalizacaoFora"],["Cruzamento","cruzamento"],["Campo ofensivo","passeCampoOfensivo"],["Falta sofrida","faltaSofrida"],["Impedimento","impedimento"],["Drible completo","dribleCompleto"],["Drible incompleto","dribleIncompleto"]] },
  { label: "Defensivo", color: "#a78bfa", keys: [["Desarme","desarme"],["Interceptação","interceptacao"],["Rec. de posse","recuperacaoPosse"],["Pressão pós-perda","pressaoPosPerda"],["Aéreo ganho","aereoGanho"],["Aéreo perdido","aereoPerdido"],["Campo defensivo","passeCampoDefensivo"],["Falta cometida","faltaCometida"]] },
] as const;

function pct(current: number, target: number) {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}
function progressBarColor(p: number) {
  if (p >= 100) return "bg-emerald-500";
  if (p >= 70) return "bg-blue-500";
  if (p >= 40) return "bg-amber-500";
  return "bg-red-500";
}
function progressTextColor(p: number) {
  if (p >= 100) return "text-emerald-400";
  if (p >= 70) return "text-blue-400";
  if (p >= 40) return "text-amber-400";
  return "text-red-400";
}

// ─── SVG Pie Chart ──────────────────────────────────────────────────────────
function PieChart({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  let cumAngle = -Math.PI / 2;
  const R = 50, cx = 60, cy = 60;

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
      <svg viewBox="0 0 120 120" className="h-24 w-24 shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="#18181b" strokeWidth="1.5" />
        ))}
      </svg>
      <div className="space-y-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-zinc-400 truncate">{s.label}</span>
            <span className="ml-auto text-xs font-bold tabular-nums text-white">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile Modal ────────────────────────────────────────────────────────────
type ProfileSection = "scouts" | "relatorios" | "metas" | "perfil";

function AthleteProfileModal({ athlete, onClose }: { athlete: FullAthlete; onClose: () => void }) {
  const [section, setSection] = useState<ProfileSection>("scouts");
  const reports = athlete.analystReports ?? [];
  const metas = athlete.metas ?? [];
  const scouts = athlete.scouts ?? [];

  // Consolidated counts from all scouts
  const allCounts: ScoutCounts = {};
  for (const scout of scouts) {
    const c = scout.counts ?? {};
    for (const [k, v] of Object.entries(c)) {
      allCounts[k] = (allCounts[k] ?? 0) + (v as number);
    }
  }
  const totalActions = Object.values(allCounts).reduce((a, b) => a + b, 0);

  // Charts data
  const passCorrect = (allCounts.passeCertoOfensivo ?? 0) + (allCounts.passeDecisivo ?? 0) + (allCounts.passeEntreLinhas ?? 0) + (allCounts.passeParaTras ?? 0);
  const passWrong = (allCounts.passeErrado ?? 0) + (allCounts.perdaPosse ?? 0);

  const positionBadgeColor =
    athlete.position === "Atacante" ? "text-red-400 bg-red-500/10 ring-red-500/20"
    : athlete.position === "Meia" ? "text-violet-400 bg-violet-500/10 ring-violet-500/20"
    : athlete.position === "Zagueiro" || athlete.position === "Lateral" ? "text-blue-400 bg-blue-500/10 ring-blue-500/20"
    : athlete.position === "Goleiro" ? "text-amber-400 bg-amber-500/10 ring-amber-500/20"
    : "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20";

  const navItems: Array<{ id: ProfileSection; label: string; count?: number }> = [
    { id: "scouts", label: "Scouts", count: scouts.length },
    { id: "relatorios", label: "Relatórios", count: reports.length },
    { id: "metas", label: "Metas", count: metas.length },
    { id: "perfil", label: "Perfil" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-3xl bg-zinc-900 ring-1 ring-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative h-24 bg-[linear-gradient(135deg,rgba(59,130,246,0.3),rgba(139,92,246,0.2))]">
          <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900/60 text-zinc-400 ring-1 ring-white/10 transition hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-4 -mt-10">
          <div className="flex items-end gap-4 mb-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 ring-4 ring-zinc-900">
              {athlete.photo ? (
                <Image src={athlete.photo} alt={athlete.name} fill className="object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-zinc-500">
                  {athlete.name[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="mb-1 flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{athlete.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${positionBadgeColor}`}>
                  {athlete.position}
                </span>
                <span className="text-sm text-zinc-400">{athlete.team}</span>
              </div>
            </div>
            {/* Quick stats */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              {[
                { label: "Scouts", val: scouts.length, color: "text-blue-400" },
                { label: "Relatórios", val: reports.length, color: "text-emerald-400" },
                { label: "Encontros", val: athlete.remainingMeetings, color: "text-violet-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/5 px-3 py-2 text-center ring-1 ring-white/10">
                  <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Nav tabs */}
          <div className="flex items-center gap-1 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  section === item.id ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {item.label}
                {item.count !== undefined && item.count > 0 && (
                  <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">{item.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 max-h-[55vh] overflow-y-auto space-y-3">
          {/* ── Scouts ── */}
          {section === "scouts" && (
            <div>
              {scouts.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 py-8">Nenhum scout registrado</p>
              ) : (
                <>
                  {/* Consolidated stats */}
                  {totalActions > 0 && (
                    <div className="mb-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Stats consolidadas · {scouts.length} scouts · {totalActions} ações
                      </p>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {COUNT_SECTIONS.map((sec) => {
                          const total = sec.keys.reduce((s, [, k]) => s + (allCounts[k] ?? 0), 0);
                          return (
                            <div key={sec.label} className="rounded-2xl bg-white/5 p-3 text-center ring-1 ring-white/10">
                              <p className="text-[10px] uppercase tracking-wider" style={{ color: sec.color }}>{sec.label}</p>
                              <p className="text-2xl font-bold text-white">{total}</p>
                            </div>
                          );
                        })}
                      </div>
                      {/* Pie charts */}
                      {(passCorrect + passWrong) > 0 && (
                        <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Precisão de passe</p>
                          <PieChart data={[
                            { label: "Passes certos", value: passCorrect, color: "#60a5fa" },
                            { label: "Passes errados", value: passWrong, color: "#f87171" },
                          ]} />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    {scouts.map((scout, i) => (
                      <div key={scout.id} className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-zinc-300">
                            Scout #{scouts.length - i}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-zinc-500">
                            {scout.report && (
                              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-300 ring-1 ring-blue-500/20">
                                rating {scout.report.rating}/10
                              </span>
                            )}
                            <span>{new Date(scout.createdAt).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                        {scout.counts && (() => {
                          const total = Object.values(scout.counts).reduce((a: number, b) => a + (b as number), 0);
                          return total > 0 ? (
                            <p className="mt-0.5 text-xs text-zinc-500">{total} ações registradas</p>
                          ) : null;
                        })()}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Relatórios ── */}
          {section === "relatorios" && (
            <div>
              {reports.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 py-8">Nenhum relatório</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((r) => (
                    <div key={r.id} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {r.tags.map((t) => (
                          <span key={t} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 ring-1 ring-blue-500/20">{t}</span>
                        ))}
                      </div>
                      <p className="text-sm font-semibold text-white">{r.title}</p>
                      <p className="mt-1 text-xs text-zinc-400">{r.analystName} · {new Date(r.createdAt).toLocaleDateString("pt-BR")}</p>
                      <p className="mt-2 text-xs text-zinc-400 leading-relaxed line-clamp-2">{r.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Metas ── */}
          {section === "metas" && (
            <div>
              {metas.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 py-8">Nenhuma meta definida</p>
              ) : (
                <div className="space-y-3">
                  {metas.map((m) => {
                    const goals = Array.isArray(m.goals) ? m.goals : [];
                    const avgP = goals.length ? Math.round(goals.reduce((s, g) => s + pct(g.current, g.target), 0) / goals.length) : 0;
                    return (
                      <div key={m.id} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-white">{m.title}</p>
                          <span className={`text-sm font-bold ${progressTextColor(avgP)}`}>{avgP}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5 mb-2">
                          <div className={`h-full rounded-full ${progressBarColor(avgP)}`} style={{ width: `${avgP}%` }} />
                        </div>
                        <p className="text-xs text-zinc-500">{m.season} · {goals.length} objetivo{goals.length !== 1 ? "s" : ""} · {m.analystName}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Perfil ── */}
          {section === "perfil" && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden">
                {[
                  ["Nome", athlete.name],
                  ["Time", athlete.team],
                  ["Posição", athlete.position],
                  athlete.birthDate ? ["Nascimento", new Date(athlete.birthDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })] : null,
                  athlete.planType ? ["Plano", athlete.planType] : null,
                  athlete.planStartDate ? ["Início do plano", new Date(athlete.planStartDate).toLocaleDateString("pt-BR")] : null,
                  athlete.planEndDate ? ["Término do plano", new Date(athlete.planEndDate).toLocaleDateString("pt-BR")] : null,
                  ["Encontros restantes", String(athlete.remainingMeetings)],
                ].filter((row): row is [string, string] => row !== null).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-white/5 px-4 py-3 last:border-0">
                    <span className="text-xs text-zinc-500">{label}</span>
                    <span className="text-sm font-medium text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [erro, setErro] = useState("");
  const [profileAthlete, setProfileAthlete] = useState<FullAthlete | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fetchAthletes = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const url = q ? `/api/athletes?q=${encodeURIComponent(q)}` : "/api/athletes";
      const res = await fetch(url);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setAthletes(data.athletes ?? []);
    } catch {
      setAthletes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAthletes(); }, [fetchAthletes]);
  useEffect(() => {
    const t = setTimeout(() => fetchAthletes(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchAthletes]);

  async function openProfile(id: string) {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/athletes/${id}?full=true`);
      const data = await res.json();
      if (data.athlete) setProfileAthlete(data.athlete);
    } catch {}
    setProfileLoading(false);
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setEditingAthlete(null);
    setErro("");
    setModalOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }

  function openEditModal(athlete: Athlete) {
    setForm({
      name: athlete.name,
      team: athlete.team,
      position: athlete.position,
      birthDate: athlete.birthDate ? new Date(athlete.birthDate).toISOString().split("T")[0] : "",
      remainingMeetings: String(athlete.remainingMeetings),
      photo: athlete.photo ?? "",
      planType: athlete.planType ?? "",
      planStartDate: athlete.planStartDate ? new Date(athlete.planStartDate).toISOString().split("T")[0] : "",
      planEndDate: athlete.planEndDate ? new Date(athlete.planEndDate).toISOString().split("T")[0] : "",
    });
    setEditingAthlete(athlete);
    setErro("");
    setModalOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }

  function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErro("Foto muito grande. Use uma imagem de até 5 MB."); return; }
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 300;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      URL.revokeObjectURL(url);
      setForm((f) => ({ ...f, photo: base64 }));
    };
    img.src = url;
    e.target.value = "";
  }

  function closeModal() { setModalOpen(false); setEditingAthlete(null); setErro(""); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSaving(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const body = {
        name: form.name, team: form.team, position: form.position,
        birthDate: form.birthDate || undefined,
        remainingMeetings: Number(form.remainingMeetings),
        photo: form.photo || undefined,
        planType: form.planType || undefined,
        planStartDate: form.planStartDate || undefined,
        planEndDate: form.planEndDate || undefined,
      };
      const res = editingAthlete
        ? await fetch(`/api/athletes/${editingAthlete.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify(body) })
        : await fetch("/api/athletes", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify(body) });
      clearTimeout(timeout);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) { setErro(data?.error || "Erro ao salvar atleta."); return; }
      closeModal();
      fetchAthletes(search);
    } catch (err) {
      setErro(err instanceof DOMException && err.name === "AbortError" ? "Tempo esgotado." : "Erro ao conectar com o servidor.");
    } finally { clearTimeout(timeout); setSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/athletes/${id}`, { method: "DELETE" });
      if (res.ok) setAthletes((prev) => prev.filter((a) => a.id !== id));
    } catch {} finally { setDeleting(false); setDeleteConfirmId(null); }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const isEditing = Boolean(editingAthlete);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Atletas</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {loading ? "Carregando..." : `${athletes.length} atleta${athletes.length !== 1 ? "s" : ""} cadastrado${athletes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text" placeholder="Buscar atleta..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded-2xl bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <button onClick={openModal} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-95">
            <Plus className="h-4 w-4" /> Adicionar atleta
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/5" />
          ))}
        </div>
      ) : athletes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <Users className="h-7 w-7 text-zinc-500" />
          </div>
          <p className="font-semibold text-zinc-300">{search ? "Nenhum atleta encontrado" : "Nenhum atleta cadastrado"}</p>
          <p className="mt-1 text-sm text-zinc-500">{search ? `Sem resultados para "${search}"` : 'Clique em "Adicionar atleta" para começar.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {athletes.map((a) => (
            <div key={a.id} className="relative">
              <div
                className="absolute inset-x-5 top-4 z-10 cursor-pointer"
                onClick={() => openProfile(a.id)}
                title="Ver perfil completo"
              />
              <AthleteCard
                athlete={a}
                onEdit={openEditModal}
                onDelete={(id) => setDeleteConfirmId(id)}
                onViewProfile={() => openProfile(a.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Profile loading indicator */}
      {profileLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-sm text-zinc-400">Carregando perfil...</p>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profileAthlete && (
        <AthleteProfileModal athlete={profileAthlete} onClose={() => setProfileAthlete(null)} />
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-zinc-900 ring-1 ring-white/10 shadow-2xl p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 ring-1 ring-red-500/20 mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-center font-semibold text-white mb-1">Excluir atleta?</h3>
            <p className="text-center text-sm text-zinc-400 mb-6">Esta ação é irreversível. Todos os scouts e relatórios serão excluídos.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirmId)} disabled={deleting} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50">{deleting ? "Excluindo..." : "Excluir"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Athlete Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-900 ring-1 ring-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 sticky top-0 bg-zinc-900 z-10">
              <div>
                <h2 className="font-semibold text-white">{isEditing ? "Editar atleta" : "Novo atleta"}</h2>
                <p className="mt-0.5 text-xs text-zinc-500">{isEditing ? "Atualize os dados do atleta" : "Preencha os dados do atleta"}</p>
              </div>
              <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              {/* Nome */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Nome completo <span className="text-red-400">*</span></label>
                <input ref={firstInputRef} type="text" placeholder="Ex: João Silva" required
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  {...field("name")} />
              </div>

              {/* Time + Posição */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Time <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="Ex: Flamengo" required
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                    {...field("team")} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Posição <span className="text-red-400">*</span></label>
                  <select required value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
                    <option value="" disabled>Selecionar</option>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Data de nascimento + Encontros */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Data de nascimento</label>
                  <input type="date"
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition scheme-dark"
                    {...field("birthDate")} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Encontros restantes</label>
                  <input type="number" min="0" placeholder="0"
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                    {...field("remainingMeetings")} />
                </div>
              </div>

              {/* Plano */}
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 space-y-3">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Informações do plano</p>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Tipo de plano</label>
                  <select value={form.planType} onChange={(e) => setForm((f) => ({ ...f, planType: e.target.value }))}
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
                    <option value="">Sem plano</option>
                    {PLAN_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Início</label>
                    <input type="date"
                      className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition scheme-dark"
                      {...field("planStartDate")} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Término</label>
                    <input type="date"
                      className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition scheme-dark"
                      {...field("planEndDate")} />
                  </div>
                </div>
              </div>

              {/* Foto */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Foto <span className="text-zinc-600">(opcional)</span></label>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => photoInputRef.current?.click()}
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 ring-1 ring-white/10 transition hover:ring-blue-500 group">
                    {form.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.photo} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl font-bold text-zinc-500 group-hover:text-zinc-300 transition">
                        {form.name ? form.name[0].toUpperCase() : "?"}
                      </span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
                      <Upload className="h-5 w-5 text-white" />
                    </span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300">{form.photo ? "Foto selecionada" : "Nenhuma foto"}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Clique no avatar para fazer upload · Máx. 5 MB</p>
                    {form.photo && (
                      <button type="button" onClick={() => setForm((f) => ({ ...f, photo: "" }))}
                        className="mt-1.5 text-xs text-red-400 hover:text-red-300 transition">
                        Remover foto
                      </button>
                    )}
                  </div>
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
              </div>

              {erro && (
                <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">{erro}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
                  {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Salvar atleta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
