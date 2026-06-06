import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAnalystFromRequest } from "@/app/lib/getAnalyst";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const analyst = await getAnalystFromRequest(req);
  if (!analyst?.isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  if (id === analyst.id) return NextResponse.json({ error: "Não é possível excluir sua própria conta" }, { status: 400 });

  await prisma.analyst.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
