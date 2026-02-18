import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import ScoutPlayer from "@/app/components/dashboard/ScoutPlayer";

export default async function ScoutAthletePage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
  });

  if (!athlete) return notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Scout</h1>
        <p className="mt-1 text-sm text-zinc-300">
          Scouting de <span className="font-semibold text-white">{athlete.name}</span>{" "}
          — {athlete.team} &bull; {athlete.position}
        </p>
      </div>

      <ScoutPlayer athleteId={athlete.id} athleteName={athlete.name} />
    </div>
  );
}
