"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, X, Download, Pencil, Trash2, BarChart2, AlertTriangle, SlidersHorizontal, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type GoalItem = {
  id: string;
  category: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  goalType?: "manual" | "quantidade" | "media" | "porcentagem";
  scoutKey?: string;
};

type AthleteOption = {
  id: string;
  name: string;
  team: string;
  position: string;
  photo: string;
};

type Meta = {
  id: string;
  title: string;
  season: string;
  description: string;
  analystName: string;
  createdAt: string;
  goals: GoalItem[];
  athlete: AthleteOption;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["Técnico", "Físico", "Tático", "Mental", "Estatístico"] as const;

const CATEGORY_PRESETS: Record<string, Array<{ name: string; unit: string; target: number }>> = {
  "Técnico": [
    { name: "Precisão de passe", unit: "%", target: 85 },
    { name: "Dribles bem-sucedidos", unit: "%", target: 60 },
    { name: "Finalizações no alvo", unit: "%", target: 50 },
    { name: "Cruzamentos certeiros", unit: "%", target: 40 },
  ],
  "Físico": [
    { name: "Distância média por jogo", unit: "km", target: 11 },
    { name: "Velocidade máxima", unit: "km/h", target: 30 },
    { name: "Sprints por partida", unit: "sprints", target: 20 },
    { name: "Duelos físicos ganhos", unit: "%", target: 55 },
  ],
  "Tático": [
    { name: "Interceptações por jogo", unit: "ações", target: 3 },
    { name: "Pressão pós-perda", unit: "ações", target: 5 },
    { name: "Desarmes por jogo", unit: "desarmes", target: 4 },
    { name: "Aereos ganhos", unit: "%", target: 60 },
  ],
  "Mental": [
    { name: "Avaliação do analista", unit: "/10", target: 8 },
    { name: "Comprometimento", unit: "/10", target: 9 },
    { name: "Liderança em campo", unit: "/10", target: 7 },
  ],
  "Estatístico": [
    { name: "Gols na temporada", unit: "gols", target: 10 },
    { name: "Assistências", unit: "assist.", target: 8 },
    { name: "Passes decisivos", unit: "passes", target: 30 },
    { name: "Minutos jogados", unit: "min", target: 1800 },
    { name: "Partidas disputadas", unit: "jogos", target: 20 },
  ],
};

const CATEGORY_COLORS: Record<string, { text: string; bg: string; ring: string; dot: string }> = {
  "Técnico":     { text: "text-blue-400",   bg: "bg-blue-500/10",   ring: "ring-blue-500/25",   dot: "bg-blue-400"   },
  "Físico":      { text: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/25", dot: "bg-emerald-400" },
  "Tático":      { text: "text-violet-400", bg: "bg-violet-500/10", ring: "ring-violet-500/25", dot: "bg-violet-400" },
  "Mental":      { text: "text-amber-400",  bg: "bg-amber-500/10",  ring: "ring-amber-500/25",  dot: "bg-amber-400"  },
  "Estatístico": { text: "text-orange-400", bg: "bg-orange-500/10", ring: "ring-orange-500/25", dot: "bg-orange-400" },
};

function catStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? { text: "text-zinc-400", bg: "bg-zinc-500/10", ring: "ring-zinc-500/20", dot: "bg-zinc-400" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(current: number, target: number) {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function progressColorClass(p: number) {
  if (p >= 100) return "bg-emerald-500";
  if (p >= 70)  return "bg-blue-500";
  if (p >= 40)  return "bg-amber-500";
  return "bg-red-500";
}

function progressTextClass(p: number) {
  if (p >= 100) return "text-emerald-400";
  if (p >= 70)  return "text-blue-400";
  if (p >= 40)  return "text-amber-400";
  return "text-red-400";
}

const GOAL_TYPES = [
  { value: "manual",       label: "Manual" },
  { value: "quantidade",   label: "Por quantidade" },
  { value: "media",        label: "Por média" },
  { value: "porcentagem",  label: "Por porcentagem" },
] as const;

const SCOUT_KEYS: Array<{ key: string; label: string; group: string }> = [
  { key: "gol",               label: "Gols",                group: "Ofensivo"  },
  { key: "assistencia",       label: "Assistências",        group: "Ofensivo"  },
  { key: "finalizacaoNoAlvo", label: "Final. no alvo",      group: "Ofensivo"  },
  { key: "finalizacaoFora",   label: "Finalização fora",    group: "Ofensivo"  },
  { key: "cruzamento",        label: "Cruzamentos",         group: "Ofensivo"  },
  { key: "dribleCompleto",    label: "Dribles completos",   group: "Ofensivo"  },
  { key: "dribleIncompleto",  label: "Dribles incompletos", group: "Ofensivo"  },
  { key: "passeCertoOfensivo",label: "Passes certos",       group: "Passes"    },
  { key: "passeDecisivo",     label: "Passes decisivos",    group: "Passes"    },
  { key: "passeEntreLinhas",  label: "Passes entre linhas", group: "Passes"    },
  { key: "passeParaTras",     label: "Passes para trás",    group: "Passes"    },
  { key: "passeErrado",       label: "Passes errados",      group: "Passes"    },
  { key: "perdaPosse",        label: "Perda de posse",      group: "Passes"    },
  { key: "desarme",           label: "Desarmes",            group: "Defensivo" },
  { key: "interceptacao",     label: "Interceptações",      group: "Defensivo" },
  { key: "recuperacaoPosse",  label: "Rec. de posse",       group: "Defensivo" },
  { key: "pressaoPosPerda",   label: "Pressão pós-perda",   group: "Defensivo" },
  { key: "aereoGanho",        label: "Aéreos ganhos",       group: "Defensivo" },
  { key: "aereoPerdido",      label: "Aéreos perdidos",     group: "Defensivo" },
  { key: "faltaCometida",     label: "Faltas cometidas",    group: "Defensivo" },
  { key: "faltaSofrida",      label: "Faltas sofridas",     group: "Ofensivo"  },
  { key: "impedimento",       label: "Impedimentos",        group: "Ofensivo"  },
];

// Percentage pairs: key → (numerator keys, denominator keys)
const PCT_PAIRS: Record<string, { num: string[]; den: string[] }> = {
  "passeCertoOfensivo": {
    num: ["passeCertoOfensivo", "passeDecisivo", "passeEntreLinhas", "passeParaTras"],
    den: ["passeCertoOfensivo", "passeDecisivo", "passeEntreLinhas", "passeParaTras", "passeErrado", "perdaPosse"],
  },
  "dribleCompleto": {
    num: ["dribleCompleto"],
    den: ["dribleCompleto", "dribleIncompleto"],
  },
  "aereoGanho": {
    num: ["aereoGanho"],
    den: ["aereoGanho", "aereoPerdido"],
  },
  "finalizacaoNoAlvo": {
    num: ["finalizacaoNoAlvo"],
    den: ["finalizacaoNoAlvo", "finalizacaoFora"],
  },
};

function calcCurrentFromScouts(
  scouts: Array<{ counts: Record<string, number> }>,
  goalType: GoalItem["goalType"],
  scoutKey: string
): number {
  if (!scoutKey || !goalType || goalType === "manual") return 0;
  if (goalType === "quantidade") {
    return scouts.reduce((s, sc) => s + ((sc.counts?.[scoutKey] ?? 0) as number), 0);
  }
  if (goalType === "media") {
    const vals = scouts.map((sc) => (sc.counts?.[scoutKey] ?? 0) as number).filter((v) => v > 0);
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }
  if (goalType === "porcentagem") {
    const pair = PCT_PAIRS[scoutKey];
    if (!pair) {
      // fallback: just percentage of matches where key > 0
      const withKey = scouts.filter((sc) => (sc.counts?.[scoutKey] ?? 0) > 0).length;
      return scouts.length > 0 ? Math.round((withKey / scouts.length) * 100) : 0;
    }
    const totalNum = scouts.reduce((s, sc) => s + pair.num.reduce((n, k) => n + ((sc.counts?.[k] ?? 0) as number), 0), 0);
    const totalDen = scouts.reduce((s, sc) => s + pair.den.reduce((n, k) => n + ((sc.counts?.[k] ?? 0) as number), 0), 0);
    return totalDen > 0 ? Math.round((totalNum / totalDen) * 100) : 0;
  }
  return 0;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoalProgressBar({ current, target }: { current: number; target: number }) {
  const p = pct(current, target);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <div
        className={`h-full rounded-full transition-all duration-500 ${progressColorClass(p)}`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

// ─── Goal Form Row ────────────────────────────────────────────────────────────

function GoalFormRow({
  goal,
  onChange,
  onRemove,
  index,
}: {
  goal: GoalItem;
  onChange: (g: GoalItem) => void;
  onRemove: () => void;
  index: number;
}) {
  const cc = catStyle(goal.category);

  const goalType = goal.goalType ?? "manual";
  const isAuto = goalType !== "manual";

  return (
    <div className="rounded-2xl bg-zinc-800/50 p-3 ring-1 ring-white/8">
      <div className="mb-2 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-500 font-medium">#{index + 1}</span>
        <select
          value={goal.category}
          onChange={(e) => onChange({ ...goal, category: e.target.value })}
          className={`rounded-xl px-2 py-1 text-xs font-semibold ring-1 bg-transparent border-none outline-none cursor-pointer ${cc.bg} ${cc.text} ${cc.ring}`}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-zinc-900 text-white">{c}</option>
          ))}
        </select>
        {/* Goal type selector */}
        <select
          value={goalType}
          onChange={(e) => onChange({ ...goal, goalType: e.target.value as GoalItem["goalType"] })}
          className="rounded-xl bg-zinc-700 px-2 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10 outline-none focus:ring-blue-500/40 cursor-pointer"
        >
          {GOAL_TYPES.map((t) => (
            <option key={t.value} value={t.value} className="bg-zinc-900">{t.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Scout key selector for auto types */}
      {isAuto && (
        <div className="mb-2">
          <select
            value={goal.scoutKey ?? ""}
            onChange={(e) => onChange({ ...goal, scoutKey: e.target.value })}
            className="w-full rounded-xl bg-zinc-700 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10 outline-none focus:ring-blue-500/40"
          >
            <option value="">Selecione a ação do scout...</option>
            {["Ofensivo", "Passes", "Defensivo"].map((group) => (
              <optgroup key={group} label={group}>
                {SCOUT_KEYS.filter((sk) => sk.group === group).map((sk) => (
                  <option key={sk.key} value={sk.key}>{sk.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input
          className="col-span-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 ring-1 ring-white/8 outline-none focus:ring-blue-500/40"
          placeholder="Nome do objetivo"
          value={goal.name}
          onChange={(e) => onChange({ ...goal, name: e.target.value })}
        />
        <input
          type="number"
          min={0}
          className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 ring-1 ring-white/8 outline-none focus:ring-blue-500/40"
          placeholder="Meta"
          value={goal.target || ""}
          onChange={(e) => onChange({ ...goal, target: Number(e.target.value) })}
        />
        <input
          className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 ring-1 ring-white/8 outline-none focus:ring-blue-500/40"
          placeholder="Unidade (%, gols...)"
          value={goal.unit}
          onChange={(e) => onChange({ ...goal, unit: e.target.value })}
        />
      </div>
      {isAuto && (
        <p className="mt-1.5 text-[10px] text-zinc-600">
          O valor atual será calculado automaticamente a partir dos scouts ao clicar em &quot;Recalcular&quot;.
        </p>
      )}
    </div>
  );
}

// ─── Expanded Goals (inline +/- quick update) ─────────────────────────────────

function ExpandedGoals({ meta, onProgress, onRefresh }: { meta: Meta; onProgress: (m: Meta) => void; onRefresh: () => void }) {
  const [localGoals, setLocalGoals] = useState<GoalItem[]>(
    Array.isArray(meta.goals) ? meta.goals : []
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalGoals(Array.isArray(meta.goals) ? meta.goals : []);
    setDirty(false);
  }, [meta]);

  function adjust(id: string, delta: number) {
    setLocalGoals((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, current: Math.max(0, g.current + delta) } : g
      )
    );
    setDirty(true);
  }

  function setCurrent(id: string, val: number) {
    setLocalGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, current: Math.max(0, val) } : g))
    );
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/metas/${meta.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goals: localGoals }),
    });
    setSaving(false);
    setDirty(false);
    onRefresh();
  }

  return (
    <div className="border-t border-white/5 p-5 pt-4 space-y-2">
      {localGoals.map((goal) => {
        const p = pct(goal.current, goal.target);
        const cc = catStyle(goal.category);
        return (
          <div key={goal.id} className="rounded-2xl bg-white/3 p-3 ring-1 ring-white/5">
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${cc.bg} ${cc.text} ${cc.ring}`}>
                {goal.category}
              </span>
              {goal.goalType && goal.goalType !== "manual" && (
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300 ring-1 ring-violet-500/20">
                  {GOAL_TYPES.find((t) => t.value === goal.goalType)?.label}
                </span>
              )}
              <span className="text-xs font-medium text-white flex-1">{goal.name}</span>
              <span className={`text-xs font-bold tabular-nums ${progressTextClass(p)}`}>{p}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjust(goal.id, -1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/8 text-sm font-bold text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/15 active:scale-90"
              >−</button>
              <input
                type="number"
                min={0}
                value={goal.current}
                onChange={(e) => setCurrent(goal.id, Number(e.target.value))}
                className="w-16 rounded-lg bg-zinc-800 px-2 py-1 text-center text-sm font-bold text-white ring-1 ring-white/10 outline-none focus:ring-blue-500/40 tabular-nums"
              />
              <button
                type="button"
                onClick={() => adjust(goal.id, 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-sm font-bold text-blue-300 ring-1 ring-blue-500/30 transition hover:bg-blue-600/35 active:scale-90"
              >+</button>
              <span className="text-xs text-zinc-500">/ {goal.target} {goal.unit}</span>
              <div className="flex-1">
                <GoalProgressBar current={goal.current} target={goal.target} />
              </div>
            </div>
          </div>
        );
      })}
      {dirty && (
        <div className="flex justify-end pt-1">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Meta Card ────────────────────────────────────────────────────────────────

function MetaCard({
  meta,
  onEdit,
  onDelete,
  onDownloadPDF,
  onProgress,
  onRefresh,
}: {
  meta: Meta;
  onEdit: (m: Meta) => void;
  onDelete: (id: string) => void;
  onDownloadPDF: (id: string) => void;
  onProgress: (m: Meta) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const goals = Array.isArray(meta.goals) ? meta.goals : [];
  const hasAutoGoals = goals.some((g) => g.goalType && g.goalType !== "manual" && g.scoutKey);

  async function handleRecalculate() {
    if (!hasAutoGoals) return;
    setRecalculating(true);
    try {
      const res = await fetch(`/api/scouts?athleteId=${meta.athlete.id}`);
      const data = await res.json();
      const scouts: Array<{ counts: Record<string, number> }> = data.scouts ?? [];
      const updated = goals.map((g) => {
        if (!g.goalType || g.goalType === "manual" || !g.scoutKey) return g;
        return { ...g, current: calcCurrentFromScouts(scouts, g.goalType, g.scoutKey) };
      });
      await fetch(`/api/metas/${meta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: updated }),
      });
      onRefresh();
    } catch {}
    setRecalculating(false);
  }
  const avgProgress = goals.length
    ? Math.round(goals.reduce((s, g) => s + pct(g.current, g.target), 0) / goals.length)
    : 0;
  const completed = goals.filter((g) => pct(g.current, g.target) >= 100).length;

  return (
    <div className="rounded-3xl bg-zinc-900 ring-1 ring-white/8 transition hover:ring-white/15">
      {/* Header */}
      <div className="flex items-start gap-4 p-5">
        {/* Avatar */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 ring-1 ring-white/10">
          {meta.athlete.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.athlete.photo} alt={meta.athlete.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-zinc-500">
              {meta.athlete.name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-white leading-snug">{meta.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {meta.athlete.name} · {meta.athlete.team} · {meta.athlete.position}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/20">
              {meta.season}
            </span>
          </div>

          {/* Progress summary */}
          <div className="mt-3 flex items-center gap-4">
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Progresso geral</span>
                <span className={`text-xs font-bold ${progressTextClass(avgProgress)}`}>{avgProgress}%</span>
              </div>
              <GoalProgressBar current={avgProgress} target={100} />
            </div>
            <div className="flex gap-3 text-center shrink-0">
              <div>
                <p className="text-sm font-bold text-white">{goals.length}</p>
                <p className="text-[10px] text-zinc-600">objetivos</p>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-400">{completed}</p>
                <p className="text-[10px] text-zinc-600">concluídos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-white/5 px-5 py-3">
        <span className="text-xs text-zinc-600">{formatDate(meta.createdAt)}</span>
        <span className="text-xs text-zinc-600">· {meta.analystName}</span>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-white/8 transition hover:bg-white/10"
          >
            {expanded ? "Recolher" : "Ver objetivos"}
          </button>
          {hasAutoGoals && (
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              title="Recalcular metas automáticas de scouts"
              className="flex items-center gap-1.5 rounded-xl bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-400 ring-1 ring-violet-500/20 transition hover:bg-violet-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${recalculating ? "animate-spin" : ""}`} />
              {recalculating ? "Calculando..." : "Recalcular"}
            </button>
          )}
          <button
            onClick={() => onProgress(meta)}
            title="Atualizar progresso"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20 transition hover:bg-emerald-500/20"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Progresso
          </button>
          <button
            onClick={() => onDownloadPDF(meta.id)}
            title="Baixar PDF"
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 text-zinc-400 ring-1 ring-white/8 transition hover:bg-blue-500/15 hover:text-blue-400"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onEdit(meta)}
            title="Editar"
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 text-zinc-400 ring-1 ring-white/8 transition hover:bg-white/10 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(meta.id)}
            title="Excluir"
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 text-zinc-400 ring-1 ring-white/8 transition hover:bg-red-500/15 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded goals */}
      {expanded && goals.length > 0 && (
        <ExpandedGoals meta={meta} onProgress={onProgress} onRefresh={onRefresh} />
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const BLANK_FORM = {
  athleteId: "",
  title: "",
  season: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
  description: "",
  analystName: "",
  goals: [] as GoalItem[],
};

function MetaModal({
  open,
  onClose,
  onSave,
  athletes,
  editMeta,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: typeof BLANK_FORM) => void;
  athletes: AthleteOption[];
  editMeta: Meta | null;
}) {
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [activePresetCat, setActivePresetCat] = useState<string>("Estatístico");

  useEffect(() => {
    if (editMeta) {
      setForm({
        athleteId: editMeta.athlete.id,
        title: editMeta.title,
        season: editMeta.season,
        description: editMeta.description,
        analystName: editMeta.analystName,
        goals: Array.isArray(editMeta.goals) ? editMeta.goals : [],
      });
    } else {
      setForm(BLANK_FORM);
    }
  }, [editMeta, open]);

  function addGoal(preset?: { name: string; unit: string; target: number }, cat?: string) {
    setForm((f) => ({
      ...f,
      goals: [
        ...f.goals,
        {
          id: uid(),
          category: cat ?? activePresetCat,
          name: preset?.name ?? "",
          target: preset?.target ?? 0,
          current: 0,
          unit: preset?.unit ?? "",
        },
      ],
    }));
  }

  function updateGoal(idx: number, goal: GoalItem) {
    setForm((f) => {
      const goals = [...f.goals];
      goals[idx] = goal;
      return { ...f, goals };
    });
  }

  function removeGoal(idx: number) {
    setForm((f) => ({ ...f, goals: f.goals.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    if (!form.athleteId || !form.title || !form.season || !form.analystName) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-8 pb-16">
      <div className="w-full max-w-2xl rounded-3xl bg-zinc-950 ring-1 ring-white/10 shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div>
            <h2 className="font-bold text-white">{editMeta ? "Editar Meta" : "Nova Meta"}</h2>
            <p className="text-xs text-zinc-500">Defina os objetivos numéricos da temporada</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-zinc-400 ring-1 ring-white/8 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Athlete + Season */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Atleta *</label>
              <select
                value={form.athleteId}
                onChange={(e) => setForm((f) => ({ ...f, athleteId: e.target.value }))}
                className="rounded-2xl bg-zinc-800 px-3 py-2.5 text-sm text-white ring-1 ring-white/8 outline-none focus:ring-blue-500/40"
              >
                <option value="" className="bg-zinc-900">Selecionar atleta</option>
                {athletes.map((a) => (
                  <option key={a.id} value={a.id} className="bg-zinc-900">
                    {a.name} — {a.team}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Temporada *</label>
              <input
                value={form.season}
                onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
                placeholder="ex: 2025/2026"
                className="rounded-2xl bg-zinc-800 px-3 py-2.5 text-sm text-white ring-1 ring-white/8 outline-none focus:ring-blue-500/40"
              />
            </div>
          </div>

          {/* Title + Analyst */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Título *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="ex: Objetivos 2025"
                className="rounded-2xl bg-zinc-800 px-3 py-2.5 text-sm text-white ring-1 ring-white/8 outline-none focus:ring-blue-500/40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Analista *</label>
              <input
                value={form.analystName}
                onChange={(e) => setForm((f) => ({ ...f, analystName: e.target.value }))}
                placeholder="Nome do analista"
                className="rounded-2xl bg-zinc-800 px-3 py-2.5 text-sm text-white ring-1 ring-white/8 outline-none focus:ring-blue-500/40"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Contexto ou notas sobre esses objetivos..."
              rows={2}
              className="rounded-2xl bg-zinc-800 px-3 py-2.5 text-sm text-white ring-1 ring-white/8 outline-none focus:ring-blue-500/40 resize-none"
            />
          </div>

          {/* Goals section */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Objetivos ({form.goals.length})
              </span>
              <button
                type="button"
                onClick={() => addGoal()}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600/20 px-3 py-1.5 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/30 transition hover:bg-blue-600/30"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </div>

            {/* Preset templates */}
            <div className="mb-3 rounded-2xl bg-white/3 p-3 ring-1 ring-white/5">
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-2">Adicionar por preset</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {CATEGORIES.map((c) => {
                  const cc = catStyle(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActivePresetCat(c)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 transition ${
                        activePresetCat === c ? `${cc.bg} ${cc.text} ${cc.ring}` : "bg-white/5 text-zinc-500 ring-white/10 hover:bg-white/8"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(CATEGORY_PRESETS[activePresetCat] ?? []).map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => addGoal(p, activePresetCat)}
                    className="rounded-xl bg-zinc-800 px-2.5 py-1 text-[10px] text-zinc-300 ring-1 ring-white/8 transition hover:bg-zinc-700 hover:text-white"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal rows */}
            {form.goals.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {form.goals.map((g, i) => (
                  <GoalFormRow
                    key={g.id}
                    goal={g}
                    index={i}
                    onChange={(updated) => updateGoal(i, updated)}
                    onRemove={() => removeGoal(i)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/3 py-6 text-center ring-1 ring-white/5">
                <p className="text-xs text-zinc-600">Nenhum objetivo adicionado ainda</p>
              </div>
            )}
          </div>

          {/* Progress update notice for edit */}
          {editMeta && (
            <div className="rounded-2xl bg-blue-500/8 p-3 ring-1 ring-blue-500/15">
              <p className="text-xs text-blue-300">
                <span className="font-semibold">Dica:</span> Atualize os valores &ldquo;atual&rdquo; de cada objetivo para registrar o progresso da temporada. Você pode editar direto nas metas abaixo.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-white/8 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/8 transition hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.athleteId || !form.title || !form.season || !form.analystName}
            className="flex-1 rounded-2xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Salvando..." : editMeta ? "Atualizar" : "Criar Meta"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Progress Update Modal ────────────────────────────────────────────────────

function ProgressModal({
  open,
  onClose,
  meta,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  meta: Meta | null;
  onSave: (goals: GoalItem[]) => void;
}) {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (meta) setGoals(Array.isArray(meta.goals) ? [...meta.goals] : []);
  }, [meta]);

  function updateCurrent(idx: number, val: number) {
    setGoals((g) => {
      const next = [...g];
      next[idx] = { ...next[idx], current: val };
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await onSave(goals);
    setSaving(false);
  }

  if (!open || !meta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-zinc-950 ring-1 ring-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div>
            <h2 className="font-bold text-white">Atualizar Progresso</h2>
            <p className="text-xs text-zinc-500">{meta.athlete.name} · {meta.season}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-zinc-400 ring-1 ring-white/8 transition hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-3">
          {goals.map((g, i) => {
            const p = pct(g.current, g.target);
            const cc = catStyle(g.category);
            return (
              <div key={g.id} className="rounded-2xl bg-zinc-800/60 p-4 ring-1 ring-white/8">
                <div className="mb-2 flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${cc.bg} ${cc.text} ${cc.ring}`}>
                    {g.category}
                  </span>
                  <span className="text-sm font-medium text-white flex-1">{g.name}</span>
                  <span className={`text-xs font-bold ${progressTextClass(p)}`}>{p}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={g.current || ""}
                    onChange={(e) => updateCurrent(i, Number(e.target.value))}
                    className="w-24 rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white ring-1 ring-white/8 outline-none focus:ring-blue-500/40"
                  />
                  <span className="text-xs text-zinc-500">/ {g.target} {g.unit}</span>
                  <div className="flex-1">
                    <GoalProgressBar current={g.current} target={g.target} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 border-t border-white/8 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-2xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/8 transition hover:bg-white/10">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 rounded-2xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar Progresso"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MetasPage() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [athletes, setAthletes] = useState<AthleteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMeta, setEditMeta] = useState<Meta | null>(null);
  const [progressMeta, setProgressMeta] = useState<Meta | null>(null);
  const [filterAthlete, setFilterAthlete] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchMetas = useCallback(async () => {
    const url = filterAthlete ? `/api/metas?athleteId=${filterAthlete}` : "/api/metas";
    const res = await fetch(url);
    const data = await res.json();
    setMetas(data.metas ?? []);
  }, [filterAthlete]);

  useEffect(() => {
    Promise.all([
      fetch("/api/athletes").then((r) => r.json()),
      fetchMetas(),
    ]).then(([athleteData]) => {
      setAthletes(athleteData.athletes ?? []);
    }).finally(() => setLoading(false));
  }, [fetchMetas]);

  useEffect(() => {
    if (!loading) fetchMetas();
  }, [filterAthlete, fetchMetas, loading]);

  async function handleSave(form: typeof BLANK_FORM) {
    if (editMeta) {
      await fetch(`/api/metas/${editMeta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setModalOpen(false);
    setEditMeta(null);
    await fetchMetas();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/metas/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    await fetchMetas();
  }

  async function handleProgressSave(goals: GoalItem[]) {
    if (!progressMeta) return;
    await fetch(`/api/metas/${progressMeta.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goals }),
    });
    setProgressMeta(null);
    await fetchMetas();
  }

  function handleDownloadPDF(id: string) {
    window.open(`/api/metas/${id}/pdf`, "_blank");
  }

  function openEdit(meta: Meta) {
    setEditMeta(meta);
    setModalOpen(true);
  }

  // Stats
  const totalGoals = metas.reduce((s, m) => s + (Array.isArray(m.goals) ? m.goals.length : 0), 0);
  const completedGoals = metas.reduce((s, m) => {
    const goals = Array.isArray(m.goals) ? m.goals : [];
    return s + goals.filter((g) => pct(g.current, g.target) >= 100).length;
  }, 0);

  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Metas da Temporada</h1>
            <p className="text-sm text-zinc-500">Objetivos numéricos e acompanhamento de progresso</p>
          </div>
          <button
            onClick={() => { setEditMeta(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Nova Meta
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Fichas de metas", value: metas.length, color: "text-blue-400" },
            { label: "Atletas com metas", value: new Set(metas.map((m) => m.athlete.id)).size, color: "text-violet-400" },
            { label: "Objetivos definidos", value: totalGoals, color: "text-white" },
            { label: "Objetivos alcançados", value: completedGoals, color: "text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/8">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="mt-1 text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterAthlete}
            onChange={(e) => setFilterAthlete(e.target.value)}
            className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-white ring-1 ring-white/8 outline-none focus:ring-blue-500/40"
          >
            <option value="" className="bg-zinc-900">Todos os atletas</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id} className="bg-zinc-900">{a.name} — {a.team}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-white/5 animate-pulse ring-1 ring-white/5" />
            ))}
          </div>
        ) : metas.length === 0 ? (
          <div className="rounded-3xl bg-white/5 p-16 text-center ring-1 ring-white/8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
              <BarChart2 className="h-8 w-8 text-zinc-500" />
            </div>
            <p className="font-semibold text-zinc-300">Nenhuma meta cadastrada</p>
            <p className="mt-1 text-sm text-zinc-600">Crie a primeira meta para um atleta.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {metas.map((meta) => (
              <MetaCard
                key={meta.id}
                meta={meta}
                onEdit={openEdit}
                onDelete={(id) => setConfirmDelete(id)}
                onDownloadPDF={handleDownloadPDF}
                onProgress={setProgressMeta}
                onRefresh={fetchMetas}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <MetaModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditMeta(null); }}
        onSave={handleSave}
        athletes={athletes}
        editMeta={editMeta}
      />

      {/* Progress Modal */}
      <ProgressModal
        open={Boolean(progressMeta)}
        onClose={() => setProgressMeta(null)}
        meta={progressMeta}
        onSave={handleProgressSave}
      />

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-950 p-6 ring-1 ring-white/10 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="font-bold text-white">Excluir Meta</h3>
            <p className="mt-1 text-sm text-zinc-400">Essa ação não pode ser desfeita.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-2xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/8 transition hover:bg-white/10">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 rounded-2xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
