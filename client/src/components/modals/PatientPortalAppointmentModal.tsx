import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
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
import { appointmentsAPI, healthStaffAPI } from '@/services/api'
import { Loader2, CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const appointmentSchema = z.object({
    staffId: z.string().min(1, 'El personal de salud es requerido'),
    appointmentDate: z.date({
        required_error: "La fecha es requerida",
    }),
    time: z.string().min(1, 'La hora es requerida'),
    type: z.string().min(1, 'El tipo es requerido'),
    reason: z.string().min(1, 'El motivo es requerido'),
    symptoms: z.string().optional(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface PatientPortalAppointmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    patientId: string
}

export default function PatientPortalAppointmentModal({
    open,
    onOpenChange,
    onSuccess,
    patientId,
}: PatientPortalAppointmentModalProps) {
    const { toast } = useToast()
    const [staff, setStaff] = useState<any[]>([])
    const [loadingResources, setLoadingResources] = useState(false)

    const form = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            staffId: '',
            type: 'CHECKUP',
            reason: '',
            symptoms: '',
            time: '09:00',
        },
    })

    useEffect(() => {
        if (open) {
            fetchStaff()
            form.reset({
                staffId: '',
                type: 'CHECKUP',
                reason: '',
                symptoms: '',
                time: '09:00',
            })
        }
    }, [open, form])

    const fetchStaff = async () => {
        try {
            setLoadingResources(true)
            const staffRes = await healthStaffAPI.getAll()
            setStaff(staffRes.data.data || [])
        } catch (error) {
            console.error('Failed to load specialists', error)
            toast({
                title: 'Error',
                description: 'Error al cargar lista de especialistas',
                variant: 'destructive',
            })
        } finally {
            setLoadingResources(false)
        }
    }

    const onSubmit = async (data: AppointmentFormData) => {
        if (!patientId) {
            toast({
                title: 'Error de Sesión',
                description: 'No se encontró el ID del paciente. Por favor cierre sesión e ingrese nuevamente para actualizar sus credenciales.',
                variant: 'destructive',
            })
            return
        }

        try {
            // Combine date and time
            const DateTime = new Date(data.appointmentDate)
            const [hours, minutes] = data.time.split(':')
            DateTime.setHours(parseInt(hours), parseInt(minutes))

            const payload = {
                ...data,
                patientId: patientId, // Auto-filled from prop
                status: 'SCHEDULED',
                appointmentDate: DateTime.toISOString(),
                time: DateTime.toISOString(), // Send full ISO string for backend startTime
            }

            await appointmentsAPI.create(payload)

            toast({
                title: 'Éxito',
                description: 'Cita programada correctamente. Recibirás una confirmación pronto.',
            })

            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'No se pudo agendar la cita',
                variant: 'destructive',
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Programar Nueva Cita</DialogTitle>
                    <DialogDescription>
                        Complete el formulario para solicitar una cita médica.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <FormField
                            control={form.control}
                            name="staffId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Especialista</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar especialista" />
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

                        <div className="grid grid-cols-2 gap-4">
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
                                                            "w-full pl-3 text-left font-normal",
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
                                        <FormLabel>Hora</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Cita</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="CONSULTATION">Consulta Médica</SelectItem>
                                            <SelectItem value="CHECKUP">Chequeo General</SelectItem>
                                            <SelectItem value="FOLLOW_UP">Seguimiento</SelectItem>
                                            <SelectItem value="TELEMEDICINE">Telemedicina</SelectItem>
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
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Motivo de la Visita</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Dolor de cabeza frecuente" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="symptoms"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Síntomas (Opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describa brevemente sus síntomas..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
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
                                Confirmar Cita
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
