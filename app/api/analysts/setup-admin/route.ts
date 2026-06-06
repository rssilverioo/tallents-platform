import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAnalystFromRequest } from "@/app/lib/getAnalyst";

// Makes the current analyst admin if no admin exists yet.
// Also assigns all "orphan" athletes (no analystId) to them.
export async function POST(req: Request) {
  const analyst = await getAnalystFromRequest(req);
  if (!analyst) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const existingAdmin = await prisma.analyst.findFirst({ where: { isAdmin: true } });
  if (existingAdmin && existingAdmin.id !== analyst.id) {
    return NextResponse.json({ error: "Já existe um administrador" }, { status: 409 });
  }

  await prisma.analyst.update({
    where: { id: analyst.id },
    data: { isAdmin: true },
  });

  // Assign all unowned athletes to this admin
  await prisma.athlete.updateMany({
    where: { analystId: null },
    data: { analystId: analyst.id },
  });

  return NextResponse.json({ ok: true });
}
