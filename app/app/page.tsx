
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const modules = [
  { id: "panel", icon: "▦", title: "Panel principal", desc: "Indicadores y resumen de operación", group: "GENERAL" },
  { id: "pedidos", icon: "▤", title: "Pedidos", desc: "Consulta, importación y seguimiento" },
  { id: "productos", icon: "◈", title: "Catálogo de productos", desc: "Maestro y características de producto" },
  { id: "inventarios", icon: "▥", title: "Inventarios", desc: "Existencias y cortes históricos" },
  { id: "planeacion", icon: "▦", title: "Planeación y programación", desc: "Plan diario de producto terminado" },
  { id: "produccion", icon: "⚙", title: "Seguimiento de producción", desc: "Producción real y cumplimiento" },
  { id: "incumplimientos", icon: "◷", title: "Incumplimientos y reprogramaciones", desc: "Pendientes, causas y ajustes" },
  { id: "reportes", icon: "▧", title: "Reportes", desc: "Consultas y exportación de resultados" },
  { id: "notificaciones", icon: "♧", title: "Notificaciones", desc: "Alertas y novedades de operación" },
  { id: "administracion", icon: "⚑", title: "Administración y permisos", desc: "Usuarios, accesos y configuración" },
];

const metrics = [
  { label: "Cantidad programada", value: "—", unit: "Unidades", note: "Pendiente de conexión" },
  { label: "Cantidad producida", value: "—", unit: "Unidades", note: "Pendiente de conexión" },
  { label: "Pedidos pendientes", value: "—", unit: "Pedidos", note: "Pendiente de conexión" },
  { label: "Cumplimiento producción", value: "—", unit: "%", note: "Pendiente de conexión" },
];

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="ops-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div>
            <strong>NUVANT <span>OPS</span></strong>
            <small>OPERATIONS MANAGEMENT</small>
          </div>
        </div>

        <div className="nav-label">ESPACIO DE TRABAJO</div>
        <nav className="navigation">
          {modules.map((item, index) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={index === 0 ? "nav-item active" : "nav-item"}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.title}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status"><span /> Sistema conectado</div>
          <small>NUVANT OPS · VERSIÓN 1.0</small>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <div className="breadcrumb">NUVANT OPS / GENERAL</div>
            <div className="page-heading">Panel principal</div>
          </div>
          <div className="user-area">
            <div className="user-avatar">{user.email?.charAt(0).toUpperCase() ?? "U"}</div>
            <div className="user-info">
              <strong>Usuario</strong>
              <small>{user.email}</small>
            </div>
          </div>
        </header>

        <div className="content">
          <section className="welcome">
            <div>
              <div className="eyebrow">CENTRO DE CONTROL OPERACIONAL</div>
              <h1>Planeación y control de<br /><span>producto terminado.</span></h1>
              <p>Gestiona pedidos, inventarios, programación y cumplimiento desde un solo lugar.</p>
            </div>
            <div className="welcome-symbol">N</div>
          </section>

          <div className="section-heading">
            <div>
              <h2>Resumen operativo</h2>
              <p>Indicadores principales de la operación</p>
            </div>
            <span className="demo-label">ESPERANDO CONEXIÓN DE DATOS</span>
          </div>

          <section className="metrics-grid">
            {metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <div className="metric-label">{metric.label}</div>
                <div className="metric-value">{metric.value}</div>
                <div className="metric-unit">{metric.unit}</div>
                <div className="metric-note">{metric.note}</div>
              </article>
            ))}
          </section>

          <div className="section-heading modules-heading">
            <div>
              <h2>Módulos del sistema</h2>
              <p>Selecciona un módulo para acceder a sus herramientas</p>
            </div>
            <span className="module-count">10 MÓDULOS</span>
          </div>

          <section className="modules-grid">
            {modules.filter((item) => item.id !== "panel").map((item, index) => (
              <article className="module-card" id={item.id} key={item.id}>
                <div className="module-top">
                  <div className="module-icon">{item.icon}</div>
                  <span className="module-number">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <div className="module-footer">
                  <span>ESTRUCTURA INICIAL</span>
                  <span className="module-arrow">↗</span>
                </div>
              </article>
            ))}
          </section>

          <footer className="footer">
            <span>NUVANT OPS · PLANEACIÓN DE PRODUCTO TERMINADO</span>
            <span>Versión inicial de desarrollo</span>
          </footer>
        </div>
      </section>

      <style jsx>{`
        :global(*) { box-sizing: border-box; }
        :global(body) { margin: 0; background: #f2f4f7; }
        .ops-shell { min-height: 100vh; display: flex; color: #202b38; font-family: Arial, sans-serif; }
        .sidebar { width: 258px; flex-shrink: 0; background: #142536; color: #fff; min-height: 100vh; padding: 27px 17px; display: flex; flex-direction: column; }
        .brand { display: flex; align-items: center; gap: 11px; padding: 0 8px 34px; }
        .brand-mark { width: 39px; height: 39px; display: grid; place-items: center; background: #ed792e; color: white; font-weight: 900; font-size: 23px; border-radius: 9px; }
        .brand strong { display: block; font-size: 17px; letter-spacing: 1px; }
        .brand strong span { color: #f18a43; }
        .brand small { display: block; color: #91a2b4; font-size: 8px; letter-spacing: 1.2px; margin-top: 5px; }
        .nav-label { color: #8192a4; font-size: 9px; letter-spacing: 1.4px; font-weight: bold; padding: 0 10px 13px; }
        .navigation { display: flex; flex-direction: column; gap: 5px; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 10px; color: #bdc9d5; text-decoration: none; border-radius: 7px; font-size: 12px; transition: .2s; }
        .nav-item:hover, .nav-item.active { background: #263d53; color: white; }
        .nav-item.active { border-left: 3px solid #ef812f; padding-left: 7px; }
        .nav-icon { width: 19px; text-align: center; font-size: 17px; color: #f18a43; }
        .sidebar-bottom { margin-top: auto; padding: 20px 9px 0; color: #8798a9; font-size: 9px; }
        .system-status { color: #b8c8d3; font-size: 11px; margin-bottom: 16px; }
        .system-status span { display: inline-block; width: 7px; height: 7px; background: #54bd85; border-radius: 50%; margin-right: 7px; }
        .main-area { min-width: 0; flex: 1; }
        .topbar { height: 76px; padding: 0 38px; background: white; border-bottom: 1px solid #e5e9ee; display: flex; align-items: center; justify-content: space-between; }
        .breadcrumb { color: #8996a4; font-size: 9px; letter-spacing: 1px; margin-bottom: 5px; }
        .page-heading { font-size: 16px; font-weight: bold; }
        .user-area { display: flex; align-items: center; gap: 10px; }
        .user-avatar { width: 35px; height: 35px; border-radius: 50%; background: #eaf0f5; color: #24435c; display: grid; place-items: center; font-weight: bold; }
        .user-info strong, .user-info small { display: block; }
        .user-info strong { font-size: 11px; }
        .user-info small { font-size: 10px; color: #82909e; margin-top: 3px; }
        .content { padding: 30px 38px; max-width: 1500px; margin: auto; }
        .welcome { background: #1b344b; border-radius: 11px; padding: 32px 36px; color: white; min-height: 190px; display: flex; justify-content: space-between; align-items: center; overflow: hidden; position: relative; }
        .eyebrow { color: #f19a60; font-size: 9px; letter-spacing: 1.7px; font-weight: bold; }
        .welcome h1 { font-size: clamp(25px, 3vw, 35px); line-height: 1.17; margin: 13px 0 10px; letter-spacing: -.7px; }
        .welcome h1 span { color: #f28a43; }
        .welcome p { font-size: 12px; color: #c0cbd5; margin: 0; }
        .welcome-symbol { font-size: 180px; font-weight: 900; line-height: 1; color: rgba(255,255,255,.055); margin-right: 30px; }
        .section-heading { display: flex; justify-content: space-between; align-items: center; margin: 30px 0 14px; gap: 12px; }
        .section-heading h2 { font-size: 16px; margin: 0 0 5px; }
        .section-heading p { font-size: 11px; color: #8995a2; margin: 0; }
        .demo-label, .module-count { color: #a66a3d; background: #fff1e7; padding: 7px 10px; border-radius: 4px; font-size: 8px; letter-spacing: .7px; font-weight: bold; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; }
        .metric-card { background: white; border: 1px solid #e7ebef; border-radius: 8px; padding: 17px; min-height: 125px; }
        .metric-label { color: #667584; font-size: 11px; }
        .metric-value { font-size: 27px; font-weight: bold; color: #1c3449; margin-top: 12px; }
        .metric-unit { display: inline-block; font-size: 9px; color: #8b98a5; margin-left: 5px; }
        .metric-note { border-top: 1px solid #edf0f3; margin-top: 12px; padding-top: 9px; color: #9aa5af; font-size: 9px; }
        .modules-heading { margin-top: 32px; }
        .modules-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; }
        .module-card { background: white; border: 1px solid #e7ebef; border-radius: 8px; padding: 17px; min-height: 155px; transition: .2s; scroll-margin-top: 20px; }
        .module-card:hover { border-color: #e6a06f; transform: translateY(-2px); box-shadow: 0 5px 18px rgba(25,45,65,.06); }
        .module-top { display: flex; align-items: center; justify-content: space-between; }
        .module-icon { width: 34px; height: 34px; border-radius: 7px; display: grid; place-items: center; background: #fff0e5; color: #df752f; font-size: 19px; }
        .module-number { font-size: 10px; color: #b2bbc4; }
        .module-card h3 { font-size: 13px; margin: 13px 0 5px; color: #27394a; }
        .module-card p { font-size: 10px; color: #8a97a4; margin: 0; }
        .module-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #eff1f3; margin-top: 15px; padding-top: 10px; color: #a1abb5; font-size: 8px; letter-spacing: .5px; }
        .module-arrow { color: #e77d38; font-size: 15px; }
        .footer { display: flex; justify-content: space-between; gap: 12px; color: #a0aab4; font-size: 9px; margin-top: 30px; padding: 17px 0; border-top: 1px solid #e2e7eb; }
        @media (max-width: 1050px) { .sidebar { width: 220px; } .content { padding: 25px 22px; } .topbar { padding: 0 22px; } .modules-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 700px) { .ops-shell { display: block; } .sidebar { width: 100%; min-height: auto; padding: 16px; } .brand { padding-bottom: 15px; } .navigation { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); } .nav-label, .sidebar-bottom { display: none; } .nav-item { font-size: 10px; padding: 9px 6px; } .topbar { height: 65px; padding: 0 16px; } .user-info { display: none; } .content { padding: 18px 14px; } .welcome { padding: 24px 20px; min-height: 170px; } .welcome-symbol { display: none; } .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .modules-grid { grid-template-columns: 1fr; } .section-heading { align-items: flex-start; flex-direction: column; } .footer { flex-direction: column; } }
      `}</style>
    </main>
  );
}
