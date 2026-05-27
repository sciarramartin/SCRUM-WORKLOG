import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SprintAnalytics({ sprints, activeSprint, logs, users, currentUser }) {
  const [viewType, setViewType] = useState('team'); // 'user' o 'team'

  // Filtrar logs por el sprint activo
  const activeSprintLogs = logs.filter(l => l.sprintId === activeSprint?.id);
  
  // Filtrar logs según selección (usuario actual o equipo entero)
  const filteredLogs = viewType === 'user'
    ? activeSprintLogs.filter(l => l.userId === currentUser?.id)
    : activeSprintLogs;

  // Calcular totales del sprint actual
  const totals = filteredLogs.reduce((acc, log) => {
    acc.development += log.development;
    acc.meetings += log.meetings;
    acc.documentation += log.documentation;
    return acc;
  }, { development: 0, meetings: 0, documentation: 0 });

  const totalHours = totals.development + totals.meetings + totals.documentation;

  // Obtener cantidad de personas que registraron horas
  const activeUsersCount = viewType === 'user' ? 1 : new Set(activeSprintLogs.map(l => l.userId)).size || 1;

  // Promedios por persona (para comparar de forma justa entre sprints de distinto tamaño de equipo)
  const avgDev = totals.development / activeUsersCount;
  const avgMeetings = totals.meetings / activeUsersCount;
  const avgDoc = totals.documentation / activeUsersCount;
  const avgTotal = totalHours / activeUsersCount;

  // Porcentajes del tiempo
  const devPct = totalHours > 0 ? (totals.development / totalHours) * 100 : 0;
  const meetPct = totalHours > 0 ? (totals.meetings / totalHours) * 100 : 0;
  const docPct = totalHours > 0 ? (totals.documentation / totalHours) * 100 : 0;

  // Contar cantidad de reuniones realizadas (días distintos con reuniones registradas > 0)
  const meetingDays = new Set(
    filteredLogs
      .filter(log => log.meetings > 0)
      .map(log => log.date)
  );
  const meetingCount = meetingDays.size;

  // --- CÁLCULOS COMPARATIVOS HISTÓRICOS ---
  // Calcular promedios por persona para todos los sprints
  const sprintHistory = sprints.map(sprint => {
    const sprintLogs = logs.filter(l => l.sprintId === sprint.id);
    const sprintUsersCount = new Set(sprintLogs.map(l => l.userId)).size || 1;
    
    const sprintTotals = sprintLogs.reduce((acc, log) => {
      acc.development += log.development;
      acc.meetings += log.meetings;
      acc.documentation += log.documentation;
      return acc;
    }, { development: 0, meetings: 0, documentation: 0 });

    const total = sprintTotals.development + sprintTotals.meetings + sprintTotals.documentation;

    return {
      id: sprint.id,
      name: sprint.name,
      avgDev: sprintTotals.development / sprintUsersCount,
      avgMeetings: sprintTotals.meetings / sprintUsersCount,
      avgDoc: sprintTotals.documentation / sprintUsersCount,
      avgTotal: total / sprintUsersCount
    };
  });

  // --- EVALUAR METAS DEL SPRINT ACTIVO ---
  const evaluatedGoals = (activeSprint?.goals || []).map(goal => {
    let currentValue = 0;
    // Si la meta es grupal o individual, evaluamos según la vista seleccionada
    // Pero la retrospectiva usualmente mide el promedio del equipo
    const targetVal = goal.value;
    
    if (goal.category === 'meetings') currentValue = avgMeetings;
    else if (goal.category === 'development') currentValue = avgDev;
    else if (goal.category === 'documentation') currentValue = avgDoc;

    let isMet = false;
    if (goal.type === 'max') {
      isMet = currentValue <= targetVal;
    } else {
      isMet = currentValue >= targetVal;
    }

    return {
      ...goal,
      currentValue,
      isMet
    };
  });

  // SVG Chart Dimensions
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;

  if (!activeSprint) {
    return (
      <div className="metrics-section">
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <h3>📊 No hay un Sprint activo.</h3>
          <p style={{ marginTop: '0.5rem' }}>Crea un Sprint en la pestaña de **Configuración** para comenzar a ver estadísticas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-section">
      {/* Selector de tipo de reporte */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={18} className="text-muted" /> Análisis y Métricas
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${viewType === 'user' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            onClick={() => setViewType('user')}
            disabled={!currentUser}
          >
            Mis Métricas {!currentUser && '(Selecciona usuario)'}
          </button>
          <button 
            className={`btn ${viewType === 'team' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            onClick={() => setViewType('team')}
          >
            Métricas del Equipo
          </button>
        </div>
      </div>

      {/* Fila de Tarjetas Estadísticas */}
      <div className="stat-card-group">
        <div className="stat-card">
          <span className="stat-label">Suma Desarrollo</span>
          <span className="stat-value" style={{ color: 'var(--color-dev)' }}>
            {totals.development.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 500 }}>hrs</span>
          </span>
          <span className="stat-sub">
            {viewType === 'user' ? 'Mis horas totales' : `Promedio: ${avgDev.toFixed(1)}h / pers`}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Suma Reuniones</span>
          <span className="stat-value" style={{ color: 'var(--color-meetings)' }}>
            {totals.meetings.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 500 }}>hrs</span>
          </span>
          <span className="stat-sub">
            {viewType === 'user' ? 'Mis horas totales' : `Promedio: ${avgMeetings.toFixed(1)}h / pers`}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Suma Documentación</span>
          <span className="stat-value" style={{ color: 'var(--color-doc)' }}>
            {totals.documentation.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 500 }}>hrs</span>
          </span>
          <span className="stat-sub">
            {viewType === 'user' ? 'Mis horas totales' : `Promedio: ${avgDoc.toFixed(1)}h / pers`}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Reuniones Realizadas</span>
          <span className="stat-value" style={{ color: 'var(--color-other)' }}>
            {meetingCount} <span style={{ fontSize: '1rem', fontWeight: 500 }}>{meetingCount === 1 ? 'reunión' : 'reuniones'}</span>
          </span>
          <span className="stat-sub">
            {viewType === 'user' ? 'En las que participé' : 'Totales en el sprint'}
          </span>
        </div>
      </div>

      <div className="metrics-row-1">
        {/* Distribución y Metas */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} style={{ color: 'var(--primary)' }} /> Distribución del Tiempo ({viewType === 'user' ? 'Mío' : 'Equipo'})
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-dev)' }} />
                  Desarrollo
                </span>
                <span className="text-muted">{totals.development.toFixed(1)}h ({devPct.toFixed(0)}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${devPct}%`, height: '100%', background: 'var(--color-dev)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-meetings)' }} />
                  Reuniones
                </span>
                <span className="text-muted">{totals.meetings.toFixed(1)}h ({meetPct.toFixed(0)}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${meetPct}%`, height: '100%', background: 'var(--color-meetings)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-doc)' }} />
                  Documentación
                </span>
                <span className="text-muted">{totals.documentation.toFixed(1)}h ({docPct.toFixed(0)}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${docPct}%`, height: '100%', background: 'var(--color-doc)', borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <h5 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Estado de las Metas del Retrospective:</h5>
            {evaluatedGoals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {evaluatedGoals.map((goal, idx) => (
                  <div 
                    key={goal.id || idx}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.5rem 0.75rem', 
                      background: 'var(--bg-primary)', 
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{goal.text}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Meta: {goal.type === 'max' ? 'Max' : 'Min'} {goal.value}h | Actual: {goal.currentValue.toFixed(1)}h (Promedio)
                      </div>
                    </div>
                    {goal.isMet ? (
                      <span className="badge badge-success" style={{ gap: '2px' }}><CheckCircle size={12} /> Cumplida</span>
                    ) : (
                      <span className="badge badge-danger" style={{ gap: '2px' }}><AlertTriangle size={12} /> Incumplida</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem', textAlign: 'center' }}>
                Configura metas en el Administrador de Sprints para ver su avance aquí.
              </div>
            )}
          </div>
        </div>

        {/* Comparativa Histórica de Sprints */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} style={{ color: 'var(--primary)' }} /> Comparación de Sprints (Promedio por Persona)
          </h4>

          {sprintHistory.length === 0 ? (
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No hay suficientes datos históricos.
            </div>
          ) : (
            <div className="chart-container" style={{ justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '180px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                
                {sprintHistory.map((sprint, sIdx) => {
                  const maxVal = Math.max(...sprintHistory.map(sh => sh.avgTotal), 10);
                  const devHeight = (sprint.avgDev / maxVal) * 120;
                  const meetHeight = (sprint.avgMeetings / maxVal) * 120;
                  const docHeight = (sprint.avgDoc / maxVal) * 120;
                  
                  return (
                    <div key={sprint.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px', gap: '0.5rem' }}>
                      {/* Barras Apiladas */}
                      <div style={{ display: 'flex', flexDirection: 'column-reverse', height: '120px', width: '28px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ height: `${devHeight}px`, width: '100%', background: 'var(--color-dev)' }} title={`Dev: ${sprint.avgDev.toFixed(1)}h`} />
                        <div style={{ height: `${meetHeight}px`, width: '100%', background: 'var(--color-meetings)' }} title={`Reunión: ${sprint.avgMeetings.toFixed(1)}h`} />
                        <div style={{ height: `${docHeight}px`, width: '100%', background: 'var(--color-doc)' }} title={`Doc: ${sprint.avgDoc.toFixed(1)}h`} />
                      </div>
                      
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sprint.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Leyenda del gráfico */}
              <div className="chart-legend" style={{ justifyContent: 'center' }}>
                <div className="legend-item">
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-dev)' }} />
                  Desarrollo
                </div>
                <div className="legend-item">
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-meetings)' }} />
                  Reuniones
                </div>
                <div className="legend-item">
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-doc)' }} />
                  Documentación
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
