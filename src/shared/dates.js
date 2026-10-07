function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function localDateInput(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localDateTimeInput(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dateTime(value) {
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function crmContactDate(value) {
  const text = String(value || "").trim();

  if (!text) return null;

  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T12:00:00`)
    : new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}

function dateOnly(value) {
  const date = crmContactDate(value);

  if (!date) return "-";

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(value || ""))) {
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return date.toLocaleDateString("pt-BR");
}

function timeOnly(value) {
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "--:--";

  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export {
  startOfDay,
  endOfDay,
  localDateInput,
  localDateTimeInput,
  dateTime,
  crmContactDate,
  dateOnly,
  timeOnly
};
