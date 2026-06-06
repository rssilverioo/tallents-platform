import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const nome: string = String(body.nome || "").trim();
  const dataNascimento: string = String(body.dataNascimento || "").trim();

  if (!nome || !dataNascimento) {
    return NextResponse.json({ error: "Nome e data de nascimento são obrigatórios" }, { status: 400 });
  }

  const birthDate = new Date(dataNascimento);
  if (isNaN(birthDate.getTime())) {
    return NextResponse.json({ error: "Data de nascimento inválida" }, { status: 400 });
  }

  const athletes = await prisma.athlete.findMany({
    where: { name: { equals: nome, mode: "insensitive" }, birthDate: { not: null } },
  });

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
    return NextResponse.json({ error: "Atleta não encontrado. Verifique seu nome completo e data de nascimento." }, { status: 401 });
  }

  if (athlete.username && athlete.passwordHash) {
    return NextResponse.json(
      { error: "Você já possui credenciais de acesso. Faça login com seu usuário e senha." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, athleteId: athlete.id, name: athlete.name });
}
