import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API: Usuarios
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, avatar, role } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre es requerido' });
    const user = await db.createUser({ name, avatar: avatar || '👤', role: role || 'Developer' });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar, role } = req.body;
    const updatedUser = await db.updateUser(id, { name, avatar, role });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteUser(id);
    if (deleted) {
      res.json({ success: true, message: 'Usuario eliminado correctamente' });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Sprints
app.get('/api/sprints', async (req, res) => {
  try {
    const sprints = await db.getSprints();
    res.json(sprints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sprints', async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Nombre, fecha de inicio y fecha de fin son requeridos' });
    }
    const sprint = await db.createSprint({ name, startDate, endDate });
    res.status(201).json(sprint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sprints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, goals, velocity, errors } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Nombre, fecha de inicio y fecha de fin son requeridos' });
    }
    const updated = await db.updateSprint(id, { name, startDate, endDate, goals, velocity, errors });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sprints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteSprint(id);
    if (deleted) {
      res.json({ success: true, message: 'Sprint eliminado correctamente' });
    } else {
      res.status(404).json({ error: 'Sprint no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sprints/:id/goals', async (req, res) => {
  try {
    const { id } = req.params;
    const { goals } = req.body;
    if (!Array.isArray(goals)) {
      return res.status(400).json({ error: 'Metas debe ser un arreglo' });
    }
    const updated = await db.updateSprintGoals(id, goals);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Worklogs
app.get('/api/logs', async (req, res) => {
  try {
    const { sprintId } = req.query;
    const logs = await db.getWorklogs(sprintId);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logs', async (req, res) => {
  try {
    const { userId, sprintId, date, development, meetings, documentation, notes } = req.body;
    if (!userId || !sprintId || !date) {
      return res.status(400).json({ error: 'userId, sprintId y date son requeridos' });
    }
    const log = await db.saveWorklog({
      userId,
      sprintId,
      date,
      development,
      meetings,
      documentation,
      notes
    });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Retro Actions
app.get('/api/retro-actions', async (req, res) => {
  try {
    const { sprintId } = req.query;
    const actions = await db.getRetroActions(sprintId);
    res.json(actions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/retro-actions', async (req, res) => {
  try {
    const { id, sprintId, action, status, result } = req.body;
    if (!sprintId || (!id && !action)) {
      return res.status(400).json({ error: 'Faltan campos requeridos (sprintId, action)' });
    }
    const savedAction = await db.saveRetroAction({ id, sprintId, action, status, result });
    res.json(savedAction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/retro-actions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteRetroAction(id);
    if (deleted) {
      res.json({ success: true, message: 'Acción eliminada correctamente' });
    } else {
      res.status(404).json({ error: 'Acción no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Servir frontend compilado en producción
app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor de Worklog corriendo en http://localhost:${PORT}`);
  });
}

export default app;
