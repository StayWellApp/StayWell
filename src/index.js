import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // <-- 1. Imports CSS
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './contexts/ThemeContext'; // <-- 2. Import Theme
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './components/Auth'; // <-- 3. Import Auth
import { AdminProvider } from './contexts/AdminContext'; // <-- 4. Import Admin

window.addEventListener('error', e => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
    const resizeObserverErrDiv = document.getElementById(
      'webpack-dev-server-client-overlay-div'
    );
    const resizeObserverErr = document.getElementById(
      'webpack-dev-server-client-overlay'
    );
    if (resizeObserverErr) {
      resizeObserverErr.setAttribute('style', 'display: none');
    }
    if (resizeObserverErrDiv) {
      resizeObserverErrDiv.setAttribute('style', 'display: none');
    }
  }
});
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider> {/* <-- 5. Wrap everything in Theme */}
        <AuthProvider> {/* <-- 6. Wrap everything in Auth */}
          <AdminProvider> {/* <-- 7. Wrap everything in Admin */}
            <App />
          </AdminProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();