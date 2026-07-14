import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './sls.css'
import App from './App.tsx'
import { LanguageProvider } from './context/language'
import { AuthProvider } from './context/auth'
import { CartProvider } from './context/cart'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
