import React, { useState, useEffect } from 'react';
import { X, Clock, FileText } from 'lucide-react';

export default function LogHoursModal({ isOpen, onClose, dateString, logData, onSave }) {
  const [dev, setDev] = useState('');
  const [meetings, setMeetings] = useState('');
  const [doc, setDoc] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (logData) {
      setDev(logData.development || '');
      setMeetings(logData.meetings || '');
      setDoc(logData.documentation || '');
      setNotes(logData.notes || '');
    } else {
      setDev('');
      setMeetings('');
      setDoc('');
      setNotes('');
    }
  }, [logData, isOpen]);

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      date: dateString,
      development: parseFloat(dev) || 0,
      meetings: parseFloat(meetings) || 0,
      documentation: parseFloat(doc) || 0,
      notes: notes.trim()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close Modal">
          <X size={20} />
        </button>

        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} style={{ color: 'var(--primary)' }} /> Registrar Horas
        </h3>

        <div style={{ background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          Fecha: <strong style={{ textTransform: 'capitalize' }}>{formatDate(dateString)}</strong>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="hours-inputs-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-dev)' }} /> Dev (h)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                className="form-control"
                placeholder="0"
                value={dev}
                onChange={(e) => setDev(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-meetings)' }} /> Reunión (h)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                className="form-control"
                placeholder="0"
                value={meetings}
                onChange={(e) => setMeetings(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-doc)' }} /> Doc (h)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                className="form-control"
                placeholder="0"
                value={doc}
                onChange={(e) => setDoc(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText size={14} className="text-muted" /> Notas / Actividades del día
            </label>
            <textarea
              className="form-control"
              placeholder="¿En qué trabajaste hoy?"
              rows="3"
              style={{ resize: 'none' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
