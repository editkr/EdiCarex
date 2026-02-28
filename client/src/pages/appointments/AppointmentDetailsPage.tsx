import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { appointmentsAPI } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UnifiedInvoiceModal } from '@/components/modals/UnifiedInvoiceModal'
import {
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    Bell,
    Loader2,
    Edit,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Banknote,
} from 'lucide-react'
import { format, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'
import { usePermissions } from '@/hooks/usePermissions'
import AppointmentModal from '@/components/modals/AppointmentModal'

export default function AppointmentDetailsPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { hasPermission } = usePermissions()
    const [activeTab, setActiveTab] = useState('details')
    const [showEditModal, setShowEditModal] = useState(false)
    const [showInvoiceModal, setShowInvoiceModal] = useState(false)
    const [invoiceInitialData, setInvoiceInitialData] = useState<any>(null)

    // Cargar datos de la cita
    const { data: appointmentData, isLoading, refetch } = useQuery({
        queryKey: ['appointment', id],
        queryFn: () => appointmentsAPI.getOne(id!),
        enabled: !!id,
    })

    // Cargar notificaciones de la cita
    const { data: notificationsData } = useQuery({
        queryKey: ['appointment-notifications', id],
        queryFn: () => appointmentsAPI.getNotifications(id!),
        enabled: !!id,
    })

    const appointment = appointmentData?.data
    const notifications = notificationsData?.data || []

    // Calcular duración real (en minutos)
    const calculateDuration = () => {
        if (appointment?.duration) return appointment.duration
        if (appointment?.endTime && appointment?.appointmentDate) {
            const diff = differenceInMinutes(
                new Date(appointment.endTime),
                new Date(appointment.appointmentDate)
            )
            return diff > 0 ? diff : 0
        }
        return 0
    }

    const handleEditSuccess = () => {
        refetch()
        toast({
            title: 'Éxito',
            description: 'Cita actualizada correctamente',
        })
    }

    const handleBilling = () => {
        if (!appointment) return

        setInvoiceInitialData({
            patientId: appointment.patient?.id,
            serviceDescription: `Consulta Médica - ${appointment.reason || 'General'}`,
            servicePrice: 50,
            staffName: (appointment.healthStaff?.user || appointment.doctor?.user) ? `${(appointment.healthStaff?.user || appointment.doctor.user).firstName} ${(appointment.healthStaff?.user || appointment.doctor.user).lastName}` : undefined,
            staffId: appointment.healthStaffId || appointment.doctorId,
            appointmentId: appointment.id
        })
        setShowInvoiceModal(true)
    }

    const handleCompleteAppointment = async () => {
        try {
            const now = new Date()
            const appointmentDate = new Date(appointment.appointmentDate)

            // Si la cita es futura, actualizar fecha de inicio a AHORA para evitar duración negativa
            const shouldUpdateStartDate = appointmentDate > now

            await appointmentsAPI.update(id!, {
                status: 'COMPLETED',
                endTime: now.toISOString(),
                ...(shouldUpdateStartDate && { appointmentDate: now.toISOString() })
            })
            refetch()
            toast({
                title: 'Consulta Finalizada',
                description: 'La duración ha sido calculada automáticamente.',
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo finalizar la cita',
                variant: 'destructive',
            })
        }
    }

    const handleCancelAppointment = async () => {
        try {
            await appointmentsAPI.update(id!, {
                status: 'CANCELLED'
            })
            refetch()
            toast({
                title: 'Cita Cancelada',
                description: 'La cita ha sido marcada como cancelada.',
                variant: 'destructive'
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo cancelar la cita',
                variant: 'destructive',
            })
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!appointment) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <p className="text-muted-foreground">Cita no encontrada</p>
                <Button onClick={() => navigate('/appointments')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver a Citas
                </Button>
            </div>
        )
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />
            case 'CANCELLED':
                return <XCircle className="h-5 w-5 text-red-500" />
            case 'CONFIRMED':
                return <CheckCircle2 className="h-5 w-5 text-blue-500" />
            default:
                return <Clock className="h-5 w-5 text-orange-500" />
        }
    }

    const translateStatus = (status: string) => {
        const statuses: Record<string, string> = {
            'SCHEDULED': 'Programada',
            'CONFIRMED': 'Confirmada',
            'COMPLETED': 'Completada',
            'CANCELLED': 'Cancelada',
            'NO_SHOW': 'No Asistió',
            'PENDING': 'Pendiente',
            'IN_PROGRESS': 'En Progreso'
        }
        return statuses[status] || status
    }

    const translateAppointmentType = (type: string) => {
        const types: Record<string, string> = {
            'CHECKUP': 'Chequeo General',
            'FOLLOW_UP': 'Seguimiento',
            'EMERGENCY': 'Emergencia',
            'CONSULTATION': 'Consulta Médica',
            'SURGERY': 'Cirugía',
            'ROUTINE': 'Rutina',
            'TELEMEDICINE': 'Telemedicina',
            'THERAPY': 'Terapia / Rehabilitación',
            'PROCEDURE': 'Procedimiento Especial',
            'LABORATORY': 'Laboratorio / Examen',
            'IMAGING': 'Imagenología (Rayos X, etc.)',
            'DENTISTRY': 'Odontología',
            'NUTRITION': 'Nutrición',
            'MENTAL_HEALTH': 'Salud Mental',
            'VACCINATION': 'Vacunación'
        };
        return types[type] || type
    }

    const translateType = (type: string) => {
        const types: Record<string, string> = {
            'APPOINTMENT_REMINDER': 'Recordatorio de Cita',
            'LAB_READY': 'Resultados Listos',
            'email': 'Correo',
            'sms': 'SMS'
        }
        return types[type] || type
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/appointments')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Detalles de la Cita</h1>
                        <p className="text-muted-foreground">
                            {appointment.appointmentDate ? format(new Date(appointment.appointmentDate), 'PPpp', { locale: es }) : 'N/A'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {hasPermission('BILLING_CREATE') && (
                        <Button
                            onClick={handleBilling}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                            <Banknote className="h-4 w-4 mr-2" />
                            Facturar
                        </Button>
                    )}

                    {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && hasPermission('APPOINTMENTS_EDIT') && (
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleCompleteAppointment}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Finalizar Consulta
                        </Button>
                    )}
                    {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && hasPermission('APPOINTMENTS_DELETE') && (
                        <Button
                            variant="destructive"
                            onClick={handleCancelAppointment}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                    )}
                    {hasPermission('APPOINTMENTS_EDIT') && (
                        <Button variant="outline" onClick={() => setShowEditModal(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                        </Button>
                    )}
                </div>
            </div>

            {/* Appointment Header Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Paciente</p>
                                <p className="font-medium text-lg">
                                    {appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Desconocido'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Personal de Salud</p>
                                <p className="font-medium">
                                    {(appointment.healthStaff?.user || appointment.doctor?.user) ? `${(appointment.healthStaff?.user || appointment.doctor.user).firstName} ${(appointment.healthStaff?.user || appointment.doctor.user).lastName}` : 'Desconocido'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Fecha y Hora</p>
                                <p className="font-medium">
                                    {appointment.appointmentDate ? format(new Date(appointment.appointmentDate), 'PPpp', { locale: es }) : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Duración</p>
                                <p className="font-medium">
                                    {calculateDuration() > 0
                                        ? `${calculateDuration()} min (${Math.floor(calculateDuration() / 60)}h ${calculateDuration() % 60}m)`
                                        : 'No especificada'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Estado</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {getStatusIcon(appointment.status)}
                                    <span className="font-medium">{translateStatus(appointment.status)}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tipo de Cita</p>
                                <p className="font-medium">{translateAppointmentType(appointment.type)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Motivo</p>
                                <p className="font-medium">{appointment.reason || 'General'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Real Time Stats */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hora Programada</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {appointment.appointmentDate ? format(new Date(appointment.appointmentDate), 'HH:mm') : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">Hora original de cita</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Duración Estimada</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {calculateDuration() > 0 ? `${calculateDuration()} min` : 'Pendiente'}
                        </div>
                        <p className="text-xs text-muted-foreground">Tiempo de consulta programado</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="details">
                        <FileText className="h-4 w-4 mr-2" />
                        Detalles
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <Calendar className="h-4 w-4 mr-2" />
                        Historial
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                        <Bell className="h-4 w-4 mr-2" />
                        Notificaciones
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Details */}
                <TabsContent value="details">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de la Cita</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">ID Cita</p>
                                    <p className="font-medium">{appointment.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Creada El</p>
                                    <p className="font-medium">
                                        {appointment.createdAt ? format(new Date(appointment.createdAt), 'PPpp', { locale: es }) : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Motivo</p>
                                    <p className="font-medium">{appointment.reason || 'Chequeo General'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Notas</p>
                                    <p className="font-medium">{appointment.notes || 'Sin notas'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: History */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Cambios</CardTitle>
                            <CardDescription>Rastrea todos los cambios realizados a esta cita</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {appointment.history && appointment.history.length > 0 ? (
                                <div className="space-y-4">
                                    {appointment.history.map((change: any, index: number) => (
                                        <div key={change.id || index} className="flex gap-4 p-4 border rounded-lg">
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium">Cambio de Estado: {translateStatus(change.status)}</p>
                                                        <p className="text-sm text-muted-foreground">{change.notes}</p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {change.createdAt ? format(new Date(change.createdAt), 'PPp', { locale: es }) : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <Calendar className="h-16 w-16 text-muted-foreground/50" />
                                    <div className="text-center">
                                        <p className="font-medium text-lg">Sin Historial Registrado</p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            No hay cambios registrados para esta cita.
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-4">
                                            Creada: {appointment.createdAt ? format(new Date(appointment.createdAt), 'PPpp', { locale: es }) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Notifications */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notificaciones Enviadas</CardTitle>
                            <CardDescription>Todas las notificaciones relacionadas a esta cita</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {notifications && notifications.length > 0 ? (
                                <div className="space-y-4">
                                    {notifications.map((notification: any) => (
                                        <div key={notification.id} className="flex gap-4 p-4 border rounded-lg">
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Bell className="h-5 w-5 text-blue-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium">{notification.title}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {notification.message}
                                                        </p>
                                                        <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                            {translateType(notification.type)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(notification.createdAt), 'PPp', { locale: es })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <Bell className="h-16 w-16 text-muted-foreground/50" />
                                    <div className="text-center">
                                        <p className="font-medium text-lg">Sin Notificaciones</p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            No hay notificaciones automáticas registradas para esta cita.
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-4">
                                            Paciente: {appointment.patient?.email || 'Sin email'}<br />
                                            Teléfono: {appointment.patient?.phone || 'Sin teléfono'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Modal */}
            {appointment && (
                <AppointmentModal
                    open={showEditModal}
                    onOpenChange={setShowEditModal}
                    appointment={appointment}
                    onSuccess={handleEditSuccess}
                />
            )}

            {/* Invoice Modal */}
            <UnifiedInvoiceModal
                open={showInvoiceModal}
                onOpenChange={setShowInvoiceModal}
                initialData={invoiceInitialData}
                onSuccess={() => {
                    setShowInvoiceModal(false)
                    toast({
                        title: "Factura Creada",
                        description: "La factura se ha generado correctamente desde la cita."
                    })
                }}
            />
        </div>
    )
}
