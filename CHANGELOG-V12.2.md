# CRM Analytics 12.2 — ranking público de produtos

- adiciona `product_rankings_public` ao Apps Script;
- consolida aberturas, adições ao carrinho e cotações por código nos últimos 30 dias;
- devolve somente a ordem dos códigos, sem clientes, consultores, preços ou quantidades;
- mantém cache de 15 minutos para proteger desempenho e cota do Apps Script;
- preserva autenticação e escopo das rotas administrativas existentes.
