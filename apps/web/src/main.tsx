import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './modules/auth/data/AuthContext'
import { RealtimeProvider } from './shared/realtime/RealtimeContext'
import { WorkspaceProvider } from './modules/workspace/data/WorkspaceContext'
import { NotificationProvider } from './modules/notification/data/NotificationContext'
import { ThemeProvider } from './modules/theme/data/ThemeContext'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { ToastProvider } from './shared/ui/toast'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <ToastProvider position="top-right">
            <AuthProvider>
              <RealtimeProvider>
                <WorkspaceProvider>
                  <NotificationProvider>
                    <Suspense>
                      <App />
                    </Suspense>
                  </NotificationProvider>
                </WorkspaceProvider>
              </RealtimeProvider>
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
