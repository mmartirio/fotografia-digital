import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    include: ["testes/**/*.test.ts"],
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // banco PGlite em memória: cada arquivo de teste começa do zero
    env: {
      PGLITE_DIR: "memory://",
      DATABASE_URL: "",
      ADMIN_EMAIL: "admin@teste.local",
      ADMIN_SENHA: "senha-de-teste-123",
      ADMIN_NOME: "Admin Teste",
      APP_CHAVE_CRIPTO: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
    },
  },
});
