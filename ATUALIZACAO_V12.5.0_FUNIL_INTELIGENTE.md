# Z Connect Analytics 12.5.0 — Funil comercial inteligente

## Etapas

Novo cliente → Em contato → Oportunidade identificada → Cotação enviada → Negociação → Aguardando cliente → Pedido fechado ou Perdido.

## Atividades de contato

Ligação sem resposta, WhatsApp enviado, e-mail enviado, telefone inválido e contato realizado ficam no histórico do Cliente 360. Essas ações não criam colunas extras no Kanban.

## Automações

- A primeira tentativa registrada move um cliente de Novo cliente para Em contato.
- A atividade Cotação enviada move o cliente para Cotação enviada.
- Perdido exige motivo antes de salvar.
- Os cartões são priorizados pela próxima ação e destacam atrasos, ações de hoje e clientes sem ação programada.

## Publicação

Além do deploy normal do site, substitua o código do Apps Script pelo arquivo `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` desta versão e publique uma nova implantação para liberar a etapa `qualified`.
