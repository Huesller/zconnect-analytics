import React from "react";

const PERIOD_OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "all", label: "Tudo" }
];

export function ExecutiveHeader({
  title,
  subtitle,
  description,
  status,
  lastUpdatedLabel,
  isLoading,
  isResetting,
  onRefresh,
  onExportExecutive,
  onExportRaw,
  period,
  onPeriodChange,
  consultant,
  onConsultantChange,
  consultants = [],
  company,
  onCompanyChange,
  companies = [],
  icons = {}
}) {
  return (
    <>
      <section className="hero executive-header">
        <div>
          <span className="eyebrow">{subtitle}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="hero-actions">
          <button onClick={onRefresh} className="refresh" disabled={isLoading || isResetting}>
            {icons.refresh} {isLoading ? "Atualizando..." : "Atualizar"}
          </button>
          <button onClick={onExportExecutive} className="refresh primary-export">
            {icons.download} Relatório executivo
          </button>
          <button onClick={onExportRaw} className="refresh">
            {icons.download} CSV bruto
          </button>
        </div>
      </section>

      <section className="toolbar compact-toolbar executive-toolbar">
        <div className="status">
          <span>{status}</span>
          <small>Última atualização: {lastUpdatedLabel}</small>
        </div>

        <label>{icons.calendar} Período
          <select value={period} onChange={(event) => onPeriodChange(event.target.value)}>
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label>{icons.filter} Consultor
          <select value={consultant} onChange={(event) => onConsultantChange(event.target.value)}>
            {consultants.map((item) => (
              <option key={item} value={item}>{item === "all" ? "Todos" : item.toUpperCase()}</option>
            ))}
          </select>
        </label>

        <label>{icons.company} Empresa
          <select value={company} onChange={(event) => onCompanyChange(event.target.value)}>
            {companies.map((item) => (
              <option key={item} value={item}>{item === "all" ? "Todas" : item}</option>
            ))}
          </select>
        </label>
      </section>
    </>
  );
}
