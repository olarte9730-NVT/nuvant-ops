"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import InventoryImport from "./inventarios/inventory-import";

type Field = { name: string; label: string; type?: string; required?: boolean; options?: string[] };
const modules: Record<string, { title: string; description: string; table: string; fields: Field[]; columns: string[] }> = {
  pedidos: { title: "Pedidos", description: "Registra pedidos y sus líneas de producto terminado.", table: "orders", fields: [
    {name:"order_number",label:"Número de pedido",required:true},{name:"source_customer_name",label:"Cliente",required:true},{name:"source_customer_code",label:"Código cliente"},{name:"created_on",label:"Fecha de creación",type:"date"},{name:"source_product_code",label:"Código producto",required:true},{name:"source_product_description",label:"Descripción producto"},{name:"required_date",label:"Fecha requerida",type:"date",required:true},{name:"requested_quantity",label:"Cantidad solicitada",type:"number",required:true},{name:"unit",label:"Unidad",required:true},{name:"observations",label:"Observaciones"}], columns:["order_number","source_customer_name","source_product_code","required_date","requested_quantity","status"] },
  inventarios: { title: "Inventarios", description: "Registra cortes de inventario de producto terminado. Cada carga conserva su fecha de corte.", table: "inventory_items", fields: [
    {name:"cutoff_date",label:"Fecha de corte",type:"date",required:true},{name:"source_product_code",label:"Código producto",required:true},{name:"source_product_description",label:"Descripción"},{name:"available_quantity",label:"Cantidad disponible",type:"number",required:true},{name:"unit",label:"Unidad",required:true},{name:"warehouse_location",label:"Bodega / ubicación"},{name:"lot",label:"Lote"},{name:"observations",label:"Observaciones"}], columns:["cutoff_date","source_product_code","source_product_description","available_quantity","unit","warehouse_location","lot"] },
  planeacion: { title: "Planeación y programación", description: "Programa producto terminado por producto, fecha y cantidad. La priorización es manual.", table: "production_schedules", fields: [
    {name:"product_code",label:"Código producto",required:true},{name:"product_description",label:"Descripción"},{name:"planned_date",label:"Fecha programada",type:"date",required:true},{name:"planned_quantity",label:"Cantidad programada",type:"number",required:true},{name:"unit",label:"Unidad",required:true},{name:"priority",label:"Prioridad",options:["low","normal","high","critical"]},{name:"observations",label:"Observaciones"}], columns:["planned_date","product_code","product_description","planned_quantity","unit","priority","status"] },
  produccion: { title: "Seguimiento de producción", description: "Registra producción real diaria por producto, incluyendo cantidad no conforme.", table: "production_actuals", fields: [
    {name:"production_date",label:"Fecha de producción",type:"date",required:true},{name:"product_code",label:"Código producto",required:true},{name:"product_description",label:"Descripción"},{name:"produced_quantity",label:"Cantidad producida",type:"number",required:true},{name:"rejected_quantity",label:"Cantidad rechazada",type:"number"},{name:"unit",label:"Unidad",required:true},{name:"responsible_name",label:"Responsable"},{name:"observations",label:"Observaciones"}], columns:["production_date","product_code","produced_quantity","rejected_quantity","unit","responsible_name"] },
  incumplimientos: { title: "Incumplimientos y reprogramaciones", description: "Registra cantidades afectadas y causas. Las reprogramaciones quedan trazadas.", table: "noncompliance_events", fields: [
    {name:"product_code",label:"Código producto",required:true},{name:"affected_date",label:"Fecha afectada",type:"date",required:true},{name:"affected_quantity",label:"Cantidad afectada",type:"number",required:true},{name:"cause",label:"Causa",options:["material_shortage","capacity_shortage","equipment_failure","quality_issue","other","commercial_priority_change"],required:true},{name:"description",label:"Detalle / motivo"}], columns:["affected_date","product_code","affected_quantity","cause","description"] },
  reportes: { title: "Reportes", description: "Consulta información consolidada y descarga los registros visibles en CSV.", table: "production_schedules", fields: [], columns: [] },
  notificaciones: { title: "Notificaciones", description: "Centro de alertas de tu usuario.", table: "notifications", fields: [], columns:["created_at","title","message","related_module","read_at"] },
  administracion: { title: "Administración y permisos", description: "Consulta los permisos asignados a tu usuario. La administración de otros usuarios requiere una política administrativa aprobada.", table: "module_permissions", fields: [], columns:["module_key","can_view","can_create","can_edit","can_delete","can_approve","can_import","can_export"] }
};
const labels: Record<string,string> = { low:"Baja",normal:"Normal",high:"Alta",critical:"Crítica",material_shortage:"Falta de materia prima/materiales",capacity_shortage:"Falta de capacidad",equipment_failure:"Falla de maquinaria/equipos",quality_issue:"Problemas de calidad",other:"Otros",commercial_priority_change:"Cambio de prioridades comerciales",scheduled:"Programado",in_progress:"En proceso",fully_produced:"Producido completamente",partially_produced:"Producido parcialmente",unfulfilled:"Incumplido",rescheduled:"Reprogramado",cancelled:"Cancelado",open:"Abierto",partially_planned:"Parcialmente programado",planned:"Programado",fulfilled:"Atendido" };
const nav = [["/app","Panel principal"],["/app/pedidos","Pedidos"],["/app/productos","Catálogo de productos"],["/app/inventarios","Inventarios"],["/app/planeacion","Planeación y programación"],["/app/produccion","Seguimiento de producción"],["/app/incumplimientos","Incumplimientos y reprogramaciones"],["/app/reportes","Reportes"],["/app/notificaciones","Notificaciones"],["/app/administracion","Administración y permisos"]];
const today = new Date().toISOString().slice(0,10);

