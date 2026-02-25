"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ScoutModal, { ScoutModalValue } from "./ScoutModal";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type AthleteOption = {
  id: string;
  name: string;
  team: string;
  position: string;
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

type ActionItem = { key: keyof ScoutCounts; label: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_COUNTS: ScoutCounts = {
  passeErrado: 0, passeParaTras: 0, passeErradoDefensivo: 0,
  passeCertoOfensivo: 0, passeDecisivo: 0, passeEntreLinhas: 0,
  cruzamento: 0, assistencia: 0, finalizacaoNoAlvo: 0,
  finalizacaoFora: 0, gol: 0, desarme: 0, interceptacao: 0,
  recuperacaoPosse: 0, pressaoPosPerda: 0, aereoGanho: 0, aereoPerdido: 0,
};

const PASS_ACTIONS: ActionItem[] = [
  { key: "passeCertoOfensivo",   label: "Passe certo ofensivo" },
  { key: "passeDecisivo",        label: "Passe decisivo" },
  { key: "passeEntreLinhas",     label: "Passe entre linhas" },
  { key: "passeParaTras",        label: "Passe para trás" },
  { key: "passeErrado",          label: "Passe errado" },
  { key: "passeErradoDefensivo", label: "Passe errado (def.)" },
];

const OFF_ACTIONS: ActionItem[] = [
  { key: "gol",               label: "Gol" },
  { key: "assistencia",       label: "Assistência" },
  { key: "finalizacaoNoAlvo", label: "Finalização no alvo" },
  { key: "finalizacaoFora",   label: "Finalização fora" },
  { key: "cruzamento",        label: "Cruzamento" },
];

const DEF_ACTIONS: ActionItem[] = [
  { key: "desarme",          label: "Desarme" },
  { key: "interceptacao",    label: "Interceptação" },
  { key: "recuperacaoPosse", label: "Recuperação de posse" },
  { key: "pressaoPosPerda",  label: "Pressão pós-perda" },
  { key: "aereoGanho",       label: "Aéreo ganho" },
  { key: "aereoPerdido",     label: "Aéreo perdido" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseYouTubeId(url: string) {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "") || "";
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") || "";
    return "";
  } catch {
    return "";
  }
}

function autoMetrics(counts: ScoutCounts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const pos = counts.passeCertoOfensivo + counts.passeDecisivo + counts.passeEntreLinhas
    + counts.assistencia + counts.finalizacaoNoAlvo + counts.gol + counts.cruzamento
    + counts.desarme + counts.interceptacao + counts.recuperacaoPosse + counts.aereoGanho;
  const neg = counts.passeErrado + counts.passeErradoDefensivo + counts.finalizacaoFora + counts.aereoPerdido;

  const rating      = total > 0 ? Math.min(10, Math.max(1, Math.round((pos / Math.max(1, pos + neg)) * 10))) : 7;
  const intensity   = Math.min(10, Math.max(1, Math.round(total / 3)));
  const decision    = Math.min(10, Math.max(1, Math.round(((counts.passeDecisivo + counts.passeEntreLinhas + counts.assistencia) / Math.max(1, total)) * 40)));
  const positioning = Math.min(10, Math.max(1, Math.round(((counts.aereoGanho + counts.interceptacao + counts.desarme + counts.recuperacaoPosse) / Math.max(1, total)) * 40)));

  return { rating, intensity, decision, positioning };
}

function openPrintPdf(counts: ScoutCounts) {
  const sections = [
    { title: "Passes",    rows: PASS_ACTIONS.map((a) => [a.label, counts[a.key]]) },
    { title: "Ofensivo",  rows: OFF_ACTIONS.map((a)  => [a.label, counts[a.key]]) },
    { title: "Defensivo", rows: DEF_ACTIONS.map((a)  => [a.label, counts[a.key]]) },
  ] as const;
  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Tallents Scout</title>
<style>body{font-family:Arial,sans-serif;padding:24px}h1{margin:0 0 6px;font-size:18px}
p{margin:0 0 16px;color:#444;font-size:12px}h2{margin:18px 0 8px;font-size:14px}
table{width:100%;border-collapse:collapse;margin-bottom:10px}
th,td{border:1px solid #ddd;padding:10px;font-size:12px}th{background:#f4f4f4;text-align:left}
td:last-child{text-align:right;font-weight:700}</style></head><body>
<h1>Tallents • Scout</h1><p>Gerado em: ${new Date().toLocaleString()}</p>
${sections.map((s) => `<h2>${s.title}</h2><table><thead><tr><th>Ação</th><th>Qtd</th></tr></thead><tbody>
${s.rows.map(([l, v]) => `<tr><td>${l}</td><td>${v}</td></tr>`).join("")}</tbody></table>`).join("")}
<script>window.onload=()=>setTimeout(()=>window.print(),200);</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return alert("Permita pop-up para exportar PDF.");
  w.document.documentElement.innerHTML = html;
}

// ── MetricSlider ──────────────────────────────────────────────────────────────

function MetricSlider({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <span className="text-sm font-bold text-white">{value}<span className="text-zinc-600">/10</span></span>
      </div>
      <input type="range" min={0} max={10} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500 h-1.5 cursor-pointer" />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScoutPlayer({ athletes }: { athletes: AthleteOption[] }) {
  const router = useRouter();
  const playerRef = useRef<any>(null);
  const playerHostId = "tallents-yt-player";
  const activeClipEndRef = useRef<number | null>(null);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId]       = useState("");
  const [playerReady, setPlayerReady] = useState(false);

  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [counts, setCounts] = useState<ScoutCounts>(DEFAULT_COUNTS);
  const [clips, setClips]   = useState<Clip[]>([]);

  const [pendingRange, setPendingRange]   = useState<{ start: number; end: number } | null>(null);
  const [clipModalOpen, setClipModalOpen] = useState(false);
  const [activeClipId, setActiveClipId]   = useState<string | null>(null);
  const [tab, setTab] = useState<"passes" | "ofensivo" | "defensivo">("passes");

  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalForm, setFinalForm] = useState({
    title: "", summary: "", tags: "", rating: 7, intensity: 7, decision: 7, positioning: 7,
  });
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── YouTube ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (document.getElementById("yt-iframe-api")) return;
    const tag = document.createElement("script");
    tag.id = "yt-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  useEffect(() => {
    if (!videoId) return;
    const create = () => {
      if (!window.YT?.Player) return;
      setPlayerReady(false);
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = new window.YT.Player(playerHostId, {
        videoId,
        playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0 },
        events: { onReady: () => setPlayerReady(true) },
      });
    };
    if (window.YT?.Player) { create(); return; }
    window.onYouTubeIframeAPIReady = create;
  }, [videoId]);

  useEffect(() => {
    if (!playerReady) return;
    const timer = window.setInterval(() => {
      const end = activeClipEndRef.current;
      if (!end) return;
      const t = (() => { try { const v = Number(playerRef.current?.getCurrentTime?.()); return isFinite(v) ? v : 0; } catch { return 0; } })();
      if (t >= end - 0.05) {
        try { playerRef.current?.pauseVideo?.(); } catch {}
        activeClipEndRef.current = null;
        setActiveClipId(null);
      }
    }, 120);
    return () => clearInterval(timer);
  }, [playerReady]);

  function currentTime() {
    try { const t = Number(playerRef.current?.getCurrentTime?.()); return isFinite(t) ? t : 0; } catch { return 0; }
  }
  function seekTo(t: number) { try { playerRef.current?.seekTo?.(t, true); playerRef.current?.playVideo?.(); } catch {} }

  // ── Clips ──────────────────────────────────────────────────────────────────

  function createClip() {
    if (!playerReady) return alert("Carregue o vídeo primeiro.");
    const now = currentTime();
    setPendingRange({ start: Math.max(0, now - 5), end: now + 5 });
    setClipModalOpen(true);
  }

  function addClip(meta: ScoutModalValue) {
    if (!pendingRange) return;
    const newClip: Clip = {
      id: uid(), start: pendingRange.start, end: pendingRange.end,
      createdAt: Date.now(), label: meta.label.trim() || "Lance",
      description: meta.description.trim(), confidence: meta.confidence,
    };
    setClips((prev) => [...prev, newClip]);
    setPendingRange(null);
    setClipModalOpen(false);
  }

  function playClip(c: Clip) {
    if (!playerReady) return;
    activeClipEndRef.current = c.end;
    setActiveClipId(c.id);
    seekTo(Math.max(0, c.start));
  }

  function removeClip(id: string) {
    setClips((prev) => prev.filter((x) => x.id !== id));
    if (activeClipId === id) { activeClipEndRef.current = null; setActiveClipId(null); }
  }

  // ── Counts ─────────────────────────────────────────────────────────────────

  function inc(k: keyof ScoutCounts) { setCounts((p) => ({ ...p, [k]: p[k] + 1 })); }
  function dec(k: keyof ScoutCounts) { setCounts((p) => ({ ...p, [k]: Math.max(0, p[k] - 1) })); }

  const stats = useMemo(() => ({
    totalActions: Object.values(counts).reduce((a, b) => a + b, 0),
    totalClips: clips.length,
    goals: counts.gol,
    assists: counts.assistencia,
  }), [counts, clips]);

  const actions = tab === "passes" ? PASS_ACTIONS : tab === "ofensivo" ? OFF_ACTIONS : DEF_ACTIONS;

  // ── Finalize ───────────────────────────────────────────────────────────────

  function openFinalize() {
    if (!selectedAthleteId) return alert("Selecione um atleta antes de finalizar.");
    const m = autoMetrics(counts);
    const athlete = athletes.find((a) => a.id === selectedAthleteId);
    setFinalForm({
      title: athlete ? `Scout — ${athlete.name} — ${new Date().toLocaleDateString("pt-BR")}` : "",
      summary: "", tags: "",
      rating: m.rating, intensity: m.intensity,
      decision: m.decision, positioning: m.positioning,
    });
    setSaveError("");
    setFinalizeOpen(true);
  }

  async function handleFinalize(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      const clipPayload = clips.map((c) => ({
        start: c.start,
        end: c.end,
        label: c.label,
        description: c.description,
        confidence: c.confidence,
      }));

      const [scoutRes, reportRes] = await Promise.all([
        fetch("/api/scouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            athleteId: selectedAthleteId,
            youtubeUrl,
            counts,
            clips: clipPayload,
          }),
        }),
        fetch("/api/analyst-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            athleteId: selectedAthleteId,
            title: finalForm.title,
            summary: finalForm.summary,
            tags: finalForm.tags,
            rating: finalForm.rating,
            intensity: finalForm.intensity,
            decision: finalForm.decision,
            positioning: finalForm.positioning,
            clips: clipPayload,
            counts,
          }),
        }),
      ]);

      const reportData = await reportRes.json().catch(() => ({}));
      if (!reportRes.ok) { setSaveError((reportData as any)?.error || "Erro ao salvar relatório."); return; }
      const scoutData = await scoutRes.json().catch(() => ({}));
      if (!scoutRes.ok) {
        setSaveError((scoutData as any)?.error || "Erro ao salvar scout.");
        return;
      }

      setFinalizeOpen(false);
      router.push("/dashboard/reports");
    } catch {
      setSaveError("Erro ao conectar com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Scout ao vivo</p>
            <h2 className="mt-0.5 text-base font-semibold text-white">
              Cole o link do YouTube, carregue e clique nas ações durante o jogo
            </h2>
          </div>
          <div className="flex gap-3 shrink-0">
            {[
              { label: "Ações",   value: stats.totalActions, color: "text-blue-300"    },
              { label: "Cortes",  value: stats.totalClips,   color: "text-violet-300"  },
              { label: "Gols",    value: stats.goals,        color: "text-emerald-300" },
              { label: "Assist.", value: stats.assists,      color: "text-amber-300"   },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl bg-white/5 px-3 py-2 text-center ring-1 ring-white/10 min-w-13">
                <p className="text-[10px] text-zinc-500">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <select value={selectedAthleteId} onChange={(e) => setSelectedAthleteId(e.target.value)}
            className="rounded-2xl bg-zinc-900 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none sm:w-52">
            <option value="">Selecionar atleta…</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.position})</option>
            ))}
          </select>

          <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
            className="min-w-0 flex-1 rounded-2xl bg-zinc-900 px-4 py-2 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="https://www.youtube.com/watch?v=…" />

          <button type="button"
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            onClick={() => { const id = parseYouTubeId(youtubeUrl); if (!id) return alert("Cole um link válido do YouTube."); setVideoId(id); }}>
            Carregar
          </button>

          <button type="button"
            className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10"
            onClick={createClip}>
            Corte (−5/+5)
          </button>

          <button type="button"
            className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-zinc-400 ring-1 ring-white/10 transition hover:bg-white/10"
            onClick={() => openPrintPdf(counts)}>
            PDF
          </button>

          <button type="button"
            className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-zinc-500 ring-1 ring-white/10 transition hover:bg-red-500/10 hover:text-red-400"
            onClick={() => { if (confirm("Zerar tudo?")) { setCounts(DEFAULT_COUNTS); setClips([]); setVideoId(""); setYoutubeUrl(""); setSelectedAthleteId(""); } }}>
            Zerar
          </button>
        </div>

        {/* Status */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${videoId ? (playerReady ? "bg-emerald-400 animate-pulse" : "bg-amber-400") : "bg-zinc-600"}`} />
            <span className="text-xs text-zinc-500">
              {videoId ? (playerReady ? "Player pronto" : "Carregando…") : "Aguardando link"}
            </span>
          </div>
          {selectedAthlete && (
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300 ring-1 ring-blue-500/20">
              {selectedAthlete.name} · {selectedAthlete.position}
            </span>
          )}
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">

        {/* LEFT: video + clips */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">Vídeo</p>
              <p className="text-xs text-zinc-500">Clique num corte para assistir</p>
            </div>

            <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
              <div className="relative aspect-video bg-black">
                <div id={playerHostId} className="absolute inset-0" />
                {!videoId && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950">
                    <svg className="h-14 w-14 text-zinc-800" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21.582 6.186a2.506 2.506 0 00-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418a2.506 2.506 0 00-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814a2.506 2.506 0 001.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 001.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM10 15.5v-7l6 3.5-6 3.5z"/>
                    </svg>
                    <p className="text-xs text-zinc-600">Cole o link e clique em Carregar</p>
                  </div>
                )}
              </div>
            </div>

            {/* Clips list */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">Cortes marcados</p>
                <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400 ring-1 ring-white/10">{clips.length}</span>
              </div>
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {clips.length === 0 ? (
                  <div className="rounded-2xl bg-white/5 p-4 text-center ring-1 ring-white/5">
                    <p className="text-xs text-zinc-500">Nenhum corte. Use <span className="text-zinc-300">Corte (−5/+5)</span> enquanto assiste.</p>
                  </div>
                ) : (
                  [...clips].reverse().map((c) => {
                    const confColor = c.confidence === "alta"
                      ? "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20"
                      : c.confidence === "média"
                      ? "text-amber-400 bg-amber-500/10 ring-amber-500/20"
                      : "text-zinc-400 bg-white/5 ring-white/10";
                    return (
                      <div key={c.id} className={`rounded-2xl p-3 ring-1 transition ${activeClipId === c.id ? "bg-blue-600/15 ring-blue-500/30" : "bg-white/5 ring-white/10 hover:bg-white/8"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-sm font-semibold text-white">{c.label}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${confColor}`}>{c.confidence}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-zinc-500">{formatTime(c.start)} → {formatTime(c.end)}</p>
                            {c.description && <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{c.description}</p>}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button type="button" onClick={() => playClip(c)}
                              className="rounded-xl bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500">▶</button>
                            <button type="button" onClick={() => removeClip(c.id)}
                              className="rounded-xl bg-white/5 px-2.5 py-1.5 text-xs text-zinc-400 ring-1 ring-white/10 transition hover:bg-red-500/10 hover:text-red-400">✕</button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: actions */}
        <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Ações</p>
            <span className="text-xs text-zinc-500">{stats.totalActions} registradas</span>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {(["passes", "ofensivo", "defensivo"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`rounded-xl py-2 text-xs font-medium ring-1 transition ${tab === t ? "bg-blue-600/20 text-blue-300 ring-blue-500/30" : "bg-white/5 text-zinc-400 ring-white/10 hover:bg-white/10 hover:text-zinc-200"}`}>
                {t === "passes" ? "Passes" : t === "ofensivo" ? "Ofensivo" : "Defensivo"}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex-1 space-y-1.5 overflow-y-auto">
            {actions.map((it) => (
              <div key={it.key} className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
                <p className="min-w-0 truncate pr-2 text-sm text-zinc-200">{it.label}</p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button type="button" onClick={() => dec(it.key)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-base font-bold text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/15 active:scale-90">−</button>
                  <span className="w-10 text-center text-base font-bold tabular-nums text-white">{counts[it.key]}</span>
                  <button type="button" onClick={() => inc(it.key)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-base font-bold text-white transition hover:bg-blue-500 active:scale-90">+</button>
                </div>
              </div>
            ))}
          </div>

          {/* Finalize */}
          <div className="mt-4 border-t border-white/5 pt-4">
            <button type="button" onClick={openFinalize} disabled={!selectedAthleteId}
              className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">
              Finalizar Scout → Gerar Relatório
            </button>
            {!selectedAthleteId && (
              <p className="mt-1.5 text-center text-xs text-zinc-600">Selecione um atleta primeiro</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Clip modal ──────────────────────────────────────────────────── */}
      <ScoutModal
        open={clipModalOpen}
        onClose={() => { setClipModalOpen(false); setPendingRange(null); }}
        onConfirm={addClip}
        initialLabel="Lance"
      />

      {/* ── Finalize modal ───────────────────────────────────────────────── */}
      {finalizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFinalizeOpen(false)} />
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-zinc-900 shadow-2xl ring-1 ring-white/10">

            <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <h2 className="font-semibold text-white">Finalizar Scout</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Confirme e envie o relatório para o atleta</p>
              </div>
              <button onClick={() => setFinalizeOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFinalize} className="space-y-4 overflow-y-auto px-6 py-5">

              {/* Stats summary */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Ações",   value: stats.totalActions, color: "text-blue-400"    },
                  { label: "Cortes",  value: stats.totalClips,   color: "text-violet-400"  },
                  { label: "Gols",    value: stats.goals,        color: "text-emerald-400" },
                  { label: "Assist.", value: stats.assists,      color: "text-amber-400"   },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl bg-white/5 p-3 text-center ring-1 ring-white/10">
                    <p className="text-[10px] text-zinc-500">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Athlete chip */}
              {selectedAthlete && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2.5 ring-1 ring-blue-500/20">
                  <svg className="h-4 w-4 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                  </svg>
                  <span className="text-sm font-medium text-blue-300">{selectedAthlete.name}</span>
                  <span className="text-xs text-blue-400/60">{selectedAthlete.position} · {selectedAthlete.team}</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Título <span className="text-red-400">*</span></label>
                <input type="text" required value={finalForm.title}
                  onChange={(e) => setFinalForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Resumo / Observações <span className="text-red-400">*</span></label>
                <textarea required rows={3} value={finalForm.summary}
                  onChange={(e) => setFinalForm((f) => ({ ...f, summary: e.target.value }))}
                  placeholder="Descreva o desempenho, pontos fortes e áreas de melhoria…"
                  className="w-full resize-none rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Tags <span className="text-zinc-600">(vírgula)</span></label>
                <input type="text" value={finalForm.tags} placeholder="Ex: Passes, Pressão alta, Aéreo"
                  onChange={(e) => setFinalForm((f) => ({ ...f, tags: e.target.value }))}
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>

              <div className="space-y-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Métricas calculadas automaticamente</p>
                  <span className="text-[10px] text-zinc-600">Ajuste se necessário</span>
                </div>
                {(["rating", "intensity", "decision", "positioning"] as const).map((key) => (
                  <MetricSlider key={key}
                    label={{ rating: "Avaliação geral", intensity: "Intensidade", decision: "Tomada de decisão", positioning: "Posicionamento" }[key]}
                    value={finalForm[key]}
                    onChange={(v) => setFinalForm((f) => ({ ...f, [key]: v }))} />
                ))}
              </div>

              {saveError && (
                <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">{saveError}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setFinalizeOpen(false)}
                  className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10">Cancelar</button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
                  {saving ? "Enviando…" : "Enviar relatório →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
