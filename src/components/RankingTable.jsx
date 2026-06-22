import React from "react";

function renderCellValue(row, column) {
  const value = row[column.key] ?? "-";

  if (column.key === "consultant") {
    return <strong className="metric-primary-value">{value}</strong>;
  }

  if (column.key === "score") {
    return <b className="metric-score-value">{value} pts</b>;
  }

  return value;
}

function rowKey(row, index) {
  return row.id || row.product || row.search || row.company || row.consultant || `${index}`;
}

export function RankingTable({
  title,
  subtitle,
  rows = [],
  columns = [],
  empty,
  icon,
  onOpen,
  onKeyDown,
  EmptyStateComponent
}) {
  const Empty = EmptyStateComponent;

  return (
    <article
      className={`panel metric-panel executive-ranking-table ${onOpen ? "clickable-card" : ""}`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={onKeyDown}
    >
      <div className="panel-head">
        <h2>{icon}{title}</h2>
        <span>{rows.length ? `${rows.length} itens` : ""}</span>
      </div>

      {subtitle ? <p className="panel-subtitle">{subtitle}</p> : null}

      <div className="metric-list">
        {rows.length ? rows.slice(0, 10).map((row, index) => (
          <div className="metric-row executive-metric-row" key={rowKey(row, index)}>
            <span className="pos">{row.position || index + 1}</span>

            {columns.map((column) => {
              const rawValue = row[column.key] ?? "-";
              const isName = ["product", "search", "company", "consultant"].includes(column.key);

              return (
                <span
                  key={column.key}
                  className={`metric-cell ${isName ? "metric-name" : ""} metric-cell-${column.key}`}
                  title={String(rawValue)}
                >
                  {renderCellValue(row, column)}
                </span>
              );
            })}
          </div>
        )) : <Empty message={empty} />}
      </div>
    </article>
  );
}
