import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { appointmentsAPI, patientsAPI, healthStaffAPI } from '@/services/api'
import { Loader2, CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const appointmentSchema = z.object({
    patientId: z.string().min(1, 'El paciente es requerido'),
    staffId: z.string().min(1, 'El personal de salud es requerido'),
    appointmentDate: z.date({
        required_error: "La fecha es requerida",
    }),
    time: z.string().min(1, 'La hora es requerida'),
    type: z.string().min(1, 'El tipo es requerido'),
    reason: z.string().min(1, 'El motivo es requerido'),
    symptoms: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().default('SCHEDULED'),
    priority: z.string().default('NORMAL'),
    duration: z.string().default("60"), // UI helper only, stored as string for Select
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface AppointmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment?: any
    onSuccess: () => void
    defaultPatientId?: string
}

export default function AppointmentModal({
    open,
    onOpenChange,
    appointment,
    onSuccess,
    defaultPatientId,
}: AppointmentModalProps) {
    const { toast } = useToast()
    const [patients, setPatients] = useState<any[]>([])
    const [staff, setStaff] = useState<any[]>([])
    const [loadingResources, setLoadingResources] = useState(false)

    const form = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            patientId: '',
            staffId: '',
            type: 'CHECKUP',
            reason: '',
            symptoms: '',
            notes: '',
            status: 'SCHEDULED',
            priority: 'NORMAL',
            time: '09:00',
            duration: "60",
        },
    })

    useEffect(() => {
        if (open) {
            fetchResources()
            if (appointment) {
                const date = new Date(appointment.appointmentDate)
                form.reset({
                    patientId: appointment.patientId,
                    staffId: appointment.staffId,
                    appointmentDate: date,
                    time: format(date, 'HH:mm'),
                    type: appointment.type || 'CHECKUP',
                    reason: appointment.reason || '',
                    symptoms: appointment.symptoms || '',
                    notes: appointment.notes || '',
                    status: appointment.status || 'SCHEDULED',
                    priority: appointment.priority || 'NORMAL',
                    duration: (() => {
                        if (!appointment.endTime || !appointment.appointmentDate) return "60"
                        const diff = differenceInMinutes(new Date(appointment.endTime), new Date(appointment.appointmentDate))
                        const validOptions = ["15", "30", "45", "60", "90", "120"]
                        const diffString = String(diff)
                        return validOptions.includes(diffString) ? diffString : "60"
                    })(),
                })
            } else {
                form.reset({
                    patientId: defaultPatientId || '',
                    staffId: '',
                    type: 'CHECKUP',
                    reason: '',
                    symptoms: '',
                    notes: '',
                    status: 'SCHEDULED',
                    priority: 'NORMAL',
                    time: '09:00',
                    duration: "60",
                })
            }
        }
    }, [open, appointment, form])

    const fetchResources = async () => {
        try {
            setLoadingResources(true)
            const [patientsRes, staffRes] = await Promise.all([
                patientsAPI.getAll(),
                healthStaffAPI.getAll()
            ])
            setPatients(patientsRes.data.data || [])
            setStaff(staffRes.data.data || [])
        } catch (error) {
            console.error('Failed to load resources', error)
            toast({
                title: 'Error',
                description: 'Error al cargar pacientes o personal',
                variant: 'destructive',
            })
        } finally {
            setLoadingResources(false)
        }
    }

    const onSubmit = async (data: AppointmentFormData) => {
        try {
            // Combine date and time
            const DateTime = new Date(data.appointmentDate)
            const [hours, minutes] = data.time.split(':')
            DateTime.setHours(parseInt(hours), parseInt(minutes))

            // Calculate endTime
            const durationInMinutes = parseInt(data.duration)
            const EndDateTime = new Date(DateTime.getTime() + durationInMinutes * 60000)

            const { duration, ...restData } = data // Remove duration from payload

            const payload = {
                ...restData,
                appointmentDate: DateTime.toISOString(),
                time: DateTime.toISOString(), // Send full ISO string for backend startTime
                endTime: EndDateTime.toISOString(),
            }

            if (appointment) {
                await appointmentsAPI.update(appointment.id, payload)
                toast({
                    title: 'Éxito',
                    description: 'Cita actualizada correctamente',
                })
            } else {
                await appointmentsAPI.create(payload)
                toast({
                    title: 'Éxito',
                    description: 'Cita programada correctamente',
                })
            }
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Algo salió mal',
                variant: 'destructive',
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{appointment ? 'Editar Cita' : 'Programar Cita'}</DialogTitle>
                    <DialogDescription>
                        {appointment
                            ? 'Actualizar detalles de la cita.'
                            : 'Crear una nueva cita. El triaje AI analizará los síntomas.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <FormField
                                control={form.control}
                                name="patientId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Paciente {appointment && '(No editable)'}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={!!appointment}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Seleccionar paciente" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {patients.map((patient) => (
                                                    <SelectItem key={patient.id} value={patient.id}>
                                                        {patient.firstName} {patient.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="staffId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Personal de Salud</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Seleccionar personal" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {staff.map((doc: any) => (
                                                    <SelectItem key={doc.id} value={doc.id}>
                                                        {doc.user?.firstName} {doc.user?.lastName} ({doc.specialization || 'General'})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="appointmentDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full h-11 pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: es })
                                                        ) : (
                                                            <span>Elegir fecha</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date()
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hora Inicio</FormLabel>
                                        <FormControl>
                                            <Input type="time" className="h-11" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duración</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Seleccionar duración" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="15">15 min</SelectItem>
                                                <SelectItem value="30">30 min</SelectItem>
                                                <SelectItem value="45">45 min</SelectItem>
                                                <SelectItem value="60">1 hora</SelectItem>
                                                <SelectItem value="90">1 hora 30 min</SelectItem>
                                                <SelectItem value="120">2 horas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Seleccionar tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="CONSULTATION">Consulta Médica</SelectItem>
                                                <SelectItem value="CHECKUP">Chequeo General</SelectItem>
                                                <SelectItem value="EMERGENCY">Emergencia</SelectItem>
                                                <SelectItem value="FOLLOW_UP">Seguimiento</SelectItem>
                                                <SelectItem value="SURGERY">Cirugía</SelectItem>
                                                <SelectItem value="TELEMEDICINE">Telemedicina</SelectItem>
                                                <SelectItem value="THERAPY">Terapia / Rehabilitación</SelectItem>
                                                <SelectItem value="PROCEDURE">Procedimiento Especial</SelectItem>
                                                <SelectItem value="LABORATORY">Laboratorio / Examen</SelectItem>
                                                <SelectItem value="ROUTINE">Rutina</SelectItem>
                                                <SelectItem value="IMAGING">Imagenología (Rayos X, etc.)</SelectItem>
                                                <SelectItem value="DENTISTRY">Odontología</SelectItem>
                                                <SelectItem value="NUTRITION">Nutrición</SelectItem>
                                                <SelectItem value="MENTAL_HEALTH">Salud Mental</SelectItem>
                                                <SelectItem value="VACCINATION">Vacunación</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Estado" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="SCHEDULED">Programada</SelectItem>
                                                <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                                                <SelectItem value="COMPLETED">Completada</SelectItem>
                                                <SelectItem value="CANCELLED">Cancelada</SelectItem>
                                                <SelectItem value="NO_SHOW">No Asistió</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prioridad</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Prioridad" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="HIGH">🔴 Alta</SelectItem>
                                                <SelectItem value="NORMAL">🟡 Media</SelectItem>
                                                <SelectItem value="LOW">🔵 Baja</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Motivo de la Visita</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. Chequeo anual, Dolor de cabeza, etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="symptoms"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="flex items-center gap-2">
                                            Síntomas
                                            <span className="text-xs font-normal text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full text-primary">
                                                Triaje IA
                                            </span>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describa los síntomas detalladamente para que la IA determine el nivel de triaje..."
                                                className="resize-none min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Notas Adicionales</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Observaciones, instrucciones especiales o recordatorios..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting || loadingResources}>
                                {form.formState.isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {appointment ? 'Guardar Cambios' : 'Programar'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
