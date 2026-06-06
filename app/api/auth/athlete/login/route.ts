import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const username: string = String(body.username || "").trim().toLowerCase();
  const password: string = String(body.password || "");

  if (!username || !password) {
    return NextResponse.json({ error: "Usuário e senha são obrigatórios" }, { status: 400 });
  }

  const athlete = await prisma.athlete.findUnique({ where: { username } });

  if (!athlete || !athlete.passwordHash) {
    return NextResponse.json(
      { error: "Usuário não encontrado. Se é seu primeiro acesso, clique em \"Primeiro acesso\"." },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, athlete.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.athleteSession.create({
    data: { token, expiresAt, athleteId: athlete.id },
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
