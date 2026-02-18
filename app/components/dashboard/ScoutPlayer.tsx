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

/* ---------------- utils ---------------- */
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

/* ---------------- counts ---------------- */
type ScoutCounts = {
  // PASSES
  passeErrado: number;
  passeParaTras: number;
  passeErradoDefensivo: number;
  passeCertoOfensivo: number;
  passeDecisivo: number;
  passeEntreLinhas: number;

  // OFENSIVO
  cruzamento: number;
  assistencia: number;
  finalizacaoNoAlvo: number;
  finalizacaoFora: number;
  gol: number;

  // DEFENSIVO
  desarme: number;
  interceptacao: number;
  recuperacaoPosse: number;
  pressaoPosPerda: number;
  aereoGanho: number;
  aereoPerdido: number;
};

const DEFAULT_COUNTS: ScoutCounts = {
  passeErrado: 0,
  passeParaTras: 0,
  passeErradoDefensivo: 0,
  passeCertoOfensivo: 0,
  passeDecisivo: 0,
  passeEntreLinhas: 0,

  cruzamento: 0,
  assistencia: 0,
  finalizacaoNoAlvo: 0,
  finalizacaoFora: 0,
  gol: 0,

  desarme: 0,
  interceptacao: 0,
  recuperacaoPosse: 0,
  pressaoPosPerda: 0,
  aereoGanho: 0,
  aereoPerdido: 0,
};

type ActionItem = { key: keyof ScoutCounts; label: string };

const PASS_ACTIONS: ActionItem[] = [
  { key: "passeErrado", label: "Passe errado" },
  { key: "passeParaTras", label: "Passe para trás" },
  { key: "passeErradoDefensivo", label: "Passe errado (defensivo)" },
  { key: "passeCertoOfensivo", label: "Passe certo (ofensivo)" },
  { key: "passeDecisivo", label: "Passe decisivo" },
  { key: "passeEntreLinhas", label: "Passe entre linhas" },
];

const OFF_ACTIONS: ActionItem[] = [
  { key: "cruzamento", label: "Cruzamento" },
  { key: "assistencia", label: "Assistência" },
  { key: "finalizacaoNoAlvo", label: "Finalização no alvo" },
  { key: "finalizacaoFora", label: "Finalização fora" },
  { key: "gol", label: "Gol" },
];

const DEF_ACTIONS: ActionItem[] = [
  { key: "desarme", label: "Desarme" },
  { key: "interceptacao", label: "Interceptação" },
  { key: "recuperacaoPosse", label: "Recuperação de posse" },
  { key: "pressaoPosPerda", label: "Pressão pós-perda" },
  { key: "aereoGanho", label: "Aéreo ganho" },
  { key: "aereoPerdido", label: "Aéreo perdido" },
];

type Clip = {
  id: string;
  start: number;
  end: number;
  createdAt: number;
  label: string;
  description: string;
  confidence: "baixa" | "média" | "alta";
};

