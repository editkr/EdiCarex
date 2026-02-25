import { useState, useEffect } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency } from '@/utils/financialUtils'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    Loader2,
    Activity,
    AlertTriangle,
    Calendar,
    Stethoscope,
    PieChart,
    ArrowUpRight,
    TestTube,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { analyticsAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ComposedChart,
    Cell,
    PieChart as RePieChart,
    Pie,
} from 'recharts'

export default function AnalyticsPage() {
    const { config } = useOrganization()
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState('12months')
    const { toast } = useToast()

    // Datos de analytics
    const [analyticsData, setAnalyticsData] = useState<any>({
        heatmap: [],
        saturation: [],
        areaComparison: [],
        patientCycle: [],
        capacity: [],
        historical: [],
        topDoctors: [],
        patientStats: { total: 0, byGender: [], byStatus: [] },
        ageDist: [],
        revenueStats: { totalRevenue: 0, pendingRevenue: 0, thisMonthRevenue: 0 },
        dashboard: { appointments: [], patients: { total: 0, byGender: [], byStatus: [] }, topDoctors: [] },
        appointmentTypes: [],
        labStats: [],
        topMeds: []
    })

    useEffect(() => {
        loadAnalytics()
    }, [timeRange])

    const loadAnalytics = async () => {
        try {
            setLoading(true)
            const [
                heatmapRes,
                saturationRes,
                areaRes,
                cycleRes,
                capacityRes,
                historicalRes,
                dashboardRes,
                patientStatsRes,
                appTypesRes,
                labStatsRes,
                topMedsRes,
                ageDistRes,
                revenueStatsRes
            ] = await Promise.all([
                analyticsAPI.getHeatmap(timeRange),
                analyticsAPI.getSaturation(timeRange),
                analyticsAPI.getAreaComparison(timeRange),
                analyticsAPI.getPatientCycle(timeRange),
                analyticsAPI.getCapacity(timeRange),
                analyticsAPI.getHistorical(timeRange),
                analyticsAPI.getDashboard(timeRange),
                analyticsAPI.getPatientStats(timeRange),
                analyticsAPI.getAppointmentTypes(timeRange),
                analyticsAPI.getLabStats(timeRange),
                analyticsAPI.getTopMeds(timeRange),
                analyticsAPI.getAgeDistribution(timeRange),
                analyticsAPI.getRevenueStats(timeRange)
            ])

            setAnalyticsData({
                heatmap: heatmapRes.data,
                saturation: saturationRes.data,
                areaComparison: areaRes.data,
                patientCycle: cycleRes.data,
                capacity: capacityRes.data,
                historical: historicalRes.data,
                topDoctors: dashboardRes.data?.topDoctors || [],
                patientStats: patientStatsRes.data,
                appointmentTypes: appTypesRes.data,
                labStats: labStatsRes.data,
                topMeds: topMedsRes.data,
                ageDist: ageDistRes.data,
                revenueStats: revenueStatsRes.data,
                dashboard: dashboardRes.data
            })

        } catch (error: any) {
            console.error(error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al cargar analíticas',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }


    // Calcular estadísticas optimizadas usando 100% de la API
    const stats = {
        totalPatients: analyticsData.dashboard.patients?.total || 0,
        newPatientsThisMonth: analyticsData.patientStats.newThisMonth || 0,
        totalRevenue: analyticsData.revenueStats?.totalRevenue || 0,
        thisMonthRevenue: analyticsData.revenueStats?.thisMonthRevenue || 0,
        pendingRevenue: analyticsData.revenueStats?.pendingRevenue || 0,
        avgSaturation: Math.round(
            (analyticsData.saturation || []).reduce((sum: number, h: any) => sum + (h.current / (h.capacity || 100) * 100), 0) /
            (analyticsData.saturation?.length || 1)
        ),
        avgCapacityUsage: Math.round(
            (analyticsData.capacity || []).reduce((sum: number, d: any) => sum + (d.booked / (d.available || 100) * 100), 0) /
            (analyticsData.capacity?.length || 1)
        ),
    }

    // Obtener color del heatmap
    const getHeatmapColor = (value: number) => {
        if (value >= 15) return '#ef4444' // Rojo - Alta demanda
        if (value >= 10) return '#f59e0b' // Naranja - Media-Alta
        if (value >= 5) return '#3b82f6' // Azul - Media
        return '#10b981' // Verde - Baja
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Inteligencia de Datos</h1>
                        <p className="text-muted-foreground">
                            Análisis estratégico y predictivo basado en datos reales
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Rango de Tiempo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7days">Últimos 7 Días</SelectItem>
                            <SelectItem value="30days">Últimos 30 Días</SelectItem>
                            <SelectItem value="12months">Últimos 12 Meses</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    {
                        title: 'Pacientes Totales',
                        value: stats.totalPatients,
                        sub: `+${stats.newPatientsThisMonth} este mes`,
                        icon: <Users />,
                        color: 'blue',
                        trend: 'up'
                    },
                    {
                        title: 'Facturación Total',
                        value: formatCurrency(stats.totalRevenue, config),
                        sub: `${formatCurrency(stats.thisMonthRevenue, config)} este mes`,
                        icon: <DollarSign />,
                        color: 'green',
                        trend: 'up'
                    },
                    {
                        title: 'Recaudación Pendiente',
                        value: formatCurrency(stats.pendingRevenue, config),
                        sub: 'Cuentas por cobrar',
                        icon: <TrendingUp />,
                        color: 'purple',
                        trend: 'up'
                    },
                    {
                        title: 'Saturación Prom.',
                        value: `${stats.avgSaturation}%`,
                        sub: 'Estado Crítico > 85%',
                        icon: <Activity />,
                        color: 'orange',
                        trend: stats.avgSaturation > 80 ? 'up' : 'down'
                    },
                ].map((item, i) => (
                    <Card key={i} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
                        <div className={`h-1 w-full bg-${item.color}-500`} />
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className={`p-2 rounded-lg bg-${item.color}-50 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                                    {item.icon}
                                </div>
                                {item.trend && (
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.trend === 'up' ? 'bg-green-50 text-green-600' :
                                        item.trend === 'down' ? 'bg-blue-50 text-blue-600' :
                                            'bg-gray-50 text-gray-600'
                                        }`}>
                                        {item.trend === 'up' ? 'Creciendo' : item.trend === 'down' ? 'Estable' : 'Info'}
                                    </span>
                                )}
                            </div>
                            <div className="mt-4">
                                <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                                <h3 className="text-2xl font-bold mt-1 tracking-tight">{item.value}</h3>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <ArrowUpRight className="h-3 w-3" />
                                    {item.sub}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="space-y-12 pb-12">
                {/* 1. SECCIÓN OPERATIVA */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-1 bg-blue-600 rounded-full" />
                        <h2 className="text-xl font-bold">Gestión Operativa y Afluencia</h2>
                    </div>

                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Grilla de Densidad: Afluencia de Pacientes</CardTitle>
                                    <CardDescription>Mapa de calor basado en citas confirmadas y triaje</CardDescription>
                                </div>
                                <div className="flex gap-2 text-xs font-medium">
                                    {[{ l: '0-5', c: '#10b981' }, { l: '5-10', c: '#3b82f6' }, { l: '10-15', c: '#f59e0b' }, { l: '15+', c: '#ef4444' }].map(t => (
                                        <div key={t.l} className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.c }} />
                                            <span>{t.l}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-muted/10">
                                            <th className="p-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest w-24">Horario</th>
                                            {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(day => (
                                                <th key={day} className="p-3 text-center text-xs font-bold text-muted-foreground">{day}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analyticsData.heatmap.map((row: any, idx: number) => (
                                            <tr key={idx} className="border-b border-muted/10 hover:bg-muted/5 transition-colors">
                                                <td className="p-3 text-xs font-bold bg-muted/5 text-muted-foreground">{row.hour}</td>
                                                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                                                    <td key={day} className="p-1">
                                                        <div
                                                            className="h-10 w-full rounded-md flex items-center justify-center text-white text-[10px] font-black shadow-sm transition-all hover:scale-105 cursor-help"
                                                            style={{
                                                                backgroundColor: getHeatmapColor(row[day]),
                                                                opacity: row[day] === 0 ? 0.2 : 1,
                                                                border: row[day] > 10 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                                            }}
                                                            title={`${row[day]} pacientes el ${day} a las ${row.hour}`}
                                                        >
                                                            {row[day] > 0 ? row[day] : ''}
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-600" />
                                    Balance de Carga Predictiva
                                </CardTitle>
                                <CardDescription>Saturación actual vs Demanda estimada (Próximas 24h)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={(analyticsData.saturation || []).filter((d: any) => d.hour !== '0:00')}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Legend verticalAlign="top" height={36} />
                                        <Area type="monotone" dataKey="capacity" fill="#f1f5f9" stroke="#cbd5e1" name="Límite del Centro" />
                                        <Line type="stepAfter" dataKey="current" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }} name="Saturación Real" />
                                        <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={false} name="Forecast Predictivo" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-green-600" />
                                    Eficiencia de Agenda Semanal
                                </CardTitle>
                                <CardDescription>Capacidad instalada vs Reservas efectivas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analyticsData.capacity}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                                        <Legend verticalAlign="top" height={36} />
                                        <Bar dataKey="available" fill="#e2e8f0" name="Espacios Totales" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="booked" fill="#10b981" name="Turnos Tomados" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="walkins" fill="#3b82f6" name="Citas de Guardia" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* 2. SECCIÓN FINANCIERA */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-1 bg-emerald-600 rounded-full" />
                        <h2 className="text-xl font-bold">Rendimiento Financiero y Ranking</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-emerald-600" />
                                    Flujo de Caja Anual (Facturación Real)
                                </CardTitle>
                                <CardDescription>Ingresos percibidos por meses (Invoices Pagados)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart data={analyticsData.historical}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => formatCurrency(val, config)} />
                                        <Tooltip formatter={(val: any) => formatCurrency(Number(val), config)} />
                                        <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Recaudación Mensual" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Stethoscope className="h-5 w-5 text-indigo-600" />
                                    Top 5 Doctores: Facturación
                                </CardTitle>
                                <CardDescription>Líderes en generación de valor</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart
                                        data={analyticsData.topDoctors || []}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={180}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fontWeight: 500 }}
                                        />
                                        <Tooltip formatter={(val: any) => formatCurrency(Number(val), config)} />
                                        <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} name="Ingresos Totales" barSize={30}>
                                            {(analyticsData.topDoctors || []).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#818cf8'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* 3. SECCIÓN ESTRATÉGICA Y DEMOGRÁFICA */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-1 bg-purple-600 rounded-full" />
                        <h2 className="text-xl font-bold">Análisis Estratégico y Conversión</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                    Embudo de Flujo Clínico
                                </CardTitle>
                                <CardDescription>Conversión real de pacientes por etapa del proceso</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={analyticsData.patientCycle}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="stage" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                                        <Legend />
                                        <Bar dataKey="count" fill="#8b5cf6" name="Carga de Pacientes" radius={[4, 4, 0, 0]} barSize={40} />
                                        <Bar dataKey="avgTime" fill="#f59e0b" name="Espera Promedio (min)" radius={[4, 4, 0, 0]} barSize={10} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <PieChart className="h-5 w-5 text-orange-600" />
                                    Distribución Operativa por Área
                                </CardTitle>
                                <CardDescription>Balance entre volumen e ingresos por especialidad</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={analyticsData.areaComparison}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="area" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                                        <Radar name="Pacientes" dataKey="patients" stroke="#2563eb" strokeWidth={3} fill="#2563eb" fillOpacity={0.2} />
                                        <Radar name="Ingresos (x1000)" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.1} />
                                        <Tooltip />
                                        <Legend />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* 4. SECCIÓN DE INSUMOS Y DEMANDA (NEW) */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-1 bg-amber-600 rounded-full" />
                        <h2 className="text-xl font-bold">Demanda de Insumos y Servicios</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-amber-600" />
                                    Mix de Servicios (Citas por Tipo)
                                </CardTitle>
                                <CardDescription>Distribución real de motivos de consulta</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RePieChart>
                                        <Pie
                                            data={analyticsData.appointmentTypes}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="_count"
                                            nameKey="type"
                                        >
                                            {(analyticsData.appointmentTypes || []).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][index % 5]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-rose-600" />
                                    Demanda de Farmacia (Top 10)
                                </CardTitle>
                                <CardDescription>Medicamentos con mayor rotación de pedidos</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analyticsData.topMeds} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={15} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TestTube className="h-5 w-5 text-cyan-600" />
                                    Carga de Laboratorio por Categoría
                                </CardTitle>
                                <CardDescription>Distribución de órdenes por tipo de examen</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analyticsData.labStats}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-teal-600" />
                                    Distribución Etaria de Pacientes
                                </CardTitle>
                                <CardDescription>Composición de la población por grupos de edad</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analyticsData.ageDist} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="range" type="category" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={25} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </div>
    )
}
