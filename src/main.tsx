import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { handleOAuthCallbackInPopup } from './lib/supabaseAuth';

// If this window is a popup OAuth callback, exchange tokens, notify parent window and close
if (!handleOAuthCallbackInPopup()) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
