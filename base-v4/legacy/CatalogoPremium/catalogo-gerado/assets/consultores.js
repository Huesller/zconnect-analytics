// ============================================================
// Z Automotiva — Consultores e políticas comerciais
// Altere este arquivo para criar links fixos por consultor sem rodar npm.
// Exemplo de link fixo do representante:
// https://seu-site.vercel.app/?consultor=representante
//
// Cálculo do representante:
// O catálogo atual equivale à política de 45%.
// O representante trabalha com política de 50%.
// O sistema recalcula o preço exibido por: preço_atual × ((100-50)/(100-45)).
// ============================================================

window.Z_CONSULTORES = {
  huesller: {
    id: 'huesller',
    nome: 'Huesller',
    whatsapp: '554733054401',
    ajusteTipo: 'nenhum'
  },

  ney: {
    id: 'ney',
    nome: 'Ney',
    whatsapp: '554733054400',
    ajusteTipo: 'nenhum'
  },
francisco: {
    id: 'francisco',
    nome: 'Francisco',
    whatsapp: '5527992747307',
    ajusteTipo: 'politicaDesconto',
    descontoBaseAtual: 45,
    descontoDestino: 50
  },

  representante: {
    id: 'representante',
    nome: 'Francisco',
    whatsapp: '5527992747307',
    ajusteTipo: 'politicaDesconto',
    descontoBaseAtual: 45,
    descontoDestino: 50
  }
};
