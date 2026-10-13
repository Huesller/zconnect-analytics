import React, { useState } from "react";
import { AlertTriangle, Building2, CalendarDays, Flame, Filter, RefreshCw, Search, ShoppingCart } from "lucide-react";
import { StatGrid } from "../../components/StatGrid.jsx";
function DemandStockTable({ rows = [], onOpen, EmptyState }) {
  const [query, setQuery] = useState("");
  const [signal, setSignal] = useState("all");
  const visibleRows = rows.filter((row) => (signal === "all" || row.signalKey === signal) && (!query.trim() || row._search.includes(query.trim().toLowerCase())));
  return (
    <article className="panel demand-stock-panel">
      <div className="panel-head"><div><h2><Flame size={18}/> Demanda x estoque</h2><p>Filtre por prioridade e clique no item para ver todos os clientes interessados.</p></div><span>{visibleRows.length} produto(s)</span></div>
      <div className="demand-filterbar"><label><Search size={14}/> Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="código, produto ou marca"/></label><label><Filter size={14}/> Prioridade<select value={signal} onChange={(event) => setSignal(event.target.value)}><option value="all">Todas</option><option value="unavailable">Procura sem disponibilidade</option><option value="priority">Reposição prioritária</option><option value="pressure">Estoque sob pressão</option><option value="restocked">Estoque normalizado</option><option value="normal">Demanda normal</option><option value="no_snapshot">Sem snapshot</option></select></label></div>
      <div className="demand-stock-table">
        <div className="demand-stock-head"><span>Produto</span><span>Demanda</span><span>Estoque</span><span>Reservado</span><span>Disponível</span><span>Sinal</span></div>
        {visibleRows.length ? visibleRows.map((row) => <button type="button" key={row.id} className="demand-stock-row demand-stock-button" onClick={() => onOpen?.(row)}><span><strong>{row.productCode}</strong><small>{row.productName}</small><small>{row.clientsCount} cliente(s) interessado(s)</small></span><b>{row.demandScore}</b><b>{row.stockQty}</b><b>{row.reservedQty}</b><b>{row.availableQty}</b><span className={`stock-signal ${["priority","unavailable"].includes(row.signalKey) ? "critical" : row.signalKey === "pressure" ? "warning" : row.signalKey === "restocked" ? "restocked" : "normal"}`}>{row.signal}</span></button>) : <EmptyState message="Nenhum produto corresponde aos filtros."/>}
      </div>
    </article>
  );
}

export default function CatalogHealthView({ health = {}, demandRows = [], onNavigate, onOpenDemand, safeNumber, dateTime, EmptyState }) {
  const latest = health.latest;
  const snapshots = health.snapshots || [];
  const age = latest ? Date.now() - new Date(latest.createdAt).getTime() : Infinity;
  const freshness = !latest ? "Aguardando integração" : latest.status === "error" ? "Falha" : age > 36 * 60 * 60 * 1000 ? "Atrasado" : "Atualizado";
  return (
    <div className="view-stack catalog-view">
      <StatGrid items={[
        { icon: <RefreshCw/>, label: "Situação da atualização", value: freshness, emphasis: freshness === "Atualizado" },
        { icon: <Building2/>, label: "Produtos monitorados", value: safeNumber(latest?.productCount) },
        { icon: <ShoppingCart/>, label: "Com estoque", value: safeNumber(latest?.inStockCount) },
        { icon: <AlertTriangle/>, label: "Sem imagem", value: safeNumber(latest?.missingImageCount) }
      ]}/>
      <section className="catalog-grid">
        <article className="panel catalog-summary">
          <div className="panel-head"><div><h2><RefreshCw size={18}/> Atualização diária</h2><p>O catálogo envia o estoque automaticamente após cada publicação na Vercel.</p></div><span className={`health-badge health-${freshness.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{freshness}</span></div>
          {latest ? <><div className="catalog-facts"><div><span>Última execução</span><strong>{dateTime(latest.createdAt)}</strong></div><div><span>Duração</span><strong>{safeNumber(latest.durationMs)} ms</strong></div><div><span>Novos</span><strong>{safeNumber(latest.newCount)}</strong></div><div><span>Removidos</span><strong>{safeNumber(latest.removedCount)}</strong></div><div><span>Estoques alterados</span><strong>{safeNumber(latest.changedStockCount)}</strong></div><div><span>Sem estoque</span><strong>{safeNumber(latest.outOfStockCount)}</strong></div></div><button type="button" className="refresh catalog-action" onClick={() => onNavigate?.("products")}>Analisar produtos e demanda →</button></> : <div className="catalog-integration-empty"><AlertTriangle size={20}/><div><strong>Integração pronta, aguardando a próxima publicação</strong><p>Configure o mesmo <code>CATALOG_SYNC_TOKEN</code> nos dois projetos e faça um novo deploy do Catálogo. O primeiro snapshot será enviado sozinho.</p></div></div>}
        </article>
        <article className="panel snapshot-history">
          <div className="panel-head"><div><h2><CalendarDays size={18}/> Histórico</h2><p>Últimas execuções recebidas.</p></div><span>{snapshots.length}</span></div>
          <div>{snapshots.slice(0, 8).map((item) => <div className="snapshot-row" key={item.snapshotId}><i className={item.status === "error" ? "error" : "success"}/><span><strong>{dateTime(item.createdAt)}</strong><small>{item.source || "Atualização diária"}</small></span><b>{safeNumber(item.productCount)} produtos</b></div>)}{!snapshots.length ? <p className="empty">Sem execuções registradas.</p> : null}</div>
        </article>
      </section>
      <DemandStockTable rows={demandRows} onOpen={onOpenDemand} EmptyState={EmptyState}/>
    </div>
  );
}

