# Publicação do CRM 12.1

## 1. Atualize o Apps Script

Esta etapa é obrigatória para habilitar código interno e tarefas automáticas de reposição.

1. Abra a planilha do Analytics em **Extensões > Apps Script**.
2. Substitua o código pelo novo `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js`.
3. Em **Implantar > Gerenciar implantações**, edite a implantação e escolha **Nova versão**.
4. Publique mantendo a mesma URL `/exec`.

As novas colunas são criadas automaticamente. Os dados existentes são preservados.

## 2. Publique o Analytics

Envie o projeto ao mesmo repositório ou projeto da Vercel. Nenhuma variável nova é necessária.

## 3. Ative o primeiro ciclo de comparação

Publique o Catálogo ou execute sua atualização diária para enviar um snapshot. A automação de reposição dispara quando um snapshot posterior detectar um item que estava com zero e passou a ter estoque.

## 4. Teste de aceite

1. Em **Catálogo e estoque**, filtre por prioridade e abra um produto.
2. Confira os clientes interessados e a mensagem de reposição.
3. Em **Produtos > Demanda x estoque**, repita o filtro e a abertura do produto.
4. Cadastre um código interno no Cliente 360 e localize o cliente por esse código.
5. Abra **Demanda não atendida** e confirme que aparece somente o termo não encontrado.
6. Em **Carrinhos**, marque um pendente como Pedido fechado e confirme que ele sai de Precisam de contato.
7. Reabra o registro pelo histórico.

As regras comerciais e de preço permanecem inalteradas.
