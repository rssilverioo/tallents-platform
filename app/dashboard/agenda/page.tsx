"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Category = "geral" | "atleta" | "pais" | "avaliacao" | "aula_experimental";

type AgendaEvent = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  category: Category;
  completed: boolean;
  athlete?: { id: string; name: string } | null;
};

type Athlete = { id: string; name: string; team: string };

// ── Color system ───────────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  Category | "completed",
  { label: string; dot: string; badge: string; border: string; ring: string }
> = {
  completed: {
    label: "Concluído",
    dot: "bg-green-400",
    badge: "bg-green-600/20 text-green-300",
    border: "border-l-green-500",
    ring: "ring-green-500/20",
  },
  atleta: {
    label: "Atleta",
    dot: "bg-blue-400",
    badge: "bg-blue-600/20 text-blue-300",
    border: "border-l-blue-500",
    ring: "ring-blue-500/20",
  },
  pais: {
    label: "Pais",
    dot: "bg-red-400",
    badge: "bg-red-600/20 text-red-300",
    border: "border-l-red-500",
    ring: "ring-red-500/20",
  },
  avaliacao: {
    label: "Avaliação",
    dot: "bg-pink-400",
    badge: "bg-pink-600/20 text-pink-300",
    border: "border-l-pink-500",
    ring: "ring-pink-500/20",
  },
  aula_experimental: {
    label: "Aula Experimental",
    dot: "bg-orange-400",
    badge: "bg-orange-600/20 text-orange-300",
    border: "border-l-orange-500",
    ring: "ring-orange-500/20",
  },
  geral: {
    label: "Geral",
    dot: "bg-zinc-400",
    badge: "bg-zinc-700/50 text-zinc-300",
    border: "border-l-zinc-500",
    ring: "ring-zinc-500/20",
  },
};

