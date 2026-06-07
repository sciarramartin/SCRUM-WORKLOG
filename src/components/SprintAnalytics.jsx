import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, AlertTriangle, Activity, ShieldAlert, Award, ArrowUpRight, Flame, Info, Download, FileText, Maximize2 } from 'lucide-react';

export default function SprintAnalytics({ sprints, activeSprint, logs, users, currentUser }) {
  const [viewType, setViewType] = useState('team'); // 'user' o 'team'
  const [expandedChart, setExpandedChart] = useState(null);

  // Escuchar la tecla escape para cerrar el gráfico ampliado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setExpandedChart(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  // Filtrar logs por el sprint activo
  const activeSprintLogs = logs.filter(l => l.sprintId === activeSprint?.id);
  
  // Filtrar logs según selección (usuario actual o equipo entero)
  const filteredLogs = viewType === 'user'
    ? activeSprintLogs.filter(l => l.userId === currentUser?.id)
    : activeSprintLogs;

  // Calcular las horas de reunión de todo el equipo por día en el activeSprint
  const activeSprintMeetingsByDay = activeSprintLogs.reduce((acc, log) => {
    if (log.meetings > 0) {
      acc[log.date] = Math.max(acc[log.date] || 0, log.meetings);
    }
    return acc;
  }, {});
  const activeSprintMeetingsSum = Object.values(activeSprintMeetingsByDay).reduce((sum, val) => sum + val, 0);

  // Calcular totales del sprint activo
  const totals = filteredLogs.reduce((acc, log) => {
    acc.development += log.development;
    if (viewType === 'user') {
      acc.meetings += log.meetings;
    }
    acc.documentation += log.documentation;
    return acc;
  }, { development: 0, meetings: 0, documentation: 0 });

  if (viewType === 'team') {
    totals.meetings = activeSprintMeetingsSum;
  }

  const totalHours = totals.development + totals.meetings + totals.documentation;

  // Obtener cantidad de personas que registraron horas
  const activeUsersCount = viewType === 'user' ? 1 : new Set(activeSprintLogs.map(l => l.userId)).size || 1;

  // Promedios por persona para el sprint activo
  const avgDev = totals.development / activeUsersCount;
  const avgMeetings = viewType === 'user' ? totals.meetings : activeSprintMeetingsSum;
  const avgDoc = totals.documentation / activeUsersCount;

  // Porcentajes del tiempo
  const devPct = totalHours > 0 ? (totals.development / totalHours) * 100 : 0;
  const meetPct = totalHours > 0 ? (totals.meetings / totalHours) * 100 : 0;
  const docPct = totalHours > 0 ? (totals.documentation / totalHours) * 100 : 0;

  // --- FOCUS SCORE ---
  const managementHours = totals.meetings + totals.documentation;
  const focusScore = managementHours > 0 
    ? totals.development / managementHours 
    : totals.development > 0 ? Infinity : 0;

  // --- REUNIONES DEL SPRINT ---
  const meetingDates = new Set(
    activeSprintLogs
      .filter(log => log.meetings > 0)
      .map(log => log.date)
  );
  const meetingCount = meetingDates.size;

  // --- CÁLCULO DE CAPACIDAD DEL EQUIPO ---
  const getSprintBusinessDaysCount = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return 0;
    const startParts = startDateStr.split('-');
    const endParts = endDateStr.split('-');
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const businessDaysCount = getSprintBusinessDaysCount(activeSprint?.startDate, activeSprint?.endDate);
  // Capacidad por persona * miembros activos * días hábiles
  const capacityHoursPerMember = (activeSprint?.capacity || 6) * businessDaysCount;
  const teamCapacityHours = capacityHoursPerMember * activeUsersCount;
  
  // Para la capacidad del equipo, comparamos contra la suma total de horas individuales (para no desvirtuar la capacidad consumida de cada miembro)
  const capacityNumerator = viewType === 'user'
    ? totalHours
    : activeSprintLogs.reduce((sum, log) => sum + log.development + log.meetings + log.documentation, 0);
  const capacityPercentage = teamCapacityHours > 0 ? (capacityNumerator / teamCapacityHours) * 100 : 0;

  // --- CÁLCULOS COMPARATIVOS HISTÓRICOS ---
  const sprintHistory = sprints.map(sprint => {
    const sprintLogs = logs.filter(l => l.sprintId === sprint.id);
    const sprintUsersCount = new Set(sprintLogs.map(l => l.userId)).size || 1;
    
    const sprintTotals = sprintLogs.reduce((acc, log) => {
      acc.development += log.development;
      acc.documentation += log.documentation;
      return acc;
    }, { development: 0, documentation: 0 });

    const sprintMeetingsByDay = sprintLogs.reduce((acc, log) => {
      if (log.meetings > 0) {
        acc[log.date] = Math.max(acc[log.date] || 0, log.meetings);
      }
      return acc;
    }, {});
    const sprintMeetingsSum = Object.values(sprintMeetingsByDay).reduce((sum, val) => sum + val, 0);

    const avgDevVal = sprintTotals.development / sprintUsersCount;
    const avgDocVal = sprintTotals.documentation / sprintUsersCount;
    const avgMeetingsVal = sprintMeetingsSum;
    const avgTotalVal = avgDevVal + avgMeetingsVal + avgDocVal;

    return {
      id: sprint.id,
      name: sprint.name,
      avgDev: avgDevVal,
      avgMeetings: avgMeetingsVal,
      avgDoc: avgDocVal,
      avgTotal: avgTotalVal
    };
  });

  const visibleHistory = sprintHistory.slice(-6);

  // --- DATOS DEL BURN-DOWN CHART ---
  const businessDaysList = [];
  if (activeSprint?.startDate && activeSprint?.endDate) {
    const startParts = activeSprint.startDate.split('-');
    const endParts = activeSprint.endDate.split('-');
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    const current = new Date(start);
    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      businessDaysList.push(`${year}-${month}-${day}`);
      current.setDate(current.getDate() + 1);
    }
  }

  let cumulativeLogged = 0;
  const burnDownData = businessDaysList.map((dateStr, idx) => {
    const dayLogs = activeSprintLogs.filter(l => l.date === dateStr);
    const dayHours = dayLogs.reduce((sum, l) => sum + l.development + l.meetings + l.documentation, 0);
    cumulativeLogged += dayHours;
    
    const idealRemaining = Math.max(0, teamCapacityHours * (1 - idx / Math.max(1, businessDaysList.length - 1)));
    const realRemaining = Math.max(0, teamCapacityHours - cumulativeLogged);
    
    return {
      dayIndex: idx + 1,
      dateStr,
      ideal: idealRemaining,
      real: realRemaining
    };
  });

  // Encontrar el último índice de día que tiene horas registradas para no pintar la caída a cero en días futuros
  const lastLoggedDayIndex = burnDownData.reduce((lastIdx, d, idx) => {
    const hasLogs = activeSprintLogs.some(l => l.date === d.dateStr);
    return hasLogs ? idx : lastIdx;
  }, 0);
  
  const realPoints = burnDownData.slice(0, lastLoggedDayIndex + 1);

  // --- CONSOLIDACIÓN DE TENDENCIAS FINALES ---
  const validSprints = sprints.filter(s => (s.velocity !== undefined && s.velocity > 0) || (s.errors !== undefined && s.errors > 0) || logs.some(l => l.sprintId === s.id));
  const totalSprints = validSprints.length;
  
  const avgVelocity = totalSprints > 0 
    ? (validSprints.reduce((acc, s) => acc + (s.velocity || 0), 0) / totalSprints) 
    : 0;
    
  const totalErrors = validSprints.reduce((acc, s) => acc + (s.errors || 0), 0);
  const avgErrors = totalSprints > 0 ? totalErrors / totalSprints : 0;

  const visibleTrends = validSprints.slice(-6);

  // --- DISEÑO DE GRÁFICOS SVG ---

  // Máximo valor para escalar las barras de horas
  const maxHoursVal = Math.max(
    ...visibleHistory.map(sh => Math.max(sh.avgDev, sh.avgMeetings, sh.avgDoc)),
    8
  );

  const maxVelocityVal = Math.max(...visibleTrends.map(s => s.velocity || 0), 10);
  const maxErrorsVal = Math.max(...visibleTrends.map(s => s.errors || 0), 5);

  const estimatedSp = activeSprint?.estimatedSp || 0;
  const realSp = activeSprint?.velocity || 0;
  const predictability = estimatedSp > 0 ? (realSp / estimatedSp) * 100 : 0;

  // Funciones de renderizado para los gráficos (soporta zoom a pantalla completa)

  const renderDistributionChart = (isExpanded = false) => {
    const r = isExpanded ? 100 : 50;
    const c = 2 * Math.PI * r; 
    const sw = isExpanded ? 24 : 12;
    const ctr = isExpanded ? 150 : 75;

    const devDash = (devPct / 100) * c;
    const meetDash = (meetPct / 100) * c;
    const docDash = (docPct / 100) * c;

    return (
      <div 
        className={isExpanded ? "" : "glass-card zoomable-chart-card"} 
        onClick={isExpanded ? null : () => setExpandedChart('distribution')}
        style={isExpanded ? {} : { display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {!isExpanded && (
          <button 
            className="chart-zoom-btn" 
            onClick={(e) => { e.stopPropagation(); setExpandedChart('distribution'); }}
            aria-label="Expandir gráfico"
            title="Expandir gráfico"
          >
            <Maximize2 size={14} />
          </button>
        )}
        <h4 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isExpanded ? '1.2rem' : '0.9rem', paddingRight: isExpanded ? '0' : '2.5rem' }}>
          <TrendingUp size={isExpanded ? 18 : 14} /> Distribución de Horas ({viewType === 'user' ? 'Mío' : 'Equipo'})
          {!isExpanded && (
            <span className="tooltip tooltip-right">
              <Info size={20} className="info-icon" />
              <span className="tooltiptext">Muestra cómo se reparte el tiempo del sprint. Te ayuda a ver de un vistazo si hay sobrecarga de reuniones o documentación.</span>
            </span>
          )}
        </h4>
        
        <div className="svg-donut-chart" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0.5rem 0', gap: isExpanded ? '3rem' : '0px', flexWrap: 'wrap' }}>
          {totalHours > 0 ? (
            <svg width={ctr * 2} height={ctr * 2} style={{ overflow: 'visible' }}>
              {/* Fondo */}
              <circle 
                cx={ctr} cy={ctr} r={r} 
                fill="transparent" stroke="var(--border-color)" strokeWidth={sw} 
              />
              
              {/* Segmento Desarrollo */}
              {devPct > 0 && (
                <circle 
                  cx={ctr} cy={ctr} r={r} 
                  fill="transparent" 
                  stroke="var(--color-dev)" 
                  strokeWidth={sw}
                  strokeDasharray={`${devDash} ${c}`}
                  strokeDashoffset={0}
                  strokeLinecap={devPct === 100 ? 'butt' : 'round'}
                  transform={`rotate(-90 ${ctr} ${ctr})`}
                />
              )}

              {/* Segmento Reuniones */}
              {meetPct > 0 && (
                <circle 
                  cx={ctr} cy={ctr} r={r} 
                  fill="transparent" 
                  stroke="var(--color-meetings)" 
                  strokeWidth={sw}
                  strokeDasharray={`${meetDash} ${c}`}
                  strokeDashoffset={-devDash}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${ctr} ${ctr})`}
                />
              )}

              {/* Segmento Documentación */}
              {docPct > 0 && (
                <circle 
                  cx={ctr} cy={ctr} r={r} 
                  fill="transparent" 
                  stroke="var(--color-doc)" 
                  strokeWidth={sw}
                  strokeDasharray={`${docDash} ${c}`}
                  strokeDashoffset={-(devDash + meetDash)}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${ctr} ${ctr})`}
                />
              )}
              
              {/* Texto Central */}
              <g>
                <text x={ctr} y={ctr - (isExpanded ? 6 : 3)} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: isExpanded ? '2rem' : '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 700, fill: 'var(--text-primary)' }}>
                  {totalHours.toFixed(0)}h
                </text>
                <text x={ctr} y={ctr + (isExpanded ? 24 : 14)} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: isExpanded ? '0.9rem' : '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 600, fill: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Total
                </text>
              </g>
            </svg>
          ) : (
            <div style={{ width: ctr * 2, height: ctr * 2, borderRadius: '50%', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isExpanded ? '1.1rem' : '0.8rem', color: 'var(--text-muted)' }}>
              Sin registros
            </div>
          )}

          {/* Desglose Numérico */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isExpanded ? '1.2rem' : '0.6rem', minWidth: isExpanded ? '200px' : '150px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isExpanded ? '1.1rem' : '0.8rem', marginBottom: '0.1rem' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: isExpanded ? '12px' : '8px', height: isExpanded ? '12px' : '8px', borderRadius: '50%', backgroundColor: 'var(--color-dev)' }} />
                  Desarrollo
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{devPct.toFixed(0)}%</span>
              </div>
              <span className="text-secondary" style={{ fontSize: isExpanded ? '0.95rem' : '0.7rem', paddingLeft: isExpanded ? '1.5rem' : '1rem', fontFamily: 'var(--font-mono)' }}>{totals.development.toFixed(1)} hrs</span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isExpanded ? '1.1rem' : '0.8rem', marginBottom: '0.1rem' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: isExpanded ? '12px' : '8px', height: isExpanded ? '12px' : '8px', borderRadius: '50%', backgroundColor: 'var(--color-meetings)' }} />
                  Reuniones
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{meetPct.toFixed(0)}%</span>
              </div>
              <span className="text-secondary" style={{ fontSize: isExpanded ? '0.95rem' : '0.7rem', paddingLeft: isExpanded ? '1.5rem' : '1rem', fontFamily: 'var(--font-mono)' }}>{totals.meetings.toFixed(1)} hrs</span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isExpanded ? '1.1rem' : '0.8rem', marginBottom: '0.1rem' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: isExpanded ? '12px' : '8px', height: isExpanded ? '12px' : '8px', borderRadius: '50%', backgroundColor: 'var(--color-doc)' }} />
                  Documentación
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{docPct.toFixed(0)}%</span>
              </div>
              <span className="text-secondary" style={{ fontSize: isExpanded ? '0.95rem' : '0.7rem', paddingLeft: isExpanded ? '1.5rem' : '1rem', fontFamily: 'var(--font-mono)' }}>{totals.documentation.toFixed(1)} hrs</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderComparisonChart = (isExpanded = false) => {
    const cHeight = isExpanded ? 350 : 160;
    const cWidth = isExpanded ? 800 : 450;
    const px = isExpanded ? 60 : 40;
    const py = isExpanded ? 30 : 20;

    return (
      <div 
        className={isExpanded ? "" : "glass-card zoomable-chart-card"} 
        onClick={isExpanded ? null : () => setExpandedChart('comparison')}
        style={isExpanded ? {} : { display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {!isExpanded && (
          <button 
            className="chart-zoom-btn" 
            onClick={(e) => { e.stopPropagation(); setExpandedChart('comparison'); }}
            aria-label="Expandir gráfico"
            title="Expandir gráfico"
          >
            <Maximize2 size={14} />
          </button>
        )}
        <h4 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isExpanded ? '1.2rem' : '0.9rem', paddingRight: isExpanded ? '0' : '2.5rem' }}>
          <TrendingUp size={isExpanded ? 18 : 14} /> Comparación de Sprints (Promedio por Persona)
          {!isExpanded && (
            <span className="tooltip tooltip-right">
              <Info size={20} className="info-icon" />
              <span className="tooltiptext">Compara las horas de desarrollo, reuniones y documentación promedio de cada miembro entre sprints previos.</span>
            </span>
          )}
        </h4>

        {sprintHistory.length === 0 ? (
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: isExpanded ? '1.1rem' : '0.8rem' }}>
            No hay suficientes datos históricos.
          </div>
        ) : (
          <div className="chart-container">
            <svg viewBox={`0 0 ${cWidth} ${cHeight}`} width="100%" height="auto" style={{ maxWidth: '100%', overflow: 'visible' }}>
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                const y = py + (1 - val) * (cHeight - py * 2);
                const labelValue = (val * maxHoursVal).toFixed(0);
                return (
                  <g key={idx}>
                    <line 
                      x1={px} y1={y} x2={cWidth} y2={y} 
                      stroke="var(--border-color)" strokeWidth="1" strokeDasharray="2 2" 
                    />
                    <text x={px - 8} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: isExpanded ? '0.8rem' : '0.65rem', fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {labelValue}h
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {visibleHistory.map((sprint, sIdx) => {
                const colWidth = (cWidth - px) / visibleHistory.length;
                const xBase = px + sIdx * colWidth;
                
                const barW = isExpanded ? Math.min(16, colWidth / 4) : Math.min(8, colWidth / 4);
                const spacing = isExpanded ? 4 : 2;
                
                const devHeight = (sprint.avgDev / maxHoursVal) * (cHeight - py * 2);
                const meetHeight = (sprint.avgMeetings / maxHoursVal) * (cHeight - py * 2);
                const docHeight = (sprint.avgDoc / maxHoursVal) * (cHeight - py * 2);
                
                const baselineY = cHeight - py;

                return (
                  <g key={sprint.id}>
                    {/* Desarrollo */}
                    <rect 
                      x={xBase + colWidth / 2 - barW * 1.5 - spacing} 
                      y={baselineY - devHeight} 
                      width={barW} 
                      height={devHeight} 
                      fill="var(--color-dev)"
                      rx={isExpanded ? "2" : "1"}
                    />

                    {/* Reuniones */}
                    <rect 
                      x={xBase + colWidth / 2 - barW / 2} 
                      y={baselineY - meetHeight} 
                      width={barW} 
                      height={meetHeight} 
                      fill="var(--color-meetings)"
                      rx={isExpanded ? "2" : "1"}
                    />

                    {/* Documentación */}
                    <rect 
                      x={xBase + colWidth / 2 + barW / 2 + spacing} 
                      y={baselineY - docHeight} 
                      width={barW} 
                      height={docHeight} 
                      fill="var(--color-doc)"
                      rx={isExpanded ? "2" : "1"}
                    />
                    
                    {/* Label Eje X */}
                    <text 
                      x={xBase + colWidth / 2} 
                      y={cHeight - (isExpanded ? 8 : 4)} 
                      textAnchor="middle" 
                      style={{ fontSize: isExpanded ? '0.85rem' : '0.65rem', fill: 'var(--text-primary)', fontWeight: 700 }}
                    >
                      {isExpanded ? sprint.name : (sprint.name.length > 8 ? sprint.name.substring(0, 7) + '..' : sprint.name)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Leyenda del gráfico */}
            <div className="chart-legend" style={{ justifyContent: 'center', marginTop: isExpanded ? '1rem' : '0.5rem', gap: isExpanded ? '1.5rem' : '0.75rem' }}>
              <div className="legend-item" style={isExpanded ? { fontSize: '0.95rem' } : {}}>
                <span style={{ width: isExpanded ? '10px' : '6px', height: isExpanded ? '10px' : '6px', borderRadius: '50%', backgroundColor: 'var(--color-dev)' }} />
                Dev
              </div>
              <div className="legend-item" style={isExpanded ? { fontSize: '0.95rem' } : {}}>
                <span style={{ width: isExpanded ? '10px' : '6px', height: isExpanded ? '10px' : '6px', borderRadius: '50%', backgroundColor: 'var(--color-meetings)' }} />
                Reuniones
              </div>
              <div className="legend-item" style={isExpanded ? { fontSize: '0.95rem' } : {}}>
                <span style={{ width: isExpanded ? '10px' : '6px', height: isExpanded ? '10px' : '6px', borderRadius: '50%', backgroundColor: 'var(--color-doc)' }} />
                Doc
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBurndownChart = (isExpanded = false) => {
    const bHeight = isExpanded ? 350 : 180;
    const bWidth = isExpanded ? 800 : 560;
    const bPadLeft = isExpanded ? 60 : 45;
    const bPadRight = isExpanded ? 30 : 20;
    const bPadY = isExpanded ? 30 : 20;

    return (
      <div 
        className={isExpanded ? "" : "glass-card grid-layout-2col zoomable-chart-card"} 
        onClick={isExpanded ? null : () => setExpandedChart('burndown')}
        style={isExpanded ? { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' } : {}}
      >
        {!isExpanded && (
          <button 
            className="chart-zoom-btn" 
            onClick={(e) => { e.stopPropagation(); setExpandedChart('burndown'); }}
            aria-label="Expandir gráfico"
            title="Expandir gráfico"
          >
            <Maximize2 size={14} />
          </button>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isExpanded ? '1.5rem' : '0.85rem' }}>
          <h4 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', fontSize: isExpanded ? '1.2rem' : '0.9rem', paddingRight: isExpanded ? '0' : '2.5rem' }}>
            <Flame size={isExpanded ? 20 : 16} style={{ color: 'var(--warning)' }} /> Progreso de Carga & Capacidad
            {!isExpanded && (
              <span className="tooltip tooltip-left">
                <Info size={20} className="info-icon" />
                <span className="tooltiptext">Compara las horas reportadas en el sprint contra el tiempo planificado disponible del equipo.</span>
              </span>
            )}
          </h4>
          <p className="text-secondary" style={{ fontSize: isExpanded ? '0.95rem' : '0.8rem', lineHeight: '1.4' }}>
            Compara el ritmo del equipo con la capacidad teórica del Sprint ({activeSprint.capacity || 6}h diarias efectivas por miembro).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: isExpanded ? '0.85rem' : '0.5rem', background: 'var(--bg-primary)', padding: isExpanded ? '1.25rem' : '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isExpanded ? '0.9rem' : '0.75rem' }}>
              <span className="text-secondary">Horas Reportadas:</span>
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{totalHours.toFixed(1)}h</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isExpanded ? '0.9rem' : '0.75rem' }}>
              <span className="text-secondary">Capacidad Planificada:</span>
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{teamCapacityHours.toFixed(1)}h</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isExpanded ? '0.9rem' : '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: isExpanded ? '0.6rem' : '0.4rem', marginTop: isExpanded ? '0.4rem' : '0.2rem' }}>
              <span className="text-secondary">Carga del Sprint:</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{capacityPercentage.toFixed(0)}%</span>
            </div>
            <div style={{ height: isExpanded ? '6px' : '4px', background: 'var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginTop: '0.25rem' }}>
              <div style={{ width: `${Math.min(100, capacityPercentage)}%`, height: '100%', background: capacityPercentage > 90 ? 'var(--warning)' : 'var(--primary)' }} />
            </div>
          </div>
        </div>

        {/* Burn-down SVG Line Chart */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isExpanded ? '0.85rem' : '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              📉 Burn-down del Sprint (Horas Pendientes)
              {!isExpanded && (
                <span className="tooltip tooltip-right">
                  <Info size={20} className="info-icon" />
                  <span className="tooltiptext">La línea ideal (punteada) baja hacia cero. La línea real (continua) muestra las horas restantes por registrar. Si la línea real está por encima de la ideal, indica retraso.</span>
                </span>
              )}
            </span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '0px', borderTop: '2px dashed var(--text-secondary)' }} /> Ideal
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '0px', borderTop: '2px solid var(--text-primary)' }} /> Real
              </span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            {businessDaysList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', fontSize: isExpanded ? '1rem' : '0.8rem', color: 'var(--text-muted)' }}>
                No hay rango de fechas válidas para graficar el progreso.
              </div>
            ) : (
              <svg viewBox={`0 0 ${bWidth} ${bHeight}`} width="100%" height="auto" style={{ maxWidth: '100%', overflow: 'visible' }}>
                {/* Grid Lines Horizontales */}
                {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
                  const y = bPadY + (1 - val) * (bHeight - bPadY * 2);
                  const labelValue = (val * teamCapacityHours).toFixed(0);
                  return (
                    <g key={idx}>
                      <line 
                        x1={bPadLeft} y1={y} x2={bWidth - bPadRight} y2={y} 
                        stroke="var(--border-color)" strokeWidth="1" strokeDasharray="2 2" 
                      />
                      <text x={bPadLeft - 8} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: isExpanded ? '0.75rem' : '0.6rem', fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {labelValue}h
                      </text>
                    </g>
                  );
                })}

                {/* Línea Ideal (Dashed) */}
                {(() => {
                  const xStart = bPadLeft;
                  const xEnd = bWidth - bPadRight;
                  const yStart = bPadY;
                  const yEnd = bHeight - bPadY;
                  return (
                    <line 
                      x1={xStart} y1={yStart} x2={xEnd} y2={yEnd} 
                      stroke="var(--text-secondary)" strokeWidth="1.5" strokeDasharray="3 3" 
                    />
                  );
                })()}

                {/* Línea Real */}
                {(() => {
                  const colWidth = (bWidth - bPadLeft - bPadRight) / Math.max(1, businessDaysList.length - 1);
                  const points = realPoints.map((p, idx) => {
                    const x = bPadLeft + idx * colWidth;
                    const y = bPadY + (1 - p.real / teamCapacityHours) * (bHeight - bPadY * 2);
                    return { x, y, real: p.real };
                  });

                  if (points.length === 0) return null;
                  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                  return (
                    <g>
                      <path 
                        d={linePath} 
                        fill="none" 
                        stroke="var(--text-primary)" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                      />
                      {points.map((p, idx) => (
                        <circle 
                          key={idx}
                          cx={p.x} cy={p.y} r={isExpanded ? "4" : "3"} 
                          fill="var(--bg-secondary)" 
                          stroke="var(--text-primary)" 
                          strokeWidth="2" 
                        />
                      ))}
                    </g>
                  );
                })()}

                {/* Etiquetas de Días Eje X */}
                {(() => {
                  const colWidth = (bWidth - bPadLeft - bPadRight) / Math.max(1, businessDaysList.length - 1);
                  return businessDaysList.map((day, idx) => {
                    const x = bPadLeft + idx * colWidth;
                    if (!isExpanded && businessDaysList.length > 8 && idx % 2 !== 0 && idx !== businessDaysList.length - 1) return null;
                    if (isExpanded && businessDaysList.length > 15 && idx % 2 !== 0 && idx !== businessDaysList.length - 1) return null;
                    return (
                      <text 
                        key={idx} 
                        x={x} y={bHeight - (isExpanded ? 6 : 4)} 
                        textAnchor="middle" 
                        style={{ fontSize: isExpanded ? '0.8rem' : '0.65rem', fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}
                      >
                        d{idx + 1}
                      </text>
                    );
                  });
                })()}
              </svg>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTrendsChart = (isExpanded = false) => {
    const tHeight = isExpanded ? 350 : 180;
    const tWidth = isExpanded ? 800 : 560;
    const tPadLeft = isExpanded ? 60 : 45;
    const tPadRight = isExpanded ? 60 : 45;
    const tPadY = isExpanded ? 30 : 25;

    return (
      <div 
        className={isExpanded ? "" : "glass-card zoomable-chart-card"} 
        onClick={isExpanded ? null : () => setExpandedChart('trends')}
        style={isExpanded ? {} : { display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}
      >
        {!isExpanded && (
          <button 
            className="chart-zoom-btn" 
            onClick={(e) => { e.stopPropagation(); setExpandedChart('trends'); }}
            aria-label="Expandir gráfico"
            title="Expandir gráfico"
          >
            <Maximize2 size={14} />
          </button>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isExpanded ? '0.95rem' : '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', padding: '0 0.25rem', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingRight: isExpanded ? '0' : '2.5rem' }}>
            📊 Rendimiento Ágil (Story Points vs Defectos)
            {!isExpanded && (
              <span className="tooltip tooltip-right">
                <Info size={20} className="info-icon" />
                <span className="tooltiptext">Las barras representan la velocidad (Story Points completados) y la línea representa los errores (bugs) detectados en cada sprint.</span>
              </span>
            )}
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '6px', backgroundColor: 'var(--primary)', borderRadius: '1px' }} /> Velocidad
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)' }}>
              <span style={{ width: '8px', height: '2px', backgroundColor: 'var(--danger)', display: 'inline-block' }} /> Errores
            </span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <svg viewBox={`0 0 ${tWidth} ${tHeight}`} width="100%" height="auto" style={{ maxWidth: '100%', overflow: 'visible' }}>
            
            {/* Grid Lines Horizontales */}
            {[0, 0.25, 0.5, 0.75, 1].map((val, idx) => {
              const y = tPadY + (1 - val) * (tHeight - tPadY * 2);
              return (
                <line 
                  key={idx}
                  x1={tPadLeft} y1={y} x2={tWidth - tPadRight} y2={y} 
                  stroke="var(--border-color)" strokeWidth="1" strokeDasharray="2 2" 
                />
              );
            })}

            {/* Ejes y Etiquetas laterales (Velocidad e Izquierda) */}
            <text x={tPadLeft - 8} y={tPadY} textAnchor="end" dominantBaseline="middle" style={{ fontSize: isExpanded ? '0.75rem' : '0.6rem', fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {maxVelocityVal} SP
            </text>
            <text x={tPadLeft - 8} y={tHeight - tPadY} textAnchor="end" dominantBaseline="middle" style={{ fontSize: isExpanded ? '0.75rem' : '0.6rem', fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              0 SP
            </text>

            {/* Ejes y Etiquetas laterales (Errores y Derecha) */}
            <text x={tWidth - tPadRight + 8} y={tPadY} textAnchor="start" dominantBaseline="middle" style={{ fontSize: isExpanded ? '0.75rem' : '0.65rem', fill: 'var(--danger)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {maxErrorsVal} Err
            </text>
            <text x={tWidth - tPadRight + 8} y={tHeight - tPadY} textAnchor="start" dominantBaseline="middle" style={{ fontSize: isExpanded ? '0.75rem' : '0.65rem', fill: 'var(--danger)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              0 Err
            </text>

            {/* Barras de Velocidad e Histograma */}
            {visibleTrends.map((sprint, idx) => {
              const colWidth = (tWidth - tPadLeft - tPadRight) / visibleTrends.length;
              const xBase = tPadLeft + idx * colWidth;
              
              const barW = isExpanded ? Math.min(48, colWidth * 0.5) : Math.min(24, colWidth * 0.5);
              const velHeight = ((sprint.velocity || 0) / maxVelocityVal) * (tHeight - tPadY * 2);
              const baselineY = tHeight - tPadY;

              return (
                <g key={sprint.id}>
                  {/* Barra de Velocidad */}
                  <rect
                    x={xBase + colWidth / 2 - barW / 2}
                    y={baselineY - velHeight}
                    width={barW}
                    height={velHeight}
                    fill="var(--primary)"
                    opacity="0.85"
                    rx={isExpanded ? "4" : "2"}
                  />
                  <text
                    x={xBase + colWidth / 2}
                    y={baselineY - velHeight - 4}
                    textAnchor="middle"
                    style={{ fontSize: isExpanded ? '0.8rem' : '0.65rem', fill: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}
                  >
                    {sprint.velocity || 0}
                  </text>

                  {/* Label de Sprint abajo */}
                  <text
                    x={xBase + colWidth / 2}
                    y={tHeight - (isExpanded ? 6 : 4)}
                    textAnchor="middle"
                    style={{ fontSize: isExpanded ? '0.75rem' : '0.6rem', fill: 'var(--text-secondary)', fontWeight: 600 }}
                  >
                    {isExpanded ? sprint.name : (sprint.name.length > 10 ? sprint.name.substring(0, 9) + '..' : sprint.name)}
                  </text>
                </g>
              );
            })}

            {/* Línea de Errores Detectados (Superpuesta) */}
            {(() => {
              const points = visibleTrends.map((sprint, idx) => {
                const colWidth = (tWidth - tPadLeft - tPadRight) / visibleTrends.length;
                const xBase = tPadLeft + idx * colWidth;
                const x = xBase + colWidth / 2;
                const errHeight = ((sprint.errors || 0) / maxErrorsVal) * (tHeight - tPadY * 2);
                const y = tHeight - tPadY - errHeight;
                return { x, y, errors: sprint.errors || 0 };
              });

              if (points.length === 0) return null;

              const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

              return (
                <g>
                  {points.length > 1 && (
                    <path 
                      d={linePath} 
                      fill="none" 
                      stroke="var(--danger)" 
                      strokeWidth={isExpanded ? "3" : "2"} 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  )}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle 
                        cx={p.x} cy={p.y} r={isExpanded ? "6" : "4"} 
                        fill="var(--bg-secondary)" 
                        stroke="var(--danger)" 
                        strokeWidth="2.5" 
                      />
                      <text
                        x={p.x}
                        y={p.y - (isExpanded ? 8 : 6)}
                        textAnchor="middle"
                        style={{ fontSize: isExpanded ? '0.8rem' : '0.65rem', fill: 'var(--danger)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}
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
    );
  };

  const estimatedSp_dummy = estimatedSp; // preserve alignment variable


  const handleExportExcel = () => {
    const escapeXML = (str) => {
      if (!str) return '';
      return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const headers = [
      "Sprint",
      "Fecha Inicio",
      "Fecha Fin",
      "Story Points Estimados",
      "Story Points Reales (Velocidad)",
      "Predecibilidad",
      "Errores (Bugs)",
      "Capacidad diaria (h/d)",
      "Total Horas Registradas",
      "Horas Desarrollo",
      "Horas Reuniones",
      "Horas Documentación"
    ];

    const rowsXML = validSprints.map((s, idx) => {
      const sprintLogs = logs.filter(l => l.sprintId === s.id);
      
      const sprintMeetingsByDay = sprintLogs.reduce((acc, log) => {
        if (log.meetings > 0) {
          acc[log.date] = Math.max(acc[log.date] || 0, log.meetings);
        }
        return acc;
      }, {});
      const sprintMeetingsSum = Object.values(sprintMeetingsByDay).reduce((sum, val) => sum + val, 0);

      const totals = sprintLogs.reduce((acc, log) => {
        acc.dev += log.development;
        acc.doc += log.documentation;
        return acc;
      }, { dev: 0, doc: 0 });

      const totalsMeet = sprintMeetingsSum;
      const totalH = totals.dev + totalsMeet + totals.doc;
      const estSp = s.estimatedSp || 0;
      const realSp = s.velocity || 0;
      const pred = estSp > 0 ? `${((realSp / estSp) * 100).toFixed(0)}%` : "0%";
      
      const isEven = idx % 2 === 0;
      const suffix = isEven ? "Even" : "Odd";

      return `
   <Row ss:Height="20">
    <Cell ss:StyleID="Row${suffix}Left"><Data ss:Type="String">${escapeXML(s.name)}</Data></Cell>
    <Cell ss:StyleID="Row${suffix}Center"><Data ss:Type="String">${s.startDate}</Data></Cell>
    <Cell ss:StyleID="Row${suffix}Center"><Data ss:Type="String">${s.endDate}</Data></Cell>
    <Cell ss:StyleID="Row${suffix}Right"><Data ss:Type="Number">${estSp}</Data></Cell>
    <Cell ss:StyleID="Row${suffix}Right"><Data ss:Type="Number">${realSp}</Data></Cell>
    <Cell ss:StyleID="Row${suffix}Right"><Data ss:Type="String">${pred}</Data></Cell>
    <Cell ss:StyleID="Row${suffix}Right"><Data ss:Type="Number">${s.errors || 0}</Data></Cell>
    <Cell ss:StyleID="Row${suffix}Right"><Data ss:Type="Number">${s.capacity || 6}</Data></Cell>
    <Cell ss:StyleID="Row${suffix}Right"><Data ss:Type="Number">${totalH.toFixed(1)}</Data></Cell>
    <Cell ss:StyleID="Row${suffix}Right"><Data ss:Type="Number">${totals.dev.toFixed(1)}</Data></Cell>
    <Cell ss:StyleID="Row${suffix}Right"><Data ss:Type="Number">${totalsMeet.toFixed(1)}</Data></Cell>
    <Cell ss:StyleID="Row${suffix}Right"><Data ss:Type="Number">${totals.doc.toFixed(1)}</Data></Cell>
   </Row>`;
    }).join("");

    const xmlTemplate = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Segoe UI" x:Family="Swiss" ss:Size="10" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#27272a"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#18181b" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="RowEvenLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Interior ss:Color="#f4f4f5" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
  </Style>
  <Style ss:ID="RowEvenCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#f4f4f5" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
  </Style>
  <Style ss:ID="RowEvenRight">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Interior ss:Color="#f4f4f5" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
  </Style>
  <Style ss:ID="RowOddLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Interior ss:Color="#ffffff" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
  </Style>
  <Style ss:ID="RowOddCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#ffffff" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
  </Style>
  <Style ss:ID="RowOddRight">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Interior ss:Color="#ffffff" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Size="10"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Métricas Sprints">
  <Table>
   <Column ss:Width="160"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="125"/>
   <Column ss:Width="125"/>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="120"/>
   <Column ss:Width="125"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Row ss:Height="26">
    ${headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`).join("")}
   </Row>
   ${rowsXML}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xmlTemplate], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_sprints_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

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
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={18} className="text-secondary" /> Métricas del Ciclo
          <span className="tooltip tooltip-left">
            <Info size={20} className="info-icon" />
            <span className="tooltiptext">Resumen de las horas trabajadas en desarrollo, reuniones y documentación durante el sprint.</span>
          </span>
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className={`btn ${viewType === 'user' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setViewType('user')}
            disabled={!currentUser}
            title="Ver mis métricas de tiempo registradas en el sprint"
          >
            Mis Métricas
          </button>
          <button 
            className={`btn ${viewType === 'team' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setViewType('team')}
            title="Ver las métricas agregadas del equipo"
          >
            Métricas del Equipo
          </button>
          
          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 0.25rem' }} className="no-print" />
          
          <button 
            className="btn btn-secondary no-print"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={handleExportExcel}
            title="Exportar histograma y todas las métricas de sprints a Excel (CSV)"
          >
            <Download size={14} /> Exportar Excel
          </button>
          <button 
            className="btn btn-secondary no-print"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={handleExportPDF}
            title="Exportar reporte de análisis de sprint a PDF / Imprimir"
          >
            <FileText size={14} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Fila de Tarjetas Estadísticas */}
      <div className="stat-card-group">
        <div className="stat-card">
          <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Suma Desarrollo
            <span className="tooltip tooltip-left">
              <Info size={20} className="info-icon" />
              <span className="tooltiptext">Total de horas cargadas a tareas de programación y resolución de código.</span>
            </span>
          </span>
          <span className="stat-value" style={{ color: 'var(--color-dev)' }}>
            {totals.development.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>h</span>
          </span>
          <span className="stat-sub">
            {viewType === 'user' ? 'Horas registradas' : `Promedio: ${avgDev.toFixed(1)}h / pers`}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Suma Reuniones
            <span className="tooltip tooltip-center">
              <Info size={20} className="info-icon" />
              <span className="tooltiptext">Total de horas cargadas a reuniones de equipo y ceremonias Scrum.</span>
            </span>
          </span>
          <span className="stat-value" style={{ color: 'var(--color-meetings)' }}>
            {totals.meetings.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>h</span>
          </span>
          <span className="stat-sub">
            {viewType === 'user' ? 'Horas registradas' : `Promedio: ${avgMeetings.toFixed(1)}h / pers`}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Suma Documentación
            <span className="tooltip tooltip-center">
              <Info size={20} className="info-icon" />
              <span className="tooltiptext">Total de horas dedicadas a especificaciones, wikis y documentación de soporte.</span>
            </span>
          </span>
          <span className="stat-value" style={{ color: 'var(--color-doc)' }}>
            {totals.documentation.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>h</span>
          </span>
          <span className="stat-sub">
            {viewType === 'user' ? 'Horas registradas' : `Promedio: ${avgDoc.toFixed(1)}h / pers`}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Reuniones del Sprint
            <span className="tooltip tooltip-center">
              <Info size={20} className="info-icon" />
              <span className="tooltiptext">Días únicos del sprint donde se realizó al menos una reunión (basado en registros mayores a 0).</span>
            </span>
          </span>
          <span className="stat-value" style={{ color: 'var(--color-meetings)' }}>
            {meetingCount}
          </span>
          <span className="stat-sub">
            Días con reunión
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Predecibilidad
            <span className="tooltip tooltip-center">
              <Info size={20} className="info-icon" />
              <span className="tooltiptext">Precisión de estimación del sprint: (Story Points Reales / Estimados) * 100. El objetivo ágil es 85% - 100%.</span>
            </span>
          </span>
          <span className="stat-value" style={{ color: predictability >= 85 && predictability <= 110 ? 'var(--success)' : 'var(--warning)' }}>
            {estimatedSp > 0 ? `${predictability.toFixed(0)}%` : '-'}
          </span>
          <span className="stat-sub">
            {estimatedSp} est. vs {realSp} real
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Focus Score
            <span className="tooltip tooltip-right">
              <Info size={20} className="info-icon" />
              <span className="tooltiptext">Cociente de horas de desarrollo frente a gestión. Si es mayor que 1.0, el foco está en programar.</span>
            </span>
          </span>
          <span className="stat-value" style={{ color: focusScore >= 1.0 ? 'var(--text-primary)' : 'var(--danger)' }}>
            {focusScore === Infinity ? 'Max' : focusScore.toFixed(1)}
          </span>
          <span className="stat-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            {focusScore >= 2.0 && <span style={{ color: 'var(--success)' }}>Foco Óptimo</span>}
            {focusScore >= 1.0 && focusScore < 2.0 && <span>Foco Balanceado</span>}
            {focusScore < 1.0 && <span style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠️ Alerta Proceso</span>}
          </span>
        </div>
      </div>

      <div className="metrics-row-1">
        {/* Distribución del Tiempo - Donut Chart SVG */}
        {renderDistributionChart(false)}

        {/* Comparativa Histórica de Sprints */}
        {renderComparisonChart(false)}
      </div>

      {/* --- NUEVO GRÁFICO: BURN-DOWN CHART (SEGUIMIENTO DE SPRINT) --- */}
      {renderBurndownChart(false)}

      {/* --- INFORME FINAL DE TENDENCIAS Y CONCLUSIÓN DEL PROYECTO --- */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Activity size={18} style={{ color: 'var(--primary)' }} /> Informe de Tendencias y Cierre de Proyecto
            <span className="tooltip tooltip-left">
              <Info size={20} className="info-icon" />
              <span className="tooltiptext">Consolidado histórico de desempeño para evaluar la velocidad de entrega y bugs en las retrospectivas.</span>
            </span>
          </h3>
          <p className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
            Consolidado histórico de desempeño del equipo. Las métricas de tendencias y calidad se compilan al final para evaluar el proyecto.
          </p>
        </div>

        {validSprints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>
            No hay suficientes sprints finalizados o configurados con métricas de tendencias (Velocidad / Errores).
            Ingresa estos datos en la pestaña de **Configuración** de cada sprint.
          </div>
        ) : (
          <div className="grid-layout-2col">
            
            {/* Panel de Resumen Consolidado */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--primary-light)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                  <Award size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Velocidad Promedio
                    <span className="tooltip tooltip-left">
                      <Info size={20} className="info-icon" />
                      <span className="tooltiptext">Velocidad promedio de Story Points completados por sprint a lo largo del histórico. Útil para predecir la capacidad real del equipo en próximos sprints.</span>
                    </span>
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{avgVelocity.toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>pts</span></span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--danger-light)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--danger)' }}>
                  <ShieldAlert size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Errores Consolidados</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>{totalErrors} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>bugs</span></span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                <h5 style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={14} style={{ color: 'var(--success)' }} /> Coeficiente de Estabilidad
                  <span className="tooltip tooltip-right">
                    <Info size={20} className="info-icon" />
                    <span className="tooltiptext">Evalúa el equilibrio entre velocidad y calidad. Si la velocidad aumenta pero los errores suben, indica alta deuda técnica.</span>
                  </span>
                </h5>
                <p className="text-secondary" style={{ lineHeight: '1.45', fontSize: '0.75rem' }}>
                  {avgErrors > 0 ? (
                    avgVelocity / avgErrors > 2.5 ? (
                      '✅ Fuerte estabilidad: Velocidad sólida con mínima incidencia de errores.'
                    ) : (
                      '⚠️ Deuda técnica alta: Errores frecuentes en relación a los puntos entregados.'
                    )
                  ) : (
                    '💎 Excelente estabilidad: Cero errores registrados en los sprints activos.'
                  )}
                </p>
              </div>
            </div>

            {/* Histograma Consolidado (Double Axis SVG Chart) */}
            {renderTrendsChart(false)}
          </div>
        )}
      </div>
      {/* Chart Zoom Lightbox Modal */}
      {expandedChart && (
        <div className="chart-zoom-overlay no-print" onClick={() => setExpandedChart(null)}>
          <div className="chart-zoom-modal" onClick={(e) => e.stopPropagation()}>
            <button className="chart-zoom-close-btn" onClick={() => setExpandedChart(null)} aria-label="Cerrar gráfico">
              &times;
            </button>
            {expandedChart === 'distribution' && renderDistributionChart(true)}
            {expandedChart === 'comparison' && renderComparisonChart(true)}
            {expandedChart === 'burndown' && renderBurndownChart(true)}
            {expandedChart === 'trends' && renderTrendsChart(true)}
          </div>
        </div>
      )}
    </div>
  );
}
