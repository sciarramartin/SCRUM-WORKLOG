const API_BASE = '/api';

function getHeaders(extra = {}) {
  return { ...extra };
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Error al cargar usuarios');
  return res.json();
}

export async function createUser(userData) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(userData)
  });
  if (!res.ok) throw new Error('Error al crear usuario');
  return res.json();
}

export async function updateUser(userId, userData) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'PUT',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(userData)
  });
  if (!res.ok) throw new Error('Error al actualizar usuario');
  return res.json();
}

export async function deleteUser(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Error al eliminar usuario');
  return res.json();
}

export async function fetchSprints() {
  const res = await fetch(`${API_BASE}/sprints`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Error al cargar sprints');
  return res.json();
}

export async function createSprint(sprintData) {
  const res = await fetch(`${API_BASE}/sprints`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(sprintData)
  });
  if (!res.ok) throw new Error('Error al crear sprint');
  return res.json();
}

export async function updateSprintGoals(sprintId, goals) {
  const res = await fetch(`${API_BASE}/sprints/${sprintId}/goals`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ goals })
  });
  if (!res.ok) throw new Error('Error al guardar metas del sprint');
  return res.json();
}

export async function fetchLogs(sprintId) {
  const url = sprintId ? `${API_BASE}/logs?sprintId=${sprintId}` : `${API_BASE}/logs`;
  const res = await fetch(url, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Error al cargar logs de horas');
  return res.json();
}

export async function saveLog(logData) {
  const res = await fetch(`${API_BASE}/logs`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(logData)
  });
  if (!res.ok) throw new Error('Error al guardar registro');
  return res.json();
}

export async function fetchRetroActions(sprintId) {
  const url = sprintId ? `${API_BASE}/retro-actions?sprintId=${sprintId}` : `${API_BASE}/retro-actions`;
  const res = await fetch(url, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Error al cargar plan de acción');
  return res.json();
}

export async function saveRetroAction(actionData) {
  const res = await fetch(`${API_BASE}/retro-actions`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(actionData)
  });
  if (!res.ok) throw new Error('Error al guardar plan de acción');
  return res.json();
}

export async function deleteRetroAction(id) {
  const res = await fetch(`${API_BASE}/retro-actions/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Error al eliminar plan de acción');
  return res.json();
}
