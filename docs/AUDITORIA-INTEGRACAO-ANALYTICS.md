# Auditoria da Integracao Analytics

Data da auditoria: 2026-06-21

## Escopo

Auditoria completa do fluxo:

Catalogo -> Google Apps Script -> Google Sheets -> Analytics

Restricoes respeitadas:

- Nenhuma alteracao visual.
- Nenhuma alteracao de layout.
- Nenhuma alteracao mobile.
- Nenhuma funcionalidade nova criada.

## URLs encontradas

### Analytics

Arquivos verificados:

- `.env`
- `src/main.jsx`
- `dist/assets/index-CP8qLfvq.js` apos rebuild

URL configurada:

```txt
https://script.google.com/macros/s/AKfycbxcISxjVLPj5mBz0oem-5FrDjL0fOf2NtX6Ry5prry2AIWce5Tsn2NwRinB2tQKMs0T/exec
```

Variavel usada pelo Analytics:

```txt
VITE_ANALYTICS_API_URL
```

### Catalogo

Arquivos verificados:

- `src/main.jsx`
- `src/analytics/track.js`
- `dist/assets/index-zh5220vE.js` apos rebuild

URL configurada:

```txt
https://script.google.com/macros/s/AKfycbxcISxjVLPj5mBz0oem-5FrDjL0fOf2NtX6Ry5prry2AIWce5Tsn2NwRinB2tQKMs0T/exec
```

Variavel que pode sobrescrever a URL no deploy do Catalogo:

```txt
VITE_ZCONNECT_ANALYTICS_URL
```

Nao havia arquivo `.env` no pacote do Catalogo auditado. Portanto, no codigo-fonte e no build local, o Catalogo usa o fallback acima. Em producao, a Vercel ainda pode sobrescrever essa URL por variavel de ambiente.

## Deployment encontrado

ID do deployment:

```txt
AKfycbxcISxjVLPj5mBz0oem-5FrDjL0fOf2NtX6Ry5prry2AIWce5Tsn2NwRinB2tQKMs0T
```

Confirmacao de deployment ativo:

```txt
GET /exec
HTTP 200
{"ok":true,"service":"Z Connect Analytics V8"}
```

Confirmacao de leitura:

```txt
GET /exec?action=events
HTTP 200
{"ok":true,"events":[]}
```

Antes da auditoria a aba `EVENTS` estava vazia.

## Planilha utilizada

O Apps Script usa:

```js
SpreadsheetApp.getActiveSpreadsheet()
```

A aba utilizada e:

```txt
EVENTS
```

O ID/nome da planilha nao e exposto pelo endpoint atual, mas a leitura `action=events` vem diretamente dessa aba e a gravacao de teste apareceu na mesma leitura. Portanto, o Analytics esta lendo a mesma planilha/aba em que o Apps Script grava.

## Metodo esperado

Leitura do Analytics:

```txt
GET ?action=events
```

Envio de evento pelo Catalogo:

```txt
POST text/plain;charset=utf-8
body JSON com action: "track"
```

Compatibilidade adicional do Apps Script:

```txt
GET ?action=track
```

Reset:

```txt
POST body { action: "clear_events", pin }
GET ?action=clear_events
```

## CORS e fetch

Resultado de CORS:

- `GET /exec` e `GET ?action=events` retornaram `Access-Control-Allow-Origin: *`.
- `OPTIONS /exec` retornou `405 Method Not Allowed`.
- Nao houve erro de CORS nos logs do navegador durante a leitura pelo Analytics.

Conclusao:

- A leitura `GET` do Analytics nao esta bloqueada por CORS.
- O envio do Catalogo usa `navigator.sendBeacon` e fallback `fetch(..., { mode: "no-cors" })`, entao nao precisa ler a resposta e nao dispara preflight.

Risco encontrado:

- O envio do Catalogo e silencioso.
- `navigator.sendBeacon` retorna `true` quando aceitou enfileirar a requisicao, mas nao confirma gravacao no Apps Script.
- O fallback `fetch` usa `no-cors` e `.catch(() => null)`, portanto uma URL errada, deploy errado ou falha de rede pode ficar invisivel para o usuario.

## Validacao ponta a ponta

Empresa de auditoria usada:

```txt
AUDITORIA_CODEX_20260621_1030
```

Consultor usado:

```txt
ney
```

Produto usado:

```txt
459282 - ALMA PARACHOQUE DIANTEIRO GOLF 2013 A 2019
```

Eventos lidos via:

```txt
GET https://script.google.com/macros/s/AKfycbxcISxjVLPj5mBz0oem-5FrDjL0fOf2NtX6Ry5prry2AIWce5Tsn2NwRinB2tQKMs0T/exec?action=events
```

