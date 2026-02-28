import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuthStore } from '@/stores/authStore'
import { authAPI } from '@/services/api'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InstitutionalFooter } from '@/components/InstitutionalFooter'

const loginSchema = z.object({
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
    const { config } = useOrganization()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const login = useAuthStore((state) => state.login)
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginForm) => {
        try {
            setLoading(true)
            setError('')
            const response = await authAPI.login({ email: data.email, password: data.password })

            // Failsafe: Save to localStorage immediately
            if (response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken)

                // Also save basic user info just in case
                try {
                    localStorage.setItem('csjc-user-backup', JSON.stringify(response.data.user))
                } catch (e) {
                    console.error('Failed to save user backup', e)
                }
            }

            login(response.data.user, response.data.accessToken)
            navigate('/dashboard')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Inicio de sesión fallido')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-emerald-950 to-emerald-900 p-4 relative overflow-hidden">
            {/* Glossy overlay */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.1),transparent)] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.1),transparent)] pointer-events-none" />
            <Card className="w-full max-w-md bg-white/10 border-white/10 backdrop-blur-md shadow-2xl relative z-10">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <img
                            src={config?.logo || "/assets/logo-edicarex.png"}
                            alt={config?.hospitalName || "EdiCarex"}
                            className={cn(
                                "h-32 w-32 object-contain transition-all duration-700 hover:scale-110",
                                config?.branding?.logoType !== 'light' && "invert brightness-200"
                            )}
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">{config?.hospitalName || "C.S. Jorge Chávez"}</CardTitle>
                    <CardDescription className="text-white/60">
                        Inicia sesión en tu cuenta para continuar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/80">Correo electrónico</label>
                            <Input
                                {...register('email')}
                                type="email"
                                placeholder="admin@csjchavez.gob.pe"
                                disabled={loading}
                                className="bg-black/20 border-white/10 text-white placeholder:text-white/30"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-400">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/80">Contraseña</label>
                            <Input
                                {...register('password')}
                                type="password"
                                placeholder="••••••••"
                                disabled={loading}
                                className="bg-black/20 border-white/10 text-white placeholder:text-white/30"
                            />
                            {errors.password && (
                                <p className="text-sm text-red-400">{errors.password.message}</p>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6" disabled={loading}>
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
            <InstitutionalFooter />
        </div>
    )
}
