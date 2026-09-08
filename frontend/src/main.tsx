import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import './sls.css'
import App from './App.tsx'
import { LanguageProvider } from './context/language'
import { AuthProvider } from './context/auth'
import { CartProvider } from './context/cart'
import { ThemeProvider } from './context/theme'
import ErrorBoundary from './components/ErrorBoundary'
import { installErrorReporting } from './lib/reportError'

// Installed before the tree mounts, so a crash during the first render is
// still heard.
installErrorReporting()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Outside the providers: if one of them throws while initialising,
        something still has to catch it. */}
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
)
