import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, ToastProvider } from './UI';
import './Layout.css';

const NAV = [
  { to: '/',         end: true, icon: '⊞', label: 'Dashboard' },
  { to: '/tasks',    icon: '✓',  label: 'Tasks' },
  { to: '/projects', icon: '◫',  label: 'Projects' },
  { to: '/team',     icon: '◉',  label: 'Team' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <ToastProvider>
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            Task<span style={{ color: 'var(--accent)' }}>Flow</span>
          </div>

          <nav className="sidebar-nav">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-info">
              <Avatar user={user} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="user-name">{user?.name}</p>
                <span className={`badge ${user?.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
                  {user?.role}
                </span>
              </div>
            </div>
            <button className="nav-item logout-btn" onClick={handleLogout}>
              <span className="nav-icon">↩</span>
              Sign Out
            </button>
          </div>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  );
}
