import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    UserCog,
    Plus,
    Camera,
    LayoutGrid,
    LayoutList,
    Layers,
    History,
    ArrowUpRight,
    Search,
    Loader2,
    Users,
    Clock,
    DollarSign,
    Calendar as CalendarIcon,
    CheckCircle,
    XCircle,
    AlertCircle,
    BadgeCheck,
    Briefcase,
    ShieldCheck,
    Contact,
    CreditCard,
    PhoneCall,
    MapPin,
    Baby,
    VenetianMask,
    Info,
    Mail,
    Smartphone,
    MapPin as MapPinIcon,
    Globe,
    CalendarDays,
    CreditCard as CreditCardIcon,
    Heart,
    Edit,
    Activity,
    TrendingUp,
    TrendingDown,
    Printer,
    FileText,
    Eye,
    AlertTriangle,
    Filter,
    Download,
    Mail as MailIcon,
    Sun,
    Sunset,
    Moon
} from 'lucide-react'
import { hrAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { format, differenceInHours, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Calendar } from '@/components/ui/calendar'
import { useNavigate, Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/financialUtils'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart as RePieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function HRPage() {
    const { config } = useOrganization()
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    // Modals and Data State
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('staff')
    const [selectedMonth, setSelectedMonth] = useState(new Date())
    const { toast } = useToast()

    // Essential Modal State (Remaining in Dashboard)
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
    const [selectedPayroll, setSelectedPayroll] = useState<any>(null)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [isPaystubModalOpen, setIsPaystubModalOpen] = useState(false)


    // Datos de HR
    const [hrData, setHrData] = useState<any>({
        employees: [],
        attendance: [],
        payroll: [],
        shifts: [],
    })

    useEffect(() => {
        loadHRData()
    }, [])


    const loadHRData = async () => {
        try {
            setLoading(true)

            // [REAL] Fetch data from Backend
            const [employeesRes, attendanceRes, payrollRes, shiftsRes] = await Promise.all([
                hrAPI.getEmployees(),
                hrAPI.getAttendance(),
                hrAPI.getPayroll(),
                hrAPI.getShifts()
            ])

            // Map Backend Data to Frontend Structure
            // Note: Backend returns { data: [], meta: ... } for some, array for others
            // Adjust based on actual API return signature in hr.service.ts

            const realData = {
                employees: employeesRes.data.data.map((e: any) => ({
                    ...e,
                    area: e.area || e.department,
                    contract: e.contract || 'Tiempo Completo',
                    photo: e.photo || `https://ui-avatars.com/api/?name=${e.name}`
                })),
                attendance: attendanceRes.data.map((a: any) => ({
                    id: a.id,
                    employeeName: a.employee?.name || 'Unknown',
                    employeePhoto: a.employee?.photo || `https://ui-avatars.com/api/?name=${a.employee?.name || 'U'}`,
                    date: new Date(a.checkIn),
                    checkIn: new Date(a.checkIn),
                    checkOut: a.checkOut ? new Date(a.checkOut) : null,
                    hoursWorked: Number(a.hoursWorked) || 0,
                    tardiness: a.tardiness || 0,
                    status: a.status,
                    notes: a.notes
                })),
                payroll: payrollRes.data.map((p: any) => {
                    const base = Number(p.baseSalary)
                    const totalDeductions = Number(p.deductions)
                    const pension = base * 0.13
                    const otherDiscounts = totalDeductions - pension

                    return {
                        id: p.id,
                        employeeName: p.employee?.name || 'Unknown',
                        employeePhoto: p.employee?.photo || `https://ui-avatars.com/api/?name=${p.employee?.name || 'U'}`,
                        employeeDni: p.employee?.documentId || 'N/A',
                        employeeArea: p.employee?.area || 'General',
                        employeeBankAccount: p.employee?.bankAccount || 'N/A',
                        baseSalary: base,
                        pension: pension,
                        discounts: otherDiscounts > 0 ? otherDiscounts : 0,
                        bonuses: Number(p.bonuses),
                        finalAmount: Number(p.netSalary),
                        status: p.status || 'PAID',
                        period: p.periodStart ? new Date(p.periodStart) : new Date()
                    }
                }),
                shifts: shiftsRes.data.map((s: any) => {
                    const date = new Date(s.startTime)
                    const dayName = format(date, 'eeee', { locale: es })
                    // Capitalize first letter: lunes -> Lunes
                    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1)

                    return {
                        id: s.id,
                        employeeId: s.employeeId,
                        employeeName: s.employee?.name || 'Unknown',
                        employeePhoto: s.employee?.photo || `https://ui-avatars.com/api/?name=${s.employee?.name || 'U'}`,
                        day: capitalizedDay,
                        shift: s.type,
                        startTime: format(date, 'HH:mm'),
                        endTime: format(new Date(s.endTime), 'HH:mm'),
                        fullStart: s.startTime,
                        fullEnd: s.endTime
                    }
                })
            }

            setHrData(realData)
        } catch (error: any) {
            console.error('HR Load Error:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al cargar datos de RRHH',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    // Estadísticas
    const stats = {
        totalEmployees: hrData.employees.length,
        activeEmployees: hrData.employees.filter((e: any) => e.status === 'ACTIVE').length,
        presentToday: hrData.attendance.filter((a: any) => a.status !== 'ABSENT').length,
        totalPayroll: hrData.payroll.reduce((sum: number, p: any) => sum + p.finalAmount, 0),
        punctualityMonth: Math.round((hrData.attendance.filter((a: any) => a.status === 'ON_TIME').length / (hrData.attendance.length || 1)) * 100),
        absenteeism: Math.round((hrData.attendance.filter((a: any) => a.status === 'ABSENT').length / (hrData.attendance.length || 1)) * 100),
        avgTardiness: Math.round(hrData.attendance.reduce((sum: number, a: any) => sum + (a.tardiness || 0), 0) / (hrData.attendance.filter((a: any) => a.status === 'LATE').length || 1)),
        costPerEmployee: Math.round(hrData.payroll.reduce((sum: number, p: any) => sum + p.finalAmount, 0) / (hrData.payroll.length || 1)),
        coverage: Math.round((hrData.shifts.length / (hrData.employees.length * 5 || 1)) * 100), // Estimado basado en semana de 5 días
    }

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: 'bg-green-100 text-green-800',
            VACATION: 'bg-blue-100 text-blue-800',
            SICK: 'bg-orange-100 text-orange-800',
            INACTIVE: 'bg-red-100 text-red-800',
        }
        return colors[status] || colors.ACTIVE
    }

    const getAttendanceIcon = (status: string) => {
        switch (status) {
            case 'ON_TIME':
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'LATE':
                return <AlertCircle className="h-4 w-4 text-orange-600" />
            case 'ABSENT':
                return <XCircle className="h-4 w-4 text-red-600" />
            default:
                return <Clock className="h-4 w-4 text-gray-600" />
        }
    }

    const getShiftColor = (shift: string) => {
        const colors: Record<string, string> = {
            MORNING: 'bg-yellow-100 text-yellow-800',
            AFTERNOON: 'bg-orange-100 text-orange-800',
            NIGHT: 'bg-indigo-100 text-indigo-800',
        }
        return colors[shift] || colors.MORNING
    }

    // Modals y Helpers
    const handleViewDetails = (employee: any) => {
        setSelectedEmployee(employee)
        setIsDetailsModalOpen(true)
    }

    const handleViewPaystub = (record: any) => {
        setSelectedPayroll(record)
        setIsPaystubModalOpen(true)
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
            {/* Header — same layout as Emergencias */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Portal RRHH</h1>
                        <p className="text-muted-foreground">
                            Módulo de gestión de recursos humanos
                        </p>
                    </div>
                </div>
                <Link to="/attendance">
                    <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20">
                        Control de Asistencia
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>

            {/* Stats Cards — same style as Emergencias */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-indigo-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
                        <Users className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">{stats.totalEmployees}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.activeEmployees} activos en sistema
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Disponibilidad Hoy</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
                        <p className="text-xs text-muted-foreground">
                            Presentes el día de hoy
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Planilla Total (Mes)</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(stats.totalPayroll, config)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Nómina mensual
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cobertura de Turnos</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{hrData.shifts.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Turnos asignados
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs — default shadcn like Emergencias */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="staff">
                        <Users className="h-4 w-4 mr-2" />
                        Colaboradores
                    </TabsTrigger>
                    <TabsTrigger value="schedules">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Horarios
                    </TabsTrigger>
                    <TabsTrigger value="payroll">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Nómina
                    </TabsTrigger>
                </TabsList>

                {/* ─── SCHEDULES TAB ─── */}
                <TabsContent value="schedules" className="mt-4 space-y-4">
                    {/* Métricas Inline de Turnos */}
                    <Card className="border-indigo-200 bg-indigo-50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Resumen de Cobertura de Turnos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Turno Mañana</p>
                                    <p className="text-2xl font-bold text-yellow-600">{hrData.shifts.filter((s: any) => s.shift === 'MORNING').length}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Turno Tarde</p>
                                    <p className="text-2xl font-bold text-orange-600">{hrData.shifts.filter((s: any) => s.shift === 'AFTERNOON').length}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Turno Noche</p>
                                    <p className="text-2xl font-bold text-indigo-600">{hrData.shifts.filter((s: any) => s.shift === 'NIGHT').length}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Total Activos</p>
                                    <p className="text-2xl font-bold">{hrData.shifts.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabla de Turnos Asignados */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <CalendarIcon className="h-5 w-5 text-indigo-600" />
                                <div>
                                    <CardTitle>Horarios del Personal</CardTitle>
                                    <CardDescription>Turnos asignados desde el backend</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800 hover:bg-transparent">
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Colaborador</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Día</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Turno</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Hora Inicio</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Hora Fin</TableHead>
                                        <TableHead className="text-center text-zinc-500 uppercase text-xs font-bold">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {hrData.shifts.map((shift: any) => {
                                        const employee = hrData.employees.find((e: any) => e.id === shift.employeeId || e.name === shift.employeeName);
                                        return (
                                            <TableRow key={shift.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={shift.employeePhoto || employee?.photo} />
                                                            <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs font-semibold">
                                                                {shift.employeeName?.charAt(0) || '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-medium">{shift.employeeName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{shift.day}</TableCell>
                                                <TableCell>
                                                    <Badge className={`text-xs font-semibold ${getShiftColor(shift.shift)}`}>
                                                        {shift.shift === 'MORNING' ? 'Mañana' : shift.shift === 'AFTERNOON' ? 'Tarde' : 'Noche'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{shift.startTime}</TableCell>
                                                <TableCell className="font-mono text-sm">{shift.endTime}</TableCell>
                                                <TableCell className="text-center">
                                                    {employee && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(employee)}
                                                        >
                                                            <Eye className="h-4 w-4 text-indigo-500" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {hrData.shifts.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                                                No hay turnos registrados
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>


                {/* ─── STAFF TAB ─── */}
                <TabsContent value="staff" className="mt-4 space-y-4">
                    <Card className="border-indigo-200 bg-indigo-50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Métricas de Retención y Cultura</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Rotación Mensual</p>
                                    <p className="text-2xl font-bold">2.4%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Antigüedad (Prom)</p>
                                    <p className="text-2xl font-bold">3.2a</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Satisfacción</p>
                                    <p className="text-2xl font-bold">4.8/5</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Diversidad</p>
                                    <p className="text-2xl font-bold">45/55</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Directorio de Colaboradores */}
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <CardTitle>Directorio Ejecutivo</CardTitle>
                                    <CardDescription>Mapa humano y administrativo de la institución</CardDescription>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                                        <Input
                                            placeholder="Buscar por nombre, DNI o cargo..."
                                            className="pl-9 bg-zinc-900 border-zinc-800"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Filter className="h-4 w-4 mr-2" /> Filtros
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800 hover:bg-transparent">
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Colaborador / Unidad</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">DNI / Documento</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Nivel Contractual</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Estado Laboral</TableHead>
                                        <TableHead className="text-right text-zinc-500 uppercase text-xs font-bold">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {hrData.employees
                                        .filter((emp: any) =>
                                            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            emp.documentId?.includes(searchTerm) ||
                                            emp.role.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map((emp: any) => (
                                            <TableRow key={emp.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={emp.photo} className="object-cover" />
                                                            <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">{emp.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium">{emp.name}</p>
                                                            <p className="text-xs text-muted-foreground">{emp.role} • {emp.area}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs font-mono">{emp.documentId || '---'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700">
                                                        {emp.contract}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`text-xs font-semibold ${emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {emp.status === 'ACTIVE' ? 'En Funciones' : 'Licencia/Inactivo'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(emp)}
                                                    >
                                                        Ver Perfil
                                                        <Eye className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {hrData.employees.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                                No se encontraron empleados
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── PAYROLL TAB ─── */}
                <TabsContent value="payroll" className="mt-4 space-y-4">
                    {/* Métricas Inline de Nómina */}
                    <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Resumen de Planilla</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Total Planilla</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(hrData.payroll.reduce((acc: number, p: any) => acc + (Number(p.netSalary) || 0), 0), config)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Boletas</p>
                                    <p className="text-2xl font-bold text-blue-600">{hrData.payroll.length}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Pendientes</p>
                                    <p className="text-2xl font-bold text-orange-600">{hrData.payroll.filter((p: any) => p.status === 'PENDING').length}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Pagados</p>
                                    <p className="text-2xl font-bold">{hrData.payroll.filter((p: any) => p.status === 'PAID').length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabla de Nómina */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                <div>
                                    <CardTitle>Registros de Nómina</CardTitle>
                                    <CardDescription>Historial de pagos desde el backend</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-800 hover:bg-transparent">
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Colaborador</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Período</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Salario Base</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Bonificaciones</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Deducciones</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Neto</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-xs font-bold">Estado</TableHead>
                                        <TableHead className="text-center text-zinc-500 uppercase text-xs font-bold">Boleta</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {hrData.payroll.map((record: any) => (
                                        <TableRow key={record.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={record.employeePhoto} />
                                                        <AvatarFallback className="bg-green-100 text-green-600 text-xs font-semibold">
                                                            {record.employeeName?.charAt(0) || '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">{record.employeeName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{typeof record.period === 'string' ? record.period : format(new Date(record.period || record.createdAt || Date.now()), 'MMM yyyy', { locale: es })}</TableCell>
                                            <TableCell className="font-mono text-sm">{formatCurrency(record.baseSalary || 0, config)}</TableCell>
                                            <TableCell className="font-mono text-sm text-green-600">+{formatCurrency(record.bonuses || 0, config)}</TableCell>
                                            <TableCell className="font-mono text-sm text-red-600">-{formatCurrency(record.deductions || 0, config)}</TableCell>
                                            <TableCell className="font-mono text-sm font-semibold">{formatCurrency(record.netSalary || 0, config)}</TableCell>
                                            <TableCell>
                                                <Badge className={`text-xs font-semibold ${record.status === 'PAID' ? 'bg-green-100 text-green-700' : record.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {record.status === 'PAID' ? 'Pagado' : record.status === 'PENDING' ? 'Pendiente' : 'Procesando'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewPaystub(record)}
                                                >
                                                    <Eye className="h-4 w-4 text-indigo-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {hrData.payroll.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-zinc-500">
                                                No hay registros de nómina
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ─── EMPLOYEE DETAILS MODAL ─── */}
            <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Perfil del Empleado</DialogTitle>
                        <DialogDescription>Información detallada del colaborador</DialogDescription>
                    </DialogHeader>

                    {selectedEmployee && (
                        <div className="space-y-6 pt-4">
                            {/* Header with photo */}
                            <div className="flex items-center gap-4 pb-4 border-b">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={selectedEmployee.photo} className="object-cover" />
                                    <AvatarFallback className="text-2xl bg-indigo-500 text-white">
                                        {selectedEmployee.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedEmployee.name}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedEmployee.role} • {selectedEmployee.area}</p>
                                    <Badge className={`mt-1 text-xs ${selectedEmployee.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {selectedEmployee.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">DNI</Label>
                                        <p className="text-sm font-semibold">{selectedEmployee.documentId || '---'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Email</Label>
                                        <p className="text-sm font-semibold">{selectedEmployee.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Teléfono</Label>
                                        <p className="text-sm font-semibold">{selectedEmployee.phone || '---'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Fecha Ingreso</Label>
                                        <p className="text-sm font-semibold">
                                            {selectedEmployee.hireDate ? format(new Date(selectedEmployee.hireDate), 'dd MMM yyyy', { locale: es }) : '---'}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Tipo de Contrato</Label>
                                        <p className="text-sm font-semibold">{selectedEmployee.contract}</p>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Salario Base</Label>
                                        <p className="text-sm font-semibold">S/ {selectedEmployee.baseSalary ? Number(selectedEmployee.baseSalary).toLocaleString() : '0'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4">
                                <Button
                                    onClick={() => { setIsDetailsModalOpen(false); navigate(`/attendance?search=${selectedEmployee.name}`); }}
                                    className="flex-1"
                                >
                                    <Activity className="mr-2 h-4 w-4" />
                                    Ver en Asistencia
                                </Button>
                                <Button variant="outline" className="flex-1">
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar Ficha
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ─── PAYROLL MODAL ─── */}
            <Dialog open={isPaystubModalOpen} onOpenChange={setIsPaystubModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Boleta de Pago</DialogTitle>
                        <DialogDescription>Detalle del registro de nómina</DialogDescription>
                    </DialogHeader>

                    {selectedPayroll && (
                        <div className="space-y-4 pt-4">
                            {/* Header con empleado */}
                            <div className="flex items-center gap-4 p-4 bg-accent rounded-lg">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={selectedPayroll.employeePhoto} />
                                    <AvatarFallback className="bg-green-500 text-white font-semibold">
                                        {selectedPayroll.employeeName?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{selectedPayroll.employeeName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Período: {typeof selectedPayroll.period === 'string' ? selectedPayroll.period : format(new Date(selectedPayroll.period || selectedPayroll.createdAt || Date.now()), 'MMMM yyyy', { locale: es })}
                                    </p>
                                </div>
                            </div>

                            {/* Desglose de pago */}
                            <div className="space-y-2">
                                <div className="flex justify-between p-3 bg-accent/50 rounded">
                                    <span className="text-sm">Salario Base</span>
                                    <span className="font-mono font-semibold">S/ {Number(selectedPayroll.baseSalary || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-green-50 rounded border border-green-200">
                                    <span className="text-sm text-green-700">Bonificaciones</span>
                                    <span className="font-mono font-semibold text-green-700">+S/ {Number(selectedPayroll.bonuses || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-red-50 rounded border border-red-200">
                                    <span className="text-sm text-red-700">Deducciones</span>
                                    <span className="font-mono font-semibold text-red-700">-S/ {Number(selectedPayroll.deductions || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-indigo-50 rounded border border-indigo-200">
                                    <span className="text-sm font-bold">NETO A PAGAR</span>
                                    <span className="text-xl font-mono font-bold text-indigo-600">S/ {Number(selectedPayroll.netSalary || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Estado */}
                            <div className="flex items-center justify-between p-3 bg-accent/50 rounded">
                                <span className="text-sm">Estado</span>
                                <Badge className={`text-xs font-semibold ${selectedPayroll.status === 'PAID' ? 'bg-green-100 text-green-700' : selectedPayroll.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {selectedPayroll.status === 'PAID' ? 'Pagado' : selectedPayroll.status === 'PENDING' ? 'Pendiente' : 'Procesando'}
                                </Badge>
                            </div>

                            {/* Botón de descarga */}
                            <Button
                                onClick={() => {
                                    const printContent = `
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <title>Boleta de Pago - ${selectedPayroll.employeeName}</title>
                                            <style>
                                                body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                                                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
                                                .title { font-size: 24px; font-weight: bold; color: #4f46e5; }
                                                .subtitle { font-size: 12px; color: #666; text-transform: uppercase; }
                                                .employee { display: flex; align-items: center; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                                                .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
                                                .label { color: #666; }
                                                .value { font-weight: bold; font-family: monospace; }
                                                .total { background: #4f46e5; color: white; padding: 15px; border-radius: 8px; margin-top: 20px; }
                                                .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                                                .paid { background: #d1fae5; color: #059669; }
                                                .pending { background: #fef3c7; color: #d97706; }
                                                @media print { body { padding: 20px; } }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="header">
                                                <div class="title">BOLETA DE PAGO</div>
                                                <div class="subtitle">${config?.hospitalName || 'EdiCarex Hospital'} - Recursos Humanos</div>
                                            </div>
                                            <div class="employee">
                                                <div>
                                                    <strong style="font-size: 18px;">${selectedPayroll.employeeName}</strong><br>
                                                    <span style="color: #666; font-size: 12px;">Período: ${typeof selectedPayroll.period === 'string' ? selectedPayroll.period : new Date(selectedPayroll.period || selectedPayroll.createdAt || Date.now()).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}</span>
                                                </div>
                                            </div>
                                            <div class="row"><span class="label">Salario Base</span><span class="value">S/ ${Number(selectedPayroll.baseSalary || 0).toLocaleString()}</span></div>
                                            <div class="row"><span class="label" style="color: #059669;">Bonificaciones</span><span class="value" style="color: #059669;">+S/ ${Number(selectedPayroll.bonuses || 0).toLocaleString()}</span></div>
                                            <div class="row"><span class="label" style="color: #dc2626;">Deducciones</span><span class="value" style="color: #dc2626;">-S/ ${Number(selectedPayroll.deductions || 0).toLocaleString()}</span></div>
                                            <div class="total"><div style="display: flex; justify-content: space-between;"><span>NETO A PAGAR</span><span style="font-size: 24px; font-weight: bold;">S/ ${Number(selectedPayroll.netSalary || 0).toLocaleString()}</span></div></div>
                                            <div style="margin-top: 20px; text-align: center;">
                                                <span class="status ${selectedPayroll.status === 'PAID' ? 'paid' : 'pending'}">${selectedPayroll.status === 'PAID' ? 'PAGADO' : 'PENDIENTE'}</span>
                                            </div>
                                            <div style="margin-top: 40px; text-align: center; color: #999; font-size: 10px;">
                                                Documento generado el ${new Date().toLocaleDateString('es-PE')} - EdiCarex RRHH
                                            </div>
                                        </body>
                                        </html>
                                    `;
                                    const printWindow = window.open('', '_blank');
                                    if (printWindow) {
                                        printWindow.document.write(printContent);
                                        printWindow.document.close();
                                        printWindow.print();
                                    }
                                }}
                                className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                            >
                                <Download className="mr-2 h-4 w-4" /> Descargar PDF
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}