# Sprint 1 — Analytics, produtos mais adicionados e busca inteligente

## O que foi implementado

### 1. Analytics central preparado para Vercel + Supabase

Novas rotas:

```txt
/api/analytics
/api/ranking
```

O catálogo agora registra eventos:

```txt
view
search
suggestion_click
add_to_cart
whatsapp
not_found
```

Quando o Supabase ainda não estiver configurado, o site continua funcionando normalmente e usa o histórico local do navegador como fallback.

### 2. Produtos mais adicionados aos pedidos

O bloco antigo:

```txt
Itens mais movimentados neste catálogo
Baseado nos pedidos montados neste navegador
```

foi trocado para:

```txt
🔥 Produtos mais adicionados aos pedidos
```

Com Supabase configurado, ele usa dados de todos os clientes nos últimos 30 dias.
Sem Supabase, ele continua usando os dados locais para não quebrar o catálogo.

### 3. Busca inteligente

A busca agora normaliza:

```txt
acentos
hífens
pontos
barras
espaços extras
códigos digitados com ou sem separadores
```

Exemplos que ficam melhores:

```txt
12345
12345-1
12345.1
gol g5
retrovisor gol
tyc
```

### 4. Sugestões enquanto digita

Ao digitar 2 ou mais caracteres, o catálogo mostra sugestões clicáveis com:

```txt
código
nome do produto
marca
```

### 5. Correção de bug

Foi corrigido um erro em `sendNotFoundMessage()`, onde existia uma referência a `items` sem definição.

---

## Arquivos alterados

```txt
api/analytics.js
api/ranking.js
ui/catalog.js
ui/catalog.css
catalogo-gerado/assets/catalog.js
catalogo-gerado/assets/catalog.css
SPRINT-1-ANALYTICS-BUSCA.md
```

---

## Configuração do Supabase

Crie uma tabela no Supabase com o SQL abaixo:

```sql
create table if not exists public.catalog_events (
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

create index if not exists catalog_events_created_at_idx on public.catalog_events (created_at desc);
create index if not exists catalog_events_event_type_idx on public.catalog_events (event_type);
create index if not exists catalog_events_catalog_id_idx on public.catalog_events (catalog_id);
```

Na Vercel, configure as variáveis de ambiente:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANALYTICS_TABLE=catalog_events
```

Depois faça novo deploy.

---

## Teste rápido

1. Suba para GitHub.
2. Aguarde o deploy da Vercel.
3. Abra o catálogo.
4. Pesquise por algum termo.
5. Adicione produtos ao carrinho.
6. Finalize no WhatsApp.
7. Abra novamente o catálogo e confira o bloco de produtos mais adicionados.

Sem Supabase configurado, o ranking será local.
Com Supabase configurado, o ranking será global.
