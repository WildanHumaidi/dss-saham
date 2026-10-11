import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Lock, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Selamat datang kembali!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Kredensial tidak valid. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f7f9f8' }}>
      {/* ── Left Panel (hidden on mobile) ── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #061a0f 0%, #0a2718 50%, #0d3320 100%)' }}
      >
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-[-120px] right-[-120px] w-[480px] h-[480px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)' }}
          />
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#6ee7b7 1px, transparent 1px), linear-gradient(90deg, #6ee7b7 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                boxShadow: '0 4px 12px rgb(16 185 129 / .3)',
              }}
            >
              <TrendingUp className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-white text-base tracking-tight">DSS Saham</span>
          </div>

          {/* Hero text */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-700/50 bg-emerald-900/30 text-emerald-400 text-[11px] font-semibold tracking-wider uppercase">
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                style={{ animation: 'pulse 2s infinite' }}
              />
              Platform Pemeringkat BEI
            </div>
            <h2
              className="text-4xl font-extrabold text-white leading-tight"
              style={{ letterSpacing: '-0.03em' }}
            >
              Investasi Cerdas
              <br />
              Dimulai dari
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #34d399 0%, #6ee7b7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Data yang Benar.
              </span>
            </h2>
            <p className="text-emerald-200/60 text-sm leading-relaxed max-w-xs">
              Analisis fundamental 39 emiten blue-chip dengan metode SMART & SAW selama 15 tahun
              historis.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { v: '39', l: 'Emiten' },
              { v: '15+', l: 'Tahun Data' },
              { v: 'SMART', l: 'Metode' },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-xl p-3 border border-emerald-800/60"
                style={{ background: 'rgb(255 255 255 / .03)' }}
              >
                <div className="text-lg font-extrabold text-white">{s.v}</div>
                <div className="text-[11px] text-emerald-400/70 font-medium mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel (Login Form) ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        {/* Back link (mobile only) */}
        <Link
          to="/"
          className="lg:hidden flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-8 self-start transition-colors"
        >
          <ArrowLeft size={14} /> Kembali
        </Link>

        <div className="w-full max-w-sm animate-in">
          {/* Logo (mobile) */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
            >
              <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base text-gray-900">DSS Saham</span>
          </div>

          <div className="mb-8">
            <h1
              className="text-2xl font-extrabold text-gray-900 tracking-tight"
              style={{ letterSpacing: '-0.025em' }}
            >
              Selamat Datang
            </h1>
            <p className="text-gray-500 text-sm mt-1.5">Masuk untuk mengakses dashboard analitik</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10 w-full"
                  placeholder="admin@dssaham.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  required
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10 w-full"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2 text-sm"
              style={{ borderRadius: '.75rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm spinner-white" /> Memverifikasi...
                </>
              ) : (
                'Masuk ke Dashboard'
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/60">
            <p className="text-[11px] text-gray-500 font-medium mb-2">Akun Demo Tersedia:</p>
            <div className="space-y-1">
              <p className="text-[11px] text-gray-600 font-mono">
                admin@dssaham.com → <span className="text-emerald-700 font-semibold">Admin</span>
              </p>
              <p className="text-[11px] text-gray-600 font-mono">
                user@dssaham.com → <span className="text-sky-700 font-semibold">Analyst</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Password: <span className="font-mono">password123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
