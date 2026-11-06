# Unicria Ana — configuração do bot e deploy no Railway

## Estado validado

O projeto foi validado com Node 22, npm, Prisma 6.19.3 e Next.js 16. O lint, o typecheck, a geração do Prisma Client e o build de produção passam. O servidor standalone responde em `/api`, o login cria sessão e o simulador responde sem uma chave OpenAI usando o fallback local.

O comando de produção usa Node, não Bun, e o artefacto standalone inclui `public` e `prisma` para o modo SQLite local.

## Antes de publicar

1. Não faça commit de `.env`, `node_modules`, `.next`, `db/custom.db` ou tokens. O `.gitignore` já ignora `.env*`, `.next` e logs; confirme que estes ficheiros não aparecem no `git status`.
2. Se o `.env` enviado no ZIP tiver chaves reais, revogue e gere novas chaves. O ficheiro deve ser tratado como potencialmente exposto.
3. Gere segredos fortes, diferentes entre ambientes:

```bash
openssl rand -hex 32   # AUTH_SECRET
openssl rand -hex 24   # WHATSAPP_VERIFY_TOKEN
```

4. Troque a password inicial `unicria2026` depois do primeiro acesso. O seed continua a criar essa conta para demonstração; não execute o seed em produção, porque ele apaga todos os dados.

## Variáveis no Railway

Crie estas variáveis no serviço da aplicação. Em produção, `AUTH_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `WHATSAPP_VERIFY_TOKEN` e `WHATSAPP_APP_SECRET` devem ser preenchidas.

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO.up.railway.app
AUTH_SECRET=SEGREDO_LONGO_E_ALEATORIO

OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

WHATSAPP_PROVIDER=cloud_api
WHATSAPP_PHONE_ID=ID_DO_NUMERO_META
WHATSAPP_TOKEN=TOKEN_PERMANENTE_META
WHATSAPP_VERIFY_TOKEN=TOKEN_DE_VERIFICACAO_ALEATORIO
WHATSAPP_APP_SECRET=APP_SECRET_DA_META

# Só se usar UAZAPI
UAZAPI_URL=

# Só se activar automação real Kikolo
KIKOLO_URL=
KIKOLO_EMAIL=
KIKOLO_PASSWORD=
```

Os tokens WhatsApp e a password Kikolo não são devolvidos pelo endpoint de configurações. Um campo vazio no painel significa “não alterar” o segredo guardado.

## Base de dados de Produção: PostgreSQL

O schema Prisma já está configurado nativamente com `provider = "postgresql"`. No Railway (ou qualquer outro provedor em nuvem):

1. Adicione um plugin/serviço **PostgreSQL** no mesmo projeto Railway.
2. Nas variáveis do serviço da aplicação `unicria-ana`, adicione a variável `DATABASE_URL` referenciando `${{Postgres.DATABASE_URL}}`.
3. Na fase de deploy, o `railway.json` sincroniza o esquema automaticamente:

```bash
npx prisma db push --skip-generate
# ou: npm run migrate:prod
```

4. Para inicializar o tenant principal e utilizador Owner de forma segura e sem apagar dados:

```bash
npm run seed:prod
```

## Deploy pelo GitHub

1. Crie um repositório privado no GitHub e copie apenas o código do projeto. Não inclua `.env`, `node_modules`, `.next` nem a base SQLite local.
2. Faça push para a branch de produção:

```bash
git init
git add .
git commit -m "Preparar aplicação Ana para produção"
git branch -M main
git remote add origin git@github.com:UTILIZADOR/unicria-ana-chatbot-site.git
git push -u origin main
```

3. No Railway, escolha **New Project → Deploy from GitHub repo**, seleccione o repositório e faça o primeiro deploy.
4. No serviço, adicione as variáveis acima. Se estiver a usar PostgreSQL, adicione o serviço PostgreSQL no mesmo projeto e referencie a variável `DATABASE_URL` desse serviço.
5. O `railway.json` já define `npm run build`, `npm run start`, health check em `/api` e reinício em falha.
6. Em **Settings → Networking**, escolha **Generate Domain**. Depois actualize `NEXT_PUBLIC_APP_URL` com o domínio final e faça redeploy.
7. Verifique:

