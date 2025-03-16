import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { getPgBackRestConfig, updatePgBackRestConfig, getCronConfig, updateCronConfig } from '../api';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Configuration = () => {
  const [tabValue, setTabValue] = useState(0);
  const [pgbackrestConfig, setPgbackrestConfig] = useState({ global: {}, stanzas: {} });
  const [cronConfig, setCronConfig] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const [pgbackrestResponse, cronResponse] = await Promise.all([
        getPgBackRestConfig(),
        getCronConfig(),
      ]);
      setPgbackrestConfig(pgbackrestResponse.data);
      setCronConfig(cronResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load configurations. Please try again later.');
      console.error('Configuration fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handlePgBackRestConfigChange = (section, key, value) => {
    if (section === 'global') {
      setPgbackrestConfig({
        ...pgbackrestConfig,
        global: {
          ...pgbackrestConfig.global,
          [key]: value,
        },
      });
    } else {
      setPgbackrestConfig({
        ...pgbackrestConfig,
        stanzas: {
          ...pgbackrestConfig.stanzas,
          [section]: {
            ...pgbackrestConfig.stanzas[section],
            [key]: value,
          },
        },
      });
    }
  };

  const handleCronConfigChange = (event) => {
    setCronConfig(event.target.value);
  };

  const handleSavePgBackRestConfig = async () => {
    try {
      setSaving(true);
      await updatePgBackRestConfig(pgbackrestConfig);
      setSnackbar({
        open: true,
        message: 'pgBackRest configuration saved successfully',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to save pgBackRest configuration: ${err.message}`,
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCronConfig = async () => {
    try {
      setSaving(true);
      await updateCronConfig(cronConfig);
      setSnackbar({
        open: true,
        message: 'Cron configuration saved successfully',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to save cron configuration: ${err.message}`,
        severity: 'error',
      });
    } finally {
      setSaving(false);
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
      <Typography variant="h4" gutterBottom>
        Configuration
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="pgBackRest Configuration" />
          <Tab label="Cron Configuration" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Global Settings
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(pgbackrestConfig.global).map(([key, value]) => (
                  <Grid item xs={12} md={6} key={key}>
                    <TextField
                      fullWidth
                      label={key}
                      value={value}
                      onChange={(e) => handlePgBackRestConfigChange('global', key, e.target.value)}
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Stanza Settings
              </Typography>
              {Object.entries(pgbackrestConfig.stanzas).map(([stanza, settings]) => (
                <div key={stanza}>
                  <Typography variant="subtitle1" gutterBottom>
                    [{stanza}]
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(settings).map(([key, value]) => (
                      <Grid item xs={12} md={6} key={key}>
                        <TextField
                          fullWidth
                          label={key}
                          value={value}
                          onChange={(e) => handlePgBackRestConfigChange(stanza, key, e.target.value)}
                          variant="outlined"
                          margin="normal"
                        />
                      </Grid>
                    ))}
                  </Grid>
                </div>
              ))}
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSavePgBackRestConfig}
                disabled={saving}
              >
                {saving ? <CircularProgress size={24} /> : 'Save Configuration'}
              </Button>
            </CardActions>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cron Schedule
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure the backup schedule using cron syntax. Each line represents a scheduled task.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                value={cronConfig}
                onChange={handleCronConfigChange}
                variant="outlined"
                margin="normal"
                placeholder="# minute hour day month weekday command"
              />
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveCronConfig}
                disabled={saving}
              >
                {saving ? <CircularProgress size={24} /> : 'Save Cron Configuration'}
              </Button>
            </CardActions>
          </Card>
        </TabPanel>
      </Paper>

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

export default Configuration; 