import axios from 'axios';
import { Note } from '../types';
import { StringMappingType } from 'typescript';

const API_URL = process.env.REACT_APP_API_URL + '/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  export const api = {
    getNotes: async (search = '', page = 1, limit = 5): Promise<{ notes: Note[]; total: number; page: number; limit: number }> => {
      const response = await axios.get(
        `${API_URL}/notes?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    },
    getNote: async (id: string): Promise<Note> => {
      const response = await axios.get(`${API_URL}/notes/${id}`, { headers: getAuthHeaders() });
      return response.data;
    },
    createNote: async (note: Omit<Note, 'id' | 'created_at' | 'updated_at'|'summary'>): Promise<Note> => {
      const response = await axios.post(`${API_URL}/notes`, note, { headers: getAuthHeaders() });
      return response.data;
    },
    updateNote: async (id: string, note: Partial<Note>): Promise<Note> => {
      const response = await axios.put(`${API_URL}/notes/${id}`, note, { headers: getAuthHeaders() });
      return response.data;
    },
    deleteNote: async (id: string): Promise<void> => {
      await axios.delete(`${API_URL}/notes/${id}`, { headers: getAuthHeaders() });
    },
    signup: async (username: string, password: string) => {
      return axios.post(`${API_URL}/signup`, { username, password });
    },
    login: async (username: string, password: string) => {
      return axios.post(`${API_URL}/login`, { username, password });
    },
  };
  