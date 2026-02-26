# Documentacao Completa - CRM AM Consultoria IA

Atualizado em: 2026-02-26

## 1) Resumo executivo

Este projeto e um CRM para consultoria em IA, BI e Dashboards Power BI com:

- interface web para operacao comercial e operacional
- autenticacao por email e senha (Supabase Auth)
- backend com OpenAI para analise executiva e contratos
- exportacao de relatorios e contratos em PDF/DOCX

### Links oficiais do projeto

- GitHub: `https://github.com/alankardecm/crm_amconsultoria`
- Producao (Vercel): `https://crm-amconsultoria.vercel.app`
- Dashboard Vercel: `https://vercel.com/alan-moreiras-projects`
- Supabase URL: `https://maghmcmvdznjtkbmrjei.supabase.co`
- Supabase dashboard: `https://supabase.com/dashboard/project/maghmcmvdznjtkbmrjei`

## 2) Arquitetura atual

## 2.1 Visao geral

```txt
Usuario (browser)
  -> Frontend (HTML/CSS/JS)
      -> Supabase (Auth + Postgres) [dados do CRM no app principal]
      -> Backend /api (Node/Express) [IA + exportacao]
           -> OpenAI API
```

## 2.2 Camadas

- Frontend principal: `index.html`
  - app monolitico com scripts inline
  - usa Supabase diretamente do browser
  - possui tela de configuracao inicial (URL + anon key + chave IA)
- Frontend modular: `dashboard.html`, `clientes.html`, `projetos.html`, `operador.html`, `relatorios.html`, `ia-executiva.html`
  - usa `js/data.js` (dados locais em `localStorage`) na maior parte
  - `ia-executiva.html` integra com backend `/api/*`
- Backend: `backend/app.js`, `server.js`, `api/index.js`
  - Express com rotas de IA e exportacao
  - mesmo codigo roda local e na Vercel

## 3) Estrutura de pastas e arquivos

```txt
.
|-- api/
|   `-- index.js                 # entrypoint serverless da Vercel
|-- backend/
|   `-- app.js                   # createApp() com todas as rotas /api
|-- css/
|   `-- index.css                # estilos do frontend modular
|-- js/
|   |-- app.js                   # session/sidebar/widget para paginas modulares
|   |-- ai-agent.js              # logica do chat AI no frontend modular
|   |-- executive-ai.js          # regras locais de IA executiva (fallback/local)
|   |-- data.js                  # base mock + localStorage
|   `-- cloud-auth.js            # auth cloud (arquivo nao referenciado hoje)
|-- supabase/
|   |-- schema.sql               # schema base + RLS
|   `-- seed.sql                 # dados iniciais opcionais
|-- clientes.html
|-- dashboard.html
|-- ia-executiva.html
|-- index.html                   # app principal (monolitico)
|-- operador.html
|-- projetos.html
|-- relatorios.html
|-- server.js                    # runtime local
|-- vercel.json                  # build/routes
|-- .env.example
|-- SUPABASE_SETUP.md
`-- SETUP_BACKEND_OPENAI.md
```

## 4) Hospedagem e deploy

## 4.1 Vercel

- Projeto: `crm-amconsultoria`
- Team: `alan-moreiras-projects`
- Config em `.vercel/project.json`:
  - `projectName`: `crm-amconsultoria`
- Arquivo `vercel.json`:
  - build serverless para `api/index.js`
  - build estatico para html/css/js/assets
  - rota `/api/*` -> `api/index.js`
  - rota `/` -> `index.html`

## 4.2 GitHub

Remote principal:

```txt
origin https://github.com/alankardecm/crm_amconsultoria.git
```

Fluxo padrao para subir alteracoes:

```powershell
git add .
git commit -m "mensagem objetiva"
git push origin main
```

Deploy manual em producao:

```powershell
vercel --prod
```

## 5) Banco de dados e autenticacao (Supabase)

