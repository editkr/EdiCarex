import { useEffect, useState, useMemo } from 'react'
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
    FormDescription,
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
import { Loader2, CalendarIcon, Stethoscope, Clock, ShieldCheck, HeartPulse } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const MINSA_TYPES = [
    { value: 'CONS_MED_GRAL', label: 'Medicina General', duration: 20, upss: 'CONSULTA EXTERNA', color: 'bg-blue-500' },
    { value: 'CONS_EXT', label: 'Consulta Externa', duration: 20, upss: 'CONSULTA EXTERNA', color: 'bg-slate-500' },
    { value: 'CONTROL_PRENATAL', label: 'Control Prenatal', duration: 30, upss: 'OBSTETRICIA', color: 'bg-rose-500' },
    { value: 'CRED', label: 'C.R.E.D.', duration: 40, upss: 'CONSULTA EXTERNA (CRED)', color: 'bg-emerald-500' },
    { value: 'CONS_ODONTO', label: 'Odontología', duration: 30, upss: 'ODONTOLOGÍA', color: 'bg-orange-500' },
    { value: 'CONS_PSICO', label: 'Psicología', duration: 45, upss: 'PSICOLOGÍA', color: 'bg-indigo-500' },
    { value: 'CONS_NUTRI', label: 'Nutrición', duration: 30, upss: 'NUTRICIÓN', color: 'bg-lime-500' },
]

