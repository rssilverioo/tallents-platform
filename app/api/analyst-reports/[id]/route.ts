import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await prisma.analystReport.findUnique({
      where: { id },
      include: {
        athlete: {
          select: { id: true, name: true, team: true, position: true, photo: true },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error("GET /api/analyst-reports/[id] error:", err);
    return NextResponse.json({ error: "Erro ao buscar relatório" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

    const title = String(body.title || "").trim();
    const summary = String(body.summary || "").trim();
    const tagsRaw = body.tags ?? "";
    const tags = typeof tagsRaw === "string"
      ? tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean)
      : Array.isArray(body.tags) ? body.tags : [];

    if (!title) return NextResponse.json({ error: "title obrigatório" }, { status: 400 });
    if (!summary) return NextResponse.json({ error: "summary obrigatório" }, { status: 400 });

    const report = await prisma.analystReport.update({
      where: { id },
      data: { title, summary, tags },
      include: {
        athlete: {
          select: { id: true, name: true, team: true, position: true, photo: true },
        },
      },
    });

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("PATCH /api/analyst-reports/[id] error:", err);
    return NextResponse.json({ error: "Erro ao atualizar relatório" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.analystReport.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/analyst-reports/[id] error:", err);
    return NextResponse.json({ error: "Erro ao excluir relatório" }, { status: 500 });
  }
}
