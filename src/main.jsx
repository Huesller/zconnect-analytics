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
  CalendarDays
} from "lucide-react";
import "./styles.css";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxcISxjVLPj5mBz0oem-5FrDjL0fOf2NtX6Ry5prry2AIWce5Tsn2NwRinB2tQKMs0T/exec";

const SAMPLE_EVENTS = [
  ["2026-06-19T08:10:00.000Z","search","ney","parachoque gol","","","","","","","",""],
  ["2026-06-19T08:11:00.000Z","view_product","ney","","503450","Grade Gol G5/G6","RETOV","189.9","","","",""],
  ["2026-06-19T08:12:00.000Z","add_to_cart","ney","","503450","Grade Gol G5/G6","RETOV","189.9","2","","",""],
  ["2026-06-19T08:13:00.000Z","whatsapp_checkout","ney","","503450","Grade Gol G5/G6","RETOV","189.9","2","379.8","",""],
  ["2026-06-19T09:22:00.000Z","search","huesller","farol polo","","","","","","","",""],
  ["2026-06-19T09:24:00.000Z","search_no_result","huesller","parachoque nivus","","","","","","","",""],
  ["2026-06-19T10:00:00.000Z","whatsapp_checkout","francisco","","567890","Farol Principal","TYC","420","1","420","",""],
  ["2026-06-19T10:30:00.000Z","search","representante","grade compass","","","","","","","",""],
  ["2026-06-19T11:12:00.000Z","search_no_result","representante","farol hb20 2024","","","","","","","",""],
].map((r, idx) => ({
  id: `sample-${idx}`,
  createdAt: r[0],
  event: r[1],
  consultant: r[2],
  query: r[3],
  productCode: r[4],
  productName: r[5],
  brand: r[6],
  price: Number(r[7] || 0),
  quantity: Number(r[8] || 0),
  total: Number(r[9] || 0)
}));

function normalizeConsultant(value) {
  const slug = String(value || "sem_consultor").toLowerCase().trim();
  if (slug === "ivoney") return "ney";
  return slug || "sem_consultor";
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
        price: Number(String(row[7] || "0").replace(",", ".")) || 0,
        quantity: Number(row[8] || 0),
        total: Number(String(row[9] || "0").replace(",", ".")) || 0,
        page: row[10] || "",
        userAgent: row[11] || ""
      };
    }
    return {
      id: row.id || `row-${index}`,
      createdAt: row.createdAt || row.date || row.data || row.timestamp || new Date().toISOString(),
      event: row.event || row.acao || row.type || "",
      consultant: normalizeConsultant(row.consultor || row.consultant || row.consultant_slug),
      query: row.query || row.search_query || "",
      productCode: row.productCode || row.codigo || row.product_code || "",
      productName: row.productName || row.descricao || row.product_name || "",
      brand: row.brand || row.marca || "",
      price: Number(row.price || row.preco || 0),
      quantity: Number(row.quantity || row.quantidade || 0),
      total: Number(row.total || row.cart_total || 0),
      page: row.page || "",
      userAgent: row.userAgent || ""
    };
  }).filter(e => e.event);
}

