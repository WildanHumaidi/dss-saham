import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { RotateCcw } from 'lucide-react';
import { API_BASE } from '../services/api';
const YEARS = Array.from({ length: 16 }, (_, i) => 2010 + i);

const KRITERIA_DEFAULT = [
  { id: 'roa', label: 'ROA', full: 'Return on Assets', atribut: 'benefit', bobot: 25 },
  { id: 'roe', label: 'ROE', full: 'Return on Equity', atribut: 'benefit', bobot: 25 },
  { id: 'npm', label: 'NPM', full: 'Net Profit Margin', atribut: 'benefit', bobot: 20 },
  {
    id: 'rasio_arus_kas_operasi',
    label: 'Kas Operasi',
    full: 'Rasio Arus Kas Operasi',
    atribut: 'benefit',
    bobot: 15,
  },
  { id: 'rasio_utang', label: 'DER', full: 'Debt to Equity Ratio', atribut: 'cost', bobot: 15 },
];

/* ── SMART & SAW Algorithm ── */
function smartSaw(data, kriteria) {
  if (!data.length) return [];
  const totalBobot = kriteria.reduce((s, k) => s + k.bobot, 0);
  const weights = kriteria.map((k) => k.bobot / totalBobot);

  const cleanData = data.map((row) => {
    const r = { ...row };
    kriteria.forEach((k) => {
      const v = +row[k.id] || 0;
      r[k.id] = k.atribut === 'benefit' ? Math.max(v, 0) : Math.max(v, 0.1);
    });
    return r;
  });

  const maxMin = kriteria.map((k) => {
    const vals = cleanData.map((r) => r[k.id]);
    // BUG FIX #7: Math.max/min dengan spread operator crash saat array
    // sangat besar (stack overflow) dan mengembalikan ±Infinity saat kosong.
    // Gunakan reduce sebagai gantinya.
    let max = vals.reduce((m, v) => Math.max(m, v), 0.0001);
    let min = vals.reduce((m, v) => Math.min(m, v), Infinity);
    if (min === Infinity) min = 0;

    if (k.id === 'roa') max = Math.min(max, 30);
    if (k.id === 'roe') max = Math.min(max, 50);
    if (k.id === 'npm') max = Math.min(max, 40);
    if (k.id === 'rasio_arus_kas_operasi') max = Math.min(max, 2);
    if (k.id === 'rasio_utang') min = Math.max(min, 0.2);
    return { max, min };
  });

  return cleanData
    .map((row, idx) => {
      const normVals = kriteria.map((k, ki) => {
        const v = Math.min(row[k.id], maxMin[ki].max);
        return k.atribut === 'benefit'
          ? v / maxMin[ki].max
          : maxMin[ki].min / Math.max(v, maxMin[ki].min);
      });
      return {
        ...data[idx],
        nilai: normVals.reduce((s, v, i) => s + v * weights[i], 0),
      };
    })
    .sort((a, b) => b.nilai - a.nilai)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

/* ── Slider Component ── */
function Slider({ kriteria, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-gray-800 truncate">{kriteria.label}</span>
          <span
            className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
              kriteria.atribut === 'benefit'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}
          >
            {kriteria.atribut}
          </span>
        </div>
        <span className="text-sm font-mono font-extrabold text-emerald-700 flex-shrink-0 tabular-nums">
          {value}
        </span>
      </div>

      <div className="relative h-5 flex items-center">
        <div className="absolute w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${value}%`,
              background: 'linear-gradient(90deg, #059669, #34d399)',
            }}
          />
        </div>
        {/* BUG FIX #8: WebkitAppearance sebagai prop React harus
                    menggunakan camelCase `WebkitAppearance`, bukan string
                    `'webkit-appearance'`. Sudah benar di kode asli tapi
                    diklarifikasi di sini untuk kejelasan. */}
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(+e.target.value)}
          className="relative w-full h-5 appearance-none bg-transparent cursor-pointer z-10"
          style={{ WebkitAppearance: 'none' }}
        />
      </div>

      <p className="text-[10px] text-gray-400 font-medium">{kriteria.full}</p>
    </div>
  );
}

