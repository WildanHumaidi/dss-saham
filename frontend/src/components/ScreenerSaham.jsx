import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export default function ScreenerSaham() {
    const [data, setData] = useState([]);
    const [tahun, setTahun] = useState(2025);
    const [loading, setLoading] = useState(false);

    // Filter list tahun 2010 - 2025
    const listTahun = Array.from({ length: 16 }, (_, i) => 2025 - i);

    useEffect(() => {
        fetchData(tahun);
    }, [tahun]);

    const fetchData = async (selectedTahun) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/analitik/screener?tahun=${selectedTahun}`);
            setData(res.data.data);
        } catch (error) {
            console.error("Gagal mengambil data screener:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper warna ala Value Investing
    const getColorPER = (per) => {
        if (per <= 0) return 'text-slate-500'; // Rugi
        if (per < 10) return 'text-emerald-400 font-bold'; // Undervalued
        if (per > 20) return 'text-rose-400 font-bold'; // Overvalued
        return 'text-slate-200'; // Wajar
    };

    const getColorPBV = (pbv) => pbv < 1 && pbv > 0 ? 'text-emerald-400 font-bold' : (pbv > 2 ? 'text-rose-400' : 'text-slate-200');
    const getColorROE = (roe) => roe > 15 ? 'text-emerald-400 font-bold' : (roe < 5 ? 'text-rose-400' : 'text-slate-200');
    const getColorDER = (der) => der < 1 ? 'text-emerald-400 font-bold' : (der > 2 ? 'text-rose-400' : 'text-slate-200');

    return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* --- Header --- */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                            Screener Saham Value
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Analisis fundamental & valuasi perusahaan Indonesia ala SabarKaya
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-slate-400">Tahun Buku:</label>
                        <select 
                            value={tahun} 
                            onChange={(e) => setTahun(e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                            {listTahun.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* --- Tabel Screener --- */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-slate-400 bg-slate-950/50 uppercase border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Kode</th>
                                    <th className="px-6 py-4 font-semibold text-right">Harga (Rp)</th>
                                    <th className="px-6 py-4 font-semibold text-right">EPS</th>
                                    <th className="px-6 py-4 font-semibold text-right" title="Price to Earning Ratio (Rendah lebih baik)">PER (x)</th>
                                    <th className="px-6 py-4 font-semibold text-right" title="Price to Book Value (Di bawah 1 = Murah)">PBV (x)</th>
                                    <th className="px-6 py-4 font-semibold text-right" title="Return on Equity (Di atas 15% bagus)">ROE (%)</th>
                                    <th className="px-6 py-4 font-semibold text-right" title="Debt to Equity (Di bawah 1 aman)">DER (x)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10 text-slate-500">
                                            <span className="animate-pulse">Mengambil data analitik...</span>
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10 text-slate-500">
                                            Belum ada data laporan keuangan untuk tahun {tahun}.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item, idx) => (
                                        <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-400 font-bold flex items-center justify-center text-xs border border-blue-800">
                                                        {item.kode_saham.substring(0, 1)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-200">{item.kode_saham}</div>
                                                        <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                                            {item.nama_perusahaan}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-300">
                                                {new Intl.NumberFormat('id-ID').format(item.harga_saham)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-400">
                                                {item.eps}
                                            </td>
                                            <td className={`px-6 py-4 text-right ${getColorPER(item.per)}`}>
                                                {item.per <= 0 ? 'Minus' : item.per}
                                            </td>
                                            <td className={`px-6 py-4 text-right ${getColorPBV(item.pbv)}`}>
                                                {item.pbv}
                                            </td>
                                            <td className={`px-6 py-4 text-right ${getColorROE(item.roe)}`}>
                                                {item.roe}%
                                            </td>
                                            <td className={`px-6 py-4 text-right ${getColorDER(item.der)}`}>
                                                {item.der}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- Keterangan Indikator --- */}
                <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                        <span className="text-slate-400">Indikator Bagus/Murah</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                        <span className="text-slate-400">Overvalued / Risiko Tinggi</span>
                    </div>
                </div>

            </div>
        </div>
    );
}