async function fetchEvents() {
  const url = `${SCRIPT_URL}?mode=events&cache=${Date.now()}`;
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
    const key = keyFn(item);
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

function App() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("Carregando eventos...");
  const [period, setPeriod] = useState("today");
  const [consultant, setConsultant] = useState("all");
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

  useEffect(() => { load(); }, []);

  const consultants = useMemo(() => ["all", ...new Set(events.map(e => normalizeConsultant(e.consultant)))], [events]);

  const filtered = useMemo(() => events.filter(e => {
    const okPeriod = isSameDay(e.createdAt, period);
    const okConsultant = consultant === "all" || normalizeConsultant(e.consultant) === consultant;
    return okPeriod && okConsultant;
  }), [events, period, consultant]);

  const kpis = useMemo(() => {
    const searches = filtered.filter(e => e.event === "search").length;
    const noResult = filtered.filter(e => e.event === "search_no_result").length;
    const views = filtered.filter(e => e.event === "view_product").length;
    const carts = filtered.filter(e => e.event === "add_to_cart").length;
    const whats = filtered.filter(e => e.event === "whatsapp_checkout").length;
    const revenue = filtered.filter(e => e.event === "whatsapp_checkout").reduce((sum,e) => sum + (e.total || e.price * (e.quantity || 1)), 0);
    return {
      searches,
      noResult,
      views,
      carts,
      whats,
      revenue,
      conversion: searches ? (whats / searches) * 100 : 0,
      cartConversion: carts ? (whats / carts) * 100 : 0,
      ticket: whats ? revenue / whats : 0
    };
  }, [filtered]);

  const consultantRank = useMemo(() => countBy(filtered.filter(e => e.event === "whatsapp_checkout"), e => normalizeConsultant(e.consultant)), [filtered]);
  const productRank = useMemo(() => countBy(filtered.filter(e => e.event === "whatsapp_checkout"), e => [e.productCode, e.productName].filter(Boolean).join(" - ")), [filtered]);
  const searchRank = useMemo(() => countBy(filtered.filter(e => e.event === "search"), e => e.query?.toLowerCase().trim()), [filtered]);
  const noResultRank = useMemo(() => countBy(filtered.filter(e => e.event === "search_no_result"), e => e.query?.toLowerCase().trim()), [filtered]);
  const brandRank = useMemo(() => countBy(filtered.filter(e => e.event === "whatsapp_checkout"), e => e.brand), [filtered]);

  const hourly = useMemo(() => {
    const data = Array.from({ length: 24 }, (_, h) => [String(h).padStart(2,"0")+"h", 0]);
    filtered.filter(e => e.event === "whatsapp_checkout").forEach(e => {
      const h = new Date(e.createdAt).getHours();
      if (!Number.isNaN(h)) data[h][1]++;
    });
    return data;
  }, [filtered]);

  const topConsultant = consultantRank[0];
  const topProduct = productRank[0];
  const topMissing = noResultRank[0];

  return (
    <main className="app">
      <section className="hero">
        <div>
          <span className="eyebrow">Z Connect BI</span>
          <h1>Analytics Comercial</h1>
          <p>Pedidos WhatsApp, buscas, produtos e oportunidades comerciais em tempo real.</p>
        </div>
        <button onClick={load} className="refresh"><RefreshCw size={18}/> Atualizar</button>
      </section>

      <section className="toolbar">
        <div className="status">{usingSample ? "⚠️ " : "🟢 "}{status}</div>
        <label><CalendarDays size={16}/> Período
          <select value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="today">Hoje</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="all">Tudo</option>
          </select>
        </label>
        <label><Filter size={16}/> Consultor
          <select value={consultant} onChange={e => setConsultant(e.target.value)}>
            {consultants.map(c => <option key={c} value={c}>{c === "all" ? "Todos" : c.toUpperCase()}</option>)}
          </select>
        </label>
      </section>

      <section className="kpi-grid">
        <Kpi icon={<Search/>} label="Buscas" value={kpis.searches}/>
        <Kpi icon={<Eye/>} label="Produtos vistos" value={kpis.views}/>
        <Kpi icon={<ShoppingCart/>} label="Adicionados" value={kpis.carts}/>
        <Kpi icon={<Send/>} label="WhatsApp" value={kpis.whats}/>
        <Kpi icon={<TrendingUp/>} label="Conversão busca → WhatsApp" value={percent(kpis.conversion)}/>
        <Kpi icon={<Package/>} label="Ticket médio" value={money(kpis.ticket)}/>
      </section>

      <section className="spotlight-grid">
        <Spotlight title="Consultor campeão" value={topConsultant?.[0]?.toUpperCase() || "—"} sub={`${topConsultant?.[1] || 0} pedidos WhatsApp`} icon={<Trophy/>}/>
        <Spotlight title="Produto campeão" value={topProduct?.[0] || "—"} sub={`${topProduct?.[1] || 0} envios`} icon={<Package/>}/>
        <Spotlight title="Busca sem resultado" value={topMissing?.[0] || "—"} sub={`${topMissing?.[1] || 0} ocorrências`} icon={<AlertTriangle/>}/>
      </section>

      <section className="columns">
        <Rank title="Ranking consultores" rows={consultantRank} empty="Sem pedidos no período"/>
        <Rank title="Produtos mais enviados" rows={productRank} empty="Sem produtos enviados"/>
        <Rank title="Buscas mais feitas" rows={searchRank} empty="Sem buscas"/>
        <Rank title="Sem resultado" rows={noResultRank} empty="Sem buscas vazias"/>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2><Clock size={20}/> Pedidos por horário</h2>
          <span>baseado em whatsapp_checkout</span>
        </div>
        <div className="heat">
          {hourly.map(([label, value]) => <div key={label} className="bar-row"><span>{label}</span><div><i style={{width:`${Math.min(100, value * 18)}%`}}/></div><b>{value}</b></div>)}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Marcas que mais enviam WhatsApp</h2>
        </div>
        <Rank rows={brandRank} empty="Sem marcas no período"/>
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

function Rank({ title, rows = [], empty }) {
  return <article className="panel">
    {title && <div className="panel-head"><h2>{title}</h2></div>}
    <div className="rank">
      {rows.length ? rows.slice(0, 10).map(([name, count], idx) => (
        <div className="rank-row" key={`${name}-${idx}`}>
          <span className="pos">{idx + 1}</span>
          <strong>{name || "—"}</strong>
          <b>{count}</b>
        </div>
      )) : <p className="empty">{empty}</p>}
    </div>
  </article>;
}

createRoot(document.getElementById("root")).render(<App />);
