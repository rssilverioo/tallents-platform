"use client";

import { ATHLETES, REPORTS } from "@/app/components/dashboard/mockData";
import ReportCard from "@/app/components/dashboard/ReportCard";

export default function ReportsPage() {
  const athleteById = new Map(ATHLETES.map((a) => [a.id, a]));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <p className="mt-1 text-sm text-zinc-300">
          Relatórios por atleta com métricas e tags (mock).
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {REPORTS.map((r) => {
          const athlete = athleteById.get(r.athleteId);
          if (!athlete) return null;
          return <ReportCard key={r.id} report={r} athlete={athlete} />;
        })}
      </div>
    </div>
  );
}
