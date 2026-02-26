# Setup Backend OpenAI e Exportacao

## 1) Instalar dependencias
```powershell
npm install
```

## 2) Configurar chave OpenAI com seguranca
1. Copie `.env.example` para `.env`
2. Preencha `OPENAI_API_KEY` no `.env`

Exemplo:
```env
PORT=3000
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
COMPANY_NAME=Nexus AI Consultoria
COMPANY_POSITIONING=Consultoria especializada em IA, BI e Dashboards Power BI
COMPANY_BUSINESS_MODEL=Consultoria B2B de alto valor, contratos recorrentes e projetos de transformacao orientada a dados
COMPANY_IDEAL_CLIENT=PMEs e empresas em crescimento que precisam escalar decisao com IA, BI e automacao
COMPANY_STYLE=Tom executivo, consultivo, orientado a ROI, com linguagem moderna e tech
```

## 3) Rodar servidor
```powershell
npm start
```

Abra no navegador:
`http://localhost:3000`

## 4) Recursos ativos
- IA real (OpenAI) em `IA Executiva`:
  - Atualizacao de insights com OpenAI (priorizados)
  - Gerar relatorio com OpenAI
  - Gerar minuta contratual com OpenAI
  - Analisar contrato com OpenAI
- Exportacao real:
  - Relatorio em PDF/DOCX
  - Contrato em PDF/DOCX

## Observacao de seguranca
- Nunca coloque chave OpenAI no frontend (HTML/JS do navegador).
- A chave fica somente no backend, no arquivo `.env`.
