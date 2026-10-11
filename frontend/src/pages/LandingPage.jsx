import { Link } from 'react-router-dom';
import {
  BarChart2,
  History,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  Mail,
  MessageCircle,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const QA_DATA = [
  {
    q: 'Apa itu DSS Saham?',
    a: 'Sistem pendukung keputusan berbasis sains untuk memeringkat saham blue-chip di BEI menggunakan metode SMART & SAW yang teruji secara matematis.',
  },
  {
    q: 'Bagaimana cara kerjanya?',
    a: 'Kami mengambil data fundamental emiten, menghitung 5 rasio keuangan utama, menormalisasi matriks keputusan, lalu memberikan bobot untuk menghasilkan peringkat objektif.',
  },
  {
    q: 'Apakah data ini real-time?',
    a: 'Data diperbarui secara periodik berdasarkan laporan keuangan resmi yang dipublikasikan emiten di BEI. Historis tersedia dari 2010 hingga 2025.',
  },
  {
    q: 'Siapa yang bisa menggunakan platform ini?',
    a: 'Investor individu, analis keuangan, dan peneliti yang ingin membuat keputusan investasi berbasis data kuantitatif yang objektif.',
  },
];

const FEATURES = [
  {
    icon: BarChart2,
    title: 'Ranking SMART & SAW',
    desc: 'Metode perangkingan teruji matematis dengan normalisasi matriks keputusan yang akurat.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: History,
    title: 'Historis 15 Tahun',
    desc: 'Analisa konsistensi fundamental jangka panjang sejak 2010 hingga sekarang.',
    color: 'bg-sky-50 text-sky-600',
  },
  {
    icon: ShieldCheck,
    title: 'Data Terverifikasi',
    desc: 'Bersumber langsung dari laporan keuangan resmi yang dipublikasikan di BEI.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Zap,
    title: 'Sensitivitas Real-time',
    desc: 'Uji dampak perubahan bobot kriteria terhadap peringkat secara interaktif.',
    color: 'bg-amber-50 text-amber-600',
  },
];

const STATS = [
  { value: '39', label: 'Emiten Terdaftar' },
  { value: '15', label: 'Tahun Historis' },
  { value: '5', label: 'Kriteria Fundamental' },
  { value: 'SMART & SAW', label: 'Metode Ilmiah' },
];

export default function LandingPage() {
  const [openQA, setOpenQA] = useState(null);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 antialiased">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
            >
              <TrendingUp className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-gray-900">DSS Saham</span>
              <span className="ml-2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Indonesia
              </span>
            </div>
          </div>
          <div className="flex items-center gap-5 text-sm font-medium text-gray-500">
            <Link
              to="/peringkat"
              className="hidden sm:block hover:text-emerald-600 transition-colors"
            >
              Peringkat Saham
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all border border-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50"
            >
              Masuk
            </Link>
            <Link
              to="/peringkat"
              className="px-4 py-2 rounded-lg font-semibold text-sm text-white transition-all hidden sm:inline-flex items-center gap-1.5"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                boxShadow: '0 2px 8px rgb(5 150 105 / .3)',
              }}
            >
              Coba Gratis <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background mesh */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-48 -left-24 w-[400px] h-[400px] rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, #059669 0%, transparent 70%)' }}
          />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold mb-8 animate-in">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
              style={{ animation: 'pulse 2s infinite' }}
            />
            Platform Analisis Saham Blue-Chip BEI
          </div>

          <h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05] animate-in delay-75"
            style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.035em' }}
          >
            Investasi Terukur,
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #34d399 60%, #10b981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Keputusan Lebih Jernih.
            </span>
          </h1>

          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed animate-in delay-150">
            Platform pemeringkatan saham berbasis metode{' '}
            <strong className="text-gray-700 font-semibold">SMART & SAW</strong> yang objektif,
            transparan, dan didukung 15 tahun data historis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-in delay-225">
            <Link
              to="/peringkat"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                boxShadow: '0 4px 20px rgb(5 150 105 / .35)',
              }}
            >
              Mulai Analisa <ArrowRight size={17} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base text-gray-700 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700 transition-all bg-white"
            >
              Masuk ke Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <div className="border-y border-gray-100 bg-gray-50/60">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s, i) => (
              <div key={i}>
                <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
                  {s.value}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Fitur Platform
            </span>
            <h2
              className="text-3xl font-extrabold mt-3 tracking-tight"
              style={{ letterSpacing: '-0.025em' }}
            >
              Semua yang Anda Butuhkan
            </h2>
            <p className="text-gray-500 mt-3 text-base max-w-lg mx-auto">
              Analisis fundamental berbasis data, bukan spekulasi.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-lg transition-all duration-200"
                style={{ boxShadow: '0 1px 4px rgb(0 0 0 / .04)' }}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${f.color}`}
                >
                  <f.icon size={21} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-20 px-6 bg-gray-50/60 border-y border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
            Cara Kerja
          </span>
          <h2
            className="text-3xl font-extrabold mt-3 mb-12 tracking-tight"
            style={{ letterSpacing: '-0.025em' }}
          >
            Sederhana. Objektif. Terukur.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                n: '01',
                title: 'Kumpulkan Data',
                desc: 'Sistem mengambil laporan keuangan dari database emiten terpilih di BEI.',
              },
              {
                n: '02',
                title: 'Hitung Rasio',
                desc: 'ROA, ROE, NPM, Arus Kas Operasi, dan DER dikalkulasi secara otomatis.',
              },
              {
                n: '03',
                title: 'Hasilkan Peringkat',
                desc: 'Metode SMART & SAW menghasilkan skor preferensi dan peringkat final.',
              },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 font-mono font-bold text-sm text-emerald-700"
                  style={{
                    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    border: '1.5px solid #6ee7b7',
                  }}
                >
                  {s.n}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Q&A ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              FAQ
            </span>
            <h2
              className="text-3xl font-extrabold mt-3 tracking-tight"
              style={{ letterSpacing: '-0.025em' }}
            >
              Pertanyaan Umum
            </h2>
          </div>
          <div className="space-y-3">
            {QA_DATA.map((item, i) => (
              <div
                key={i}
                className={`rounded-xl border transition-all duration-200 cursor-pointer ${openQA === i ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200 bg-white hover:border-emerald-200'}`}
                onClick={() => setOpenQA(openQA === i ? null : i)}
              >
                <div className="flex justify-between items-center gap-4 px-5 py-4">
                  <span className="font-semibold text-sm text-gray-800">{item.q}</span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 text-gray-400 transition-transform ${openQA === i ? 'rotate-180 text-emerald-600' : ''}`}
                  />
                </div>
                {openQA === i && (
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed animate-in">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6">
        <div
          className="max-w-2xl mx-auto text-center bg-white rounded-3xl border border-emerald-100 p-12"
          style={{ boxShadow: '0 8px 48px rgb(5 150 105 / .08)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              boxShadow: '0 4px 16px rgb(5 150 105 / .35)',
            }}
          >
            <TrendingUp className="text-white w-7 h-7" />
          </div>
          <h2
            className="text-2xl font-extrabold mb-3 tracking-tight"
            style={{ letterSpacing: '-0.025em' }}
          >
            Siap Mulai Berinvestasi Lebih Cerdas?
          </h2>
          <p className="text-gray-500 mb-8 text-sm">
            Akses peringkat saham berbasis data fundamental sekarang juga.
          </p>
          <Link
            to="/peringkat"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              boxShadow: '0 4px 20px rgb(5 150 105 / .35)',
            }}
          >
            Lihat Peringkat Saham <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
              >
                <TrendingUp className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-sm text-gray-800">DSS Saham Indonesia</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a
                href="mailto:admin@dssaham.com"
                className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
              >
                <Mail size={14} /> admin@dssaham.com
              </a>
              <a
                href="#"
                className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
              >
                <MessageCircle size={14} /> Support
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            © 2026 DSS Saham Indonesia. Bukan merupakan saran investasi.
          </div>
        </div>
      </footer>
    </div>
  );
}
