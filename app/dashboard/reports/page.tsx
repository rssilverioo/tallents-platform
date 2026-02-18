import Link from "next/link";
import ReportCard from "@/app/components/dashboard/ReportCard";
import { prisma } from "@/app/lib/prisma";

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: { athlete: true },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <p className="mt-1 text-sm text-zinc-300">
          Relatórios gerados automaticamente a partir dos scouts.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-3xl bg-white/5 p-8 text-center ring-1 ring-white/10">
          <p className="text-sm text-zinc-400">
            Nenhum relatório gerado ainda.
          </p>
          <Link
            href="/dashboard/scout"
            className="mt-3 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            Iniciar primeiro scout
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={{
                id: r.id,
                athleteId: r.athleteId,
                title: r.title,
                createdAt: r.createdAt.toISOString().split("T")[0],
                tags: r.tags as string[],
                summary: r.summary,
                metrics: {
                  rating: r.rating,
                  intensity: r.intensity,
                  decision: r.decision,
                  positioning: r.positioning,
                },
              }}
              athlete={r.athlete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
