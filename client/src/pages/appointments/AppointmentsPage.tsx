import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Calendar as CalendarIcon, Plus, Search, Edit, Trash2, Eye, TableIcon, Filter, Download, CheckCircle, XCircle, Clock, TrendingUp, CalendarCheck, ShieldCheck, UserPlus, FileSearch } from 'lucide-react'
import { appointmentsAPI, patientsAPI, healthStaffAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import AppointmentModal from '@/components/modals/AppointmentModal'
import { format, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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
import HealthStaffCalendar from '@/components/calendar/HealthStaffCalendar'
import { usePermissions } from '@/hooks/usePermissions'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Skeleton } from '@/components/ui/skeleton'

export default function AppointmentsPage() {
    const navigate = useNavigate()
    const { hasPermission } = usePermissions()
    const { config } = useOrganization()
    const [searchTerm, setSearchTerm] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('calendar')
    const [showFilters, setShowFilters] = useState(false)
    const { toast } = useToast()

    // Filtros MINSA I-4
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        staffId: 'all',
        appointmentType: 'all',
        financiador: 'all',
        patientCondition: 'all',
        upss: 'all'
    })

    // Cargar Datos con useQuery
    const { data: appointmentsRes, isLoading: isLoadingApts, refetch: refetchApts } = useQuery({
        queryKey: ['appointments', filters],
        queryFn: () => appointmentsAPI.getAll(filters)
    })

    const { data: statsRes, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
        queryKey: ['appointments-dashboard-stats'],
        queryFn: () => appointmentsAPI.getDashboardStats()
    })

    const { data: patientsRes } = useQuery({
        queryKey: ['patients'],
        queryFn: () => patientsAPI.getAll().catch(() => ({ data: { data: [] } }))
    })

    const { data: staffRes } = useQuery({
        queryKey: ['staff'],
        queryFn: () => healthStaffAPI.getAll().catch(() => ({ data: { data: [] } }))
    })

    const appointments = appointmentsRes?.data?.data || []
    const dashboardStats = statsRes?.data
    const staff = staffRes?.data?.data || []

    const isLoading = isLoadingApts || isLoadingStats

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await appointmentsAPI.delete(deleteId)
            toast({
                title: 'Éxito',
                description: 'Cita eliminada correctamente',
            })
            refetchApts()
            refetchStats()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al eliminar cita',
                variant: 'destructive',
            })
        } finally {
            setDeleteId(null)
        }
    }

    const handleEdit = (appointment: any) => {
        setSelectedAppointment(appointment)
        setModalOpen(true)
    }

    const handleAdd = () => {
        setSelectedAppointment(null)
        setModalOpen(true)
    }

    const handleSuccess = () => {
        refetchApts()
        refetchStats()
        setModalOpen(false)
    }

    const handleViewDetails = (appointmentId: string) => {
        navigate(`/appointments/${appointmentId}`)
    }

    // Filtrar citas localmente (búsqueda)
    const filteredAppointments = useMemo(() => {
        if (!searchTerm) return appointments;
        return appointments.filter((apt: any) => {
            const searchStr = searchTerm.toLowerCase()
            return (
                apt.patient?.firstName?.toLowerCase().includes(searchStr) ||
                apt.patient?.lastName?.toLowerCase().includes(searchStr) ||
                apt.patient?.documentNumber?.includes(searchStr) ||
                (apt.staff?.user?.firstName || apt.doctor?.user?.firstName)?.toLowerCase().includes(searchStr) ||
                (apt.staff?.user?.lastName || apt.doctor?.user?.lastName)?.toLowerCase().includes(searchStr) ||
                apt.reason?.toLowerCase().includes(searchStr)
            )
        })
    }, [appointments, searchTerm])

    // Labels I-4 MINSA reales
    const getAppointmentTypeLabel = (type: string) => {
        const types: Record<string, string> = {
            'CONSULTA_MEDICINA_GENERAL': 'Medicina General',
            'CONSULTA_OBSTETRICIA': 'Obstetricia',
            'CONTROL_PRENATAL': 'Control Prenatal',
            'CONSULTA_ODONTOLOGIA': 'Odontología',
            'CONSULTA_PSICOLOGIA': 'Psicología',
            'CONSULTA_NUTRICION': 'Nutrición',
            'CONSULTA_ASISTENCIA_SOCIAL': 'Asistencia Social',
            'CONTROL_CRED': 'Control CRED',
            'VACUNACION': 'Vacunación',
            'LABORATORIO': 'Laboratorio',
            'TRIAJE': 'Triaje',
            'TELEMEDICINA': 'Telemedicina',
            'VISITA_DOMICILIARIA': 'Visita Domiciliaria'
        };
        return types[type] || type
    }

    const getFinanciadorLabel = (code: string) => {
        const labels: Record<string, string> = {
            '01': 'Pagante',
            '02': 'SIS',
            '03': 'EsSalud',
            '04': 'SOAT',
            '05': 'Sanidad FAP',
            '06': 'Sanidad Naval',
            '07': 'Sanidad EP',
            '08': 'Sanidad PNP',
            '09': 'Otros'
        }
        return labels[code] || code
    }

    const getUpssLabel = (upss: string) => {
        const labels: Record<string, string> = {
            'CONS_EXT': 'Consulta Externa',
            'CONSULTA_EXTERNA': 'Consulta Externa',
            'FARMACIA': 'Farmacia',
            'PAT_CLINICA': 'Patología Clínica',
            'PATOLOGIA_CLINICA': 'Patología Clínica',
            'INMUNIZACIONES': 'Inmunizaciones'
        }
        return labels[upss] || upss
    }

    // Exportar a Excel
    const exportToExcel = () => {
        const data = filteredAppointments.map((apt: any) => ({
            Paciente: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Desconocido',
            Personal: apt.staff ? `${apt.staff.user?.firstName} ${apt.staff.user?.lastName}` : 'Desconocido',
            Fecha: apt.appointmentDate ? format(new Date(apt.appointmentDate), 'dd/MM/yyyy HH:mm') : 'N/A',
            Estado: apt.status,
            UPSS: getUpssLabel(apt.upss),
            Tipo: getAppointmentTypeLabel(apt.type),
            Financiador: getFinanciadorLabel(apt.financiador),
            Condicion: apt.patientCondition || 'N/A'
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Citas')
        XLSX.writeFile(wb, `Citas_${config?.hospitalName || 'CS_Jorge_Chavez'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    }

    // Exportar a PDF
    const exportToPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4')
        const hospitalName = config?.hospitalName || 'Centro de Salud Jorge Chávez'
        const ipressCode = (config as any)?.ipressCode || '00003308'

        doc.setFontSize(14)
        doc.text(`Reporte de Citas - ${hospitalName}`, 14, 15)
        doc.setFontSize(10)
        doc.text(`IPRESS: ${ipressCode} | Ubicación: ${config?.address || 'Juliaca, Puno'}`, 14, 22)
        doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28)

        const tableData = filteredAppointments.map((apt: any) => [
            apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Desconocido',
            apt.staff ? `${apt.staff.user?.firstName} ${apt.staff.user?.lastName}` : 'Desconocido',
            apt.appointmentDate ? format(new Date(apt.appointmentDate), 'dd/MM/yyyy HH:mm') : 'N/A',
            getUpssLabel(apt.upss),
            getAppointmentTypeLabel(apt.type),
            getFinanciadorLabel(apt.financiador),
            apt.patientCondition || 'N/A',
            apt.status === 'COMPLETED' ? (apt.hisLinked ? 'REG. HIS' : 'PEND. HIS') : apt.status
        ])

        autoTable(doc, {
            startY: 34,
            head: [['Paciente', 'Personal', 'Fecha/Hora', 'UPSS', 'Atención', 'Financ.', 'Cond.', 'Estado']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [43, 108, 176] }
        })

        doc.save(`Reporte_Citas_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    }

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            SCHEDULED: 'bg-blue-100 text-blue-800',
            CONFIRMED: 'bg-green-100 text-green-800',
            COMPLETED: 'bg-gray-100 text-gray-800',
            CANCELLED: 'bg-red-100 text-red-800',
            NO_SHOW: 'bg-orange-100 text-orange-800',
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const getQuickAction = async (id: string, newStatus: string) => {
        try {
            await appointmentsAPI.updateStatus(id, newStatus)
            toast({ title: 'Éxito', description: 'Cita actualizada' })
            refetchApts()
            refetchStats()
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' })
        }
    }

    if (isLoading && !appointments.length) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Citas Médicas</h1>
                    <p className="text-muted-foreground">
                        {config?.hospitalName || 'Centro de Salud Jorge Chávez'} - Módulo I-4
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToExcel}>
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                    </Button>
                    <Button variant="outline" onClick={exportToPDF}>
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/appointments/daily-schedule')} className="border-primary text-primary hover:bg-primary/10">
                        <Clock className="h-4 w-4 mr-2" />
                        Ver Agenda Diaria
                    </Button>
                    {hasPermission('APPOINTMENTS_CREATE') && (
                        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Cita
                        </Button>
                    )}
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-50/50 border-blue-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600">Citas de Hoy</p>
                            <h3 className="text-2xl font-bold mt-1">{dashboardStats?.today?.total || 0}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <CalendarCheck className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-orange-50/50 border-orange-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-600">Pendientes registro HIS</p>
                            <h3 className="text-2xl font-bold mt-1 text-orange-700">{dashboardStats?.month?.pendingHis || 0}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <FileSearch className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-green-50/50 border-green-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">Nuevos Pacientes (Mes)</p>
                            <h3 className="text-2xl font-bold mt-1">{dashboardStats?.month?.newPatients || 0}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <UserPlus className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-purple-50/50 border-purple-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600">Cumplimiento (Mes)</p>
                            <h3 className="text-2xl font-bold mt-1">{dashboardStats?.month?.completionRate || 0}%</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por paciente, DNI, personal o motivo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={showFilters ? "bg-accent" : ""}>
                        <Filter className="h-4 w-4 mr-2" />
                        {showFilters ? 'Cerrar Filtros' : 'Filtros Avanzados'}
                    </Button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                        <Select value={filters.appointmentType} onValueChange={(v) => setFilters({ ...filters, appointmentType: v })}>
                            <SelectTrigger><SelectValue placeholder="Tipo Atención" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las Atenciones</SelectItem>
                                <SelectItem value="CONSULTA_MEDICINA_GENERAL">Medicina General</SelectItem>
                                <SelectItem value="CONSULTA_OBSTETRICIA">Obstetricia</SelectItem>
                                <SelectItem value="CONTROL_CRED">CRED</SelectItem>
                                <SelectItem value="VACUNACION">Vacunación</SelectItem>
                                <SelectItem value="TELEMEDICINA">Telemedicina</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Estados</SelectItem>
                                <SelectItem value="SCHEDULED">Programada</SelectItem>
                                <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                                <SelectItem value="COMPLETED">Completada</SelectItem>
                                <SelectItem value="CANCELLED">Cancelada</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.financiador} onValueChange={(v) => setFilters({ ...filters, financiador: v })}>
                            <SelectTrigger><SelectValue placeholder="Financiador" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todo Financiamiento</SelectItem>
                                <SelectItem value="02">SIS</SelectItem>
                                <SelectItem value="03">EsSalud</SelectItem>
                                <SelectItem value="01">Pagante</SelectItem>
                                <SelectItem value="09">Otros</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.patientCondition} onValueChange={(v) => setFilters({ ...filters, patientCondition: v })}>
                            <SelectTrigger><SelectValue placeholder="Condición" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas Condiciones</SelectItem>
                                <SelectItem value="NUEVO">Nuevo</SelectItem>
                                <SelectItem value="CONTINUADOR">Continuador</SelectItem>
                                <SelectItem value="REINGRESO">Reingreso</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.upss} onValueChange={(v) => setFilters({ ...filters, upss: v })}>
                            <SelectTrigger><SelectValue placeholder="UPSS" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas UPSS</SelectItem>
                                <SelectItem value="CONSULTA_EXTERNA">Consulta Externa</SelectItem>
                                <SelectItem value="INMUNIZACIONES">Inmunizaciones</SelectItem>
                                <SelectItem value="PATOLOGIA_CLINICA">Laboratorio</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.staffId} onValueChange={(v) => setFilters({ ...filters, staffId: v })}>
                            <SelectTrigger><SelectValue placeholder="Profesional" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todo el Personal</SelectItem>
                                {staff.map((m: any) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.user?.firstName} {m.user?.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="calendar">
                        <CalendarIcon className="h-4 w-4 mr-2" /> Calendario
                    </TabsTrigger>
                    <TabsTrigger value="table">
                        <TableIcon className="h-4 w-4 mr-2" /> Tabla
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="mt-4 border rounded-xl p-4 bg-card shadow-sm">
                    <HealthStaffCalendar
                        staffId="all"
                        appointments={filteredAppointments}
                        onRefresh={refetchApts}
                    />
                </TabsContent>

                <TabsContent value="table" className="mt-4">
                    <Card className="overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Paciente / Cond.</TableHead>
                                    <TableHead>Personal</TableHead>
                                    <TableHead>Fecha / Hora</TableHead>
                                    <TableHead>Financ. / UPSS</TableHead>
                                    <TableHead>Tipo Atención</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAppointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                            No se encontraron citas según los filtros seleccionados
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAppointments.map((apt: any) => (
                                        <TableRow key={apt.id} className="hover:bg-accent/50 transition-colors">
                                            <TableCell>
                                                <div className="font-semibold">{apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Desconocido'}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                                                    <ShieldCheck className="h-3 w-3" /> {apt.patientCondition || 'CONTINUADOR'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{apt.staff?.user ? `${apt.staff.user.firstName} ${apt.staff.user.lastName}` : 'Desconocido'}</div>
                                                <div className="text-[10px] text-muted-foreground">{apt.staff?.profession || 'Personal C.S.'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium">{format(new Date(apt.appointmentDate), 'dd MMM yyyy', { locale: es })}</div>
                                                <div className="text-xs text-muted-foreground">{format(new Date(apt.appointmentDate), 'HH:mm')}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-medium text-blue-700">{getFinanciadorLabel(apt.financiador)}</div>
                                                <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{getUpssLabel(apt.upss)}</div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-muted/30">
                                                    {getAppointmentTypeLabel(apt.type)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold text-center ${getStatusBadge(apt.status)}`}>
                                                        {apt.status}
                                                    </span>
                                                    {apt.status === 'COMPLETED' && (
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-center ${apt.hisLinked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {apt.hisLinked ? 'HIS REGISTRADO' : 'PENDIENTE HIS'}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleViewDetails(apt.id)} title="Ver Detalles">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {apt.status === 'SCHEDULED' && hasPermission('APPOINTMENTS_EDIT') && (
                                                        <Button variant="ghost" size="icon" className="text-green-600" onClick={() => getQuickAction(apt.id, 'CONFIRMED')} title="Confirmar">
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {['SCHEDULED', 'CONFIRMED'].includes(apt.status) && hasPermission('APPOINTMENTS_EDIT') && (
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(apt)} title="Editar">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission('APPOINTMENTS_DELETE') && (
                                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteId(apt.id)} title="Borrar">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>

            <AppointmentModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                appointment={selectedAppointment}
                onSuccess={handleSuccess}
            />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar cita médica?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no puede deshacerse. Se registrará la eliminación en la auditoría del sistema.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Eliminar permanentemente</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
