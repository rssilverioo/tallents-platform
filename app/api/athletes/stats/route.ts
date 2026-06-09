import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAnalystFromRequest } from "@/app/lib/getAnalyst";

export async function GET(req: Request) {
  const analyst = await getAnalystFromRequest(req);
  if (!analyst)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const athletes = await prisma.athlete.findMany({
    where: {
      OR: [{ analystId: analyst.id }, { analystId: null }],
    },
    select: {
      id: true,
      name: true,
      team: true,
      position: true,
      photo: true,
      analystReports: {
        select: { id: true, counts: true },
      },
      scouts: {
        select: { minutesPlayed: true, sofaScore: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = athletes.map((athlete) => {
    const reports = athlete.analystReports;
    const reportCount = reports.length;

    // Aggregate action counts
    const totalCounts: Record<string, number> = {};
    for (const report of reports) {
      const counts = report.counts as Record<string, unknown>;
      if (counts && typeof counts === "object") {
        for (const [key, value] of Object.entries(counts)) {
          if (typeof value === "number") {
            totalCounts[key] = (totalCounts[key] ?? 0) + value;
          }
        }
      }
    }

    const avgCounts: Record<string, number> = {};
    if (reportCount > 0) {
      for (const [key, value] of Object.entries(totalCounts)) {
        avgCounts[key] = Math.round((value / reportCount) * 10) / 10;
      }
    }

    // Minutes played (from scouts)
    const minutesArr = athlete.scouts
      .map((s) => s.minutesPlayed)
      .filter((m): m is number => m !== null && m !== undefined);
    const totalMinutes = minutesArr.reduce((a, b) => a + b, 0);
    const avgMinutes =
      minutesArr.length > 0
        ? Math.round((totalMinutes / minutesArr.length) * 10) / 10
        : null;

    // SofaScore (only scouts where it was recorded)
    const sofaArr = athlete.scouts
      .map((s) => s.sofaScore)
      .filter((s): s is number => s !== null && s !== undefined);
    const avgSofaScore =
      sofaArr.length > 0
        ? Math.round((sofaArr.reduce((a, b) => a + b, 0) / sofaArr.length) * 100) / 100
        : null;
    const maxSofaScore = sofaArr.length > 0 ? Math.max(...sofaArr) : null;
    const minSofaScore = sofaArr.length > 0 ? Math.min(...sofaArr) : null;

    return {
      id: athlete.id,
      name: athlete.name,
      team: athlete.team,
      position: athlete.position,
      photo: athlete.photo,
      reportCount,
      totalCounts,
      avgCounts,
      minutesPlayed: {
        total: totalMinutes,
        avg: avgMinutes,
        gamesWithRecord: minutesArr.length,
      },
      sofaScore: sofaArr.length > 0
        ? { avg: avgSofaScore!, max: maxSofaScore!, min: minSofaScore!, gamesRated: sofaArr.length }
        : null,
    };
  });

  return NextResponse.json({ athletes: result });
}
