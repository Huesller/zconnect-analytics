import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search,
  Eye,
  ShoppingCart,
  Send,
  TrendingUp,
  Trophy,
  Users,
  Package,
  Clock,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  CalendarDays,
  Building2,
  UserCheck,
  XCircle,
  ListChecks
} from "lucide-react";
import "./styles.css";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxcISxjVLPj5mBz0oem-5FrDjL0fOf2NtX6Ry5prry2AIWce5Tsn2NwRinB2tQKMs0T/exec";

const SAMPLE_EVENTS = [
  {
    createdAt: "2026-06-19T08:10:00.000Z",
    event: "search",
    consultant: "ney",
    companyName: "Auto Peças Silva",
    clientId: "zc_sample_001",
    query: "parachoque hb20"
  },
  {
    createdAt: "2026-06-19T08:11:00.000Z",
    event: "view_product",
    consultant: "ney",
    companyName: "Auto Peças Silva",
    clientId: "zc_sample_001",
    productCode: "503450",
    productName: "Alma Parachoque HB20",
    brand: "RETOV",
    price: 189.9
  },
  {
    createdAt: "2026-06-19T08:12:00.000Z",
    event: "add_to_cart",
    consultant: "ney",
    companyName: "Auto Peças Silva",
    clientId: "zc_sample_001",
    productCode: "503450",
    productName: "Alma Parachoque HB20",
    brand: "RETOV",
    price: 189.9,
    quantity: 2,
    total: 379.8
  },
  {
    createdAt: "2026-06-19T09:22:00.000Z",
    event: "search",
    consultant: "huesller",
    companyName: "Peças Brasil",
    clientId: "zc_sample_002",
    query: "grade gol"
  },
  {
    createdAt: "2026-06-19T09:23:00.000Z",
    event: "view_product",
    consultant: "huesller",
    companyName: "Peças Brasil",
    clientId: "zc_sample_002",
    productCode: "778899",
    productName: "Grade Gol G5/G6",
    brand: "Z AUTO",
    price: 95
  },
  {
    createdAt: "2026-06-19T09:25:00.000Z",
    event: "whatsapp_checkout",
    consultant: "huesller",
    companyName: "Peças Brasil",
    clientId: "zc_sample_002",
    productCode: "778899",
    productName: "Grade Gol G5/G6",
    brand: "Z AUTO",
    price: 95,
    quantity: 1,
    total: 95
  },
  {
    createdAt: "2026-06-19T10:12:00.000Z",
    event: "sem_resultado",
    consultant: "francisco",
    companyName: "Mega Auto Center",
    clientId: "zc_sample_003",
    query: "farol hb20 2024"
  }
].map((event, index) => ({ id: `sample-${index}`, ...event }));

const EVENT_LABELS = {
  search: "Busca",
  search_start: "Início busca",
  search_result: "Resultado busca",
  search_click: "Clique busca",
  search_no_result: "Sem resultado",
  sem_resultado: "Sem resultado",
  view_product: "Visualizou",
  favorite: "Favorito",
  add_to_cart: "Carrinho",
  whatsapp_checkout: "WhatsApp"
};

function normalizeConsultant(value) {
  const slug = String(value || "sem_consultor").toLowerCase().trim();
  if (slug === "ivoney") return "ney";
  return slug || "sem_consultor";
}

