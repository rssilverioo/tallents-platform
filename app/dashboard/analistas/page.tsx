"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, X, ShieldCheck, Users, UserPlus, AlertTriangle } from "lucide-react";

type AnalystEntry = {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  _count: { athletes: number };
};

type Me = { id: string; username: string; isAdmin: boolean } | null;

export default function AnalistasPage() {
  const [me, setMe] = useState<Me>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [analysts, setAnalysts] = useState<AnalystEntry[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Create form
  const [modalOpen, setModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AnalystEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Setup admin
  const [claimingAdmin, setClaimingAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/analyst/me")
      .then((r) => r.json())
      .then((d) => setMe(d?.analyst ?? null))
      .catch(() => setMe(null))
      .finally(() => setLoadingMe(false));
  }, []);

  const fetchAnalysts = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/analysts");
      if (!res.ok) return;
      const data = await res.json();
      setAnalysts(data.analysts ?? []);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (me?.isAdmin) fetchAnalysts();
  }, [me, fetchAnalysts]);

  async function handleClaimAdmin() {
    setClaimingAdmin(true);
    try {
      const res = await fetch("/api/analysts/setup-admin", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { alert(data?.error || "Erro ao configurar admin."); return; }
      setMe((prev) => prev ? { ...prev, isAdmin: true } : prev);
    } finally {
      setClaimingAdmin(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSaving(true);
    try {
      const res = await fetch("/api/analysts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data?.error || "Erro ao criar analista."); return; }
      setModalOpen(false);
      setUsername("");
      setPassword("");
      fetchAnalysts();
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/analysts/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setAnalysts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  if (loadingMe) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // Not admin yet — offer to claim
  if (!me?.isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Analistas</h1>
          <p className="mt-0.5 text-sm text-zinc-400">Gerenciamento de contas de analistas</p>
        </div>
        <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <ShieldCheck className="h-7 w-7 text-amber-400" />
          </div>
          <h2 className="text-base font-semibold text-white mb-2">Configurar conta administradora</h2>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">
            Nenhum administrador foi configurado ainda. Clique abaixo para tornar sua conta administradora e ter acesso ao gerenciamento de analistas.
          </p>
          <button
            onClick={handleClaimAdmin}
            disabled={claimingAdmin}
            className="rounded-2xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
          >
            {claimingAdmin ? "Configurando..." : "Tornar-me administrador"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Analistas</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {loadingList ? "Carregando..." : `${analysts.length} analista${analysts.length !== 1 ? "s" : ""} cadastrado${analysts.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => { setModalOpen(true); setErro(""); setUsername(""); setPassword(""); }}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          Novo analista
        </button>
      </div>

      {/* Admin badge */}
      <div className="flex items-center gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 ring-1 ring-amber-500/20">
        <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
        <p className="text-sm text-amber-300">
          Você é o administrador. Somente você vê esta aba.
        </p>
      </div>

      {/* List */}
      {loadingList ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/5" />
          ))}
        </div>
      ) : analysts.length === 0 ? (
        <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-zinc-500 mb-3" />
          <p className="font-semibold text-zinc-300">Nenhum analista cadastrado</p>
          <p className="mt-1 text-sm text-zinc-500">Clique em "Novo analista" para adicionar.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {analysts.map((a) => (
            <div key={a.id} className="flex items-center gap-4 rounded-3xl bg-zinc-900 p-4 ring-1 ring-white/8">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/20">
                <span className="text-base font-bold text-blue-300">{a.username[0].toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white truncate">{a.username}</p>
                  {a.isAdmin && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/20">
                      admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {a._count.athletes} atleta{a._count.athletes !== 1 ? "s" : ""} · desde {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {!a.isAdmin && (
                <button
                  onClick={() => setDeleteTarget(a)}
                  title="Excluir analista"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 text-zinc-500 ring-1 ring-white/8 transition hover:bg-red-500/15 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-zinc-900 ring-1 ring-white/10 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-white">Novo analista</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Crie credenciais de acesso</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Usuário</label>
                <input
                  type="text" required autoFocus
                  value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                  placeholder="ex: joaosilva"
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-zinc-600">Apenas letras, números, ponto e underscore.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Senha <span className="text-zinc-600">(mín. 6 caracteres)</span></label>
                <input
                  type="password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha do analista"
                  className="w-full rounded-xl bg-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {erro && (
                <div className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20">{erro}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
                  {saving ? "Criando..." : "Criar analista"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-3xl bg-zinc-900 ring-1 ring-white/10 shadow-2xl p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 ring-1 ring-red-500/20 mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-center font-semibold text-white mb-1">Excluir analista?</h3>
            <p className="text-center text-sm text-zinc-400 mb-1">
              O analista <span className="font-medium text-white">@{deleteTarget.username}</span> será removido permanentemente.
            </p>
            <p className="text-center text-xs text-zinc-500 mb-6">
              Os {deleteTarget._count.athletes} atleta{deleteTarget._count.athletes !== 1 ? "s" : ""} vinculados ficarão sem analista.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50">
                {deleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="flex items-start gap-3">
          <Plus className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            Cada analista acessa o dashboard em <strong className="text-zinc-300">/loginAnalista</strong> com o usuário e senha criados aqui.
            Cada um vê apenas os seus próprios atletas.
          </p>
        </div>
      </div>
    </div>
  );
}
