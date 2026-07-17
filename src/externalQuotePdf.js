import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

const brNumber = (value) => Number(String(value || "0").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) || 0;

export async function readExternalQuotePdf(file) {
  const document = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const lines = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const groups = new Map();
    content.items.filter((item) => item.str?.trim()).forEach((item) => {
      const y = Math.round(item.transform[5] * 2) / 2;
      if (!groups.has(y)) groups.set(y, []);
      groups.get(y).push({ text: item.str.trim(), x: item.transform[4] });
    });
    [...groups.entries()].sort((a, b) => b[0] - a[0]).forEach(([, items]) => lines.push(items.sort((a, b) => a.x - b.x).map((item) => item.text).join(" ").replace(/\s+/g, " ").trim()));
  }
  const text = lines.join("\n");
  const oneLine = text.replace(/\s+/g, " ");
  const match = (regex) => (oneLine.match(regex)?.[1] || "").trim();
  const externalNumber = match(/Pedido\s*(?:N[º°o]?\s*)?:?\s*(\d+)/i) || match(/N[uú]mero\s*:?\s*(\d+)/i);
  const customerCode = match(/Cliente\s*:?\s*(\d+)/i);
  const customerLineIndex = lines.findIndex((line) => /^Cliente\s*:/i.test(line));
  let companyName = customerLineIndex >= 0 ? (lines[customerLineIndex].match(/^Cliente\s*:?\s*\d+\s*-\s*(.*?)(?=\s+CEP\s*:|\s+Transportadora\s*:|$)/i)?.[1] || "").trim() : "";
  for (let index = customerLineIndex + 1; index >= 0 && index < Math.min(lines.length, customerLineIndex + 3); index += 1) {
    if (/^(Nome Fantasia|CPF\/CNPJ|CEP|Munic[ií]pio)/i.test(lines[index])) break;
    const continuation = lines[index].split(/\s{2,}|\s+(?=CEP\s*:|Transportadora\s*:)/i)[0].trim();
    if (continuation && /^[A-ZÀ-Ú0-9 .&/-]+$/.test(continuation)) companyName += ` ${continuation}`;
  }
  const taxId = match(/CPF\/CNPJ\s*:?\s*([\d./-]+)/i);
  const issueAt = match(/Emiss[aã]o\s*:?\s*(\d{2}\/\d{2}\/\d{4}(?:\s+\d{2}:\d{2})?)/i);
  const total = brNumber(match(/(?:Valor\s+total\s+)?l[ií]quido\s*(?:R\$)?\s*:?\s*([\d.,]+)/i) || match(/Total\s+do\s+Pedido\s*:?\s*(?:R\$\s*)?([\d.,]+)/i));
  const items = [];
  lines.forEach((line, index) => {
    const codeMatch = line.match(/^\s*(\d{5,9})\b/);
    if (!codeMatch) return;
    const nearby = lines.slice(index, Math.min(lines.length, index + 4)).join(" ");
    const description = nearby.match(/Descri[cç][aã]o\s*:\s*(.+?)(?=\s+(?:Local|Qtd|Quantidade|Unidade|Valor|R\$)\b|$)/i)?.[1]?.trim() || line.replace(/^\s*\d{5,9}\s*/, "").trim();
    const numbers = line.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g) || [];
    const qtyMatch = nearby.match(/(?:Qtd|Quantidade)\s*:?\s*(\d+(?:[.,]\d+)?)/i);
    const quantity = brNumber(qtyMatch?.[1] || (numbers.length >= 4 ? numbers[numbers.length - 4] : 1));
    const unitPrice = brNumber(numbers.length >= 3 ? numbers[numbers.length - 3] : numbers[0]);
    const itemTotal = brNumber(numbers[numbers.length - 1]) || quantity * unitPrice;
    if (!items.some((item) => item.productCode === codeMatch[1])) items.push({ productCode: codeMatch[1], description, quantity, unitPrice, total: itemTotal });
  });
  if (!externalNumber || !companyName) throw new Error("Não consegui identificar o número e o cliente desta cotação. Use o PDF original gerado pelo sistema.");
  return { externalNumber, customerCode, companyName, taxId, issueAt, total, subtotal: total, items, fileName: file.name };
}
