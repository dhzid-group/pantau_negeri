import Link from "next/link";
import Image from "next/image";

const cards = [
	{
		href: "/economy",
		title: "Intelijen Ekonomi",
		text: "Skor ketahanan, tren makro, timeline kebijakan, dan solusi warga.",
		accent: "emerald",
	},
	{
		href: "/anomalies",
		title: "Umpan Anomali",
		text: "Pemetaan deviasi statistik publik beserta status klarifikasi.",
		accent: "amber",
	},
	{
		href: "/graph",
		title: "Peta Relasi",
		text: "Jelajahi hubungan lembaga, vendor, tender, dan pejabat.",
		accent: "sky",
	},
	{
		href: "/institutions",
		title: "Direktori Lembaga",
		text: "Agregasi lembaga eksekutif, legislatif, yudikatif, BUMN, dan independen.",
		accent: "indigo",
	},
];

export default async function Home() {
	let dashboard: Record<string, any> = {
		institutions: 0,
		economicScore: null,
		recentAnomalies: [],
		activePlaybooks: [],
	};
	try {
		const response = await fetch("http://127.0.0.1:4000/api/v1/dashboard", {
			cache: "no-store",
		});
		if (response.ok) dashboard = await response.json();
	} catch {}

	return (
		<div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
			<main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
				<Image
					className="dark:invert h-5 w-[100px]"
					src="/next.svg"
					alt="Next.js logo"
					width={100}
					height={20}
					priority
				/>
				<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
					<h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
						To get started, edit the{" "}
						<code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
							page.tsx
						</code>{" "}
						file.
					</h1>
					<p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
						Looking for a starting point or more instructions? Head over to{" "}
						<a
							href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
							className="font-medium text-zinc-950 dark:text-zinc-50"
						>
						/Templates
						</a>{" "}
						or the{" "}
						<a
							href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
							className="font-medium text-zinc-950 dark:text-zinc-50"
						>
							/Learning
						</a>{" "}
						center.
					</p>
				</div>
				<div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
					<a
						className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
						href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Image
							className="dark:invert h-[14px] w-4"
							src="/vercel.svg"
							alt="Vercel logomark"
							width={16}
							height={14}
						/>
						Deploy Now
					</a>
					<a
						className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
						href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
						target="_blank"
						rel="noopener noreferrer"
					>
						Documentation
					</a>
				</div>
			</main>

			<main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
				<section className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-10 text-white shadow-2xl sm:px-10">
					<p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">
						Portal Transparansi Nasional
					</p>
					<h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
						PantauNegeri
					</h1>
					<p className="mt-5 max-w-2xl text-lg text-slate-300">
						Menghubungkan data lembaga negara, pengadaan publik, indikator ekonomi,
						dan peta relasi dalam satu tampilan yang dapat diterangkan.
					</p>
					<div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
						<Metric label="Lembaga" value={dashboard.institutions ?? 0} />
						<Metric
							label="Skor Ekonomi"
							value={dashboard.economicScore?.compositeScore ?? "—"}
						/>
						<Metric label="Anomali" value={dashboard.recentAnomalies?.length ?? 0} />
						<Metric
							label="Solusi Aktif"
							value={dashboard.activePlaybooks?.length ?? 0}
						/>
					</div>
				</section>

				<section className="mt-8 grid gap-5 md:grid-cols-2">
					{cards.map((card) => (
						<Link
							key={card.href}
							href={card.href}
							className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
						>
							<div
								className={`mb-5 h-2 w-16 rounded-full bg-${card.accent}-500`}
							/>
							<h2 className="text-xl font-bold text-slate-950">{card.title}</h2>
							<p className="mt-2 text-slate-600">{card.text}</p>
							<span className="mt-5 inline-block text-sm font-bold text-slate-900 group-hover:text-emerald-700">
								Buka modul →
							</span>
						</Link>
					))}
				</section>
			</main>
		</div>
	);
}

function Metric({
	label,
	value,
}: {
	label: string;
	value: string | number;
}) {
	return (
		<div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
			<div className="text-2xl font-bold">{value}</div>
			<div className="mt-1 text-xs text-slate-400">{label}</div>
		</div>
	);
}
