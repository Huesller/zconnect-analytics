import React, { useState } from "react";
import { Flame, Search, Filter } from "lucide-react";
export default function ProductIntelligenceView({ searched = [], hot = [], quoted = [], missing = [], stock = [], onOpenSearched, onOpenHot, onOpenQuoted, onOpenMissing, onOpenSearchTerm, onOpenStock, EmptyState }) {
  const [tab, setTab] = useState("searched");
  const [stockFilter, setStockFilter] = useState("all");
  const [stockQuery, setStockQuery] = useState("");
  const tabs = [
    ["searched", "Pesquisas confirmadas", searched.length],
    ["hot", "Produtos acessados", hot.length],
    ["quoted", "Mais cotados", quoted.length],
    ["stock", "Demanda x estoque", stock.length],
    ["missing", "Não encontrados", missing.length]
  ];
  const sourceRows = tab === "searched" ? searched : tab === "hot" ? hot : tab === "quoted" ? quoted : tab === "stock" ? stock : missing;
  const rows = tab === "stock" ? sourceRows.filter((row) => (stockFilter === "all" || row.signalKey === stockFilter) && (!stockQuery.trim() || row._search.includes(stockQuery.trim().toLowerCase()))) : sourceRows;
  function splitLabel(label) {
    const text = String(label || "");
    const index = text.indexOf(" - ");
    return index < 0 ? { code: "-", name: text || "-" } : { code: text.slice(0, index), name: text.slice(index + 3) };
  }
  return <article className="panel product-intelligence">
    <div className="panel-head"><div><h2><Flame size={18}/> Inteligência de produtos</h2><p>Buscas confirmadas ficam separadas das interações reais com cada produto.</p></div><button type="button" className="refresh" onClick={tab === "searched" ? onOpenSearched : tab === "hot" ? onOpenHot : tab === "quoted" ? onOpenQuoted : tab === "missing" ? onOpenMissing : undefined} disabled={tab === "stock"}>Abrir relatório completo</button></div>
    <nav className="product-tabs">{tabs.map(([key, label, count]) => <button type="button" key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><span>{label}</span><b>{count}</b></button>)}</nav>
    {tab === "stock" ? <div className="demand-filterbar"><label><Search size={14}/> Buscar<input value={stockQuery} onChange={(event) => setStockQuery(event.target.value)} placeholder="código, produto ou marca"/></label><label><Filter size={14}/> Prioridade<select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}><option value="all">Todas</option><option value="unavailable">Procura sem disponibilidade</option><option value="priority">Reposição prioritária</option><option value="pressure">Estoque sob pressão</option><option value="restocked">Estoque normalizado</option><option value="normal">Demanda normal</option></select></label></div> : null}
    <div className="product-readable-table">
      <div className="product-readable-head"><span>Produto / termo</span><span>{["searched", "missing"].includes(tab) ? "Ocorrências" : "Aberturas"}</span><span>{tab === "stock" ? "Estoque" : ["searched", "missing"].includes(tab) ? "Empresas" : "Carrinhos"}</span><span>{tab === "stock" ? "Disponível" : ["searched", "missing"].includes(tab) ? "Consultores" : "Cotações"}</span><span>Sinal</span></div>
      {rows.slice(0, 50).map((row, index) => {
        const isSearchTerm = ["searched", "missing"].includes(tab);
        const label = isSearchTerm ? row.search : tab === "stock" ? `${row.productCode} - ${row.productName}` : row.product;
        const product = splitLabel(label);
        const first = isSearchTerm ? row.count : tab === "stock" ? row.demandScore : row.views;
        const second = isSearchTerm ? row.companies : tab === "stock" ? row.stockQty : row.carts;
        const third = isSearchTerm ? row.consultants : tab === "stock" ? row.availableQty : row.quotes;
        const signal = isSearchTerm ? (tab === "missing" ? "Sem resultado" : "Busca confirmada") : tab === "stock" ? row.signal : `${row.score || 0} pts`;
        const clickable = tab === "stock" || isSearchTerm;
        const openRow = () => tab === "stock" ? onOpenStock?.(row) : onOpenSearchTerm?.(row, tab === "missing");
        return <div className={`product-readable-row ${clickable ? "clickable-demand" : ""}`} role={clickable ? "button" : undefined} tabIndex={clickable ? 0 : undefined} onClick={clickable ? openRow : undefined} onKeyDown={clickable ? (event) => { if (event.key === "Enter") openRow(); } : undefined} key={row.id || `${label}-${index}`}><span><b>{product.code}</b><small>{product.name}</small></span><strong>{first || 0}</strong><strong>{second || 0}</strong><strong>{third || 0}</strong><em>{signal}</em></div>;
      })}
      {!rows.length ? <EmptyState message="Sem dados para esta leitura no período."/> : null}
    </div>
  </article>;
}

