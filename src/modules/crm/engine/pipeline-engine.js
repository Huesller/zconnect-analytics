import {
  crmContactDate,
  dateOnly
} from "../../../shared/dates.js";

function pipelineNextAction(client, activities = [], tasks = []) {
  const pending = [
    ...(client.nextContactAt ? [{ label: "Próximo contato", at: client.nextContactAt }] : []),
    ...tasks.filter((task) => task.companyKey === client.companyKey && task.status === "open").map((task) => ({ label: task.title, at: task.dueAt })),
    ...activities.filter((activity) => activity.companyKey === client.companyKey && activity.nextAction && activity.actionStatus !== "done").map((activity) => ({ label: activity.nextAction, at: activity.nextActionAt }))
  ].filter((item) => item.at && Number.isFinite(new Date(item.at).getTime())).sort((a, b) => new Date(a.at) - new Date(b.at));
  if (!pending.length) return { time: Number.MAX_SAFE_INTEGER, urgency: "no-action", label: "Sem próxima ação" };
  const first = pending[0];
  const time = new Date(first.at).getTime();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const urgency = time < today.getTime() ? "overdue" : time < tomorrow.getTime() ? "today" : "scheduled";
  return { time, urgency, label: `${first.label} · ${dateOnly(first.at)}` };
}

export {
  pipelineNextAction
};

