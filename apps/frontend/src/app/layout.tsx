import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PantauNegeri",
  description: "Transparansi lembaga negara dan intelijen ekonomi publik.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
            <Link href="/" className="font-black tracking-tight text-slate-950">
              <span className="text-emerald-600">Pantau</span>Negeri
            </Link>
            <div className="hidden gap-5 text-sm font-semibold text-slate-600 md:flex">
              <Link href="/institutions">Lembaga</Link>
              <Link href="/anomalies">Anomali</Link>
              <Link href="/graph">Peta Relasi</Link>
              <Link href="/economy">Ekonomi</Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
