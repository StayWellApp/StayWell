import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// This is a basic configuration. In a real app, you might load
// translations from a server or split them into multiple files.
const resources = {
  en: {
    translation: {
      // Sidebar
      "Dashboard": "Dashboard",
      "Properties": "Properties",
      "Chat": "Chat",
      "Team": "Team",
      "Templates": "Templates",
      "Storage": "Storage",
      "Calendar": "Calendar",
      // Admin Sidebar
      "Clients": "Clients",
      "Subscriptions": "Subscriptions",
      "Billing": "Billing",
      "Audit Log": "Audit Log",
      // User Menu
      "Settings": "Settings",
      "Language": "Language",
      "Logout": "Logout",
      // Top Bar
      "Search...": "Search..."
    }
  },
  es: {
    translation: {
      // Sidebar
      "Dashboard": "Panel",
      "Properties": "Propiedades",
      "Chat": "Chat",
      "Team": "Equipo",
      "Templates": "Plantillas",
      "Storage": "Almacenamiento",
      "Calendar": "Calendario",
      // Admin Sidebar
      "Clients": "Clientes",
      "Subscriptions": "Suscripciones",
      "Billing": "Facturación",
      "Audit Log": "Registro de Auditoría",
      // User Menu
      "Settings": "Ajustes",
      "Language": "Idioma",
      "Logout": "Cerrar Sesión",
      // Top Bar
      "Search...": "Buscar..."
    }
  }
};

i18n
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Use English if the detected language is not available
    interpolation: {
      escapeValue: false // React already safes from xss
    }
  });

export default i18n;