import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Limpeza de inicialização para expurgar dados residuais do navegador (localStorage e sessionStorage)
const PURGE_KEY = 'hemingway_clean_state_v1'
if (!localStorage.getItem(PURGE_KEY)) {
  try {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem(PURGE_KEY, 'true')
  } catch (e) {
    console.warn('Aviso ao inicializar limpeza de armazenamento local:', e)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
