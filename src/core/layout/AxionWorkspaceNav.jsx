import React from "react";

const modules = [
{ id: "gestao", label: "AXION Gestão", initialView: "overview" },
{ id: "crm", label: "AXION CRM", initialView: "opportunities" },
{ id: "catalogo", label: "AXION Catálogo", initialView: "products" }
];

export default function AxionWorkspaceNav({
activeModule,
setActiveModule,
setActiveView,
visibleNavigation,
activeView,
currentView,
viewDescriptions
}) {
const currentModule = modules.find((item) => item.id === activeModule);

return (
<> <div className="axion-workspace-topbar">
<button
type="button"
className="axion-home-button"
onClick={() => setActiveModule("home")}
aria-label="Voltar ao início AXION"
>
← Início AXION </button> <span className="axion-workspace-context">
{currentModule?.label || "AXION"} </span> </div>

  <nav aria-label="Módulos AXION" className="axion-workspace-switcher">
    {modules.map((item) => (
      <button
        key={item.id}
        type="button"
        className={activeModule === item.id ? "active" : ""}
        aria-current={activeModule === item.id ? "page" : undefined}
        onClick={() => {
          setActiveModule(item.id);
          setActiveView(item.initialView);
        }}
      >
        {item.label}
      </button>
    ))}
  </nav>

  <nav className="analytics-nav" aria-label="Áreas do módulo atual">
    {visibleNavigation.map((item) => (
      <button
        key={item.id}
        type="button"
        className={activeView === item.id ? "active" : ""}
        aria-current={activeView === item.id ? "page" : undefined}
        onClick={() => setActiveView(item.id)}
      >
        {item.icon}
        <span>{item.label}</span>
        {item.badge ? <b>{item.badge}</b> : null}
      </button>
    ))}
  </nav>

  <section className="analytics-view-head">
    <div>
      <span>{currentModule?.label || "AXION"} · Área atual</span>
      <h2>{currentView?.label || "Visão geral"}</h2>
    </div>
    <p>{viewDescriptions[activeView]}</p>
  </section>
</>

);
}
