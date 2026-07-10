import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

const ROLE_HOME: Record<string, string> = {
  citizen: '/citizen',
  volunteer: '/volunteer',
  supervisor: '/supervisor',
  admin: '/admin',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(ROLE_HOME[user.role] || '/');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Scale size={24} className="text-brass" />
          <span className="font-display text-2xl text-ink">LegalAid</span>
        </div>
        <form onSubmit={submit} className="card p-6 space-y-4">
          <h1 className="font-display text-xl text-ink mb-2">Sign in</h1>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-xs text-crit">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className="text-xs text-slate text-center">
            New here? <Link to="/register" className="text-brass2 font-medium">Create a citizen account</Link>
          </p>
          <p className="text-[10px] text-slate text-center pt-2 border-t border-ink/10">
            Volunteer/supervisor/admin test accounts: see backend seed script (password: password123)
          </p>
        </form>
      </div>
    </div>
  );
}
