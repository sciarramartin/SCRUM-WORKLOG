import React, { useState, useEffect, lazy, Suspense } from 'react';

const Header = lazy(() => import('./components/Header'));
const UserSelector = lazy(() => import('./components/UserSelector'));
const SprintSelector = lazy(() => import('./components/SprintSelector'));
const SprintCalendar = lazy(() => import('./components/SprintCalendar'));
const LogHoursModal = lazy(() => import('./components/LogHoursModal'));
const SprintAnalytics = lazy(() => import('./components/SprintAnalytics'));
const SprintManager = lazy(() => import('./components/SprintManager'));

function ComponentLoader() {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner" />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
        Cargando módulo...
      </span>
    </div>
  );
}


import { 
  fetchUsers, 
  createUser, 
  updateUser,
  deleteUser,
  fetchSprints, 
  createSprint, 
  updateSprintGoals, 
  fetchLogs, 
  saveLog,
  updateSprint,
  deleteSprint
} from './utils/api';

import { Calendar, BarChart3, Settings } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [logs, setLogs] = useState([]);

  // Navegación
  const [activeTab, setActiveTab] = useState('calendar'); // calendar, analytics, retro, config

  // Modal de registro de horas
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLogData, setSelectedLogData] = useState(null);

  // Carga inicial de datos
  useEffect(() => {
    async function loadInitialData() {
      try {
        const loadedUsers = await fetchUsers();
        setUsers(loadedUsers);
        
        // Cargar usuario persistente si existe
        const savedUserId = localStorage.getItem('currentUserId');
        if (savedUserId && loadedUsers.length > 0) {
          const user = loadedUsers.find(u => u.id === savedUserId);
          if (user) setCurrentUser(user);
        } else if (loadedUsers.length > 0) {
          setCurrentUser(loadedUsers[0]);
        }

        const loadedSprints = await fetchSprints();
        setSprints(loadedSprints);
        
        if (loadedSprints.length > 0) {
          // Por defecto seleccionar el último sprint (más actual)
          const latestSprint = loadedSprints[loadedSprints.length - 1];
          setActiveSprint(latestSprint);
        }
      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
      }
    }
    loadInitialData();
  }, []);

  // Cargar logs cuando cambia el sprint activo (ahora carga todos los logs)
  useEffect(() => {
    loadLogs();
  }, [activeSprint]);

  const loadLogs = async () => {
    try {
      const loadedLogs = await fetchLogs();
      setLogs(loadedLogs);
    } catch (err) {
      console.error('Error al cargar logs:', err);
    }
  };

  const handleSelectUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUserId', user.id);
  };

  const handleCreateUser = async (userData) => {
    try {
      const newUser = await createUser(userData);
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
      localStorage.setItem('currentUserId', newUser.id);
    } catch (err) {
      alert('Error al agregar usuario al equipo');
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      const updated = await updateUser(userId, userData);
      setUsers(users.map(u => u.id === userId ? updated : u));
      if (currentUser?.id === userId) {
        setCurrentUser(updated);
      }
    } catch (err) {
      alert('Error al actualizar miembro del equipo');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      if (currentUser?.id === userId) {
        setCurrentUser(null);
        localStorage.removeItem('currentUserId');
      }
      loadLogs();
    } catch (err) {
      alert('Error al eliminar miembro del equipo');
    }
  };

  const handleSelectSprint = (sprint) => {
    setActiveSprint(sprint);
  };

  const handleCreateSprint = async (sprintData) => {
    try {
      const newSprint = await createSprint(sprintData);
      setSprints([...sprints, newSprint]);
      setActiveSprint(newSprint);
      alert(`Sprint "${newSprint.name}" inicializado exitosamente`);
    } catch (err) {
      alert('Error al inicializar sprint');
    }
  };

  const handleUpdateSprint = async (sprintId, sprintData) => {
    try {
      const updated = await updateSprint(sprintId, sprintData);
      setSprints(sprints.map(s => s.id === sprintId ? updated : s));
      if (activeSprint?.id === sprintId) {
        setActiveSprint(updated);
      }
    } catch (err) {
      alert('Error al actualizar el sprint');
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este sprint y todos sus registros de horas?')) return;
    try {
      await deleteSprint(sprintId);
      const updatedSprints = sprints.filter(s => s.id !== sprintId);
      setSprints(updatedSprints);
      if (activeSprint?.id === sprintId) {
        if (updatedSprints.length > 0) {
          setActiveSprint(updatedSprints[updatedSprints.length - 1]);
        } else {
          setActiveSprint(null);
        }
      }
      loadLogs();
      alert('Sprint eliminado correctamente');
    } catch (err) {
      alert('Error al eliminar el sprint');
    }
  };

  const handleOpenLogModal = (dateStr, log) => {
    setSelectedDate(dateStr);
    setSelectedLogData(log);
    setIsLogModalOpen(true);
  };

  const handleSaveLog = async (logData) => {
    if (!currentUser || !activeSprint) return;
    try {
      const payload = {
        ...logData,
        userId: currentUser.id,
        sprintId: activeSprint.id
      };
      await saveLog(payload);
      await loadLogs(); // Recargar datos de logs
      setIsLogModalOpen(false);
    } catch (err) {
      alert('Error al registrar las horas');
    }
  };



  return (
    <div className="app-container">
      <Suspense fallback={<div style={{ height: '70px' }} />}>
        <Header />
      </Suspense>

      <div className="dashboard-grid">
        {/* Panel Lateral de Control */}
        <aside className="sidebar-panel">
          <Suspense fallback={<ComponentLoader />}>
            <UserSelector 
              users={users} 
              currentUser={currentUser} 
              onSelectUser={handleSelectUser}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
            <SprintSelector 
              sprints={sprints}
              activeSprint={activeSprint}
              onSelectSprint={handleSelectSprint}
            />
          </Suspense>
        </aside>

        {/* Panel de Contenido Principal */}
        <main className="main-content">
          {/* Navegación por Pestañas (Tabs) */}
          <nav className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Calendar size={16} /> Registro Calendario
            </button>
            <button 
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <BarChart3 size={16} /> Análisis de Sprint
            </button>
            <button 
              className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
              onClick={() => setActiveTab('config')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Settings size={16} /> Configuración
            </button>
          </nav>

          {/* Renderizado Condicional de Vistas */}
          <Suspense fallback={<ComponentLoader />}>
            {activeTab === 'calendar' && (
              <SprintCalendar 
                activeSprint={activeSprint}
                logs={logs.filter(l => l.sprintId === activeSprint?.id)}
                currentUser={currentUser}
                onOpenLogModal={handleOpenLogModal}
              />
            )}

            {activeTab === 'analytics' && (
              <SprintAnalytics 
                sprints={sprints}
                activeSprint={activeSprint}
                logs={logs}
                users={users}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'config' && (
              <SprintManager 
                sprints={sprints}
                activeSprint={activeSprint}
                onCreateSprint={handleCreateSprint}
                onUpdateSprint={handleUpdateSprint}
                onDeleteSprint={handleDeleteSprint}
              />
            )}
          </Suspense>
        </main>
      </div>

      {/* Modal Flotante de Carga de Horas */}
      <Suspense fallback={null}>
        <LogHoursModal 
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          dateString={selectedDate}
          logData={selectedLogData}
          onSave={handleSaveLog}
        />
      </Suspense>
    </div>
  );
}
