async function getInstitutions() {
  try {
    const response = await fetch('http://127.0.0.1:4000/api/v1/institutions', { cache: 'no-store' });
    if (response.ok) return response.json();
  } catch {}
  return [];
}

export default async function InstitutionsPage() {
  const institutions = await getInstitutions();
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <h1 className="text-4xl font-black">Direktori Lembaga Negara</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {institutions.map((institution: any) => (
          <article key={institution.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-bold text-emerald-700">{institution.category}</div>
            <h2 className="mt-2 text-lg font-bold">{institution.name}</h2>
            <p className="mt-2 text-sm text-slate-500">Kode: {institution.code}</p>
            {institution.officialWebsite && <a className="mt-4 inline-block text-sm font-bold text-sky-700" href={institution.officialWebsite} target="_blank">Situs resmi →</a>}
          </article>
        ))}
      </div>
    </main>
  );
}
