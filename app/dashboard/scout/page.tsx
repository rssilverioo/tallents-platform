import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/app/lib/prisma";

export default async function ScoutPage() {
  const athletes = await prisma.athlete.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Scout</h1>
        <p className="mt-1 text-sm text-zinc-300">
          Selecione um atleta para iniciar o scout.
        </p>
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
            <Link
              key={a.id}
              href={`/dashboard/scout/${a.id}`}
              className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-blue-500/30"
            >
              <div className="flex items-center gap-4">
                {a.photo && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10">
                    <Image
                      src={a.photo}
                      alt={a.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{a.name}</p>
                  <p className="text-sm text-zinc-300">
                    {a.team} &bull; {a.position}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-center text-xs font-medium text-blue-300">
                Iniciar Scout &rarr;
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
