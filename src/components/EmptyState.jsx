export function EmptyState({ message = "Sem dados no período.", title }) {
  const isLongMessage = String(message).length > 70;

  return (
    <div className={`empty-state ${isLongMessage ? "empty-state-wide" : ""}`}>
      {title ? <strong>{title}</strong> : null}
      <p>{message}</p>
    </div>
  );
}
