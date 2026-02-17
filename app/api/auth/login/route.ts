import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const { usuario, senha } = await req.json();

  if (!usuario || !senha) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const user = await prisma.analyst.findUnique({
    where: { username: usuario },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário ou senha inválidos" }, { status: 401 });
  }

  const ok = await bcrypt.compare(senha, user.password);
  if (!ok) {
    return NextResponse.json({ error: "Usuário ou senha inválidos" }, { status: 401 });
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 dias

await prisma.analyst.update({
  where: { id: user.id },
  data: {
    sessions: {
      create: {
        token,
        expiresAt,
      },
    },
  },
});


  const res = NextResponse.json({ ok: true });

  // ✅ cookie para o middleware ler
  res.cookies.set("tallents_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return res;
}
