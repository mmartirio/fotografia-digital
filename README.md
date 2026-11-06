# Fotografia Digital

Site para fotógrafo com landing page (SEO, CTAs, animações na rolagem), área do cliente
(seleção de fotos e download das finais, com expiração em 60 dias) e painel gestor.

Plano completo e decisões: [PLANO.md](PLANO.md). Metodologia **mobile first**.

## Stack

| Container  | Tecnologia                                           | Porta              |
|------------|------------------------------------------------------|--------------------|
| `frontend` | Next.js 15 · TypeScript · Tailwind 4 · Framer Motion | 3000 (pública)     |
| `backend`  | Spring Boot 4.1 · Java 21 · Flyway                   | 8080 (só interna)  |
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
cd backend && ./mvnw test                          # JUnit + Postgres real via Testcontainers (requer Docker)
cd frontend && npm run lint && npx tsc --noEmit && npm run build
./scripts/teste-fumaca.sh http://localhost:3000    # stack em execução (defina ADMIN_EMAIL/ADMIN_SENHA para testar o login)
```

## CI/CD (GitHub Actions)

O workflow [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) roda a cada push e pull request:

| Job | O que faz |
|-----|-----------|
| **Backend** | `./mvnw test` (testes de integração com Postgres real) |
| **Frontend** | lint, checagem de tipos e build de produção |
| **Integração** | sobe frontend + backend + banco com as imagens de produção e roda o teste de fumaça |
| **CD** | só na `main`, após os testes: publica as imagens no GitHub Container Registry (`ghcr.io/mmartirio/fotografia-digital/backend` e `/frontend`, tags `latest` e o SHA do commit) |

O deploy no servidor ainda não está automatizado (hospedagem a definir): basta usar as imagens publicadas.

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

## Segurança

- **Painel:** senha + **verificação em duas etapas** (TOTP: Google Authenticator, Microsoft Authenticator, Authy), ativada em *Conta*. Inclui 10 códigos de recuperação de uso único. Segredos cifrados no banco (AES-256-GCM) com a chave `APP_CHAVE_CRIPTO` (ou arquivo gerado no volume de fotos: faça backup dele junto com o banco).
- **Bloqueio:** 5 falhas (senha ou código) em 15 min bloqueiam a conta temporariamente.
- **Sessões:** cookies `httpOnly` + `SameSite=Lax`; com `SITE_URL` em `https://`, sempre `Secure`.
- **Área do cliente:** link de acesso de uso único (30 min); o cliente só acessa as próprias galerias; prévias com marca d'água.
- **Cabeçalhos:** CSP `frame-ancestors 'none'`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- **Produção:** configure `SMTP_HOST` (sem SMTP os links de acesso vão para o log) e **não** use `docker-compose.dev.yml` (perfil `demo`).
- **Varredura:** `docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image <imagem>` e `npm audit --omit=dev`.
