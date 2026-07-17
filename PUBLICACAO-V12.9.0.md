# Publicação 12.9.0

## Ordem obrigatória

1. Abra o projeto do Google Apps Script usado pelo Z Connect.
2. Substitua o código pelo conteúdo de `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js`.
3. Clique em **Implantar > Gerenciar implantações > Nova versão**.
4. Confirme que a URL do Web App permanece configurada em `ANALYTICS_API_URL` na Vercel.
5. Publique os arquivos deste projeto na Vercel.
6. Entre no sistema, abra um Cliente 360 e registre uma demanda de teste.

A aba `CRM_DEMANDS` é criada automaticamente no primeiro uso. Nenhum cliente, histórico, carrinho, cotação ou configuração existente é apagado.

As colunas `funnelExitReason` e `funnelExitAt` são adicionadas automaticamente à aba de clientes. Clientes existentes continuam no funil normalmente.

## Validação rápida

- A anotação deve aparecer imediatamente após salvar.
- A demanda manual deve aparecer em Demanda não atendida e Interesses.
- Um código existente deve preencher descrição, marca e estoque.
- A demanda deve aparecer em Produtos > Demanda x estoque.
- **Atendida** remove a demanda da pressão de estoque; **Remover** cancela o registro sem apagar o histórico técnico.
- Tags devem aparecer como opções fixas no Cliente 360 e como filtro na carteira.
- Ao escolher **Fora do funil**, o motivo deve ser obrigatório e o cliente deve desaparecer apenas do Kanban.
- A área **Relatórios** deve consolidar ocorrências e permitir exportação Excel.
