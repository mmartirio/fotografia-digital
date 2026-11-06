# Fotografia Digital

Site para fotógrafo com landing page (SEO, CTAs, animações na rolagem), área do cliente
(seleção de fotos e download das finais, com expiração em 60 dias) e painel gestor.

Plano completo e decisões: [PLANO.md](PLANO.md). Metodologia **mobile first**.

## Stack

| Container  | Tecnologia                                           | Porta              |
|------------|------------------------------------------------------|--------------------|
| `frontend` | Next.js 15 · TypeScript · Tailwind 4 · Framer Motion | 3000 (pública)     |
| `backend`  | Spring Boot 3.5 · Java 21 · Flyway                   | 8080 (só interna)  |
| `db`       | PostgreSQL 16                                        | 5434 (só localhost)|

As fotos ficam em `/data/fotos` no container `backend` (volume `fotos_data`).
O navegador só fala com o frontend; `/api/*` é repassado ao backend pelo Next.

## Iniciando o projeto

Requisito: Docker Desktop (Windows/macOS) ou Docker Engine + Compose (Linux).

| Ação | Windows | Linux / macOS / servidor |
|------|---------|--------------------------|
| Subir (com build) | `iniciar.cmd` (ou duplo clique) · `.\iniciar.ps1` | `./iniciar.sh` |
| **Desenvolvimento (hot reload)** | `.\iniciar.ps1 -Dev` | `./iniciar.sh --dev` |
| Subir sem build | `.\iniciar.ps1 -SemBuild` | `./iniciar.sh --sem-build` |
| Subir e ver logs | `.\iniciar.ps1 -Logs` | `./iniciar.sh --logs` |
| Parar (mantém dados) | `.\iniciar.ps1 -Parar` | `./iniciar.sh --parar` |
| Apagar banco e fotos | `.\iniciar.ps1 -Resetar` | `./iniciar.sh --resetar` |

No modo **dev** o container `frontend` roda `next dev` com a pasta `frontend/` montada: salvou o arquivo, o navegador atualiza. Para voltar ao modo produção, rode o script sem `-Dev`.

O script:
1. verifica se o Docker está rodando;
2. cria o `.env` a partir do `.env.example`, com senha aleatória para o banco, se ele não existir;
3. verifica se as portas do banco e do site estão livres;
4. sobe os containers e aguarda todos ficarem saudáveis.

> Se o `.env` for apagado depois que o banco já foi criado, o script para com erro em vez de
> gerar uma senha nova, que não funcionaria com o banco existente.
> Restaure o `.env` ou use a opção de resetar.

Manualmente: `cp .env.example .env` (ajuste `DB_PASSWORD`) e `docker compose up -d --build`.

- Site: http://localhost:3000
- Health: http://localhost:3000/saude (frontend) · `docker compose ps` mostra o health de todos

## Desenvolvimento local (sem Docker para front/back)

```bash
# banco
docker compose up -d db

# backend (usa localhost:5434)
cd backend
DB_URL=jdbc:postgresql://localhost:5434/fotografia DB_PASSWORD=<senha> ./mvnw spring-boot:run

# frontend
cd frontend
npm install
BACKEND_URL=http://localhost:8080 npm run dev
```

## Testes

```bash
cd backend && ./mvnw test      # sobe Postgres via Testcontainers (requer Docker)
cd frontend && npm run lint && npm run build
```

## Estrutura

```
backend/
  src/main/java/br/com/fotografiadigital/
    infra/armazenamento   pastas de fotos no disco
    infra/seguranca       Spring Security (stateless)
  src/main/resources/db/migration   migrações Flyway
frontend/
  src/app/                rotas (App Router)
  src/app/api/[...caminho]  proxy para o backend
  src/lib/                utilitários
```
