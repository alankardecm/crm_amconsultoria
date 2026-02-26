# CRM AM Consultoria IA

Documentacao principal do projeto CRM da AM Consultoria (IA, BI e Power BI).

## Status atual (2026-02-26)

- Repositorio: `https://github.com/alankardecm/crm_amconsultoria`
- Producao (Vercel): `https://crm-amconsultoria.vercel.app`
- Vercel team: `alan-moreiras-projects`
- Banco de dados: Supabase (`https://maghmcmvdznjtkbmrjei.supabase.co`)
- Backend IA/Exportacao: Node.js + Express + OpenAI + PDFKit + docx

## O que esta implementado

- Frontend CRM com layout tech e modulos de negocio.
- Autenticacao com Supabase (email/senha no app principal).
- Backend com OpenAI via API segura no servidor:
  - sugestoes executivas
  - relatorios
  - analise de contratos
  - geracao de minuta
- Exportacao real:
  - PDF
  - DOCX

## Stack tecnica

- Frontend: HTML/CSS/JS (sem framework)
- Backend: Node.js + Express
- IA: OpenAI API
- Banco/Auth: Supabase
- Deploy: Vercel

## Estrutura rapida

```txt
api/              entrypoint serverless Vercel
backend/          app express (rotas /api)
css/              estilos
js/               scripts do frontend modular
supabase/         schema e seed SQL
index.html        app principal (monolitico + Supabase)
server.js         servidor local
vercel.json       build/routes de deploy
```

## Setup local rapido

1. Instalar dependencias:

```powershell
npm install
```

2. Criar `.env` a partir de `.env.example`.
3. Preencher variaveis (OpenAI e Supabase).
4. Subir local:

```powershell
npm start
```

5. Abrir `http://localhost:3000`.

## Documentacao completa

Leia: [docs/DOCUMENTACAO_COMPLETA.md](docs/DOCUMENTACAO_COMPLETA.md)

