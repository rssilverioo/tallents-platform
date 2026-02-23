"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Athlete = { id: string; name: string; team: string; position: string };
type Meeting = {
  id: string;
  title: string;
  description: string;
  date: string;
  athlete: Athlete;
};

export default function MeetingsPage() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/athletes").then((r) => r.json()),
      fetch("/api/meetings").then((r) => r.json()),
    ]).then(([a, m]) => {
      setAthletes(a.athletes ?? []);
      setMeetings(m);
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      athleteId: form.get("athleteId"),
      title: form.get("title"),
      description: form.get("description") || "",
      date: form.get("date"),
    };

    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao agendar encontro");
      setSaving(false);
      return;
    }

    const created = await res.json();
    setMeetings((prev) => [...prev, created].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setSaving(false);
    (e.target as HTMLFormElement).reset();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Encontros</h1>
          <p className="mt-1 text-sm text-zinc-300">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Encontros</h1>
        <p className="mt-1 text-sm text-zinc-300">
          Agende e gerencie encontros com atletas.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
        <p className="text-sm font-semibold">Novo Encontro</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Atleta */}
            <div>
              <label htmlFor="athleteId" className="mb-1 block text-sm text-zinc-300">
                Atleta
              </label>
              <select
                id="athleteId"
                name="athleteId"
                required
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-blue-500/50"
              >
                <option value="" disabled>
                  Selecione
                </option>
                {athletes.map((a) => (
                  <option key={a.id} value={a.id} className="bg-zinc-900">
                    {a.name} — {a.team}
                  </option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div>
              <label htmlFor="date" className="mb-1 block text-sm text-zinc-300">
                Data
              </label>
              <input
                id="date"
                name="date"
                type="datetime-local"
                required
                className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Titulo */}
          <div>
            <label htmlFor="title" className="mb-1 block text-sm text-zinc-300">
              Titulo
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-blue-500/50"
              placeholder="Ex: Avaliação técnica"
            />
          </div>

          {/* Descricao */}
          <div>
            <label htmlFor="description" className="mb-1 block text-sm text-zinc-300">
              Descrição (opcional)
            </label>
            <textarea
              id="description"
              name="description"
              className="min-h-20 w-full resize-none rounded-2xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-blue-500/50"
              placeholder="Detalhes do encontro..."
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-medium text-white ring-1 ring-blue-500/25 hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? "Agendando..." : "Agendar Encontro"}
          </button>
        </form>
      </div>

      {/* Meetings list */}
      {meetings.length === 0 ? (
        <div className="rounded-3xl bg-white/5 p-8 text-center ring-1 ring-white/10">
          <p className="text-sm text-zinc-400">Nenhum encontro agendado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => {
            const dateObj = new Date(m.date);
            const isPast = dateObj < new Date();

            return (
              <div
                key={m.id}
                className={`rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 ${isPast ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{m.title}</p>
                    <p className="mt-1 text-xs text-zinc-300">
                      {m.athlete.name} &bull; {m.athlete.team} &bull;{" "}
                      {dateObj.toLocaleDateString("pt-BR")} às{" "}
                      {dateObj.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {m.description && (
                      <p className="mt-2 text-sm text-zinc-400">{m.description}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isPast && (
                      <span className="rounded-full bg-zinc-600/30 px-3 py-1 text-xs text-zinc-400 ring-1 ring-zinc-500/20">
                        Passado
                      </span>
                    )}
                    <button
                      type="button"
                      className="rounded-2xl bg-white/10 px-3 py-2 text-xs ring-1 ring-white/10 hover:bg-white/15"
                      onClick={() => handleDelete(m.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