## 5.1 Banco

- Provider: Supabase Postgres
- Projeto: `maghmcmvdznjtkbmrjei`
- URL: `https://maghmcmvdznjtkbmrjei.supabase.co`

## 5.2 Auth

- Metodo atual: email + senha
- Tabela de usuarios: `auth.users`
- Perfil de acesso no CRM: `public.crm_profiles`

Query para buscar UUID real de usuario:

```sql
select id, email, created_at
from auth.users
order by created_at desc;
```

Upsert do perfil dono:

```sql
insert into public.crm_profiles (user_id, nome, role)
values ('UUID_DO_AUTH_USERS', 'Alan Moreira', 'dono')
on conflict (user_id) do update
set nome = excluded.nome,
    role = excluded.role;
```

## 5.3 Schema base oficial do repositorio

Arquivo: `supabase/schema.sql`

Tabelas principais:

- `crm_profiles`
- `crm_clientes`
- `crm_projetos`
- `crm_tickets`
- `crm_contratos`
- `crm_interacoes`

O schema inclui:

- constraints de dominio
- `updated_at` trigger
- funcoes de contexto de usuario (`current_user_role`, `current_user_cliente_id`)
- RLS por role (`dono`, `operador`, `cliente`)

## 5.4 Divergencia importante de schema (estado atual)

O frontend principal em `index.html` usa um conjunto de colunas diferente do `supabase/schema.sql`.
Esse foi o motivo dos erros vistos em producao (ex.: coluna `ativo` ausente, `titulo` not null, etc.).

### Colunas esperadas por `index.html` (resumo)

- `crm_clientes`: `nome`, `empresa`, `email`, `tel`, `segmento`, `cidade`, `servicos`, `contrato`, `valor_mensal`, `ativo`, `obs`
- `crm_projetos`: `nome`, `cliente_id`, `cliente_nome`, `tipo`, `status`, `prazo`, `progresso`, `valor`, `descricao`
- `crm_contratos`: `descricao`, `cliente_id`, `cliente_nome`, `tipo`, `valor`, `data_vencimento`, `status`
- `crm_tickets`: `titulo`, `cliente_id`, `cliente_nome`, `prioridade`, `status`, `descricao`
- `crm_interacoes`: `ticket_id`, `texto`, `autor`, `criado_em`
- `crm_leads` (pipeline): tabela auxiliar criada por SQL embutido no `index.html`

### Colunas previstas no `supabase/schema.sql` (resumo)

- `crm_clientes` usa `status`/`mrr` e nao `ativo`/`valor_mensal`
- `crm_projetos` usa `titulo` e nao `nome`
- `crm_contratos` usa `titulo`/`valor_mensal` e nao `descricao`/`valor`
- `crm_interacoes` usa `cliente_id` e nao `ticket_id`

Conclusao: hoje existem dois modelos de dados competindo no projeto.

## 5.5 Recomendacao tecnica

Definir 1 modelo canonico e padronizar:

- Opcao A (mais rapida): alinhar banco ao `index.html` atual
- Opcao B (mais sustentavel): refatorar `index.html` para usar `supabase/schema.sql`

Sem essa decisao, novos erros de coluna devem continuar aparecendo.

## 6) Backend IA e exportacao

## 6.1 Endpoints disponiveis

Health/config:

- `GET /api/health`
- `GET /api/public-config`

IA:

- `POST /api/ai/suggestions`
- `POST /api/ai/report`
- `POST /api/ai/contract-analysis`
- `POST /api/ai/contract-draft`

Exportacao:

- `POST /api/export/pdf`
- `POST /api/export/docx`

## 6.2 Modelos e configuracao

- Modelo default: `gpt-4.1-mini` (`OPENAI_MODEL`)
- Chave IA lida no servidor por `OPENAI_API_KEY`
- Prompt de negocio usa variaveis de posicionamento da empresa no `.env`

