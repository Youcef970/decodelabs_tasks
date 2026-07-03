import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Dashboard from './components/Dashboard';
import EmailAnalyzer from './components/EmailAnalyzer';
import TrainingSimulator from './components/TrainingSimulator';
import Stats from './components/Stats';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#161B26',
            color: '#E8EAED',
            border: '1px solid #2A3140',
            borderRadius: '8px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#3FB950', secondary: '#0B0E14' } },
          error: { iconTheme: { primary: '#E5484D', secondary: '#0B0E14' } },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analyze" element={<EmailAnalyzer />} />
          <Route path="/training" element={<TrainingSimulator />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
