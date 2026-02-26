// ============================================================
//  NEXUS AI CRM - Cloud Auth (Supabase)
// ============================================================

const CloudAuth = (() => {
  let sb = null;
  let enabled = false;

  function getRedirectByRole(role) {
    if (role === 'dono') return 'dashboard.html';
    if (role === 'operador') return 'operador.html';
    return 'clientes.html';
  }

  async function init() {
    try {
      const res = await fetch('/api/public-config');
      if (!res.ok) return { enabled: false };
      const data = await res.json();
      if (!data?.supabase?.enabled || !window.supabase) return { enabled: false };
      sb = window.supabase.createClient(data.supabase.url, data.supabase.anonKey);
      enabled = true;
      return { enabled: true };
    } catch (err) {
      return { enabled: false };
    }
  }

  async function signIn(email, password) {
    if (!enabled) throw new Error('Supabase nao habilitado.');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const user = data?.user;
    if (!user) throw new Error('Nao foi possivel autenticar usuario.');

    const { data: profile, error: pErr } = await sb
      .from('crm_profiles')
      .select('nome, role, cliente_id')
      .eq('user_id', user.id)
      .single();

    if (pErr || !profile) {
      throw new Error('Perfil nao encontrado em crm_profiles. Vincule o usuario no Supabase.');
    }

    const appUser = {
      nome: profile.nome || user.email,
      role: profile.role,
      clienteId: profile.cliente_id || null,
      email: user.email
    };

    sessionStorage.setItem('nexus_role', profile.role);
    sessionStorage.setItem('nexus_user', JSON.stringify(appUser));

    return { user: appUser, redirectTo: getRedirectByRole(profile.role) };
  }

  return {
    init,
    signIn
  };
})();
