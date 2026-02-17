import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  const passwordHash = await bcrypt.hash("1234", 10);

  const admin = await prisma.analyst.upsert({
    where: { username: "admin" },
    update: { password: passwordHash },
    create: { username: "admin", password: passwordHash },
    select: { id: true, username: true },
  });

  return NextResponse.json({ ok: true, admin });
}
