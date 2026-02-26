// ============================================================
//  NEXUS AI CRM - Executive AI Module (executive-ai.js)
//  Strategic suggestions, executive reports and contract analysis
// ============================================================

const ExecutiveAI = (() => {
  const severityRank = { critica: 4, alta: 3, media: 2, baixa: 1 };

  function getDBSnapshot() {
    return {
      kpis: Data.getKPIs(),
      clientes: Data.getClientes(),
      projetos: Data.getProjetos(),
      tickets: Data.getTickets(),
      contratos: Data.getContratos ? Data.getContratos() : []
    };
  }

  function toCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function avg(arr) {
    if (!arr.length) return 0;
    return arr.reduce((acc, n) => acc + n, 0) / arr.length;
  }

  function diffDays(dateStr) {
    const now = new Date();
    const end = new Date(dateStr + 'T00:00:00');
    return Math.ceil((end - now) / 86400000);
  }

  function generateSuggestions(snapshot = getDBSnapshot()) {
    const { kpis, clientes, projetos, tickets, contratos = [] } = snapshot;
    const suggestions = [];

    const riscoChurn = clientes.filter(c => c.status === 'churn_risk' || (c.satisfacao && c.satisfacao <= 3.5));
    if (riscoChurn.length > 0) {
      suggestions.push({
        categoria: 'Retencao',
        severidade: 'critica',
        titulo: `${riscoChurn.length} cliente(s) em risco de churn`,
        descricao: `Clientes: ${riscoChurn.map(c => c.nome).join(', ')}.`,
        recomendacao: 'Agendar reuniao de retencao em ate 48h e revisar SLA/expectativas com plano de acao formal.'
      });
    }

    const ativos = clientes.filter(c => c.status === 'ativo' && c.mrr > 0);
    if (ativos.length) {
      const top = [...ativos].sort((a, b) => b.mrr - a.mrr)[0];
      const concentracao = top.mrr / Math.max(kpis.mrr, 1);
      if (concentracao >= 0.35) {
        suggestions.push({
          categoria: 'Risco Financeiro',
          severidade: 'alta',
          titulo: `Receita concentrada em ${top.nome}`,
          descricao: `${Math.round(concentracao * 100)}% do MRR depende de um unico cliente.`,
          recomendacao: 'Diversificar carteira com 1-2 novos contratos mid-market e criar plano de expansao para contas secundarias.'
        });
      }
    }

    const atrasados = projetos.filter(p => p.status !== 'concluido' && diffDays(p.prazo) < 0);
    if (atrasados.length > 0) {
      suggestions.push({
        categoria: 'Entrega',
        severidade: 'alta',
        titulo: `${atrasados.length} projeto(s) atrasado(s)`,
        descricao: atrasados.map(p => p.titulo).join(', '),
        recomendacao: 'Executar war room operacional: repriorizar tarefas, definir dono por bloqueio e renegociar prazo com cliente.'
      });
    }

    const ticketsAbertos = tickets.filter(t => t.status === 'aberto');
    const ticketsCriticos = ticketsAbertos.filter(t => t.prioridade === 'critica' || t.prioridade === 'alta');
    if (ticketsCriticos.length >= 2) {
      suggestions.push({
        categoria: 'Operacao',
        severidade: 'alta',
        titulo: 'Backlog critico de suporte',
        descricao: `${ticketsCriticos.length} ticket(s) de alta criticidade aguardando resolucao.`,
        recomendacao: 'Criar fila expressa para demandas criticas e designar owner com checkpoint de 4h.'
      });
    }

    const satisfeitos = ativos.filter(c => c.satisfacao && c.satisfacao >= 4.6);
    if (satisfeitos.length > 0) {
      const alvo = satisfeitos.sort((a, b) => a.mrr - b.mrr)[0];
      suggestions.push({
        categoria: 'Expansao',
        severidade: 'media',
        titulo: `Oportunidade de upsell em ${alvo.nome}`,
        descricao: `Cliente com alta satisfacao (${alvo.satisfacao}/5) e espaco para expandir ticket medio.`,
        recomendacao: 'Ofertar pacote adicional de automacao ou analytics com proposta em 7 dias.'
      });
    }

    const contratosSemLGPD = contratos.filter(c => !c.clausulaLGPD);
    if (contratosSemLGPD.length > 0) {
      suggestions.push({
        categoria: 'Compliance',
        severidade: 'alta',
        titulo: 'Contratos sem clausula LGPD',
        descricao: `${contratosSemLGPD.length} contrato(s) exigem ajuste juridico para protecao de dados.`,
        recomendacao: 'Adicionar aditivo padrao LGPD e atualizar matriz de responsabilidade de dados.'
      });
    }

    if (!suggestions.length) {
      suggestions.push({
        categoria: 'Performance',
        severidade: 'baixa',
        titulo: 'Operacao estavel',
        descricao: 'Nenhum risco relevante detectado no momento.',
        recomendacao: 'Focar em expansao comercial e automacoes para ganho de margem.'
      });
    }

    return suggestions.sort((a, b) => severityRank[b.severidade] - severityRank[a.severidade]);
  }

  function generateExecutiveReport(snapshot = getDBSnapshot(), options = {}) {
    const periodo = options.periodo || 'mensal';
    const { kpis, clientes, projetos, tickets } = snapshot;
    const suggestions = generateSuggestions(snapshot);
    const ativos = clientes.filter(c => c.status === 'ativo');
    const mrrGrow = (((kpis.mrr - kpis.mrrAnterior) / Math.max(kpis.mrrAnterior, 1)) * 100).toFixed(1);
    const ticketsAbertos = tickets.filter(t => t.status === 'aberto').length;
    const progressoMedio = Math.round(avg(projetos.map(p => p.progresso)));
    const riscos = suggestions.filter(s => s.severidade === 'critica' || s.severidade === 'alta');
    const oportunidades = suggestions.filter(s => s.severidade === 'media' || s.severidade === 'baixa');

    const linhas = [];
    linhas.push(`RELATORIO EXECUTIVO IA - ${periodo.toUpperCase()}`);
    linhas.push(`Data de geracao: ${new Date().toLocaleDateString('pt-BR')}`);
    linhas.push('');
    linhas.push('1. Resumo Executivo');
    linhas.push(`- MRR atual: ${toCurrency(kpis.mrr)} (${mrrGrow > 0 ? '+' : ''}${mrrGrow}% vs periodo anterior)`);
    linhas.push(`- Clientes ativos: ${ativos.length}/${clientes.length}`);
    linhas.push(`- Projetos em andamento: ${projetos.filter(p => p.status === 'em_progresso' || p.status === 'revisao').length}`);
    linhas.push(`- Progresso medio dos projetos: ${progressoMedio}%`);
    linhas.push(`- Tickets abertos: ${ticketsAbertos}`);
    linhas.push('');
    linhas.push('2. Principais Riscos');
    if (riscos.length) {
      riscos.forEach((r, i) => linhas.push(`${i + 1}. ${r.titulo} - ${r.recomendacao}`));
    } else {
      linhas.push('1. Sem riscos criticos identificados.');
    }
    linhas.push('');
    linhas.push('3. Oportunidades');
    if (oportunidades.length) {
      oportunidades.forEach((o, i) => linhas.push(`${i + 1}. ${o.titulo} - ${o.recomendacao}`));
    } else {
      linhas.push('1. Sem oportunidades relevantes identificadas.');
    }
    linhas.push('');
    linhas.push('4. Plano de Acao (Proximos 15 dias)');
    linhas.push('1. Rodada executiva de retencao com clientes em alerta.');
    linhas.push('2. Replanejar projetos atrasados com novo cronograma e dono claro.');
    linhas.push('3. Executar proposta comercial de upsell para clientes com alta satisfacao.');
    linhas.push('4. Atualizar clausulas contratuais sensiveis (SLA, multa, LGPD, reajuste).');

    return {
      periodo,
      texto: linhas.join('\n'),
      resumo: {
        mrr: kpis.mrr,
        crescimentoMRR: Number(mrrGrow),
        clientesAtivos: ativos.length,
        ticketsAbertos,
        progressoMedio
      }
    };
  }

  function generateContractDraft(input) {
    const nomeCliente = input.nomeCliente || 'CLIENTE';
    const tipo = input.tipo || 'Prestacao de Servicos';
    const valorMensal = Number(input.valorMensal || 0);
    const inicio = input.inicio || new Date().toISOString().split('T')[0];
    const meses = Number(input.duracaoMeses || 12);
    const fimDate = new Date(inicio + 'T00:00:00');
    fimDate.setMonth(fimDate.getMonth() + meses);
    const fim = fimDate.toISOString().split('T')[0];
    const slaHoras = Number(input.slaHoras || 8);
    const multa = Number(input.multaPct || 20);
    const reajuste = input.reajuste || 'IPCA anual';
    const escopo = input.escopo || 'Servicos de consultoria em dados, BI, analytics e automacao.';

    return [
      `MINUTA CONTRATUAL - ${tipo.toUpperCase()}`,
      '',
      '1. PARTES',
      `Contratada: NEXUS AI CONSULTORIA.`,
      `Contratante: ${nomeCliente}.`,
      '',
      '2. OBJETO',
      `A contratada prestara os seguintes servicos: ${escopo}`,
      '',
      '3. VIGENCIA',
      `Inicio em ${inicio} com termino previsto em ${fim} (${meses} meses).`,
      '',
      '4. REMUNERACAO',
      `Valor mensal de ${toCurrency(valorMensal)}, com reajuste ${reajuste}.`,
      '',
      '5. NIVEIS DE SERVICO (SLA)',
      `Tempo de primeira resposta: ate ${slaHoras} horas uteis.`,
      '',
      '6. RESCISAO E MULTA',
      `Em caso de rescisao antecipada sem justa causa: multa de ${multa}% sobre o saldo contratual.`,
      '',
      '7. PROTECAO DE DADOS',
      'As partes comprometem-se com a conformidade da LGPD e com o tratamento seguro dos dados.',
      '',
      '8. DISPOSICOES FINAIS',
      'Foro eleito: comarca da sede da contratada, salvo disposicao especifica acordada entre as partes.',
      '',
      'Documento gerado por IA para apoio operacional. Revisao juridica obrigatoria antes da assinatura.'
    ].join('\n');
  }

  function analyzeContractText(text) {
    const original = String(text || '').trim();
    if (!original) {
      return {
        score: 0,
        nivel: 'critico',
        resumo: 'Texto vazio.',
        riscos: ['Nenhum conteudo informado para analise.'],
        recomendacoes: ['Inserir o texto completo do contrato para avaliacao.']
      };
    }

    const lower = original.toLowerCase();
    const risks = [];
    const recs = [];
    let score = 100;

    const checks = [
      {
        ok: /lgpd|lei geral de protecao de dados|protecao de dados/.test(lower),
        risk: 'Ausencia de clausula explicita de protecao de dados (LGPD).',
        rec: 'Adicionar clausula LGPD com papeis de controlador/operador e medidas de seguranca.',
        weight: 22
      },
      {
        ok: /multa|penalidade/.test(lower),
        risk: 'Contrato sem regra clara de multa/penalidade por rescisao ou inadimplemento.',
        rec: 'Definir multa proporcional, gatilhos de aplicacao e forma de cobranca.',
        weight: 16
      },
      {
        ok: /sla|nivel de servico|tempo de resposta/.test(lower),
        risk: 'SLA ausente ou pouco objetivo.',
        rec: 'Definir tempo de resposta, janelas de atendimento e meta de resolucao.',
        weight: 14
      },
      {
        ok: /reajuste|ipca|igp-m|indice/.test(lower),
        risk: 'Nao ha criterio de reajuste financeiro.',
        rec: 'Incluir indice e periodicidade de reajuste para previsibilidade economica.',
        weight: 12
      },
      {
        ok: /vigencia|prazo|inicio|termino/.test(lower),
        risk: 'Vigencia/prazo contratual pouco claro.',
        rec: 'Estabelecer data de inicio, data final e regras de renovacao.',
        weight: 14
      },
      {
        ok: /foro|jurisdicao/.test(lower),
        risk: 'Foro juridico nao definido.',
        rec: 'Incluir clausula de foro para resolucao de conflitos.',
        weight: 8
      },
      {
        ok: /exclusividade/.test(lower),
        risk: 'Clausula de exclusividade detectada; pode limitar expansao comercial.',
        rec: 'Revisar escopo da exclusividade e inserir excecoes objetivas.',
        weight: 8,
        invert: true
      }
    ];

    checks.forEach(check => {
      const failed = check.invert ? check.ok : !check.ok;
      if (failed) {
        score -= check.weight;
        risks.push(check.risk);
        recs.push(check.rec);
      }
    });

    score = Math.max(5, score);

    let nivel = 'baixo';
    if (score < 55) nivel = 'critico';
    else if (score < 75) nivel = 'alto';
    else if (score < 90) nivel = 'medio';

    const resumo = `Score de risco: ${score}/100 (${nivel}).`;
    return {
      score,
      nivel,
      resumo,
      riscos: risks.length ? risks : ['Nenhum risco relevante detectado na leitura automatica.'],
      recomendacoes: recs.length ? recs : ['Manter revisao juridica final antes da assinatura.']
    };
  }

  function analyzeContractRecord(contract) {
    const texto = [
      contract.titulo,
      contract.tipo,
      contract.escopo,
      contract.reajuste,
      contract.clausulaLGPD ? 'LGPD presente' : '',
      contract.slaHoras ? `SLA ${contract.slaHoras} horas` : '',
      contract.multaRescisaoPct ? `multa ${contract.multaRescisaoPct}%` : '',
      contract.inicio ? `inicio ${contract.inicio}` : '',
      contract.fim ? `fim ${contract.fim}` : ''
    ].join(' ');
    return analyzeContractText(texto);
  }

  return {
    getDBSnapshot,
    generateSuggestions,
    generateExecutiveReport,
    generateContractDraft,
    analyzeContractText,
    analyzeContractRecord
  };
})();
