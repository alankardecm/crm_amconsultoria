// ============================================================
//  NEXUS AI CRM — Data Layer (data.js)
//  Mock data + localStorage persistence
// ============================================================

const DB_KEY = 'nexus_crm_data';

// ── Seed Data ─────────────────────────────────────────────────
const SEED = {
  clientes: [
    {
      id: 'c1', nome: 'TechCorp Solutions', segmento: 'Tecnologia', contato: 'Rodrigo Lima',
      email: 'rodrigo@techcorp.com', telefone: '(11) 98745-3210', status: 'ativo',
      servicos: ['BI & Dashboards', 'Machine Learning'], mrr: 8500,
      desde: '2024-03-15', satisfacao: 4.8, cidade: 'São Paulo',
      historico: [
        { data: '2026-02-15', tipo: 'reuniao', desc: 'Revisão mensal de KPIs' },
        { data: '2026-01-28', tipo: 'email', desc: 'Proposta de expansão de escopo' }
      ]
    },
    {
      id: 'c2', nome: 'FinEdge Capital', segmento: 'Financeiro', contato: 'Beatriz Souza',
      email: 'beatriz@finedge.com', telefone: '(21) 97654-1234', status: 'ativo',
      servicos: ['Análise de Dados', 'Automação IA'], mrr: 12000,
      desde: '2023-11-01', satisfacao: 4.6, cidade: 'Rio de Janeiro',
      historico: [
        { data: '2026-02-10', tipo: 'call', desc: 'Alinhamento sobre relatório de risco' },
        { data: '2026-01-15', tipo: 'reuniao', desc: 'Kickoff novo módulo preditivo' }
      ]
    },
    {
      id: 'c3', nome: 'RetailPro Ltda', segmento: 'Varejo', contato: 'Carlos Mendes',
      email: 'carlos@retailpro.com', telefone: '(31) 96543-0987', status: 'churn_risk',
      servicos: ['Dashboards Power BI'], mrr: 4200,
      desde: '2024-07-20', satisfacao: 3.2, cidade: 'Belo Horizonte',
      historico: [
        { data: '2026-02-01', tipo: 'email', desc: 'Reclamação: lentidão no dashboard' },
        { data: '2026-01-20', tipo: 'email', desc: 'SLA atrasado — pendente' }
      ]
    },
    {
      id: 'c4', nome: 'MedTech Analytics', segmento: 'Saúde', contato: 'Ana Ferreira',
      email: 'ana@medtech.com', telefone: '(48) 95432-7896', status: 'lead',
      servicos: [], mrr: 0,
      desde: '2026-01-30', satisfacao: null, cidade: 'Florianópolis',
      historico: [
        { data: '2026-02-05', tipo: 'reuniao', desc: 'Reunião de descoberta — apresentação da Nexus AI' }
      ]
    },
    {
      id: 'c5', nome: 'Logística Express', segmento: 'Logística', contato: 'Pedro Alves',
      email: 'pedro@logex.com', telefone: '(41) 94321-6543', status: 'ativo',
      servicos: ['ETL & Engenharia de Dados', 'Análise de Dados'], mrr: 6800,
      desde: '2024-01-10', satisfacao: 4.9, cidade: 'Curitiba',
      historico: [
        { data: '2026-02-18', tipo: 'call', desc: 'Atualização pipeline de dados' }
      ]
    },
    {
      id: 'c6', nome: 'EduSmart Plataforma', segmento: 'Educação', contato: 'Juliana Costa',
      email: 'juliana@edusmart.com', telefone: '(85) 93210-5432', status: 'inativo',
      servicos: ['BI & Dashboards'], mrr: 0,
      desde: '2023-06-01', satisfacao: 3.9, cidade: 'Fortaleza',
      historico: [
        { data: '2025-12-01', tipo: 'email', desc: 'Cancelamento por corte de orçamento' }
      ]
    }
  ],

  projetos: [
    {
      id: 'p1', titulo: 'Dashboard Executivo — FinEdge', clienteId: 'c2',
      status: 'em_progresso', prioridade: 'alta', tipo: 'BI & Dashboards',
      responsavel: 'Ana Silva', prazo: '2026-03-10', progresso: 65,
      descricao: 'Dashboard executivo com KPIs de risco, carteira e P&L em tempo real.',
      tarefas: [
        { id: 't1', titulo: 'Modelagem dimensional', done: true },
        { id: 't2', titulo: 'Criação das medidas DAX', done: true },
        { id: 't3', titulo: 'Design das páginas', done: false },
        { id: 't4', titulo: 'Validação com stakeholders', done: false }
      ]
    },
    {
      id: 'p2', titulo: 'Pipeline ETL — Logística Express', clienteId: 'c5',
      status: 'revisao', prioridade: 'media', tipo: 'ETL & Engenharia de Dados',
      responsavel: 'Bruno Takeda', prazo: '2026-02-28', progresso: 90,
      descricao: 'Pipeline de ingestão e transformação de dados de rastreamento de frotas.',
      tarefas: [
        { id: 't5', titulo: 'Conector API transportadora', done: true },
        { id: 't6', titulo: 'Transformações dbt', done: true },
        { id: 't7', titulo: 'Testes de qualidade de dados', done: false }
      ]
    },
    {
      id: 'p3', titulo: 'Modelo Preditivo de Churn — TechCorp', clienteId: 'c1',
      status: 'backlog', prioridade: 'alta', tipo: 'Machine Learning',
      responsavel: 'Ana Silva', prazo: '2026-04-15', progresso: 5,
      descricao: 'Modelo de ML para predição de churn com 90 dias de antecedência.',
      tarefas: [
        { id: 't8', titulo: 'Levantamento de features', done: false },
        { id: 't9', titulo: 'EDA exploratório', done: false },
        { id: 't10', titulo: 'Treinamento do modelo', done: false },
        { id: 't11', titulo: 'Deploy na API', done: false }
      ]
    },
    {
      id: 'p4', titulo: 'Relatório de Performance — RetailPro', clienteId: 'c3',
      status: 'em_progresso', prioridade: 'critica', tipo: 'Análise de Dados',
      responsavel: 'Carlos Jr.', prazo: '2026-02-25', progresso: 40,
      descricao: 'Análise de performance de produtos e sazonalidade 2025.',
      tarefas: [
        { id: 't12', titulo: 'Coleta e limpeza dos dados', done: true },
        { id: 't13', titulo: 'Análise estatística', done: false },
        { id: 't14', titulo: 'Apresentação executiva', done: false }
      ]
    },
    {
      id: 'p5', titulo: 'Proposta MedTech — Scoping', clienteId: 'c4',
      status: 'backlog', prioridade: 'media', tipo: 'Análise de Dados',
      responsavel: 'Bruno Takeda', prazo: '2026-03-01', progresso: 10,
      descricao: 'Definição de escopo e proposta comercial para MedTech Analytics.',
      tarefas: [
        { id: 't15', titulo: 'Discovery workshop', done: false },
        { id: 't16', titulo: 'Elaboração da proposta', done: false }
      ]
    },
    {
      id: 'p6', titulo: 'Automação IA Atendimento — FinEdge', clienteId: 'c2',
      status: 'concluido', prioridade: 'alta', tipo: 'Automação IA',
      responsavel: 'Ana Silva', prazo: '2026-01-31', progresso: 100,
      descricao: 'Bot de IA para triagem e roteamento de demandas internas.',
      tarefas: [
        { id: 't17', titulo: 'Fluxo conversacional', done: true },
        { id: 't18', titulo: 'Integração CRM', done: true },
        { id: 't19', titulo: 'Deploy produção', done: true }
      ]
    }
  ],

  tickets: [
    {
      id: 'tk1', titulo: 'Dashboard lento ao filtrar por data', clienteId: 'c3',
      status: 'aberto', prioridade: 'alta', tipo: 'bug',
      responsavel: 'Carlos Jr.', criado: '2026-02-18', descricao: 'Usuário reporta que filtros de data travam por >10s.'
    },
    {
      id: 'tk2', titulo: 'Adicionar gráfico de projeção ao Executive Board', clienteId: 'c2',
      status: 'em_andamento', prioridade: 'media', tipo: 'feature',
      responsavel: 'Ana Silva', criado: '2026-02-15', descricao: 'Solicita gráfico de projeção de receita para os próximos 6 meses.'
    },
    {
      id: 'tk3', titulo: 'Erro na conexão com banco de dados staging', clienteId: 'c5',
      status: 'resolvido', prioridade: 'critica', tipo: 'bug',
      responsavel: 'Bruno Takeda', criado: '2026-02-10', descricao: 'Conexão ODBC falhando no ambiente de homologação.'
    },
    {
      id: 'tk4', titulo: 'Exportar relatório em PDF', clienteId: 'c1',
      status: 'aberto', prioridade: 'baixa', tipo: 'feature',
      responsavel: '', criado: '2026-02-19', descricao: 'Funcionalidade de export PDF do relatório mensal.'
    }
  ],

  contratos: [
    {
      id: 'ct1',
      titulo: 'Contrato de Analytics - FinEdge',
      clienteId: 'c2',
      tipo: 'Retainer Mensal',
      inicio: '2025-11-01',
      fim: '2026-10-31',
      valorMensal: 12000,
      slaHoras: 6,
      multaRescisaoPct: 20,
      reajuste: 'IPCA anual',
      clausulaLGPD: true,
      renovacaoAutomatica: true,
      escopo: 'Dashboards executivos, monitoramento de risco e automacoes de dados.'
    },
    {
      id: 'ct2',
      titulo: 'Contrato de BI - RetailPro',
      clienteId: 'c3',
      tipo: 'Projeto Fechado',
      inicio: '2025-08-15',
      fim: '2026-03-15',
      valorMensal: 4200,
      slaHoras: 24,
      multaRescisaoPct: 10,
      reajuste: 'Sem reajuste',
      clausulaLGPD: false,
      renovacaoAutomatica: false,
      escopo: 'Relatorios de performance e analise de sazonalidade.'
    }
  ],

  kpis: {
    mrr: 31500,
    mrrAnterior: 28200,
    clientesAtivos: 4,
    totalClientes: 6,
    projetosAtivos: 3,
    taxaRetencao: 87.5,
    satisfacaoMedia: 4.48,
    receitaPorServico: {
      'BI & Dashboards': 12700,
      'Machine Learning': 8500,
      'Análise de Dados': 6800,
      'ETL & Engenharia de Dados': 6800,
      'Automação IA': 12000
    },
    receitaMensal: [22100, 24500, 23800, 26200, 25900, 28200, 31500],
    meses: ['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev'],
    pipeline: [
      { stage: 'Lead', count: 1, valor: 0 },
      { stage: 'Proposta', count: 1, valor: 18000 },
      { stage: 'Negociação', count: 0, valor: 0 },
      { stage: 'Fechado', count: 4, valor: 31500 }
    ]
  },

  operadores: [
    { id: 'op1', nome: 'Ana Silva', avatar: 'AS', role: 'Sênior Analyst' },
    { id: 'op2', nome: 'Bruno Takeda', avatar: 'BT', role: 'Data Engineer' },
    { id: 'op3', nome: 'Carlos Jr.', avatar: 'CJ', role: 'BI Developer' }
  ],

  interacoes: []
};

