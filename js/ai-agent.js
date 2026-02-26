// ============================================================
//  NEXUS AI CRM — AI Agent Module (ai-agent.js)
//  Context-aware AI assistant for Owner, Operator, Client roles
// ============================================================

const AIAgent = (() => {
    // ── Response knowledge base by role ───────────────────────
    const KB = {
        dono: {
            greetings: [
                "Olá! Sou a NEXUS, sua assistente estratégica. Como posso ajudar você hoje?",
                "Bom dia! Pronto para analisar seu negócio. O que deseja saber?"
            ],
            intents: [
                {
                    keywords: ['padrao', 'padroes', 'insight', 'insights', 'sugestao', 'sugestoes', 'analise estrategica'],
                    response: (db) => {
                        if (typeof ExecutiveAI === 'undefined') {
                            return '💡 Posso gerar insights de risco, expansao e operacao. Abra a tela **IA Executiva** para ver a lista priorizada.';
                        }
                        const insights = ExecutiveAI.generateSuggestions(db).slice(0, 3);
                        const linhas = insights.map((i, idx) => `${idx + 1}. **${i.titulo}** (${i.severidade})`).join('\n');
                        return `🧠 **Top insights agora:**\n${linhas}\n\nAbra **IA Executiva** para plano completo e recomendacoes detalhadas.`;
                    }
                },
                {
                    keywords: ['relatorio executivo', 'relatorio gerencial', 'briefing', 'sumario executivo'],
                    response: (db) => {
                        if (typeof ExecutiveAI === 'undefined') {
                            return '📄 Para gerar o relatório executivo, acesse a tela **IA Executiva** e clique em "Gerar".';
                        }
                        const report = ExecutiveAI.generateExecutiveReport(db, { periodo: 'mensal' });
                        return `📄 Relatório gerado.\n**Resumo:** MRR ${report.resumo.crescimentoMRR > 0 ? '+' : ''}${report.resumo.crescimentoMRR}% | ${report.resumo.clientesAtivos} clientes ativos | ${report.resumo.ticketsAbertos} tickets abertos.\n\nPara texto completo, abra **IA Executiva**.`;
                    }
                },
                {
                    keywords: ['contrato', 'contratos', 'clausula', 'clausulas', 'juridico', 'analise contratual'],
                    response: () => {
                        return '📑 Posso ajudar com **geração de minuta** e **análise de risco contratual**. Acesse a seção **IA Executiva** para criar contratos, analisar cláusulas e salvar no CRM.';
                    }
                },
                {
                    keywords: ['mrr', 'receita', 'faturamento', 'revenue', 'dinheiro'],
                    response: (db) => {
                        const kpis = db.kpis;
                        const grow = (((kpis.mrr - kpis.mrrAnterior) / kpis.mrrAnterior) * 100).toFixed(1);
                        return `📊 **MRR atual:** R$ ${kpis.mrr.toLocaleString('pt-BR')}, crescimento de **+${grow}%** em relação ao mês anterior (R$ ${kpis.mrrAnterior.toLocaleString('pt-BR')}). Seus maiores contratos são FinEdge Capital (R$ 12.000/mês) e TechCorp Solutions (R$ 8.500/mês). Quer ver uma projeção para os próximos 3 meses?`;
                    }
                },
                {
                    keywords: ['churn', 'risco', 'perder', 'cancelamento', 'clientes em risco'],
                    response: (db) => {
                        const em_risco = db.clientes.filter(c => c.status === 'churn_risk');
                        if (em_risco.length === 0) return '✅ Nenhum cliente em risco de churn no momento. Ótimo trabalho!';
                        const nomes = em_risco.map(c => c.nome).join(', ');
                        return `⚠️ **${em_risco.length} cliente(s) em risco:** ${nomes}. Recomendo agendar uma reunião de alinhamento esta semana e revisar o SLA desses contratos. Deseja que eu prepare um roteiro de reunião de retenção?`;
                    }
                },
                {
                    keywords: ['clientes', 'quantos', 'base', 'carteira'],
                    response: (db) => {
                        const ativos = db.clientes.filter(c => c.status === 'ativo').length;
                        const leads = db.clientes.filter(c => c.status === 'lead').length;
                        const inativos = db.clientes.filter(c => c.status === 'inativo').length;
                        return `👥 **Base de clientes:** ${ativos} ativos, ${leads} lead(s) em pipeline, ${inativos} inativo(s). Taxa de retenção de ${db.kpis.taxaRetencao}%. Há ${leads} oportunidade(s) em negociação que podem converter nos próximos 30 dias.`;
                    }
                },
                {
                    keywords: ['projetos', 'andamento', 'status'],
                    response: (db) => {
                        const ativos = db.projetos.filter(p => p.status === 'em_progresso' || p.status === 'revisao').length;
                        const atrasados = db.projetos.filter(p => {
                            const prazo = new Date(p.prazo);
                            return prazo < new Date() && p.status !== 'concluido';
                        }).length;
                        return `📁 **${ativos} projetos em andamento.** ${atrasados > 0 ? `⚠️ ${atrasados} projeto(s) com prazo crítico.` : '✅ Todos dentro do prazo.'} Progresso médio: ${Math.round(db.projetos.reduce((a, p) => a + p.progresso, 0) / db.projetos.length)}%.`;
                    }
                },
                {
                    keywords: ['satisfacao', 'nps', 'feedback', 'nota', 'qualidade'],
                    response: (db) => {
                        const media = db.kpis.satisfacaoMedia;
                        const melhor = [...db.clientes].filter(c => c.satisfacao).sort((a, b) => b.satisfacao - a.satisfacao)[0];
                        return `⭐ **Satisfação média:** ${media}/5. Seu cliente mais satisfeito é **${melhor?.nome}** (${melhor?.satisfacao}/5). Clientes com nota acima de 4.5 têm 3x mais chances de renovar. Quer ver o breakdown completo?`;
                    }
                },
                {
                    keywords: ['melhor', 'serviço', 'produto', 'maior receita', 'mais lucrativo'],
                    response: (db) => {
                        const servicos = db.kpis.receitaPorServico;
                        const sorted = Object.entries(servicos).sort((a, b) => b[1] - a[1]);
                        return `💡 **Serviço mais rentável:** **${sorted[0][0]}** com R$ ${sorted[0][1].toLocaleString('pt-BR')}/mês. Seguido por ${sorted[1][0]} (R$ ${sorted[1][1].toLocaleString('pt-BR')}). Considere criar um pacote combo entre os dois mais populares.`;
                    }
                },
                {
                    keywords: ['time', 'equipe', 'operador', 'funcionário'],
                    response: (db) => {
                        return `👨‍💻 **Equipe atual:** Ana Silva (Sênior Analyst), Bruno Takeda (Data Engineer) e Carlos Jr. (BI Developer). Há ${db.tickets.filter(t => t.status === 'aberto').length} ticket(s) aberto(s) aguardando atribuição. Capacidade do time parece próxima do limite — deseja avaliar uma nova contratação?`;
                    }
                },
                {
                    keywords: ['meta', 'objetivo', 'goal', 'crescer', 'expandir'],
                    response: () => `🎯 Com base no crescimento de +11.7% no último mês, você está no caminho certo. Para atingir R$ 50k de MRR nos próximos 4 meses, seria necessário fechar 2 novos contratos de médio porte ou expandir escopo com FinEdge. Quer que eu simule cenários?`
                }
            ],
            fallback: () => `🤖 Posso te ajudar com análise de MRR, status de clientes, churn risk, pipeline, satisfação, projetos e performance do time. O que deseja explorar?`
        },

        operador: {
            greetings: [
                "Olá! Sou a NEXUS, sua assistente operacional. Pronto para ajudar!",
                "Oi! O que precisamos resolver hoje?"
            ],
            intents: [
                {
                    keywords: ['ticket', 'tickets', 'abertos', 'pendentes', 'demanda'],
                    response: (db) => {
                        const abertos = db.tickets.filter(t => t.status === 'aberto');
                        const criticos = abertos.filter(t => t.prioridade === 'critica' || t.prioridade === 'alta');
                        if (abertos.length === 0) return '✅ Nenhum ticket aberto no momento!';
                        return `🎫 **${abertos.length} ticket(s) aberto(s),** sendo ${criticos.length} de alta prioridade. Mais urgente: "${abertos[0]?.titulo}" (${abertos[0]?.clienteId}). Recomendo resolver este primeiro para não impactar o SLA.`;
                    }
                },
                {
                    keywords: ['resposta', 'responder', 'cliente', 'mensagem', 'email'],
                    response: () => `✉️ **Dica para resposta:** Seja objetivo, confirme o recebimento, informe o prazo de resolução e mantenha tom profissional e empático. Quer que eu gere um rascunho de e-mail para um ticket específico?`
                },
                {
                    keywords: ['prazo', 'atrasado', 'deadline', 'urgente'],
                    response: (db) => {
                        const atrasados = db.projetos.filter(p => new Date(p.prazo) < new Date() && p.status !== 'concluido');
                        if (atrasados.length === 0) return '✅ Nenhum projeto atrasado! Continue assim.';
                        const nomes = atrasados.map(p => p.titulo).join(', ');
                        return `⏰ **${atrasados.length} projeto(s) com prazo estourado:** ${nomes}. Acione o cliente imediatamente, documente o motivo do atraso e negocie nova data. Posso te ajudar a elaborar a comunicação?`;
                    }
                },
                {
                    keywords: ['prioridade', 'priorizar', 'o que fazer', 'começar'],
                    response: (db) => {
                        const criticos = db.tickets.filter(t => t.prioridade === 'critica' && t.status !== 'resolvido');
                        const em_risco = db.clientes.filter(c => c.status === 'churn_risk');
                        return `🎯 **Prioridades agora:**\n1. ${criticos.length > 0 ? `Resolver ticket crítico: "${criticos[0]?.titulo}"` : 'Nenhum ticket crítico — ótimo!'}\n2. ${em_risco.length > 0 ? `Contatar ${em_risco[0]?.nome} (risco de churn)` : 'Todos clientes estáveis'}\n3. Atualizar progresso dos projetos em andamento`;
                    }
                },
                {
                    keywords: ['relatorio', 'relatório', 'gerar', 'exportar'],
                    response: () => `📊 Para gerar um relatório: acesse a seção **Relatórios** no menu lateral. Lá você pode filtrar por período, cliente ou tipo de serviço. Precisa de um relatório específico para algum cliente?`
                },
                {
                    keywords: ['power bi', 'dashboard', 'erro', 'não carrega', 'bug'],
                    response: () => `🔧 **Checklist de debug para dashboards:**\n1. Verifique as credenciais da fonte de dados\n2. Confirme se o gateway está online\n3. Teste a query diretamente no banco\n4. Verifique se há timeout nas conexões\nSe o problema persistir, escale para o líder técnico e abra um ticket com capturas de tela.`
                }
            ],
            fallback: () => `🤖 Posso te ajudar com tickets, prazos, priorização, comunicação com clientes, relatórios e problemas técnicos. O que precisa?`
        },

        cliente: {
            greetings: [
                "Olá! Sou a NEXUS, assistente da sua consultoria. Como posso ajudar?",
                "Oi! Em que posso te auxiliar hoje?"
            ],
            intents: [
                {
                    keywords: ['status', 'andamento', 'projeto', 'como está'],
                    response: (db, ctx) => {
                        const proj = db.projetos.filter(p => p.clienteId === ctx?.clienteId);
                        if (proj.length === 0) return 'Não encontrei projetos ativos no momento. Fale com seu consultor.';
                        const p = proj[0];
                        return `📁 **${p.titulo}:** ${p.progresso}% concluído. Status: ${p.status === 'em_progresso' ? 'Em andamento' : p.status}. Prazo: ${new Date(p.prazo).toLocaleDateString('pt-BR')}. ${p.progresso >= 80 ? '🎉 Quase lá!' : '⚙️ Em pleno desenvolvimento.'}`;
                    }
                },
                {
                    keywords: ['prazo', 'quando', 'entrega', 'finalizar'],
                    response: (db, ctx) => {
                        const proj = db.projetos.filter(p => p.clienteId === ctx?.clienteId && p.status !== 'concluido');
                        if (proj.length === 0) return 'Todos os seus projetos estão concluídos! Parabéns.';
                        return `📅 Previsão de entrega de **${proj[0].titulo}:** ${new Date(proj[0].prazo).toLocaleDateString('pt-BR')}. Progresso atual: ${proj[0].progresso}%.`;
                    }
                },
                {
                    keywords: ['ticket', 'problema', 'suporte', 'erro', 'ajuda'],
                    response: () => `🎫 Para abrir um chamado de suporte, use o botão **"Novo Ticket"** ou descreva seu problema aqui que eu direcionarei para a equipe. Prazo de resposta: até 4h em dias úteis.`
                },
                {
                    keywords: ['relatorio', 'relatório', 'dados', 'resultado'],
                    response: () => `📊 Seus relatórios mensais são gerados até o 5º dia útil de cada mês e enviados por e-mail. Precisa de um relatório avulso? Solicite ao seu consultor.`
                }
            ],
            fallback: () => `🤖 Posso te informar sobre status de projetos, prazos, tickets de suporte e relatórios. Como posso ajudar?`
        }
    };

    // ── Intent matching ────────────────────────────────────────
    function matchIntent(message, role, db, ctx) {
        const msg = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const roleKB = KB[role] || KB['operador'];

        for (const intent of roleKB.intents) {
            if (intent.keywords.some(kw => msg.includes(kw))) {
                return intent.response(db, ctx);
            }
        }
        return roleKB.fallback(db, ctx);
    }

    // ── Typing simulation ─────────────────────────────────────
    function simulateTyping(ms = 1200) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ── Public API ─────────────────────────────────────────────
    return {
        greet(role) {
            const g = KB[role]?.greetings || KB.operador.greetings;
            return g[Math.floor(Math.random() * g.length)];
        },

        async ask(message, role, db, ctx = {}) {
            const thinkTime = 800 + Math.random() * 800;
            await simulateTyping(thinkTime);

            const lower = message.toLowerCase();
            if (lower.length < 3) return '❓ Pode elaborar mais? Não entendi bem a pergunta.';

            // Saudação
            if (/^(oi|olá|ola|hey|hello|bom dia|boa tarde|boa noite)/.test(lower)) {
                return KB[role]?.greetings[0] || 'Olá! Como posso ajudar?';
            }

            return matchIntent(message, role, db, ctx);
        },

        getRoleLabel(role) {
            const labels = { dono: 'Dono', operador: 'Operador', cliente: 'Cliente' };
            return labels[role] || role;
        }
    };
})();
