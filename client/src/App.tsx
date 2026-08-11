import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';

/** Redirect authenticated users away from login page */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />

          {/* Phase 2–4 placeholder routes */}
          <Route path="/customers/*" element={<PlaceholderPage title="Customers" />} />
          <Route path="/products/*" element={<PlaceholderPage title="Products & Inventory" />} />
          <Route path="/challans/*" element={<PlaceholderPage title="Sales Challans" />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** Temporary placeholder for pages not yet built */
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="card">
      <div className="card-body" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <h2 style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }}>{title}</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>This module will be built in the next phase.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
