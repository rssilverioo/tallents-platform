import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const full = searchParams.get("full") === "true";

  const athlete = await prisma.athlete.findUnique({
    where: { id },
    include: full
      ? {
          analystReports: { orderBy: { createdAt: "desc" } },
          metas: { orderBy: { createdAt: "desc" } },
          scouts: { include: { report: true }, orderBy: { createdAt: "desc" } },
        }
      : undefined,
  });

  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ athlete });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return badRequest("JSON inválido");

  const data: any = {};

  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.team !== undefined) data.team = String(body.team).trim();
  if (body.position !== undefined) data.position = String(body.position).trim();
  if (body.photo !== undefined) data.photo = body.photo ? String(body.photo).trim() : null;
  if (body.planType !== undefined) data.planType = body.planType || null;
  if (body.planStartDate !== undefined) data.planStartDate = body.planStartDate ? new Date(body.planStartDate) : null;
  if (body.planEndDate !== undefined) data.planEndDate = body.planEndDate ? new Date(body.planEndDate) : null;
  if (body.birthDate !== undefined) data.birthDate = body.birthDate ? new Date(body.birthDate) : null;

  if (body.remainingMeetings !== undefined) {
    const rm = Number(body.remainingMeetings);
    if (!Number.isFinite(rm) || rm < 0) {
      return badRequest("remainingMeetings deve ser um número >= 0");
    }
    data.remainingMeetings = Math.floor(rm);
  }

  const athlete = await prisma.athlete.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true, athlete });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.athlete.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
