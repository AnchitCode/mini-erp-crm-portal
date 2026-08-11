import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChallanApi, type CreateChallanLineItem } from '../../api/challans';
import { getCustomersApi, type Customer } from '../../api/customers';
import type { Product } from '../../api/products';
import api from '../../api/client';
import type { ApiResponse } from '../../api/auth';

interface ProductOption extends Product {}

interface LineItemRow {
  productId: string;
  productName: string;
  productSku: string;
  unitPrice: number;
  currentStock: number;
  quantity: number;
}

export default function CreateChallanPage() {
  const navigate = useNavigate();
  
  // Customer selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Product selection
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Line items
  const [lineItems, setLineItems] = useState<LineItemRow[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  // Save state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load customers
  useEffect(() => {
    (async () => {
      try {
        const res = await getCustomersApi({ limit: 100 });
        setCustomers(res.customers);
      } catch {
        setError('Failed to load customers');
      } finally {
        setLoadingCustomers(false);
      }
    })();
  }, []);

  // Load products (Sales users may not have direct product page access,
  // so we read via a dedicated call that the challan route can proxy)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ApiResponse<ProductOption[]>>('/products', {
          params: { limit: 100 },
        });
        setProducts(res.data.data || []);
      } catch {
        setError('Failed to load products');
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, []);

  const addLineItem = () => {
    if (!selectedProductId || selectedQty < 1) return;

    // Check if product already added
    const exists = lineItems.find((li) => li.productId === selectedProductId);
    if (exists) {
      setError('Product already added. Edit the quantity instead.');
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    setLineItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        unitPrice: Number(product.unitPrice),
        currentStock: product.currentStock,
        quantity: selectedQty,
      },
    ]);

    setSelectedProductId('');
    setSelectedQty(1);
    setError('');
  };

  const removeLineItem = (productId: string) => {
    setLineItems((prev) => prev.filter((li) => li.productId !== productId));
  };

  const updateItemQty = (productId: string, qty: number) => {
    if (qty < 1) return;
    setLineItems((prev) =>
      prev.map((li) => (li.productId === productId ? { ...li, quantity: qty } : li))
    );
  };

  const totalQuantity = lineItems.reduce((sum, li) => sum + li.quantity, 0);

  const handleSave = async () => {
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (lineItems.length === 0) {
      setError('Please add at least one product.');
      return;
    }

    const items: CreateChallanLineItem[] = lineItems.map((li) => ({
      productId: li.productId,
      quantity: li.quantity,
    }));

    try {
      setSaving(true);
      setError('');
      const challan = await createChallanApi({ customerId, items });
      navigate(`/challans/${challan.id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to create challan.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customerSearch
    ? customers.filter(
        (c) =>
          c.businessName.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.name.toLowerCase().includes(customerSearch.toLowerCase())
      )
    : customers;

  // Products not yet added as line items
  const availableProducts = products.filter(
    (p) => !lineItems.some((li) => li.productId === p.id)
  );

  if (loadingCustomers || loadingProducts) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-dark" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Create Sales Challan</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Select a customer, add products, and save as Draft
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/challans')}>
          &larr; Back to Challans
        </button>
      </div>

      {error && (
        <div
          style={{
            color: 'var(--color-danger)',
            backgroundColor: 'rgba(239,68,68,0.08)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '16px',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Customer Selection */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3>1. Select Customer</h3>
        </div>
        <div className="card-body">
          <input
            className="form-input"
            placeholder="Search customers by name or business..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            style={{ marginBottom: '12px' }}
          />
          <select
            className="form-input"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">— Select a Customer —</option>
            {filteredCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.businessName} ({c.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Line Items */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3>2. Add Products</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <label className="form-label">Product</label>
              <select
                className="form-input"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">— Select a Product —</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Stock: {p.currentStock}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: '0 0 100px' }}>
              <label className="form-label">Qty</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={selectedQty}
                onChange={(e) => setSelectedQty(Number(e.target.value))}
              />
            </div>
            <button className="btn btn-primary" onClick={addLineItem} disabled={!selectedProductId}>
              Add
            </button>
          </div>

          {lineItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
              No products added yet. Select a product and click "Add".
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)' }}>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Product</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Unit Price</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Stock</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Qty</th>
                  <th style={{ padding: '10px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li) => (
                  <tr key={li.productId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500 }}>{li.productName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{li.productSku}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>${li.unitPrice.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: li.currentStock < li.quantity ? 'var(--color-danger)' : 'var(--color-text)' }}>
                        {li.currentStock}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', width: '100px' }}>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        style={{ width: '80px' }}
                        value={li.quantity}
                        onChange={(e) => updateItemQty(li.productId, Number(e.target.value))}
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => removeLineItem(li.productId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary & Save */}
      <div className="card">
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Total Items: </span>
            <span style={{ fontWeight: 600 }}>{lineItems.length}</span>
            <span style={{ margin: '0 16px', color: 'var(--color-border)' }}>|</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Total Quantity: </span>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{totalQuantity}</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !customerId || lineItems.length === 0}
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
