import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// FIX: 'Login' → 'login' (case-sensitive di Linux/production)
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Peringkat from './pages/Peringkat';
import Analitik from './pages/Analitik';
import Sensitivity from './pages/Sensitivity';
import InputData from './pages/InputData';
import DataMaster from './pages/DataMaster';
import AdminPanel from './pages/AdminPanel';
import MainLayout from './components/MainLayout';

// FIX: Import dari file terpisah agar tidak ada dua definisi ProtectedRoute
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      <Route element={<MainLayout />}>
        {/* Halaman publik — tidak butuh login */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/peringkat" element={<Peringkat />} />

        {/* Halaman yang butuh login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/analitik" element={<Analitik />} />
          <Route path="/sensitivity" element={<Sensitivity />} />
          <Route path="/input-data" element={<InputData />} />

          {/* Halaman khusus admin */}
          <Route
            path="/data-master"
            element={
              <ProtectedRoute requireAdmin>
                <DataMaster />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
