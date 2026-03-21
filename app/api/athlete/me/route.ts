import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("tallents_athlete_session="))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const session = await prisma.athleteSession.findUnique({
    where: { token },
    include: {
      athlete: {
        include: {
          analystReports: {
            orderBy: { createdAt: "desc" },
          },
          metas: {
            orderBy: { createdAt: "desc" },
          },
          scouts: {
            include: { report: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
  }

  const { athlete } = session;

  // Enrich analystReports that lack youtubeUrl using the closest scout by timestamp
  const enrichedReports = athlete.analystReports.map((report) => {
    if (report.youtubeUrl) return report;
    const reportTime = report.createdAt.getTime();
    let closestUrl = "";
    let minDiff = Infinity;
    for (const scout of athlete.scouts) {
      const diff = Math.abs(scout.createdAt.getTime() - reportTime);
      if (diff < minDiff) { minDiff = diff; closestUrl = scout.youtubeUrl; }
    }
    return { ...report, youtubeUrl: closestUrl };
  });

  return NextResponse.json({ athlete: { ...athlete, analystReports: enrichedReports } });
}
