import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStatsApi, type DashboardStats } from '../../api/dashboard';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStatsApi();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const showCustomers = user?.role === 'Admin' || user?.role === 'Sales';
  const showProducts = user?.role === 'Admin' || user?.role === 'Warehouse';
  const showChallans = user?.role === 'Admin' || user?.role === 'Sales' || user?.role === 'Accounts';

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Here's what's happening in your operations today.
        </p>
      </div>

      {loading ? (
        <div className="page-loading">
          <div className="spinner spinner-dark" />
        </div>
      ) : (
        <>
          <div className="dashboard-grid">
            {showCustomers && (
              <div className="stat-card">
                <div
                  className="stat-card-icon"
                  style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  👥
                </div>
                <div className="stat-card-content">
                  <h3>Total Customers</h3>
                  <div className="stat-value">{stats?.totalCustomers ?? '—'}</div>
                </div>
              </div>
            )}

            {showProducts && (
              <>
                <div className="stat-card">
                  <div
                    className="stat-card-icon"
                    style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}
                  >
                    📦
                  </div>
                  <div className="stat-card-content">
                    <h3>Total Products</h3>
                    <div className="stat-value">{stats?.totalProducts ?? '—'}</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div
                    className="stat-card-icon"
                    style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}
                  >
                    ⚠️
                  </div>
                  <div className="stat-card-content">
                    <h3>Low Stock Alerts</h3>
                    <div className="stat-value" style={{ color: (stats?.lowStockAlerts || 0) > 0 ? 'var(--color-danger)' : 'inherit' }}>
                      {stats?.lowStockAlerts ?? '—'}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {showChallans && stats?.recentChallans && (
            <div className="card" style={{ marginTop: '24px' }}>
              <div className="card-header">
                <h3>Recent Challans</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Challan No</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Customer</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Items</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Date</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentChallans.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                          No recent challans found.
                        </td>
                      </tr>
                    ) : (
                      stats.recentChallans.map((challan) => (
                        <tr key={challan.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '14px 24px', fontFamily: 'monospace', fontWeight: 500 }}>
                            <Link to={`/challans/${challan.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                              {challan.challanNumber}
                            </Link>
                          </td>
                          <td style={{ padding: '14px 24px' }}>{challan.customer.businessName}</td>
                          <td style={{ padding: '14px 24px' }}>{challan._count.items} items</td>
                          <td style={{ padding: '14px 24px', color: 'var(--color-text-secondary)' }}>
                            {new Date(challan.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '14px 24px' }}>
                            <span className={`badge badge-${challan.status === 'Draft' ? 'warning' : challan.status === 'Confirmed' ? 'success' : 'danger'}`}>
                              {challan.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
