import { Leaf, Users, ShieldCheck, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const dataFoodLossKomoditas = [
  { komoditas: 'Cabai Rawit (1.000 kg)', layakJualPct: 90.0, susutAfkirPct: 10.0 },
  { komoditas: 'Beras Pangan (2.000 kg)', layakJualPct: 97.5, susutAfkirPct: 2.5 },
  { komoditas: 'Pisang Buah (800 kg)', layakJualPct: 92.5, susutAfkirPct: 7.5 },
];

const dataKomposisiPupuk = [
  { name: 'Pupuk Organik', value: 68.4, color: '#15803d' },
  { name: 'Pupuk Kimia (NPK)', value: 31.6, color: '#d97706' },
];

const dataTrenPembayaran = [
  { bulan: 'Jul 2026', durasiHari: 3.4, tepatWaktuPct: 89.0 },
  { bulan: 'Agu 2026', durasiHari: 2.7, tepatWaktuPct: 93.5 },
  { bulan: 'Sep 2026', durasiHari: 2.2, tepatWaktuPct: 96.0 },
  { bulan: 'Okt 2026', durasiHari: 1.8, tepatWaktuPct: 97.5 },
  { bulan: 'Nov 2026', durasiHari: 1.5, tepatWaktuPct: 98.2 },
];

export default function ESGIndicatorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <Leaf className="w-6 h-6 text-green-700" />
          Indikator Keberlanjutan (ESG) & SDGs
        </h1>
        <p className="text-xs text-ink-600 mt-1">
          Pengukuran dampak lingkungan hidup, keadilan sosial bagi petani, dan transparansi tata kelola koperasi.
        </p>
      </div>

      {/* Baris Lencana SDGs */}
      <div className="flex flex-wrap gap-2.5">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
          SDG 2 · Tanpa Kelaparan
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-navy-50 text-navy-800 border border-navy-200">
          SDG 8 · Pekerjaan Layak & Pertumbuhan Ekonomi
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-800 border border-green-200">
          SDG 12 · Konsumsi & Produksi Bertanggung Jawab
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
          SDG 13 · Penanganan Perubahan Iklim
        </span>
      </div>

      {/* 3 Panel Utama ESG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: Lingkungan (Environmental) */}
        <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="font-bold text-base text-ink-900 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-700" />
              1. Lingkungan (E)
            </h2>
            <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
              SDG 12 & 13
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-control bg-canvas border border-line">
              <span className="text-xs text-ink-600">Rasio Pupuk Organik vs Kimia</span>
              <p className="readout text-xl font-bold text-green-700 mt-1">68,4% Organik</p>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-green-700 h-full" style={{ width: '68.4%' }} />
              </div>
            </div>

            <div className="p-3.5 rounded-control bg-canvas border border-line">
              <span className="text-xs text-ink-600">Tingkat Susut Pasca Panen (Food Loss)</span>
              <p className="readout text-xl font-bold text-ink-900 mt-1">10,00% (Cabai)</p>
              <p className="text-[11px] text-green-700 mt-1 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Di bawah ambang batas susut maksimal 15%
              </p>
            </div>

            <div className="p-3.5 rounded-control bg-canvas border border-line">
              <span className="text-xs text-ink-600">Estimasi Jejak Karbon Transportasi</span>
              <p className="readout text-xl font-bold text-ink-900 mt-1">0,006 kg CO2e / kg panen</p>
              <p className="text-[11px] text-ink-600 mt-0.5">Rute efisien logistik lokal</p>
            </div>
          </div>
        </div>

        {/* Panel 2: Sosial (Social) */}
        <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="font-bold text-base text-ink-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-navy-700" />
              2. Sosial (S)
            </h2>
            <span className="text-[11px] font-bold text-navy-700 bg-navy-50 px-2 py-0.5 rounded">
              SDG 2 & 8
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-control bg-canvas border border-line">
              <span className="text-xs text-ink-600">Partisipasi Petani Anggota Aktif</span>
              <p className="readout text-xl font-bold text-navy-800 mt-1">100 Petani Aktif</p>
              <p className="text-[11px] text-ink-600 mt-0.5">100% lahan bersertifikat terdaftar</p>
            </div>

            <div className="p-3.5 rounded-control bg-canvas border border-line">
              <span className="text-xs text-ink-600">Ketepatan Waktu Pembayaran ke Petani</span>
              <p className="readout text-xl font-bold text-green-700 mt-1">98,2% Tepat Waktu</p>
              <p className="text-[11px] text-ink-600 mt-0.5">Rata-rata penyelesaian &le; 3 hari kerja</p>
            </div>

            <div className="p-3.5 rounded-control bg-canvas border border-line">
              <span className="text-xs text-ink-600">Keadilan Harga (Farmer Margin Share)</span>
              <p className="readout text-xl font-bold text-ink-900 mt-1">82,7% dari Harga Jual</p>
              <p className="text-[11px] text-green-700 font-semibold mt-0.5">
                Margin sehat di tingkat petani
              </p>
            </div>
          </div>
        </div>

        {/* Panel 3: Tata Kelola (Governance) */}
        <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="font-bold text-base text-ink-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              3. Tata Kelola (G)
            </h2>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Koperasi Bersih
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-control bg-canvas border border-line">
              <span className="text-xs text-ink-600">Ketertelusuran Batch (Traceability)</span>
              <p className="readout text-xl font-bold text-green-700 mt-1">100,0% Tertelusur</p>
              <p className="text-[11px] text-ink-600 mt-0.5">
                Setiap kilogram panen memiliki QR batch unik
              </p>
            </div>

            <div className="p-3.5 rounded-control bg-canvas border border-line">
              <span className="text-xs text-ink-600">Transparansi Keuangan & Audit Jurnal</span>
              <p className="readout text-xl font-bold text-ink-900 mt-1">Immutability 100%</p>
              <p className="text-[11px] text-ink-600 mt-0.5">
                Jurnal transaksi terkunci tanpa edit/hapus
              </p>
            </div>

            <div className="p-3.5 rounded-control bg-canvas border border-line">
              <span className="text-xs text-ink-600">Akurasi Perhitungan SHU Anggota</span>
              <p className="readout text-xl font-bold text-navy-800 mt-1">Otomatis Terverifikasi</p>
              <p className="text-[11px] text-ink-600 mt-0.5">
                Proporsional berbasis transaksi riil anggota
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visualisasi Grafik ESG (Food Loss, Komposisi Pupuk, & Tren Pembayaran Petani) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik 1: Food Loss / Susut Sortasi per Komoditas */}
        <div className="lg:col-span-2 rounded-panel border border-line bg-surface p-5 shadow-sm">
          <h3 className="font-bold text-base text-ink-900">
            Grafik Rasio Hasil Layak Jual vs Susut (Food Loss) per Komoditas
          </h3>
          <p className="text-xs text-ink-600 mt-0.5 mb-4">
            Evaluasi efisiensi sortasi dan pengurangan limbah panen (SRS-RPT-004 &amp; SRS-RPT-007)
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataFoodLossKomoditas} layout="vertical" margin={{ left: 16, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis dataKey="komoditas" type="category" width={155} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar
                  dataKey="layakJualPct"
                  name="Layak Jual (Grade A & B)"
                  stackId="a"
                  fill="#15803d"
                />
                <Bar
                  dataKey="susutAfkirPct"
                  name="Susut / Afkir (Food Loss)"
                  stackId="a"
                  fill="#dc2626"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik 2: Rasio Pupuk Organik vs Kimia */}
        <div className="rounded-panel border border-line bg-surface p-5 shadow-sm">
          <h3 className="font-bold text-base text-ink-900">
            Komposisi Penyaluran Pupuk
          </h3>
          <p className="text-xs text-ink-600 mt-0.5 mb-4">
            Perbandingan pupuk organik vs pupuk kimia (SRS-INV-004)
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataKomposisiPupuk}
                  cx="50%"
                  cy="48%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {dataKomposisiPupuk.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grafik 3: Tren Ketepatan Pembayaran Anggota */}
      <div className="rounded-panel border border-line bg-surface p-5 shadow-sm">
        <h3 className="font-bold text-base text-ink-900">
          Tren Ketepatan Pembayaran Hasil Panen ke Petani Anggota
        </h3>
        <p className="text-xs text-ink-600 mt-0.5 mb-4">
          Monitoring kecepatan pencairan dana ke petani terhadap target SLA koperasi (&le; 3 hari kerja, SRS-RPT-008)
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataTrenPembayaran}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan" />
              <YAxis yAxisId="left" domain={[0, 5]} unit=" hr" />
              <YAxis yAxisId="right" orientation="right" domain={[80, 100]} unit="%" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="durasiHari"
                name="Rata-rata Durasi Bayar (Hari)"
                stroke="#1d4ed8"
                strokeWidth={2.5}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="tepatWaktuPct"
                name="Ketepatan Tepat Waktu (%)"
                stroke="#15803d"
                strokeWidth={2.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
