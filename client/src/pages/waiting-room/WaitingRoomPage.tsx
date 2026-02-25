import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Users,
    UserCheck,
    Clock,
    Loader2,
    Search,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Timer,
    UserPlus,
    Filter,
    Stethoscope
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { appointmentsAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import { format, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { usePermissions } from '@/hooks/usePermissions'

interface WaitingPatient {
    id: string
    patient: any
    doctor: any
    appointmentDate: string
    startTime: string
    status: string
    checkInTime?: string
    waitingTime?: number
    priority?: 'NORMAL' | 'URGENT' | 'EMERGENCY'
}

export default function WaitingRoomPage() {
    const { toast } = useToast()
    const { hasPermission } = usePermissions()
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [waitingPatients, setWaitingPatients] = useState<WaitingPatient[]>([])
    const [showCheckIn, setShowCheckIn] = useState(false)
    const [todayAppointments, setTodayAppointments] = useState<any[]>([])
    const [filterPriority, setFilterPriority] = useState<string>('ALL')

    useEffect(() => {
        loadTodayAppointments()
        const interval = setInterval(loadTodayAppointments, 30000)
        return () => clearInterval(interval)
    }, [])

    const loadTodayAppointments = async () => {
        try {
            setLoading(true)
            const today = new Date().toISOString().split('T')[0]
            const res = await appointmentsAPI.getAll({ date: today, limit: 100 })
            const appointments = res.data.data || res.data || []

            const waiting = appointments
                .filter((a: any) => a.status === 'CHECKED_IN' || a.status === 'CONFIRMED')
                .map((a: any) => {
                    const checkInHistory = a.history?.find((h: any) => h.status === 'CHECKED_IN')
                    const checkInTime = checkInHistory ? checkInHistory.createdAt : (a.status === 'CHECKED_IN' ? a.updatedAt : null)

                    return {
                        ...a,
                        checkInTime: checkInTime,
                        waitingTime: checkInTime
                            ? differenceInMinutes(new Date(), new Date(checkInTime))
                            : 0,
                        priority: a.priority || 'NORMAL',
                    }
                })
                .sort((a: any, b: any) => {
                    const priorityOrder: Record<string, number> = { EMERGENCY: 0, URGENT: 1, NORMAL: 2 }
                    const aPriority = priorityOrder[a.priority as string] ?? 2
                    const bPriority = priorityOrder[b.priority as string] ?? 2
                    if (aPriority !== bPriority) return aPriority - bPriority
                    return (b.waitingTime || 0) - (a.waitingTime || 0)
                })

            setWaitingPatients(waiting)
            setTodayAppointments(appointments)
        } catch (error) {
            console.error('Error loading appointments:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCheckIn = async (appointment: any) => {
        try {
            await appointmentsAPI.updateStatus(appointment.id, 'CHECKED_IN')
            toast({
                title: 'Check-in realizado',
                description: `${appointment.patient?.firstName} ${appointment.patient?.lastName} registrado`,
            })
            loadTodayAppointments()
            setShowCheckIn(false)
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo realizar el check-in',
                variant: 'destructive',
            })
        }
    }

    const handleCallPatient = async (patient: WaitingPatient) => {
        try {
            await appointmentsAPI.updateStatus(patient.id, 'IN_PROGRESS')
            toast({
                title: 'Paciente llamado',
                description: `${patient.patient?.firstName} ha sido llamado a consultorio`,
            })
            loadTodayAppointments()
        } catch (error) {
            toast({
                title: 'Error',
                variant: 'destructive',
            })
        }
    }

    const handleNoShow = async (patient: WaitingPatient) => {
        try {
            await appointmentsAPI.updateStatus(patient.id, 'NO_SHOW')
            toast({ title: 'Marcado como no presentado' })
            loadTodayAppointments()
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' })
        }
    }

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'EMERGENCY':
                return <Badge variant="destructive" className="animate-pulse">Emergencia</Badge>
            case 'URGENT':
                return <Badge className="bg-orange-500 hover:bg-orange-600">Urgente</Badge>
            default:
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Normal</Badge>
        }
    }

    const getWaitingTimeColor = (minutes: number) => {
        if (minutes > 30) return 'text-red-500 font-bold'
        if (minutes > 15) return 'text-orange-500 font-medium'
        return 'text-green-600 font-medium'
    }

    const filteredPatients = waitingPatients.filter((p) => {
        const matchesSearch = p.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())

        if (filterPriority === 'ALL') return matchesSearch
        return matchesSearch && p.priority === filterPriority
    })

    const pendingCheckIn = todayAppointments.filter(
        (a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED'
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Top Bar with Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">En Espera</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{waitingPatients.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Pacientes en sala</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tiempo Promedio</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            {waitingPatients.length > 0
                                ? Math.round(waitingPatients.reduce((sum, p) => sum + (p.waitingTime || 0), 0) / waitingPatients.length)
                                : 0}<span className="text-lg font-normal text-muted-foreground ml-1">min</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Tiempo de espera actual</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Atendidos Hoy</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">
                            {todayAppointments.filter((a) => a.status === 'COMPLETED').length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Visitas completadas</p>
                    </CardContent>
                </Card>

                <Card className="bg-primary text-primary-foreground">
                    <CardContent className="flex flex-col items-center justify-center h-full pt-6">
                        {hasPermission('APPOINTMENTS_EDIT') && (
                            <Button
                                variant="secondary"
                                size="lg"
                                className="w-full h-12 text-lg font-semibold shadow-md"
                                onClick={() => setShowCheckIn(true)}
                            >
                                <UserPlus className="h-5 w-5 mr-2" />
                                Nuevo Check-in
                            </Button>
                        )}
                        <p className="text-xs text-primary-foreground/80 mt-3 text-center">
                            {pendingCheckIn.length} citas pendientes por registrar
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar paciente por nombre..."
                                className="pl-10 h-10 bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Tabs value={filterPriority} onValueChange={setFilterPriority} className="w-auto">
                            <TabsList>
                                <TabsTrigger value="ALL">Todos</TabsTrigger>
                                <TabsTrigger value="URGENT">Urgentes</TabsTrigger>
                                <TabsTrigger value="NORMAL">Normales</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                            <Card key={patient.id} className="group hover:shadow-xl transition-all duration-300 border-l-4 overflow-hidden"
                                style={{ borderLeftColor: patient.priority === 'EMERGENCY' ? '#ef4444' : patient.priority === 'URGENT' ? '#f97316' : '#3b82f6' }}>
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-xl text-foreground line-clamp-1">
                                                {patient.patient?.firstName}
                                            </h3>
                                            <h3 className="font-bold text-xl text-foreground line-clamp-1">
                                                {patient.patient?.lastName}
                                            </h3>
                                        </div>
                                        {getPriorityBadge(patient.priority || 'NORMAL')}
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                                            <Stethoscope className="h-4 w-4 mr-2 text-primary" />
                                            <span className="font-medium truncate">Dr. {patient.doctor?.user?.firstName} {patient.doctor?.user?.lastName}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center text-muted-foreground">
                                                <Clock className="h-4 w-4 mr-2" />
                                                {patient.startTime}
                                            </div>
                                            <div className={`flex items-center ${getWaitingTimeColor(patient.waitingTime || 0)}`}>
                                                <Timer className="h-4 w-4 mr-1" />
                                                {patient.waitingTime} min
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        {hasPermission('APPOINTMENTS_EDIT') && (
                                            <Button
                                                className="w-full bg-primary hover:bg-primary/90 shadow-sm"
                                                size="lg"
                                                onClick={() => handleCallPatient(patient)}
                                            >
                                                <UserCheck className="h-5 w-5 mr-2" />
                                                FINALIZAR ESPERA
                                            </Button>
                                        )}
                                        {hasPermission('APPOINTMENTS_EDIT') && (
                                            <Button
                                                variant="ghost"
                                                className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                size="sm"
                                                onClick={() => handleNoShow(patient)}
                                            >
                                                No se presentó
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-16 text-center bg-muted/10 rounded-xl border-2 border-dashed border-muted">
                            <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground">La sala de espera está vacía</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                                No hay pacientes registrados en este momento. Utiliza el botón de Check-in para registrar llegadas.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Check-in Dialog */}
            <Dialog open={showCheckIn} onOpenChange={setShowCheckIn}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Registrar Llegada</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <Input
                            placeholder="Buscar en citas programadas de hoy..."
                            className="mb-4"
                        />
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {pendingCheckIn.length > 0 ? (
                                pendingCheckIn.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="flex items-center justify-between p-4 border rounded-xl hover:bg-secondary/50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                {apt.patient?.firstName[0]}{apt.patient?.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    {apt.patient?.firstName} {apt.patient?.lastName}
                                                </p>
                                                <p className="text-sm text-muted-foreground flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {apt.startTime} — Dr. {apt.doctor?.user?.lastName}
                                                </p>
                                            </div>
                                        </div>
                                        {hasPermission('APPOINTMENTS_EDIT') && (
                                            <Button onClick={() => handleCheckIn(apt)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                Check-in
                                            </Button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">No hay citas pendientes por registrar hoy.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
