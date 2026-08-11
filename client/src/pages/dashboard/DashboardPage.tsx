import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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

      <div className="dashboard-grid">
        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            👥
          </div>
          <div className="stat-card-content">
            <h3>Total Customers</h3>
            <div className="stat-value">—</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}
          >
            📦
          </div>
          <div className="stat-card-content">
            <h3>Products</h3>
            <div className="stat-value">—</div>
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
            <div className="stat-value">—</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-card-icon"
            style={{ background: 'var(--color-info-light)', color: 'var(--color-info)' }}
          >
            📋
          </div>
          <div className="stat-card-content">
            <h3>Challans Today</h3>
            <div className="stat-value">—</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Quick Overview</h3>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Dashboard statistics will be populated as modules are built. Use the sidebar to navigate
            to different sections.
          </p>
        </div>
      </div>
    </div>
  );
}
