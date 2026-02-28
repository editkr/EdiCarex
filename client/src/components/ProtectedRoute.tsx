import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/stores/authStore'
import { Permission } from '@/constants/permissions'

interface ProtectedRouteProps {
    children?: React.ReactNode
    allowedRoles?: string[]
    requiredPermission?: Permission | string
    requireBoth?: boolean // Si true, requiere rol Y permiso
}

/**
 * Componente de ruta protegida con validación de roles y permisos granulares
 * Prioriza permisos sobre roles para mayor flexibilidad
 */
export default function ProtectedRoute({
    children,
    allowedRoles,
    requiredPermission,
    requireBoth = false
}: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuthStore()
    const { hasPermission, hasRole } = usePermissions()
    const localToken = localStorage.getItem('token')
    const location = useLocation()

    // 0. Prevenir bucle infinito si ya estamos en una ruta de auth
    const authPaths = ['/login', '/attendance/login', '/patient-portal/login']
    if (authPaths.includes(location.pathname)) {
        return children ? <>{children}</> : <Outlet />
    }

    // 1. Verificar autenticación
    if (!isAuthenticated && !localToken) {
        // Redirección inteligente: si es una ruta de asistencia, ir al login operativo
        if (location.pathname.startsWith('/attendance')) {
            return <Navigate to="/attendance/login" state={{ from: location }} replace />
        }
        if (location.pathname.startsWith('/patient-portal')) {
            return <Navigate to="/patient-portal/login" state={{ from: location }} replace />
        }
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // 2. Verificar permiso granular (PRIORIDAD)
    if (requiredPermission) {
        const hasRequiredPermission = hasPermission(requiredPermission)

        if (!hasRequiredPermission) {
            console.warn(`Acceso denegado: Falta permiso ${requiredPermission}`)

            if (location.pathname.startsWith('/attendance')) {
                return <Navigate to="/attendance/login" state={{ error: 'Acceso Restringido: Permiso Requerido' }} replace />
            }
            return <Navigate to="/dashboard" replace />
        }
    }

    // 3. Verificar rol (si se especifica y no se cumplió el permiso)
    if (allowedRoles) {
        const hasRequiredRole = hasRole(allowedRoles)

        // Si requireBoth es true, necesita AMBOS (rol Y permiso)
        if (requireBoth && requiredPermission) {
            if (!hasRequiredRole) {
                console.warn(`Acceso denegado: El rol ${user?.role} no está autorizado`)
                if (location.pathname.startsWith('/attendance')) {
                    return <Navigate to="/attendance/login" state={{ error: 'Acceso Restringido: Personal Autorizado' }} replace />
                }
                return <Navigate to="/dashboard" replace />
            }
        } else if (!requiredPermission && !hasRequiredRole) {
            // Solo validar rol si no hay permiso especificado
            console.warn(`Acceso denegado: El rol ${user?.role} no está autorizado`)
            if (location.pathname.startsWith('/attendance')) {
                return <Navigate to="/attendance/login" state={{ error: 'Acceso Restringido: Personal Autorizado' }} replace />
            }
            return <Navigate to="/dashboard" replace />
        }
    }

    return children ? <>{children}</> : <Outlet />
}
