import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  CalendarClock,
  FolderKanban,
  Users,
  BarChart3,
  Scale,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV: Record<string, { to: string; label: string; icon: any }[]> = {
  citizen: [
    { to: '/citizen', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/citizen/new-case', label: 'New case', icon: FilePlus },
  ],
  volunteer: [
    { to: '/volunteer', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/volunteer/availability', label: 'Availability', icon: CalendarClock },
  ],
  supervisor: [
    { to: '/supervisor', label: 'Caseload overview', icon: FolderKanban },
  ],
  admin: [
    { to: '/admin', label: 'Reports', icon: BarChart3 },
    { to: '/admin/users', label: 'Users', icon: Users },
  ],
};

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  if (!user) return null;
  const items = NAV[user.role] || [];

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-ink/40 z-40 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 md:w-60 shrink-0 bg-ink text-parchment min-h-screen flex flex-col
          transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
      >
        <div className="px-5 py-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <Scale size={20} className="text-brass" />
            <span className="font-display text-lg tracking-tight">LegalAid</span>
          </div>
          <button className="md:hidden text-parchment/70" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 py-4">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === `/${user.role}`}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-white/10 text-white border-r-2 border-brass' : 'text-parchment/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-[10px] font-mono uppercase tracking-wider text-parchment/50">
            {user.role} account
          </p>
        </div>
      </aside>
    </>
  );
}