# Publicação do CRM 12.0

## 1. Apps Script — obrigatório

1. Abra a planilha do Analytics em **Extensões > Apps Script**.
2. Substitua o código pelo arquivo `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` deste pacote.
3. Confirme nas propriedades do script `ANALYTICS_ADMIN_TOKEN` e `CATALOG_SYNC_TOKEN`.
4. Em **Implantar > Gerenciar implantações**, edite a implantação, escolha **Nova versão** e publique.
5. Mantenha a URL final `/exec` usada na Vercel.

O script cria automaticamente as novas colunas de contato, arquivamento e edição de anotações. Nenhum dado existente é apagado.

## 2. Analytics na Vercel

Publique esta pasta no mesmo projeto. Não é necessário criar uma variável nova. Permanecem necessárias:

- `ANALYTICS_USERS_JSON`
- `ANALYTICS_SESSION_SECRET`
- `ANALYTICS_API_URL`
- `ANALYTICS_ADMIN_TOKEN`
- `CATALOG_SYNC_TOKEN`

## 3. Teste de aceite

1. Entre com um vendedor e cadastre um cliente manualmente.
2. Confirme que ele aparece apenas na carteira desse vendedor e do administrador.
3. Abra o Cliente 360, salve dados adicionais e registre duas anotações.
4. Edite e exclua uma anotação; confirme que a outra permanece.
5. Em **Ações agora**, teste editar, finalizar e excluir.
6. Digite `1000` em valor esperado e confirme `R$ 1.000,00` ao sair do campo.
7. Em **Carrinhos**, alterne as situações, abra uma data e copie a mensagem com itens e quantidade.
8. Em **Atividade**, abra e recolha os grupos de data.

As regras de preço e desconto permanecem inalteradas.
