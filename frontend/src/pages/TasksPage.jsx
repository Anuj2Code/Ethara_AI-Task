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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);

  // ✅ Static project type mapping (for UI)
  const projectTypeMap = {
    'web-design': { name: 'Web Design', color: '#3b82f6' },
    'mobile-app': { name: 'Mobile App', color: '#10b981' },
    'api-integration': { name: 'API Integration', color: '#8b5cf6' },
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (projectId) params.projectId = projectId;

      const [tRes, uRes] = await Promise.all([
        api.get('/tasks', { params }),
        api.get('/users'),
      ]);

      setTasks(tRes.data.tasks);
      setUsers(uRes.data.users);
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  let filtered = tasks;

  if (tab === 'mine') {
    filtered = filtered.filter(
      (t) => (t.assignedTo?._id || t.assignedTo) === user._id
    );
  }

  if (tab === 'overdue') {
    filtered = filtered.filter((t) => isOverdue(t.dueDate, t.status));
  }

  if (search) {
    filtered = filtered.filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'dueDate')
      return (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1;

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

      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? updated.data.task : t))
      );
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  }

  async function handleSave(form) {
    setSaving(true);
    try {
      if (editTask) {
        const res = await api.patch(`/tasks/${editTask._id}`, form);
        setTasks((prev) =>
          prev.map((t) => (t._id === editTask._id ? res.data.task : t))
        );
        toast('Task updated');
      } else {
        // ✅ send projectType instead of projectId
        const res = await api.post('/tasks', {
          ...form,
          projectType: form.projectId,
        });

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
    return (
      user.role === 'admin' ||
      task.createdBy?._id === user._id ||
      task.assignedTo?._id === user._id
    );
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
            <button
              key={t}
              className={`tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
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

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="dueDate">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
          <option value="title">Sort: Title</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Empty message="No tasks found" />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Task</th>
                <th>Project Type</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((t) => {
                const assignee = t.assignedTo;
                const over = isOverdue(t.dueDate, t.status);
                const type = projectTypeMap[t.projectType];

                return (
                  <tr key={t._id}>
                    <td>
                      <div onClick={() => handleToggle(t)} style={{ cursor: 'pointer' }}>
                        {t.status === 'done' ? '✓' : '○'}
                      </div>
                    </td>

                    <td>{t.title}</td>

                    {/* ✅ NEW PROJECT TYPE UI */}
                    <td>
                      {type && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: type.color,
                            }}
                          />
                          {type.name}
                        </div>
                      )}
                    </td>

                    <td>
                      {assignee && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Avatar user={assignee} size={22} />
                          {assignee.name}
                        </div>
                      )}
                    </td>

                    <td><Badge type={t.priority} /></td>
                    <td><Badge type={over ? 'overdue' : t.status} /></td>
                    <td>{fmtDate(t.dueDate) || '—'}</td>

                    <td>
                      {canEdit(t) && (
                        <>
                          <button onClick={() => setEditTask(t)}>✎</button>
                          <button onClick={() => setConfirmDel(t._id)}>✕</button>
                        </>
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
          message="Delete this task?"
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}