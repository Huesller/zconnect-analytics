import { useEffect, useRef, useState } from "react";
import { safeNumber } from "../normalization.js";
import { money } from "../formatting.js";

function CurrencyInput({ value, onChange, placeholder = "R$ 0,00", ...props }) {
  const [display, setDisplay] = useState(value === "" || value === null || value === undefined ? "" : money(safeNumber(value)));
  const lastEmittedRef = useRef(null);
  useEffect(() => {
    if (String(value ?? "") === lastEmittedRef.current) return;
    setDisplay(value === "" || value === null || value === undefined ? "" : money(safeNumber(value)));
  }, [value]);
  return <input {...props} inputMode="decimal" value={display} placeholder={placeholder} onFocus={(event) => event.currentTarget.select()} onChange={(event) => {
    const raw = event.target.value;
    setDisplay(raw);
    lastEmittedRef.current = raw;
    onChange?.(raw);
  }} onBlur={() => {
    const numeric = safeNumber(display);
    const formatted = display.trim() ? money(numeric) : "";
    setDisplay(formatted);
    lastEmittedRef.current = display.trim() ? String(numeric) : "";
    onChange?.(display.trim() ? String(numeric) : "");
  }}/>;
}

export default CurrencyInput;
