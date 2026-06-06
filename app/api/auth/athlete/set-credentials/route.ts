import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const athleteId: string = String(body.athleteId || "").trim();
  const username: string = String(body.username || "").trim().toLowerCase();
  const password: string = String(body.password || "");

  if (!athleteId || !username || !password) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
  }

  if (username.length < 3 || username.length > 30) {
    return NextResponse.json({ error: "Usuário deve ter entre 3 e 30 caracteres" }, { status: 400 });
  }

  if (!/^[a-z0-9._]+$/.test(username)) {
    return NextResponse.json({ error: "Usuário só pode conter letras, números, ponto e underscore" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 });
  }

  const athlete = await prisma.athlete.findUnique({ where: { id: athleteId } });
  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  if (athlete.username && athlete.passwordHash) {
    return NextResponse.json({ error: "Este atleta já possui credenciais de acesso" }, { status: 409 });
  }

  const taken = await prisma.athlete.findUnique({ where: { username } });
  if (taken) {
    return NextResponse.json({ error: "Este nome de usuário já está em uso. Escolha outro." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.athlete.update({
    where: { id: athleteId },
    data: { username, passwordHash },
  });

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.athleteSession.create({
    data: { token, expiresAt, athleteId },
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("tallents_athlete_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return res;
}
