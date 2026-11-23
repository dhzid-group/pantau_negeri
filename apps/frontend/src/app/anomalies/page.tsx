async function getAnomalies() {
  try {
    const response = await fetch('http://127.0.0.1:4000/api/v1/anomalies', { cache: 'no-store' });
    if (response.ok) return response.json();
  } catch {}
  return { items: [], disclaimer: 'Catatan: Indikator ini bukan vonis hukum atau tuduhan pidana.' };
}

export default async function AnomaliesPage() {
  const data = await getAnomalies();
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <h1 className="text-4xl font-black">Umpan Anomali Statistik</h1>
      <p className="mt-2 text-slate-600">Penandaan berbasis deviasi data publik resmi dan dapat diklarifikasi lembaga.</p>
      <div className="mt-8 space-y-4">
        {data.items.map((item: any) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold">{item.indicatorType}</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">{item.riskLevel}</span>
            </div>
            <p className="mt-3 text-sm text-slate-700">{item.formulaExplanation}</p>
            <div className="mt-3 text-xs text-slate-500">Skor {item.score} • Ambang: {item.thresholdTriggered} • Status: {item.status}</div>
          </article>
        ))}
      </div>
      <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{data.disclaimer}</p>
    </main>
  );
}
