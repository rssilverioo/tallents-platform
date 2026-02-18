import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const meetings = await prisma.meeting.findMany({
    orderBy: { date: "asc" },
    include: { athlete: true },
  });

  return NextResponse.json(meetings);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { athleteId, title, description, date } = body;

  if (!athleteId || !title || !date) {
    return NextResponse.json(
      { error: "athleteId, title e date são obrigatórios" },
      { status: 400 }
    );
  }

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
  });
  if (!athlete) {
    return NextResponse.json(
      { error: "Atleta não encontrado" },
      { status: 404 }
    );
  }

  const meeting = await prisma.meeting.create({
    data: {
      athleteId,
      title,
      description: description || "",
      date: new Date(date),
    },
    include: { athlete: true },
  });

  return NextResponse.json(meeting, { status: 201 });
}
