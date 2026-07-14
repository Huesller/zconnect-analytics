# Publicação do CRM 11.1

## 1. Atualize o Apps Script

1. Abra a planilha do Analytics.
2. Vá em **Extensões > Apps Script**.
3. Substitua o código atual por `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` deste pacote.
4. Em **Configurações do projeto > Propriedades do script**, confirme:
   - `ANALYTICS_ADMIN_TOKEN` com o token já usado pela Vercel do Analytics;
   - `CATALOG_SYNC_TOKEN` com um token forte exclusivo para a integração de estoque.
5. Em **Implantar > Gerenciar implantações**, edite a implantação, selecione **Nova versão** e publique.
6. Mantenha/copiei a URL final terminada em `/exec`.

## 2. Gere os cinco logins

Dentro da pasta do Analytics:

```bash
npm install
node scripts/generate-multiuser-config.mjs
```

Crie as senhas de Administrador, Huesller, Ney, Junior e Francisco. Copie o JSON exibido ao final.

## 3. Configure a Vercel do Analytics

Em **Settings > Environment Variables**, para Production e Preview, confirme:

- `ANALYTICS_USERS_JSON`: JSON completo gerado no passo anterior;
- `ANALYTICS_SESSION_SECRET`: segredo longo já usado pela sessão;
- `ANALYTICS_API_URL`: URL `/exec` publicada no passo 1;
- `ANALYTICS_ADMIN_TOKEN`: igual ao Apps Script;
- `CATALOG_SYNC_TOKEN`: igual ao Apps Script.

Não coloque aspas adicionais no JSON e não use variáveis `VITE_` para senhas ou tokens.

## 4. Publique o Analytics

Envie esta pasta para o mesmo repositório/projeto do Analytics e aguarde o deploy. Depois, use `Ctrl + F5` e teste o login do administrador.

## 5. Configure a Vercel do Catálogo

No projeto do Catálogo, crie/atualize:

- `ZCONNECT_ANALYTICS_TARGET_URL`: a mesma URL `/exec` do Apps Script;
- `CATALOG_SYNC_TOKEN`: exatamente o token do passo 1.

Publique o Catálogo. Ao final do build, o snapshot de estoque será enviado automaticamente. A tela **Catálogo e estoque** do Analytics deve sair de “Aguardando integração”.

## 6. Teste de aceite

1. Entre como Huesller e confirme que aparecem somente clientes de links do Huesller.
2. Repita com Ney, Junior e Francisco.
3. Entre como administrador e confirme a carteira completa e a área **Qualidade**.
4. Clique nos quatro cards de **Ações agora** e abra um cliente da lista.
5. Abra o Cliente 360 e teste as cinco abas, o calendário e um retorno para hoje.
6. Digite `1000` em um campo monetário e confirme `R$ 1.000,00`.
7. Teste **Unificar nomes sugeridos** em uma duplicidade conhecida.
8. Abra **Produtos** e alterne as quatro leituras.
9. Confira a data do snapshot em **Catálogo e estoque**.

As políticas de preço, IPI, desconto-base, condição especial e limites comerciais permanecem inalteradas.
