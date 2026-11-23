import EconomicCharts from './EconomicCharts';

// Data API dimuat tanpa cache melalui fetch cache:'no-store'.

async function getEconomy() {
  try {
    const response = await fetch('http://127.0.0.1:4000/api/v1/economy/latest', { cache: 'no-store' });
    if (response.ok) return response.json();
  } catch {}
  return { scores: [], indicators: [], activePlaybooks: [], timeline: [], disclaimer: 'Catatan: Skor ekonomi merupakan edukasi literasi keuangan publik, bukan rekomendasi investasi berizin (OJK).' };
}

export default async function EconomyPage() {
  const data = await getEconomy();
  const latest = data.scores?.[0];
  const status = latest?.status ?? 'BELUM_TERSEDIA';

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Intelligence Dashboard</p>
          <h1 className="mt-2 text-4xl font-black">Ketahanan Ekonomi</h1>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-right shadow-sm">
          <div className="text-3xl font-black">{latest?.compositeScore ?? '—'}</div>
          <div className="text-xs font-bold text-slate-500">{status}</div>
        </div>
      </div>

      <EconomicCharts indicators={data.indicators ?? []} />

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Faktor Pendorong</h2>
          <p className="mt-3 text-slate-600">{latest?.driversSummary ?? 'Belum ada evaluasi ekonomi terbaru.'}</p>
          {latest?.weightsAndFormula && (
            <div className="mt-5 rounded-xl bg-slate-950 p-4 text-sm text-slate-200">
              <p>{latest.weightsAndFormula.formula}</p>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-xl font-bold text-emerald-950">Solusi Masyarakat Aktif</h2>
          <div className="mt-4 space-y-3">
            {(data.activePlaybooks ?? []).length ? data.activePlaybooks.map((playbook: any) => (
              <div key={playbook.id} className="rounded-xl border border-emerald-200 bg-white p-4">
                <div className="font-bold">{playbook.solutionTitle}</div>
                <p className="mt-1 text-sm text-slate-600">{playbook.citizenImpactSummary}</p>
              </div>
            )) : <p className="text-sm text-slate-600">Tidak ada skenario aktif saat ini.</p>}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Timeline Geopolitik & Kebijakan</h2>
        <div className="mt-5 space-y-4">
          {(data.timeline ?? []).map((item: any) => (
            <article key={item.id} className="border-l-4 border-sky-500 pl-4">
              <div className="text-xs font-bold text-slate-500">{item.publishedDate} • {item.category} • {item.impactLevel}</div>
              <h3 className="mt-1 font-bold">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.objectiveSummary}</p>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{data.disclaimer}</p>
    </main>
  );
}
