import { notFound } from "next/navigation";
import OperationsModule from "../operations-module";

const allowed = ["pedidos", "inventarios", "planeacion", "produccion", "incumplimientos", "reportes", "notificaciones", "administracion"];

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!allowed.includes(module)) notFound();
  return <OperationsModule moduleKey={module} />;
}
