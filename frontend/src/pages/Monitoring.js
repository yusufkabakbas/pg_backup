import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getDatabases, getBackupInfo } from '../api';

// Mock data for charts - in a real app, this would come from the API
const generateMockBackupSizeData = () => {
  const data = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString(),
      full: Math.floor(Math.random() * 500) + 1000,
      incremental: Math.floor(Math.random() * 100) + 50,
    });
  }
  return data;
};

const generateMockBackupTimeData = () => {
  const data = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString(),
      duration: Math.floor(Math.random() * 300) + 60,
    });
  }
  return data;
};

const generateMockBackupStatusData = () => {
  return [
    { name: 'Successful', value: 28 },
    { name: 'Failed', value: 2 },
    { name: 'In Progress', value: 1 },
  ];
};

const COLORS = ['#4caf50', '#f44336', '#2196f3'];

const Monitoring = () => {
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [backupInfo, setBackupInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backupSizeData] = useState(generateMockBackupSizeData());
  const [backupTimeData] = useState(generateMockBackupTimeData());
  const [backupStatusData] = useState(generateMockBackupStatusData());

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
        Monitoring
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
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
          </Paper>
        </Grid>

        {/* Backup Size Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup Size Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={backupSizeData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis unit="MB" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="full"
                    name="Full Backup"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="incremental"
                    name="Incremental Backup"
                    stroke="#82ca9d"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Backup Time Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup Duration
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={backupTimeData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis unit="s" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="duration"
                    name="Duration (seconds)"
                    fill="#8884d8"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Backup Status Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup Status (Last 30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={backupStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {backupStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Backup Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup Information
              </Typography>
              {selectedDatabase ? (
                <Box
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.875rem',
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  {backupInfo[selectedDatabase] || 'No backup information available'}
                </Box>
              ) : (
                <Alert severity="info">
                  Select a database to view backup information
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Resource Usage */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Resource Usage During Backups
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={backupTimeData} // Reusing the time data for this example
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" unit="%" />
                  <YAxis yAxisId="right" orientation="right" unit="MB" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="duration"
                    name="CPU Usage (%)"
                    stroke="#8884d8"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    // Using the same data for example purposes
                    dataKey="duration"
                    name="Memory Usage (MB)"
                    stroke="#82ca9d"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Monitoring; 