# Z Connect Analytics CRM 10

Painel comercial do catálogo com oportunidades priorizadas, carteira de clientes e manutenção segura dos dados. Esta versão não altera preços, descontos nem a política comercial do catálogo.

## O que foi adicionado

- Períodos rápidos e intervalo personalizado por data.
- Filtros por consultor, empresa, evento, produto, código e termo buscado.
- Fila de oportunidades por urgência: excedente de estoque, carrinho ativo, carrinho sem cotação, busca sem resultado e reativação.
- Ficha CRM por cliente com etapa, responsável, próximo contato, tags, anotações, interesses e histórico.
- Qualidade de dados com prévia dos registros de teste/não identificados.
- Backup CSV local e backup automático em uma nova aba da planilha antes da limpeza.
- Bloqueio no servidor contra exclusão seletiva de empresas reais.
- Detecção e unificação assistida de nomes duplicados, também com backup.

## Teste local

1. Crie o arquivo `.env` usando as mesmas variáveis do projeto publicado.
2. Execute:

```bash
npm install
npm run dev
```

3. Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`.
4. Teste os filtros, abra uma ficha CRM e salve uma anotação.

## Atualização obrigatória do Google Apps Script

1. Abra a planilha do Analytics e acesse **Extensões > Apps Script**.
2. Substitua o código pela versão de `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` deste pacote.
3. Em **Implantar > Gerenciar implantações**, edite a implantação atual.
4. Selecione **Nova versão** e conclua a implantação, mantendo o mesmo URL.
5. Confirme que `VITE_ANALYTICS_API_URL` na Vercel aponta para esse URL.

Opcionalmente configure `ANALYTICS_ADMIN_PIN` nas propriedades do Apps Script. Use o mesmo valor em `VITE_ANALYTICS_ADMIN_PIN` na Vercel. Sem PIN, a limpeza continua disponível para quem tiver acesso ao painel.

## Publicação na Vercel

Se o projeto já está conectado ao GitHub:

```bash
npm install
npm run build
git add .
git commit -m "Analytics CRM 10"
git push origin main
```

Se publica manualmente, envie esta pasta para o mesmo projeto atual do Analytics. Não é necessário republicar o catálogo.

Depois do deploy, atualize com `Ctrl + F5` e valide:

- período personalizado;
- abertura e salvamento da ficha CRM;
- área Qualidade e sua prévia;
- carrinhos e modal de reservas;
- exportação do relatório executivo.

## Limpeza dos testes antigos

Abra **Qualidade**, confira a lista, gere o **Backup CSV**, selecione apenas os nomes desejados e clique em **Excluir somente selecionados**. O servidor cria uma aba `BACKUP_LIMPEZA_...` antes da remoção. O comando antigo de apagar todo o histórico não aparece mais na interface.
