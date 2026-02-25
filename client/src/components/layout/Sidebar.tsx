import { useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { useOrganization } from '@/contexts/OrganizationContext'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Stethoscope,
    Calendar,
    Bed,
    Pill,
    FlaskConical,
    Receipt,
    FileText,
    Settings,
    Activity,
    UserCog,
    AlertTriangle,
    Sliders,
    MessageSquare,
    BarChart3,
    ChevronDown,
    ChevronRight,
    Clock,
    Shield,
} from 'lucide-react'

// Tipos de roles profesionales
import { UserRole } from '@/stores/authStore'

const AILogoIcon = ({ className }: { className?: string }) => (
    <div className={cn("flex items-center justify-center", className)}>
        <img
            src="/assets/logoIA.png"
            alt="AI"
            className="w-full h-full object-contain"
        />
    </div>
);

interface MenuItem {
    icon: any
    label: string
    path: string
    roles?: UserRole[] // Si no se especifica, está disponible para todos
    permission?: string // Permiso granular (e.g. "PATIENTS")
}

interface MenuSection {
    title: string
    icon: any
    items: MenuItem[]
    roles?: UserRole[]
}

// Configuración del menú por secciones con permisos profesionales
const menuSections: MenuSection[] = [
    {
        title: 'Gestión Clínica',
        icon: Activity,
        items: [
            {
                icon: LayoutDashboard,
                label: 'Dashboard',
                path: '/dashboard',
                permission: 'DASHBOARD'
            },
            {
                icon: Users,
                label: 'Pacientes',
                path: '/patients',
                roles: ['ADMIN', 'DOCTOR', 'LAB', 'PHARMACY', 'RECEPTIONIST'],
                permission: 'PATIENTS_VIEW'
            },
            {
                icon: Stethoscope,
                label: 'Doctores',
                path: '/doctors',
                roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'MANAGEMENT', 'AUDIT'],
                permission: 'DOCTORS_VIEW'
            },
            {
                icon: Calendar,
                label: 'Citas',
                path: '/appointments',
                roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'MANAGEMENT'],
                permission: 'APPOINTMENTS_VIEW'
            },
            {
                icon: Clock,
                label: 'Sala de Espera',
                path: '/waiting-room',
                roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'MANAGEMENT'],
                permission: 'WAITING_VIEW'
            },
            {
                icon: Bed,
                label: 'Camas',
                path: '/beds',
                roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'HR', 'MANAGEMENT', 'NURSE'],
                permission: 'BEDS_VIEW'
            },
        ],
    },
    {
        title: 'Servicios Médicos',
        icon: AlertTriangle,
        items: [
            {
                icon: AlertTriangle,
                label: 'Emergencia',
                path: '/emergency',
                roles: ['ADMIN', 'DOCTOR', 'NURSE', 'MANAGEMENT'],
                permission: 'EMERGENCY_VIEW'
            },
            {
                icon: Pill,
                label: 'Farmacia',
                path: '/pharmacy',
                roles: ['ADMIN', 'PHARMACY', 'NURSE', 'MANAGEMENT'],
                permission: 'PHARMACY_VIEW'
            },
            {
                icon: FlaskConical,
                label: 'Laboratorio',
                path: '/laboratory',
                roles: ['ADMIN', 'DOCTOR', 'LAB', 'MANAGEMENT', 'NURSE'],
                permission: 'LAB_VIEW'
            },
        ],
    },
    {
        title: 'Administración',
        icon: Sliders,
        items: [
            {
                icon: Receipt,
                label: 'Facturación',
                path: '/billing',
                roles: ['ADMIN', 'BILLING', 'MANAGEMENT', 'RECEPTIONIST'],
                permission: 'BILLING_VIEW'
            },
            {
                icon: FileText,
                label: 'Reportes',
                path: '/reports',
                roles: ['ADMIN', 'DOCTOR', 'LAB', 'PHARMACY', 'HR', 'MANAGEMENT', 'BILLING', 'AUDIT'],
                permission: 'REPORTS_VIEW'
            },
            {
                icon: BarChart3,
                label: 'Analítica',
                path: '/analytics',
                roles: ['ADMIN', 'HR', 'MANAGEMENT'],
                permission: 'ANALYTICS_VIEW'
            },
            {
                icon: UserCog,
                label: 'Recursos Humanos',
                path: '/hr',
                roles: ['ADMIN', 'HR', 'MANAGEMENT'],
                permission: 'HR_VIEW'
            },
            {
                icon: Shield,
                label: 'Auditoría',
                path: '/admin/audit',
                roles: ['ADMIN', 'AUDIT'],
                permission: 'AUDIT_VIEW'
            },
            {
                icon: Sliders,
                label: 'Sistema',
                path: '/admin',
                roles: ['ADMIN', 'HR'],
                permission: 'ADMIN_VIEW'
            },
        ],
    },
    {
        title: 'Inteligencia Artificial',
        icon: AILogoIcon,
        items: [
            {
                icon: AILogoIcon,
                label: 'IA Médica',
                path: '/ai',
                roles: ['ADMIN', 'DOCTOR', 'LAB'],
                permission: 'AI_USE'
            },
        ],
    },
    {
        title: 'Comunicación',
        icon: MessageSquare,
        items: [
            {
                icon: MessageSquare,
                label: 'Mensajes',
                path: '/messages',
                permission: 'MESSAGES_VIEW'
            },
        ],
    },
]

