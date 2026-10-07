import { companyKey as defaultCompanyKey } from "../../../shared/company-utils.js";
async function handleSelectiveCleanup({ selectedCleanupKeys, cleanupCandidates, postAnalyticsActionWithRetry, showToast, setIsCleaning, setQualityStatus, setSelectedCleanupKeys, setPeriod, setConsultant, setCompany, setEventFilter, setProductFilter, load }) {
    if (!selectedCleanupKeys.length) {
      showToast("Selecione pelo menos uma empresa para limpar.", "error");
      return;
    }
    const selectedCandidates = cleanupCandidates.filter((item) => selectedCleanupKeys.includes(item.companyKey || "__empty__"));
    const totalEvents = selectedCandidates.reduce((sum, item) => sum + item.eventCount, 0);
    const confirmed = window.confirm(`Excluir ${totalEvents} eventos de ${selectedCandidates.length} empresa(s) de teste/não identificadas? Um backup será criado na planilha.`);
    if (!confirmed) return;

    setIsCleaning(true);
    setQualityStatus("Criando backup e removendo somente os registros selecionados...");
    try {
      const result = await postAnalyticsActionWithRetry("cleanup_selected_companies", {
        companyKeys: selectedCleanupKeys.map((key) => key === "__empty__" ? "" : key)
      }, { onRetry: ({ attempt, maxAttempts }) => setQualityStatus(`Planilha ocupada por outra atualização. Nova tentativa ${attempt} de ${maxAttempts}...`) });
      setQualityStatus(`${result.removedEvents} eventos removidos. Backup: ${result.backupSheet}.`);
      showToast(`${result.removedEvents} eventos de teste removidos com segurança.`);
      setSelectedCleanupKeys([]);
      setPeriod("all");
      setConsultant("all");
      setCompany("all");
      setEventFilter("all");
      setProductFilter("");
      await load({ silent: true });
    } catch (error) {
      setQualityStatus(error.message || "Falha ao limpar os dados.");
      showToast(error.message || "Falha ao limpar os dados.", "error");
    } finally {
      setIsCleaning(false);
    }
  }

async function handleMergeDuplicates({ duplicateCompanyGroups, postAnalyticsActionWithRetry, showToast, setIsCleaning, setQualityStatus, load }) {
    const merges = duplicateCompanyGroups.flatMap((group) => group.variants
      .filter((variant) => variant.name !== group.targetName)
      .map((variant) => ({ sourceName: variant.name, targetName: group.targetName })));
    if (!merges.length) return;
    if (!window.confirm(`Unificar ${merges.length} variação(ões) de nomes? Um backup será criado antes da alteração.`)) return;
    setIsCleaning(true);
    setQualityStatus("Criando backup e unificando nomes duplicados...");
    try {
      const result = await postAnalyticsActionWithRetry("merge_companies", { merges }, {
        onRetry: ({ attempt, maxAttempts }) => setQualityStatus(`Planilha ocupada por outra atualização. Nova tentativa ${attempt} de ${maxAttempts}...`)
      });
      setQualityStatus(`${result.mergedEvents} eventos padronizados. Backup: ${result.backupSheet}.`);
      showToast("Nomes duplicados unificados com segurança.");
      await load({ silent: true });
    } catch (error) {
      setQualityStatus(error.message || "Falha ao unificar empresas.");
      showToast(error.message || "Falha ao unificar empresas.", "error");
    } finally {
      setIsCleaning(false);
    }
  }

async function handleManualMerge({ targetName, sourceNames, postAnalyticsActionWithRetry, showToast, setIsCleaning, setQualityStatus, load }) {
    const sources = sourceNames.filter((name) => name && name !== targetName);
    if (!targetName || !sources.length) {
      showToast("Escolha a empresa principal e ao menos uma variação.", "error");
      return false;
    }
    const confirmed = window.confirm(`Mesclar ${sources.length} empresa(s) em “${targetName}”? Eventos, CRM, carrinhos e ofertas serão padronizados. Um backup será criado antes da alteração.`);
    if (!confirmed) return false;
    setIsCleaning(true);
    setQualityStatus(`Criando backup e mesclando ${sources.length} empresa(s) em ${targetName}...`);
    try {
      const result = await postAnalyticsActionWithRetry("merge_companies", { merges: sources.map((sourceName) => ({ sourceName, targetName })) }, {
        onRetry: ({ attempt, maxAttempts }) => setQualityStatus(`Outra rotina está gravando na planilha. Tentativa automática ${attempt} de ${maxAttempts}...`)
      });
      setQualityStatus(`${result.mergedEvents} registro(s) padronizado(s). Backup: ${result.backupSheet || "criado pelo servidor"}.`);
      showToast("Empresas mescladas com segurança.");
      await load({ silent: true });
      return true;
    } catch (error) {
      if (error.message === "nothing_to_merge") {
        setQualityStatus("As empresas já foram unificadas pela tentativa anterior. Atualizando a tela...");
        showToast("Empresas já unificadas com sucesso.");
        await load({ silent: true });
        return true;
      }
      setQualityStatus(error.message || "Falha ao mesclar empresas.");
      showToast(error.message || "Falha ao mesclar empresas.", "error");
      return false;
    } finally {
      setIsCleaning(false);
    }
  }

async function handleCompanyDataDeletion({ companyNames, scopes, companyKey, postAnalyticsActionWithRetry, showToast, setIsCleaning, setQualityStatus, setSelectedClient, load }) {
    const names = [...new Set(companyNames.filter(Boolean))];
    if (!names.length || !scopes.length) {
      showToast("Escolha ao menos uma empresa e um tipo de dado para excluir.", "error");
      return false;
    }
    const scopeLabels = {
      events: "histórico de navegação",
      crm_clients: "ficha do cliente",
      crm_tasks: "tarefas",
      crm_activities: "atividades CRM",
      reservations: "carrinhos/reservas",
      offers: "links especiais"
    };
    const warning = scopes.includes("offers") ? " Links especiais removidos deixarão de abrir." : "";
    const confirmed = window.confirm(`Excluir ${scopes.map((scope) => scopeLabels[scope]).join(", ")} de ${names.length} empresa(s)? Um backup separado será criado para cada área.${warning}`);
    if (!confirmed) return false;
    setIsCleaning(true);
    setQualityStatus("Criando backups e excluindo somente os dados escolhidos...");
    try {
      const result = await postAnalyticsActionWithRetry("delete_company_data", {
        companyKeys: names.map(companyKey),
        scopes
      }, { onRetry: ({ attempt, maxAttempts }) => setQualityStatus(`Outra rotina está gravando na planilha. Tentativa automática ${attempt} de ${maxAttempts}...`) });
      setQualityStatus(`${result.totalRemoved || 0} registro(s) excluído(s). Backup(s): ${(result.backupSheets || []).join(", ") || "nenhum registro encontrado"}.`);
      showToast(`${result.totalRemoved || 0} registro(s) excluído(s) com segurança.`);
      setSelectedClient(null);
      await load({ silent: true });
      return true;
    } catch (error) {
      setQualityStatus(error.message || "Falha ao excluir os dados selecionados.");
      showToast(error.message || "Falha ao excluir os dados selecionados.", "error");
      return false;
    } finally {
      setIsCleaning(false);
    }
  }


export {
  handleSelectiveCleanup,
  handleMergeDuplicates,
  handleManualMerge,
  handleCompanyDataDeletion
};