```bash
curl -fsS https://SEU-DOMINIO.up.railway.app/api
```

A resposta deve indicar `"status":"online"`.

## Deploy pela CLI Railway

Com o Railway CLI autenticado:

```bash
railway login
railway init
railway link
railway variables set NODE_ENV=production
railway up
railway open
```

Para segredos, prefira adicioná-los no painel ou via CLI sem os colocar em scripts versionados. Depois de criar um domínio, teste novamente `/api` e consulte os logs do serviço.

## Configurar o WhatsApp Cloud API / Meta

1. No Meta for Developers, crie ou abra a aplicação e active WhatsApp Business Platform.
2. Obtenha o `Phone Number ID`, o token de acesso permanente e o `App Secret` da aplicação.
3. No Railway, configure `WHATSAPP_PHONE_ID`, `WHATSAPP_TOKEN` e `WHATSAPP_APP_SECRET`.
4. No painel da Meta, abra a configuração de Webhooks e use:

```text
Callback URL: https://SEU-DOMINIO.up.railway.app/api/webhook/whatsapp
Verify token: o mesmo valor de WHATSAPP_VERIFY_TOKEN
```

5. Subscreva o campo `messages`.
6. Teste a verificação:

```bash
curl -i "https://SEU-DOMINIO.up.railway.app/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=SEU_VERIFY_TOKEN&hub.challenge=12345"
```

Deve devolver HTTP 200 e o corpo `12345`.

Os POSTs Meta são validados com `X-Hub-Signature-256` usando `WHATSAPP_APP_SECRET`. Em produção, o endpoint recusa POSTs se esse segredo não estiver configurado. A Meta pode reenviar eventos, portanto deve ser acrescentada deduplicação por `message.id` antes de operar em escala; o código actual mantém a conversa por telefone/origem, mas ainda não guarda o ID de cada evento Meta.

## Configurar o bot Ana

1. Crie o tenant e o utilizador com a seed apenas num ambiente vazio:

```bash
npx prisma generate
npx prisma db push
npx tsx scripts/seed.ts
```

2. Aceda ao painel e altere a password inicial.
3. Em **Configurações**, confirme o número do bot, o horário, o prompt e a base de conhecimento.
4. Para IA real, preencha `OPENAI_API_KEY`. Sem essa chave, o sistema funciona, mas responde com o fallback local.
5. Teste primeiro em **Simulador**, confirme a conversa e só depois active o webhook Meta.

## UAZAPI e Kikolo

Para UAZAPI, use `WHATSAPP_PROVIDER=uazapi`, preencha `UAZAPI_URL` e o token correspondente. Para Kikolo, preencha `KIKOLO_URL`, `KIKOLO_EMAIL` e `KIKOLO_PASSWORD`. O projecto inclui Playwright, mas o fluxo real ainda contém seletores comentados que têm de ser ajustados ao painel concreto da Kikolo. Sem credenciais, o sistema usa o modo simulado.

Se for necessário instalar browsers no ambiente Railway para o fluxo real, configure a instalação do Chromium compatível com o builder utilizado e valide memória/tempo de execução. Não active a automação real antes de testar os seletores e os Termos de Serviço da Kikolo.

## Checklist pós-deploy

- `/api` devolve online.
- Login funciona e o cookie de sessão tem `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- `/api/settings` não devolve tokens WhatsApp nem password Kikolo.
- O GET do webhook devolve o challenge correcto.
- Um POST assinado é aceite e um POST sem assinatura é recusado em produção.
- OpenAI responde ou o fallback é aceite conscientemente.
- A base de dados persiste após um redeploy.
- Os logs não contêm tokens, passwords nem corpo completo de mensagens.
- O número WhatsApp está autorizado na Meta e o campo `messages` está subscrito.

## Referências oficiais

- [Railway Quick Start](https://docs.railway.com/quick-start)
- [Railway PostgreSQL](https://docs.railway.com/databases/postgresql)
- [Meta — Create a webhook endpoint](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint/)
