import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Encontro não encontrado" },
      { status: 404 }
    );
  }

  await prisma.meeting.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
