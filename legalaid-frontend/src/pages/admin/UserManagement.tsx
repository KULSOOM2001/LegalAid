import React, { useEffect, useState } from 'react';
import { adminApi, usersApi } from '../../api/cases';
import { api } from '../../api/axios';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import type { User, UserRole } from '../../types';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('volunteer');
  const [error, setError] = useState<string | null>(null);

  const refresh = () => adminApi.users().then((u) => { setUsers(u); setLoading(false); });
  useEffect(() => { refresh(); }, []);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/users/invite', { name, email, password, role });
      setInviteOpen(false);
      setName(''); setEmail(''); setPassword('');
      refresh();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not invite user');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-ink">Users</h1>
          <p className="text-sm text-slate">Invite volunteers, supervisors, and admins.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>Invite user</Button>
      </div>

      {!loading && (
        <Table<User>
          rows={users}
          columns={[
            { header: 'Name', render: (u) => <span className="font-medium text-ink">{u.name}</span> },
            { header: 'Email', render: (u) => <span className="text-xs">{u.email}</span> },
            { header: 'Role', render: (u) => <span className="capitalize text-xs font-mono">{u.role}</span> },
            { header: 'Active', render: (u) => <span className="text-xs">{u.isActive ? 'Yes' : 'No'}</span> },
          ]}
        />
      )}

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite user">
        <form onSubmit={invite} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Temporary password</label>
            <input className="input" type="text" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="volunteer">Volunteer</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p className="text-xs text-crit">{error}</p>}
          <Button type="submit">Send invite</Button>
        </form>
      </Modal>
    </div>
  );
}
