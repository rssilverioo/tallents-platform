import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../app/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

const USERNAME = "Luka Bessa";
const PASSWORD = "2310";

const hash = await bcrypt.hash(PASSWORD, 10);

const existing = await p.analyst.findUnique({ where: { username: USERNAME } });

if (existing) {
  await p.analyst.update({ where: { username: USERNAME }, data: { password: hash } });
  console.log(`✅ Senha do analista "${USERNAME}" atualizada.`);
} else {
  await p.analyst.create({ data: { username: USERNAME, password: hash } });
  console.log(`✅ Analista "${USERNAME}" criado com sucesso.`);
}

await p.$disconnect();
await pool.end();
