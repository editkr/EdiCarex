import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Tabs removed as they caused layout issues
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,

} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
    Clock,
    DollarSign,
    Calendar,
    ShieldCheck,
    Plus,
    Search,
    Loader2,
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    LayoutDashboard,
    Copy,
    Printer,
    TrendingUp,
    Download,
    ArrowUpRight,
    Users,
    Activity,
    FileText,
    PieChart,
    XCircle,
    Info,
    Building,
    Mail,
    Phone,
    MapPin
} from 'lucide-react'
import {
    hrAPI, attendanceAPI, adminAPI, auditAPI
} from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useLocation, useNavigate } from 'react-router-dom'
import { exportToExcel, exportHRAttendanceToPDF, exportPayrollToPDF } from '@/utils/exportUtils'
import { useOrganization } from '@/contexts/OrganizationContext'
import { formatCurrency } from '@/utils/financialUtils'

export default function AttendancePage() {
    const { config } = useOrganization()
    const location = useLocation()
    const navigate = useNavigate()

    // Determine the active tab based on the URL path
    const getTabFromPath = () => {
        const path = location.pathname
        if (path.includes('staff')) return 'staff'
        if (path.includes('ops')) return 'ops'
        if (path.includes('shifts')) return 'shifts'
        if (path.includes('payroll')) return 'payroll'
        if (path.includes('rules')) return 'rules'
        if (path.includes('audit')) return 'audit'
        if (path.includes('settings')) return 'settings'
        return 'dashboard'
    }

    const [activeTab, setActiveTab] = useState(getTabFromPath())
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const { toast } = useToast()



    useEffect(() => {
        console.log('Path changed:', location.pathname)
        setActiveTab(getTabFromPath())
    }, [location.pathname])

    // Data State
    const [data, setData] = useState<any>({
        employees: [],
        attendance: [],
        shifts: [],
        auditConfig: null,
        payroll: [],
        stats: {
            present: 0,
            late: 0,
            absent: 0,
            total: 0
        }
    })

    console.log('AttendancePage Render:', { activeTab, loading, employees: data.employees?.length, path: location.pathname })

    // Modals State
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)
    const [isEditingShift, setIsEditingShift] = useState(false)
    const [currentShiftId, setCurrentShiftId] = useState<string | null>(null)
    const [isEditingRules, setIsEditingRules] = useState(false) // NEW State for Rules Edit Mode
    const [rulesForm, setRulesForm] = useState<any>({}) // NEW State for Rules Form Data
    const [orgForm, setOrgForm] = useState<any>({}) // NEW State for Organization Form Data
    const [shiftForm, setShiftForm] = useState({
        employeeId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '08:00',
        endTime: '17:00',
        type: 'MORNING'
    })

    const [isPaystubModalOpen, setIsPaystubModalOpen] = useState(false)
    const [selectedPaystub, setSelectedPaystub] = useState<any>(null)

    // Employee Modals State
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false)
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
    const [isEditingEmployee, setIsEditingEmployee] = useState(false)
    const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
    const [employeeForm, setEmployeeForm] = useState({
        name: '',
        email: '',
        documentId: '',
        phone: '',
        department: '',
        area: '',
        role: '',
        salary: '',
        bonus: '0',
        hireDate: format(new Date(), 'yyyy-MM-dd'),
        birthDate: '',
        gender: '',
        contract: 'Tiempo Completo',
        status: 'ACTIVE',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        bankAccount: '',
        notes: '',
        photo: ''
    })

    // Sync state with URL manually if needed, or just use location
    useEffect(() => {
        setActiveTab(getTabFromPath())
    }, [location.pathname])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            console.log('🔍 Iniciando carga de datos...')

            // INTENTO DE CARGA REAL
            try {
                const [emp, att, pay, shi, conf, audit, org] = await Promise.all([
                    hrAPI.getEmployees(),
                    hrAPI.getAttendance(),
                    hrAPI.getPayroll(),
                    hrAPI.getShifts(),
                    adminAPI.getConfigs(),
                    auditAPI.getAll({ limit: 50 }),
                    adminAPI.getOrganization() // NEW: Fetch Org Info
                ])

                console.log('📦 Respuesta API Employees:', { status: emp?.status, data: emp?.data })

                // Intentar extraer empleados de diferentes estructuras posibles
                const rawEmployees = emp?.data?.data || emp?.data;

                if (Array.isArray(rawEmployees) && rawEmployees.length > 0) {
                    console.log('✅ Datos reales encontrados:', rawEmployees.length)
                    setData({
                        employees: rawEmployees,
                        attendance: Array.isArray(att.data) ? att.data : [],
                        payroll: Array.isArray(pay.data) ? pay.data : [],
                        shifts: Array.isArray(shi.data) ? shi.data.map((s: any) => ({
                            ...s,
                            rawDate: format(new Date(s.startTime), 'yyyy-MM-dd'),
                            startTime: format(new Date(s.startTime), 'HH:mm'),
                            endTime: format(new Date(s.endTime), 'HH:mm'),
                            dayName: format(new Date(s.startTime), 'eeee', { locale: es })
                        })) : [],
                        configs: Array.isArray(conf?.data) ? conf.data : [],
                        auditLogs: Array.isArray(audit?.data?.data) ? audit.data.data : [],
                        organization: org?.data || null // Bind Organization
                    })
                    // Sync Org Form
                    if (org?.data) setOrgForm(org.data)
                    return; // SALIR SI DATOS REALES FUNCIONARON
                }

                // SI LLEGA AQUÍ, LA API RESPONDIÓ PERO SIN DATOS O MAL FORMATO
                console.warn('⚠️ La API respondió pero no se detectaron datos válidos')

            } catch (apiError) {
                console.warn('⚠️ Falló la carga API, usando datos de prueba:', apiError)
            }

        } catch (error) {
            console.error('❌ Error fatal cargando datos:', error)
            toast({ title: 'Error', description: 'No se pudieron cargar los datos operativos', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }


    // --- SHIFT LOGIC ---
    const resetShiftForm = () => {
        setShiftForm({
            employeeId: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            startTime: '08:00',
            endTime: '17:00',
            type: 'MORNING'
        })
        setIsEditingShift(false)
        setCurrentShiftId(null)
    }

    const handleEditShift = (shift: any) => {
        setShiftForm({
            employeeId: String(shift.employeeId),
            date: shift.rawDate,
            startTime: shift.startTime,
            endTime: shift.endTime,
            type: shift.type
        })
        setCurrentShiftId(shift.id)
        setIsEditingShift(true)
        setIsShiftModalOpen(true)
    }

    const handleCopyShift = (shift: any) => {
        setShiftForm({
            employeeId: String(shift.employeeId),
            date: shift.rawDate,
            startTime: shift.startTime,
            endTime: shift.endTime,
            type: shift.type
        })
        setCurrentShiftId(null)
        setIsEditingShift(false)
        setIsShiftModalOpen(true)
        toast({ title: 'Turno Copiado', description: 'Listo para nueva asignación' })
    }

    const handleSaveShift = async () => {
        try {
            const start = new Date(`${shiftForm.date}T${shiftForm.startTime}:00`)
            const end = new Date(`${shiftForm.date}T${shiftForm.endTime}:00`)

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                toast({ title: 'Error', description: 'Fecha u horas inválidas', variant: 'destructive' })
                return
            }

            const payload = {
                employeeId: shiftForm.employeeId,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                type: shiftForm.type
            }

            if (isEditingShift && currentShiftId) {
                await hrAPI.updateShift(currentShiftId, payload)
                toast({ title: 'Turno Actualizado' })
            } else {
                await hrAPI.createShift(payload)
                toast({ title: 'Turno Registrado' })
            }

            setIsShiftModalOpen(false)
            loadData()
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' })
        }
    }

    const handleDeleteShift = async (id: string) => {
        if (!confirm('¿Eliminar esta asignación?')) return
        try {
            await hrAPI.deleteShift(id)
            loadData()
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' })
        }
    }

    // --- PAYROLL LOGIC ---
    const handleGeneratePayroll = async () => {
        try {
            await hrAPI.generatePayroll()
            toast({ title: 'Planilla Generada', description: 'Cálculos actualizados para el mes actual' })
            loadData()
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' })
        }
    }

    const handlePayPayroll = async (id: string) => {
        try {
            await hrAPI.payPayroll(id)
            toast({ title: 'Pago Procesado', description: 'La boleta ya puede ser descargada' })
            loadData()
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' })
        }
    }

    const handleViewPaystub = (payroll: any) => {
        setSelectedPaystub(payroll)
        setIsPaystubModalOpen(true)
    }

    // --- EMPLOYEE LOGIC ---
    const handleViewProfile = (emp: any) => {
        setSelectedEmployee(emp)
        setIsProfileModalOpen(true)
    }

    const handleEditEmployee = (emp: any) => {
        setEmployeeForm({
            ...emp,
            salary: String(emp.salary),
            bonus: String(emp.bonus || 0),
            hireDate: emp.hireDate ? format(new Date(emp.hireDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            birthDate: emp.birthDate ? format(new Date(emp.birthDate), 'yyyy-MM-dd') : '',
        })
        setCurrentEmployeeId(emp.id)
        setIsEditingEmployee(true)
        setIsEmployeeModalOpen(true)
    }

    const handleSaveEmployee = async () => {
        try {
            const payload = {
                ...employeeForm,
                salary: Number(employeeForm.salary),
                bonus: Number(employeeForm.bonus),
                hireDate: new Date(employeeForm.hireDate).toISOString(),
                birthDate: employeeForm.birthDate ? new Date(employeeForm.birthDate).toISOString() : undefined,
            }

            if (isEditingEmployee && currentEmployeeId) {
                await hrAPI.updateEmployee(currentEmployeeId, payload)
                toast({ title: 'Colaborador Actualizado' })
            } else {
                await hrAPI.createEmployee(payload)
                toast({ title: 'Colaborador Registrado' })
            }
            setIsEmployeeModalOpen(false)
            loadData()
        } catch (error) {
            toast({ title: 'Error al guardar colaborador', variant: 'destructive' })
        }
    }

    const handleDeleteEmployee = async (id: string) => {
        if (!confirm('¿Eliminar registro de colaborador?')) return
        try {
            await hrAPI.deleteEmployee(id)
            loadData()
        } catch (error) {
            toast({ title: 'Error al eliminar', variant: 'destructive' })
        }
    }

    // --- EXPORT LOGIC ---
    const handleExportExcel = () => {
        let exportData = []
        let fileName = 'EdiCarex_Report'

        if (activeTab === 'ops') {
            exportData = data.attendance.map((a: any) => ({
                Empleado: a.employee?.name,
                Fecha: format(new Date(a.checkIn), 'dd/MM/yyyy'),
                Entrada: format(new Date(a.checkIn), 'HH:mm'),
                Salida: a.checkOut ? format(new Date(a.checkOut), 'HH:mm') : '---',
                Horas: a.hoursWorked,
                Estado: a.status
            }))
            fileName = 'Asistencia_General'
        } else if (activeTab === 'payroll') {
            exportData = data.payroll.map((p: any) => ({
                Empleado: p.employee?.name,
                Basico: p.baseSalary,
                Deducciones: p.deductions,
                Bonos: p.bonuses,
                Neto: p.netSalary,
                Estado: p.status
            }))
            fileName = 'Nomina_Mensual'
        } else {
            exportData = data.employees.map((e: any) => ({
                Nombre: e.name,
                Email: e.email,
                DNI: e.documentId,
                Cargo: e.role,
                Salario: e.salary,
                Estado: e.status
            }))
            fileName = 'Lista_Personal'
        }

        exportToExcel(exportData, fileName, activeTab.toUpperCase())
        toast({ title: 'Excel Generado', description: 'Descarga iniciada' })
    }

    const handleExportPDF = () => {
        if (activeTab === 'ops') exportHRAttendanceToPDF(data.attendance, config)
        else if (activeTab === 'payroll') exportPayrollToPDF(data.payroll, config)
        else toast({ title: 'Info', description: 'PDF disponible para Asistencia y Nómina' })
    }



    // --- RULES LOGIC ---
    const handleEditRules = () => {
        // Pre-fill form with existing config values
        const form: any = {}
        data.configs.forEach((c: any) => {
            form[c.key] = c.value
        })
        setRulesForm(form)
        setIsEditingRules(true)
    }

    const handleSaveOrganization = async () => {
        try {
            await adminAPI.updateOrganization(orgForm)
            toast({ title: 'Configuración Guardada', description: 'Los datos de la empresa han sido actualizados' })
            loadData()
        } catch (error) {
            toast({ title: 'Error al actualizar', variant: 'destructive' })
        }
    }

    const handleSaveRules = async () => {
        try {
            const promises = Object.entries(rulesForm).map(async ([key, value]) => {
                // Check if config exists to decide UPDATE or CREATE
                const existing = data.configs.find((c: any) => c.key === key)

                if (existing) {
                    return adminAPI.updateConfig(existing.id, { value })
                } else {
                    return adminAPI.createConfig({
                        key,
                        value,
                        category: 'ATTENDANCE_RULES',
                        type: 'STRING'
                    })
                }
            })

            await Promise.all(promises)
            toast({ title: 'Reglas Actualizadas', description: 'Los parámetros han sido guardados.' })
            setIsEditingRules(false)
            loadData() // Reload to reflect changes
        } catch (error) {
            console.error(error)
            toast({ title: 'Error al guardar', description: 'Verifica la consola para más detalles.', variant: 'destructive' })
        }
    }

    console.log('ABOUT TO RENDER RETURN BLOCK', { activeTab, loading })

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header dinámico por tab */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-edicarex flex items-center justify-center shadow-xl shadow-blue-500/20">
                        {activeTab === 'dashboard' && <LayoutDashboard className="h-10 w-10 text-white" />}
                        {activeTab === 'ops' && <Clock className="h-10 w-10 text-white" />}
                        {activeTab === 'shifts' && <Calendar className="h-10 w-10 text-white" />}
                        {activeTab === 'payroll' && <DollarSign className="h-10 w-10 text-white" />}
                        {activeTab === 'staff' && <Users className="h-10 w-10 text-white" />}
                        {activeTab === 'rules' && <ShieldCheck className="h-10 w-10 text-white" />}
                        {activeTab === 'audit' && <Activity className="h-10 w-10 text-white" />}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            {activeTab === 'dashboard' && 'Panel Principal'}
                            {activeTab === 'ops' && 'Marcaciones'}
                            {activeTab === 'shifts' && 'Turnos'}
                            {activeTab === 'payroll' && 'Planilla'}
                            {activeTab === 'staff' && 'Personal'}
                            {activeTab === 'rules' && 'Reglas'}
                            {activeTab === 'audit' && 'Auditoría'}
                        </h1>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                            Gestión Operativa de Asistencia
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/hr')}
                        className="h-11 rounded-xl border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 font-bold px-5 group text-sm"
                    >
                        <ArrowUpRight className="h-4 w-4 mr-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        Ir a RRHH
                    </Button>
                    {activeTab === 'staff' && (
                        <Button
                            onClick={() => { setIsEditingEmployee(false); setCurrentEmployeeId(null); setIsEmployeeModalOpen(true); }}
                            className="h-11 rounded-xl px-6 bg-purple-600 hover:bg-purple-700 font-bold text-sm shadow-lg shadow-purple-500/30 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" /> Nuevo Colaborador
                        </Button>
                    )}
                    {activeTab === 'shifts' && (
                        <Button
                            onClick={() => { resetShiftForm(); setIsShiftModalOpen(true); }}
                            className="h-11 rounded-xl px-6 bg-blue-600 hover:bg-blue-700 font-bold text-sm shadow-lg shadow-blue-500/30 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" /> Nuevo Turno
                        </Button>
                    )}
                    {activeTab === 'payroll' && (
                        <Button onClick={handleGeneratePayroll} className="h-11 rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/30">
                            Generar Planilla
                        </Button>
                    )}
                    {activeTab === 'rules' && (
                        <div className="flex gap-2">
                            {isEditingRules ? (
                                <>
                                    <Button onClick={() => setIsEditingRules(false)} variant="outline" className="h-11 rounded-xl px-4 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400 font-bold text-sm">
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleSaveRules} className="h-11 rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/30">
                                        Guardar Cambios
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={handleEditRules} className="h-11 rounded-xl px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/30">
                                    <Pencil className="h-4 w-4 mr-2" /> Editar Reglas
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Contenedor Principal (sin Tabs wrapper conflictivo) */}
            <div className="w-full relative min-h-[500px]">

                {/* Renderizado de Contenido por Tab */}
                <div className="animate-in slide-in-from-bottom-6 duration-700">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8">
                            {/* Section 1: KPIs en Tiempo Real */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <Card className="overflow-hidden border-none shadow-xl transition-all hover:scale-[1.02] bg-card/40 backdrop-blur-md">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-edicarex" />
                                    <div className="p-6 relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-xs font-semibold text-muted-foreground tracking-tight">Presentes Hoy</p>
                                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                                <Users className="h-4 w-4 text-white" />
                                            </div>
                                        </div>
                                        <p className="text-4xl font-bold text-foreground tracking-tight">
                                            {data.attendance.filter((a: any) => a.checkIn && new Date(a.checkIn).toDateString() === new Date().toDateString()).length}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">de {data.employees.length} colaboradores</p>
                                    </div>
                                </Card>

                                <Card className="overflow-hidden border-none shadow-xl transition-all hover:scale-[1.02] bg-card/40 backdrop-blur-md">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                                    <div className="p-6 relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-xs font-semibold text-muted-foreground tracking-tight">Ausentes</p>
                                            <div className="p-2 bg-red-500/10 rounded-lg">
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            </div>
                                        </div>
                                        <p className="text-4xl font-bold text-foreground tracking-tight">
                                            {Math.max(0, data.employees.length - data.attendance.filter((a: any) => a.checkIn && new Date(a.checkIn).toDateString() === new Date().toDateString()).length)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">sin registro hoy</p>
                                    </div>
                                </Card>

                                <Card className="overflow-hidden border-none shadow-xl transition-all hover:scale-[1.02] bg-card/40 backdrop-blur-md">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                                    <div className="p-6 relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-xs font-semibold text-muted-foreground tracking-tight">Tardanzas</p>
                                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                                <Clock className="h-4 w-4 text-orange-500" />
                                            </div>
                                        </div>
                                        <p className="text-4xl font-bold text-foreground tracking-tight">
                                            {data.attendance.filter((a: any) => a.status === 'LATE').length}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">fuera de tolerancia</p>
                                    </div>
                                </Card>

                                <Card className="overflow-hidden border-none shadow-xl transition-all hover:scale-[1.02] bg-card/40 backdrop-blur-md">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-edicarex" />
                                    <div className="p-6 relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="text-xs font-semibold text-muted-foreground tracking-tight">Puntualidad</p>
                                            <div className="p-2 bg-edicarex/10 rounded-lg">
                                                <TrendingUp className="h-4 w-4 text-white" />
                                            </div>
                                        </div>
                                        <p className="text-4xl font-bold text-edicarex tracking-tight">
                                            {data.attendance.length > 0 ? Math.round(((data.attendance.filter((a: any) => a.status === 'ON_TIME' || a.status === 'PRESENT').length) / data.attendance.length) * 100) : 100}%
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">tasa del día</p>
                                    </div>
                                </Card>
                            </div>

                            {/* Section 2 & 3: Reloj + Actividad Reciente */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Reloj Central */}
                                <Card className="overflow-hidden border-none shadow-xl transition-all bg-card/40 backdrop-blur-md p-8 text-center relative">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-edicarex opacity-30" />
                                    <div className="p-3 bg-edicarex/10 rounded-xl w-fit mx-auto mb-4">
                                        <Clock className="h-8 w-8 text-white" />
                                    </div>
                                    <p className="text-5xl font-bold text-foreground tracking-tight font-mono">
                                        {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2 uppercase tracking-widest font-semibold">
                                        {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                    <div className="mt-8 pt-8 border-t border-border">
                                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4">Turnos Activos Hoy</p>
                                        <div className="flex justify-center gap-6">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-yellow-500">{data.shifts.filter((s: any) => s.type === 'MORNING').length}</p>
                                                <p className="text-[8px] uppercase text-muted-foreground font-bold">Mañana</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-orange-500">{data.shifts.filter((s: any) => s.type === 'AFTERNOON').length}</p>
                                                <p className="text-[8px] uppercase text-muted-foreground font-bold">Tarde</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-indigo-500">{data.shifts.filter((s: any) => s.type === 'NIGHT').length}</p>
                                                <p className="text-[8px] uppercase text-muted-foreground font-bold">Noche</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Actividad Reciente */}
                                <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl transition-all bg-card/40 backdrop-blur-md">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-edicarex opacity-70" />
                                    <CardHeader className="border-b border-border/50 p-6">
                                        <CardTitle className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-500/10 rounded-md">
                                                <Activity className="h-4 w-4 text-white" />
                                            </div>
                                            Actividad Reciente
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-border/50">
                                            {data.attendance.slice(-8).reverse().map((a: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="h-10 w-10 ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all">
                                                            <AvatarImage src={a.employee?.photo} />
                                                            <AvatarFallback className="bg-edicarex/10 text-edicarex text-xs font-bold">
                                                                {a.employee?.name?.charAt(0) || '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">{a.employee?.name || 'Colaborador'}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-medium">{a.employee?.role || 'Staff'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-1">
                                                        <p className="text-sm font-mono font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
                                                            {a.checkIn ? format(new Date(a.checkIn), 'HH:mm') : '--:--'}
                                                        </p>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[8px] font-bold px-2 shadow-sm border-none",
                                                            (a.status === 'ON_TIME' || a.status === 'PRESENT') ? 'bg-edicarex text-white' :
                                                                a.status === 'LATE' ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'
                                                        )}>
                                                            {a.status === 'ON_TIME' || a.status === 'PRESENT' ? 'A tiempo' : a.status === 'LATE' ? 'Tardanza' : a.status || 'Registro'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                            {data.attendance.length === 0 && (
                                                <div className="p-12 text-center">
                                                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                                                    <p className="text-sm text-muted-foreground font-medium">Sin registros hoy</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Section 4: Accesos Rápidos + Resumen Nómina */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Section 4: Accesos Rápidos + Resumen Nómina */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <Card className="overflow-hidden border-none shadow-xl transition-all hover:scale-[1.02] bg-card/40 backdrop-blur-md p-8 group cursor-pointer" onClick={() => setActiveTab('ops')}>
                                        <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-6 group-hover:bg-blue-500/20 transition-colors">
                                            <Clock className="h-8 w-8 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">Monitor de Marcaciones</h3>
                                        <p className="text-muted-foreground text-xs mb-6 leading-relaxed font-medium">Gestione entradas, salidas y correcciones manuales con trazabilidad total.</p>
                                        <div className="text-3xl font-bold text-foreground">{data.attendance.length} <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-2">Registros</span></div>
                                    </Card>
                                    <Card className="overflow-hidden border-none shadow-xl transition-all hover:scale-[1.02] bg-card/40 backdrop-blur-md p-8 group cursor-pointer" onClick={() => setActiveTab('shifts')}>
                                        <div className="p-3 bg-blue-500/10 rounded-xl w-fit mb-6 group-hover:bg-blue-500/20 transition-colors">
                                            <Calendar className="h-8 w-8 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">Planificador de Turnos</h3>
                                        <p className="text-muted-foreground text-xs mb-6 leading-relaxed font-medium">Asigne jornadas y controle la cobertura por áreas y días.</p>
                                        <div className="text-3xl font-bold text-foreground">{data.shifts.length} <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-2">Turnos</span></div>
                                    </Card>
                                    <Card className="overflow-hidden border-none shadow-xl transition-all hover:scale-[1.02] bg-card/40 backdrop-blur-md p-8 group cursor-pointer" onClick={() => setActiveTab('payroll')}>
                                        <div className="absolute top-0 left-0 w-full h-1 bg-edicarex opacity-30" />
                                        <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-6 group-hover:bg-emerald-500/20 transition-colors">
                                            <DollarSign className="h-8 w-8 text-emerald-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">Motor Financiero</h3>
                                        <p className="text-muted-foreground text-xs mb-6 leading-relaxed font-medium">Cálculo automatizado de haberes y emisión de boletas legales.</p>
                                        <div className="text-3xl font-bold text-edicarex">
                                            {formatCurrency((data.payroll || []).reduce((acc: number, p: any) => acc + (Number(p.netSalary) || 0), 0), config)}
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-2">Total</span>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* Section 5 & 6: Staff + Alertas */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Directorio Staff */}
                                <Card className="overflow-hidden border-none shadow-xl transition-all hover:scale-[1.01] bg-card/40 backdrop-blur-md p-8 group cursor-pointer" onClick={() => setActiveTab('staff')}>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                                                <Users className="h-8 w-8 text-purple-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-foreground tracking-tight">Directorio de Staff</h3>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Gestión Integral</p>
                                            </div>
                                        </div>
                                        <div className="text-4xl font-bold text-foreground">{data.employees.length}</div>
                                    </div>
                                    <div className="flex -space-x-3">
                                        {data.employees.slice(0, 10).map((e: any, i: number) => (
                                            <Avatar key={i} className="h-12 w-12 ring-4 ring-background group-hover:translate-y-[-4px] transition-transform duration-300">
                                                <AvatarImage src={e.photo} />
                                                <AvatarFallback className="bg-purple-500/20 text-purple-400 text-sm font-bold">{e.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        ))}
                                        {data.employees.length > 10 && (
                                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center ring-4 ring-background">
                                                <span className="text-xs font-bold text-muted-foreground">+{data.employees.length - 10}</span>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Alertas */}
                                <Card className="overflow-hidden border-none shadow-xl transition-all bg-card/40 backdrop-blur-md p-8">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-blue-500/10 rounded-xl">
                                            <ShieldCheck className="h-8 w-8 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">Alertas del Sistema</h3>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Estado Operativo</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {data.employees.length - data.attendance.filter((a: any) => a.checkIn && new Date(a.checkIn).toDateString() === new Date().toDateString()).length > 0 && (
                                            <div className="flex items-center gap-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 group hover:bg-orange-500/10 transition-colors">
                                                <div className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                                                <p className="text-sm text-orange-600 dark:text-orange-400 font-bold">
                                                    {Math.max(0, data.employees.length - data.attendance.filter((a: any) => a.checkIn && new Date(a.checkIn).toDateString() === new Date().toDateString()).length)} empleados sin marcar hoy
                                                </p>
                                            </div>
                                        )}
                                        {data.payroll.filter((p: any) => p.status === 'PENDING').length > 0 && (
                                            <div className="flex items-center gap-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 group hover:bg-blue-500/10 transition-colors">
                                                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                                                <p className="text-sm text-blue-600 dark:text-blue-400 font-bold">
                                                    {data.payroll.filter((p: any) => p.status === 'PENDING').length} boletas por procesar
                                                </p>
                                            </div>
                                        )}
                                        {data.employees.length > 0 && data.payroll.filter((p: any) => p.status === 'PENDING').length === 0 && (
                                            <div className="flex items-center gap-4 bg-edicarex/5 border border-edicarex/20 rounded-2xl p-4 group">
                                                <div className="h-2.5 w-2.5 rounded-full bg-edicarex shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                                                <p className="text-sm text-blue-600 dark:text-cyan-400 font-bold">Operaciones en orden</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeTab === 'shifts' && (
                        <div className="space-y-6">
                            {/* Métricas de Turnos */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <Card className="bg-yellow-500/10 border-yellow-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-yellow-400 tracking-widest mb-1">Mañana</p>
                                    <p className="text-3xl font-black text-yellow-400">{data.shifts.filter((s: any) => s.type === 'MORNING').length}</p>
                                </Card>
                                <Card className="bg-orange-500/10 border-orange-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-orange-400 tracking-widest mb-1">Tarde</p>
                                    <p className="text-3xl font-black text-orange-400">{data.shifts.filter((s: any) => s.type === 'AFTERNOON').length}</p>
                                </Card>
                                <Card className="bg-indigo-500/10 border-indigo-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-indigo-400 tracking-widest mb-1">Noche</p>
                                    <p className="text-3xl font-black text-indigo-400">{data.shifts.filter((s: any) => s.type === 'NIGHT').length}</p>
                                </Card>
                                <Card className="bg-blue-500/10 border-blue-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-blue-400 tracking-widest mb-1">Total</p>
                                    <p className="text-3xl font-black text-white">{data.shifts.length}</p>
                                </Card>
                                <Card className="bg-purple-500/10 border-purple-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-purple-400 tracking-widest mb-1">Empleados</p>
                                    <p className="text-3xl font-black text-purple-400">{new Set(data.shifts.map((s: any) => s.employeeId)).size}</p>
                                </Card>
                            </div>

                            {/* Calendario Semanal */}
                            {data.shifts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                                    {['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map((day) => {
                                        const dayShifts = data.shifts.filter((s: any) => s.dayName === day)
                                        return (
                                            <div key={day} className="space-y-3">
                                                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{day}</p>
                                                    <p className="text-[10px] text-slate-600">{dayShifts.length} turnos</p>
                                                </div>
                                                <div className="space-y-2 min-h-[100px]">
                                                    {dayShifts.map((shift: any) => (
                                                        <div key={shift.id} className={`group relative p-3 rounded-xl border transition-all shadow-sm ${shift.type === 'MORNING' ? 'bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/50' :
                                                            shift.type === 'AFTERNOON' ? 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/50' :
                                                                'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/50'
                                                            }`}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Avatar className="h-7 w-7 ring-2 ring-white/10">
                                                                    <AvatarImage src={shift.employee?.photo} />
                                                                    <AvatarFallback className="text-[8px] font-black bg-white/10">{shift.employee?.name?.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] font-bold text-white truncate">{shift.employee?.name}</p>
                                                                    <p className={`text-[8px] font-bold uppercase ${shift.type === 'MORNING' ? 'text-yellow-400' :
                                                                        shift.type === 'AFTERNOON' ? 'text-orange-400' : 'text-indigo-400'
                                                                        }`}>{shift.type === 'MORNING' ? 'Mañana' : shift.type === 'AFTERNOON' ? 'Tarde' : 'Noche'}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                                                <Clock className="h-3 w-3" /> {shift.startTime} - {shift.endTime}
                                                            </p>

                                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" className="h-5 w-5 p-0 rounded-full hover:bg-white/10 text-white">
                                                                            <MoreHorizontal className="h-3 w-3" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-36 bg-zinc-900 border-white/10 text-white">
                                                                        <DropdownMenuItem onClick={() => handleEditShift(shift)} className="gap-2 text-xs focus:bg-white/5">
                                                                            <Pencil className="h-3 w-3 text-blue-500" /> Editar
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleCopyShift(shift)} className="gap-2 text-xs focus:bg-white/5">
                                                                            <Copy className="h-3 w-3 text-blue-500" /> Duplicar
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                                        <DropdownMenuItem onClick={() => handleDeleteShift(shift.id)} className="gap-2 text-xs text-red-500 focus:bg-red-500/10">
                                                                            <Trash2 className="h-3 w-3" /> Eliminar
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {dayShifts.length === 0 && (
                                                        <div className="flex items-center justify-center h-20 bg-white/5 rounded-xl border border-dashed border-white/10">
                                                            <p className="text-[10px] text-slate-600">Sin turnos</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <Card className="bg-white/5 border-white/10 rounded-3xl p-12 text-center">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                                    <h3 className="text-xl font-bold text-white mb-2">No hay turnos programados</h3>
                                    <p className="text-slate-500 mb-6">Usa el botón "Nuevo Turno" para empezar a asignar horarios</p>
                                    <Button
                                        onClick={() => { resetShiftForm(); setIsShiftModalOpen(true); }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Crear Primer Turno
                                    </Button>
                                </Card>
                            )}
                        </div>
                    )}

                    {activeTab === 'ops' && (
                        <div className="space-y-6">
                            {/* Métricas Rápidas de Marcaciones */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <Card className="bg-blue-500/10 border-blue-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-blue-400 tracking-widest mb-1">Total Registros</p>
                                    <p className="text-3xl font-black text-white">{data.attendance.length}</p>
                                </Card>
                                <Card className="bg-emerald-500/10 border-emerald-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-emerald-400 tracking-widest mb-1">A Tiempo</p>
                                    <p className="text-3xl font-black text-emerald-400">{data.attendance.filter((a: any) => a.status === 'ON_TIME' || a.status === 'PRESENT').length}</p>
                                </Card>
                                <Card className="bg-orange-500/10 border-orange-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-orange-400 tracking-widest mb-1">Tardanzas</p>
                                    <p className="text-3xl font-black text-orange-400">{data.attendance.filter((a: any) => a.status === 'LATE').length}</p>
                                </Card>
                                <Card className="bg-purple-500/10 border-purple-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-purple-400 tracking-widest mb-1">Con Salida</p>
                                    <p className="text-3xl font-black text-purple-400">{data.attendance.filter((a: any) => a.checkOut).length}</p>
                                </Card>
                                <Card className="bg-white/5 border-white/10 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">Hoy</p>
                                    <p className="text-3xl font-black text-white">
                                        {data.attendance.filter((a: any) => new Date(a.checkIn).toDateString() === new Date().toDateString()).length}
                                    </p>
                                </Card>
                            </div>

                            {/* Tabla de Marcaciones */}
                            <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                <CardHeader className="bg-white/5 border-b border-white/10 p-6">
                                    <div className="flex justify-between items-center text-white">
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter">Registro de Marcaciones</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Datos capturados desde la pantalla pública</p>
                                        </div>
                                        <div className="relative w-72">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                placeholder="Buscar colaborador..."
                                                className="pl-12 h-11 text-sm rounded-xl border-white/10 bg-black/40 text-white"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-white/5">
                                            <TableRow className="hover:bg-transparent border-white/10 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <TableHead className="px-6 py-4">Colaborador</TableHead>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Entrada</TableHead>
                                                <TableHead>Salida</TableHead>
                                                <TableHead>Horas</TableHead>
                                                <TableHead>Estado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.attendance
                                                .filter((a: any) => !searchTerm || a.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map((a: any) => (
                                                    <TableRow key={a.id} className="hover:bg-white/5 transition-colors border-white/5 text-slate-300">
                                                        <TableCell className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-9 w-9 ring-1 ring-white/10">
                                                                    <AvatarImage src={a.employee?.photo} />
                                                                    <AvatarFallback className="bg-blue-500/10 text-blue-400 text-xs font-black">{a.employee?.name?.charAt(0) || '?'}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="text-sm font-bold text-white">{a.employee?.name || 'Desconocido'}</p>
                                                                    <p className="text-[10px] text-slate-500">{a.employee?.role || 'Staff'}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm font-medium">{format(new Date(a.checkIn), 'dd MMM yyyy', { locale: es })}</TableCell>
                                                        <TableCell className="text-sm font-mono font-bold text-blue-400">{format(new Date(a.checkIn), 'HH:mm')}</TableCell>
                                                        <TableCell className="text-sm font-mono font-bold text-emerald-400">
                                                            {a.checkOut ? format(new Date(a.checkOut), 'HH:mm') : '---'}
                                                        </TableCell>
                                                        <TableCell className="text-sm font-bold text-white">{Number(a.hoursWorked || 0).toFixed(1)}h</TableCell>
                                                        <TableCell>
                                                            <Badge className={`text-[9px] font-bold uppercase ${a.status === 'ON_TIME' || a.status === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                a.status === 'LATE' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-500/20 text-slate-400'
                                                                }`}>
                                                                {a.status === 'ON_TIME' || a.status === 'PRESENT' ? 'A tiempo' : a.status === 'LATE' ? 'Tardanza' : a.status || 'Registro'}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            {data.attendance.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-32 text-center">
                                                        <div className="flex flex-col items-center gap-2 text-slate-500">
                                                            <Clock className="h-8 w-8 opacity-30" />
                                                            <p className="text-sm">No hay marcaciones registradas</p>
                                                            <p className="text-xs">Los registros aparecerán cuando los empleados marquen en la pantalla pública</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'payroll' && (
                        <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            <CardHeader className="bg-white/5 border-b border-white/10 p-8">
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Nómina Operativa <span className="text-emerald-500">EdiCarex</span></h3>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Cálculo de boletas basado en marcaciones auditadas</p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="hover:bg-transparent border-white/10 text-[10px] font-black uppercase text-slate-400">
                                            <TableHead className="px-8 py-5">Colaborador</TableHead>
                                            <TableHead>Ingreso Bruto</TableHead>
                                            <TableHead>Descuentos</TableHead>
                                            <TableHead>Bonos</TableHead>
                                            <TableHead>Neto Final</TableHead>
                                            <TableHead>Estatus Financiero</TableHead>
                                            <TableHead className="text-right px-8">Boleta</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.payroll.map((p: any) => (
                                            <TableRow key={p.id} className="hover:bg-emerald-500/5 transition-colors border-white/5 text-slate-300">
                                                <TableCell className="px-8 py-5 text-[10px] font-black uppercase text-white">{p.employee?.name}</TableCell>
                                                <TableCell className="text-[10px] font-bold">S/ {Number(p.baseSalary).toLocaleString()}</TableCell>
                                                <TableCell className="text-[10px] font-bold text-red-500">S/ {Number(p.deductions).toLocaleString()}</TableCell>
                                                <TableCell className="text-[10px] font-bold text-emerald-500">S/ {Number(p.bonuses).toLocaleString()}</TableCell>
                                                <TableCell className="text-base font-black tracking-tighter text-white">S/ {Number(p.netSalary).toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge className={`text-[8px] font-black uppercase ${p.status === 'PAID' ? 'bg-emerald-600' : 'bg-orange-600'} text-white border-none`}>
                                                        {p.status === 'PAID' ? 'TRANSFERIDO' : 'POR PROCESAR'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right px-8 flex gap-2 justify-end">
                                                    <Button onClick={() => handleViewPaystub(p)} variant="outline" size="sm" className="h-9 px-4 text-[9px] font-black uppercase rounded-lg border-white/10 bg-white/5 hover:bg-white/10 text-white">
                                                        PDF <Eye className="h-3 w-3 ml-2" />
                                                    </Button>
                                                    {p.status !== 'PAID' && (
                                                        <Button onClick={() => handlePayPayroll(p.id)} size="sm" className="h-9 px-4 text-[9px] font-black uppercase rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20">
                                                            Pagar
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {data.payroll.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-40 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-slate-500">
                                                        <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
                                                            <DollarSign className="h-6 w-6 opacity-30" />
                                                        </div>
                                                        <p className="text-sm font-medium">No hay registros de nómina esta semana</p>
                                                        <p className="text-[10px] uppercase tracking-widest opacity-50">Las boletas aparecerán tras el corte</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'staff' && (
                        <div className="space-y-6">

                            {/* Métricas de Personal */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <Card className="bg-purple-500/10 border-purple-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-purple-400 tracking-widest mb-1">Total Empleados</p>
                                    <p className="text-3xl font-black text-white">{data.employees.length}</p>
                                </Card>
                                <Card className="bg-emerald-500/10 border-emerald-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-emerald-400 tracking-widest mb-1">Activos</p>
                                    <p className="text-3xl font-black text-emerald-400">{data.employees.filter((e: any) => e.status === 'ACTIVE').length}</p>
                                </Card>
                                <Card className="bg-blue-500/10 border-blue-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-blue-400 tracking-widest mb-1">Planilla Total</p>
                                    <p className="text-xl font-black text-blue-400">S/ {data.employees.reduce((acc: number, e: any) => acc + Number(e.salary || 0), 0).toLocaleString()}</p>
                                </Card>
                                <Card className="bg-orange-500/10 border-orange-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-orange-400 tracking-widest mb-1">Vacaciones</p>
                                    <p className="text-3xl font-black text-orange-400">{data.employees.filter((e: any) => e.status === 'VACATION').length}</p>
                                </Card>
                                <Card className="bg-red-500/10 border-red-500/20 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold uppercase text-red-400 tracking-widest mb-1">Inactivos</p>
                                    <p className="text-3xl font-black text-red-400">{data.employees.filter((e: any) => e.status === 'INACTIVE' || !e.isActive).length}</p>
                                </Card>
                            </div>

                            {/* Tabla de Personal */}
                            <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                <CardHeader className="bg-white/5 border-b border-white/10 p-6">
                                    <div className="flex justify-between items-center text-white">
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter">Directorio de Colaboradores</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Administración de perfiles laborales</p>
                                        </div>
                                        <div className="relative w-72">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                placeholder="Buscar colaborador..."
                                                className="pl-12 h-11 text-sm rounded-xl border-white/10 bg-black/40 text-white"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-white/5">
                                            <TableRow className="hover:bg-transparent border-white/10 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                <TableHead className="px-6 py-4">Colaborador</TableHead>
                                                <TableHead>Cargo / Área</TableHead>
                                                <TableHead>DNI</TableHead>
                                                <TableHead>Teléfono</TableHead>
                                                <TableHead>Salario</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead className="text-right px-6">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.employees
                                                .filter((e: any) => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map((e: any) => (
                                                    <TableRow key={e.id} className="hover:bg-purple-500/5 transition-colors border-white/5 text-slate-300">
                                                        <TableCell className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-10 w-10 ring-2 ring-purple-500/10">
                                                                    <AvatarImage src={e.photo} />
                                                                    <AvatarFallback className="bg-purple-500/10 text-purple-400 text-xs font-black">{e.name.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="text-sm font-bold text-white">{e.name}</p>
                                                                    <p className="text-[10px] text-slate-500">{e.email}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <p className="text-sm font-bold text-white">{e.role}</p>
                                                            <p className="text-[10px] text-slate-500">{e.area || e.department}</p>
                                                        </TableCell>
                                                        <TableCell className="text-sm font-mono">{e.documentId || '---'}</TableCell>
                                                        <TableCell className="text-sm">{e.phone || '---'}</TableCell>
                                                        <TableCell className="text-sm font-bold text-emerald-400">S/ {Number(e.salary || 0).toLocaleString()}</TableCell>
                                                        <TableCell>
                                                            <Badge className={`text-[9px] font-bold uppercase ${e.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                e.status === 'VACATION' ? 'bg-orange-500/20 text-orange-400' :
                                                                    'bg-red-500/20 text-red-400'
                                                                }`}>
                                                                {e.status === 'ACTIVE' ? 'Activo' : e.status === 'VACATION' ? 'Vacaciones' : 'Inactivo'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right px-6">
                                                            <div className="flex justify-end gap-1">
                                                                <Button onClick={() => handleViewProfile(e)} variant="ghost" className="h-8 w-8 p-0 hover:bg-blue-500/10 text-blue-400">
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button onClick={() => handleEditEmployee(e)} variant="ghost" className="h-8 w-8 p-0 hover:bg-purple-500/10 text-white">
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button onClick={() => handleDeleteEmployee(e.id)} variant="ghost" className="h-8 w-8 p-0 hover:bg-red-500/10 text-red-500">
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            {data.employees.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-32 text-center">
                                                        <div className="flex flex-col items-center gap-2 text-slate-500">
                                                            <Users className="h-8 w-8 opacity-30" />
                                                            <p className="text-sm">No hay colaboradores registrados</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'rules' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="bg-white/5 border-white/10 rounded-3xl p-8">
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-white" /> Parámetros de Tiempo
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Tolerancia de Ingreso</Label>
                                        {isEditingRules ? (
                                            <Input
                                                className="w-32 h-8 text-right bg-black/40 border-white/10 text-white font-bold text-xs"
                                                value={rulesForm.TOLERANCE_MINUTES || ''}
                                                onChange={(e) => setRulesForm({ ...rulesForm, TOLERANCE_MINUTES: e.target.value })}
                                            />
                                        ) : (
                                            <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 font-black">
                                                {data.configs.find((c: any) => c.key === 'TOLERANCE_MINUTES')?.value || '15'} MINUTOS
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Límite Salida Anticipada</Label>
                                        {isEditingRules ? (
                                            <Input
                                                className="w-32 h-8 text-right bg-black/40 border-white/10 text-white font-bold text-xs"
                                                value={rulesForm.EARLY_EXIT_LIMIT || ''}
                                                onChange={(e) => setRulesForm({ ...rulesForm, EARLY_EXIT_LIMIT: e.target.value })}
                                            />
                                        ) : (
                                            <Badge className="bg-orange-600/20 text-orange-400 border-orange-500/30 font-black">
                                                {data.configs.find((c: any) => c.key === 'EARLY_EXIT_LIMIT')?.value || '5'} MINUTOS
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Descanso de Refrigerio</Label>
                                        {isEditingRules ? (
                                            <Input
                                                className="w-32 h-8 text-right bg-black/40 border-white/10 text-white font-bold text-xs"
                                                value={rulesForm.BREAK_DURATION || ''}
                                                onChange={(e) => setRulesForm({ ...rulesForm, BREAK_DURATION: e.target.value })}
                                            />
                                        ) : (
                                            <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 font-black">
                                                {data.configs.find((c: any) => c.key === 'BREAK_DURATION')?.value || '45'} MINUTOS
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-white/5 border-white/10 rounded-3xl p-8">
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-emerald-500" /> Reglas Financieras
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Costo Minuto Tardanza</Label>
                                        {isEditingRules ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-black text-xs">S/</span>
                                                <Input
                                                    className="w-24 h-8 text-right bg-black/40 border-white/10 text-white font-bold text-xs"
                                                    value={rulesForm.LATE_PENALTY_PER_MINUTE || ''}
                                                    onChange={(e) => setRulesForm({ ...rulesForm, LATE_PENALTY_PER_MINUTE: e.target.value })}
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-white font-black">S/ {data.configs.find((c: any) => c.key === 'LATE_PENALTY_PER_MINUTE')?.value || '0.50'}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Bono por Puntualidad Perfecta</Label>
                                        {isEditingRules ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-500 font-black text-xs">S/</span>
                                                <Input
                                                    className="w-24 h-8 text-right bg-black/40 border-white/10 text-emerald-500 font-bold text-xs"
                                                    value={rulesForm.PERFECT_ATTENDANCE_BONUS || ''}
                                                    onChange={(e) => setRulesForm({ ...rulesForm, PERFECT_ATTENDANCE_BONUS: e.target.value })}
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-emerald-500 font-black">S/ {data.configs.find((c: any) => c.key === 'PERFECT_ATTENDANCE_BONUS')?.value || '200.00'}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Deducción Falta Injustificada</Label>
                                        {isEditingRules ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-red-500 font-black text-xs">x </span>
                                                <Input
                                                    className="w-24 h-8 text-right bg-black/40 border-white/10 text-red-500 font-bold text-xs"
                                                    value={rulesForm.ABSENCE_PENALTY_MULTIPLIER || ''}
                                                    onChange={(e) => setRulesForm({ ...rulesForm, ABSENCE_PENALTY_MULTIPLIER: e.target.value })}
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-red-500 font-black">PRO-RATA x {data.configs.find((c: any) => c.key === 'ABSENCE_PENALTY_MULTIPLIER')?.value || '1.5'}</span>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <Card className="bg-white/5 border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                            <CardHeader className="p-8 border-b border-white/5">
                                <CardTitle className="text-xl font-black text-white uppercase italic tracking-tighter">Pistas de Auditoría Transaccional</CardTitle>
                            </CardHeader>
                            <Table>
                                <TableHeader className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                    <TableRow className="border-white/5">
                                        <TableHead className="px-8">ID Acción</TableHead>
                                        <TableHead>Módulo</TableHead>
                                        <TableHead>Descripción del Cambio</TableHead>
                                        <TableHead>Usuario Admin</TableHead>
                                        <TableHead className="text-right px-8">timestamp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.auditLogs.map((log: any) => (
                                        <TableRow key={log.id} className="hover:bg-white/5 border-white/5 text-slate-400">
                                            <TableCell className="px-8 text-[10px] font-mono font-bold text-blue-500">
                                                {log.id.split('-')[0].toUpperCase()}
                                            </TableCell>
                                            <TableCell className="text-[10px] font-black uppercase">
                                                <Badge className="bg-white/5 border-white/10 text-[9px] text-slate-400">
                                                    {log.resource}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-[11px] font-bold text-white">
                                                {log.action}
                                            </TableCell>
                                            <TableCell className="text-[10px] font-bold uppercase italic space-x-1">
                                                <span className="text-blue-400">{log.user?.firstName} {log.user?.lastName}</span>
                                                <span className="text-slate-600">({log.user?.role?.name})</span>
                                            </TableCell>
                                            <TableCell className="text-right px-8 text-[10px] font-mono">
                                                {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {data.auditLogs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-slate-500 font-bold italic uppercase tracking-widest text-[10px]">
                                                No se registran acciones de auditoría recientemente
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                <CardHeader className="p-8 border-b border-white/5">
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Configuración de la <span className="text-blue-500">Organización</span></h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Datos principales para la emisión de documentos y reportes</p>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                                <Building className="h-3 w-3" /> Nombre de la Empresa
                                            </Label>
                                            <Input
                                                className="bg-black/40 border-white/10 h-12 rounded-xl text-white font-bold"
                                                value={orgForm.name || ''}
                                                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                                <FileText className="h-3 w-3" /> RUC / Identificación Fiscal
                                            </Label>
                                            <Input
                                                className="bg-black/40 border-white/10 h-12 rounded-xl text-white font-bold"
                                                value={orgForm.ruc || ''}
                                                onChange={(e) => setOrgForm({ ...orgForm, ruc: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                                <Mail className="h-3 w-3" /> Email Corporativo
                                            </Label>
                                            <Input
                                                className="bg-black/40 border-white/10 h-12 rounded-xl text-white font-bold"
                                                value={orgForm.email || ''}
                                                onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                                <Phone className="h-3 w-3" /> Teléfono
                                            </Label>
                                            <Input
                                                className="bg-black/40 border-white/10 h-12 rounded-xl text-white font-bold"
                                                value={orgForm.phone || ''}
                                                onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                                <MapPin className="h-3 w-3" /> Dirección Fiscal
                                            </Label>
                                            <Input
                                                className="bg-black/40 border-white/10 h-12 rounded-xl text-white font-bold"
                                                value={orgForm.address || ''}
                                                onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-white/5 flex justify-end">
                                        <Button
                                            onClick={handleSaveOrganization}
                                            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic tracking-tighter rounded-xl shadow-lg shadow-blue-500/20"
                                        >
                                            Guardar Configuración
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-white/5 border-white/10 rounded-3xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        <h4 className="font-bold text-white uppercase tracking-tighter">Seguridad y Backups</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-6">Realice copias de seguridad periódicas de toda la información de asistencia y personal.</p>
                                    <Button variant="outline" className="w-full h-11 border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold uppercase tracking-widest">
                                        Gestionar Backups
                                    </Button>
                                </Card>
                                <Card className="bg-white/5 border-white/10 rounded-3xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
                                            <LayoutDashboard className="h-6 w-6" />
                                        </div>
                                        <h4 className="font-bold text-white uppercase tracking-tighter">Personalización</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-6">Actualice el logo y los colores corporativos para el portal de marcaciones y reportes.</p>
                                    <Button variant="outline" className="w-full h-11 border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold uppercase tracking-widest">
                                        Subir Logo
                                    </Button>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* MODALS REUSED FROM PREVIOUS LOGIC (OMITTED FOR BREVITY BUT KEPT IN PRODUCTION CODE) */}
            {/* [IS SHIFT MODAL - SAME AS BEFORE BUT WITH DARK THEME OVERRIDES] */}
            {/* [IS PAYSTUB MODAL - SAME AS BEFORE BUT WITH DARK THEME OVERRIDES] */}
            <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
                <DialogContent className="sm:max-w-[450px] bg-[#0c0c0e] border-white/10 p-8 rounded-3xl shadow-3xl text-white">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic text-white leading-none">
                            {isEditingShift ? 'Editar' : 'Programar'} <span className="text-blue-500">Turno</span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Colaborador</Label>
                            <Select value={shiftForm.employeeId} onValueChange={(v) => setShiftForm({ ...shiftForm, employeeId: v })}>
                                <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl text-xs font-bold text-white uppercase px-4">
                                    <SelectValue placeholder="SELECCIONE..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    {data.employees.map((e: any) => (
                                        <SelectItem key={e.id} value={String(e.id)} className="text-[10px] font-bold uppercase focus:bg-white/10">{e.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="date" value={shiftForm.date} onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold" />
                            <Select value={shiftForm.type} onValueChange={(v) => setShiftForm({ ...shiftForm, type: v })}>
                                <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl text-[10px] font-black uppercase px-4"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10">
                                    <SelectItem value="MORNING" className="text-[10px] font-black uppercase">☀️ Mañana</SelectItem>
                                    <SelectItem value="AFTERNOON" className="text-[10px] font-black uppercase">⛅ Tarde</SelectItem>
                                    <SelectItem value="NIGHT" className="text-[10px] font-black uppercase">🌙 Noche</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="time" value={shiftForm.startTime} onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold" />
                            <Input type="time" value={shiftForm.endTime} onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold" />
                        </div>
                    </div>
                    <DialogFooter className="mt-8 flex gap-3">
                        <Button variant="ghost" onClick={() => setIsShiftModalOpen(false)} className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5">Cerrar</Button>
                        <Button onClick={handleSaveShift} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-10 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20">Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Visor de Detalles "Senior Profile Viewer" (Executive Read-Only) */}
            <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
                <DialogContent className="sm:max-w-[950px] p-0 overflow-hidden bg-[#0c0c0e] border-white/10 shadow-3xl rounded-[2.5rem] text-white">
                    <div className="grid grid-cols-1 md:grid-cols-12 max-h-[90vh]">
                        {/* Sidebar Estratégico */}
                        <div className="md:col-span-4 bg-white/5 p-10 flex flex-col items-center border-r border-white/5 relative bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.1),transparent)]">
                            <div className="relative mb-8 pt-6">
                                <div className="h-44 w-44 rounded-[3rem] overflow-hidden border-4 border-indigo-500/30 shadow-2xl relative p-1 bg-gradient-to-tr from-indigo-500/20 to-transparent">
                                    <div className="h-full w-full rounded-[2.8rem] overflow-hidden bg-zinc-900 border border-white/10">
                                        <Avatar className="h-full w-full rounded-none">
                                            <AvatarImage src={selectedEmployee?.photo} className="object-cover" />
                                            <AvatarFallback className="text-5xl font-black bg-indigo-500 text-white">
                                                {selectedEmployee?.name?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    <Badge className="bg-emerald-500 text-white font-black px-4 py-1.5 rounded-full border-4 border-[#0c0c0e] text-[9px] uppercase tracking-widest shadow-xl">
                                        VERIFICADO
                                    </Badge>
                                </div>
                            </div>

                            <div className="text-center space-y-2 mb-10">
                                <h2 className="text-3xl font-black tracking-tighter uppercase italic text-white leading-tight">
                                    {selectedEmployee?.name?.split(' ')[0]} <span className="text-indigo-500">{selectedEmployee?.name?.split(' ')[1]}</span>
                                </h2>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 font-mono">
                                        ID-OPS #88{selectedEmployee?.documentId?.slice(-4)}
                                    </p>
                                </div>
                            </div>

                            {/* Acciones Rápidas Unificadas */}
                            <div className="w-full space-y-3">
                                <Button
                                    onClick={() => { setIsProfileModalOpen(false); handleEditEmployee(selectedEmployee); }}
                                    className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 group"
                                >
                                    <Pencil className="mr-3 h-5 w-5 text-indigo-500 group-hover:animate-bounce" /> Editar Perfil Completo
                                </Button>
                                <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 active:scale-95 group">
                                    <Download className="mr-3 h-5 w-5 group-hover:translate-y-1 transition-transform" /> Descargar Ficha Técnica
                                </Button>
                            </div>
                        </div>

                        {/* Panel de Datos "Executive View" */}
                        <div className="md:col-span-8 p-12 overflow-y-auto custom-scrollbar bg-gradient-to-br from-transparent to-indigo-500/[0.02]">
                            <div className="space-y-12">
                                {/* Fila 1: KPIs Personales (Mocked/Calculated base) */}
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-1 flex flex-col items-center">
                                        <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center mb-3">
                                            <span className="text-xs font-black text-emerald-500">98%</span>
                                        </div>
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Puntualidad</p>
                                        <p className="text-xl font-black text-white italic tracking-tighter">EFICIENTE</p>
                                    </div>
                                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-1 flex flex-col items-center">
                                        <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-3">
                                            <XCircle className="h-6 w-6 text-orange-500" />
                                        </div>
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Ausencias</p>
                                        <p className="text-xl font-black text-white italic tracking-tighter">02 DÍAS</p>
                                    </div>
                                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-1 flex flex-col items-center">
                                        <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
                                            <TrendingUp className="h-6 w-6 text-indigo-500" />
                                        </div>
                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Horas Extra</p>
                                        <p className="text-xl font-black text-white italic tracking-tighter">+12.5 hrs</p>
                                    </div>
                                </div>

                                {/* Secciones de Datos */}
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-6 flex items-center gap-3">
                                                <span className="h-px w-8 bg-indigo-500" /> Identidad Admin
                                            </h3>
                                            <div className="space-y-5">
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">DNI Titular</p>
                                                    <p className="text-sm font-black tracking-widest text-white/90">{selectedEmployee?.documentId || '---'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Email Corporativo</p>
                                                    <p className="text-sm font-bold text-white/70 underline decoration-indigo-500/30">{selectedEmployee?.email || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Celular Contacto</p>
                                                    <p className="text-sm font-mono font-black text-white/90">{selectedEmployee?.phone || '---'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-6 flex items-center gap-3">
                                                <span className="h-px w-8 bg-emerald-500" /> Historial / Estructura
                                            </h3>
                                            <div className="space-y-5">
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Fecha Ingreso</p>
                                                    <p className="text-sm font-black text-white/90 uppercase">{selectedEmployee?.hireDate ? format(new Date(selectedEmployee.hireDate), 'MMMM yyyy', { locale: es }) : '---'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Tipo de Contrato</p>
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] px-3">ESTABLE / {selectedEmployee?.contract}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-6 flex items-center gap-3">
                                                <span className="h-px w-8 bg-blue-500" /> Percepción Mensual
                                            </h3>
                                            <div className="bg-white/5 p-8 rounded-3xl border border-white/5 space-y-6 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                                                <div className="space-y-1 relative">
                                                    <p className="text-[8px] font-black uppercase text-slate-600 tracking-widest">Sueldo Base Nominal</p>
                                                    <p className="text-4xl font-black text-white tracking-tighter">S/ {selectedEmployee?.baseSalary ? Number(selectedEmployee.baseSalary).toLocaleString() : '0'}</p>
                                                </div>
                                                <div className="space-y-4 pt-4 border-t border-white/5 relative">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-slate-500">CTA Bancaria</span>
                                                        <span className="text-[10px] font-mono font-black text-white">{selectedEmployee?.bankAccount?.slice(-6) ? '****' + selectedEmployee.bankAccount.slice(-6) : 'PENDIENTE'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-slate-500">Estado Pago</span>
                                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[8px]">AL DÍA</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl relative">
                                            <Info className="h-5 w-5 text-indigo-500 absolute top-4 right-4 opacity-50" />
                                            <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest mb-2">Observaciones Gerenciales</p>
                                            <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed">
                                                {selectedEmployee?.notes || "Perfil verificado por la dirección médica. No registra anomalías contractuales en el histórico de los últimos 12 meses."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isPaystubModalOpen} onOpenChange={setIsPaystubModalOpen}>
                <DialogContent className="sm:max-w-[750px] bg-white text-zinc-900 p-0 border-none rounded-2xl overflow-hidden shadow-4xl">
                    {selectedPaystub && (
                        <div className="p-12 space-y-10">
                            {/* Header Boleta (Light Theme for Printing) */}
                            <div className="flex justify-between items-start border-b-2 border-zinc-100 pb-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                                        <ShieldCheck className="h-10 w-10 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Boleta de <span className="text-blue-600">Pago</span></h2>
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">EdiCarex Operational Portal</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black uppercase tracking-widest">EdiCarex Enterprise S.A.C.</p>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">PERIODO: ENERO 2026</p>
                                </div>
                            </div>

                            {/* Detalle Empleado */}
                            <div className="grid grid-cols-2 gap-12 bg-zinc-50 p-8 rounded-2xl">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Colaborador</p>
                                        <p className="text-sm font-black uppercase">{selectedPaystub.employee?.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Nro Cuenta</p>
                                        <p className="text-xs font-mono font-bold tracking-tighter">{(selectedPaystub.employee as any)?.bankAccount || '193-************-91'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Cargo Operativo</p>
                                        <p className="text-sm font-black uppercase">{(selectedPaystub.employee as any)?.area || 'MÉDICO STAFF'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Audit ID</p>
                                        <p className="text-xs font-mono font-bold text-blue-600">MED-OPS-#{selectedPaystub.id.slice(-6)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla de Conceptos */}
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-20">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] border-b border-zinc-100 pb-2 flex justify-between">
                                            <span>Haberes / Ingresos</span>
                                            <span>Importe</span>
                                        </h4>
                                        <div className="flex justify-between text-[11px] font-bold uppercase text-zinc-500">
                                            <span>Sueldo Básico</span>
                                            <span className="text-zinc-900">S/ {Number(selectedPaystub.baseSalary).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold uppercase text-zinc-500">
                                            <span>Bonos Operativos</span>
                                            <span className="text-emerald-600">S/ {Number(selectedPaystub.bonuses).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] border-b border-zinc-100 pb-2 flex justify-between">
                                            <span>Deducciones</span>
                                            <span>Importe</span>
                                        </h4>
                                        <div className="flex justify-between text-[11px] font-bold uppercase text-zinc-500">
                                            <span>AFP / Pensiones</span>
                                            <span className="text-zinc-900">- S/ {(Number(selectedPaystub.baseSalary) * 0.13).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold uppercase text-zinc-500">
                                            <span>Tardanzas Rec.</span>
                                            <span className="text-red-500">- S/ {Number(selectedPaystub.deductions).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Neto Final */}
                            <div className="bg-zinc-900 text-white p-10 rounded-2xl flex justify-between items-center">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Total Neto Percibido</p>
                                    <p className="text-xs font-medium opacity-70 mt-1 italic italic">Transferencia exitosa vía BBVA/BCP</p>
                                </div>
                                <div className="text-5xl font-black tracking-tighter">S/ {Number(selectedPaystub.netSalary).toLocaleString()}</div>
                            </div>

                            <div className="flex justify-between pt-10 no-print">
                                <Button variant="ghost" onClick={() => setIsPaystubModalOpen(false)} className="text-[10px] font-black uppercase text-zinc-400">Cerrar</Button>
                                <Button onClick={() => window.print()} className="bg-blue-600 px-12 h-14 rounded-xl text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/30">
                                    <Printer className="h-5 w-5 mr-3" /> Imprimir Boleta
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isEmployeeModalOpen} onOpenChange={setIsEmployeeModalOpen}>
                <DialogContent className="sm:max-w-[600px] bg-[#0c0c0e] border-white/10 p-0 rounded-3xl overflow-hidden text-white shadow-3xl">
                    <DialogHeader className="p-8 bg-white/5 border-b border-white/5">
                        <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic">
                            {isEditingEmployee ? 'Editar' : 'Nuevo'} <span className="text-purple-500">Colaborador</span>
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-2">
                            Configuración Maestra del Perfil Profesional
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
                        {/* Datos Personales */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase text-purple-400 tracking-widest border-b border-white/10 pb-2">Datos Personales</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Nombre Completo *</Label>
                                    <Input value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white" placeholder="Juan Pérez" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">DNI / Documento *</Label>
                                    <Input value={employeeForm.documentId} onChange={(e) => setEmployeeForm({ ...employeeForm, documentId: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white font-mono" placeholder="77665544" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Fecha Nacimiento</Label>
                                    <Input type="date" value={employeeForm.birthDate} onChange={(e) => setEmployeeForm({ ...employeeForm, birthDate: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Género</Label>
                                    <Select value={employeeForm.gender} onValueChange={(v) => setEmployeeForm({ ...employeeForm, gender: v })}>
                                        <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-lg text-white">
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10">
                                            <SelectItem value="M">Masculino</SelectItem>
                                            <SelectItem value="F">Femenino</SelectItem>
                                            <SelectItem value="O">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Teléfono</Label>
                                    <Input value={employeeForm.phone} onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white" placeholder="987654321" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-slate-500">Dirección</Label>
                                <Input value={employeeForm.address} onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white" placeholder="Av. Principal 123" />
                            </div>
                        </div>

                        {/* Datos Laborales */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase text-blue-400 tracking-widest border-b border-white/10 pb-2">Datos Laborales</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Email Corporativo *</Label>
                                    <Input type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white" placeholder="juan@empresa.com" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Cargo / Rol *</Label>
                                    <Input value={employeeForm.role} onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white" placeholder="Médico Staff" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Área</Label>
                                    <Input value={employeeForm.area} onChange={(e) => setEmployeeForm({ ...employeeForm, area: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white" placeholder="Cardiología" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Departamento</Label>
                                    <Input value={employeeForm.department} onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white" placeholder="Medicina" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Fecha Ingreso *</Label>
                                    <Input type="date" value={employeeForm.hireDate} onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Tipo Contrato</Label>
                                    <Select value={employeeForm.contract} onValueChange={(v) => setEmployeeForm({ ...employeeForm, contract: v })}>
                                        <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-lg text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10">
                                            <SelectItem value="Tiempo Completo">Tiempo Completo</SelectItem>
                                            <SelectItem value="Medio Tiempo">Medio Tiempo</SelectItem>
                                            <SelectItem value="Por Horas">Por Horas</SelectItem>
                                            <SelectItem value="Contrato">Contrato</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Estado</Label>
                                    <Select value={employeeForm.status} onValueChange={(v) => setEmployeeForm({ ...employeeForm, status: v })}>
                                        <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-lg text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10">
                                            <SelectItem value="ACTIVE" className="text-emerald-400">Activo</SelectItem>
                                            <SelectItem value="VACATION" className="text-orange-400">Vacaciones</SelectItem>
                                            <SelectItem value="SICK" className="text-yellow-400">Licencia</SelectItem>
                                            <SelectItem value="INACTIVE" className="text-red-400">Inactivo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Datos Financieros */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-widest border-b border-white/10 pb-2">Datos Financieros</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Salario Base (S/) *</Label>
                                    <Input type="number" value={employeeForm.salary} onChange={(e) => setEmployeeForm({ ...employeeForm, salary: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-emerald-400 font-bold" placeholder="2500" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Bono Fijo (S/)</Label>
                                    <Input type="number" value={employeeForm.bonus} onChange={(e) => setEmployeeForm({ ...employeeForm, bonus: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white" placeholder="0" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Cuenta Bancaria</Label>
                                    <Input value={employeeForm.bankAccount} onChange={(e) => setEmployeeForm({ ...employeeForm, bankAccount: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white font-mono" placeholder="193-XXXX-XXXX-91" />
                                </div>
                            </div>
                        </div>

                        {/* Contacto de Emergencia */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase text-red-400 tracking-widest border-b border-white/10 pb-2">Contacto de Emergencia</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Nombre Contacto</Label>
                                    <Input value={employeeForm.emergencyContact} onChange={(e) => setEmployeeForm({ ...employeeForm, emergencyContact: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white" placeholder="María Pérez" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-500">Teléfono Emergencia</Label>
                                    <Input value={employeeForm.emergencyPhone} onChange={(e) => setEmployeeForm({ ...employeeForm, emergencyPhone: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white" placeholder="999888777" />
                                </div>
                            </div>
                        </div>

                        {/* Notas */}
                        <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-slate-500">Notas Adicionales</Label>
                            <Input value={employeeForm.notes} onChange={(e) => setEmployeeForm({ ...employeeForm, notes: e.target.value })} className="h-10 bg-white/5 border-white/10 rounded-lg text-white" placeholder="Observaciones..." />
                        </div>
                    </div>
                    <DialogFooter className="p-8 bg-white/5 border-t border-white/5 flex gap-3">
                        <Button variant="ghost" onClick={() => setIsEmployeeModalOpen(false)} className="rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">Descartar</Button>
                        <Button onClick={handleSaveEmployee} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-10 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-600/20">Finalizar Perfil</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
