// app/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../generated/prisma/client";

// Bump this whenever the Prisma schema changes (forces a new client in dev hot-reload)
const SCHEMA_VERSION = "v5";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaVersion?: string;
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

// Invalida cache se a versão do schema mudou (detecta mudanças de campo no hot-reload)
if (globalForPrisma.prisma && globalForPrisma.prismaVersion !== SCHEMA_VERSION) {
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaVersion = SCHEMA_VERSION;
}
