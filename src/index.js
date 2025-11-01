import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // <-- Imports the CSS you just fixed
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './components/Auth'; // <-- 1. Imports Auth logic
import { AdminProvider } from './contexts/AdminContext'; // <-- 2. Imports Admin logic

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider> {/* <-- 3. Provides Auth logic to App */}
          <AdminProvider> {/* <-- 4. Provides Admin logic to App */}
            <App />
          </AdminProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();