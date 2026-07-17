# Publicação 12.8.0

## Ordem obrigatória

1. Abra o projeto do Google Apps Script usado pelo Z Connect.
2. Substitua o código pelo conteúdo de `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js`.
3. Clique em **Implantar > Gerenciar implantações > Nova versão**.
4. Confirme que a URL do Web App permanece configurada em `ANALYTICS_API_URL` na Vercel.
5. Publique os arquivos deste projeto na Vercel.
6. Entre no sistema, abra um Cliente 360 e registre uma demanda de teste.

A aba `CRM_DEMANDS` é criada automaticamente no primeiro uso. Nenhum cliente, histórico, carrinho, cotação ou configuração existente é apagado.

## Validação rápida

- A anotação deve aparecer imediatamente após salvar.
- A demanda manual deve aparecer em Demanda não atendida e Interesses.
- Um código existente deve preencher descrição, marca e estoque.
- A demanda deve aparecer em Produtos > Demanda x estoque.
- **Atendida** remove a demanda da pressão de estoque; **Remover** cancela o registro sem apagar o histórico técnico.
