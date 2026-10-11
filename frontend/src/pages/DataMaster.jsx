import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, X, Pencil } from 'lucide-react';
import { API_BASE } from '../services/api';
const SEKTOR_OPTIONS = [
  'Pertambangan',
  'Perbankan',
  'Infrastruktur',
  'Properti',
  'Telekomunikasi',
  'Konsumer',
  'Agribisnis',
  'Industri',
  'Energi',
  'Lainnya',
];

const SEKTOR_COLOR = {
  Perbankan: 'badge-blue',
  Pertambangan: 'badge-amber',
  Agribisnis: 'badge-green',
  Properti: 'badge-gray',
  Energi: 'badge-red',
  Telekomunikasi: 'badge-blue',
  Infrastruktur: 'badge-brand',
  Konsumer: 'badge-amber',
  Industri: 'badge-gray',
  Lainnya: 'badge-gray',
};

/* ── Tab Perusahaan ─────────────────────────────────────────────────── */
function TabPerusahaan() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ kode_saham: '', nama_perusahaan: '', sektor: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/perusahaan`);
      setList(res.data.data ?? []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.kode_saham || !form.nama_perusahaan) {
      toast.error('Kode dan Nama wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/perusahaan`, form);
      toast.success(`${form.kode_saham.toUpperCase()} berhasil ditambahkan`);
      setForm({ kode_saham: '', nama_perusahaan: '', sektor: '' });
      setShowForm(false);
      fetchList();
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{list.length}</span> perusahaan terdaftar
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`btn-sm gap-1.5 ${showForm ? 'btn-secondary' : 'btn-primary'}`}
        >
          {showForm ? (
            <>
              <X size={13} /> Batal
            </>
          ) : (
            <>
              <Plus size={13} /> Tambah Perusahaan
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 animate-in">
          <p className="text-sm font-bold text-gray-800 mb-4">Tambah Perusahaan Baru</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kode Saham</label>
              <input
                className="input uppercase font-mono"
                placeholder="BBCA"
                maxLength={6}
                value={form.kode_saham}
                onChange={(e) => setForm((p) => ({ ...p, kode_saham: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Nama Perusahaan
              </label>
              <input
                className="input"
                placeholder="PT Bank Central Asia Tbk"
                value={form.nama_perusahaan}
                onChange={(e) => setForm((p) => ({ ...p, nama_perusahaan: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sektor</label>
              <select
                className="input"
                value={form.sektor}
                onChange={(e) => setForm((p) => ({ ...p, sektor: e.target.value }))}
              >
                <option value="">Pilih Sektor</option>
                {SEKTOR_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
              {saving ? (
                <>
                  <span className="spinner spinner-sm spinner-white" /> Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </div>
      )}

      <div className="card-lg p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-36 gap-3 text-gray-400 text-sm">
            <span className="spinner" /> Memuat data...
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th className="w-12">ID</th>
                <th>Kode</th>
                <th>Nama Perusahaan</th>
                <th>Sektor</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-gray-400 text-xs">{p.id}</td>
                  <td>
                    <span className="font-bold text-emerald-700 font-mono text-sm">
                      {p.kode_saham}
                    </span>
                  </td>
                  <td className="text-gray-700">{p.nama_perusahaan}</td>
                  <td>
                    {p.sektor && (
                      <span className={SEKTOR_COLOR[p.sektor] ?? 'badge-gray'}>{p.sektor}</span>
                    )}
                  </td>
                </tr>
              ))}
              {!list.length && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-400 text-sm">
                    Belum ada data perusahaan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Tab Kriteria ───────────────────────────────────────────────────── */
function TabKriteria() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/kriteria`);
      setList(res.data.data ?? []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  async function saveBobot(id, bobot) {
    if (bobot <= 0) {
      toast.error('Bobot harus lebih dari 0');
      return;
    }
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/api/kriteria/${id}`, { bobot_awal: bobot });
      toast.success('Bobot berhasil diperbarui');
      setEditing(null);
      fetchList();
    } catch {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  async function normalizeBobot() {
    try {
      await axios.post(`${API_BASE}/api/kriteria/normalize`);
      toast.success('Bobot dinormalisasi dengan metode SMART');
      fetchList();
    } catch {
      toast.error('Gagal normalisasi');
    }
  }

  const totalBobot = list.reduce((s, k) => s + +k.bobot_awal, 0);
  const isValid = Math.round(totalBobot) === 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{list.length}</span> kriteria aktif
          </p>
          <span
            className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${isValid ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}
          >
            Σ Bobot = {totalBobot.toFixed(0)}
          </span>
        </div>
        <button
          onClick={normalizeBobot}
          className="btn-primary btn-sm"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            boxShadow: '0 2px 8px rgb(79 70 229 / .3)',
          }}
        >
          Normalisasi SMART
        </button>
      </div>

      {!isValid && (
        <div className="alert alert-warning animate-in">
          <span className="font-semibold">Total bobot {totalBobot}/100.</span>
          <span className="ml-1">
            Tekan "Normalisasi SMART" untuk menyesuaikan secara otomatis.
          </span>
        </div>
      )}

      <div className="card-lg p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-36 gap-3 text-gray-400 text-sm">
            <span className="spinner" /> Memuat kriteria...
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Kriteria</th>
                <th>Atribut</th>
                <th>Bobot Awal</th>
                <th>Bobot Normal</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((k) => (
                <tr key={k.id}>
                  <td>
                    <span className="badge-gray font-mono text-[11px]">{k.kode}</span>
                  </td>
                  <td className="font-medium text-gray-800">{k.nama_kriteria}</td>
                  <td>
                    <span className={k.atribut === 'benefit' ? 'badge-green' : 'badge-red'}>
                      {k.atribut}
                    </span>
                  </td>
                  <td>
                    {editing === k.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="input input-sm w-20 text-center font-mono"
                        autoFocus
                      />
                    ) : (
                      <span className="font-mono text-gray-700 font-semibold">{k.bobot_awal}</span>
                    )}
                  </td>
                  <td>
                    <span className="font-mono text-emerald-700 font-bold text-sm">
                      {k.bobot_normalisasi ? (+k.bobot_normalisasi).toFixed(4) : '—'}
                    </span>
                  </td>
                  <td className="text-right">
                    {editing === k.id ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => saveBobot(k.id, +editValue)}
                          disabled={saving}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          {saving ? '...' : 'Simpan'}
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditing(k.id);
                          setEditValue(k.bobot_awal);
                        }}
                        className="btn-icon w-7 h-7 rounded-lg"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
          <p className="text-xs font-bold text-emerald-700 mb-1.5">Atribut Benefit</p>
          <p className="text-xs text-gray-500 font-mono leading-relaxed">
            Nilai makin tinggi = makin baik.
            <br />
            r_ij = x_ij / max(x_j)
          </p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4">
          <p className="text-xs font-bold text-rose-700 mb-1.5">Atribut Cost</p>
          <p className="text-xs text-gray-500 font-mono leading-relaxed">
            Nilai makin rendah = makin baik.
            <br />
            r_ij = min(x_j) / x_ij
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────── */
export default function DataMaster() {
  const [tab, setTab] = useState('perusahaan');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Data Master</h1>
        <p className="page-subtitle">
          Kelola daftar perusahaan dan konfigurasi kriteria SMART &amp; SAW
        </p>
      </div>

      <div className="tab-bar">
        {[
          { id: 'perusahaan', label: 'Perusahaan' },
          { id: 'kriteria', label: 'Kriteria & Bobot' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`tab-item ${tab === t.id ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'perusahaan' && <TabPerusahaan />}
      {tab === 'kriteria' && <TabKriteria />}
    </div>
  );
}
