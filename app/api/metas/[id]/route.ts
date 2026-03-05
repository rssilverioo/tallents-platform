import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const meta = await prisma.meta.findUnique({
    where: { id },
    include: {
      athlete: { select: { id: true, name: true, team: true, position: true, photo: true } },
    },
  });

  if (!meta) return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
  return NextResponse.json({ meta });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, season, description, analystName, goals } = body;

    const meta = await prisma.meta.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(season !== undefined && { season }),
        ...(description !== undefined && { description }),
        ...(analystName !== undefined && { analystName }),
        ...(goals !== undefined && { goals }),
      },
      include: {
        athlete: { select: { id: true, name: true, team: true, position: true, photo: true } },
      },
    });

    return NextResponse.json({ ok: true, meta });
  } catch (err) {
    console.error("PATCH /api/metas/[id] error:", err);
    return NextResponse.json({ error: "Erro ao atualizar meta" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.meta.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/metas/[id] error:", err);
    return NextResponse.json({ error: "Erro ao excluir meta" }, { status: 500 });
  }
}
