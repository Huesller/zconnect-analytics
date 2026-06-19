# Z Connect Analytics V5

Painel online funcional para acompanhar conversão do catálogo.

## Como rodar

```bash
npm install
npm run dev
```

## Como publicar na Vercel

1. Criar um repositório novo, exemplo: `zconnect-analytics`
2. Subir este projeto
3. Importar na Vercel
4. Build Command: `npm run build`
5. Output Directory: `dist`

## Fonte dos dados

O painel tenta ler a URL do Google Apps Script:

https://script.google.com/macros/s/AKfycbxcISxjVLPj5mBz0oem-5FrDjL0fOf2NtX6Ry5prry2AIWce5Tsn2NwRinB2tQKMs0T/exec?mode=events

Se o Apps Script ainda não tiver `doGet`, o painel mostra dados de exemplo.
