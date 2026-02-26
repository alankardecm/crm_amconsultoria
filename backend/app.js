import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';

function extractResponseText(resp) {
  if (resp?.output_text) return resp.output_text;
  const chunks = [];
  (resp?.output || []).forEach((entry) => {
    (entry?.content || []).forEach((part) => {
      if (part?.type === 'output_text' && part?.text) chunks.push(part.text);
    });
  });
  return chunks.join('\n').trim();
}

function normalizeParagraphs(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function exportPDF({ title, text }) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  const done = new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', resolve);
    doc.on('error', reject);
  });

  doc.fontSize(18).text(title || 'Documento', { align: 'left' });
  doc.moveDown(0.6);
  doc.fontSize(10).fillColor('#666666').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
  doc.moveDown();
  doc.fillColor('#111111');

  normalizeParagraphs(text).forEach((line) => {
    doc.fontSize(11).text(line, { lineGap: 2 });
    doc.moveDown(0.45);
  });

  doc.end();
  await done;
  return Buffer.concat(chunks);
}

async function exportDOCX({ title, text }) {
  const paragraphs = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: title || 'Documento', bold: true })]
    }),
    new Paragraph({
      children: [new TextRun({ text: `Gerado em: ${new Date().toLocaleString('pt-BR')}`, italics: true })]
    }),
    ...normalizeParagraphs(text).map((line) => new Paragraph({ text: line }))
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs
      }
    ]
  });

  return Packer.toBuffer(doc);
}

