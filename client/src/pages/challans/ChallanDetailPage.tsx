import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChallanByIdApi, confirmChallanApi, cancelChallanApi, type ChallanDetail, type ChallanStatus } from '../../api/challans';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS: Record<ChallanStatus, string> = {
  Draft: 'badge-warning',
  Confirmed: 'badge-success',
  Cancelled: 'badge-danger',
};

export default function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [challan, setChallan] = useState<ChallanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'confirm' | 'cancel' | null>(null);
  const canManageChallans = user?.role === 'Admin' || user?.role === 'Sales';

  useEffect(() => {
    if (id) loadChallan(id);
  }, [id]);

  const loadChallan = async (challanId: string) => {
    try {
      setLoading(true);
      const data = await getChallanByIdApi(challanId);
      setChallan(data);
      setError('');
    } catch {
      setError('Failed to load challan details.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClick = () => setConfirmAction('confirm');
  const handleCancelClick = () => setConfirmAction('cancel');

  const executeConfirm = async () => {
    if (!id || !challan) return;
    try {
      setActionLoading(true);
      setError('');
      const updated = await confirmChallanApi(id);
      setChallan(updated);
      setConfirmAction(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to confirm challan.');
      setConfirmAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  const executeCancel = async () => {
    if (!id || !challan) return;
    try {
      setActionLoading(true);
      setError('');
      const updated = await cancelChallanApi(id);
      setChallan(updated);
      setConfirmAction(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to cancel challan.');
      setConfirmAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  if (error && !challan) {
    return <div style={{ color: 'var(--color-danger)' }}>{error}</div>;
  }

  if (!challan) {
    return <div style={{ color: 'var(--color-text-muted)' }}>Challan not found.</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/challans')} style={{ marginBottom: '16px' }}>
        &larr; Back to Challans
      </button>

      {error && (
        <div
          style={{
            color: 'var(--color-danger)',
            backgroundColor: 'rgba(239,68,68,0.08)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap',
          }}
        >
          {error}
        </div>
      )}

      {/* Header Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, fontFamily: 'monospace' }}>{challan.challanNumber}</h1>
            <span className={`badge ${STATUS_COLORS[challan.status]}`} style={{ marginTop: '4px' }}>
              {challan.status}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {canManageChallans && challan.status === 'Draft' && (
              <>
                <button className="btn btn-primary" onClick={handleConfirmClick} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : '✓ Confirm Challan'}
                </button>
                <button className="btn btn-danger" onClick={handleCancelClick} disabled={actionLoading}>
                  Cancel
                </button>
              </>
            )}
            {canManageChallans && challan.status === 'Confirmed' && (
              <button className="btn btn-danger" onClick={handleCancelClick} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Cancel & Restore Stock'}
              </button>
            )}
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Customer
              </div>
              <div style={{ fontWeight: 500 }}>{challan.customer.businessName}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{challan.customer.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Created By
              </div>
              <div>{challan.createdBy.name} ({challan.createdBy.role})</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                {new Date(challan.createdAt).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Total Quantity
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{challan.totalQuantity}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="card">
        <div className="card-header">
          <h3>Line Items ({challan.items.length})</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Product</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>SKU (Snapshot)</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Unit Price (Snapshot)</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Quantity</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 24px', fontWeight: 500 }}>{item.productNameSnapshot}</td>
                  <td style={{ padding: '14px 24px', fontFamily: 'monospace' }}>{item.productSkuSnapshot}</td>
                  <td style={{ padding: '14px 24px' }}>${Number(item.unitPriceSnapshot).toFixed(2)}</td>
                  <td style={{ padding: '14px 24px', fontWeight: 600 }}>{item.quantity}</td>
                  <td style={{ padding: '14px 24px', fontWeight: 600 }}>
                    ${(Number(item.unitPriceSnapshot) * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                <td colSpan={3} style={{ padding: '14px 24px', fontWeight: 600, textAlign: 'right' }}>Grand Total:</td>
                <td style={{ padding: '14px 24px', fontWeight: 700 }}>{challan.totalQuantity}</td>
                <td style={{ padding: '14px 24px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  ${challan.items.reduce((sum, item) => sum + Number(item.unitPriceSnapshot) * item.quantity, 0).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Customer Info */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3>Customer Details</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Business Name
              </div>
              <div>{challan.customer.businessName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Contact
              </div>
              <div>{challan.customer.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Phone / Email
              </div>
              <div>{challan.customer.mobile} | {challan.customer.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Address
              </div>
              <div>{challan.customer.address}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)'
          }}
          onClick={() => !actionLoading && setConfirmAction(null)}
        >
          <div 
            className="card" 
            style={{ width: '100%', maxWidth: '400px', padding: '24px', boxShadow: 'var(--shadow-xl)', animation: 'slideIn 0.2s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: confirmAction === 'cancel' ? 'var(--color-danger)' : 'var(--color-text)' }}>
              {confirmAction === 'confirm' ? 'Confirm Challan' : 'Cancel Challan'}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
              {confirmAction === 'confirm'
                ? `Are you sure you want to confirm challan ${challan.challanNumber}? This will irrevocably deduct stock for all items.`
                : challan.status === 'Confirmed'
                ? `Are you sure you want to cancel challan ${challan.challanNumber}? Stock will be restored for all items.`
                : `Are you sure you want to cancel challan ${challan.challanNumber}?`}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmAction(null)} disabled={actionLoading}>
                Nevermind
              </button>
              <button
                className={`btn ${confirmAction === 'confirm' ? 'btn-primary' : 'btn-danger'}`}
                onClick={confirmAction === 'confirm' ? executeConfirm : executeCancel}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Yes, Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
