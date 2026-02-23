import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const { nome, dataNascimento } = await req.json();

  if (!nome || !dataNascimento) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Parse the birth date from the input (YYYY-MM-DD)
  const birthDate = new Date(dataNascimento);
  if (isNaN(birthDate.getTime())) {
    return NextResponse.json({ error: "Data de nascimento inválida" }, { status: 400 });
  }

  // Find athlete by name (case-insensitive) and birth date
  const athletes = await prisma.athlete.findMany({
    where: {
      name: {
        equals: nome,
        mode: "insensitive",
      },
      birthDate: {
        not: null,
      },
    },
  });

  // Match by date (compare year, month, day only)
  const athlete = athletes.find((a) => {
    if (!a.birthDate) return false;
    const d = new Date(a.birthDate);
    return (
      d.getUTCFullYear() === birthDate.getUTCFullYear() &&
      d.getUTCMonth() === birthDate.getUTCMonth() &&
      d.getUTCDate() === birthDate.getUTCDate()
    );
  });

  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado ou dados incorretos" }, { status: 401 });
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 dias

  await prisma.athleteSession.create({
    data: {
      token,
      expiresAt,
      athleteId: athlete.id,
    },
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
