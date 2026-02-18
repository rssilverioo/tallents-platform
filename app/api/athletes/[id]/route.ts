import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.athlete.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Atleta não encontrado" },
      { status: 404 }
    );
  }

  await prisma.athlete.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
