import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster 
      position="top-right" 
      toastOptions={{
        style: {
          background: '#18181b', // zinc-900
          color: '#fff',
          border: '1px solid #27272a', // zinc-800
        }
      }} 
    />
  </StrictMode>,
);
