import { useRef } from "react";
import { CalendarDays } from "lucide-react";

function DatePickerField({ value, onChange, min, max, required = false }) {
  const inputRef = useRef(null);
  const includesTime = String(value || "").includes("T");
  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (typeof input.showPicker === "function") input.showPicker();
  }
  return <span className="date-picker-field"><input ref={inputRef} type={includesTime ? "datetime-local" : "date"} value={value} min={min} max={max} required={required} onChange={(event) => onChange(event.target.value)}/><button type="button" onClick={openPicker} aria-label={includesTime ? "Abrir data e horário" : "Abrir calendário"}><CalendarDays size={16}/></button></span>;
}

export default DatePickerField;
