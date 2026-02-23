"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AthleteCard from "@/app/components/dashboard/AthleteCard";
import type { Athlete } from "@/app/components/dashboard/types";

const POSITIONS = [
  "Goleiro",
  "Lateral",
  "Zagueiro",
  "Volante",
  "Meia",
  "Atacante",
];

const EMPTY_FORM = {
  name: "",
  team: "",
  position: "",
  birthDate: "",
  remainingMeetings: "0",
  photo: "",
};

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
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

  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchAthletes(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchAthletes]);

  function openModal() {
    setForm(EMPTY_FORM);
    setErro("");
    setModalOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }

  function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErro("Foto muito grande. Use uma imagem de até 5 MB.");
      return;
    }

    const img = new Image();
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
    // reset input so same file can be re-selected
    e.target.value = "";
  }

  function closeModal() {
    setModalOpen(false);
    setErro("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSaving(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch("/api/athletes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: form.name,
          team: form.team,
          position: form.position,
          birthDate: form.birthDate || undefined,
          remainingMeetings: Number(form.remainingMeetings),
          photo: form.photo || undefined,
        }),
      });
      clearTimeout(timeout);

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setErro(data?.error || "Erro ao salvar atleta.");
        return;
      }

      closeModal();
      fetchAthletes(search);
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "AbortError"
          ? "Tempo esgotado. Verifique sua conexão e tente novamente."
          : "Erro ao conectar com o servidor.";
      setErro(msg);
    } finally {
      clearTimeout(timeout);
      setSaving(false);
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Atletas</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {loading
              ? "Carregando..."
              : `${athletes.length} atleta${athletes.length !== 1 ? "s" : ""} cadastrado${athletes.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar atleta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded-2xl bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Add button */}
          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-95"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Adicionar atleta
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-27.5 animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/5"
            />
          ))}
        </div>
      ) : athletes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <svg
              className="h-7 w-7 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="font-semibold text-zinc-300">
            {search ? "Nenhum atleta encontrado" : "Nenhum atleta cadastrado"}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {search
              ? `Sem resultados para "${search}"`
              : 'Clique em "Adicionar atleta" para começar.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {athletes.map((a) => (
            <AthleteCard key={a.id} athlete={a} />
          ))}
        </div>
      )}

      {/* Add Athlete Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 ring-1 ring-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <h2 className="font-semibold text-white">Novo atleta</h2>
                <p className="mt-0.5 text-xs text-zinc-500">Preencha os dados do atleta</p>
              </div>
              <button
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              {/* Nome */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Nome completo <span className="text-red-400">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  type="text"
                  placeholder="Ex: João Silva"
                  required
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  {...field("name")}
                />
              </div>

              {/* Time + Posição */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Flamengo"
                    required
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                    {...field("team")}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Posição <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={form.position}
                    onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
                  >
                    <option value="" disabled>
                      Selecionar
                    </option>
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data de nascimento + Encontros */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition scheme-dark"
                    {...field("birthDate")}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Encontros restantes
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition"
                    {...field("remainingMeetings")}
                  />
                </div>
              </div>

              {/* Foto */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Foto <span className="text-zinc-600">(opcional)</span>
                </label>
                <div className="flex items-center gap-4">
                  {/* Avatar preview */}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-800 ring-1 ring-white/10 transition hover:ring-blue-500 group"
                  >
                    {form.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={form.photo}
                        alt="preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl font-bold text-zinc-500 group-hover:text-zinc-300 transition">
                        {form.name ? form.name[0].toUpperCase() : "?"}
                      </span>
                    )}
                    {/* Overlay */}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300">
                      {form.photo ? "Foto selecionada" : "Nenhuma foto"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">Clique no avatar para fazer upload · Máx. 3 MB</p>
                    {form.photo && (
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, photo: "" }))}
                        className="mt-1.5 text-xs text-red-400 hover:text-red-300 transition"
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoFile}
                />
              </div>

              {/* Error */}
              {erro && (
                <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">
                  {erro}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar atleta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
