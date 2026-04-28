import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <AuthProvider>
        <TaskProvider>
          <ThemeProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1a1a2e',
                  color: '#f1f5f9',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
              }}
            />
          </ThemeProvider>
        </TaskProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
