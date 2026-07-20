# Publicação 12.10.0

## Ordem obrigatória

1. Abra o Google Apps Script usado pelo Z Connect.
2. Substitua o código pelo conteúdo de `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js`.
3. Acesse **Implantar > Gerenciar implantações > Editar > Nova versão** e confirme a implantação.
4. Verifique se a URL do Web App continua configurada em `ANALYTICS_API_URL` na Vercel.
5. Publique este projeto na Vercel.
6. Saia e entre novamente no Z Connect para carregar a versão nova.

Nenhum cliente, histórico, carrinho, cotação, anotação ou tarefa existente é apagado. A versão usa as mesmas abas atuais e mantém compatibilidade com tarefas antigas que possuam somente a data.

## Validação rápida

- Criar uma tarefa deve exibi-la imediatamente, antes da resposta do servidor.
- A tarefa deve aceitar data e horário.
- Concluir e cancelar devem atualizar a tela imediatamente.
- Ao reabrir o Cliente 360, tarefas concluídas e canceladas devem constar em **Histórico de tarefas**.
- Clientes sem atividade comercial devem permanecer em **Clientes CRM**, mas não ocupar o Kanban.
- Ao registrar uma interação ou tarefa aberta, um novo cliente deve entrar no funil ativo.
- Pedido fechado e perdido devem sair do Kanban ativo e permanecer em relatórios e histórico.
- Usuários vendedores continuam vendo e alterando somente seus próprios clientes.

## Reversão

Se a validação falhar, restaure a implantação anterior do Apps Script e a implantação anterior da Vercel. Os dados continuam compatíveis e não precisam ser revertidos.