const appointmentSchema = z.object({
    patientId: z.string().min(1, 'El paciente es requerido'),
    staffId: z.string().min(1, 'El profesional es requerido'),
    appointmentDate: z.date({
        required_error: "La fecha es requerida",
    }),
    time: z.string().min(1, 'La hora es requerida').refine((val) => {
        const [hours] = val.split(':').map(Number);
        return hours >= 8 && hours < 18;
    }, { message: "El horario permitido es de 08:00 a 18:00" }),
    type: z.string().min(1, 'El tipo es requerido'),
    upss: z.string().min(1, 'La UPSS es requerida'),
    consultorio: z.string().min(1, 'El consultorio es requerido'),
    estimatedDuration: z.number().min(1),
    financiador: z.string().min(1, 'El financiador es requerido'),
    patientCondition: z.string().min(1, 'La condición es requerida'),
    reason: z.string().min(1, 'El motivo es requerido'),
    chiefComplaint: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().default('SCHEDULED'),
    priority: z.string().default('NORMAL'),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface AppointmentModalProps {
    isOpen: boolean
    onClose: () => void
    appointment?: any
    onSuccess: () => void
    defaultPatientId?: string
    defaultValues?: {
        appointmentDate?: Date
        time?: string
        serviceLabel?: string
        upss?: string
    }
}

export default function AppointmentModal({
    isOpen: open,
    onClose: onOpenChange,
    appointment,
    onSuccess,
    defaultPatientId,
    defaultValues,
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
            type: 'CONS_MED_GRAL',
            upss: 'CONSULTA EXTERNA',
            consultorio: 'Consultorio 01',
            estimatedDuration: 20,
            financiador: '02',
            patientCondition: 'CONTINUADOR',
            reason: '',
            chiefComplaint: '',
            notes: '',
            status: 'SCHEDULED',
            priority: 'NORMAL',
            time: '08:00',
        },
    })

    useEffect(() => {
        if (open) {
            fetchResources()
            if (appointment) {
                const date = new Date(appointment.appointmentDate)
                form.reset({
                    patientId: appointment.patientId,
                    staffId: appointment.healthStaffId || appointment.doctorId,
                    appointmentDate: date,
                    time: format(date, 'HH:mm'),
                    type: appointment.type || 'CONS_MED_GRAL',
                    upss: appointment.upss || 'CONSULTA EXTERNA',
                    consultorio: appointment.consultorio || 'Consultorio 01',
                    estimatedDuration: appointment.estimatedDuration || 20,
                    financiador: appointment.financiador || '02',
                    patientCondition: appointment.patientCondition || 'CONTINUADOR',
                    reason: appointment.reason || '',
                    chiefComplaint: appointment.chiefComplaint || '',
                    notes: appointment.notes || '',
                    status: appointment.status || 'SCHEDULED',
                    priority: appointment.priority || 'NORMAL',
                })
            } else if (defaultValues) {
                // Mapear serviceLabel a type si es posible
                const typeMeta = MINSA_TYPES.find(t => t.label === defaultValues.serviceLabel) ||
                    MINSA_TYPES.find(t => t.upss === defaultValues.upss)

                form.reset({
                    patientId: defaultPatientId || '',
                    staffId: '',
                    appointmentDate: defaultValues.appointmentDate || new Date(),
                    time: defaultValues.time || '08:00',
                    type: typeMeta?.value || 'CONS_MED_GRAL',
                    upss: defaultValues.upss || typeMeta?.upss || 'CONSULTA EXTERNA',
                    consultorio: 'Consultorio 01',
                    estimatedDuration: typeMeta?.duration || 20,
                    financiador: '02',
                    patientCondition: 'CONTINUADOR',
                    reason: '',
                    chiefComplaint: '',
                    notes: '',
                    status: 'SCHEDULED',
                    priority: 'NORMAL',
                })
            } else {
                form.reset({
                    patientId: defaultPatientId || '',
                    staffId: '',
                    type: 'CONS_MED_GRAL',
                    upss: 'CONSULTA EXTERNA',
                    consultorio: 'Consultorio 01',
                    estimatedDuration: 20,
                    financiador: '02',
                    patientCondition: 'CONTINUADOR',
                    reason: '',
                    chiefComplaint: '',
                    notes: '',
                    status: 'SCHEDULED',
                    priority: 'NORMAL',
                    time: '08:00',
                })
            }
        }
    }, [open, appointment, form, defaultPatientId, defaultValues])

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

    // Auto-completar UPSS y Duración según tipo
    const watchType = form.watch('type')
    useEffect(() => {
        const meta = MINSA_TYPES.find(t => t.value === watchType)
        if (meta) {
            form.setValue('upss', meta.upss)
            form.setValue('estimatedDuration', meta.duration)
        }
    }, [watchType, form])

    // Auto-completar financiador según paciente
    const watchPatientId = form.watch('patientId')
    useEffect(() => {
        const patient = patients.find(p => p.id === watchPatientId)
        if (patient) {
            // SIS es 02, ESSALUD 03, PAGANTE 01
            const provider = patient.insuranceProvider?.toUpperCase()
            if (provider === 'SIS') form.setValue('financiador', '02')
            else if (provider === 'ESSALUD') form.setValue('financiador', '03')
            else form.setValue('financiador', '01')
        }
    }, [watchPatientId, patients, form])

    const onSubmit = async (data: AppointmentFormData) => {
        try {
            const DateTime = new Date(data.appointmentDate)
            const [hours, minutes] = data.time.split(':')
            DateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

            const payload = {
                ...data,
                appointmentDate: DateTime.toISOString(),
            }

            if (appointment) {
                await appointmentsAPI.update(appointment.id, payload)
                toast({ title: 'Éxito', description: 'Cita actualizada correctamente' })
            } else {
                await appointmentsAPI.create(payload)
                toast({ title: 'Éxito', description: 'Cita programada correctamente' })
            }
            onSuccess()
            onOpenChange()
        } catch (error: any) {
            toast({
                title: 'Error de Validación',
                description: error.response?.data?.message || 'Verifique el horario y disponibilidad del profesional.',
                variant: 'destructive',
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto border-t-8 border-t-primary">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/10 p-2 rounded-xl">
                            <Stethoscope className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                                {appointment ? 'Modificar Registro de Cita' : 'Nueva Programación MINSA'}
                            </DialogTitle>
                            <DialogDescription className="font-medium text-slate-500">
                                Establecimiento: Centro de Salud Jorge Chávez (I-4)
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

                            {/* Sección Paciente y Profesional */}
                            <div className="space-y-5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" /> Datos de Atención
                                </h3>

                                <FormField
                                    control={form.control}
                                    name="patientId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">PACIENTE (DNI/Nombres)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!appointment}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                                                        <SelectValue placeholder="Seleccionar paciente" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {patients.map((p) => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.documentNumber} - {p.firstName} {p.lastName}
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
                                            <FormLabel className="font-bold">PROFESIONAL RESPONSABLE</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                                                        <SelectValue placeholder="Seleccionar profesional" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {staff.map((s: any) => (
                                                        <SelectItem key={s.id} value={s.id}>
                                                            {s.user?.firstName} {s.user?.lastName} ({s.profession}) — {s.licenseNumber}
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
                                        name="financiador"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-[10px] uppercase">Financiador</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-10 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="02">SIS (Gratuito)</SelectItem>
                                                        <SelectItem value="01">S.P. (Pagante)</SelectItem>
                                                        <SelectItem value="03">ESSALUD</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="patientCondition"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-[10px] uppercase">Condición</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-10 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="NUEVO">Nuevo</SelectItem>
                                                        <SelectItem value="CONTINUADOR">Continuador</SelectItem>
                                                        <SelectItem value="REINGRESANTE">Reingresante</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Sección Fecha y Modalidad */}
                            <div className="space-y-5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Horario y UPS
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="appointmentDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="font-bold">FECHA</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button variant="outline" className={cn("h-12 text-left font-bold", !field.value && "text-muted-foreground")}>
                                                                {field.value ? format(field.value, "dd/MM/yyyy") : <span>Elegir</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date() && !appointment} initialFocus />
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
                                                <FormLabel className="font-bold">HORA (08-18h)</FormLabel>
                                                <FormControl>
                                                    <Input type="time" className="h-12 font-bold" min="08:00" max="18:00" {...field} />
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
                                            <FormLabel className="font-bold">TIPO DE ATENCIÓN HIS</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 border-2 border-primary/20">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {MINSA_TYPES.map(t => (
                                                        <SelectItem key={t.value} value={t.value}>
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("h-2 w-2 rounded-full", t.color)} />
                                                                {t.label}
                                                            </div>
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
                                        name="upss"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold uppercase">UPSS ASIGNADA</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="h-9 bg-slate-100 text-[10px] font-bold truncate" disabled />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="consultorio"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold uppercase">CONSULTORIO</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-9 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {[1, 2, 3, 4, 5, 6].map(n => (
                                                            <SelectItem key={n} value={`Consultorio 0${n}`}>Consultorio 0{n}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Motivo y Observaciones */}
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <HeartPulse className="h-4 w-4" /> Motivo y Clínica
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="reason"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">MOTIVO DE CITA (Resumen)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej. Control de anemia, Fiebre persistente..." className="h-11" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="priority"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">PRIORIDAD</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="HIGH">🔴 Emergencia / Urgencia</SelectItem>
                                                        <SelectItem value="NORMAL">🟡 Atención Estándar</SelectItem>
                                                        <SelectItem value="LOW">🔵 Preventivo / Seguimiento</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="chiefComplaint"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold flex justify-between">
                                                <span>RELATO / SÍNTOMAS (Para Manual HIS)</span>
                                                <Badge className="bg-primary/20 text-primary hover:bg-primary/20 text-[8px] uppercase">Sugerido para Triaje IA</Badge>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Describa los síntomas principales encontrados en la admisión..." className="min-h-[80px] resize-none border-dashed" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t">
                            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase">
                                <Clock className="h-4 w-4" />
                                <span>Duración estimada: {form.watch('estimatedDuration')} MIN.</span>
                            </div>
                            <div className="flex gap-3">
                                <Button type="button" variant="ghost" onClick={() => onOpenChange()} className="font-bold text-slate-500">
                                    DESCARTAR
                                </Button>
                                <Button type="submit" className="h-12 px-8 rounded-xl font-black tracking-widest bg-primary hover:bg-primary/90" disabled={form.formState.isSubmitting || loadingResources}>
                                    {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {appointment ? 'ACTUALIZAR CITA' : 'CONFIRMAR PROGRAMACIÓN'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
