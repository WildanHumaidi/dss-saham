import { useState } from 'react';
import axios from 'axios';
import {
  Save,
  Database,
  AlertCircle,
  FileSpreadsheet,
  Lock,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../services/api';

const FIELD_GROUPS = [
  {
    label: 'Neraca Keuangan',
    subtitle: 'Balance Sheet',
    fields: [
      { name: 'total_aset', label: 'Total Aset', placeholder: '0' },
      { name: 'total_liabilitas', label: 'Total Liabilitas', placeholder: '0' },
      { name: 'total_ekuitas', label: 'Total Ekuitas', placeholder: 'Auto-hitung', isCalc: true },
    ],
  },
  {
    label: 'Laba Rugi & Arus Kas',
    subtitle: 'Income Statement & Cash Flow',
    fields: [
      { name: 'pendapatan', label: 'Pendapatan', placeholder: '0' },
      { name: 'laba_bersih', label: 'Laba Bersih', placeholder: '0' },
      { name: 'arus_kas_operasi', label: 'Arus Kas Operasi', placeholder: '0' },
    ],
  },
];

const EMPTY_FORM = {
  kode_saham: '',
  tahun: new Date().getFullYear(),
  total_aset: '',
  total_liabilitas: '',
  total_ekuitas: '',
  jumlah_saham_beredar: '',
  harga_saham: '',
  pendapatan: '',
  laba_bersih: '',
  arus_kas_operasi: '',
  dividen: '',
};

export default function InputData() {
  const { isAdmin } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState(EMPTY_FORM);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCalcEkuitas = () => {
    const aset = parseFloat(formData.total_aset) || 0;
    const liab = parseFloat(formData.total_liabilitas) || 0;
    setFormData((prev) => ({ ...prev, total_ekuitas: (aset - liab).toString() }));
  };

  // BUG FIX #9: Kode asli memanggil e.preventDefault() dan kemudian
  // langsung return saat !isAdmin — ini sebenarnya sudah benar. Tapi
  // field form punya `required` attribute yang akan memblokir submit
  // di browser bahkan sebelum handleSubmit dipanggil. Karena kita ingin
  // menampilkan pesan error custom (bukan browser native validation),
  // tambahkan `noValidate` pada <form> dan lakukan validasi manual.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setStatus({ type: 'error', message: 'Akses Ditolak: Hanya Admin.' });
      return;
    }
    if (!formData.kode_saham.trim()) {
      setStatus({ type: 'error', message: 'Kode saham wajib diisi.' });
      return;
    }

    setIsSaving(true);
    setStatus({ type: '', message: '' });

    try {
      await axios.post(`${API_BASE}/api/laporan/upload-neraca`, formData);
      setStatus({
        type: 'success',
        message: `Data ${formData.kode_saham.toUpperCase()} tahun ${formData.tahun} berhasil disimpan!`,
      });
      // Reset hanya field finansial, pertahankan kode & tahun untuk entri berikutnya
      setFormData((prev) => ({
        ...prev,
        total_aset: '',
        total_liabilitas: '',
        total_ekuitas: '',
        pendapatan: '',
        laba_bersih: '',
        arus_kas_operasi: '',
        harga_saham: '',
        jumlah_saham_beredar: '',
        dividen: '',
      }));
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Gagal menyimpan data ke server.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Input Data Keuangan</h1>
          <p className="page-subtitle">
            Entri data fundamental emiten (dalam Rp Miliar) untuk analisis SAW
          </p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
            isAdmin
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {isAdmin ? '● Admin' : '● Analyst'}
        </span>
      </div>

      {/* Access warning */}
      {!isAdmin && (
        <div className="alert alert-warning animate-in">
          <Lock size={15} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong>Akses Dibatasi</strong>
            <p className="text-xs mt-0.5 opacity-80">
              Anda login sebagai Analyst. Hanya dapat melihat simulasi. Hubungi Administrator untuk
              mengubah data fundamental.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Form */}
        <div className="lg:col-span-2 card-lg relative overflow-hidden card-accent">
          {!isAdmin && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-2xl flex items-center justify-center cursor-not-allowed">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100/80 rounded-full border border-gray-200">
                <Lock size={14} className="text-gray-500" />
                <span className="text-xs font-semibold text-gray-500">Membutuhkan akses Admin</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Database size={15} className="text-emerald-600" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-800">Form Entri Manual</span>
              <span className="block text-[11px] text-gray-400">Satu baris data per submit</span>
            </div>
          </div>

          {/* BUG FIX #9: tambah noValidate untuk bypass browser native validation */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Identitas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Kode Saham
                </label>
                <input
                  type="text"
                  name="kode_saham"
                  value={formData.kode_saham}
                  onChange={handleChange}
                  placeholder="BBCA"
                  maxLength={6}
                  className="input uppercase font-mono font-bold tracking-widest"
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Tahun Buku
                </label>
                <input
                  type="number"
                  name="tahun"
                  value={formData.tahun}
                  onChange={handleChange}
                  className="input"
                  disabled={!isAdmin}
                />
              </div>
            </div>

            {/* Field groups */}
            {FIELD_GROUPS.map((group) => (
              <div
                key={group.label}
                className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3"
              >
                <div className="flex items-baseline gap-2 mb-3">
                  <h3 className="text-xs font-bold text-gray-700">{group.label}</h3>
                  <span className="text-[10px] text-gray-400">{group.subtitle}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {group.fields.map((f) => (
                    <div key={f.name}>
                      <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1.5">
                        {f.label}
                        {f.isCalc && (
                          <button
                            type="button"
                            onClick={handleCalcEkuitas}
                            disabled={!isAdmin}
                            className="text-[10px] text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded font-bold transition-colors disabled:opacity-40"
                          >
                            Auto
                          </button>
                        )}
                      </label>
                      <input
                        type="number"
                        name={f.name}
                        value={formData[f.name]}
                        onChange={handleChange}
                        placeholder={f.placeholder}
                        className="input text-sm"
                        disabled={!isAdmin}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Market data */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { name: 'harga_saham', label: 'Harga Saham' },
                { name: 'jumlah_saham_beredar', label: 'Saham Beredar' },
                { name: 'dividen', label: 'Dividen' },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type="number"
                    name={f.name}
                    value={formData[f.name]}
                    onChange={handleChange}
                    className="input"
                    disabled={!isAdmin}
                  />
                </div>
              ))}
            </div>

            {/* Status */}
            {status.message && (
              <div
                className={`alert animate-in ${
                  status.type === 'success' ? 'alert-success' : 'alert-error'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                )}
                <p>{status.message}</p>
              </div>
            )}

            <div className="pt-1 flex justify-end">
              <button type="submit" disabled={isSaving || !isAdmin} className="btn-primary">
                {isSaving ? (
                  <>
                    <span className="spinner spinner-sm spinner-white" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={15} /> Simpan Data
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* CSV Import */}
        <div className="card-lg h-fit">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <FileSpreadsheet size={15} className="text-emerald-600" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-800">Import CSV</span>
              <span className="block text-[11px] text-gray-400">Bulk import data historis</span>
            </div>
          </div>

          <div
            className={`rounded-xl border-2 border-dashed p-6 text-center transition-all ${
              isAdmin
                ? 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/20 cursor-pointer'
                : 'border-gray-100 bg-gray-50/40 opacity-50'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Upload size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">Tarik &amp; Lepas File</p>
            <p className="text-xs text-gray-400 mb-4">CSV, maks 5MB</p>
            <button type="button" disabled={!isAdmin} className="btn-outline btn-sm w-full">
              Browse File
            </button>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-sky-50/50 border border-sky-100">
            <div className="flex items-start gap-2">
              <AlertCircle size={13} className="text-sky-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-sky-700 leading-relaxed">
                Format CSV standar (11 kolom). Baris pertama harus berisi header kolom.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
