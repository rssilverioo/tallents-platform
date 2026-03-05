import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const athleteId = searchParams.get("athleteId");

  const metas = await prisma.meta.findMany({
    where: athleteId ? { athleteId } : undefined,
    include: {
      athlete: { select: { id: true, name: true, team: true, position: true, photo: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ metas });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, season, description, analystName, athleteId, goals } = body;

    if (!title || !season || !analystName || !athleteId) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const meta = await prisma.meta.create({
      data: {
        title,
        season,
        description: description ?? "",
        analystName,
        athleteId,
        goals: goals ?? [],
      },
      include: {
        athlete: { select: { id: true, name: true, team: true, position: true, photo: true } },
      },
    });

    return NextResponse.json({ ok: true, meta }, { status: 201 });
  } catch (err) {
    console.error("POST /api/metas error:", err);
    return NextResponse.json({ error: "Erro ao criar meta" }, { status: 500 });
  }
}
