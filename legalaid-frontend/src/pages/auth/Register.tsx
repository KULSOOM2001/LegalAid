import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/citizen');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not create account');
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
          <h1 className="font-display text-xl text-ink mb-2">Create your account</h1>
          <p className="text-xs text-slate -mt-2">
            Public signup creates a citizen account. Volunteer, supervisor, and admin accounts are invited by an admin.
          </p>
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-xs text-crit">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </Button>
          <p className="text-xs text-slate text-center">
            Already have an account? <Link to="/login" className="text-brass2 font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
