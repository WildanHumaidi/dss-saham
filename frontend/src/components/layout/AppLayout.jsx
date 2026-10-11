import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, BarChart3, Sliders,
  Upload, Database, Download, ChevronLeft, ChevronRight,
  Bell, Search, User, Menu, X,
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'           },
  { to: '/peringkat',   icon: TrendingUp,       label: 'Peringkat Saham'    },
  { to: '/analitik',    icon: BarChart3,        label: 'Analitik'           },
  { to: '/sensitivity', icon: Sliders,          label: 'Sensitivity'        },
  { to: '/input-data',  icon: Upload,           label: 'Input Data'         },
  { to: '/data-master', icon: Database,         label: 'Data Master'        },
]

/* ── Sidebar ── */
function Sidebar({ collapsed, onToggle, mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        style={{ backgroundColor: '#0d2818' }}
        className={clsx(
          'fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-200',
          'lg:relative lg:translate-x-0',
          collapsed ? 'w-[68px]' : 'w-56',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div
          style={{ borderColor: '#163321' }}
          className="flex items-center gap-3 px-4 h-[60px] border-b flex-shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div>
              <div className="text-white font-bold text-sm leading-tight">DSS Saham</div>
              <div style={{ color: '#7ab898' }} className="text-[10px]">Analyst Terminal</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                  isActive
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-white/8'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={clsx('w-4.5 h-4.5 flex-shrink-0', isActive ? 'text-[#0d2818]' : 'text-[#7ab898] group-hover:text-[#b8d9c8]')}
                    strokeWidth={isActive ? 2.2 : 1.75}
                  />
                  {!collapsed && (
                    <span className={clsx('text-sm font-medium', isActive ? 'text-[#0d2818]' : 'text-[#7ab898] group-hover:text-[#b8d9c8]')}>
                      {label}
                    </span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg
                                    opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Export CSV button */}
        {!collapsed && (
          <div className="flex-shrink-0 px-3 pb-3">
            <button
              style={{ backgroundColor: '#163321', color: '#7ab898' }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-white/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        )}

        {/* User profile */}
        <div style={{ borderColor: '#163321' }} className="flex-shrink-0 border-t px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
              UP
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-medium truncate">User Profile</div>
                <div style={{ color: '#7ab898' }} className="text-[10px]">Premium Access</div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <div style={{ borderColor: '#163321' }} className="hidden lg:block border-t px-2 py-2">
          <button
            onClick={onToggle}
            style={{ color: '#7ab898' }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-white/8 transition-colors text-xs"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Ciutkan</span></>}
          </button>
        </div>
      </aside>
    </>
  )
}

/* ── Top bar ── */
function TopBar({ onMenuToggle, mobileOpen }) {
  const location = useLocation()
  const active = NAV.find(n => location.pathname.startsWith(n.to))

  return (
    <header className="h-[60px] bg-white border-b border-gray-200 flex items-center px-5 gap-4 flex-shrink-0">
      <button onClick={onMenuToggle} className="lg:hidden btn-ghost p-2 -ml-1">
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div className="flex-1">
        <span className="font-semibold text-gray-900 text-sm">{active?.label ?? 'Dashboard'}</span>
        <span className="ml-3 text-xs text-gray-400 hidden sm:inline">DSS Pemeringkatan Saham Blue Chip · IDX</span>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 w-48">
        <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <input className="bg-transparent text-sm placeholder-gray-400 outline-none flex-1 min-w-0" placeholder="Cari saham..." />
      </div>

      {/* Tahun buku selector */}
      <div className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 bg-white cursor-pointer hover:bg-gray-50">
        <span className="text-xs text-gray-500">Tahun Buku:</span>
        <select className="bg-transparent outline-none text-sm font-medium text-gray-900 cursor-pointer">
          {['2025','2024','2023','2022','2021'].map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      <button className="btn-ghost p-2 relative">
        <Bell className="w-4.5 h-4.5" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-500 rounded-full" />
      </button>

      <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
        UP
      </div>
    </header>
  )
}

/* ── Main Layout ── */
export default function AppLayout() {
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMenuToggle={() => setMobileOpen(o => !o)} mobileOpen={mobileOpen} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          <div className="animate-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}