function normalizeCompany(value) {
  const company = String(value || "").trim();
  return company || "Empresa não informada";
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

function parseEvents(payload) {
  let rows = [];
  if (Array.isArray(payload)) rows = payload;
  if (payload && Array.isArray(payload.events)) rows = payload.events;
  if (payload && Array.isArray(payload.data)) rows = payload.data;

  return rows.map((row, index) => {
    if (Array.isArray(row)) {
      return {
        id: `row-${index}`,
        createdAt: row[0] || row[1] || new Date().toISOString(),
        event: row[1] || "",
        consultant: normalizeConsultant(row[2]),
        query: row[3] || "",
        productCode: row[4] || "",
        productName: row[5] || "",
        brand: row[6] || "",
        price: safeNumber(row[7]),
        quantity: safeNumber(row[8]),
        total: safeNumber(row[9]),
        page: row[10] || "",
        userAgent: row[11] || "",
        sessionId: row[12] || "",
        eventId: row[13] || "",
        clientId: row[14] || row[12] || "",
        companyName: normalizeCompany(row[15] || row[16] || row[17] || ""),
        searchTimeMs: safeNumber(row[18]),
        resultsCount: safeNumber(row[19])
      };
    }

    const companyName = normalizeCompany(readField(row, [
      "companyName",
      "empresa",
      "company",
      "cliente",
      "clientName",
      "nomeEmpresa"
    ]));

    return {
      id: row.id || `row-${index}`,
      createdAt: readField(row, ["createdAt", "date", "data", "timestamp"], new Date().toISOString()),
      event: readField(row, ["event", "acao", "type"], ""),
      consultant: normalizeConsultant(readField(row, ["consultor", "consultant", "consultant_slug"])),
      query: readField(row, ["query", "search_query", "busca"], ""),
      productCode: readField(row, ["productCode", "codigo", "product_code"], ""),
      productName: readField(row, ["productName", "descricao", "product_name"], ""),
      brand: readField(row, ["brand", "marca", "fabricante"], ""),
      price: safeNumber(readField(row, ["price", "preco"])),
      quantity: safeNumber(readField(row, ["quantity", "quantidade"])),
      total: safeNumber(readField(row, ["total", "cart_total"])),
      page: readField(row, ["page"], ""),
      userAgent: readField(row, ["userAgent"], ""),
      sessionId: readField(row, ["sessionId"], ""),
      eventId: readField(row, ["eventId"], ""),
      clientId: readField(row, ["clientId", "clienteId", "customerId"], readField(row, ["sessionId"], "")),
      companyName,
      searchTimeMs: safeNumber(readField(row, ["searchTimeMs", "search_time", "elapsedMs"])),
      resultsCount: safeNumber(readField(row, ["resultsCount", "results", "resultCount"]))
    };
  }).filter(e => e.event);
}

async function fetchEvents() {
  const url = `${SCRIPT_URL}?action=events&cache=${Date.now()}`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) throw new Error("Não foi possível carregar os eventos.");
  const text = await response.text();
  try {
    return parseEvents(JSON.parse(text));
  } catch {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    const rows = lines.slice(1).map(line => line.split(","));
    return parseEvents(rows);
  }
}

function isSameDay(dateLike, selected) {
  if (selected === "all") return true;
  const d = new Date(dateLike);
  const now = new Date();
  if (Number.isNaN(d.getTime())) return false;
  if (selected === "today") return d.toDateString() === now.toDateString();
  if (selected === "7d") {
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - 7);
    return d >= cutoff;
  }
  if (selected === "30d") {
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - 30);
    return d >= cutoff;
  }
  return true;
}