export function createApp(env = process.env) {
  const MODEL = env.OPENAI_MODEL || 'gpt-4.1-mini';
  const COMPANY_NAME = env.COMPANY_NAME || 'Nexus AI Consultoria';
  const COMPANY_POSITIONING = env.COMPANY_POSITIONING || 'Consultoria especializada em IA, BI e Dashboards Power BI';
  const COMPANY_BUSINESS_MODEL = env.COMPANY_BUSINESS_MODEL || 'Consultoria B2B de alto valor, contratos recorrentes e projetos de transformacao orientada a dados';
  const COMPANY_IDEAL_CLIENT = env.COMPANY_IDEAL_CLIENT || 'PMEs e empresas em crescimento que precisam escalar decisao com IA, BI e automacao';
  const COMPANY_STYLE = env.COMPANY_STYLE || 'Tom executivo, consultivo, orientado a ROI, com linguagem moderna e tech';
  const SUPABASE_URL = env.SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || '';
  const OPENAI_API_KEY = env.OPENAI_API_KEY;
  const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '4mb' }));

  function ensureAI(req, res) {
    if (!openai) {
      res.status(503).json({
        error: 'OpenAI API nao configurada no servidor.',
        hint: 'Crie o arquivo .env com OPENAI_API_KEY e reinicie o backend.'
      });
      return false;
    }
    return true;
  }

  async function askOpenAI({ system, prompt }) {
    const response = await openai.responses.create({
      model: MODEL,
      temperature: 0.2,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ]
    });
    const text = extractResponseText(response);
    if (!text) throw new Error('A resposta do modelo veio vazia.');
    return text;
  }

  function aiContextBlock() {
    return [
      `Empresa: ${COMPANY_NAME}.`,
      `Posicionamento: ${COMPANY_POSITIONING}.`,
      `Modelo de negocio: ${COMPANY_BUSINESS_MODEL}.`,
      `Cliente ideal: ${COMPANY_IDEAL_CLIENT}.`,
      `Estilo de resposta: ${COMPANY_STYLE}.`
    ].join(' ');
  }

  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      serverTime: new Date().toISOString(),
      aiConfigured: !!openai,
      model: MODEL
    });
  });

  app.get('/api/public-config', (req, res) => {
    res.json({
      aiConfigured: !!openai,
      model: MODEL,
      supabase: {
        enabled: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
        url: SUPABASE_URL || null,
        anonKey: SUPABASE_ANON_KEY || null
      }
    });
  });

  app.post('/api/ai/report', async (req, res) => {
    if (!ensureAI(req, res)) return;
    try {
      const snapshot = req.body?.snapshot || {};
      const periodo = req.body?.periodo || 'mensal';
      const system = [
        'Voce e uma estrategista executiva senior em consultoria de IA, BI e Power BI.',
        aiContextBlock(),
        'Priorize crescimento de receita, retencao, margem e posicionamento premium.',
        'Produza analise objetiva e acionavel, sem generalidades.'
      ].join(' ');
      const prompt = [
        `Gere um relatorio executivo em portugues (pt-BR) para periodo ${periodo}.`,
        'Formato obrigatorio:',
        '1) Resumo Executivo',
        '2) Padroes e Tendencias',
        '3) Riscos Prioritarios',
        '4) Oportunidades Comerciais',
        '5) Plano de Acao dos proximos 15 dias (com prioridades e donos sugeridos).',
        '6) Propostas comerciais de alto impacto (upsell, cross-sell, novos pacotes IA/BI/Power BI).',
        '7) Talking points para reuniao de diretoria e para reunioes com clientes.',
        'Regras: traga metas numericas, quick wins, riscos de execucao e impacto estimado.',
        'Use linguagem de diretoria, consultiva e tech.',
        'Dados:',
        JSON.stringify(snapshot)
      ].join('\n');

      const text = await askOpenAI({ system, prompt });
      res.json({ text, model: MODEL });
    } catch (err) {
      res.status(500).json({ error: 'Falha ao gerar relatorio com OpenAI.', detail: err.message });
    }
  });

  app.post('/api/ai/suggestions', async (req, res) => {
    if (!ensureAI(req, res)) return;
    try {
      const snapshot = req.body?.snapshot || {};
      const system = [
        'Voce e um copiloto executivo comercial e operacional para consultoria de IA/BI.',
        aiContextBlock(),
        'Entregue recomendacoes de alta qualidade para acelerar crescimento e previsibilidade.'
      ].join(' ');
      const prompt = [
        'Gere recomendacoes executivas priorizadas.',
        'Responda SOMENTE um JSON valido (sem markdown), no formato array com 6 objetos.',
        'Campos obrigatorios por objeto:',
        '- categoria',
        '- severidade (critica|alta|media|baixa)',
        '- titulo',
        '- descricao',
        '- recomendacao',
        '- impacto_estimado',
        '- prazo_sugerido',
        'Foque em expansao de receita, retencao, produtividade, previsibilidade de pipeline e automacao.',
        'Dados:',
        JSON.stringify(snapshot)
      ].join('\n');
      const text = await askOpenAI({ system, prompt });
      res.json({ text, model: MODEL });
    } catch (err) {
      res.status(500).json({ error: 'Falha ao gerar sugestoes com OpenAI.', detail: err.message });
    }
  });

  app.post('/api/ai/contract-analysis', async (req, res) => {
    if (!ensureAI(req, res)) return;
    try {
      const contractText = String(req.body?.text || '').trim();
      if (!contractText) {
        return res.status(400).json({ error: 'Texto do contrato vazio.' });
      }

      const system = [
        'Voce e especialista juridico-comercial para contratos de servicos de tecnologia e dados.',
        aiContextBlock(),
        'Seu foco e proteger margem, reduzir risco juridico e manter flexibilidade comercial.'
      ].join(' ');
      const prompt = [
        'Analise o contrato abaixo e responda em portugues com a estrutura:',
        '1) Score de risco (0-100, quanto maior mais seguro)',
        '2) Pontos criticos',
        '3) Clausulas faltantes',
        '4) Sugestoes de redacao',
        '5) Check de LGPD, SLA, multa, reajuste, vigencia e foro.',
        '6) Pontos de negociacao recomendados para defender valor e evitar escopo aberto.',
        'Contrato:',
        contractText
      ].join('\n');

      const text = await askOpenAI({ system, prompt });
      res.json({ text, model: MODEL });
    } catch (err) {
      res.status(500).json({ error: 'Falha ao analisar contrato com OpenAI.', detail: err.message });
    }
  });

  app.post('/api/ai/contract-draft', async (req, res) => {
    if (!ensureAI(req, res)) return;
    try {
      const payload = req.body?.payload || {};
      const system = [
        'Voce e um redator juridico-comercial para contratos B2B de consultoria em IA e BI.',
        aiContextBlock(),
        'Gere minuta objetiva, profissional, com linguagem clara para assinatura corporativa.'
      ].join(' ');
      const prompt = [
        'Gere uma minuta contratual completa em portugues (pt-BR), pronta para revisao juridica.',
        'Inclua secoes: Partes, Objeto, Escopo, Vigencia, Preco e faturamento, SLA, Governanca, LGPD, Propriedade intelectual, Confidencialidade, Rescisao, Multas, Reajuste, Foro.',
        'Use tom executivo e comercial, evitando ambiguidades.',
        'Dados de entrada para personalizar a minuta:',
        JSON.stringify(payload)
      ].join('\n');
      const text = await askOpenAI({ system, prompt });
      res.json({ text, model: MODEL });
    } catch (err) {
      res.status(500).json({ error: 'Falha ao gerar minuta com OpenAI.', detail: err.message });
    }
  });

  app.post('/api/export/pdf', async (req, res) => {
    try {
      const title = req.body?.title || 'Documento CRM';
      const text = req.body?.text || '';
      const filename = (req.body?.filename || 'documento').replace(/[^\w.-]/g, '_');
      const buffer = await exportPDF({ title, text });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ error: 'Falha na exportacao PDF.', detail: err.message });
    }
  });

  app.post('/api/export/docx', async (req, res) => {
    try {
      const title = req.body?.title || 'Documento CRM';
      const text = req.body?.text || '';
      const filename = (req.body?.filename || 'documento').replace(/[^\w.-]/g, '_');
      const buffer = await exportDOCX({ title, text });
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ error: 'Falha na exportacao DOCX.', detail: err.message });
    }
  });

  return app;
}
