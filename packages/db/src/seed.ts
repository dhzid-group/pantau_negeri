import { db, citizenSolutionPlaybooks, institutions } from './index.js';

export async function seedPlaybooksAndInstitutions() {
  console.log('==> Seeding initial institutions and playbooks...');

  // 1. Initial institutions
  await db.insert(institutions).values([
    {
      code: 'DPR',
      name: 'Dewan Perwakilan Rakyat Republik Indonesia',
      shortName: 'DPR RI',
      category: 'LEGISLATIF',
      officialWebsite: 'https://www.dpr.go.id',
      openDataPortalUrl: 'https://opendata.dpr.go.id',
      dataTransparencyScore: '85.50',
    },
    {
      code: 'KEMENKEU',
      name: 'Kementerian Keuangan Republik Indonesia',
      shortName: 'Kemenkeu',
      category: 'EKSEKUTIF',
      officialWebsite: 'https://www.kemenkeu.go.id',
      openDataPortalUrl: 'https://data.kemenkeu.go.id',
      dataTransparencyScore: '92.00',
    },
    {
      code: 'BPK',
      name: 'Badan Pemeriksa Keuangan Republik Indonesia',
      shortName: 'BPK RI',
      category: 'INDEPENDEN',
      officialWebsite: 'https://www.bpk.go.id',
      openDataPortalUrl: 'https://e-ppid.bpk.go.id',
      dataTransparencyScore: '88.00',
    },
    {
      code: 'MA',
      name: 'Mahkamah Agung Republik Indonesia',
      shortName: 'MA RI',
      category: 'YUDIKATIF',
      officialWebsite: 'https://www.mahkamahagung.go.id',
      openDataPortalUrl: 'https://putusan3.mahkamahagung.go.id',
      dataTransparencyScore: '82.00',
    },
  ]).onDuplicateKeyUpdate({
    set: { updatedAt: new Date() },
  });

  // 2. Playbooks for 4 scenarios
  await db.insert(citizenSolutionPlaybooks).values([
    {
      scenarioCode: 'RUPIAH_WEAKENING',
      triggerCondition: { indicatorCode: 'USD_IDR', operator: '>', threshold: 16200 },
      solutionTitle: 'Mitigasi Depresiasi Rupiah & Fluktuasi Valas',
      citizenImpactSummary: 'Pelemahan Rupiah berdampak pada kenaikan biaya barang impor dan beban utang valas.',
      actionStepsHousehold: [
        { step: 1, action: 'Proteksi Arus Kas', description: 'Tunda belanja impor non-primer.' },
        { step: 2, action: 'Kunci Suku Bunga', description: 'Pilih cicilan fixed rate.' },
      ],
      actionStepsMsme: [
        { step: 1, action: 'Substitusi Bahan Baku Lokal', description: 'Gunakan pasokan lokal untuk tekan HPP.' },
        { step: 2, action: 'Peluang Ekspor', description: 'Optimalkan produk/jasa berorientasi valas.' },
      ],
      publicSupportLinks: [{ title: 'Katalog Ekspor Kemendag', url: 'https://djpen.kemendag.go.id', institutionName: 'Kemendag' }],
      isActive: 'YES',
    },
    {
      scenarioCode: 'PURCHASING_POWER_DROP',
      triggerCondition: { indicatorCode: 'IKK_PURCHASING_POWER', operator: '<', threshold: 115 },
      solutionTitle: 'Mitigasi Penurunan Daya Beli Konsumen',
      citizenImpactSummary: 'Indeks Keyakinan Konsumen menurun menunjukkan penghematan belanja konsumsi.',
      actionStepsHousehold: [
        { step: 1, action: 'Alokasi Dana Darurat', description: 'Amankan 3-6 bulan pengeluaran rutin.' },
        { step: 2, action: 'Subsidi Resmi', description: 'Pantau program pangan terdata di data.go.id.' },
      ],
      actionStepsMsme: [
        { step: 1, action: 'Kemasan Ekonomis', description: 'Buat porsi terjangkau untuk pasar ritel.' },
      ],
      publicSupportLinks: [{ title: 'Satu Data Bansos', url: 'https://data.go.id', institutionName: 'Kemensos' }],
      isActive: 'NO',
    },
    {
      scenarioCode: 'HIGH_INTEREST_RATE',
      triggerCondition: { indicatorCode: 'BI_RATE', operator: '>=', threshold: 6.25 },
      solutionTitle: 'Navigasi Suku Bunga Acuan Tinggi',
      citizenImpactSummary: 'Suku bunga tinggi menaikkan bunga kredit cicilan floating rate.',
      actionStepsHousehold: [
        { step: 1, action: 'Pelunasan Utang Berbunga Tinggi', description: 'Gunakan metode debt avalanche.' },
      ],
      actionStepsMsme: [
        { step: 1, action: 'Akses KUR Bersubsidi', description: 'Gunakan plafon KUR berbunga subsidi pemerintah.' },
      ],
      publicSupportLinks: [{ title: 'Portal KUR Kemenko', url: 'https://kur.ekon.go.id', institutionName: 'Kemenko Perekonomian' }],
      isActive: 'YES',
    },
    {
      scenarioCode: 'FOOD_INFLATION',
      triggerCondition: { indicatorCode: 'FOOD_INDEX', operator: '>', threshold: 120 },
      solutionTitle: 'Panduan Menghadapi Kenaikan Harga Pangan Pokok',
      citizenImpactSummary: 'Kenaikan indeks harga pangan pokok menekan pengeluaran dapur harian.',
      actionStepsHousehold: [
        { step: 1, action: 'Pantau Harga PIHPS', description: 'Cek harga eceran pasar harian terdekat.' },
      ],
      actionStepsMsme: [
        { step: 1, action: 'Pasokan Kolektif', description: 'Beli pasokan bersama kelompok pedagang.' },
      ],
      publicSupportLinks: [{ title: 'Panel Harga Badan Pangan', url: 'https://panelharga.badanpangan.go.id', institutionName: 'Bapanas' }],
      isActive: 'NO',
    },
  ]).onDuplicateKeyUpdate({
    set: { updatedAt: new Date() },
  });

  console.log('==> Seed completed successfully.');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedPlaybooksAndInstitutions().then(() => process.exit(0)).catch((err) => { console.error('Seed error:', err); process.exit(1); });
}
