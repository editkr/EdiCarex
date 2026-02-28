import { ReactNode } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import {
    LayoutDashboard,
    Calendar,
    FileText,
    FlaskConical,
    DollarSign,
    User,
    Bell,
    LogOut,
    Heart,
    Moon,
    Sun,
    Syringe,
    FileSymlink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrganization } from '@/contexts/OrganizationContext'
import PatientAIChatBubble from './PatientAIChatBubble'



export default function PatientPortalLayout() {
    const location = useLocation()
    const navigate = useNavigate()
    const { theme, setTheme } = useTheme()
    const { config } = useOrganization()

    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/patient-portal/login')
    }

    const navItems = [
        { path: '/patient-portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/patient-portal/appointments', label: 'Mis Citas', icon: Calendar },
        { path: '/patient-portal/history', label: 'Historial Médico', icon: FileText },
        { path: '/patient-portal/lab-results', label: 'Resultados Lab', icon: FlaskConical },
        { path: '/patient-portal/vaccinations', label: 'Mi Carnet de Vacunas', icon: Syringe },
        { path: '/patient-portal/referrals', label: 'Mis Referencias', icon: FileSymlink },
        { path: '/patient-portal/billing', label: 'Facturación', icon: DollarSign },
        { path: '/patient-portal/profile', label: 'Mi Perfil', icon: User },
    ]

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border flex flex-col relative z-30">
                {/* Logo */}
                <div className="p-6 border-b border-border">
                    <Link to="/patient-portal/dashboard" className="flex items-center gap-3">
                        <img
                            src={config?.logo || "/assets/logo-edicarex.png"}
                            alt={config?.hospitalName || "C.S. Jorge Chávez"}
                            className="w-14 h-14 object-contain"
                        />
                        <div>
                            <h1 className="font-bold text-foreground truncate max-w-[150px]" title={config?.hospitalName || "C.S. Jorge Chávez"}>
                                {config?.hospitalName || "C.S. Jorge Chávez"}
                            </h1>
                            <p className="text-xs text-muted-foreground">Portal del Paciente</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                                    isActive
                                        ? 'bg-gradient-to-r from-green-400 to-blue-600 text-white shadow-md'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="bg-card border-b border-border px-6 py-4 relative z-30">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">
                                Bienvenido, {user.firstName || 'Paciente'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {new Date().toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            >
                                {theme === 'dark' ? (
                                    <Sun className="h-5 w-5" />
                                ) : (
                                    <Moon className="h-5 w-5" />
                                )}
                            </Button>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-xs text-destructive-foreground flex items-center justify-center">
                                    3
                                </span>
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-background relative bg-medical-portal">
                    <div className="relative z-10 h-full">
                        <Outlet />
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-card border-t border-border px-6 py-3 relative z-30">
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <p>© {new Date().getFullYear()} {config?.hospitalName || 'C.S. Jorge Chávez'}. Todos los derechos reservados.</p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-primary">Ayuda</a>
                            <a href="#" className="hover:text-primary">Privacidad</a>
                            <a href="#" className="hover:text-primary">Términos</a>
                        </div>
                    </div>
                </footer>
            </div>
            <PatientAIChatBubble />
        </div>
    )
}
