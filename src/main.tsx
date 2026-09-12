import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NewsWindow } from './components/NewsWindow';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {new URLSearchParams(window.location.search).has('news') ? <NewsWindow /> : <App />}
  </React.StrictMode>
);
