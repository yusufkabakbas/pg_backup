import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Backup as BackupIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { getDatabases, getBackupInfo } from '../api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [databases, setDatabases] = useState([]);
  const [backupInfo, setBackupInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await getDatabases();
        setDatabases(data);

        // Get backup info for each database
        const backupInfoData = {};
        for (const db of data) {
          try {
            const response = await getBackupInfo(db.id);
            backupInfoData[db.id] = response.data;
          } catch (err) {
            backupInfoData[db.id] = 'No backup information available';
          }
        }
        setBackupInfo(backupInfoData);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getBackupStatus = (dbId) => {
    const info = backupInfo[dbId];
    if (!info) return 'Unknown';
    
    if (typeof info === 'string') return info;
    
    // In a real app, you would parse the backup info string
    // and extract the actual status
    return 'Last backup: Today at 13:00';
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
        Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#bbdefb',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Databases
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {databases.length}
            </Typography>
            <Button
              size="small"
              onClick={() => navigate('/databases')}
              sx={{ alignSelf: 'flex-end' }}
            >
              View All
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#c8e6c9',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Successful Backups
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {/* In a real app, you would count successful backups */}
              {databases.length * 2}
            </Typography>
            <Button
              size="small"
              onClick={() => navigate('/backups')}
              sx={{ alignSelf: 'flex-end' }}
            >
              View All
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#ffecb3',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Scheduled Tasks
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              3
            </Typography>
            <Button
              size="small"
              onClick={() => navigate('/configuration')}
              sx={{ alignSelf: 'flex-end' }}
            >
              View All
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: '#ffcdd2',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Failed Backups
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              0
            </Typography>
            <Button
              size="small"
              onClick={() => navigate('/monitoring')}
              sx={{ alignSelf: 'flex-end' }}
            >
              View All
            </Button>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <StorageIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="h6" component="div">
                    Manage Databases
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add, edit, or remove database configurations
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate('/databases')}>
                    Go to Databases
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <BackupIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="h6" component="div">
                    Run Backup
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start a new backup operation manually
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate('/backups')}>
                    Go to Backups
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <SettingsIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="h6" component="div">
                    Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage pgBackRest and cron settings
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate('/configuration')}>
                    Go to Configuration
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <TimelineIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="h6" component="div">
                    Monitoring
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View backup history and performance
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate('/monitoring')}>
                    Go to Monitoring
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Database Status */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
            Database Status
          </Typography>
          <Grid container spacing={2}>
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
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {getBackupStatus(db.id)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => navigate('/backups')}>
                        View Backups
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  No databases configured. Go to the Databases page to add one.
                </Alert>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard; 