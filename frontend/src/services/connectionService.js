import api from './api.js';

export const connectionService = {
  async list() {
    const { data } = await api.get('/connections');
    return data.content || data.connections || data;
  },
  async create(connection) {
    const { data } = await api.post('/connections', connection);
    return data;
  },
};
