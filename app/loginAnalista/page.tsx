"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LoginAnalistaPage() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 🔒 Por enquanto só front
    console.log({ usuario, senha });
    alert("Login de teste (front-end). Próximo passo: banco + Prisma.");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-105 w-105 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl bg-white/5 p-6 sm:p-8 ring-1 ring-white/10">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
            <Image
              src="/logo.png"
              alt="Tallents"
              fill
              className="object-contain p-2"
              priority
            />
          </div>

          <div className="text-center">
            <p className="text-sm text-zinc-300">Tallents</p>
            <h1 className="text-xl font-semibold">Login do Analista</h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Usuário
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Digite seu usuário"
              className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Entrar
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-zinc-400">
          <Link href="/" className="hover:text-zinc-200">
            ← Voltar para o site
          </Link>
        </div>
      </div>
    </main>
  );
}
