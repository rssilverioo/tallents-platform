"use client";

import Link from "next/link";

export default function Topbar() {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs text-zinc-300">Tallents • Área do Analista</p>
        <p className="truncate text-base font-semibold">
          Gestão de atletas, relatórios e scout
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
          className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15"
          onClick={() => alert("Mock: aqui entra o logout depois")}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