interface SidebarProps {
    userRole?: UserRole // Rol del usuario actual
}

export default function Sidebar({ userRole = 'ADMIN' }: SidebarProps) {
    // Safety check: ensure role is a string. If it's an object (from backend relation), extract name.
    // Also handle case where role might be undefined in the object
    let rawRole = (typeof userRole === 'object' && userRole !== null)
        ? (userRole as any).name || (userRole as any).role || 'ADMIN' // Fallback to 'ADMIN' if name is missing
        : String(userRole || 'ADMIN');

    // Critical Fix: If the string itself is "undefined" or "null" (artifact of bad storage), force ADMIN
    if (rawRole.toLowerCase() === 'undefined' || rawRole.toLowerCase() === 'null') {
        rawRole = 'ADMIN';
    }

    const safeRole = String(rawRole).toUpperCase(); // Normalize to ADMIN, DOCTOR, etc.
    // Display name can keep original casing or be formatted differently, but for checks we use safeRole

    const location = useLocation()
    const [expandedSections, setExpandedSections] = useState<string[]>([
        'Gestión Clínica',
        'Servicios Médicos',
        'Administración',
    ])

    const toggleSection = (title: string) => {
        setExpandedSections((prev) =>
            prev.includes(title)
                ? prev.filter((s) => s !== title)
                : [...prev, title]
        )
    }

    // Filtrar items según permisos del usuario (SIN fallback a roles)
    const { user } = useAuthStore()
    const { hasPermission } = usePermissions()
    const { config } = useOrganization()
    const { theme } = useTheme()

    const canAccessItem = (item: MenuItem) => {
        // LÓGICA SIMPLE: SOLO verificar permisos, SIN fallback a roles
        // Si el item no requiere permiso específico, permitir acceso
        if (!item.permission) {
            return true
        }

        // Verificar si tiene el permiso específico
        return hasPermission(item.permission)
    }

    const canAccessSection = (section: MenuSection) => {
        if (!section.roles) {
            // Si la sección no tiene roles, verificar si al menos un item es accesible
            return section.items.some(canAccessItem)
        }
        return section.roles.includes(safeRole as UserRole)
    }
    // Determine if logo should be inverted based on current theme and logo type
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const logoType = config?.branding?.logoType || 'dark'
    const shouldInvert = (logoType === 'dark' && isDark) || (logoType === 'light' && !isDark)

    return (
        <aside className="w-64 bg-card border-r border-border h-screen overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-2">
                    <img
                        src={config?.logo || "/assets/logo-edicarex.png"}
                        alt={config?.hospitalName || "EdiCarex"}
                        className={cn(
                            "h-14 w-14 object-contain transition-all",
                            shouldInvert && "invert brightness-200"
                        )}
                    />
                    <div>
                        <h1 className="text-xl font-bold truncate max-w-[140px]" title={config?.hospitalName || "EdiCarex"}>
                            {config?.hospitalName || "EdiCarex"}
                        </h1>
                        <p className="text-xs text-muted-foreground">Enterprise</p>
                    </div>
                </div>
            </div>

            {/* User Role Badge */}
            <div className="px-4 py-3 bg-muted/50">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-edicarex shadow-[0_0_8px_rgba(34,211,238,0.4)]"></div>
                    <span className="text-xs font-medium text-muted-foreground">
                        {safeRole.replace('_', ' ')}
                    </span>
                </div>
            </div>

            {/* Navigation Sections */}
            <nav className="p-4 space-y-2">
                {menuSections.map((section) => {
                    if (!canAccessSection(section)) return null

                    const isExpanded = expandedSections.includes(section.title)
                    const SectionIcon = section.icon
                    const accessibleItems = section.items.filter(canAccessItem)

                    if (accessibleItems.length === 0) return null

                    return (
                        <div key={section.title} className="space-y-1">
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(section.title)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <SectionIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-semibold text-muted-foreground">
                                        {section.title}
                                    </span>
                                </div>
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>

                            {/* Section Items */}
                            {isExpanded && (
                                <div className="ml-2 space-y-1">
                                    {accessibleItems.map((item) => {
                                        const Icon = item.icon
                                        const isActive = location.pathname === item.path

                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={cn(
                                                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
                                                    isActive
                                                        ? 'bg-edicarex text-white shadow-lg shadow-blue-500/20 translate-x-1'
                                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Settings - Solo si tiene permiso SETTINGS_VIEW */}
                {hasPermission('SETTINGS_VIEW') && (
                    <div className="pt-4 mt-4 border-t border-border">
                        <Link
                            to="/settings"
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                                location.pathname === '/settings'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <Settings className="h-4 w-4" />
                            <span className="text-sm font-medium">Configuración</span>
                        </Link>
                    </div>
                )}
            </nav>
        </aside >
    )
}
