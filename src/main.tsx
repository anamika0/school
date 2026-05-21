import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // এই লাইনটি যুক্ত করা হয়েছে

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);