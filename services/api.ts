import { Note, Folder, Tag } from '../types';

const API_BASE = '/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const api = {
    // Auth
    login: async (email: string, password: string) => {
        const res = await fetch(`${API_BASE}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email, password })
        });
        if (!res.ok) throw new Error('Login failed');
        return res.json();
    },

    register: async (name: string, email: string, password: string) => {
        const res = await fetch(`${API_BASE}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', name, email, password })
        });
        if (!res.ok) throw new Error('Registration failed');
        return res.json();
    },

    updateUser: async (name: string, avatar: string) => {
        const res = await fetch(`${API_BASE}/auth`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ action: 'update', name, avatar })
        });
        if (!res.ok) throw new Error('Update failed');
        return res.json();
    },

    // Data
    getInitialData: async () => {
        const res = await fetch(`${API_BASE}/data`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
    },

    saveNote: async (note: Partial<Note>) => {
        const res = await fetch(`${API_BASE}/data`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ type: 'note', data: note })
        });
        return res.json();
    },

    deleteNote: async (id: string) => {
        await fetch(`${API_BASE}/data`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ type: 'note', id })
        });
    },

    saveFolder: async (folder: Folder) => {
        await fetch(`${API_BASE}/data`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ type: 'folder', data: folder })
        });
    },

    saveTag: async (tag: Tag) => {
        await fetch(`${API_BASE}/data`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ type: 'tag', data: tag })
        });
    },

    deleteTag: async (id: string) => {
        await fetch(`${API_BASE}/data`, {
            method: 'DELETE',
            headers: getHeaders(),
            body: JSON.stringify({ type: 'tag', id })
        });
    }
};