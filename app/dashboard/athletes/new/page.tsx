"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const POSITIONS = [
  "Goleiro",
  "Zagueiro",
  "Lateral",
  "Volante",
  "Meia",
  "Atacante",
];

export default function NewAthletePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      team: form.get("team"),
      position: form.get("position"),
      remainingMeetings: Number(form.get("remainingMeetings")) || 0,
      photo: form.get("photo") || "",
    };

    const res = await fetch("/api/athletes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erro ao cadastrar atleta");
      setLoading(false);
      return;
    }

    router.push("/dashboard/athletes");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Novo Atleta</h1>
        <p className="mt-1 text-sm text-zinc-300">
          Preencha os dados para cadastrar um novo atleta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
        <div>
          <label htmlFor="name" className="mb-1 block text-sm text-zinc-300">
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-blue-500/50"
            placeholder="Nome do atleta"
          />
        </div>

        {/* Time */}
        <div>
          <label htmlFor="team" className="mb-1 block text-sm text-zinc-300">
            Time
          </label>
          <input
            id="team"
            name="team"
            type="text"
            required
            className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-blue-500/50"
            placeholder="Ex: Corinthians"
          />
        </div>

        {/* Posição */}
        <div>
          <label
            htmlFor="position"
            className="mb-1 block text-sm text-zinc-300"
          >
            Posição
          </label>
          <select
            id="position"
            name="position"
            required
            className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-blue-500/50"
          >
            <option value="" disabled>
              Selecione a posição
            </option>
            {POSITIONS.map((p) => (
              <option key={p} value={p} className="bg-zinc-900">
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Encontros restantes */}
        <div>
          <label
            htmlFor="remainingMeetings"
            className="mb-1 block text-sm text-zinc-300"
          >
            Encontros restantes
          </label>
          <input
            id="remainingMeetings"
            name="remainingMeetings"
            type="number"
            min={0}
            defaultValue={0}
            className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-blue-500/50"
          />
        </div>

        {/* Foto */}
        <div>
          <label htmlFor="photo" className="mb-1 block text-sm text-zinc-300">
            Foto (URL)
          </label>
          <input
            id="photo"
            name="photo"
            type="text"
            className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus:ring-blue-500/50"
            placeholder="/athletes/1.png"
          />
        </div>

        {error && (
          <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/20">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white ring-1 ring-blue-500/25 hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Cadastrar"}
          </button>
        </div>
      </form>
    </div>
  );
}
