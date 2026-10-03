import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const App = React.lazy(() => import('./App'));
const NewsWindow = React.lazy(() =>
  import('./components/NewsWindow').then(module => ({ default: module.NewsWindow }))
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <React.Suspense fallback={null}>
      {new URLSearchParams(window.location.search).has('news') ? <NewsWindow /> : <App />}
    </React.Suspense>
  </React.StrictMode>
);
