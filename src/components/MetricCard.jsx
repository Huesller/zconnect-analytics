function cardKeyHandler(onOpen) {
  return (event) => {
    if (!onOpen) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };
}

export function Kpi({ icon, label, value, onOpen, highlight = false }) {
  return (
    <article
      className={`kpi ${highlight ? "kpi-highlight" : ""} ${onOpen ? "clickable-card" : ""}`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={cardKeyHandler(onOpen)}
    >
      <div className="icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function ValueCard({ title, value, sub, icon, onOpen, highlight = false }) {
  return (
    <article
      className={`spotlight ${highlight ? "spotlight-highlight" : ""} ${onOpen ? "clickable-card" : ""}`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={cardKeyHandler(onOpen)}
    >
      <div className="spot-icon">{icon}</div>
      <span>{title}</span>
      <strong title={String(value ?? "")}>{value}</strong>
      <p>{sub}</p>
    </article>
  );
}
