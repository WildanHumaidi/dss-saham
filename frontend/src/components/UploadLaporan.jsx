import { useState } from 'react';
import axios from 'axios';

// ─── Konstanta ────────────────────────────────────────────────────────────────
const YEARS    = Array.from({ length: 16 }, (_, i) => 2010 + i); // 2010–2025
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const ROWS = [
    { key: 'total_aset',       label: 'Total Aset',       accent: 'blue'  },
    { key: 'total_liabilitas', label: 'Total Liabilitas', accent: 'rose'  },
    { key: 'total_ekuitas',    label: 'Total Ekuitas',    accent: 'green' },
];

const ACCENT = {
    blue:  { section: 'border-blue-900/60 bg-blue-950/20',   dot: 'bg-blue-500',   badge: 'bg-blue-900/40 text-blue-300 border-blue-800'   },
    rose:  { section: 'border-rose-900/60 bg-rose-950/20',   dot: 'bg-rose-500',   badge: 'bg-rose-900/40 text-rose-300 border-rose-800'   },
    green: { section: 'border-green-900/60 bg-green-950/20', dot: 'bg-green-500',  badge: 'bg-green-900/40 text-green-300 border-green-800' },
};

const emptyData  = () => ({ total_aset: Array(16).fill(''), total_liabilitas: Array(16).fill(''), total_ekuitas: Array(16).fill('') });
const emptyFlags = () => ({ total_aset: Array(16).fill(false), total_liabilitas: Array(16).fill(false), total_ekuitas: Array(16).fill(false) });

// ─── Sub-components ───────────────────────────────────────────────────────────

function YearInput({ year, value, isOcrFilled, onChange }) {
    return (
        <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-mono text-slate-500 text-center leading-none">{year}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="—"
                className={`w-full rounded px-1.5 py-1 text-xs text-center border
                    focus:outline-none focus:ring-1 focus:ring-blue-500
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                    [&::-webkit-inner-spin-button]:appearance-none
                    ${isOcrFilled
                        ? 'bg-amber-950/60 border-amber-700 text-amber-200'
                        : 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-700'
                    }`}
            />
        </div>
    );
}

