import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// Helper: get analyst from session cookie
async function getAnalystFromRequest(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("tallents_session="))
    ?.split("=")[1];

  if (!token) return null;

  const session = await prisma.analystSession.findUnique({
    where: { token },
    include: { analyst: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.analyst;
}

// GET /api/analyst-reports?athleteId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const athleteId = searchParams.get("athleteId") || undefined;

  const reports = await prisma.analystReport.findMany({
    where: athleteId ? { athleteId } : undefined,
    include: {
      athlete: {
        select: { id: true, name: true, team: true, position: true, photo: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reports });
}

// POST /api/analyst-reports
export async function POST(req: Request) {
  const analyst = await getAnalystFromRequest(req);

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const athleteId = String(body.athleteId || "").trim();
  const title = String(body.title || "").trim();
  const summary = String(body.summary || "").trim();
  const tagsRaw: string = body.tags ?? "";
  const tags = typeof tagsRaw === "string"
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const rating = Math.min(10, Math.max(0, Number(body.rating) || 0));
  const intensity = Math.min(10, Math.max(0, Number(body.intensity) || 0));
  const decision = Math.min(10, Math.max(0, Number(body.decision) || 0));
  const positioning = Math.min(10, Math.max(0, Number(body.positioning) || 0));

  const clipsRaw = body.clips;
  const clips = Array.isArray(clipsRaw) ? clipsRaw : [];

  if (!athleteId) return NextResponse.json({ error: "athleteId obrigatório" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title obrigatório" }, { status: 400 });
  if (!summary) return NextResponse.json({ error: "summary obrigatório" }, { status: 400 });

  const athleteExists = await prisma.athlete.findUnique({ where: { id: athleteId } });
  if (!athleteExists) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const report = await prisma.analystReport.create({
    data: {
      athleteId,
      title,
      summary,
      tags,
      rating,
      intensity,
      decision,
      positioning,
      clips,
      analystName: analyst?.username ?? "Analista",
      analystId: analyst?.id ?? null,
    },
    include: {
      athlete: {
        select: { id: true, name: true, team: true, position: true, photo: true },
      },
    },
  });

  return NextResponse.json({ ok: true, report }, { status: 201 });
}
