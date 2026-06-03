import React from 'react';
import { Calendar, Target, Award } from 'lucide-react';

export default function SprintSelector({ sprints, activeSprint, onSelectSprint }) {
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Calendar size={16} className="text-muted" /> Sprint Activo
        </label>
        <select 
          className="form-control"
          value={activeSprint?.id || ''}
          onChange={(e) => {
            const selected = sprints.find(s => s.id === e.target.value);
            if (selected) onSelectSprint(selected);
          }}
          style={{ width: '100%', fontWeight: 600 }}
        >
          {sprints.map(sprint => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name}
            </option>
          ))}
        </select>
      </div>

      {activeSprint && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span className="text-muted">Inicio:</span>
            <span style={{ fontWeight: 600 }}>{formatDate(activeSprint.startDate)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span className="text-muted">Fin:</span>
            <span style={{ fontWeight: 600 }}>{formatDate(activeSprint.endDate)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
