import React from 'react';
import { Calendar, Plus, Clock } from 'lucide-react';

export default function SprintCalendar({ activeSprint, logs, currentUser, onOpenLogModal }) {
  
  const getSprintDays = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return [];
    
    const startParts = startDateStr.split('-');
    const endParts = endDateStr.split('-');
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    
    const days = [];
    const current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Incluimos lunes a viernes (1 a 5)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        days.push({
          dateString,
          dayName: current.toLocaleDateString('es-ES', { weekday: 'long' }),
          dayNum: current.getDate(),
          rawDate: new Date(current)
        });
      }
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const days = getSprintDays(activeSprint?.startDate, activeSprint?.endDate);

  // Agrupar días en semanas de 5 días hábiles
  const weeks = [];
  for (let i = 0; i < days.length; i += 5) {
    weeks.push(days.slice(i, i + 5));
  }

  // Calcular las horas de reunión de todo el equipo por día
  const teamMeetingsByDay = logs.reduce((acc, log) => {
    if (log.meetings > 0) {
      acc[log.date] = Math.max(acc[log.date] || 0, log.meetings);
    }
    return acc;
  }, {});

  // Filtrar logs del usuario actual
  const userLogs = logs.reduce((acc, log) => {
    if (log.userId === currentUser?.id) {
      acc[log.date] = log;
    }
    return acc;
  }, {});

  const todayStr = (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  return (
    <div className="glass-card calendar-container">
      <div className="calendar-header">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} style={{ color: 'var(--primary)' }} /> Calendario del Sprint
        </h2>
        <div className="text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Clock size={14} /> Selecciona un día para registrar tus horas
        </div>
      </div>

      {!activeSprint ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <h3>📅 No hay un Sprint activo.</h3>
          <p style={{ marginTop: '0.5rem' }}>Crea un Sprint en la pestaña de **Configuración** para comenzar a registrar horas.</p>
        </div>
      ) : !currentUser ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <h3>⚠️ Selecciona o crea un miembro de equipo en el panel lateral para registrar tus horas</h3>
        </div>
      ) : (
        <div className="calendar-weeks">
          {weeks.map((weekDays, weekIdx) => (
            <div key={weekIdx} className="week-row">
              <div className="week-title">Semana {weekIdx + 1}</div>
              <div className="days-grid">
                {weekDays.map(day => {
                  const sharedMeetings = teamMeetingsByDay[day.dateString] || 0;
                  const log = userLogs[day.dateString] 
                    ? { ...userLogs[day.dateString], meetings: Math.max(userLogs[day.dateString].meetings, sharedMeetings) }
                    : { development: 0, meetings: sharedMeetings, documentation: 0, notes: '', isSharedOnly: true };
                  const totalHours = log.development + log.meetings + log.documentation;
                  
                  const isToday = day.dateString === todayStr;

                  // Calcular porcentajes para la barra
                  const devPct = totalHours > 0 ? (log.development / totalHours) * 100 : 0;
                  const meetPct = totalHours > 0 ? (log.meetings / totalHours) * 100 : 0;
                  const docPct = totalHours > 0 ? (log.documentation / totalHours) * 100 : 0;

                  return (
                    <div 
                      key={day.dateString}
                      className={`day-card ${isToday ? 'is-today' : ''}`}
                      onClick={() => onOpenLogModal(day.dateString, log)}
                    >
                      <div className="day-header">
                        <span className="day-name">{day.dayName.split(' ')[0]}</span>
                        <span className="day-number">{day.dayNum}</span>
                      </div>

                      <div className="day-hours-sum">
                        {totalHours} <span>hrs</span>
                      </div>

                      {totalHours > 0 ? (
                        <>
                          <div className="hours-progress-bar">
                            {log.development > 0 && <div className="progress-segment segment-dev" style={{ width: `${devPct}%` }} />}
                            {log.meetings > 0 && <div className="progress-segment segment-meetings" style={{ width: `${meetPct}%` }} />}
                            {log.documentation > 0 && <div className="progress-segment segment-doc" style={{ width: `${docPct}%` }} />}
                          </div>

                          <div className="day-breakdown">
                            <div className="breakdown-row">
                              <span className="breakdown-label"><span className="breakdown-dot dot-dev" /> Dev</span>
                              <span className="breakdown-val">{log.development}h</span>
                            </div>
                            <div className="breakdown-row">
                              <span className="breakdown-label"><span className="breakdown-dot dot-meetings" /> Reunión</span>
                              <span className="breakdown-val">{log.meetings}h</span>
                            </div>
                            <div className="breakdown-row">
                              <span className="breakdown-label"><span className="breakdown-dot dot-doc" /> Doc</span>
                              <span className="breakdown-val">{log.documentation}h</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                          <Plus size={14} style={{ marginRight: '2px' }} /> Registrar
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
