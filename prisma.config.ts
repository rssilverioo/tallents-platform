// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // obrigatório pro migrate dev
    url: process.env.DATABASE_URL!,
    // recomendado (Neon direct url) para migrations
    
  },
});
