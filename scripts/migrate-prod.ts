/**
 * Script de migração segura para produção
 * Executa as migrações pendentes no PostgreSQL sem perda de dados
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function runProductionMigrations() {
  console.log("🚀 [Produção] A verificar variáveis de ambiente...");
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("❌ ERRO: DATABASE_URL não está definida no ambiente.");
    process.exit(1);
  }

  if (dbUrl.startsWith("file:")) {
    console.error("❌ ERRO CRÍTICO: DATABASE_URL aponta para SQLite. Produção exige PostgreSQL.");
    process.exit(1);
  }

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const hasMigrations = fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0;

  if (hasMigrations) {
    console.log("📦 [Produção] A aplicar Prisma Migrations (prisma migrate deploy)...");
    try {
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
      console.log("✅ [Produção] Migrações aplicadas com sucesso no PostgreSQL!");
    } catch (error) {
      console.error("❌ [Produção] Falha ao executar migrações:", error);
      process.exit(1);
    }
  } else {
    console.log("📦 [Produção] Nenhuma pasta prisma/migrations encontrada. A sincronizar schema via prisma db push...");
    try {
      execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
      console.log("✅ [Produção] Schema sincronizado com sucesso no PostgreSQL!");
    } catch (error) {
      console.error("❌ [Produção] Falha ao sincronizar schema:", error);
      process.exit(1);
    }
  }
}

runProductionMigrations();

