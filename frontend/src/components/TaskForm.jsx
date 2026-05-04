import React, { useState } from 'react';
import { FormGroup } from './UI';
import { fmtDateInput } from '../utils/helpers';

export default function TaskForm({ task, projects, users, currentUser, onSave, onClose, loading }) {
  const availableProjects = currentUser.role === 'admin'
    ? projects
    : projects.filter((p) => p.members?.some((m) => (m._id || m) === currentUser._id));

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    projectId: task?.projectId?._id || task?.projectId || availableProjects[0]?._id || '',
    assignedTo: task?.assignedTo?._id || task?.assignedTo || currentUser._id,
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? fmtDateInput(task.dueDate) : '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const selectedProject = projects.find((p) => p._id === form.projectId);
  const projectMembers = selectedProject
    ? users.filter((u) => selectedProject.members?.some((m) => (m._id || m) === u._id))
    : users;

  function handleSubmit() {
    if (!form.title.trim()) return;
    onSave({
      ...form,
      dueDate: form.dueDate || null,
    });
  }

  return (
    <div>
      <FormGroup label="Title">
        <input
          type="text"
          placeholder="Task title"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          autoFocus
        />
      </FormGroup>

      <FormGroup label="Description">
        <textarea
          rows={2}
          placeholder="Optional description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </FormGroup>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormGroup label="Project">
          <select value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
            {availableProjects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="Assign To">
          <select value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}>
            {projectMembers.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        </FormGroup>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormGroup label="Status">
          <select value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="todo">To Do</option>
            <option value="progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </FormGroup>

        <FormGroup label="Priority">
          <select value={form.priority} onChange={(e) => set('priority', e.target.value)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </FormGroup>
      </div>

      <FormGroup label="Due Date">
        <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
      </FormGroup>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving…' : 'Save Task'}
        </button>
      </div>
    </div>
  );
}
