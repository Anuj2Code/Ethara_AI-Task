import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge, Avatar, PageHeader, Empty } from '../components/UI';
import Spinner from '../components/Spinner';
import api from '../utils/api';
import { fmtDate, isOverdue, getErrorMessage } from '../utils/helpers';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tasks/dashboard-stats'),
      api.get('/tasks/my'),
      api.get('/projects'),
      api.get('/users'),
    ])
      .then(([s, t, p, u]) => {
        setStats(s.data.stats);
        setMyTasks(t.data.tasks);
        setProjects(p.data.projects);
        setUsers(u.data.users);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner fullScreen />;

  return (
    <div className="fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name?.split(' ')[0]}!`}
      />

      {/* Stats */}
      <div className="stat-grid">
        {[
          { label: 'Total Tasks',  value: stats?.total,      color: 'var(--accent2)' },
          { label: 'Completed',    value: stats?.done,       color: 'var(--success)' },
          { label: 'In Progress',  value: stats?.inProgress, color: 'var(--info)' },
          { label: 'Overdue',      value: stats?.overdue,    color: 'var(--danger)' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="stat-label">{s.label}</p>
            <p className="stat-value" style={{ color: s.color }}>{s.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* My Tasks */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>My Tasks</h2>
          {myTasks.length === 0 ? (
            <div className="card"><Empty message="No tasks assigned to you" /></div>
          ) : (
            myTasks.slice(0, 6).map((t) => (
              <div key={t._id} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${t.status === 'done' ? 'var(--success)' : 'var(--border)'}`,
                    background: t.status === 'done' ? 'var(--success)' : 'transparent',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: 13,
                    textDecoration: t.status === 'done' ? 'line-through' : 'none',
                    color: t.status === 'done' ? 'var(--muted)' : 'var(--text)',
                  }}>{t.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {t.projectId?.name || ''}
                  </p>
                </div>
                {isOverdue(t.dueDate, t.status) ? (
                  <Badge type="overdue" />
                ) : (
                  <Badge type={t.status} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Projects */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Projects</h2>
          {projects.slice(0, 5).map((p) => {
            const mems = p.members?.slice(0, 5) || [];
            return (
              <div
                key={p._id}
                className="card"
                style={{ marginBottom: 8, cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${p._id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {mems.length} member{mems.length !== 1 ? 's' : ''}
                  </p>
                  <div style={{ display: 'flex' }}>
                    {mems.map((m, i) => (
                      <div key={m._id} style={{ marginLeft: i > 0 ? -6 : 0 }}>
                        <Avatar user={m} size={22} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
