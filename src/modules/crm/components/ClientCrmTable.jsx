import { useMemo, useState } from "react";

import {
  Building2,
  Download,
  Filter,
  Search,
  TrendingUp
} from "lucide-react";

import { money } from "../../../shared/formatting.js";
import { dateOnly } from "../../../shared/dates.js";
import { parseClientTags, serializeClientTags } from "../engine/crm-domain.js";
import { purchaseDays } from "../engine/crm-utils.js";
import { commercialHealth } from "../../commercial-intelligence/engine/commercial-engine.js";
import { tableRows } from "../../reports/engine/event-reports.js";
import { buildExcelWorkbook } from "../../../shared/export/xlsx.js";
import { downloadBlob } from "../../../shared/export/csv.js";
import { fileDateStamp, slugifyFilePart } from "../../../shared/report-utils.js";
const CLIENT_TAGS = [
  "Venda sob encomenda",
  "Cliente potencial",
  "Cliente bloqueado",
  "Linha mecânica",
  "Fora do perfil",
  "Compra recorrente",
  "Cliente em reativação"
];

const NOTE_ACTIVITY_TYPES = [
  "note",
  "contact_note",
  "call_no_answer",
  "whatsapp_sent",
  "email_sent",
  "invalid_phone",
  "contact_success",
  "quote_sent",
  "negotiation_note",
  "after_sales_note",
  "contact_return",
  "not_answered",
  "call_completed",
  "missing_stock",
  "high_price",
  "no_return",
  "sale_completed_note"
];

export function ClientTagSelector({ value = "", onChange }) {
  const selected = parseClientTags(value);
  const legacy = selected.filter((tag) => !CLIENT_TAGS.includes(tag));

  function toggle(tag) {
    onChange(
      serializeClientTags(
        selected.includes(tag)
          ? selected.filter((item) => item !== tag)
          : [...selected, tag]
      )
    );
  }

  return (
    <div className="fixed-tag-selector">
      {CLIENT_TAGS.map((tag) => (
        <label
          key={tag}
          className={selected.includes(tag) ? "selected" : ""}
        >
          <input
            type="checkbox"
            checked={selected.includes(tag)}
            onChange={() => toggle(tag)}
          />
          <span>{tag}</span>
        </label>
      ))}

      {legacy.map((tag) => (
        <button
          type="button"
          key={tag}
          className="legacy-tag"
          onClick={() => toggle(tag)}
          title="Remover tag antiga"
        >
          {tag} ×
        </button>
      ))}
    </div>
  );
}

