# HelloRating Backend

Backend API para o sistema HelloRating - Gestão de Pesquisa de Satisfação (NPS).

## Tecnologias

- **Node.js** com Express
- **Supabase** para persistência de dados
- **Vercel** para deploy

## Estrutura do Projeto

```
hellorating-backend/
├── api/
│   └── index.js       # Arquivo principal da API
├── package.json       # Dependências do projeto
├── vercel.json        # Configuração do Vercel
└── README.md          # Este arquivo
```

## Configuração do Supabase

Para usar o Supabase como banco de dados, você precisa:

1. Criar uma conta gratuita em [supabase.com](https://supabase.com)
2. Criar um novo projeto
3. Criar as seguintes tabelas no SQL Editor:

### Tabela `campaigns`

```sql
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  main_metric TEXT DEFAULT 'NPS',
  redirect_enabled BOOLEAN DEFAULT false,
  redirect_rule TEXT,
  feedback_enabled BOOLEAN DEFAULT false,
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela `questions`

```sql
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  options JSONB,
  "order" INTEGER NOT NULL,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela `responses`

```sql
CREATE TABLE responses (
  id SERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  user_email TEXT,
  answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela `users`

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  credits INTEGER DEFAULT 5000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no Vercel:

- `SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_KEY`: Chave de API do Supabase (anon/public key)

**Nota:** Se as variáveis de ambiente não estiverem configuradas, a API usará dados mock para demonstração.

## Deploy no Vercel

1. Faça upload deste projeto para um repositório GitHub
2. Conecte o repositório ao Vercel
3. Configure as variáveis de ambiente
4. O Vercel fará o deploy automaticamente

## Endpoints da API

### Campanhas

- `GET /api/campaigns` - Listar todas as campanhas
- `GET /api/campaigns/:id` - Obter uma campanha específica
- `PUT /api/campaigns/:id` - Atualizar uma campanha
- `GET /api/campaigns/:id/questions` - Obter perguntas de uma campanha
- `PUT /api/campaigns/:id/questions` - Atualizar perguntas de uma campanha
- `GET /api/campaigns/:id/dashboard` - Obter dados do dashboard

### Pesquisas (Público)

- `GET /api/surveys/:id` - Obter dados da pesquisa (campanha + perguntas)
- `POST /api/surveys/:id/responses` - Enviar resposta da pesquisa

### Health Check

- `GET /` - Verificar status da API

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev
```

A API estará disponível em `http://localhost:3001`

## Licença

MIT

