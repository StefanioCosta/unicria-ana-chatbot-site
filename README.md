# Unicria Ana Chatbot Site + SaaS

Este projeto combina:
- site público da Unicria
- painel SaaS multi-tenant para atendimento
- chatbot da Ana com IA
- banco SQLite com Prisma
- integração WhatsApp
- agendamento Kikolo (modo real ou simulado)

## Requisitos

- Bun 1.x
- Node.js 20+
- SQLite
- conta OpenAI com chave API
- (opcional) conta Meta WhatsApp / Cloud API ou UAZAPI
- (opcional) conta Kikolo e Playwright para automação real

---

## 1) Clonar e instalar dependências

```bash
cd /caminho/do/projeto
bun install
```

Se o projeto ainda não tiver dependências instaladas, também rode:

```bash
bun add openai
```

---

## 2) Configuração do banco local

O projeto agora usa o banco local do repositório:

```env
DATABASE_URL="file:./db/custom.db"
```

Isso evita o problema do caminho antigo `/home/z/my-project/...` que não existe neste ambiente.

### Verificar o caminho do banco

```bash
ls -la db
```

Se a pasta `db` existir e o ficheiro `custom.db` estiver lá, o banco está correto.

---

## 3) Configuração de ambiente

Crie ou edite o ficheiro `.env` na raiz do projeto com algo assim:

```env
DATABASE_URL="file:./db/custom.db"
AUTH_SECRET="ana-unicria-secret-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxx"
OPENAI_BASE_URL=""
OPENAI_MODEL="gpt-4o-mini"

WHATSAPP_PROVIDER="cloud_api"
WHATSAPP_PHONE_ID=""
WHATSAPP_TOKEN=""
WHATSAPP_VERIFY_TOKEN="unicria-verify-2026"

UAZAPI_URL=""

KIKOLO_URL=""
KIKOLO_EMAIL=""
KIKOLO_PASSWORD=""
```

### Importante
- `OPENAI_API_KEY` é obrigatório para a IA real funcionar.
- `WHATSAPP_*` e `KIKOLO_*` são opcionais: sem elas o projeto entra em modo demo/simulado.
- Nunca commite chaves reais no Git. Use `.env` localmente e mantenha em segredo.

---

## 4) Prisma e geração do banco

Rode:

```bash
bunx prisma generate
bunx prisma db push --accept-data-loss
```

Se quiser recriar os dados de exemplo:

```bash
bunx tsx scripts/seed.ts
```

Esse script cria:
- tenant Unicria
- utilizador admin
- produtos exemplo
- prompt inicial da Ana
- conversas e vendas demo

### Login padrão

```text
email: admin@unicria.ao
password: unicria2026
```

---

## 5) OpenAI real (IA da Ana)

A IA foi configurada para usar OpenAI como provedor principal.

### Como activar

1. Cria uma conta em OpenAI.
2. Gera uma API key.
3. Coloca no `.env`:

```env
OPENAI_API_KEY="sua-chave"
OPENAI_MODEL="gpt-4o-mini"
```

### Modelo recomendado

```env
OPENAI_MODEL="gpt-4o-mini"
```

Também podes usar `gpt-4o` se quiseres um modelo mais forte.

### Como funciona no código

Em [src/lib/ana.ts](src/lib/ana.ts), a aplicação tenta usar OpenAI primeiro. Se a chave não estiver configurada, cai para fallback `Z AI` (se estiver disponível). Se nenhuma IA estiver disponível, devolve uma resposta local simples.

---

## 6) WhatsApp real

A integração de envio foi ajustada para usar `WHATSAPP_PROVIDER`, `WHATSAPP_PHONE_ID` e `WHATSAPP_TOKEN` do ambiente, com fallback para dados do tenant.

### Configuração do Meta Cloud API

1. Cria uma app no Meta Developer.
2. Ativa WhatsApp.
3. Obtém o `Phone Number ID`.
4. Gera access token.
5. Preenche o `.env`:

