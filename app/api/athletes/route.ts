import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const athletes = await prisma.athlete.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(athletes);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, team, position, remainingMeetings, photo } = body;

  if (!name || !team || !position) {
    return NextResponse.json(
      { error: "Nome, time e posição são obrigatórios" },
      { status: 400 }
    );
  }

  const athlete = await prisma.athlete.create({
    data: {
      name,
      team,
      position,
      remainingMeetings: remainingMeetings ?? 0,
      photo: photo || "",
    },
  });

  return NextResponse.json(athlete, { status: 201 });
}
