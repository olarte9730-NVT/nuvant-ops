import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const modules = [
  { id: "panel", icon: "▦", title: "Panel principal", desc: "Indicadores y resumen de operación", group: "GENERAL", href: "/app" },
  { id: "pedidos", icon: "▤", title: "Pedidos", desc: "Consulta, importación y seguimiento", href: "/app/pedidos" },
  { id: "productos", icon: "◈", title: "Catálogo de productos", desc: "Maestro y características de producto", href: "/app/productos" },
  { id: "inventarios", icon: "▥", title: "Inventarios", desc: "Existencias y cortes históricos", href: "/app/inventarios" },
  { id: "planeacion", icon: "▦", title: "Planeación y programación", desc: "Plan diario de producto terminado", href: "/app/planeacion" },
  { id: "produccion", icon: "⚙", title: "Seguimiento de producción", desc: "Producción real y cumplimiento", href: "/app/produccion" },
  { id: "incumplimientos", icon: "◷", title: "Incumplimientos y reprogramaciones", desc: "Pendientes, causas y ajustes", href: "/app/incumplimientos" },
  { id: "reportes", icon: "▧", title: "Reportes", desc: "Consultas y exportación de resultados", href: "/app/reportes" },
  { id: "notificaciones", icon: "♧", title: "Notificaciones", desc: "Alertas y novedades de operación", href: "/app/notificaciones" },
  { id: "administracion", icon: "⚑", title: "Administración y permisos", desc: "Usuarios, accesos y configuración", href: "/app/administracion" },
];

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <main className="ops-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">N</div><div><strong>NUVANT <span>OPS</span></strong><small>OPERATIONS MANAGEMENT</small></div></div><div className="nav-label">ESPACIO DE TRABAJO</div><nav className="navigation">{modules.map(item=><a key={item.id} href={item.href} className={item.id==="panel"?"nav-item active":"nav-item"}><span className="nav-icon">{item.icon}</span><span>{item.title}</span></a>)}</nav><div className="sidebar-bottom"><div className="system-status"><span/> Sistema conectado</div><small>NUVANT OPS · VERSIÓN 1.1</small></div></aside>
    <section className="main-area"><header className="topbar"><div><div className="breadcrumb">NUVANT OPS / GENERAL</div><div className="page-heading">Panel principal</div></div><div className="user-area"><div className="user-avatar">{user.email?.charAt(0).toUpperCase()??"U"}</div><div className="user-info"><strong>Usuario</strong><small>{user.email}</small></div></div></header>
      <div className="content"><section className="welcome"><div><div className="eyebrow">CENTRO DE CONTROL OPERACIONAL</div><h1>Planeación y control de<br/><span>producto terminado.</span></h1><p>Gestiona pedidos, inventarios, programación y cumplimiento desde un solo lugar.</p></div><div className="welcome-symbol">N</div></section>
      <div className="section-heading"><div><h2>Resumen operativo</h2><p>Selecciona un módulo para comenzar a gestionar la operación.</p></div><span className="module-count">10 MÓDULOS</span></div>
      <section className="modules-grid">{modules.filter(m=>m.id!=="panel").map((m,i)=><a className="module-card module-link" href={m.href} key={m.id}><div className="module-top"><div className="module-icon">{m.icon}</div><span className="module-number">{String(i+1).padStart(2,"0")}</span></div><h3>{m.title}</h3><p>{m.desc}</p><div className="module-footer"><span>ABRIR MÓDULO</span><span className="module-arrow">↗</span></div></a>)}</section>
      <footer className="footer"><span>NUVANT OPS · PLANEACIÓN DE PRODUCTO TERMINADO</span><span>Versión 1.1 · Desarrollo</span></footer></div>
    </section>
  </main>;
}
