# Sprint V7

## Catálogo Premium
- Analytics comercial real com payload V7.
- Consultor normalizado, incluindo alias `ivoney -> ney`.
- Eventos: search, sem_resultado, view_product, favorite, add_to_cart, whatsapp_checkout.
- Checkout envia resumo dos itens para Analytics.
- Fila local com retry e envio em background.

## Analytics
- Apps Script corrigido para `?action=events` e `?action=track`.
- Compatibilidade com `consultor` e `consultant`.
- Dashboard com atualização automática a cada 30 segundos.
- KPI de favoritos.
- Funil comercial.
- Exportação CSV.
- Mantida compatibilidade Github + Vercel.
