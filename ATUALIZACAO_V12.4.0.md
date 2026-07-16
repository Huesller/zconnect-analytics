# Z Connect Analytics 12.4.0

## Implementado

- Central de anotações única, ligada ao histórico do Cliente 360.
- Busca e filtros por ações pendentes, concluídas ou anotações sem próxima ação.
- Próxima ação e data dentro de cada anotação, com conclusão pela central.
- Exportação `.xlsx` com abas **Anotações** e **Clientes**, filtros automáticos, cabeçalho congelado e colunas organizadas.
- Cadastro de última compra, valor da última compra, total comprado, quantidade de compras e ciclo médio.
- Cálculo automático de dias sem comprar quando existe data de última compra.
- Classificação comercial: Ativo, Atenção, Em risco, Inativo e Sem histórico.
- Filtros na carteira por situação comercial, clientes com anotações e ordenação por compras.
- Importação Excel reconhece também os novos campos comerciais.

## Publicação obrigatória

1. Publique o frontend normalmente na Vercel.
2. Substitua o código do Google Apps Script pelo arquivo `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` desta versão.
3. Crie uma nova implantação do Apps Script e confirme que a URL usada pela Vercel continua apontando para a implantação atual.
4. Abra o Analytics uma vez. O Apps Script acrescentará automaticamente as novas colunas às planilhas existentes, sem apagar dados.

## Validação recomendada

1. Abra um cliente e preencha a data da última compra.
2. Adicione uma anotação com próxima ação e data.
3. Abra **Anotações**, conclua a ação e exporte o Excel.
4. Confira as duas abas e os filtros do arquivo exportado.
