"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const items = [
  { href: "/dashboard/athletes", label: "Atletas" },
  { href: "/dashboard/scout", label: "Scout" },
  { href: "/dashboard/reports", label: "Relatórios" },
  { href: "/dashboard/agenda", label: "Agenda" },
  { href: "/dashboard/encontros", label: "Encontros" },
  { href: "/dashboard/status", label: "Status dos Planos" },
  { href: "/dashboard/metas", label: "Metas" },
];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="mt-6 space-y-2">
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={onNavigate}
            className={cx(
              "flex items-center justify-between rounded-2xl px-4 py-3 text-sm ring-1 transition",
              active
                ? "bg-blue-600/20 text-white ring-blue-500/25"
                : "bg-white/0 text-zinc-200 ring-white/10 hover:bg-white/5"
            )}
          >
            <span className="font-medium">{it.label}</span>
            <span
              className={cx(
                "h-2 w-2 rounded-full",
                active ? "bg-blue-400" : "bg-white/15"
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Fecha ao mudar de rota
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Trava scroll do body quando drawer está aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* ── Mobile topbar com hamburger ── */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between bg-zinc-950/90 px-4 py-3 backdrop-blur-md sm:hidden">
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
            <Image src="/logo.png" alt="Tallents" fill className="object-cover" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] text-zinc-400">Tallents</p>
            <p className="text-xs font-semibold text-white">Área do Analista</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 sm:hidden"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Drawer */}
          <div
            className="absolute left-0 top-0 flex h-full w-72 flex-col bg-zinc-950 p-5 ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do drawer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <Image src="/logo.png" alt="Tallents" fill className="object-cover" />
                </div>
                <div className="leading-tight">
                  <p className="text-xs text-zinc-300">Tallents</p>
                  <p className="text-sm font-semibold text-white">Painel do Analista</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-zinc-400 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />

            <div className="mt-auto space-y-3">
              <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                <p className="text-xs text-zinc-300">Status</p>
                <p className="mt-1 text-sm font-semibold">Online</p>
              </div>
              <Link
                href="/"
                className="block rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-medium ring-1 ring-white/10 hover:bg-white/15"
              >
                Voltar ao site
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-65 shrink-0 flex-col rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 sm:flex">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
            <Image src="/logo.png" alt="Tallents" fill className="object-cover" />
          </div>
          <div className="leading-tight">
            <p className="text-sm text-zinc-300">Tallents</p>
            <p className="text-base font-semibold">Painel do Analista</p>
          </div>
        </div>

        <NavLinks pathname={pathname} />

        <div className="mt-auto space-y-3">
          <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-xs text-zinc-300">Status</p>
            <p className="mt-1 text-sm font-semibold">Online</p>
          </div>
          <Link
            href="/"
            className="block rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-medium ring-1 ring-white/10 hover:bg-white/15"
          >
            Voltar ao site
          </Link>
        </div>
      </aside>
    </>
  );
}
