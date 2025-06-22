// src/sentry.js
import * as Sentry from "@sentry/react";

// 🎯 Your CF Studio Sentry configuration!
Sentry.init({
  // Your actual DSN from Sentry dashboard
  dsn: process.env.REACT_APP_SENTRY_DSN,
  
  // Which environment are we in?
  environment: process.env.NODE_ENV, // "development" or "production"
  
  // How many errors to capture (1.0 = 100%)
  tracesSampleRate: 1.0,
  
  // Capture user interactions (clicks, navigation)
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      // Record 10% of normal sessions
      sessionSampleRate: 0.1,
      // Record 100% of sessions with errors
      errorSampleRate: 1.0,
    }),
  ],
  
  // Don't spam Sentry in development
  beforeSend(event, hint) {
    // Only send errors in production
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry Error (dev mode):', event);
      return null; // Don't send to Sentry in dev
    }
    return event;
  },
});

export default Sentry; 