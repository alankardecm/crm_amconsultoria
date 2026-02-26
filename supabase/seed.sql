-- Seed inicial de clientes para CRM AM Consultoria IA
-- Execute apos schema.sql

insert into public.crm_clientes (nome, segmento, contato, email, telefone, status, servicos, mrr, desde, satisfacao, cidade)
values
  ('TechCorp Solutions', 'Tecnologia', 'Rodrigo Lima', 'rodrigo@techcorp.com', '(11) 98745-3210', 'ativo', array['BI & Dashboards', 'Machine Learning'], 8500, '2024-03-15', 4.8, 'Sao Paulo'),
  ('FinEdge Capital', 'Financeiro', 'Beatriz Souza', 'beatriz@finedge.com', '(21) 97654-1234', 'ativo', array['Analise de Dados', 'Automacao IA'], 12000, '2023-11-01', 4.6, 'Rio de Janeiro'),
  ('RetailPro Ltda', 'Varejo', 'Carlos Mendes', 'carlos@retailpro.com', '(31) 96543-0987', 'churn_risk', array['Dashboards Power BI'], 4200, '2024-07-20', 3.2, 'Belo Horizonte')
on conflict do nothing;
