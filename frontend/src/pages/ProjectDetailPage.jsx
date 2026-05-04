import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import TasksPage from './TasksPage';
import api from '../utils/api';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${id}`)
      .then((res) => setProject(res.data.project))
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner fullScreen />;
  if (!project) return null;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => navigate('/projects')}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, padding: 0 }}
        >
          ← Back to Projects
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: project.color }} />
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>{project.description}</p>
      </div>
      <TasksPage projectId={project._id} projectName={project.name} />
    </div>
  );
}
