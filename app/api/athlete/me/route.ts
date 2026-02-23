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
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
  }

  const { athlete } = session;

  return NextResponse.json({ athlete });
}
