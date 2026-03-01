import { useEffect, useState, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { healthStaffAPI } from '@/services/api'
import { Loader2, Upload, User, Clock, ShieldAlert } from 'lucide-react'
import { addMonths, format } from 'date-fns'

// Schema for staff form
const staffSchema = z.object({
    // User fields
    firstName: z.string().min(2, 'El nombre es requerido'),
    lastName: z.string().min(2, 'El apellido es requerido'),
    dniNumber: z.string().length(8, 'El DNI debe tener exactamente 8 dígitos').regex(/^\d+$/, 'Solo números permitidos'),
    email: z.string().email('Correo electrónico inválido').optional().or(z.literal('')),
    phone: z.string().length(9, 'El teléfono debe tener exactamente 9 dígitos').regex(/^9\d+$/, 'Debe empezar con 9 (Formato peruano)'),
    address: z.string().optional(),
    avatar: z.string().optional(),

    // MINSA RRHH Fields
    profession: z.string().min(1, 'La profesión es requerida'),
    specialtyArea: z.string().optional(),

    // Colegiatura
    collegiateBody: z.string().optional(),
    licenseNumber: z.string().optional(),
    collegiateStatus: z.string().optional(),
    collegiateExpiresAt: z.string().optional(),

    // Contrato
    contractType: z.string().min(1, 'El tipo de contrato es requerido'),
    contractStartDate: z.string().optional(),
    contractEndDate: z.string().optional(),
    serumsCycle: z.string().optional(),

    minsaProgram: z.string().optional(),
    workShift: z.string().optional(),
    weeklyHours: z.number().int().optional(),

    specialtyId: z.string().optional(),
    specialization: z.string().optional(),
    yearsExperience: z.string().refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
        message: 'La experiencia debe ser un número positivo',
    }).optional(),
    bio: z.string().optional(),
    isAvailable: z.boolean().default(true),
    schedules: z.array(z.any()).optional(),
})

type StaffFormData = z.infer<typeof staffSchema>

interface HealthStaffModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    staff?: any // If provided, we are editing
    onSuccess: () => void
}

