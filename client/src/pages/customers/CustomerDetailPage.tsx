import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomerByIdApi, addFollowUpNoteApi, type CustomerDetail } from '../../api/customers';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [note, setNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadCustomer(id);
    }
  }, [id]);

  const loadCustomer = async (customerId: string) => {
    try {
      setLoading(true);
      const data = await getCustomerByIdApi(customerId);
      setCustomer(data);
      setError('');
    } catch (err) {
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !note.trim()) return;
    
    try {
      setNoteLoading(true);
      await addFollowUpNoteApi(id, note);
      setNote('');
      await loadCustomer(id); // reload to get new note
    } catch (err) {
      alert((err as any).response?.data?.message || 'Error saving note');
    } finally {
      setNoteLoading(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner spinner-dark" /></div>;
  if (error || !customer) return <div style={{ color: 'var(--color-danger)' }}>{error || 'Customer not found'}</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/customers')} style={{ marginBottom: '16px' }}>
        &larr; Back to Customers
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>
        {/* Left Column: Details & Challans */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
                  {customer.businessName}
                </h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className={`badge badge-${customer.status === 'Active' ? 'success' : customer.status === 'Lead' ? 'info' : 'danger'}`}>
                    {customer.status}
                  </span>
                  <span className="badge" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                    {customer.customerType}
                  </span>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Primary Contact</div>
                  <div style={{ fontWeight: 500 }}>{customer.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Contact Details</div>
                  <div>{customer.mobile}</div>
                  <div>{customer.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>GST Number</div>
                  <div>{customer.gstNumber || <span style={{ color: 'var(--color-text-muted)' }}>Not provided</span>}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Address</div>
                  <div style={{ whiteSpace: 'pre-line' }}>{customer.address}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Recent Challans</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {customer.challans.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No challans found for this customer.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Challan #</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Date</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Status</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.challans.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 24px', fontWeight: 500, color: 'var(--color-primary)' }}>{c.challanNumber}</td>
                        <td style={{ padding: '12px 24px', fontSize: '0.875rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 24px' }}>
                          <span className={`badge badge-${c.status === 'Confirmed' ? 'success' : c.status === 'Draft' ? 'warning' : 'danger'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 24px', fontSize: '0.875rem' }}>{c.totalQuantity} items</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: CRM Timeline */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <h3>Follow-up Timeline</h3>
          </div>
          <div className="card-body">
            
            <form onSubmit={handleAddNote} style={{ marginBottom: '24px' }}>
              <div className="form-group">
                <textarea 
                  className="form-input" 
                  rows={3} 
                  placeholder="Add a new follow-up note..." 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={noteLoading || !note.trim()}>
                {noteLoading ? 'Adding...' : 'Add Note'}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {customer.followUpNotes.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: '20px 0' }}>
                  No follow-up notes yet.
                </div>
              ) : (
                customer.followUpNotes.map(n => (
                  <div key={n.id} style={{ 
                    padding: '16px', 
                    backgroundColor: 'var(--color-surface-hover)', 
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '3px solid var(--color-primary)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{n.createdBy.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
                      {n.note}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
