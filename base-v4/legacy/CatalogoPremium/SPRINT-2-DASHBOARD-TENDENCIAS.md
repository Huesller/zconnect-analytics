# Sprint 2 - Dashboard comercial e tendências

Esta sprint evolui a Sprint 1 com painel administrativo e produtos em tendência.

## Novos arquivos

```text
api/
├── dashboard.js
└── trends.js

catalogo-gerado/
└── admin.html
```

## Dashboard

Acesse depois do deploy:

```text
/admin
```

ou diretamente:

```text
/admin.html
```

O painel mostra:

- eventos totais;
- acessos;
- buscas;
- peças adicionadas ao carrinho;
- peças enviadas pelo WhatsApp;
- pesquisas sem resultado;
- produtos mais pedidos;
- consultores mais movimentados;
- marcas mais movimentadas;
- gráfico diário simples.

## Segurança opcional do dashboard

Na Vercel, você pode criar a variável:

```text
DASHBOARD_TOKEN=uma-senha-forte-aqui
```

Quando ela existir, o dashboard/API exigirá token.

Acesse assim:

```text
/admin?token=uma-senha-forte-aqui
```

Se não configurar `DASHBOARD_TOKEN`, o painel fica público para quem souber o link.

## Tendências no catálogo

Foi adicionada a API:

```text
/api/trends
```

Ela compara:

```text
últimos 7 dias
vs
7 dias anteriores
```

e mostra produtos em crescimento.

No catálogo, aparece o bloco:

```text
📈 Produtos em tendência
```

quando houver dados suficientes no Supabase.

## Variáveis necessárias na Vercel

As mesmas da Sprint 1:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANALYTICS_TABLE=catalog_events
```

Opcional:

```text
DASHBOARD_TOKEN
```

## SQL sugerido no Supabase

Caso ainda não tenha criado a tabela:

```sql
create table if not exists catalog_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  event_type text not null,
  catalog_id text,
  consultor_id text,
  client_id text,
  url text,
  user_agent text,
  query text,
  qty numeric default 1,
  product jsonb,
  payload jsonb
);

create index if not exists catalog_events_created_at_idx on catalog_events (created_at desc);
create index if not exists catalog_events_event_type_idx on catalog_events (event_type);
create index if not exists catalog_events_catalog_id_idx on catalog_events (catalog_id);
create index if not exists catalog_events_consultor_id_idx on catalog_events (consultor_id);
```

## Como testar

1. Suba o projeto no GitHub.
2. Aguarde o deploy da Vercel.
3. Configure as variáveis da Sprint 1/Sprint 2.
4. Abra o catálogo.
5. Faça buscas, adicione produtos ao carrinho e clique em enviar WhatsApp.
6. Abra `/admin`.

## Observação importante

O sistema registra intenção comercial pelo clique no catálogo. Ele não confirma se a venda foi realmente finalizada dentro do WhatsApp.
