import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { getDatabases, addDatabase, updateDatabase, removeDatabase, testConnection } from '../api';

const Databases = () => {
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDatabase, setEditingDatabase] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    host: '',
    port: 5432,
    user: '',
    password: '',
    backupConfigs: [
      {
        type: 'full',
        schedule: '0 1,13 * * *',
        retention: 7,
        enabled: true,
      },
      {
        type: 'incr',
        schedule: '0 * * * *',
        retention: 24,
        enabled: true,
      },
    ],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      setLoading(true);
      const { data } = await getDatabases();
      setDatabases(data);
      setError(null);
    } catch (err) {
      setError('Failed to load databases. Please try again later.');
      console.error('Database fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (database = null) => {
    if (database) {
      setEditingDatabase(database);
      setFormData({ ...database });
    } else {
      setEditingDatabase(null);
      setFormData({
        id: `db_${Date.now()}`,
        name: '',
        host: '',
        port: 5432,
        user: '',
        password: '',
        backupConfigs: [
          {
            type: 'full',
            schedule: '0 1,13 * * *',
            retention: 7,
            enabled: true,
          },
          {
            type: 'incr',
            schedule: '0 * * * *',
            retention: 24,
            enabled: true,
          },
        ],
      });
    }
    setOpenDialog(true);
    setTestResult(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTestResult(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingDatabase) {
        await updateDatabase(editingDatabase.id, formData);
        setSnackbar({
          open: true,
          message: 'Database updated successfully',
          severity: 'success',
        });
      } else {
        await addDatabase(formData);
        setSnackbar({
          open: true,
          message: 'Database added successfully',
          severity: 'success',
        });
      }
      handleCloseDialog();
      fetchDatabases();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to ${editingDatabase ? 'update' : 'add'} database: ${err.message}`,
        severity: 'error',
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this database?')) {
      try {
        await removeDatabase(id);
        setSnackbar({
          open: true,
          message: 'Database removed successfully',
          severity: 'success',
        });
        fetchDatabases();
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Failed to remove database: ${err.message}`,
          severity: 'error',
        });
      }
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      const { data } = await testConnection({
        host: formData.host,
        port: formData.port,
        user: formData.user,
        password: formData.password,
        dbName: formData.name,
      });
      setTestResult({
        success: data.success,
        message: data.success ? 'Connection successful!' : 'Connection failed',
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: `Connection test failed: ${err.message}`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Databases
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Database
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {databases.length > 0 ? (
          databases.map((db) => (
            <Grid item xs={12} md={6} key={db.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="div">
                    {db.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Host: {db.host}:{db.port}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    User: {db.user}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Backup Configurations:
                  </Typography>
                  <ul>
                    {db.backupConfigs.map((config, index) => (
                      <li key={index}>
                        {config.type} - Schedule: {config.schedule} - Retention: {config.retention} days
                        {config.enabled ? ' (Enabled)' : ' (Disabled)'}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardActions>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(db)}
                    aria-label="edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(db.id)}
                    aria-label="delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">
              No databases configured. Click the "Add Database" button to add one.
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Add/Edit Database Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDatabase ? 'Edit Database' : 'Add Database'}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="Database Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="host"
            label="Host"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.host}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="port"
            label="Port"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.port}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="user"
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.user}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="password"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={handleInputChange}
            required
          />

          {testResult && (
            <Alert
              severity={testResult.success ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              {testResult.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleTestConnection}
            color="primary"
            disabled={testingConnection}
          >
            {testingConnection ? <CircularProgress size={24} /> : 'Test Connection'}
          </Button>
          <Button onClick={handleSubmit} color="primary">
            {editingDatabase ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Databases; 