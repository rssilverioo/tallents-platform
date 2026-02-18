import Link from "next/link";
import AthleteCard from "@/app/components/dashboard/AthleteCard";
import { prisma } from "@/app/lib/prisma";

export default async function AthletesPage() {
  const athletes = await prisma.athlete.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Atletas</h1>
          <p className="mt-1 text-sm text-zinc-300">
            Lista de atletas cadastrados.
          </p>
        </div>

        <Link
          href="/dashboard/athletes/new"
          className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-blue-500/25 hover:bg-blue-500"
        >
          + Novo Atleta
        </Link>
      </div>

      {athletes.length === 0 ? (
        <div className="rounded-3xl bg-white/5 p-8 text-center ring-1 ring-white/10">
          <p className="text-sm text-zinc-400">
            Nenhum atleta cadastrado ainda.
          </p>
          <Link
            href="/dashboard/athletes/new"
            className="mt-3 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            Cadastrar primeiro atleta
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {athletes.map((a) => (
            <AthleteCard key={a.id} athlete={a} />
          ))}
        </div>
      )}
    </div>
  );
}
