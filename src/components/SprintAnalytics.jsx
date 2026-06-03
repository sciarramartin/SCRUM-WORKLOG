import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, AlertTriangle, Activity, ShieldAlert, Award } from 'lucide-react';

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

  // Promedios por persona para el sprint activo
  const avgDev = totals.development / activeUsersCount;
  const avgMeetings = totals.meetings / activeUsersCount;
  const avgDoc = totals.documentation / activeUsersCount;

  // Porcentajes del tiempo
  const devPct = totalHours > 0 ? (totals.development / totalHours) * 100 : 0;
  const meetPct = totalHours > 0 ? (totals.meetings / totalHours) * 100 : 0;
  const docPct = totalHours > 0 ? (totals.documentation / totalHours) * 100 : 0;

  // Contar cantidad de reuniones realizadas
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

  // --- CONSOLIDACIÓN DE TENDENCIAS FINALES ---
  const validSprints = sprints.filter(s => (s.velocity !== undefined && s.velocity > 0) || (s.errors !== undefined && s.errors > 0) || logs.some(l => l.sprintId === s.id));
  const totalSprints = validSprints.length;
  
  const avgVelocity = totalSprints > 0 
    ? (validSprints.reduce((acc, s) => acc + (s.velocity || 0), 0) / totalSprints) 
    : 0;
    
  const totalErrors = validSprints.reduce((acc, s) => acc + (s.errors || 0), 0);
  const avgErrors = totalSprints > 0 ? totalErrors / totalSprints : 0;

  // --- DISEÑO DE GRÁFICOS SVG ---
  
  // 1. Donut Chart para el tiempo del Sprint Activo
  const radius = 50;
  const circ = 2 * Math.PI * radius; // ~314.16
  const strokeWidth = 14;
  const center = 75;

  const devDash = (devPct / 100) * circ;
  const meetDash = (meetPct / 100) * circ;
  const docDash = (docPct / 100) * circ;

  // 2. Gráfico de Comparación de Sprints (Horas Promedio)
  const chartHeight = 160;
  const chartWidth = 450;
  const padX = 40;
  const padY = 20;

  // Máximo valor para escalar las barras de horas
  const maxHoursVal = Math.max(
    ...sprintHistory.map(sh => Math.max(sh.avgDev, sh.avgMeetings, sh.avgDoc)),
    8
  );

  // 3. Histograma de Tendencias (Velocidad vs Errores)
  const trendHeight = 180;
  const trendWidth = 560;
  const trendPadLeft = 45;
  const trendPadRight = 45;
  const trendPadY = 25;

  const maxVelocityVal = Math.max(...validSprints.map(s => s.velocity || 0), 10);
  const maxErrorsVal = Math.max(...validSprints.map(s => s.errors || 0), 5);

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
        {/* Distribución del Tiempo - Donut Chart SVG */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} style={{ color: 'var(--primary)' }} /> Distribución de Horas ({viewType === 'user' ? 'Mío' : 'Equipo'})
          </h4>
          
          <div className="svg-donut-chart" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '1rem 0' }}>
            {totalHours > 0 ? (
              <svg width={center * 2} height={center * 2} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                {/* Fondo */}
                <circle 
                  cx={center} cy={center} r={radius} 
                  fill="transparent" stroke="var(--bg-primary)" strokeWidth={strokeWidth} 
                />
                
                {/* Segmento Desarrollo (Azul) */}
                {devPct > 0 && (
                  <circle 
                    cx={center} cy={center} r={radius} 
                    fill="transparent" 
                    stroke="var(--color-dev)" 
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${devDash} ${circ}`}
                    strokeDashoffset={0}
                    strokeLinecap={devPct === 100 ? 'butt' : 'round'}
                  />
                )}

                {/* Segmento Reuniones (Ámbar) */}
                {meetPct > 0 && (
                  <circle 
                    cx={center} cy={center} r={radius} 
                    fill="transparent" 
                    stroke="var(--color-meetings)" 
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${meetDash} ${circ}`}
                    strokeDashoffset={-devDash}
                    strokeLinecap="round"
                  />
                )}

                {/* Segmento Documentación (Verde) */}
                {docPct > 0 && (
                  <circle 
                    cx={center} cy={center} r={radius} 
                    fill="transparent" 
                    stroke="var(--color-doc)" 
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${docDash} ${circ}`}
                    strokeDashoffset={-(devDash + meetDash)}
                    strokeLinecap="round"
                  />
                )}
                
                {/* Texto Central */}
                <g style={{ transform: `rotate(90deg) translate(0px, -${center * 2}px)`, transformOrigin: 'center' }}>
                  <text x={center} y={center - 5} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '1.25rem', fontWeight: 800, fill: 'var(--text-primary)' }}>
                    {totalHours.toFixed(0)}h
                  </text>
                  <text x={center} y={center + 12} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '0.75rem', fontWeight: 600, fill: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Registradas
                  </text>
                </g>
              </svg>
            ) : (
              <div style={{ width: center * 2, height: center * 2, borderRadius: '50%', border: '4px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                Sin datos cargados
              </div>
            )}

            {/* Desglose Numérico */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', minWidth: '150px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-dev)' }} />
                    Desarrollo
                  </span>
                  <span className="text-secondary" style={{ fontWeight: 700 }}>{devPct.toFixed(0)}%</span>
                </div>
                <span className="text-muted" style={{ fontSize: '0.75rem', paddingLeft: '1.1rem' }}>{totals.development.toFixed(1)} hrs</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-meetings)' }} />
                    Reuniones
                  </span>
                  <span className="text-secondary" style={{ fontWeight: 700 }}>{meetPct.toFixed(0)}%</span>
                </div>
                <span className="text-muted" style={{ fontSize: '0.75rem', paddingLeft: '1.1rem' }}>{totals.meetings.toFixed(1)} hrs</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-doc)' }} />
                    Documentación
                  </span>
                  <span className="text-secondary" style={{ fontWeight: 700 }}>{docPct.toFixed(0)}%</span>
                </div>
                <span className="text-muted" style={{ fontSize: '0.75rem', paddingLeft: '1.1rem' }}>{totals.documentation.toFixed(1)} hrs</span>
              </div>
            </div>
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
            <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <svg width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                  const y = padY + (1 - val) * (chartHeight - padY * 2);
                  const labelValue = (val * maxHoursVal).toFixed(0);
                  return (
                    <g key={idx}>
                      <line 
                        x1={padX} y1={y} x2={chartWidth} y2={y} 
                        stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" 
                      />
                      <text x={padX - 8} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: '0.7rem', fill: 'var(--text-muted)', fontWeight: 600 }}>
                        {labelValue}h
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {sprintHistory.map((sprint, sIdx) => {
                  const colWidth = (chartWidth - padX) / sprintHistory.length;
                  const xBase = padX + sIdx * colWidth;
                  
                  const barW = Math.min(10, colWidth / 4);
                  const spacing = 3;
                  
                  const devHeight = (sprint.avgDev / maxHoursVal) * (chartHeight - padY * 2);
                  const meetHeight = (sprint.avgMeetings / maxHoursVal) * (chartHeight - padY * 2);
                  const docHeight = (sprint.avgDoc / maxHoursVal) * (chartHeight - padY * 2);
                  
                  const baselineY = chartHeight - padY;

                  return (
                    <g key={sprint.id}>
                      {/* Desarrollo */}
                      <rect 
                        x={xBase + colWidth / 2 - barW * 1.5 - spacing} 
                        y={baselineY - devHeight} 
                        width={barW} 
                        height={devHeight} 
                        fill="var(--color-dev)"
                        rx="2"
                        title={`Dev: ${sprint.avgDev.toFixed(1)}h`}
                      />

                      {/* Reuniones */}
                      <rect 
                        x={xBase + colWidth / 2 - barW / 2} 
                        y={baselineY - meetHeight} 
                        width={barW} 
                        height={meetHeight} 
                        fill="var(--color-meetings)"
                        rx="2"
                        title={`Reunión: ${sprint.avgMeetings.toFixed(1)}h`}
                      />

                      {/* Documentación */}
                      <rect 
                        x={xBase + colWidth / 2 + barW / 2 + spacing} 
                        y={baselineY - docHeight} 
                        width={barW} 
                        height={docHeight} 
                        fill="var(--color-doc)"
                        rx="2"
                        title={`Doc: ${sprint.avgDoc.toFixed(1)}h`}
                      />
                      
                      {/* Label Eje X */}
                      <text 
                        x={xBase + colWidth / 2} 
                        y={chartHeight - 4} 
                        textAnchor="middle" 
                        style={{ fontSize: '0.7rem', fill: 'var(--text-primary)', fontWeight: 700 }}
                      >
                        {sprint.name.length > 8 ? sprint.name.substring(0, 7) + '..' : sprint.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Leyenda del gráfico */}
              <div className="chart-legend" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
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

      {/* --- INFORME FINAL DE TENDENCIAS Y CONCLUSIÓN DEL PROYECTO --- */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Activity size={22} style={{ color: 'var(--primary)' }} /> Informe de Tendencias y Cierre de Proyecto
          </h3>
          <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Consolidado histórico de desempeño del equipo. Las métricas de tendencias y calidad se compilan al final para evaluar el proyecto.
          </p>
        </div>

        {validSprints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No hay suficientes sprints finalizados o configurados con métricas de tendencias (Velocidad / Errores).
            Ingresa estos datos en la pestaña de **Configuración** de cada sprint.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'center' }}>
            
            {/* Panel de Resumen Consolidado */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
                  <Award size={24} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Velocidad Promedio</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800 }}>{avgVelocity.toFixed(1)} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>pts/sprint</span></span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}>
                  <ShieldAlert size={24} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Errores Consolidados</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger)' }}>{totalErrors} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>errores</span></span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <h5 style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={16} style={{ color: 'var(--success)' }} /> Conclusión de Calidad
                </h5>
                <p className="text-secondary" style={{ lineHeight: '1.4' }}>
                  {avgErrors > 0 ? (
                    avgVelocity / avgErrors > 2 ? (
                      '✅ Tendencia Saludable: El equipo mantiene una velocidad sólida y un volumen de errores controlado por sprint.'
                    ) : (
                      '⚠️ Foco en Calidad: El promedio de errores por sprint es alto en relación con la velocidad. Se recomienda revisar pruebas automatizadas.'
                    )
                  ) : (
                    '💎 Calidad Impecable: No se han registrado errores a lo largo de los sprints.'
                  )}
                </p>
              </div>
            </div>

            {/* Histograma Consolidado (Double Axis SVG Chart) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
                <span>📊 Tendencia de Estabilidad (Story Points vs Bug Rate)</span>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '12px', height: '6px', backgroundColor: 'var(--primary)', borderRadius: '2px' }} /> Velocidad
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)' }}>
                    <span style={{ width: '12px', height: '2px', backgroundColor: 'var(--danger)', display: 'inline-block' }} /> Errores
                  </span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <svg width="100%" height={trendHeight} style={{ overflow: 'visible' }}>
                  
                  {/* Grid Lines Horizontales */}
                  {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                    const y = trendPadY + (1 - val) * (trendHeight - trendPadY * 2);
                    return (
                      <line 
                        key={idx}
                        x1={trendPadLeft} y1={y} x2={trendWidth - trendPadRight} y2={y} 
                        stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" 
                      />
                    );
                  })}

                  {/* Ejes y Etiquetas laterales (Velocidad e Izquierda) */}
                  <text x={trendPadLeft - 8} y={trendPadY} textAnchor="end" style={{ fontSize: '0.65rem', fill: 'var(--primary)', fontWeight: 700 }}>
                    {maxVelocityVal} SP
                  </text>
                  <text x={trendPadLeft - 8} y={trendHeight - trendPadY} textAnchor="end" style={{ fontSize: '0.65rem', fill: 'var(--primary)', fontWeight: 700 }}>
                    0 SP
                  </text>

                  {/* Ejes y Etiquetas laterales (Errores y Derecha) */}
                  <text x={trendWidth - trendPadRight + 8} y={trendPadY} textAnchor="start" style={{ fontSize: '0.65rem', fill: 'var(--danger)', fontWeight: 700 }}>
                    {maxErrorsVal} Err
                  </text>
                  <text x={trendWidth - trendPadRight + 8} y={trendHeight - trendPadY} textAnchor="start" style={{ fontSize: '0.65rem', fill: 'var(--danger)', fontWeight: 700 }}>
                    0 Err
                  </text>

                  {/* Barras de Velocidad e Histograma */}
                  {validSprints.map((sprint, idx) => {
                    const colWidth = (trendWidth - trendPadLeft - trendPadRight) / validSprints.length;
                    const xBase = trendPadLeft + idx * colWidth;
                    
                    const barW = Math.min(30, colWidth * 0.6);
                    const velHeight = ((sprint.velocity || 0) / maxVelocityVal) * (trendHeight - trendPadY * 2);
                    const baselineY = trendHeight - trendPadY;

                    return (
                      <g key={sprint.id}>
                        {/* Barra de Velocidad */}
                        <rect
                          x={xBase + colWidth / 2 - barW / 2}
                          y={baselineY - velHeight}
                          width={barW}
                          height={velHeight}
                          fill="var(--primary)"
                          opacity="0.8"
                          rx="4"
                        />
                        <text
                          x={xBase + colWidth / 2}
                          y={baselineY - velHeight - 5}
                          textAnchor="middle"
                          style={{ fontSize: '0.7rem', fill: 'var(--primary)', fontWeight: 800 }}
                        >
                          {sprint.velocity || 0}
                        </text>

                        {/* Label de Sprint abajo */}
                        <text
                          x={xBase + colWidth / 2}
                          y={trendHeight - 6}
                          textAnchor="middle"
                          style={{ fontSize: '0.65rem', fill: 'var(--text-secondary)', fontWeight: 600 }}
                        >
                          {sprint.name.length > 10 ? sprint.name.substring(0, 9) + '..' : sprint.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* Línea de Errores Detectados (Superpuesta) */}
                  {(() => {
                    const points = validSprints.map((sprint, idx) => {
                      const colWidth = (trendWidth - trendPadLeft - trendPadRight) / validSprints.length;
                      const xBase = trendPadLeft + idx * colWidth;
                      const x = xBase + colWidth / 2;
                      const errHeight = ((sprint.errors || 0) / maxErrorsVal) * (trendHeight - trendPadY * 2);
                      const y = trendHeight - trendPadY - errHeight;
                      return { x, y, errors: sprint.errors || 0 };
                    });

                    if (points.length === 0) return null;

                    // Crear string de ruta SVG
                    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                    return (
                      <g>
                        {points.length > 1 && (
                          <path 
                            d={linePath} 
                            fill="none" 
                            stroke="var(--danger)" 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                          />
                        )}
                        {points.map((p, idx) => (
                          <g key={idx}>
                            <circle 
                              cx={p.x} cy={p.y} r="5" 
                              fill="var(--bg-secondary)" 
                              stroke="var(--danger)" 
                              strokeWidth="3" 
                            />
                            <text
                              x={p.x}
                              y={p.y - 8}
                              textAnchor="middle"
                              style={{ fontSize: '0.7rem', fill: 'var(--danger)', fontWeight: 800 }}
                            >
                              {p.errors}
                            </text>
                          </g>
                        ))}
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
