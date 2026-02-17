import type { Athlete, AthleteReport } from "./types";

function MetricBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(10, value)) * 10;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-zinc-300">
        <span>{label}</span>
        <span className="font-semibold text-zinc-200">{value}/10</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 ring-1 ring-white/10">
        <div
          className="h-full rounded-full bg-blue-500/60"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportCard({
  report,
  athlete,
}: {
  report: AthleteReport;
  athlete: Athlete;
}) {
  return (
    <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-zinc-300">
            {athlete.name} • {athlete.team} • {athlete.position}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold">{report.title}</h3>
          <p className="mt-1 text-sm text-zinc-300">{report.summary}</p>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="text-xs text-zinc-300">Data</p>
          <p className="text-sm font-semibold">{report.createdAt}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {report.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200 ring-1 ring-white/10"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricBar label="Nota geral" value={report.metrics.rating} />
        <MetricBar label="Intensidade" value={report.metrics.intensity} />
        <MetricBar label="Decisão" value={report.metrics.decision} />
        <MetricBar label="Posicionamento" value={report.metrics.positioning} />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-white/15"
          onClick={() => alert("Mock: abrir relatório completo (próximo passo)")}
          type="button"
        >
          Ver completo
        </button>
        <button
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          onClick={() => alert("Mock: export PDF (próximo passo)")}
          type="button"
        >
          Exportar
        </button>
      </div>
    </div>
  );
}
