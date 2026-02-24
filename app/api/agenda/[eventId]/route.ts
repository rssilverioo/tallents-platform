import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAnalystFromRequest } from "@/app/lib/auth";

const VALID_CATEGORIES = ["geral", "atleta", "pais", "avaliacao", "aula_experimental"];

// DELETE /api/agenda/[eventId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const analyst = await getAnalystFromRequest(req);
    if (!analyst) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { eventId } = await params;

    const event = await prisma.agendaEvent.findFirst({
      where: { id: eventId, analystId: analyst.id },
    });
    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    await prisma.agendaEvent.delete({ where: { id: eventId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/agenda/[eventId]]", err);
    return NextResponse.json({ error: "Erro interno ao excluir evento" }, { status: 500 });
  }
}

// PUT /api/agenda/[eventId]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const analyst = await getAnalystFromRequest(req);
    if (!analyst) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { eventId } = await params;
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const event = await prisma.agendaEvent.findFirst({
      where: { id: eventId, analystId: analyst.id },
    });
    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    const updated = await prisma.agendaEvent.update({
      where: { id: eventId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
        ...(body.athleteId !== undefined && { athleteId: body.athleteId ?? null }),
        ...(body.category !== undefined &&
          VALID_CATEGORIES.includes(body.category) && { category: body.category }),
        ...(body.completed !== undefined && { completed: Boolean(body.completed) }),
      },
      include: { athlete: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ event: updated });
  } catch (err) {
    console.error("[PUT /api/agenda/[eventId]]", err);
    return NextResponse.json({ error: "Erro interno ao atualizar evento" }, { status: 500 });
  }
}
