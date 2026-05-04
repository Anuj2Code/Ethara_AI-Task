import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, PageHeader, toast } from '../components/UI';
import Spinner from '../components/Spinner';
import api from '../utils/api';
import { getErrorMessage } from '../utils/helpers';

export default function TeamPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [taskStats, setTaskStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/users'), api.get('/projects'), api.get('/tasks')])
      .then(([uRes, pRes, tRes]) => {
        setUsers(uRes.data.users);
        setProjects(pRes.data.projects);
        const stats = {};
        uRes.data.users.forEach((u) => {
          const assigned = tRes.data.tasks.filter((t) => (t.assignedTo?._id || t.assignedTo) === u._id);
          stats[u._id] = {
            open: assigned.filter((t) => t.status !== 'done').length,
            done: assigned.filter((t) => t.status === 'done').length,
          };
        });
        setTaskStats(stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function toggleRole(u) {
    const newRole = u.role === 'admin' ? 'member' : 'admin';
    try {
      const res = await api.patch(`/users/${u._id}/role`, { role: newRole });
      setUsers((prev) => prev.map((x) => x._id === u._id ? res.data.user : x));
      toast(`${u.name} is now ${newRole}`);
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  }

  if (loading) return <Spinner fullScreen />;

  return (
    <div className="fade-in">
      <PageHeader title="Team" subtitle={`${users.length} members`} />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Email</th>
              <th>Role</th>
              <th>Projects</th>
              <th>Open Tasks</th>
              <th>Done</th>
              {user.role === 'admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const uProjects = projects.filter((p) =>
                p.members?.some((m) => (m._id || m) === u._id)
              );
              const stats = taskStats[u._id] || { open: 0, done: 0 };

              return (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar user={u} size={34} />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500 }}>{u.name}</p>
                        {u._id === user._id && (
                          <p style={{ fontSize: 11, color: 'var(--muted)' }}>You</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{u.email}</td>
                  <td><Badge type={u.role} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {uProjects.slice(0, 3).map((p) => (
                        <span key={p._id} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', background: 'var(--bg3)',
                          border: '1px solid var(--border)', borderRadius: 12, fontSize: 11, color: 'var(--muted)',
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                          {p.name}
                        </span>
                      ))}
                      {uProjects.length > 3 && (
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>+{uProjects.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: stats.open > 0 ? 'var(--info)' : 'var(--muted)', fontSize: 13 }}>
                    {stats.open}
                  </td>
                  <td style={{ color: 'var(--success)', fontSize: 13 }}>{stats.done}</td>
                  {user.role === 'admin' && (
                    <td>
                      {u._id !== user._id ? (
                        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => toggleRole(u)}>
                          {u.role === 'admin' ? 'Make Member' : 'Make Admin'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
