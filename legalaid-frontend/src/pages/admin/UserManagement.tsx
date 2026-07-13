import React, { useEffect, useState } from 'react';
import { adminApi, usersApi } from '../../api/cases';
import { api } from '../../api/axios';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import type { User, UserRole } from '../../types';



export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('volunteer');
  const [error, setError] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('volunteer');
  const [editError, setEditError] = useState<string | null>(null);

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

  const openEdit = (u: User) => {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditError(null);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditError(null);
    try {
      await usersApi.update(editUser.id, { name: editName, email: editEmail, role: editRole });
      setEditUser(null);
      refresh();
    } catch (e: any) {
      setEditError(e?.response?.data?.message || 'Could not update user');
    }
  };

  const toggleActive = async (u: User) => {
    await usersApi.setActive(u.id, !u.isActive);
    refresh();
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
           {
              header: 'Actions',
              render: (u) => (
                <div className="flex gap-2">
                  <button
                    className="text-xs font-mono text-brass hover:underline"
                    onClick={(e) => { e.stopPropagation(); openEdit(u); }}
                  >
                    Edit
                  </button>
                  {u.id === currentUser?.id ? (
                    <span className="text-xs font-mono text-slate">(you)</span>
                  ) : (
                    <button
                      className="text-xs font-mono text-crit hover:underline"
                      onClick={(e) => { e.stopPropagation(); toggleActive(u); }}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              ),
            },
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

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit user">
        <form onSubmit={saveEdit} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)}>
              <option value="citizen">Citizen</option>
              <option value="volunteer">Volunteer</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {editError && <p className="text-xs text-crit">{editError}</p>}
          <Button type="submit">Save changes</Button>
        </form>
      </Modal>
    </div>
  );
}