```env
WHATSAPP_PROVIDER="cloud_api"
WHATSAPP_PHONE_ID="SEU_PHONE_ID"
WHATSAPP_TOKEN="SEU_TOKEN"
WHATSAPP_VERIFY_TOKEN="unicria-verify-2026"
```

### Webhook

No painel do Meta, configura o callback URL:

```text
https://SEU_DOMINIO.com/api/webhook/whatsapp
```

E o `verify token` deve ser:

```text
unicria-verify-2026
```

ou o valor útil no tenant da base de dados.

### Caso use UAZAPI

```env
WHATSAPP_PROVIDER="uazapi"
UAZAPI_URL="https://api.uazapi.com"
WHATSAPP_TOKEN="SEU_TOKEN_UAZAPI"
```

---

## 7) Kikolo real

O agendamento real depende de credenciais reais e de Playwright.

### Instalar Playwright

```bash
bun add playwright
bunx playwright install chromium
```

### Configuração real

```env
KIKOLO_URL="https://seu-site-kikolo.com/login"
KIKOLO_EMAIL="seu@email.com"
KIKOLO_PASSWORD="sua-senha"
```

### Observações
- O código em [src/lib/kikolo.ts](src/lib/kikolo.ts) já tenta usar credenciais do ambiente primeiro.
- Se não houver credenciais, o app usa o modo simulado para demonstrar o fluxo.
- O fluxo real precisa ajustar os seletores HTML da Kikolo ao painel real da plataforma.

---

## 8) Rodar o projeto localmente

### Desenvolvimento

```bash
bun run dev
```

Acesse:
- `http://localhost:3000` → painel SaaS
- `http://localhost:3000/?site=1` → site público da Unicria

### Build de produção

```bash
bun run build
```

### Iniciar em produção

```bash
bun run start
```

---

## 9) Troubleshooting

### Problema: banco não abre

Verifica se o `.env` está assim:

```env
DATABASE_URL="file:./db/custom.db"
```

Confirma se o ficheiro existe:

```bash
ls -la db/custom.db
```

### Problema: IA não responde

Verifica:

```bash
echo $OPENAI_API_KEY
```

Se vier vazio, a IA não funciona.

### Problema: WhatsApp não envia

Confirma se há:
- `WHATSAPP_PROVIDER`
- `WHATSAPP_PHONE_ID`
- `WHATSAPP_TOKEN`

Sem isso, o envio fica em modo demo.

### Problema: Kikolo sempre simulado

Confirma se as variáveis estão preenchidas:

```env
KIKOLO_URL=
KIKOLO_EMAIL=
KIKOLO_PASSWORD=
```

---

## 10) Segurança

Para produção, recomenda-se:
- usar secrets manager (Azure Key Vault, AWS Secrets Manager, etc.)
- encriptar tokens e senhas do tenant
- remover `console.log` de dados sensíveis
- usar HTTPS e domínio real
- limitar Webhook/Rate limit
- separar ambiente dev/prod
- guardar credenciais do cliente fora do repositório

---

## 11) Resumo prático

O projeto já está estruturado para funcionar em três níveis:

1. Local/demo
   - banco local
   - login padrão
   - IA simulado ou fallback
   - WhatsApp sem credenciais = demo
   - Kikolo sem credenciais = simulado

2. Configuração real
   - OpenAI key ativa
   - WhatsApp provider + token
   - DB correto
   - webhook configurado

3. Produção real
   - HTTPS
   - secrets reais
   - monitorização
   - automação Kikolo + WhatsApp ativa

---

## 12) Login rápido para testar

```bash
bun run dev
```

Depois:
- abre `http://localhost:3000`
- usa:

```text
admin@unicria.ao
unicria2026
```

---

Se quiseres, também posso preparar a versão final com:
- `.env.example` completo
- script de setup automático
- verificação de ambiente (`npm/bun doctor`)
- checklist de deploy em produção
