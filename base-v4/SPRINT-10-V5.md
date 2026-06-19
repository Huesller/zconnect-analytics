# Sprint 10 — Correção consultores e pipeline scrape

## Corrigido
- `?consultor=ney` agora resolve Ney.
- `?consultor=ivoney` continua compatível.
- `?consultor=francisco` agora resolve Francisco.
- `?consultor=representante` continua compatível.
- Fallback do front-end agora possui todos os slugs oficiais.
- Gerador `npm run update-catalog` passa a preservar aliases vindos do legado (`key` e `id`).
- `public/data/consultants.json` atualizado.
- `dist/data/consultants.json` atualizado para evitar resíduo em deploy estático.

## Importante
Depois de rodar scraper/estoque, rode:
`npm run update-catalog`
`npm run build`
