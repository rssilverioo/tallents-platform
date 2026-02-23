import { prisma } from "@/app/lib/prisma";

export async function getAnalystFromRequest(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("tallents_session="))
    ?.split("=")[1];

  if (!token) return null;

  const session = await prisma.analystSession.findUnique({
    where: { token },
    include: { analyst: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.analyst;
}
