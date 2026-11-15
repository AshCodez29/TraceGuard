import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProjectProvider } from './context/ProjectContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import './styles/theme.css';
import './styles/global.css';
import './styles/components.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <ToastProvider><App /></ToastProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
