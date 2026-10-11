import { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Award, TrendingUp, Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { API_BASE } from '../services/api';

const CHART_COLORS = ['#059669', '#10b981', '#34d399'];

/* ── Compact rank badge (no emoji) ── */
function RankBadge({ rank }) {
  if (rank === 1)
    return (
      <div
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold"
        style={{
          background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
          color: '#fff',
          boxShadow: '0 1px 4px rgb(245 158 11/.4)',
        }}
      >
        1
      </div>
    );
  if (rank === 2)
    return (
      <div
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold"
        style={{
          background: 'linear-gradient(135deg,#9ca3af,#d1d5db)',
          color: '#fff',
          boxShadow: '0 1px 4px rgb(156 163 175/.4)',
        }}
      >
        2
      </div>
    );
  if (rank === 3)
    return (
      <div
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold"
        style={{
          background: 'linear-gradient(135deg,#b45309,#d97706)',
          color: '#fff',
          boxShadow: '0 1px 4px rgb(180 83 9/.35)',
        }}
      >
        3
      </div>
    );
  return (
    <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-gray-500 bg-gray-100">
      {rank}
    </div>
  );
}

function StatCard({ icon: Icon, iconBg, iconColor, value, label, suffix }) {
  return (
    <div className="stat-card animate-in">
      <div className={`stat-icon ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <div className="stat-value">
          {value}
          {suffix && <span className="text-sm font-medium text-gray-400 ml-1">{suffix}</span>}
        </div>
        <div className="stat-label mt-1">{label}</div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-500">{p.dataKey}:</span>
          <span className="font-bold text-gray-800">
            {p.value?.toFixed ? p.value.toFixed(4) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [topSaham, setTopSaham] = useState([]);
  const [sektorData, setSektorData] = useState([]);
  const [trenData, setTrenData] = useState({ data: [], keys: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [resHasil, resRasio, resTren] = await Promise.all([
          axios.get(`${API_BASE}/api/analitik/hasil/all`),
          axios.get(`${API_BASE}/api/analitik/rasio/all`),
          axios.get(`${API_BASE}/api/analitik/tren`),
        ]);

        const dataPeringkat = resHasil.data.data || [];
        const dataRasio = resRasio.data.data || [];

        const combinedSaham = dataPeringkat
          .map((p) => {
            const r = dataRasio.find((x) => x.kode_saham === p.kode_saham) || {};
            return {
              rank: p.peringkat_ke,
              kode: p.kode_saham,
              nama: p.nama_perusahaan,
              sektor: p.sektor,
              skor: parseFloat(p.nilai_preferensi),
              status: p.status_kesehatan,
              roa: parseFloat(r.roa || 0),
              roe: parseFloat(r.roe || 0),
              der: parseFloat(r.rasio_utang || 0),
            };
          })
          .slice(0, 6);

        setTopSaham(combinedSaham);
        setTrenData({ data: resTren.data.data || [], keys: resTren.data.keys || [] });

        const sektorMap = {};
        dataPeringkat.forEach((p) => {
          const sektor = p.sektor || 'Lainnya';
          if (!sektorMap[sektor]) sektorMap[sektor] = { total: 0, count: 0 };
          sektorMap[sektor].total += parseFloat(p.nilai_preferensi);
          sektorMap[sektor].count += 1;
        });

        setSektorData(
          Object.keys(sektorMap)
            .map((sek) => ({ sektor: sek, avg: sektorMap[sek].total / sektorMap[sek].count }))
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 5)
        );
      } catch (error) {
        console.error('Gagal load:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const maxSkor = topSaham.length
    ? topSaham.reduce((m, s) => Math.max(m, s.skor), 0) || 0.0001
    : 0.0001;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Ringkasan ketahanan historis saham Blue Chip · 2010–2025</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold">
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            style={{ animation: 'pulse 2s infinite' }}
          />
          Data Historis Aktif
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          value="39"
          label="Total Emiten"
        />
        <StatCard
          icon={Award}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          value={sektorData.length ? sektorData[0].avg.toFixed(3) : '—'}
          label="Avg Skor SAW"
        />
        <StatCard
          icon={TrendingUp}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          value="Aktif"
          label="Status Analitik"
        />
        <StatCard
          icon={Activity}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          value="15"
          label="Tahun Historis"
          suffix="thn"
        />
      </div>

      {/* Top Table */}
      <div className="card-lg p-0 overflow-hidden card-accent animate-in delay-150">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="section-title">Top Peringkat Saham · All-Time</h2>
            <p className="section-subtitle">Rata-rata performa historis 2010–2025</p>
          </div>
          <span className="badge-brand">Historis</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-52 gap-3 text-gray-400 text-sm">
            <span className="spinner" /> Menarik data historis...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-14 text-center">Rank</th>
                  <th>Saham</th>
                  <th>Skor SAW (Avg)</th>
                  <th className="text-right">ROA (%)</th>
                  <th className="text-right">ROE (%)</th>
                  <th className="text-right">DER (x)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {topSaham.map((row, i) => (
                  <tr
                    key={row.kode}
                    className="animate-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <td className="text-center">
                      <RankBadge rank={row.rank} />
                    </td>
                    <td>
                      <span className="font-bold text-emerald-700 text-sm">{row.kode}</span>
                      <span className="block text-[10px] text-gray-400 font-normal mt-0.5 leading-tight">
                        {row.nama}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="progress-track w-20">
                          <div
                            className="progress-fill"
                            style={{ width: `${((row.skor / maxSkor) * 100).toFixed(1)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-gray-900 text-sm tabular-nums">
                          {row.skor.toFixed(4)}
                        </span>
                      </div>
                    </td>
                    <td className="text-right font-mono text-gray-600 text-sm">
                      {row.roa.toFixed(2)}
                    </td>
                    <td className="text-right font-mono text-gray-600 text-sm">
                      {row.roe.toFixed(2)}
                    </td>
                    <td className="text-right font-mono text-gray-600 text-sm">
                      {row.der.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={row.status === 'Sangat Sehat' ? 'badge-green' : 'badge-blue'}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!topSaham.length && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                      Belum ada data — jalankan Analitik terlebih dahulu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Trend Area */}
        <div className="xl:col-span-2 card-lg animate-in delay-225">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="section-title">Tren Ketahanan Historis (SAW)</h2>
              <p className="section-subtitle">Pergerakan Top 3 emiten dari tahun ke tahun</p>
            </div>
            <div className="flex items-center gap-3">
              {trenData.keys.map((k, i) => (
                <div key={k} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-5 h-1 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  <span className="font-medium">{k}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={trenData.data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                {CHART_COLORS.map((c, i) => (
                  <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} stroke="#f0f7f3" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {trenData.keys.map((k, i) => (
                <Area
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={CHART_COLORS[i]}
                  fill={`url(#grad${i})`}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: CHART_COLORS[i], strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Sektor Bar */}
        <div className="card-lg animate-in delay-300">
          <h2 className="section-title mb-1">Avg Skor per Sektor</h2>
          <p className="section-subtitle mb-5">Konsistensi fundamental industri (All-Time)</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={sektorData} layout="vertical" barSize={8}>
              <CartesianGrid horizontal={false} stroke="#f0f7f3" />
              <XAxis
                type="number"
                domain={[0, 1]}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="sektor"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                width={78}
              />
              <Tooltip
                formatter={(v) => v.toFixed(4)}
                contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e4ede8' }}
              />
              <Bar dataKey="avg" radius={[0, 5, 5, 0]}>
                {sektorData.map((_, i) => (
                  <Cell key={i} fill={['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
