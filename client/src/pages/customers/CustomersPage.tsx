import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomersApi, createCustomerApi, updateCustomerApi } from '../../api/customers';
import type { Customer, CustomerQuery, CustomerType, CustomerStatus, CustomerListResponse } from '../../api/customers';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [query, setQuery] = useState<CustomerQuery>({ page: 1, limit: 10, search: '', status: '', customerType: '' });
  const [meta, setMeta] = useState<CustomerListResponse['meta']>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomersApi(query);
      setCustomers(data.customers);
      setMeta(data.meta);
      setError('');
    } catch (err: any) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuery(prev => ({ ...prev, status: e.target.value as any, page: 1 }));
  };
  
  const handleTypeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuery(prev => ({ ...prev, customerType: e.target.value as any, page: 1 }));
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingCustomer) {
        await updateCustomerApi(editingCustomer.id, data);
      } else {
        await createCustomerApi(data);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving customer');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Customers</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Manage your CRM contacts and leads</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>+ Add Customer</button>
      </div>

      {error && <div style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>{error}</div>}

      <div className="card">
        <div className="card-header" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, business, mobile..."
            style={{ maxWidth: '300px' }}
            value={query.search || ''}
            onChange={handleSearchChange}
          />
          <select className="form-input" style={{ width: 'auto' }} value={query.status || ''} onChange={handleStatusFilter}>
            <option value="">All Statuses</option>
            <option value="Lead">Lead</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select className="form-input" style={{ width: 'auto' }} value={query.customerType || ''} onChange={handleTypeFilter}>
            <option value="">All Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Distributor">Distributor</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Business</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Contact</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Type</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center' }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }}/></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No customers found</td></tr>
              ) : (
                customers.map(c => (
                  <tr 
                    key={c.id} 
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{c.businessName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{c.name}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.875rem' }}>
                      <div>{c.mobile}</div>
                      <div style={{ color: 'var(--color-text-secondary)' }}>{c.email}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className="badge" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>{c.customerType}</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge badge-${c.status === 'Active' ? 'success' : c.status === 'Lead' ? 'info' : 'danger'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => openEditModal(c, e)}>Edit</button>
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
              onClick={() => setQuery(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
            >Previous</button>
            <button 
              className="btn btn-secondary btn-sm" 
              disabled={meta.page >= meta.totalPages}
              onClick={() => setQuery(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
            >Next</button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CustomerModal 
          customer={editingCustomer} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}

function CustomerModal({ customer, onClose, onSave }: { customer: Customer | null, onClose: () => void, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    mobile: customer?.mobile || '',
    email: customer?.email || '',
    businessName: customer?.businessName || '',
    gstNumber: customer?.gstNumber || '',
    customerType: customer?.customerType || 'Retail',
    address: customer?.address || '',
    status: customer?.status || 'Lead',
    notes: customer?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>{customer ? 'Edit Customer' : 'Add New Customer'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Contact Name *</label>
              <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Business Name *</label>
              <input required className="form-input" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile *</label>
              <input required className="form-input" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input required type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Type *</label>
              <select className="form-input" value={formData.customerType} onChange={e => setFormData({...formData, customerType: e.target.value as CustomerType})}>
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Distributor">Distributor</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as CustomerStatus})}>
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">GST Number</label>
              <input className="form-input" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Address *</label>
              <textarea required className="form-input" rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Customer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
