import axios from 'axios';

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@erp.com',
      password: 'password123'
    });
    const token = loginRes.data.data.token;

    // We'll create a new draft challan to test this properly
    const createRes = await axios.post('http://localhost:5001/api/challans', {
      customerId: "dc3b14f5-c4c4-4fdd-9363-081dd47477dc", // known test customer
      items: [{ productId: "719f82bc-9c57-47ce-b9c7-afba6ac589df", quantity: 1 }]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const newChallan = createRes.data.data;
    console.log('Created new draft challan:', newChallan.id, newChallan.status);

    const res = await axios.patch(`http://localhost:5001/api/challans/${newChallan.id}/confirm`, undefined, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('PATCH returned status:', res.data.data.status);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}
test();
