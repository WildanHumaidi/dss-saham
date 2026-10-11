import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  Users, Building2, FileText, Database,
  Plus, Pencil, Trash2, X, Check, Search,
  RefreshCw, ChevronDown, ChevronUp, Eye, EyeOff,
  Shield, ShieldOff, AlertTriangle, Download,
  Filter, MoreVertical, Lock, Unlock,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const SEKTOR_OPTIONS = [
  'Pertambangan', 'Perbankan', 'Infrastruktur', 'Properti',
  'Telekomunikasi', 'Konsumer', 'Agribisnis', 'Industri', 'Energi', 'Lainnya',
]
const SEKTOR_COLOR = {
  Perbankan: 'badge-blue', Pertambangan: 'badge-amber', Agribisnis: 'badge-green',
  Properti: 'badge-gray', Energi: 'badge-red', Telekomunikasi: 'badge-blue',
  Infrastruktur: 'badge-brand', Konsumer: 'badge-amber', Industri: 'badge-gray',
  Lainnya: 'badge-gray',
}
const YEARS = Array.from({ length: 16 }, (_, i) => 2010 + i)

/* ─── Shared helpers ─────────────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-1">Konfirmasi Hapus</p>
            <p className="text-xs text-gray-500 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="btn-outline btn-sm">Batal</button>
          <button
            onClick={onConfirm}
            className="btn-sm font-bold text-white bg-red-500 hover:bg-red-600 border-none rounded-lg px-4 py-1.5 transition-colors"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message, sub }) {
  return (
    <tr>
      <td colSpan={99} className="py-14 text-center">
        <p className="text-sm font-semibold text-gray-400">{message}</p>
        {sub && <p className="text-xs text-gray-300 mt-1">{sub}</p>}
      </td>
    </tr>
  )
}

function TableLoader() {
  return (
    <tr>
      <td colSpan={99} className="py-14 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <span className="spinner" /> Memuat data...
        </div>
      </td>
    </tr>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1 · MANAJEMEN USER
══════════════════════════════════════════════════════════════ */
function TabUsers() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)   // null = tambah baru
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' })

  const fetchList = useCallback(async () => {
    setLoading(true)
    try { const r = await axios.get(`${API_BASE}/api/admin/users`); setList(r.data.data ?? []) }
    catch { setList([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  function openAdd() {
    setEditTarget(null)
    setForm({ name: '', email: '', password: '', role: 'user' })
    setShowForm(true)
  }
  function openEdit(u) {
    setEditTarget(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setShowForm(true)
  }
  function cancelForm() { setShowForm(false); setEditTarget(null) }

  async function handleSave() {
    if (!form.name || !form.email) { toast.error('Nama dan Email wajib diisi'); return }
    if (!editTarget && !form.password) { toast.error('Password wajib diisi untuk user baru'); return }
    setSaving(true)
    try {
      const payload = { name: form.name, email: form.email, role: form.role }
      if (form.password) payload.password = form.password
      if (editTarget) {
        await axios.put(`${API_BASE}/api/admin/users/${editTarget.id}`, payload)
        toast.success(`User ${form.name} berhasil diperbarui`)
      } else {
        await axios.post(`${API_BASE}/api/admin/users`, payload)
        toast.success(`User ${form.name} berhasil dibuat`)
      }
      cancelForm(); fetchList()
    } catch (e) { toast.error(e.response?.data?.message ?? 'Gagal menyimpan') }
    finally { setSaving(false) }
  }

  async function handleDelete(id, name) {
    try {
      await axios.delete(`${API_BASE}/api/admin/users/${id}`)
      toast.success(`User "${name}" dihapus`)
      setConfirmDelete(null); fetchList()
    } catch (e) { toast.error(e.response?.data?.message ?? 'Gagal menghapus') }
  }

  async function toggleRole(user) {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    try {
      await axios.put(`${API_BASE}/api/admin/users/${user.id}`, { ...user, role: newRole })
      toast.success(`Role "${user.name}" diubah ke ${newRole}`)
      fetchList()
    } catch { toast.error('Gagal mengubah role') }
  }

  const filtered = list.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 h-9 text-sm"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button onClick={fetchList} className="btn-icon" title="Refresh"><RefreshCw size={14} /></button>
        <button onClick={openAdd} className="btn-primary btn-sm gap-1.5">
          <Plus size={13} /> Tambah User
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 animate-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-800">
              {editTarget ? `Edit User — ${editTarget.name}` : 'Tambah User Baru'}
            </p>
            <button onClick={cancelForm} className="btn-icon w-7 h-7"><X size={13} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Lengkap</label>
              <input className="input" placeholder="John Doe"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input className="input" type="email" placeholder="john@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Password {editTarget && <span className="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span>}
              </label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPass ? 'text' : 'password'}
                  placeholder={editTarget ? '••••••• (opsional)' : '••••••••'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
              <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="user">Analyst (User)</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={cancelForm} className="btn-outline btn-sm">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
              {saving ? <><span className="spinner spinner-sm spinner-white" /> Menyimpan...</> : <><Check size={13} /> Simpan</>}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card-lg p-0 overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Dibuat</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <TableLoader /> : filtered.length === 0 ? (
              <EmptyState message="Tidak ada user" sub={search ? 'Coba kata kunci lain' : undefined} />
            ) : filtered.map((u, i) => (
              <tr key={u.id} className="animate-in" style={{ animationDelay: `${i * 40}ms` }}>
                <td className="font-mono text-xs text-gray-400">{u.id}</td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      u.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">{u.name}</span>
                  </div>
                </td>
                <td className="text-gray-500 text-sm">{u.email}</td>
                <td>
                  <span className={u.role === 'admin' ? 'badge-brand' : 'badge-gray'}>
                    {u.role === 'admin' ? '⚙ Admin' : '👤 Analyst'}
                  </span>
                </td>
                <td className="text-xs text-gray-400 font-mono">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '—'}
                </td>
                <td>
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => toggleRole(u)}
                      title={u.role === 'admin' ? 'Ubah ke User' : 'Jadikan Admin'}
                      className={`btn-icon w-7 h-7 rounded-lg ${u.role === 'admin' ? 'text-violet-600 bg-violet-50 hover:bg-violet-100' : 'text-gray-500'}`}
                    >
                      {u.role === 'admin' ? <ShieldOff size={12} /> : <Shield size={12} />}
                    </button>
                    <button onClick={() => openEdit(u)} className="btn-icon w-7 h-7 rounded-lg" title="Edit">
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ id: u.id, name: u.name })}
                      className="btn-icon w-7 h-7 rounded-lg text-red-400 bg-red-50 hover:bg-red-100"
                      title="Hapus"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <p className="text-xs text-gray-400">
          {filtered.length} dari {list.length} user · {list.filter(u => u.role === 'admin').length} admin · {list.filter(u => u.role !== 'admin').length} analyst
        </p>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={`Hapus user "${confirmDelete.name}"? Tindakan ini tidak bisa dibatalkan.`}
          onConfirm={() => handleDelete(confirmDelete.id, confirmDelete.name)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2 · MANAJEMEN PERUSAHAAN
══════════════════════════════════════════════════════════════ */
function TabPerusahaan() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterSektor, setFilterSektor] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({ kode_saham: '', nama_perusahaan: '', sektor: '' })

  const fetchList = useCallback(async () => {
    setLoading(true)
    try { const r = await axios.get(`${API_BASE}/api/perusahaan`); setList(r.data.data ?? []) }
    catch { setList([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  function openAdd() {
    setEditTarget(null); setForm({ kode_saham: '', nama_perusahaan: '', sektor: '' }); setShowForm(true)
  }
  function openEdit(p) {
    setEditTarget(p); setForm({ kode_saham: p.kode_saham, nama_perusahaan: p.nama_perusahaan, sektor: p.sektor ?? '' }); setShowForm(true)
  }
  function cancelForm() { setShowForm(false); setEditTarget(null) }

  async function handleSave() {
    if (!form.kode_saham || !form.nama_perusahaan) { toast.error('Kode dan Nama wajib diisi'); return }
    setSaving(true)
    try {
      if (editTarget) {
        await axios.put(`${API_BASE}/api/perusahaan/${editTarget.id}`, form)
        toast.success(`${form.kode_saham} berhasil diperbarui`)
      } else {
        await axios.post(`${API_BASE}/api/perusahaan`, form)
        toast.success(`${form.kode_saham.toUpperCase()} berhasil ditambahkan`)
      }
      cancelForm(); fetchList()
    } catch (e) { toast.error(e.response?.data?.message ?? 'Gagal menyimpan') }
    finally { setSaving(false) }
  }

  async function handleDelete(id, kode) {
    try {
      await axios.delete(`${API_BASE}/api/perusahaan/${id}`)
      toast.success(`${kode} dihapus beserta seluruh data terkait`)
      setConfirmDelete(null); fetchList()
    } catch (e) { toast.error(e.response?.data?.message ?? 'Gagal menghapus') }
  }

  const filtered = list.filter(p => {
    const matchSearch = p.kode_saham.toLowerCase().includes(search.toLowerCase()) ||
      p.nama_perusahaan.toLowerCase().includes(search.toLowerCase())
    const matchSektor = !filterSektor || p.sektor === filterSektor
    return matchSearch && matchSektor
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 h-9 text-sm" placeholder="Cari kode atau nama..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input h-9 w-auto text-sm cursor-pointer" value={filterSektor}
          onChange={e => setFilterSektor(e.target.value)}>
          <option value="">Semua Sektor</option>
          {SEKTOR_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetchList} className="btn-icon" title="Refresh"><RefreshCw size={14} /></button>
        <button onClick={openAdd} className="btn-primary btn-sm gap-1.5">
          <Plus size={13} /> Tambah Emiten
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 animate-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-800">
              {editTarget ? `Edit Emiten — ${editTarget.kode_saham}` : 'Tambah Emiten Baru'}
            </p>
            <button onClick={cancelForm} className="btn-icon w-7 h-7"><X size={13} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kode Saham</label>
              <input className="input uppercase font-mono" placeholder="BBCA" maxLength={10}
                value={form.kode_saham}
                onChange={e => setForm(p => ({ ...p, kode_saham: e.target.value }))}
                disabled={!!editTarget}
              />
              {editTarget && <p className="text-[10px] text-gray-400 mt-1">Kode tidak bisa diubah</p>}
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Perusahaan</label>
              <input className="input" placeholder="PT Bank Central Asia Tbk"
                value={form.nama_perusahaan}
                onChange={e => setForm(p => ({ ...p, nama_perusahaan: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sektor</label>
              <select className="input" value={form.sektor} onChange={e => setForm(p => ({ ...p, sektor: e.target.value }))}>
                <option value="">Pilih Sektor</option>
                {SEKTOR_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={cancelForm} className="btn-outline btn-sm">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
              {saving ? <><span className="spinner spinner-sm spinner-white" /> Menyimpan...</> : <><Check size={13} /> Simpan</>}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card-lg p-0 overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th className="w-12">ID</th>
              <th>Kode</th>
              <th>Nama Perusahaan</th>
              <th>Sektor</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <TableLoader /> : filtered.length === 0 ? (
              <EmptyState message="Tidak ada perusahaan" sub={search || filterSektor ? 'Coba ubah filter' : undefined} />
            ) : filtered.map((p, i) => (
              <tr key={p.id} className="animate-in" style={{ animationDelay: `${i * 30}ms` }}>
                <td className="font-mono text-gray-400 text-xs">{p.id}</td>
                <td><span className="font-bold text-emerald-700 font-mono text-sm">{p.kode_saham}</span></td>
                <td className="text-gray-700 text-sm">{p.nama_perusahaan}</td>
                <td>
                  {p.sektor && p.sektor !== 'Belum Ditentukan'
                    ? <span className={SEKTOR_COLOR[p.sektor] ?? 'badge-gray'}>{p.sektor}</span>
                    : <span className="text-xs text-gray-300 italic">Belum ditentukan</span>
                  }
                </td>
                <td>
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(p)} className="btn-icon w-7 h-7 rounded-lg" title="Edit">
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ id: p.id, kode: p.kode_saham })}
                      className="btn-icon w-7 h-7 rounded-lg text-red-400 bg-red-50 hover:bg-red-100"
                      title="Hapus (cascade)"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">{filtered.length} dari {list.length} emiten terdaftar</p>

      {confirmDelete && (
        <ConfirmModal
          message={`Hapus emiten "${confirmDelete.kode}"? Seluruh laporan keuangan, rasio, dan peringkat emiten ini akan ikut terhapus (CASCADE).`}
          onConfirm={() => handleDelete(confirmDelete.id, confirmDelete.kode)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3 · LAPORAN KEUANGAN
══════════════════════════════════════════════════════════════ */
function TabLaporan() {
  const [list, setList] = useState([])
  const [perusahaanList, setPerusahaanList] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear())
  const [filterKode, setFilterKode] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)

  const EMPTY_FORM = {
    perusahaan_id: '', tahun: new Date().getFullYear(),
    total_aset: '', total_liabilitas: '', total_ekuitas: '',
    pendapatan: '', laba_bersih: '', arus_kas_operasi: '',
    harga_saham: '', jumlah_saham_beredar: '', dividen: '',
    status_data: 'draft',
  }
  const [form, setForm] = useState(EMPTY_FORM)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterTahun) params.set('tahun', filterTahun)
      if (filterKode)  params.set('kode', filterKode)
      if (filterStatus) params.set('status', filterStatus)
      const r = await axios.get(`${API_BASE}/api/admin/laporan?${params}`)
      setList(r.data.data ?? [])
    } catch { setList([]) }
    finally { setLoading(false) }
  }, [filterTahun, filterKode, filterStatus])

  useEffect(() => { fetchList() }, [fetchList])
  useEffect(() => {
    axios.get(`${API_BASE}/api/perusahaan`).then(r => setPerusahaanList(r.data.data ?? [])).catch(() => {})
  }, [])

  function openAdd() {
    setEditTarget(null); setForm(EMPTY_FORM); setShowForm(true)
  }
  function openEdit(lap) {
    setEditTarget(lap)
    setForm({
      perusahaan_id: lap.perusahaan_id,
      tahun: lap.tahun,
      total_aset: lap.total_aset,
      total_liabilitas: lap.total_liabilitas,
      total_ekuitas: lap.total_ekuitas,
      pendapatan: lap.pendapatan,
      laba_bersih: lap.laba_bersih,
      arus_kas_operasi: lap.arus_kas_operasi,
      harga_saham: lap.harga_saham,
      jumlah_saham_beredar: lap.jumlah_saham_beredar,
      dividen: lap.dividen,
      status_data: lap.status_data,
    })
    setShowForm(true)
  }
  function cancelForm() { setShowForm(false); setEditTarget(null) }

  const calcEkuitas = () => {
    const a = parseFloat(form.total_aset) || 0
    const l = parseFloat(form.total_liabilitas) || 0
    setForm(p => ({ ...p, total_ekuitas: (a - l).toFixed(2) }))
  }

  async function handleSave() {
    if (!form.perusahaan_id) { toast.error('Pilih perusahaan'); return }
    setSaving(true)
    try {
      const payload = { ...form }
      if (editTarget) {
        await axios.put(`${API_BASE}/api/admin/laporan/${editTarget.id}`, payload)
        toast.success('Laporan berhasil diperbarui')
      } else {
        // FIX: /api/laporan/upload-neraca butuh kode_saham (string), bukan perusahaan_id (int).
        // Cari kode_saham dari perusahaanList berdasarkan perusahaan_id yang dipilih.
        const p = perusahaanList.find(p => String(p.id) === String(form.perusahaan_id))
        if (!p) { toast.error('Perusahaan tidak ditemukan'); setSaving(false); return }
        const uploadPayload = { ...payload, kode_saham: p.kode_saham }
        delete uploadPayload.perusahaan_id
        await axios.post(`${API_BASE}/api/laporan/upload-neraca`, uploadPayload)
        toast.success('Laporan berhasil ditambahkan')
      }
      cancelForm(); fetchList()
    } catch (e) { toast.error(e.response?.data?.message ?? 'Gagal menyimpan') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`${API_BASE}/api/admin/laporan/${id}`)
      toast.success('Laporan dihapus')
      setConfirmDelete(null); fetchList()
    } catch (e) { toast.error(e.response?.data?.message ?? 'Gagal menghapus') }
  }

  async function ubahStatus(id, status) {
    try {
      await axios.put(`${API_BASE}/api/admin/laporan/${id}`, { status_data: status })
      toast.success(`Status diubah ke "${status}"`)
      fetchList()
    } catch { toast.error('Gagal mengubah status') }
  }

  const STATUS_BADGE = {
    draft: 'badge-gray',
    direview: 'badge-amber',
    dipublikasi: 'badge-green',
  }
  const STATUS_LABEL = { draft: 'Draft', direview: 'Direview', dipublikasi: 'Dipublikasi' }

  const numFld = (k, label) => (
    <div key={k}>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input type="number" className="input text-sm"
        value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select className="input h-9 w-auto text-sm cursor-pointer" value={filterTahun}
          onChange={e => setFilterTahun(+e.target.value)}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <input className="input h-9 w-28 text-sm uppercase font-mono" placeholder="Kode..."
          value={filterKode} onChange={e => setFilterKode(e.target.value.toUpperCase())} />
        <select className="input h-9 w-auto text-sm cursor-pointer" value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="direview">Direview</option>
          <option value="dipublikasi">Dipublikasi</option>
        </select>
        <button onClick={fetchList} className="btn-icon" title="Refresh"><RefreshCw size={14} /></button>
        <button onClick={openAdd} className="btn-primary btn-sm gap-1.5 ml-auto">
          <Plus size={13} /> Tambah Laporan
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 animate-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-800">
              {editTarget ? `Edit Laporan #${editTarget.id}` : 'Tambah Laporan Keuangan'}
            </p>
            <button onClick={cancelForm} className="btn-icon w-7 h-7"><X size={13} /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Perusahaan</label>
              <select className="input" value={form.perusahaan_id}
                onChange={e => setForm(p => ({ ...p, perusahaan_id: e.target.value }))}
                disabled={!!editTarget}>
                <option value="">Pilih Emiten</option>
                {perusahaanList.map(p => (
                  <option key={p.id} value={p.id}>{p.kode_saham} — {p.nama_perusahaan}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tahun</label>
              <select className="input" value={form.tahun}
                onChange={e => setForm(p => ({ ...p, tahun: +e.target.value }))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
              <select className="input" value={form.status_data}
                onChange={e => setForm(p => ({ ...p, status_data: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="direview">Direview</option>
                <option value="dipublikasi">Dipublikasi</option>
              </select>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 mb-3">
            <div className="flex items-baseline gap-2 mb-3">
              <h3 className="text-xs font-bold text-gray-700">Neraca Keuangan</h3>
              <span className="text-[10px] text-gray-400">Balance Sheet · Rp Miliar</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {numFld('total_aset', 'Total Aset')}
              {numFld('total_liabilitas', 'Total Liabilitas')}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1.5">
                  Total Ekuitas
                  <button type="button" onClick={calcEkuitas}
                    className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold hover:bg-emerald-100 transition-colors">
                    Auto
                  </button>
                </label>
                <input type="number" className="input text-sm" value={form.total_ekuitas}
                  onChange={e => setForm(p => ({ ...p, total_ekuitas: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 mb-3">
            <div className="flex items-baseline gap-2 mb-3">
              <h3 className="text-xs font-bold text-gray-700">Laba Rugi & Arus Kas</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {numFld('pendapatan', 'Pendapatan')}
              {numFld('laba_bersih', 'Laba Bersih')}
              {numFld('arus_kas_operasi', 'Arus Kas Operasi')}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {numFld('harga_saham', 'Harga Saham')}
            {numFld('jumlah_saham_beredar', 'Saham Beredar')}
            {numFld('dividen', 'Dividen')}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={cancelForm} className="btn-outline btn-sm">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
              {saving ? <><span className="spinner spinner-sm spinner-white" /> Menyimpan...</> : <><Check size={13} /> Simpan</>}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card-lg p-0 overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th className="w-10">#</th>
              <th>Emiten</th>
              <th>Tahun</th>
              <th>Total Aset</th>
              <th>Laba Bersih</th>
              <th>Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <TableLoader /> : list.length === 0 ? (
              <EmptyState message={`Tidak ada laporan tahun ${filterTahun}`} sub="Coba filter tahun lain atau tambah laporan baru" />
            ) : list.map((lap, i) => (
              <React.Fragment key={lap.id}>
                <tr className="animate-in" style={{ animationDelay: `${Math.min(i * 20, 300)}ms` }}>
                  <td className="font-mono text-xs text-gray-400">{lap.id}</td>
                  <td>
                    <span className="font-bold text-emerald-700 font-mono text-sm">{lap.kode_saham}</span>
                    <span className="block text-[10px] text-gray-400 mt-0.5 leading-tight">{lap.nama_perusahaan}</span>
                  </td>
                  <td className="font-mono font-semibold text-gray-700">{lap.tahun}</td>
                  <td className="font-mono text-sm text-gray-600">
                    {parseFloat(lap.total_aset || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                  </td>
                  <td className={`font-mono text-sm ${parseFloat(lap.laba_bersih) < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                    {parseFloat(lap.laba_bersih || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                  </td>
                  <td>
                    <div className="relative group">
                      <span className={`cursor-pointer ${STATUS_BADGE[lap.status_data] ?? 'badge-gray'}`}>
                        {STATUS_LABEL[lap.status_data] ?? lap.status_data}
                      </span>
                      {/* Quick status toggle dropdown */}
                      <div className="absolute left-0 top-full mt-1 z-20 hidden group-hover:flex flex-col gap-0.5 bg-white border border-gray-100 rounded-xl shadow-lg p-1.5 w-32">
                        {Object.entries(STATUS_LABEL).map(([key, label]) => (
                          <button key={key} onClick={() => ubahStatus(lap.id, key)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg text-left font-medium hover:bg-gray-50 transition-colors ${lap.status_data === key ? 'text-emerald-700 bg-emerald-50' : 'text-gray-600'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setExpandedRow(expandedRow === lap.id ? null : lap.id)}
                        className="btn-icon w-7 h-7 rounded-lg"
                        title="Detail"
                      >
                        {expandedRow === lap.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      <button onClick={() => openEdit(lap)} className="btn-icon w-7 h-7 rounded-lg" title="Edit">
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: lap.id })}
                        className="btn-icon w-7 h-7 rounded-lg text-red-400 bg-red-50 hover:bg-red-100"
                        title="Hapus"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === lap.id && (
                  <tr key={`exp-${lap.id}`} className="bg-gray-50/60">
                    <td colSpan={7} className="px-6 py-3">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        {[
                          ['Total Liabilitas', lap.total_liabilitas],
                          ['Total Ekuitas', lap.total_ekuitas],
                          ['Pendapatan', lap.pendapatan],
                          ['Arus Kas Operasi', lap.arus_kas_operasi],
                          ['Harga Saham', lap.harga_saham],
                          ['Saham Beredar', lap.jumlah_saham_beredar],
                          ['Dividen', lap.dividen],
                        ].map(([label, val]) => (
                          <div key={label} className="bg-white rounded-lg border border-gray-100 p-2.5">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
                            <p className="font-mono font-bold text-gray-700">
                              {parseFloat(val || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">{list.length} laporan ditampilkan</p>

      {confirmDelete && (
        <ConfirmModal
          message="Hapus laporan keuangan ini? Data rasio dan peringkat terkait mungkin terpengaruh."
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TAB 4 · DATA MASTER (Kriteria)
══════════════════════════════════════════════════════════════ */
function TabKriteria() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editVals, setEditVals] = useState({})
  const [saving, setSaving] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try { const r = await axios.get(`${API_BASE}/api/kriteria`); setList(r.data.data ?? []) }
    catch { setList([]) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchList() }, [fetchList])

  function startEdit(k) {
    setEditing(k.id)
    setEditVals({ kode: k.kode, nama_kriteria: k.nama_kriteria, atribut: k.atribut, bobot_awal: k.bobot_awal })
  }
  function cancelEdit() { setEditing(null); setEditVals({}) }

  async function saveEdit(id) {
    if (+editVals.bobot_awal <= 0) { toast.error('Bobot harus lebih dari 0'); return }
    setSaving(true)
    try {
      await axios.put(`${API_BASE}/api/kriteria/${id}`, editVals)
      toast.success('Kriteria berhasil diperbarui')
      cancelEdit(); fetchList()
    } catch { toast.error('Gagal menyimpan') }
    finally { setSaving(false) }
  }

  async function normalizeBobot() {
    try {
      await axios.post(`${API_BASE}/api/kriteria/normalize`)
      toast.success('Bobot dinormalisasi dengan metode SMART')
      fetchList()
    } catch { toast.error('Gagal normalisasi') }
  }

  const totalBobot = list.reduce((s, k) => s + +k.bobot_awal, 0)
  const isValid = Math.round(totalBobot) === 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500"><span className="font-semibold text-gray-700">{list.length}</span> kriteria aktif</p>
          <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${isValid ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
            Σ Bobot = {totalBobot.toFixed(0)}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchList} className="btn-icon" title="Refresh"><RefreshCw size={14} /></button>
          <button onClick={normalizeBobot}
            className="btn-primary btn-sm"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', boxShadow: '0 2px 8px rgb(79 70 229 / .3)' }}>
            Normalisasi SMART
          </button>
        </div>
      </div>

      {!isValid && (
        <div className="alert alert-warning animate-in">
          <span className="font-semibold">Total bobot {totalBobot.toFixed(0)}/100.</span>
          <span className="ml-1">Tekan "Normalisasi SMART" untuk menyesuaikan secara otomatis.</span>
        </div>
      )}

      <div className="card-lg p-0 overflow-hidden">
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
            {loading ? <TableLoader /> : list.map(k => (
              <tr key={k.id}>
                <td>
                  {editing === k.id ? (
                    <input className="input input-sm w-16 font-mono text-center"
                      value={editVals.kode} onChange={e => setEditVals(p => ({ ...p, kode: e.target.value }))} />
                  ) : (
                    <span className="badge-gray font-mono text-[11px]">{k.kode}</span>
                  )}
                </td>
                <td>
                  {editing === k.id ? (
                    <input className="input input-sm"
                      value={editVals.nama_kriteria} onChange={e => setEditVals(p => ({ ...p, nama_kriteria: e.target.value }))} />
                  ) : (
                    <span className="font-medium text-gray-800">{k.nama_kriteria}</span>
                  )}
                </td>
                <td>
                  {editing === k.id ? (
                    <select className="input input-sm w-24"
                      value={editVals.atribut} onChange={e => setEditVals(p => ({ ...p, atribut: e.target.value }))}>
                      <option value="benefit">benefit</option>
                      <option value="cost">cost</option>
                    </select>
                  ) : (
                    <span className={k.atribut === 'benefit' ? 'badge-green' : 'badge-red'}>{k.atribut}</span>
                  )}
                </td>
                <td>
                  {editing === k.id ? (
                    <input type="number" className="input input-sm w-20 text-center font-mono" autoFocus
                      value={editVals.bobot_awal} onChange={e => setEditVals(p => ({ ...p, bobot_awal: e.target.value }))} />
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
                      <button onClick={() => saveEdit(k.id)} disabled={saving}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                        {saving ? '...' : 'Simpan'}
                      </button>
                      <button onClick={cancelEdit} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(k)} className="btn-icon w-7 h-7 rounded-lg" title="Edit">
                      <Pencil size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
          <p className="text-xs font-bold text-emerald-700 mb-1.5">Atribut Benefit</p>
          <p className="text-xs text-gray-500 font-mono leading-relaxed">Nilai makin tinggi = makin baik.<br />r_ij = x_ij / max(x_j)</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4">
          <p className="text-xs font-bold text-rose-700 mb-1.5">Atribut Cost</p>
          <p className="text-xs text-gray-500 font-mono leading-relaxed">Nilai makin rendah = makin baik.<br />r_ij = min(x_j) / x_ij</p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'users',      icon: Users,     label: 'Manajemen User',       desc: 'Kelola akun & role' },
  { id: 'perusahaan', icon: Building2, label: 'Emiten',                desc: 'CRUD daftar emiten' },
  { id: 'laporan',    icon: FileText,  label: 'Laporan Keuangan',     desc: 'Data finansial per tahun' },
  { id: 'kriteria',   icon: Database,  label: 'Kriteria & Bobot',     desc: 'Konfigurasi SMART/SAW' },
]

export default function AdminPanel() {
  const [tab, setTab] = useState('users')
  const active = TABS.find(t => t.id === tab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
              <Shield size={14} className="text-violet-600" />
            </div>
            <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Administrator</span>
          </div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">
            {active?.desc} · Akses penuh ke seluruh data sistem
          </p>
        </div>
        {/* Warning badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold flex-shrink-0">
          <AlertTriangle size={12} />
          Area Admin
        </div>
      </div>

      {/* Tab Bar — card style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`group flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-150 ${
              tab === t.id
                ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-gray-50/50'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              tab === t.id ? 'bg-emerald-600' : 'bg-gray-100 group-hover:bg-emerald-50'
            }`}>
              <t.icon size={15} className={tab === t.id ? 'text-white' : 'text-gray-500 group-hover:text-emerald-600'} />
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-bold truncate ${tab === t.id ? 'text-emerald-700' : 'text-gray-700'}`}>
                {t.label}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {tab === 'users'      && <TabUsers />}
        {tab === 'perusahaan' && <TabPerusahaan />}
        {tab === 'laporan'    && <TabLaporan />}
        {tab === 'kriteria'   && <TabKriteria />}
      </div>
    </div>
  )
}