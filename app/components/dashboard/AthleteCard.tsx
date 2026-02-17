import Image from "next/image";
import type { Athlete } from "./types";

export default function AthleteCard({ athlete }: { athlete: Athlete }) {
  return (
    <div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10">
          <Image
            src={athlete.photo}
            alt={athlete.name}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{athlete.name}</p>
          <p className="text-sm text-zinc-300">
            {athlete.team} • {athlete.position}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-zinc-300">Encontros restantes</p>
          <p className="text-2xl font-semibold text-blue-300">
            {athlete.remainingMeetings}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-600/15 px-3 py-1 text-xs text-blue-200 ring-1 ring-blue-500/20">
          {athlete.position}
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200 ring-1 ring-white/10">
          {athlete.team}
        </span>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 ring-1 ring-emerald-500/20">
          Ativo
        </span>
      </div>
    </div>
  );
}
