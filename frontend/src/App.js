import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Databases from './pages/Databases';
import Backups from './pages/Backups';
import Configuration from './pages/Configuration';
import Monitoring from './pages/Monitoring';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/databases" element={<Databases />} />
          <Route path="/backups" element={<Backups />} />
          <Route path="/configuration" element={<Configuration />} />
          <Route path="/monitoring" element={<Monitoring />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App; 