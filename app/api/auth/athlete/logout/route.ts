import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("tallents_athlete_session="))
    ?.split("=")[1];

  if (token) {
    await prisma.athleteSession.deleteMany({ where: { token } }).catch(() => {});
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("tallents_athlete_session", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  return res;
}
