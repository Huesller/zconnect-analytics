import React from "react";
import { Building2, Send, TrendingUp, UserCheck, UserPlus } from "lucide-react";
import { StatGrid } from "../../components/StatGrid.jsx";
import PipelineBoard from "./components/PipelineBoard.jsx";

export default function PipelineView({
rows,
activities,
tasks,
outOfFunnelRows,
closedFunnelRows,
onOpen,
onMove,
onNewClient
}) {
const quoted = rows.filter((item) => item.statusKey === "quoted").length;
const negotiating = rows.filter((item) => item.statusKey === "negotiation").length;
const won = closedFunnelRows.filter((item) => item.statusKey === "won").length;
const lost = closedFunnelRows.filter((item) => item.statusKey === "lost").length;

return ( <div className="view-stack">
<StatGrid items={[
{ icon: <Building2 />, label: "Clientes no funil", value: rows.length },
{ icon: <Send />, label: "Cotação enviada", value: quoted },
{ icon: <TrendingUp />, label: "Em negociação", value: negotiating, emphasis: true },
{ icon: <UserCheck />, label: "Fora do funil", value: outOfFunnelRows.length }
]} /> <div className="crm-view-actions"> <button type="button" className="crm-primary-action" onClick={onNewClient}> <UserPlus size={16} /> Cadastrar cliente </button> <span>O cliente será incluído diretamente na etapa escolhida.</span> </div> <PipelineBoard rows={rows} activities={activities} tasks={tasks} onOpen={onOpen} onMove={onMove} /> <section className="pipeline-closed-summary"> <div><strong>{won}</strong><span>pedidos fechados no histórico</span></div> <div><strong>{lost}</strong><span>oportunidades perdidas no histórico</span></div> <p>Ganhos e perdas não ocupam o Kanban ativo e continuam disponíveis nos relatórios e no Cliente 360.</p> </section> </div>
);
}