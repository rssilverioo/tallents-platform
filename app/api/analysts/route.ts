import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { getAnalystFromRequest } from "@/app/lib/getAnalyst";

export async function GET(req: Request) {
  const analyst = await getAnalystFromRequest(req);
  if (!analyst?.isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const analysts = await prisma.analyst.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      isAdmin: true,
      createdAt: true,
      _count: { select: { athletes: true } },
    },
  });

  return NextResponse.json({ analysts });
}

export async function POST(req: Request) {
  const analyst = await getAnalystFromRequest(req);
  if (!analyst?.isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!username || username.length < 3)
    return NextResponse.json({ error: "Usuário deve ter pelo menos 3 caracteres" }, { status: 400 });
  if (!/^[a-z0-9._]+$/.test(username))
    return NextResponse.json({ error: "Usuário só pode conter letras, números, ponto e underscore" }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 });

  const existing = await prisma.analyst.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ error: "Esse nome de usuário já existe" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);

  const newAnalyst = await prisma.analyst.create({
    data: { username, password: passwordHash },
    select: { id: true, username: true, isAdmin: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, analyst: newAnalyst }, { status: 201 });
}
