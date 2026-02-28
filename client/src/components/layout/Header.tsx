import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Moon, Sun, LogOut, User, Settings } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import GlobalSearch from '@/components/GlobalSearch'
import NotificationCenter from '@/components/NotificationCenter'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { UserProfileDialog } from '@/components/profile/UserProfileDialog'
import { useState, useEffect } from 'react'



export default function Header() {
    const user = useAuthStore((state) => state.user)
    const logout = useAuthStore((state) => state.logout)
    const navigate = useNavigate()
    const [isProfileOpen, setProfileOpen] = useState(false)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const { theme, setTheme } = useTheme()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getRoleDisplayName = (user: any) => {
        if (!user) return 'Usuario'

        // 1. Extract raw role string safely
        let rawRole = ''
        if (typeof user.role === 'object' && user.role !== null) {
            rawRole = (user.role as any).name || ''
        } else {
            rawRole = String(user.role || '')
        }

        // 2. Normalize
        rawRole = rawRole.toUpperCase().trim()

        // 3. Handle bad data
        if (rawRole === 'UNDEFINED' || rawRole === 'NULL' || rawRole === '') {
            return 'Usuario' // Or 'Administrador' if we want to be generous, but 'Usuario' is safer
        }

        // 4. Map to Spanish
        const roleMap: Record<string, string> = {
            'ADMIN': 'Administrador',
            'STAFF': 'Personal de Salud',
            'NURSE': 'Enfermero/a',
            'RECEPTIONIST': 'Recepcionista',
            'LAB': 'Laboratorista',
            'PHARMACY': 'Farmacéutico/a',
            'HR': 'Recursos Humanos'
        }

        return roleMap[rawRole] || rawRole // Fallback to raw role if no translation (e.g. PATIENT)
    }

    return (
        <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/80 backdrop-blur-md px-6 flex items-center justify-between transition-all duration-200">
            <div className="flex items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold">
                        ¡Hola, {user?.firstName || 'Usuario'}!
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {getRoleDisplayName(user)}
                    </p>
                </div>
            </div>

            <div className="flex-1 max-w-xl mx-4">
                <GlobalSearch />
            </div>

            <div className="flex items-center gap-2">
                <NotificationCenter />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                >
                    {theme === 'dark' ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={user?.avatar || ''} alt={`${user?.firstName} ${user?.lastName}`} />
                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-0 overflow-hidden border-border/50 shadow-2xl bg-background/95 backdrop-blur-xl" align="end" forceMount>
                        <div className="relative p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-14 w-14 border-2 border-background shadow-md">
                                    <AvatarImage src={user?.avatar || ''} alt={`${user?.firstName} ${user?.lastName}`} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <p className="font-bold text-lg leading-none tracking-tight">
                                        {user?.firstName}
                                    </p>
                                    <Badge variant="secondary" className="px-2 py-0 text-[10px] uppercase tracking-wider font-semibold bg-primary/20 text-primary hover:bg-primary/20">
                                        {getRoleDisplayName(user)}
                                    </Badge>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground truncate font-medium ml-1">
                                {user?.email}
                            </p>
                        </div>

                        <div className="p-2 space-y-1">
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    setProfileOpen(true);
                                }}
                                className="cursor-pointer py-2.5 px-3 rounded-md focus:bg-primary/10 focus:text-primary transition-colors"
                            >
                                <User className="mr-3 h-4 w-4" />
                                <span className="font-medium">Mi Perfil</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer py-2.5 px-3 rounded-md focus:bg-primary/10 focus:text-primary transition-colors">
                                <Settings className="mr-3 h-4 w-4" />
                                <span className="font-medium">Configuración</span>
                            </DropdownMenuItem>
                            <div className="my-1 border-t border-border/50" />
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    setShowLogoutConfirm(true);
                                }}
                                className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer py-2.5 px-3 rounded-md transition-colors"
                            >
                                <LogOut className="mr-3 h-4 w-4" />
                                <span className="font-medium">Cerrar Sesión</span>
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Profile Dialog */}
                <UserProfileDialog open={isProfileOpen} onOpenChange={setProfileOpen} />

                {/* Logout Confirmation Dialog */}
                <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                            <AlertDialogDescription>
                                ¿Estás seguro de que quieres salir del sistema? Tendrás que iniciar sesión nuevamente para acceder.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600 focus:ring-red-500">
                                Cerrar Sesión
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                {/* End Header Actions */}
            </div>
        </header>
    )
}

