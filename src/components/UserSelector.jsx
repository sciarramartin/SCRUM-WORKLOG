import React, { useState } from 'react';
import { Users, Plus, X, Edit2, Trash2 } from 'lucide-react';

export default function UserSelector({ users, currentUser, onSelectUser, onCreateUser, onUpdateUser, onDeleteUser }) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Developer');
  const [newUserAvatar, setNewUserAvatar] = useState('👩‍💻');

  const avatars = ['👩‍💻', '👨‍💻', '👩‍🔬', '👨‍💼', '👩‍🎨', '👨‍🎨', '🤖', '👾'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    
    if (editingUser) {
      onUpdateUser(editingUser.id, {
        name: newUserName.trim(),
        role: newUserRole,
        avatar: newUserAvatar
      });
    } else {
      onCreateUser({
        name: newUserName.trim(),
        role: newUserRole,
        avatar: newUserAvatar
      });
    }
    handleCancel();
  };

  const handleEdit = (user, e) => {
    e.stopPropagation();
    setEditingUser(user);
    setNewUserName(user.name);
    setNewUserRole(user.role);
    setNewUserAvatar(user.avatar);
    setShowAddUser(true);
  };

  const handleDelete = (userId, e) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar a este miembro del equipo? Esto también borrará todos sus registros de horas.')) {
      onDeleteUser(userId);
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setNewUserName('');
    setNewUserRole('Developer');
    setNewUserAvatar('👩‍💻');
    setShowAddUser(false);
  };

  return (
    <div className="glass-card user-selector-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} className="text-muted" /> Miembros de Equipo
        </h3>
        {!showAddUser && (
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
            onClick={() => setShowAddUser(true)}
          >
            <Plus size={14} /> Nuevo
          </button>
        )}
      </div>

      {showAddUser ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
            {editingUser ? 'Editar Miembro' : 'Nuevo Miembro'}
          </h4>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Nombre</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ej. Sofía Dev" 
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Rol</label>
            <select 
              className="form-control" 
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
            >
              <option value="Developer">Developer</option>
              <option value="QA Engineer">QA Engineer</option>
              <option value="Scrum Master">Scrum Master</option>
              <option value="Product Owner">Product Owner</option>
              <option value="UX/UI Designer">UX/UI Designer</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Avatar</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {avatars.map(av => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setNewUserAvatar(av)}
                  className={`btn-icon ${newUserAvatar === av ? 'active' : ''}`}
                  style={{ width: '32px', height: '32px', fontSize: '1.1rem' }}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flexGrow: 1, padding: '0.5rem' }}>
              {editingUser ? 'Guardar' : 'Agregar'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem' }}
              onClick={handleCancel}
            >
              <X size={16} />
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              No hay miembros registrados. ¡Crea el primero!
            </div>
          ) : (
            users.map(user => (
              <div key={user.id} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <button
                  className={`user-profile-btn ${currentUser?.id === user.id ? 'active' : ''}`}
                  onClick={() => onSelectUser(user)}
                  style={{ flexGrow: 1 }}
                >
                  <div className="user-avatar">{user.avatar}</div>
                  <div className="user-details">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">{user.role}</span>
                  </div>
                </button>
                <button 
                  className="btn-icon" 
                  style={{ width: '32px', height: '32px', flexShrink: 0 }}
                  onClick={(e) => handleEdit(user, e)}
                  title="Editar"
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  className="btn-icon" 
                  style={{ width: '32px', height: '32px', flexShrink: 0 }}
                  onClick={(e) => handleDelete(user.id, e)}
                  title="Eliminar"
                >
                  <Trash2 size={12} className="text-danger" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
