"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard/athletes", label: "Atletas" },
  { href: "/dashboard/scout", label: "Scout" },
  { href: "/dashboard/reports", label: "Relatórios" },
  { href: "/dashboard/meetings", label: "Encontros" },
];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-65 shrink-0 flex-col rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 sm:flex">
      <div className="flex items-center gap-3">
        {/* logo placeholder */}
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
          <span className="text-sm font-semibold text-blue-200">T</span>
        </div>
        <div className="leading-tight">
          <p className="text-sm text-zinc-300">Tallents</p>
          <p className="text-base font-semibold">Analyst Dashboard</p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
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
  );
}
