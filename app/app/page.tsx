import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const modules = [
  { id: "panel", icon: "▦", title: "Panel principal", desc: "Indicadores y resumen de operación", href: "/app" },
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

const number = (value: number) => Math.round(value).toLocaleString("es-CO");
const dateKey = (value: string | null | undefined) => value ? value.slice(0, 10) : "";

function BarComparison({ title, subtitle, planned, actual }: { title: string; subtitle: string; planned: number[]; actual: number[] }) {
  const max = Math.max(1, ...planned, ...actual);
  const labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  return <section className="chart-card">
    <div className="chart-heading"><div><h3>{title}</h3><p>{subtitle}</p></div><div className="chart-legend"><span><i className="legend-planned"/>Programado</span><span><i className="legend-actual"/>Real</span></div></div>
    <div className="bar-chart" role="img" aria-label="Comparación de producción programada y real de los últimos siete días">
      {labels.map((label, i) => <div className="bar-group" key={label}>
        <div className="bar-pair"><div className="bar-track"><div className="bar planned" style={{height: (planned[i] / max * 100) + "%"}}/></div><div className="bar-track"><div className="bar actual" style={{height: (actual[i] / max * 100) + "%"}}/></div></div>
        <small>{label}</small>
      </div>)}
    </div>
    <div className="chart-foot"><span>Total programado <strong>{number(planned.reduce((a,b)=>a+b,0))}</strong></span><span>Total producido <strong>{number(actual.reduce((a,b)=>a+b,0))}</strong></span></div>
  </section>;
}

function StatusDonut({ fulfilled, pending }: { fulfilled: number; pending: number }) {
  const total = fulfilled + pending;
  const pct = total ? Math.round(fulfilled / total * 100) : 0;
  return <section className="chart-card status-card">
    <div className="chart-heading"><div><h3>Estado de cumplimiento</h3><p>Distribución según registros disponibles</p></div></div>
    <div className="donut-layout"><div className="donut" style={{background: "conic-gradient(#ed792e 0 " + pct + "%, #e7edf2 " + pct + "% 100%)"}}><div><strong>{total ? pct + "%" : "—"}</strong><small>Atendido</small></div></div>
      <div className="donut-legend"><span><i className="legend-fulfilled"/>Atendido <b>{number(fulfilled)}</b></span><span><i className="legend-pending"/>Pendiente / afectado <b>{number(pending)}</b></span></div>
    </div>
    {!total && <p className="empty-chart">Aún no hay datos suficientes para calcular el cumplimiento.</p>}
  </section>;
}

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: permissions } = await supabase.from("module_permissions").select("module_key,can_view").eq("user_id", user.id);
  const can = (key: string) => !!permissions?.some((p: any) => p.module_key === key && p.can_view);
  const [schedulesRes, actualsRes, ordersRes, inventoryRes, incidentsRes] = await Promise.all([
    can("planeacion") ? supabase.from("production_schedules").select("planned_date,planned_quantity,status").order("planned_date", {ascending:false}).limit(1000) : Promise.resolve({data:[],error:null} as any),
    can("produccion") ? supabase.from("production_actuals").select("production_date,produced_quantity,rejected_quantity").order("production_date", {ascending:false}).limit(1000) : Promise.resolve({data:[],error:null} as any),
    can("pedidos") ? supabase.from("order_lines").select("id,order_id,required_date,requested_quantity,status").limit(1000) : Promise.resolve({data:[],error:null} as any),
    can("inventarios") ? (async () => { const {data:snapshot,error:snapshotError} = await supabase.from("inventory_snapshots").select("id,cutoff_date").order("cutoff_date",{ascending:false}).limit(1).maybeSingle(); if (snapshotError) return {data:[],error:snapshotError}; if (!snapshot) return {data:[],error:null}; return await supabase.from("inventory_items").select("available_quantity,snapshot_id").eq("snapshot_id",snapshot.id).limit(2000); })() : Promise.resolve({data:[],error:null} as any),
    can("incumplimientos") ? supabase.from("noncompliance_events").select("affected_date,affected_quantity").order("affected_date",{ascending:false}).limit(1000) : Promise.resolve({data:[],error:null} as any)
  ]);

  const schedules = schedulesRes.data ?? [];
  const actuals = actualsRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const inventory = inventoryRes.data ?? [];
  const incidents = incidentsRes.data ?? [];
  const plannedTotal = schedules.reduce((sum:number,r:any)=>sum+Number(r.planned_quantity||0),0);
  const actualTotal = actuals.reduce((sum:number,r:any)=>sum+Number(r.produced_quantity||0),0);
  const inventoryTotal = inventory.reduce((sum:number,r:any)=>sum+Number(r.available_quantity||0),0);
  const rejectedTotal = actuals.reduce((sum:number,r:any)=>sum+Number(r.rejected_quantity||0),0);
  const orderTotal = orders.reduce((sum:number,r:any)=>sum+Number(r.requested_quantity||0),0);
  const distinctOrders = new Set(orders.map((r:any)=>r.order_id).filter(Boolean)).size;
  const fulfilled = orders.filter((r:any)=>["fulfilled","fully_produced","attended","atendido"].includes(String(r.status||"").toLowerCase())).length;
  const pending = Math.max(0, orders.length - fulfilled);
  const days = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d.toISOString().slice(0,10);});
  const daily = (items:any[], dateField:string, qtyField:string) => days.map(day=>items.filter(r=>dateKey(r[dateField])===day).reduce((sum:number,r:any)=>sum+Number(r[qtyField]||0),0));
  const plannedByDay = daily(schedules,"planned_date","planned_quantity");
  const actualByDay = daily(actuals,"production_date","produced_quantity");
  const hasErrors = [schedulesRes,actualsRes,ordersRes,inventoryRes,incidentsRes].some((r:any)=>r.error);
  const recentIncidents = incidents.slice(0,5);
  const visibleModules = modules.filter(m=>m.id!=="panel" && (m.id==="productos" || can(m.id)));

  return <main className="ops-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-logo-wrap"><img src="https://yt3.googleusercontent.com/WqRUC__73xXuDipIeZN9x1xpCiob-s6Viv7AxOIc4fOb1DsP1P_YKsmQQyy7wojPk9UDMrby=s900-c-k-c0x00ffffff-no-rj" alt="Logo Nuvant" /></div><div className="brand-wordmark"><strong>OPS</strong><small>OPERATIONS MANAGEMENT</small></div></div><div className="nav-label">ESPACIO DE TRABAJO</div><nav className="navigation">{modules.map(item=><a key={item.id} href={item.href} className={item.id==="panel"?"nav-item active":"nav-item"}><span className="nav-icon">{item.icon}</span><span>{item.title}</span></a>)}</nav><div className="sidebar-bottom"><div className="system-status"><span/> Sistema conectado</div><small>NUVANT OPS · VERSIÓN 1.2</small></div></aside>
    <section className="main-area"><header className="topbar"><div><div className="breadcrumb">NUVANT OPS / GENERAL</div><div className="page-heading">Panel principal</div></div><div className="user-area"><div className="user-avatar">{user.email?.charAt(0).toUpperCase()??"U"}</div><div className="user-info"><strong>Usuario</strong><small>{user.email}</small></div></div></header>
      <div className="content">
        <section className="welcome"><div><div className="eyebrow">CENTRO DE CONTROL OPERACIONAL</div><h1>Planeación y control de<br/><span>producto terminado.</span></h1><p>Gestiona pedidos, inventarios, programación y cumplimiento desde un solo lugar.</p></div><div className="welcome-symbol">N</div></section>
        <div className="section-heading"><div><h2>Indicadores de operación</h2><p>Información consultada desde los registros disponibles en tu cuenta.</p></div><span className="module-count">DATOS EN VIVO</span></div>
        {hasErrors && <div className="notice-error">Algunos indicadores no pudieron consultarse por permisos o disponibilidad de datos. Los valores visibles corresponden únicamente a consultas exitosas.</div>}
        <section className="metrics-grid">
          <article className="metric-card"><div className="metric-label">Pedidos registrados</div><div className="metric-value">{number(distinctOrders)}</div><div className="metric-note">Cantidad solicitada: {number(orderTotal)}</div></article>
          <article className="metric-card"><div className="metric-label">Inventario disponible</div><div className="metric-value">{number(inventoryTotal)}</div><div className="metric-note">Suma de existencias consultadas</div></article>
          <article className="metric-card"><div className="metric-label">Producción real</div><div className="metric-value">{number(actualTotal)}</div><div className="metric-note">Rechazado: {number(rejectedTotal)}</div></article>
          <article className="metric-card"><div className="metric-label">Programación</div><div className="metric-value">{number(plannedTotal)}</div><div className="metric-note">Cantidad programada total</div></article>
        </section>
        <section className="dashboard-charts"><BarComparison title="Producción: programado vs. real" subtitle="Comparativo diario de los últimos siete días" planned={plannedByDay} actual={actualByDay}/><StatusDonut fulfilled={fulfilled} pending={pending}/></section>
        <section className="dashboard-lower">
          <section className="chart-card"><div className="chart-heading"><div><h3>Alertas e incumplimientos</h3><p>Eventos registrados más recientes</p></div><a href="/app/incumplimientos">Ver módulo ↗</a></div>
            {recentIncidents.length ? <div className="alert-list">{recentIncidents.map((r:any,i:number)=><div className="alert-row" key={i}><span className="alert-dot"/><div><strong>Incumplimiento registrado</strong><small>{dateKey(r.affected_date)||"Fecha no disponible"} · Cantidad afectada: {number(Number(r.affected_quantity||0))}</small></div></div>)}</div> : <p className="empty-chart">No hay incumplimientos registrados para mostrar.</p>}
          </section>
          <section className="chart-card"><div className="chart-heading"><div><h3>Accesos rápidos</h3><p>Continúa con la gestión operativa</p></div></div><div className="quick-links">{visibleModules.slice(0,6).map(m=><a href={m.href} key={m.id}><span>{m.icon}</span>{m.title}<b>↗</b></a>)}</div></section>
        </section>
        <footer className="footer"><span>NUVANT OPS · PLANEACIÓN DE PRODUCTO TERMINADO</span><span>Versión 1.2 · Desarrollo</span></footer>
      </div>
    </section>
  </main>;
}
