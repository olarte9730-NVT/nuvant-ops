import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Nuvant Ops", description: "Planeación y control de producto terminado" };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="es"><body>{children}</body></html>;
}