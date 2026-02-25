import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
    Clock,
    DollarSign,
    Calendar,
    Settings,
    ShieldCheck,
    LayoutDashboard,
    ChevronLeft,
    TrendingUp,
    Briefcase,
    Users,
    Activity,
    Sun,
    Moon,
    Search,
    Bell,
    User,
    LogOut,
    MessageSquare,
    HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { Input } from '@/components/ui/input'
import { useOrganization } from '@/contexts/OrganizationContext'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import HRAIChatBubble from './HRAIChatBubble'

interface NavItemProps {
    icon: any
    label: string
    path: string
}

function NavItem({ icon: Icon, label, path }: NavItemProps) {
    const location = useLocation()

    // Comparación EXACTA - solo marca como activo si la ruta coincide perfectamente
    const isActive = location.pathname === path

    return (
        <Link
            to={path}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive
                    ? "bg-gradient-to-r from-green-500/90 to-blue-600/90 text-white shadow-xl shadow-blue-500/40 translate-x-1 border-t border-white/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
        >
            <Icon className={cn("h-5 w-5", isActive ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-muted-foreground/60 group-hover:text-white")} />
            <span className="text-sm font-semibold">{label}</span>
            {isActive && <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />}
        </Link>
    )
}

export function AttendanceLayout({ children }: { children: React.ReactNode }) {
    const { theme, setTheme } = useTheme()
    const { config } = useOrganization()

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-inter">
            {/* Dark Tech Background */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full"></div>
            </div>

            {/* Specialized Portal Sidebar */}
            <aside className="w-72 bg-card/40 backdrop-blur-3xl border-r border-border flex flex-col z-20">
                <div className="p-8 border-b border-border">
                    <div className="flex items-center gap-3">
                        <img
                            src={config?.logo || "/assets/logo-edicarex.png"}
                            alt={config?.hospitalName || "EdiCarex"}
                            className="h-14 w-14 object-contain"
                        />
                        <div>
                            <h1 className="text-xl font-bold tracking-tight leading-none text-white truncate max-w-[150px]" title={config?.hospitalName || "EdiCarex"}>
                                {config?.hospitalName || "EdiCarex"}
                            </h1>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Portal Operativo</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Link to="/hr">
                            <Button variant="ghost" size="sm" className="w-full justify-start text-[10px] font-bold uppercase text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl gap-2 tracking-widest">
                                <ChevronLeft className="h-4 w-4 text-muted-foreground" /> Atrás a RRHH
                            </Button>
                        </Link>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-4 ml-4">Operaciones</p>
                    <NavItem icon={LayoutDashboard} label="Dashboard" path="/attendance" />
                    <NavItem icon={Clock} label="Marcaciones" path="/attendance/ops" />
                    <NavItem icon={Calendar} label="Turnos" path="/attendance/shifts" />
                    <NavItem icon={Users} label="Personal" path="/attendance/staff" />

                    <div className="pt-6 mt-6 border-t border-border">
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-4 ml-4">Finanzas</p>
                        <NavItem icon={DollarSign} label="Nómina" path="/attendance/payroll" />
                    </div>

                    <div className="pt-6 mt-6 border-t border-border">
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-4 ml-4">Sistema</p>
                        <NavItem icon={Briefcase} label="Reglas" path="/attendance/rules" />
                        <NavItem icon={Activity} label="Auditoría" path="/attendance/audit" />
                        <NavItem icon={Settings} label="Configuración" path="/attendance/settings" />
                    </div>
                </nav>

                <div className="p-8 mt-auto border-t border-border bg-black/5">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Servidor Activo</p>
                    </div>
                </div>
            </aside>

            {/* Main Portal Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Header Superior Premium */}
                <header className="h-20 bg-card/20 backdrop-blur-xl border-b border-border flex items-center justify-between px-12 shrink-0 relative z-30">
                    <div className="relative w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-edicarex transition-colors" />
                        <Input
                            placeholder="Buscar en operaciones..."
                            className="w-full bg-white/5 border-border rounded-xl pl-10 h-10 text-xs font-semibold focus:bg-white/10 transition-all focus:border-edicarex/50"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Botón de Modo Oscuro/Claro */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-xl transition-all relative"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Cambiar tema</span>
                        </Button>

                        {/* Notificaciones */}
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-xl relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-edicarex rounded-full border-2 border-background"></span>
                        </Button>

                        <div className="h-8 w-px bg-border"></div>

                        {/* Perfil de Usuario */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="p-1 hover:bg-white/5 rounded-xl flex items-center gap-3 group transition-all">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-bold text-foreground leading-none tracking-tight">Edisson</p>
                                        <p className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Administrador</p>
                                    </div>
                                    <Avatar className="h-10 w-10 border-2 border-border group-hover:border-blue-500/50 transition-all shadow-xl">
                                        <AvatarImage src="https://github.com/shadcn.png" />
                                        <AvatarFallback className="bg-edicarex text-white font-black">ED</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-card backdrop-blur-2xl border-border rounded-2xl p-2 shadow-2xl" align="end">
                                <DropdownMenuLabel className="p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-edicarex flex items-center justify-center font-black text-white text-xs">ED</div>
                                        <div>
                                            <p className="text-xs font-bold tracking-tight text-foreground">Edisson Paricahua</p>
                                            <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Super Admin</p>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="p-3 rounded-xl focus:bg-accent flex gap-3 text-xs font-medium cursor-pointer group">
                                    <User className="h-4 w-4 text-muted-foreground group-hover:text-edicarex transition-colors" /> Perfil de Usuario
                                </DropdownMenuItem>
                                <DropdownMenuItem className="p-3 rounded-xl focus:bg-accent flex gap-3 text-xs font-medium cursor-pointer group">
                                    <Settings className="h-4 w-4 text-muted-foreground group-hover:text-edicarex transition-colors" /> Configuración
                                </DropdownMenuItem>
                                <DropdownMenuItem className="p-3 rounded-xl focus:bg-accent flex gap-3 text-xs font-medium cursor-pointer group">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-edicarex transition-colors" /> Mensajería
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="p-3 rounded-xl focus:bg-accent flex gap-3 text-xs font-medium cursor-pointer group">
                                    <HelpCircle className="h-4 w-4 text-muted-foreground group-hover:text-edicarex transition-colors" /> Soporte Técnico
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="p-3 rounded-xl focus:bg-red-500/10 text-red-500 flex gap-3 text-xs font-bold uppercase tracking-widest cursor-pointer group">
                                    <LogOut className="h-4 w-4 text-red-500" /> Cerrar Sesión
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-attendance-portal">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative z-10">
                        {children}
                    </div>
                </main>
            </div>

            {/* Global HR Assistant Bubble */}
            <HRAIChatBubble />
        </div>
    )
}
