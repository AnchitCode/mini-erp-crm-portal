import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChallansApi, type ChallanSummary, type ChallanQuery, type ChallanStatus, type ChallanListResponse } from '../../api/challans';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS: Record<ChallanStatus, string> = {
  Draft: 'badge-warning',
  Confirmed: 'badge-success',
  Cancelled: 'badge-danger',
};

export default function ChallansPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [challans, setChallans] = useState<ChallanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState<ChallanQuery>({ page: 1, limit: 10, status: '', search: '' });
  const [meta, setMeta] = useState<ChallanListResponse['meta']>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const canManageChallans = user?.role === 'Admin' || user?.role === 'Sales';

  const fetchChallans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getChallansApi(query);
      setChallans(data.challans);
      setMeta(data.meta);
      setError('');
    } catch {
      setError('Failed to load challans');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Sales Challans</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Create, confirm, and manage delivery challans
          </p>
        </div>
        {canManageChallans && (
          <button className="btn btn-primary" onClick={() => navigate('/challans/new')}>
            + Create Challan
          </button>
        )}
      </div>

      {error && <div style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>{error}</div>}

      <div className="card">
        <div className="card-header" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search challan number, customer..."
            style={{ maxWidth: '300px' }}
            value={query.search || ''}
            onChange={(e) => setQuery((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
          />
          <select
            className="form-input"
            style={{ width: 'auto' }}
            value={query.status || ''}
            onChange={(e) => setQuery((prev) => ({ ...prev, status: e.target.value as ChallanStatus | '', page: 1 }))}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Challan #</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Customer</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Items</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Total Qty</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center' }}>
                    <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No challans found
                  </td>
                </tr>
              ) : (
                challans.map((ch) => (
                  <tr
                    key={ch.id}
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                    onClick={() => navigate(`/challans/${ch.id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '16px 24px', fontWeight: 600, fontFamily: 'monospace' }}>{ch.challanNumber}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 500 }}>{ch.customer.businessName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{ch.customer.name}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>{ch._count.items}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{ch.totalQuantity}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge ${STATUS_COLORS[ch.status]}`}>{ch.status}</span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Showing page {meta.page} of {meta.totalPages} ({meta.total} total)
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={meta.page <= 1}
              onClick={() => setQuery((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setQuery((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
