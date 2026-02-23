"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginAtletaPage() {
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/athlete/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, dataNascimento }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data?.error || "Dados incorretos. Verifique seu nome e data de nascimento.");
        return;
      }

      router.push("/atleta");
    } catch {
      setErro("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
              <Image
                src="/logo.png"
                alt="Tallents"
                fill
                className="object-contain p-2"
                priority
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-blue-400 tracking-widest uppercase">
                Tallents
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                Área do Atleta
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Entre com seu nome e data de nascimento
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Nome completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome como cadastrado"
                className="w-full rounded-2xl bg-zinc-900/80 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Data de nascimento
              </label>
              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full rounded-2xl bg-zinc-900/80 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500 scheme-dark"
                required
              />
            </div>

            {erro && (
              <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-95 disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Acessar minha área"}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 flex items-center justify-between text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-300 transition">
              ← Voltar ao site
            </Link>
            <Link href="/loginAnalista" className="hover:text-zinc-300 transition">
              Sou analista →
            </Link>
          </div>
        </div>

        {/* Subtle bottom label */}
        <p className="mt-4 text-center text-xs text-zinc-600">
          Acesso exclusivo para atletas cadastrados na plataforma
        </p>
      </div>
    </main>
  );
}
