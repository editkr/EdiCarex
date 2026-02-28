import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Stethoscope,
    Plus,
    Search,
    Loader2,
    Edit,
    Trash2,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    Phone,
    Moon,
} from 'lucide-react'
import { healthStaffAPI, appointmentsAPI } from '@/services/api'
import { useToast } from '@/components/ui/use-toast'
import HealthStaffModal from '@/components/modals/HealthStaffModal'
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
import { format, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { usePermissions } from '@/hooks/usePermissions'

// Visual Schedule Component
const ScheduleBadges = ({ schedules }: { schedules: any[] }) => {
    const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
    const activeDays = new Set(schedules?.map((s: any) => s.dayOfWeek) || [])

    // Find common hours or indicate variance
    let hoursStr = '-'
    if (schedules && schedules.length > 0) {
        const uniqueTimes = new Set(schedules.map((s: any) => `${s.startTime}-${s.endTime}`))
        if (uniqueTimes.size === 1) {
            hoursStr = `${schedules[0].startTime.slice(0, 5)} - ${schedules[0].endTime.slice(0, 5)}`
        } else {
            hoursStr = 'Horario Variable'
        }
    }

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex gap-1">
                {days.map((day, i) => (
                    <div
                        key={i}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${activeDays.has(i) ? 'bg-indigo-100 text-indigo-600 ring-1 ring-indigo-200' : 'bg-slate-50 text-slate-300'}`}
                        title={activeDays.has(i) ? 'Laborable' : 'No laborable'}
                    >
                        {day}
                    </div>
                ))}
            </div>
            {schedules?.length > 0 && (
                <span className="text-[10px] text-muted-foreground font-bold tracking-tight pl-0.5">
                    {hoursStr}
                </span>
            )}
            {(!schedules || schedules.length === 0) && (
                <span className="text-[10px] text-slate-400 font-medium pl-0.5">
                    Sin asignar
                </span>
            )}
        </div>
    )
}

export default function HealthStaffPage() {
    const navigate = useNavigate()
    const { hasPermission } = usePermissions()
    const [searchTerm, setSearchTerm] = useState('')
    const [staff, setStaff] = useState<any[]>([])
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<any>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [staffRes, appointmentsRes] = await Promise.all([
                healthStaffAPI.getAll(),
                appointmentsAPI.getAll().catch(() => ({ data: { data: [] } })),
            ])
            setStaff(staffRes.data.data || [])
            setAppointments(appointmentsRes.data?.data || [])
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al cargar personal de salud',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await healthStaffAPI.delete(deleteId)
            toast({
                title: 'Éxito',
                description: 'Personal de salud eliminado correctamente',
            })
            loadData()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Error al eliminar personal',
                variant: 'destructive',
            })
        } finally {
            setDeleteId(null)
        }
    }

    const handleEdit = (member: any) => {
        setSelectedStaff(member)
        setModalOpen(true)
    }

    const handleAdd = () => {
        setSelectedStaff(null)
        setModalOpen(true)
    }

    const handleSuccess = () => {
        loadData()
        setModalOpen(false)
    }

    const handleViewProfile = (staffId: string) => {
        navigate(`/health-staff/${staffId}`)
    }



    const handleToggleAvailability = async (member: any) => {
        try {
            await healthStaffAPI.update(member.id, {
                isAvailable: !member.isAvailable
            })
            // Optimistic update or reload
            setStaff(prev => prev.map(d =>
                d.id === member.id ? { ...d, isAvailable: !member.isAvailable } : d
            ))
            toast({
                title: 'Estado actualizado',
                description: `Personal ${!member.isAvailable ? 'marcado como disponible' : 'marcado como no disponible'}`,
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo actualizar la disponibilidad',
                variant: 'destructive',
            })
            loadData() // Revert on error
        }
    }
    const getPatientsToday = (staffId: string) => {
        return appointments.filter((apt: any) => {
            try {
                return apt.staffId === staffId &&
                    isToday(new Date(apt.appointmentDate)) &&
                    // Count all valid appointments (not cancelled)
                    apt.status !== 'CANCELLED'
            } catch {
                return false
            }
        }).length
    }

    // Obtener estado del personal
    const getStaffStatus = (member: any) => {
        if (!member.isAvailable) return { status: 'NO DISPONIBLE', color: 'text-gray-500', bgColor: 'bg-gray-100' }

        const now = new Date()
        const currentAppointment = appointments.find((apt: any) => {
            try {
                if (apt.staffId !== member.id) return false
                if (apt.status !== 'SCHEDULED' && apt.status !== 'CONFIRMED' && apt.status !== 'IN_PROGRESS') return false

                const aptTime = new Date(apt.appointmentDate)
                // Assume 30 min duration for now
                const aptEndTime = new Date(aptTime.getTime() + 30 * 60000)

                return isToday(aptTime) && now >= aptTime && now <= aptEndTime
            } catch {
                return false
            }
        })

        if (currentAppointment) return { status: 'OCUPADO', color: 'text-orange-500', bgColor: 'bg-orange-100' }
        return { status: 'DISPONIBLE', color: 'text-green-500', bgColor: 'bg-green-100' }
    }

    const formatSchedule = (schedules: any[]) => {
        if (!schedules || schedules.length === 0) return { days: 'Sin Horario', hours: '-' }

        // Simple logic: Take the first schedule or summarize
        // Ideal: Group by hours (e.g. Mon-Fri 8-5)
        // For now, let's show the range of days effectively
        const days = schedules.map(s => s.dayOfWeek).sort()
        const startDay = days[0]
        const endDay = days[days.length - 1]

        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        const dayStr = days.length > 2 && (endDay - startDay === days.length - 1)
            ? `${dayNames[startDay]}-${dayNames[endDay]}`
            : days.map(d => dayNames[d]).join(', ')

        const hours = `${schedules[0].startTime} - ${schedules[0].endTime}`
        return { days: dayStr, hours }
    }

    const filteredMembers = staff.filter((member: any) =>
        `${member.user?.firstName} ${member.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.licenseNumber?.includes(searchTerm)
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Personal de Salud</h1>
                    <p className="text-muted-foreground">
                        Gestionar personal asistencial y horarios • {filteredMembers.length} total
                    </p>
                </div>
                {hasPermission('STAFF_CREATE') && (
                    <Button onClick={handleAdd}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Personal
                    </Button>
                )}
            </div>

            {/* Search Bar */}
            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, especialidad o número de licencia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </Card>

            {/* Doctors Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Foto</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Especialidad</TableHead>
                            <TableHead>Horario</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Pacientes Hoy</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMembers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No se encontraron registros
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMembers.map((member: any) => {
                                const statusInfo = getStaffStatus(member)
                                const patientsToday = getPatientsToday(member.id)

                                return (
                                    <TableRow key={member.id} className="hover:bg-accent/50 transition-colors">
                                        <TableCell>
                                            {member.user?.avatar ? (
                                                <img
                                                    src={member.user.avatar}
                                                    alt={`${member.user.firstName} ${member.user.lastName}`}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                                                    {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div>
                                                <p>{member.user?.firstName} {member.user?.lastName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Licencia: {member.licenseNumber}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                                {member.specialization || 'General'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <ScheduleBadges schedules={member.schedules} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={member.isAvailable}
                                                    onCheckedChange={() => handleToggleAvailability(member)}
                                                />
                                                <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                                                    {statusInfo.status}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-sm font-semibold text-primary">{patientsToday}</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">pacientes</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                <span>{member.user?.phone || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewProfile(member.id)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {hasPermission('STAFF_EDIT') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(member)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {hasPermission('STAFF_DELETE') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeleteId(member.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Modal */}
            <HealthStaffModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                staff={selectedStaff}
                onSuccess={handleSuccess}
            />

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el registro del personal de salud.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
