# Z Connect

## Comandos principais

```powershell
npm install
npm --prefix .\legacy\CatalogoPremium install
npm run update-fast
npm run dev
```

## Atualização

- `npm run update-fast`: gera o catálogo limpo a partir do último snapshot já existente. É o comando rápido para abrir a vitrine sem esperar scrape.
- `npm run update-daily`: roda a atualização diária de preço/estoque no legado e depois gera o catálogo limpo.
- `npm run rebuild-catalog`: rebuild completo do legado e depois gera o catálogo limpo.
- `npm run dev`: sobe o front local.
- `npm run build`: build do front sem forçar atualização antes.

## Fluxo recomendado

### Abrir rápido em pasta nova
```powershell
npm install
npm --prefix .\legacy\CatalogoPremium install
npm run update-fast
npm run dev
```

### Atualização diária real
```powershell
npm run update-daily
npm run dev
```

### Rebuild completo
```powershell
npm run rebuild-catalog
npm run dev
```
