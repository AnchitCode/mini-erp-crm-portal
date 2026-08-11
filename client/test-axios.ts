import axios from 'axios';

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'sales@erp.com',
      password: 'password123'
    });
    const token = loginRes.data.data.token;
    console.log('Got token');

    const custRes = await axios.get('http://localhost:5001/api/customers?limit=100', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const customers = custRes.data.data || [];
    console.log('Customers count:', customers.length);
    if (customers.length === 0) return;

    const prodRes = await axios.get('http://localhost:5001/api/products?limit=100', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const products = prodRes.data.data || [];
    console.log('Products count:', products.length);

    const customerId = customers[0].id;
    const productId = products[0].id;

    console.log('Submitting:', { customerId, items: [{ productId, quantity: 1 }] });

    const createRes = await axios.post('http://localhost:5001/api/challans', {
      customerId,
      items: [{ productId, quantity: 1 }]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Success!', createRes.data);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}
test();
