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
    Syringe,
    ClipboardList,
    FileSymlink,
    Globe,
    Microscope,
    ShieldCheck,
    Video,
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
    roles?: UserRole[]
    permission?: string
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
                roles: ['ADMIN', 'STAFF', 'LAB', 'PHARMACY', 'RECEPTIONIST'],
                permission: 'PATIENTS_VIEW'
            },
            {
                icon: Stethoscope,
                label: 'Personal de Salud',
                path: '/health-staff',
                roles: ['ADMIN', 'STAFF', 'RECEPTIONIST', 'MANAGEMENT', 'AUDIT'],
                permission: 'STAFF_VIEW'
            },
            {
                icon: Calendar,
                label: 'Citas',
                path: '/appointments',
                roles: ['ADMIN', 'STAFF', 'RECEPTIONIST', 'MANAGEMENT'],
                permission: 'APPOINTMENTS_VIEW'
            },
            {
                icon: Clock,
                label: 'Sala de Espera',
                path: '/waiting-room',
                roles: ['ADMIN', 'STAFF', 'RECEPTIONIST', 'MANAGEMENT'],
                permission: 'WAITING_VIEW'
            },
        ],
    },
    {
        title: 'Servicios Médicos',
        icon: AlertTriangle,
        items: [
            {
                icon: AlertTriangle,
                label: 'Urgencias',
                path: '/urgencies',
                roles: ['ADMIN', 'STAFF', 'NURSE', 'MANAGEMENT'],
                permission: 'EMERGENCY_VIEW'
            },
            {
                icon: Activity,
                label: 'Triaje',
                path: '/triaje',
                roles: ['ADMIN', 'NURSE', 'RECEPTIONIST'],
                permission: 'TRIAGE_VIEW'
            },
            {
                icon: Bed,
                label: 'Sala de Observación',
                path: '/observation-room',
                roles: ['ADMIN', 'STAFF', 'RECEPTIONIST', 'HR', 'MANAGEMENT', 'NURSE'],
                permission: 'BEDS_VIEW'
            },
            {
                icon: Syringe,
                label: 'Vacunación',
                path: '/vacunacion',
                roles: ['ADMIN', 'NURSE'],
                permission: 'VAX_VIEW'
            },
            {
                icon: ClipboardList,
                label: 'Prog. MINSA',
                path: '/programas-minsa',
                roles: ['ADMIN', 'STAFF', 'NURSE', 'MANAGEMENT'],
                permission: 'PROGRAMS_VIEW'
            },
            {
                icon: FileSymlink,
                label: 'Referencias',
                path: '/referral-system',
                roles: ['ADMIN', 'STAFF', 'RECEPTIONIST'],
                permission: 'REFERRAL_VIEW'
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
                roles: ['ADMIN', 'STAFF', 'LAB', 'MANAGEMENT', 'NURSE'],
                permission: 'LAB_VIEW'
            },
        ],
    },
    {
        title: 'I-4 & Salud Pública',
        icon: Globe,
        items: [
            {
                icon: FileText,
                label: 'Registro HIS',
                path: '/his-reporting',
                roles: ['ADMIN', 'STAFF', 'NURSE'],
                permission: 'HIS_VIEW'
            },
            {
                icon: Video,
                label: 'Telesalud',
                path: '/telemedicine',
                roles: ['ADMIN', 'STAFF'],
                permission: 'TELEMEDICINE_VIEW'
            },
            {
                icon: Microscope,
                label: 'Epidemiología',
                path: '/epidemiology',
                roles: ['ADMIN', 'STAFF', 'NURSE', 'MANAGEMENT'],
                permission: 'EPIDEMIO_VIEW'
            },
            {
                icon: ShieldCheck,
                label: 'Validación SIS',
                path: '/sis-validation',
                roles: ['ADMIN', 'RECEPTIONIST', 'MANAGEMENT'],
                permission: 'SIS_VIEW'
            },
        ],
    },
    {
        title: 'Administración',
        icon: Sliders,
        items: [
            {
                icon: Receipt,
                label: 'Atenciones',
                path: '/attendance-records',
                roles: ['ADMIN', 'BILLING', 'MANAGEMENT', 'RECEPTIONIST'],
                permission: 'BILLING_VIEW'
            },
            {
                icon: FileText,
                label: 'Reportes',
                path: '/reports',
                roles: ['ADMIN', 'STAFF', 'LAB', 'PHARMACY', 'HR', 'MANAGEMENT', 'BILLING', 'AUDIT'],
                permission: 'REPORTS_VIEW'
            },
            {
                icon: BarChart3,
                label: 'Estadísticas',
                path: '/public-health',
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
        icon: Sliders,
        items: [
            {
                icon: AILogoIcon,
                label: 'IA Médica',
                path: '/ai',
                roles: ['ADMIN', 'STAFF', 'LAB'],
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
    userRole?: UserRole
}

export default function Sidebar({ userRole = 'ADMIN' }: SidebarProps) {
    let rawRole = (typeof userRole === 'object' && userRole !== null)
        ? (userRole as any).name || (userRole as any).role || 'ADMIN'
        : String(userRole || 'ADMIN');

    if (rawRole.toLowerCase() === 'undefined' || rawRole.toLowerCase() === 'null') {
        rawRole = 'ADMIN';
    }

    const safeRole = String(rawRole).toUpperCase();
    const location = useLocation()
    const [expandedSections, setExpandedSections] = useState<string[]>([
        'Gestión Clínica',
        'Servicios Médicos',
        'I-4 & Salud Pública',
        'Administración',
    ])

    const toggleSection = (title: string) => {
        setExpandedSections((prev) =>
            prev.includes(title)
                ? prev.filter((s) => s !== title)
                : [...prev, title]
        )
    }

    const { hasPermission } = usePermissions()
    const { config } = useOrganization()
    const { theme } = useTheme()

    const canAccessItem = (item: MenuItem) => {
        if (!item.permission) {
            return true
        }
        return hasPermission(item.permission)
    }

    const canAccessSection = (section: MenuSection) => {
        if (!section.roles) {
            return section.items.some(canAccessItem)
        }
        return section.roles.includes(safeRole as UserRole)
    }

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const logoType = config?.branding?.logoType || 'dark'
    const shouldInvert = (logoType === 'dark' && isDark) || (logoType === 'light' && !isDark)

    return (
        <aside className="w-64 bg-card border-r border-border h-screen overflow-y-auto">
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-2">
                    <img
                        src={config?.logo || "/assets/logo-edicarex.png"}
                        alt={config?.hospitalName || "Centro de Salud Jorge Chávez"}
                        className={cn(
                            "h-14 w-14 object-contain transition-all",
                            shouldInvert && "invert brightness-200"
                        )}
                    />
                    <div>
                        <h1 className="text-xl font-bold truncate max-w-[140px]" title={config?.hospitalName || "C.S. Jorge Chávez"}>
                            {config?.hospitalName || "C.S. Jorge Chávez"}
                        </h1>
                        <p className="text-xs text-muted-foreground">C.S. I-4 · Juliaca</p>
                    </div>
                </div>
            </div>

            <div className="px-4 py-3 bg-muted/50">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-edicarex shadow-[0_0_8px_rgba(34,211,238,0.4)]"></div>
                    <span className="text-xs font-medium text-muted-foreground">
                        {safeRole.replace('_', ' ')}
                    </span>
                </div>
            </div>

            <nav className="p-4 space-y-2">
                {menuSections.map((section) => {
                    if (!canAccessSection(section)) return null

                    const isExpanded = expandedSections.includes(section.title)
                    const SectionIcon = section.icon
                    const accessibleItems = section.items.filter(canAccessItem)

                    if (accessibleItems.length === 0) return null

                    return (
                        <div key={section.title} className="space-y-1">
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
        </aside>
    )
}
