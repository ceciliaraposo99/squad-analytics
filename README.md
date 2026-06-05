# Squad Analytics — InCred

Dashboard de performance por squad com dados do Mesh (ClickHouse).

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as credenciais do ClickHouse

# 3. Rodar
npm run dev
# Abrir http://localhost:3000
```

## Deploy no Railway

1. Suba o projeto no GitHub
2. Acesse [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Selecione o repositório `squad-analytics`
4. Em **Variables**, adicione as variáveis do `.env.example`:
   - `CH_URL`
   - `CH_USER`
   - `CH_PASSWORD`
   - `CH_DATABASE`
5. Railway detecta o `package.json` e faz deploy automático

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `CH_URL` | URL do ClickHouse (ex: `http://host:8123`) |
| `CH_USER` | Usuário |
| `CH_PASSWORD` | Senha |
| `CH_DATABASE` | Database (geralmente `default`) |
| `PORT` | Porta (Railway injeta automaticamente) |
