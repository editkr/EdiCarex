import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Heart, Loader2 } from 'lucide-react'
import { authAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { useOrganization } from '@/contexts/OrganizationContext'
import { cn } from '@/lib/utils'
import { InstitutionalFooter } from '@/components/InstitutionalFooter'

export default function PatientLoginPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { config } = useOrganization()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await authAPI.login({
                email: formData.email,
                password: formData.password,
            })

            localStorage.setItem('token', res.data.accessToken)
            localStorage.setItem('user', JSON.stringify(res.data.user))

            toast({
                title: 'Bienvenido',
                description: `Hola, ${res.data.user.firstName}`,
            })

            navigate('/patient-portal/dashboard')
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Credenciales inválidas',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-50 via-white to-emerald-50 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md mx-4 relative z-10 shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-24 h-24">
                        <img
                            src={config?.logo || "/assets/logo-edicarex.png"}
                            alt={config?.hospitalName || "EdiCarex"}
                            className={cn(
                                "w-full h-full object-contain transition-all",
                                config?.branding?.logoType === 'light' && "invert brightness-0"
                            )}
                        />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-800">
                            Portal del Paciente
                        </CardTitle>
                        <CardDescription>
                            {config?.hospitalName || "EdiCarex Hospital"} - Acceso seguro a su información médica
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email o DNI</Label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="correo@ejemplo.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    checked={formData.rememberMe}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, rememberMe: checked as boolean })
                                    }
                                />
                                <Label htmlFor="remember" className="text-sm text-gray-600">
                                    Recordarme
                                </Label>
                            </div>
                            <a
                                href="#"
                                className="text-sm text-blue-600 hover:underline"
                                onClick={(e) => {
                                    e.preventDefault()
                                    toast({
                                        title: 'Recuperar Contraseña',
                                        description: 'Por favor contacte a recepción para restablecer su contraseña.',
                                    })
                                }}
                            >
                                ¿Olvidó su contraseña?
                            </a>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500">
                            ¿Eres personal médico?{' '}
                            <a href="/login" className="text-blue-600 hover:underline">
                                Acceder al sistema principal
                            </a>
                        </p>
                    </div>
                </CardContent>
            </Card>
            <InstitutionalFooter variant="light" />
        </div>
    )
}
