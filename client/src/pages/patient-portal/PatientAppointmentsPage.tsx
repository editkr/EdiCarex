import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Calendar,
    Clock,
    MapPin,
    User,
    Plus,
    Loader2,
    X,
} from 'lucide-react'
import { appointmentsAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import PatientPortalAppointmentModal from '@/components/modals/PatientPortalAppointmentModal'

export default function PatientAppointmentsPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [appointments, setAppointments] = useState<any[]>([])
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
    const [showDetails, setShowDetails] = useState(false)
    const [activeTab, setActiveTab] = useState('upcoming')

    // New Appointment State
    const [staff, setStaff] = useState<any[]>([])
    const [showNewAppointment, setShowNewAppointment] = useState(false)
    const [newAppointment, setNewAppointment] = useState({
        staffId: '',
        date: '',
        time: '',
        reason: '',
        type: 'CHECKUP'
    })

    // Get current user
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        if (user.patientId) {
            loadAppointments()
            loadStaff()
        }
    }, [])

    const loadStaff = async () => {
        try {
            // Using staffAPI imported from api.ts (need to import it)
            // Assuming staffAPI is available and imported
            const res = await import('@/services/api').then(m => m.healthStaffAPI.getAll())
            setStaff(res.data.data || [])
        } catch (error) {
            console.error("Error loading staff", error)
        }
    }

    const handleCreateAppointment = async () => {
        try {
            if (!newAppointment.staffId || !newAppointment.date || !newAppointment.time || !newAppointment.reason) {
                toast({ title: 'Error', description: 'Por favor complete todos los campos', variant: 'destructive' })
                return
            }

            const appointmentDate = new Date(`${newAppointment.date}T${newAppointment.time}`)

            await appointmentsAPI.create({
                patientId: user.patientId,
                staffId: newAppointment.staffId,
                appointmentDate: appointmentDate.toISOString(),
                time: newAppointment.time,
                reason: newAppointment.reason,
                type: newAppointment.type,
                status: 'SCHEDULED'
            })

            toast({ title: 'Cita agendada', description: 'Tu cita ha sido programada exitosamente.' })
            setShowNewAppointment(false)
            setNewAppointment({ staffId: '', date: '', time: '', reason: '', type: 'CHECKUP' })
            loadAppointments()
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo agendar la cita', variant: 'destructive' })
        }
    }

    const loadAppointments = async () => {
        try {
            setLoading(true)
            const res = await appointmentsAPI.getAll({
                patientId: user.patientId,
                limit: 100
            })
            setAppointments(res.data.data || [])
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar las citas',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const now = new Date()
    const upcomingAppointments = appointments.filter(
        (a) => new Date(a.appointmentDate) >= now && a.status !== 'CANCELLED'
    )
    const pastAppointments = appointments.filter(
        (a) => new Date(a.appointmentDate) < now || a.status === 'COMPLETED'
    )

    const handleCancelAppointment = async (id: string) => {
        try {
            await appointmentsAPI.cancel(id)
            toast({ title: 'Cita cancelada' })
            loadAppointments()
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' })
        }
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            SCHEDULED: 'bg-blue-100 text-blue-700',
            CONFIRMED: 'bg-green-100 text-green-700',
            COMPLETED: 'bg-gray-100 text-gray-700',
            CANCELLED: 'bg-red-100 text-red-700',
            IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
        }
        const labels: Record<string, string> = {
            SCHEDULED: 'Programada',
            CONFIRMED: 'Confirmada',
            COMPLETED: 'Completada',
            CANCELLED: 'Cancelada',
            IN_PROGRESS: 'En Curso',
        }
        return (
            <span className={`text-xs px-2 py-1 rounded-full ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Mis Citas</h1>
                    <p className="text-gray-500">Gestiona tus citas médicas</p>
                </div>
                <Button onClick={() => setShowNewAppointment(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agendar Nueva Cita
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="upcoming">
                        Próximas ({upcomingAppointments.length})
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        Historial ({pastAppointments.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-4">
                    {upcomingAppointments.length > 0 ? (
                        <div className="grid gap-4">
                            {upcomingAppointments.map((apt) => (
                                <Card key={apt.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <div className="text-center text-blue-600">
                                                        <div className="text-xl font-bold">
                                                            {format(new Date(apt.appointmentDate), 'dd')}
                                                        </div>
                                                        <div className="text-xs uppercase">
                                                            {format(new Date(apt.appointmentDate), 'MMM', { locale: es })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-semibold">
                                                        Personal de Salud: {apt.staff?.user?.firstName} {apt.staff?.user?.lastName}
                                                    </p>
                                                    <p className="text-gray-500 text-sm">{apt.reason}</p>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {apt.startTime}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-4 w-4" />
                                                            Consultorio 1
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(apt.status)}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedAppointment(apt)
                                                        setShowDetails(true)
                                                    }}
                                                >
                                                    Ver
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleCancelAppointment(apt.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-semibold mb-2">No tienes citas próximas</h3>
                                <p className="text-gray-500 mb-4">
                                    Agenda tu próxima cita con nuestros especialistas
                                </p>
                                <Button onClick={() => setShowNewAppointment(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agendar Cita
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Personal de Salud</TableHead>
                                        <TableHead>Motivo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pastAppointments.map((apt) => (
                                        <TableRow key={apt.id}>
                                            <TableCell>
                                                {format(new Date(apt.appointmentDate), 'PPP', { locale: es })}
                                            </TableCell>
                                            <TableCell>
                                                Personal de Salud: {apt.staff?.user?.firstName} {apt.staff?.user?.lastName}
                                            </TableCell>
                                            <TableCell>{apt.reason}</TableCell>
                                            <TableCell>{getStatusBadge(apt.status)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedAppointment(apt)
                                                        setShowDetails(true)
                                                    }}
                                                >
                                                    Ver detalles
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalles de la Cita</DialogTitle>
                        <DialogDescription>Consulta la información detallada de tu cita</DialogDescription>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <User className="h-12 w-12 text-gray-400" />
                                <div>
                                    <p className="font-semibold">
                                        Personal de Salud: {selectedAppointment.staff?.user?.firstName} {selectedAppointment.staff?.user?.lastName}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {selectedAppointment.healthStaff?.specialty?.name || selectedAppointment.doctor?.specialty?.name || 'Medicina General'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Fecha</p>
                                    <p className="font-medium">
                                        {format(new Date(selectedAppointment.appointmentDate), 'PPP', { locale: es })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Hora</p>
                                    <p className="font-medium">{selectedAppointment.startTime}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Tipo</p>
                                    <p className="font-medium">{selectedAppointment.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Estado</p>
                                    {getStatusBadge(selectedAppointment.status)}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Motivo</p>
                                <p className="font-medium">{selectedAppointment.reason}</p>
                            </div>

                            {selectedAppointment.notes && (
                                <div>
                                    <p className="text-sm text-gray-500">Notas</p>
                                    <p className="text-sm">{selectedAppointment.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* New Appointment Dialog */}
            <PatientPortalAppointmentModal
                open={showNewAppointment}
                onOpenChange={setShowNewAppointment}
                patientId={user.patientId}
                onSuccess={loadAppointments}
            />
        </div>
    )
}
