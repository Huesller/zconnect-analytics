import { useCallback } from "react";
import { fetchEvents } from "../api/analytics-client.js";
import { fetchActiveReservations } from "../api/reservation-client.js";
import {
  fetchCrmClients,
  fetchCrmTasks,
  fetchCrmActivities,
  fetchCrmSettings,
  fetchCrmQuotes,
  fetchCrmDemands
} from "../api/crm-client.js";

function useAppData({
  clientModalOpenRef,
  mergeLocalCrmRows,
  fetchCatalogHealth,
  invalidate,
  emptyPeriodMessage,
  setEvents,
  setReservations,
  setCrmClients,
  setCrmTasks,
  setCrmActivities,
  setCrmSettings,
  setCatalogHealth,
  setCrmQuotes,
  setCrmQuoteItems,
  setCrmDemands,
  setLastUpdatedAt,
  setStatus,
  setIsLoading
}) {
  const load = useCallback(async (options = {}) => {
    const silent = options?.silent === true;

    if (!silent) setStatus("Carregando eventos reais...");
    setIsLoading(true);

    try {
      const [
        data,
        activeReservations,
        savedCrmClients,
        savedTasks,
        savedActivities,
        savedSettings,
        savedCatalogHealth,
        savedQuotes,
        savedDemands
      ] = await Promise.all([
        fetchEvents(),
        fetchActiveReservations().catch(() => []),
        fetchCrmClients().catch(() => []),
        fetchCrmTasks().catch(() => []),
        fetchCrmActivities().catch(() => []),
        fetchCrmSettings().catch(() => ({})),
        fetchCatalogHealth().catch(() => ({ snapshots: [], products: [], latest: null })),
        fetchCrmQuotes().catch(() => ({ quotes: [], items: [] })),
        fetchCrmDemands().catch(() => [])
      ]);

      setEvents(data);
      setReservations(activeReservations);
      setCrmClients(savedCrmClients);
      setCrmTasks((current) =>
        clientModalOpenRef.current
          ? mergeLocalCrmRows(savedTasks, current, ["taskId", "id"])
          : savedTasks
      );
      setCrmActivities((current) =>
        clientModalOpenRef.current
          ? mergeLocalCrmRows(savedActivities, current, ["activityId", "id"])
          : savedActivities
      );
      setCrmSettings(savedSettings);
      setCatalogHealth(savedCatalogHealth);
      setCrmQuotes(savedQuotes.quotes || []);
      setCrmQuoteItems(savedQuotes.items || []);
      setCrmDemands((current) =>
        clientModalOpenRef.current
          ? mergeLocalCrmRows(savedDemands, current, ["demandId", "id"])
          : savedDemands
      );

      setLastUpdatedAt(new Date());

      const activeCarts = new Set(
        activeReservations.map((item) => item.sessionId)
      ).size;

      setStatus(
        data.length || activeCarts
          ? `${data.length} eventos · ${activeCarts} carrinho(s) ativo(s)`
          : emptyPeriodMessage
      );
    } catch (error) {
      if (error.message === "unauthorized") invalidate();

      setEvents([]);
      setReservations([]);
      setCrmClients([]);
      setStatus(error.message || "Não consegui carregar os eventos.");
    } finally {
      setIsLoading(false);
    }
  }, [
    clientModalOpenRef,
    mergeLocalCrmRows,
    fetchCatalogHealth,
    invalidate,
    emptyPeriodMessage,
    setEvents,
    setReservations,
    setCrmClients,
    setCrmTasks,
    setCrmActivities,
    setCrmSettings,
    setCatalogHealth,
    setCrmQuotes,
    setCrmQuoteItems,
    setCrmDemands,
    setLastUpdatedAt,
    setStatus,
    setIsLoading
  ]);

  return { load };
}

export {
  useAppData
};
