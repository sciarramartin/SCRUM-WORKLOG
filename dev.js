import { spawn } from 'child_process';

console.log('🚀 Iniciando Scrum Worklog App en modo desarrollo...');

// Iniciar el servidor backend (Express + SQLite/JSON)
const backend = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true
});

// Iniciar el servidor frontend (Vite)
const frontend = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true
});

// Manejar cierre de procesos
const cleanExit = () => {
  console.log('\n🛑 Cerrando servidores...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);

backend.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`❌ El backend falló con código ${code}`);
    cleanExit();
  }
});

frontend.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`❌ El frontend de Vite falló con código ${code}`);
    cleanExit();
  }
});
