import api from './api.js';

export const userService = {
  async list() {
    const { data } = await api.get('/users');
    return data.content || data.users || data;
  },
  async create(user) {
    const { data } = await api.post('/users', user);
    return data;
  },
  async update(id, patch) {
    const { data } = await api.patch(`/users/${id}`, patch);
    return data;
  },
};
