# Correção V12.6.0 — importação por vendedor

- Corrige o bloqueio `client_outside_user_scope` que cancelava uma importação inteira quando apenas um registro já pertencia a outro vendedor.
- O vendedor continua podendo importar somente para a própria carteira.
- Clientes sem conflito são importados normalmente.
- Registros que já pertencem a outro vendedor são ignorados com segurança e contabilizados na mensagem final.
- Mensagens técnicas de escopo foram substituídas por orientações em português.

## Publicação

Substitua os arquivos do projeto no repositório usado pela Vercel, faça commit e `git push origin main`. Não é necessário alterar as variáveis de ambiente nem o Apps Script.
