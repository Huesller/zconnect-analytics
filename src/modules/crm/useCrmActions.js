import {
  postAnalyticsAction,
  postAnalyticsActionWithRetry
} from "../../core/api/analytics-client.js";

import {
  normalizeConsultant,
  normalizeCompany,
  safeNumber
} from "../../shared/normalization.js";

import {
  money
} from "../../shared/formatting.js";

import {
  dateOnly,
  localDateInput
} from "../../shared/dates.js";

import {
  companyKey
} from "../../shared/company-utils.js";

import {
  normalizeCrmTask,
  normalizeCrmActivity,
  normalizePurchaseReference,
  noteTypeLabel,
  clientProfilePayload
} from "./engine/crm-domain.js";

import {
  crmStatusLabel,
  purchaseDays
} from "./engine/crm-utils.js";

import {
  readExternalQuotePdf
} from "../../externalQuotePdf.js";

const CONTACT_ACTIVITY_TYPES = [
  "whatsapp_sent",
  "contact_return",
  "not_answered",
  "call_completed",
  "quote_sent",
  "missing_stock",
  "high_price",
  "no_return",
  "negotiation_note",
  "sale_completed_note"
];

const LOST_REASONS = [
  "Sem estoque",
  "Preço",
  "Frete",
  "Prazo",
  "Cliente desistiu",
  "Comprou de outro fornecedor",
  "Outro"
];

