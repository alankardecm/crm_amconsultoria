// ============================================================
//  NEXUS AI CRM — App Core (app.js)
//  Navigation, auth, sidebar, notifications, shared UI
// ============================================================

// ── Current session ─────────────────────────────────────────
const Session = {
    role: null,  // 'dono' | 'operador' | 'cliente'
    user: null,

    set(role, user) {
        this.role = role;
        this.user = user;
        sessionStorage.setItem('nexus_role', role);
        sessionStorage.setItem('nexus_user', JSON.stringify(user));
    },

    load() {
        this.role = sessionStorage.getItem('nexus_role');
        const u = sessionStorage.getItem('nexus_user');
        this.user = u ? JSON.parse(u) : null;
        return !!this.role;
    },

    clear() {
        sessionStorage.removeItem('nexus_role');
        sessionStorage.removeItem('nexus_user');
        this.role = null;
        this.user = null;
    }
};

// ── Navigation guard ─────────────────────────────────────────
function requireAuth() {
    if (!Session.load()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// ── Sidebar setup ────────────────────────────────────────────
function initSidebar() {
    const role = Session.role;
    const user = Session.user;

    // Populate user info
    const uNameEl = document.getElementById('sidebar-username');
    const uRoleEl = document.getElementById('sidebar-role');
    const uAvatarEl = document.getElementById('sidebar-avatar');
    if (uNameEl) uNameEl.textContent = user?.nome || 'Usuário';
    if (uRoleEl) uRoleEl.textContent = roleLabel(role);
    if (uAvatarEl) uAvatarEl.textContent = initials(user?.nome || 'U');

    // Active link
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) link.classList.add('active');
    });

    // Role-based visibility
    if (role === 'cliente') {
        document.querySelectorAll('[data-role-hide="cliente"]').forEach(el => el.style.display = 'none');
    }
    if (role === 'operador') {
        document.querySelectorAll('[data-role-hide="operador"]').forEach(el => el.style.display = 'none');
    }

    // Logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Session.clear();
            window.location.href = 'index.html';
        });
    }

    // Sidebar toggle (mobile)
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
}

// ── Toast notifications ──────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { info: '💬', success: '✅', warning: '⚠️', error: '❌' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '💬'}</span><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

function createToastContainer() {
    const el = document.createElement('div');
    el.id = 'toast-container';
    document.body.appendChild(el);
    return el;
}

// ── Modal helpers ────────────────────────────────────────────
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modalId);
        }, { once: true });
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
}

// ── AI Chat Widget ────────────────────────────────────────────
function initAIChat(role, contextData = {}) {
    const widget = document.getElementById('ai-chat-widget');
    const toggle = document.getElementById('ai-chat-toggle');
    const closeBtn = document.getElementById('ai-chat-close');
    const input = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-chat-send');
    const messages = document.getElementById('ai-chat-messages');

    if (!widget || !toggle) return;

    // Greeting
    appendAIMessage(messages, AIAgent.greet(role));

    toggle.addEventListener('click', () => {
        widget.classList.toggle('open');
        if (widget.classList.contains('open')) input?.focus();
    });

    closeBtn?.addEventListener('click', () => widget.classList.remove('open'));

    async function send() {
        const text = input?.value.trim();
        if (!text) return;

        appendUserMessage(messages, text);
        input.value = '';
        input.disabled = true;
        sendBtn.disabled = true;

        // typing indicator
        const typingEl = appendTyping(messages);

        try {
            const db = Data.getKPIs ? {
                kpis: Data.getKPIs(),
                clientes: Data.getClientes(),
                projetos: Data.getProjetos(),
                tickets: Data.getTickets()
            } : {};

            const response = await AIAgent.ask(text, role, db, contextData);
            typingEl.remove();
            appendAIMessage(messages, response);
        } catch (err) {
            typingEl.remove();
            appendAIMessage(messages, '⚡ Ocorreu um erro. Tente novamente.');
        }

        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
    }

    sendBtn?.addEventListener('click', send);
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
}

function appendUserMessage(container, text) {
    const el = document.createElement('div');
    el.className = 'chat-msg user';
    el.innerHTML = `<div class="chat-bubble">${escapeHtml(text)}</div>`;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
}

function appendAIMessage(container, text) {
    const el = document.createElement('div');
    el.className = 'chat-msg ai';
    el.innerHTML = `<div class="chat-avatar">N</div><div class="chat-bubble">${markdownToHtml(text)}</div>`;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
}

function appendTyping(container) {
    const el = document.createElement('div');
    el.className = 'chat-msg ai';
    el.innerHTML = `<div class="chat-avatar">N</div><div class="chat-bubble typing"><span></span><span></span><span></span></div>`;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
}