/* ── Main Component ── */
export default function Sensitivity() {
  const [tahun, setTahun] = useState(2025);
  const [bobots, setBobots] = useState(KRITERIA_DEFAULT.map((k) => k.bobot));
  const [rasioData, setRasioData] = useState([]);
  const [loading, setLoading] = useState(false);

  const kriteria = KRITERIA_DEFAULT.map((k, i) => ({ ...k, bobot: bobots[i] }));
  const totalBobot = bobots.reduce((a, b) => a + b, 0);
  const isValid = totalBobot === 100;

  const fetchRasio = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/analitik/rasio/${tahun}`);
      setRasioData(res.data.data ?? []);
    } catch {
      setRasioData([]);
    } finally {
      setLoading(false);
    }
  }, [tahun]);

  useEffect(() => {
    fetchRasio();
  }, [fetchRasio]);

  const ranked = useMemo(() => smartSaw(rasioData, kriteria), [rasioData, bobots]);
  // BUG FIX #7 (sama): gunakan reduce, bukan spread ke Math.max
  const maxNilai = ranked.length
    ? ranked.reduce((m, r) => Math.max(m, r.nilai), 0) || 0.0001
    : 0.0001;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Sensitivity Analysis</h1>
          <p className="page-subtitle">
            Simulasi dampak perubahan bobot kriteria terhadap peringkat secara real-time
          </p>
        </div>
        <select
          value={tahun}
          onChange={(e) => setTahun(+e.target.value)}
          className="input w-auto font-semibold cursor-pointer flex-shrink-0"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Slider Panel */}
        <div className="lg:col-span-2">
          <div className="card-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="section-title">Bobot Kriteria</h2>
                <p className="section-subtitle">Geser slider untuk simulasi</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-extrabold font-mono px-2.5 py-1 rounded-lg border transition-all ${
                    isValid
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}
                >
                  Σ {totalBobot}
                </span>
                <button
                  onClick={() => setBobots(KRITERIA_DEFAULT.map((k) => k.bobot))}
                  className="btn-icon"
                  title="Reset bobot"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {!isValid && (
              <div className="alert alert-warning text-xs animate-in">
                <span>
                  Bobot {totalBobot}/100 — Sistem menormalisasi secara otomatis saat kalkulasi.
                </span>
              </div>
            )}

            <div className="space-y-4">
              {KRITERIA_DEFAULT.map((k, i) => (
                <Slider
                  key={k.id}
                  kriteria={k}
                  value={bobots[i]}
                  onChange={(v) =>
                    setBobots((p) => {
                      const n = [...p];
                      n[i] = v;
                      return n;
                    })
                  }
                />
              ))}
            </div>

            {/* Bobot summary */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              {KRITERIA_DEFAULT.map((k, i) => (
                <div key={k.id} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-20 font-medium">{k.label}</span>
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${totalBobot ? (bobots[i] / totalBobot) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-gray-500 w-10 text-right tabular-nums">
                    {totalBobot ? ((bobots[i] / totalBobot) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rankings */}
        <div className="lg:col-span-3">
          <div className="card-lg p-0 overflow-hidden flex flex-col h-full">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h2 className="section-title">Peringkat Simulasi</h2>
                <p className="section-subtitle">Live · Berubah seiring slider</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  style={{ animation: 'pulse 1.8s infinite' }}
                />
                Live
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center gap-3 text-gray-400 text-sm min-h-[400px]">
                <span className="spinner" /> Memuat rasio {tahun}...
              </div>
            ) : ranked.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 min-h-[400px] text-gray-400">
                <p className="text-sm font-semibold">Tidak ada data untuk tahun {tahun}</p>
                <p className="text-xs">Jalankan "Hitung Rasio" di halaman Analitik</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: '560px' }}>
                <table className="table-base">
                  <thead className="sticky top-0 bg-gray-50 shadow-[0_1px_0_0_#e4ede8]">
                    <tr>
                      <th className="w-10">#</th>
                      <th>Emiten</th>
                      <th>Skor</th>
                      <th className="text-right">ROA</th>
                      <th className="text-right">ROE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((row, i) => (
                      <tr
                        key={row.kode_saham}
                        className="animate-in"
                        style={{ animationDelay: `${Math.min(i * 20, 300)}ms` }}
                      >
                        <td>
                          {row.rank <= 3 ? (
                            <span className="text-base leading-none">
                              {['🥇', '🥈', '🥉'][row.rank - 1]}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-gray-400 font-semibold">
                              {row.rank}
                            </span>
                          )}
                        </td>
                        <td className="font-bold text-emerald-700 text-sm">{row.kode_saham}</td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="progress-track w-20">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${((row.nilai / maxNilai) * 100).toFixed(1)}%`,
                                }}
                              />
                            </div>
                            <span className="font-mono text-sm font-bold text-gray-900 tabular-nums">
                              {row.nilai.toFixed(4)}
                            </span>
                          </div>
                        </td>
                        <td className="font-mono text-gray-500 text-right text-xs">
                          {(+row.roa || 0).toFixed(3)}
                        </td>
                        <td className="font-mono text-gray-500 text-right text-xs">
                          {(+row.roe || 0).toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
