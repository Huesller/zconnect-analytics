# Z CONNECT V5 — Sprint 1

Entrega: arquivos de projeto modificados para validação.

## Escopo aplicado
- Header slim premium com busca rápida no topo.
- Consultor dinâmico preservado via querystring.
- Status online/offline preservado.
- Botão de pedido/carrinho preservado.
- Hero compacto premium sem mini-cards decorativos.
- Composição visual abstrata inspirada em linha de colisão.
- Busca protagonista com sugestões acima dos demais blocos.
- Grid preparado para 5 colunas no desktop largo.
- Paginação com contagem de produtos.
- Design tokens V5 adicionados em CSS.

## Arquivos alterados
- src/main.jsx
- src/styles.css

## Regras preservadas
- Preço vindo da legacy.
- Valor com IPI em card/modal/carrinho/WhatsApp.
- Querystring do consultor.
- WhatsApp final.
- Carrinho obrigatório.
- Busca como centro do sistema.
- Links e telefones dos consultores.

## Validação
Build executado com sucesso:
npm run build

Obs.: no ambiente local, caso o esbuild venha sem permissão de execução após descompactar, rode:
chmod +x node_modules/@esbuild/linux-x64/bin/esbuild
ou instale novamente com npm install.
