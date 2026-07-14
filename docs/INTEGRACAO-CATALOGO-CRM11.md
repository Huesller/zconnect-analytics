# Integração diária do catálogo com o CRM 11

O Analytics já recebe snapshots do catálogo no Apps Script. Conecte a chamada ao final do processo diário que já atualiza os produtos. Esta integração é somente leitura operacional: não muda preço, desconto ou condição comercial.

## Payload esperado

```json
{
  "action": "catalog_snapshot",
  "syncToken": "SEU_CATALOG_SYNC_TOKEN",
  "source": "atualizacao-npm-diaria",
  "status": "success",
  "durationMs": 4200,
  "products": [
    {
      "productCode": "655030",
      "productName": "ALMA PARACHOQUE DIANTEIRO",
      "brand": "Z AUTO",
      "stockQty": 2,
      "hasImage": true
    }
  ]
}
```

Envie para a URL `/exec` do Apps Script com `POST` e `Content-Type: text/plain;charset=utf-8`.

## Exemplo para o processo Node do catálogo

```js
export async function notifyAnalyticsCatalog(products, durationMs) {
  const endpoint = process.env.ANALYTICS_APPS_SCRIPT_URL;
  const syncToken = process.env.CATALOG_SYNC_TOKEN;
  if (!endpoint || !syncToken) return;

  const snapshotProducts = products.map((product) => ({
    productCode: product.codigo || product.productCode,
    productName: product.descricao || product.productName,
    brand: product.marca || product.brand,
    stockQty: Number(product.estoque ?? product.stockQty ?? 0),
    hasImage: Boolean(product.imagem || product.image || product.imageUrl)
  }));

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "catalog_snapshot",
      syncToken,
      source: "atualizacao-npm-diaria",
      status: "success",
      durationMs,
      products: snapshotProducts
    })
  });

  const result = await response.json();
  if (!result.ok) throw new Error(`Falha ao registrar snapshot: ${result.error}`);
}
```

Chame `notifyAnalyticsCatalog(produtosAtualizados, duracao)` somente depois que a atualização diária terminar com sucesso. Em caso de falha, envie o mesmo corpo com `status: "error"`, `products: []` e `errorMessage`.

## Variáveis no projeto do catálogo

- `ANALYTICS_APPS_SCRIPT_URL`: URL pública `/exec` do Apps Script.
- `CATALOG_SYNC_TOKEN`: mesmo valor das propriedades do Apps Script.

Essas variáveis devem ficar no servidor/Vercel, nunca em arquivos JavaScript entregues ao navegador.
