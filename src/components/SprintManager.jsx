import React, { useState, useEffect } from 'react';
import { Settings, Plus, Save, Target, AlertCircle } from 'lucide-react';

export default function SprintManager({ sprints, activeSprint, onCreateSprint, onUpdateGoals }) {
  const [newSprintName, setNewSprintName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  
  // Metas locales
  const [goals, setGoals] = useState([]);
  
  useEffect(() => {
    if (activeSprint) {
      setGoals(activeSprint.goals || []);
    } else {
      setGoals([]);
    }
  }, [activeSprint]);

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

  const handleAddGoalField = () => {
    setGoals([
      ...goals,
      { id: 'g-' + Date.now() + Math.random().toString(36).substr(2, 4), text: '', category: 'meetings', type: 'max', value: 8 }
    ]);
  };

  const handleGoalChange = (id, field, value) => {
    setGoals(goals.map(g => {
      if (g.id === id) {
        const updated = { ...g, [field]: value };
        // Regenerar texto por defecto si se cambian categorías o valores
        if (field === 'category' || field === 'type' || field === 'value') {
          const catLabel = updated.category === 'meetings' ? 'reuniones' : 
                           updated.category === 'development' ? 'desarrollo' : 'documentación';
          const typeLabel = updated.type === 'max' ? 'limitar a max' : 'incrementar a min';
          updated.text = `${typeLabel.toUpperCase()} ${updated.value}h de ${catLabel} por persona`;
        }
        return updated;
      }
      return g;
    }));
  };

  const handleRemoveGoal = (id) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const handleSaveGoals = () => {
    onUpdateGoals(activeSprint.id, goals);
    alert('Metas del sprint guardadas correctamente');
  };

  return (
    <div className="glass-card">
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Settings size={20} style={{ color: 'var(--primary)' }} /> Configuración del Scrum Sprint
      </h2>

      <div className="sprints-manager-grid">
        {/* Panel 1: Crear Sprint */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid var(--border-color)', paddingRight: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Crear Nuevo Sprint</h3>
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

        {/* Panel 2: Metas de Mejora */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Target size={16} style={{ color: 'var(--primary)' }} /> Metas cuantitativas de retrospective
            </h3>
            {activeSprint && (
              <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={handleAddGoalField}>
                + Meta
              </button>
            )}
          </div>

          {!activeSprint ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Selecciona o crea un sprint activo para configurar metas de mejora.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p className="text-secondary" style={{ fontSize: '0.8rem' }}>
                Configura métricas de mejora derivadas de tu retrospective para compararlas con los datos reales registrados.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                {goals.map(goal => (
                  <div key={goal.id} className="goal-editor-row">
                    <select
                      className="form-control"
                      style={{ padding: '0.4rem', fontSize: '0.8rem', width: '90px' }}
                      value={goal.type}
                      onChange={(e) => handleGoalChange(goal.id, 'type', e.target.value)}
                    >
                      <option value="max">Max (≤)</option>
                      <option value="min">Min (≥)</option>
                    </select>

                    <input
                      type="number"
                      className="form-control"
                      style={{ padding: '0.4rem', fontSize: '0.8rem', width: '55px' }}
                      value={goal.value}
                      onChange={(e) => handleGoalChange(goal.id, 'value', parseInt(e.target.value) || 0)}
                      min="0"
                      max="100"
                    />

                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>h de</span>

                    <select
                      className="form-control"
                      style={{ padding: '0.4rem', fontSize: '0.8rem', width: '100px' }}
                      value={goal.category}
                      onChange={(e) => handleGoalChange(goal.id, 'category', e.target.value)}
                    >
                      <option value="meetings">Reuniones</option>
                      <option value="development">Desarrollo</option>
                      <option value="documentation">Doc</option>
                    </select>

                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                      onClick={() => handleRemoveGoal(goal.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {goals.length > 0 ? (
                <button className="btn btn-primary" onClick={handleSaveGoals} style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                  <Save size={16} /> Guardar Metas del Sprint
                </button>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Aún no has agregado metas cuantitativas.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
