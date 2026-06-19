const BASE_URL = 'https://sistema.zettabrasil.com.br';

function parsePrecoNum(valor) {
  if (valor == null || valor === '') return null;

  // Se já veio número do JavaScript, não pode passar por parser BR,
  // senão 104.05 vira 10405.
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : null;
  }

  const raw = String(valor).trim();
  if (!raw) return null;

  // Mantém apenas número e separadores.
  const s = raw.replace(/[^\d,.-]/g, '');

  // Formato do sistema/Zetta: 189.1700 ou 183.2200
  // Sem vírgula e com ponto decimal = decimal real, não milhar.
  if (/^-?\d+\.\d+$/.test(s) && !s.includes(',')) {
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  // Formato BR: R$ 189,17 ou 10.404,35
  if (s.includes(',')) {
    const br = s.replace(/\./g, '').replace(',', '.');
    const n = Number(br);
    return Number.isFinite(n) ? n : null;
  }

  // Inteiro ou string numérica simples.
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function formatPrecoBR(valor) {
  const n = parsePrecoNum(valor);
  if (n == null) return '';
  return 'R$ ' + n.toFixed(2).replace('.', ',');
}

function absolutizePath(relPath) {
  if (!relPath) return '';
  const clean = String(relPath).replace(/\\/g, '');
  if (clean.startsWith('http')) return clean;
  return BASE_URL + (clean.startsWith('/') ? clean : '/' + clean);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  BASE_URL,
  parsePrecoNum,
  formatPrecoBR,
  absolutizePath,
  escapeHtml,
};
