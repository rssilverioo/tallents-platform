"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

type Step = "login" | "first-access" | "setup";

export default function LoginAtletaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("login");

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // First access state
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  // Setup state (after first access validated)
  const [setupAthleteId, setSetupAthleteId] = useState("");
  const [setupAthleteName, setSetupAthleteName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  function resetErro() { setErro(""); }

  // ── Login ──────────────────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    resetErro();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/athlete/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data?.error || "Usuário ou senha incorretos."); return; }
      router.push("/atleta");
    } catch {
      setErro("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ── First Access ───────────────────────────────────────────────────────────

  async function handleFirstAccess(e: React.FormEvent) {
    e.preventDefault();
    resetErro();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/athlete/first-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, dataNascimento }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data?.error || "Dados incorretos."); return; }
      setSetupAthleteId(data.athleteId);
      setSetupAthleteName(data.name);
      setStep("setup");
    } catch {
      setErro("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ── Setup ──────────────────────────────────────────────────────────────────

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    resetErro();
    if (newPassword !== confirmPassword) {
      setErro("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/athlete/set-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId: setupAthleteId, username: newUsername, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data?.error || "Erro ao criar credenciais."); return; }
      router.push("/atleta");
    } catch {
      setErro("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function goToStep(s: Step) {
    resetErro();
    setStep(s);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur-sm">

          {/* Header */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
              <Image src="/logo.png" alt="Tallents" fill className="object-contain p-2" priority />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-blue-400 tracking-widest uppercase">Tallents</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Área do Atleta</h1>
              <p className="mt-1 text-sm text-zinc-400">
                {step === "login" && "Entre com seu usuário e senha"}
                {step === "first-access" && "Confirme sua identidade para continuar"}
                {step === "setup" && `Crie suas credenciais de acesso`}
              </p>
            </div>
          </div>

          {/* ── Step: LOGIN ── */}
          {step === "login" && (
            <>
              {/* Tabs */}
              <div className="mb-6 flex rounded-2xl bg-zinc-900/80 p-1 ring-1 ring-white/8">
                <button
                  className="flex-1 rounded-xl py-2 text-sm font-semibold text-white bg-white/10 transition"
                  disabled
                >
                  Entrar
                </button>
                <button
                  onClick={() => goToStep("first-access")}
                  className="flex-1 rounded-xl py-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
                >
                  Primeiro acesso
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Usuário</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ex: arthurrufino"
                    autoComplete="username"
                    required
                    className="w-full rounded-2xl bg-zinc-900/80 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Senha</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Sua senha"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-2xl bg-zinc-900/80 px-4 py-3 pr-11 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
                  {loading ? "Verificando..." : "Entrar"}
                </button>
              </form>
            </>
          )}

          {/* ── Step: FIRST ACCESS ── */}
          {step === "first-access" && (
            <>
              {/* Tabs */}
              <div className="mb-6 flex rounded-2xl bg-zinc-900/80 p-1 ring-1 ring-white/8">
                <button
                  onClick={() => goToStep("login")}
                  className="flex-1 rounded-xl py-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
                >
                  Entrar
                </button>
                <button
                  className="flex-1 rounded-xl py-2 text-sm font-semibold text-white bg-white/10 transition"
                  disabled
                >
                  Primeiro acesso
                </button>
              </div>

              <p className="mb-5 rounded-2xl bg-blue-500/10 px-4 py-3 text-sm text-blue-300 ring-1 ring-blue-500/20 leading-relaxed">
                Se é seu primeiro acesso, confirme seu nome e data de nascimento para criar seu usuário e senha.
              </p>

              <form onSubmit={handleFirstAccess} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Nome completo</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome como cadastrado"
                    autoComplete="name"
                    required
                    className="w-full rounded-2xl bg-zinc-900/80 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Data de nascimento</label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    required
                    className="w-full rounded-2xl bg-zinc-900/80 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500 scheme-dark"
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
                  {loading ? "Verificando..." : "Continuar"}
                </button>
              </form>
            </>
          )}

          {/* ── Step: SETUP ── */}
          {step === "setup" && (
            <>
              <button
                onClick={() => goToStep("first-access")}
                className="mb-5 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>

              <div className="mb-5 rounded-2xl bg-emerald-500/10 px-4 py-3 ring-1 ring-emerald-500/20">
                <p className="text-sm font-semibold text-emerald-300">Identidade confirmada!</p>
                <p className="text-sm text-emerald-400/80 mt-0.5">
                  Olá, <span className="font-medium">{setupAthleteName}</span>. Agora crie seu usuário e senha.
                </p>
              </div>

              <form onSubmit={handleSetup} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Usuário</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                    placeholder="ex: arthurrufino"
                    autoComplete="username"
                    required
                    minLength={3}
                    maxLength={30}
                    className="w-full rounded-2xl bg-zinc-900/80 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1.5 text-xs text-zinc-600">Apenas letras, números, ponto e underscore. Não pode ser alterado depois.</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Senha</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="w-full rounded-2xl bg-zinc-900/80 px-4 py-3 pr-11 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                    >
                      {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-300">Confirmar senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-2xl bg-zinc-900/80 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
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
                  {loading ? "Salvando..." : "Criar credenciais e entrar"}
                </button>
              </form>
            </>
          )}

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-300 transition">← Voltar ao site</Link>
            <Link href="/loginAnalista" className="hover:text-zinc-300 transition">Sou analista →</Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-600">
          Acesso exclusivo para atletas cadastrados na plataforma
        </p>
      </div>
    </main>
  );
}
