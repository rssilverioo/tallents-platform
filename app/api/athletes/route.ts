import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q")?.trim() || "";
    const team = searchParams.get("team")?.trim() || undefined;
    const position = searchParams.get("position")?.trim() || undefined;

    const athletes = await prisma.athlete.findMany({
      where: {
        AND: [
          team ? { team } : {},
          position ? { position } : {},
          q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { team: { contains: q, mode: "insensitive" } },
                  { position: { contains: q, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ athletes });
  } catch (err) {
    console.error("[GET /api/athletes]", err);
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message, athletes: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return badRequest("JSON inválido");

  const name = String(body.name || "").trim();
  const team = String(body.team || "").trim();
  const position = String(body.position || "").trim();
  const photo = body.photo ? String(body.photo).trim() : "";
  const birthDateRaw = body.birthDate ? String(body.birthDate).trim() : null;

  const remainingMeetingsRaw = body.remainingMeetings;
  const remainingMeetings =
    remainingMeetingsRaw === undefined || remainingMeetingsRaw === null
      ? 0
      : Number(remainingMeetingsRaw);

  if (!name) return badRequest("name é obrigatório");
  if (!team) return badRequest("team é obrigatório");
  if (!position) return badRequest("position é obrigatório");
  if (!Number.isFinite(remainingMeetings) || remainingMeetings < 0) {
    return badRequest("remainingMeetings deve ser um número >= 0");
  }

  const birthDate = birthDateRaw ? new Date(birthDateRaw) : null;
  if (birthDateRaw && isNaN(birthDate!.getTime())) {
    return badRequest("birthDate inválido");
  }

  try {
    const athlete = await prisma.athlete.create({
      data: {
        name,
        team,
        position,
        remainingMeetings: Math.floor(remainingMeetings),
        photo,
        ...(birthDate ? { birthDate } : {}),
      },
    });

    return NextResponse.json({ ok: true, athlete }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/athletes]", err);
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
