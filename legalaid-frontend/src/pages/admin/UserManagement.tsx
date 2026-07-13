import React, { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/cases';
import { api } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import type { User, UserRole } from '../../types';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('volunteer');
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('citizen');
  const [editCapacity, setEditCapacity] = useState(8);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setEditCapacity((u as any).maxActiveCases ?? 8);
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    setEditError(null);
    try {
      await adminApi.updateUser(editUser.id, {
        name: editName,
        email: editEmail,
        role: editRole,
        maxActiveCases: editCapacity,
      });
      setEditUser(null);
      refresh();
    } catch (e: any) {
      setEditError(e?.response?.data?.message || 'Could not update user');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmUser) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await adminApi.deleteUser(confirmUser.id);
      setConfirmUser(null);
      refresh();
    } catch (e: any) {
      setDeleteError(e?.response?.data?.message || 'Could not delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-ink">Users</h1>
          <p className="text-sm text-slate">Invite, edit, or remove volunteers, supervisors, and admins.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>Add user</Button>
      </div>

      {!loading && (
        <Table<User>
          rows={users}
          columns={[
            { header: 'Name', render: (u) => <span className="font-medium text-ink">{u.name}</span> },
            { header: 'Email', render: (u) => <span className="text-xs">{u.email}</span> },
            { header: 'Role', render: (u) => <span className="capitalize text-xs font-mono">{u.role}</span> },
            {
              header: '',
              render: (u) => (
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => openEdit(u)}
                    className="text-slate hover:text-ink transition-colors"
                    title="Edit user"
                  >
                    <Pencil size={16} />
                  </button>
                  {u.id === currentUser?.id ? (
                    <span className="text-xs text-slate/50 italic">You</span>
                  ) : (
                    <button
                      onClick={() => { setConfirmUser(u); setDeleteError(null); }}
                      className="text-slate hover:text-crit transition-colors"
                      title="Delete user"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Invite modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Add user">
        <form onSubmit={invite} className="space-y-3">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
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
          <Button type="submit">Add User</Button>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit user">
        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
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
          {editRole === 'volunteer' && (
            <div>
              <label className="label">Max active cases (capacity)</label>
              <input
                className="input"
                type="number"
                min={1}
                value={editCapacity}
                onChange={(e) => setEditCapacity(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          )}
          {editError && <p className="text-xs text-crit">{editError}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setEditUser(null)} className="text-sm text-slate hover:text-ink px-3 py-1.5">
              Cancel
            </button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!confirmUser} onClose={() => setConfirmUser(null)} title="Delete user">
        <div className="space-y-3">
          <p className="text-sm text-ink">
            Are you sure you want to permanently delete <strong>{confirmUser?.name}</strong> ({confirmUser?.email})?
            This action cannot be undone.
          </p>
          {deleteError && <p className="text-xs text-crit">{deleteError}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setConfirmUser(null)} className="text-sm text-slate hover:text-ink px-3 py-1.5">
              Cancel
            </button>
            <Button onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}