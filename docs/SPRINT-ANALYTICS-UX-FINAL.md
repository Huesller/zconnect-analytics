# Sprint Analytics UX Final

## Objetivo

Refinar o Analytics para uso diário pelo dono da empresa, com visual escuro profissional, leitura objetiva, cards clicáveis, modais de histórico completo e acesso rápido aos dados operacionais.

## Arquivos alterados

- `src/main.jsx`
- `src/styles.css`
- `docs/SPRINT-ANALYTICS-UX-FINAL.md`

## Preservado

- `fetchEvents`
- `clearEvents`
- exportação CSV
- aliases de eventos
- nomes e contrato dos eventos
- endpoint atual
- botão `Limpar dados de teste`
- fluxo de reset administrativo

Não houve alteração no Apps Script, no Catálogo, na coleta ou no contrato de dados.

## Melhorias visuais

- Tema escuro executivo com fundo escuro, cards discretos e contraste reforçado.
- Vermelho mantido como destaque principal.
- Remoção da aparência clara/anterior e redução de efeitos visuais exagerados.
- Layout reorganizado para leitura diária por seção:
  - Visão geral
  - Funil
  - Empresas
  - Buscas
  - Produtos
  - Consultores
  - Cotações
  - Administração
- Textos vazios revisados para explicar melhor o estado dos filtros atuais.
- Ajuste do detalhe em eventos recentes para evitar exibir `Produto não informado` em eventos que não têm produto.

## Cards clicáveis

Foram transformados em entradas clicáveis com abertura de modal:

- Acessos
- Buscas
- Sem resultado
- Produtos abertos
- Adicionados
- Removidos
- Carrinhos limpos
- Cotações WhatsApp
- Valor cotado
- Clientes mais ativos
- Top buscas
- Produtos mais abertos
- Produtos mais adicionados
- Produtos mais cotados
- Consultores

Também foram mantidos rankings auxiliares clicáveis quando ajudam a chegar ao histórico completo, como buscas por empresa, cotações por empresa e produtos cotados.

## Modais implementados

Os modais usam tabela rolável com filtros simples e total no cabeçalho.

### Histórico de eventos

Campos exibidos quando aplicável:

- data/hora
- empresa
- consultor
- evento
- produto
- busca
- valor
- quantidade

### Top buscas

Abre o histórico completo de buscas no filtro atual, com:

- data/hora
- empresa
- consultor
- termo buscado
- resultado ou sem resultado
- evento

### Cotações WhatsApp

Abre o histórico completo de cotações no filtro atual, com:

- data/hora
- empresa
- consultor
- itens
- produtos
- valor total cotado

### Clientes mais ativos

Abre o resumo completo por empresa, com:

- empresa
- total de ações
- buscas
- produtos abertos
- adicionados
- cotações
- valor cotado
- último evento

### Consultores

Abre o resumo completo por consultor, com:

- consultor
- total de ações
- acessos
- buscas
- produtos abertos
- cotações
- valor cotado
- último evento

## Responsividade

- Desktop: grid executivo com cards em colunas, toolbar fixa e modais amplos com scroll interno.
- Mobile: cards em coluna única, toolbar empilhada, modal ocupando a altura disponível e tabela com scroll horizontal/interno.

## Validação executada

Comandos executados:

```bash
npm.cmd install
npm.cmd run build
npm.cmd run dev
```

Resultados:

- `npm.cmd install`: dependências atualizadas, `0 vulnerabilities`.
- `npm.cmd run build`: build Vite concluído com sucesso.
- `npm.cmd run dev`: Vite iniciado e validado por HTTP.
- URL local validada: `http://127.0.0.1:5175/`
- Status HTTP: `200`

Observação: as portas `5173` e `5174` já estavam ocupadas no ambiente, então o Vite subiu automaticamente em `5175`.

## Riscos restantes

- A validação visual foi feita por build e resposta HTTP local; a qualidade final dos dados exibidos depende dos eventos reais retornados pelo endpoint.
- O reset continua dependente da configuração de PIN/ambiente já existente.
- O modal de cotações usa os campos disponíveis no contrato atual; se algum evento antigo não trouxer `products`, o dashboard mantém fallback para o produto do próprio evento ou texto informativo.
- A exportação CSV permanece no formato existente e respeita os filtros globais atuais.