| EVENTO | DISPARA NO CATALOGO | CHEGA NO APPS SCRIPT | CHEGA NA PLANILHA | APARECE NO ANALYTICS |
|---|---|---|---|---|
| page_view | Sim, apos liberar o Catalogo pelo gate de empresa | Sim, `2026-06-21T13:30:57.655Z` | Sim | Sim |
| search | Sim, busca `alma` e busca sem resultado | Sim, 2 registros | Sim | Sim |
| search_no_results | Sim, busca `zxqv item inexistente auditoria codex 999999` | Sim, `2026-06-21T13:33:48.164Z` | Sim | Sim |
| product_open | Sim, ao abrir detalhes do produto | Sim, `2026-06-21T13:32:21.458Z` | Sim | Sim |
| add_to_cart | Sim, ao adicionar produto ao carrinho | Sim, 3 registros | Sim | Sim |
| remove_from_cart | Sim, ao remover item do carrinho | Sim, `2026-06-21T13:32:38.595Z` | Sim | Sim |
| clear_cart | Sim, ao limpar carrinho com item | Sim, `2026-06-21T13:32:48.569Z` | Sim | Sim |
| whatsapp_quote | Sim, ao clicar em Finalizar no WhatsApp | Sim, `2026-06-21T13:32:58.294Z` | Sim | Sim |

Total de eventos de auditoria encontrados na leitura final:

```txt
12
```

## Resultado por elo

Catalogo local auditado:

- Envia eventos reais.
- Usa o deployment correto no codigo-fonte e no build local.
- O envio e silencioso em caso de erro.

Apps Script:

- Deployment ativo.
- Recebe `POST` com `action: "track"`.
- Tambem aceita `GET ?action=track`.
- Normaliza aliases antigos para os nomes novos.

Google Sheets:

- Grava na aba `EVENTS`.
- A leitura `action=events` retornou os eventos gravados.

Analytics:

- Le a mesma URL/deployment.
- Le a mesma aba via Apps Script.
- Exibiu a empresa de auditoria e os eventos no painel local.

## Causa raiz identificada

No pacote auditado e no deployment de Apps Script testado, nao ha quebra entre Apps Script, planilha e Analytics.

Como o uso do Catalogo local gravou todos os eventos obrigatorios na aba `EVENTS`, mas o relato inicial diz que o Catalogo online nao gera novas linhas, a quebra fica antes do Apps Script no ambiente publicado:

```txt
Catalogo publicado em producao nao esta enviando para este deployment do Apps Script.
```

Causa mais provavel:

```txt
Deploy/ambiente de producao do Catalogo divergente do build auditado, especialmente a variavel VITE_ZCONNECT_ANALYTICS_URL na Vercel ou um deploy antigo/cacheado.
```

O codigo atual no GitHub esta alinhado:

Catalogo:

```txt
HEAD/main local:  a8706532eedb9b00044a3b0d21cde31a0c9d7c02
HEAD/main remoto: a8706532eedb9b00044a3b0d21cde31a0c9d7c02
```

Analytics:

```txt
HEAD/main local:  00df20cf5a3400e69e5d9f8b20b9636dab977a25
HEAD/main remoto: 00df20cf5a3400e69e5d9f8b20b9636dab977a25
```

## Correcao minima necessaria

Nao foi necessaria alteracao de codigo para o pacote auditado.

Correcao operacional minima para producao:

1. Conferir na Vercel do Catalogo se `VITE_ZCONNECT_ANALYTICS_URL` existe.
2. Se existir, garantir que o valor seja exatamente:

```txt
https://script.google.com/macros/s/AKfycbxcISxjVLPj5mBz0oem-5FrDjL0fOf2NtX6Ry5prry2AIWce5Tsn2NwRinB2tQKMs0T/exec
```

3. Fazer redeploy limpo do Catalogo a partir do commit:

```txt
a8706532eedb9b00044a3b0d21cde31a0c9d7c02
```

4. Apos o redeploy, abrir o Catalogo publicado, gerar um `page_view` e confirmar em:

```txt
GET /exec?action=events
```

5. Se o problema continuar, inspecionar o bundle JS do Catalogo publicado e procurar pelo deployment ID acima. Se o ID nao estiver no bundle, o site publicado nao esta usando o build auditado ou a variavel de ambiente esta divergente.

## Comandos executados

Catalogo:

```bash
npm.cmd install
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1 --port 5197 --strictPort
```

Resultado:

- `npm.cmd install`: concluido; 2 vulnerabilidades herdadas (1 moderada, 1 alta).
- `npm.cmd run build`: sucesso com Vite v5.4.21.
- `npm.cmd run dev`: iniciado em `http://127.0.0.1:5197/`.

Analytics:

```bash
npm.cmd install
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1 --port 5198 --strictPort
```

Resultado:

- `npm.cmd install`: concluido; 0 vulnerabilidades.
- `npm.cmd run build`: sucesso com Vite v8.0.16.
- `npm.cmd run dev`: iniciado em `http://127.0.0.1:5198/`.

## Conclusao

A quebra nao esta no Apps Script, nao esta na gravacao da planilha e nao esta na leitura do Analytics.

Para o ambiente relatado, a quebra esta no Catalogo publicado antes de chegar ao Apps Script, provavelmente por deploy de producao ou variavel `VITE_ZCONNECT_ANALYTICS_URL` divergente.
