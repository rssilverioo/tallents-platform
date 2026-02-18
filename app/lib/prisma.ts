// app/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// ✅ Prisma 7 generated (export está em client.ts)
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function makeClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não definida no .env");
  }

  const isProd = process.env.NODE_ENV === "production";
  const isNeon = process.env.DATABASE_URL.includes("neon.tech");

  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProd || isNeon ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

  globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Invalida cache se o client não tem os models esperados
if (globalForPrisma.prisma && !("report" in globalForPrisma.prisma)) {
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