function countBy(items, keyFn) {
  const map = new Map();
  items.forEach(item => {
    const key = String(keyFn(item) || "").trim();
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].sort((a,b) => b[1] - a[1]);
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function percent(value) {
  return `${Number(value || 0).toFixed(1).replace(".", ",")}%`;
}

function dateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function clientKey(event) {
  return event.clientId || event.companyName || event.sessionId || "sem_cliente";
}

function eventTitle(event) {
  if (event.event === "search" || event.event === "sem_resultado" || event.event === "search_no_result") {
    return event.query || "Busca sem texto";
  }
  return [event.productCode, event.productName].filter(Boolean).join(" - ") || EVENT_LABELS[event.event] || event.event;
}

function App() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("Carregando eventos...");
  const [period, setPeriod] = useState("today");
  const [consultant, setConsultant] = useState("all");
  const [company, setCompany] = useState("all");
  const [activeClient, setActiveClient] = useState("all");
  const [usingSample, setUsingSample] = useState(false);

  async function load() {
    setStatus("Carregando eventos...");
    try {
      const data = await fetchEvents();
      if (!data.length) {
        setEvents(SAMPLE_EVENTS);
        setUsingSample(true);
        setStatus("Sem eventos reais ainda. Exibindo dados de exemplo.");
      } else {
        setEvents(data);
        setUsingSample(false);
        setStatus(`Eventos carregados: ${data.length}`);
      }
    } catch (err) {
      setEvents(SAMPLE_EVENTS);
      setUsingSample(true);
      setStatus("Não consegui ler a planilha ainda. Exibindo dados de exemplo.");
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  const consultants = useMemo(() => ["all", ...new Set(events.map(e => normalizeConsultant(e.consultant)))], [events]);

  const companies = useMemo(() => {
    const names = [...new Set(events.map(e => normalizeCompany(e.companyName)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    return ["all", ...names];
  }, [events]);

  const periodFiltered = useMemo(() => events.filter(e => isSameDay(e.createdAt, period)), [events, period]);

  const filtered = useMemo(() => periodFiltered.filter(e => {
    const okConsultant = consultant === "all" || normalizeConsultant(e.consultant) === consultant;
    const okCompany = company === "all" || normalizeCompany(e.companyName) === company;
    const okClient = activeClient === "all" || clientKey(e) === activeClient;
    return okConsultant && okCompany && okClient;
  }), [periodFiltered, consultant, company, activeClient]);

  const clientRows = useMemo(() => {
    const map = new Map();

    periodFiltered.forEach(event => {
      const key = clientKey(event);
      if (!map.has(key)) {
        map.set(key, {
          key,
          clientId: event.clientId || "",
          companyName: normalizeCompany(event.companyName),
          consultant: normalizeConsultant(event.consultant),
          searches: 0,
          views: 0,
          favorites: 0,
          carts: 0,
          whats: 0,
          noResult: 0,
          revenue: 0,
          lastAt: event.createdAt
        });
      }

      const row = map.get(key);
      row.companyName = normalizeCompany(event.companyName) !== "Empresa não informada" ? normalizeCompany(event.companyName) : row.companyName;
      row.consultant = normalizeConsultant(event.consultant) !== "sem_consultor" ? normalizeConsultant(event.consultant) : row.consultant;
      if (new Date(event.createdAt) > new Date(row.lastAt)) row.lastAt = event.createdAt;

      if (event.event === "search") row.searches++;
      if (event.event === "view_product") row.views++;
      if (event.event === "favorite") row.favorites++;
      if (event.event === "add_to_cart") row.carts++;
      if (event.event === "whatsapp_checkout") {
        row.whats++;
        row.revenue += event.total || event.price * (event.quantity || 1);
      }
      if (event.event === "sem_resultado" || event.event === "search_no_result") row.noResult++;
    });

    return [...map.values()].sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  }, [periodFiltered]);

  const kpis = useMemo(() => {
    const searches = filtered.filter(e => e.event === "search").length;
    const noResult = filtered.filter(e => e.event === "sem_resultado" || e.event === "search_no_result").length;
    const views = filtered.filter(e => e.event === "view_product").length;
    const favorites = filtered.filter(e => e.event === "favorite").length;
    const carts = filtered.filter(e => e.event === "add_to_cart").length;
    const whats = filtered.filter(e => e.event === "whatsapp_checkout").length;
    const revenue = filtered.filter(e => e.event === "whatsapp_checkout").reduce((sum,e) => sum + (e.total || e.price * (e.quantity || 1)), 0);
    const clients = new Set(filtered.map(clientKey)).size;
    const companiesCount = new Set(filtered.map(e => normalizeCompany(e.companyName))).size;
    return {
      searches,
      noResult,
      views,
      favorites,
      carts,
      whats,
      revenue,
      clients,
      companiesCount,
      conversion: searches ? (whats / searches) * 100 : 0,
      cartConversion: carts ? (whats / carts) * 100 : 0,
      ticket: whats ? revenue / whats : 0
    };
  }, [filtered]);

  const consultantRank = useMemo(() => countBy(filtered.filter(e => e.event === "whatsapp_checkout"), e => normalizeConsultant(e.consultant)), [filtered]);
  const companyRank = useMemo(() => countBy(filtered, e => normalizeCompany(e.companyName)), [filtered]);
  const companyCheckoutRank = useMemo(() => countBy(filtered.filter(e => e.event === "whatsapp_checkout"), e => normalizeCompany(e.companyName)), [filtered]);
  const productRank = useMemo(() => countBy(filtered.filter(e => e.event === "whatsapp_checkout"), e => [e.productCode, e.productName].filter(Boolean).join(" - ")), [filtered]);
  const cartAbandonRows = useMemo(() => {
    const cartMap = new Map();
    const checkoutMap = new Map();

    filtered.forEach(e => {
      const key = `${clientKey(e)}::${e.productCode || e.productName || "produto"}`;
      if (e.event === "add_to_cart") {
        const current = cartMap.get(key) || { event: e, count: 0 };
        current.count += 1;
        if (new Date(e.createdAt) > new Date(current.event.createdAt)) current.event = e;
        cartMap.set(key, current);
      }
      if (e.event === "whatsapp_checkout") checkoutMap.set(key, true);
    });

    return [...cartMap.values()]
      .filter(row => !checkoutMap.has(`${clientKey(row.event)}::${row.event.productCode || row.event.productName || "produto"}`))
      .sort((a, b) => new Date(b.event.createdAt) - new Date(a.event.createdAt))
      .slice(0, 10)
      .map(row => row.event);
  }, [filtered]);

  const searchRank = useMemo(() => countBy(filtered.filter(e => e.event === "search"), e => e.query?.toLowerCase().trim()), [filtered]);
  const noResultRank = useMemo(() => countBy(filtered.filter(e => e.event === "sem_resultado" || e.event === "search_no_result"), e => e.query?.toLowerCase().trim()), [filtered]);
  const brandRank = useMemo(() => countBy(filtered.filter(e => e.event === "whatsapp_checkout"), e => e.brand), [filtered]);

  const opportunityRows = useMemo(() => {
    const byClientQuery = new Map();
    const rows = [];

    filtered.forEach(event => {
      const baseKey = clientKey(event);
      if ((event.event === "sem_resultado" || event.event === "search_no_result") && event.query) {
        const key = `${baseKey}::missing::${String(event.query).toLowerCase().trim()}`;
        const item = byClientQuery.get(key) || {
          type: "Sem resultado",
          companyName: normalizeCompany(event.companyName),
          consultant: normalizeConsultant(event.consultant),
          text: event.query,
          count: 0,
          lastAt: event.createdAt,
          priority: 85
        };
        item.count += 1;
        if (new Date(event.createdAt) > new Date(item.lastAt)) item.lastAt = event.createdAt;
        byClientQuery.set(key, item);
      }

      if (event.event === "search" && event.query) {
        const key = `${baseKey}::search::${String(event.query).toLowerCase().trim()}`;
        const item = byClientQuery.get(key) || {
          type: "Busca recorrente",
          companyName: normalizeCompany(event.companyName),
          consultant: normalizeConsultant(event.consultant),
          text: event.query,
          count: 0,
          lastAt: event.createdAt,
          priority: 45
        };
        item.count += 1;
        if (new Date(event.createdAt) > new Date(item.lastAt)) item.lastAt = event.createdAt;
        byClientQuery.set(key, item);
      }
    });

    byClientQuery.forEach(item => {
      if (item.type === "Sem resultado" || item.count >= 2) rows.push(item);
    });

    cartAbandonRows.forEach(event => {
      rows.push({
        type: "Carrinho abandonado",
        companyName: normalizeCompany(event.companyName),
        consultant: normalizeConsultant(event.consultant),
        text: eventTitle(event),
        count: 1,
        lastAt: event.createdAt,
        priority: 95
      });
    });

    return rows
      .sort((a, b) => (b.priority + b.count * 6 + new Date(b.lastAt).getTime() / 1e13) - (a.priority + a.count * 6 + new Date(a.lastAt).getTime() / 1e13))
      .slice(0, 12);
  }, [filtered, cartAbandonRows]);

  const journey = useMemo(() => {
    const selectedKey = activeClient !== "all" ? activeClient : (clientRows[0]?.key || "all");
    if (selectedKey === "all") return [];
    return periodFiltered
      .filter(e => clientKey(e) === selectedKey)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30);
  }, [activeClient, clientRows, periodFiltered]);

  const topConsultant = consultantRank[0];
  const topProduct = productRank[0];
  const topCompany = companyCheckoutRank[0] || companyRank[0];
  const topMissing = noResultRank[0];

  function exportCsv() {
    const header = [
      "createdAt",
      "event",
      "consultant",
      "companyName",
      "clientId",
      "query",
      "productCode",
      "productName",
      "brand",
      "price",
      "quantity",
      "total",
      "sessionId"
    ];
    const rows = filtered.map(e => header.map(key => `"${String(e[key] ?? "").replace(/"/g, '""')}"`).join(";"));
    const csv = [header.join(";"), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zconnect-analytics-v83-${period}-${consultant}-${company}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const funnel = [
    ["Busca", kpis.searches],
    ["Visualizou", kpis.views],
    ["Favorito", kpis.favorites],
    ["Carrinho", kpis.carts],
    ["WhatsApp", kpis.whats]
  ];

  return (
    <main className="app">
      <section className="hero">
        <div>
          <span className="eyebrow">Z Connect BI • Sprint V8.3</span>
          <h1>Analytics por Empresa</h1>
          <p>Jornada, carrinho abandonado, buscas e oportunidades por cliente sem login.</p>
        </div>
        <div className="hero-actions">
          <button onClick={load} className="refresh"><RefreshCw size={17}/> Atualizar</button>
          <button onClick={exportCsv} className="refresh"><Download size={17}/> CSV</button>
        </div>
      </section>

      <section className="toolbar compact-toolbar">
        <div className="status">{usingSample ? "⚠️ " : "🟢 "}{status}</div>
        <label><CalendarDays size={15}/> Período
          <select value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="today">Hoje</option>
            <option value="7d">7 dias</option>
            <option value="30d">30 dias</option>
            <option value="all">Tudo</option>
          </select>
        </label>
        <label><Filter size={15}/> Consultor
          <select value={consultant} onChange={e => setConsultant(e.target.value)}>
            {consultants.map(c => <option key={c} value={c}>{c === "all" ? "Todos" : c.toUpperCase()}</option>)}
          </select>
        </label>
        <label><Building2 size={15}/> Empresa
          <select value={company} onChange={e => { setCompany(e.target.value); setActiveClient("all"); }}>
            {companies.map(c => <option key={c} value={c}>{c === "all" ? "Todas" : c}</option>)}
          </select>
        </label>
      </section>

      <section className="kpi-grid">
        <Kpi icon={<Building2/>} label="Empresas" value={kpis.companiesCount}/>
        <Kpi icon={<Users/>} label="Clientes únicos" value={kpis.clients}/>
        <Kpi icon={<Search/>} label="Buscas" value={kpis.searches}/>
        <Kpi icon={<Eye/>} label="Vistos" value={kpis.views}/>
        <Kpi icon={<ShoppingCart/>} label="Carrinho" value={kpis.carts}/>
        <Kpi icon={<Send/>} label="WhatsApp" value={kpis.whats}/>
        <Kpi icon={<TrendingUp/>} label="Conversão" value={percent(kpis.conversion)}/>
        <Kpi icon={<Package/>} label="Ticket médio" value={money(kpis.ticket)}/>
      </section>

      <section className="spotlight-grid">
        <Spotlight title="Empresa destaque" value={topCompany?.[0] || "—"} sub={`${topCompany?.[1] || 0} ações`} icon={<Building2/>}/>
        <Spotlight title="Consultor campeão" value={topConsultant?.[0]?.toUpperCase() || "—"} sub={`${topConsultant?.[1] || 0} pedidos`} icon={<Trophy/>}/>
        <Spotlight title="Produto campeão" value={topProduct?.[0] || "—"} sub={`${topProduct?.[1] || 0} envios`} icon={<Package/>}/>
        <Spotlight title="Busca sem resultado" value={topMissing?.[0] || "—"} sub={`${topMissing?.[1] || 0} ocorrências`} icon={<AlertTriangle/>}/>
      </section>

      <section className="main-grid">
        <article className="panel wide">
          <div className="panel-head">
            <h2><Building2 size={18}/> Empresas identificadas</h2>
            <span>{clientRows.length} registros</span>
          </div>
          <div className="client-table">
            <div className="client-head">
              <span>Empresa</span><span>Consultor</span><span>Busca</span><span>Carrinho</span><span>WhatsApp</span><span>Última ação</span>
            </div>
            {clientRows.length ? clientRows.slice(0, 14).map(row => (
              <button
                key={row.key}
                className={`client-row ${activeClient === row.key ? "active" : ""}`}
                onClick={() => setActiveClient(activeClient === row.key ? "all" : row.key)}
                title={row.clientId || row.companyName}
              >
                <strong>{row.companyName}</strong>
                <span>{row.consultant.toUpperCase()}</span>
                <b>{row.searches}</b>
                <b>{row.carts}</b>
                <b>{row.whats}</b>
                <span>{dateTime(row.lastAt)}</span>
              </button>
            )) : <p className="empty">Nenhuma empresa no período.</p>}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2><ListChecks size={18}/> Jornada do cliente</h2>
            <span>{activeClient === "all" ? "clique em uma empresa" : "últimas ações"}</span>
          </div>
          <div className="timeline">
            {journey.length ? journey.map(event => (
              <div className="timeline-row" key={`${event.id}-${event.createdAt}`}>
                <i className={`dot ${event.event}`}/>
                <div>
                  <strong>{EVENT_LABELS[event.event] || event.event}</strong>
                  <span>{eventTitle(event)}</span>
                </div>
                <time>{dateTime(event.createdAt)}</time>
              </div>
            )) : <p className="empty">Selecione uma empresa para ver a jornada.</p>}
          </div>
        </article>
      </section>

      <section className="columns">
        <Rank title="Ranking empresas" rows={companyRank} empty="Sem empresas"/>
        <Rank title="Carrinho abandonado" customRows={cartAbandonRows} empty="Sem abandono identificado"/>
        <Rank title="Buscas mais feitas" rows={searchRank} empty="Sem buscas"/>
        <Rank title="Sem resultado" rows={noResultRank} empty="Sem buscas vazias"/>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2><AlertTriangle size={18}/> Oportunidades comerciais</h2>
          <span>prioridade por abandono, recorrência e sem resultado</span>
        </div>
        <div className="opportunity-grid">
          {opportunityRows.length ? opportunityRows.map((item, idx) => (
            <div className="opportunity-card" key={`${item.companyName}-${item.type}-${item.text}-${idx}`}>
              <div>
                <span className={`badge ${item.type === "Carrinho abandonado" ? "hot" : item.type === "Sem resultado" ? "warn" : ""}`}>{item.type}</span>
                <strong>{item.companyName}</strong>
                <small>{item.text}</small>
              </div>
              <aside>
                <b>{item.count}x</b>
                <time>{dateTime(item.lastAt)}</time>
                <em>{item.consultant.toUpperCase()}</em>
              </aside>
            </div>
          )) : <p className="empty">Nenhuma oportunidade detectada no período.</p>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2><TrendingUp size={18}/> Funil comercial</h2>
          <span>Busca → Visualização → Favorito → Carrinho → WhatsApp</span>
        </div>
        <div className="heat funnel-compact">
          {funnel.map(([label, value]) => {
            const max = Math.max(1, funnel[0][1]);
            return <div key={label} className="bar-row"><span>{label}</span><div><i style={{width:`${Math.max(4, Math.min(100, (value / max) * 100))}%`}}/></div><b>{value}</b></div>;
          })}
        </div>
      </section>

      <section className="columns two">
        <Rank title="Produtos mais enviados" rows={productRank} empty="Sem produtos enviados"/>
        <Rank title="Marcas no WhatsApp" rows={brandRank} empty="Sem marcas"/>
      </section>
    </main>
  );
}

function Kpi({ icon, label, value }) {
  return <article className="kpi"><div className="icon">{icon}</div><span>{label}</span><strong>{value}</strong></article>;
}

function Spotlight({ title, value, sub, icon }) {
  return <article className="spotlight"><div className="spot-icon">{icon}</div><span>{title}</span><strong>{value}</strong><p>{sub}</p></article>;
}

function Rank({ title, rows = [], customRows = null, empty }) {
  return <article className="panel">
    {title && <div className="panel-head"><h2>{title}</h2></div>}
    <div className="rank">
      {customRows ? (
        customRows.length ? customRows.map((event, idx) => (
          <div className="rank-row rich" key={`${event.id}-${idx}`}>
            <span className="pos warn">{idx + 1}</span>
            <strong title={`${event.companyName} • ${eventTitle(event)}`}>
              {normalizeCompany(event.companyName)}
              <small>{eventTitle(event)}</small>
            </strong>
            <b>{dateTime(event.createdAt)}</b>
          </div>
        )) : <p className="empty">{empty}</p>
      ) : (
        rows.length ? rows.slice(0, 10).map(([name, count], idx) => (
          <div className="rank-row" key={`${name}-${idx}`}>
            <span className="pos">{idx + 1}</span>
            <strong title={name}>{name || "—"}</strong>
            <b>{count}</b>
          </div>
        )) : <p className="empty">{empty}</p>
      )}
    </div>
  </article>;
}

createRoot(document.getElementById("root")).render(<App />);
