import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Sliders,
  UploadCloud,
  Database,
  LogOut,
  LogIn,
  Lock,
  ShieldCheck,
} from 'lucide-react';

export default function MainLayout() {
  const { user, token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const publicMenus = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/peringkat', icon: TrendingUp, label: 'Peringkat Saham' },
  ];

  const privateMenus = [
    { path: '/analitik', icon: BarChart3, label: 'Analitik' },
    { path: '/sensitivity', icon: Sliders, label: 'Sensitivity' },
    { path: '/input-data', icon: UploadCloud, label: 'Input Data' },
    { path: '/data-master', icon: Database, label: 'Data Master', adminOnly: true },
  ];

  const adminMenus = [{ path: '/admin', icon: ShieldCheck, label: 'Admin Panel' }];

  const navClass = ({ isActive }) =>
    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-brand-800 text-green-400 shadow-inner'
        : 'text-brand-200 hover:bg-brand-800/50 hover:text-white'
    }`;

  return (
    <div className="flex h-screen bg-gray-50/50 font-sans">
      <aside className="w-64 bg-brand-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-brand-800">
          <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center font-bold text-white shadow-lg">
            DSS
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide">DSS Saham</h1>
            <p className="text-[10px] text-brand-300">
              {isAdmin ? 'Administrator Terminal' : 'Analyst Terminal'}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {/* Public */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">
              Public View
            </p>
            {publicMenus.map((item) => (
              <NavLink key={item.path} to={item.path} className={navClass}>
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.label}
                </div>
              </NavLink>
            ))}
          </div>

          {/* Analyst Tools */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">
              Analyst Tools
            </p>
            {privateMenus.map((item) => {
              if (item.adminOnly && token && !isAdmin) return null;
              return (
                <NavLink key={item.path} to={item.path} className={navClass}>
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className={!token ? 'opacity-60' : ''} />
                    <span className={!token ? 'opacity-80' : ''}>{item.label}</span>
                  </div>
                  {!token && <Lock size={14} className="text-brand-400/50 flex-shrink-0" />}
                </NavLink>
              );
            })}
          </div>

          {/* Admin Section — hanya tampil jika admin */}
          {isAdmin && (
            <div className="space-y-1.5">
              <p className="px-3 text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-2">
                Administrator
              </p>
              {adminMenus.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-violet-900/60 text-violet-300 shadow-inner'
                        : 'text-violet-300/70 hover:bg-violet-900/30 hover:text-violet-200'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-brand-800">
          {token ? (
            <div className="flex items-center justify-between bg-brand-800/50 p-3 rounded-xl border border-brand-700/50">
              <div>
                <p className="text-xs font-bold text-white truncate max-w-[120px]">
                  {user?.name || 'User'}
                </p>
                <p
                  className={`text-[10px] uppercase font-semibold ${isAdmin ? 'text-violet-400' : 'text-brand-300'}`}
                >
                  {user?.role || 'Guest'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-brand-300 hover:text-red-400 transition-colors p-1"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white p-3 rounded-xl text-sm font-bold transition-colors"
            >
              <LogIn size={16} />
              Log In Analyst
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
