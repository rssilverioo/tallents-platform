import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAnalystFromRequest } from "@/app/lib/getAnalyst";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  const analyst = await getAnalystFromRequest(req);
  if (!analyst) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const adminExists = (await prisma.analyst.count({ where: { isAdmin: true } })) > 0;

  return NextResponse.json({
    analyst: { id: analyst.id, username: analyst.username, isAdmin: analyst.isAdmin },
    adminExists,
  });
}

export async function PATCH(req: Request) {
  const analyst = await getAnalystFromRequest(req);
  if (!analyst) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const currentPassword: string = String(body.currentPassword || "");
  const newUsername: string = String(body.newUsername || "").trim().toLowerCase();
  const newPassword: string = String(body.newPassword || "");

  if (!currentPassword) {
    return NextResponse.json({ error: "Informe sua senha atual para confirmar" }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, analyst.password);
  if (!valid) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
  }

  const updateData: { username?: string; password?: string } = {};

  if (newUsername && newUsername !== analyst.username) {
    if (newUsername.length < 3) return NextResponse.json({ error: "Usuário deve ter pelo menos 3 caracteres" }, { status: 400 });
    if (!/^[a-z0-9._]+$/.test(newUsername)) return NextResponse.json({ error: "Usuário só pode ter letras, números, ponto e underscore" }, { status: 400 });
    const taken = await prisma.analyst.findUnique({ where: { username: newUsername } });
    if (taken) return NextResponse.json({ error: "Este nome de usuário já está em uso" }, { status: 409 });
    updateData.username = newUsername;
  }

  if (newPassword) {
    if (newPassword.length < 6) return NextResponse.json({ error: "Nova senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração informada" }, { status: 400 });
  }

  const updated = await prisma.analyst.update({
    where: { id: analyst.id },
    data: updateData,
    select: { id: true, username: true, isAdmin: true },
  });

  return NextResponse.json({ ok: true, analyst: updated });
}