function getEventMeta(event: AgendaEvent) {
  if (event.completed) return CATEGORY_META.completed;
  return CATEGORY_META[event.category] ?? CATEGORY_META.geral;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "",
  description: "",
  date: "",
  startHour: "",
  startMinute: "",
  endHour: "",
  endMinute: "",
  athleteId: "",
  category: "geral" as Category,
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

const MONTHS_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "geral",            label: "Geral" },
  { value: "atleta",           label: "Atleta" },
  { value: "pais",             label: "Pais" },
  { value: "avaliacao",        label: "Avaliação" },
  { value: "aula_experimental",label: "Aula Experimental" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDayMonth(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getDate())} ${MONTHS_PT[d.getMonth()].slice(0, 3)}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveErro, setSaveErro] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await fetch(`/api/agenda?year=${year}&month=${month}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data?.error ?? "Erro ao carregar eventos");
        return;
      }
      setEvents(data.events ?? []);
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    fetch("/api/athletes")
      .then((r) => r.json())
      .then((d) => setAthletes(d.athletes ?? d ?? []))
      .catch(() => {});
  }, []);

  // ── Calendar ─────────────────────────────────────────────────────────────────

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const daysWithEvents = useMemo(() => {
    const set = new Set<number>();
    events.forEach((e) => {
      const d = new Date(e.startDate);
      if (d.getFullYear() === year && d.getMonth() === month) set.add(d.getDate());
    });
    return set;
  }, [events, year, month]);

  const visibleEvents = useMemo(() => {
    if (selectedDay === null) return events;
    return events.filter((e) => new Date(e.startDate).getDate() === selectedDay);
  }, [events, selectedDay]);

  function prevMonth() {
    setSelectedDay(null);
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function nextMonth() {
    setSelectedDay(null);
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  // ── Create ───────────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaveErro("");
    setSaving(true);
    try {
      const startDate = new Date(`${form.date}T${form.startHour}:${form.startMinute}:00`);
      const endDate = new Date(`${form.date}T${form.endHour}:${form.endMinute}:00`);

      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          category: form.category,
          athleteId: form.athleteId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setSaveErro(data?.error ?? "Erro ao criar evento."); return; }
      setModalOpen(false);
      setForm(EMPTY_FORM);
      fetchEvents();
    } catch {
      setSaveErro("Erro ao conectar com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  // ── Complete ──────────────────────────────────────────────────────────────────

  async function handleComplete(id: string, current: boolean) {
    setCompletingId(id);
    try {
      const res = await fetch(`/api/agenda/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !current }),
      });
      if (res.ok) {
        setEvents((ev) =>
          ev.map((e) => (e.id === id ? { ...e, completed: !current } : e))
        );
      }
    } catch {
      // silent
    } finally {
      setCompletingId(null);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/agenda/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((ev) => ev.filter((e) => e.id !== id));
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

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Agenda</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {loading
              ? "Carregando…"
              : `${events.length} evento${events.length !== 1 ? "s" : ""} em ${MONTHS_PT[month]}`}
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setSaveErro(""); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo evento
        </button>
      </div>

      {erro && (
        <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">
          {erro}
        </div>
      )}

      {/* Color legend */}
      <div className="flex flex-wrap gap-2">
        {(["completed", "atleta", "pais", "avaliacao", "aula_experimental", "geral"] as const).map(
          (key) => {
            const m = CATEGORY_META[key];
            return (
              <span
                key={key}
                className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-white/10"
              >
                <span className={`h-2 w-2 rounded-full ${m.dot}`} />
                {m.label}
              </span>
            );
          }
        )}
      </div>

      {/* Mini Calendar */}
      <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-white">
            {MONTHS_PT[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = isCurrentMonth && today.getDate() === day;
            const isSelected = selectedDay === day;
            const hasEvent = daysWithEvents.has(day);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay((p) => (p === day ? null : day))}
                className={[
                  "relative mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-xl text-sm transition",
                  isSelected
                    ? "bg-blue-600 font-bold text-white"
                    : isToday
                    ? "font-bold text-blue-400 ring-1 ring-blue-500/40 hover:bg-white/5"
                    : "text-zinc-300 hover:bg-white/5",
                ].join(" ")}
              >
                {day}
                {hasEvent && (
                  <span className={`absolute bottom-1 h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-blue-400"}`} />
                )}
              </button>
            );
          })}
        </div>

        {selectedDay !== null && (
          <p className="mt-3 text-center text-xs text-zinc-400">
            Mostrando eventos de{" "}
            <span className="font-medium text-white">
              {pad(selectedDay)} de {MONTHS_PT[month]}
            </span>
            {" — "}
            <button
              onClick={() => setSelectedDay(null)}
              className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
            >
              ver todos
            </button>
          </p>
        )}
      </div>

      {/* Event list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/5" />
          ))}
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/5 py-14 text-center ring-1 ring-white/10">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <svg className="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
          </div>
          <p className="font-semibold text-zinc-300">
            {selectedDay !== null
              ? `Nenhum evento em ${pad(selectedDay)} de ${MONTHS_PT[month]}`
              : "Nenhum evento neste mês"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Clique em &quot;Novo evento&quot; para adicionar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleEvents.map((event) => {
            const meta = getEventMeta(event);
            return (
              <div
                key={event.id}
                className={[
                  "flex items-start gap-4 rounded-2xl border-l-4 bg-white/5 p-4 ring-1 transition hover:bg-white/[0.07]",
                  meta.border,
                  meta.ring,
                  event.completed ? "opacity-75" : "",
                ].join(" ")}
              >
                {/* Date badge */}
                <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ring-1 ring-transparent ${meta.badge}`}>
                  <span className="text-sm font-bold leading-none">
                    {new Date(event.startDate).getDate()}
                  </span>
                  <span className="mt-0.5 text-[9px] uppercase tracking-wider">
                    {MONTHS_PT[new Date(event.startDate).getMonth()].slice(0, 3)}
                  </span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm font-semibold ${event.completed ? "line-through text-zinc-400" : "text-white"}`}>
                      {event.title}
                    </p>
                    {/* Category chip */}
                    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {formatDayMonth(event.startDate)} · {formatTime(event.startDate)} → {formatTime(event.endDate)}
                  </p>
                  {event.athlete && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-white/10">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      {event.athlete.name}
                    </span>
                  )}
                  {event.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-zinc-500">{event.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  {/* Complete toggle */}
                  <button
                    onClick={() => handleComplete(event.id, event.completed)}
                    disabled={completingId === event.id}
                    title={event.completed ? "Marcar como pendente" : "Marcar como concluído"}
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-xl transition disabled:opacity-40",
                      event.completed
                        ? "bg-green-600/20 text-green-400 hover:bg-green-600/10"
                        : "text-zinc-500 hover:bg-green-500/10 hover:text-green-400",
                    ].join(" ")}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(event.id)}
                    disabled={deletingId === event.id}
                    title="Excluir evento"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
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

      {/* Modal: Novo evento */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <h2 className="font-semibold text-white">Novo evento</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Adicionado à sua agenda</p>
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

            <form onSubmit={handleCreate} className="space-y-4 px-6 py-5">
              {/* Title */}
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
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none transition focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Categoria
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORY_OPTIONS.map((opt) => {
                    const m = CATEGORY_META[opt.value];
                    const active = form.category === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, category: opt.value }))}
                        className={[
                          "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium ring-1 transition",
                          active
                            ? `${m.badge} ring-2`
                            : "bg-zinc-800 text-zinc-400 ring-white/10 hover:bg-zinc-700",
                        ].join(" ")}
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${m.dot}`} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Descrição <span className="text-zinc-600">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Notas sobre o evento…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full resize-none rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none transition focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Data <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Início <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      required
                      value={form.startHour}
                      onChange={(e) => setForm((f) => ({ ...f, startHour: e.target.value }))}
                      className="w-full rounded-xl bg-zinc-800 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Hora</option>
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}h</option>
                      ))}
                    </select>
                    <select
                      required
                      value={form.startMinute}
                      onChange={(e) => setForm((f) => ({ ...f, startMinute: e.target.value }))}
                      className="w-full rounded-xl bg-zinc-800 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Min</option>
                      {MINUTES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Fim <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      required
                      value={form.endHour}
                      onChange={(e) => setForm((f) => ({ ...f, endHour: e.target.value }))}
                      className="w-full rounded-xl bg-zinc-800 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Hora</option>
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}h</option>
                      ))}
                    </select>
                    <select
                      required
                      value={form.endMinute}
                      onChange={(e) => setForm((f) => ({ ...f, endMinute: e.target.value }))}
                      className="w-full rounded-xl bg-zinc-800 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Min</option>
                      {MINUTES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Athlete */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Atleta vinculado <span className="text-zinc-600">(opcional)</span>
                </label>
                <select
                  value={form.athleteId}
                  onChange={(e) => setForm((f) => ({ ...f, athleteId: e.target.value }))}
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none transition focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Nenhum</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.team}
                    </option>
                  ))}
                </select>
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
