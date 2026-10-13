import React, { useMemo, useState } from "react";
import { Building2, CalendarDays, Download, Filter, MessageSquare, Search, UserCheck } from "lucide-react";
import { StatGrid } from "../../components/StatGrid.jsx";

export default function CrmNotesCenterView({
activities = [], clients = [], onOpen, onUpdate,
NOTE_ACTIVITY_TYPES, localDateInput, isSamePeriod, dateOnly,
noteTypeLabel, purchaseDays, commercialHealth, tableRows,
buildExcelWorkbook, downloadBlob, fileDateStamp, EmptyState
}) {
const [query, setQuery] = useState("");
const [status, setStatus] = useState("all");
const [period, setPeriod] = useState("today");
const [selectedDate, setSelectedDate] = useState(localDateInput());
const clientMap = useMemo(() => new Map(clients.map((client) => [client.companyKey, client])), [clients]);
const notes = useMemo(() => activities.filter((item) => NOTE_ACTIVITY_TYPES.includes(item.type) && !item.deletedAt).map((activity) => ({ activity, client: clientMap.get(activity.companyKey) || { company: activity.companyName, companyKey: activity.companyKey } })), [activities, clientMap, NOTE_ACTIVITY_TYPES]);
const periodNotes = notes.filter(({ activity }) => period === "date" ? isSamePeriod(activity.createdAtRaw, "custom", selectedDate, selectedDate) : isSamePeriod(activity.createdAtRaw, period));
const visible = periodNotes.filter(({ activity, client }) => {
const needle = query.trim().toLowerCase();
const pending = activity.nextAction && activity.actionStatus !== "done";
if (status === "pending" && !pending) return false;
if (status === "done" && activity.actionStatus !== "done") return false;
if (status === "without_action" && activity.nextAction) return false;
return !needle || [client.company, client.customerCode, client.contactName, client.phone, client.owner, activity.note, activity.nextAction].join(" ").toLowerCase().includes(needle);
}).sort((a, b) => new Date(b.activity.createdAtRaw) - new Date(a.activity.createdAtRaw));

function exportNotes() {
const columns = [
{ key: "code", label: "Código" }, { key: "tax", label: "CPF/CNPJ" }, { key: "company", label: "Cliente" }, { key: "contact", label: "Contato" }, { key: "phone", label: "Telefone" }, { key: "city", label: "Cidade/UF" }, { key: "owner", label: "Responsável" }, { key: "type", label: "Tipo" }, { key: "note", label: "Anotação" }, { key: "created", label: "Registrada em" }, { key: "nextAction", label: "Próxima ação" }, { key: "nextDate", label: "Data da ação" }, { key: "actionStatus", label: "Status da ação" }, { key: "lastPurchase", label: "Última compra" }, { key: "days", label: "Dias sem comprar" }, { key: "health", label: "Recência da compra" }
];
const rows = visible.map(({ activity, client }) => ({ code: client.customerCode || "", tax: client.taxId || "", company: client.company || activity.companyName, contact: client.contactName || "", phone: client.phone || "", city: [client.city, client.state].filter(Boolean).join(" / "), owner: activity.owner || client.owner || "", type: noteTypeLabel(activity.type), note: activity.note, created: activity.createdAtLabel, nextAction: activity.nextAction || "", nextDate: activity.nextActionAt ? dateOnly(activity.nextActionAt) : "", actionStatus: activity.nextAction ? (activity.actionStatus === "done" ? "Concluída" : "Pendente") : "", lastPurchase: client.lastPurchaseAt ? dateOnly(client.lastPurchaseAt) : "", days: purchaseDays(client), health: commercialHealth(client).label }));
const clientsWithNotes = [...new Map(visible.map(({ client }) => [client.companyKey, client])).values()];
const clientColumns = [{ key: "code", label: "Código" }, { key: "company", label: "Cliente" }, { key: "contact", label: "Contato" }, { key: "phone", label: "Telefone" }, { key: "owner", label: "Responsável" }, { key: "lastPurchase", label: "Última compra" }, { key: "days", label: "Dias sem comprar" }, { key: "health", label: "Recência da compra" }, { key: "notes", label: "Qtd. anotações" }];
const clientRows = clientsWithNotes.map((client) => ({ code: client.customerCode || "", company: client.company, contact: client.contactName || "", phone: client.phone || "", owner: client.owner || "", lastPurchase: client.lastPurchaseAt ? dateOnly(client.lastPurchaseAt) : "", days: purchaseDays(client), health: commercialHealth(client).label, notes: visible.filter((item) => item.client.companyKey === client.companyKey).length }));
const noteSheetRows = tableRows("Anotações comerciais", columns, rows);
const clientSheetRows = tableRows("Clientes com anotações", clientColumns, clientRows);
downloadBlob(buildExcelWorkbook([{ name: "Anotações", rows: noteSheetRows, autoFilterRow: 3, freezeRows: 3, columnWidths: [12, 18, 32, 20, 18, 20, 20, 20, 55, 20, 30, 16, 15, 16, 15, 18] }, { name: "Clientes", rows: clientSheetRows, autoFilterRow: 3, freezeRows: 3, columnWidths: [12, 32, 20, 18, 20, 16, 15, 18, 15] }]), `zconnect-anotacoes-${fileDateStamp()}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

const pendingCount = periodNotes.filter(({ activity }) => activity.nextAction && activity.actionStatus !== "done").length;
return <div className="view-stack">
<StatGrid items={[{ icon: <MessageSquare />, label: "Anotações", value: periodNotes.length }, { icon: <Building2 />, label: "Clientes anotados", value: new Set(periodNotes.map((item) => item.activity.companyKey)).size }, { icon: <CalendarDays />, label: "Ações pendentes", value: pendingCount, emphasis: true }, { icon: <UserCheck />, label: "Ações concluídas", value: periodNotes.filter(({ activity }) => activity.actionStatus === "done").length }]} /> <article className="panel notes-center"> <div className="panel-head"><div><h2><MessageSquare size={18} /> Central de anotações</h2><p>Uma linha por conversa, sempre ligada à ficha original do cliente.</p></div><button type="button" className="crm-secondary-action" onClick={exportNotes}><Download size={16} /> Exportar Excel</button></div> <div className="table-tools"> <label><CalendarDays size={14} /> Período<select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="today">Hoje</option><option value="yesterday">Ontem</option><option value="7d">Últimos 7 dias</option><option value="30d">Últimos 30 dias</option><option value="date">Data específica</option><option value="all">Todo o histórico</option></select></label>
{period === "date" ? <label><CalendarDays size={14} /> Data<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label> : null} <label><Search size={14} /> Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="cliente, anotação, ação ou responsável" /></label> <label><Filter size={14} /> Situação<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todas</option><option value="pending">Ações pendentes</option><option value="done">Ações concluídas</option><option value="without_action">Sem próxima ação</option></select></label> </div> <div className="notes-center-list">{visible.map(({ activity, client }) => <article key={activity.activityId}>
<button type="button" className="note-client" onClick={() => onOpen({ ...client, initialTab: "notes" })}><strong>{client.company || activity.companyName}</strong><small>{client.customerCode ? `Código ${client.customerCode} · ` : ""}{activity.owner || client.owner || "Sem responsável"}</small></button> <div><span className="note-kind">{noteTypeLabel(activity.type)}</span><p>{activity.note}</p>{activity.nextAction ? <small><CalendarDays size={13} /> {activity.nextAction} · {activity.nextActionAt ? dateOnly(activity.nextActionAt) : "sem data"}</small> : null}</div> <time>{activity.createdAtLabel}</time>
{activity.nextAction ? <button type="button" className={`note-status-button ${activity.actionStatus === "done" ? "done" : ""}`} onClick={() => onUpdate(activity.activityId, { type: activity.type, note: activity.note, nextAction: activity.nextAction, nextActionAt: activity.nextActionAt, actionStatus: activity.actionStatus === "done" ? "pending" : "done" })}>{activity.actionStatus === "done" ? "Concluída" : "Concluir"}</button> : <span />} </article>)}{!visible.length ? <EmptyState message="Nenhuma anotação corresponde aos filtros atuais." /> : null}</div> </article>

  </div>;
}