import React from "react";

function handleKeyDown(onOpen) {
  return (event) => {
    if (!onOpen) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };
}

export function StatGrid({ items = [] }) {
  return (
    <section className="kpi-grid stat-grid">
      {items.map((item) => (
        <article
          key={item.label}
          className={`kpi ${item.onOpen ? "clickable-card" : ""} ${item.emphasis ? "kpi-emphasis" : ""}`}
          role={item.onOpen ? "button" : undefined}
          tabIndex={item.onOpen ? 0 : undefined}
          onClick={item.onOpen}
          onKeyDown={handleKeyDown(item.onOpen)}
          title={item.title || item.label}
        >
          <div className="kpi-icon">{item.icon}</div>
          <div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}
