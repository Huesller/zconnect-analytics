# Z Connect Analytics 12.5.2 — Sincronização segura do Cliente 360

Corrige o efeito em que uma anotação ou tarefa desaparecia temporariamente logo após salvar e voltava ao fechar e reabrir o cliente.

## Causa

A atualização automática de 30 segundos podia terminar logo depois do salvamento usando uma leitura anterior da planilha.

## Correção

- A sincronização periódica fica pausada enquanto o Cliente 360 está aberto.
- Uma leitura que já estava em andamento mescla os dados remotos com as anotações e tarefas locais.
- O registro salvo permanece visível imediatamente, sem precisar fechar e abrir o cliente.
