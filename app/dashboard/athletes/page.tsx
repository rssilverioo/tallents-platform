import AthleteCard from "@/app/components/dashboard/AthleteCard";
import { ATHLETES } from "@/app/components/dashboard/mockData";

export default function AthletesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Atletas</h1>
        <p className="mt-1 text-sm text-zinc-300">
          Lista de atletas com informações e encontros restantes (mock).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ATHLETES.map((a) => (
          <AthleteCard key={a.id} athlete={a} />
        ))}
      </div>
    </div>
  );
}
