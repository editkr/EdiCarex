import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, User, Loader2, ArrowRight } from 'lucide-react'

import { authAPI } from '@/services/api'
import { useOrganization } from '@/contexts/OrganizationContext'
import { cn } from '@/lib/utils'
import { InstitutionalFooter } from '@/components/InstitutionalFooter'

export default function AttendanceLoginPage() {
    const [credentials, setCredentials] = useState({ username: '', password: '' })
    const [isLoading, setIsLoading] = useState(false)
    const loginStore = useAuthStore((state) => state.login)
    const navigate = useNavigate()
    const location = useLocation()
    const { toast } = useToast()
    const { config } = useOrganization()

    // Error from ProtectedRoute redirection
    const navigationError = location.state?.error

    useEffect(() => {
        if (navigationError) {
            toast({
                title: "Acceso Restringido",
                description: navigationError,
                variant: 'destructive'
            })
            // Clear location state after showing toast
            window.history.replaceState({}, document.title)
        }
    }, [navigationError, toast])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const response = await authAPI.login({
                email: credentials.username,
                password: credentials.password
            })

            const userData = response.data.user
            const userRoleName = (typeof userData.role === 'object') ? userData.role.name : userData.role
            const normalizedRole = String(userRoleName).toUpperCase()

            console.log('Role Check:', { original: userRoleName, normalized: normalizedRole })

            // Validate Role Access for Operations Portal
            if (normalizedRole !== 'HR' && normalizedRole !== 'ADMIN') {
                toast({
                    title: "Acceso Denegado",
                    description: "Esta cuenta no tiene privilegios de Gestión Humana.",
                    variant: 'destructive'
                })
                setIsLoading(false)
                return
            }

            if (response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken)
                loginStore(userData, response.data.accessToken)

                toast({
                    title: "Acceso Autorizado",
                    description: "Bienvenido al portal operativo EdiCarex",
                })
                navigate('/attendance')
            }
        } catch (error) {
            toast({
                title: "Error de Autenticación",
                description: "Credenciales inválidas para el sistema operativo",
                variant: 'destructive'
            })
        } finally {
            setIsLoading(false)
        }
    }



    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-emerald-950 to-emerald-900 p-4 relative overflow-hidden">
            {/* Glossy overlays from main login */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.1),transparent)] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.1),transparent)] pointer-events-none" />

            <Card className="w-full max-w-md relative z-10">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <img
                            src={config?.logo || "/assets/logo-edicarex.png"}
                            alt={config?.hospitalName || "EdiCarex"}
                            className={cn(
                                "h-32 w-32 object-contain transition-all",
                                "h-32 w-32 object-contain transition-all",
                                config?.branding?.logoType !== 'light' && "invert brightness-200"
                            )}
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold uppercase tracking-tight">
                        {config?.hospitalName || "EdiCarex"} <span className="text-emerald-500">Ops</span>
                    </CardTitle>
                    <CardDescription className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.4em]">
                        Operational Command Center
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Identificador de Usuario</Label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    type="text"
                                    required
                                    placeholder="OPERADOR_ID"
                                    value={credentials.username}
                                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                    className="h-12 bg-white/5 border-white/10 rounded-xl pl-12 text-white font-medium focus:border-emerald-500/50 focus:ring-emerald-500/10 transition-all uppercase text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Llave de Acceso</Label>
                                <a href="#" className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest hover:text-emerald-500 transition-colors">Olvidé mi clave</a>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    type="password"
                                    required
                                    placeholder="••••••••••••"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                    className="h-12 bg-white/5 border-white/10 rounded-xl pl-12 text-white font-medium focus:border-emerald-500/50 focus:ring-emerald-500/10 transition-all text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-emerald-900/40 transition-all group"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Autenticar Sistema <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center space-y-3">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                            Seguridad de Grado Militar {config?.hospitalName || "EdiCarex"}
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocolo de Auditoría Activo</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <InstitutionalFooter />
        </div>
    )
}
