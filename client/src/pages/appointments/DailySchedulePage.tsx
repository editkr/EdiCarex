import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, addDays, startOfDay, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { appointmentsAPI } from '@/services/api'
import { useOrganization } from '@/contexts/OrganizationContext'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    User,
    HelpCircle,
} from 'lucide-react'
import AppointmentModal from '@/components/modals/AppointmentModal'
import { cn } from '@/lib/utils'

const SERVICES = [
    { id: 'MED', label: 'Medicina General', upss: 'CONSULTA EXTERNA', color: 'bg-blue-500' },
    { id: 'OBS', label: 'Obstetricia', upss: 'OBSTETRICIA', color: 'bg-rose-500' },
    { id: 'ODO', label: 'Odontología', upss: 'ODONTOLOGÍA', color: 'bg-orange-500' },
    { id: 'PSI', label: 'Psicología', upss: 'PSICOLOGÍA', color: 'bg-indigo-500' },
    { id: 'NUT', label: 'Nutrición', upss: 'NUTRICIÓN', color: 'bg-lime-500' },
    { id: 'VAC', label: 'C.R.E.D. / Vacunas', upss: 'CONSULTA EXTERNA (CRED)', color: 'bg-emerald-500' },
]

const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8
    const minutes = (i % 2) * 30
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
})

