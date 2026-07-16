# Atualização 12.4.1 — Dia Zero

## Como zerar completamente a operação comercial

1. Entre com o usuário administrador.
2. Abra **Qualidade**.
3. Localize **Dia Zero — apagar toda a base comercial**.
4. Digite `ZERAR TUDO`.
5. Clique em **Apagar e começar do zero**.
6. Confirme novamente no aviso final.

O reset apaga clientes, funil, tarefas, anotações, eventos, carrinhos/reservas, ofertas e configurações comerciais. Produtos, estoque, estrutura do catálogo, usuários e login são preservados.

Depois do reset, abra **Clientes CRM → Importar carteira** para iniciar a nova base.

## Publicação

É obrigatório publicar os dois lados desta versão:

- frontend/API na Vercel;
- `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` como nova implantação no Google Apps Script.

Sem atualizar o Apps Script, o botão Dia Zero não conseguirá apagar as planilhas comerciais.
