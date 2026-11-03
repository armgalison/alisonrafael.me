# Chatbot IA

## Overview

Um chatbot flutuante inteligente integrado ao site que usa a Anthropic API para responder perguntas sobre Alison Rafael, sua experiência, skills e projetos.

## Features

- 🎯 Ícone flutuante no canto inferior direito
- 💬 Widget flutuante com streaming em tempo real
- 📚 Histórico de conversas armazenado no banco de dados
- 🔒 Rate limiting: 10 mensagens/dia por visitante
- 🎨 Animações fluidas com Framer Motion
- 📱 Responsivo (mobile-friendly)

## Arquitetura

### Backend
- **Localização**: `server/src/chat/`
- **Componentes**:
  - `chat.service.ts` - Lógica de conversa
  - `chat-streaming.service.ts` - Integração com Anthropic API
  - `chat.controller.ts` - Endpoints SSE
  - `chat-rate-limit.guard.ts` - Rate limiting por IP
  - Entidades: `ChatSession`, `ChatMessage`

### Frontend
- **Localização**: `web-client/src/chat/`
- **Componentes**:
  - `ChatContainer.tsx` - Componente raiz
  - `components/ChatIcon.tsx` - Ícone flutuante com tooltip
  - `components/ChatWidget.tsx` - Widget principal
  - `components/ChatBubble.tsx` - Mensagens individuais
  - `components/ChatMessages.tsx` - Lista de mensagens
  - `components/ChatInput.tsx` - Campo de entrada
  - `useChat.ts` - Hook para gerenciamento de estado
  - `api.ts` - Cliente SSE

### Banco de Dados
- **Tabelas**:
  - `chat_sessions` - Sessões de conversa
  - `chat_messages` - Mensagens individuais
- **Identificação**: Por sessionId (salvo em sessionStorage)
- **Rate limiting**: Baseado em IP com janela de 24 horas

## Como Funciona

### Fluxo de uma Mensagem

1. **Usuário clica no ícone** → Widget abre
2. **Escreve uma mensagem** → Enviado via POST /chat/message
3. **Backend**:
   - Valida rate limit (10 msgs/dia por IP)
   - Recupera histórico da conversa
   - Injeta Resume Profile no system prompt
   - Chama Anthropic API com `claude-sonnet-5`
   - Faz streaming da resposta via SSE
4. **Frontend**:
   - Recebe tokens via SSE
   - Renderiza char-by-char com animação
   - Salva mensagem em histórico (sessionStorage)
5. **Persistência**: Tudo é salvo no MariaDB

### Endpoints

- `POST /chat/sessions` - Criar nova sessão
- `POST /chat/message` - Enviar mensagem (com streaming SSE)
- `GET /chat/sessions/:id/history` - Recuperar histórico

## Configuração

### Variáveis de Ambiente

```bash
# server/.env
ANTHROPIC_API_KEY=sk-ant-...  # Obrigatório
CHAT_MESSAGES_PER_DAY=10      # Rate limit

# web-client/.env.development
NEXT_PUBLIC_API_URL=http://localhost:3000

# web-client/.env.production
NEXT_PUBLIC_API_URL=https://api.alisonrafael.me
```

### System Prompt

O chatbot injeta automaticamente o perfil de Alison no system prompt:

```
You are Alison Rafael, a full-stack software engineer...
Skills: [lista do Resume Profile]
Keep responses concise (2-3 sentences), friendly, and professional.
```

## Desenvolvimento

### Rodar Localmente

```bash
# Build shared (requerido antes)
npm run build:shared

# Terminals separados:
npm run dev:api    # API em http://localhost:3000
npm run dev:web    # Web em http://localhost:5173
```

### Testar Endpoints

```bash
# Criar sessão
SESSION_ID=$(curl -X POST http://localhost:3000/chat/sessions | jq -r '.sessionId')

# Enviar mensagem (streaming)
curl -N -X POST http://localhost:3000/chat/message \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"content\": \"Who are you?\"}"
```

## Padrões Seguidos

- **Streaming**: Mesmo padrão do Trends Service (SSE via `res.write()`)
- **Rate Limiting**: Mesmo pattern do Comment Guard (em-memória, janela fixa)
- **Entidades**: Mesmo padrão do Comment (TypeORM, cascade delete)
- **Animações**: Framer Motion com `easeOut` (CommentsPage pattern)
- **API Client**: Reutiliza `streamSse()` do admin/api.ts

## Limitações e Notas

- ✅ Uma conversa por visitante (baseado em sessionId)
- ✅ 10 mensagens/dia (rate limiting global por IP)
- ✅ Histórico persistido em MariaDB
- ✅ Context do perfil Fornecido via Resume Profile
- ⚠️ Sem autenticação (público para todos os visitantes)
- ⚠️ Sem moderação (respostas diretas do Claude)

## Futuras Melhorias

- [ ] Adicionar suporte a Claude Desktop (dev-only)
- [ ] Implementar suporte a média de tokens por conversa
- [ ] Adicionar análise de sentimento
- [ ] Suporte multilíngue
- [ ] Cache de respostas comuns
- [ ] Admin dashboard para visualizar conversas

## Debugging

### API não responde
```bash
curl http://localhost:3000/health
```

### Web não carrega
```bash
npm run build:shared  # Rebuild shared primeiro
```

### Erro de rate limit
- Aguarde 24 horas ou limpe a entrada do Map em `chat-rate-limit.guard.ts`
- Rate limit é por IP, não por session

### Streaming não funciona
- Verificar se `ANTHROPIC_API_KEY` está set
- Verificar se modelo `claude-sonnet-5` é válido
