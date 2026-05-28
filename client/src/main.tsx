import { StrictMode } from 'react';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import ReactDOM from 'react-dom/client';
import { WordListProvider } from './context/WordListContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Analytics />
    <WordListProvider>
      <App />
    </WordListProvider>
  </StrictMode>,
);
