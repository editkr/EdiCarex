import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Settings as SettingsIcon,
    User,
    Palette,
    Bell,
    Shield,
    Server,
    Save,
    Upload,
    CheckCircle,
    Loader2,
    Lock,
    Key,
    Eye,
    EyeOff,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { usersAPI, systemAPI, authAPI } from '@/services/api'
import { useTheme } from '@/components/theme-provider'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('account')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()
    const { user, setUser } = useAuthStore()
    const { theme, setTheme } = useTheme()

    // Account Settings
    const [accountData, setAccountData] = useState({
        name: '',
        userId: '',
        email: '',
        avatar: '',
    })

    // Password Change
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    })

    // Theme Settings (persisted to user preferences)
    const [themeSettings, setThemeSettings] = useState({
        theme: 'light',
        dashboardLayout: 'grid',
    })

    // Notification Settings
    const [notifications, setNotifications] = useState({
        email: true,
        emergency: true,
        appointments: true,
        laboratory: true,
        pharmacy: false,
    })

    // Security Settings
    const [security, setSecurity] = useState({
        twoFactor: false,
    })

    // System Status
    const [systemStatus, setSystemStatus] = useState({
        server: 'offline',
        database: 'offline',
        api: 'offline',
        uptime: '0s',
        version: '1.0.0',
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [profileRes, systemRes] = await Promise.all([
                usersAPI.getProfile(),
                systemAPI.getStatus()
            ])

            const user = profileRes.data
            setAccountData({
                name: `${user.firstName} ${user.lastName}`,
                userId: user.id,
                email: user.email,
                avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`,
            })

            // Load user preferences
            if (user.preferences) {
                if (user.preferences.theme) {
                    setThemeSettings(user.preferences.theme)
                    // Apply saved theme
                    if (user.preferences.theme.theme) {
                        setTheme(user.preferences.theme.theme)
                    }
                }
                if (user.preferences.notifications) setNotifications(user.preferences.notifications)
                if (user.preferences.security) setSecurity(user.preferences.security)
            }

            // System Status
            const sys = systemRes.data
            setSystemStatus({
                server: sys.server,
                database: sys.database,
                api: sys.api,
                uptime: `${Math.floor(sys.uptime / 60)} min`,
                version: sys.version,
            })

        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'No se pudo cargar la configuración',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSaveAccount = async () => {
        try {
            setSaving(true)
            const [firstName, ...lastNameParts] = accountData.name.split(' ')
            const lastName = lastNameParts.join(' ')

            await usersAPI.updateProfile({
                firstName,
                lastName,
                email: accountData.email,
                avatar: accountData.avatar,
            })

            // Actualizar estado global inmediatamente
            if (user) {
                setUser({
                    ...user,
                    firstName,
                    lastName,
                    email: accountData.email,
                    avatar: accountData.avatar
                })
            }

            toast({
                title: '✅ Cuenta Actualizada',
                description: 'Tu información personal ha sido guardada exitosamente.',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo actualizar la cuenta',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                title: 'Error',
                description: 'Las contraseñas nuevas no coinciden',
                variant: 'destructive',
            })
            return
        }
        if (passwordData.newPassword.length < 6) {
            toast({
                title: 'Error',
                description: 'La contraseña debe tener al menos 6 caracteres',
                variant: 'destructive',
            })
            return
        }

        try {
            setSaving(true)
            await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword)
            toast({
                title: '✅ Contraseña Actualizada',
                description: 'Tu contraseña ha sido cambiada exitosamente.',
            })
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Contraseña actual incorrecta',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    const handleSavePreferences = async (section: 'theme' | 'notifications' | 'security') => {
        try {
            setSaving(true)
            const fullPreferences = {
                theme: themeSettings,
                notifications: notifications,
                security: security
            }

            await usersAPI.updateProfile({ preferences: fullPreferences })

            // Apply theme immediately
            if (section === 'theme') {
                setTheme(themeSettings.theme as 'light' | 'dark' | 'system')
            }

            toast({
                title: '✅ Preferencias Guardadas',
                description: 'Tus preferencias han sido actualizadas.',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Error al guardar preferencias',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Cargando configuración...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b">
                <div className="h-14 w-14 rounded-xl bg-edicarex flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <SettingsIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
                    <p className="text-muted-foreground">
                        Gestiona tu cuenta, preferencias y seguridad del sistema.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-5 w-full max-w-3xl bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <User className="h-4 w-4 mr-2" />
                        Cuenta
                    </TabsTrigger>
                    <TabsTrigger value="personalization" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Palette className="h-4 w-4 mr-2" />
                        Apariencia
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Bell className="h-4 w-4 mr-2" />
                        Notificaciones
                    </TabsTrigger>
                    <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Shield className="h-4 w-4 mr-2" />
                        Seguridad
                    </TabsTrigger>
                    <TabsTrigger value="system" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Server className="h-4 w-4 mr-2" />
                        Sistema
                    </TabsTrigger>
                </TabsList>

                {/* 1. Account Tab */}
                <TabsContent value="account" className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="overflow-hidden border-none shadow-xl transition-all">
                            <div className="absolute top-0 left-0 w-full h-1 bg-edicarex" />
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Información de Perfil
                                </CardTitle>
                                <CardDescription>Actualiza tu información personal</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                                        <AvatarImage src={accountData.avatar} />
                                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">{accountData.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-2">
                                        <Button variant="outline" size="sm">
                                            <Upload className="h-4 w-4 mr-2" />
                                            Cambiar Foto
                                        </Button>
                                        <p className="text-xs text-muted-foreground">JPG, PNG. Máx 2MB.</p>
                                    </div>
                                </div>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label>Nombre Completo</Label>
                                        <Input
                                            value={accountData.name}
                                            onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Correo Electrónico</Label>
                                        <Input
                                            type="email"
                                            value={accountData.email}
                                            onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                                            className="bg-background"
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleSaveAccount} disabled={saving} className="w-full">
                                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Guardar Cambios
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-none shadow-xl transition-all">
                            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 opacity-70" />
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    Cambiar Contraseña
                                </CardTitle>
                                <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Contraseña Actual</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPasswords.current ? "text" : "password"}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="pr-10 bg-background"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                        >
                                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Nueva Contraseña</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPasswords.new ? "text" : "password"}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="pr-10 bg-background"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                        >
                                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirmar Nueva Contraseña</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="pr-10 bg-background"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                        >
                                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <Button onClick={handleChangePassword} disabled={saving || !passwordData.currentPassword || !passwordData.newPassword} variant="outline" className="w-full">
                                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                                    Actualizar Contraseña
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* 2. Personalization Tab */}
                <TabsContent value="personalization" className="space-y-6">
                    <Card className="overflow-hidden border-none shadow-xl transition-all max-w-2xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-edicarex" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Personalización de Apariencia
                            </CardTitle>
                            <CardDescription>Configura el tema y diseño de la interfaz</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-base">Modo de Tema</Label>
                                <Select
                                    value={themeSettings.theme}
                                    onValueChange={(value) => setThemeSettings({ ...themeSettings, theme: value })}
                                >
                                    <SelectTrigger className="w-full max-w-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">☀️ Claro</SelectItem>
                                        <SelectItem value="dark">🌙 Oscuro</SelectItem>
                                        <SelectItem value="system">💻 Automático (Sistema)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">El tema se aplicará inmediatamente al guardar.</p>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-base">Diseño del Panel Principal</Label>
                                <Select
                                    value={themeSettings.dashboardLayout}
                                    onValueChange={(value) => setThemeSettings({ ...themeSettings, dashboardLayout: value })}
                                >
                                    <SelectTrigger className="w-full max-w-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="grid">Cuadrícula</SelectItem>
                                        <SelectItem value="list">Lista</SelectItem>
                                        <SelectItem value="compact">Compacto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={() => handleSavePreferences('theme')} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Guardar Preferencias de Tema
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 3. Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card className="overflow-hidden border-none shadow-xl transition-all max-w-2xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-edicarex opacity-70" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Preferencias de Notificación
                            </CardTitle>
                            <CardDescription>Gestiona cómo y cuándo recibes alertas</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                {[
                                    { key: 'email', label: 'Notificaciones por Correo', desc: 'Recibe un resumen diario por email' },
                                    { key: 'emergency', label: 'Alertas de Emergencia', desc: 'Notificaciones críticas en tiempo real' },
                                    { key: 'appointments', label: 'Recordatorios de Citas', desc: 'Alertas antes de cada cita programada' },
                                    { key: 'laboratory', label: 'Resultados de Laboratorio', desc: 'Cuando hay nuevos resultados disponibles' },
                                    { key: 'pharmacy', label: 'Alertas de Farmacia', desc: 'Stock bajo y pedidos pendientes' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                                        <div>
                                            <p className="font-medium">{item.label}</p>
                                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                                        </div>
                                        <Switch
                                            checked={notifications[item.key as keyof typeof notifications]}
                                            onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                                        />
                                    </div>
                                ))}
                            </div>
                            <Button onClick={() => handleSavePreferences('notifications')} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Guardar Preferencias de Notificación
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 4. Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    <Card className="overflow-hidden border-none shadow-xl transition-all max-w-2xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 opacity-70" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Configuración de Seguridad
                            </CardTitle>
                            <CardDescription>Opciones avanzadas para proteger tu cuenta</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                                <div>
                                    <p className="font-medium">Autenticación de Dos Factores (2FA)</p>
                                    <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad a tu cuenta</p>
                                </div>
                                <Switch
                                    checked={security.twoFactor}
                                    onCheckedChange={(checked) => setSecurity({ ...security, twoFactor: checked })}
                                />
                            </div>
                            <Button onClick={() => handleSavePreferences('security')} disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Guardar Configuración de Seguridad
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 5. System Tab */}
                <TabsContent value="system" className="space-y-6">
                    <Card className="overflow-hidden border-none shadow-xl transition-all max-w-2xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-edicarex" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="h-5 w-5" />
                                Estado del Sistema
                            </CardTitle>
                            <CardDescription>Salud y estado de los servicios en tiempo real</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <span className="font-medium">Servidor Backend</span>
                                    <Badge className={systemStatus.server === 'online' ? "bg-edicarex shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "bg-red-500"}>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        {systemStatus.server === 'online' ? 'En Línea' : 'Fuera de Línea'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <span className="font-medium">Base de Datos PostgreSQL</span>
                                    <Badge className={systemStatus.database === 'online' ? "bg-edicarex shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "bg-red-500"}>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        {systemStatus.database === 'online' ? 'Conectada' : 'Desconectada'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <span className="font-medium">API REST</span>
                                    <Badge className={systemStatus.api === 'online' ? "bg-edicarex shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "bg-red-500"}>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        {systemStatus.api === 'online' ? 'Operativa' : 'No Disponible'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                                    <span className="font-medium">Tiempo de Actividad</span>
                                    <span className="font-mono text-sm">{systemStatus.uptime}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                                    <span className="font-medium">Versión del Sistema</span>
                                    <span className="font-mono text-sm">v{systemStatus.version}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
