# Worklog

---
Task ID: 1
Agent: Main agent (Z.ai)
Task: Extrair dados da página do Facebook Unicria (id=61552489509504) e criar o site oficial com todos os dados

Work Log:
- WebFetch direto bloqueado (login wall) em web.facebook.com, m.facebook.com e www.facebook.com
- WebSearch pelo ID da página: sem resultados
- agent-browser (headless Chrome): abriu a página, título revelou "Unicria | Facebook"
- Extraído de meta tags (og:): nome, bio completa, 147 seguidores, link canónico
- Snapshot de acessibilidade: categoria (Entrepreneur), telefone (+244 950 418 496), último post (6 Oct: "Brevemente voltaremos com novidades meus Unilovers"), reações, comentário próprio
- Aba About (via ?sk=about): categorias, contact info, WhatsApp
- Aba Photos: extraídas URLs de 8 imagens únicas do CDN (fbcdn)
- Truque de resolução: swap do parâmetro ctp= na URL assinada → fotos HD (480–720px) baixadas via scripts/download_fb_images_hd.py
- Fotos identificadas visualmente: logo (cover + profile) e 6 iPhones (13 Pro Max azul, 12 Pro prateado, 13 Pro branco, 11 Pro cinza, 11 branco, 11 roxo)
- Inicializado ambiente fullstack (init-fullstack.sh)
- Copiadas 8 imagens para public/images/
- Tema Tailwind 4: cores da marca (navy #16233c, gold #c9a45c) via @theme inline + @utility text-gold-gradient (corrigido problema de CSS custom purgado do bundle — reescrito com sintaxe nativa Tailwind 4: @theme --animate-*, @utility)
- layout.tsx: metadata pt_AO, OG/Twitter, favicon logo, themeColor navy
- Componentes criados em src/components/unicria/: navbar (sticky+blur+mobile menu), hero (stats, CTAs, logo flutuante), sections (benefícios + catálogo 6 produtos), contact (sobre + contacto), footer (+ WhatsApp float), icons (WhatsApp SVG)
- src/lib/site-data.ts: dados centralizados (SITE, PRODUCTS, whatsappLink, productMessage)
- Bug corrigido: âncora nativa cancelada pelo unmount do menu mobile → navegação programática goTo() com scrollIntoView + replaceState
- metadataBase adicionado para remover aviso do Next.js
- Verificação E2E com agent-browser: desktop 1440px (hero, benefícios, produtos, sobre, contacto, footer), mobile 375px (menu hambúrguer abrir/fechar/navegar), 12 links wa.me corretos, 3 links Facebook corretos, lint limpo, sem erros no dev.log

Stage Summary:
- Site Unicria completo e verificado em execução (porta 3000, rota /)
- Dados extraídos: nome, bio, telefone/WhatsApp, categoria, seguidores, localização, último post, 8 fotos HD
- Stack: Next.js 16 + TS + Tailwind 4 + shadcn/ui + framer-motion
- Identidade visual fiel ao logo: navy + dourado, pt-AO
- Feature central: catálogo com 6 iPhones + CTA WhatsApp por produto com mensagem pré-preenchida

---
Task ID: 2
Agent: Main agent (Z.ai)
Task: Construir o SaaS "Ana — Atendimento Unicria" (chatbot IA + painel + Kikolo + multi-tenant)

Work Log:
- Schema Prisma multi-tenant criado: Tenant (bot/prompt/horário/WhatsApp/Kikolo), User, Product, Conversation, Message, Sale — db:push OK
- Seed: tenant Unicria (bot +244950418496), user admin@unicria.ao/unicria2026, 6 produtos (iPhones com fotos), prompt da Ana (personalidade + 20 respostas do dono), base de conhecimento, 3 conversas demo + 2 vendas
- src/lib/ana-prompt.ts: prompt da Ana (material do cliente) + instrução de saída JSON estruturado
- src/lib/ana.ts: motor — histórico, prompt builder com hora de Luanda, catálogo da DB, chamada LLM (z-ai-web-dev-sdk), parse robusto de JSON, criação de venda em intenção "agendar", estados de conversa
- src/lib/ana-send.ts: entrega WhatsApp Cloud API (Graph v21.0) ou UAZAPI, se configurado; modo demo sem credenciais
- src/lib/kikolo.ts: worker de agendamento — modo SIMULAÇÃO (protocolo KKL-*) e modo REAL com Playwright (import dinâmico, seletores documentados, storageState por tenant, re-login)
- src/lib/auth.ts: sessão HMAC em cookie httpOnly, hash sha256+salt, requireSession para API routes
- APIs: auth (login/logout/me), chat/simulate, webhook/whatsapp (GET verify Meta + POST receive), conversations (+[id] GET/POST humano/PATCH status), sales (+[id] PATCH/DELETE), products (+[id] CRUD), settings (GET/PATCH), stats (KPIs + gráfico 7 dias), kikolo/test
- Frontend (rota única /): Login → SaaSApp (sidebar) com views: Dashboard (KPIs, win rate, gráfico recharts, toggle robô), Conversas (lista+chat+responder como humano+Simulador da Ana), Vendas (fechadas/perdidas, totais, marcar perdida/reabrir), Produtos (CRUD + link Kikolo), Ana IA (prompt editável, horário, conhecimento, on/off), Configurações (número bot, Cloud API/UAZAPI, webhook URL+verify token, Kikolo + teste)
- Rota /?site=1 preserva o site público Unicria da task 1
- Verificação E2E (agent-browser): login OK, dashboard OK, simulador → Ana respondeu em personagem ("sob consulta", pagamento na entrega) → fluxo de compra completo → venda criada + notificação "🔔 Venda Fechada!" + worker Kikolo executou (protocolo KKL-MVGP9U8T), vendas listadas, todas as abas renderizadas
- Webhook testado via curl: handshake Meta correto (challenge/403) e POST processado
- Lint limpo, sem erros no dev.log

Stage Summary:
- MVP funcional do SaaS multi-tenant completo e verificado
- IA da Ana a funcionar de verdade (LLM) com o prompt e as 20 respostas do dono
- Fluxo completo demonstrado: mensagem → Ana → intenção agendar → venda → worker Kikolo → notificação
- Pendente para produção: credenciais reais Meta/Uazapi, Playwright install + seletores Kikolo, encriptação de credenciais, billing
