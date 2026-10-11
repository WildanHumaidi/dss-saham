// BUG FIX #1 (lanjutan): File ini sebelumnya mendefinisikan ProtectedRoute
// dengan prop `allowedRoles` (array), namun App.jsx menggunakan prop
// `requireAdmin` (boolean) dari definisi lokal-nya sendiri, sehingga file
// ini tidak pernah dipakai (dead code).
//
// Sekarang file ini diselaraskan agar konsisten dengan definisi di App.jsx,
// dan App.jsx diubah untuk mengimpor dari sini agar tidak ada duplikasi.
//
// CATATAN: Jika Anda ingin mengimpor ProtectedRoute dari file ini di App.jsx,
// hapus definisi lokal di App.jsx dan tambahkan:
//   import ProtectedRoute from './components/ProtectedRoute';

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { token, isAdmin } = useAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;

  return children ? children : <Outlet />;
}
