import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@erp.com' },
  { role: 'Sales', email: 'sales@erp.com' },
  { role: 'Warehouse', email: 'warehouse@erp.com' },
  { role: 'Accounts', email: 'accounts@erp.com' },
] as const;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && !err.response) {
        setError('Unable to reach the backend API. Check that the server is running and the API URL matches the backend port.');
      } else {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>Mini ERP + CRM</h1>
          <p>Operations Portal</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-demo-info">
          <p>Demo Accounts</p>
          <div className="demo-roles">
            {DEMO_ACCOUNTS.map((account) => (
              <div
                key={account.role}
                className="demo-role"
                onClick={() => fillDemo(account.email)}
              >
                <span className="role-name">{account.role}</span>
                <span className="role-email">{account.email}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
