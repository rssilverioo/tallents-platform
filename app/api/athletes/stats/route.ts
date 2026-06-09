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
    },
    orderBy: { name: "asc" },
  });

  const result = athletes.map((athlete) => {
    const reports = athlete.analystReports;
    const reportCount = reports.length;

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

    return {
      id: athlete.id,
      name: athlete.name,
      team: athlete.team,
      position: athlete.position,
      photo: athlete.photo,
      reportCount,
      totalCounts,
      avgCounts,
    };
  });

  return NextResponse.json({ athletes: result });
}
