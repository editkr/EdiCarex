import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'LAB' | 'PHARMACY' | 'HR' | 'BILLING' | 'MANAGEMENT' | 'AUDIT' | 'PATIENT'

interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
    avatar?: string
    preferences?: {
        permissions?: string[]
        [key: string]: any
    }
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    setUser: (user: User | null) => void
    setToken: (token: string | null) => void
    login: (user: User, token: string) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setToken: (token) => set({ token }),
            login: (user, token) => {
                // Normalize role to string if it comes as an object from backend
                const roleRaw = (typeof user.role === 'object' && user.role !== null)
                    ? (user.role as any).name
                    : user.role

                const normalizedRole = String(roleRaw).toUpperCase() as UserRole

                // Security Check: Patients are NOT allowed in the main system
                if (normalizedRole === 'PATIENT' as any) {
                    console.warn('Security Alert: Patient attempted to access Staff Portal')
                    // Do not set user/token
                    // Could potentially throw or handle via UI, but for now just don't authenticate
                    return
                }

                const normalizedUser = {
                    ...user,
                    role: normalizedRole
                }
                set({ user: normalizedUser, token, isAuthenticated: true })
                // Ensure token is immediately available in localStorage for API interceptors
                // (Zustand persist can be async, but the next page load needs the token NOW)
                localStorage.setItem('token', token)
            },
            logout: () => {
                localStorage.removeItem('token')
                set({ user: null, token: null, isAuthenticated: false })
            },
        }),
        {
            name: 'edicarex-auth',
        }
    )
)
