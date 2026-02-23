import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie");

  const token = cookie
    ?.split("; ")
    .find((row) => row.startsWith("tallents_session="))
    ?.split("=")[1];

  if (token) {
    await prisma.analystSession.deleteMany({
      where: { token },
    });
  }

  const res = NextResponse.json({ ok: true });

  // remove cookie
  res.cookies.set("tallents_session", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  return res;
}
