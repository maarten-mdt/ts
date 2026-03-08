import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './lib/AuthProvider'
import App from './App'
import './index.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? ''
const hasClerk = !!publishableKey

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000 },
  },
})

function ClerkAuthBridge({ children }) {
  const auth = useAuth()
  return (
    <AuthProvider value={{ isSignedIn: auth.isSignedIn, getToken: auth.getToken }}>
      {children}
    </AuthProvider>
  )
}

function AppWithAuth() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {hasClerk ? (
      <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
        <ClerkAuthBridge>
          <AppWithAuth />
        </ClerkAuthBridge>
      </ClerkProvider>
    ) : (
      <AuthProvider>
        <AppWithAuth />
      </AuthProvider>
    )}
  </React.StrictMode>,
)
