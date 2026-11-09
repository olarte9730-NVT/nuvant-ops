"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  product_code: string;
  description: string;
  family: string | null;
  unit: string;
  production_line: string | null;
  active: boolean;
  observations: string | null;
};

type Permissions = {
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

const emptyForm = {
  product_code: "",
  description: "",
  family: "",
  unit: "UND",
  production_line: "",
  active: true,
  observations: "",
};

export default function ProductCatalog() {
  const supabase = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: permission, error: permissionError } = await supabase
      .from("module_permissions")
      .select("can_view,can_create,can_edit,can_delete")
      .eq("module_key", "productos")
      .maybeSingle();

    if (permissionError) {
      setError("No fue posible consultar tus permisos. Verifica la conexión y las políticas de seguridad.");
      setLoading(false);
      return;
    }

    const access = permission as Permissions | null;
    setPermissions(access);

    if (!access?.can_view) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const { data, error: productsError } = await supabase
      .from("products")
      .select("id,product_code,description,family,unit,production_line,active,observations")
      .order("product_code", { ascending: true });

    if (productsError) {
      setError("No fue posible cargar el catálogo. " + productsError.message);
    } else {
      setProducts((data ?? []) as Product[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredProducts = products.filter((product) => {
    const term = search.trim().toLowerCase();
    return !term || [
      product.product_code,
      product.description,
      product.family ?? "",
      product.production_line ?? "",
    ].some((value) => value.toLowerCase().includes(term));
  });

  function updateField(name: keyof typeof emptyForm, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      product_code: product.product_code,
      description: product.description,
      family: product.family ?? "",
      unit: product.unit,
      production_line: product.production_line ?? "",
      active: product.active,
      observations: product.observations ?? "",
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      product_code: form.product_code.trim(),
      description: form.description.trim(),
      family: form.family.trim() || null,
      unit: form.unit.trim() || "UND",
      production_line: form.production_line.trim() || null,
      active: form.active,
      observations: form.observations.trim() || null,
    };

    if (!payload.product_code || !payload.description) {
      setError("El código y la descripción son obligatorios.");
      setSaving(false);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    const result = editingId
      ? await supabase.from("products").update({ ...payload, updated_by: userId }).eq("id", editingId)
      : await supabase.from("products").insert({ ...payload, created_by: userId, updated_by: userId });

    if (result.error) {
      setError(result.error.code === "23505"
        ? "Ya existe un producto con ese código."
        : "No fue posible guardar el producto. " + result.error.message);
    } else {
      setMessage(editingId ? "Producto actualizado correctamente." : "Producto creado correctamente.");
      resetForm();
      await loadData();
    }
    setSaving(false);
  }

  async function deleteProduct(product: Product) {
    if (!permissions?.can_delete) return;
    if (!window.confirm("¿Eliminar el producto " + product.product_code + "? Esta acción no se puede deshacer.")) return;

    const { error: deleteError } = await supabase.from("products").delete().eq("id", product.id);
    if (deleteError) {
      setError("No fue posible eliminar el producto. " + deleteError.message);
    } else {
      setMessage("Producto eliminado.");
      await loadData();
    }
  }

  const styles: Record<string, React.CSSProperties> = {
    page: { padding: "30px 38px", maxWidth: 1500, margin: "auto" },
    heading: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 22, flexWrap: "wrap" },
    title: { margin: 0, fontSize: 24, color: "#1b344b" },
    subtitle: { color: "#82909e", fontSize: 12, marginTop: 7 },
    panel: { background: "#fff", border: "1px solid #e5e9ee", borderRadius: 10, padding: 22, marginBottom: 18 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 },
    label: { display: "block", color: "#526170", fontSize: 11, fontWeight: 700, marginBottom: 6 },
    input: { width: "100%", border: "1px solid #d5dce3", borderRadius: 7, padding: "10px 11px", fontSize: 13, color: "#263747", background: "#fff" },
    button: { border: 0, borderRadius: 7, padding: "10px 15px", background: "#1b344b", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 12 },
    secondary: { border: "1px solid #d5dce3", borderRadius: 7, padding: "9px 13px", background: "#fff", color: "#405365", cursor: "pointer", fontSize: 12 },
    tableWrap: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 },
    th: { textAlign: "left", color: "#82909e", fontSize: 10, letterSpacing: ".5px", padding: "12px 10px", borderBottom: "1px solid #e8edf1" },
    td: { padding: "13px 10px", borderBottom: "1px solid #eef1f4", color: "#344657" },
  };

  return (
    <main className="ops-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div><strong>NUVANT <span>OPS</span></strong><small>OPERATIONS MANAGEMENT</small></div>
        </div>
        <div className="nav-label">ESPACIO DE TRABAJO</div>
        <nav className="navigation">
          <a className="nav-item" href="/app"><span className="nav-icon">▦</span><span>Panel principal</span></a>
          <a className="nav-item" href="/app#pedidos"><span className="nav-icon">▤</span><span>Pedidos</span></a>
          <a className="nav-item active" href="/app/productos"><span className="nav-icon">◈</span><span>Catálogo de productos</span></a>
          <a className="nav-item" href="/app#inventarios"><span className="nav-icon">▥</span><span>Inventarios</span></a>
          <a className="nav-item" href="/app#planeacion"><span className="nav-icon">▦</span><span>Planeación y programación</span></a>
          <a className="nav-item" href="/app#produccion"><span className="nav-icon">⚙</span><span>Seguimiento de producción</span></a>
          <a className="nav-item" href="/app#incumplimientos"><span className="nav-icon">◷</span><span>Incumplimientos y reprogramaciones</span></a>
          <a className="nav-item" href="/app#reportes"><span className="nav-icon">▧</span><span>Reportes</span></a>
          <a className="nav-item" href="/app#notificaciones"><span className="nav-icon">♧</span><span>Notificaciones</span></a>
          <a className="nav-item" href="/app#administracion"><span className="nav-icon">⚑</span><span>Administración y permisos</span></a>
        </nav>
        <div className="sidebar-bottom"><div className="system-status"><span /> Sistema conectado</div><small>NUVANT OPS · VERSIÓN 1.0</small></div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div><div className="breadcrumb">NUVANT OPS / MAESTROS</div><div className="page-heading">Catálogo de productos</div></div>
          <a className="btn" href="/app">Volver al panel</a>
        </header>

        <div style={styles.page}>
          <div style={styles.heading}>
            <div><h1 style={styles.title}>Catálogo de productos</h1><div style={styles.subtitle}>Administra el maestro de producto terminado.</div></div>
            <span className="tag">{products.length} productos registrados</span>
          </div>

          {message && <div style={{ ...styles.panel, padding: 13, color: "#176b43", background: "#effaf4", borderColor: "#b8e5ca" }}>{message}</div>}
          {error && <div style={{ ...styles.panel, padding: 13, color: "#a12b25", background: "#fff3f1", borderColor: "#f0c2bd" }}>{error}</div>}

          {permissions?.can_create || permissions?.can_edit ? (
            <section style={styles.panel}>
              <h2 style={{ margin: "0 0 18px", fontSize: 15, color: "#1b344b" }}>{editingId ? "Editar producto" : "Registrar producto"}</h2>
              <form onSubmit={saveProduct}>
                <div style={styles.grid}>
                  <div><label style={styles.label}>Código de producto *</label><input style={styles.input} value={form.product_code} onChange={(e) => updateField("product_code", e.target.value)} required disabled={!!editingId} /></div>
                  <div><label style={styles.label}>Descripción *</label><input style={styles.input} value={form.description} onChange={(e) => updateField("description", e.target.value)} required /></div>
                  <div><label style={styles.label}>Familia / categoría</label><input style={styles.input} value={form.family} onChange={(e) => updateField("family", e.target.value)} /></div>
                  <div><label style={styles.label}>Unidad de medida</label><input style={styles.input} value={form.unit} onChange={(e) => updateField("unit", e.target.value)} /></div>
                  <div><label style={styles.label}>Línea de producción</label><input style={styles.input} value={form.production_line} onChange={(e) => updateField("production_line", e.target.value)} /></div>
                  <div><label style={styles.label}>Estado</label><select style={styles.input} value={form.active ? "active" : "inactive"} onChange={(e) => updateField("active", e.target.value === "active")}><option value="active">Activo</option><option value="inactive">Inactivo</option></select></div>
                  <div style={{ gridColumn: "1 / -1" }}><label style={styles.label}>Observaciones</label><textarea style={{ ...styles.input, minHeight: 70, resize: "vertical" }} value={form.observations} onChange={(e) => updateField("observations", e.target.value)} /></div>
                </div>
                <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
                  <button style={styles.button} type="submit" disabled={saving}>{saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear producto"}</button>
                  {editingId && <button style={styles.secondary} type="button" onClick={resetForm}>Cancelar edición</button>}
                </div>
              </form>
            </section>
          ) : null}

          <section style={styles.panel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 15, color: "#1b344b" }}>Productos registrados</h2>
              <input aria-label="Buscar productos" placeholder="Buscar por código, descripción o familia..." style={{ ...styles.input, maxWidth: 330 }} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {loading ? <p style={styles.subtitle}>Cargando catálogo...</p>
              : !permissions?.can_view ? <div className="notice">Tu usuario no tiene permiso para consultar este módulo.</div>
              : filteredProducts.length === 0 ? <p style={styles.subtitle}>No hay productos para mostrar. Puedes registrar el primero desde el formulario.</p>
              : <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>CÓDIGO</th><th style={styles.th}>DESCRIPCIÓN</th><th style={styles.th}>FAMILIA</th><th style={styles.th}>UNIDAD</th><th style={styles.th}>LÍNEA</th><th style={styles.th}>ESTADO</th><th style={styles.th}>ACCIONES</th></tr></thead>
                  <tbody>{filteredProducts.map((product) => <tr key={product.id}>
                    <td style={{ ...styles.td, fontWeight: 700 }}>{product.product_code}</td><td style={styles.td}>{product.description}</td><td style={styles.td}>{product.family || "—"}</td><td style={styles.td}>{product.unit}</td><td style={styles.td}>{product.production_line || "—"}</td>
                    <td style={styles.td}><span className="tag" style={product.active ? {} : { background: "#f0f1f2", color: "#697586" }}>{product.active ? "Activo" : "Inactivo"}</span></td>
                    <td style={styles.td}><div style={{ display: "flex", gap: 7 }}><button style={styles.secondary} type="button" disabled={!permissions?.can_edit} onClick={() => startEdit(product)}>Editar</button>{permissions?.can_delete && <button style={{ ...styles.secondary, color: "#a12b25" }} type="button" onClick={() => void deleteProduct(product)}>Eliminar</button>}</div></td>
                  </tr>)}</tbody>
                </table>
              </div>}
          </section>
        </div>
      </section>
    </main>
  );
}