// ── Storage Helpers ────────────────────────────────────────────
function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return JSON.parse(JSON.stringify(SEED)); // deep clone
}

function saveDB(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('Storage error:', e);
  }
}

function resetDB() {
  localStorage.removeItem(DB_KEY);
  return JSON.parse(JSON.stringify(SEED));
}

// ── Exported DB instance ───────────────────────────────────────
let DB = loadDB();

// ── CRUD Helpers ───────────────────────────────────────────────
const Data = {
  // Clientes
  getClientes: () => DB.clientes,
  getCliente: (id) => DB.clientes.find(c => c.id === id),
  addCliente: (cliente) => {
    cliente.id = 'c' + Date.now();
    cliente.historico = [];
    DB.clientes.push(cliente);
    saveDB(DB);
    return cliente;
  },
  updateCliente: (id, patch) => {
    const idx = DB.clientes.findIndex(c => c.id === id);
    if (idx >= 0) { DB.clientes[idx] = { ...DB.clientes[idx], ...patch }; saveDB(DB); }
  },

  // Projetos
  getProjetos: () => DB.projetos,
  getProjeto: (id) => DB.projetos.find(p => p.id === id),
  addProjeto: (projeto) => {
    projeto.id = 'p' + Date.now();
    projeto.tarefas = [];
    projeto.progresso = 0;
    DB.projetos.push(projeto);
    saveDB(DB);
    return projeto;
  },
  updateProjeto: (id, patch) => {
    const idx = DB.projetos.findIndex(p => p.id === id);
    if (idx >= 0) { DB.projetos[idx] = { ...DB.projetos[idx], ...patch }; saveDB(DB); }
  },

  // Tickets
  getTickets: () => DB.tickets,
  addTicket: (ticket) => {
    ticket.id = 'tk' + Date.now();
    ticket.criado = new Date().toISOString().split('T')[0];
    DB.tickets.push(ticket);
    saveDB(DB);
    return ticket;
  },
  updateTicket: (id, patch) => {
    const idx = DB.tickets.findIndex(t => t.id === id);
    if (idx >= 0) { DB.tickets[idx] = { ...DB.tickets[idx], ...patch }; saveDB(DB); }
  },

  // Contratos
  getContratos: () => DB.contratos || [],
  getContrato: (id) => (DB.contratos || []).find(c => c.id === id),
  addContrato: (contrato) => {
    if (!DB.contratos) DB.contratos = [];
    contrato.id = 'ct' + Date.now();
    DB.contratos.push(contrato);
    saveDB(DB);
    return contrato;
  },
  updateContrato: (id, patch) => {
    if (!DB.contratos) DB.contratos = [];
    const idx = DB.contratos.findIndex(c => c.id === id);
    if (idx >= 0) { DB.contratos[idx] = { ...DB.contratos[idx], ...patch }; saveDB(DB); }
  },

  // KPIs
  getKPIs: () => DB.kpis,
  getOperadores: () => DB.operadores,

  // Interações
  addInteracao: (interacao) => {
    interacao.id = 'i' + Date.now();
    interacao.data = new Date().toISOString().split('T')[0];
    DB.interacoes.push(interacao);
    // Also add to client history
    const cliente = DB.clientes.find(c => c.id === interacao.clienteId);
    if (cliente) {
      cliente.historico.unshift({ data: interacao.data, tipo: interacao.tipo, desc: interacao.desc });
      saveDB(DB);
    }
    return interacao;
  },

  reset: () => { DB = resetDB(); }
};
