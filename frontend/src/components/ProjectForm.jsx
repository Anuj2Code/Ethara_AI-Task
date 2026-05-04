import React, { useState } from 'react';
import { FormGroup, Avatar } from './UI';
import { COLORS } from '../utils/helpers';

export default function ProjectForm({ project, users, currentUser, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    color: project?.color || '#6c63ff',
    members: project?.members?.map((m) => m._id || m) || [],
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleMember = (id) =>
    set('members', form.members.includes(id)
      ? form.members.filter((m) => m !== id)
      : [...form.members, id]
    );

  function handleSubmit() {
    if (!form.name.trim()) return;
    onSave(form);
  }

  const otherUsers = users.filter((u) => u._id !== currentUser._id);

  return (
    <div>
      <FormGroup label="Project Name">
        <input
          type="text"
          placeholder="My Project"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          autoFocus
        />
      </FormGroup>

      <FormGroup label="Description">
        <textarea
          rows={2}
          placeholder="What is this project about?"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </FormGroup>

      <FormGroup label="Color">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <div
              key={c}
              onClick={() => set('color', c)}
              style={{
                width: 26, height: 26, borderRadius: '50%', background: c,
                cursor: 'pointer', transition: '.15s',
                border: form.color === c ? '3px solid var(--text)' : '3px solid transparent',
              }}
            />
          ))}
        </div>
      </FormGroup>

      {otherUsers.length > 0 && (
        <FormGroup label="Members">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {otherUsers.map((u) => {
              const selected = form.members.includes(u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => toggleMember(u._id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px',
                    background: selected ? 'rgba(108,99,255,.2)' : 'var(--bg3)',
                    border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 20, cursor: 'pointer', fontSize: 13, transition: '.15s',
                  }}
                >
                  <Avatar user={u} size={18} />
                  {u.name}
                </div>
              );
            })}
          </div>
        </FormGroup>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving…' : 'Save Project'}
        </button>
      </div>
    </div>
  );
}
