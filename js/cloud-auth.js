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

  function normalizeRole(role) {
    return ['dono', 'operador', 'cliente'].includes(role) ? role : 'cliente';
  }

  async function ensureProfile(user) {
    const { data: profile, error } = await sb
      .from('crm_profiles')
      .select('nome, role, cliente_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && profile) return profile;

    const nome =
      (user.user_metadata && user.user_metadata.nome) ||
      user.email?.split('@')[0] ||
      'Usuario';
    const role = normalizeRole((user.user_metadata && user.user_metadata.role) || 'cliente');

    const { error: upsertErr } = await sb
      .from('crm_profiles')
      .upsert(
        { user_id: user.id, nome, role },
        { onConflict: 'user_id' }
      );

    if (upsertErr) throw upsertErr;

    const { data: newProfile, error: fetchErr } = await sb
      .from('crm_profiles')
      .select('nome, role, cliente_id')
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !newProfile) throw fetchErr || new Error('Perfil nao encontrado apos cadastro.');
    return newProfile;
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
    const profile = await ensureProfile(user);

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

  async function signUp({ nome, email, password }) {
    if (!enabled) throw new Error('Supabase nao habilitado.');
    const trimmedNome = String(nome || '').trim();
    const payload = {
      email,
      password,
      options: {
        data: {
          nome: trimmedNome || 'Usuario',
          role: 'cliente'
        }
      }
    };

    const { data, error } = await sb.auth.signUp(payload);
    if (error) throw error;
    const user = data?.user;
    if (!user) throw new Error('Nao foi possivel criar usuario.');

    // If email confirmation is disabled, session exists now and we can create profile immediately.
    if (data.session) {
      await ensureProfile(user);
      return { confirmed: true };
    }

    return { confirmed: false };
  }

  return {
    init,
    signIn,
    signUp
  };
})();
