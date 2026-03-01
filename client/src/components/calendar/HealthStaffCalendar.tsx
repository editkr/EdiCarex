import { useState, useCallback, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar'
// @ts-ignore - withDragAndDrop has type issues
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay, addHours, setHours, setMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { appointmentsAPI } from '@/services/api'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import './HealthStaffCalendar.css'

const locales = {
    'es': es,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

// @ts-ignore
const DnDCalendar = withDragAndDrop(Calendar)

interface HealthStaffCalendarProps {
    staffId: string
    appointments: any[]
    onRefresh: () => void
}

const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay eventos en este rango',
    showMore: (total: number) => `+ Ver ${total} más`,
}

const CalendarEvent = ({ event }: any) => (
    <div className="flex flex-col h-full">
        <span className="font-black text-[10px] leading-tight truncate">{event.title}</span>
        <span className="text-[10px] opacity-80 font-medium truncate uppercase tracking-tighter">
            {event.resource?.reason || 'Consulta'}
        </span>
    </div>
)

export default function HealthStaffCalendar({ staffId, appointments, onRefresh }: HealthStaffCalendarProps) {
    const { toast } = useToast()
    const [view, setView] = useState<View>('week')

    // Convertir citas a eventos del calendario
    const events = useMemo(() => {
        return appointments.map((apt: any) => {
            const start = new Date(apt.appointmentDate)
            // Usar duración estimada o 20 min por defecto
            const duration = apt.estimatedDuration || 20
            const end = new Date(start.getTime() + duration * 60000)

            return {
                id: apt.id,
                title: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Paciente Desconocido',
                start,
                end,
                resource: {
                    patientId: apt.patientId,
                    patientName: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Desconocido',
                    reason: apt.reason || apt.type || 'Consulta Médica',
                    status: apt.status,
                    type: 'appointment',
                },
            }
        })
    }, [appointments])

    const visibleEventsCount = useMemo(() => events.length, [events])

    // Manejar selección de slot
    const handleSelectSlot = useCallback(
        (slotInfo: SlotInfo) => {
            toast({
                title: 'Crear Cita',
                description: `Hora seleccionada: ${format(slotInfo.start, 'PPpp', { locale: es })}`,
            })
        },
        [toast]
    )

    // Manejar clic en evento
    const handleSelectEvent = useCallback(
        (event: any) => {
            toast({
                title: event.title || 'Cita',
                description: `${event.resource?.reason} - ${event.resource?.status}`,
            })
        },
        [toast]
    )

    // Manejar drag & drop
    const handleEventDrop = useCallback(
        async (data: any) => {
            const { event, start } = data
            try {
                await appointmentsAPI.update(event.id, {
                    appointmentDate: start.toISOString(),
                })

                toast({
                    title: 'Cita Movida',
                    description: `Movida a ${format(start, 'PPpp', { locale: es })}`,
                })

                onRefresh()
            } catch (error: any) {
                toast({
                    title: 'Error',
                    description: error.response?.data?.message || 'Error al mover la cita',
                    variant: 'destructive',
                })
            }
        },
        [toast, onRefresh]
    )

    // Manejar resize
    const handleEventResize = useCallback(
        async (data: any) => {
            const { event, start } = data
            try {
                await appointmentsAPI.update(event.id, {
                    appointmentDate: start.toISOString(),
                })

                toast({
                    title: 'Cita Reprogramada',
                    description: 'Duración actualizada',
                })

                onRefresh()
            } catch (error: any) {
                toast({
                    title: 'Error',
                    description: error.response?.data?.message || 'Error al reprogramar la cita',
                    variant: 'destructive',
                })
            }
        },
        [toast, onRefresh]
    )

    // Estilos personalizados
    const eventStyleGetter = (event: any) => {
        let backgroundColor = 'hsl(var(--primary))'

        const statusMap: Record<string, string> = {
            'SCHEDULED': '#3b82f6', // Azul
            'CONFIRMED': '#3b82f6', // Azul
            'IN_PROGRESS': '#f59e0b', // Naranja
            'COMPLETED': '#10b981', // Verde
            'CANCELLED': '#ef4444', // Rojo
            'NO_SHOW': '#6b7280', // Gris
        }

        backgroundColor = statusMap[event.resource?.status] || backgroundColor

        return {
            className: cn("calendar-event-card", event.resource?.status.toLowerCase()),
            style: {
                backgroundColor,
            },
        }
    }

    const slotPropGetter = (date: Date) => {
        const hour = date.getHours()
        if (hour === 12) {
            return {
                className: 'lunch-break-slot',
            }
        }
        return {}
    }

    const dayPropGetter = (date: Date) => {
        const day = date.getDay()
        if (day === 0) { // Domingo
            return {
                className: 'non-working-day',
            }
        }
        return {}
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            Agenda de Atención
                            <Badge variant="secondary" className="font-bold text-xs">
                                {visibleEventsCount} Citas
                            </Badge>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground font-medium">Horario Oficial: 08:00 AM - 18:00 PM</p>
                    </div>
                    <div className="flex gap-1 bg-muted p-1 rounded-lg border">
                        <Button
                            variant={view === 'day' ? 'default' : 'ghost'}
                            size="sm"
                            className="text-xs font-bold uppercase h-8"
                            onClick={() => setView('day')}
                        >
                            Día
                        </Button>
                        <Button
                            variant={view === 'week' ? 'default' : 'ghost'}
                            size="sm"
                            className="text-xs font-bold uppercase h-8"
                            onClick={() => setView('week')}
                        >
                            Semana
                        </Button>
                        <Button
                            variant={view === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            className="text-xs font-bold uppercase h-8"
                            onClick={() => setView('month')}
                        >
                            Mes
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="staff-calendar">
                    {/* @ts-ignore */}
                    <DnDCalendar
                        localizer={localizer}
                        events={events}
                        view={view}
                        onView={setView}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        onEventDrop={handleEventDrop}
                        onEventResize={handleEventResize}
                        selectable
                        resizable
                        eventPropGetter={eventStyleGetter}
                        slotPropGetter={slotPropGetter}
                        dayPropGetter={dayPropGetter}
                        step={20}
                        timeslots={3}
                        min={new Date(new Date().setHours(8, 0, 0, 0))}
                        max={new Date(new Date().setHours(18, 0, 0, 0))}
                        defaultView="week"
                        culture='es'
                        messages={messages}
                        popup
                        components={{
                            event: CalendarEvent,
                        }}
                    />
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-6 p-4 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                        <span>Programada</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></div>
                        <span>En Progreso</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
                        <span>Completada</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm"></div>
                        <span>Cancelada</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-500 shadow-sm"></div>
                        <span>Bloqueada</span>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">📅 Funciones del Calendario:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>Arrastrar y Soltar:</strong> Arrastra citas para moverlas</li>
                        <li>• <strong>Redimensionar:</strong> Arrastra los bordes para cambiar la duración</li>
                        <li>• <strong>Crear:</strong> Haz clic en un espacio vacío para crear una cita</li>
                        <li>• <strong>Ver:</strong> Haz clic en un evento para ver detalles</li>
                        <li>• <strong>Código de Colores:</strong> Azul=Programada, Verde=Completada, Rojo=Cancelada</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}