export default function DailySchedulePage() {
    const { config } = useOrganization()
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ time: string, serviceId: string } | null>(null)

    const { data: appointmentsRes, isLoading, refetch } = useQuery({
        queryKey: ['appointments', 'daily', format(selectedDate, 'yyyy-MM-dd')],
        queryFn: () => appointmentsAPI.getAll({
            startDate: startOfDay(selectedDate).toISOString(),
            endDate: addDays(startOfDay(selectedDate), 1).toISOString(),
        }),
        refetchInterval: 60000, // Sync every minute
    })

    const appointments = useMemo(() => appointmentsRes?.data?.data || [], [appointmentsRes])

    const getAppointmentsForService = (upss: string) => {
        return appointments.filter((app: any) => app.upss === upss)
    }

    const handleSlotClick = (time: string, serviceId: string) => {
        setSelectedSlot({ time, serviceId })
        setIsModalOpen(true)
    }

    const nextDay = () => setSelectedDate(prev => addDays(prev, 1))
    const prevDay = () => setSelectedDate(prev => addDays(prev, -1))
    const goToToday = () => setSelectedDate(new Date())

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
                        AGENDA DIARIA MINSA
                        <Badge variant="outline" className="border-primary text-primary font-bold">I-4 CSJC</Badge>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Establecimiento: {config?.hospitalName || 'Centro de Salud Jorge Chávez'}
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <Button variant="ghost" size="icon" onClick={prevDay} className="h-9 w-9 rounded-lg hover:bg-white">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="px-4 flex items-center gap-2 font-black text-sm uppercase">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: es })}
                    </div>
                    <Button variant="ghost" size="icon" onClick={nextDay} className="h-9 w-9 rounded-lg hover:bg-white">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    <div className="w-px h-6 bg-slate-300 mx-1" />
                    {!isSameDay(selectedDate, new Date()) && (
                        <Button variant="ghost" size="sm" onClick={goToToday} className="font-bold text-xs uppercase hover:bg-white">
                            Hoy
                        </Button>
                    )}
                </div>
            </div>

            {/* Grid de Servicios */}
            <div className="relative overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
                <div className="min-w-[1200px] grid grid-cols-[80px_repeat(6,1fr)] bg-white divide-x divide-slate-100">
                    {/* Header de Columnas */}
                    <div className="p-4 bg-slate-100 font-black text-[10px] text-slate-500 flex items-center justify-center border-b border-slate-200 uppercase tracking-widest">
                        HORA
                    </div>
                    {SERVICES.map(service => (
                        <div key={service.id} className="p-4 bg-slate-50 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <div className={cn("h-3 w-3 rounded-full shrink-0", service.color)} />
                                <span className="font-black text-xs uppercase tracking-tight truncate">{service.label}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 block mt-1 truncate">{service.upss}</span>
                        </div>
                    ))}

                    {/* Filas de Tiempo */}
                    {TIME_SLOTS.map(time => (
                        <>
                            <div key={`time-${time}`} className="h-20 flex items-start justify-center pt-3 border-b border-slate-100 bg-slate-50/50">
                                <span className="text-xs font-black text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {time}
                                </span>
                            </div>
                            {SERVICES.map(service => {
                                const serviceAppointments = getAppointmentsForService(service.upss)
                                const appAtSlot = serviceAppointments.find((app: any) => {
                                    const appTime = format(new Date(app.appointmentDate), 'HH:mm')
                                    return appTime === time
                                })

                                return (
                                    <div
                                        key={`${service.id}-${time}`}
                                        className={cn(
                                            "h-20 p-1 border-b border-slate-100 relative group transition-colors",
                                            !appAtSlot && "hover:bg-slate-50 cursor-pointer"
                                        )}
                                        onClick={() => !appAtSlot && handleSlotClick(time, service.id)}
                                    >
                                        {isLoading ? (
                                            <Skeleton className="h-full w-full rounded-lg" />
                                        ) : appAtSlot ? (
                                            <Card className={cn(
                                                "h-full border-l-4 shadow-sm overflow-hidden",
                                                appAtSlot.status === 'COMPLETED' ? "border-l-emerald-500 bg-emerald-50" :
                                                    appAtSlot.status === 'CANCELLED' ? "border-l-slate-300 bg-slate-50" :
                                                        "border-l-primary bg-primary/5"
                                            )}>
                                                <div className="p-2 cursor-pointer hover:bg-slate-100/50 h-full" onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.location.href = `/appointments/${appAtSlot.id}`
                                                }}>
                                                    <div className="flex items-start justify-between">
                                                        <span className="font-black text-[10px] truncate block text-slate-900">
                                                            {appAtSlot.patient?.firstName} {appAtSlot.patient?.lastName}
                                                        </span>
                                                        <Badge className="text-[8px] h-3 px-1" variant={appAtSlot.status === 'COMPLETED' ? 'success' : 'default'}>
                                                            {appAtSlot.status === 'COMPLETED' ? 'OK' : 'PEND'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1 text-slate-500 font-bold text-[8px] uppercase">
                                                        <User className="w-2.5 h-2.5" />
                                                        <span className="truncate">{appAtSlot.healthStaff?.user?.lastName || appAtSlot.doctor?.user?.lastName}</span>
                                                    </div>
                                                    <div className="text-[8px] mt-0.5 font-medium text-slate-400 line-clamp-1 italic">
                                                        Obs: {appAtSlot.reason || 'Sin observación'}
                                                    </div>
                                                </div>
                                            </Card>
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-white p-1 rounded-full shadow-md border border-slate-200">
                                                    <Plus className="h-4 w-4 text-primary" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </>
                    ))}
                </div>
            </div>

            {/* Ayuda/Leyenda */}
            <div className="flex items-center gap-6 p-4 bg-white rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <HelpCircle className="h-4 w-4 text-slate-400" />
                    LEYENDA:
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 font-bold text-[10px] text-slate-600 uppercase">
                        <div className="h-2 w-2 rounded-full bg-blue-500" /> Medicina
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-[10px] text-slate-600 uppercase">
                        <div className="h-2 w-2 rounded-full bg-rose-500" /> Obstetricia
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-[10px] text-slate-600 uppercase">
                        <div className="h-2 w-2 rounded-full bg-orange-500" /> Odonto
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-[10px] text-slate-600 uppercase">
                        <div className="h-2 w-2 rounded-full bg-indigo-500" /> Psico
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-[10px] text-slate-600 uppercase">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" /> CRED/Vacunas
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <AppointmentModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onSuccess={() => {
                        refetch()
                        setIsModalOpen(false)
                        setSelectedSlot(null)
                    }}
                    appointment={selectedSlot ? {
                        appointmentDate: selectedDate.toISOString(),
                        time: selectedSlot.time,
                        type: SERVICES.find(s => s.id === selectedSlot.serviceId)?.id === 'MED' ? 'CONS_MED_GRAL' :
                            SERVICES.find(s => s.id === selectedSlot.serviceId)?.id === 'OBS' ? 'CONTROL_PRENATAL' :
                                SERVICES.find(s => s.id === selectedSlot.serviceId)?.id === 'ODO' ? 'CONS_ODONTO' :
                                    SERVICES.find(s => s.id === selectedSlot.serviceId)?.id === 'PSI' ? 'CONS_PSICO' :
                                        SERVICES.find(s => s.id === selectedSlot.serviceId)?.id === 'NUT' ? 'CONS_NUTRI' : 'CRED',
                        upss: SERVICES.find(s => s.id === selectedSlot.serviceId)?.upss
                    } : null}
                />
            )}
        </div>
    )
}
