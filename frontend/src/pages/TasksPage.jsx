import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge, Avatar, Modal, ConfirmDialog, PageHeader, Empty } from '../components/UI';
import TaskForm from '../components/TaskForm';
import Spinner from '../components/Spinner';
import { toast } from '../components/UI';
import api from '../utils/api';
import { fmtDate, isOverdue, getErrorMessage } from '../utils/helpers';

export default function TasksPage({ projectId, projectName }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (projectId) params.projectId = projectId;
      const [tRes, pRes, uRes] = await Promise.all([
        api.get('/tasks', { params }),
        api.get('/projects'),
        api.get('/users'),
      ]);
      setTasks(tRes.data.tasks);
      setProjects(pRes.data.projects);
      setUsers(uRes.data.users);
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  let filtered = tasks;
  if (tab === 'mine') filtered = filtered.filter((t) => (t.assignedTo?._id || t.assignedTo) === user._id);
  if (tab === 'overdue') filtered = filtered.filter((t) => isOverdue(t.dueDate, t.status));
  if (search) filtered = filtered.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'dueDate') return (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1;
    if (sortBy === 'priority') {
      const o = { high: 0, medium: 1, low: 2 };
      return o[a.priority] - o[b.priority];
    }
    return a.title.localeCompare(b.title);
  });

  async function handleToggle(task) {
    try {
      const updated = await api.patch(`/tasks/${task._id}`, {
        status: task.status === 'done' ? 'todo' : 'done',
      });
      setTasks((prev) => prev.map((t) => t._id === task._id ? updated.data.task : t));
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  }

  async function handleSave(form) {
    setSaving(true);
    try {
      if (editTask) {
        const res = await api.patch(`/tasks/${editTask._id}`, form);
        setTasks((prev) => prev.map((t) => t._id === editTask._id ? res.data.task : t));
        toast('Task updated');
      } else {
        const res = await api.post('/tasks', { ...form, projectId: projectId || form.projectId });
        setTasks((prev) => [res.data.task, ...prev]);
        toast('Task created');
      }
      setShowAdd(false);
      setEditTask(null);
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      toast('Task deleted');
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
    setConfirmDel(null);
  }

  function canEdit(task) {
    return user.role === 'admin'
      || task.createdBy?._id === user._id
      || task.assignedTo?._id === user._id;
  }

  if (loading) return <Spinner fullScreen />;

  return (
    <div className="fade-in">
      <PageHeader
        title={projectName ? `${projectName} — Tasks` : 'Tasks'}
        action={
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + New Task
          </button>
        }
      />

      {!projectId && (
        <div className="tab-bar">
          {['all', 'mine', 'overdue'].map((t) => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {{ all: 'All Tasks', mine: 'My Tasks', overdue: 'Overdue' }[t]}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 'auto' }}>
          <option value="dueDate">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
          <option value="title">Sort: Title</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Empty message="No tasks found" />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Task</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const proj = t.projectId;
                const assignee = t.assignedTo;
                const over = isOverdue(t.dueDate, t.status);
                return (
                  <tr key={t._id}>
                    <td>
                      <div
                        onClick={() => handleToggle(t)}
                        style={{
                          width: 18, height: 18, borderRadius: '50%', cursor: 'pointer',
                          border: `2px solid ${t.status === 'done' ? 'var(--success)' : 'var(--border)'}`,
                          background: t.status === 'done' ? 'var(--success)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: '.2s', flexShrink: 0,
                        }}
                      >
                        {t.status === 'done' && <span style={{ fontSize: 10, color: '#fff' }}>✓</span>}
                      </div>
                    </td>
                    <td style={{
                      textDecoration: t.status === 'done' ? 'line-through' : 'none',
                      color: t.status === 'done' ? 'var(--muted)' : 'var(--text)',
                    }}>{t.title}</td>
                    <td>
                      {proj && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: proj.color }} />
                          {proj.name}
                        </div>
                      )}
                    </td>
                    <td>
                      {assignee && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Avatar user={assignee} size={22} />
                          {assignee.name}
                        </div>
                      )}
                    </td>
                    <td><Badge type={t.priority} /></td>
                    <td><Badge type={over ? 'overdue' : t.status} /></td>
                    <td style={{
                      fontSize: 12,
                      color: over ? 'var(--danger)' : 'var(--muted)',
                    }}>
                      {fmtDate(t.dueDate) || '—'}
                    </td>
                    <td>
                      {canEdit(t) && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="icon-btn" onClick={() => setEditTask(t)}>✎</button>
                          <button className="icon-btn danger" onClick={() => setConfirmDel(t._id)}>✕</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="New Task" onClose={() => setShowAdd(false)}>
          <TaskForm
            projects={projects}
            users={users}
            currentUser={user}
            onSave={handleSave}
            onClose={() => setShowAdd(false)}
            loading={saving}
          />
        </Modal>
      )}

      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)}>
          <TaskForm
            task={editTask}
            projects={projects}
            users={users}
            currentUser={user}
            onSave={handleSave}
            onClose={() => setEditTask(null)}
            loading={saving}
          />
        </Modal>
      )}

      {confirmDel && (
        <ConfirmDialog
          message="Delete this task? This cannot be undone."
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}