export default function OperationsModule({ moduleKey }: { moduleKey: string }) {
  const config = modules[moduleKey];
  const supabase = useMemo(() => createClient(), []);
  const [rows,setRows] = useState<any[]>([]);
  const [inventorySnapshots,setInventorySnapshots] = useState<any[]>([]);
  const [selectedSnapshot,setSelectedSnapshot] = useState("");
  const [permission,setPermission] = useState<any>(null);
  const [userId,setUserId] = useState<string>("");
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");
  const [search,setSearch] = useState("");
  const [period,setPeriod] = useState("30");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const {data: auth,error: authError} = await supabase.auth.getUser();
    if (authError || !auth.user) { setError("Sesión no válida. Vuelve a ingresar."); setLoading(false); return; }
    setUserId(auth.user.id);
    const {data: perm,error: permError} = await supabase.from("module_permissions").select("*").eq("user_id",auth.user.id).eq("module_key",moduleKey).maybeSingle();
    if (permError) { setError("No fue posible consultar permisos: "+permError.message); setLoading(false); return; }
    setPermission(perm);
    if (!perm?.can_view) { setRows([]); setLoading(false); return; }
    if (moduleKey === "reportes") {
      const [s,a,o,n] = await Promise.all([
        supabase.from("production_schedules").select("*").order("planned_date",{ascending:false}).limit(500),
        supabase.from("production_actuals").select("*").order("production_date",{ascending:false}).limit(500),
        supabase.from("order_lines").select("*").order("required_date",{ascending:false}).limit(500),
        supabase.from("noncompliance_events").select("*").order("affected_date",{ascending:false}).limit(500)
      ]);
      if (s.error || a.error || o.error || n.error) setError("Error al construir reportes. Revisa los permisos de los módulos operativos.");
      setRows([{kind:"Programación",count:s.data?.length??0,quantity:(s.data??[]).reduce((x:any,r:any)=>x+Number(r.planned_quantity||0),0)},{kind:"Producción real",count:a.data?.length??0,quantity:(a.data??[]).reduce((x:any,r:any)=>x+Number(r.produced_quantity||0),0)},{kind:"Líneas de pedido",count:o.data?.length??0,quantity:(o.data??[]).reduce((x:any,r:any)=>x+Number(r.requested_quantity||0),0)},{kind:"Incumplimientos",count:n.data?.length??0,quantity:(n.data??[]).reduce((x:any,r:any)=>x+Number(r.affected_quantity||0),0)}]);
    } else {
      if (moduleKey==="inventarios") {
        const [{data:items,error:itemError},{data:snapshots,error:snapshotError}] = await Promise.all([
          supabase.from("inventory_items").select("*").limit(300),
          supabase.from("inventory_snapshots").select("id,cutoff_date").order("cutoff_date",{ascending:false}).limit(300)
        ]);
        if (itemError || snapshotError) {
          setError("No fue posible cargar la información: "+(itemError?.message??snapshotError?.message));
        } else {
          const cutoffBySnapshot = new Map((snapshots??[]).map((s:any)=>[s.id,s.cutoff_date]));
          const inventoryRows = (items??[]).map((r:any)=>({...r,cutoff_date:cutoffBySnapshot.get(r.snapshot_id)??null}));
          inventoryRows.sort((a:any,b:any)=>String(b.cutoff_date??"").localeCompare(String(a.cutoff_date??"")));
          setInventorySnapshots(snapshots??[]);
          setRows(inventoryRows);
        }
      } else {
        const {data,error: queryError} = await supabase.from(config.table).select("*").order("created_at",{ascending:false}).limit(300);
        if (queryError) setError("No fue posible cargar la información: "+queryError.message);
        else setRows(data??[]);
      }
    }
    setLoading(false);
  },[config.table,moduleKey,supabase]);
  useEffect(()=>{void load();},[load]);

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError(""); setNotice("");
    const fd = new FormData(e.currentTarget);
    const v=(key:string)=>String(fd.get(key)??"").trim();
    let result:any;
    if (moduleKey==="pedidos") {
      const {data:order,error:orderError}=await supabase.from("orders").insert({order_number:v("order_number"),source_customer_name:v("source_customer_name"),source_customer_code:v("source_customer_code")||null,created_on:v("created_on")||null,created_by:userId,updated_by:userId}).select("id").single();
      if(orderError){result={error:orderError};}
      else {
        const {error:lineError}=await supabase.from("order_lines").insert({order_id:order.id,line_number:1,source_product_code:v("source_product_code"),source_product_description:v("source_product_description")||null,required_date:v("required_date"),requested_quantity:Number(v("requested_quantity")),unit:v("unit")||"UND",observations:v("observations")||null});
        result={error:lineError};
      }
    } else if (moduleKey==="inventarios") {
      const {data:snap,error:snapError}=await supabase.from("inventory_snapshots").insert({cutoff_date:v("cutoff_date"),uploaded_by:userId,observations:v("observations")||null}).select("id").single();
      if(snapError) result={error:snapError};
      else { const {error:itemError}=await supabase.from("inventory_items").insert({snapshot_id:snap.id,source_product_code:v("source_product_code"),source_product_description:v("source_product_description")||null,available_quantity:Number(v("available_quantity")),unit:v("unit")||"UND",warehouse_location:v("warehouse_location")||null,lot:v("lot")||null,observations:v("observations")||null}); result={error:itemError};}
    } else {
      const payload:any={};
      for(const f of config.fields){const value=v(f.name); if(!value) continue; payload[f.name]=f.type==="number"?Number(value):value;}
      if(moduleKey==="planeacion"){payload.created_by=userId;payload.updated_by=userId;}
      if(moduleKey==="produccion") payload.recorded_by=userId;
      if(moduleKey==="incumplimientos") payload.recorded_by=userId;
      result=await supabase.from(config.table).insert(payload);
    }
    if(result?.error){setError("No se pudo guardar: "+result.error.message);}
    else {setNotice("Registro guardado correctamente.");e.currentTarget.reset();await load();}
    setSaving(false);
  }

  async function markRead(id:string) {
    const {error:e}=await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id).eq("user_id",userId);
    if(e)setError(e.message);else await load();
  }
  const filtered=rows.filter(r=>(moduleKey!=="inventarios" || !selectedSnapshot || r.snapshot_id===selectedSnapshot) && JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
  function exportCsv(){
    if(!filtered.length)return;
    const cols=Object.keys(filtered[0]);const csv=[cols.join(","),...filtered.map(r=>cols.map(c=>JSON.stringify(r[c]??"")).join(","))].join("\n");
    const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=moduleKey+"-"+today+".csv";a.click();URL.revokeObjectURL(url);
  }
  if(!config)return null;
  const canCreate=!!permission?.can_create && config.fields.length>0;
  return <main className="ops-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">N</div><div><strong>NUVANT <span>OPS</span></strong><small>OPERATIONS MANAGEMENT</small></div></div><div className="nav-label">ESPACIO DE TRABAJO</div><nav className="navigation">{nav.map(([href,label])=><a key={href} className={"nav-item "+((href==="/app/"+moduleKey)?"active":"")} href={href}><span>{label}</span></a>)}</nav><div className="sidebar-bottom"><div className="system-status"><span/> Sistema conectado</div><small>NUVANT OPS · VERSIÓN 1.1</small></div></aside>
    <section className="main-area"><header className="topbar"><div><div className="breadcrumb">NUVANT OPS / OPERACIÓN</div><div className="page-heading">{config.title}</div></div><a className="btn" href="/app">Volver al panel</a></header>
    <div style={{padding:"28px 36px",maxWidth:1500,margin:"auto"}}>
      <div className="section-heading"><div><h2>{config.title}</h2><p>{config.description}</p></div><span className="tag">{rows.length} registros</span></div>
      {notice&&<div className="notice-success">{notice}</div>}{error&&<div className="notice-error">{error}</div>}
      {permission&&!permission.can_view&&<div className="panel"><h3>Acceso no habilitado</h3><p>Tu usuario todavía no tiene permiso para consultar este módulo. Ejecuta la actualización de permisos indicada en la guía de despliegue.</p></div>}
      {moduleKey==="inventarios"&&<InventoryImport canImport={!!permission?.can_import && !!permission?.can_create} onImported={load} />}
      {canCreate&&<section className="panel" style={{marginBottom:22}}><h3>Nuevo registro</h3><form onSubmit={submit} className="ops-form">{config.fields.map(f=><label key={f.name}>{f.label}{f.required?" *":""}{f.options?<select name={f.name} required={f.required} defaultValue={f.options[0]}>{f.options.map(o=><option key={o} value={o}>{labels[o]??o}</option>)}</select>:<input name={f.name} type={f.type??"text"} required={f.required} step={f.type==="number"?"0.001":undefined} min={f.type==="number"?"0":undefined}/>}</label>)}<button className="btn-primary" disabled={saving}>{saving?"Guardando...":"Guardar registro"}</button></form></section>}
      {moduleKey==="reportes"&&<section className="metrics-grid" style={{marginBottom:22}}>{rows.map(r=><article className="metric-card" key={r.kind}><div className="metric-label">{r.kind}</div><div className="metric-value">{r.count}</div><div className="metric-unit">registros</div><div className="metric-note">Cantidad total: {Number(r.quantity).toLocaleString("es-CO")}</div></article>)}</section>}
      <section className="panel"><div className="section-heading"><div><h3>{moduleKey==="reportes"?"Resumen de reportes":moduleKey==="administracion"?"Permisos asignados":"Registros"}</h3><p>{moduleKey==="inventarios"?"Filtra por fecha de corte y busca por código, descripción, bodega o lote. Los cortes anteriores se mantienen disponibles.":"Consulta la información disponible en la base de datos."}</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{moduleKey==="inventarios"&&<select aria-label="Filtrar por corte de inventario" value={selectedSnapshot} onChange={e=>setSelectedSnapshot(e.target.value)}><option value="">Todos los cortes</option>{inventorySnapshots.map(s=><option key={s.id} value={s.id}>{s.cutoff_date}</option>)}</select>}<input className="search-input" placeholder={moduleKey==="inventarios"?"Buscar producto, bodega o lote...":"Buscar..."} value={search} onChange={e=>setSearch(e.target.value)}/>{permission?.can_export&&<button className="btn-secondary" onClick={exportCsv}>Exportar CSV</button>}</div></div>
        {loading?<p>Cargando información...</p>:filtered.length===0?<p>No hay registros para mostrar.</p>:moduleKey==="notificaciones"?<div className="record-list">{filtered.map(r=><article className="record-row" key={r.id}><div><strong>{r.title}</strong><p>{r.message}</p><small>{new Date(r.created_at).toLocaleString("es-CO")}</small></div>{!r.read_at&&<button className="btn-secondary" onClick={()=>markRead(r.id)}>Marcar leída</button>}</article>)}</div>:<div className="table-scroll"><table className="ops-table"><thead><tr>{(moduleKey==="reportes"?["kind","count","quantity"]:config.columns).map(c=><th key={c}>{c.replaceAll("_"," ")}</th>)}</tr></thead><tbody>{filtered.map((r,i)=><tr key={r.id??i}>{(moduleKey==="reportes"?["kind","count","quantity"]:config.columns).map(c=><td key={c}>{labels[String(r[c])]??(r[c]===null||r[c]===undefined?"—":typeof r[c]==="object"?JSON.stringify(r[c]):String(r[c]))}</td>)}</tr>)}</tbody></table></div>}
      </section>
      {moduleKey==="administracion"&&<p className="muted-note">Los permisos se consultan desde la configuración individual de tu cuenta. La edición de permisos requiere políticas de administración seguras; no se habilita desde el navegador en esta versión.</p>}
    </div></section>
  </main>;
}
