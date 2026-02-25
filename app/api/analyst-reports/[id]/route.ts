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
