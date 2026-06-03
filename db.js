import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');

const defaultData = {
  users: [],
  sprints: [],
  worklogs: [],
  retroActions: []
};

class DB {
  constructor() {
    this.data = null;
    this.pool = null;
    this.isPostgres = false;
  }

  async load() {
    // Detectar si hay base de datos de Postgres en variables de entorno (Vercel / Neon / Supabase)
    const pgUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (pgUrl) {
      if (!this.pool) {
        console.log('🔌 Conectando a Base de Datos PostgreSQL en la nube...');
        this.pool = new pg.Pool({
          connectionString: pgUrl,
          ssl: {
            rejectUnauthorized: false
          }
        });
        this.isPostgres = true;
        await this.initPostgresTables();
      }
      return;
    }

    // Fallback: Base de datos local en archivo JSON
    if (this.data) return this.data;
    try {
      const content = await fs.readFile(DB_PATH, 'utf-8');
      this.data = JSON.parse(content);
      this.data = { ...defaultData, ...this.data };
    } catch (err) {
      this.data = JSON.parse(JSON.stringify(defaultData));
      await this.save();
    }
    return this.data;
  }

  async save() {
    if (this.isPostgres) return; // En Postgres los cambios se guardan directamente con SQL
    try {
      await fs.writeFile(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error al guardar la base de datos JSON:', err);
    }
  }

  async initPostgresTables() {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          avatar VARCHAR(50),
          role VARCHAR(50)
        );
        
        CREATE TABLE IF NOT EXISTS sprints (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          start_date VARCHAR(50) NOT NULL,
          end_date VARCHAR(50) NOT NULL,
          goals TEXT
        );

        CREATE TABLE IF NOT EXISTS worklogs (
          id VARCHAR(50) PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL,
          sprint_id VARCHAR(50) NOT NULL,
          date VARCHAR(50) NOT NULL,
          development NUMERIC NOT NULL DEFAULT 0,
          meetings NUMERIC NOT NULL DEFAULT 0,
          documentation NUMERIC NOT NULL DEFAULT 0,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS retro_actions (
          id VARCHAR(50) PRIMARY KEY,
          sprint_id VARCHAR(50) NOT NULL,
          action TEXT NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          result TEXT
        );
      `);

      // Migración incremental para agregar las columnas de velocidad, errores y capacidad
      await this.pool.query(`
        ALTER TABLE sprints ADD COLUMN IF NOT EXISTS velocity INT DEFAULT 0;
        ALTER TABLE sprints ADD COLUMN IF NOT EXISTS errors INT DEFAULT 0;
        ALTER TABLE sprints ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 6;
      `);

      console.log('✅ Tablas inicializadas en PostgreSQL correctamente.');
    } catch (err) {
      console.error('❌ Error al inicializar tablas en Postgres:', err);
    }
  }

  // --- USUARIOS ---
  async getUsers() {
    await this.load();
    if (this.isPostgres) {
      const res = await this.pool.query('SELECT * FROM users');
      return res.rows;
    }
    return this.data.users;
  }

  async createUser(user) {
    await this.load();
    const newUser = {
      id: Date.now().toString(),
      ...user
    };

    if (this.isPostgres) {
      await this.pool.query(
        'INSERT INTO users (id, name, avatar, role) VALUES ($1, $2, $3, $4)',
        [newUser.id, newUser.name, newUser.avatar, newUser.role]
      );
      return newUser;
    }

    this.data.users.push(newUser);
    await this.save();
    return newUser;
  }

  async updateUser(userId, userData) {
    await this.load();
    if (this.isPostgres) {
      const res = await this.pool.query(
        'UPDATE users SET name=$1, avatar=$2, role=$3 WHERE id=$4 RETURNING *',
        [userData.name, userData.avatar, userData.role, userId]
      );
      if (res.rows.length > 0) return res.rows[0];
      throw new Error('Usuario no encontrado');
    }

    const index = this.data.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.data.users[index] = { ...this.data.users[index], ...userData, id: userId };
      await this.save();
      return this.data.users[index];
    }
    throw new Error('Usuario no encontrado');
  }

  async deleteUser(userId) {
    await this.load();
    if (this.isPostgres) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const res = await client.query('DELETE FROM users WHERE id=$1', [userId]);
        await client.query('DELETE FROM worklogs WHERE user_id=$1', [userId]);
        await client.query('COMMIT');
        return res.rowCount > 0;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const index = this.data.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.data.users.splice(index, 1);
      this.data.worklogs = this.data.worklogs.filter(w => w.userId !== userId);
      await this.save();
      return true;
    }
    return false;
  }

  // --- SPRINTS ---
  async getSprints() {
    await this.load();
    if (this.isPostgres) {
      const res = await this.pool.query('SELECT * FROM sprints ORDER BY id ASC');
      return res.rows.map(row => ({
        id: row.id,
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        goals: JSON.parse(row.goals || '[]'),
        velocity: parseInt(row.velocity) || 0,
        errors: parseInt(row.errors) || 0,
        capacity: parseInt(row.capacity) || 6
      }));
    }

    // Inicializar velocidad, errores y capacidad por defecto en memoria
    return this.data.sprints.map(s => ({
      velocity: 0,
      errors: 0,
      capacity: 6,
      goals: [],
      ...s
    }));
  }

  async createSprint(sprint) {
    await this.load();
    const newSprint = {
      id: 'sprint-' + Date.now(),
      goals: [],
      velocity: 0,
      errors: 0,
      capacity: 6,
      ...sprint
    };

    if (this.isPostgres) {
      await this.pool.query(
        'INSERT INTO sprints (id, name, start_date, end_date, goals, velocity, errors, capacity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [newSprint.id, newSprint.name, newSprint.startDate, newSprint.endDate, JSON.stringify(newSprint.goals), newSprint.velocity, newSprint.errors, newSprint.capacity]
      );
      return newSprint;
    }

    this.data.sprints.push(newSprint);
    await this.save();
    return newSprint;
  }

  async updateSprint(sprintId, sprintData) {
    await this.load();
    const velocity = parseInt(sprintData.velocity) || 0;
    const errors = parseInt(sprintData.errors) || 0;
    const capacity = parseInt(sprintData.capacity) || 6;
    const name = sprintData.name;
    const startDate = sprintData.startDate;
    const endDate = sprintData.endDate;
    const goals = sprintData.goals || [];

    if (this.isPostgres) {
      const res = await this.pool.query(
        'UPDATE sprints SET name=$1, start_date=$2, end_date=$3, goals=$4, velocity=$5, errors=$6, capacity=$7 WHERE id=$8 RETURNING *',
        [name, startDate, endDate, JSON.stringify(goals), velocity, errors, capacity, sprintId]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          name: row.name,
          startDate: row.start_date,
          endDate: row.end_date,
          goals: JSON.parse(row.goals || '[]'),
          velocity: parseInt(row.velocity) || 0,
          errors: parseInt(row.errors) || 0,
          capacity: parseInt(row.capacity) || 6
        };
      }
      throw new Error('Sprint no encontrado');
    }

    const sprintIndex = this.data.sprints.findIndex(s => s.id === sprintId);
    if (sprintIndex !== -1) {
      this.data.sprints[sprintIndex] = {
        ...this.data.sprints[sprintIndex],
        name,
        startDate,
        endDate,
        goals,
        velocity,
        errors,
        capacity,
        id: sprintId
      };
      await this.save();
      return this.data.sprints[sprintIndex];
    }
    throw new Error('Sprint no encontrado');
  }

  async deleteSprint(sprintId) {
    await this.load();
    if (this.isPostgres) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM worklogs WHERE sprint_id=$1', [sprintId]);
        await client.query('DELETE FROM retro_actions WHERE sprint_id=$1', [sprintId]);
        const res = await client.query('DELETE FROM sprints WHERE id=$1', [sprintId]);
        await client.query('COMMIT');
        return res.rowCount > 0;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    const sprintIndex = this.data.sprints.findIndex(s => s.id === sprintId);
    if (sprintIndex !== -1) {
      this.data.sprints.splice(sprintIndex, 1);
      this.data.worklogs = this.data.worklogs.filter(w => w.sprintId !== sprintId);
      this.data.retroActions = this.data.retroActions.filter(ra => ra.sprintId !== sprintId);
      await this.save();
      return true;
    }
    return false;
  }

  async updateSprintGoals(sprintId, goals) {
    await this.load();
    if (this.isPostgres) {
      const res = await this.pool.query(
        'UPDATE sprints SET goals=$1 WHERE id=$2 RETURNING *',
        [JSON.stringify(goals), sprintId]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          name: row.name,
          startDate: row.start_date,
          endDate: row.end_date,
          goals: JSON.parse(row.goals || '[]'),
          velocity: parseInt(row.velocity) || 0,
          errors: parseInt(row.errors) || 0,
          capacity: parseInt(row.capacity) || 6
        };
      }
      throw new Error('Sprint no encontrado');
    }

    const sprintIndex = this.data.sprints.findIndex(s => s.id === sprintId);
    if (sprintIndex !== -1) {
      this.data.sprints[sprintIndex].goals = goals;
      await this.save();
      return this.data.sprints[sprintIndex];
    }
    throw new Error('Sprint no encontrado');
  }

  // --- WORKLOGS ---
  async getWorklogs(sprintId) {
    await this.load();
    if (this.isPostgres) {
      let res;
      if (sprintId) {
        res = await this.pool.query('SELECT * FROM worklogs WHERE sprint_id=$1', [sprintId]);
      } else {
        res = await this.pool.query('SELECT * FROM worklogs');
      }
      return res.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        sprintId: row.sprint_id,
        date: row.date,
        development: parseFloat(row.development) || 0,
        meetings: parseFloat(row.meetings) || 0,
        documentation: parseFloat(row.documentation) || 0,
        notes: row.notes || ''
      }));
    }

    if (sprintId) {
      return this.data.worklogs.filter(w => w.sprintId === sprintId);
    }
    return this.data.worklogs;
  }

  async saveWorklog(logData) {
    await this.load();
    const { userId, sprintId, date, development, meetings, documentation, notes } = logData;
    const devNum = parseFloat(development) || 0;
    const meetNum = parseFloat(meetings) || 0;
    const docNum = parseFloat(documentation) || 0;
    const notesStr = notes || '';

    if (this.isPostgres) {
      // Buscar si ya existe
      const checkRes = await this.pool.query(
        'SELECT id FROM worklogs WHERE user_id=$1 AND sprint_id=$2 AND date=$3',
        [userId, sprintId, date]
      );

      if (checkRes.rows.length > 0) {
        // Actualizar
        const id = checkRes.rows[0].id;
        await this.pool.query(
          'UPDATE worklogs SET development=$1, meetings=$2, documentation=$3, notes=$4 WHERE id=$5',
          [devNum, meetNum, docNum, notesStr, id]
        );
        return { id, userId, sprintId, date, development: devNum, meetings: meetNum, documentation: docNum, notes: notesStr };
      } else {
        // Crear
        const id = 'log-' + Date.now() + Math.random().toString(36).substr(2, 5);
        await this.pool.query(
          'INSERT INTO worklogs (id, user_id, sprint_id, date, development, meetings, documentation, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [id, userId, sprintId, date, devNum, meetNum, docNum, notesStr]
        );
        return { id, userId, sprintId, date, development: devNum, meetings: meetNum, documentation: docNum, notes: notesStr };
      }
    }

    const index = this.data.worklogs.findIndex(
      w => w.userId === userId && w.sprintId === sprintId && w.date === date
    );

    const logItem = {
      userId,
      sprintId,
      date,
      development: devNum,
      meetings: meetNum,
      documentation: docNum,
      notes: notesStr
    };

    if (index !== -1) {
      this.data.worklogs[index] = { ...this.data.worklogs[index], ...logItem };
      logItem.id = this.data.worklogs[index].id;
    } else {
      logItem.id = 'log-' + Date.now() + Math.random().toString(36).substr(2, 5);
      this.data.worklogs.push(logItem);
    }

    await this.save();
    return logItem;
  }

  // --- RETRO ACTIONS ---
  async getRetroActions(sprintId) {
    await this.load();
    if (this.isPostgres) {
      let res;
      if (sprintId) {
        res = await this.pool.query('SELECT * FROM retro_actions WHERE sprint_id=$1', [sprintId]);
      } else {
        res = await this.pool.query('SELECT * FROM retro_actions');
      }
      return res.rows.map(row => ({
        id: row.id,
        sprintId: row.sprint_id,
        action: row.action,
        status: row.status,
        result: row.result || ''
      }));
    }

    if (sprintId) {
      return this.data.retroActions.filter(ra => ra.sprintId === sprintId);
    }
    return this.data.retroActions;
  }

  async saveRetroAction(actionData) {
    await this.load();
    const { id, sprintId, action, status, result } = actionData;

    if (this.isPostgres) {
      if (id) {
        // Actualizar
        const res = await this.pool.query(
          'UPDATE retro_actions SET action=COALESCE($1, action), status=COALESCE($2, status), result=COALESCE($3, result) WHERE id=$4 RETURNING *',
          [action, status, result, id]
        );
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return { id: r.id, sprintId: r.sprint_id, action: r.action, status: r.status, result: r.result || '' };
        }
      } else {
        // Insertar
        const newId = 'ra-' + Date.now();
        const stat = status || 'pending';
        const res = result || '';
        await this.pool.query(
          'INSERT INTO retro_actions (id, sprint_id, action, status, result) VALUES ($1, $2, $3, $4, $5)',
          [newId, sprintId, action, stat, res]
        );
        return { id: newId, sprintId, action, status: stat, result: res };
      }
    }

    if (id) {
      const index = this.data.retroActions.findIndex(ra => ra.id === id);
      if (index !== -1) {
        this.data.retroActions[index] = {
          ...this.data.retroActions[index],
          action: action !== undefined ? action : this.data.retroActions[index].action,
          status: status !== undefined ? status : this.data.retroActions[index].status,
          result: result !== undefined ? result : this.data.retroActions[index].result,
        };
        await this.save();
        return this.data.retroActions[index];
      }
    }

    const newAction = {
      id: 'ra-' + Date.now(),
      sprintId,
      action,
      status: status || 'pending',
      result: result || ''
    };
    this.data.retroActions.push(newAction);
    await this.save();
    return newAction;
  }

  async deleteRetroAction(id) {
    await this.load();
    if (this.isPostgres) {
      const res = await this.pool.query('DELETE FROM retro_actions WHERE id=$1', [id]);
      return res.rowCount > 0;
    }

    const index = this.data.retroActions.findIndex(ra => ra.id === id);
    if (index !== -1) {
      this.data.retroActions.splice(index, 1);
      await this.save();
      return true;
    }
    return false;
  }
}

export default new DB();
