import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductsApi, createProductApi, updateProductApi, type Product, type ProductQuery, type ProductListResponse } from '../../api/products';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [query, setQuery] = useState<ProductQuery>({ page: 1, limit: 10, search: '', category: '', stockStatus: '' });
  const [meta, setMeta] = useState<ProductListResponse['meta']>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProductsApi(query);
      setProducts(data.products);
      setMeta(data.meta);
      setError('');
    } catch (err: any) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuery(prev => ({ ...prev, stockStatus: e.target.value as any, page: 1 }));
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingProduct) {
        await updateProductApi(editingProduct.id, data);
      } else {
        await createProductApi(data);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving product');
    }
  };

  const getStockBadge = (current: number, min: number) => {
    if (current === 0) return <span className="badge badge-danger">Out of Stock</span>;
    if (current > 0 && current <= min) return <span className="badge badge-warning">Low Stock</span>;
    return <span className="badge badge-success">In Stock</span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Products & Inventory</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Manage your product catalog and stock levels</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>+ Add Product</button>
      </div>

      {error && <div style={{ color: 'var(--color-danger)', marginBottom: '16px' }}>{error}</div>}

      <div className="card">
        <div className="card-header" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, SKU..."
            style={{ maxWidth: '300px' }}
            value={query.search || ''}
            onChange={handleSearchChange}
          />
          <select className="form-input" style={{ width: 'auto' }} value={query.stockStatus || ''} onChange={handleStatusFilter}>
            <option value="">All Stock Statuses</option>
            <option value="InStock">In Stock</option>
            <option value="LowStock">Low Stock</option>
            <option value="OutOfStock">Out of Stock</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Product</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Category</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Price</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Stock</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ padding: '12px 24px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center' }}><div className="spinner spinner-dark" style={{ margin: '0 auto' }}/></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No products found</td></tr>
              ) : (
                products.map(p => (
                  <tr 
                    key={p.id} 
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                    onClick={() => navigate(`/products/${p.id}`)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--color-text)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{p.sku}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className="badge" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>{p.category}</span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.875rem' }}>
                      ${Number(p.unitPrice).toFixed(2)}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 600 }}>{p.currentStock}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Min: {p.minStockAlert}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {getStockBadge(p.currentStock, p.minStockAlert)}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={(e) => openEditModal(p, e)}>Edit</button>
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
        <ProductModal 
          product={editingProduct} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose, onSave }: { product: Product | null, onClose: () => void, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || '',
    unitPrice: product?.unitPrice || '',
    minStockAlert: product?.minStockAlert || 0,
    warehouseLocation: product?.warehouseLocation || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="card-body">
          {!product && (
            <div style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-hover)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.875rem' }}>
              <strong>Note:</strong> Initial stock will be set to 0. You can add stock via an "IN" movement after creating the product.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Product Name *</label>
              <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">SKU (Unique Code) *</label>
              <input required className="form-input" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <input required className="form-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price ($) *</label>
              <input required type="number" step="0.01" min="0" className="form-input" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Min Stock Alert *</label>
              <input required type="number" min="0" className="form-input" value={formData.minStockAlert} onChange={e => setFormData({...formData, minStockAlert: Number(e.target.value)})} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Warehouse Location *</label>
              <input required className="form-input" placeholder="e.g. Aisle 4, Shelf B" value={formData.warehouseLocation} onChange={e => setFormData({...formData, warehouseLocation: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
}
