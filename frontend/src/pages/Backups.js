import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import {
  Backup as BackupIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getDatabases, runBackup, runCleanup, getBackupInfo } from '../api';

const Backups = () => {
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [backupType, setBackupType] = useState('full');
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backupInfo, setBackupInfo] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (selectedDatabase) {
      fetchBackupInfo(selectedDatabase);
    }
  }, [selectedDatabase]);

  const fetchDatabases = async () => {
    try {
      setLoading(true);
      const { data } = await getDatabases();
      setDatabases(data);
      if (data.length > 0) {
        setSelectedDatabase(data[0].id);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load databases. Please try again later.');
      console.error('Database fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackupInfo = async (databaseId) => {
    try {
      const { data } = await getBackupInfo(databaseId);
      setBackupInfo((prev) => ({ ...prev, [databaseId]: data }));
    } catch (err) {
      console.error('Backup info fetch error:', err);
      setBackupInfo((prev) => ({
        ...prev,
        [databaseId]: 'Failed to load backup information',
      }));
    }
  };

  const handleDatabaseChange = (event) => {
    setSelectedDatabase(event.target.value);
  };

  const handleBackupTypeChange = (event) => {
    setBackupType(event.target.value);
  };

  const handleRunBackup = async () => {
    try {
      setBackupLoading(true);
      await runBackup(selectedDatabase, backupType);
      setSnackbar({
        open: true,
        message: `${backupType.toUpperCase()} backup started successfully`,
        severity: 'success',
      });
      // Refresh backup info after a short delay
      setTimeout(() => {
        fetchBackupInfo(selectedDatabase);
      }, 2000);
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to start backup: ${err.message}`,
        severity: 'error',
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRunCleanup = async () => {
    try {
      setCleanupLoading(true);
      await runCleanup(selectedDatabase);
      setSnackbar({
        open: true,
        message: 'Cleanup started successfully',
        severity: 'success',
      });
      // Refresh backup info after a short delay
      setTimeout(() => {
        fetchBackupInfo(selectedDatabase);
      }, 2000);
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to start cleanup: ${err.message}`,
        severity: 'error',
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleRefreshInfo = () => {
    if (selectedDatabase) {
      fetchBackupInfo(selectedDatabase);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatBackupInfo = (info) => {
    if (!info) return 'No backup information available';
    if (typeof info === 'string') return info;

    // In a real app, you would parse the pgBackRest info output
    // and format it nicely. For now, we'll just display it as is.
    return (
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{info}</pre>
    );
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
      <Typography variant="h4" gutterBottom>
        Backups
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Run Backup
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="database-select-label">Database</InputLabel>
                  <Select
                    labelId="database-select-label"
                    id="database-select"
                    value={selectedDatabase}
                    label="Database"
                    onChange={handleDatabaseChange}
                    disabled={databases.length === 0}
                  >
                    {databases.map((db) => (
                      <MenuItem key={db.id} value={db.id}>
                        {db.name} ({db.host}:{db.port})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="backup-type-label">Backup Type</InputLabel>
                  <Select
                    labelId="backup-type-label"
                    id="backup-type"
                    value={backupType}
                    label="Backup Type"
                    onChange={handleBackupTypeChange}
                  >
                    <MenuItem value="full">Full</MenuItem>
                    <MenuItem value="incr">Incremental</MenuItem>
                    <MenuItem value="diff">Differential</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<BackupIcon />}
                    onClick={handleRunBackup}
                    disabled={!selectedDatabase || backupLoading}
                    fullWidth
                  >
                    {backupLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Run Backup'
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<DeleteIcon />}
                    onClick={handleRunCleanup}
                    disabled={!selectedDatabase || cleanupLoading}
                    fullWidth
                  >
                    {cleanupLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Run Cleanup'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Backup Information
                </Typography>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={handleRefreshInfo}
                  disabled={!selectedDatabase}
                >
                  Refresh
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {selectedDatabase ? (
                formatBackupInfo(backupInfo[selectedDatabase])
              ) : (
                <Alert severity="info">
                  Select a database to view backup information
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Backup Schedule
          </Typography>
          {databases.length > 0 ? (
            databases.map((db) => (
              <Card key={db.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" component="div">
                    {db.name} ({db.host}:{db.port})
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {db.backupConfigs.map((config, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Chip
                          label={config.type.toUpperCase()}
                          color={
                            config.type === 'full'
                              ? 'primary'
                              : config.type === 'incr'
                              ? 'success'
                              : 'warning'
                          }
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" component="span">
                          Schedule: {config.schedule} - Retention: {config.retention} days
                          {config.enabled ? ' (Enabled)' : ' (Disabled)'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            ))
          ) : (
            <Alert severity="info">
              No databases configured. Go to the Databases page to add one.
            </Alert>
          )}
        </Grid>
      </Grid>

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

export default Backups; 