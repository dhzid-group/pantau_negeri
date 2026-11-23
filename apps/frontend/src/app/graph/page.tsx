import GraphView from './GraphView';

export default async function GraphPage() {
  let graph = { nodes: [], edges: [] };
  try {
    const response = await fetch('http://127.0.0.1:4000/api/v1/graph/1', { cache: 'no-store' });
    if (response.ok) graph = await response.json();
  } catch {}

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <h1 className="text-4xl font-black">Peta Relasi Entitas</h1>
      <p className="mt-2 text-slate-600">Visualisasi jaringan relasi lembaga, vendor, paket tender, dan pejabat.</p>
      <div className="mt-8">
        <GraphView graph={graph} />
      </div>
    </main>
  );
}
