"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type InventoryRow = {
  source_product_code: string;
  source_product_description: string | null;
  available_quantity: number;
  unit: string;
  warehouse_location: string | null;
  lot: string | null;
  observations: string | null;
};

const aliases: Record<string, string[]> = {
  source_product_code: ["codigo", "codigoproducto", "codproducto", "sku", "productcode", "item"],
  source_product_description: ["descripcion", "descripcionproducto", "productdescription", "producto"],
  available_quantity: ["cantidad", "cantidaddisponible", "existencia", "inventario", "stock", "availablequantity", "qty"],
  unit: ["unidad", "um", "unit", "unidadmedida"],
  warehouse_location: ["bodega", "ubicacion", "almacen", "warehouse", "location"],
  lot: ["lote", "lot"],
  observations: ["observaciones", "comentarios", "observations", "notes"]
};

function normalize(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function InventoryImport({ canImport, onImported }: { canImport: boolean; onImported: () => Promise<void> }) {
  const supabase = useMemo(() => createClient(), []);
  const [fileName, setFileName] = useState("");
  const [cutoffDate, setCutoffDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setRows([]); setIssues([]); setMessage(""); setError("");
    if (!file) return;
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("El archivo no contiene hojas.");
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (!raw.length) throw new Error("La primera hoja no contiene registros.");
      const headers = Object.keys(raw[0]);
      const mapping: Record<string, string | undefined> = {};
      for (const field of Object.keys(aliases)) {
        mapping[field] = headers.find(header => aliases[field].includes(normalize(header)));
      }
      if (!mapping.source_product_code || !mapping.available_quantity) {
        throw new Error("No encontré las columnas obligatorias. El Excel debe incluir Código de producto y Cantidad.");
      }
      const problems: string[] = [];
      const parsed = raw.map((record, index) => {
        const get = (field: string) => mapping[field] ? record[mapping[field]!] : "";
        const code = String(get("source_product_code") ?? "").trim();
        const quantityText = String(get("available_quantity") ?? "").trim().replace(",", ".");
        const quantity = Number(quantityText);
        if (!code) problems.push("Fila " + (index + 2) + ": falta el código de producto.");
        if (quantityText === "" || !Number.isFinite(quantity) || quantity < 0) problems.push("Fila " + (index + 2) + ": la cantidad debe ser un número igual o mayor que cero.");
        return {
          source_product_code: code,
          source_product_description: String(get("source_product_description") ?? "").trim() || null,
          available_quantity: quantity,
          unit: String(get("unit") ?? "").trim() || "UND",
          warehouse_location: String(get("warehouse_location") ?? "").trim() || null,
          lot: String(get("lot") ?? "").trim() || null,
          observations: String(get("observations") ?? "").trim() || null
        };
      });
      if (parsed.length > 1000) problems.push("El archivo supera el límite de 1.000 filas por carga. Divide el archivo y vuelve a intentarlo.");
      setIssues(problems);
      setRows(parsed);
      if (problems.length) setError("Revisa las validaciones antes de importar.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No fue posible leer el archivo.");
    }
  }

  async function importFile() {
    if (!canImport || !rows.length || issues.length || !cutoffDate) return;
    setLoading(true); setError(""); setMessage("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setError("Tu sesión expiró. Ingresa nuevamente."); setLoading(false); return; }
    const { data: snapshot, error: snapshotError } = await supabase.from("inventory_snapshots").insert({
      cutoff_date: cutoffDate,
      source_file_name: fileName,
      uploaded_by: auth.user.id,
      observations: "Carga importada desde Excel"
    }).select("id").single();
    if (snapshotError || !snapshot) {
      setError("No fue posible crear el corte: " + (snapshotError?.message ?? "sin respuesta de la base de datos."));
      setLoading(false); return;
    }
    const payload = rows.map(row => ({ ...row, snapshot_id: snapshot.id }));
    const { error: insertError } = await supabase.from("inventory_items").insert(payload);
    if (insertError) {
      setError("No se importaron las filas. Detalle: " + insertError.message);
      setLoading(false); return;
    }
    setMessage("Corte importado correctamente: " + rows.length.toLocaleString("es-CO") + " registros. El histórico anterior se conserva.");
    setRows([]); setIssues([]); setFileName("");
    await onImported();
    setLoading(false);
  }

  return <section className="panel" style={{ marginBottom: 22 }}>
    <h3>Importar inventario desde Excel</h3>
    <p>Sube un archivo .xlsx, .xls o .csv. Cada importación crea un corte independiente y conserva los cortes anteriores.</p>
    <div className="ops-form">
      <label>Fecha de corte<input type="date" value={cutoffDate} onChange={e => setCutoffDate(e.target.value)} /></label>
      <label>Archivo de inventario<input type="file" accept=".xlsx,.xls,.csv" onChange={readFile} disabled={!canImport} /></label>
    </div>
    {fileName && <p><strong>Archivo:</strong> {fileName} · <strong>Filas:</strong> {rows.length.toLocaleString("es-CO")}</p>}
    {issues.length > 0 && <div className="notice-error"><strong>Validaciones ({issues.length})</strong><ul>{issues.slice(0, 8).map((issue, index) => <li key={index}>{issue}</li>)}</ul>{issues.length > 8 && <p>Y {issues.length - 8} observaciones adicionales.</p>}</div>}
    {message && <div className="notice-success">{message}</div>}
    {error && <div className="notice-error">{error}</div>}
    {rows.length > 0 && issues.length === 0 && <><p className="muted-note">Vista previa de las primeras 5 filas:</p><div className="table-scroll"><table className="ops-table"><thead><tr><th>Código</th><th>Descripción</th><th>Cantidad</th><th>Unidad</th><th>Bodega</th><th>Lote</th></tr></thead><tbody>{rows.slice(0,5).map((row,index)=><tr key={index}><td>{row.source_product_code}</td><td>{row.source_product_description ?? "—"}</td><td>{row.available_quantity.toLocaleString("es-CO")}</td><td>{row.unit}</td><td>{row.warehouse_location ?? "—"}</td><td>{row.lot ?? "—"}</td></tr>)}</tbody></table></div></>}
    <button className="btn-primary" type="button" disabled={!canImport || !rows.length || !!issues.length || loading || !cutoffDate} onClick={importFile}>{loading ? "Importando..." : "Importar y guardar corte"}</button>
    {!canImport && <p className="muted-note">Tu usuario no tiene habilitado el permiso de importación para este módulo.</p>}
  </section>;
}
