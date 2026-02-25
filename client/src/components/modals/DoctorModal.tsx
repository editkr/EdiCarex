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
import { doctorsAPI } from '@/services/api'
import { Loader2, Upload, X, User, Clock, Check } from 'lucide-react'

// Schema for doctor form
const doctorSchema = z.object({
    // User fields
    firstName: z.string().min(2, 'El nombre es requerido'),
    lastName: z.string().min(2, 'El apellido es requerido'),
    email: z.string().email('Correo electrónico inválido'),
    phone: z.string().min(10, 'El teléfono es requerido'),
    address: z.string().optional(),
    avatar: z.string().optional(),

    // Doctor fields
    specialtyId: z.string().min(1, 'La especialidad es requerida'),
    specialization: z.string().optional(),
    licenseNumber: z.string().min(5, 'El número de licencia es requerido'),
    consultationFee: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: 'La tarifa debe ser un número positivo',
    }),
    yearsExperience: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: 'La experiencia debe ser un número positivo',
    }),
    bio: z.string().optional(),
    isAvailable: z.boolean().default(true),
    schedules: z.array(z.any()).optional(),
})

type DoctorFormData = z.infer<typeof doctorSchema>

interface DoctorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    doctor?: any // If provided, we are editing
    onSuccess: () => void
}

