import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAnalystFromRequest } from "@/app/lib/auth";

const VALID_CATEGORIES = ["geral", "atleta", "pais", "avaliacao", "aula_experimental"];

// GET /api/agenda?year=2026&month=2
export async function GET(req: NextRequest) {
  try {
    const analyst = await getAnalystFromRequest(req);
    if (!analyst) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1), 10);

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const events = await prisma.agendaEvent.findMany({
      where: {
        analystId: analyst.id,
        startDate: { gte: start, lt: end },
      },
      include: { athlete: { select: { id: true, name: true } } },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ events });
  } catch (err) {
    console.error("[GET /api/agenda]", err);
    return NextResponse.json({ error: "Erro interno ao buscar eventos" }, { status: 500 });
  }
}

// POST /api/agenda
export async function POST(req: NextRequest) {
  try {
    const analyst = await getAnalystFromRequest(req);
    if (!analyst) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body?.title || !body?.startDate || !body?.endDate) {
      return NextResponse.json(
        { error: "Campos obrigatórios: title, startDate, endDate" },
        { status: 400 }
      );
    }

    const category = VALID_CATEGORIES.includes(body.category) ? body.category : "geral";

    const event = await prisma.agendaEvent.create({
      data: {
        title: body.title,
        description: body.description ?? "",
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        category,
        completed: false,
        analystId: analyst.id,
        athleteId: body.athleteId ?? null,
      },
      include: { athlete: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/agenda]", err);
    return NextResponse.json({ error: "Erro interno ao criar evento" }, { status: 500 });
  }
}
