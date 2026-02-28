import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
    Users,
    Calendar,
    Stethoscope,
    Bed,
    Clock,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Activity,
    FileText,
    Loader2,
    CheckCircle2,
    AlertCircle,
    DollarSign,
    Euro,
    Coins
} from 'lucide-react'
import { analyticsAPI, appointmentsAPI, patientsAPI, healthStaffAPI, usersAPI, billingAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    AreaChart,
    Area,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'
import { format, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency } from '@/utils/financialUtils'
import { useOrganization } from '@/contexts/OrganizationContext'

// Colores profesionales
const COLORS = {
    primary: '#06b6d4', // Cyan
    success: '#10b981', // Emerald
    warning: '#f59e0b', // Amber
    danger: '#ef4444',  // Red
    purple: '#8b5cf6',  // Violet
    teal: '#22d3ee',    // Cyan Light
}

const CHART_COLORS = ['#22d3ee', '#3b82f6', '#10b981', '#6366f1', '#8b5cf6', '#14b8a6']

export default function DashboardPage() {
    const { config } = useOrganization()
    const [loading, setLoading] = useState(true)
    const [dashboardLayout, setDashboardLayout] = useState<'grid' | 'list' | 'compact'>('grid')
    const [kpis, setKpis] = useState({
        patientsToday: 0,
        activeAppointments: 0,
        availableStaff: 0,
        bedOccupancy: 0,
        avgWaitTime: 0,
        emergencyCases: 0,
        dailyIncome: 0,
    })

    // Gráficos
    const [appointmentsByHour, setAppointmentsByHour] = useState<any[]>([])
    const [specialtiesChart, setSpecialtiesChart] = useState<any[]>([])
    const [priorityChart, setPriorityChart] = useState<any[]>([])
    const [patientsPerDay, setPatientsPerDay] = useState<any[]>([])

    // Listas rápidas
    const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
    const [recentPatients, setRecentPatients] = useState<any[]>([])
    const [recentNotes, setRecentNotes] = useState<any[]>([])
    const [recentReports, setRecentReports] = useState<any[]>([])

    // Panel IA
    const [aiPredictions, setAiPredictions] = useState({
        saturationLevel: 0,
        staffRecommendation: '',
        riskAlerts: [] as string[],
    })

    const { toast } = useToast()

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true)

            // Cargar preferencias del usuario para el layout
            try {
                const profileRes = await usersAPI.getProfile()
                if (profileRes.data?.preferences?.theme?.dashboardLayout) {
                    setDashboardLayout(profileRes.data.preferences.theme.dashboardLayout)
                }
            } catch (e) {
                console.log('Could not load user preferences')
            }

            // Cargar datos reales del backend
            const [
                dashboardRes,
                appointmentsRes,
                patientsRes,
                staffRes,
                billingStatsRes,
            ] = await Promise.all([
                analyticsAPI.getDashboard().catch(() => ({ data: {} })),
                appointmentsAPI.getAll().catch(() => ({ data: { data: [] } })),
                patientsAPI.getAll().catch(() => ({ data: { data: [] } })),
                healthStaffAPI.getAll().catch(() => ({ data: { data: [] } })),
                billingAPI.getStats().catch(() => ({ data: { totalRevenue: 0 } })),
            ])

            const dashboard = dashboardRes.data || {}
            const allAppointments = appointmentsRes.data?.data || []
            const allPatients = patientsRes.data?.data || []
            const allStaff = staffRes.data?.data || []

            // ========== KPIs ==========
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Pacientes de hoy
            const todayPatients = allPatients.filter((p: any) => {
                const createdDate = new Date(p.createdAt)
                createdDate.setHours(0, 0, 0, 0)
                return createdDate.getTime() === today.getTime()
            })

            // Citas activas (hoy, no completadas ni canceladas)
            const activeAppointments = allAppointments.filter((a: any) => {
                try {
                    const aptDate = new Date(a.appointmentDate)
                    return isToday(aptDate) && !['COMPLETED', 'CANCELLED'].includes(a.status)
                } catch {
                    return false
                }
            })

            // Staff disponible
            const availableStaff = allStaff.filter((d: any) => d.isAvailable !== false)

            // Camillas de Observación / Urgencias activos
            const camillasOcupadas = Math.min(
                Number(dashboard.emergencyCases || 0),
                5 // máx 5 camillas
            )

            // Tiempo promedio de espera estimado
            const avgWaitTime = activeAppointments.length > 0
                ? Math.round(activeAppointments.length * 8 + 10)
                : 12

            const emergencyCases = dashboard.emergencyCases ?? activeAppointments.filter((a: any) => a.type === 'EMERGENCY').length

            const billingStats = billingStatsRes.data || { totalRevenue: 0 }

            setKpis({
                patientsToday: todayPatients.length,
                activeAppointments: activeAppointments.length,
                availableStaff: availableStaff.length,
                bedOccupancy: camillasOcupadas,
                avgWaitTime,
                emergencyCases,
                dailyIncome: billingStats.totalRevenue || 0,
            })

            // ========== GRÁFICO 1: Citas por hora ==========
            const hourlyData = Array.from({ length: 24 }, (_, hour) => {
                const count = allAppointments.filter((a: any) => {
                    try {
                        const aptDate = new Date(a.appointmentDate)
                        return isToday(aptDate) && aptDate.getHours() === hour
                    } catch {
                        return false
                    }
                }).length
                return {
                    hour: `${hour.toString().padStart(2, '0')}:00`,
                    appointments: count,
                }
            }).filter(d => d.appointments > 0 || (parseInt(d.hour) >= 8 && parseInt(d.hour) <= 18))
            setAppointmentsByHour(hourlyData)

            // ========== GRÁFICO 2: Especialidades ==========
            const specialtyCounts: Record<string, number> = {}
            allStaff.forEach((d: any) => {
                const spec = d.specialization || 'General'
                specialtyCounts[spec] = (specialtyCounts[spec] || 0) + 1
            })
            const specialtiesData = Object.entries(specialtyCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
            setSpecialtiesChart(specialtiesData)

            // ========== GRÁFICO 3: Prioridades ==========
            const priorities = [
                { name: 'Alta', value: allAppointments.filter((a: any) => a.priority === 'HIGH').length || 0 },
                { name: 'Normal', value: allAppointments.filter((a: any) => a.priority === 'NORMAL' || !a.priority).length || 0 },
                { name: 'Urgente', value: allAppointments.filter((a: any) => a.priority === 'URGENT').length || 0 },
            ]
            setPriorityChart(priorities)

            // ========== GRÁFICO 4: Pacientes por día ==========
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - (6 - i))
                date.setHours(0, 0, 0, 0)

                const count = allPatients.filter((p: any) => {
                    try {
                        const pDate = new Date(p.createdAt)
                        pDate.setHours(0, 0, 0, 0)
                        return pDate.getTime() === date.getTime()
                    } catch {
                        return false
                    }
                }).length

                return {
                    date: format(date, 'd MMM', { locale: es }),
                    patients: count,
                }
            })
            setPatientsPerDay(last7Days)

            // ========== LISTAS RÁPIDAS ==========
            const upcoming = activeAppointments
                .sort((a: any, b: any) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
                .slice(0, 5)
                .map((a: any) => ({
                    id: a.id,
                    time: format(new Date(a.appointmentDate), 'HH:mm'),
                    patient: `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`,
                    status: a.status,
                    reason: a.reason || 'Consulta',
                }))
            setUpcomingAppointments(upcoming)

            const recentPatientsData = allPatients
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((p: any) => ({
                    id: p.id,
                    name: `${p.firstName} ${p.lastName}`,
                    time: format(new Date(p.createdAt), 'HH:mm'),
                }))
            setRecentPatients(recentPatientsData)

            setRecentNotes([
                { id: 1, patient: 'Carmen Rosa Quispe', note: 'Control prenatal exitoso', time: '14:30' },
                { id: 2, patient: 'Juan Carlos Mamani', note: 'Chequeo de presión arterial', time: '13:15' },
            ])

            setRecentReports([
                { id: 1, type: 'Estadísticas MINSA', generated: 'hace 2 horas' },
                { id: 2, type: 'Control Prenatal', generated: 'hace 4 horas' },
            ])

            // Panel IA
            const saturation = Math.min(100, Math.floor((activeAppointments.length / 30) * 100))
            setAiPredictions({
                saturationLevel: saturation,
                staffRecommendation: saturation > 70 ? 'Refuerzo de personal recomendado' : 'Capacidad adecuada',
                riskAlerts: saturation > 85 ? ['Riesgo de saturación crítico'] : []
            })

        } catch (error: any) {
            console.error('Dashboard error:', error)
            toast({
                title: 'Error',
                description: 'Error al cargar datos del panel',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    {config?.hospitalName || 'Centro de Salud Jorge Chávez'} · Panel de Control en Tiempo Real
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pacientes Hoy</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.patientsToday}</div>
                        <p className="text-xs text-muted-foreground">+12% vs ayer</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Citas Activas</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.activeAppointments}</div>
                        <p className="text-xs text-muted-foreground">Para el turno actual</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Personal Disponible</CardTitle>
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpis.availableStaff}</div>
                        <p className="text-xs text-muted-foreground">En el centro ahora</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Diarios</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(kpis.dailyIncome, config)}</div>
                        <p className="text-xs text-muted-foreground">Recaudación proyectada</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Citas del Día</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={appointmentsByHour}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="appointments" stroke={COLORS.primary} strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Distribución por Especialidad</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={specialtiesChart}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Agenda Próxima</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {upcomingAppointments.map((apt) => (
                                <div key={apt.id} className="flex items-center">
                                    <div className="w-12 text-sm font-medium">{apt.time}</div>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{apt.patient}</p>
                                        <p className="text-xs text-muted-foreground">{apt.reason}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <div className={cn("px-2 py-1 rounded text-[10px]",
                                            apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-slate-100'
                                        )}>
                                            {apt.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <img src="/assets/logoIA.png" alt="IA" className="h-10 w-10 object-contain" />
                            <div>
                                <CardTitle>Análisis Predictivo IA</CardTitle>
                                <CardDescription>Nivel de saturación proyectado</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold">{aiPredictions.saturationLevel}%</div>
                                <div className="text-sm font-medium text-muted-foreground">{aiPredictions.staffRecommendation}</div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500",
                                        aiPredictions.saturationLevel > 70 ? 'bg-orange-500' : 'bg-cyan-500'
                                    )}
                                    style={{ width: `${aiPredictions.saturationLevel}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
