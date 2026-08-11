import axios from 'axios';

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'sales@erp.com',
      password: 'password123'
    });
    const token = loginRes.data.data.token;
    console.log('Got token');

    const challansRes = await axios.get('http://localhost:5001/api/challans?limit=10', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const challans = challansRes.data.data || [];
    const draftChallan = challans.find(c => c.status === 'Draft');
    
    if (!draftChallan) {
      console.log('No draft challan found');
      return;
    }
    
    console.log('Found draft challan:', draftChallan.id, draftChallan.challanNumber);

    console.log('Confirming...');
    const res = await axios.patch(`http://localhost:5001/api/challans/${draftChallan.id}/confirm`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Confirmed:', res.data.data.status);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}
test();
