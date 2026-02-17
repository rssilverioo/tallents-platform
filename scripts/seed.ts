import "dotenv/config";
import { prisma } from "../app/lib/prisma";

async function main() {
  const username = "admin";
  const password = "1234";

  await prisma.analyst.upsert({
    where: { username },
    update: { password },
    create: { username, password },
  });

  console.log("✅ Seed OK: admin / 1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
