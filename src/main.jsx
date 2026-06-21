import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Download,
  Eraser,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  XCircle
} from "lucide-react";
import "./styles.css";

const ANALYTICS_API_URL =
  import.meta.env.VITE_ANALYTICS_API_URL ||
  "https://script.google.com/macros/s/AKfycbxcISxjVLPj5mBz0oem-5FrDjL0fOf2NtX6Ry5prry2AIWce5Tsn2NwRinB2tQKMs0T/exec";

const ADMIN_PIN = String(import.meta.env.VITE_ANALYTICS_ADMIN_PIN || "").trim();

const EVENT_ALIASES = {
  view_product: "product_open",
  search_no_result: "search_no_results",
  sem_resultado: "search_no_results",
  whatsapp_checkout: "whatsapp_quote",
  whatsapp_order: "whatsapp_quote"
};

const EVENT_LABELS = {
  page_view: "Acesso",
  search: "Busca",
  search_no_results: "Busca sem resultado",
  product_open: "Produto aberto",
  add_to_cart: "Adicionado",
  remove_from_cart: "Removido",
  clear_cart: "Carrinho limpo",
  whatsapp_quote: "Cotacao WhatsApp"
};

function normalizeEvent(value) {
  const event = String(value || "").trim();
  return EVENT_ALIASES[event] || event;
}

function normalizeConsultant(value) {
  const slug = String(value || "sem_consultor").toLowerCase().trim();
  if (slug === "ivoney") return "ney";
  return slug || "sem_consultor";
}

function normalizeCompany(value) {
  const company = String(value || "").trim();
  return company || "Empresa nao informada";
}

function safeNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  return Number(String(value || "0").replace(/\./g, "").replace(",", ".")) || 0;
}

function readField(row, keys, fallback = "") {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  return fallback;
}

function parseProducts(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function eventTimestamp(row) {
  return readField(row, ["timestamp", "createdAt", "date", "data"], new Date().toISOString());
}

function normalizeObjectEvent(row, index) {
  const event = normalizeEvent(readField(row, ["event", "acao", "type"], ""));
  const timestamp = eventTimestamp(row);
  const quantity = safeNumber(readField(row, ["quantity", "quantidade"]));
  const total = safeNumber(readField(row, ["total", "cart_total"]));
  const products = parseProducts(readField(row, ["products", "items", "productList"]));
  const cartTotal = safeNumber(readField(row, ["cartTotal", "cart_total", "total", "displayedPrice"], total));
  const itemsCount = safeNumber(readField(row, ["itemsCount", "itemCount", "quantity", "quantidade"], quantity));

  return {
    id: row.id || row.eventId || `row-${index}`,
    timestamp,
    createdAt: timestamp,
    event,
    consultant: normalizeConsultant(readField(row, ["consultant", "consultor", "consultant_slug"])),
    companyName: normalizeCompany(readField(row, ["companyName", "empresa", "company", "cliente", "clientName", "nomeEmpresa"])),
    clientId: readField(row, ["clientId", "clienteId", "customerId", "sessionId"], ""),
    sessionId: readField(row, ["sessionId"], ""),
    query: String(readField(row, ["query", "search_query", "busca"], "")).trim(),
    productCode: String(readField(row, ["productCode", "codigo", "product_code"], "")).trim(),
    productName: String(readField(row, ["productName", "descricao", "product_name"], "")).trim(),
    brand: String(readField(row, ["brand", "marca", "fabricante"], "")).trim(),
    price: safeNumber(readField(row, ["price", "preco"])),
    quantity,
    total,
    cartTotal,
    itemsCount,
    products,
    page: readField(row, ["page"], ""),
    referrer: readField(row, ["referrer"], ""),
    userAgent: readField(row, ["userAgent"], ""),
    searchTimeMs: safeNumber(readField(row, ["searchTimeMs", "search_time", "elapsedMs"])),
    resultsCount: safeNumber(readField(row, ["resultsCount", "results", "resultCount"]))
  };
}

function normalizeArrayEvent(row, index) {
  return normalizeObjectEvent({
    id: `row-${index}`,
    createdAt: row[0],
    timestamp: row[0],
    event: row[1],
    consultant: row[2],
    query: row[3],
    productCode: row[4],
    productName: row[5],
    brand: row[6],
    price: row[7],
    quantity: row[8],
    total: row[9],
    page: row[10],
    userAgent: row[11],
    sessionId: row[12],
    eventId: row[13],
    clientId: row[14],
    companyName: row[15],
    searchTimeMs: row[18],
    resultsCount: row[19]
  }, index);
}

function parseEvents(payload) {
  let rows = [];
  if (Array.isArray(payload)) rows = payload;
  if (payload && Array.isArray(payload.events)) rows = payload.events;
  if (payload && Array.isArray(payload.data)) rows = payload.data;

  return rows
    .map((row, index) => (Array.isArray(row) ? normalizeArrayEvent(row, index) : normalizeObjectEvent(row, index)))
    .filter((event) => event.event);
}

async function fetchEvents() {
  const url = `${ANALYTICS_API_URL}?action=events&cache=${Date.now()}`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) throw new Error("Nao foi possivel carregar os eventos.");
  const text = await response.text();
  try {
    return parseEvents(JSON.parse(text));
  } catch {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    const rows = lines.slice(1).map((line) => line.split(","));
    return parseEvents(rows);
  }
}

