# Plano — Site do Fotógrafo (DAVIFOTOVIDEO)

## Decisões atuais

| Tema | Decisão |
|------|---------|
| Hospedagem | **Vercel** (plano Pro: uso comercial) |
| App | Um único Next.js 15 (App Router) + TypeScript + Tailwind CSS 4: site, painel e API (`src/app/api`) |
| Banco | Postgres no **Neon** (integração do Vercel); PGlite no desenvolvimento e nos testes |
| Imagens | **Vercel Blob**; reduzidas no navegador antes do envio (limite de 4,5 MB por requisição) |
| Contato | Só WhatsApp e Instagram (sem formulário); atendimento em todo o estado de Sergipe |
| Área do cliente | **Removida** a pedido do fotógrafo: seleção e entrega das fotos combinadas pelo WhatsApp |
| Metodologia | **Mobile first** |

## Histórico

- O projeto começou com 3 containers Docker (Next.js, Spring Boot e Postgres) e uma área do cliente para seleção e download, com retenção de 60 dias.
- Em 2026-11 a área do cliente foi removida. Para caber no Vercel, o backend Java foi reescrito dentro do Next.js e o Docker saiu do projeto.
- Mantidos da versão anterior: login do painel com 2FA (TOTP), bloqueio por tentativas, cabeçalhos de segurança, proteção contra download das fotos, integrações com Google (Search Console, Analytics com consentimento, PageSpeed/Lighthouse).

## Metodologia: Mobile First

- O CSS parte de 360 px; os breakpoints só *adicionam* estilos (`sm 640`, `md 768`, `lg 1024`, `xl 1280`).
- **Toque primeiro:** alvos de pelo menos 44×44 px e CTA de WhatsApp fixo no mobile.
- **Desempenho em 4G:** `next/image` com AVIF/WebP, animações só em CSS (`transform`/`opacity`), texto do topo visível na primeira pintura e respeito a `prefers-reduced-motion`.
- **Painel também no celular:** o fotógrafo sobe fotos pela câmera ou galeria e edita os textos.
- **Validação:** Lighthouse mobile no CI, com meta de 90 ou mais em acessibilidade e SEO.

## Módulos

1. **Landing (pública):** topo, sobre, portfólio por categoria, serviços, como funciona, depoimentos, FAQ, orçamento via WhatsApp, chamada final e rodapé. Tem SEO (metadados, JSON-LD, sitemap e robots).
2. **Painel gestor (`/painel`):** edita todas as seções exceto o menu; aparência (logo, nome e cores, fontes); portfólio (envio, categoria, destaque, ordem, exclusão); SEO e Google; conta (senha e 2FA).