export default function HealthStaffModal({
    open,
    onOpenChange,
    staff,
    onSuccess,
}: HealthStaffModalProps) {
    const { toast } = useToast()
    const [scheduleItems, setScheduleItems] = useState<{ dayOfWeek: number; enabled: boolean; startTime: string; endTime: string }[]>([])
    const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([])

    const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

    const form = useForm<StaffFormData>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            dniNumber: '',
            email: '',
            phone: '',
            address: '',
            avatar: '',
            profession: '',
            specialtyArea: '',
            collegiateBody: '',
            licenseNumber: '',
            collegiateStatus: 'HABILITADO',
            collegiateExpiresAt: '',
            contractType: '',
            contractStartDate: '',
            contractEndDate: '',
            serumsCycle: '',
            minsaProgram: 'NINGUNO',
            workShift: 'MAÑANA',
            weeklyHours: 36,
            specialtyId: '',
            specialization: '',
            yearsExperience: '',
            bio: '',
            isAvailable: true,
        },
    })

    const watchProfession = useWatch({ control: form.control, name: 'profession' })
    const watchContractType = useWatch({ control: form.control, name: 'contractType' })
    const watchContractStartDate = useWatch({ control: form.control, name: 'contractStartDate' })

    // UI Lógicas Dinámicas MINSA
    const requiresColegiatura = useMemo(() => {
        const exempt = ['TECNICO_ENFERMERIA', 'TECNICO_FARMACIA', 'ADMINISTRATIVO', '']
        return !exempt.includes(watchProfession)
    }, [watchProfession])

    const isTecnologoMedico = watchProfession === 'TECNOLOGO_MEDICO'

    const collegiateBodyLabel = useMemo(() => {
        switch (watchProfession) {
            case 'MEDICO_CIRUJANO': return { label: 'Número CMP', desc: 'Colegio Médico del Perú (Habilitación obligatoria)', body: 'CMP' }
            case 'ENFERMERA': return { label: 'Número CEP', desc: 'Colegio de Enfermeros del Perú', body: 'CEP' }
            case 'OBSTETRIZ': return { label: 'Número COP', desc: 'Colegio de Obstetras del Perú', body: 'COP' }
            case 'ODONTOLOGO': return { label: 'Número CDP', desc: 'Colegio Odontológico del Perú', body: 'CDP' }
            case 'PSICOLOGO': return { label: 'Número CPsP', desc: 'Colegio de Psicólogos del Perú', body: 'CPsP' }
            case 'NUTRICIONISTA': return { label: 'Número CNP', desc: 'Colegio de Nutricionistas del Perú', body: 'CNP' }
            case 'TECNOLOGO_MEDICO': return { label: 'Número CTM', desc: 'Colegio de Tecnólogos Médicos del Perú', body: 'CTM' }
            case 'QUIMICO_FARMACEUTICO': return { label: 'Número CQF', desc: 'Colegio Químico Farmacéutico del Perú', body: 'CQF' }
            case 'TRABAJADOR_SOCIAL': return { label: 'Número CTSP', desc: 'Colegio de Trabajadores Sociales del Perú', body: 'CTSP' }
            default: return { label: 'Colegiatura', desc: '', body: '' }
        }
    }, [watchProfession])

    // Lógica Automática para Cambios de Profesión
    useEffect(() => {
        if (!open) return;
        if (watchProfession === 'ADMINISTRATIVO') {
            form.setValue('weeklyHours', 40);
        } else if (watchProfession) {
            form.setValue('weeklyHours', 36);
        }

        if (requiresColegiatura) {
            form.setValue('collegiateBody', collegiateBodyLabel.body);
        } else {
            form.setValue('collegiateBody', 'NO_APLICA');
            form.setValue('collegiateStatus', 'NO_APLICA');
            form.setValue('licenseNumber', '');
        }
    }, [watchProfession, open, form, requiresColegiatura, collegiateBodyLabel.body])

    // Lógica Automática para Contrato SERUMS
    useEffect(() => {
        if (!open) return;
        if (watchContractType === 'SERUMS' && watchContractStartDate) {
            try {
                const start = new Date(watchContractStartDate);
                // Exactamente 12 meses (restamos un día al fin, o sumamos un año depende criterio)
                const end = addMonths(start, 12);
                form.setValue('contractEndDate', format(end, 'yyyy-MM-dd'));
            } catch (e) { }
        }
        if (watchContractType === 'NOMBRADO') {
            form.setValue('contractEndDate', ''); // Indefinido
        }
    }, [watchContractType, watchContractStartDate, open, form])

    useEffect(() => {
        if (open) {
            if (staff?.schedules && staff.schedules.length > 0) {
                const items = Array.from({ length: 7 }, (_, i) => {
                    const existing = staff.schedules.find((s: any) => s.dayOfWeek === i)
                    return {
                        dayOfWeek: i,
                        enabled: !!existing,
                        startTime: existing?.startTime || '08:00',
                        endTime: existing?.endTime || '14:00'
                    }
                })
                setScheduleItems(items)
            } else {
                setScheduleItems(Array.from({ length: 7 }, (_, i) => ({
                    dayOfWeek: i,
                    enabled: i >= 1 && i <= 6, // Lun - Sab
                    startTime: '08:00',
                    endTime: '14:00' // Jornada 6 horas
                })))
            }

            const fetchSpecialties = async () => {
                try {
                    const res = await healthStaffAPI.getSpecialties()
                    setSpecialties(res.data || [])
                } catch (error) {
                    console.error('Error fetching specialties:', error)
                }
            }
            fetchSpecialties()

            if (staff) {
                form.reset({
                    firstName: staff.user?.firstName || '',
                    lastName: staff.user?.lastName || '',
                    dniNumber: staff.dniNumber || '',
                    email: staff.user?.email || '',
                    phone: staff.user?.phone || '',
                    address: staff.user?.address || '',
                    avatar: staff.user?.avatar || '',
                    specialtyId: staff.specialtyId || '',
                    specialization: staff.specialization || '',
                    licenseNumber: staff.licenseNumber || '',
                    collegiateBody: staff.collegiateBody || '',
                    collegiateStatus: staff.collegiateStatus || 'HABILITADO',
                    collegiateExpiresAt: staff.collegiateExpiresAt ? staff.collegiateExpiresAt.split('T')[0] : '',
                    profession: staff.profession || '',
                    specialtyArea: staff.specialtyArea || '',
                    contractType: staff.contractType || '',
                    contractStartDate: staff.contractStartDate ? staff.contractStartDate.split('T')[0] : '',
                    contractEndDate: staff.contractEndDate ? staff.contractEndDate.split('T')[0] : '',
                    serumsCycle: staff.serumsCycle || '',
                    minsaProgram: staff.minsaProgram || 'NINGUNO',
                    workShift: staff.workShift || 'MAÑANA',
                    weeklyHours: staff.weeklyHours || (staff.profession === 'ADMINISTRATIVO' ? 40 : 36),
                    yearsExperience: staff.yearsExperience ? String(staff.yearsExperience) : '',
                    bio: staff.bio || '',
                    isAvailable: staff.isAvailable ?? true,
                })
            } else {
                form.reset({
                    firstName: '', lastName: '', dniNumber: '', email: '', phone: '', address: '', avatar: '',
                    specialtyId: '', specialization: '', licenseNumber: '', collegiateBody: '', collegiateStatus: 'HABILITADO', collegiateExpiresAt: '',
                    profession: '', specialtyArea: '', contractType: '', contractStartDate: '', contractEndDate: '', serumsCycle: '',
                    minsaProgram: 'NINGUNO', workShift: 'MAÑANA', weeklyHours: 36, yearsExperience: '', bio: '', isAvailable: true,
                })
            }
        }
    }, [open, staff, form])

    const handleScheduleChange = (index: number, field: 'enabled' | 'startTime' | 'endTime', value: any) => {
        const newItems = [...scheduleItems]
        newItems[index] = { ...newItems[index], [field]: value }
        setScheduleItems(newItems)
    }

    const applyTurnoManana = () => {
        setScheduleItems(Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            enabled: i >= 1 && i <= 6,
            startTime: '08:00',
            endTime: '14:00'
        })))
        form.setValue('workShift', 'MAÑANA')
        toast({ title: 'Turno Mañana Aplicado', description: 'Jornada asistencial 08:00-14:00 (6hrs)' })
    }

    const applyTurnoTarde = () => {
        setScheduleItems(Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            enabled: i >= 1 && i <= 6,
            startTime: '14:00',
            endTime: '20:00'
        })))
        form.setValue('workShift', 'TARDE')
        toast({ title: 'Turno Tarde Aplicado', description: 'Jornada asistencial 14:00-20:00 (6hrs)' })
    }

    const onSubmit = async (data: StaffFormData) => {
        try {
            // Validaciones extras de fechas CAS si amerita
            if (data.contractType === 'CAS' && data.contractStartDate && data.contractEndDate) {
                if (new Date(data.contractEndDate) <= new Date(data.contractStartDate)) {
                    toast({ title: 'Error cronológico', description: 'La fecha de fin CAS debe ser posterior al inicio', variant: 'destructive' })
                    return
                }
            }

            const payload = {
                ...data,
                yearsExperience: Number(data.yearsExperience) || 0,
                // Si la especialidad no fue seleccionada, pasamos nulo para el schema antiguo.
                specialtyId: data.specialtyId || undefined,
                // Manejar Fechas vacias
                contractStartDate: data.contractStartDate ? new Date(data.contractStartDate).toISOString() : undefined,
                contractEndDate: data.contractEndDate ? new Date(data.contractEndDate).toISOString() : undefined,
                collegiateExpiresAt: data.collegiateExpiresAt ? new Date(data.collegiateExpiresAt).toISOString() : undefined,
                schedules: scheduleItems.filter(s => s.enabled).map(s => ({
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    endTime: s.endTime
                }))
            }

            if (staff) {
                await healthStaffAPI.update(staff.id, payload)
                toast({ title: 'Éxito', description: 'Personal actualizado correctamente (Ley 23536)' })
            } else {
                await healthStaffAPI.create(payload)
                toast({ title: 'Éxito', description: 'Personal creado correctamente (Ley 23536)' })
            }
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Error al guardar personal', variant: 'destructive' })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{staff ? 'Editar Personal (RRHH)' : 'Nuevo Personal de Salud'}</DialogTitle>
                    <DialogDescription>
                        Ficha única de personal - Centro de Salud Jorge Chávez (Categoría I-4)
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                            {/* SECCIÓN DATOS PERSONALES Y CONTACTO */}
                            <div className="col-span-full border-b pb-2 mb-2">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase">IDENTIFICACIÓN Y DATOS PERSONALES</h3>
                            </div>

                            <FormField control={form.control} name="firstName" render={({ field }) => (
                                <FormItem><FormLabel>Nombres *</FormLabel><FormControl><Input placeholder="Nombres" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="lastName" render={({ field }) => (
                                <FormItem><FormLabel>Apellidos *</FormLabel><FormControl><Input placeholder="Apellidos" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="dniNumber" render={({ field }) => (
                                <FormItem><FormLabel>DNI *</FormLabel><FormControl><Input placeholder="DNI de 8 dígitos" maxLength={8} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Celular * (Formato PER)</FormLabel><FormControl><Input placeholder="9..." maxLength={9} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Correo (Opcional)</FormLabel><FormControl><Input type="email" placeholder="nombre@diresapuno.gob.pe" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input placeholder="Jr. Ancash S/N..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />

                            {/* SECCIÓN PROFESIONAL MINSA */}
                            <div className="col-span-full border-b pb-2 mt-4 mb-2">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase">DETALLES PROFESIONALES Y JORNADA</h3>
                            </div>

                            <FormField control={form.control} name="profession" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Profesión *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Profesiones I-4 MINSA" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="MEDICO_CIRUJANO">👨‍⚕️ Médico Cirujano</SelectItem>
                                            <SelectItem value="ENFERMERA">💉 Enfermero(a)</SelectItem>
                                            <SelectItem value="OBSTETRIZ">🤰 Obstetra</SelectItem>
                                            <SelectItem value="ODONTOLOGO">🦷 Odontólogo</SelectItem>
                                            <SelectItem value="PSICOLOGO">🧠 Psicólogo(a)</SelectItem>
                                            <SelectItem value="NUTRICIONISTA">🥗 Nutricionista</SelectItem>
                                            <SelectItem value="TECNOLOGO_MEDICO">🔬 Tecnólogo Médico</SelectItem>
                                            <SelectItem value="QUIMICO_FARMACEUTICO">💊 Químico Farmacéutico</SelectItem>
                                            <SelectItem value="TRABAJADOR_SOCIAL">🤝 Trabajador(a) Social</SelectItem>
                                            <SelectItem value="TECNICO_ENFERMERIA">🩺 Técnico(a) de Enfermería</SelectItem>
                                            <SelectItem value="TECNICO_FARMACIA">📦 Técnico(a) en Farmacia</SelectItem>
                                            <SelectItem value="ADMINISTRATIVO">💻 Personal Administrativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {isTecnologoMedico && (
                                <FormField control={form.control} name="specialtyArea" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Área de Especialidad CTM</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione Área..." /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="LABORATORIO_CLINICO">Laboratorio Clínico y Anatomía</SelectItem>
                                                <SelectItem value="TERAPIA_FISICA">Terapia Física y Rehabilitación</SelectItem>
                                                <SelectItem value="RADIOLOGIA">Radiología</SelectItem>
                                                <SelectItem value="TERAPIA_LENGUAJE">Terapia de Lenguaje</SelectItem>
                                                <SelectItem value="TERAPIA_OCUPACIONAL">Terapia Ocupacional</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            )}

                            {requiresColegiatura ? (
                                <>
                                    <FormField control={form.control} name="licenseNumber" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{collegiateBodyLabel.label} *</FormLabel>
                                            <FormControl><Input placeholder="Númerico" {...field} /></FormControl>
                                            <FormDescription>{collegiateBodyLabel.desc}</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="collegiateStatus" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado de Habilitación</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="HABILITADO">Habilitado</SelectItem>
                                                    <SelectItem value="INHABILITADO">Inhabilitado</SelectItem>
                                                    <SelectItem value="PENDIENTE">Aprobación Pendiente</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="collegiateExpiresAt" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vto. de Habilitación * (Renov. Anual)</FormLabel>
                                            <FormControl><Input type="date" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </>
                            ) : (
                                <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-slate-50 border p-3 rounded-lg text-sm text-slate-500 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" />
                                    Este tipo de personal no requiere colegiatura profesional para ejercer sus labores.
                                </div>
                            )}

                            {/* SECCIÓN CONTRATO */}
                            <div className="col-span-full border-b pb-2 mt-4 mb-2">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase">MODALIDAD DE CONTRATACIÓN</h3>
                            </div>

                            <FormField control={form.control} name="contractType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Contrato *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Tipo de régimen" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="CAS">CAS (DL 1057) - Temporal</SelectItem>
                                            <SelectItem value="NOMBRADO">NOMBRADO (DL 276) - Permanente</SelectItem>
                                            <SelectItem value="SERUMS">SERUMS (Ley 23330) - 1 Año</SelectItem>
                                            <SelectItem value="LOCACION">TERCEROS / LOCACIÓN DE SERVICIOS</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="contractStartDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha Inicio Contrato</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {watchContractType !== 'NOMBRADO' && (
                                <FormField control={form.control} name="contractEndDate" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha Fin Contrato {watchContractType === 'SERUMS' && '(Auto: 12 meses)'}</FormLabel>
                                        <FormControl>
                                            <Input type="date" disabled={watchContractType === 'SERUMS'} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            )}
                            {watchContractType === 'NOMBRADO' && (
                                <div className="flex items-center text-sm font-medium text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                                    Contrato Permanente (Sin Fecha de Término)
                                </div>
                            )}

                            {watchContractType === 'SERUMS' && (
                                <FormField control={form.control} name="serumsCycle" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ciclo SERUMS</FormLabel>
                                        <FormControl><Input placeholder="Ej: 2024-I" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            )}

                            {/* SECCIÓN PROGRAMA ESTRATÉGICO */}
                            <FormField control={form.control} name="minsaProgram" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Programa Estratégico MINSA (Opcional)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="NINGUNO">Sin Programa Específico</SelectItem>
                                            <SelectItem value="CRED">Control de Crecimiento (CRED)</SelectItem>
                                            <SelectItem value="PRENATAL">Atención Materna y Prenatal</SelectItem>
                                            <SelectItem value="TBC">TBC - VIH / SIDA</SelectItem>
                                            <SelectItem value="ANEMIA_DESNUTRICION">Prevención de Anemia</SelectItem>
                                            <SelectItem value="PLANIFICACION_FAMILIAR">Planificación Familiar</SelectItem>
                                            <SelectItem value="ADULTO_MAYOR">Salud Integral Adulto Mayor</SelectItem>
                                            <SelectItem value="INMUNIZACIONES">Inmunizaciones (ESNI)</SelectItem>
                                            <SelectItem value="SALUD_MENTAL">Programa de Salud Mental</SelectItem>
                                            <SelectItem value="ENT">Enfermedades No Transmisibles</SelectItem>
                                            <SelectItem value="SALUD_BUCAL">Salud Bucal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="weeklyHours" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Horas Semanales de Ley</FormLabel>
                                    <FormControl><Input type="number" readOnly {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                                    <FormDescription>{watchProfession === 'ADMINISTRATIVO' ? 'DL 800 (40 horas)' : 'Ley 23536 (36 horas o 150 mes)'}</FormDescription>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="isAvailable" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Disponibilidad Activa</FormLabel>
                                    </div>
                                    <FormControl>
                                        <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" />
                                    </FormControl>
                                </FormItem>
                            )}
                            />

                            {/* HORARIOS */}
                            <div className="col-span-full space-y-4 pt-4 border-t">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-slate-500 flex items-center gap-2 uppercase">
                                        <Clock className="h-4 w-4" /> Distribución de Jornada Laboral
                                    </h3>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={applyTurnoManana} className="text-xs">
                                            🌞 Turno Mañana (08-14)
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={applyTurnoTarde} className="text-xs">
                                            🌇 Turno Tarde (14-20)
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {scheduleItems.map((item, index) => (
                                        <div key={item.dayOfWeek} className={`flex flex-col gap-2 p-3 rounded-xl border ${item.enabled ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-semibold uppercase ${item.enabled ? 'text-blue-700' : 'text-slate-400'}`}>{DAYS[item.dayOfWeek]}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={item.enabled}
                                                    onChange={(e) => handleScheduleChange(index, 'enabled', e.target.checked)}
                                                    className="w-4 h-4 rounded text-blue-600"
                                                />
                                            </div>
                                            {item.enabled && (
                                                <div className="flex items-center gap-2 justify-between mt-1">
                                                    <Input type="time" value={item.startTime} onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)} className="w-[100px] h-8 text-xs bg-white" />
                                                    <span className="text-slate-400 text-xs">a</span>
                                                    <Input type="time" value={item.endTime} onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)} className="w-[100px] h-8 text-xs bg-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {staff ? 'Actualizar Ficha Laboral' : 'Registrar Nuevo Personal'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