/* ---------------- pdf numbers only ---------------- */
function openPrintPdf(counts: ScoutCounts) {
  const sections: Array<{ title: string; rows: Array<[string, number]> }> = [
    { title: "Passes", rows: PASS_ACTIONS.map((a) => [a.label, counts[a.key]]) },
    { title: "Ofensivo", rows: OFF_ACTIONS.map((a) => [a.label, counts[a.key]]) },
    { title: "Defensivo", rows: DEF_ACTIONS.map((a) => [a.label, counts[a.key]]) },
  ];

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tallents • Scout (Números)</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h1 { margin: 0 0 6px; font-size: 18px; }
    p { margin: 0 0 16px; color: #444; font-size: 12px; }
    h2 { margin: 18px 0 8px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th, td { border: 1px solid #ddd; padding: 10px; font-size: 12px; }
    th { background: #f4f4f4; text-align: left; }
    td:last-child { text-align: right; font-weight: 700; }
  </style>
</head>
<body>
  <h1>Tallents • Scout (Somente números)</h1>
  <p>Gerado em: ${new Date().toLocaleString()}</p>

  ${sections
    .map(
      (s) => `
      <h2>${s.title}</h2>
      <table>
        <thead><tr><th>Ação</th><th>Quantidade</th></tr></thead>
        <tbody>
          ${s.rows.map(([label, val]) => `<tr><td>${label}</td><td>${val}</td></tr>`).join("")}
        </tbody>
      </table>`
    )
    .join("")}

  <script>window.onload = () => setTimeout(() => window.print(), 200);</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) return alert("Permita pop-up para exportar PDF.");
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/* ---------------- component ---------------- */
export default function ScoutPlayer({
  athleteId,
  athleteName,
}: {
  athleteId: string;
  athleteName: string;
}) {
  const router = useRouter();
  const playerRef = useRef<any>(null);
  const playerHostId = "tallents-yt-player";
  const activeClipEndRef = useRef<number | null>(null);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [playerReady, setPlayerReady] = useState(false);

  const [counts, setCounts] = useState<ScoutCounts>(DEFAULT_COUNTS);

  const [clips, setClips] = useState<Clip[]>([]);
  const [pendingRange, setPendingRange] = useState<{ start: number; end: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [tab, setTab] = useState<"passes" | "ofensivo" | "defensivo">("passes");
  const [saving, setSaving] = useState(false);

  /* load youtube iframe api once */
  useEffect(() => {
    if (document.getElementById("yt-iframe-api")) return;

    const tag = document.createElement("script");
    tag.id = "yt-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  /* create/update player when videoId changes */
  useEffect(() => {
    if (!videoId) return;

    const create = () => {
      if (!window.YT?.Player) return;

      setPlayerReady(false);

      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch {}
      }

      playerRef.current = new window.YT.Player(playerHostId, {
        videoId,
        playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0 },
        events: {
          onReady: () => setPlayerReady(true),
        },
      });
    };

    if (window.YT?.Player) {
      create();
      return;
    }

    window.onYouTubeIframeAPIReady = () => create();
  }, [videoId]);

  /* helper: current time */
  function currentTime() {
    try {
      const t = Number(playerRef.current?.getCurrentTime?.() ?? 0);
      return Number.isFinite(t) ? t : 0;
    } catch {
      return 0;
    }
  }

  function seekTo(t: number) {
    try {
      playerRef.current?.seekTo?.(t, true);
      playerRef.current?.playVideo?.();
    } catch {}
  }

  function pause() {
    try {
      playerRef.current?.pauseVideo?.();
    } catch {}
  }

  /* stop automatically when clip ends */
  useEffect(() => {
    if (!playerReady) return;

    const timer = window.setInterval(() => {
      const end = activeClipEndRef.current;
      if (!end) return;

      const t = currentTime();
      if (t >= end - 0.05) {
        pause();
        activeClipEndRef.current = null;
        setActiveClipId(null);
      }
    }, 120);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerReady]);

  function createClip() {
    if (!playerReady) return alert("Carregue o vídeo do YouTube primeiro.");
    const now = currentTime();
    const start = Math.max(0, now - 5);
    const end = now + 5;

    setPendingRange({ start, end });
    setModalOpen(true);
  }

  function addClip(meta: ScoutModalValue) {
    if (!pendingRange) return;
    setClips((prev) => [
      ...prev,
      {
        id: uid(),
        start: pendingRange.start,
        end: pendingRange.end,
        createdAt: Date.now(),
        label: meta.label.trim() || "Lance",
        description: meta.description.trim(),
        confidence: meta.confidence,
      },
    ]);
    setPendingRange(null);
    setModalOpen(false);
  }

  function playClip(c: Clip) {
    if (!playerReady) return;
    activeClipEndRef.current = c.end;
    setActiveClipId(c.id);
    seekTo(Math.max(0, c.start));
  }

  function removeClip(id: string) {
    setClips((prev) => prev.filter((x) => x.id !== id));
    if (activeClipId === id) {
      activeClipEndRef.current = null;
      setActiveClipId(null);
    }
  }

  function inc(k: keyof ScoutCounts) {
    setCounts((p) => ({ ...p, [k]: p[k] + 1 }));
  }

  function dec(k: keyof ScoutCounts) {
    setCounts((p) => ({ ...p, [k]: Math.max(0, p[k] - 1) }));
  }

  function resetCounts() {
    setCounts(DEFAULT_COUNTS);
  }

  const stats = useMemo(() => {
    const totalActions = Object.values(counts).reduce((a, b) => a + b, 0);
    const totalClips = clips.length;
    const totalDuration = clips.reduce((sum, c) => sum + Math.max(0, c.end - c.start), 0);
    return { totalActions, totalClips, totalDuration };
  }, [counts, clips]);

  async function finishScout() {
    if (!youtubeUrl) return alert("Carregue um vídeo do YouTube antes de concluir.");
    const totalActions = Object.values(counts).reduce((a, b) => a + b, 0);
    if (totalActions === 0) return alert("Registre pelo menos uma ação antes de concluir.");

    setSaving(true);
    try {
      const res = await fetch("/api/scouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId,
          youtubeUrl,
          counts,
          clips: clips.map((c) => ({
            start: c.start,
            end: c.end,
            label: c.label,
            description: c.description,
            confidence: c.confidence,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao salvar scout");
        return;
      }

      router.push("/dashboard/reports");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const actions = tab === "passes" ? PASS_ACTIONS : tab === "ofensivo" ? OFF_ACTIONS : DEF_ACTIONS;

  return (
    <div className="space-y-4">
      {/* TOP: Youtube input */}
      <div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-zinc-300">Scout • YouTube</p>
            <p className="text-base font-semibold">Prático durante o jogo (botões perto do vídeo)</p>
            <p className="mt-1 text-sm text-zinc-300">
              Carregue o link, assista e vá clicando nas ações. Para lance: <b>Criar corte</b>.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:w-auto">
            <div className="rounded-2xl bg-white/5 px-4 py-2 text-center ring-1 ring-white/10">
              <p className="text-xs text-zinc-300">Ações</p>
              <p className="text-lg font-semibold text-blue-300">{stats.totalActions}</p>
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-2 text-center ring-1 ring-white/10">
              <p className="text-xs text-zinc-300">Cortes</p>
              <p className="text-lg font-semibold text-blue-300">{stats.totalClips}</p>
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-2 text-center ring-1 ring-white/10">
              <p className="text-xs text-zinc-300">Tempo</p>
              <p className="text-lg font-semibold text-blue-300">{Math.round(stats.totalDuration)}s</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="min-w-0 flex-1 rounded-2xl bg-white/5 px-4 py-2 text-sm ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <button
            type="button"
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            onClick={() => {
              const id = parseYouTubeId(youtubeUrl);
              if (!id) return alert("Cole um link válido do YouTube (watch?v=... ou youtu.be/...)");
              setVideoId(id);
            }}
          >
            Carregar
          </button>

          <button
            type="button"
            className="rounded-2xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20"
            onClick={createClip}
          >
            Criar corte (-5/+5)
          </button>

          <button
            type="button"
            className="rounded-2xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
            onClick={resetCounts}
          >
            Zerar
          </button>

          <button
            type="button"
            className="rounded-2xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10 hover:bg-white/15"
            onClick={() => openPrintPdf(counts)}
          >
            PDF (números)
          </button>

          <button
            type="button"
            disabled={saving}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white ring-1 ring-emerald-500/25 hover:bg-emerald-500 disabled:opacity-50"
            onClick={finishScout}
          >
            {saving ? "Salvando..." : "Concluir Scout"}
          </button>
        </div>

        <p className="mt-2 text-xs text-zinc-400">
          Status: {videoId ? (playerReady ? "Player pronto ✅" : "Carregando player...") : "Aguardando link"}
        </p>
      </div>

      {/* MAIN: video + action panel */}
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* LEFT: VIDEO + CLIPS */}
        <div className="space-y-4">
          {/* Video */}
          <div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Vídeo</p>
              <p className="text-xs text-zinc-300">
                Dica: clique num lance embaixo para assistir o corte.
              </p>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-white/10">
              <div className="relative aspect-video bg-black">
                <div id={playerHostId} className="absolute inset-0" />
              </div>
            </div>

            {/* Clips list (scroll only here) */}
            <div className="mt-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Lances cortados</p>
                <span className="text-xs text-zinc-300">{clips.length} itens</span>
              </div>

              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                {clips.length === 0 ? (
                  <div className="rounded-2xl bg-white/5 p-4 text-sm text-zinc-300 ring-1 ring-white/10">
                    Nenhum corte ainda. Use <b>Criar corte</b> enquanto assiste.
                  </div>
                ) : (
                  [...clips].reverse().map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-2xl p-3 ring-1 transition ${
                        activeClipId === c.id
                          ? "bg-blue-600/15 ring-blue-500/30"
                          : "bg-white/5 ring-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{c.label}</p>
                          <p className="mt-1 text-xs text-zinc-300">
                            {formatTime(c.start)} → {formatTime(c.end)} • confiança:{" "}
                            <span className="font-semibold text-zinc-200">{c.confidence}</span>
                          </p>
                          {c.description ? (
                            <p className="mt-2 text-sm text-zinc-300 line-clamp-2">
                              {c.description}
                            </p>
                          ) : (
                            <p className="mt-2 text-sm text-zinc-400">Sem descrição.</p>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                            onClick={() => playClip(c)}
                          >
                            Assistir
                          </button>
                          <button
                            type="button"
                            className="rounded-2xl bg-white/10 px-3 py-2 text-xs ring-1 ring-white/10 hover:bg-white/15"
                            onClick={() => removeClip(c.id)}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <p className="mt-2 text-xs text-zinc-400">
                O lance toca e <b>para sozinho</b> ao final do corte.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: ACTIONS (near video) */}
        <div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Ações (clique rápido)</p>
            <span className="text-xs text-zinc-300">{stats.totalActions} total</span>
          </div>

          {/* Tabs */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTab("passes")}
              className={`rounded-2xl px-3 py-2 text-sm ring-1 transition ${
                tab === "passes"
                  ? "bg-blue-600/20 text-blue-200 ring-blue-500/30"
                  : "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
              }`}
            >
              Passes
            </button>
            <button
              type="button"
              onClick={() => setTab("ofensivo")}
              className={`rounded-2xl px-3 py-2 text-sm ring-1 transition ${
                tab === "ofensivo"
                  ? "bg-blue-600/20 text-blue-200 ring-blue-500/30"
                  : "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
              }`}
            >
              Ofensivo
            </button>
            <button
              type="button"
              onClick={() => setTab("defensivo")}
              className={`rounded-2xl px-3 py-2 text-sm ring-1 transition ${
                tab === "defensivo"
                  ? "bg-blue-600/20 text-blue-200 ring-blue-500/30"
                  : "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
              }`}
            >
              Defensivo
            </button>
          </div>

          {/* Big practical buttons */}
          <div className="mt-3 grid gap-2">
            {actions.map((it) => (
              <div
                key={it.key}
                className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{it.label}</p>
                  <p className="text-xs text-zinc-400">clique no + durante o jogo</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-10 w-10 rounded-2xl bg-white/10 text-lg font-semibold ring-1 ring-white/10 hover:bg-white/15"
                    onClick={() => dec(it.key)}
                    aria-label={`Diminuir ${it.label}`}
                  >
                    −
                  </button>

                  <div className="min-w-[46px] text-center text-lg font-semibold text-zinc-100">
                    {counts[it.key]}
                  </div>

                  <button
                    type="button"
                    className="h-10 w-10 rounded-2xl bg-blue-600 text-lg font-semibold text-white ring-1 ring-blue-500/30 hover:bg-blue-500"
                    onClick={() => inc(it.key)}
                    aria-label={`Adicionar ${it.label}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-xs text-zinc-300">
              Prático: deixa este painel aberto enquanto assiste o jogo.
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ScoutModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPendingRange(null);
        }}
        onConfirm={addClip}
        initialLabel="Lance"
      />
    </div>
  );
}