async function clearEvents(pin) {
  const body = JSON.stringify({ action: "clear_events", pin });

  try {
    const response = await fetch(ANALYTICS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "Falha ao limpar eventos.");
    return data;
  } catch (error) {
    const fallbackUrl = `${ANALYTICS_API_URL}?action=clear_events&pin=${encodeURIComponent(pin || "")}&cache=${Date.now()}`;
    const response = await fetch(fallbackUrl, { method: "GET" });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || error.message || "Falha ao limpar eventos.");
    return data;
  }
}

function isSamePeriod(dateLike, selected) {
  if (selected === "all") return true;
  const d = new Date(dateLike);
  const now = new Date();
  if (Number.isNaN(d.getTime())) return false;
  if (selected === "today") return d.toDateString() === now.toDateString();

  const days = selected === "7d" ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days);
  return d >= cutoff;
}

function countBy(items, keyFn, weightFn = () => 1) {
  const map = new Map();
  items.forEach((item) => {
    const key = String(keyFn(item) || "").trim();
    if (!key) return;
    map.set(key, (map.get(key) || 0) + safeNumber(weightFn(item) || 1));
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function productFromEvent(event) {
  return {
    productCode: event.productCode,
    productName: event.productName,
    brand: event.brand,
    quantity: event.quantity || 1,
    price: event.price,
    total: event.total
  };
}

function productLabel(product) {
  const code = product.productCode || product.code || "";
  const name = product.productName || product.name || product.description || "";
  return [code, name].filter(Boolean).join(" - ") || "Produto nao informado";
}

function quoteProducts(event) {
  const products = event.products.length ? event.products : [productFromEvent(event)];
  return products.filter((product) => productLabel(product) !== "Produto nao informado");
}

function productRank(events, options = {}) {
  const { expandQuotes = false, weightQuantity = false } = options;
  const map = new Map();

  events.forEach((event) => {
    const products = expandQuotes ? quoteProducts(event) : [productFromEvent(event)];
    products.forEach((product) => {
      const label = productLabel(product);
      if (!label || label === "Produto nao informado") return;
      const weight = weightQuantity ? Math.max(1, safeNumber(product.quantity || event.quantity || 1)) : 1;
      map.set(label, (map.get(label) || 0) + weight);
    });
  });

  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function localResetAllowed() {
  if (ADMIN_PIN) return true;
  const host = window.location.hostname;
  return import.meta.env.DEV || host === "localhost" || host === "127.0.0.1" || host === "";
}

function App() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("Carregando eventos reais...");
  const [period, setPeriod] = useState("today");
  const [consultant, setConsultant] = useState("all");
  const [company, setCompany] = useState("all");
  const [adminPin, setAdminPin] = useState("");
  const [resetStatus, setResetStatus] = useState("");

  async function load() {
    setStatus("Carregando eventos reais...");
    try {
      const data = await fetchEvents();
      setEvents(data);
      setStatus(data.length ? `Eventos carregados: ${data.length}` : "Nenhum evento salvo no periodo.");
    } catch (error) {
      setEvents([]);
      setStatus(error.message || "Nao consegui carregar os eventos.");
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const consultants = useMemo(() => {
    return ["all", ...new Set(events.map((event) => normalizeConsultant(event.consultant)))];
  }, [events]);

  const companies = useMemo(() => {
    const names = [...new Set(events.map((event) => normalizeCompany(event.companyName)))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    return ["all", ...names];
  }, [events]);

  const periodFiltered = useMemo(() => events.filter((event) => isSamePeriod(event.createdAt, period)), [events, period]);

  const filtered = useMemo(() => periodFiltered.filter((event) => {
    const okConsultant = consultant === "all" || normalizeConsultant(event.consultant) === consultant;
    const okCompany = company === "all" || normalizeCompany(event.companyName) === company;
    return okConsultant && okCompany;
  }), [periodFiltered, consultant, company]);

  const byType = useMemo(() => ({
    pageViews: filtered.filter((event) => event.event === "page_view"),
    searches: filtered.filter((event) => event.event === "search"),
    noResults: filtered.filter((event) => event.event === "search_no_results"),
    productOpen: filtered.filter((event) => event.event === "product_open"),
    added: filtered.filter((event) => event.event === "add_to_cart"),
    removed: filtered.filter((event) => event.event === "remove_from_cart"),
    cleared: filtered.filter((event) => event.event === "clear_cart"),
    quotes: filtered.filter((event) => event.event === "whatsapp_quote")
  }), [filtered]);

  const kpis = useMemo(() => ({
    pageViews: byType.pageViews.length,
    searches: byType.searches.length,
    noResults: byType.noResults.length,
    productOpen: byType.productOpen.length,
    added: byType.added.length,
    removed: byType.removed.length,
    cleared: byType.cleared.length,
    quotes: byType.quotes.length,
    quoteTotal: byType.quotes.reduce((sum, event) => sum + safeNumber(event.cartTotal || event.total), 0)
  }), [byType]);

  const companyActiveRank = useMemo(() => countBy(filtered, (event) => normalizeCompany(event.companyName)), [filtered]);
  const companySearchRank = useMemo(() => countBy(byType.searches, (event) => normalizeCompany(event.companyName)), [byType.searches]);
  const companyQuoteRank = useMemo(() => countBy(byType.quotes, (event) => normalizeCompany(event.companyName)), [byType.quotes]);

  const searchRank = useMemo(() => countBy(byType.searches, (event) => event.query.toLowerCase()), [byType.searches]);
  const noResultRank = useMemo(() => countBy(byType.noResults, (event) => event.query.toLowerCase()), [byType.noResults]);
  const searchByCompanyRank = useMemo(() => countBy(byType.searches, (event) => normalizeCompany(event.companyName)), [byType.searches]);

  const productOpenRank = useMemo(() => productRank(byType.productOpen), [byType.productOpen]);
  const productAddedRank = useMemo(() => productRank(byType.added, { weightQuantity: true }), [byType.added]);
  const productRemovedRank = useMemo(() => productRank(byType.removed, { weightQuantity: true }), [byType.removed]);
  const productQuotedRank = useMemo(() => productRank(byType.quotes, { expandQuotes: true, weightQuantity: true }), [byType.quotes]);

  const consultantAccessRank = useMemo(() => countBy(byType.pageViews, (event) => normalizeConsultant(event.consultant)), [byType.pageViews]);
  const consultantSearchRank = useMemo(() => countBy(byType.searches, (event) => normalizeConsultant(event.consultant)), [byType.searches]);
  const consultantQuoteRank = useMemo(() => countBy(byType.quotes, (event) => normalizeConsultant(event.consultant)), [byType.quotes]);
  const consultantValueRank = useMemo(() => countBy(byType.quotes, (event) => normalizeConsultant(event.consultant), (event) => event.cartTotal || event.total), [byType.quotes]);

  const funnel = [
    ["Acessos", kpis.pageViews],
    ["Buscas", kpis.searches],
    ["Produtos abertos", kpis.productOpen],
    ["Adicionados", kpis.added],
    ["Cotacoes WhatsApp", kpis.quotes]
  ];

  function exportCsv() {
    const header = [
      "timestamp",
      "event",
      "companyName",
      "consultant",
      "query",
      "productCode",
      "productName",
      "brand",
      "quantity",
      "price",
      "itemsCount",
      "cartTotal",
      "products"
    ];
    const rows = filtered.map((event) => header.map((key) => {
      const value = key === "products" ? JSON.stringify(event.products || []) : event[key];
      return `"${String(value ?? "").replace(/"/g, '""')}"`;
    }).join(";"));
    const csv = [header.join(";"), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zconnect-analytics-${period}-${consultant}-${company}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleReset() {
    setResetStatus("");

    if (!localResetAllowed()) {
      setResetStatus("Reset permitido somente com PIN configurado ou em ambiente local/dev.");
      return;
    }

    if (ADMIN_PIN && adminPin !== ADMIN_PIN) {
      setResetStatus("PIN invalido.");
      return;
    }

    const confirmed = window.confirm("Tem certeza que deseja apagar todos os dados de analytics?");
    if (!confirmed) return;

    try {
      setResetStatus("Limpando eventos...");
      await clearEvents(ADMIN_PIN ? adminPin : "");
      setEvents([]);
      setResetStatus("Dados limpos com sucesso.");
      setStatus("Nenhum evento salvo no periodo.");
      await load();
    } catch (error) {
      setResetStatus(error.message || "Nao foi possivel limpar os dados.");
    }
  }

  return (
    <main className="app">
      <section className="hero">
        <div>
          <span className="eyebrow">Z Connect Analytics</span>
          <h1>Analytics comercial diario</h1>
          <p>Leitura objetiva dos eventos do catalogo por empresa, busca, produto, consultor e cotacao.</p>
        </div>
        <div className="hero-actions">
          <button onClick={load} className="refresh"><RefreshCw size={17}/> Atualizar</button>
          <button onClick={exportCsv} className="refresh"><Download size={17}/> CSV</button>
        </div>
      </section>

      <section className="toolbar compact-toolbar">
        <div className="status">{status}</div>
        <label><CalendarDays size={15}/> Periodo
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="today">Hoje</option>
            <option value="7d">7 dias</option>
            <option value="30d">30 dias</option>
            <option value="all">Tudo</option>
          </select>
        </label>
        <label><Filter size={15}/> Consultor
          <select value={consultant} onChange={(event) => setConsultant(event.target.value)}>
            {consultants.map((item) => <option key={item} value={item}>{item === "all" ? "Todos" : item.toUpperCase()}</option>)}
          </select>
        </label>
        <label><Building2 size={15}/> Empresa
          <select value={company} onChange={(event) => setCompany(event.target.value)}>
            {companies.map((item) => <option key={item} value={item}>{item === "all" ? "Todas" : item}</option>)}
          </select>
        </label>
      </section>

      <SectionTitle title="Visao geral" subtitle="Resumo do periodo filtrado" />
      <section className="kpi-grid">
        <Kpi icon={<Users/>} label="Acessos" value={kpis.pageViews}/>
        <Kpi icon={<Search/>} label="Buscas" value={kpis.searches}/>
        <Kpi icon={<AlertTriangle/>} label="Sem resultado" value={kpis.noResults}/>
        <Kpi icon={<Eye/>} label="Produtos abertos" value={kpis.productOpen}/>
        <Kpi icon={<ShoppingCart/>} label="Adicionados" value={kpis.added}/>
        <Kpi icon={<XCircle/>} label="Removidos" value={kpis.removed}/>
        <Kpi icon={<Trash2/>} label="Carrinhos limpos" value={kpis.cleared}/>
        <Kpi icon={<Send/>} label="Cotacoes WhatsApp" value={kpis.quotes}/>
      </section>

      <SectionTitle title="Funil" subtitle="Do acesso ate a cotacao" />
      <section className="main-grid funnel-grid">
        <article className="panel">
          <div className="panel-head">
            <h2><TrendingUp size={18}/> Funil</h2>
            <span>Acesso ate cotacao</span>
          </div>
          <div className="heat funnel-compact">
            {funnel.map(([label, value]) => {
              const max = Math.max(1, funnel[0][1]);
              return <div key={label} className="bar-row"><span>{label}</span><div><i style={{width:`${Math.max(4, Math.min(100, (value / max) * 100))}%`}}/></div><b>{value}</b></div>;
            })}
          </div>
        </article>
        <ValueCard title="Valor cotado" value={money(kpis.quoteTotal)} sub={`${kpis.quotes} cotacoes WhatsApp no filtro atual`} icon={<Send/>}/>
      </section>

      <SectionTitle title="Empresas" subtitle="Quem mais movimenta o catalogo" />
      <section className="columns">
        <Rank title="Clientes mais ativos" rows={companyActiveRank} empty="Sem eventos"/>
        <Rank title="Clientes que mais pesquisaram" rows={companySearchRank} empty="Sem buscas"/>
        <Rank title="Clientes que mais enviaram cotacoes" rows={companyQuoteRank} empty="Sem cotacoes"/>
        <ValueCard title="Valor total cotado" value={money(kpis.quoteTotal)} sub={`${kpis.quotes} cotacoes WhatsApp`} icon={<Send/>}/>
      </section>

      <SectionTitle title="Buscas" subtitle="Demanda declarada e oportunidades sem resultado" />
      <section className="columns">
        <Rank title="Top buscas" rows={searchRank} empty="Sem buscas"/>
        <Rank title="Buscas sem resultado" rows={noResultRank} empty="Sem buscas sem resultado"/>
        <Rank title="Buscas por empresa" rows={searchByCompanyRank} empty="Sem buscas por empresa"/>
        <RecentEvents events={byType.searches.slice(-10).reverse()} />
      </section>

      <SectionTitle title="Produtos" subtitle="Interesse, carrinho e itens cotados" />
      <section className="columns">
        <Rank title="Mais abertos" rows={productOpenRank} empty="Sem produtos abertos"/>
        <Rank title="Mais adicionados" rows={productAddedRank} empty="Sem produtos adicionados"/>
        <Rank title="Mais removidos" rows={productRemovedRank} empty="Sem produtos removidos"/>
        <Rank title="Mais cotados" rows={productQuotedRank} empty="Sem produtos cotados"/>
      </section>

      <SectionTitle title="Consultores" subtitle="Origem comercial das interacoes" />
      <section className="columns">
        <Rank title="Acessos por consultor" rows={consultantAccessRank} empty="Sem acessos"/>
        <Rank title="Buscas por consultor" rows={consultantSearchRank} empty="Sem buscas"/>
        <Rank title="Cotacoes por consultor" rows={consultantQuoteRank} empty="Sem cotacoes"/>
        <Rank title="Valor total cotado" rows={consultantValueRank} empty="Sem valores" formatValue={money}/>
      </section>

      <SectionTitle title="Cotacoes WhatsApp" subtitle="Sinais mais proximos de venda" />
      <section className="columns">
        <ValueCard title="Cotacoes enviadas" value={kpis.quotes} sub={`Total estimado ${money(kpis.quoteTotal)}`} icon={<Send/>}/>
        <Rank title="Empresas que cotaram" rows={companyQuoteRank} empty="Sem cotacoes"/>
        <Rank title="Produtos cotados" rows={productQuotedRank} empty="Sem produtos cotados"/>
        <RecentEvents
          title="Cotacoes recentes"
          empty="Sem cotacoes recentes."
          events={byType.quotes.slice(-10).reverse()}
          detailFn={(event) => `${event.itemsCount || event.quantity || 0} itens - ${money(event.cartTotal || event.total)}`}
        />
      </section>

      <SectionTitle title="Administracao/reset" subtitle="Rotina de limpeza para testes" />
      <section className="admin-grid">
        <article className="panel admin-panel">
          <div className="panel-head">
            <h2><Eraser size={18}/> Reset de dados</h2>
            <span>Ambiente controlado</span>
          </div>
          <p className="admin-copy">Use apenas para limpar eventos de teste antes de iniciar uma nova rodada.</p>
          {ADMIN_PIN ? (
            <label className="admin-pin">PIN
              <input value={adminPin} onChange={(event) => setAdminPin(event.target.value)} type="password" placeholder="PIN admin" />
            </label>
          ) : null}
          <button className="danger-button" type="button" onClick={handleReset} disabled={!localResetAllowed()}>
            Limpar dados de teste
          </button>
          {resetStatus ? <small className="admin-status">{resetStatus}</small> : null}
          {!ADMIN_PIN ? <small className="admin-status">Sem PIN configurado: reset liberado somente em local/dev.</small> : null}
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2><UserCheck size={18}/> Eventos recentes</h2>
          <span>{filtered.length} eventos filtrados</span>
        </div>
        <div className="event-table">
          <div className="event-head">
            <span>Hora</span><span>Evento</span><span>Empresa</span><span>Consultor</span><span>Detalhe</span>
          </div>
          {filtered.slice(-20).reverse().map((event) => (
            <div className="event-row" key={`${event.id}-${event.timestamp}`}>
              <span>{dateTime(event.timestamp)}</span>
              <strong>{EVENT_LABELS[event.event] || event.event}</strong>
              <span>{event.companyName}</span>
              <span>{event.consultant.toUpperCase()}</span>
              <span title={event.query || productLabel(productFromEvent(event))}>{event.query || productLabel(productFromEvent(event))}</span>
            </div>
          ))}
          {!filtered.length ? <p className="empty">Nenhum evento para os filtros atuais.</p> : null}
        </div>
      </section>
    </main>
  );
}

function SectionTitle({ title, subtitle }) {
  return <div className="section-title"><h2>{title}</h2>{subtitle ? <span>{subtitle}</span> : null}</div>;
}

function Kpi({ icon, label, value }) {
  return <article className="kpi"><div className="icon">{icon}</div><span>{label}</span><strong>{value}</strong></article>;
}

function ValueCard({ title, value, sub, icon }) {
  return <article className="spotlight"><div className="spot-icon">{icon}</div><span>{title}</span><strong>{value}</strong><p>{sub}</p></article>;
}

function Rank({ title, rows = [], empty, formatValue = (value) => value }) {
  return <article className="panel">
    <div className="panel-head"><h2>{title}</h2></div>
    <div className="rank">
      {rows.length ? rows.slice(0, 10).map(([name, count], index) => (
        <div className="rank-row" key={`${name}-${index}`}>
          <span className="pos">{index + 1}</span>
          <strong title={name}>{name || "-"}</strong>
          <b>{formatValue(count)}</b>
        </div>
      )) : <p className="empty">{empty}</p>}
    </div>
  </article>;
}

function RecentEvents({ events, title = "Buscas recentes", empty = "Sem buscas recentes.", detailFn = (event) => event.query || "Busca sem texto" }) {
  return <article className="panel">
    <div className="panel-head"><h2>{title}</h2></div>
    <div className="timeline">
      {events.length ? events.map((event) => (
        <div className="timeline-row" key={`${event.id}-${event.timestamp}`}>
          <i className={`dot ${event.event}`}/>
          <div>
            <strong>{event.companyName}</strong>
            <span>{detailFn(event)}</span>
          </div>
          <time>{dateTime(event.timestamp)}</time>
        </div>
      )) : <p className="empty">{empty}</p>}
    </div>
  </article>;
}

createRoot(document.getElementById("root")).render(<App />);
