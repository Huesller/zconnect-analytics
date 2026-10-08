import { useState } from "react";

import { money } from "../../../shared/formatting.js";
import { safeNumber } from "../../../shared/normalization.js";
import { noteTypeLabel } from "../engine/crm-domain.js";
import { pipelineNextAction } from "../engine/pipeline-engine.js";
import { ACTIVE_PIPELINE_STAGE_KEYS } from "../engine/pipeline-config.js";

const PIPELINE_STAGES = [
  { key: "new", label: "Novo interesse" },
  { key: "contact", label: "Em contato" },
  { key: "qualified", label: "Oportunidade identificada" },
  { key: "quoted", label: "Cotação enviada" },
  { key: "negotiation", label: "Negociação" },
  { key: "waiting", label: "Aguardando cliente" },
  { key: "won", label: "Pedido fechado" },
  { key: "lost", label: "Perdido" }
];

const CONTACT_ACTIVITY_TYPES = [
  "whatsapp_sent",
  "contact_return",
  "not_answered",
  "call_completed",
  "quote_sent",
  "missing_stock",
  "high_price",
  "no_return",
  "negotiation_note",
  "sale_completed_note"
];

export default function PipelineBoard({
  rows = [],
  activities = [],
  tasks = [],
  onOpen,
  onMove
}) {
  const [moving, setMoving] = useState("");
  const [selectedStage, setSelectedStage] = useState(PIPELINE_STAGES[0].key);

  async function move(client, status) {
    if (client.statusKey === status) return;
    setMoving(client.companyKey);
    try {
      await onMove(client, status);
    } finally {
      setMoving("");
    }
  }

  function jumpToStage(stageKey) {
    setSelectedStage(stageKey);
    document
      .getElementById(`pipeline-stage-${stageKey}`)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
  }

  return (
    <>
      <nav className="pipeline-stage-nav" aria-label="Ir para uma etapa do funil">
        {PIPELINE_STAGES
          .filter((stage) => ACTIVE_PIPELINE_STAGE_KEYS.has(stage.key))
          .map((stage) => {
            const count = rows.filter(
              (row) => row.statusKey === stage.key
            ).length;

            return (
              <button
                type="button"
                key={stage.key}
                className={selectedStage === stage.key ? "active" : ""}
                onClick={() => jumpToStage(stage.key)}
              >
                <span>{stage.label}</span>
                <b>{count}</b>
              </button>
            );
          })}
      </nav>

      <section className="pipeline-board">
        {PIPELINE_STAGES
          .filter((stage) => ACTIVE_PIPELINE_STAGE_KEYS.has(stage.key))
          .map((stage) => {
            const stageRows = rows
              .filter((row) => row.statusKey === stage.key)
              .sort(
                (a, b) =>
                  pipelineNextAction(a, activities, tasks).time -
                  pipelineNextAction(b, activities, tasks).time
              );

            const stageValue = stageRows.reduce(
              (sum, row) =>
                sum + safeNumber(row.expectedValue || row.quoteTotalNumber),
              0
            );

            return (
              <article
                id={`pipeline-stage-${stage.key}`}
                className={`pipeline-column stage-${stage.key}`}
                key={stage.key}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const key = event.dataTransfer.getData("text/plain");
                  const client = rows.find(
                    (row) => row.companyKey === key
                  );
                  if (client) move(client, stage.key);
                }}
              >
                <header>
                  <span>{stage.label}</span>
                  <b>{stageRows.length}</b>
                  <small>{money(stageValue)}</small>
                </header>

                <div className="pipeline-cards">
                  {stageRows.map((client) => {
                    const clientActivities = activities.filter(
                      (activity) =>
                        activity.companyKey === client.companyKey &&
                        !activity.deletedAt
                    );

                    const attempts = clientActivities.filter((activity) =>
                      CONTACT_ACTIVITY_TYPES.includes(activity.type)
                    );

                    const lastAttempt = attempts
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.createdAtRaw) -
                          new Date(a.createdAtRaw)
                      )[0];

                    const next = pipelineNextAction(
                      client,
                      activities,
                      tasks
                    );

                    return (
                      <button
                        type="button"
                        draggable
                        key={client.companyKey}
                        className={`pipeline-card card-${next.urgency}`}
                        onDragStart={(event) =>
                          event.dataTransfer.setData(
                            "text/plain",
                            client.companyKey
                          )
                        }
                        onClick={() => onOpen(client)}
                        disabled={moving === client.companyKey}
                      >
                        <strong>{client.company}</strong>
                        <span>{client.owner || "Sem responsável"}</span>
                        <small>
                          {client.itemCount || 0} item(ns) · {attempts.length}{" "}
                          tentativa(s)
                        </small>
                        <b>
                          {client.expectedValue
                            ? money(client.expectedValue)
                            : client.quoteTotal}
                        </b>

                        {lastAttempt ? (
                          <em>
                            Último: {noteTypeLabel(lastAttempt.type)} ·{" "}
                            {lastAttempt.createdAtLabel}
                          </em>
                        ) : (
                          <em>Nenhum contato registrado</em>
                        )}

                        <mark className={`next-action ${next.urgency}`}>
                          {next.label}
                        </mark>
                      </button>
                    );
                  })}

                  {!stageRows.length ? (
                    <p className="pipeline-empty">
                      Solte um cliente aqui
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
      </section>
    </>
  );
}
