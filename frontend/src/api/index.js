import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Axios interceptor to handle API errors
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    
    // Log environment info in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Base URL:', API_URL);
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`API Error (${error.response.status}):`, error.response.data);
    } else if (error.request) {
      console.error('API No Response Error:', error.request);
    } else {
      console.error('API Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Backup API
export const getDatabases = () => api.get('/backup/databases');
export const addDatabase = (data) => api.post('/backup/databases', data);
export const updateDatabase = (id, data) => api.put(`/backup/databases/${id}`, data);
export const removeDatabase = (id) => api.delete(`/backup/databases/${id}`);
export const runBackup = (databaseId, type) => api.post(`/backup/run/${databaseId}/${type}`);
export const runCleanup = (databaseId) => api.post(`/backup/cleanup/${databaseId}`);
export const getBackupInfo = (databaseId) => api.get(`/backup/info/${databaseId}`);

// Configuration API
export const getPgBackRestConfig = () => api.get('/configuration/pgbackrest');
export const updatePgBackRestConfig = (data) => api.put('/configuration/pgbackrest', data);
export const getCronConfig = () => api.get('/configuration/cron');
export const updateCronConfig = (content) => api.put('/configuration/cron', { content });

// Database API
export const getDatabaseInfo = (host, port, user, password, dbName) => 
  api.get(`/database/info/${host}/${port}/${user}/${password}/${dbName}`);
export const testConnection = (data) => api.post('/database/test-connection', data);

// Monitoring API
export const getSystemResources = () => api.get('/monitoring/system');
export const getBackupHistory = (databaseId) => api.get(`/monitoring/backups/${databaseId}`);
export const getLogs = (lines = 100) => api.get(`/monitoring/logs?lines=${lines}`);
export const runStanzaCheck = (databaseId) => api.post(`/monitoring/check/${databaseId}`);
export const getBackupStatus = (databaseId) => api.get(`/monitoring/status/${databaseId}`);

export default api; 