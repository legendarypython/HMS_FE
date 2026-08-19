import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import './styles/theme.css';
import { TENANT_ID } from './config/tenant';

// Error tracking - a no-op whenever REACT_APP_SENTRY_DSN isn't set at build
// time (e.g. local dev), same pattern as the backend's src/utils/sentry.js.
// Reminder: REACT_APP_* is inlined by CRA at BUILD time, not read at
// runtime - saving/changing this var in Cloudflare Pages only takes effect
// on the *next* deploy, not retroactively on whatever's already live.
// tracesSampleRate 0 and no replay/session-recording integration - only
// error name/message/stack ever leaves the browser, never page content,
// since real patient data (names, medical history) is visible on screen
// throughout this app.
const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.REACT_APP_SENTRY_ENVIRONMENT || 'production',
    tracesSampleRate: 0,
    sendDefaultPii: false,
    initialScope: { tags: { tenant: TENANT_ID } },
  });
}

// Catches render-time crashes app-wide (a white screen otherwise) - reports
// to Sentry and shows a plain apology instead of a blank page.
ReactDOM.render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <App />
  </Sentry.ErrorBoundary>,
  document.getElementById('root')
);

function ErrorFallback() {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Something went wrong</h2>
      <p>Please refresh the page. If this keeps happening, contact the hospital directly.</p>
    </div>
  );
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
