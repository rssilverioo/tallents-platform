"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";

export default function Topbar() {
  const [username, setUsername] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/analyst/me")
      .then((r) => r.json())
      .then((d) => { if (d?.analyst?.username) setUsername(d.analyst.username); })
      .catch(() => {});
  }, []);

  function openModal() {
    setCurrentPassword("");
    setNewUsername(username);
    setNewPassword("");
    setConfirmPassword("");
    setErro("");
    setSuccess("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setErro("As novas senhas não coincidem.");
      return;
    }

    const body: Record<string, string> = { currentPassword };
    if (newUsername && newUsername !== username) body.newUsername = newUsername;
    if (newPassword) body.newPassword = newPassword;

    setSaving(true);
    try {
      const res = await fetch("/api/analyst/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data?.error || "Erro ao salvar."); return; }
      setUsername(data.analyst.username);
      setSuccess("Alterações salvas com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/loginAnalista";
    } catch {}
  };

  return (
    <>
      <div className="flex flex-col gap-3 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-zinc-300">Tallents • Área do Analista</p>
          <p className="truncate text-base font-semibold">
            {username ? `Olá, ${username}` : "Gestão de atletas, relatórios e scout"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/dashboard/scout"
            className="rounded-2xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-500"
          >
            Iniciar Scout
          </Link>
          <button
            type="button"
            onClick={openModal}
            className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15"
          >
            Minha conta
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-zinc-900 ring-1 ring-white/10 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-white">Minha conta</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Alterar usuário ou senha</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* New username */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Novo usuário</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                  placeholder={username}
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* New password */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Nova senha <span className="text-zinc-600">(deixe vazio para não alterar)</span></label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {newPassword && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Confirmar nova senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Current password (required to confirm any change) */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Senha atual <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Confirme com sua senha atual"
                    required
                    className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {erro && <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">{erro}</div>}
              {success && <div className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400 ring-1 ring-emerald-500/20">{success}</div>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/10 hover:bg-white/10">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