function useCrmActions({
  authProfile,
  crmDemands,
  crmRows,
  load,
  showToast,
  setReservations,
  setCrmClients,
  setCrmTasks,
  setCrmActivities,
  setCrmQuotes,
  setCrmQuoteItems,
  setCrmDemands,
  setSelectedClient,
  setIsNewClientOpen,
  setIsClientImportOpen,
  setIsSavingCrm
}) {

  async function saveClientProfile(form) {
    setIsSavingCrm(true);
    try {
      const saved = await postAnalyticsAction("upsert_crm_client", normalizePurchaseReference(form));
      const normalized = {
        ...saved.client,
        companyKey: String(saved.client.companyKey || companyKey(form.companyName)),
        companyName: normalizeCompany(saved.client.companyName || form.companyName)
      };
      setCrmClients((current) => [normalized, ...current.filter((item) => companyKey(item.companyKey || item.companyName) !== normalized.companyKey)]);
      setSelectedClient((current) => current ? {
        ...current,
        statusKey: normalized.status,
        status: crmStatusLabel(normalized.status),
        customerCode: normalized.customerCode || "",
        taxId: normalized.taxId || "",
        contactName: normalized.contactName || "",
        phone: normalized.phone,
        email: normalized.email || "",
        city: normalized.city || "",
        state: normalized.state || "",
        address: normalized.address || "",
        route: normalized.route || "",
        daysWithoutPurchase: purchaseDays(normalized),
        lastPurchaseAt: normalized.lastPurchaseAt || "",
        lastPurchaseValue: safeNumber(normalized.lastPurchaseValue),
        purchaseTotal: safeNumber(normalized.purchaseTotal),
        purchaseCount: safeNumber(normalized.purchaseCount),
        averagePurchaseIntervalDays: safeNumber(normalized.averagePurchaseIntervalDays),
        segment: normalized.segment || "",
        owner: normalized.owner ? normalizeConsultant(normalized.owner).toUpperCase() : current.owner,
        nextContactAt: normalized.nextContactAt,
        nextContact: normalized.nextContactAt ? dateOnly(normalized.nextContactAt) : "-",
        tags: normalized.tags,
        notes: normalized.notes,
        expectedValue: safeNumber(normalized.expectedValue),
        lastOutcome: normalized.lastOutcome,
        lostReason: normalized.lostReason,
        funnelExitReason: normalized.funnelExitReason || "",
        funnelExitAt: normalized.funnelExitAt || ""
      } : current);
      showToast("Ficha CRM salva com sucesso.");
      return normalized;
    } catch (error) {
      showToast(error.message || "Não foi possível salvar a ficha CRM.", "error");
      throw error;
    } finally {
      setIsSavingCrm(false);
    }
  }
  async function createManualClient(form) {
    const normalized = await saveClientProfile({ ...form, createIfMissing: true });
    setIsNewClientOpen(false);
    setSelectedClient({
      id: `crm-${normalized.companyKey}`,
      companyKey: normalized.companyKey,
      company: normalized.companyName,
      consultant: normalizeConsultant(normalized.owner).toUpperCase(),
      owner: normalizeConsultant(normalized.owner).toUpperCase(),
      statusKey: normalized.status || "new",
      status: crmStatusLabel(normalized.status || "new"),
      customerCode: normalized.customerCode || "",
      taxId: normalized.taxId || "",
      contactName: normalized.contactName || "",
      phone: normalized.phone || "",
      email: normalized.email || "",
      city: normalized.city || "",
      state: normalized.state || "",
      address: normalized.address || "",
        route: normalized.route || "",
        daysWithoutPurchase: purchaseDays(normalized),
        lastPurchaseAt: normalized.lastPurchaseAt || "",
        lastPurchaseValue: safeNumber(normalized.lastPurchaseValue),
        purchaseTotal: safeNumber(normalized.purchaseTotal),
        purchaseCount: safeNumber(normalized.purchaseCount),
        averagePurchaseIntervalDays: safeNumber(normalized.averagePurchaseIntervalDays),
      segment: normalized.segment || "",
      nextContactAt: normalized.nextContactAt || "",
      nextContact: normalized.nextContactAt ? dateOnly(normalized.nextContactAt) : "-",
      tags: normalized.tags || "",
      notes: normalized.notes || "",
      expectedValue: safeNumber(normalized.expectedValue),
      lastOutcome: normalized.lastOutcome || "",
      lostReason: normalized.lostReason || "",
      funnelExitReason: normalized.funnelExitReason || "",
      funnelExitAt: normalized.funnelExitAt || "",
      score: 0, totalActions: 0, itemCount: 0, quotes: 0, quoteTotalNumber: 0, quoteTotal: money(0), activeCartQty: 0,
      topProducts: [], activeCartProducts: [], lastEvent: "Cliente cadastrado manualmente", lastEventRaw: ""
    });
  }

  async function importClientPortfolio({ rows, duplicateStrategy, owner, status }) {
    setIsSavingCrm(true);
    try {
      const clients = rows.filter((row) => row.valid && row.action !== "skip").map((row) => ({
        ...normalizePurchaseReference(row),
        owner: owner || authProfile.username,
        status: status || "new"
      }));
      if (!clients.length) throw new Error("Nenhum cliente válido foi selecionado para importação.");
      const result = await postAnalyticsActionWithRetry("import_crm_clients", { clients, duplicateStrategy }, {
        maxAttempts: 3,
        onRetry: ({ attempt, maxAttempts }) => showToast(`Planilha ocupada. Nova tentativa ${attempt} de ${maxAttempts}...`)
      });
      await load({ silent: true });
      setIsClientImportOpen(false);
      const scopeMessage = result.scopeSkipped ? ` ${result.scopeSkipped} cliente(s) que já pertencem a outro vendedor foram ignorados com segurança.` : "";
      showToast(`${result.created || 0} cliente(s) criado(s) e ${result.updated || 0} atualizado(s).${scopeMessage} Backup: ${result.backupSheet || "não necessário"}.`);
      return result;
    } catch (error) {
      showToast(error.message || "Não foi possível importar a carteira.", "error");
      throw error;
    } finally {
      setIsSavingCrm(false);
    }
  }

  async function saveCrmTask(form) {
    const temporaryId = `LOCAL-TASK-${Date.now()}`;
    const optimistic = normalizeCrmTask({ ...form, taskId: temporaryId, status: "open", createdAt: new Date().toISOString() });
    setCrmTasks((current) => [optimistic, ...current]);
    try {
      const result = await postAnalyticsAction("upsert_crm_task", form);
      const task = normalizeCrmTask(result.task);
      setCrmTasks((current) => current.map((item) => String(item.taskId || item.id) === temporaryId ? task : item));
      showToast("Tarefa comercial criada.");
      return task;
    } catch (error) {
      setCrmTasks((current) => current.filter((item) => String(item.taskId || item.id) !== temporaryId));
      showToast(error.message || "Não foi possível criar a tarefa.", "error");
      throw error;
    }
  }

  async function completeCrmTask(taskId) {
    let previous;
    setCrmTasks((current) => current.map((item) => {
      if (String(item.taskId || item.id) !== taskId) return item;
      previous = item;
      return { ...item, status: "done", completedAt: new Date().toISOString(), savingState: "saving" };
    }));
    try {
      await postAnalyticsAction("complete_crm_task", { taskId });
      setCrmTasks((current) => current.map((item) => String(item.taskId || item.id) === taskId ? { ...item, savingState: "saved" } : item));
      showToast("Tarefa concluída.");
    } catch (error) {
      if (previous) setCrmTasks((current) => current.map((item) => String(item.taskId || item.id) === taskId ? previous : item));
      showToast(error.message || "Não foi possível concluir a tarefa.", "error");
    }
  }

  async function cancelCrmTask(taskId) {
    let previous;
    setCrmTasks((current) => current.map((item) => {
      if (String(item.taskId || item.id) !== taskId) return item;
      previous = item;
      return { ...item, status: "cancelled", completedAt: new Date().toISOString(), savingState: "saving" };
    }));
    try {
      await postAnalyticsAction("cancel_crm_task", { taskId });
      setCrmTasks((current) => current.map((item) => String(item.taskId || item.id) === taskId ? { ...item, savingState: "saved" } : item));
      showToast("Tarefa excluída da fila.");
    } catch (error) {
      if (previous) setCrmTasks((current) => current.map((item) => String(item.taskId || item.id) === taskId ? previous : item));
      showToast(error.message || "Não foi possível excluir a tarefa.", "error");
    }
  }

  async function completeCrmAction(row) {
    try {
      const result = await postAnalyticsAction("complete_crm_action", clientProfilePayload(row));
      const normalized = result.client;
      setCrmClients((current) => [normalized, ...current.filter((item) => companyKey(item.companyKey || item.companyName) !== row.companyKey)]);
      showToast("Ação finalizada. Ela volta se surgir um novo sinal do cliente.");
    } catch (error) { showToast(error.message || "Não foi possível finalizar a ação.", "error"); }
  }

  async function archiveClient(client) {
    if (!window.confirm(`Excluir ${client.company || client.companyName} da carteira e do funil? O histórico de navegação será preservado.`)) return false;
    try {
      const result = await postAnalyticsAction("archive_crm_client", clientProfilePayload(client));
      setCrmClients((current) => [result.client, ...current.filter((item) => companyKey(item.companyKey || item.companyName) !== companyKey(client.companyKey || client.companyName))]);
      setSelectedClient(null);
      showToast("Cliente removido da carteira. O histórico técnico foi preservado.");
      return true;
    } catch (error) { showToast(error.message || "Não foi possível excluir o cliente.", "error"); return false; }
  }

  async function saveClientNote(client, note) {
    const temporaryId = `LOCAL-NOTE-${Date.now()}`;
    const payload = { companyKey: client.companyKey, companyName: client.company, owner: client.owner, type: note.type || "contact_note", note: note.note, nextAction: note.nextAction || "", nextActionAt: note.nextActionAt || "", actionStatus: note.actionStatus || (note.nextAction ? "pending" : "") };
    const optimistic = normalizeCrmActivity({ ...payload, activityId: temporaryId, createdAt: new Date().toISOString() });
    setCrmActivities((current) => [optimistic, ...current]);
    let activity;
    try {
      const result = await postAnalyticsAction("record_crm_activity", payload);
      activity = normalizeCrmActivity(result.activity);
      setCrmActivities((current) => current.map((item) => item.activityId === temporaryId ? activity : item));
    } catch (error) {
      setCrmActivities((current) => current.filter((item) => item.activityId !== temporaryId));
      throw error;
    }
    const currentStatus = client.statusKey || client.status || "new";
    const automaticStatus = note.type === "quote_sent" ? "quoted" : (CONTACT_ACTIVITY_TYPES.includes(note.type) && currentStatus === "new" ? "contact" : "");
    if (automaticStatus) await saveClientProfile(clientProfilePayload(client, { status: automaticStatus, activityNote: `Movido automaticamente após: ${noteTypeLabel(note.type)}` }));
    showToast(automaticStatus ? `Atividade registrada e cliente movido para ${crmStatusLabel(automaticStatus)}.` : "Atividade adicionada ao histórico.");
    return activity;
  }

  async function updateClientNote(activityId, changes) {
    const result = await postAnalyticsAction("update_crm_activity", { activityId, ...changes });
    const activity = normalizeCrmActivity(result.activity);
    setCrmActivities((current) => current.map((item) => String(item.activityId || item.id) === activityId ? activity : item));
    showToast("Anotação atualizada.");
    return activity;
  }

  async function deleteClientNote(activityId) {
    if (!window.confirm("Excluir esta anotação do histórico?")) return;
    await postAnalyticsAction("delete_crm_activity", { activityId });
    setCrmActivities((current) => current.filter((item) => String(item.activityId || item.id) !== activityId));
    showToast("Anotação excluída.");
  }

  async function saveManualDemand(client, demand) {
    const temporaryId = `LOCAL-${Date.now()}`;
    const optimistic = { ...demand, demandId: temporaryId, companyKey: client.companyKey, companyName: client.company, owner: client.owner, status: "open", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setCrmDemands((current) => [optimistic, ...current]);
    try {
      const result = await postAnalyticsAction("upsert_crm_demand", { ...optimistic, demandId: "" });
      setCrmDemands((current) => [result.demand, ...current.filter((item) => item.demandId !== temporaryId && item.demandId !== result.demand.demandId)]);
      showToast("Demanda registrada e contabilizada em Produtos e Estoque.");
      return result.demand;
    } catch (error) {
      setCrmDemands((current) => current.filter((item) => item.demandId !== temporaryId));
      showToast(error.message || "Não foi possível registrar a demanda.", "error");
      throw error;
    }
  }

  async function updateManualDemandStatus(demandId, status) {
    const previous = crmDemands.find((item) => String(item.demandId) === String(demandId));
    setCrmDemands((current) => current.map((item) => String(item.demandId) === String(demandId) ? { ...item, status, resolvedAt: status === "resolved" ? new Date().toISOString() : "" } : item));
    try {
      const result = await postAnalyticsAction("update_crm_demand_status", { demandId, status });
      setCrmDemands((current) => current.map((item) => String(item.demandId) === String(demandId) ? result.demand : item));
      showToast(status === "resolved" ? "Demanda marcada como atendida." : "Demanda removida da análise.");
    } catch (error) {
      if (previous) setCrmDemands((current) => current.map((item) => String(item.demandId) === String(demandId) ? previous : item));
      showToast(error.message || "Não foi possível atualizar a demanda.", "error");
      throw error;
    }
  }

  async function recordClientOutcome(client, outcome) {
    try {
      const result = await postAnalyticsAction("record_crm_activity", {
        companyKey: client.companyKey,
        companyName: client.company,
        owner: client.owner,
        ...outcome
      });
      const activity = normalizeCrmActivity(result.activity);
      setCrmActivities((current) => [activity, ...current]);
      const status = outcome.type === "won" ? "won" : "lost";
      await saveClientProfile(clientProfilePayload(client, {
        status,
        expectedValue: safeNumber(outcome.value || client.expectedValue),
        lastOutcome: outcome.note || (status === "won" ? "Pedido fechado" : "Oportunidade perdida"),
        lostReason: status === "lost" ? outcome.reason || "Outro" : ""
      }));
      await postAnalyticsAction("close_commercial_cart", { companyKey: client.companyKey, companyName: client.company, outcome: status, reason: outcome.reason || "" });
      setReservations((current) => current.filter((item) => companyKey(item.company) !== client.companyKey));
      setCrmQuotes((current) => current.map((quote) => companyKey(quote.companyKey || quote.companyName) === client.companyKey && !["won", "lost"].includes(quote.status) ? { ...quote, status } : quote));
      showToast(status === "won" ? "Venda registrada no resultado do mês." : "Perda registrada para análise.");
    } catch (error) {
      showToast(error.message || "Não foi possível registrar o resultado.", "error");
      throw error;
    }
  }

  async function moveClientStage(client, status) {
    let lostReason = client.lostReason || "";
    if (status === "lost" && !lostReason) {
      lostReason = window.prompt(`Informe o motivo da perda:\n\n${LOST_REASONS.join(" · ")}`, "")?.trim() || "";
      if (!lostReason) { showToast("Informe o motivo antes de mover para Perdido.", "error"); return false; }
    }
    await saveClientProfile(clientProfilePayload(client, {
      status,
      lostReason: status === "lost" ? lostReason : ""
    }));
    return true;
  }

  async function markCartBusinessStatus(row, status) {
    const client = row.client || crmRows.find((item) => item.companyKey === row.companyKey);
    if (!client) { showToast("Abra o cliente e salve a ficha antes de alterar a situação.", "error"); return; }
    await moveClientStage(client, status);
    if (["won", "lost"].includes(status)) {
      await postAnalyticsAction("close_commercial_cart", { companyKey: client.companyKey, companyName: client.company, sessionId: row.sessionId || "", outcome: status, reason: status === "lost" ? client.lostReason || "Outro" : "" });
      setReservations((current) => current.filter((item) => companyKey(item.company) !== client.companyKey));
    }
    showToast(status === "won" ? "Carrinho movido para Pedido fechado." : status === "lost" ? "Carrinho movido para Perdido." : "Carrinho reaberto para acompanhamento.");
  }

  async function importExternalQuote(client, file) {
    const quote = await readExternalQuotePdf(file);
    const confirmed = window.confirm(`Importar/atualizar a cotação nº ${quote.externalNumber}?\n\nCliente no PDF: ${quote.companyName}\nItens identificados: ${quote.items.length}\nTotal: ${money(quote.total)}\n\nEla será vinculada a ${client.company}.`);
    if (!confirmed) return null;
    const result = await postAnalyticsAction("upsert_external_quote", { companyKey: client.companyKey, companyName: client.company, owner: client.owner, quote });
    setCrmQuotes((current) => [result.quote, ...current.filter((item) => String(item.quoteId) !== String(result.quote.quoteId))]);
    setCrmQuoteItems((current) => [...result.items.map((item, index) => ({ ...item, quoteId: result.quote.quoteId, lineNumber: index + 1 })), ...current.filter((item) => String(item.quoteId) !== String(result.quote.quoteId))]);
    await saveClientProfile(clientProfilePayload(client, { status: "quoted", expectedValue: quote.total }));
    showToast(result.updated ? "Cotação atualizada pela nova versão do PDF." : "Cotação importada e vinculada ao cliente.");
    return result;
  }

  async function mergeClientIdentity(client, sourceName) {
    const result = await postAnalyticsAction("merge_crm_clients", { sourceName, targetName: client.company, owner: client.owner });
    showToast(`${sourceName} foi mesclado a ${client.company}. Os próximos acessos serão reconhecidos automaticamente.`);
    setSelectedClient(null);
    await load({ silent: true });
    return result;
  }
  return {
    saveClientProfile,
    createManualClient,
    importClientPortfolio,
    saveCrmTask,
    completeCrmTask,
    cancelCrmTask,
    completeCrmAction,
    archiveClient,
    saveClientNote,
    updateClientNote,
    deleteClientNote,
    saveManualDemand,
    updateManualDemandStatus,
    recordClientOutcome,
    moveClientStage,
    markCartBusinessStatus,
    importExternalQuote,
    mergeClientIdentity
  };
}

export {
  useCrmActions
};


