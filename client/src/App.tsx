import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivateRoute, RoleRoute } from './components/PrivateRoute';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import ProductsPage from './pages/products/ProductsPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import ChallansPage from './pages/challans/ChallansPage';
import CreateChallanPage from './pages/challans/CreateChallanPage';
import ChallanDetailPage from './pages/challans/ChallanDetailPage';

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

          {/* Customer CRM Module - Phase 2 */}
          <Route path="/customers" element={<RoleRoute allowedRoles={['Admin', 'Sales']} />}>
            <Route index element={<CustomersPage />} />
            <Route path=":id" element={<CustomerDetailPage />} />
          </Route>

          {/* Inventory Module - Phase 3 */}
          <Route path="/products" element={<RoleRoute allowedRoles={['Admin', 'Warehouse']} />}>
            <Route index element={<ProductsPage />} />
            <Route path=":id" element={<ProductDetailPage />} />
          </Route>

          {/* Sales Challan Module - Phase 4 */}
          <Route path="/challans" element={<RoleRoute allowedRoles={['Admin', 'Sales', 'Accounts']} />}>
            <Route index element={<ChallansPage />} />
            <Route path=":id" element={<ChallanDetailPage />} />
          </Route>
          <Route path="/challans/new" element={<RoleRoute allowedRoles={['Admin', 'Sales']} />}>
            <Route index element={<CreateChallanPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
