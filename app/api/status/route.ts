import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const athletes = await prisma.athlete.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { scouts: true },
        },
      },
    });

    return NextResponse.json({ athletes });
  } catch (err) {
    console.error("GET /api/status error:", err);
    return NextResponse.json({ error: "Erro ao buscar status" }, { status: 500 });
  }
}
