import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export default async function Dashboard(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect("/login");
 const modules=[["Planeación de producto terminado","Programación y cumplimiento"],["Inventarios","Existencias, cobertura y rotación"],["Seguimiento de pedidos","Estado y fechas de entrega"],["Programación de producción","Capacidad y plan de fabricación"],["Abastecimiento","Disponibilidad de materiales"]];
 return <main className="wrap"><header className="top"><div className="brand">NUVANT OPS</div><div className="muted">{user.email}</div></header>
 <section className="panel" style={{marginBottom:20}}><span className="tag">Panel de control</span><h1>Bienvenido</h1><p className="muted">Centro inicial de planeación y control de producto terminado.</p><div className="notice">Versión inicial: los módulos son una estructura de navegación. Aún no almacenan ni procesan información operativa.</div></section>
 <section className="grid">{modules.map(([title,desc])=><article className="panel module" key={title}><span className="tag">Próximamente</span><h3>{title}</h3><p className="muted">{desc}</p></article>)}</section>
 </main>;
}