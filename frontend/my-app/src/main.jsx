// src/main.jsx (Fixed for Sentry v9+)
import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from "@sentry/react";

// 🚀 Initialize Sentry FIRST!
console.log('🚀 Initializing Sentry...');
console.log('Environment:', import.meta.env.MODE);
console.log('DSN available:', !!import.meta.env.VITE_SENTRY_DSN);

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
  debug: true,
  // Fixed integrations for Sentry v9+
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      sessionSampleRate: 0.1,
      errorSampleRate: 1.0,
    }),
  ],
  beforeSend(event, hint) {
    console.log('🎯 Sentry beforeSend called!');
    console.log('Environment:', import.meta.env.MODE);
    console.log('Event:', event.exception?.values?.[0]?.value || 'Unknown error');
    
    if (import.meta.env.MODE === 'development') {
      console.log('📝 Development mode - error logged but not sent to Sentry');
      return null;
    } else {
      console.log('🚀 Production mode - sending error to Sentry!');
      return event;
    }
  },
});

console.log('✅ Sentry initialized successfully!');

import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
