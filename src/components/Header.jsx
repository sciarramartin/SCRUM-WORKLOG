import React, { useEffect, useState } from 'react';
import { Sun, Moon, CalendarDays } from 'lucide-react';

export default function Header() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Buscar si ya hay tema guardado
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <CalendarDays size={22} />
        </div>
        <div className="brand-title">
          <h1>Sprint Worklog</h1>
          <div className="brand-subtitle">Mide, Analiza y Mejora en Equipo</div>
        </div>
      </div>

      <div className="header-controls">
        <button 
          onClick={toggleTheme} 
          className="btn-icon" 
          title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