export default function ClientCrmTable({
  rows = [],
  activities = [],
  onOpen,
  pipelineStages = [],
  onExport
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [health, setHealth] = useState("all");
  const [notesOnly, setNotesOnly] = useState(false);
  const [tag, setTag] = useState("all");
  const [funnel, setFunnel] = useState("all");
  const [sort, setSort] = useState("company");

  const noteKeys = useMemo(
    () =>
      new Set(
        activities
          .filter((item) => NOTE_ACTIVITY_TYPES.includes(item.type))
          .map((item) => item.companyKey)
      ),
    [activities]
  );

  const visibleRows = rows
    .filter((row) => {
      const needle = query.trim().toLowerCase();
      const rowTags = parseClientTags(row.tags);

      return (
        (status === "all" || row.statusKey === status) &&
        (health === "all" || commercialHealth(row).key === health) &&
        (tag === "all" || rowTags.includes(tag)) &&
        (funnel === "all" ||
          (funnel === "out"
            ? row.statusKey === "out_of_funnel"
            : row.statusKey !== "out_of_funnel")) &&
        (!notesOnly || noteKeys.has(row.companyKey)) &&
        (!needle || row._search.includes(needle))
      );
    })
    .sort((a, b) =>
      sort === "recent"
        ? new Date(b.lastPurchaseAt || 0) -
          new Date(a.lastPurchaseAt || 0)
        : sort === "days_desc"
          ? purchaseDays(b) - purchaseDays(a)
          : sort === "total_desc"
            ? b.purchaseTotal - a.purchaseTotal
            : a.company.localeCompare(b.company, "pt-BR")
    );

  function exportClients() {
    const columns = [
      { key: "code", label: "Código" },
      { key: "company", label: "Cliente" },
      { key: "taxId", label: "CPF/CNPJ" },
      { key: "contact", label: "Contato" },
      { key: "phone", label: "Telefone / WhatsApp" },
      { key: "email", label: "E-mail" },
      { key: "city", label: "Cidade" },
      { key: "state", label: "UF" },
      { key: "owner", label: "Responsável" },
      { key: "stage", label: "Etapa" },
      { key: "exitReason", label: "Motivo da saída do funil" },
      { key: "tags", label: "Tags" },
      { key: "lastPurchase", label: "Última compra" },
      { key: "days", label: "Dias sem comprar" },
      { key: "health", label: "Recência da compra" },
      { key: "purchaseTotal", label: "Total comprado" },
      { key: "nextContact", label: "Próximo contato" }
    ];

    const exportRows = visibleRows.map((row) => ({
      code: row.customerCode || "",
      company: row.company || "",
      taxId: row.taxId || "",
      contact: row.contactName || "",
      phone: row.phone || "",
      email: row.email || "",
      city: row.city || "",
      state: row.state || "",
      owner: row.owner || "",
      stage: row.status || "",
      exitReason: row.funnelExitReason || "",
      tags: parseClientTags(row.tags).join(", "),
      lastPurchase: row.lastPurchaseAt ? dateOnly(row.lastPurchaseAt) : "",
      days: purchaseDays(row) || "",
      health: commercialHealth(row).label,
      purchaseTotal: row.purchaseTotal || 0,
      nextContact: row.nextContactAt ? dateOnly(row.nextContactAt) : ""
    }));

    const listName =
      funnel === "out"
        ? "Clientes fora do funil"
        : funnel === "in"
          ? "Clientes no funil"
          : "Carteira de clientes";

    downloadBlob(
      buildExcelWorkbook([{
        name: "Clientes",
        rows: tableRows(listName, columns, exportRows),
        autoFilterRow: 3,
        freezeRows: 3,
        columnWidths: [13, 34, 20, 22, 20, 28, 20, 8, 20, 20, 32, 36, 16, 16, 22, 18, 18]
      }]),
      `zconnect-${slugifyFilePart(listName)}-${fileDateStamp()}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  }

  return (
    <article className="panel crm-table-panel">
      <div className="panel-head">
        <div>
          <h2>
            <Building2 size={18} /> Carteira de clientes
          </h2>
          <p>
            Clique em qualquer linha para abrir histórico, anotações e próximo
            contato.
          </p>
        </div>

        <div className="crm-table-head-actions">
          <span>{visibleRows.length} cliente(s)</span>
          <button
            type="button"
            className="crm-secondary-action"
            onClick={exportClients}
            disabled={!visibleRows.length}
          >
            <Download size={16} /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="table-tools">
        <label>
          <Search size={14} /> Buscar
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="empresa, contato, código interno, telefone ou tag"
          />
        </label>

        <label>
          <Filter size={14} /> Etapa
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">Todas</option>
            {pipelineStages.map((stage) => (
              <option key={stage.key} value={stage.key}>
                {stage.label}
              </option>
            ))}
            <option value="active">Cliente ativo</option>
            <option value="cold">Frio</option>
          </select>
        </label>

        <label>
          <Filter size={14} /> Recência da compra
          <select
            value={health}
            onChange={(event) => setHealth(event.target.value)}
          >
            <option value="all">Todas</option>
            <option value="active">Comprou recentemente</option>
            <option value="attention">31–60 dias</option>
            <option value="risk">61–120 dias</option>
            <option value="inactive">Mais de 120 dias</option>
            <option value="no_history">Sem histórico de compra</option>
          </select>
        </label>

        <label>
          <Filter size={14} /> Tag
          <select
            value={tag}
            onChange={(event) => setTag(event.target.value)}
          >
            <option value="all">Todas as tags</option>
            {CLIENT_TAGS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          <Filter size={14} /> Funil
          <select
            value={funnel}
            onChange={(event) => setFunnel(event.target.value)}
          >
            <option value="all">Todos</option>
            <option value="in">No funil</option>
            <option value="out">Fora do funil</option>
          </select>
        </label>

        <label>
          <TrendingUp size={14} /> Ordenar
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="company">Nome</option>
            <option value="recent">Compra mais recente</option>
            <option value="days_desc">Mais dias sem comprar</option>
            <option value="total_desc">Maior total comprado</option>
          </select>
        </label>

        <label className="check-tool">
          <input
            type="checkbox"
            checked={notesOnly}
            onChange={(event) => setNotesOnly(event.target.checked)}
          />
          Com anotações
        </label>
      </div>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Etapa</th>
              <th>Responsável</th>
              <th>Última compra</th>
              <th>Dias sem comprar</th>
              <th>Recência da compra</th>
              <th>Total comprado</th>
              <th>Próximo contato</th>
            </tr>
          </thead>

          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={row.id}
                tabIndex="0"
                onClick={() => onOpen(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    onOpen(row);
                  }
                }}
              >
                <td>
                  <strong>{row.company}</strong>
                  <small>
                    {row.customerCode ? `Código ${row.customerCode} · ` : ""}
                    {row.contactName || row.lastEvent}
                  </small>
                </td>

                <td>
                  <span className={`crm-status status-${row.statusKey}`}>
                    {row.status}
                  </span>
                  {row.funnelExitReason ? (
                    <small>{row.funnelExitReason}</small>
                  ) : null}
                </td>

                <td>{row.owner || "-"}</td>
                <td>
                  {row.lastPurchaseAt
                    ? dateOnly(row.lastPurchaseAt)
                    : "-"}
                </td>
                <td>{purchaseDays(row) || "-"}</td>

                <td>
                  <span
                    className={`commercial-health health-${commercialHealth(row).key}`}
                  >
                    {commercialHealth(row).label}
                  </span>
                </td>

                <td>
                  {row.purchaseTotal ? money(row.purchaseTotal) : "-"}
                </td>

                <td>{row.nextContact}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!visibleRows.length ? (
          <div className="empty-state">
            Nenhum cliente corresponde aos filtros atuais.
          </div>
        ) : null}
      </div>
    </article>
  );
}



