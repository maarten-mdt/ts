import { createContext, useContext } from 'react'

const defaultAuth = { isSignedIn: false, getToken: async () => null }
const AuthContext = createContext(defaultAuth)

export function useAppAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children, value = defaultAuth }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
