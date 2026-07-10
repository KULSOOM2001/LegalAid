import React, { useEffect, useState } from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotificationStore } from '../../store/notificationStore';
import { notificationsApi } from '../../api/cases';

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const items = useNotificationStore((s) => s.items);
  const setAll = useNotificationStore((s) => s.setAll);
  const markRead = useNotificationStore((s) => s.markRead);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    notificationsApi.list().then(setAll).catch(() => undefined);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  return (
    <header className="h-16 border-b border-ink/10 bg-parchment/80 backdrop-blur flex items-center justify-between md:justify-end gap-3 sm:gap-4 px-4 sm:px-6 sticky top-0 z-10">
      <button className="md:hidden text-ink" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative">
          <button onClick={() => setOpen((o) => !o)} className="relative text-ink hover:text-brass2 transition-colors">
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-crit text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 max-h-96 overflow-y-auto card shadow-lg z-20">
              {items.length === 0 ? (
                <p className="p-4 text-sm text-slate">No notifications yet.</p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.read) {
                        markRead(n.id);
                        notificationsApi.markRead(n.id).catch(() => undefined);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-ink/5 last:border-0 text-sm ${
                      n.read ? 'text-slate' : 'text-ink bg-brass/5'
                    }`}
                  >
                    {n.message}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline text-sm text-ink font-medium">{user?.name}</span>
          <button onClick={logout} className="text-slate hover:text-crit transition-colors" title="Log out">
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}