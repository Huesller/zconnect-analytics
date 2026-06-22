const LEVEL_LABELS = {
  success: "Destaque",
  warning: "Atenção",
  danger: "Crítico",
  info: "Insight"
};

export function InsightStrip({ insights = [] }) {
  if (!insights.length) return null;

  return (
    <section className="executive-insights" aria-label="Insights do Dia">
      {insights.slice(0, 4).map((insight) => (
        <article className={`insight-card ${insight.level || "info"}`} key={insight.id}>
          <small>{LEVEL_LABELS[insight.level] || LEVEL_LABELS.info}</small>
          <span>{insight.title}</span>
          <strong title={String(insight.value ?? "")}>{insight.value}</strong>
          <p title={String(insight.detail ?? "")}>{insight.detail}</p>
        </article>
      ))}
    </section>
  );
}