export default function DoctorModal({
    open,
    onOpenChange,
    doctor,
    onSuccess,
}: DoctorModalProps) {
    const { toast } = useToast()
    const [scheduleItems, setScheduleItems] = useState<{ dayOfWeek: number; enabled: boolean; startTime: string; endTime: string }[]>([])
    const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([])
    const [loadingSpecialties, setLoadingSpecialties] = useState(false)

    const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

    const form = useForm<DoctorFormData>({
        resolver: zodResolver(doctorSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            avatar: '',
            specialization: '',
            licenseNumber: '',
            consultationFee: '',
            yearsExperience: '',
            bio: '',
            isAvailable: true,
        },
    })

    // Reset/Populate form when opening/closing or changing doctor
    useEffect(() => {
        if (open) {
            // Initialize Schedule State
            if (doctor?.schedules && doctor.schedules.length > 0) {
                const items = Array.from({ length: 7 }, (_, i) => {
                    const existing = doctor.schedules.find((s: any) => s.dayOfWeek === i)
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
                    const res = await doctorsAPI.getSpecialties()
                    setSpecialties(res.data || [])
                } catch (error) {
                    console.error('Error fetching specialties:', error)
                } finally {
                    setLoadingSpecialties(false)
                }
            }
            fetchSpecialties()

            if (doctor) {
                form.reset({
                    firstName: doctor.user?.firstName || '',
                    lastName: doctor.user?.lastName || '',
                    email: doctor.user?.email || '',
                    phone: doctor.user?.phone || '',
                    address: doctor.user?.address || '',
                    avatar: doctor.user?.avatar || '',
                    specialtyId: doctor.specialtyId || '',
                    specialization: doctor.specialization || '',
                    licenseNumber: doctor.licenseNumber || '',
                    consultationFee: doctor.consultationFee ? String(doctor.consultationFee) : '',
                    yearsExperience: doctor.yearsExperience ? String(doctor.yearsExperience) : '',
                    bio: doctor.bio || '',
                    isAvailable: doctor.isAvailable ?? true,
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
                    consultationFee: '',
                    yearsExperience: '',
                    bio: '',
                    isAvailable: true,
                })
            }
        }
    }, [open, doctor, form])

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

    const onSubmit = async (data: DoctorFormData) => {
        try {
            // Convert types for API
            // Convert types for API
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

            if (doctor) {
                await doctorsAPI.update(doctor.id, payload)
                toast({
                    title: 'Éxito',
                    description: 'Doctor actualizado correctamente',
                })
            } else {
                await doctorsAPI.create(payload)
                toast({
                    title: 'Éxito',
                    description: 'Doctor creado correctamente',
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
                    <DialogTitle>{doctor ? 'Editar Doctor' : 'Agregar Nuevo Doctor'}</DialogTitle>
                    <DialogDescription>
                        {doctor
                            ? 'Actualizar información y configuración del doctor.'
                            : 'Crear un nuevo perfil de doctor. También se creará una cuenta de usuario.'}
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
                                            <Input type="email" placeholder="doctor@edicarex.com" {...field} />
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
                                            <Input placeholder="+1 234 567 890" {...field} />
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
                                            <Input placeholder="Av. Principal 123, Oficina 301" {...field} />
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
                                        <FormLabel>Foto del Doctor (Opcional)</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-4">
                                                {/* Preview */}
                                                <div className="relative group shrink-0">
                                                    <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                                                        {field.value ? (
                                                            <img
                                                                src={field.value}
                                                                alt="Preview"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="h-10 w-10 text-slate-400" />
                                                        )}
                                                    </div>
                                                    {field.value && (
                                                        <button
                                                            type="button"
                                                            onClick={() => field.onChange('')}
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Eliminar foto"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Upload Button */}
                                                <div className="flex-1">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        id="doctor-photo-upload"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                if (file.size > 5 * 1024 * 1024) {
                                                                    toast({
                                                                        title: "Error",
                                                                        description: "La imagen es demasiado grande (máx 5MB)",
                                                                        variant: "destructive"
                                                                    })
                                                                    return
                                                                }
                                                                const reader = new FileReader()
                                                                reader.onloadend = () => {
                                                                    field.onChange(reader.result as string)
                                                                }
                                                                reader.readAsDataURL(file)
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor="doctor-photo-upload"
                                                        className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                                                    >
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <Upload className="w-6 h-6 text-slate-400 mb-1" />
                                                            <p className="text-xs text-slate-500">
                                                                <span className="font-semibold">Clic para subir foto</span>
                                                            </p>
                                                            <p className="text-[10px] text-slate-400">PNG, JPG (MAX. 5MB)</p>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
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
                                        <Select
                                            disabled={loadingSpecialties}
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={loadingSpecialties ? "Cargando..." : "Seleccionar especialidad"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {specialties.map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>
                                                        {// Translation for labels if needed or just display as is
                                                            s.name
                                                        }
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
                                name="licenseNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Licencia</FormLabel>
                                        <FormControl>
                                            <Input placeholder="MD-12345" {...field} />
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
                                            <Input type="number" placeholder="5" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="consultationFee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tarifa de Consulta ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="150.00" {...field} />
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
                                            <DialogDescription>
                                                Mostrar al doctor como disponible para nuevas citas.
                                            </DialogDescription>
                                        </div>
                                        <FormControl>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-900">
                                                    {field.value ? 'Disponible' : 'No Disponible'}
                                                </span>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Biografía</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Breve trayectoria profesional..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Schedules Section */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium mb-1 flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-indigo-500" />
                                        Horario de Consulta
                                    </h3>
                                    <p className="text-sm text-slate-500">Define los días y horas de consulta médica.</p>
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={applyStandardSchedule} className="text-xs text-indigo-600 hover:bg-indigo-50">
                                    Aplicar Estándar (L-V 8-5)
                                </Button>
                            </div>

                            <div className="grid gap-3 bg-slate-50 p-4 rounded-xl border">
                                {scheduleItems.map((item, index) => (
                                    <div key={item.dayOfWeek} className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${item.enabled ? 'bg-white shadow-sm border-l-4 border-l-indigo-500' : 'opacity-60'}`}>
                                        <div className="w-28 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={item.enabled}
                                                onChange={(e) => handleScheduleChange(index, 'enabled', e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className={`text-sm font-medium ${item.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {DAYS[item.dayOfWeek]}
                                            </span>
                                        </div>

                                        {item.enabled ? (
                                            <div className="flex items-center gap-2 flex-1 animate-in fade-in duration-300">
                                                <div className="relative">
                                                    <Input
                                                        type="time"
                                                        value={item.startTime}
                                                        onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                                                        className="w-28 h-8 text-xs font-mono"
                                                    />
                                                </div>
                                                <span className="text-slate-400 text-xs">-</span>
                                                <div className="relative">
                                                    <Input
                                                        type="time"
                                                        value={item.endTime}
                                                        onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                                                        className="w-28 h-8 text-xs font-mono"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 text-xs text-slate-400 italic">No laborable</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {doctor ? 'Guardar Cambios' : 'Crear Doctor'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
