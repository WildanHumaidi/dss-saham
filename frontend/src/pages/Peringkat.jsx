import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import { API_BASE } from '../services/api';
const YEARS = ['all', ...Array.from({ length: 16 }, (_, i) => 2025 - i)];

/* ── Rank badge: compact number pill, no emoji ── */
function RankBadge({ rank }) {
  if (rank === 1)
    return (
      <div
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold tabular-nums"
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
          color: '#fff',
          boxShadow: '0 1px 4px rgb(245 158 11 / .4)',
        }}
      >
        1
      </div>
    );
  if (rank === 2)
    return (
      <div
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold tabular-nums"
        style={{
          background: 'linear-gradient(135deg, #9ca3af 0%, #d1d5db 100%)',
          color: '#fff',
          boxShadow: '0 1px 4px rgb(156 163 175 / .4)',
        }}
      >
        2
      </div>
    );
  if (rank === 3)
    return (
      <div
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold tabular-nums"
        style={{
          background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
          color: '#fff',
          boxShadow: '0 1px 4px rgb(180 83 9 / .35)',
        }}
      >
        3
      </div>
    );
  return (
    <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold tabular-nums text-gray-500 bg-gray-100">
      {rank}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'Sangat Sehat') return <span className="badge-green">{status}</span>;
  if (status === 'Sehat') return <span className="badge-blue">{status}</span>;
  return <span className="badge-amber">{status ?? '—'}</span>;
}

export default function Peringkat() {
  const [tahun, setTahun] = useState('all');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [tahun]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/analitik/hasil/${tahun}`);
      setData(res.data.data ?? []);
    } catch (e) {
      setError(e.response?.data?.message ?? 'Gagal memuat data peringkat.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  const maxNilai = data.length
    ? data.reduce((m, d) => Math.max(m, +d.nilai_preferensi), 0) || 0.0001
    : 0.0001;

  const dist = { 'Sangat Sehat': 0, Sehat: 0, 'Kurang Sehat': 0 };
  data.forEach((d) => {
    if (dist[d.status_kesehatan] !== undefined) dist[d.status_kesehatan]++;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Hasil Peringkat SMART &amp; SAW</h1>
          <p className="page-subtitle">
            Nilai preferensi final berdasarkan 5 rasio keuangan fundamental
          </p>
        </div>
        <select
          value={tahun}
          onChange={(e) => setTahun(e.target.value)}
          className="input w-auto font-semibold cursor-pointer flex-shrink-0"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y === 'all' ? 'All-Time (Rata-rata Historis)' : y}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-3 animate-in">
          {[
            {
              label: 'Sangat Sehat',
              count: dist['Sangat Sehat'],
              cls: 'text-emerald-700',
              bg: 'bg-emerald-50 border-emerald-200',
              bar: '#059669',
            },
            {
              label: 'Sehat',
              count: dist['Sehat'],
              cls: 'text-sky-700',
              bg: 'bg-sky-50 border-sky-200',
              bar: '#0284c7',
            },
            {
              label: 'Kurang Sehat',
              count: dist['Kurang Sehat'],
              cls: 'text-amber-700',
              bg: 'bg-amber-50 border-amber-200',
              bar: '#d97706',
            },
          ].map(({ label, count, cls, bg, bar }) => (
            <div key={label} className={`rounded-2xl p-5 border ${bg}`}>
              <div className={`text-3xl font-extrabold ${cls} tracking-tight tabular-nums`}>
                {count}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-semibold">{label}</div>
              <div className="mt-3 h-1 rounded-full bg-gray-200/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${data.length ? (count / data.length) * 100 : 0}%`,
                    background: bar,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table / States */}
      {loading ? (
        <div className="card-lg flex items-center justify-center h-56 gap-3 text-gray-400 text-sm animate-in">
          <span className="spinner" /> Memuat data {tahun === 'all' ? 'historis' : tahun}...
        </div>
      ) : error ? (
        <div className="card-lg flex flex-col items-center justify-center h-56 gap-4 animate-in">
          <p className="text-red-500 text-sm font-medium">{error}</p>
          <button onClick={fetchData} className="btn-outline btn-sm gap-1.5">
            <RefreshCw size={13} /> Coba Lagi
          </button>
        </div>
      ) : data.length === 0 ? (
        <div className="card-lg flex flex-col items-center justify-center h-56 gap-2 border-dashed animate-in">
          <p className="text-gray-400 text-sm font-semibold">
            Belum ada data untuk {tahun === 'all' ? 'all-time' : tahun}
          </p>
          <p className="text-gray-300 text-xs">
            Jalankan perhitungan di halaman Analitik terlebih dahulu
          </p>
        </div>
      ) : (
        <div className="card-lg p-0 overflow-hidden card-accent animate-in">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-14 text-center">Rank</th>
                  <th>Emiten</th>
                  <th>Nilai Preferensi</th>
                  <th>Status Kesehatan</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={row.kode_saham}
                    className="animate-in"
                    style={{ animationDelay: `${Math.min(i * 30, 400)}ms` }}
                  >
                    <td className="text-center">
                      <RankBadge rank={row.peringkat_ke} />
                    </td>
                    <td>
                      <span className="font-bold text-emerald-700 text-sm">{row.kode_saham}</span>
                      <span className="block text-[11px] text-gray-400 mt-0.5 leading-snug">
                        {row.nama_perusahaan}
                      </span>
                    </td>
                    <td className="w-64">
                      <div className="flex items-center gap-3">
                        <div className="progress-track flex-1 max-w-[100px]">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${((+row.nilai_preferensi / maxNilai) * 100).toFixed(1)}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-sm font-bold text-gray-900 tabular-nums w-14 text-right">
                          {(+row.nilai_preferensi).toFixed(4)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={row.status_kesehatan} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
