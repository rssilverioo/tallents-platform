"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────

type CalendarEvent = {
  id: string;
  summary?: string | null;
  description?: string | null;
  start?: string | null;
  end?: string | null;
  htmlLink?: string | null;
};

const EMPTY_FORM = {
  title: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatEventDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── AgendaContent ─────────────────────────────────────────────────────────────

function AgendaContent() {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveErro, setSaveErro] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/agenda");
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setErro(data?.error ?? "Erro ao carregar eventos");
        return;
      }
      setConnected(data.connected);
      setEvents(data.events ?? []);
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const conn = searchParams.get("connected");
    const err = searchParams.get("error");
    if (conn === "1") fetchEvents();
    if (err === "google_denied") setErro("Autorização negada. Tente novamente.");
    if (err === "token_exchange") setErro("Erro ao obter tokens do Google. Tente novamente.");
  }, [searchParams, fetchEvents]);

  async function handleDeleteEvent(eventId: string) {
    setDeletingId(eventId);
    try {
      const res = await fetch(`/api/agenda/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((ev) => ev.filter((e) => e.id !== eventId));
      } else {
        const data = await res.json().catch(() => ({}));
        setErro(data?.error ?? "Erro ao excluir evento.");
      }
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveErro("");
    setSaving(true);

    const startDateTime = `${form.date}T${form.startTime}:00`;
    const endDateTime = `${form.date}T${form.endTime}:00`;

    try {
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          startDateTime,
          endDateTime,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveErro(data?.error ?? "Erro ao criar evento.");
        return;
      }
      setModalOpen(false);
      setForm(EMPTY_FORM);
      fetchEvents();
    } catch {
      setSaveErro("Erro ao conectar com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  // ── Tela de loading inicial ────────────────────────────────────────────────

  if (loading && connected === null) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Agenda</h1>
          <p className="mt-0.5 text-sm text-zinc-400">Carregando…</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/5" />
          ))}
        </div>
      </div>
    );
  }

  // ── Tela de não conectado ──────────────────────────────────────────────────

  if (connected === false) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Agenda</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Gerencie reuniões sincronizadas com o Google Calendar.
          </p>
        </div>

        {erro && (
          <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">
            {erro}
          </div>
        )}

        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10 py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12V13.5zm0 3h.008v.008H12v-.008zm-3 0h.008v.008H9V16.5zm6 0h.008v.008H15v-.008z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-white">Google Calendar não conectado</p>
          <p className="mt-1.5 max-w-sm text-sm text-zinc-400">
            Conecte sua conta Google para visualizar e criar eventos diretamente no dashboard.
          </p>
          <button
            onClick={() => { window.location.href = "/api/auth/google"; }}
            className="mt-6 flex items-center gap-2.5 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 active:scale-95"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Conectar Google Calendar
          </button>
        </div>
      </div>
    );
  }

  // ── Tela conectada ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Agenda</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {loading
              ? "Atualizando…"
              : `${events.length} evento${events.length !== 1 ? "s" : ""} próximo${events.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <button
          onClick={() => { setForm(EMPTY_FORM); setSaveErro(""); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova reunião
        </button>
      </div>

      {erro && (
        <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">
          {erro}
        </div>
      )}

      {/* Lista de eventos */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/5" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <svg className="h-7 w-7 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
          </div>
          <p className="font-semibold text-zinc-300">Nenhum evento próximo</p>
          <p className="mt-1 text-sm text-zinc-500">
            Clique em "Nova reunião" para criar um evento no Google Calendar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const startDate = event.start ? new Date(event.start) : null;
            return (
              <div
                key={event.id}
                className="flex items-start gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/[0.07]"
              >
                {/* Badge de data */}
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-600/20 ring-1 ring-blue-500/25 text-blue-300">
                  <span className="text-sm font-bold leading-none">
                    {startDate ? startDate.getDate() : "—"}
                  </span>
                  <span className="mt-0.5 text-[9px] uppercase tracking-wider">
                    {startDate ? startDate.toLocaleString("pt-BR", { month: "short" }) : ""}
                  </span>
                </div>

                {/* Conteúdo */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {event.summary ?? "(sem título)"}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {formatEventDateTime(event.start)} → {formatEventDateTime(event.end)}
                  </p>
                  {event.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white"
                      title="Abrir no Google Calendar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => event.id && handleDeleteEvent(event.id)}
                    disabled={deletingId === event.id}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                    title="Excluir evento"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Nova reunião ────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 shadow-2xl ring-1 ring-white/10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <h2 className="font-semibold text-white">Nova reunião</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Criada diretamente no Google Calendar</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateEvent} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reunião com João Silva"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Descrição <span className="text-zinc-600">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Notas sobre a reunião…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full resize-none rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Data <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Início <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Fim <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              {saveErro && (
                <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">
                  {saveErro}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? "Criando…" : "Criar evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page export ────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <div className="h-8 w-32 animate-pulse rounded-xl bg-white/5" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/5" />
            ))}
          </div>
        </div>
      }
    >
      <AgendaContent />
    </Suspense>
  );
}
