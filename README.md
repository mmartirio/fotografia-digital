# DAVIFOTOVIDEO — site do fotógrafo

Site com landing page (portfólio, serviços, depoimentos, FAQ e contato por WhatsApp/Instagram) e **painel gestor** para o fotógrafo editar textos, imagens, cores, fontes, logo e portfólio. Tudo é um único app **Next.js** pronto para o **Vercel**.

## Stack

| Parte | Tecnologia |
| --- | --- |
| App (site + painel + API) | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Banco | Postgres: **Neon** em produção · **PGlite** (Postgres em WebAssembly) no desenvolvimento |
| Imagens enviadas | **Vercel Blob** em produção · `public/uploads` no desenvolvimento |
| Testes | Vitest (unitários e integração com banco em memória) + teste de fumaça + Lighthouse CI |

Metodologia **mobile first**: estilos partem da tela pequena e crescem com `sm:`/`md:`/`lg:`.

## Desenvolvimento local

Não precisa de Docker nem de Postgres instalado.

```bash
npm install
cp .env.example .env   # ajuste ADMIN_EMAIL / ADMIN_SENHA
npm run dev            # http://localhost:3000  ·  painel em /painel
```

Sem `DATABASE_URL`, o banco fica em `.dados/pglite` (criado sozinho, com o usuário do painel vindo de `ADMIN_EMAIL`/`ADMIN_SENHA`). Para recomeçar do zero, apague a pasta `.dados/`.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento (hot reload) |
| `npm test` | testes (Vitest) |
| `npm run lint` / `npm run tipos` | ESLint / TypeScript |
| `npm run build` && `npm start` | build e servidor de produção local |
| `npm run verificar` | lint + tipos + testes + build |
| `bash scripts/teste-fumaca.sh [URL]` | teste de fumaça de um site no ar (com `ADMIN_EMAIL`/`ADMIN_SENHA`, testa o painel logado) |

## Publicação no Vercel

1. **Importe o repositório** em [vercel.com/new](https://vercel.com/new) (framework detectado: Next.js; nada a configurar no build).
2. **Banco:** *Storage → Create → Neon (Postgres)* e conecte ao projeto. A variável `DATABASE_URL` é criada sozinha.
3. **Imagens:** *Storage → Create → Blob* e conecte ao projeto. A variável `BLOB_READ_WRITE_TOKEN` é criada sozinha.
4. **Variáveis** em *Settings → Environment Variables* (Production e Preview):
   - `APP_CHAVE_CRIPTO`: gere com `openssl rand -base64 32` e **guarde uma cópia**; obrigatória;
   - `ADMIN_EMAIL`, `ADMIN_SENHA`, `ADMIN_NOME`: usuário do painel, criado no primeiro acesso ao banco vazio. Depois troque a senha pelo painel;
   - `SITE_URL`: o domínio definitivo (ex.: `https://davifotovideo.com.br`). Se ficar vazia, o Vercel usa o domínio do projeto.
5. **Deploy:** cada push na `main` publica em produção; cada PR ganha uma URL de preview.
6. **Domínio:** *Settings → Domains*.
7. **Google:** no painel, em *Editar site → SEO*, cole o código do Search Console e o ID do Google Analytics (GA4). A tela inicial do painel tem o atalho para o PageSpeed.

> **Plano:** o Vercel Hobby (grátis) é só para uso **não comercial**. Como o site é de um negócio, use o **Pro** (US$ 20/mês). Neon e Blob têm cotas gratuitas que atendem um site deste porte.

### Limites a conhecer

- Requisições no Vercel vão até **4,5 MB**. Por isso o painel reduz as fotos no navegador antes do envio (até 2400 px, com miniatura de 800 px; logo até 512 px).
- O conteúdo do site fica em cache por até 5 minutos, mas cada gravação no painel atualiza o site na hora.

## Estrutura

```
src/app/                 páginas (landing, painel) e rotas da API (src/app/api/...)
src/servidor/            código só do servidor: banco, login/2FA, conteúdo, imagens, helpers HTTP
src/conteudo/            conteúdo padrão do site, tipos e leitura (padrão + o que foi salvo no painel)
src/components/          seções da landing e componentes do painel
src/lib/                 utilitários (cliente da API, redimensionamento de imagem, Google, fontes)
testes/                  testes do Vitest
scripts/teste-fumaca.sh  teste de fumaça usado no CI
```

## CI (GitHub Actions)

Em cada push e PR (`.github/workflows/ci-cd.yml`): auditoria de dependências, lint, tipos, testes, build, teste de fumaça com `next start` e **Lighthouse mobile** (relatório salvo como artefato). O deploy fica com a integração Git do Vercel.

Última medição local do Lighthouse (mobile): desempenho 97–100, acessibilidade 97, boas práticas 96, SEO 100.

## Segurança

- **Painel:** senha (bcrypt) + **verificação em duas etapas** (TOTP: Google Authenticator, Microsoft Authenticator, Authy), ativada em *Conta*, com 10 códigos de recuperação de uso único. Os segredos ficam cifrados no banco (AES-256-GCM, chave `APP_CHAVE_CRIPTO`). Cada código vale uma única vez (anti-replay).
- **Bloqueio:** 5 falhas (senha ou código) em 15 min bloqueiam a conta temporariamente. O desafio do 2FA vale 5 min e aceita até 5 códigos.
- **Sessões:** token opaco em cookie `httpOnly` + `SameSite=Lax` (`Secure` em produção), guardado no banco só como hash e com validade de 7 dias.
- **CSRF:** as rotas que alteram dados exigem a mesma origem do site.
- **Uploads:** só JPEG, PNG ou WebP, conferidos pela assinatura dos bytes (não pela extensão), com até 4 MB e 40 MP.
- **Cabeçalhos:** CSP `frame-ancestors 'none'`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` e HSTS.
- **Proteção das fotos:** clique direito, arrastar, Ctrl+S/Ctrl+P e impressão bloqueados no site. Isso dificulta a cópia, mas não a impede (ex.: captura de tela).
- **Dependências:** `npm audit --omit=dev` roda no CI.
