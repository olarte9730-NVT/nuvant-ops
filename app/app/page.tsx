
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

    </main>
  );
}
