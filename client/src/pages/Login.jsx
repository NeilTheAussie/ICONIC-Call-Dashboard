import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'viewer') navigate('/viewer');
      else if (user.role === 'manager') navigate('/manager');
      else navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block bg-pur text-white text-xs font-bold tracking-widest uppercase px-3 py-1 rounded mb-4">ICONIC</div>
          <h1 className="text-2xl font-bold text-txtb">War Room</h1>
          <p className="text-sm text-txtd mt-1">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg2 border border-bdr rounded-lg p-6 space-y-4">
          {error && <div className="bg-red/10 border border-red/30 text-red text-sm rounded px-3 py-2">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-txtd uppercase tracking-wide mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-bg3 border border-bdr rounded px-3 py-2 text-txtb text-sm focus:border-pur focus:outline-none"
              placeholder="you@iconic.ai"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-txtd uppercase tracking-wide mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-bg3 border border-bdr rounded px-3 py-2 text-txtb text-sm focus:border-pur focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pur hover:bg-pur/90 text-white font-semibold py-2.5 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gry mt-4">Default: any seeded email / iconic2026</p>
      </div>
    </div>
  );
}
