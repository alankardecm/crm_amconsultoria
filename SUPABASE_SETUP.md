# Setup Supabase (Banco + Auth)

## 1) SQL base
No painel do Supabase (`SQL Editor`), execute nesta ordem:
1. `supabase/schema.sql`
2. `supabase/seed.sql` (opcional)

## 2) Criar usuario dono
No painel (`Authentication > Users`), crie um usuario por e-mail/senha.

Depois, no SQL Editor, vincule esse usuario ao perfil dono:
```sql
insert into public.crm_profiles (user_id, nome, role)
values ('UUID_DO_USUARIO_AUTH', 'Alan Moreira', 'dono');
```

## 3) Configurar variaveis no backend (.env)
```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=SEU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY
```

## 4) Configurar no Vercel (Production)
No projeto da Vercel, adicione as mesmas variaveis de ambiente:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## 5) Autenticacao recomendada para este CRM
- `dono` e `operador`: acessam toda operacao.
- `cliente`: acessa apenas os registros do proprio `cliente_id`.
- Isso ja esta protegido por RLS no `schema.sql`.
