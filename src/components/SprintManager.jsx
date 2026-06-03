import React, { useState, useEffect } from 'react';
import { Settings, Plus, Save, Trash2, Milestone, AlertTriangle, Info } from 'lucide-react';
export default function SprintManager({ sprints, activeSprint, onCreateSprint, onUpdateSprint, onDeleteSprint }) {
  const [newSprintName, setNewSprintName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  
  // Estado local para los sprints editables
  const [editingSprints, setEditingSprints] = useState({});

  useEffect(() => {
    // Inicializar estado de edición para cada sprint
    const initialEditing = {};
    sprints.forEach(s => {
      initialEditing[s.id] = {
        name: s.name,
        startDate: s.startDate,
        endDate: s.endDate,
        velocity: s.velocity || 0,
        errors: s.errors || 0,
        capacity: s.capacity || 6
      };
    });
    setEditingSprints(initialEditing);
  }, [sprints]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newSprintName.trim() || !newStartDate || !newEndDate) return;
    onCreateSprint({
      name: newSprintName.trim(),
      startDate: newStartDate,
      endDate: newEndDate
    });
    setNewSprintName('');
    setNewStartDate('');
    setNewEndDate('');
  };

  const handleFieldChange = (sprintId, field, value) => {
    setEditingSprints(prev => ({
      ...prev,
      [sprintId]: {
        ...prev[sprintId],
        [field]: value
      }
    }));
  };

  const handleSave = (sprintId) => {
    const data = editingSprints[sprintId];
    if (!data || !data.name.trim() || !data.startDate || !data.endDate) {
      alert('Por favor completa todos los campos del sprint.');
      return;
    }
    onUpdateSprint(sprintId, {
      ...data,
      name: data.name.trim(),
      velocity: parseInt(data.velocity) || 0,
      errors: parseInt(data.errors) || 0,
      capacity: parseInt(data.capacity) || 6
    });
    alert('Sprint actualizado correctamente.');
  };

  return (
    <div className="glass-card">
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Settings size={20} style={{ color: 'var(--primary)' }} /> Configuración del Scrum Sprint
      </h2>

      <div className="sprints-manager-grid">
        {/* Panel 1: Crear Sprint */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid var(--border-color)', paddingRight: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={18} style={{ color: 'var(--success)' }} /> Crear Nuevo Sprint
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nombre del Sprint</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Sprint 3 - Core APIs"
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fecha Inicio</label>
                <input
                  type="date"
                  className="form-control"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fecha Fin</label>
                <input
                  type="date"
                  className="form-control"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              <Plus size={16} /> Inicializar Sprint
            </button>
          </form>
        </div>

        {/* Panel 2: Gestión de Sprints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Milestone size={18} style={{ color: 'var(--primary)' }} /> Gestión de Sprints Existentes
          </h3>
          <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            Edita los nombres, rangos de fechas o ingresa las métricas finales de cada sprint para el informe de tendencias del proyecto.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
            {sprints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                No hay sprints registrados. Crea uno a la izquierda.
              </div>
            ) : (
              sprints.map(sprint => {
                const editState = editingSprints[sprint.id] || {
                  name: sprint.name,
                  startDate: sprint.startDate,
                  endDate: sprint.endDate,
                  velocity: sprint.velocity || 0,
                  errors: sprint.errors || 0
                };
                
                const isActive = activeSprint?.id === sprint.id;

                return (
                  <div 
                    key={sprint.id} 
                    style={{ 
                      padding: '1rem', 
                      background: 'var(--bg-primary)', 
                      borderRadius: 'var(--radius-md)', 
                      border: isActive ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      position: 'relative'
                    }}
                  >
                    {isActive && (
                      <span className="badge badge-primary" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: '0.7rem' }}>
                        Activo
                      </span>
                    )}

                    {/* Fila 1: Nombre */}
                    <div style={{ display: 'flex', gap: '0.5rem', paddingRight: isActive ? '4rem' : '0' }}>
                      <div className="form-group" style={{ flexGrow: 1, marginBottom: 0, width: '100%' }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', fontWeight: 600, width: '100%' }}
                          value={editState.name}
                          onChange={(e) => handleFieldChange(sprint.id, 'name', e.target.value)}
                          placeholder="Nombre del Sprint"
                        />
                      </div>
                    </div>

                    {/* Fila 2: Fechas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Inicio</label>
                        <input
                          type="date"
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          value={editState.startDate}
                          onChange={(e) => handleFieldChange(sprint.id, 'startDate', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Fin</label>
                        <input
                          type="date"
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          value={editState.endDate}
                          onChange={(e) => handleFieldChange(sprint.id, 'endDate', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Fila 3: Métricas de Cierre */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          🚀 Vel (pts)
                          <span className="tooltip tooltip-left">
                            <Info size={12} style={{ color: 'var(--text-muted)' }} />
                            <span className="tooltiptext">Story Points completados en este sprint para medir la velocidad real.</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          value={editState.velocity}
                          min="0"
                          onChange={(e) => handleFieldChange(sprint.id, 'velocity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          ⚡ Cap (h/d)
                          <span className="tooltip tooltip-center">
                            <Info size={12} style={{ color: 'var(--text-muted)' }} />
                            <span className="tooltiptext">Capacidad teórica diaria de horas efectivas por cada desarrollador.</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          value={editState.capacity}
                          min="1"
                          max="24"
                          onChange={(e) => handleFieldChange(sprint.id, 'capacity', parseInt(e.target.value) || 6)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--danger)' }}>
                          ⚠️ Err
                          <span className="tooltip tooltip-right">
                            <Info size={12} style={{ color: 'var(--text-muted)' }} />
                            <span className="tooltiptext">Errores o defectos detectados en producción o QA durante este sprint.</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          value={editState.errors}
                          min="0"
                          onChange={(e) => handleFieldChange(sprint.id, 'errors', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* Fila 4: Acciones */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', gap: '4px' }}
                        onClick={() => handleSave(sprint.id)}
                      >
                        <Save size={14} /> Guardar
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', gap: '4px' }}
                        onClick={() => onDeleteSprint(sprint.id)}
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
