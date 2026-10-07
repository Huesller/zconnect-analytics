function whatsappPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export {
  whatsappPhone
};
