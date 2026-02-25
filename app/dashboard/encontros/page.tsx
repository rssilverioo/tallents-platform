"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Athlete = {
  id: string;
  name: string;
  team: string;
  position: string;
  remainingMeetings: number;
  photo: string;
};

type ScoutClip = {
  id: string;
  start: number;
  end: number;
  label: string;
  description: string;
  confidence: string;
};

type Scout = {
  id: string;
  youtubeUrl: string;
  createdAt: string;
  clips: ScoutClip[];
};

function fmt(t: number) {
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
}

function parseYouTubeId(url: string) {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v") ?? "";
  } catch {
    // invalid URL
  }
  return "";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// -- EncounterModal --

function EncounterModal({
  athlete,
  onClose,
  onFinish,
}: {
  athlete: Athlete;
  onClose: () => void;
  onFinish: (id: string) => void;
}) {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loadingScouts, setLoadingScouts] = useState(true);
  const [selectedScout, setSelectedScout] = useState<Scout | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [done, setDone] = useState(false);

  // YouTube player state
  const playerRef = useRef<any>(null);
  const playerHostId = "encounter-yt-player";
  const activeClipEndRef = useRef<number | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);

  // Load scouts
  useEffect(() => {
    fetch(`/api/scouts?athleteId=${athlete.id}`)
      .then((r) => r.json())
      .then((d) => setScouts(d.scouts ?? []))
      .catch(() => setScouts([]))
      .finally(() => setLoadingScouts(false));
  }, [athlete.id]);

  // Load YouTube IFrame API once
  useEffect(() => {
    if (document.getElementById("yt-iframe-api")) return;
    const tag = document.createElement("script");
    tag.id = "yt-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }, []);

  // Create/recreate player when scout changes
  useEffect(() => {
    if (!selectedScout) return;

    const videoId = parseYouTubeId(selectedScout.youtubeUrl);
    if (!videoId) return;

    setPlayerReady(false);
    setActiveClipId(null);
    activeClipEndRef.current = null;

    const create = () => {
      if (!window.YT?.Player) return;
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = new window.YT.Player(playerHostId, {
        videoId,
        playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0 },
        events: { onReady: () => setPlayerReady(true) },
      });
    };

    if (window.YT?.Player) {
      create();
    } else {
      window.onYouTubeIframeAPIReady = create;
    }

    return () => {
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = null;
    };
  }, [selectedScout]);

  // Auto-stop at clip end time
  useEffect(() => {
    if (!playerReady) return;
    const timer = window.setInterval(() => {
      const end = activeClipEndRef.current;
      if (!end) return;
      try {
        const t = Number(playerRef.current?.getCurrentTime?.());
        if (isFinite(t) && t >= end - 0.1) {
          playerRef.current?.pauseVideo?.();
          activeClipEndRef.current = null;
          setActiveClipId(null);
        }
      } catch {}
    }, 150);
    return () => clearInterval(timer);
  }, [playerReady]);

  function playClip(clip: ScoutClip) {
    if (!playerReady) return;
    activeClipEndRef.current = clip.end;
    setActiveClipId(clip.id);
    try {
      playerRef.current?.seekTo?.(Math.max(0, clip.start), true);
      playerRef.current?.playVideo?.();
    } catch {}
  }

  async function handleFinish() {
    if (athlete.remainingMeetings <= 0) return;
    setFinishing(true);
    try {
      await fetch(`/api/athletes/${athlete.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remainingMeetings: athlete.remainingMeetings - 1 }),
      });
      setDone(true);
      onFinish(athlete.id);
    } finally {
      setFinishing(false);
    }
  }

  const videoId = selectedScout ? parseYouTubeId(selectedScout.youtubeUrl) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex w-full max-w-4xl flex-col rounded-3xl bg-zinc-900 ring-1 ring-white/10 shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-white/10">
              {athlete.photo ? (
                <Image src={athlete.photo} alt={athlete.name} fill className="object-cover" sizes="40px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-zinc-400">
                  {athlete.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-white">{athlete.name}</p>
              <p className="text-xs text-zinc-400">
                {athlete.team} · {athlete.position} ·{" "}
                <span className="text-blue-300">{athlete.remainingMeetings} encontros restantes</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 gap-0 overflow-hidden">
          {/* Left: scout list */}
          <div className="flex w-56 shrink-0 flex-col border-r border-white/5 overflow-y-auto">
            <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Scouts salvos
            </p>
            {loadingScouts ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : scouts.length === 0 ? (
              <p className="px-4 text-sm text-zinc-500">Nenhum scout salvo</p>
            ) : (
              <div className="space-y-1 px-2 pb-2">
                {scouts.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScout(s)}
                    className={`w-full rounded-2xl px-3 py-2.5 text-left ring-1 transition ${
                      selectedScout?.id === s.id
                        ? "bg-blue-600/20 ring-blue-500/30 text-white"
                        : "bg-white/5 ring-white/10 text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    <p className="text-xs font-semibold">Scout #{scouts.length - i}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">{formatDate(s.createdAt)}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {s.clips.length} lance{s.clips.length !== 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: player + clips */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            {!selectedScout ? (
              <div className="flex flex-1 items-center justify-center py-16 text-center">
                <div>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                    <svg className="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                    </svg>
                  </div>
                  <p className="text-sm text-zinc-400">Selecione um scout para iniciar</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* YouTube player via IFrame API */}
                <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
                  <div className="relative aspect-video bg-zinc-950">
                    <div id={playerHostId} className="absolute inset-0" />
                    {!videoId && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-sm text-zinc-500">URL do YouTube inválida</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Player status */}
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${videoId ? (playerReady ? "bg-emerald-400 animate-pulse" : "bg-amber-400") : "bg-zinc-600"}`} />
                  <span className="text-xs text-zinc-500">
                    {!videoId ? "URL inválida" : playerReady ? "Player pronto — clique num lance para assistir" : "Carregando player..."}
                  </span>
                </div>

                {/* Clips */}
                {selectedScout.clips.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Lances cortados ({selectedScout.clips.length})
                    </p>
                    <div className="space-y-2">
                      {selectedScout.clips.map((c) => {
                        const isActive = activeClipId === c.id;
                        const confStyle =
                          c.confidence === "alta"
                            ? "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20"
                            : c.confidence === "média"
                              ? "text-amber-400 bg-amber-500/10 ring-amber-500/20"
                              : "text-zinc-400 bg-white/5 ring-white/10";
                        return (
                          <div
                            key={c.id}
                            className={`rounded-2xl p-3 ring-1 transition ${
                              isActive
                                ? "bg-blue-600/15 ring-blue-500/30"
                                : "bg-white/5 ring-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-sm font-semibold text-white">{c.label}</span>
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${confStyle}`}>
                                    {c.confidence}
                                  </span>
                                  <span className="text-xs text-zinc-500">
                                    {fmt(c.start)} → {fmt(c.end)}
                                  </span>
                                </div>
                                {c.description && (
                                  <p className="mt-1 text-xs text-zinc-400">{c.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => playClip(c)}
                                disabled={!playerReady}
                                title="Assistir lance"
                                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                                  isActive
                                    ? "bg-blue-500 text-white"
                                    : "bg-blue-600 text-white hover:bg-blue-500"
                                }`}
                              >
                                ▶
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedScout.clips.length === 0 && (
                  <p className="text-sm text-zinc-500">Nenhum lance cortado neste scout.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/5 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {done
              ? "Encontro finalizado!"
              : athlete.remainingMeetings <= 0
                ? "Sem encontros restantes"
                : "Ao finalizar, o contador de encontros será decrementado"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-xl bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              {done ? "Fechar" : "Cancelar"}
            </button>
            {!done && (
              <button
                onClick={handleFinish}
                disabled={finishing || athlete.remainingMeetings <= 0}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
              >
                {finishing ? "Finalizando..." : "Finalizar Encontro"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Page --

export default function EncountrosPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAthlete, setActiveAthlete] = useState<Athlete | null>(null);

  const fetchAthletes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/athletes");
      const data = await res.json();
      setAthletes(data.athletes ?? []);
    } catch {
      setAthletes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  function handleFinish(athleteId: string) {
    setAthletes((prev) =>
      prev.map((a) =>
        a.id === athleteId
          ? { ...a, remainingMeetings: Math.max(0, a.remainingMeetings - 1) }
          : a
      )
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Encontros</h1>
        <p className="mt-0.5 text-sm text-zinc-400">
          {loading
            ? "Carregando atletas..."
            : `${athletes.length} atleta${athletes.length !== 1 ? "s" : ""} — selecione para iniciar um encontro`}
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/5" />
          ))}
        </div>
      ) : athletes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10 py-16 text-center">
          <p className="font-semibold text-zinc-300">Nenhum atleta cadastrado</p>
          <p className="mt-1 text-sm text-zinc-500">Cadastre atletas na aba Atletas para começar.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {athletes.map((a) => (
            <div
              key={a.id}
              className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/[0.07] hover:ring-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 ring-1 ring-white/10">
                  {a.photo ? (
                    <Image src={a.photo} alt={a.name} fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-zinc-400">
                      {a.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.name}</p>
                  <p className="text-xs text-zinc-400">{a.team} · {a.position}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold text-blue-300">{a.remainingMeetings}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide">restantes</p>
                </div>
              </div>

              <button
                onClick={() => setActiveAthlete(a)}
                disabled={a.remainingMeetings <= 0}
                className="mt-4 w-full rounded-2xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {a.remainingMeetings <= 0 ? "Sem encontros restantes" : "Iniciar Encontro"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {activeAthlete && (
        <EncounterModal
          athlete={activeAthlete}
          onClose={() => setActiveAthlete(null)}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
}
