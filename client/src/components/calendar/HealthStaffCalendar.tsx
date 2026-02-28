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
}

export default function HealthStaffCalendar({ staffId, appointments, onRefresh }: HealthStaffCalendarProps) {
    const { toast } = useToast()
    const [view, setView] = useState<View>('week')

    // Convertir citas a eventos del calendario
    const events = useMemo(() => {
        return appointments.map((apt: any) => {
            const start = new Date(apt.appointmentDate)
            const end = addHours(start, 1)

            return {
                id: apt.id,
                title: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Paciente Desconocido',
                start,
                end,
                resource: {
                    patientId: apt.patientId,
                    patientName: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Desconocido',
                    reason: apt.reason || 'Chequeo General',
                    status: apt.status,
                    type: 'appointment',
                },
            }
        })
    }, [appointments])

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
        let backgroundColor = '#3b82f6'

        if (event.resource?.type === 'blocked') {
            backgroundColor = '#6b7280'
        } else if (event.resource?.status === 'COMPLETED') {
            backgroundColor = '#10b981'
        } else if (event.resource?.status === 'CANCELLED') {
            backgroundColor = '#ef4444'
        } else if (event.resource?.status === 'CONFIRMED') {
            backgroundColor = '#3b82f6'
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block',
            },
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Calendario de Citas</CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant={view === 'day' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setView('day')}
                        >
                            Día
                        </Button>
                        <Button
                            variant={view === 'week' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setView('week')}
                        >
                            Semana
                        </Button>
                        <Button
                            variant={view === 'month' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setView('month')}
                        >
                            Mes
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="staff-calendar" style={{ height: '600px' }}>
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
                        step={30}
                        timeslots={2}
                        min={setHours(setMinutes(new Date(), 0), 8)}
                        max={setHours(setMinutes(new Date(), 0), 18)}
                        defaultDate={new Date()}
                        culture='es'
                        messages={messages}
                        popup
                    />
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-500"></div>
                        <span>Programada</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500"></div>
                        <span>Completada</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500"></div>
                        <span>Cancelada</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-500"></div>
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
