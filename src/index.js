import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // <-- FIX #1: Imports the CSS file
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './components/Auth'; // <-- FIX #2: Imports Auth logic
import { AdminProvider } from './contexts/AdminContext'; // <-- FIX #3: Imports Admin logic

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider> {/* <-- FIX #2: Provides Auth logic to App */}
          <AdminProvider> {/* <-- FIX #3: Provides Admin logic to App */}
            <App />
          </AdminProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();