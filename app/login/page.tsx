import { signIn } from "./actions";
export default async function Login({searchParams}:{searchParams:Promise<{error?:string}>}) {
 const {error}=await searchParams;
 return <main className="wrap"><section className="panel form">
 <div className="brand">NUVANT <span className="muted">OPS</span></div>
 <h1>Iniciar sesión</h1><p className="muted">Herramienta de planeación y control de producto terminado.</p>
 {error==="domain" && <p className="error">Solo se permiten correos @nuvantglobal.com.</p>}
 {error==="credentials" && <p className="error">No fue posible iniciar sesión. Verifica tus credenciales.</p>}
 <form action={signIn}><label>Correo corporativo</label><input className="field" name="email" type="email" required placeholder="usuario@nuvantglobal.com"/><label>Contraseña</label><input className="field" name="password" type="password" required/><button className="btn" type="submit">Ingresar</button></form>
 <p className="muted" style={{fontSize:12,marginTop:24}}>Las cuentas deben ser creadas previamente por el administrador en Supabase.</p>
 </section></main>;
}