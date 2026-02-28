import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { Loader2, Upload, X, User, Clock } from 'lucide-react'

// Schema for staff form
const staffSchema = z.object({
    // User fields
    firstName: z.string().min(2, 'El nombre es requerido'),
    lastName: z.string().min(2, 'El apellido es requerido'),
    email: z.string().email('Correo electrónico inválido'),
    phone: z.string().min(10, 'El teléfono es requerido'),
    address: z.string().optional(),
    avatar: z.string().optional(),

    // Professional fields
    specialtyId: z.string().min(1, 'La especialidad es requerida'),
    specialization: z.string().optional(),
    licenseNumber: z.string().min(5, 'El número de licencia es requerido'),
    contractType: z.string().optional(),
    profession: z.string().optional(),
    minsaProgram: z.string().optional(),
    consultationFee: z.string().refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
        message: 'La tarifa debe ser un número positivo',
    }).optional(),
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
    const [loadingSpecialties, setLoadingSpecialties] = useState(false)

    const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

    const form = useForm<StaffFormData>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            avatar: '',
            specialtyId: '',
            specialization: '',
            licenseNumber: '',
            contractType: '',
            profession: '',
            minsaProgram: '',
            consultationFee: '',
            yearsExperience: '',
            bio: '',
            isAvailable: true,
        },
    })

    // Reset/Populate form when opening/closing or changing staff
    useEffect(() => {
        if (open) {
            // Initialize Schedule State
            if (staff?.schedules && staff.schedules.length > 0) {
                const items = Array.from({ length: 7 }, (_, i) => {
                    const existing = staff.schedules.find((s: any) => s.dayOfWeek === i)
                    return {
                        dayOfWeek: i,
                        enabled: !!existing,
                        startTime: existing?.startTime || '08:00',
                        endTime: existing?.endTime || '17:00'
                    }
                })
                setScheduleItems(items)
            } else {
                // Default: Mon-Fri 8-5
                setScheduleItems(Array.from({ length: 7 }, (_, i) => ({
                    dayOfWeek: i,
                    enabled: i >= 1 && i <= 5,
                    startTime: '08:00',
                    endTime: '17:00'
                })))
            }

            // Fetch Specialties
            const fetchSpecialties = async () => {
                try {
                    setLoadingSpecialties(true)
                    const res = await healthStaffAPI.getSpecialties()
                    setSpecialties(res.data || [])
                } catch (error) {
                    console.error('Error fetching specialties:', error)
                } finally {
                    setLoadingSpecialties(false)
                }
            }
            fetchSpecialties()

            if (staff) {
                form.reset({
                    firstName: staff.user?.firstName || '',
                    lastName: staff.user?.lastName || '',
                    email: staff.user?.email || '',
                    phone: staff.user?.phone || '',
                    address: staff.user?.address || '',
                    avatar: staff.user?.avatar || '',
                    specialtyId: staff.specialtyId || '',
                    specialization: staff.specialization || '',
                    licenseNumber: staff.licenseNumber || '',
                    contractType: staff.contractType || '',
                    profession: staff.profession || '',
                    minsaProgram: staff.minsaProgram || '',
                    consultationFee: staff.consultationFee ? String(staff.consultationFee) : '',
                    yearsExperience: staff.yearsExperience ? String(staff.yearsExperience) : '',
                    bio: staff.bio || '',
                    isAvailable: staff.isAvailable ?? true,
                })
            } else {
                form.reset({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    address: '',
                    avatar: '',
                    specialtyId: '',
                    specialization: '',
                    licenseNumber: '',
                    contractType: '',
                    profession: '',
                    minsaProgram: '',
                    consultationFee: '',
                    yearsExperience: '',
                    bio: '',
                    isAvailable: true,
                })
            }
        }
    }, [open, staff, form])

    const handleScheduleChange = (index: number, field: 'enabled' | 'startTime' | 'endTime', value: any) => {
        const newItems = [...scheduleItems]
        newItems[index] = { ...newItems[index], [field]: value }
        setScheduleItems(newItems)
    }

    const applyStandardSchedule = () => {
        setScheduleItems(Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            enabled: i >= 1 && i <= 5,
            startTime: '08:00',
            endTime: '17:00'
        })))
        toast({ title: 'Horario Aplicado', description: 'Se ha restablecido al horario de oficina estándar (Lun-Vie 8-5).' })
    }

    const onSubmit = async (data: StaffFormData) => {
        try {
            const payload = {
                ...data,
                consultationFee: Number(data.consultationFee),
                yearsExperience: Number(data.yearsExperience),
                schedules: scheduleItems.filter(s => s.enabled).map(s => ({
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    endTime: s.endTime
                }))
            }

            if (staff) {
                await healthStaffAPI.update(staff.id, payload)
                toast({
                    title: 'Éxito',
                    description: 'Personal de Salud actualizado correctamente',
                })
            } else {
                await healthStaffAPI.create(payload)
                toast({
                    title: 'Éxito',
                    description: 'Personal de Salud creado correctamente',
                })
            }
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{staff ? 'Editar Personal de Salud' : 'Agregar Nuevo Personal de Salud'}</DialogTitle>
                    <DialogDescription>
                        {staff
                            ? 'Actualizar información y configuración del personal.'
                            : 'Crear un nuevo perfil de personal de salud. También se creará una cuenta de usuario.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Personal Information */}
                            <div className="md:col-span-2">
                                <h3 className="text-lg font-medium mb-2">Información Personal</h3>
                            </div>

                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Juan" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Apellido</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Pérez" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Correo Electrónico</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="staff@edicarex.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="999 999 999" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Dirección</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Jr. Ancash S/N" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="avatar"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Foto (Opcional)</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-4">
                                                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                                                    {field.value ? (
                                                        <img src={field.value} alt="Preview" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <User className="h-10 w-10 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        id="staff-photo-upload"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                const reader = new FileReader()
                                                                reader.onloadend = () => field.onChange(reader.result as string)
                                                                reader.readAsDataURL(file)
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor="staff-photo-upload" className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                                                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                                        <p className="text-xs text-slate-500">Subir foto</p>
                                                    </label>
                                                </div>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {/* Professional Information */}
                            <div className="md:col-span-2 mt-4">
                                <h3 className="text-lg font-medium mb-2">Detalles Profesionales</h3>
                            </div>

                            <FormField
                                control={form.control}
                                name="specialtyId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Especialidad</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar especialidad" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {specialties.map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="licenseNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Licencia / CMP</FormLabel>
                                        <FormControl>
                                            <Input placeholder="123456" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="yearsExperience"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Años de Experiencia</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="profession"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Profesión / Ocupación</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar profesión" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Médico Cirujano">Médico Cirujano</SelectItem>
                                                <SelectItem value="Enfermero(a)">Licenciado(a) en Enfermería</SelectItem>
                                                <SelectItem value="Obstetra">Obstetra</SelectItem>
                                                <SelectItem value="Cirujano Dentista">Cirujano Dentista</SelectItem>
                                                <SelectItem value="Psicólogo(a)">Psicólogo(a)</SelectItem>
                                                <SelectItem value="Nutricionista">Nutricionista</SelectItem>
                                                <SelectItem value="Asistenta Social">Asistenta Social</SelectItem>
                                                <SelectItem value="Biólogo(a)">Biólogo(a)</SelectItem>
                                                <SelectItem value="Químico Farmacéutico">Químico Farmacéutico</SelectItem>
                                                <SelectItem value="Técnico(a) Enfermería">Técnico(a) en Enfermería</SelectItem>
                                                <SelectItem value="Técnico(a) Laboratorio">Técnico(a) en Laboratorio</SelectItem>
                                                <SelectItem value="Técnico(a) Farmacia">Técnico(a) en Farmacia</SelectItem>
                                                <SelectItem value="Estadístico(a)">Estadístico(a) / Admisión</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="contractType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modalidad de Contrato</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tipo de contrato" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Nombrado">Nombrado (D.L. 276)</SelectItem>
                                                <SelectItem value="CAS Regular">CAS Regular</SelectItem>
                                                <SelectItem value="CAS Confianza">CAS Confianza</SelectItem>
                                                <SelectItem value="Terceros">Terceros / Locación</SelectItem>
                                                <SelectItem value="SERUMS">SERUMS</SelectItem>
                                                <SelectItem value="Internado">Internado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="minsaProgram"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Programa Estratégico MINSA Asignado (Opcional)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sin asignar o coordinador general" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ninguno">Ninguno</SelectItem>
                                                <SelectItem value="P.E. Articulado Nutricional">P.E. Articulado Nutricional (PAN)</SelectItem>
                                                <SelectItem value="Salud Materno Neonatal">Salud Materno Neonatal</SelectItem>
                                                <SelectItem value="Prevención de Cáncer">Prevención de Cáncer</SelectItem>
                                                <SelectItem value="Enfermedades Metaxénicas y Zoonosis">Enfermedades Metaxénicas y Zoonosis</SelectItem>
                                                <SelectItem value="TBC-VIH/SIDA">Prevención de TBC-VIH/SIDA</SelectItem>
                                                <SelectItem value="Salud Mental">Salud Mental</SelectItem>
                                                <SelectItem value="Enfermedades No Transmisibles">Enfermedades No Transmisibles</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="consultationFee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tarifa de Consulta Privada (Opcional S/.)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isAvailable"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm md:col-span-2">
                                        <div className="space-y-0.5">
                                            <FormLabel>Disponibilidad</FormLabel>
                                            <DialogDescription>¿Está activo para recibir citas?</DialogDescription>
                                        </div>
                                        <FormControl>
                                            <input
                                                type="checkbox"
                                                checked={field.value}
                                                onChange={field.onChange}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Biografía / Resumen</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Breve descripción..." className="resize-none" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Schedules Section */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-indigo-500" />
                                    Horario de Atención
                                </h3>
                                <Button type="button" variant="ghost" size="sm" onClick={applyStandardSchedule} className="text-xs text-indigo-600">
                                    Aplicar Estándar (L-V 8-1)
                                </Button>
                            </div>

                            <div className="grid gap-3 bg-slate-50 p-4 rounded-xl border">
                                {scheduleItems.map((item, index) => (
                                    <div key={item.dayOfWeek} className="flex items-center gap-4 p-2 rounded-lg bg-white border">
                                        <div className="w-28 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={item.enabled}
                                                onChange={(e) => handleScheduleChange(index, 'enabled', e.target.checked)}
                                            />
                                            <span className="text-sm font-medium">{DAYS[item.dayOfWeek]}</span>
                                        </div>
                                        {item.enabled && (
                                            <div className="flex items-center gap-2 flex-1">
                                                <Input
                                                    type="time"
                                                    value={item.startTime}
                                                    onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                                                    className="w-28 h-8 text-xs"
                                                />
                                                <span className="text-slate-400">-</span>
                                                <Input
                                                    type="time"
                                                    value={item.endTime}
                                                    onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                                                    className="w-28 h-8 text-xs"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {staff ? 'Guardar Cambios' : 'Crear Personal'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