// ── Utility functions ─────────────────────────────────────────
function roleLabel(role) {
    const labels = { dono: 'Dono / CEO', operador: 'Operador', cliente: 'Cliente' };
    return labels[role] || role;
}

function initials(name) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function markdownToHtml(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
}

function statusBadge(status) {
    const map = {
        ativo: '<span class="badge badge-success">Ativo</span>',
        lead: '<span class="badge badge-info">Lead</span>',
        churn_risk: '<span class="badge badge-warning">Risco Churn</span>',
        inativo: '<span class="badge badge-muted">Inativo</span>',
        em_progresso: '<span class="badge badge-info">Em Progresso</span>',
        backlog: '<span class="badge badge-muted">Backlog</span>',
        revisao: '<span class="badge badge-warning">Revisão</span>',
        concluido: '<span class="badge badge-success">Concluído</span>',
        aberto: '<span class="badge badge-danger">Aberto</span>',
        em_andamento: '<span class="badge badge-info">Em Andamento</span>',
        resolvido: '<span class="badge badge-success">Resolvido</span>'
    };
    return map[status] || `<span class="badge">${status}</span>`;
}

function prioridadeBadge(p) {
    const map = {
        critica: '<span class="badge badge-danger">🔴 Crítica</span>',
        alta: '<span class="badge badge-warning">🟠 Alta</span>',
        media: '<span class="badge badge-info">🔵 Média</span>',
        baixa: '<span class="badge badge-muted">⚪ Baixa</span>'
    };
    return map[p] || `<span class="badge">${p}</span>`;
}

// ── Relative time ────────────────────────────────────────────
function timeAgo(dateStr) {
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 86400000);
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    if (diff < 7) return `${diff} dias atrás`;
    if (diff < 30) return `${Math.floor(diff / 7)} semana(s) atrás`;
    return formatDate(dateStr);
}

// ── Sidebar HTML ─────────────────────────────────────────────
function renderSidebarHTML(activePage) {
    return `
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-brand">
      <div class="brand-logo">N</div>
      <div>
        <div class="brand-name">Nexus AI</div>
        <div class="brand-tagline">CRM Consultoria</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <a href="dashboard.html" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}" data-role-hide="cliente">
        <span class="nav-icon">📊</span> Dashboard
      </a>
      <a href="clientes.html" class="nav-link ${activePage === 'clientes' ? 'active' : ''}">
        <span class="nav-icon">👥</span> Clientes
      </a>
      <a href="projetos.html" class="nav-link ${activePage === 'projetos' ? 'active' : ''}">
        <span class="nav-icon">📁</span> Projetos
      </a>
      <a href="operador.html" class="nav-link ${activePage === 'operador' ? 'active' : ''}" data-role-hide="cliente">
        <span class="nav-icon">🛠️</span> Operações
      </a>
      <a href="relatorios.html" class="nav-link ${activePage === 'relatorios' ? 'active' : ''}">
        <span class="nav-icon">📈</span> Relatórios
      </a>
      <a href="ia-executiva.html" class="nav-link ${activePage === 'ia-executiva' ? 'active' : ''}" data-role-hide="cliente">
        <span class="nav-icon">🤖</span> IA Executiva
      </a>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="user-avatar" id="sidebar-avatar">?</div>
        <div class="user-info">
          <div class="user-name" id="sidebar-username">—</div>
          <div class="user-role" id="sidebar-role">—</div>
        </div>
      </div>
      <button class="btn-logout" id="btn-logout" title="Sair">⏻</button>
    </div>
  </aside>
  `;
}

// ── AI Widget HTML ────────────────────────────────────────────
function renderAIChatHTML() {
    return `
  <div class="ai-chat-wrapper">
    <button class="ai-chat-toggle" id="ai-chat-toggle" title="Agente NEXUS AI">
      <span class="ai-icon">🤖</span>
      <span class="ai-badge" id="ai-badge">1</span>
    </button>
    <div class="ai-chat-widget" id="ai-chat-widget">
      <div class="ai-chat-header">
        <div class="ai-header-info">
          <div class="ai-avatar">N</div>
          <div>
            <div class="ai-name">NEXUS</div>
            <div class="ai-status"><span class="status-dot"></span> Online</div>
          </div>
        </div>
        <button class="ai-close" id="ai-chat-close">✕</button>
      </div>
      <div class="ai-chat-messages" id="ai-chat-messages"></div>
      <div class="ai-chat-footer">
        <input type="text" class="ai-chat-input" id="ai-chat-input" placeholder="Pergunte algo..." />
        <button class="ai-send-btn" id="ai-chat-send">➤</button>
      </div>
    </div>
  </div>
  `;
}
