# Base limpa — Z Connect Analytics 12.4.0

Esta é a base oficial enxuta do Analytics aprovado.

## Removido do pacote

- `node_modules/` — dependências reinstaláveis com `npm install`.
- `.git/` — histórico local do repositório, sem função na execução ou publicação.
- `dist/` — build regenerável com `npm run build`.
- `.env` — configuração local e potencialmente sensível; permaneceu apenas `.env.example`.
- Google Apps Script V2 — substituído integralmente pelo V3 atual.
- readme da versão 5 e correção isolada da versão 9.1.1.
- documentos de auditorias, sprints e publicações antigas já incorporados à versão atual.

## Preservado

- Código-fonte atual completo.
- APIs, autenticação e scripts auxiliares.
- Parser PDF SIGGMA e importação Excel/CSV.
- Testes automatizados.
- Google Apps Script V3 atual.
- Instruções da versão 12.4.0.
- Documento da integração do catálogo, ainda útil para continuidade.

## Como executar

```bash
npm install
npm test
npm run dev
```

Para gerar a publicação:

```bash
npm run build
```
