import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import './sls.css'
import App from './App.tsx'
import { LanguageProvider } from './context/language'
import { AuthProvider } from './context/auth'
import { CartProvider } from './context/cart'
import { ThemeProvider } from './context/theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)