function NeracaSection({ rowKey, label, accent, values, flags, onUpdate }) {
    const a      = ACCENT[accent];
    const filled = values.filter(Boolean).length;
    const pending = flags.filter(Boolean).length;
    return (
        <div className={`rounded-lg border p-3 ${a.section}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${a.dot}`} />
                    <span className="text-xs font-semibold text-slate-300">{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {pending > 0 && (
                        <span className="text-[10px] text-amber-500">● {pending} perlu cek</span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${a.badge}`}>
                        {filled}/16
                    </span>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {YEARS.map((year, i) => (
                    <YearInput key={year} year={year}
                        value={values[i]} isOcrFilled={flags[i]}
                        onChange={(v) => onUpdate(rowKey, i, v)} />
                ))}
            </div>
        </div>
    );
}

function Alert({ status }) {
    if (!status) return null;
    const ok = status.type === 'success';
    return (
        <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs border
            ${ok ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                 : 'bg-red-950 text-red-300 border-red-800'}`}>
            <span className="font-bold mt-0.5">{ok ? '✓' : '✕'}</span>
            <span>{status.text}</span>
        </div>
    );
}

function Steps({ current }) {
    const steps = ['Upload Gambar', 'Ekstrak AI', 'Koreksi & Simpan'];
    return (
        <div className="flex items-center">
            {steps.map((label, i) => {
                const idx    = i + 1;
                const done   = idx < current;
                const active = idx === current;
                return (
                    <div key={i} className="flex items-center">
                        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-full
                            ${done   ? 'text-emerald-400'
                            : active ? 'text-blue-300 bg-blue-900/40 border border-blue-800'
                            :          'text-slate-600'}`}>
                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px]
                                ${done   ? 'bg-emerald-800 text-emerald-300'
                                : active ? 'bg-blue-600 text-white'
                                :          'bg-slate-800 text-slate-500'}`}>
                                {done ? '✓' : idx}
                            </span>
                            {label}
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`w-5 h-px mx-1 ${done ? 'bg-emerald-800' : 'bg-slate-800'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function UploadLaporanNeraca() {
    const [perusahaanId, setPerusahaanId] = useState('');
    const [imageFile,    setImageFile]    = useState(null);
    const [imageSrc,     setImageSrc]     = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isSaving,     setIsSaving]     = useState(false);
    const [statusMsg,    setStatusMsg]    = useState(null);
    const [hasData,      setHasData]      = useState(false);

    const [data,  setData]  = useState(emptyData());
    const [flags, setFlags] = useState(emptyFlags());

    // ─── Step indicator ───────────────────────────────────────────────────────
    const step = !imageSrc ? 1 : !hasData ? 2 : 3;

    // ─── Summary counts ───────────────────────────────────────────────────────
    const totalPending = ROWS.reduce((s, { key }) => s + flags[key].filter(Boolean).length, 0);
    const totalFilled  = ROWS.reduce((s, { key }) => s + data[key].filter(Boolean).length, 0);

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (imageSrc) URL.revokeObjectURL(imageSrc);
        setImageFile(file);
        setImageSrc(URL.createObjectURL(file));
        setHasData(false);
        setStatusMsg(null);
        setData(emptyData());
        setFlags(emptyFlags());
    };

    const handleEkstrak = async () => {
        if (!imageFile)    { setStatusMsg({ type: 'error', text: 'Pilih gambar terlebih dahulu.' }); return; }
        if (!perusahaanId) { setStatusMsg({ type: 'error', text: 'ID Perusahaan harus diisi.' });    return; }

        setIsExtracting(true);
        setStatusMsg(null);

        try {
            const formData = new FormData();
            formData.append('perusahaan_id', perusahaanId);
            formData.append('gambar', imageFile);

            const res      = await axios.post(`${API_BASE}/api/laporan/ekstrak-gambar`, formData);
            const extracted = res.data.data;
            // expected: { tahun: [2010..2025], total_aset: [...], total_liabilitas: [...], total_ekuitas: [...] }

            const newData  = emptyData();
            const newFlags = emptyFlags();

            extracted.tahun.forEach((year, i) => {
                const idx = year - 2010;
                if (idx < 0 || idx >= 16) return;
                ROWS.forEach(({ key }) => {
                    const val = extracted[key]?.[i];
                    if (val !== null && val !== undefined && val !== '') {
                        newData[key][idx]  = String(val);
                        newFlags[key][idx] = true;
                    }
                });
            });

            setData(newData);
            setFlags(newFlags);
            setHasData(true);
            setStatusMsg({ type: 'success', text: 'Data berhasil diekstrak. Periksa nilai kuning (amber) sebelum menyimpan.' });
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Gagal menghubungi server.';
            setStatusMsg({ type: 'error', text: msg });
        } finally {
            setIsExtracting(false);
        }
    };

    const handleUpdate = (key, idx, val) => {
        setData(prev  => { const n = { ...prev,  [key]: [...prev[key]] };  n[key][idx] = val;   return n; });
        setFlags(prev => { const n = { ...prev,  [key]: [...prev[key]] };  n[key][idx] = false; return n; });
    };

    const handleSimpan = async () => {
        if (!perusahaanId) { setStatusMsg({ type: 'error', text: 'ID Perusahaan harus diisi.' });   return; }
        if (!hasData)      { setStatusMsg({ type: 'error', text: 'Ekstrak data terlebih dahulu.' }); return; }

        setIsSaving(true);
        setStatusMsg(null);

        try {
            const payload = YEARS
                .map((year, i) => ({
                    tahun:            year,
                    total_aset:       data.total_aset[i]       || null,
                    total_liabilitas: data.total_liabilitas[i] || null,
                    total_ekuitas:    data.total_ekuitas[i]    || null,
                }))
                .filter(row => row.total_aset || row.total_liabilitas || row.total_ekuitas);

            await axios.post(`${API_BASE}/api/laporan/upload-neraca`, {
                perusahaan_id: perusahaanId,
                data_tahunan:  JSON.stringify(payload),
            });

            setStatusMsg({ type: 'success', text: 'Data Neraca berhasil disimpan!' });
            setFlags(emptyFlags());
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.response?.data?.message ?? 'Gagal menyimpan.' });
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">

            {/* ── Header ── */}
            <div className="flex-shrink-0 border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono px-2 py-0.5 bg-indigo-900/50 text-indigo-300 border border-indigo-800 rounded">
                            NERACA
                        </span>
                        <h1 className="text-base font-bold">Input Neraca — Aset · Liabilitas · Ekuitas</h1>
                    </div>
                    <Steps current={step} />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {totalPending > 0 && (
                        <span className="text-xs bg-amber-900/40 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full">
                            {totalPending} perlu dicek
                        </span>
                    )}
                    {totalFilled > 0 && (
                        <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                            {totalFilled}/48 terisi
                        </span>
                    )}
                </div>
            </div>

            {/* ── Two-panel ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── PANEL KIRI: Preview gambar ── */}
                <div className="w-1/2 border-r border-slate-800 flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 px-5 py-3 border-b border-slate-800 space-y-2.5">
                        <div className="flex items-center gap-3">
                            <span className="w-28 text-xs text-slate-500 flex-shrink-0">ID Perusahaan</span>
                            <input type="number" value={perusahaanId}
                                onChange={(e) => setPerusahaanId(e.target.value)}
                                placeholder="e.g. 1"
                                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm
                                           text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-28 text-xs text-slate-500 flex-shrink-0">File Laporan</span>
                            <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleFileSelect}
                                className="flex-1 text-xs text-slate-400
                                           file:mr-2 file:bg-slate-800 file:border file:border-slate-600
                                           file:text-slate-300 file:rounded file:px-2 file:py-1
                                           file:cursor-pointer file:text-xs file:hover:bg-slate-700" />
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="flex-1 overflow-auto p-4">
                        {imageSrc ? (
                            <img src={imageSrc} alt="Laporan" className="w-full rounded border border-slate-800" />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl gap-2">
                                <p className="text-slate-600 text-sm">Upload gambar laporan neraca</p>
                                <p className="text-slate-700 text-xs">Format: JPG / PNG — full halaman, tidak perlu crop</p>
                            </div>
                        )}
                    </div>

                    {/* Tombol ekstrak */}
                    {imageSrc && (
                        <div className="flex-shrink-0 px-5 py-3 border-t border-slate-800">
                            <button onClick={handleEkstrak} disabled={isExtracting}
                                className="w-full flex items-center justify-center gap-2
                                           bg-indigo-600 hover:bg-indigo-500
                                           disabled:bg-slate-800 disabled:text-slate-600
                                           transition-colors py-2.5 rounded-lg text-sm font-semibold">
                                {isExtracting ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-indigo-300 rounded-full animate-spin" />
                                        Claude sedang membaca tabel...
                                    </>
                                ) : (
                                    '✦ Ekstrak Data dengan AI'
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* ── PANEL KANAN: Tiga grid neraca ── */}
                <div className="w-1/2 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                        {!hasData && (
                            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-800 rounded-xl gap-2 mt-8">
                                <p className="text-slate-600 text-sm">Upload gambar → klik "Ekstrak Data"</p>
                                <p className="text-slate-700 text-xs">AI akan membaca Aset, Liabilitas, dan Ekuitas sekaligus</p>
                            </div>
                        )}

                        {ROWS.map(({ key, label, accent }) => (
                            hasData && (
                                <NeracaSection key={key}
                                    rowKey={key} label={label} accent={accent}
                                    values={data[key]} flags={flags[key]}
                                    onUpdate={handleUpdate} />
                            )
                        ))}
                    </div>

                    {/* Submit */}
                    <div className="flex-shrink-0 border-t border-slate-800 px-5 py-4 space-y-2.5">
                        <Alert status={statusMsg} />
                        <button onClick={handleSimpan} disabled={isSaving || !hasData}
                            className="w-full bg-blue-600 hover:bg-blue-500
                                       disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed
                                       transition-colors py-2.5 rounded-lg font-semibold text-sm">
                            {isSaving ? 'Menyimpan...' : 'Simpan Data Neraca'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}