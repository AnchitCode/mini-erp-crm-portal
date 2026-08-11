import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductByIdApi, addStockMovementApi, type ProductDetail, type MovementType } from '../../api/products';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [movementType, setMovementType] = useState<MovementType>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [moveLoading, setMoveLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      const data = await getProductByIdApi(productId);
      setProduct(data);
      setError('');
    } catch (err: any) {
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    try {
      setMoveLoading(true);
      await addStockMovementApi(id, {
        movementType,
        quantity: Number(quantity),
        reason
      });
      // Reset form
      setQuantity('');
      setReason('');
      setMovementType('IN');
      // Reload product to get updated stock and timeline
      await loadProduct(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record stock movement');
    } finally {
      setMoveLoading(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner spinner-dark" /></div>;
  if (error || !product) return <div style={{ color: 'var(--color-danger)' }}>{error || 'Product not found'}</div>;

  const isLowStock = product.currentStock > 0 && product.currentStock <= product.minStockAlert;
  const isOutOfStock = product.currentStock === 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/products')} style={{ marginBottom: '16px' }}>
        &larr; Back to Products
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>
        {/* Left Column: Details & Stock Level */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px' }}>
                    {product.name}
                  </h1>
                  <span className="badge" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                    SKU: {product.sku}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Current Stock</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, color: isOutOfStock ? 'var(--color-danger)' : isLowStock ? 'var(--color-warning)' : 'var(--color-success)' }}>
                    {product.currentStock}
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Category</div>
                  <div style={{ fontWeight: 500 }}>{product.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Unit Price</div>
                  <div style={{ fontWeight: 500 }}>${Number(product.unitPrice).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Minimum Stock Alert</div>
                  <div>{product.minStockAlert} units</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Warehouse Location</div>
                  <div>{product.warehouseLocation}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Stock Movement History</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {product.stockMovements.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No stock movements recorded yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Date</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Type</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Qty</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>User</th>
                      <th style={{ padding: '12px 24px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.stockMovements.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 24px', fontSize: '0.875rem' }}>{new Date(m.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '12px 24px' }}>
                          <span className={`badge badge-${m.movementType === 'IN' ? 'success' : 'danger'}`}>
                            {m.movementType}
                          </span>
                        </td>
                        <td style={{ padding: '12px 24px', fontWeight: 600, color: m.movementType === 'IN' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {m.movementType === 'IN' ? '+' : '-'}{m.quantityChanged}
                        </td>
                        <td style={{ padding: '12px 24px', fontSize: '0.875rem' }}>{m.createdBy.name}</td>
                        <td style={{ padding: '12px 24px', fontSize: '0.875rem' }}>{m.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Record Movement */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
            <h3 style={{ color: 'var(--color-primary)' }}>Adjust Stock</h3>
          </div>
          <div className="card-body">
            
            <form onSubmit={handleStockMovement}>
              <div className="form-group">
                <label className="form-label">Movement Type</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="radio" name="movementType" value="IN" checked={movementType === 'IN'} onChange={() => setMovementType('IN')} />
                    <span style={{ fontWeight: 500, color: 'var(--color-success)' }}>Stock IN</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="radio" name="movementType" value="OUT" checked={movementType === 'OUT'} onChange={() => setMovementType('OUT')} />
                    <span style={{ fontWeight: 500, color: 'var(--color-danger)' }}>Stock OUT</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input 
                  type="number" 
                  min="1" 
                  className="form-input" 
                  placeholder="Enter quantity..." 
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea 
                  className="form-input" 
                  rows={2} 
                  placeholder="e.g. New shipment received, Sent to retail..." 
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                  minLength={3}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={moveLoading || !quantity || !reason.trim()}>
                {moveLoading ? 'Recording...' : `Record ${movementType}`}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
