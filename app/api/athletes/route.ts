import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAnalystFromRequest } from "@/app/lib/getAnalyst";

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function GET(req: Request) {
  try {
    const analyst = await getAnalystFromRequest(req);
    if (!analyst) return NextResponse.json({ error: "Não autenticado", athletes: [] }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const team = searchParams.get("team")?.trim() || undefined;
    const position = searchParams.get("position")?.trim() || undefined;

    const athletes = await prisma.athlete.findMany({
      where: {
        AND: [
          // Show own athletes + unassigned (legacy) athletes
          { OR: [{ analystId: analyst.id }, { analystId: null }] },
          team ? { team } : {},
          position ? { position } : {},
          q ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { team: { contains: q, mode: "insensitive" } },
              { position: { contains: q, mode: "insensitive" } },
            ],
          } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ athletes });
  } catch (err) {
    console.error("[GET /api/athletes]", err);
    return NextResponse.json({ error: "Erro interno", athletes: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const analyst = await getAnalystFromRequest(req);
  if (!analyst) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("JSON inválido");

  const name = String(body.name || "").trim();
  const team = String(body.team || "").trim();
  const position = String(body.position || "").trim();
  const photo = body.photo ? String(body.photo).trim() : "";
  const birthDateRaw = body.birthDate ? String(body.birthDate).trim() : null;
  const planType = body.planType ? String(body.planType).trim() : null;
  const planStartDateRaw = body.planStartDate ? String(body.planStartDate).trim() : null;
  const planEndDateRaw = body.planEndDate ? String(body.planEndDate).trim() : null;

  if (!name) return badRequest("name é obrigatório");
  if (!team) return badRequest("team é obrigatório");
  if (!position) return badRequest("position é obrigatório");

  const birthDate = birthDateRaw ? new Date(birthDateRaw) : null;
  if (birthDateRaw && isNaN(birthDate!.getTime())) return badRequest("birthDate inválido");

  const planStartDate = planStartDateRaw ? new Date(planStartDateRaw) : null;
  const planEndDate = planEndDateRaw ? new Date(planEndDateRaw) : null;

  try {
    const athlete = await prisma.athlete.create({
      data: {
        name, team, position, photo,
        analystId: analyst.id,
        ...(birthDate ? { birthDate } : {}),
        ...(planType ? { planType } : {}),
        ...(planStartDate ? { planStartDate } : {}),
        ...(planEndDate ? { planEndDate } : {}),
      },
    });
    return NextResponse.json({ ok: true, athlete }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/athletes]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
