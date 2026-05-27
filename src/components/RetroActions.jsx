import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { fetchRetroActions, saveRetroAction, deleteRetroAction } from '../utils/api';

export default function RetroActions({ activeSprint }) {
  const [actions, setActions] = useState([]);
  const [newActionText, setNewActionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingResultId, setEditingResultId] = useState(null);
  const [resultText, setResultText] = useState('');

  const loadActions = async () => {
    if (!activeSprint) return;
    setLoading(true);
    try {
      const data = await fetchRetroActions(activeSprint.id);
      setActions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, [activeSprint]);

  const handleAddAction = async (e) => {
    e.preventDefault();
    if (!newActionText.trim() || !activeSprint) return;
    try {
      const newAction = await saveRetroAction({
        sprintId: activeSprint.id,
        action: newActionText.trim(),
        status: 'pending',
        result: ''
      });
      setActions([...actions, newAction]);
      setNewActionText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (action) => {
    const nextStatus = action.status === 'done' ? 'in-progress' : 'done';
    try {
      const updated = await saveRetroAction({
        ...action,
        status: nextStatus,
        // Si se marca como done y no tiene resultado, abrir editor de resultado
        result: nextStatus === 'done' ? action.result || 'Acción completada con éxito.' : action.result
      });
      setActions(actions.map(a => a.id === action.id ? updated : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveResult = async (action) => {
    try {
      const updated = await saveRetroAction({
        ...action,
        result: resultText
      });
      setActions(actions.map(a => a.id === action.id ? updated : a));
      setEditingResultId(null);
      setResultText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta acción del plan?')) return;
    try {
      await deleteRetroAction(id);
      setActions(actions.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!activeSprint) {
    return (
      <div className="glass-card retro-section" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <h3>📋 No hay un Sprint activo.</h3>
        <p style={{ marginTop: '0.5rem' }}>Crea un Sprint en la pestaña de **Configuración** para comenzar a planificar la retrospectiva.</p>
      </div>
    );
  }

  return (
    <div className="glass-card retro-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckSquare size={20} style={{ color: 'var(--primary)' }} /> Plan de Acción del Retrospective
        </h2>
        <span className="badge badge-primary">Sprint Activo: {activeSprint?.name}</span>
      </div>

      <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
        Registra aquí los compromisos pactados por el equipo en la retrospective del sprint anterior. 
        Mide su efectividad al final de este sprint agregando el resultado observado.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando acciones...</div>
      ) : (
        <div className="action-items-list">
          {actions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
              <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
              No hay acciones registradas para este sprint.
            </div>
          ) : (
            actions.map(action => (
              <div key={action.id} className="action-item-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div className="action-item-content">
                    <div 
                      className={`action-checkbox ${action.status === 'done' ? 'checked' : ''}`}
                      onClick={() => handleToggleStatus(action)}
                    >
                      {action.status === 'done' && '✓'}
                    </div>
                    <span className={`action-text ${action.status === 'done' ? 'completed' : ''}`}>
                      {action.action}
                    </span>
                  </div>

                  <div className="action-meta">
                    <span className={`badge ${
                      action.status === 'done' ? 'badge-success' : 
                      action.status === 'in-progress' ? 'badge-warning' : 'badge-primary'
                    }`}>
                      {action.status === 'done' ? 'Completado' : 
                       action.status === 'in-progress' ? 'En Proceso' : 'Pendiente'}
                    </span>
                    <button className="btn-icon" style={{ width: '32px', height: '32px' }} onClick={() => handleDelete(action.id)}>
                      <Trash2 size={14} className="text-danger" />
                    </button>
                  </div>
                </div>

                {/* Sección de Resultados */}
                <div style={{ marginTop: '0.75rem', paddingLeft: '2rem', borderLeft: '2px solid var(--border-color)', fontSize: '0.85rem' }}>
                  {editingResultId === action.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        style={{ padding: '0.4rem 0.6rem', flexGrow: 1, fontSize: '0.85rem' }}
                        value={resultText}
                        onChange={(e) => setResultText(e.target.value)}
                        placeholder="Describe el resultado (ej. Redujimos un 15% las reuniones)"
                      />
                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleSaveResult(action)}>
                        Guardar
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setEditingResultId(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span className="text-secondary">
                        <strong>Resultado / Impacto:</strong> {action.result || <em className="text-muted">Sin registrar impacto aún...</em>}
                      </span>
                      {action.status === 'done' && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '2px 6px', fontSize: '0.75rem', gap: '2px', marginLeft: '1rem' }}
                          onClick={() => {
                            setEditingResultId(action.id);
                            setResultText(action.result || '');
                          }}
                        >
                          <Edit2 size={10} /> Registrar Impacto
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Formulario de Nueva Acción */}
      <form onSubmit={handleAddAction} className="action-input-group">
        <input 
          type="text" 
          className="form-control" 
          placeholder="Ej. Reducir reuniones de refinamiento a 45 min..."
          value={newActionText}
          onChange={(e) => setNewActionText(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary">
          <Plus size={16} /> Agregar Acción
        </button>
      </form>
    </div>
  );
}