## 6.3 Seguranca

Implementado corretamente no backend:

- OpenAI key fica no servidor (env)
- frontend chama `/api/*` sem expor segredo

Ponto de atencao atual:

- `index.html` possui fluxo alternativo que salva chave OpenAI no browser (`localStorage`) e chama `api.openai.com` direto.
- Isso nao e recomendado para producao.

## 7) Variaveis de ambiente

Definidas em `.env.example`:

- `PORT`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `COMPANY_NAME`
- `COMPANY_POSITIONING`
- `COMPANY_BUSINESS_MODEL`
- `COMPANY_IDEAL_CLIENT`
- `COMPANY_STYLE`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Observacao:

- O backend faz `trim()` nas envs para evitar problema de quebra de linha em valores colados por CLI.

## 8) Execucao local

## 8.1 Backend + frontend estatico

```powershell
npm install
npm start
```

Subir em: `http://localhost:3000`

## 8.2 Validacao minima

- abrir `/api/health`
- abrir `/api/public-config`
- abrir `/`
- abrir `/ia-executiva.html`

## 9) Operacao no Supabase (runbook)

## 9.1 Criar estrutura inicial

No SQL Editor:

1. Executar `supabase/schema.sql`
2. Executar `supabase/seed.sql` (opcional)

## 9.2 Criar usuario dono

1. `Authentication > Users > Add user` (email/senha)
2. Buscar UUID em `auth.users`
3. Inserir/atualizar em `crm_profiles` com role `dono`

## 9.3 Erros comuns e causa raiz

- `relation "public.crm_profiles" does not exist`
  - schema nao foi executado no projeto certo
- `syntax error at or near "desc"`
  - `desc` e palavra reservada SQL; usar `descricao`
- `Could not find the 'ativo' column of 'crm_clientes'`
  - schema do banco nao bate com colunas esperadas pelo `index.html`
- `Could not find the 'nome' column of 'crm_projetos'`
  - tabela criada com `titulo` (schema oficial) e app espera `nome`
- `null value in column "titulo" of relation "crm_projetos"`
  - insercao via app com campo `nome` em tabela que exige `titulo`
- `foreign key ... user_id ... not present in table "users"`
  - UUID usado nao existe em `auth.users` desse mesmo projeto Supabase
- `No rows returned` em `auth.users`
  - ainda nao existe usuario cadastrado no Auth

## 10) RLS e permissoes

No `supabase/schema.sql`, o modelo de acesso e:

- `dono` e `operador`: acesso amplo aos dados
- `cliente`: acesso somente ao proprio `cliente_id`

Isso depende de:

- perfil corretamente cadastrado em `crm_profiles`
- uso consistente das colunas do schema

## 11) Itens de atencao tecnica (debt)

- Dupla arquitetura de frontend (monolitico e modular) convivendo em paralelo.
- Duplo modelo de dados Supabase sem padronizacao final.
- `js/cloud-auth.js` existe mas nao esta referenciado.
- Fluxo de IA inseguro no `index.html` (OpenAI key no browser) ainda existe como alternativa.

## 12) Proximo passo recomendado

## 12.1 Prioridade alta

1. Escolher schema canonico (index atual vs `supabase/schema.sql`)
2. Criar migracao unica
3. Atualizar frontend para 1 modelo de dados
4. Remover chamada direta ao OpenAI no navegador

## 12.2 Prioridade media

1. Consolidar login em 1 tela oficial (email/senha + cadastro)
2. Conectar todas as paginas ao Supabase (eliminar dependencia de `js/data.js` em producao)
3. Criar scripts de seed e migracao versionados por ambiente

## 13) Referencias internas

- Setup OpenAI/backend: `SETUP_BACKEND_OPENAI.md`
- Setup Supabase: `SUPABASE_SETUP.md`
- Schema SQL: `supabase/schema.sql`
- Seed SQL: `supabase/seed.sql`

