import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsAPI } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    Bell,
    Edit,
    CheckCircle2,
    XCircle,
    Activity,
    ClipboardCheck,
    Stethoscope,
    ShieldCheck,
    History,
    MessageSquare,
    Link as LinkIcon,
    AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'
import { usePermissions } from '@/hooks/usePermissions'
import AppointmentModal from '@/components/modals/AppointmentModal'

export default function AppointmentDetailsPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const { hasPermission } = usePermissions()
    const [activeTab, setActiveTab] = useState('details')
    const [showEditModal, setShowEditModal] = useState(false)

    // Cargar datos de la cita
    const { data: appointmentRes, isLoading, refetch } = useQuery({
        queryKey: ['appointment', id],
        queryFn: () => appointmentsAPI.getOne(id!),
        enabled: !!id,
    })

    const appointment = appointmentRes?.data

    // Mutation para HIS
    const generateHisMutation = useMutation({
        mutationFn: (id: string) => appointmentsAPI.generateHis(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointment', id] })
            toast({
                title: "Éxito",
                description: "Registro HIS generado correctamente y vinculado a esta cita.",
            })
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "No se pudo generar el registro HIS",
                variant: "destructive"
            })
        }
    })

    const handleCompleteAppointment = async () => {
        try {
            await appointmentsAPI.update(id!, { status: 'COMPLETED' })
            refetch()
            toast({ title: 'Consulta Finalizada', description: 'La cita ha sido marcada como completada.' })
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo finalizar la cita', variant: 'destructive' })
        }
    }

    const handleCancelAppointment = async () => {
        try {
            await appointmentsAPI.update(id!, { status: 'CANCELLED' })
            refetch()
            toast({ title: 'Cita Cancelada', description: 'La cita ha sido cancelada.', variant: 'destructive' })
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo cancelar la cita', variant: 'destructive' })
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-64" />
                </div>
                <Card><CardContent className="h-48 pt-6"><Skeleton className="h-full w-full" /></CardContent></Card>
                <div className="grid grid-cols-2 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!appointment) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Cita no encontrada o ha sido eliminada.</p>
                <Button onClick={() => navigate('/appointments')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Citas
                </Button>
            </div>
        )
    }

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            SCHEDULED: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
            CONFIRMED: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
            COMPLETED: 'bg-green-100 text-green-700 hover:bg-green-100',
            CANCELLED: 'bg-red-100 text-red-700 hover:bg-red-100',
            NO_SHOW: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
        }
        return colors[status] || 'bg-gray-100 text-gray-700 border-none'
    }

    const translateStatus = (status: string) => {
        const statuses: Record<string, string> = {
            'SCHEDULED': 'Programada', 'CONFIRMED': 'Confirmada', 'COMPLETED': 'Completada',
            'CANCELLED': 'Cancelada', 'NO_SHOW': 'No Asistió', 'IN_PROGRESS': 'En Progreso'
        }
        return statuses[status] || status
    }

    const translateType = (type: string) => {
        const types: Record<string, string> = {
            'CONS_MED_GRAL': 'Medicina General',
            'CONS_EXT': 'Consulta Externa',
            'CONTROL_PRENATAL': 'Control Prenatal',
            'CRED': 'C.R.E.D.',
            'CONS_ODONTO': 'Odontología',
            'CONS_PSICO': 'Psicología',
            'CONS_NUTRI': 'Nutrición',
            'CHECKUP': 'Chequeo General',
            'FOLLOW_UP': 'Seguimiento'
        }
        return types[type] || type
    }

    const getFinanciadorInfo = (code: string) => {
        const info: Record<string, { label: string, color: string }> = {
            '02': { label: 'ATENCIÓN GRATUITA SIS', color: 'bg-emerald-600' },
            '01': { label: 'PAGANTE', color: 'bg-blue-600' },
            '03': { label: 'ESSALUD', color: 'bg-indigo-600' }
        }
        return info[code] || { label: 'PAGANTE', color: 'bg-slate-600' }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/appointments')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Volver
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">Detalles de Cita</h1>
                            <Badge className={getStatusBadge(appointment.status)} variant="outline">
                                {translateStatus(appointment.status)}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {appointment.appointmentDate ? format(new Date(appointment.appointmentDate), "eeee d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es }) : 'No definida'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {appointment.status === 'COMPLETED' && !appointment.hisLinked && (
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => generateHisMutation.mutate(appointment.id)}
                            disabled={generateHisMutation.isPending}
                        >
                            <ClipboardCheck className="h-4 w-4 mr-2" />
                            {generateHisMutation.isPending ? 'Procesando...' : 'Registrar en HIS'}
                        </Button>
                    )}

                    {['SCHEDULED', 'CONFIRMED'].includes(appointment.status) && hasPermission('APPOINTMENTS_EDIT') && (
                        <Button className="bg-green-600 hover:bg-green-700" onClick={handleCompleteAppointment}>
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar Atenc.
                        </Button>
                    )}

                    {['SCHEDULED', 'CONFIRMED'].includes(appointment.status) && hasPermission('APPOINTMENTS_DELETE') && (
                        <Button variant="destructive" onClick={handleCancelAppointment}>
                            <XCircle className="h-4 w-4 mr-2" /> Cancelar
                        </Button>
                    )}

                    {hasPermission('APPOINTMENTS_EDIT') && (
                        <Button variant="outline" onClick={() => setShowEditModal(true)}>
                            <Edit className="h-4 w-4 mr-2" /> Editar
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Main Info Card */}
                    <Card className="border-t-4 border-t-primary shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">Información del Paciente</CardTitle>
                                    <div className="flex gap-2 mt-2">
                                        <Badge className={`${getFinanciadorInfo(appointment.financiador).color} text-white`}>
                                            {getFinanciadorInfo(appointment.financiador).label}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs uppercase">
                                            {appointment.patientCondition || 'CONTINUADOR'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-primary">
                                        {appointment.appointmentDate ? format(new Date(appointment.appointmentDate), 'HH:mm') : '---'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Hora Cita</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 border-t pt-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Paciente</p>
                                        <p className="font-bold">{appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : '---'}</p>
                                        <p className="text-[10px] font-medium text-slate-500">DNI: {appointment.patient?.documentNumber || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Stethoscope className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Profesional de Salud</p>
                                        <p className="font-bold">
                                            {appointment.healthStaff?.user
                                                ? `${appointment.healthStaff.user.firstName} ${appointment.healthStaff.user.lastName}`
                                                : appointment.doctor?.user
                                                    ? `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`
                                                    : '---'}
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-500 uppercase">
                                            {appointment.healthStaff?.profession || 'Personal C.S.'} | {appointment.healthStaff?.collegiateBody || 'CM'} {appointment.healthStaff?.licenseNumber || '---'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <ShieldCheck className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">UPSS / Consultorio</p>
                                        <p className="font-bold truncate max-w-[200px] uppercase text-xs">{appointment.upss || 'Consulta Externa'}</p>
                                        <p className="text-[10px] font-medium text-slate-500">{appointment.consultorio || 'General'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Tratamiento / Duración</p>
                                        <p className="font-bold">{translateType(appointment.type)}</p>
                                        <p className="text-[10px] font-medium text-slate-500">Estimado: {appointment.estimatedDuration || 20} minutos</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vital Signs Section */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-rose-500" />
                                <CardTitle className="text-lg">Signos Vitales al Ingreso</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {appointment.vitalSignsAtEntry ? (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-2">
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">P.A. (mmHg)</p>
                                        <p className="text-lg font-black">{(appointment.vitalSignsAtEntry as any).pa || '---'}</p>
                                        {(appointment.vitalSignsAtEntry as any).pa && <p className="text-[8px] text-blue-600 font-bold">Norm: 120/80</p>}
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">FC (lpm)</p>
                                        <p className="text-lg font-black">{(appointment.vitalSignsAtEntry as any).fc || '---'}</p>
                                        {(appointment.vitalSignsAtEntry as any).fc && <p className="text-[8px] text-blue-600 font-bold">Norm: 60-100</p>}
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">FR (rpm)</p>
                                        <p className="text-lg font-black">{(appointment.vitalSignsAtEntry as any).fr || '---'}</p>
                                        {(appointment.vitalSignsAtEntry as any).fr && <p className="text-[8px] text-blue-600 font-bold">Norm: 12-20</p>}
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Temp (°C)</p>
                                        <p className="text-lg font-black">{(appointment.vitalSignsAtEntry as any).temp || '---'}</p>
                                        {(appointment.vitalSignsAtEntry as any).temp && <p className="text-[8px] text-rose-600 font-bold">Norm: 36.5-37.5</p>}
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">SatO2 (%)</p>
                                        <p className="text-lg font-black">{(appointment.vitalSignsAtEntry as any).spo2 || '---'}</p>
                                        {(appointment.vitalSignsAtEntry as any).spo2 && <p className="text-[8px] text-green-600 font-bold">Norm: 95-100</p>}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                                    <p className="text-sm text-muted-foreground">No se han registrado signos vitales en el triaje para esta atención.</p>
                                    <Button variant="link" onClick={() => setShowEditModal(true)} className="text-xs">Registrar ahora</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="details">Detalles MINSA</TabsTrigger>
                            <TabsTrigger value="history">Historial de Cita</TabsTrigger>
                            <TabsTrigger value="notifications">Alertas</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="mt-4 space-y-4">
                            <Card>
                                <CardHeader><CardTitle className="text-sm">Diagnóstico y Prescripción</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Motivo de Consulta (Manual HIS)</p>
                                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 italic text-sm">
                                            "{appointment.chiefComplaint || appointment.reason || 'Sin observación adicional'}"
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-3 border rounded-lg bg-card">
                                            <p className="text-xs font-bold mb-1">CIE-10 Registrados</p>
                                            <ul className="text-xs space-y-1">
                                                {Array.isArray(appointment.diagnosisCodes) && appointment.diagnosisCodes.length > 0 ? (
                                                    (appointment.diagnosisCodes as any[]).map((d, i) => (
                                                        <li key={i} className="flex items-center gap-1"><span className="font-black text-rose-600">[{d.code}]</span> {d.description}</li>
                                                    ))
                                                ) : <li className="text-muted-foreground italic">Pendiente registro</li>}
                                            </ul>
                                        </div>
                                        <div className="p-3 border rounded-lg bg-card">
                                            <p className="text-xs font-bold mb-1">Receta Médica (PNUME)</p>
                                            <ul className="text-xs space-y-1">
                                                {Array.isArray(appointment.prescriptions) && appointment.prescriptions.length > 0 ? (
                                                    (appointment.prescriptions as any[]).map((p, i) => (
                                                        <li key={i} className="flex items-center gap-1"><span className="font-bold">{p.name}</span> - {p.frequency}</li>
                                                    ))
                                                ) : <li className="text-muted-foreground italic">No se emitieron recetas</li>}
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="mt-4">
                            <Card>
                                <CardContent className="pt-6">
                                    {appointment.history?.length > 0 ? (
                                        <div className="relative pl-6 space-y-4 border-l-2 border-slate-100">
                                            {appointment.history.map((h: any, i: number) => (
                                                <div key={i} className="relative">
                                                    <div className="absolute -left-8 top-1 h-4 w-4 rounded-full bg-white border-2 border-slate-300" />
                                                    <p className="text-xs font-bold">{translateStatus(h.status)}</p>
                                                    <p className="text-[10px] text-muted-foreground">{h.notes}</p>
                                                    <p className="text-[9px] text-slate-400 font-medium uppercase mt-1">
                                                        {format(new Date(h.createdAt), "dd MMM, HH:mm", { locale: es })}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8"><History className="h-8 w-8 mx-auto text-slate-300 mb-2" /><p className="text-xs text-muted-foreground">Sin historial de cambios</p></div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="notifications" className="mt-4">
                            <Card>
                                <CardContent className="pt-6 text-center space-y-4">
                                    <Bell className="h-8 w-8 mx-auto text-blue-300" />
                                    <p className="text-xs text-muted-foreground">Solo se muestran alertas generadas por el sistema de triaje IA o recordatorios automáticos.</p>
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-left">
                                        <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Estado de Alerta IA</p>
                                        <p className="text-xs">{appointment.triageNotes || 'No se requiere intervención inmediata por IA.'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-6">
                    {/* Status Card Sidebar */}
                    <Card className="bg-slate-900 text-white border-none overflow-hidden">
                        <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 flex justify-between items-center border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <LinkIcon className="h-4 w-4 text-emerald-400" />
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-400">Estado HIS MINSA</CardTitle>
                            </div>
                        </div>
                        <CardContent className="pt-6 pb-6 space-y-6">
                            <div className="flex flex-col items-center text-center">
                                <div className={`h-16 w-16 rounded-3xl flex items-center justify-center mb-4 rotate-3 transition-transform hover:rotate-0 ${appointment.hisLinked ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]'}`}>
                                    {appointment.hisLinked ? <ClipboardCheck className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
                                </div>
                                <h4 className="text-lg font-black">{appointment.hisLinked ? 'YA REGISTRADO' : 'PENDIENTE'}</h4>
                                <p className="text-xs text-slate-400 px-4 mt-2">
                                    {appointment.hisLinked
                                        ? `Vinculado al ID: ${appointment.hisRecordId?.substring(0, 8)}...`
                                        : 'Esta atención aún no ha sido reportada al sistema HIS del establecimiento.'
                                    }
                                </p>
                            </div>

                            {appointment.status === 'COMPLETED' && !appointment.hisLinked && (
                                <Button
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 font-black text-[10px] tracking-widest h-12 rounded-xl text-slate-900"
                                    onClick={() => generateHisMutation.mutate(appointment.id)}
                                    disabled={generateHisMutation.isPending}
                                >
                                    SINCRONIZAR AHORA
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Access Card */}
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Datos Rápidos</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Creado</span>
                                <span className="font-medium">{format(new Date(appointment.createdAt), 'dd/MM/yy HH:mm')}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs border-t pt-2">
                                <span className="text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Canal</span>
                                <span className="font-medium uppercase">Presencial</span>
                            </div>
                            <div className="flex items-center justify-between text-xs border-t pt-2">
                                <span className="text-muted-foreground flex items-center gap-1"><Stethoscope className="h-3 w-3" /> Prioridad IA</span>
                                <Badge className={`${appointment.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'} text-[10px] lowercase py-0 h-4 border-none`}>
                                    {appointment.priority || 'NORMAL'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Modal */}
            <AppointmentModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                appointment={appointment}
                onSuccess={() => {
                    refetch()
                    setShowEditModal(false)
                }}
            />
        </div>
    )
}
