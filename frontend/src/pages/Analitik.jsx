import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calculator, GitBranch, CheckCircle2, BarChart2, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { API_BASE } from '../services/api';

/* ── Step Card ── */
function StepCard({
  step,
  icon: Icon,
  title,
  desc,
  buttonLabel,
  loading,
  done,
  onRun,
  disabled,
  isPrimary,
}) {
  const stateClass = done
    ? 'border-emerald-200 bg-emerald-50/30'
    : loading
      ? 'border-emerald-300 bg-emerald-50/20'
      : disabled
        ? 'border-gray-100 bg-gray-50/50 opacity-60'
        : 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-sm';

  return (
    <div className={`rounded-2xl border p-6 transition-all duration-200 ${stateClass}`}>
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
              done ? 'bg-emerald-100' : loading ? 'bg-emerald-100/60' : 'bg-gray-100'
            }`}
          >
            {done ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <Icon className={`w-5 h-5 ${loading ? 'text-emerald-500' : 'text-gray-400'}`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Langkah {step}
              </span>
              {done && <span className="badge-green text-[9px]">Selesai</span>}
            </div>
            <h3 className="section-title text-sm">{title}</h3>
            <p className="section-subtitle text-xs leading-relaxed mt-1">{desc}</p>
          </div>
        </div>
        <button
          onClick={onRun}
          disabled={loading || disabled}
          className={`flex-shrink-0 ${isPrimary ? 'btn-primary' : 'btn-outline'} btn-sm`}
        >
          {loading ? (
            <>
              <span className="spinner spinner-sm spinner-white" /> Memproses...
            </>
          ) : (
            buttonLabel
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-gray-500">{p.name || p.dataKey}:</span>
          <span className="font-bold text-gray-800">
            {typeof p.value === 'number' ? p.value.toFixed(4) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Charts Panel ── */
function ChartsPanel({ tahun }) {
  const [data, setData] = useState([]);
  const [rasio, setRasio] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [tahun]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [resH, resR] = await Promise.all([
        axios.get(`${API_BASE}/api/analitik/hasil/${tahun}`),
        axios.get(`${API_BASE}/api/analitik/rasio/${tahun}`),
      ]);
      setData(resH.data.data ?? []);
      setRasio(resR.data.data ?? []);
    } catch {
      setData([]);
      setRasio([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-48 gap-3 text-gray-400 text-sm">
        <span className="spinner" /> Memuat grafik...
      </div>
    );

  if (!data.length)
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
        <BarChart2 size={28} className="text-gray-300" />
        <p className="text-sm font-medium">Belum ada hasil untuk tahun {tahun}</p>
        <p className="text-xs text-gray-300">Jalankan kedua langkah di atas terlebih dahulu</p>
      </div>
    );

  /* Bar data: top 10 */
  const top10 = [...data].slice(0, 10).map((d) => ({
    kode: d.kode_saham,
    nilai: parseFloat(d.nilai_preferensi),
    status: d.status_kesehatan,
  }));

  const getBarColor = (s) =>
    s === 'Sangat Sehat' ? '#059669' : s === 'Sehat' ? '#0284c7' : '#d97706';

  /* Pie: distribusi status */
  const dist = { 'Sangat Sehat': 0, Sehat: 0, 'Kurang Sehat': 0 };
  data.forEach((d) => {
    if (dist[d.status_kesehatan] !== undefined) dist[d.status_kesehatan]++;
  });
  const pieData = [
    { name: 'Sangat Sehat', value: dist['Sangat Sehat'], fill: '#059669' },
    { name: 'Sehat', value: dist.Sehat, fill: '#0284c7' },
    { name: 'Kurang Sehat', value: dist['Kurang Sehat'], fill: '#d97706' },
  ].filter((d) => d.value > 0);

  /* Radar: avg rasio top-5 vs bottom-5 */
  const sorted = [...rasio].sort((a, b) => {
    const sa = data.find((d) => d.kode_saham === a.kode_saham)?.nilai_preferensi ?? 0;
    const sb = data.find((d) => d.kode_saham === b.kode_saham)?.nilai_preferensi ?? 0;
    return sb - sa;
  });
  const avg = (arr, key) =>
    arr.length ? arr.reduce((s, r) => s + (parseFloat(r[key]) || 0), 0) / arr.length : 0;
  const top5 = sorted.slice(0, 5);
  const bot5 = sorted.slice(-5);
  const radarData = [
    { metric: 'ROA', top: avg(top5, 'roa'), bot: avg(bot5, 'roa') },
    { metric: 'ROE', top: avg(top5, 'roe'), bot: avg(bot5, 'roe') },
    { metric: 'NPM', top: avg(top5, 'npm'), bot: avg(bot5, 'npm') },
    {
      metric: 'Kas Ops',
      top: avg(top5, 'rasio_arus_kas_operasi'),
      bot: avg(bot5, 'rasio_arus_kas_operasi'),
    },
    {
      metric: 'DER (inv)',
      top: avg(top5, 'rasio_utang') ? 1 / avg(top5, 'rasio_utang') : 0,
      bot: avg(bot5, 'rasio_utang') ? 1 / avg(bot5, 'rasio_utang') : 0,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Bar: Top-10 Nilai Preferensi */}
      <div className="card-lg animate-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">Top 10 Nilai Preferensi SAW</h3>
            <p className="section-subtitle">
              Skor akhir setelah normalisasi matriks dan pembobotan SMART · {tahun}
            </p>
          </div>
          <button onClick={fetchAll} className="btn-icon" title="Refresh">
            <RefreshCw size={13} />
          </button>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={top10} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barSize={22}>
            <CartesianGrid vertical={false} stroke="#f0f7f3" />
            <XAxis
              dataKey="kode"
              tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="nilai" radius={[5, 5, 0, 0]} name="Nilai Preferensi">
              {top10.map((d, i) => (
                <Cell key={i} fill={getBarColor(d.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Legend manual */}
        <div className="flex items-center gap-4 mt-2 justify-center">
          {[
            ['#059669', 'Sangat Sehat'],
            ['#0284c7', 'Sehat'],
            ['#d97706', 'Kurang Sehat'],
          ].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c }} />
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Row: Pie + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pie: distribusi */}
        <div className="card-lg animate-in delay-75">
          <h3 className="section-title mb-1">Distribusi Status Kesehatan</h3>
          <p className="section-subtitle mb-4">Proporsi emiten per kategori · {tahun}</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={68}
                innerRadius={36}
                paddingAngle={3}
                stroke="none"
              >
                {pieData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => (
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{v}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Radar: top5 vs bottom5 */}
        <div className="card-lg animate-in delay-150">
          <h3 className="section-title mb-1">Profil Rasio: Top-5 vs Bottom-5</h3>
          <p className="section-subtitle mb-4">Perbandingan rata-rata fundamental · {tahun}</p>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
              <PolarGrid stroke="#e4ede8" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }}
              />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Radar
                name="Top-5"
                dataKey="top"
                stroke="#059669"
                fill="#059669"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Radar
                name="Bottom-5"
                dataKey="bot"
                stroke="#d97706"
                fill="#d97706"
                fillOpacity={0.1}
                strokeWidth={2}
                strokeDasharray="4 2"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => (
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{v}</span>
                )}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function Analitik() {
  const [loadingRasio, setLoadingRasio] = useState(false);
  const [loadingPeringkat, setLoadingPeringkat] = useState(false);
  const [doneRasio, setDoneRasio] = useState(false);
  const [donePeringkat, setDonePeringkat] = useState(false);
  const [log, setLog] = useState([]);
  const [showCharts, setShowCharts] = useState(false);
  const [chartTahun, setChartTahun] = useState('all');

  const YEARS_CHART = ['all', ...Array.from({ length: 16 }, (_, i) => 2025 - i)];

  const addLog = (msg, type = 'info') =>
    setLog((prev) => [...prev, { msg, type, ts: new Date().toLocaleTimeString('id-ID') }]);

  async function hitungRasio() {
    setLoadingRasio(true);
    setDoneRasio(false);
    addLog('Memulai kalkulasi rasio historis seluruh tahun...');
    try {
      const res = await axios.post(`${API_BASE}/api/analitik/hitung-rasio`);
      addLog(res.data.message, 'success');
      setDoneRasio(true);
      toast.success(res.data.message);
    } catch {
      toast.error('Gagal menghitung rasio');
      addLog('Gagal menghitung rasio keuangan.', 'error');
    } finally {
      setLoadingRasio(false);
    }
  }

  async function hitungPeringkat() {
    setLoadingPeringkat(true);
    addLog('Menjalankan normalisasi SMART & SAW untuk seluruh periode...');
    try {
      const res = await axios.post(`${API_BASE}/api/analitik/hitung-peringkat`);
      addLog(res.data.message, 'success');
      setDonePeringkat(true);
      setShowCharts(true);
      toast.success('Peringkat Historis Berhasil Dihitung!');
    } catch {
      toast.error('Gagal menghitung peringkat');
      addLog('Gagal menghitung peringkat.', 'error');
    } finally {
      setLoadingPeringkat(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Analisis Historis</h1>
        <p className="page-subtitle">
          Batch processing · Kalkulasi rekam jejak perusahaan dari 2010 hingga sekarang dalam sekali
          klik
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/50 px-5 py-4 flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-sky-600 text-xs font-bold">i</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-sky-800">Jalankan Langkah 1 sebelum Langkah 2</p>
          <p className="text-xs text-sky-600/80 mt-0.5">
            Peringkat SMART & SAW dihitung berdasarkan rasio yang telah diproses. Pastikan data
            fundamental sudah lengkap di menu Input Data.
          </p>
        </div>
      </div>

      {/* Step Cards */}
      <div className="space-y-4">
        <StepCard
          step={1}
          icon={Calculator}
          title="Hitung Rasio Keuangan Seluruh Tahun"
          desc="Sistem mengambil data mentah dari 2010–sekarang dan menghitung ROA, ROE, NPM, Rasio Arus Kas Operasi, dan DER untuk seluruh emiten."
          buttonLabel="Proses Rasio"
          loading={loadingRasio}
          done={doneRasio}
          onRun={hitungRasio}
          disabled={false}
          isPrimary
        />
        <StepCard
          step={2}
          icon={GitBranch}
          title="Generate Peringkat (SMART & SAW)"
          desc="Menormalisasi matriks keputusan per tahun, menerapkan bobot SMART, lalu menghasilkan skor preferensi SAW dan menyusun peringkat final."
          buttonLabel="Proses Peringkat"
          loading={loadingPeringkat}
          done={donePeringkat}
          onRun={hitungPeringkat}
          disabled={!doneRasio}
          isPrimary={false}
        />
      </div>

      {/* Log Console */}
      {log.length > 0 && (
        <div className="log-console animate-in">
          <div className="log-header">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              </div>
              <span className="text-[10px] font-mono text-emerald-700/70 uppercase tracking-widest ml-1">
                Activity Log
              </span>
            </div>
            <button
              onClick={() => setLog([])}
              className="text-[10px] text-emerald-600/60 hover:text-emerald-400 font-mono transition-colors"
            >
              clear
            </button>
          </div>
          <div className="log-body">
            {log.map((entry, i) => (
              <div key={i} className="log-entry">
                <span className="log-ts">[{entry.ts}]</span>
                <span
                  className={
                    entry.type === 'success'
                      ? 'log-success'
                      : entry.type === 'error'
                        ? 'log-error'
                        : 'log-info'
                  }
                >
                  {entry.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Charts Section ── */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <BarChart2 size={16} className="text-emerald-600" />
              Visualisasi Hasil Analitik
            </h2>
            <p className="section-subtitle mt-0.5">
              Grafik distribusi dan profil fundamental emiten
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={chartTahun}
              onChange={(e) => setChartTahun(e.target.value)}
              className="input w-auto font-semibold cursor-pointer text-sm"
              style={{ padding: '.35rem .75rem' }}
            >
              {YEARS_CHART.map((y) => (
                <option key={y} value={y}>
                  {y === 'all' ? 'All-Time' : y}
                </option>
              ))}
            </select>
            {!showCharts && (
              <button onClick={() => setShowCharts(true)} className="btn-primary btn-sm">
                Tampilkan Grafik
              </button>
            )}
          </div>
        </div>

        {showCharts && <ChartsPanel tahun={chartTahun} />}

        {!showCharts && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/40 p-10 text-center animate-in">
            <BarChart2 size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-400 mb-1">Grafik belum ditampilkan</p>
            <p className="text-xs text-gray-300 mb-4">
              Klik tombol di atas untuk memuat visualisasi, atau selesaikan proses analitik terlebih
              dahulu.
            </p>
            <button onClick={() => setShowCharts(true)} className="btn-outline btn-sm mx-auto">
              Tampilkan Grafik
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
