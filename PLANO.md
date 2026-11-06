# Plano — Site do Fotógrafo

## Decisões fechadas

| Tema | Decisão |
|------|---------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS + Framer Motion |
| Backend | Spring Boot 3.5.x / Java 21 |
| Banco | PostgreSQL 16 |
| Fotos | Pasta `/data/fotos` dentro do container backend, persistida via volume Docker (`fotos_data`). Banco guarda só metadados |
| Containers | 3: `frontend`, `backend`, `db` |
| Repositório | Git local próprio (`main`), independente de `D:\Projetos`. Remote será adicionado depois |
| Metodologia | **Mobile First** (ver seção abaixo) |

## Metodologia: Mobile First

- **Design e CSS partem de 360px**; breakpoints só *adicionam* (`sm 640`, `md 768`, `lg 1024`, `xl 1280`). Tailwind já é mobile-first: classes sem prefixo = mobile.
- **Toque primeiro**: alvos ≥ 44×44px, swipe no lightbox e na seleção de fotos, CTA de WhatsApp fixo no rodapé no mobile.
- **Performance em 4G**: `next/image` com `sizes` responsivo, AVIF/WebP, lazy loading, prévias da área do cliente geradas em ~1600px; orçamento: LCP < 2,5s, CLS < 0,1, JS inicial < 150KB.
- **Animações leves no mobile**: apenas `transform`/`opacity`, parallax desativado em telas pequenas, respeito a `prefers-reduced-motion`.
- **Painel gestor também mobile**: fotógrafo consegue subir fotos e editar textos pelo celular (upload pela câmera/galeria).
- **Validação**: Lighthouse mobile ≥ 90 em todas as páginas públicas; testes Playwright em viewport mobile (Pixel 7 / iPhone 14) e desktop.
- **Ordem de desenvolvimento**: cada tela é implementada e aprovada primeiro no layout mobile, depois expandida.

## Arquitetura

```
Site_Fotografo/
├── docker-compose.yml
├── .env.example
├── frontend/            → Next.js (porta 3000, único exposto)
│   └── app/
│       ├── (site)/      → landing pública (SSR/ISR, SEO)
│       ├── cliente/     → área do cliente
│       └── painel/      → painel gestor
├── backend/             → Spring Boot (porta 8080, rede interna)
│   └── /data/fotos      → volume: portfolio/, galerias/{id}/originais|previas|finais
└── db/                  → init do Postgres (migrações via Flyway no backend)
```

- Next faz proxy de `/api/*` → backend.
- Backend: Spring Web, Security (JWT), Data JPA, Flyway, Validation, Mail, `@Scheduled`, Thumbnailator (miniatura + marca d'água).
- Arquivos servidos pelo backend com verificação de permissão (finais/prévias nunca ficam públicos).

## Módulos

### 1. Landing (pública)
- Hero → Sobre → Portfólio (categorias + lightbox) → Serviços/Pacotes → Como funciona → Depoimentos → FAQ → CTA final → Rodapé.
- CTAs: WhatsApp flutuante (`wa.me` com mensagem pré-preenchida), Instagram, e-mail, telefone — todos editáveis.
- Animação na rolagem (Framer Motion).
- SEO: metadata editável, Open Graph, `sitemap.xml`, `robots.txt`, JSON-LD (`LocalBusiness`/`ProfessionalService`), `alt` obrigatório.

### 2. Área do cliente
Status da galeria: `CRIADA → AGUARDANDO_SELECAO → SELECAO_ENVIADA → EM_TRATAMENTO → ENTREGUE → EXPIRADA`

1. Fotógrafo cria a galeria e sobe originais → cliente recebe acesso por e-mail.
2. Cliente vê prévias com marca d'água (sem download).
3. Seleciona fotos (contador vs. limite do pacote, comentário por foto) → envia (seleção travada).
4. Fotógrafo sobe as finais → cliente notificado.
5. Download individual ou ZIP.
6. 60 dias após a entrega → job diário exclui os arquivos; avisos em D-7 e D-1; contagem regressiva visível.

### 3. Painel gestor
- Conteúdo: todas as seções exceto o nav; imagens; depoimentos; FAQ; pacotes; contatos; SEO. Ao salvar, revalida o Next (ISR on-demand).
- Portfólio: upload drag-and-drop, categorias, ordenação, alt, destaque.
- Galerias: criar, upload em lote com progresso, ver seleção, exportar nomes dos arquivos (Lightroom), subir finais, reenviar acesso.
- Dashboard: galerias por status, próximas expirações.

## Modelo de dados (resumo)
`usuario`, `conteudo_secao` (chave + JSONB), `config_contato`, `config_seo`, `categoria`, `foto_portfolio`, `cliente`, `galeria`, `foto_galeria` (tipo ORIGINAL/FINAL, selecionada, comentário), `notificacao_log`.

## Fases

| # | Fase | Entregável |
|---|------|------------|
| 1 | Base do projeto ✅ | Compose com 3 containers, Flyway, healthchecks, `.env.example` |
| 2 | Backend principal | Autenticação JWT, storage em volume, processamento de imagem, API de conteúdo |
| 3 | Landing (mobile first) ✅ | Seções, animações, SEO, CTAs (conteúdo de exemplo; ligação ao painel na Fase 4) |
| 4 | Painel gestor | Editor de conteúdo, portfólio, galerias |
| 5 | Área do cliente | Seleção, aprovação, download ZIP |
| 6 | Automação | Job de expiração, e-mails, avisos |
| 7 | Acabamento | Testes (JUnit + Playwright mobile/desktop), Lighthouse, LGPD, backup |

## Regras de negócio (decididas)

| Tema | Decisão |
|------|---------|
| Limite de fotos | Limite configurável por galeria. O cliente pode passar do limite; as extras ficam destacadas no painel e a cobrança é combinada por fora (sem pagamento online) |
| Acesso do cliente | Link mágico por e-mail (token de uso único, validade de 30 min, sessão via JWT) |
| Galerias por cliente | Várias |
| Orçamento | Formulário curto (nome, contato, tipo de ensaio, data desejada, mensagem) → vira lead no painel + abre o WhatsApp com a mensagem pronta |
| Exclusão em 60 dias | Conta a partir da entrega das finais; apaga **tudo** (originais, prévias e finais). A galeria fica só como registro no painel |
| Volume | Até ~200 fotos JPEG por galeria (~10 MB cada, ~2 GB/galeria). Limite de 30 MB por arquivo, configurável no `.env` |
| E-mail | SMTP genérico via `.env`; em dev, os e-mails vão para o log |
| Idioma | Somente pt-BR |
| Identidade visual | Proposta minimalista escura (portfólio), ajustável depois |
| Hospedagem / HTTPS | A definir no deploy (HTTPS no host ou Cloudflare) |

### Acréscimos ao escopo por causa das decisões
- **Painel → Leads**: lista de pedidos de orçamento com status (novo, em contato, fechado, perdido).
- **Modelo de dados**: + `lead`, + `token_acesso` (link mágico), `galeria.limite_fotos`.
- **Proteção do formulário**: rate limit + honeypot (sem captcha de terceiros).
