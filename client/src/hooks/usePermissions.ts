import { useAuthStore } from '@/stores/authStore'
import { Permission } from '@/constants/permissions'

/**
 * Hook personalizado para validación de permisos y roles
 * Centraliza toda la lógica de autorización en un solo lugar
 */
export function usePermissions() {
    const { user } = useAuthStore()

    /**
     * Verifica si el usuario tiene un permiso específico
     * @param permission - Permiso a verificar
     * @returns true si el usuario tiene el permiso
     */
    const hasPermission = (permission: Permission | string): boolean => {
        if (!user) return false

        // Admin tiene acceso total
        if (user.role === 'ADMIN') return true

        const userPermissions = user.preferences?.permissions || []

        // Verificar permiso específico o ALL
        return userPermissions.includes(permission) ||
            userPermissions.includes('ALL')
    }

    /**
     * Verifica si el usuario tiene uno de varios roles
     * @param role - Rol o array de roles a verificar
     * @returns true si el usuario tiene alguno de los roles
     */
    const hasRole = (role: string | string[]): boolean => {
        if (!user) return false
        const roles = Array.isArray(role) ? role : [role]
        return roles.includes(user.role)
    }

    /**
     * Verifica si el usuario tiene AL MENOS UNO de los permisos
     * @param permissions - Array de permisos a verificar
     * @returns true si el usuario tiene al menos uno
     */
    const hasAnyPermission = (permissions: (Permission | string)[]): boolean => {
        return permissions.some(p => hasPermission(p))
    }

    /**
     * Verifica si el usuario tiene TODOS los permisos
     * @param permissions - Array de permisos a verificar
     * @returns true si el usuario tiene todos
     */
    const hasAllPermissions = (permissions: (Permission | string)[]): boolean => {
        return permissions.every(p => hasPermission(p))
    }

    /**
     * Verifica si el usuario puede acceder a un recurso
     * Combina validación de rol y permiso
     * @param options - Opciones de validación
     * @returns true si el usuario tiene acceso
     */
    const canAccess = (options: {
        roles?: string[]
        permission?: Permission | string
        requireBoth?: boolean
    }): boolean => {
        const { roles, permission, requireBoth = false } = options

        const hasRequiredRole = roles ? hasRole(roles) : true
        const hasRequiredPermission = permission ? hasPermission(permission) : true

        if (requireBoth) {
            return hasRequiredRole && hasRequiredPermission
        }

        return hasRequiredRole || hasRequiredPermission
    }

    return {
        hasPermission,
        hasRole,
        hasAnyPermission,
        hasAllPermissions,
        canAccess
    }
}
