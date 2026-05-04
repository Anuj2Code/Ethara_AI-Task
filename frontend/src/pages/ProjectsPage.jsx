import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, Modal, ConfirmDialog, PageHeader, Empty, toast } from '../components/UI';
import ProjectForm from '../components/ProjectForm';
import Spinner from '../components/Spinner';
import api from '../utils/api';
import { getErrorMessage } from '../utils/helpers';

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [taskCounts, setTaskCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editProj, setEditProj] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, uRes, tRes] = await Promise.all([
        api.get('/projects'),
        api.get('/users'),
        api.get('/tasks'),
      ]);
      setProjects(pRes.data.projects);
      setUsers(uRes.data.users);

      // compute per-project task stats client-side
      const counts = {};
      pRes.data.projects.forEach((p) => {
        const pt = tRes.data.tasks.filter((t) => (t.projectId?._id || t.projectId) === p._id);
        counts[p._id] = {
          total: pt.length,
          done: pt.filter((t) => t.status === 'done').length,
        };
      });
      setTaskCounts(counts);
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSave(form) {
    setSaving(true);
    try {
      if (editProj) {
        const res = await api.patch(`/projects/${editProj._id}`, form);
        setProjects((prev) => prev.map((p) => p._id === editProj._id ? res.data.project : p));
        toast('Project updated');
      } else {
        const res = await api.post('/projects', form);
        setProjects((prev) => [res.data.project, ...prev]);
        toast('Project created');
      }
      setShowAdd(false);
      setEditProj(null);
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast('Project deleted');
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
    setConfirmDel(null);
  }

  if (loading) return <Spinner fullScreen />;

  return (
    <div className="fade-in">
      <PageHeader
        title="Projects"
        action={
          user.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              + New Project
            </button>
          )
        }
      />

      {projects.length === 0 ? (
        <Empty message="No projects yet. Create one to get started!" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {projects.map((p) => {
            const counts = taskCounts[p._id] || { total: 0, done: 0 };
            const pct = counts.total ? Math.round(counts.done / counts.total * 100) : 0;
            const mems = p.members?.slice(0, 5) || [];
            const owner = p.createdBy;
            const canEdit = user.role === 'admin' || owner?._id === user._id;

            return (
              <div key={p._id} className="card" style={{ cursor: 'pointer', transition: '.15s' }}
                onClick={() => navigate(`/projects/${p._id}`)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <p style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</p>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                      <button className="icon-btn" onClick={() => setEditProj(p)}>✎</button>
                      <button className="icon-btn danger" onClick={() => setConfirmDel(p._id)}>✕</button>
                    </div>
                  )}
                </div>

                {p.description && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{p.description}</p>
                )}

                <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                  {counts.done}/{counts.total} tasks complete
                </p>

                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <div style={{ display: 'flex' }}>
                    {mems.map((m, i) => (
                      <div key={m._id} style={{ marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--card)', borderRadius: '50%' }}>
                        <Avatar user={m} size={24} />
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {pct}% • {owner?.name?.split(' ')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="New Project" onClose={() => setShowAdd(false)}>
          <ProjectForm users={users} currentUser={user} onSave={handleSave} onClose={() => setShowAdd(false)} loading={saving} />
        </Modal>
      )}

      {editProj && (
        <Modal title="Edit Project" onClose={() => setEditProj(null)}>
          <ProjectForm project={editProj} users={users} currentUser={user} onSave={handleSave} onClose={() => setEditProj(null)} loading={saving} />
        </Modal>
      )}

      {confirmDel && (
        <ConfirmDialog
          message="Delete this project and all its tasks? This cannot be undone."
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}
