# Z Connect Analytics CRM 11.2

Painel de inteligência comercial com login real no servidor, fila diária, funil Kanban, Cliente 360, tarefas, metas, resultados, reservas e monitor do catálogo. Nenhuma regra de preço ou desconto foi alterada.

## O que entrou nesta versão

- Funil compacto com as sete etapas visíveis em telas desktop e barra de navegação direta para telas menores.
- Carrinhos com histórico permanente de interesse após o fim da reserva, filtro de clientes que precisam de contato e mensagem pronta para WhatsApp.
- Cliente 360 com histórico dos itens adicionados, distinção entre reserva ativa e expirada e acompanhamento comercial em um clique.
- Administração manual de empresas: escolha do nome principal, mesclagem livre de variações e exclusão seletiva por empresa e por tipo de dado, sempre com backup.
- Login server-side: senha não vai mais para o JavaScript público; sessão em cookie `HttpOnly`, `Secure` e `SameSite=Strict`.
- Logins individuais para Administrador, Huesller, Ney, Junior e Francisco. O servidor entrega a cada usuário somente os clientes originados pelos seus próprios links; o administrador continua vendo tudo.
- Cliente 360 dividido em Resumo, Interesses, Carrinho e cotações, Tarefas e Histórico.
- Avisos de retornos vencidos/para hoje, cards de ação clicáveis, calendário nativo e valores em formato brasileiro.
- Produtos reorganizados em abas legíveis e unificação de empresas corrigida, inclusive para variações apenas de maiúsculas/minúsculas.
- APIs administrativas protegidas por sessão na Vercel e token privado entre Vercel e Apps Script.
- Central **Ações agora**: retornos atrasados, carrinhos, excedentes, cotações e sinais de compra ordenados por urgência.
- Funil Kanban: novo, contato, cotação, negociação, aguardando, ganho e perdido.
- Cliente 360: telefone/WhatsApp, responsável, valor esperado, tags, anotações, tarefas, produtos, reservas e linha do tempo.
- Registro de vendas e perdas com valor e motivo; meta mensal e progresso executivo.
- Demanda x estoque x reservas e alertas de reposição.
- Monitor da atualização diária do catálogo, produtos sem imagem e variação de estoque.
- Limpeza seletiva com backup; após limpar testes, os filtros voltam para **Todo o histórico / Todas** automaticamente.

## 1. Gerar os usuários

No terminal, dentro da pasta do projeto:

```bash
node scripts/generate-multiuser-config.mjs
```

Digite uma senha com pelo menos 8 caracteres para cada usuário e copie a linha completa `ANALYTICS_USERS_JSON=...`. O script grava somente hashes dentro do JSON; nenhuma senha aparece no resultado.

Se ainda não tiver os outros segredos, gere-os uma única vez:

```bash
node scripts/generate-auth-secrets.mjs "SENHA-TEMPORARIA-DO-ADMIN"
```

Use desse segundo comando apenas `ANALYTICS_SESSION_SECRET`, `ANALYTICS_ADMIN_TOKEN` e `CATALOG_SYNC_TOKEN`. O login passa a ser controlado pelo `ANALYTICS_USERS_JSON`.

## 2. Configurar o Google Apps Script

1. Abra a planilha do Analytics em **Extensões > Apps Script**.
2. Substitua o código pelo arquivo `GOOGLE_APPS_SCRIPT_V3_CLIENTES.js` deste pacote.
3. Abra **Configurações do projeto > Propriedades do script**.
4. Crie `ANALYTICS_ADMIN_TOKEN` com exatamente o token gerado no passo 1.
5. Crie `CATALOG_SYNC_TOKEN` com o token de catálogo gerado no passo 1.
6. Vá a **Implantar > Gerenciar implantações**, edite a implantação, escolha **Nova versão** e publique mantendo o mesmo URL `/exec`.

As abas `CRM_CLIENTS`, `CRM_TASKS`, `CRM_ACTIVITIES`, `CRM_SETTINGS`, `CATALOG_SNAPSHOTS` e `CATALOG_PRODUCTS` são criadas automaticamente quando usadas. Os dados anteriores continuam preservados.

## 3. Configurar a Vercel

Em **Project > Settings > Environment Variables**, configure para `Production`, `Preview` e `Development`:

- `ANALYTICS_USERS_JSON`: linha gerada pelo script multiusuário, sem o nome da variável e sem aspas extras.
- `ANALYTICS_SESSION_SECRET`: valor gerado pelo script.
- `ANALYTICS_API_URL`: URL `/exec` da implantação do Apps Script.
- `ANALYTICS_ADMIN_TOKEN`: o mesmo configurado nas propriedades do Apps Script.
- `CATALOG_SYNC_TOKEN`: o mesmo token definido para a integração do catálogo.

Remova as antigas `VITE_ANALYTICS_LOGIN_*`, `VITE_ANALYTICS_ADMIN_PIN` e credenciais públicas. Variáveis com prefixo `VITE_` são expostas ao navegador e não devem conter segredos.

`ANALYTICS_LOGIN_USER` e `ANALYTICS_LOGIN_PASSWORD_HASH` podem permanecer por compatibilidade, mas são ignoradas quando `ANALYTICS_USERS_JSON` está configurado corretamente.

## 4. Testar localmente

Copie `.env.example` para `.env.local`, preencha somente na sua máquina e execute:

```bash
npm install
npm test
npm run build
npx vercel dev
```

Abra o endereço informado pelo `vercel dev`, faça login e valide:

1. Visão geral e **Ações agora**.
2. Arrastar cliente no **Funil**.
3. Abrir Cliente 360, salvar telefone, criar e concluir tarefa.
4. Registrar um ganho/perda de teste e conferir o resultado mensal.
5. Carrinhos e modal de reservas.
6. Qualidade: prévia e limpeza seletiva.
7. Entrar com Huesller/Ney/Junior/Francisco e confirmar que cada um enxerga apenas a própria carteira. A área **Qualidade** aparece somente para o administrador.

O `npm run dev` sozinho serve apenas a interface Vite; para testar login e rotas `/api`, use `npx vercel dev`.

## 5. Publicar

Se o projeto está ligado ao GitHub:

```bash
git add .
git commit -m "Analytics CRM 11.2"
git push origin main
```

Ou envie esta pasta ao mesmo projeto da Vercel. Após o deploy, use `Ctrl + F5`, entre novamente e confirme que a área **Qualidade** informa “operação protegida pela sessão administrativa”.

## Ordem segura de atualização

1. Configure as variáveis na Vercel.
2. Publique o frontend CRM 11.2.
3. Configure as propriedades e publique o Apps Script CRM 11.2.
4. Se o URL do Apps Script mudou, atualize `ANALYTICS_API_URL` e faça novo deploy na Vercel.
5. Conecte o snapshot do catálogo seguindo `docs/INTEGRACAO-CATALOGO-CRM11.md`.

O catálogo atual continua funcionando durante os passos 1 a 4. A integração de snapshot apenas envia código, descrição, marca, estoque e presença de imagem; não recebe nem altera preço.
