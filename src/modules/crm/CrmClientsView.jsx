import React from "react";
import { Building2, CalendarDays, Send, TrendingUp, Upload, UserPlus } from "lucide-react";
import { StatGrid } from "../../components/StatGrid.jsx";
import { money } from "../../shared/formatting.js";
import ClientCrmTable from "./components/ClientCrmTable.jsx";

export default function CrmClientsView({
rows,
activities,
negotiationClients,
dueFollowUps,
onNewClient,
onImport,
onOpen,
pipelineStages,
quotedTotal
}) {
return ( <div className="view-stack">
<StatGrid items={[
{ icon: <Building2 />, label: "Clientes reais", value: rows.length },
{ icon: <TrendingUp />, label: "Em negociação", value: negotiationClients, emphasis: true },
{ icon: <CalendarDays />, label: "Próximos contatos vencidos", value: dueFollowUps },
{ icon: <Send />, label: "Valor cotado", value: money(quotedTotal), emphasis: true }
]} /> <div className="crm-view-actions"> <button type="button" className="crm-primary-action" onClick={onNewClient}> <UserPlus size={16} /> Novo cliente </button> <button type="button" className="crm-secondary-action" onClick={onImport}> <Upload size={16} /> Importar carteira </button> <span>PDF do SIGGMA, Excel ou CSV, sempre com prévia antes de gravar.</span> </div> <ClientCrmTable rows={rows} activities={activities} onOpen={onOpen} pipelineStages={pipelineStages} /> </div>
);
}