import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import readXlsxFile from "read-excel-file";
import { parseExcelMatrix, parseSiggmaPdfPages } from "./clientImportCore.js";

GlobalWorkerOptions.workerSrc = workerUrl;

export async function readClientImportFile(file) {
  const extension = file.name.toLowerCase().split(".").pop();
  const buffer = await file.arrayBuffer();
  if (extension === "pdf") {
    const document = await getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      pages.push({ width: viewport.width, items: content.items.filter((item) => item.str?.trim()).map((item) => ({ str: item.str.trim(), x: item.transform[4], y: item.transform[5] })) });
    }
    const rows = parseSiggmaPdfPages(pages);
    if (!rows.length) throw new Error("O PDF não possui a tabela SIGGMA reconhecida. Exporte a tela completa de clientes.");
    return rows;
  }
  if (["xlsx", "xlsm"].includes(extension)) {
    // A carteira consolidada possui células realmente vazias. A opção padrão da
    // biblioteca tenta executar trim() também nesses valores e interrompe a leitura.
    const matrix = await readXlsxFile(new Blob([buffer]), { trim: false });
    return parseExcelMatrix(matrix);
  }
  if (extension === "csv") {
    const text = new TextDecoder("utf-8").decode(buffer).replace(/^\uFEFF/, "");
    const delimiter = (text.split(/\r?\n/, 1)[0].match(/;/g) || []).length >= (text.split(/\r?\n/, 1)[0].match(/,/g) || []).length ? ";" : ",";
    const matrix = [];
    let row = [], cell = "", quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (character === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = !quoted;
      else if (character === delimiter && !quoted) { row.push(cell); cell = ""; }
      else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        row.push(cell); if (row.some((value) => String(value).trim())) matrix.push(row); row = []; cell = "";
      } else cell += character;
    }
    row.push(cell); if (row.some((value) => String(value).trim())) matrix.push(row);
    return parseExcelMatrix(matrix);
  }
  throw new Error("Use PDF, XLSX, XLSM ou CSV. Planilhas XLS antigas devem ser salvas como XLSX.");
}
